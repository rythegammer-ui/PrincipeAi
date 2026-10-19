import "server-only";
import { and, asc, eq, gt, inArray, lt, ne, or, type SQL } from "drizzle-orm";
import { DateTime, IANAZone } from "luxon";
import { getDb, schema } from "@/db";
import type { MeetingType } from "@/db/schema";
import { site } from "@/config/site";
import { getSettings } from "@/lib/settings";

/**
 * Scheduling: a pure, timezone-aware slot engine (`computeSlots`) plus the data loaders
 * that feed it from the database (`getAvailability`, `isSlotAvailable`).
 *
 * Availability rules and blocked dates are wall-clock values in the BUSINESS timezone
 * (settings.timezone). All instants that leave this module are UTC ISO strings.
 */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MINUTES = 24 * 60;

export type WeeklyRule = {
  /** ISO weekday: 1 = Monday … 7 = Sunday. */
  weekday: number;
  /** Minutes from local midnight (0–1440). */
  startMinute: number;
  endMinute: number;
};

/**
 * An existing commitment. `bufferMin` is the buffer of that booking's own meeting type: the gap kept
 * around it is the larger of its buffer and the buffer of the type being booked.
 */
export type BusyInterval = { start: Date | string; end: Date | string; bufferMin?: number | null };

/** Highest buffer an admin can set on a meeting type (minutes). Conflict checks look this far around a new booking. */
export const MAX_BUFFER_MIN = 240;

/**
 * Meeting types the site's funnels link to by slug (home page offers, consulting application,
 * assessment results, free-guide thank-you page, prep tips). Their URLs can't be changed in admin.
 */
export const BUILT_IN_MEETING_SLUGS = ["ai-strategy-call", "ai-coaching-session", "implementation-discovery"] as const;

export function isBuiltInMeetingSlug(slug: string): boolean {
  return (BUILT_IN_MEETING_SLUGS as readonly string[]).includes(slug);
}

/** Minutes kept free between two meetings: the larger of the two meeting types' buffers. */
export function bufferBetween(aMin: number | null | undefined, bMin: number | null | undefined): number {
  const a = Number(aMin);
  const b = Number(bMin);
  return Math.max(0, Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0);
}

export type ComputeSlotsInput = {
  rules: WeeklyRule[];
  /** "YYYY-MM-DD" dates (business timezone) with no availability at all. */
  blockedDates: string[];
  /** Existing commitments. Each is expanded on both sides by the larger of `bufferMin` and its own `bufferMin`. */
  busy: BusyInterval[];
  durationMin: number;
  bufferMin: number;
  minNoticeHours: number;
  /** Last bookable day = today (business tz) + maxDaysAhead, inclusive. */
  maxDaysAhead: number;
  businessTz: string;
  now: Date | string;
  /** Only return slots starting at or after this instant. */
  from?: Date | string;
  /** Only return slots starting before this instant. */
  to?: Date | string;
  /** Slot start granularity in minutes. Default: 15 for meetings ≤ 20 min, otherwise 30. */
  stepMin?: number;
};

function toMillis(value: Date | string | number): number {
  if (typeof value === "number") return value;
  return typeof value === "string" ? Date.parse(value) : value.getTime();
}

export function defaultStepMin(durationMin: number): number {
  return durationMin <= 20 ? 15 : 30;
}

export function isValidTimezone(tz: unknown): tz is string {
  return typeof tz === "string" && tz.length > 0 && tz.length <= 64 && IANAZone.isValidZone(tz);
}

/** A wall-clock time on `day` (a start-of-day DateTime in the business zone). 1440 = next midnight. */
function wallClock(day: DateTime, minuteOfDay: number): DateTime {
  if (minuteOfDay >= DAY_MINUTES) return day.plus({ days: 1 }).startOf("day");
  // Luxon resolves wall-clock times in a DST gap by shifting forward, and ambiguous
  // (repeated) times to the earlier offset — both are what a booking page should do.
  return day.set({ hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60, second: 0, millisecond: 0 });
}

/**
 * Computes bookable slot start times.
 *
 * A slot is offered when it:
 * - starts on a `stepMin` boundary (wall-clock aligned) inside a weekly rule window and ends inside it,
 * - starts at least `minNoticeHours` from `now` and no later than the end of day `today + maxDaysAhead`,
 * - is not on a blocked date,
 * - does not overlap any busy interval widened on both sides by the larger of `bufferMin` and that
 *   interval's own buffer (so a meeting type with a long buffer keeps it, whatever is booked next to it).
 *
 * Windows are walked in absolute time from their wall-clock start, so DST transitions inside a
 * window are handled correctly (no phantom slots in a spring-forward gap; the repeated hour on a
 * fall-back day is offered once per real instant). Returns sorted, de-duplicated UTC ISO strings.
 */
export function computeSlots(input: ComputeSlotsInput): string[] {
  const durationMin = Math.floor(input.durationMin);
  if (!Number.isFinite(durationMin) || durationMin <= 0) return [];
  const zone = input.businessTz;
  if (!isValidTimezone(zone)) throw new Error(`Invalid business timezone: ${zone}`);
  const stepMin = input.stepMin && input.stepMin > 0 ? Math.floor(input.stepMin) : defaultStepMin(durationMin);
  const durationMs = durationMin * MINUTE_MS;
  const stepMs = stepMin * MINUTE_MS;

  const nowMs = toMillis(input.now);
  if (!Number.isFinite(nowMs)) return [];
  const today = DateTime.fromMillis(nowMs, { zone }).startOf("day");
  const horizonMs = today.plus({ days: Math.max(0, Math.floor(input.maxDaysAhead)) + 1 }).startOf("day").toMillis();

  let lower = nowMs + Math.max(0, input.minNoticeHours || 0) * HOUR_MS;
  let upper = horizonMs;
  if (input.from !== undefined) lower = Math.max(lower, toMillis(input.from));
  if (input.to !== undefined) upper = Math.min(upper, toMillis(input.to));
  if (!Number.isFinite(lower) || !Number.isFinite(upper) || lower >= upper) return [];

  const blocked = new Set(input.blockedDates);
  const busy: [number, number][] = [];
  for (const b of input.busy) {
    const s = toMillis(b.start);
    const e = toMillis(b.end);
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) continue;
    const pad = bufferBetween(input.bufferMin, b.bufferMin) * MINUTE_MS;
    busy.push([s - pad, e + pad]);
  }
  const overlapsBusy = (s: number, e: number) => busy.some(([bs, be]) => s < be && e > bs);

  const rulesByWeekday = new Map<number, WeeklyRule[]>();
  for (const r of input.rules) {
    const list = rulesByWeekday.get(r.weekday) ?? [];
    list.push(r);
    rulesByWeekday.set(r.weekday, list);
  }

  const found = new Set<number>();
  let day = DateTime.fromMillis(lower, { zone }).startOf("day");
  const lastDayMs = DateTime.fromMillis(upper - 1, { zone }).startOf("day").toMillis();

  while (day.toMillis() <= lastDayMs) {
    if (!blocked.has(day.toISODate() ?? "")) {
      for (const rule of rulesByWeekday.get(day.weekday) ?? []) {
        const startMinute = Math.max(0, Math.min(DAY_MINUTES, Math.floor(rule.startMinute)));
        const endMinute = Math.max(0, Math.min(DAY_MINUTES, Math.floor(rule.endMinute)));
        if (endMinute <= startMinute) continue;
        const windowStart = wallClock(day, startMinute).toMillis();
        const windowEnd = wallClock(day, endMinute).toMillis();
        const firstMinute = Math.ceil(startMinute / stepMin) * stepMin;
        if (firstMinute >= endMinute) continue;
        for (let t = wallClock(day, firstMinute).toMillis(); t + durationMs <= windowEnd; t += stepMs) {
          if (t < windowStart || t < lower || t >= upper) continue;
          if (overlapsBusy(t, t + durationMs)) continue;
          found.add(t);
        }
      }
    }
    day = day.plus({ days: 1 }).startOf("day");
  }

  return [...found].sort((a, b) => a - b).map((ms) => new Date(ms).toISOString());
}

/* ------------------------------------------------------------------ */
/* Formatting helpers (server)                                         */
/* ------------------------------------------------------------------ */

/** Human-friendly labels for a meeting time in a given timezone. */
export function describeTime(start: Date, end: Date, tz: string) {
  const zone = isValidTimezone(tz) ? tz : "UTC";
  const s = DateTime.fromJSDate(start, { zone });
  const e = DateTime.fromJSDate(end, { zone });
  const sameMeridiem = s.toFormat("a") === e.toFormat("a");
  const timeLabel = `${s.toFormat(sameMeridiem ? "h:mm" : "h:mm a")} – ${e.toFormat("h:mm a")}`;
  return {
    /** "Tuesday, March 10, 2026" */
    dateLabel: s.toFormat("cccc, LLLL d, yyyy"),
    /** "Tue, Mar 10" */
    shortDateLabel: s.toFormat("ccc, LLL d"),
    /** "9:00 – 9:30 AM" */
    timeLabel,
    /** "9:00 AM" */
    startTimeLabel: s.toFormat("h:mm a"),
    /** "EDT" */
    zoneAbbr: s.toFormat("ZZZZ"),
    /** "Eastern Daylight Time" */
    zoneLong: s.offsetNameLong ?? zone,
    zone,
  };
}

/** "Tuesday, March 10, 2026 · 9:00 – 9:30 AM (Eastern Daylight Time)" */
export function formatMeetingTime(start: Date, end: Date, tz: string): string {
  const d = describeTime(start, end, tz);
  return `${d.dateLabel} · ${d.timeLabel} (${d.zoneLong})`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr${h > 1 ? "s" : ""}`;
}

/* ------------------------------------------------------------------ */
/* Data loaders                                                        */
/* ------------------------------------------------------------------ */

/** The business timezone (settings → site config → UTC), always a valid IANA zone. */
export async function getBusinessTimezone(): Promise<string> {
  const s = await getSettings();
  if (isValidTimezone(s.timezone)) return s.timezone;
  return isValidTimezone(site.timezone) ? site.timezone : "UTC";
}

export async function getActiveMeetingType(slug: string, opts: { includeInactive?: boolean } = {}): Promise<MeetingType | null> {
  if (!slug || slug.length > 100) return null;
  const db = await getDb();
  const [mt] = await db
    .select()
    .from(schema.meetingTypes)
    .where(opts.includeInactive ? eq(schema.meetingTypes.slug, slug) : and(eq(schema.meetingTypes.slug, slug), eq(schema.meetingTypes.active, true)))
    .limit(1);
  return mt ?? null;
}

export async function listActiveMeetingTypes(): Promise<MeetingType[]> {
  const db = await getDb();
  return db
    .select()
    .from(schema.meetingTypes)
    .where(eq(schema.meetingTypes.active, true))
    .orderBy(asc(schema.meetingTypes.sortOrder), asc(schema.meetingTypes.name));
}

/** Statuses whose time is blocked on the calendar (pending holds are added separately). */
export const BUSY_STATUSES = ["confirmed", "completed", "no_show"] as const;

/** SQL condition: the booking currently occupies its time slot. */
export function occupiesSlot(now: Date = new Date()): SQL {
  return or(
    inArray(schema.bookings.status, [...BUSY_STATUSES]),
    and(eq(schema.bookings.status, "pending_payment"), gt(schema.bookings.holdExpiresAt, now)),
  ) as SQL;
}

async function loadBusy(fromMs: number, toMs: number, excludeBookingId?: string): Promise<BusyInterval[]> {
  const db = await getDb();
  // One day either side covers the widest buffer (MAX_BUFFER_MIN) of any booking next to the range.
  const pad = Math.max(DAY_MINUTES, MAX_BUFFER_MIN) * MINUTE_MS;
  const conds: SQL[] = [
    occupiesSlot(),
    lt(schema.bookings.startAt, new Date(toMs + pad)),
    gt(schema.bookings.endAt, new Date(fromMs - pad)),
  ];
  if (excludeBookingId) conds.push(ne(schema.bookings.id, excludeBookingId));
  return db
    .select({ start: schema.bookings.startAt, end: schema.bookings.endAt, bufferMin: schema.meetingTypes.bufferMin })
    .from(schema.bookings)
    .innerJoin(schema.meetingTypes, eq(schema.meetingTypes.id, schema.bookings.meetingTypeId))
    .where(and(...conds));
}

export async function loadAvailabilityConfig(): Promise<{ rules: WeeklyRule[]; blockedDates: string[]; timezone: string }> {
  const db = await getDb();
  const [rules, blocked, timezone] = await Promise.all([
    db
      .select({ weekday: schema.availabilityRules.weekday, startMinute: schema.availabilityRules.startMinute, endMinute: schema.availabilityRules.endMinute })
      .from(schema.availabilityRules),
    db.select({ date: schema.blockedDates.date }).from(schema.blockedDates),
    getBusinessTimezone(),
  ]);
  return { rules, blockedDates: blocked.map((b) => b.date), timezone };
}

/** Slots for one meeting type within [fromMs, toMs). */
export async function slotsForMeetingType(
  meetingType: MeetingType,
  fromMs: number,
  toMs: number,
  opts: { excludeBookingId?: string; now?: Date } = {},
): Promise<{ slots: string[]; timezone: string }> {
  const [config, busy] = await Promise.all([loadAvailabilityConfig(), loadBusy(fromMs, toMs, opts.excludeBookingId)]);
  const slots = computeSlots({
    rules: config.rules,
    blockedDates: config.blockedDates,
    busy,
    durationMin: meetingType.durationMin,
    bufferMin: meetingType.bufferMin,
    minNoticeHours: meetingType.minNoticeHours,
    maxDaysAhead: meetingType.maxDaysAhead,
    businessTz: config.timezone,
    now: opts.now ?? new Date(),
    from: new Date(fromMs),
    to: new Date(toMs),
  });
  return { slots, timezone: config.timezone };
}

export type AvailabilityResult = { meetingType: MeetingType; slots: string[]; businessTimezone: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Bookable slots for an active meeting type between two dates (inclusive, "YYYY-MM-DD",
 * interpreted in the business timezone). Returns null when the meeting type doesn't exist
 * or is inactive (unless `includeInactive`, used when rescheduling an existing booking). Busy time = confirmed/completed bookings + unexpired payment holds.
 */
export async function getAvailability(
  meetingTypeSlug: string,
  fromISODate: string,
  toISODate: string,
  opts: { excludeBookingId?: string; now?: Date; includeInactive?: boolean } = {},
): Promise<AvailabilityResult | null> {
  const meetingType = await getActiveMeetingType(meetingTypeSlug, { includeInactive: opts.includeInactive });
  if (!meetingType) return null;
  const timezone = await getBusinessTimezone();
  if (!ISO_DATE.test(fromISODate) || !ISO_DATE.test(toISODate)) throw new Error("Dates must be YYYY-MM-DD");
  const from = DateTime.fromISO(fromISODate, { zone: timezone }).startOf("day");
  const to = DateTime.fromISO(toISODate, { zone: timezone }).plus({ days: 1 }).startOf("day");
  if (!from.isValid || !to.isValid) throw new Error("Invalid date range");
  const { slots } = await slotsForMeetingType(meetingType, from.toMillis(), to.toMillis(), opts);
  return { meetingType, slots, businessTimezone: timezone };
}

/** True when `start` is currently an offered slot for this meeting type. */
export async function isSlotAvailable(
  meetingType: MeetingType,
  start: Date,
  opts: { excludeBookingId?: string } = {},
): Promise<boolean> {
  const ms = start.getTime();
  if (!Number.isFinite(ms)) return false;
  const { slots } = await slotsForMeetingType(meetingType, ms, ms + MINUTE_MS, opts);
  return slots.some((s) => Date.parse(s) === ms);
}

/** Business-timezone helpers for pages that need "today" and the booking horizon. */
export function bookingWindow(meetingType: Pick<MeetingType, "maxDaysAhead">, timezone: string, now: Date = new Date()) {
  const today = DateTime.fromJSDate(now, { zone: timezone }).startOf("day");
  return {
    todayKey: today.toISODate() ?? "",
    lastDateKey: today.plus({ days: Math.max(0, meetingType.maxDaysAhead) }).toISODate() ?? "",
  };
}
