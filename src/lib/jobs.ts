import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { processDueEnrollments } from "@/lib/automations";
import { releaseExpiredHolds, sendDueBookingReminders } from "@/lib/booking-service";
import type { JobKey } from "@/components/funnels/automation-utils";

/**
 * Scheduled maintenance, shared by the Vercel Cron route (/api/cron) and the
 * "Run automations now" button in /admin/settings. Every job is isolated: one failure
 * never stops the others, and each reports how many rows it touched.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export type { JobKey } from "@/components/funnels/automation-utils";

export type JobResult = { ok: true; count: number; detail?: string; ms: number } | { ok: false; error: string; ms: number };

export type JobsSummary = {
  ok: boolean;
  startedAt: string;
  durationMs: number;
  jobs: Record<JobKey, JobResult>;
};

/** Pending checkouts older than this are marked expired. */
export const PENDING_ORDER_TTL_MS = DAY;
export const RATE_LIMIT_RETENTION_MS = 2 * DAY;
export const LOGIN_TOKEN_RETENTION_MS = 7 * DAY;

const JOBS: Record<JobKey, () => Promise<{ count: number; detail?: string }>> = {
  async automations() {
    const r = await processDueEnrollments();
    return { count: r.sent, detail: `${r.processed} due` };
  },
  async bookingReminders() {
    return { count: await sendDueBookingReminders() };
  },
  async expiredHolds() {
    return { count: await releaseExpiredHolds() };
  },
  async expiredOrders() {
    const db = await getDb();
    const rows = await db
      .update(schema.orders)
      .set({ status: "expired" })
      .where(and(eq(schema.orders.status, "pending"), lt(schema.orders.createdAt, new Date(Date.now() - PENDING_ORDER_TTL_MS))))
      .returning({ id: schema.orders.id });
    return { count: rows.length };
  },
  async rateLimits() {
    const db = await getDb();
    const rows = await db
      .delete(schema.rateLimits)
      .where(lt(schema.rateLimits.windowStart, new Date(Date.now() - RATE_LIMIT_RETENTION_MS)))
      .returning({ key: schema.rateLimits.key });
    return { count: rows.length };
  },
  async loginTokens() {
    const db = await getDb();
    const rows = await db
      .delete(schema.loginTokens)
      .where(lt(schema.loginTokens.expiresAt, new Date(Date.now() - LOGIN_TOKEN_RETENTION_MS)))
      .returning({ hash: schema.loginTokens.tokenHash });
    return { count: rows.length };
  },
};

/** Runs every scheduled job in order (holds are released before stale orders are expired). */
export async function runScheduledJobs(): Promise<JobsSummary> {
  const started = Date.now();
  const jobs = {} as Record<JobKey, JobResult>;
  for (const key of Object.keys(JOBS) as JobKey[]) {
    const t0 = Date.now();
    try {
      const r = await JOBS[key]();
      jobs[key] = { ok: true, count: r.count, ...(r.detail ? { detail: r.detail } : {}), ms: Date.now() - t0 };
    } catch (err) {
      console.error(`[jobs] ${key} failed`, err);
      jobs[key] = { ok: false, error: err instanceof Error ? err.message : String(err), ms: Date.now() - t0 };
    }
  }
  return {
    ok: Object.values(jobs).every((j) => j.ok),
    startedAt: new Date(started).toISOString(),
    durationMs: Date.now() - started,
    jobs,
  };
}

const sha256 = (value: string) => createHash("sha256").update(value).digest();

/**
 * Cron authorization. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the secret is
 * set. Without a secret the job may only run outside production (local development).
 */
export function authorizeCron(
  authorization: string | null,
  secret: string | undefined = process.env.CRON_SECRET,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): { ok: true } | { ok: false; error: string } {
  if (!secret) {
    return nodeEnv === "production" ? { ok: false, error: "CRON_SECRET is not configured. Add it in your Vercel project settings." } : { ok: true };
  }
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || !timingSafeEqual(sha256(token), sha256(secret))) return { ok: false, error: "Unauthorized" };
  return { ok: true };
}
