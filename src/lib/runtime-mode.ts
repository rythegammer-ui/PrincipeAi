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
 * - "pglite-memory": no database configured on a serverless host (demo mode — data resets on cold start)
 */
export function dbMode(): DbMode {
  if (databaseUrl()) return "postgres";
  if (process.env.PGLITE_DIR === "memory://") return "pglite-memory";
  if (process.env.VERCEL || process.env.NEXT_PHASE === "phase-production-build") return "pglite-memory";
  return "pglite-file";
}

/** True when the deployed site runs without a persistent database (before one is connected). */
export function isDemoMode(): boolean {
  return dbMode() === "pglite-memory" && process.env.NODE_ENV === "production";
}

const DEV_SECRET = "principe-dev-secret-do-not-use-in-production-0000";
const DEMO_SECRET = "principe-demo-mode-secret-set-AUTH_SECRET-in-vercel";

/** Secret used to sign session cookies. Throws in production when misconfigured. */
export function authSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV !== "production") return new TextEncoder().encode(DEV_SECRET);
  if (isDemoMode()) return new TextEncoder().encode(DEMO_SECRET);
  throw new Error("AUTH_SECRET must be set (at least 16 characters) when a production database is configured.");
}

/** Admin credentials. In production they must come from ADMIN_EMAIL / ADMIN_PASSWORD (demo mode excepted). */
export function adminCredentials(): { email: string; password: string; isDefault: boolean } | null {
  const email = (process.env.ADMIN_EMAIL || "admin@principe.ai").trim().toLowerCase();
  if (process.env.ADMIN_PASSWORD) return { email, password: process.env.ADMIN_PASSWORD, isDefault: false };
  if (process.env.NODE_ENV !== "production" || isDemoMode()) return { email, password: "demo1234", isDefault: true };
  return null;
}
