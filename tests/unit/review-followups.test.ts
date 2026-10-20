import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// A controllable Stripe stand-in for the reconcile job (sessions are looked up in `sessions`).
const mocks = vi.hoisted(() => {
  const sessions = new Map<string, unknown>();
  return {
    sessions,
    stripe: {
      checkout: {
        sessions: {
          retrieve: async (id: string, params?: { expand?: string[] }) => {
            const session = sessions.get(id) as { payment_intent: unknown } | undefined;
            if (!session) throw new Error(`No such checkout.session: '${id}'`);
            // Like Stripe: the PaymentIntent is only an object when it was expanded.
            const pi = session.payment_intent as { id: string } | null;
            return params?.expand?.includes("payment_intent") ? session : { ...session, payment_intent: pi?.id ?? null };
          },
          // No payment-link checkouts to recover.
          list: () => ({ autoPagingToArray: async () => [] }),
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
import { runScheduledJobs } from "@/lib/jobs";
import { checkoutMode, livePaymentsBlocked } from "@/lib/payments";
import { escapeMarkdown, isValidEmail } from "@/lib/utils";

describe("isValidEmail", () => {
  it("accepts ordinary addresses", () => {
    for (const ok of ["ada@example.com", "first.last+tag@sub.example.co.uk", "o'brien@example.ie"]) expect(isValidEmail(ok)).toBe(true);
  });

  it("rejects Markdown/RFC-special characters that could become links or formatting", () => {
    for (const bad of [
      "[x](https://evil.example)@example.com",
      "a<b>@example.com",
      "\"quoted\"@example.com",
      "a,b@example.com",
      "a;b@example.com",
      "a:b@example.com",
      "a\\b@example.com",
      "a@exa(mple).com",
      "a b@example.com",
      "a@example",
    ]) {
      expect(isValidEmail(bad), bad).toBe(false);
    }
  });

  it("escapeMarkdown stops autolinks and formatting", () => {
    expect(escapeMarkdown("ada@example.com")).toBe("ada\\@example\\.com");
    expect(escapeMarkdown("/https://evil.example/x")).toBe("/https\\://evil\\.example/x");
  });
});

describe("checkout in demo mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses a live Stripe key in a demo deployment, but allows a test key", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PGLITE_DIR", "memory://");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_123");
    expect(livePaymentsBlocked()).toBe(true);
    expect(checkoutMode()).toBe("disabled");

    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    expect(livePaymentsBlocked()).toBe(false);
    expect(checkoutMode()).toBe("stripe");
  });

  it("keeps live Stripe outside demo mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_123");
    expect(livePaymentsBlocked()).toBe(false);
    expect(checkoutMode()).toBe("stripe");
  });
});

describe("Stripe reconcile: failed delayed payments", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  async function order(piStatus: string | null) {
    const db = await getDb();
    const [course] = await db.select().from(schema.courses).where(eq(schema.courses.slug, "ai-essentials"));
    const sessionId = `cs_test_${randomUUID().replace(/-/g, "")}`;
    const createdAt = new Date(Date.now() - 2 * 3_600_000);
    const [row] = await db
      .insert(schema.orders)
      .values({
        email: `declined-${randomUUID().slice(0, 8)}@example.com`,
        name: "Dee Clined",
        itemType: "course",
        courseId: course.id,
        description: course.title,
        amountCents: course.priceCents,
        status: "pending",
        stripeSessionId: sessionId,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 1000),
      })
      .returning();
    mocks.sessions.set(sessionId, {
      id: sessionId,
      status: "complete",
      payment_status: "unpaid",
      livemode: false,
      amount_total: course.priceCents,
      payment_intent: piStatus ? { id: `pi_${randomUUID().slice(0, 12)}`, status: piStatus } : null,
    });
    return row;
  }

  it("marks a completed checkout whose payment failed as failed and emails the buyer once", async () => {
    const declined = await order("requires_payment_method");
    const canceled = await order("canceled");
    const clearing = await order("processing");

    const summary = await runScheduledJobs();
    expect(summary.jobs.stripeCheckouts).toMatchObject({ ok: true, count: 0 });
    expect(summary.jobs.stripeCheckouts.ok && summary.jobs.stripeCheckouts.detail).toContain("2 payments declined");

    const db = await getDb();
    const status = async (id: string) => (await db.select({ s: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, id)))[0]?.s;
    expect(await status(declined.id)).toBe("failed");
    expect(await status(canceled.id)).toBe("failed");
    // Still clearing: stays pending for the next run.
    expect(await status(clearing.id)).toBe("pending");

    const emails = async (to: string) =>
      db.select().from(schema.emailLog).where(and(eq(schema.emailLog.to, to), eq(schema.emailLog.kind, "payment_failed")));
    expect(await emails(declined.email)).toHaveLength(1);
    expect(await emails(clearing.email)).toHaveLength(0);

    // A second run doesn't email again.
    await runScheduledJobs();
    expect(await emails(declined.email)).toHaveLength(1);
  });
});
