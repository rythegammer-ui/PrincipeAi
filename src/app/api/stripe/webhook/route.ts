import { and, eq, lt } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Order } from "@/db/schema";
import { logActivity } from "@/lib/crm";
import { escapeMarkdown, notifyOwner } from "@/lib/email";
import { markEnvWebhookVerified, readWebhookSecret } from "@/lib/payment-links";
import { failPendingOrder, fulfillOrder, orderIdForCheckoutSession, refundOrder, refundUndeliveredOrder } from "@/lib/payments";
import { adjustAgentSaleForPartialRefund, holdAgentSaleForDispute, releaseAgentSaleDispute } from "@/lib/sales/commissions";
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
 * Events signed by either are accepted, and each event is handled once even when both endpoints deliver it.
 */
export const dynamic = "force-dynamic";

/** Signing secrets to accept: STRIPE_WEBHOOK_SECRET, and the endpoint the payment-link sync created. */
async function webhookSecrets(): Promise<{ env: string | null; stored: string | null }> {
  const env = process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
  let stored: string | null = null;
  try {
    stored = await readWebhookSecret(await getDb(), stripeTestMode() ? "test" : "live");
  } catch (err) {
    // No database: only the env secret can be checked.
    console.error("[stripe] could not read the stored webhook secret", err);
  }
  return { env, stored: stored && stored !== env ? stored : null };
}

function verifiedEvent(stripe: Stripe, body: string, signature: string, secrets: (string | null)[]): { event: Stripe.Event; secret: string } | null {
  for (const secret of secrets) {
    if (!secret) continue;
    try {
      return { event: stripe.webhooks.constructEvent(body, signature, secret), secret };
    } catch {
      // Not signed with this secret: try the next one.
    }
  }
  return null;
}

/* Each Stripe event is handled once: it reaches every endpoint (the site's own and STRIPE_WEBHOOK_SECRET's while both
 * exist), and Stripe may deliver one twice. A marker row in rate_limits (kept two days, jobs.ts rateLimits) is `count`
 * 0 while the event is being handled and 1 once it was. It's dropped if handling fails so Stripe's retry runs it, and
 * one left "in progress" by a function that died part-way is taken over after EVENT_LEASE_MS. */
const EVENT_KEY = "stripe-event:";
const EVENT_LEASE_MS = 5 * 60_000;

async function claimEvent(eventId: string): Promise<"new" | "done" | "busy"> {
  const db = await getDb();
  const key = `${EVENT_KEY}${eventId}`;
  const rl = schema.rateLimits;
  const [inserted] = await db.insert(rl).values({ key, count: 0, windowStart: new Date() }).onConflictDoNothing().returning({ key: rl.key });
  if (inserted) return "new";
  const [takenOver] = await db
    .update(rl)
    .set({ windowStart: new Date() })
    .where(and(eq(rl.key, key), eq(rl.count, 0), lt(rl.windowStart, new Date(Date.now() - EVENT_LEASE_MS))))
    .returning({ key: rl.key });
  if (takenOver) return "new";
  const [row] = await db.select({ count: rl.count }).from(rl).where(eq(rl.key, key)).limit(1);
  // Gone meanwhile (its handler failed and released it): Stripe's retry will run it.
  return row?.count === 1 ? "done" : "busy";
}

async function finishEvent(eventId: string): Promise<void> {
  const db = await getDb();
  await db.update(schema.rateLimits).set({ count: 1 }).where(eq(schema.rateLimits.key, `${EVENT_KEY}${eventId}`));
}

async function releaseEvent(eventId: string): Promise<void> {
  const db = await getDb();
  await db.delete(schema.rateLimits).where(eq(schema.rateLimits.key, `${EVENT_KEY}${eventId}`));
}

/**
 * A charge refunded in full whose order wasn't found by its PaymentIntent: the order hasn't been claimed yet (the
 * site's own checkout stores the PaymentIntent on its first claim) or, for a payment link, doesn't exist yet. Finds
 * it through the Checkout Session and marks it refunded, so a later retry of the checkout event can't deliver it.
 */
async function stopRefundedCheckout(stripe: Stripe, charge: Stripe.Charge) {
  const pi = paymentIntentId(charge.payment_intent);
  if (!pi) return;
  const [session] = (await stripe.checkout.sessions.list({ payment_intent: pi, limit: 1 })).data;
  if (!session || session.status !== "complete") return;
  const orderId = await orderIdForCheckoutSession(session, { create: true });
  if (!orderId || (await refundUndeliveredOrder(orderId))) return;
  // Claimed (and so delivered) while this ran, e.g. by a retried checkout event: refund it like any paid order.
  const order = await orderForPayment(charge.payment_intent);
  if (order?.status === "paid") await refundOrder(order.id, { revokeAccess: true, source: "stripe", reason: "Refunded in Stripe" });
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

async function handleRefund(stripe: Stripe, charge: Stripe.Charge) {
  const order = await orderForPayment(charge.payment_intent);
  if (!order) {
    if (charge.refunded) await stopRefundedCheckout(stripe, charge);
    return;
  }
  // Refunded before it was delivered (e.g. the checkout event failed and Stripe hadn't retried yet): nothing to take
  // back, but a later retry of the checkout event, or the success page, must not deliver it now.
  if (charge.refunded && (order.status === "pending" || order.status === "expired") && (await refundUndeliveredOrder(order.id))) return;
  if (charge.refunded) {
    // Full refund: mark refunded and remove the course access bought with this order.
    await refundOrder(order.id, { revokeAccess: true, source: "stripe", reason: "Refunded in Stripe" });
  } else if (charge.amount_refunded > 0) {
    // The sales agent's commission is recalculated on what the customer kept (amount_refunded is the running total).
    await adjustAgentSaleForPartialRefund(order.id, charge.amount_refunded).catch((err) =>
      console.error("[stripe] agent commission adjustment failed", order.id, err),
    );
    if (order.contactId) {
      await logActivity(order.contactId, "note", `Partial refund issued for ${order.description}`, {
        meta: { orderId: order.id, amountRefundedCents: charge.amount_refunded, refund: true, source: "stripe" },
      });
    }
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
    // A sales agent's unpaid commission on it waits until the dispute is resolved.
    await holdAgentSaleForDispute(order.id).catch((err) => console.error("[stripe] agent commission hold failed", order.id, err));
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
  } else {
    await releaseAgentSaleDispute(order.id).catch((err) => console.error("[stripe] agent commission release failed", order.id, err));
    if (order.contactId) {
      await logActivity(order.contactId, "note", `Dispute closed (${dispute.status.replace(/_/g, " ")}): ${order.description}`, { meta });
    }
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secrets = stripe ? await webhookSecrets() : { env: null, stored: null };
  if (!stripe || (!secrets.env && !secrets.stored)) {
    return Response.json({ error: "Stripe webhooks are not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe-Signature header" }, { status: 400 });

  const body = await request.text();
  const verified = verifiedEvent(stripe, body, signature, [secrets.env, secrets.stored]);
  if (!verified) {
    console.warn("[stripe] webhook signature verification failed");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  const { event } = verified;
  if (secrets.env && verified.secret === secrets.env) {
    // Proof that STRIPE_WEBHOOK_SECRET's endpoint works in this mode: the sync may now retire the site's own.
    await markEnvWebhookVerified(await getDb(), event.livemode ? "live" : "test", secrets.env).catch((err) =>
      console.error("[stripe] could not record the webhook check", err),
    );
  }
  try {
    const claim = await claimEvent(event.id);
    if (claim === "done") return Response.json({ received: true, duplicate: true });
    // Another delivery of it is being handled right now: Stripe retries this one later (and then sees it done).
    if (claim === "busy") return Response.json({ error: "Event is being handled" }, { status: 409 });
  } catch (err) {
    console.error(`[stripe] could not record ${event.id}`, err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
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
        await handleRefund(stripe, event.data.object);
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
    await releaseEvent(event.id).catch((e) => console.error("[stripe] could not release event", event.id, e));
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  await finishEvent(event.id).catch((err) => console.error("[stripe] could not mark event handled", event.id, err));
  return Response.json({ received: true });
}
