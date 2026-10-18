"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { startStudentSession, upsertStudent } from "@/lib/auth";
import { isEnrolled } from "@/lib/courses";
import { logActivity } from "@/lib/crm";
import { testCheckoutAllowed } from "@/lib/integrations";
import { bookingHoldExpired, fulfillOrder, getOrderDetails, newTestSessionId, withinClaimWindow } from "@/lib/payments";
import { rateLimitByIp } from "@/lib/rate-limit";

export type CheckoutActionState = { error?: string };

const orderSchema = z.object({ orderId: z.uuid() });
const claimSchema = z.object({ orderId: z.uuid(), sessionId: z.string().min(8).max(255) });

/** Built-in test checkout (no Stripe keys): marks the order paid, delivers it and signs the buyer in. */
export async function completeTestPurchaseAction(_prev: CheckoutActionState, formData: FormData): Promise<CheckoutActionState> {
  if (!testCheckoutAllowed()) return { error: "Test checkout is turned off on this site." };
  const parsed = orderSchema.safeParse({ orderId: formData.get("orderId") });
  if (!parsed.success) return { error: "This checkout link is invalid." };
  const limit = await rateLimitByIp("test-checkout", 20, 10 * 60);
  if (!limit.ok) return { error: "Too many attempts. Please wait a few minutes and try again." };

  const { orderId } = parsed.data;
  const details = await getOrderDetails(orderId);
  if (!details) return { error: "We couldn't find this order." };
  const { order, booking } = details;
  if (order.status === "paid") redirect(`/checkout/success?order=${order.id}`);
  if (order.status !== "pending") return { error: "This checkout has expired. Please start again." };
  if (order.itemType === "booking" && bookingHoldExpired(booking)) {
    return { error: "The hold on this time slot has expired. Please pick a new time." };
  }

  // The proof-of-purchase token plays the role of a Stripe Checkout session id.
  const sessionId = newTestSessionId();
  const db = await getDb();
  const [claimed] = await db
    .update(schema.orders)
    .set({ isTest: true, stripeSessionId: sessionId })
    .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "pending"), isNull(schema.orders.stripeSessionId)))
    .returning({ id: schema.orders.id });
  if (!claimed) redirect(`/checkout/success?order=${order.id}`);

  try {
    await fulfillOrder(order.id, { isTest: true });
  } catch (err) {
    console.error("[checkout] test purchase fulfilment failed", err);
    await db.update(schema.orders).set({ stripeSessionId: null }).where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "pending")));
    return { error: "We couldn't complete this purchase. Please try again." };
  }

  // Same browser just paid → sign them straight in to their new course.
  if (order.itemType === "course") {
    const user = await upsertStudent(order.email, order.name);
    await startStudentSession(user);
  }
  redirect(`/checkout/success?order=${order.id}&session_id=${encodeURIComponent(sessionId)}`);
}

/** "Start learning" on the success page: the checkout session id in the URL proves the purchase. */
export async function claimCourseAccessAction(_prev: CheckoutActionState, formData: FormData): Promise<CheckoutActionState> {
  const parsed = claimSchema.safeParse({ orderId: formData.get("orderId"), sessionId: formData.get("sessionId") });
  if (!parsed.success) return { error: "This link is invalid. Please sign in with your email instead." };
  const limit = await rateLimitByIp("claim-access", 20, 10 * 60);
  if (!limit.ok) return { error: "Too many attempts. Please wait a few minutes and try again." };

  const details = await getOrderDetails(parsed.data.orderId);
  const order = details?.order;
  const course = details?.course;
  const valid =
    order &&
    course &&
    order.itemType === "course" &&
    order.status === "paid" &&
    order.stripeSessionId === parsed.data.sessionId &&
    withinClaimWindow(order);
  if (!valid) return { error: "For your security this link has expired. Sign in with your email and we'll send you a fresh link." };

  const user = await upsertStudent(order.email, order.name);
  if (!(await isEnrolled(user.id, course.id))) {
    return { error: "We couldn't find access for this order. Please contact us and we'll sort it out right away." };
  }
  await startStudentSession(user);
  if (user.contactId) await logActivity(user.contactId, "login", "Signed in to the student portal after purchase").catch(() => {});
  redirect(`/learn/${course.slug}`);
}
