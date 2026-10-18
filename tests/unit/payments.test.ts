import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getDb, schema } from "@/db";
import { emailHasCourse, getCourseWithCurriculum } from "@/lib/courses";

const SECRET = "whsec_test_principe_webhook_secret";
const saved = { key: process.env.STRIPE_SECRET_KEY, secret: process.env.STRIPE_WEBHOOK_SECRET };

/** Builds a signed webhook request exactly like Stripe would send it. */
function signedRequest(event: Record<string, unknown>, secret = SECRET): Request {
  const payload = JSON.stringify({ id: `evt_${randomUUID()}`, object: "event", api_version: null, created: Math.floor(Date.now() / 1000), ...event });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request("http://localhost/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": header } });
}

describe("Stripe webhook", () => {
  let POST: (req: Request) => Promise<Response>;
  let courseId: string;
  let priceCents: number;

  beforeAll(async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    // A syntactically valid test key: constructEvent verifies signatures locally (no network).
    process.env.STRIPE_SECRET_KEY = "sk_test_principe_unit_tests_only";
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    ({ POST } = await import("@/app/api/stripe/webhook/route"));
    const data = await getCourseWithCurriculum("ai-essentials");
    if (!data) throw new Error("seed course missing");
    courseId = data.course.id;
    priceCents = data.course.priceCents;
  });

  afterAll(() => {
    process.env.STRIPE_SECRET_KEY = saved.key;
    process.env.STRIPE_WEBHOOK_SECRET = saved.secret;
    if (saved.key === undefined) delete process.env.STRIPE_SECRET_KEY;
    if (saved.secret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  async function pendingOrder(email: string, sessionId: string) {
    const db = await getDb();
    const [order] = await db
      .insert(schema.orders)
      .values({ email, name: "Webhook Buyer", itemType: "course", courseId, description: "AI Essentials", amountCents: priceCents, stripeSessionId: sessionId })
      .returning();
    return order;
  }

  function sessionEvent(type: string, orderId: string, sessionId: string, paymentStatus = "paid") {
    return {
      type,
      data: {
        object: {
          id: sessionId,
          object: "checkout.session",
          client_reference_id: orderId,
          metadata: { orderId },
          payment_status: paymentStatus,
          status: "complete",
          payment_intent: `pi_${sessionId.slice(3)}`,
        },
      },
    };
  }

  it("rejects requests with a missing or invalid signature", async () => {
    const unsigned = new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}" });
    expect((await POST(unsigned)).status).toBe(400);
    const forged = signedRequest({ type: "checkout.session.completed", data: { object: {} } }, "whsec_wrong_secret");
    expect((await POST(forged)).status).toBe(400);
  });

  it("fulfils a paid checkout once, even when Stripe retries the event", async () => {
    const email = `webhook-${randomUUID()}@example.com`;
    const sessionId = `cs_test_${randomUUID().replace(/-/g, "")}`;
    const order = await pendingOrder(email, sessionId);

    for (let i = 0; i < 3; i++) {
      const res = await POST(signedRequest(sessionEvent("checkout.session.completed", order.id, sessionId)));
      expect(res.status).toBe(200);
    }

    const db = await getDb();
    const [paid] = await db.select().from(schema.orders).where(eq(schema.orders.id, order.id));
    expect(paid.status).toBe("paid");
    expect(paid.isTest).toBe(false);
    expect(paid.stripePaymentIntentId).toBe(`pi_${sessionId.slice(3)}`);
    expect(await emailHasCourse(email, courseId)).toBe(true);
    const receipts = (await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email))).filter((e) => e.kind === "receipt");
    expect(receipts).toHaveLength(1);

    // Full refund in Stripe → refunded + access removed.
    const refund = signedRequest({
      type: "charge.refunded",
      data: { object: { id: "ch_test", object: "charge", payment_intent: paid.stripePaymentIntentId, refunded: true, amount_refunded: priceCents } },
    });
    expect((await POST(refund)).status).toBe(200);
    const [refunded] = await db.select().from(schema.orders).where(eq(schema.orders.id, order.id));
    expect(refunded.status).toBe("refunded");
    expect(await emailHasCourse(email, courseId)).toBe(false);
  });

  it("waits for delayed payments and marks expired sessions", async () => {
    const db = await getDb();
    const sessionId = `cs_test_${randomUUID().replace(/-/g, "")}`;
    const order = await pendingOrder(`delayed-${randomUUID()}@example.com`, sessionId);
    await POST(signedRequest(sessionEvent("checkout.session.completed", order.id, sessionId, "unpaid")));
    expect((await db.select().from(schema.orders).where(eq(schema.orders.id, order.id)))[0].status).toBe("pending");
    await POST(signedRequest(sessionEvent("checkout.session.async_payment_succeeded", order.id, sessionId)));
    expect((await db.select().from(schema.orders).where(eq(schema.orders.id, order.id)))[0].status).toBe("paid");

    const expiredId = `cs_test_${randomUUID().replace(/-/g, "")}`;
    const abandoned = await pendingOrder(`abandoned-${randomUUID()}@example.com`, expiredId);
    await POST(signedRequest(sessionEvent("checkout.session.expired", abandoned.id, expiredId, "unpaid")));
    expect((await db.select().from(schema.orders).where(eq(schema.orders.id, abandoned.id)))[0].status).toBe("expired");
  });

  it("acknowledges events it doesn't handle", async () => {
    const res = await POST(signedRequest({ type: "customer.created", data: { object: { id: "cus_123", object: "customer" } } }));
    expect(res.status).toBe(200);
  });
});
