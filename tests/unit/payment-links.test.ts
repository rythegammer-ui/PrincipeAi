import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getDb, schema } from "@/db";
import {
  linkMatchesCourse,
  paymentLinkKey,
  PAYMENT_LINK_SOURCE,
  productIdFor,
  readPaymentLinks,
  readWebhookSecret,
  STRIPE_WEBHOOK_EVENTS,
  stripeModeForKey,
  syncPaymentLinks,
} from "@/lib/payment-links";

const SITE = "https://principe.example";

/** An in-memory Stripe with just the calls the sync makes. `created` counts objects created per kind. */
function fakeStripe() {
  let n = 0;
  const next = (prefix: string) => `${prefix}_${++n}`;
  const missing = (what: string, id: string) => Object.assign(new Error(`No such ${what}: '${id}'`), { code: "resource_missing", statusCode: 404 });
  const listResult = <T>(items: T[]) => Object.assign(Promise.resolve({ data: items }), { autoPagingToArray: async () => items });
  const products = new Map<string, Record<string, unknown>>();
  const prices = new Map<string, Record<string, unknown>>();
  const links = new Map<string, Record<string, unknown> & { metadata: Record<string, string>; active: boolean }>();
  const endpoints = new Map<string, Record<string, unknown>>();
  const created = { products: 0, prices: 0, links: 0, endpoints: 0 };

  const stripe = {
    products: {
      retrieve: async (id: string) => {
        const p = products.get(id);
        if (!p) throw missing("product", id);
        return p;
      },
      create: async (params: Record<string, unknown>) => {
        created.products++;
        const p = { object: "product", active: true, description: null, url: null, metadata: {}, ...params, id: (params.id as string) ?? next("prod") };
        products.set(p.id, p);
        return p;
      },
      update: async (id: string, params: Record<string, unknown>) => {
        const p = { ...products.get(id), ...params };
        products.set(id, p);
        return p;
      },
    },
    prices: {
      list: (params: { lookup_keys: string[] }) => listResult([...prices.values()].filter((p) => params.lookup_keys.includes(p.lookup_key as string))),
      create: async (params: Record<string, unknown>) => {
        created.prices++;
        const p = { object: "price", active: true, metadata: {}, ...params, id: next("price") };
        prices.set(p.id, p);
        return p;
      },
      update: async (id: string, params: Record<string, unknown>) => {
        const p = { ...prices.get(id), ...params };
        prices.set(id, p);
        return p;
      },
    },
    paymentLinks: {
      list: (params: { active?: boolean }) => listResult([...links.values()].filter((l) => params.active === undefined || l.active === params.active)),
      retrieve: async (id: string) => {
        const l = links.get(id);
        if (!l) throw missing("payment_link", id);
        return l;
      },
      create: async (params: Record<string, unknown> & { metadata: Record<string, string> }) => {
        created.links++;
        const id = next("plink");
        const l = { object: "payment_link", active: true, url: `https://buy.stripe.com/test_${id}`, ...params, id };
        links.set(id, l);
        return l;
      },
      update: async (id: string, params: Record<string, unknown>) => {
        const l = { ...links.get(id)!, ...params };
        links.set(id, l as typeof l & { metadata: Record<string, string>; active: boolean });
        return l;
      },
    },
    webhookEndpoints: {
      list: () => listResult([...endpoints.values()]),
      create: async (params: Record<string, unknown>) => {
        created.endpoints++;
        const id = next("we");
        const e = { object: "webhook_endpoint", status: "enabled", metadata: {}, ...params, id };
        // Stripe reveals the secret only in the create response.
        endpoints.set(id, e);
        return { ...e, secret: `whsec_${id}_secret` };
      },
      update: async (id: string, params: Record<string, unknown>) => {
        const e = { ...endpoints.get(id), ...params };
        endpoints.set(id, e);
        return e;
      },
      del: async (id: string) => {
        endpoints.delete(id);
        return { id, deleted: true };
      },
    },
  };
  return { stripe: stripe as unknown as Stripe, products, prices, links, endpoints, created };
}

async function paidCourses() {
  const db = await getDb();
  const rows = await db.select().from(schema.courses);
  return rows.filter((c) => c.published && c.priceCents > 0);
}

describe("Stripe payment-link sync", () => {
  const fake = fakeStripe();
  let db: Awaited<ReturnType<typeof getDb>>;
  const sync = (overrides: Partial<Parameters<typeof syncPaymentLinks>[0]> = {}) =>
    syncPaymentLinks({ db, stripe: fake.stripe, mode: "test", siteUrl: `${SITE}/`, currency: "usd", ...overrides });

  beforeAll(async () => {
    db = await getDb();
  }, 60_000);

  it("creates a product, price and payment link for every paid, published course", async () => {
    const courses = await paidCourses();
    expect(courses.length).toBeGreaterThan(0);
    const result = await sync();
    expect(result.errors).toEqual([]);
    for (const course of courses) {
      const entry = result.courses.find((c) => c.courseId === course.id);
      expect(entry).toMatchObject({ status: "created" });
      expect(entry?.url).toMatch(/^https:\/\/buy\.stripe\.com\//);
    }
    expect(fake.created).toMatchObject({ products: courses.length, prices: courses.length, links: courses.length });

    const stored = await readPaymentLinks(db, "test");
    const course = courses[0];
    const link = stored.get(course.id)!;
    expect(link).toMatchObject({ courseId: course.id, mode: "test", productId: productIdFor(course.id), unitAmountCents: course.priceCents, currency: "usd", active: true });
    expect(linkMatchesCourse(link, course, "usd")).toBe(true);
    // Live-mode rows are separate.
    expect((await readPaymentLinks(db, "live")).size).toBe(0);

    const created = fake.links.get(link.paymentLinkId)!;
    expect(created.metadata).toEqual({ source: PAYMENT_LINK_SOURCE, courseId: course.id, courseSlug: course.slug, priceId: link.priceId });
    expect(created.after_completion).toEqual({ type: "redirect", redirect: { url: `${SITE}/checkout/success?session_id={CHECKOUT_SESSION_ID}` } });
    expect(created.line_items).toEqual([{ price: link.priceId, quantity: 1 }]);
    expect(fake.prices.get(link.priceId)).toMatchObject({ unit_amount: course.priceCents, currency: "usd", product: productIdFor(course.id) });
  });

  it("changes nothing when run again", async () => {
    const before = { ...fake.created };
    const result = await sync();
    expect(result.errors).toEqual([]);
    expect(result.courses.filter((c) => c.url).every((c) => c.status === "unchanged")).toBe(true);
    expect(fake.created).toEqual(before);
    expect(result.retired).toBe(0);
  });

  it("makes a new price and link when the price changes, and switches the old link off", async () => {
    const [course] = await paidCourses();
    const old = (await readPaymentLinks(db, "test")).get(course.id)!;
    const newPrice = course.priceCents + 1000;
    await db.update(schema.courses).set({ priceCents: newPrice }).where(eq(schema.courses.id, course.id));
    // Until the sync runs, the stored link no longer matches the course.
    expect(linkMatchesCourse(old, { ...course, priceCents: newPrice }, "usd")).toBe(false);

    const result = await sync();
    expect(result.courses.find((c) => c.courseId === course.id)?.status).toBe("created");
    expect(result.retired).toBe(1);
    const fresh = (await readPaymentLinks(db, "test")).get(course.id)!;
    expect(fresh.paymentLinkId).not.toBe(old.paymentLinkId);
    expect(fresh.unitAmountCents).toBe(newPrice);
    expect(fake.links.get(old.paymentLinkId)?.active).toBe(false);
    expect(fake.links.get(old.paymentLinkId)?.inactive_message).toContain(`${SITE}/courses`);

    // Back to the old price: the old price and link are reused, not duplicated.
    await db.update(schema.courses).set({ priceCents: course.priceCents }).where(eq(schema.courses.id, course.id));
    const prices = fake.created.prices;
    const back = await sync();
    expect(back.courses.find((c) => c.courseId === course.id)?.status).toBe("updated");
    expect(fake.created.prices).toBe(prices);
    expect((await readPaymentLinks(db, "test")).get(course.id)?.paymentLinkId).toBe(old.paymentLinkId);
    expect(fake.links.get(fresh.paymentLinkId)?.active).toBe(false);
  });

  it("switches a link off while its course is unpublished and back on after", async () => {
    const [course] = await paidCourses();
    const link = (await readPaymentLinks(db, "test")).get(course.id)!;
    await db.update(schema.courses).set({ published: false }).where(eq(schema.courses.id, course.id));
    const off = await sync();
    expect(off.courses.find((c) => c.courseId === course.id)).toMatchObject({ status: "deactivated", url: null });
    expect(fake.links.get(link.paymentLinkId)?.active).toBe(false);
    expect((await readPaymentLinks(db, "test")).get(course.id)?.active).toBe(false);

    await db.update(schema.courses).set({ published: true }).where(eq(schema.courses.id, course.id));
    const links = fake.created.links;
    const on = await sync();
    expect(on.courses.find((c) => c.courseId === course.id)?.status).toBe("updated");
    expect(fake.created.links).toBe(links);
    expect(fake.links.get(link.paymentLinkId)?.active).toBe(true);
    expect((await readPaymentLinks(db, "test")).get(course.id)).toMatchObject({ active: true, paymentLinkId: link.paymentLinkId });
  });

  it("finds its links again when the database lost them", async () => {
    const [course] = await paidCourses();
    const link = (await readPaymentLinks(db, "test")).get(course.id)!;
    await db.delete(schema.settings).where(eq(schema.settings.key, paymentLinkKey("test", course.id)));
    const before = { ...fake.created };
    await sync();
    expect(fake.created).toEqual(before);
    expect((await readPaymentLinks(db, "test")).get(course.id)?.paymentLinkId).toBe(link.paymentLinkId);
  });

  it("retires the link of a deleted course", async () => {
    const [course] = await db
      .insert(schema.courses)
      .values({ slug: `temp-${randomUUID().slice(0, 8)}`, title: "Temporary Course", subtitle: "", description: "", priceCents: 1900, published: true })
      .returning();
    await sync();
    const link = (await readPaymentLinks(db, "test")).get(course.id)!;
    expect(fake.links.get(link.paymentLinkId)?.active).toBe(true);

    await db.delete(schema.courses).where(eq(schema.courses.id, course.id));
    const result = await sync();
    expect(result.retired).toBe(1);
    expect(fake.links.get(link.paymentLinkId)?.active).toBe(false);
    expect((await readPaymentLinks(db, "test")).has(course.id)).toBe(false);
  });

  it("creates its own webhook endpoint once, and stays out of the way of one set up by hand", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Local addresses can't receive webhooks.
    expect((await sync({ siteUrl: "http://localhost:3000", webhook: { envSecretSet: false } })).webhook?.status).toBe("skipped");
    // STRIPE_WEBHOOK_SECRET already set: nothing to do.
    expect((await sync({ webhook: { envSecretSet: true } })).webhook?.status).toBe("env");
    expect(fake.created.endpoints).toBe(0);

    const first = await sync({ webhook: { envSecretSet: false } });
    expect(first.webhook?.status).toBe("created");
    const [endpoint] = [...fake.endpoints.values()];
    expect(endpoint).toMatchObject({ url: `${SITE}/api/stripe/webhook`, enabled_events: STRIPE_WEBHOOK_EVENTS });
    expect(await readWebhookSecret(db, "test")).toBe(`whsec_${endpoint.id as string}_secret`);
    expect(await readWebhookSecret(db, "live")).toBeNull();

    expect((await sync({ webhook: { envSecretSet: false } })).webhook?.status).toBe("ok");
    // Someone narrowed its events in the dashboard: they're put back.
    fake.endpoints.set(endpoint.id as string, { ...endpoint, enabled_events: ["charge.refunded"] });
    expect((await sync({ webhook: { envSecretSet: false } })).webhook?.status).toBe("updated");
    expect(fake.endpoints.get(endpoint.id as string)?.enabled_events).toEqual(STRIPE_WEBHOOK_EVENTS);
    expect(fake.created.endpoints).toBe(1);

    // A different site address with an endpoint the owner made by hand: left alone, and the owner is told why.
    fake.endpoints.set("we_manual", { id: "we_manual", url: "https://other.example/api/stripe/webhook", status: "enabled", metadata: {}, enabled_events: ["*"] });
    await db.delete(schema.settings).where(eq(schema.settings.key, "stripeWebhook:test"));
    const manual = await sync({ siteUrl: "https://other.example", webhook: { envSecretSet: false } });
    expect(manual.webhook?.status).toBe("unmanaged");
    expect(fake.endpoints.has("we_manual")).toBe(true);
  });

  it("tells test keys from live keys", () => {
    expect(stripeModeForKey("sk_test_123")).toBe("test");
    expect(stripeModeForKey("rk_test_123")).toBe("test");
    expect(stripeModeForKey("sk_live_123")).toBe("live");
    expect(stripeModeForKey("rk_live_123")).toBe("live");
  });
});
