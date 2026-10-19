import "server-only";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

const IPV4 = /(\d{1,3}(?:\.\d{1,3}){3})/;

/**
 * The part of a client IP that identifies one network for rate limiting: the address itself for IPv4
 * (including IPv4-mapped IPv6), and the /64 prefix for IPv6, since a single host is usually given a
 * whole /64 and could otherwise rotate through its addresses to get a fresh budget each time.
 */
export function ipRateLimitKey(ip: string): string {
  const addr = ip.trim().toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  if (!addr) return "unknown";
  if (!addr.includes(":")) return addr;
  const v4 = addr.match(IPV4);
  if (v4) return v4[1];
  let groups: string[];
  const halves = addr.split("::");
  if (halves.length > 2) return addr;
  if (halves.length === 2) {
    const [head, tail] = halves;
    const h = head ? head.split(":") : [];
    const t = tail ? tail.split(":") : [];
    groups = [...h, ...Array<string>(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t];
  } else {
    groups = addr.split(":");
  }
  if (groups.length !== 8 || !groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) return addr;
  return `${groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
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

/** Convenience: rate-limit by client IP (IPv6: by /64 network) for a named bucket. */
export async function rateLimitByIp(bucket: string, limit: number, windowSec: number) {
  const ip = await clientIp();
  return rateLimit(`${bucket}:${ipRateLimitKey(ip)}`, limit, windowSec);
}
