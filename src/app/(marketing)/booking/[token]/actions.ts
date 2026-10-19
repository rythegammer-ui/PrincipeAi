"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  cancelBooking,
  CHANGED_BEFORE_PAYING_REASON,
  getBookingDetails,
  isHoldExpired,
  prepareCheckoutRetry,
  rescheduleBooking,
  type CheckoutRetry,
} from "@/lib/booking-service";
import { site } from "@/config/site";
import { CheckoutError, checkoutMode, createCheckout } from "@/lib/payments";
import { rateLimitByIp } from "@/lib/rate-limit";
import { isValidTimezone } from "@/lib/scheduling";

export type ManageBookingState = { error?: string; slotTaken?: boolean };

const token = z.string().regex(/^[0-9a-f]{32}$/i, "Invalid booking link.");

const CancelInput = z.object({
  token,
  reason: z.string().trim().max(1000, "Please keep the reason under 1,000 characters."),
});

const TokenInput = z.object({ token });

const RescheduleInput = z.object({
  token,
  start: z.iso.datetime({ offset: true, error: "Please choose a new time." }),
  timezone: z.string().trim().max(64).refine(isValidTimezone, "Please choose a valid timezone."),
});

const str = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
};

async function limited(): Promise<boolean> {
  const limit = await rateLimitByIp("booking-manage", 10, 10 * 60);
  return !limit.ok;
}

export async function cancelBookingAction(_prev: ManageBookingState, formData: FormData): Promise<ManageBookingState> {
  const parsed = CancelInput.safeParse({ token: str(formData, "token"), reason: str(formData, "reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Something went wrong." };
  if (await limited()) return { error: "Too many changes from your network. Please wait a few minutes and try again." };

  const details = await getBookingDetails({ token: parsed.data.token });
  if (!details) return { error: "We couldn't find that booking." };
  const result = await cancelBooking(details.booking.id, { reason: parsed.data.reason || null, by: "invitee" });
  if (!result.ok) return { error: result.error };

  revalidatePath(`/booking/${parsed.data.token}`);
  redirect(`/booking/${parsed.data.token}?updated=cancelled`);
}

export async function rescheduleBookingAction(_prev: ManageBookingState, formData: FormData): Promise<ManageBookingState> {
  const parsed = RescheduleInput.safeParse({
    token: str(formData, "token"),
    start: str(formData, "start"),
    timezone: str(formData, "timezone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Something went wrong." };
  if (await limited()) return { error: "Too many changes from your network. Please wait a few minutes and try again." };

  const details = await getBookingDetails({ token: parsed.data.token });
  if (!details) return { error: "We couldn't find that booking." };
  const result = await rescheduleBooking(details.booking.id, new Date(parsed.data.start), { timezone: parsed.data.timezone, by: "invitee" });
  if (!result.ok) return { error: result.error, slotTaken: result.slotTaken };

  revalidatePath(`/booking/${parsed.data.token}`);
  redirect(`/booking/${parsed.data.token}?updated=rescheduled`);
}

const HOLD_LAPSED = "The hold on this time has expired, so it's been released. Please choose a new time.";
const PAYMENT_PROCESSING = "Your payment is still processing, so there's nothing more to pay. We'll email you as soon as it clears.";
const CHECKOUT_UNAVAILABLE = "We couldn't start the payment step just now. Please try again in a few minutes.";
const PAYMENTS_OFF = `Online payment isn't available right now. Please email ${site.contactEmail} and we'll arrange your session with you directly.`;

/**
 * Sends the invitee back to checkout for a booking whose payment hold is still live (they left
 * Stripe Checkout or the test checkout without paying). Closes the earlier checkout first, and never
 * starts a new one while an earlier payment has gone through or is still clearing.
 */
export async function resumeCheckoutAction(_prev: ManageBookingState, formData: FormData): Promise<ManageBookingState> {
  const parsed = TokenInput.safeParse({ token: str(formData, "token") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Something went wrong." };
  const limit = await rateLimitByIp("booking-checkout", 10, 10 * 60);
  if (!limit.ok) return { error: "Too many attempts from your network. Please wait a few minutes and try again." };

  const details = await getBookingDetails({ token: parsed.data.token });
  if (!details) return { error: "We couldn't find that booking." };
  const { booking, contact } = details;
  if (booking.status === "confirmed") return { error: "This booking is already paid for and confirmed. Refresh the page to see the details." };
  if (booking.status !== "pending_payment") return { error: "This booking is no longer awaiting payment. Refresh the page to see its status." };
  if (isHoldExpired(booking)) return { error: HOLD_LAPSED };
  // Retrying can never succeed while there's no way to pay, so don't suggest it.
  if (checkoutMode() === "disabled") return { error: PAYMENTS_OFF };

  let retry: CheckoutRetry;
  try {
    retry = await prepareCheckoutRetry(booking.id);
  } catch (err) {
    console.error("[booking] earlier checkout could not be closed", booking.id, err);
    return { error: CHECKOUT_UNAVAILABLE };
  }
  if (retry === "lapsed") return { error: HOLD_LAPSED };
  if (retry === "processing") return { error: PAYMENT_PROCESSING };
  if (retry === "paid") {
    // The earlier payment had gone through after all (its confirmation was still on its way).
    revalidatePath(`/booking/${parsed.data.token}`);
    redirect(`/book/confirmed/${parsed.data.token}`);
  }

  let url: string;
  try {
    ({ url } = await createCheckout({ itemType: "booking", bookingId: booking.id, email: contact.email, name: contact.name }));
  } catch (err) {
    if (err instanceof CheckoutError) return { error: err.message };
    console.error("[booking] checkout could not be restarted", booking.id, err);
    return { error: CHECKOUT_UNAVAILABLE };
  }
  redirect(url);
}

/**
 * Releases the invitee's own unpaid hold and sends them back to the booking page, so the time they
 * held is offered again and they don't end up holding two slots.
 */
export async function changeHeldTimeAction(_prev: ManageBookingState, formData: FormData): Promise<ManageBookingState> {
  const parsed = TokenInput.safeParse({ token: str(formData, "token") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Something went wrong." };
  if (await limited()) return { error: "Too many changes from your network. Please wait a few minutes and try again." };

  const details = await getBookingDetails({ token: parsed.data.token });
  if (!details) return { error: "We couldn't find that booking." };
  const { booking, meetingType } = details;
  if (booking.status !== "pending_payment") return { error: "This booking is no longer awaiting payment. Refresh the page to see its status." };
  if (!isHoldExpired(booking)) {
    const result = await cancelBooking(booking.id, { reason: CHANGED_BEFORE_PAYING_REASON, by: "invitee" });
    if (!result.ok) return { error: result.error };
  }

  revalidatePath(`/booking/${parsed.data.token}`);
  redirect(meetingType.active ? `/book/${meetingType.slug}` : "/book");
}

/** The pending-payment form has two submit buttons: "Complete payment" (intent=pay) and "Choose a different time" (intent=change). */
export async function pendingPaymentAction(prev: ManageBookingState, formData: FormData): Promise<ManageBookingState> {
  return str(formData, "intent") === "change" ? changeHeldTimeAction(prev, formData) : resumeCheckoutAction(prev, formData);
}
