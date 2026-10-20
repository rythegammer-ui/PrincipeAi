/**
 * Stripe Payment Links for courses: one Product, Price and Payment Link per paid, published course, so the owner
 * can put a buy link in any email. `syncPaymentLinks` creates them and keeps them in step with the catalog. It runs
 * on every production build (scripts/migrate.ts), from Admin → Courses, and after a course's price or status
 * changes. Nobody edits these links by hand.
 *
 * Stored as one row per course and Stripe mode in the key/value `settings` table
 * (`stripePaymentLink:<test|live>:<courseId>`; getSettings() ignores these keys). The Stripe objects carry the same
 * ids in their metadata, so the webhook can tell which course a payment-link checkout was for.
 *
 * The sync also creates the Stripe webhook endpoint when STRIPE_WEBHOOK_SECRET isn't set, and keeps its signing
 * secret in `settings` (`stripeWebhook:<mode>`), since Stripe only reveals a secret when the endpoint is created.
 *
 * Every object it manages is stamped with this database's install id (`metadata.install`). Another database using
 * the same Stripe account (a local copy, a preview with its own database) only ever touches its own objects, and
 * the webhook ignores checkouts from links it didn't make. Links naming one of this database's courses count as
 * its own whatever their install id (course ids are random per database), so a restored database keeps them.
 *
 * No "server-only": the build script imports this. Callers pass the database and the Stripe client.
 * OWNER: courses & payments.
 */
import { createHash, randomUUID } from "node:crypto";
import { and, asc, eq, like, lt, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import Stripe from "stripe";
import { z } from "zod";
import * as schema from "../db/schema";

type DB = PostgresJsDatabase<typeof schema>;

export type StripeMode = "test" | "live";

/** `metadata.source` on the Stripe objects this app manages. */
export const PAYMENT_LINK_SOURCE = "principe-payment-link";
const WEBHOOK_SOURCE = "principe-webhook";

/** Every event the webhook route handles (src/app/api/stripe/webhook/route.ts). */
export const STRIPE_WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
];

/** The mode a Stripe secret key works in (test keys start sk_test_ / rk_test_). */
export function stripeModeForKey(key: string): StripeMode {
  return key.startsWith("sk_test_") || key.startsWith("rk_test_") ? "test" : "live";
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

const LINK_PREFIX = "stripePaymentLink:";
const WEBHOOK_PREFIX = "stripeWebhook:";

export function paymentLinkKey(mode: StripeMode, courseId: string): string {
  return `${LINK_PREFIX}${mode}:${courseId}`;
}

const StoredLinkSchema = z.object({
  v: z.literal(1),
  courseId: z.string(),
  mode: z.enum(["test", "live"]),
  productId: z.string(),
  priceId: z.string(),
  paymentLinkId: z.string(),
  url: z.string(),
  unitAmountCents: z.number().int(),
  currency: z.string(),
  /** False while the course is unpublished or free: the link is switched off in Stripe and comes back on with it. */
  active: z.boolean(),
  syncedAt: z.string(),
});
export type StoredPaymentLink = z.infer<typeof StoredLinkSchema>;

const StoredWebhookSchema = z.object({
  v: z.literal(1),
  endpointId: z.string(),
  url: z.string(),
  secret: z.string().startsWith("whsec_"),
  createdAt: z.string(),
});
type StoredWebhook = z.infer<typeof StoredWebhookSchema>;

const INSTALL_KEY = "stripeInstallId";
const LAST_SYNC_KEY = "stripePaymentLinkSync:last";

/** This database's random install id (created on first use), stamped on the Stripe objects it manages. */
export async function stripeInstallId(db: DB): Promise<string> {
  const read = async () => {
    const [row] = await db.select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, INSTALL_KEY)).limit(1);
    return typeof row?.value === "string" && row.value ? row.value : null;
  };
  const existing = await read();
  if (existing) return existing;
  await db.insert(schema.settings).values({ key: INSTALL_KEY, value: randomUUID(), updatedAt: new Date() }).onConflictDoNothing();
  const created = await read();
  if (!created) throw new Error("Couldn't record this site's Stripe install id");
  return created;
}

const LastSyncSchema = z.object({ at: z.string(), mode: z.enum(["test", "live"]), errors: z.array(z.string()) });
export type LastPaymentLinkSync = z.infer<typeof LastSyncSchema>;

/** When the last sync ran and what went wrong, if anything (shown in Admin → Courses). */
export async function readLastSync(db: DB): Promise<LastPaymentLinkSync | null> {
  const [row] = await db.select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, LAST_SYNC_KEY)).limit(1);
  const parsed = LastSyncSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : null;
}

async function upsertSetting(db: DB, key: string, value: unknown) {
  await db
    .insert(schema.settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
}

/** The stored payment links for `mode`, by course id (rows that don't parse are skipped). */
export async function readPaymentLinks(db: DB, mode: StripeMode): Promise<Map<string, StoredPaymentLink>> {
  const rows = await db
    .select({ key: schema.settings.key, value: schema.settings.value })
    .from(schema.settings)
    .where(like(schema.settings.key, `${LINK_PREFIX}${mode}:%`));
  const out = new Map<string, StoredPaymentLink>();
  for (const row of rows) {
    const parsed = StoredLinkSchema.safeParse(row.value);
    if (parsed.success && parsed.data.mode === mode) out.set(parsed.data.courseId, parsed.data);
  }
  return out;
}

async function readWebhook(db: DB, mode: StripeMode): Promise<StoredWebhook | null> {
  const [row] = await db.select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, `${WEBHOOK_PREFIX}${mode}`)).limit(1);
  const parsed = StoredWebhookSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : null;
}

/** Signing secret of the webhook endpoint the sync created for `mode`, if any. */
export async function readWebhookSecret(db: DB, mode: StripeMode): Promise<string | null> {
  return (await readWebhook(db, mode))?.secret ?? null;
}

/* Proof that STRIPE_WEBHOOK_SECRET's endpoint works: the webhook route records (a fingerprint of) the secret once an
 * event of that mode verifies with it. Until then the site keeps its own endpoint, so a wrong or wrong-mode secret
 * never leaves the site without webhooks; after that the route ignores the old endpoint's copies of each event. */
const ENV_VERIFIED_PREFIX = "stripeWebhook:envVerified:";

function secretFingerprint(secret: string): string {
  return createHash("sha256").update(secret).digest("hex").slice(0, 24);
}

export async function envWebhookVerified(db: DB, mode: StripeMode, secret: string): Promise<boolean> {
  const [row] = await db.select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, `${ENV_VERIFIED_PREFIX}${mode}`)).limit(1);
  return (row?.value as { fingerprint?: unknown } | undefined)?.fingerprint === secretFingerprint(secret);
}

export async function markEnvWebhookVerified(db: DB, mode: StripeMode, secret: string): Promise<void> {
  if (await envWebhookVerified(db, mode, secret)) return;
  await upsertSetting(db, `${ENV_VERIFIED_PREFIX}${mode}`, { fingerprint: secretFingerprint(secret), at: new Date().toISOString() });
}

type LinkCourse = { published: boolean; priceCents: number };

/**
 * True when a stored link sells `course` at its current price: the course is published and paid, and the link was
 * made for this exact amount and currency. A link made before a price change is never handed out.
 */
export function linkMatchesCourse(link: StoredPaymentLink | null | undefined, course: LinkCourse, currency: string): link is StoredPaymentLink {
  return Boolean(link && link.active && course.published && course.priceCents > 0 && link.unitAmountCents === course.priceCents && link.currency === currency);
}

/* ------------------------------------------------------------------ */
/* Sync                                                                */
/* ------------------------------------------------------------------ */

export type PaymentLinkSyncStatus = "created" | "updated" | "unchanged" | "deactivated" | "not-for-sale" | "failed";

export type PaymentLinkSyncResult = {
  mode: StripeMode;
  courses: { courseId: string; slug: string; title: string; status: PaymentLinkSyncStatus; url: string | null; error?: string }[];
  /** Links for deleted courses or replaced prices that were switched off. */
  retired: number;
  webhook: { status: "created" | "updated" | "ok" | "env" | "unmanaged" | "skipped" | "failed"; detail?: string } | null;
  errors: string[];
};

type SyncCourse = { id: string; slug: string; title: string; subtitle: string; priceCents: number; published: boolean };

/** Stripe ids allow letters, digits, `_` and `-`; course ids are UUIDs. */
function hexId(courseId: string): string {
  return courseId.replace(/-/g, "").toLowerCase();
}

export function productIdFor(courseId: string): string {
  return `principe_course_${hexId(courseId)}`;
}

function priceLookupKey(courseId: string, amountCents: number, currency: string): string {
  return `principe_course_${hexId(courseId)}_${amountCents}_${currency}`;
}

function isMissing(err: unknown): boolean {
  const e = err as { code?: string; statusCode?: number } | null;
  return e?.code === "resource_missing" || e?.statusCode === 404;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function ensureProduct(stripe: Stripe, course: SyncCourse, siteUrl: string, install: string): Promise<string> {
  const id = productIdFor(course.id);
  const description = course.subtitle.trim();
  const url = `${siteUrl}/courses/${course.slug}`;
  const metadata = { source: PAYMENT_LINK_SOURCE, install, courseId: course.id, courseSlug: course.slug };
  let product: Stripe.Product | null = null;
  try {
    product = await stripe.products.retrieve(id);
  } catch (err) {
    if (!isMissing(err)) throw err;
  }
  if (!product) {
    try {
      const created = await stripe.products.create({
        id,
        name: course.title,
        ...(description ? { description } : {}),
        url,
        metadata,
      });
      return created.id;
    } catch (err) {
      // Created a moment ago by another sync: use it.
      product = await stripe.products.retrieve(id).catch(() => null);
      if (!product) throw err;
    }
  }
  const metadataOk = Object.entries(metadata).every(([k, v]) => product?.metadata[k] === v);
  if (!product.active || product.name !== course.title || (product.description ?? "") !== description || product.url !== url || !metadataOk) {
    await stripe.products.update(id, { active: true, name: course.title, description, url, metadata });
  }
  return id;
}

async function ensurePrice(stripe: Stripe, productId: string, course: SyncCourse, currency: string): Promise<string> {
  const lookupKey = priceLookupKey(course.id, course.priceCents, currency);
  const find = async () => (await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })).data[0] ?? null;
  let price = await find();
  if (!price) {
    try {
      price = await stripe.prices.create({
        product: productId,
        currency,
        unit_amount: course.priceCents,
        lookup_key: lookupKey,
        metadata: { source: PAYMENT_LINK_SOURCE, courseId: course.id },
      });
    } catch (err) {
      // Another sync created it a moment ago (lookup keys are unique).
      price = await find();
      if (!price) throw err;
    }
  }
  if (!price.active) await stripe.prices.update(price.id, { active: true });
  return price.id;
}

function linkMetadata(course: SyncCourse, priceId: string, install: string): Record<string, string> {
  return { source: PAYMENT_LINK_SOURCE, install, courseId: course.id, courseSlug: course.slug, priceId };
}

function inactiveMessage(siteUrl: string): string {
  return `This checkout link is no longer active. See ${siteUrl}/courses for our current courses and prices.`;
}

/* One sync at a time (build, Admin → Courses, the daily job and the sync after a course change can overlap): a lease
 * row in `settings`, renewed between courses and taken over if its holder died without releasing it. A sync that
 * finds the lease taken asks the running one to go again when it finishes (RESYNC_KEY), so its change isn't missed
 * even if it gives up waiting. */
const LOCK_KEY = "stripePaymentLinkSync:lock";
const RESYNC_KEY = "stripePaymentLinkSync:again";
const LOCK_TTL_MS = 3 * 60_000;
const LOCK_WAIT_MS = 60_000;

/** Thrown when another sync held the lease for longer than the caller was willing to wait (it will run again for us). */
export class PaymentLinkSyncBusyError extends Error {
  constructor() {
    super("Another payment-link sync is still running; it will pick up the latest changes when it finishes.");
    this.name = "PaymentLinkSyncBusyError";
  }
}

async function acquireSyncLock(db: DB, token: string): Promise<boolean> {
  const rows = await db
    .insert(schema.settings)
    .values({ key: LOCK_KEY, value: { token }, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value: { token }, updatedAt: new Date() },
      setWhere: lt(schema.settings.updatedAt, new Date(Date.now() - LOCK_TTL_MS)),
    })
    .returning({ key: schema.settings.key });
  return rows.length > 0;
}

/** Extends the lease; throws when another sync took it over (this one ran past the TTL), so two never run at once. */
async function renewSyncLock(db: DB, token: string): Promise<void> {
  const rows = await db
    .update(schema.settings)
    .set({ updatedAt: new Date() })
    .where(and(eq(schema.settings.key, LOCK_KEY), sql`${schema.settings.value}->>'token' = ${token}`))
    .returning({ key: schema.settings.key });
  if (rows.length === 0) throw new Error("Lost the payment-link sync lock to another sync");
}

async function takeResyncRequest(db: DB): Promise<boolean> {
  const rows = await db.delete(schema.settings).where(eq(schema.settings.key, RESYNC_KEY)).returning({ key: schema.settings.key });
  return rows.length > 0;
}

async function releaseSyncLock(db: DB, token: string): Promise<void> {
  await db.delete(schema.settings).where(and(eq(schema.settings.key, LOCK_KEY), sql`${schema.settings.value}->>'token' = ${token}`));
}

type SyncInput = {
  db: DB;
  stripe: Stripe;
  mode: StripeMode;
  /** Absolute site URL (e.g. https://principeai.com); a trailing slash is ignored. */
  siteUrl: string;
  currency: string;
  /**
   * Also look after the webhook endpoint. `envSecret` is STRIPE_WEBHOOK_SECRET (null when unset): with one set, the
   * site's own endpoint is kept if it is that endpoint, and otherwise removed, but only when `removeReplaced` (a sync
   * running on the live deployment, which can verify with the env secret; never the build step, which runs before
   * the deployment that has it goes live).
   */
  webhook?: { envSecret: string | null; removeReplaced: boolean };
  /** How long to wait for another sync to finish (default one minute). */
  lockWaitMs?: number;
  /** Stops the sync between Stripe calls (e.g. when a build step times out). */
  signal?: AbortSignal;
};

/**
 * Creates or updates the Product, Price and Payment Link of every paid, published course, switches off links for
 * courses that are unpublished, free or deleted (and links made for an old price), and stores the result. Safe to
 * run any number of times: existing Stripe objects are found again by their ids, lookup keys and metadata.
 * One course failing doesn't stop the others; failures are listed in `errors`.
 */
export async function syncPaymentLinks(input: SyncInput): Promise<PaymentLinkSyncResult> {
  const { db } = input;
  const siteUrl = input.siteUrl.replace(/\/+$/, "");
  // Buyers are sent back to this address after paying: never a local or plain-http one for real money.
  if (input.mode === "live" && !isPublicHttps(siteUrl)) {
    throw new Error(`Live payment links need the site's public https address, not ${siteUrl} (set NEXT_PUBLIC_SITE_URL).`);
  }
  const token = randomUUID();
  const deadline = Date.now() + (input.lockWaitMs ?? LOCK_WAIT_MS);
  let asked = false;
  while (!(await acquireSyncLock(db, token))) {
    if (!asked) {
      await upsertSetting(db, RESYNC_KEY, true);
      asked = true;
    }
    if (Date.now() >= deadline) throw new PaymentLinkSyncBusyError();
    input.signal?.throwIfAborted();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  try {
    let result: PaymentLinkSyncResult;
    try {
      // Changes made while this ran (another caller asked for a resync) get one more pass, at most twice.
      for (let pass = 0; ; pass++) {
        await takeResyncRequest(db);
        result = await runSync({ ...input, siteUrl }, token);
        if (pass >= 2 || !(await takeResyncRequest(db))) break;
      }
    } catch (err) {
      await upsertSetting(input.db, LAST_SYNC_KEY, { at: new Date().toISOString(), mode: input.mode, errors: [errorMessage(err)] }).catch(() => {});
      throw err;
    }
    await upsertSetting(input.db, LAST_SYNC_KEY, { at: new Date().toISOString(), mode: input.mode, errors: result.errors });
    return result;
  } finally {
    await releaseSyncLock(input.db, token).catch(() => {});
  }
}

function isPublicHttps(url: string): boolean {
  return url.startsWith("https://") && !/^https:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url);
}

async function runSync(input: SyncInput, token: string): Promise<PaymentLinkSyncResult> {
  const { db, stripe, mode, currency, siteUrl } = input;
  const redirectUrl = `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const result: PaymentLinkSyncResult = { mode, courses: [], retired: 0, webhook: null, errors: [] };
  const install = await stripeInstallId(db);

  const courses: SyncCourse[] = await db
    .select({
      id: schema.courses.id,
      slug: schema.courses.slug,
      title: schema.courses.title,
      subtitle: schema.courses.subtitle,
      priceCents: schema.courses.priceCents,
      published: schema.courses.published,
    })
    .from(schema.courses)
    .orderBy(asc(schema.courses.sortOrder), asc(schema.courses.createdAt));
  const stored = await readPaymentLinks(db, mode);

  // This database's links in Stripe, by course. An earlier link for the same price is switched back on rather than
  // replaced (so links already sent work again), a lost database row is recovered, and stray active links are retired.
  // Links made by another database on the same Stripe account are never touched: ours carry this install id or name
  // one of these courses (a restored database gets a new install id but keeps its course ids).
  const courseIds = new Set(courses.map((c) => c.id));
  const all = await stripe.paymentLinks.list({ limit: 100 }).autoPagingToArray({ limit: 5000 });
  const linksByCourse = new Map<string, Stripe.PaymentLink[]>();
  for (const link of all) {
    const meta = link.metadata;
    if (meta?.source !== PAYMENT_LINK_SOURCE || !meta.courseId) continue;
    // Another install's link counts as ours only for one of our courses that returns buyers to this same site (a
    // restored database), not to a copy's (e.g. a local one at http://localhost).
    const sameSite = link.after_completion?.type === "redirect" && link.after_completion.redirect?.url === redirectUrl;
    if (meta.install !== install && !(courseIds.has(meta.courseId) && sameSite)) continue;
    const list = linksByCourse.get(link.metadata.courseId) ?? [];
    list.push(link);
    linksByCourse.set(link.metadata.courseId, list);
  }
  const activeLinks = (courseId: string) => (linksByCourse.get(courseId) ?? []).filter((l) => l.active);

  const retire = async (link: Stripe.PaymentLink) => {
    await stripe.paymentLinks.update(link.id, { active: false, inactive_message: inactiveMessage(siteUrl) });
    result.retired++;
  };

  for (const course of courses) {
    input.signal?.throwIfAborted();
    await renewSyncLock(db, token);
    const current = stored.get(course.id);
    const candidates = activeLinks(course.id);
    try {
      if (!course.published || course.priceCents <= 0) {
        for (const link of candidates) await retire(link);
        if (current?.active) await upsertSetting(db, paymentLinkKey(mode, course.id), { ...current, active: false, syncedAt: new Date().toISOString() });
        result.courses.push({
          courseId: course.id,
          slug: course.slug,
          title: course.title,
          status: candidates.length > 0 || current?.active ? "deactivated" : "not-for-sale",
          url: null,
        });
        continue;
      }

      const productId = await ensureProduct(stripe, course, siteUrl, install);
      const priceId = await ensurePrice(stripe, productId, course, currency);

      // Reuse the stored link while it's for this price (even if it was switched off), else one Stripe already has
      // for this price, preferring an active one.
      const forPrice = (linksByCourse.get(course.id) ?? []).filter((l) => l.metadata.priceId === priceId);
      let link: Stripe.PaymentLink | null =
        (current?.priceId === priceId ? forPrice.find((l) => l.id === current.paymentLinkId) : undefined) ??
        forPrice.find((l) => l.active) ??
        forPrice[0] ??
        null;

      let status: PaymentLinkSyncStatus;
      const metadata = linkMetadata(course, priceId, install);
      if (!link) {
        link = await stripe.paymentLinks.create({
          line_items: [{ price: priceId, quantity: 1 }],
          metadata,
          payment_intent_data: { description: course.title, metadata: { source: PAYMENT_LINK_SOURCE, install, courseId: course.id } },
          after_completion: { type: "redirect", redirect: { url: redirectUrl } },
          allow_promotion_codes: true,
          inactive_message: inactiveMessage(siteUrl),
        });
        status = "created";
      } else {
        const redirectOk = link.after_completion?.type === "redirect" && link.after_completion.redirect?.url === redirectUrl;
        const metadataOk = Object.entries(metadata).every(([k, v]) => link?.metadata[k] === v);
        const descriptionOk = link.payment_intent_data?.description === course.title;
        if (!link.active || !redirectOk || !metadataOk || !descriptionOk) {
          link = await stripe.paymentLinks.update(link.id, {
            active: true,
            after_completion: { type: "redirect", redirect: { url: redirectUrl } },
            metadata,
            payment_intent_data: { description: course.title, metadata: { source: PAYMENT_LINK_SOURCE, install, courseId: course.id } },
            inactive_message: inactiveMessage(siteUrl),
          });
          status = "updated";
        } else {
          status = "unchanged";
        }
      }

      // Links for an earlier price (or duplicates) stop selling.
      const linkId = link.id;
      for (const other of candidates) if (other.id !== linkId) await retire(other);

      const record: StoredPaymentLink = {
        v: 1,
        courseId: course.id,
        mode,
        productId,
        priceId,
        paymentLinkId: link.id,
        url: link.url,
        unitAmountCents: course.priceCents,
        currency,
        active: true,
        syncedAt: new Date().toISOString(),
      };
      await upsertSetting(db, paymentLinkKey(mode, course.id), record);
      if (status === "unchanged" && current && (current.url !== record.url || current.paymentLinkId !== record.paymentLinkId || !current.active)) status = "updated";
      result.courses.push({ courseId: course.id, slug: course.slug, title: course.title, status, url: link.url });
    } catch (err) {
      const message = errorMessage(err);
      result.errors.push(`${course.title}: ${message}`);
      result.courses.push({ courseId: course.id, slug: course.slug, title: course.title, status: "failed", url: null, error: message });
    }
  }

  // Courses that were deleted: switch their links off and drop the rows.
  for (const courseId of linksByCourse.keys()) {
    if (courseIds.has(courseId)) continue;
    for (const link of activeLinks(courseId)) {
      try {
        await retire(link);
      } catch (err) {
        result.errors.push(`Retiring ${link.id}: ${errorMessage(err)}`);
      }
    }
  }
  for (const courseId of stored.keys()) {
    if (!courseIds.has(courseId)) await db.delete(schema.settings).where(eq(schema.settings.key, paymentLinkKey(mode, courseId)));
  }

  if (input.webhook) {
    input.signal?.throwIfAborted();
    await renewSyncLock(db, token);
    try {
      result.webhook = await ensureWebhookEndpoint(db, stripe, mode, siteUrl, input.webhook, install);
      // Webhooks still can't be verified: the owner has to act, so it counts as a problem.
      if (result.webhook.status === "unmanaged") result.errors.push(`Webhook endpoint: ${result.webhook.detail}`);
    } catch (err) {
      result.webhook = { status: "failed", detail: errorMessage(err) };
      result.errors.push(`Webhook endpoint: ${errorMessage(err)}`);
    }
  }
  return result;
}

/**
 * Makes sure Stripe sends this site's checkout and refund events. Uses STRIPE_WEBHOOK_SECRET's endpoint when that's
 * set (removing the one the site made, if it's a different one, so events aren't handled twice); otherwise creates
 * (or keeps up to date) an endpoint of its own and stores its signing secret.
 */
async function ensureWebhookEndpoint(
  db: DB,
  stripe: Stripe,
  mode: StripeMode,
  siteUrl: string,
  options: NonNullable<SyncInput["webhook"]>,
  install: string,
): Promise<NonNullable<PaymentLinkSyncResult["webhook"]>> {
  const key = `${WEBHOOK_PREFIX}${mode}`;
  if (options.envSecret) {
    const stored = await readWebhook(db, mode);
    // No endpoint of ours, or the owner put our own endpoint's secret in STRIPE_WEBHOOK_SECRET: nothing to remove.
    if (!stored || stored.secret === options.envSecret) return { status: "env" };
    if (!options.removeReplaced) return { status: "env", detail: "The site's own endpoint is removed by the next sync on the live site" };
    if (!(await envWebhookVerified(db, mode, options.envSecret))) {
      return { status: "env", detail: "The site's own endpoint is kept until STRIPE_WEBHOOK_SECRET's endpoint delivers its first event" };
    }
    try {
      await stripe.webhookEndpoints.del(stored.endpointId);
    } catch (err) {
      if (!isMissing(err)) throw err;
    }
    await db.delete(schema.settings).where(eq(schema.settings.key, key));
    return { status: "env", detail: "Removed the endpoint the site had created: STRIPE_WEBHOOK_SECRET's endpoint is used instead" };
  }
  const url = `${siteUrl}/api/stripe/webhook`;
  if (!isPublicHttps(url)) {
    return { status: "skipped", detail: "Stripe can only send webhooks to a public https address" };
  }
  const stored = await readWebhook(db, mode);
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 }).autoPagingToArray({ limit: 1000 });

  const mine = stored ? endpoints.find((e) => e.id === stored.endpointId) : undefined;
  if (stored && mine) {
    const events = mine.enabled_events;
    const missing = !events.includes("*") && STRIPE_WEBHOOK_EVENTS.some((e) => !events.includes(e));
    if (mine.url !== url || missing || mine.status !== "enabled") {
      await stripe.webhookEndpoints.update(mine.id, { url, enabled_events: STRIPE_WEBHOOK_EVENTS, disabled: false });
      if (mine.url !== url) await upsertSetting(db, key, { ...stored, url });
      return { status: "updated" };
    }
    return { status: "ok" };
  }

  const sameUrl = endpoints.filter((e) => e.url === url);
  // Made by hand, or by another database on this Stripe account: not ours to replace.
  const foreign = sameUrl.find((e) => e.metadata?.source !== WEBHOOK_SOURCE || e.metadata.install !== install);
  if (foreign) {
    return {
      status: "unmanaged",
      detail: `A webhook endpoint for ${url} that the site didn't create already exists in Stripe (${foreign.id}). Copy its signing secret (Stripe → Developers → Webhooks) into STRIPE_WEBHOOK_SECRET in Vercel and redeploy, or delete that endpoint and sync again.`,
    };
  }
  // One of ours whose secret isn't stored any more (e.g. a new database): Stripe won't show the secret again, so replace it.
  for (const stale of sameUrl) await stripe.webhookEndpoints.del(stale.id);

  const created = await stripe.webhookEndpoints.create({
    url,
    enabled_events: STRIPE_WEBHOOK_EVENTS,
    api_version: Stripe.API_VERSION,
    description: "Principe AI: checkout, refunds and disputes (created automatically by the site)",
    metadata: { source: WEBHOOK_SOURCE, install },
  });
  if (!created.secret) throw new Error("Stripe did not return the new webhook endpoint's signing secret");
  await upsertSetting(db, key, { v: 1, endpointId: created.id, url, secret: created.secret, createdAt: new Date().toISOString() });
  return { status: "created" };
}

/** One line per course for logs: "AI Essentials: created https://buy.stripe.com/…". */
export function describeSync(result: PaymentLinkSyncResult): string[] {
  const lines = result.courses.map((c) => `${c.title}: ${c.status}${c.url ? ` ${c.url}` : ""}${c.error ? ` (${c.error})` : ""}`);
  if (result.retired) lines.push(`${result.retired} old link${result.retired === 1 ? "" : "s"} switched off`);
  if (result.webhook) lines.push(`Webhook endpoint: ${result.webhook.status}${result.webhook.detail ? ` (${result.webhook.detail})` : ""}`);
  return lines;
}
