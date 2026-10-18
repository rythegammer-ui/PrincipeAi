import "server-only";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Fixed-window rate limit stored in Postgres. Returns { ok: false } once `limit`
 * hits have been recorded for `key` inside the last `windowSec` seconds.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; count: number }> {
  const db = await getDb();
  const rows = await db.execute<{ count: number }>(sql`
    insert into rate_limits (key, count, window_start)
    values (${key}, 1, now())
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - make_interval(secs => ${windowSec}) then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - make_interval(secs => ${windowSec}) then now() else rate_limits.window_start end
    returning count
  `);
  const first = (Array.isArray(rows) ? rows[0] : (rows as unknown as { rows: { count: number }[] }).rows[0]) as { count: number } | undefined;
  const count = Number(first?.count ?? 1);
  return { ok: count <= limit, count };
}

/** Convenience: rate-limit by client IP for a named bucket. */
export async function rateLimitByIp(bucket: string, limit: number, windowSec: number) {
  const ip = await clientIp();
  return rateLimit(`${bucket}:${ip}`, limit, windowSec);
}
