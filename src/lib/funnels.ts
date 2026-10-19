import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { DateTime } from "luxon";
import { getDb } from "@/db";
import { CHANGED_BEFORE_PAYING_REASON, CHECKOUT_FAILED_REASON, HOLD_EXPIRED_REASON } from "@/lib/booking-service";
import { getBusinessTimezone } from "@/lib/scheduling";
import type { FunnelEventName } from "@/lib/tracking";
import { absoluteUrl } from "@/lib/utils";

/**
 * Funnel analytics: ordered conversion funnels, traffic, landing pages, referrers and
 * first-touch attribution. Everything aggregates in Postgres; the pure helpers (rate math,
 * range + referrer normalisation) are exported for unit tests.
 *
 * Visitor identity: a person is `contact_id` when known, otherwise the anonymous cookie id.
 * Cookie ids that have ever been linked to a contact (events.contact_id or contacts.visitor_id)
 * resolve to that contact too, so client page views and cookie-less server events
 * (visitor_id "contact:<id>") chain into one journey.
 */

/* ------------------------------------------------------------------ */
/* Definitions                                                         */
/* ------------------------------------------------------------------ */

export type FunnelStep = {
  key: string;
  label: string;
  event: FunnelEventName;
  /** Exact path match (e.g. "/free-guide"). */
  path?: string;
  /** Path prefix match: "/courses" matches "/courses" and "/courses/…". */
  pathPrefix?: string;
};

export type FunnelDef = {
  id: string;
  name: string;
  description: string;
  /** Public page where the funnel starts (for a "View page" link). */
  href: string;
  steps: FunnelStep[];
};

export const FUNNELS: readonly FunnelDef[] = [
  {
    id: "free-guide",
    name: "Free Guide funnel",
    description: "Lead magnet → opt-in → Starter Kit → strategy call → purchase.",
    href: "/free-guide",
    steps: [
      { key: "landing", label: "Visited the Free Guide page", event: "page_view", path: "/free-guide" },
      { key: "optin", label: "Opted in", event: "optin" },
      { key: "guide", label: "Opened the Starter Kit", event: "guide_viewed" },
      { key: "booking", label: "Booked a call", event: "booking_created" },
      { key: "purchase", label: "Purchased", event: "purchase" },
    ],
  },
  {
    id: "assessment",
    name: "Assessment funnel",
    description: "AI readiness assessment → personal plan → call → purchase.",
    href: "/assessment",
    steps: [
      { key: "landing", label: "Visited the assessment", event: "page_view", path: "/assessment" },
      { key: "started", label: "Started the quiz", event: "quiz_started" },
      { key: "completed", label: "Completed the quiz", event: "quiz_completed" },
      { key: "booking", label: "Booked a call", event: "booking_created" },
      { key: "purchase", label: "Purchased", event: "purchase" },
    ],
  },
  {
    id: "course-sales",
    name: "Course sales funnel",
    description: "Course pages → checkout → purchase.",
    href: "/courses",
    steps: [
      { key: "landing", label: "Viewed a course page", event: "page_view", pathPrefix: "/courses" },
      { key: "checkout", label: "Started checkout", event: "checkout_started" },
      { key: "purchase", label: "Purchased", event: "purchase" },
    ],
  },
  {
    id: "booking",
    name: "Booking funnel",
    description: "Booking page → confirmed booking.",
    href: "/book",
    steps: [
      { key: "viewed", label: "Opened a booking page", event: "booking_viewed" },
      { key: "booked", label: "Booked a time", event: "booking_created" },
    ],
  },
];

/** Events that mean a visitor identified themselves (used for landing-page / referrer lead counts). */
export const LEAD_EVENTS = ["optin", "quiz_completed", "booking_created", "contact_form", "chat_lead", "application", "purchase"] as const satisfies readonly FunnelEventName[];

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

/** numerator / denominator, or null when the denominator is 0 (undefined rate). */
export function rate(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return Math.max(0, numerator / denominator);
}

/** 0.4213 → "42%", 0.042 → "4.2%", 0.0004 → "<0.1%", null → "—". */
export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value > 0 && value < 0.001) return "<0.1%";
  const pct = value * 100;
  return pct < 10 && pct !== 0 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`;
}

export type FunnelStepResult = {
  key: string;
  label: string;
  event: FunnelEventName;
  count: number;
  /** Share of the previous step that reached this one (null for the first step / empty previous step). */
  stepRate: number | null;
  /** Share of everyone who entered the funnel (null when nobody entered). */
  overallRate: number | null;
  /** People lost between the previous step and this one. */
  dropOff: number;
  /** 1 − stepRate (null when undefined). */
  dropRate: number | null;
};

export type FunnelResult = {
  id: string;
  name: string;
  description: string;
  href: string;
  steps: FunnelStepResult[];
  entered: number;
  completed: number;
  overallRate: number | null;
  /** Index of the step with the steepest drop-off from its previous step, or null when nobody dropped. */
  biggestDropIndex: number | null;
};

/**
 * Turns raw per-step counts into rates. Counts are clamped so a later step never exceeds
 * an earlier one (they can't by construction, but this keeps the maths safe for any input).
 */
export function summarizeFunnel(def: Pick<FunnelDef, "id" | "name" | "description" | "href" | "steps">, rawCounts: number[]): FunnelResult {
  const counts: number[] = [];
  def.steps.forEach((_, i) => {
    const raw = Math.max(0, Math.floor(Number(rawCounts[i]) || 0));
    counts.push(i === 0 ? raw : Math.min(raw, counts[i - 1]));
  });
  const entered = counts[0] ?? 0;
  const steps: FunnelStepResult[] = def.steps.map((step, i) => {
    const count = counts[i];
    const prev = i === 0 ? null : counts[i - 1];
    const stepRate = prev === null ? null : rate(count, prev);
    return {
      key: step.key,
      label: step.label,
      event: step.event,
      count,
      stepRate,
      overallRate: rate(count, entered),
      dropOff: prev === null ? 0 : prev - count,
      dropRate: stepRate === null ? null : 1 - stepRate,
    };
  });
  let biggestDropIndex: number | null = null;
  steps.forEach((s, i) => {
    if (i === 0 || s.dropRate === null || s.dropOff <= 0) return;
    const best = biggestDropIndex === null ? null : steps[biggestDropIndex];
    if (!best || s.dropRate > (best.dropRate ?? 0) || (s.dropRate === best.dropRate && s.dropOff > best.dropOff)) biggestDropIndex = i;
  });
  const completed = counts[counts.length - 1] ?? 0;
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    href: def.href,
    steps,
    entered,
    completed,
    overallRate: rate(completed, entered),
    biggestDropIndex,
  };
}

export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];

export function parseRangeDays(value: unknown): RangeDays {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return (RANGE_OPTIONS as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

export type DateRange = {
  days: number;
  tz: string;
  /** Inclusive start: midnight (business tz) `days - 1` days ago. */
  from: Date;
  /** Exclusive end: now. */
  to: Date;
  /** One YYYY-MM-DD key per day in the range, oldest first. */
  dayKeys: string[];
};

/** The last `days` calendar days in `tz`, today included. */
export function rangeFor(days: number, tz: string, now: Date = new Date()): DateRange {
  let end = DateTime.fromJSDate(now, { zone: tz });
  if (!end.isValid) end = DateTime.fromJSDate(now, { zone: "UTC" });
  const start = end.startOf("day").minus({ days: Math.max(1, days) - 1 });
  const dayKeys = Array.from({ length: Math.max(1, days) }, (_, i) => start.plus({ days: i }).toFormat("yyyy-LL-dd"));
  return { days: Math.max(1, days), tz: end.zoneName ?? "UTC", from: start.toJSDate(), to: now, dayKeys };
}

/** "l.instagram.com" → "instagram.com", "WWW.Google.com." → "google.com". */
export function normalizeReferrerHost(host: string | null | undefined): string | null {
  if (!host) return null;
  let h = host.trim().toLowerCase().replace(/\.$/, "");
  if (!h || !/^[a-z0-9.-]+$/.test(h)) return null;
  h = h.replace(/^(www\d?|m|l|lm|mobile|out)\./, "");
  return h || null;
}

/** Hostname of a referrer URL (null for missing / non-URL values). */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname ? normalizeReferrerHost(url.hostname) : null;
  } catch {
    return null;
  }
}

/** Hosts that belong to this site (internal referrers count as direct traffic). */
export function ownHosts(): Set<string> {
  const hosts = new Set<string>(["localhost", "127.0.0.1"]);
  for (const v of [absoluteUrl("/"), process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (!v) continue;
    const h = referrerHost(v.includes("://") ? v : `https://${v}`);
    if (h) hosts.add(h);
  }
  return hosts;
}

/** Collapses secret tokens in paths so they don't fragment reports (or show up in them). */
export function displayPath(path: string | null | undefined): string {
  if (!path) return "(unknown)";
  return path.replace(/^\/(unsubscribe|booking|auth\/verify)\/[^/]+/, "/$1/…").slice(0, 200) || "/";
}

/* ------------------------------------------------------------------ */
/* SQL                                                                 */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>;

/** db.execute returns an array (postgres-js) or { rows } (PGlite). */
function rowsOf<T extends Row>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  const rows = (result as { rows?: unknown } | null)?.rows;
  return Array.isArray(rows) ? (rows as T[]) : [];
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const ts = (d: Date) => sql`${d.toISOString()}::timestamptz`;
const list = (values: readonly string[]) => sql.join(values.map((v) => sql`${v}`), sql`, `);

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

function stepMatch(step: FunnelStep): SQL {
  const parts: SQL[] = [sql`ev.name = ${step.event}`];
  if (step.path) parts.push(sql`ev.path = ${step.path}`);
  if (step.pathPrefix) {
    const prefix = step.pathPrefix.replace(/\/+$/, "") || "/";
    parts.push(sql`(ev.path = ${prefix} or ev.path like ${`${escapeLike(prefix)}/%`})`);
  }
  return sql.join(parts, sql` and `);
}

/**
 * Identity-resolved events in the range: `raw` = events of the given names, `vm` = cookie id →
 * contact map, `ev` = (pid, name, path, created_at) with pid = contact id when known.
 */
function identityCtes(range: Pick<DateRange, "from" | "to">, names: readonly string[]): SQL {
  return sql`
    raw as (
      select e.visitor_id, e.contact_id, e.name, e.path, e.referrer, e.created_at
      from events e
      where e.name in (${list(names)}) and e.created_at >= ${ts(range.from)} and e.created_at < ${ts(range.to)}
    ),
    vm as (
      select m.visitor_id, min(m.cid) as cid from (
        select visitor_id, contact_id::text as cid from raw where contact_id is not null
        union all
        select visitor_id, id::text as cid from contacts where visitor_id is not null
      ) m
      group by m.visitor_id
    ),
    ev as (
      select coalesce(raw.contact_id::text, vm.cid, raw.visitor_id) as pid, raw.name, raw.path, raw.created_at
      from raw
      left join vm on vm.visitor_id = raw.visitor_id
    )`;
}

/**
 * Unique people per step, where a person counts at step N only if they reached steps 1…N−1
 * first (in order, inside the range). One query: each step CTE keeps the earliest qualifying
 * timestamp per person, joined to the previous step's timestamp.
 */
export async function computeFunnel(def: FunnelDef, range: Pick<DateRange, "from" | "to">): Promise<FunnelResult> {
  if (!def.steps.length) return summarizeFunnel(def, []);
  const db = await getDb();
  const names = [...new Set(def.steps.map((s) => s.event))];
  const stepCtes = def.steps.map((step, i) => {
    const name = sql.raw(`s${i}`);
    if (i === 0) return sql`${name} as (select ev.pid, min(ev.created_at) as t from ev where ${stepMatch(step)} group by ev.pid)`;
    const prev = sql.raw(`s${i - 1}`);
    return sql`${name} as (
      select ev.pid, min(ev.created_at) as t
      from ev join ${prev} p on p.pid = ev.pid and ev.created_at >= p.t
      where ${stepMatch(step)}
      group by ev.pid
    )`;
  });
  const selects = def.steps.map((_, i) => sql`(select count(*) from ${sql.raw(`s${i}`)})::int as ${sql.raw(`c${i}`)}`);
  const result = await db.execute(sql`
    with ${identityCtes(range, names)},
    ${sql.join(stepCtes, sql`,\n`)}
    select ${sql.join(selects, sql`, `)}`);
  const row = rowsOf(result)[0] ?? {};
  return summarizeFunnel(
    def,
    def.steps.map((_, i) => num(row[`c${i}`])),
  );
}

export type TrafficSeries = {
  dayKeys: string[];
  pageViews: number[];
  visitors: number[];
  totalPageViews: number;
  totalVisitors: number;
};

/** Daily page views + unique visitors (cookie ids) in the business timezone. */
export async function getTraffic(range: DateRange): Promise<TrafficSeries> {
  const db = await getDb();
  const [daily, totals] = await Promise.all([
    db.execute(sql`
      select to_char(created_at at time zone ${range.tz}, 'YYYY-MM-DD') as day,
        count(*)::int as views,
        count(distinct visitor_id)::int as visitors
      from events
      where name = 'page_view' and created_at >= ${ts(range.from)} and created_at < ${ts(range.to)}
      group by 1`),
    db.execute(sql`
      select count(*)::int as views, count(distinct visitor_id)::int as visitors
      from events
      where name = 'page_view' and created_at >= ${ts(range.from)} and created_at < ${ts(range.to)}`),
  ]);
  const byDay = new Map(rowsOf(daily).map((r) => [String(r.day), { views: num(r.views), visitors: num(r.visitors) }]));
  const t = rowsOf(totals)[0] ?? {};
  return {
    dayKeys: range.dayKeys,
    pageViews: range.dayKeys.map((d) => byDay.get(d)?.views ?? 0),
    visitors: range.dayKeys.map((d) => byDay.get(d)?.visitors ?? 0),
    totalPageViews: num(t.views),
    totalVisitors: num(t.visitors),
  };
}

export type EntranceRow = { key: string; label: string; visitors: number; leads: number };
export type Entrances = { landingPages: EntranceRow[]; referrers: EntranceRow[]; totalVisitors: number };

/**
 * Each visitor's first page view in the range = their entrance. Grouped by landing page and by
 * referrer domain, with how many of those visitors identified themselves (any LEAD_EVENTS).
 */
export async function getEntrances(range: DateRange, limit = 8): Promise<Entrances> {
  const db = await getDb();
  const result = await db.execute(sql`
    with ${identityCtes(range, ["page_view", ...LEAD_EVENTS])},
    firsts as (
      select distinct on (raw.visitor_id) raw.path, raw.referrer, coalesce(vm.cid, raw.visitor_id) as pid
      from raw
      left join vm on vm.visitor_id = raw.visitor_id
      where raw.name = 'page_view'
      order by raw.visitor_id, raw.created_at
    ),
    conv as (
      select distinct pid from ev where name in (${list(LEAD_EVENTS)})
    )
    select f.path, f.referrer, count(*)::int as visitors, count(conv.pid)::int as leads
    from firsts f
    left join conv on conv.pid = f.pid
    group by f.path, f.referrer`);

  const own = ownHosts();
  const pages = new Map<string, EntranceRow>();
  const refs = new Map<string, EntranceRow>();
  let totalVisitors = 0;
  for (const r of rowsOf(result)) {
    const visitors = num(r.visitors);
    const leads = num(r.leads);
    totalVisitors += visitors;
    const path = displayPath(typeof r.path === "string" ? r.path : null);
    const page = pages.get(path) ?? { key: path, label: path, visitors: 0, leads: 0 };
    page.visitors += visitors;
    page.leads += leads;
    pages.set(path, page);
    const host = referrerHost(typeof r.referrer === "string" ? r.referrer : null);
    const key = host && !own.has(host) ? host : "(direct)";
    const ref = refs.get(key) ?? { key, label: key === "(direct)" ? "Direct / unknown" : key, visitors: 0, leads: 0 };
    ref.visitors += visitors;
    ref.leads += leads;
    refs.set(key, ref);
  }
  const sort = (a: EntranceRow, b: EntranceRow) => b.visitors - a.visitors || b.leads - a.leads || a.label.localeCompare(b.label);
  return {
    landingPages: [...pages.values()].sort(sort).slice(0, limit),
    referrers: [...refs.values()].sort(sort).slice(0, limit),
    totalVisitors,
  };
}

export type AttributionRow = { key: string; leads: number; bookedCalls: number; customers: number; revenueCents: number };
export type Attribution = {
  bySource: AttributionRow[];
  byChannel: AttributionRow[];
  totals: Omit<AttributionRow, "key">;
  testOrders: number;
};

/**
 * First-touch attribution. Leads = contacts created in the range; booked calls / customers /
 * revenue = bookings made and orders paid in the range, credited to the contact's first-touch
 * signup path (contacts.source) and channel (contacts.utm.source).
 */
export async function getAttribution(range: Pick<DateRange, "from" | "to">): Promise<Attribution> {
  const db = await getDb();
  const result = await db.execute(sql`
    with b as (
      select contact_id from bookings
      where created_at >= ${ts(range.from)} and created_at < ${ts(range.to)}
        and status <> 'pending_payment'
        -- Not a cancelled booking that was never paid for (released hold, or a paid session cancelled before payment).
        and not (status = 'cancelled' and (
          coalesce(cancel_reason, '') in (${HOLD_EXPIRED_REASON}, ${CHECKOUT_FAILED_REASON}, ${CHANGED_BEFORE_PAYING_REASON})
          or (exists (select 1 from meeting_types bmt where bmt.id = bookings.meeting_type_id and bmt.price_cents > 0)
            and not exists (select 1 from orders bo where bo.booking_id = bookings.id and bo.status in ('paid', 'refunded')))
        ))
      group by contact_id
    ),
    o as (
      select contact_id, sum(amount_cents)::bigint as cents, count(*) filter (where is_test)::int as test
      from orders
      where status = 'paid' and contact_id is not null and paid_at >= ${ts(range.from)} and paid_at < ${ts(range.to)}
      group by contact_id
    )
    select
      coalesce(nullif(c.source, ''), 'unknown') as src,
      coalesce(nullif(lower(c.utm->>'source'), ''), 'direct') as ch,
      count(*) filter (where c.created_at >= ${ts(range.from)} and c.created_at < ${ts(range.to)})::int as leads,
      count(b.contact_id)::int as booked,
      count(o.contact_id)::int as customers,
      coalesce(sum(o.cents), 0)::bigint as revenue,
      coalesce(sum(o.test), 0)::int as test
    from contacts c
    left join b on b.contact_id = c.id
    left join o on o.contact_id = c.id
    where (c.created_at >= ${ts(range.from)} and c.created_at < ${ts(range.to)}) or b.contact_id is not null or o.contact_id is not null
    group by 1, 2`);

  const bySource = new Map<string, AttributionRow>();
  const byChannel = new Map<string, AttributionRow>();
  const totals = { leads: 0, bookedCalls: 0, customers: 0, revenueCents: 0 };
  let testOrders = 0;
  const add = (map: Map<string, AttributionRow>, key: string, r: Omit<AttributionRow, "key">) => {
    const row = map.get(key) ?? { key, leads: 0, bookedCalls: 0, customers: 0, revenueCents: 0 };
    row.leads += r.leads;
    row.bookedCalls += r.bookedCalls;
    row.customers += r.customers;
    row.revenueCents += r.revenueCents;
    map.set(key, row);
  };
  for (const r of rowsOf(result)) {
    const values = { leads: num(r.leads), bookedCalls: num(r.booked), customers: num(r.customers), revenueCents: num(r.revenue) };
    add(bySource, String(r.src), values);
    add(byChannel, String(r.ch), values);
    totals.leads += values.leads;
    totals.bookedCalls += values.bookedCalls;
    totals.customers += values.customers;
    totals.revenueCents += values.revenueCents;
    testOrders += num(r.test);
  }
  const sort = (a: AttributionRow, b: AttributionRow) => b.revenueCents - a.revenueCents || b.customers - a.customers || b.leads - a.leads || a.key.localeCompare(b.key);
  return { bySource: [...bySource.values()].sort(sort), byChannel: [...byChannel.values()].sort(sort), totals, testOrders };
}

export type FunnelDashboard = {
  range: DateRange;
  funnels: FunnelResult[];
  traffic: TrafficSeries;
  entrances: Entrances;
  attribution: Attribution;
};

/** Everything the /admin/funnels page shows, for the last `days` days. */
export async function getFunnelDashboard(days: RangeDays): Promise<FunnelDashboard> {
  const tz = await getBusinessTimezone();
  const range = rangeFor(days, tz);
  const [funnels, traffic, entrances, attribution] = await Promise.all([
    Promise.all(FUNNELS.map((f) => computeFunnel(f, range))),
    getTraffic(range),
    getEntrances(range),
    getAttribution(range),
  ]);
  return { range, funnels, traffic, entrances, attribution };
}
