"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { cancelBooking, setBookingOutcome } from "@/lib/booking-service";

export type AdminBookingState = { error?: string; ok?: boolean };

const OutcomeInput = z.object({ id: z.uuid(), outcome: z.enum(["completed", "no_show"]) });
const CancelInput = z.object({
  id: z.uuid(),
  reason: z.string().trim().max(1000, "Keep the reason under 1,000 characters."),
  notify: z.boolean(),
});

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};

function revalidate() {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function markBookingOutcomeAction(_prev: AdminBookingState, formData: FormData): Promise<AdminBookingState> {
  await assertAdmin();
  const parsed = OutcomeInput.safeParse({ id: str(formData, "id"), outcome: str(formData, "outcome") });
  if (!parsed.success) return { error: "Invalid request." };
  const result = await setBookingOutcome(parsed.data.id, parsed.data.outcome);
  if (!result.ok) return { error: result.error };
  revalidate();
  return { ok: true };
}

export async function adminCancelBookingAction(_prev: AdminBookingState, formData: FormData): Promise<AdminBookingState> {
  await assertAdmin();
  const parsed = CancelInput.safeParse({ id: str(formData, "id"), reason: str(formData, "reason"), notify: formData.get("notify") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  const result = await cancelBooking(parsed.data.id, { reason: parsed.data.reason || null, by: "admin", notifyInvitee: parsed.data.notify });
  if (!result.ok) return { error: result.error };
  revalidate();
  return { ok: true };
}
