"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { emailHasCourse, sendCourseAccessEmail } from "@/lib/courses";
import { testCheckoutAllowed } from "@/lib/integrations";
import { bookingHoldExpired, fulfillOrder, getOrderDetails, newTestSessionId, withinClaimWindow } from "@/lib/payments";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { isDemoMode } from "@/lib/runtime-mode";

export type CheckoutActionState = { error?: string };
export type AccessLinkState = { error?: string; sent?: boolean; email?: string; devLink?: string };

const orderSchema = z.object({ orderId: z.uuid() });
const claimSchema = z.object({ orderId: z.uuid(), sessionId: z.string().min(8).max(255) });

/**
 * Built-in test checkout (no Stripe keys): marks the order paid and delivers it. The buyer gets in through the
 * emailed magic link like everyone else — whoever completes a checkout only chose the email, they don't own it.
 */
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

  redirect(`/checkout/success?order=${order.id}&session_id=${encodeURIComponent(sessionId)}`);
}

/**
 * "Email me a sign-in link" on the success page. The checkout session id in the URL proves that a purchase
 * happened — not that this browser owns the email address typed at checkout — so this never signs anyone in.
 * It emails a fresh one-time link to the order's address, exactly like the one enrollment already sent.
 */
export async function emailCourseAccessAction(_prev: AccessLinkState, formData: FormData): Promise<AccessLinkState> {
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

  const emailLimit = await rateLimit(`claim-access:${order.email}`, 3, 15 * 60);
  if (!emailLimit.ok) return { error: "We've just sent you a link — please check your inbox and spam folder, or try again in a few minutes." };
  if (!(await emailHasCourse(order.email, course.id))) {
    return { error: "We couldn't find access for this order. Please contact us and we'll sort it out right away." };
  }

  const link = await sendCourseAccessEmail({ email: order.email, name: order.name, course, contactId: order.contactId });
  // Same rule as /login: without an email provider (local dev or the demo), show the link so the flow can be tried.
  const showDevLink = !process.env.RESEND_API_KEY && (process.env.NODE_ENV !== "production" || isDemoMode());
  return { sent: true, email: order.email, devLink: showDevLink ? link : undefined };
}
