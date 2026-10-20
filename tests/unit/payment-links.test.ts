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
  markEnvWebhookVerified,
  readLastSync,
  readPaymentLinks,
  readWebhookSecret,
  STRIPE_WEBHOOK_EVENTS,
  stripeInstallId,
  stripeModeForKey,
  syncPaymentLinks,
} from "@/lib/payment-links";

const SITE = "https://principe.example";
/** Sync options for the webhook: no STRIPE_WEBHOOK_SECRET, or the owner's own endpoint's secret (on the live site). */
const NO_ENV_SECRET = { envSecret: null, removeReplaced: true };
const OWNER_SECRET = { envSecret: "whsec_owner_made_this_endpoint", removeReplaced: true };

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
    const install = await stripeInstallId(db);
    expect(install).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.metadata).toEqual({ source: PAYMENT_LINK_SOURCE, install, courseId: course.id, courseSlug: course.slug, priceId: link.priceId });
    expect(await readLastSync(db)).toMatchObject({ mode: "test", errors: [] });
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
    const url = `${SITE}/api/stripe/webhook`;
    // Local addresses can't receive webhooks.
    expect((await sync({ siteUrl: "http://localhost:3000", webhook: NO_ENV_SECRET })).webhook?.status).toBe("skipped");
    expect(fake.created.endpoints).toBe(0);

    const first = await sync({ webhook: NO_ENV_SECRET });
    expect(first.webhook?.status).toBe("created");
    const [endpoint] = [...fake.endpoints.values()];
    expect(endpoint).toMatchObject({ url, enabled_events: STRIPE_WEBHOOK_EVENTS });
    expect(await readWebhookSecret(db, "test")).toBe(`whsec_${endpoint.id as string}_secret`);
    expect(await readWebhookSecret(db, "live")).toBeNull();

    expect((await sync({ webhook: NO_ENV_SECRET })).webhook?.status).toBe("ok");
    // Someone narrowed its events in the dashboard: they're put back.
    fake.endpoints.set(endpoint.id as string, { ...endpoint, enabled_events: ["charge.refunded"] });
    expect((await sync({ webhook: NO_ENV_SECRET })).webhook?.status).toBe("updated");
    expect(fake.endpoints.get(endpoint.id as string)?.enabled_events).toEqual(STRIPE_WEBHOOK_EVENTS);
    expect(fake.created.endpoints).toBe(1);

    // A different site address with an endpoint the owner made by hand: left alone, and reported with what to do.
    fake.endpoints.set("we_manual", { id: "we_manual", url: "https://other.example/api/stripe/webhook", status: "enabled", metadata: {}, enabled_events: ["*"] });
    await db.delete(schema.settings).where(eq(schema.settings.key, "stripeWebhook:test"));
    const manual = await sync({ siteUrl: "https://other.example", webhook: NO_ENV_SECRET });
    expect(manual.webhook?.status).toBe("unmanaged");
    expect(manual.errors.join(" ")).toMatch(/STRIPE_WEBHOOK_SECRET/);
    expect(fake.endpoints.has("we_manual")).toBe(true);
    // Back on our address: our endpoint's secret was lost with the row, so it's replaced by a new one.
    expect((await sync({ webhook: NO_ENV_SECRET })).webhook?.status).toBe("created");
    expect(fake.endpoints.has(endpoint.id as string)).toBe(false);
    const current = [...fake.endpoints.values()].find((e) => e.url === url && (e.metadata as Record<string, string>).source === "principe-webhook")!;

    // STRIPE_WEBHOOK_SECRET is our own endpoint's secret: nothing changes.
    const ourSecret = (await readWebhookSecret(db, "test"))!;
    expect((await sync({ webhook: { envSecret: ourSecret, removeReplaced: true } })).webhook?.status).toBe("env");
    expect(fake.endpoints.has(current.id as string)).toBe(true);

    // Another secret, but nothing else at our address gets the events (a wrong or other-mode secret): ours stays.
    expect((await sync({ webhook: OWNER_SECRET })).webhook?.status).toBe("env");
    expect(fake.endpoints.has(current.id as string)).toBe(true);
    // The owner's endpoint exists and gets every event, but hasn't delivered one yet: still kept.
    fake.endpoints.set("we_owner", { id: "we_owner", url, status: "enabled", metadata: {}, enabled_events: ["*"] });
    expect((await sync({ webhook: OWNER_SECRET })).webhook?.status).toBe("env");
    expect(fake.endpoints.has(current.id as string)).toBe(true);
    // Once it has, the build step still leaves ours alone (the deployment with the secret isn't live yet)...
    await markEnvWebhookVerified(db, "test", OWNER_SECRET.envSecret);
    expect((await sync({ webhook: { ...OWNER_SECRET, removeReplaced: false } })).webhook?.status).toBe("env");
    expect(fake.endpoints.has(current.id as string)).toBe(true);
    // ...and the live site retires it.
    expect((await sync({ webhook: OWNER_SECRET })).webhook?.status).toBe("env");
    expect(fake.endpoints.has(current.id as string)).toBe(false);
    expect(await readWebhookSecret(db, "test")).toBeNull();
    expect(fake.endpoints.has("we_owner")).toBe(true);

    // A secret from the other mode with nothing in this one: the site makes its own so payments are still confirmed.
    fake.endpoints.delete("we_owner");
    expect((await sync({ webhook: OWNER_SECRET })).webhook?.status).toBe("created");
    expect(await readWebhookSecret(db, "test")).not.toBeNull();
    const kept = [...fake.endpoints.values()].find((e) => e.url === url && (e.metadata as Record<string, string>).source === "principe-webhook")!;
    // While it's kept, it's kept working: disabled in the dashboard, it's switched back on.
    fake.endpoints.set(kept.id as string, { ...kept, status: "disabled" });
    expect((await sync({ webhook: OWNER_SECRET })).webhook?.status).toBe("env");
    expect(fake.endpoints.get(kept.id as string)).toMatchObject({ disabled: false });

    // A hand-made endpoint gets every event but its secret was never proven in this mode (a new secret, say): the
    // site's endpoint is made / kept alongside it rather than trusting the secret blindly.
    await db.delete(schema.settings).where(eq(schema.settings.key, "stripeWebhook:envVerified:test"));
    fake.endpoints.delete(kept.id as string);
    await db.delete(schema.settings).where(eq(schema.settings.key, "stripeWebhook:test"));
    fake.endpoints.set("we_owner2", { id: "we_owner2", url, status: "enabled", metadata: {}, enabled_events: ["*"] });
    expect((await sync({ webhook: OWNER_SECRET })).webhook?.status).toBe("created");
    // Proven: the live site retires the site's endpoint.
    await markEnvWebhookVerified(db, "test", OWNER_SECRET.envSecret);
    expect((await sync({ webhook: OWNER_SECRET })).webhook?.detail).toMatch(/Removed/);
    expect(await readWebhookSecret(db, "test")).toBeNull();
    expect(fake.endpoints.has("we_owner2")).toBe(true);
  });

  it("refuses to point live links at a local or plain-http address", async () => {
    await expect(syncPaymentLinks({ db, stripe: fakeStripe().stripe, mode: "live", siteUrl: "http://localhost:3000", currency: "usd" })).rejects.toThrow(
      /public https address/,
    );
    await expect(syncPaymentLinks({ db, stripe: fakeStripe().stripe, mode: "live", siteUrl: "https://localhost", currency: "usd" })).rejects.toThrow(
      /public https address/,
    );
  });

  it("keeps a restored database's links: they name its courses", async () => {
    const [course] = await paidCourses();
    const link = (await readPaymentLinks(db, "test")).get(course.id)!;
    const oldInstall = await stripeInstallId(db);
    // Restored from before the first sync: install id and stored links gone, Stripe objects still there.
    await db.delete(schema.settings).where(eq(schema.settings.key, "stripeInstallId"));
    for (const c of await paidCourses()) await db.delete(schema.settings).where(eq(schema.settings.key, paymentLinkKey("test", c.id)));
    const before = { ...fake.created };
    const result = await sync();
    expect(result.errors).toEqual([]);
    expect(fake.created.links).toBe(before.links);
    const newInstall = await stripeInstallId(db);
    expect(newInstall).not.toBe(oldInstall);
    expect((await readPaymentLinks(db, "test")).get(course.id)?.paymentLinkId).toBe(link.paymentLinkId);
    // Restamped with the new install id.
    expect(fake.links.get(link.paymentLinkId)?.metadata.install).toBe(newInstall);

    // A copy of this database (same course ids) returning buyers somewhere else, e.g. a local one: not ours.
    const copy = await fake.stripe.paymentLinks.create({
      line_items: [{ price: link.priceId, quantity: 1 }],
      metadata: { source: PAYMENT_LINK_SOURCE, install: "a-local-copy", courseId: course.id, courseSlug: course.slug, priceId: link.priceId },
      after_completion: { type: "redirect", redirect: { url: "http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}" } },
    });
    const again = await sync();
    expect(again.retired).toBe(0);
    expect(fake.links.get(copy.id)?.active).toBe(true);
    expect(fake.links.get(copy.id)?.metadata.install).toBe("a-local-copy");
  });

  it("never runs two syncs at once, even when one outlives its lease", async () => {
    const stalled = fakeStripe();
    // While this sync lists links, another one takes over its lease (as if it had run past the TTL).
    const list = stalled.stripe.paymentLinks.list.bind(stalled.stripe.paymentLinks);
    (stalled.stripe.paymentLinks as { list: unknown }).list = (params: Stripe.PaymentLinkListParams) => {
      const page = list(params);
      const all = page.autoPagingToArray.bind(page);
      return Object.assign(page, {
        autoPagingToArray: async (o: { limit: number }) => {
          await db.update(schema.settings).set({ value: { token: "someone-else" } }).where(eq(schema.settings.key, "stripePaymentLinkSync:lock"));
          return all(o);
        },
      });
    };
    await expect(syncPaymentLinks({ db, stripe: stalled.stripe, mode: "live", siteUrl: SITE, currency: "usd" })).rejects.toThrow(/Lost the payment-link sync lock/);
    expect(stalled.created.links).toBe(0);
    await db.delete(schema.settings).where(eq(schema.settings.key, "stripePaymentLinkSync:lock"));
  });

  it("goes again when a change arrives while it's running", async () => {
    const slow = fakeStripe();
    let lists = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const list = slow.stripe.paymentLinks.list.bind(slow.stripe.paymentLinks);
    (slow.stripe.paymentLinks as { list: unknown }).list = (params: Stripe.PaymentLinkListParams) => {
      lists++;
      const page = list(params);
      const first = lists === 1;
      return Object.assign(
        (async () => (first ? gate.then(() => page) : page))(),
        { autoPagingToArray: async (o: { limit: number }) => (first ? gate.then(() => page.autoPagingToArray(o)) : page.autoPagingToArray(o)) },
      );
    };
    const live = (o: Partial<Parameters<typeof syncPaymentLinks>[0]> = {}) => syncPaymentLinks({ db, stripe: slow.stripe, mode: "live", siteUrl: SITE, currency: "usd", ...o });
    const running = live();
    await new Promise((r) => setTimeout(r, 50));
    // A course change while it runs: this caller doesn't wait, but asks the running sync to go again.
    await expect(live({ lockWaitMs: 0 })).rejects.toThrow(/still running/);
    release();
    expect((await running).errors).toEqual([]);
    expect(lists).toBe(2);
  });

  it("never touches the links or webhook of another database on the same Stripe account", async () => {
    const other = fakeStripe();
    // Another database's link (e.g. a local copy) for a course this one doesn't have, and its own endpoint at our address.
    const foreignLink = await other.stripe.paymentLinks.create({
      line_items: [{ price: "price_foreign", quantity: 1 }],
      metadata: { source: PAYMENT_LINK_SOURCE, install: "another-database", courseId: randomUUID(), courseSlug: "elsewhere", priceId: "price_foreign" },
    });
    other.endpoints.set("we_foreign", { id: "we_foreign", url: `${SITE}/api/stripe/webhook`, status: "enabled", metadata: { source: "principe-webhook", install: "another-database" }, enabled_events: STRIPE_WEBHOOK_EVENTS });
    await db.delete(schema.settings).where(eq(schema.settings.key, "stripeWebhook:live"));
    const result = await syncPaymentLinks({ db, stripe: other.stripe, mode: "live", siteUrl: SITE, currency: "usd", webhook: NO_ENV_SECRET });
    expect(result.retired).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(other.links.get(foreignLink.id)?.active).toBe(true);
    expect(result.webhook?.status).toBe("unmanaged");
    expect(other.endpoints.has("we_foreign")).toBe(true);
  });

  it("stops between Stripe calls when asked, and records why", async () => {
    const stop = new AbortController();
    stop.abort(new Error("build step timed out"));
    await expect(sync({ signal: stop.signal })).rejects.toThrow(/timed out/);
    expect(await readLastSync(db)).toMatchObject({ errors: ["build step timed out"] });
    // The lock was released: the next sync runs straight away.
    expect((await sync({ lockWaitMs: 0 })).errors).toEqual([]);
    expect(await readLastSync(db)).toMatchObject({ errors: [] });
  });

  it("runs one sync at a time, so overlapping syncs never duplicate links", async () => {
    const other = fakeStripe();
    const courses = await paidCourses();
    const live = (o: Partial<Parameters<typeof syncPaymentLinks>[0]> = {}) =>
      syncPaymentLinks({ db, stripe: other.stripe, mode: "live", siteUrl: SITE, currency: "usd", ...o });
    const results = await Promise.all([live(), live(), live()]);
    for (const r of results) expect(r.errors).toEqual([]);
    expect(other.created.links).toBe(courses.length);
    expect(other.created.products).toBe(courses.length);
    expect([...other.links.values()].filter((l) => l.active)).toHaveLength(courses.length);

    // A sync that can't get its turn gives up with a clear message; a lock left by a crashed sync is taken over.
    await db.insert(schema.settings).values({ key: "stripePaymentLinkSync:lock", value: { token: "someone-else" }, updatedAt: new Date() });
    await expect(live({ lockWaitMs: 50 })).rejects.toThrow(/still running/);
    await db.update(schema.settings).set({ updatedAt: new Date(Date.now() - 10 * 60_000) }).where(eq(schema.settings.key, "stripePaymentLinkSync:lock"));
    expect((await live({ lockWaitMs: 50 })).errors).toEqual([]);
    expect(await db.select().from(schema.settings).where(eq(schema.settings.key, "stripePaymentLinkSync:lock"))).toHaveLength(0);
  });

  it("tells test keys from live keys", () => {
    expect(stripeModeForKey("sk_test_123")).toBe("test");
    expect(stripeModeForKey("rk_test_123")).toBe("test");
    expect(stripeModeForKey("sk_live_123")).toBe("live");
    expect(stripeModeForKey("rk_live_123")).toBe("live");
  });
});
