"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { refundOrder } from "@/lib/payments";

export type RefundState = { ok?: boolean; error?: string };

const refundSchema = z.object({
  orderId: z.uuid(),
  revokeAccess: z.boolean(),
  reason: z.string().trim().max(500),
});

/**
 * Records a refund made outside the app (or already issued in Stripe). This only updates our records —
 * issue the actual refund in your Stripe dashboard.
 */
export async function markOrderRefundedAction(_prev: RefundState, formData: FormData): Promise<RefundState> {
  await assertAdmin();
  const parsed = refundSchema.safeParse({
    orderId: formData.get("orderId"),
    revokeAccess: formData.get("revokeAccess") === "on",
    reason: String(formData.get("reason") ?? ""),
  });
  if (!parsed.success) return { error: "Invalid request." };
  const { orderId, revokeAccess, reason } = parsed.data;
  const changed = await refundOrder(orderId, { revokeAccess, reason: reason || "Marked refunded by admin", source: "manual" });
  revalidatePath("/admin/orders");
  if (!changed) return { error: "Only paid orders can be marked as refunded." };
  return { ok: true };
}
