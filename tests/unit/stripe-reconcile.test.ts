import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// A controllable stand-in for the Stripe client: sessions are looked up in `sessions`, every lookup is recorded.
type FakeSession = { id: string; status: "open" | "complete" | "expired"; payment_status: "paid" | "unpaid" | "no_payment_required"; payment_intent: string | null; livemode: boolean; amount_total: number | null };
const mocks = vi.hoisted(() => {
  const sessions = new Map<string, unknown>();
  const calls: string[] = [];
  // Completed sessions returned by checkout.sessions.list (payment-link checkouts the webhook may have missed).
  const listed: unknown[] = [];
  return {
    sessions,
    calls,
    listed,
    stripe: {
      checkout: {
        sessions: {
          retrieve: async (id: string) => {
            calls.push(id);
            const session = sessions.get(id);
            if (!session) throw new Error(`No such checkout.session: '${id}'`);
            return session;
          },
          list: () => ({ autoPagingToArray: async () => [...listed] }),
        },
      },
    },
  };
});
vi.mock("@/lib/stripe", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/stripe")>()),
  getStripe: () => mocks.stripe,
}));

import { getDb, schema } from "@/db";
import type { Order, OrderStatus } from "@/db/schema";
import { runScheduledJobs, STRIPE_RECONCILE_BATCH } from "@/lib/jobs";

const MIN = 60_000;
const HOUR = 60 * MIN;
let courseId: string;
let priceCents: number;

/** A Stripe-checkout order created `age` ago and last updated `touchedAfter` after that. */
async function checkout(age: number, touchedAfter: number, session: Partial<FakeSession> | null, status: OrderStatus = "pending"): Promise<Order> {
  const db = await getDb();
  const sessionId = `cs_test_${randomUUID().replace(/-/g, "")}`;
  const createdAt = new Date(Date.now() - age);
  const [order] = await db
    .insert(schema.orders)
    .values({
      email: `reconcile-${randomUUID().slice(0, 8)}@example.com`,
      name: "Rita Reconcile",
      itemType: "course",
      courseId,
      description: "AI Essentials",
      amountCents: priceCents,
      status,
      stripeSessionId: sessionId,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + touchedAfter),
    })
    .returning();
  if (session) {
    mocks.sessions.set(sessionId, { id: sessionId, status: "open", payment_status: "unpaid", payment_intent: null, livemode: false, amount_total: priceCents, ...session });
  }
  return order;
}

async function reload(orders: Order[]): Promise<Map<string, Order>> {
  const db = await getDb();
  const rows = await db.select().from(schema.orders).where(inArray(schema.orders.id, orders.map((o) => o.id)));
  return new Map(rows.map((r) => [r.id, r]));
}

const paid = (): Partial<FakeSession> => ({ status: "complete", payment_status: "paid", payment_intent: `pi_${randomUUID().slice(0, 12)}` });

describe("Stripe checkout reconcile job", () => {
  let newPaid: Order;
  let closedPending: Order;
  let retiredPaid: Order;
  let tooOld: Order;
  let tooNew: Order;
  let settled: Order;
  let lookupFails: Order;
  const seen: Order[] = [];
  /** The `seen` orders the first run has no room for (four never-checked or older orders go before them). */
  const unreached = () => seen.slice(STRIPE_RECONCILE_BATCH - 4);

  beforeAll(async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const db = await getDb();
    const [course] = await db.select().from(schema.courses).where(eq(schema.courses.slug, "ai-essentials"));
    if (!course) throw new Error("seed course missing");
    courseId = course.id;
    priceCents = course.priceCents;

    // A busy day of abandoned checkouts, each already checked once while its session was open (more than a batch).
    // The old oldest-first query spent the whole batch on these and never reached the newer paid order.
    for (let i = 0; i < STRIPE_RECONCILE_BATCH + 1; i++) seen.push(await checkout(20 * HOUR - i * MIN, HOUR, {}));
    lookupFails = await checkout(20 * HOUR + 30 * MIN, HOUR, null);
    // Never looked at yet: one paid (webhook and success page both missed), one Stripe has already closed.
    newPaid = await checkout(30 * MIN, 2_000, paid());
    closedPending = await checkout(2 * HOUR, 2_000, { status: "expired" });
    // Retired as expired by other code (e.g. a released booking hold) although it was paid.
    retiredPaid = await checkout(23 * HOUR, 2 * HOUR, paid(), "expired");
    // Last updated after Stripe must have closed its session: only checked when the batch has room.
    settled = await checkout(70 * HOUR, 25 * HOUR, paid(), "expired");
    // Outside the window: too old to reconcile, and too new (the webhook may still be on its way).
    tooOld = await checkout(4 * 24 * HOUR, 2_000, paid());
    tooNew = await checkout(5 * MIN, 2_000, paid());
  }, 60_000);

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("checks never-checked orders first, recovers paid ones (pending or retired) and closes expired sessions", async () => {
    const started = Date.now();
    mocks.calls.length = 0;
    const summary = await runScheduledJobs();

    expect(summary.jobs.stripeCheckouts).toMatchObject({ ok: true, count: 2, detail: `${STRIPE_RECONCILE_BATCH} checked, 1 closed by Stripe, 1 failed` });
    expect(mocks.calls).toHaveLength(STRIPE_RECONCILE_BATCH);
    // Never checked first (oldest first), then least recently checked.
    expect(mocks.calls.slice(0, 4)).toEqual([closedPending, newPaid, retiredPaid, lookupFails].map((o) => o.stripeSessionId));
    for (const skipped of [tooOld, tooNew, settled]) expect(mocks.calls).not.toContain(skipped.stripeSessionId);

    const rows = await reload([newPaid, closedPending, retiredPaid, settled, lookupFails, ...seen]);
    expect(rows.get(newPaid.id)?.status).toBe("paid");
    expect(rows.get(retiredPaid.id)?.status).toBe("paid");
    expect(rows.get(closedPending.id)?.status).toBe("expired");
    expect(rows.get(settled.id)?.status).toBe("expired");

    // Checked without a payment (or the lookup failed): moved to the back of the queue.
    const checkedSeen = seen.slice(0, STRIPE_RECONCILE_BATCH - 4);
    for (const o of [lookupFails, ...checkedSeen]) {
      expect(rows.get(o.id)?.status).toBe("pending");
      expect(rows.get(o.id)!.updatedAt.getTime()).toBeGreaterThanOrEqual(started);
    }
    for (const o of unreached()) {
      expect(mocks.calls).not.toContain(o.stripeSessionId);
      expect(rows.get(o.id)!.updatedAt.getTime()).toBe(o.updatedAt.getTime());
    }
  });

  it("starts the next run with the orders the last one didn't reach", async () => {
    mocks.calls.length = 0;
    const summary = await runScheduledJobs();
    expect(summary.jobs.stripeCheckouts.ok).toBe(true);
    expect(mocks.calls).toHaveLength(STRIPE_RECONCILE_BATCH);
    expect(mocks.calls.slice(0, unreached().length)).toEqual(unreached().map((o) => o.stripeSessionId));
    // Paid and out-of-window orders are no longer candidates; Stripe-settled ones still wait for spare room.
    for (const skipped of [newPaid, retiredPaid, tooOld, tooNew, settled]) expect(mocks.calls).not.toContain(skipped.stripeSessionId);
  });

  it("fulfils payment-link checkouts whose webhook never arrived, once", async () => {
    const db = await getDb();
    const email = `link-reconcile-${randomUUID().slice(0, 8)}@example.com`;
    const sessionId = `cs_test_${randomUUID().replace(/-/g, "")}`;
    const linkSession = {
      id: sessionId,
      object: "checkout.session",
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      payment_link: "plink_test_reconcile",
      payment_intent: `pi_${randomUUID().slice(0, 12)}`,
      livemode: false,
      amount_total: priceCents,
      currency: "usd",
      client_reference_id: null,
      metadata: { source: "principe-payment-link", courseId, courseSlug: "ai-essentials" },
      customer_details: { email, name: "Link Buyer" },
    };
    // Our own checkouts and other people's payment links are left alone, and a payment refunded in full isn't delivered.
    const ownCheckout = { ...linkSession, id: `cs_test_${randomUUID().replace(/-/g, "")}`, payment_link: null, metadata: {} };
    const foreignLink = { ...linkSession, id: `cs_test_${randomUUID().replace(/-/g, "")}`, metadata: {} };
    const refunded = {
      ...linkSession,
      id: `cs_test_${randomUUID().replace(/-/g, "")}`,
      customer_details: { email: `refunded-${email}`, name: "Refunded Buyer" },
      payment_intent: { id: `pi_${randomUUID().slice(0, 12)}`, object: "payment_intent", status: "succeeded", latest_charge: { id: "ch_refunded", object: "charge", refunded: true } },
    };
    mocks.listed.push(linkSession, ownCheckout, foreignLink, refunded);

    for (let run = 0; run < 2; run++) {
      const summary = await runScheduledJobs();
      expect(summary.jobs.stripeCheckouts.ok).toBe(true);
    }
    const orders = await db.select().from(schema.orders).where(eq(schema.orders.email, email));
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ status: "paid", stripeSessionId: sessionId, courseId, isTest: true, amountCents: priceCents });
    // A site checkout paid, then refunded in full before the webhook (or this job) delivered it: marked refunded.
    const early = await checkout(2 * HOUR, 2_000, {
      status: "complete",
      payment_status: "paid",
      payment_intent: { id: `pi_${randomUUID().slice(0, 12)}`, object: "payment_intent", status: "succeeded", latest_charge: { id: "ch_x", object: "charge", refunded: true } } as never,
    });
    await runScheduledJobs();
    expect((await reload([early])).get(early.id)?.status).toBe("refunded");
    for (const other of [ownCheckout, foreignLink]) {
      expect(await db.select().from(schema.orders).where(eq(schema.orders.stripeSessionId, other.id))).toHaveLength(0);
    }
    // The refunded one is recorded as refunded, so a late checkout event can't deliver it.
    const refundedOrders = await db.select().from(schema.orders).where(eq(schema.orders.stripeSessionId, refunded.id));
    expect(refundedOrders).toHaveLength(1);
    expect(refundedOrders[0].status).toBe("refunded");
    mocks.listed.length = 0;
  });
});
