import "server-only";
import { and, asc, count, desc, eq, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notInArray, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { DateTime } from "luxon";
import { z } from "zod";
import { getDb, schema } from "@/db";
import type { Stage } from "@/db/schema";
import { SEGMENTS, STAGE_ORDER } from "@/components/admin/crm-utils";
import { CHANGED_BEFORE_PAYING_REASON, CHECKOUT_FAILED_REASON, HOLD_EXPIRED_REASON } from "@/lib/booking-service";
import { getBusinessTimezone } from "@/lib/scheduling";

/**
 * Read-side queries for the CRM (dashboard, contacts, contact 360°, pipeline, tasks).
 * Everything aggregates in Postgres; pages only shape the results.
 */

const c = schema.contacts;
const PAGE_SIZE = 50;

const cnt = (cond: SQL | undefined) => sql<number>`count(*) filter (where ${cond ?? sql`true`})`.mapWith(Number);
const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
/** Postgres day bucket in the business timezone, as YYYY-MM-DD. */
const dayOf = (col: SQL | AnyPgColumn, tz: string) => sql<string>`to_char(${col} at time zone ${tz}, 'YYYY-MM-DD')`;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/* ------------------------------------------------------------------ */
/* Contact filters (search params → validated filters)                 */
/* ------------------------------------------------------------------ */

export const CONTACT_SORTS = {
  newest: "Newest first",
  score: "Highest score",
  activity: "Recent activity",
  deal: "Deal value",
  ltv: "Lifetime value",
} as const;
export type ContactSort = keyof typeof CONTACT_SORTS;
const SORT_KEYS = Object.keys(CONTACT_SORTS) as [ContactSort, ...ContactSort[]];

const ContactFiltersSchema = z.object({
  q: z
    .string()
    .transform((s) => s.trim().slice(0, 100))
    .catch(""),
  stage: z.enum(STAGE_ORDER).optional().catch(undefined),
  source: z
    .string()
    .regex(/^[a-z0-9_]{1,40}$/)
    .optional()
    .catch(undefined),
  tag: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().min(1).max(40))
    .optional()
    .catch(undefined),
  segment: z.enum([...SEGMENTS, "none"]).optional().catch(undefined),
  minScore: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
  sort: z.enum(SORT_KEYS).catch("newest"),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
});
export type ContactFilters = z.infer<typeof ContactFiltersSchema>;

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function plainParams(input: RawParams): Record<string, string> {
  const out: Record<string, string> = {};
  const entries = input instanceof URLSearchParams ? [...input.entries()] : Object.entries(input);
  for (const [k, v] of entries) {
    const value = Array.isArray(v) ? v[0] : v;
    if (typeof value === "string" && value.trim() !== "") out[k] = value;
  }
  return out;
}

export function parseContactFilters(input: RawParams): ContactFilters {
  return ContactFiltersSchema.parse(plainParams(input));
}

/** Search params (minus page) that reproduce the filters — used for export / pagination links. */
export function contactFilterParams(f: ContactFilters, overrides: Partial<Record<keyof ContactFilters, string | number | undefined>> = {}): URLSearchParams {
  const p = new URLSearchParams();
  const merged: Record<string, string | number | undefined> = {
    q: f.q || undefined,
    stage: f.stage,
    source: f.source,
    tag: f.tag,
    segment: f.segment,
    minScore: f.minScore,
    sort: f.sort === "newest" ? undefined : f.sort,
    page: f.page > 1 ? f.page : undefined,
    ...overrides,
  };
  for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") p.set(k, String(v));
  return p;
}

function contactWhere(f: Pick<Partial<ContactFilters>, "q" | "stage" | "source" | "tag" | "segment" | "minScore">): SQL | undefined {
  const conds: SQL[] = [];
  if (f.q) {
    const pattern = `%${escapeLike(f.q)}%`;
    conds.push(or(ilike(c.name, pattern), ilike(c.email, pattern), ilike(c.company, pattern))!);
  }
  if (f.stage) conds.push(eq(c.stage, f.stage));
  if (f.source) conds.push(eq(c.source, f.source));
  if (f.tag) conds.push(sql`${c.tags} @> ${JSON.stringify([f.tag])}::jsonb`);
  if (f.segment) conds.push(f.segment === "none" ? isNull(c.segment) : eq(c.segment, f.segment));
  if (f.minScore) conds.push(gte(c.score, f.minScore));
  return conds.length ? and(...conds) : undefined;
}

function contactOrder(sort: ContactSort) {
  switch (sort) {
    case "score":
      return [desc(c.score), desc(c.lastActivityAt), asc(c.id)];
    case "activity":
      return [desc(c.lastActivityAt), asc(c.id)];
    case "deal":
      return [desc(c.dealValueCents), desc(c.score), asc(c.id)];
    case "ltv":
      return [desc(c.lifetimeValueCents), desc(c.lastActivityAt), asc(c.id)];
    default:
      return [desc(c.createdAt), asc(c.id)];
  }
}

/* ------------------------------------------------------------------ */
/* Contacts list + export                                              */
/* ------------------------------------------------------------------ */

export async function listContacts(f: ContactFilters) {
  const db = await getDb();
  const where = contactWhere(f);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: c.id,
        email: c.email,
        name: c.name,
        company: c.company,
        stage: c.stage,
        score: c.score,
        source: c.source,
        utmSource: sql<string | null>`${c.utm}->>'source'`,
        tags: c.tags,
        segment: c.segment,
        dealValueCents: c.dealValueCents,
        lifetimeValueCents: c.lifetimeValueCents,
        unsubscribed: c.unsubscribed,
        lastActivityAt: c.lastActivityAt,
        createdAt: c.createdAt,
      })
      .from(c)
      .where(where)
      .orderBy(...contactOrder(f.sort))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(c).where(where),
  ]);
  return { rows, total, page: f.page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
export type ContactListRow = Awaited<ReturnType<typeof listContacts>>["rows"][number];

/** Values for the filter dropdowns. */
export async function contactFacets() {
  const db = await getDb();
  const [sources, tags, segments, [{ total }]] = await Promise.all([
    db.select({ source: c.source, n: count() }).from(c).where(isNotNull(c.source)).groupBy(c.source).orderBy(desc(count())),
    db
      .selectDistinct({ tag: sql<string>`jsonb_array_elements_text(${c.tags})` })
      .from(c)
      .orderBy(sql`1`)
      .limit(300),
    db.select({ segment: c.segment, n: count() }).from(c).groupBy(c.segment),
    db.select({ total: count() }).from(c),
  ]);
  return {
    sources: sources.filter((s): s is { source: string; n: number } => Boolean(s.source)),
    tags: tags.map((t) => t.tag).filter(Boolean),
    segments,
    total,
  };
}

export const EXPORT_LIMIT = 10_000;

export async function exportContacts(f: ContactFilters) {
  const db = await getDb();
  return db
    .select({
      email: c.email,
      name: c.name,
      phone: c.phone,
      company: c.company,
      website: c.website,
      stage: c.stage,
      score: c.score,
      segment: c.segment,
      source: c.source,
      utm: c.utm,
      referrer: c.referrer,
      landingPage: c.landingPage,
      tags: c.tags,
      dealValueCents: c.dealValueCents,
      lifetimeValueCents: c.lifetimeValueCents,
      unsubscribed: c.unsubscribed,
      createdAt: c.createdAt,
      lastActivityAt: c.lastActivityAt,
    })
    .from(c)
    .where(contactWhere(f))
    .orderBy(...contactOrder(f.sort))
    .limit(EXPORT_LIMIT);
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export const DASHBOARD_RANGES = [7, 30, 90] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export function parseRange(value: unknown): DashboardRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (DASHBOARD_RANGES as readonly number[]).includes(n) ? (n as DashboardRange) : 30;
}

/** Fixed lead-source series for the "leads over time" chart (colour follows the source, never its rank). */
export const LEAD_SERIES = [
  { key: "lead_magnet", label: "Free guide" },
  { key: "assessment", label: "AI assessment" },
  { key: "booking", label: "Booking" },
  { key: "chat", label: "AI chat" },
  { key: "other", label: "Other sources" },
] as const;

export async function getDashboard(range: DashboardRange) {
  const db = await getDb();
  const tz = await getBusinessTimezone();
  const now = new Date();
  const nowDt = DateTime.fromJSDate(now, { zone: tz });
  const startDt = nowDt.startOf("day").minus({ days: range - 1 });
  const start = startDt.toJSDate();
  const prevStart = startDt.minus({ days: range }).toJSDate();
  const endOfToday = nowDt.endOf("day").toJSDate();
  const days = Array.from({ length: range }, (_, i) => startDt.plus({ days: i }).toISODate() ?? "");

  const b = schema.bookings;
  const o = schema.orders;
  const t = schema.tasks;
  const a = schema.activities;

  const inPeriod = (col: AnyPgColumn) => gte(col, start);
  const inPrev = (col: AnyPgColumn) => and(gte(col, prevStart), lt(col, start));
  // A booked call = any booking except a live unpaid hold, or a cancelled one that was never paid for: released
  // because payment never completed (cron, failed checkout, "choose a different time"), or a paid session's hold
  // cancelled before payment by the invitee or an admin. coalesce keeps NULL reasons counted.
  const booked = and(
    ne(b.status, "pending_payment"),
    sql`not (${b.status} = 'cancelled' and (
      coalesce(${b.cancelReason}, '') in (${HOLD_EXPIRED_REASON}, ${CHECKOUT_FAILED_REASON}, ${CHANGED_BEFORE_PAYING_REASON})
      or (exists (select 1 from meeting_types bmt where bmt.id = ${b.meetingTypeId} and bmt.price_cents > 0)
        and not exists (select 1 from orders bo where bo.booking_id = ${b.id} and bo.status in ('paid', 'refunded')))
    ))`,
  );
  const paid = eq(o.status, "paid");

  const leadDay = dayOf(c.createdAt, tz);
  const utmSource = sql<string>`coalesce(nullif(lower(${c.utm}->>'source'), ''), 'direct')`;

  const [
    [contactKpis],
    [bookingKpis],
    [orderKpis],
    [taskKpis],
    leadsByDay,
    bookingsByDay,
    revenueByDay,
    pipeline,
    sourceRows,
    utmRows,
    hotLeads,
    upcoming,
    dueTasks,
    recent,
  ] = await Promise.all([
    db
      .select({
        leads: cnt(inPeriod(c.createdAt)),
        leadsPrev: cnt(inPrev(c.createdAt)),
        customers: cnt(and(inPeriod(c.createdAt), eq(c.stage, "customer"))),
        customersPrev: cnt(and(inPrev(c.createdAt), eq(c.stage, "customer"))),
        avgScore: sql<number | null>`avg(${c.score}) filter (where ${inPeriod(c.createdAt)})`,
        avgScorePrev: sql<number | null>`avg(${c.score}) filter (where ${inPrev(c.createdAt)})`,
        total: count(),
      })
      .from(c),
    db
      .select({ booked: cnt(and(inPeriod(b.createdAt), booked)), bookedPrev: cnt(and(inPrev(b.createdAt), booked)) })
      .from(b),
    db
      .select({
        revenue: sql<number>`coalesce(sum(${o.amountCents}) filter (where ${and(paid, gte(o.paidAt, start))}), 0)`.mapWith(Number),
        revenuePrev: sql<number>`coalesce(sum(${o.amountCents}) filter (where ${and(paid, gte(o.paidAt, prevStart), lt(o.paidAt, start))}), 0)`.mapWith(Number),
        paidOrders: cnt(and(paid, gte(o.paidAt, start))),
        testOrders: cnt(and(paid, gte(o.paidAt, start), eq(o.isTest, true))),
      })
      .from(o),
    db
      .select({ open: cnt(isNull(t.completedAt)), overdue: cnt(and(isNull(t.completedAt), lt(t.dueAt, now))) })
      .from(t),
    db
      .select({ day: leadDay, source: c.source, n: count() })
      .from(c)
      .where(gte(c.createdAt, start))
      .groupBy(sql`1`, sql`2`),
    db
      .select({ day: dayOf(b.createdAt, tz), n: count() })
      .from(b)
      .where(and(gte(b.createdAt, start), booked))
      .groupBy(sql`1`),
    db
      .select({ day: dayOf(sql`${o.paidAt}`, tz), cents: sql<number>`sum(${o.amountCents})`.mapWith(Number) })
      .from(o)
      .where(and(paid, gte(o.paidAt, start)))
      .groupBy(sql`1`),
    db
      .select({ stage: c.stage, n: count(), dealCents: sql<number>`coalesce(sum(${c.dealValueCents}), 0)`.mapWith(Number) })
      .from(c)
      .groupBy(c.stage),
    db
      .select({ source: c.source, n: count() })
      .from(c)
      .where(gte(c.createdAt, start))
      .groupBy(c.source)
      .orderBy(desc(count())),
    db.select({ source: utmSource, n: count() }).from(c).where(gte(c.createdAt, start)).groupBy(sql`1`).orderBy(desc(count())),
    db
      .select({
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.company,
        score: c.score,
        stage: c.stage,
        dealValueCents: c.dealValueCents,
        lastActivityAt: c.lastActivityAt,
      })
      .from(c)
      .where(and(gte(c.score, 60), notInArray(c.stage, ["customer", "lost"])))
      .orderBy(desc(c.score), desc(c.lastActivityAt))
      .limit(6),
    db
      .select({
        id: b.id,
        startAt: b.startAt,
        status: b.status,
        meetingType: schema.meetingTypes.name,
        color: schema.meetingTypes.color,
        contactId: c.id,
        contactName: c.name,
        contactEmail: c.email,
      })
      .from(b)
      .innerJoin(schema.meetingTypes, eq(schema.meetingTypes.id, b.meetingTypeId))
      .innerJoin(c, eq(c.id, b.contactId))
      .where(and(gt(b.startAt, now), or(eq(b.status, "confirmed"), and(eq(b.status, "pending_payment"), gt(b.holdExpiresAt, now)))))
      .orderBy(asc(b.startAt))
      .limit(5),
    taskSelect(db)
      .where(and(isNull(t.completedAt), lte(t.dueAt, endOfToday)))
      .orderBy(asc(t.dueAt))
      .limit(8),
    db
      .select({
        id: a.id,
        type: a.type,
        title: a.title,
        createdAt: a.createdAt,
        contactId: c.id,
        contactName: c.name,
        contactEmail: c.email,
      })
      .from(a)
      .innerJoin(c, eq(c.id, a.contactId))
      .orderBy(desc(a.createdAt))
      .limit(15),
  ]);

  // Leads over time, stacked by the fixed funnel entry points.
  const seriesKeys = LEAD_SERIES.map((s) => s.key) as string[];
  const dayIndex = new Map(days.map((d, i) => [d, i]));
  const leadSeries = LEAD_SERIES.map((s) => ({ key: s.key, label: s.label, values: days.map(() => 0) }));
  for (const row of leadsByDay) {
    const i = dayIndex.get(row.day);
    if (i === undefined) continue;
    const key = row.source && seriesKeys.includes(row.source) && row.source !== "other" ? row.source : "other";
    const s = leadSeries.find((x) => x.key === key);
    if (s) s.values[i] += row.n;
  }
  const dailyTotals = days.map((_, i) => leadSeries.reduce((sum, s) => sum + s.values[i], 0));
  const bookingSpark = days.map(() => 0);
  for (const row of bookingsByDay) {
    const i = dayIndex.get(row.day);
    if (i !== undefined) bookingSpark[i] += row.n;
  }
  const revenueSpark = days.map(() => 0);
  for (const row of revenueByDay) {
    const i = dayIndex.get(row.day);
    if (i !== undefined) revenueSpark[i] += row.cents;
  }

  const pipelineByStage = new Map(pipeline.map((p) => [p.stage, p]));
  const pipelineSummary = STAGE_ORDER.map((stage) => ({
    stage,
    count: pipelineByStage.get(stage)?.n ?? 0,
    dealCents: pipelineByStage.get(stage)?.dealCents ?? 0,
  }));

  const ck = contactKpis;
  const conversion = ck.leads ? ck.customers / ck.leads : null;
  const conversionPrev = ck.leadsPrev ? ck.customersPrev / ck.leadsPrev : null;
  const avg = (v: unknown) => (v === null || v === undefined ? null : toNum(v));

  return {
    tz,
    range,
    days,
    totalContacts: ck.total,
    kpis: {
      leads: { value: ck.leads, prev: ck.leadsPrev, spark: dailyTotals },
      calls: { value: bookingKpis.booked, prev: bookingKpis.bookedPrev, spark: bookingSpark },
      revenue: { value: orderKpis.revenue, prev: orderKpis.revenuePrev, spark: revenueSpark, orders: orderKpis.paidOrders, testOrders: orderKpis.testOrders },
      conversion: { value: conversion, prev: conversionPrev, customers: ck.customers },
      openTasks: { value: taskKpis.open, overdue: taskKpis.overdue },
      avgScore: { value: avg(ck.avgScore), prev: avg(ck.avgScorePrev) },
    },
    leadSeries,
    pipelineSummary,
    sources: sourceRows.map((r) => ({ key: r.source ?? "unknown", n: r.n })),
    utmSources: utmRows.map((r) => ({ key: r.source, n: r.n })),
    hotLeads,
    upcoming,
    dueTasks,
    recent,
  };
}
export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

type DbInstance = Awaited<ReturnType<typeof getDb>>;

function taskSelect(db: DbInstance) {
  const t = schema.tasks;
  return db
    .select({
      id: t.id,
      title: t.title,
      description: t.description,
      dueAt: t.dueAt,
      priority: t.priority,
      origin: t.origin,
      completedAt: t.completedAt,
      createdAt: t.createdAt,
      contactId: t.contactId,
      contactName: c.name,
      contactEmail: c.email,
    })
    .from(t)
    .leftJoin(c, eq(c.id, t.contactId));
}

export async function getTaskBoard() {
  const db = await getDb();
  const tz = await getBusinessTimezone();
  const t = schema.tasks;
  const now = new Date();
  const endOfToday = DateTime.fromJSDate(now, { zone: tz }).endOf("day").toJSDate();
  const [open, completed] = await Promise.all([
    taskSelect(db)
      .where(isNull(t.completedAt))
      .orderBy(sql`${t.dueAt} asc nulls last`, desc(t.createdAt))
      .limit(500),
    taskSelect(db).where(isNotNull(t.completedAt)).orderBy(desc(t.completedAt)).limit(20),
  ]);
  type Row = (typeof open)[number];
  const overdue: Row[] = [];
  const today: Row[] = [];
  const upcoming: Row[] = [];
  const noDate: Row[] = [];
  for (const task of open) {
    if (!task.dueAt) noDate.push(task);
    else if (task.dueAt < now) overdue.push(task);
    else if (task.dueAt <= endOfToday) today.push(task);
    else upcoming.push(task);
  }
  return { tz, overdue, today, upcoming, noDate, completed };
}
export type TaskRow = Awaited<ReturnType<typeof getTaskBoard>>["completed"][number];

/** Contacts for the task form's contact picker (most recently active first). */
export async function contactOptions(limit = 500) {
  const db = await getDb();
  return db.select({ id: c.id, name: c.name, email: c.email }).from(c).orderBy(desc(c.lastActivityAt)).limit(limit);
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                            */
/* ------------------------------------------------------------------ */

const PipelineFiltersSchema = ContactFiltersSchema.pick({ q: true, segment: true, minScore: true });
export type PipelineFilters = z.infer<typeof PipelineFiltersSchema>;

export function parsePipelineFilters(input: RawParams): PipelineFilters {
  return PipelineFiltersSchema.parse(plainParams(input));
}

export const PIPELINE_CARDS_PER_STAGE = 100;

export async function getPipelineBoard(f: PipelineFilters) {
  const db = await getDb();
  const where = contactWhere(f);
  const ranked = db
    .select({
      id: c.id,
      name: c.name,
      email: c.email,
      company: c.company,
      stage: c.stage,
      score: c.score,
      segment: c.segment,
      dealValueCents: c.dealValueCents,
      lastActivityAt: c.lastActivityAt,
      rn: sql<number>`row_number() over (partition by ${c.stage} order by ${c.lastActivityAt} desc, ${c.id})`.as("rn"),
    })
    .from(c)
    .where(where)
    .as("ranked");
  const [cards, totals] = await Promise.all([
    db
      .select({
        id: ranked.id,
        name: ranked.name,
        email: ranked.email,
        company: ranked.company,
        stage: ranked.stage,
        score: ranked.score,
        segment: ranked.segment,
        dealValueCents: ranked.dealValueCents,
        lastActivityAt: ranked.lastActivityAt,
      })
      .from(ranked)
      .where(lte(ranked.rn, PIPELINE_CARDS_PER_STAGE))
      .orderBy(desc(ranked.lastActivityAt)),
    db
      .select({ stage: c.stage, n: count(), dealCents: sql<number>`coalesce(sum(${c.dealValueCents}), 0)`.mapWith(Number) })
      .from(c)
      .where(where)
      .groupBy(c.stage),
  ]);
  const ids = cards.map((card) => card.id);
  const openTasks = ids.length
    ? await db
        .select({ contactId: schema.tasks.contactId, n: count() })
        .from(schema.tasks)
        .where(and(inArray(schema.tasks.contactId, ids), isNull(schema.tasks.completedAt)))
        .groupBy(schema.tasks.contactId)
    : [];
  const taskMap = new Map(openTasks.map((r) => [r.contactId, r.n]));
  const totalMap = new Map(totals.map((r) => [r.stage, r]));
  return {
    cards: cards.map((card) => ({ ...card, openTasks: taskMap.get(card.id) ?? 0, lastActivityAt: card.lastActivityAt.toISOString() })),
    totals: Object.fromEntries(STAGE_ORDER.map((s) => [s, { count: totalMap.get(s)?.n ?? 0, dealCents: totalMap.get(s)?.dealCents ?? 0 }])) as Record<
      Stage,
      { count: number; dealCents: number }
    >,
  };
}
export type PipelineBoardData = Awaited<ReturnType<typeof getPipelineBoard>>;

/* ------------------------------------------------------------------ */
/* Contact 360°                                                        */
/* ------------------------------------------------------------------ */

export async function getContact360(id: string) {
  const db = await getDb();
  const [contact] = await db.select().from(c).where(eq(c.id, id)).limit(1);
  if (!contact) return null;

  const a = schema.activities;
  const t = schema.tasks;
  const b = schema.bookings;
  const ev = schema.events;
  const en = schema.sequenceEnrollments;
  const eventScope = contact.visitorId ? or(eq(ev.contactId, id), eq(ev.visitorId, contact.visitorId)) : eq(ev.contactId, id);

  const [activities, scoreActivities, tasks, bookings, orders, quizzes, chats, emails, enrollments, [eventSummary], recentEvents] = await Promise.all([
    db.select().from(a).where(eq(a.contactId, id)).orderBy(desc(a.createdAt)).limit(200),
    db.select({ type: a.type, meta: a.meta }).from(a).where(eq(a.contactId, id)),
    taskSelect(db)
      .where(eq(t.contactId, id))
      .orderBy(sql`${t.completedAt} is not null`, sql`${t.dueAt} asc nulls last`, desc(t.createdAt))
      .limit(50),
    db
      .select({
        id: b.id,
        startAt: b.startAt,
        endAt: b.endAt,
        status: b.status,
        manageToken: b.manageToken,
        answers: b.answers,
        notes: b.notes,
        meetingType: schema.meetingTypes.name,
        meetingTypeQuestions: schema.meetingTypes.questions,
        color: schema.meetingTypes.color,
      })
      .from(b)
      .innerJoin(schema.meetingTypes, eq(schema.meetingTypes.id, b.meetingTypeId))
      .where(eq(b.contactId, id))
      .orderBy(desc(b.startAt))
      .limit(20),
    db.select().from(schema.orders).where(eq(schema.orders.contactId, id)).orderBy(desc(schema.orders.createdAt)).limit(20),
    db.select().from(schema.quizSubmissions).where(eq(schema.quizSubmissions.contactId, id)).orderBy(desc(schema.quizSubmissions.createdAt)).limit(5),
    db
      .select()
      .from(schema.chatConversations)
      .where(eq(schema.chatConversations.contactId, id))
      .orderBy(desc(schema.chatConversations.updatedAt))
      .limit(10),
    db
      .select({
        id: schema.emailLog.id,
        subject: schema.emailLog.subject,
        kind: schema.emailLog.kind,
        status: schema.emailLog.status,
        error: schema.emailLog.error,
        createdAt: schema.emailLog.createdAt,
      })
      .from(schema.emailLog)
      .where(eq(schema.emailLog.contactId, id))
      .orderBy(desc(schema.emailLog.createdAt))
      .limit(50),
    db
      .select({
        id: en.id,
        status: en.status,
        nextStep: en.nextStep,
        nextRunAt: en.nextRunAt,
        createdAt: en.createdAt,
        sequenceName: schema.emailSequences.name,
        trigger: schema.emailSequences.trigger,
        stepCount: sql<number>`(select count(*) from ${schema.sequenceSteps} where ${schema.sequenceSteps.sequenceId} = ${en.sequenceId})`.mapWith(Number),
      })
      .from(en)
      .innerJoin(schema.emailSequences, eq(schema.emailSequences.id, en.sequenceId))
      .where(eq(en.contactId, id))
      .orderBy(desc(en.createdAt)),
    db
      .select({
        total: count(),
        pageViews: cnt(eq(ev.name, "page_view")),
        firstSeen: sql<Date | null>`min(${ev.createdAt})`.mapWith((v) => (v ? new Date(v as string) : null)),
        lastSeen: sql<Date | null>`max(${ev.createdAt})`.mapWith((v) => (v ? new Date(v as string) : null)),
        pages: sql<number>`count(distinct ${ev.path})`.mapWith(Number),
      })
      .from(ev)
      .where(eventScope),
    db
      .select({ id: ev.id, name: ev.name, path: ev.path, createdAt: ev.createdAt })
      .from(ev)
      .where(eventScope)
      .orderBy(desc(ev.createdAt))
      .limit(12),
  ]);

  return { contact, activities, scoreActivities, tasks, bookings, orders, quizzes, chats, emails, enrollments, eventSummary, recentEvents };
}
export type Contact360 = NonNullable<Awaited<ReturnType<typeof getContact360>>>;
