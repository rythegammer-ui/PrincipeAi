/**
 * Applies SQL migrations in ./drizzle to DATABASE_URL (or POSTGRES_URL) and seeds the
 * default catalog if the database is empty. Runs automatically during `vercel-build`.
 * Without a database URL it exits quietly (locally the app falls back to embedded PGlite).
 *
 * Then, on a production build with STRIPE_SECRET_KEY set, it syncs the courses' Stripe Payment Links
 * (src/lib/payment-links.ts). That step never fails the build: Admin → Courses can run it again.
 *
 * ADMIN_TEAM_EMAILS (comma-separated) adds admin team members at deploy time, so the first ones don't need the owner
 * to sign in first. Someone removed in Admin → Team stays removed (their row is kept, so they aren't added again).
 */
import "dotenv/config";
import path from "node:path";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import Stripe from "stripe";
import { site } from "../src/config/site";
import * as schema from "../src/db/schema";
import { seedIfEmpty } from "../src/db/seed";
import { describeSync, stripeModeForKey, syncPaymentLinks } from "../src/lib/payment-links";
import { isValidEmail, normalizeEmail } from "../src/lib/utils";

type DB = PostgresJsDatabase<typeof schema>;

/** Adds the ADMIN_TEAM_EMAILS addresses to admin_members (never the owner's ADMIN_EMAIL, never someone removed). */
async function addTeamFromEnv(db: DB) {
  const owner = normalizeEmail(process.env.ADMIN_EMAIL || "admin@principe.ai");
  const emails = [
    ...new Set(
      (process.env.ADMIN_TEAM_EMAILS ?? "")
        .split(/[,;\s]+/)
        .map((e) => normalizeEmail(e))
        .filter((e) => isValidEmail(e) && e !== owner),
    ),
  ];
  for (const email of emails) {
    const added = await db
      .insert(schema.adminMembers)
      .values({ email, addedBy: "ADMIN_TEAM_EMAILS" })
      .onConflictDoNothing({ target: schema.adminMembers.email })
      .returning({ email: schema.adminMembers.email });
    if (added.length) console.log(`[migrate] Added ${email} to the admin team (ADMIN_TEAM_EMAILS).`);
  }
}

/** Creates or updates every paid course's Stripe Payment Link (production builds only). Never throws. */
async function syncStripe(db: DB) {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const wanted = process.env.VERCEL ? process.env.VERCEL_ENV === "production" : process.env.STRIPE_SYNC_ON_MIGRATE === "1";
  if (!key || !wanted) return;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : site.url);
  const mode = stripeModeForKey(key);
  console.log(`[migrate] Syncing Stripe payment links (${mode} mode) for ${siteUrl}…`);
  // Stops the sync between Stripe calls after 90s, so a slow Stripe never holds up the build for long.
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(new Error("timed out after 90s")), 90_000);
  try {
    const stripe = new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000, appInfo: { name: "Principe AI" } });
    const result = await syncPaymentLinks({
      db,
      stripe,
      mode,
      siteUrl,
      currency: site.currency,
      // The live deployment, not this build step, removes a replaced endpoint (see syncPaymentLinks).
      webhook: { envSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || null, removeReplaced: false },
      signal: stop.signal,
    });
    for (const line of describeSync(result)) console.log(`[migrate]   ${line}`);
    if (result.errors.length) console.warn(`[migrate] Stripe sync finished with ${result.errors.length} problem(s); retry from Admin → Courses.`);
  } catch (err) {
    console.warn("[migrate] Stripe payment-link sync failed (the build continues; retry from Admin → Courses):", err instanceof Error ? err.message : err);
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    console.log(
      process.env.VERCEL
        ? "[migrate] No DATABASE_URL/POSTGRES_URL set — skipping. The deployment won't serve data until a database is connected (or DEMO_MODE=1 for an in-memory demo)."
        : "[migrate] No DATABASE_URL/POSTGRES_URL set — skipping (embedded PGlite will be used).",
    );
    return;
  }
  // Prefer a direct (non-pooled) connection for DDL when the provider exposes one.
  const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || url;
  const client = postgres(migrationUrl, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(client, { schema });
  console.log("[migrate] Applying migrations…");
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  const res = await seedIfEmpty(db, { demoData: process.env.SEED_DEMO_DATA === "1" });
  console.log(res.seeded ? "[migrate] Seeded default catalog." : "[migrate] Database already seeded.");
  await addTeamFromEnv(db);
  await syncStripe(db);
  await client.end();
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
