"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { finalizeConfirmedBooking, releaseHold, reserveSlot } from "@/lib/booking-service";
import { captureLead, upsertContact } from "@/lib/crm";
import { createCheckout } from "@/lib/payments";
import { rateLimitByIp } from "@/lib/rate-limit";
import { describeTime, getActiveMeetingType, getBusinessTimezone, isSlotAvailable, isValidTimezone } from "@/lib/scheduling";
import { getVisitorContext } from "@/lib/tracking";
import { isValidEmail, normalizeEmail } from "@/lib/utils";

export type BookingFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** The chosen time is no longer available — the UI sends the visitor back to the picker. */
  slotTaken?: boolean;
};

const BookingInput = z.object({
  type: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
  start: z.iso.datetime({ offset: true, message: "Please choose a time." }),
  timezone: z.string().trim().max(64).refine(isValidTimezone, "Please choose a valid timezone."),
  name: z.string().trim().min(2, "Please enter your name.").max(120, "That name is a little long."),
  email: z
    .string()
    .trim()
    .max(254)
    .refine(isValidEmail, "Please enter a valid email address.")
    .transform(normalizeEmail),
  phone: z
    .string()
    .trim()
    .max(40, "That phone number is too long.")
    .regex(/^[+()\d\s.\-x]*$/i, "Please use digits, spaces and + ( ) - only."),
  notes: z.string().trim().max(2000, "Please keep notes under 2,000 characters."),
  /** Honeypot: real visitors never see or fill this field. */
  website: z.string().max(0),
});

const SLOT_TAKEN: BookingFormState = {
  error: "Sorry, that time was just booked by someone else. Please choose another time.",
  slotTaken: true,
};

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

/**
 * Books a meeting. Free meetings are confirmed immediately (→ /book/confirmed/<token>);
 * paid meetings hold the slot for 30 minutes and redirect to checkout.
 */
export async function createBookingAction(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const parsed = BookingInput.safeParse({
    type: text(formData, "type"),
    start: text(formData, "start"),
    timezone: text(formData, "timezone"),
    name: text(formData, "name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    notes: text(formData, "notes"),
    website: text(formData, "website"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (key === "website") return { error: "We couldn't complete your booking. Please try again." };
      fieldErrors[key] ??= issue.message;
    }
    const general = fieldErrors.start ?? fieldErrors.timezone ?? fieldErrors.type;
    return { error: general ?? "Please check the highlighted fields.", fieldErrors };
  }
  const input = parsed.data;

  const limit = await rateLimitByIp("booking-create", 6, 10 * 60);
  if (!limit.ok) return { error: "Too many booking attempts from your network. Please wait a few minutes and try again." };

  const meetingType = await getActiveMeetingType(input.type);
  if (!meetingType) return { error: "This meeting type is no longer available. Please choose another from the booking page." };

  const answers: Record<string, string> = {};
  const fieldErrors: Record<string, string> = {};
  for (const q of meetingType.questions) {
    const value = text(formData, `q_${q.id}`).trim().slice(0, 2000);
    if (value) answers[q.id] = value;
    else if (q.required) fieldErrors[`q_${q.id}`] = "Please answer this question.";
  }
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };

  const start = new Date(input.start);
  if (!(await isSlotAvailable(meetingType, start))) return SLOT_TAKEN;

  const visitor = await getVisitorContext().catch(() => null);
  const { contact } = await upsertContact({
    email: input.email,
    name: input.name,
    phone: input.phone || null,
    source: "booking",
    visitor,
  });

  const paid = meetingType.priceCents > 0;
  const booking = await reserveSlot({
    meetingType,
    contactId: contact.id,
    start,
    timezone: input.timezone,
    answers,
    notes: input.notes || null,
    paid,
  });
  if (!booking) return SLOT_TAKEN;

  if (!paid) {
    await finalizeConfirmedBooking({ booking, meetingType, contact }, { paid: false });
    redirect(`/book/confirmed/${booking.manageToken}`);
  }

  // Paid session: record intent, then send the invitee to checkout while the slot is held.
  try {
    const when = describeTime(booking.startAt, booking.endAt, await getBusinessTimezone());
    await captureLead({
      email: input.email,
      name: input.name,
      phone: input.phone || null,
      source: "booking",
      activity: {
        type: "booking_created",
        title: `Started booking ${meetingType.name} for ${when.shortDateLabel} at ${when.startTimeLabel} ${when.zoneAbbr} (awaiting payment)`,
        meta: { bookingId: booking.id, answers, meetingType: meetingType.slug, awaitingPayment: true },
      },
      stage: "engaged",
    });
  } catch (err) {
    console.error("[booking] CRM capture failed for paid booking", booking.id, err);
  }

  let checkoutUrl: string;
  try {
    ({ url: checkoutUrl } = await createCheckout({ itemType: "booking", bookingId: booking.id, email: input.email, name: input.name }));
  } catch (err) {
    console.error("[booking] checkout could not be created", booking.id, err);
    await releaseHold(booking.id);
    return {
      error:
        "We couldn't start the payment step just now, so this time hasn't been reserved. Please try again in a few minutes, or book a free strategy call instead.",
    };
  }
  redirect(checkoutUrl);
}
