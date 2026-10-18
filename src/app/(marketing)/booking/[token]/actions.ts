"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cancelBooking, getBookingDetails, rescheduleBooking } from "@/lib/booking-service";
import { rateLimitByIp } from "@/lib/rate-limit";
import { isValidTimezone } from "@/lib/scheduling";

export type ManageBookingState = { error?: string; slotTaken?: boolean };

const token = z.string().regex(/^[0-9a-f]{32}$/i, "Invalid booking link.");

const CancelInput = z.object({
  token,
  reason: z.string().trim().max(1000, "Please keep the reason under 1,000 characters."),
});

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
