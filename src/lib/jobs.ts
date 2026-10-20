import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { and, asc, eq, gt, inArray, like, lt, notLike, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { processDueEnrollments, upgradeSequenceCopy } from "@/lib/automations";
import { releaseExpiredHolds, sendDueBookingReminders } from "@/lib/booking-service";
import {
  failPendingOrder,
  fulfillOrder,
  paymentLinkSyncBlocked,
  recoverPaymentLinkCheckouts,
  sessionFullyRefunded,
  syncCoursePaymentLinks,
  UNDELIVERABLE_ALERT_PREFIX,
  UNDELIVERABLE_ALERT_TTL_MS,
} from "@/lib/payments";
import { getStripe, paymentIntentId, type Stripe } from "@/lib/stripe";
import type { JobKey } from "@/components/funnels/automation-utils";

/**
 * Scheduled maintenance, shared by the Vercel Cron route (/api/cron) and the
 * "Run automations now" button in /admin/settings. Every job is isolated: one failure
 * never stops the others, and each reports how many rows it touched.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export type { JobKey } from "@/components/funnels/automation-utils";

export type JobResult = { ok: true; count: number; detail?: string; ms: number } | { ok: false; error: string; ms: number };

export type JobsSummary = {
  ok: boolean;
  startedAt: string;
  durationMs: number;
  jobs: Record<JobKey, JobResult>;
};

/** Pending checkouts older than this are marked expired. */
export const PENDING_ORDER_TTL_MS = DAY;
export const RATE_LIMIT_RETENTION_MS = 2 * DAY;
export const LOGIN_TOKEN_RETENTION_MS = 7 * DAY;
/** Stripe checkouts still pending after this long are checked with Stripe in case the webhook never arrived. */
export const STRIPE_RECONCILE_AFTER_MS = 10 * 60_000;
/**
 * How long after it started a Stripe checkout stays on the reconcile list. Stripe closes an unpaid session
 * within a day; the extra days cover a missed cron run and payments that were still clearing.
 */
export const STRIPE_RECONCILE_WINDOW_MS = 3 * DAY;
/** Stripe's longest Checkout Session lifetime: after this a session is either complete or expired. */
const STRIPE_SESSION_MAX_LIFETIME_MS = DAY;
/** Upper bound on Stripe lookups per run (keeps the cron well inside its time limit). */
export const STRIPE_RECONCILE_BATCH = 25;

/**
 * True when a completed checkout's delayed payment (e.g. a bank debit) has failed: Stripe returns its PaymentIntent
 * to `requires_payment_method`, or cancels it. Needs the session retrieved with `expand: ["payment_intent"]`.
 */
function delayedPaymentFailed(session: Stripe.Checkout.Session): boolean {
  const pi = session.payment_intent;
  if (session.status !== "complete" || session.payment_status !== "unpaid" || !pi || typeof pi === "string") return false;
  return pi.status === "requires_payment_method" || pi.status === "canceled";
}

/** SQL interval for a constant duration (always a number from this file, never user input). */
const intervalMs = (ms: number) => sql.raw(`interval '${Math.trunc(ms)} milliseconds'`);

/**
 * Safety net for a missed or misconfigured Stripe webhook: asks Stripe about recent Stripe-checkout orders and
 * fulfils the ones that were paid. That includes orders other code already retired as `expired` (stale checkout,
 * cancelled booking, released hold), since `fulfillOrder` still delivers those, and it is idempotent, so a
 * webhook arriving later is harmless.
 *
 * Each order checked without a payment is touched (`updated_at`) so it goes to the back of the queue, a
 * pending order whose session Stripe has closed is marked expired, and one whose delayed payment failed is
 * marked failed and its buyer emailed (as the `checkout.session.async_payment_failed` webhook would have). Orders this job has never looked at go
 * first, so a busy day of abandoned checkouts can't crowd out a newer paid one. Then come orders last seen
 * while their session could still be paid, and last the ones last seen after their session must have ended.
 */
async function reconcileStripeCheckouts(): Promise<{ count: number; detail?: string }> {
  const stripe = getStripe();
  if (!stripe) return { count: 0, detail: "Stripe not configured" };
  const db = await getDb();
  const o = schema.orders;
  const now = Date.now();
  // Payment-link checkouts have no order until their webhook arrives, so they're found through Stripe instead.
  let links = { checked: 0, recovered: 0, failed: 0 };
  try {
    links = await recoverPaymentLinkCheckouts(stripe, new Date(now - STRIPE_RECONCILE_WINDOW_MS));
  } catch (err) {
    links.failed++;
    console.error("[jobs] payment-link checkout recovery failed", err);
  }
  // createCheckout stores the session id seconds after creating the order, and this job only looks at orders
  // older than STRIPE_RECONCILE_AFTER_MS, so `updated_at` that close to `created_at` means "never checked".
  const lookPriority = sql`case
    when ${o.updatedAt} < ${o.createdAt} + ${intervalMs(STRIPE_RECONCILE_AFTER_MS)} then 0
    when ${o.updatedAt} < ${o.createdAt} + ${intervalMs(STRIPE_SESSION_MAX_LIFETIME_MS)} then 1
    else 2 end`;
  const candidates = await db
    .select({ id: o.id, status: o.status, sessionId: o.stripeSessionId })
    .from(o)
    .where(
      and(
        inArray(o.status, ["pending", "expired"]),
        like(o.stripeSessionId, "cs\\_%"),
        gt(o.createdAt, new Date(now - STRIPE_RECONCILE_WINDOW_MS)),
        lt(o.createdAt, new Date(now - STRIPE_RECONCILE_AFTER_MS)),
      ),
    )
    .orderBy(lookPriority, asc(o.updatedAt))
    .limit(STRIPE_RECONCILE_BATCH);
  let recovered = 0;
  let closed = 0;
  let declined = 0;
  let failed = 0;
  for (const order of candidates) {
    if (!order.sessionId) continue;
    let closedByStripe = false;
    try {
      const session = await stripe.checkout.sessions.retrieve(order.sessionId, { expand: ["payment_intent", "payment_intent.latest_charge"] });
      // A payment refunded in full before anything was delivered has nothing left to deliver.
      if ((session.payment_status === "paid" || session.payment_status === "no_payment_required") && !sessionFullyRefunded(session)) {
        await fulfillOrder(order.id, {
          stripePaymentIntentId: paymentIntentId(session.payment_intent),
          isTest: session.livemode === false,
          amountPaidCents: session.amount_total,
        });
        recovered++;
        continue;
      }
      if (order.status === "pending" && delayedPaymentFailed(session)) {
        if (await failPendingOrder(order.id)) {
          declined++;
          continue;
        }
      }
      closedByStripe = session.status === "expired";
    } catch (err) {
      failed++;
      console.error("[jobs] Stripe reconcile failed for order", order.id, err);
    }
    // Not paid (or the lookup failed): back of the queue. Skipped if the order changed meanwhile (e.g. a webhook paid it).
    try {
      const retire = closedByStripe && order.status === "pending";
      const [row] = await db
        .update(o)
        .set({ updatedAt: new Date(), ...(retire ? { status: "expired" as const } : {}) })
        .where(and(eq(o.id, order.id), eq(o.status, order.status)))
        .returning({ id: o.id });
      if (retire && row) closed++;
    } catch (err) {
      console.error("[jobs] Stripe reconcile could not update order", order.id, err);
    }
  }
  const notes = [
    `${candidates.length} checked`,
    links.checked ? `${links.checked} payment-link checkout${links.checked === 1 ? "" : "s"} checked` : "",
    closed ? `${closed} closed by Stripe` : "",
    declined ? `${declined} payment${declined === 1 ? "" : "s"} declined` : "",
    failed + links.failed ? `${failed + links.failed} failed` : "",
  ];
  return { count: recovered + links.recovered, detail: notes.filter(Boolean).join(", ") };
}

const JOBS: Record<JobKey, () => Promise<{ count: number; detail?: string }>> = {
  async automations() {
    // Default emails written before a feature existed get their update before anything is sent (once).
    let upgraded = 0;
    try {
      upgraded = await upgradeSequenceCopy();
    } catch (err) {
      console.error("[jobs] email copy upgrade failed", err);
    }
    const r = await processDueEnrollments();
    return { count: r.sent, detail: `${r.processed} due${upgraded ? `, ${upgraded} default email${upgraded === 1 ? "" : "s"} updated` : ""}` };
  },
  async bookingReminders() {
    return { count: await sendDueBookingReminders() };
  },
  // Before holds and stale orders are released, so a paid checkout whose webhook was missed is delivered instead.
  stripeCheckouts: reconcileStripeCheckouts,
  // Catches up when a sync after a course change failed (or a link was changed in the Stripe dashboard).
  async paymentLinks() {
    const blocked = paymentLinkSyncBlocked();
    if (blocked) return { count: 0, detail: blocked };
    const result = await syncCoursePaymentLinks();
    if (!result) return { count: 0 };
    if (result.errors.length) throw new Error(result.errors.join("; "));
    const changed = result.courses.filter((c) => c.status !== "unchanged" && c.status !== "not-for-sale").length + result.retired;
    return { count: changed, detail: `${result.courses.filter((c) => c.url).length} live` };
  },
  async expiredHolds() {
    return { count: await releaseExpiredHolds() };
  },
  async expiredOrders() {
    const db = await getDb();
    const rows = await db
      .update(schema.orders)
      .set({ status: "expired" })
      .where(and(eq(schema.orders.status, "pending"), lt(schema.orders.createdAt, new Date(Date.now() - PENDING_ORDER_TTL_MS))))
      .returning({ id: schema.orders.id });
    return { count: rows.length };
  },
  async rateLimits() {
    const db = await getDb();
    const rl = schema.rateLimits;
    const now = Date.now();
    const rows = await db
      .delete(rl)
      .where(
        and(
          lt(rl.windowStart, new Date(now - RATE_LIMIT_RETENTION_MS)),
          // "Owner already alerted" markers for undeliverable payments must outlive Stripe's webhook retries.
          or(notLike(rl.key, `${UNDELIVERABLE_ALERT_PREFIX}%`), lt(rl.windowStart, new Date(now - UNDELIVERABLE_ALERT_TTL_MS))),
        ),
      )
      .returning({ key: rl.key });
    return { count: rows.length };
  },
  async loginTokens() {
    const db = await getDb();
    const rows = await db
      .delete(schema.loginTokens)
      .where(lt(schema.loginTokens.expiresAt, new Date(Date.now() - LOGIN_TOKEN_RETENTION_MS)))
      .returning({ hash: schema.loginTokens.tokenHash });
    return { count: rows.length };
  },
};

/** Runs every scheduled job in order (holds are released before stale orders are expired). */
export async function runScheduledJobs(): Promise<JobsSummary> {
  const started = Date.now();
  const jobs = {} as Record<JobKey, JobResult>;
  for (const key of Object.keys(JOBS) as JobKey[]) {
    const t0 = Date.now();
    try {
      const r = await JOBS[key]();
      jobs[key] = { ok: true, count: r.count, ...(r.detail ? { detail: r.detail } : {}), ms: Date.now() - t0 };
    } catch (err) {
      console.error(`[jobs] ${key} failed`, err);
      jobs[key] = { ok: false, error: err instanceof Error ? err.message : String(err), ms: Date.now() - t0 };
    }
  }
  return {
    ok: Object.values(jobs).every((j) => j.ok),
    startedAt: new Date(started).toISOString(),
    durationMs: Date.now() - started,
    jobs,
  };
}

const sha256 = (value: string) => createHash("sha256").update(value).digest();

/**
 * Cron authorization. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the secret is
 * set. Without a secret the job may only run outside production (local development).
 */
export function authorizeCron(
  authorization: string | null,
  secret: string | undefined = process.env.CRON_SECRET,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): { ok: true } | { ok: false; error: string } {
  if (!secret) {
    return nodeEnv === "production" ? { ok: false, error: "CRON_SECRET is not configured. Add it in your Vercel project settings." } : { ok: true };
  }
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || !timingSafeEqual(sha256(token), sha256(secret))) return { ok: false, error: "Unauthorized" };
  return { ok: true };
}
