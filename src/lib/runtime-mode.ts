/**
 * Environment-only runtime detection. Has no imports so it is safe in proxy.ts,
 * scripts, and tests.
 */
export type DbMode = "postgres" | "pglite-file" | "pglite-memory";

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

/**
 * - "postgres":      DATABASE_URL / POSTGRES_URL is set (production — Neon, Supabase, Vercel Postgres, etc.)
 * - "pglite-file":   local development with an embedded Postgres persisted in ./.data/pglite
 * - "pglite-memory": an explicit throwaway database that resets (PGLITE_DIR=memory://, or DEMO_MODE=1 on
 *                    Vercel for a demo deployment), and the `next build` phase
 *
 * A Vercel deployment with no database URL and no DEMO_MODE=1 is NOT silently turned into a demo:
 * `missingDatabaseError()` reports it and getDb() refuses to start (local `next dev` keeps the file database).
 */
export function dbMode(): DbMode {
  if (databaseUrl()) return "postgres";
  if (process.env.PGLITE_DIR === "memory://") return "pglite-memory";
  if (process.env.NEXT_PHASE === "phase-production-build") return "pglite-memory";
  if (process.env.VERCEL && process.env.DEMO_MODE === "1") return "pglite-memory";
  return "pglite-file";
}

/** True when the deployed site runs as a throwaway demo without a persistent database. */
export function isDemoMode(): boolean {
  return dbMode() === "pglite-memory" && process.env.NODE_ENV === "production";
}

/**
 * True inside a deployed Vercel runtime. `vercel env pull` writes VERCEL=1 (and VERCEL_ENV=development) into
 * .env.local, which `next dev` loads too, so VERCEL alone doesn't mean "deployed".
 */
function deployedOnVercel(): boolean {
  return Boolean(process.env.VERCEL) && process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "development";
}

/**
 * Why no database can be used, or null. On Vercel the embedded file database can't work (read-only,
 * per-instance filesystem), so a deployment without DATABASE_URL must opt in to the demo explicitly.
 * Local development keeps the embedded file database even with Vercel's variables pulled in.
 */
export function missingDatabaseError(): string | null {
  if (dbMode() === "pglite-file" && deployedOnVercel()) {
    return "No database configured: set DATABASE_URL (or POSTGRES_URL), or DEMO_MODE=1 for a throwaway demo.";
  }
  return null;
}

const DEV_SECRET = "principe-dev-secret-do-not-use-in-production-0000";
const DEMO_SECRET = "principe-demo-mode-secret-set-AUTH_SECRET-in-vercel";
const DEMO_PASSWORD = "demo1234";

export const MIN_AUTH_SECRET_LENGTH = 16;
export const MIN_ADMIN_PASSWORD_LENGTH = 12;

function authSecretConfigured(): boolean {
  return (process.env.AUTH_SECRET?.length ?? 0) >= MIN_AUTH_SECRET_LENGTH;
}

/** Live third-party keys that send real email, take real payments or spend on AI. */
export function liveKeysConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY || process.env.STRIPE_SECRET_KEY || process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN,
  );
}

/**
 * The public demo login (admin@principe.ai / demo1234) is offered in local development, and in a
 * production demo only while ADMIN_PASSWORD is unset and no live keys are configured (a public
 * dashboard could otherwise send email from the owner's domain, take payments or spend AI credit).
 */
function demoLoginOffered(): boolean {
  if (process.env.ADMIN_PASSWORD) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return isDemoMode() && !liveKeysConfigured();
}

/** Secret used to sign session cookies. Throws in production when misconfigured. */
export function authSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= MIN_AUTH_SECRET_LENGTH) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV !== "production") return new TextEncoder().encode(DEV_SECRET);
  if (s) throw new Error(`AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters.`);
  // The constant key is public (it's in the source), so it is only acceptable while the dashboard
  // itself is public: a demo still on the demo login. Once the owner locks it, AUTH_SECRET is required.
  if (isDemoMode() && demoLoginOffered()) return new TextEncoder().encode(DEMO_SECRET);
  throw new Error(`AUTH_SECRET must be set (at least ${MIN_AUTH_SECRET_LENGTH} characters) in production.`);
}

/**
 * Admin credentials, or null when admin login isn't (safely) configured. In production they must
 * come from ADMIN_EMAIL / ADMIN_PASSWORD (at least 12 characters, with an AUTH_SECRET of at least
 * 16 to sign the session), except for the demo login described above.
 */
export function adminCredentials(): { email: string; password: string; isDefault: boolean } | null {
  const email = (process.env.ADMIN_EMAIL || "admin@principe.ai").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  // A too-short AUTH_SECRET makes authSecret() throw: report "not configured" instead of a 500 at sign-in.
  if (process.env.NODE_ENV === "production" && process.env.AUTH_SECRET && !authSecretConfigured()) return null;
  if (password) {
    if (process.env.NODE_ENV === "production" && (password.length < MIN_ADMIN_PASSWORD_LENGTH || !authSecretConfigured())) return null;
    return { email, password, isDefault: false };
  }
  if (demoLoginOffered()) return { email, password: DEMO_PASSWORD, isDefault: true };
  return null;
}
