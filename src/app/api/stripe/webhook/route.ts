import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Order } from "@/db/schema";
import { logActivity } from "@/lib/crm";
import { escapeMarkdown, notifyOwner } from "@/lib/email";
import { readWebhookSecret } from "@/lib/payment-links";
import { failPendingOrder, fulfillOrder, orderIdForCheckoutSession, refundOrder } from "@/lib/payments";
import { getStripe, paymentIntentId, stripeDashboardUrl, stripeTestMode, type Stripe } from "@/lib/stripe";
import { formatDate, formatMoney } from "@/lib/utils";

/**
 * Stripe webhook. Configure the endpoint in Stripe → Developers → Webhooks:
 *   URL:    https://<your-domain>/api/stripe/webhook
 *   Events: checkout.session.completed, checkout.session.async_payment_succeeded,
 *           checkout.session.async_payment_failed, checkout.session.expired, charge.refunded,
 *           charge.dispute.created, charge.dispute.closed
 * and set STRIPE_WEBHOOK_SECRET to the endpoint's signing secret (whsec_…). Without STRIPE_WEBHOOK_SECRET, the
 * payment-link sync (src/lib/payment-links.ts) creates the endpoint itself and keeps its secret in the database.
 */
export const dynamic = "force-dynamic";

/** Signing secrets to accept: STRIPE_WEBHOOK_SECRET, and the endpoint the payment-link sync created. */
async function webhookSecrets(): Promise<string[]> {
  const secrets: string[] = [];
  const env = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (env) secrets.push(env);
  try {
    const stored = await readWebhookSecret(await getDb(), stripeTestMode() ? "test" : "live");
    if (stored && stored !== env) secrets.push(stored);
  } catch (err) {
    // No database: only the env secret can be checked.
    console.error("[stripe] could not read the stored webhook secret", err);
  }
  return secrets;
}

function verifiedEvent(stripe: Stripe, body: string, signature: string, secrets: string[]): Stripe.Event | null {
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch {
      // Not signed with this secret: try the next one.
    }
  }
  return null;
}

/** Moves a still-pending order to `status`; returns the order when it changed (null for duplicates/late events). */
async function setPendingOrderStatus(orderId: string, status: "expired") {
  const db = await getDb();
  const [order] = await db
    .update(schema.orders)
    .set({ status })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "pending")))
    .returning();
  return order ?? null;
}

/** Our order for a Stripe payment (charges and disputes carry the PaymentIntent the checkout created). */
async function orderForPayment(value: string | Stripe.PaymentIntent | null): Promise<Order | null> {
  const pi = paymentIntentId(value);
  if (!pi) return null;
  const db = await getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.stripePaymentIntentId, pi)).limit(1);
  return order ?? null;
}

async function handleRefund(charge: Stripe.Charge) {
  const order = await orderForPayment(charge.payment_intent);
  if (!order) return;
  if (charge.refunded && (order.status === "pending" || order.status === "expired")) {
    // Refunded before it was delivered (e.g. the checkout event failed and Stripe hadn't retried yet): nothing to
    // take back, but a later retry of the checkout event, or the success page, must not deliver it now.
    const db = await getDb();
    const [stopped] = await db
      .update(schema.orders)
      .set({ status: "refunded" })
      .where(and(eq(schema.orders.id, order.id), inArray(schema.orders.status, ["pending", "expired"])))
      .returning({ id: schema.orders.id });
    if (stopped && order.contactId) {
      await logActivity(order.contactId, "note", `Refunded ${order.description} before it was delivered`, {
        meta: { orderId: order.id, amountCents: order.amountCents, refund: true, source: "stripe", accessRevoked: false },
      });
    }
    if (stopped) return;
  }
  if (charge.refunded) {
    // Full refund: mark refunded and remove the course access bought with this order.
    await refundOrder(order.id, { revokeAccess: true, source: "stripe", reason: "Refunded in Stripe" });
  } else if (charge.amount_refunded > 0 && order.contactId) {
    await logActivity(order.contactId, "note", `Partial refund issued for ${order.description}`, {
      meta: { orderId: order.id, amountRefundedCents: charge.amount_refunded, refund: true, source: "stripe" },
    });
  }
}

/**
 * Chargebacks. A new dispute only alerts the owner — they may still win it. A lost dispute ends the purchase
 * like a full refund (the course access goes too). Not on charge.dispute.funds_withdrawn: Stripe sends that as
 * soon as a dispute opens, including ones the owner goes on to win.
 */
async function handleDispute(dispute: Stripe.Dispute, closed: boolean) {
  const order = await orderForPayment(dispute.payment_intent);
  if (!order) return;
  const amount = formatMoney(dispute.amount, dispute.currency);
  const reason = dispute.reason.replace(/_/g, " ");
  const meta = { orderId: order.id, disputeId: dispute.id, amountCents: dispute.amount, reason: dispute.reason, status: dispute.status, dispute: true };

  if (!closed) {
    if (order.contactId) {
      await logActivity(order.contactId, "note", `Payment disputed: ${order.description} (${amount})`, { body: `Reason given: ${reason}`, meta });
    }
    const dueBy = dispute.evidence_details?.due_by;
    const deadline = dueBy ? ` by **${formatDate(new Date(dueBy * 1000), { dateStyle: "medium", timeStyle: "short" }, "UTC")} UTC**` : "";
    const where = order.stripePaymentIntentId ? `[in Stripe](${stripeDashboardUrl(order.stripePaymentIntentId, order.isTest)})` : "in Stripe";
    // Best effort: Stripe emails the account owner about disputes too, so don't make it retry over this.
    await notifyOwner(
      `Payment disputed: ${order.description} (${amount})`,
      [
        `**${escapeMarkdown(order.name || order.email)}** has disputed their payment for **${escapeMarkdown(order.description)}** (reason: ${escapeMarkdown(reason)}).`,
        `Respond with evidence${deadline} ${where}. If the dispute is lost, the order is marked refunded and any course access bought with it is removed automatically.`,
        `- Email: ${escapeMarkdown(order.email)}`,
        `- Order: ${order.id}`,
      ].join("\n\n"),
    ).catch((err) => console.error("[stripe] dispute alert failed", order.id, err));
    return;
  }

  if (dispute.status === "lost") {
    await refundOrder(order.id, { revokeAccess: true, source: "stripe", reason: `Dispute lost (${reason})` });
  } else if (order.contactId) {
    await logActivity(order.contactId, "note", `Dispute closed (${dispute.status.replace(/_/g, " ")}): ${order.description}`, { meta });
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secrets = stripe ? await webhookSecrets() : [];
  if (!stripe || secrets.length === 0) {
    return Response.json({ error: "Stripe webhooks are not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe-Signature header" }, { status: 400 });

  const body = await request.text();
  const event = verifiedEvent(stripe, body, signature, secrets);
  if (!event) {
    console.warn("[stripe] webhook signature verification failed");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        // A payment-link checkout gets its order here (pending until paid, so a delayed payment's outcome finds it).
        const orderId = await orderIdForCheckoutSession(session, { create: true });
        // Delayed payment methods complete the session as "unpaid" first; fulfil on async_payment_succeeded.
        if (orderId && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
          await fulfillOrder(orderId, {
            stripePaymentIntentId: paymentIntentId(session.payment_intent),
            // Test-mode payments aren't real money: flagged so lifetime value and the revenue figures leave them out.
            isTest: event.livemode === false,
            // What was actually charged, after any promotion code.
            amountPaidCents: session.amount_total,
          });
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const orderId = await orderIdForCheckoutSession(event.data.object, { create: true });
        // Marks the order failed and emails the buyer (best effort: don't make Stripe retry over an email).
        if (orderId) await failPendingOrder(orderId);
        break;
      }
      case "checkout.session.expired": {
        // An abandoned payment-link checkout has no order, so nothing is created for it.
        const orderId = await orderIdForCheckoutSession(event.data.object, { create: false });
        if (orderId) await setPendingOrderStatus(orderId, "expired");
        break;
      }
      case "charge.refunded":
        await handleRefund(event.data.object);
        break;
      case "charge.dispute.created":
        await handleDispute(event.data.object, false);
        break;
      case "charge.dispute.closed":
        await handleDispute(event.data.object, true);
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
