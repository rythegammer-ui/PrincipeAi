import "server-only";

/**
 * Checkout + order fulfilment (Stripe, or the built-in test checkout when Stripe isn't configured).
 * OWNER: courses & payments feature. Other features call these two functions only.
 */

export type CheckoutInput =
  | { itemType: "course"; courseId: string; email: string; name?: string | null }
  | { itemType: "booking"; bookingId: string; email: string; name?: string | null };

/**
 * Creates a pending order and returns the URL to send the buyer to
 * (Stripe Checkout, or /checkout/test/[orderId] in test mode).
 */
export async function createCheckout(input: CheckoutInput): Promise<{ url: string; orderId: string }> {
  void input;
  throw new Error("createCheckout not implemented yet");
}

/**
 * Marks an order paid and delivers it (course enrollment + access email, or paid booking confirmation).
 * MUST be idempotent — Stripe can deliver the same webhook more than once.
 */
export async function fulfillOrder(orderId: string, payment: { stripePaymentIntentId?: string | null; isTest?: boolean } = {}): Promise<void> {
  void orderId;
  void payment;
  throw new Error("fulfillOrder not implemented yet");
}
