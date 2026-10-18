import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { logActivity } from "@/lib/crm";
import { fulfillOrder, refundOrder } from "@/lib/payments";
import { getStripe, paymentIntentId, type Stripe } from "@/lib/stripe";

/**
 * Stripe webhook. Configure the endpoint in Stripe → Developers → Webhooks:
 *   URL:    https://<your-domain>/api/stripe/webhook
 *   Events: checkout.session.completed, checkout.session.async_payment_succeeded,
 *           checkout.session.async_payment_failed, checkout.session.expired, charge.refunded
 * and set STRIPE_WEBHOOK_SECRET to the endpoint's signing secret (whsec_…).
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function orderIdFrom(session: Stripe.Checkout.Session): string | null {
  const id = session.metadata?.orderId ?? session.client_reference_id;
  return id && UUID.test(id) ? id : null;
}

async function setPendingOrderStatus(orderId: string, status: "expired" | "failed") {
  const db = await getDb();
  await db
    .update(schema.orders)
    .set({ status })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "pending")));
}

async function handleRefund(charge: Stripe.Charge) {
  const pi = paymentIntentId(charge.payment_intent);
  if (!pi) return;
  const db = await getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.stripePaymentIntentId, pi)).limit(1);
  if (!order) return;
  if (charge.refunded) {
    // Full refund: mark refunded and remove the course access bought with this order.
    await refundOrder(order.id, { revokeAccess: true, source: "stripe", reason: "Refunded in Stripe" });
  } else if (charge.amount_refunded > 0 && order.contactId) {
    await logActivity(order.contactId, "note", `Partial refund issued for ${order.description}`, {
      meta: { orderId: order.id, amountRefundedCents: charge.amount_refunded, refund: true, source: "stripe" },
    });
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return Response.json({ error: "Stripe webhooks are not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe-Signature header" }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.warn("[stripe] webhook signature verification failed", err instanceof Error ? err.message : err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const orderId = orderIdFrom(session);
        // Delayed payment methods complete the session as "unpaid" first; fulfil on async_payment_succeeded.
        if (orderId && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
          await fulfillOrder(orderId, { stripePaymentIntentId: paymentIntentId(session.payment_intent) });
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const orderId = orderIdFrom(event.data.object);
        if (orderId) await setPendingOrderStatus(orderId, "failed");
        break;
      }
      case "checkout.session.expired": {
        const orderId = orderIdFrom(event.data.object);
        if (orderId) await setPendingOrderStatus(orderId, "expired");
        break;
      }
      case "charge.refunded":
        await handleRefund(event.data.object);
        break;
      default:
        // Not an event we act on — acknowledge so Stripe doesn't retry.
        break;
    }
  } catch (err) {
    // A 500 makes Stripe retry later; fulfilment is idempotent so retries are safe.
    console.error(`[stripe] failed to handle ${event.type} (${event.id})`, err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
