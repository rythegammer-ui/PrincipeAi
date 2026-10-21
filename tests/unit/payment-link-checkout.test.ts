import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getDb, schema } from "@/db";
import { recipientTemplateVars } from "@/lib/automations";
import { emailHasCourse, getCourseWithCurriculum } from "@/lib/courses";
import { defaultTemplateVars, fillTemplate } from "@/lib/email";
import { paymentLinkKey, PAYMENT_LINK_SOURCE, stripeInstallId, type StoredPaymentLink } from "@/lib/payment-links";
import { getStripe } from "@/lib/stripe";

const SECRET = "whsec_test_payment_link_secret";
const STORED_SECRET = "whsec_test_stored_by_the_sync";
const saved = { key: process.env.STRIPE_SECRET_KEY, secret: process.env.STRIPE_WEBHOOK_SECRET, site: process.env.NEXT_PUBLIC_SITE_URL };

function signedRequest(event: Record<string, unknown>, secret = SECRET): Request {
  const payload = JSON.stringify({ id: `evt_${randomUUID()}`, object: "event", api_version: null, created: Math.floor(Date.now() / 1000), livemode: true, ...event });
  return signedPayload(payload, secret);
}

function signedPayload(payload: string, secret: string): Request {
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request("http://localhost/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": header } });
}

const newSessionId = () => `cs_test_${randomUUID().replace(/-/g, "")}`;

describe("Stripe payment-link checkouts", () => {
  let POST: (req: Request) => Promise<Response>;
  let BUY: (req: Request, ctx: { params: Promise<{ slug: string }> }) => Promise<Response>;
  let course: { id: string; slug: string; title: string; priceCents: number };

  beforeAll(async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    process.env.STRIPE_SECRET_KEY = "sk_test_principe_unit_tests_only";
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    process.env.NEXT_PUBLIC_SITE_URL = "https://principe.example";
    ({ POST } = await import("@/app/api/stripe/webhook/route"));
    ({ GET: BUY } = await import("@/app/buy/[slug]/route"));
    const data = await getCourseWithCurriculum("ai-essentials");
    if (!data) throw new Error("seed course missing");
    course = data.course;
  }, 60_000);

  afterAll(() => {
    for (const [name, value] of [
      ["STRIPE_SECRET_KEY", saved.key],
      ["STRIPE_WEBHOOK_SECRET", saved.secret],
      ["NEXT_PUBLIC_SITE_URL", saved.site],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  /** A Checkout Session made by one of our payment links, as Stripe sends it. */
  function linkSession(email: string, overrides: Record<string, unknown> = {}) {
    const id = newSessionId();
    return {
      id,
      object: "checkout.session",
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      payment_link: "plink_test_123",
      payment_intent: `pi_${id.slice(8, 30)}`,
      client_reference_id: null,
      livemode: true,
      amount_total: course.priceCents,
      currency: "usd",
      customer_email: null,
      customer_details: { email, name: "Penny Link" },
      metadata: { source: PAYMENT_LINK_SOURCE, courseId: course.id, courseSlug: course.slug, priceId: "price_123" },
      ...overrides,
    };
  }

  const ordersFor = async (sessionId: string) => {
    const db = await getDb();
    return db.select().from(schema.orders).where(eq(schema.orders.stripeSessionId, sessionId));
  };

  it("creates and fulfils the order for a paid payment-link checkout, once", async () => {
    const email = `link-${randomUUID().slice(0, 8)}@example.com`;
    const session = linkSession(email.toUpperCase());
    for (let i = 0; i < 2; i++) {
      expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: session } }))).status).toBe(200);
    }
    const orders = await ordersFor(session.id);
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      status: "paid",
      email,
      name: "Penny Link",
      itemType: "course",
      courseId: course.id,
      description: course.title,
      amountCents: course.priceCents,
      isTest: false,
      stripePaymentIntentId: session.payment_intent,
    });
    expect(orders[0].contactId).toBeTruthy();
    expect(await emailHasCourse(email, course.id)).toBe(true);
    const db = await getDb();
    const receipts = (await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email))).filter((e) => e.kind === "receipt");
    expect(receipts).toHaveLength(1);

    // A refund in Stripe finds the order through its PaymentIntent, as for any other checkout.
    const refund = { id: "ch_test", object: "charge", payment_intent: session.payment_intent, refunded: true, amount_refunded: course.priceCents };
    expect((await POST(signedRequest({ type: "charge.refunded", data: { object: refund } }))).status).toBe(200);
    expect((await ordersFor(session.id))[0].status).toBe("refunded");
    expect(await emailHasCourse(email, course.id)).toBe(false);
  });

  it("never treats a payment link's client_reference_id as an order id", async () => {
    const db = await getDb();
    const [victim] = await db
      .insert(schema.orders)
      .values({ email: `victim-${randomUUID().slice(0, 8)}@example.com`, itemType: "course", courseId: course.id, description: course.title, amountCents: course.priceCents })
      .returning();
    // Anyone can add ?client_reference_id=<uuid> to a payment link URL.
    const session = linkSession(`attacker-${randomUUID().slice(0, 8)}@example.com`, { client_reference_id: victim.id, metadata: { source: PAYMENT_LINK_SOURCE, courseId: course.id, orderId: victim.id } });
    expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: session } }))).status).toBe(200);
    expect((await db.select().from(schema.orders).where(eq(schema.orders.id, victim.id)))[0].status).toBe("pending");
    expect((await ordersFor(session.id))[0]).toMatchObject({ status: "paid", courseId: course.id });
  });

  it("waits for delayed payments, and ignores links it didn't make and abandoned checkouts", async () => {
    const pending = linkSession(`delayed-${randomUUID().slice(0, 8)}@example.com`, { payment_status: "unpaid" });
    await POST(signedRequest({ type: "checkout.session.completed", data: { object: pending } }));
    expect((await ordersFor(pending.id))[0].status).toBe("pending");
    await POST(signedRequest({ type: "checkout.session.async_payment_succeeded", data: { object: { ...pending, payment_status: "paid" } } }));
    expect((await ordersFor(pending.id))[0].status).toBe("paid");

    const declined = linkSession(`declined-${randomUUID().slice(0, 8)}@example.com`, { payment_status: "unpaid" });
    await POST(signedRequest({ type: "checkout.session.async_payment_failed", data: { object: declined } }));
    expect((await ordersFor(declined.id))[0].status).toBe("failed");

    const foreign = linkSession(`foreign-${randomUUID().slice(0, 8)}@example.com`, { metadata: {} });
    expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: foreign } }))).status).toBe(200);
    expect(await ordersFor(foreign.id)).toHaveLength(0);

    const abandoned = linkSession(`abandoned-${randomUUID().slice(0, 8)}@example.com`, { status: "expired", payment_status: "unpaid" });
    expect((await POST(signedRequest({ type: "checkout.session.expired", data: { object: abandoned } }))).status).toBe(200);
    expect(await ordersFor(abandoned.id)).toHaveLength(0);
  });

  it("only takes checkouts from this site's own links", async () => {
    const db = await getDb();
    const install = await stripeInstallId(db);
    const ours = linkSession(`ours-${randomUUID().slice(0, 8)}@example.com`, { metadata: { source: PAYMENT_LINK_SOURCE, install, courseId: course.id, courseSlug: course.slug } });
    expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: ours } }))).status).toBe(200);
    expect((await ordersFor(ours.id))[0]).toMatchObject({ status: "paid", courseId: course.id });

    // A link made by another database on the same Stripe account (a local copy, say) for its own course: that site's sale.
    const theirs = linkSession(`theirs-${randomUUID().slice(0, 8)}@example.com`, {
      metadata: { source: PAYMENT_LINK_SOURCE, install: "another-database", courseId: randomUUID(), courseSlug: course.slug },
    });
    expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: theirs } }))).status).toBe(200);
    expect(await ordersFor(theirs.id)).toHaveLength(0);

    // One naming our course is ours, whatever its install id (made before this database was restored).
    const restored = linkSession(`restored-${randomUUID().slice(0, 8)}@example.com`, {
      metadata: { source: PAYMENT_LINK_SOURCE, install: "before-the-restore", courseId: course.id, courseSlug: course.slug },
    });
    expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: restored } }))).status).toBe(200);
    expect((await ordersFor(restored.id))[0]).toMatchObject({ status: "paid", courseId: course.id });
  });

  it("never delivers an order refunded before it was fulfilled", async () => {
    const email = `refunded-early-${randomUUID().slice(0, 8)}@example.com`;
    // A delayed payment: the order exists, still pending.
    const session = linkSession(email, { payment_status: "unpaid" });
    await POST(signedRequest({ type: "checkout.session.completed", data: { object: session } }));
    expect((await ordersFor(session.id))[0].status).toBe("pending");
    // Refunded in full in Stripe, then a (late or retried) success event arrives.
    const refund = { id: "ch_early", object: "charge", payment_intent: session.payment_intent, refunded: true, amount_refunded: course.priceCents };
    expect((await POST(signedRequest({ type: "charge.refunded", data: { object: refund } }))).status).toBe(200);
    expect((await ordersFor(session.id))[0].status).toBe("refunded");
    expect((await POST(signedRequest({ type: "checkout.session.async_payment_succeeded", data: { object: { ...session, payment_status: "paid" } } }))).status).toBe(200);
    expect((await ordersFor(session.id))[0].status).toBe("refunded");
    expect(await emailHasCourse(email, course.id)).toBe(false);
  });

  it("doesn't enroll a buyer in a different course that took over a deleted course's slug", async () => {
    const email = `orphan-${randomUUID().slice(0, 8)}@example.com`;
    const session = linkSession(email, { metadata: { source: PAYMENT_LINK_SOURCE, courseId: randomUUID(), courseSlug: course.slug } });
    // Paid for a course that no longer exists: the order is kept for the owner (who is alerted), and Stripe retries.
    expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: session } }))).status).toBe(500);
    const [order] = await ordersFor(session.id);
    expect(order).toMatchObject({ courseId: null, status: "pending" });
    expect(await emailHasCourse(email, course.id)).toBe(false);
  });

  it("never delivers a checkout refunded before its order was claimed or even created", async () => {
    const stripe = getStripe()!;
    // A payment-link sale whose checkout event failed before the order existed; then a full refund arrives.
    const email = `refunded-first-${randomUUID().slice(0, 8)}@example.com`;
    const session = linkSession(email);
    const list = vi.spyOn(stripe.checkout.sessions, "list").mockResolvedValue({ data: [session] } as never);
    try {
      const refund = { id: "ch_first", object: "charge", payment_intent: session.payment_intent, refunded: true, amount_refunded: course.priceCents };
      expect((await POST(signedRequest({ type: "charge.refunded", data: { object: refund } }))).status).toBe(200);
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: session.payment_intent }));
      expect((await ordersFor(session.id))[0]).toMatchObject({ status: "refunded", courseId: course.id });
      // Stripe's retry of the checkout event: nothing is delivered.
      expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: session } }))).status).toBe(200);
      expect((await ordersFor(session.id))[0].status).toBe("refunded");
      expect(await emailHasCourse(email, course.id)).toBe(false);

      // The site's own checkout: its order has no PaymentIntent until it's first claimed.
      const db = await getDb();
      const ownSessionId = newSessionId();
      const [own] = await db
        .insert(schema.orders)
        .values({ email: `own-${randomUUID().slice(0, 8)}@example.com`, itemType: "course", courseId: course.id, description: course.title, amountCents: course.priceCents, stripeSessionId: ownSessionId })
        .returning();
      const ownSession = { ...linkSession(own.email), id: ownSessionId, payment_link: null, metadata: { orderId: own.id }, client_reference_id: own.id };
      list.mockResolvedValue({ data: [ownSession] } as never);
      const ownRefund = { id: "ch_own", object: "charge", payment_intent: ownSession.payment_intent, refunded: true, amount_refunded: course.priceCents };
      expect((await POST(signedRequest({ type: "charge.refunded", data: { object: ownRefund } }))).status).toBe(200);
      expect((await db.select().from(schema.orders).where(eq(schema.orders.id, own.id)))[0].status).toBe("refunded");
      expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: ownSession } }))).status).toBe(200);
      expect((await db.select().from(schema.orders).where(eq(schema.orders.id, own.id)))[0].status).toBe("refunded");
    } finally {
      list.mockRestore();
    }
  });

  it("handles each event once, even when two endpoints deliver it", async () => {
    const db = await getDb();
    const OLD = "whsec_test_site_made_endpoint";
    const stored = { v: 1, endpointId: "we_site", url: "https://principe.example/api/stripe/webhook", secret: OLD, createdAt: new Date().toISOString() };
    await db.insert(schema.settings).values({ key: "stripeWebhook:test", value: stored }).onConflictDoUpdate({ target: schema.settings.key, set: { value: stored } });
    const email = `twice-${randomUUID().slice(0, 8)}@example.com`;
    const session = linkSession(email);
    const payload = JSON.stringify({ id: `evt_${randomUUID()}`, object: "event", api_version: null, created: Math.floor(Date.now() / 1000), livemode: true, type: "checkout.session.completed", data: { object: session } });
    // The site's endpoint and STRIPE_WEBHOOK_SECRET's both deliver the same event.
    expect((await POST(signedPayload(payload, OLD))).status).toBe(200);
    const res = await POST(signedPayload(payload, SECRET));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ duplicate: true });
    const receipts = (await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email))).filter((e) => e.kind === "receipt");
    expect(receipts).toHaveLength(1);
    await db.delete(schema.settings).where(eq(schema.settings.key, "stripeWebhook:test"));
  });

  it("takes over an event whose handler died part-way, but not one still being handled", async () => {
    const db = await getDb();
    const email = `stuck-${randomUUID().slice(0, 8)}@example.com`;
    const session = linkSession(email);
    const eventId = `evt_${randomUUID()}`;
    const payload = JSON.stringify({ id: eventId, object: "event", api_version: null, created: Math.floor(Date.now() / 1000), livemode: true, type: "checkout.session.completed", data: { object: session } });
    // Another delivery is being handled right now: Stripe is asked to retry this one later.
    await db.insert(schema.rateLimits).values({ key: `stripe-event:${eventId}`, count: 0, windowStart: new Date() });
    expect((await POST(signedPayload(payload, SECRET))).status).toBe(409);
    // That handler died (e.g. a timeout) without finishing: after the lease, the retry handles the event.
    await db.update(schema.rateLimits).set({ windowStart: new Date(Date.now() - 10 * 60_000) }).where(eq(schema.rateLimits.key, `stripe-event:${eventId}`));
    expect((await POST(signedPayload(payload, SECRET))).status).toBe(200);
    expect((await ordersFor(session.id))[0].status).toBe("paid");
    // Handled: later copies are acknowledged as duplicates.
    expect(await (await POST(signedPayload(payload, SECRET))).json()).toMatchObject({ duplicate: true });
  });

  it("lets Stripe's retry of a failed event run it again", async () => {
    const email = `retry-${randomUUID().slice(0, 8)}@example.com`;
    // Paid for a course that no longer exists: handling fails (500) each time, so it isn't marked handled.
    const session = linkSession(email, { metadata: { source: PAYMENT_LINK_SOURCE, courseId: randomUUID(), courseSlug: course.slug } });
    const payload = JSON.stringify({ id: `evt_${randomUUID()}`, object: "event", api_version: null, created: Math.floor(Date.now() / 1000), livemode: true, type: "checkout.session.completed", data: { object: session } });
    expect((await POST(signedPayload(payload, SECRET))).status).toBe(500);
    expect((await POST(signedPayload(payload, SECRET))).status).toBe(500);
  });

  it("accepts events signed with the secret of the endpoint the sync created", async () => {
    const db = await getDb();
    await db
      .insert(schema.settings)
      .values({ key: "stripeWebhook:test", value: { v: 1, endpointId: "we_auto", url: "https://principe.example/api/stripe/webhook", secret: STORED_SECRET, createdAt: new Date().toISOString() } })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value: { v: 1, endpointId: "we_auto", url: "https://principe.example/api/stripe/webhook", secret: STORED_SECRET, createdAt: new Date().toISOString() } },
      });
    // STRIPE_WEBHOOK_SECRET's endpoint hasn't delivered anything yet, so the site's endpoint is still handled.
    await db.delete(schema.settings).where(eq(schema.settings.key, "stripeWebhook:envVerified:live"));
    const session = linkSession(`stored-${randomUUID().slice(0, 8)}@example.com`);
    // Both the env secret and the stored one are accepted; anything else isn't.
    expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: session } }, STORED_SECRET))).status).toBe(200);
    expect((await ordersFor(session.id))[0].status).toBe("paid");
    expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: session } }, "whsec_someone_else"))).status).toBe(400);

    delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const another = linkSession(`stored-only-${randomUUID().slice(0, 8)}@example.com`);
      expect((await POST(signedRequest({ type: "checkout.session.completed", data: { object: another } }, STORED_SECRET))).status).toBe(200);
      expect((await ordersFor(another.id))[0].status).toBe("paid");
    } finally {
      process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    }
  });

  describe("/buy/<slug>", () => {
    const buy = (slug: string, query = "") => BUY(new Request(`https://principe.example/buy/${slug}${query}`), { params: Promise.resolve({ slug }) });
    const storeLink = async (overrides: Partial<StoredPaymentLink> = {}) => {
      const db = await getDb();
      const value: StoredPaymentLink = {
        v: 1,
        courseId: course.id,
        mode: "test",
        productId: "prod_x",
        priceId: "price_x",
        paymentLinkId: "plink_x",
        url: "https://buy.stripe.com/test_abc",
        unitAmountCents: course.priceCents,
        currency: "usd",
        active: true,
        syncedAt: new Date().toISOString(),
        ...overrides,
      };
      const key = paymentLinkKey("test", course.id);
      await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
    };

    it("sends buyers to the course's Stripe link with their email filled in", async () => {
      await storeLink();
      const res = await buy(course.slug, `?email=${encodeURIComponent("Reader+1@Example.com")}`);
      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(`${location.origin}${location.pathname}`).toBe("https://buy.stripe.com/test_abc");
      expect(location.searchParams.get("prefilled_email")).toBe("reader+1@example.com");
      // A malformed email is dropped, not passed on.
      expect(new URL((await buy(course.slug, "?email=not-an-email")).headers.get("location")!).searchParams.has("prefilled_email")).toBe(false);
      expect(location.searchParams.has("client_reference_id")).toBe(false);
    });

    it("tags checkouts from a sales agent's link (?ref=, or their cookie) for the agent", async () => {
      await storeLink();
      const db = await getDb();
      await db.insert(schema.salesAgents).values({ email: "jane27-agent@example.com", name: "Jane Agent", code: "JANE27", status: "approved" }).onConflictDoNothing();
      const ref = new URL((await buy(course.slug, "?ref=jane27")).headers.get("location")!);
      expect(ref.searchParams.get("client_reference_id")).toBe("agent_JANE27");
      const withCookie = await BUY(new Request(`https://principe.example/buy/${course.slug}`, { headers: { cookie: "pa_vid=abc; pa_agent=SAM42" } }), {
        params: Promise.resolve({ slug: course.slug }),
      });
      expect(new URL(withCookie.headers.get("location")!).searchParams.get("client_reference_id")).toBe("agent_SAM42");
      // Another site's tag that isn't an agent's code doesn't replace the agent in the cookie.
      const junk = await BUY(new Request(`https://principe.example/buy/${course.slug}?ref=launch2025`, { headers: { cookie: "pa_agent=SAM42" } }), {
        params: Promise.resolve({ slug: course.slug }),
      });
      expect(new URL(junk.headers.get("location")!).searchParams.get("client_reference_id")).toBe("agent_SAM42");
      // Not a code: ignored.
      expect(new URL((await buy(course.slug, "?ref=no%20way")).headers.get("location")!).searchParams.has("client_reference_id")).toBe(false);
    });

    it("falls back to the sales page when the link is stale, off or Stripe isn't connected", async () => {
      await storeLink({ unitAmountCents: course.priceCents + 100 });
      expect((await buy(course.slug)).headers.get("location")).toBe(`https://principe.example/courses/${course.slug}#enroll`);
      await storeLink({ active: false });
      expect((await buy(course.slug)).headers.get("location")).toBe(`https://principe.example/courses/${course.slug}#enroll`);

      await storeLink();
      delete process.env.STRIPE_SECRET_KEY;
      try {
        expect((await buy(course.slug)).headers.get("location")).toBe(`https://principe.example/courses/${course.slug}#enroll`);
      } finally {
        process.env.STRIPE_SECRET_KEY = "sk_test_principe_unit_tests_only";
      }
    });

    it("sends unknown or bad slugs to the catalog", async () => {
      expect((await buy("no-such-course")).headers.get("location")).toBe("https://principe.example/courses");
      expect((await buy("../admin")).headers.get("location")).toBe("https://principe.example/courses");
      expect((await buy("Bad Slug")).headers.get("location")).toBe("https://principe.example/courses");
    });
  });

  it("fills {{buy_link:<slug>}} in emails, with the reader's email for that reader", () => {
    const body = "Start [here]({{buy_link:ai-essentials}}) or {{ buy_link:ai-for-business }}. {{buy_link}} {{buy_link: AI_Essentials }} {{buy_link:}}";
    expect(fillTemplate(body, defaultTemplateVars("Principe"))).toBe(
      "Start [here](https://principe.example/buy/ai-essentials) or https://principe.example/buy/ai-for-business.  https://principe.example/buy/ai-essentials ",
    );
    // Text the owner typed keeps double braces it doesn't mean as placeholders (e.g. a prompt template).
    expect(fillTemplate("Hi {{firstName}}: reply to {{name}} at {{company}} {{x:y}}", { firstName: "Ana" }, false, true)).toBe(
      "Hi Ana: reply to {{name}} at {{company}} {{x:y}}",
    );
    // `{{word: text}}` was never a placeholder: automation emails keep sending it as written.
    expect(fillTemplate("Try {{role: marketing manager}} and {{https://example.com}}.", defaultTemplateVars("Principe"))).toBe(
      "Try {{role: marketing manager}} and {{https://example.com}}.",
    );
    const vars = recipientTemplateVars({ name: "Ana", email: "ana+promo@example.com" }, "Principe");
    expect(fillTemplate("[Buy]({{buy_link:ai-essentials}})", vars.body)).toBe("[Buy](https://principe.example/buy/ai-essentials?email=ana%2Bpromo%40example.com)");
    // An exact per-slug value wins over the pattern.
    expect(fillTemplate("{{buy_link:x}}", { "buy_link:x": "exact", "buy_link:*": "pattern/{arg}" })).toBe("exact");
    expect(fillTemplate("{{firstName}} {{missing}}", { firstName: "Ana" })).toBe("Ana ");
  });
});
