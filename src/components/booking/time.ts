/**
 * Client-safe date helpers for the booking UI. Uses Intl only (no Luxon, no server imports).
 * "Keys" are calendar dates as "YYYY-MM-DD"; "month keys" are "YYYY-MM".
 */

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(opts: Intl.DateTimeFormatOptions, locale = "en-US"): Intl.DateTimeFormat {
  const id = `${locale}|${JSON.stringify(opts)}`;
  let f = formatters.get(id);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opts);
    formatters.set(id, f);
  }
  return f;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function parseKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d: d || 1 };
}

export function toKey(y: number, m: number, d: number): string {
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(key: string, days: number): string {
  const { y, m, d } = parseKey(key);
  return toKey(y, m, d + days);
}

/** Same day-of-month in another month, clamped to that month's length. */
export function addMonthsToKey(key: string, months: number): string {
  const { y, m, d } = parseKey(key);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return toKey(first.getUTCFullYear(), first.getUTCMonth() + 1, Math.min(d, last));
}

export function addMonths(monthKey: string, months: number): string {
  return addMonthsToKey(`${monthKey}-01`, months).slice(0, 7);
}

export function daysInMonth(monthKey: string): number {
  const { y, m } = parseKey(`${monthKey}-01`);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: string): number {
  const { y, m, d } = parseKey(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Calendar grid for a month (Sunday first), as weeks of date keys (null = padding). */
export function monthWeeks(monthKey: string): (string | null)[][] {
  const first = `${monthKey}-01`;
  const cells: (string | null)[] = Array.from({ length: weekdayOf(first) }, () => null);
  const total = daysInMonth(monthKey);
  for (let d = 1; d <= total; d++) cells.push(`${monthKey}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** The calendar date of an instant in a timezone. */
export function dateKeyInZone(instant: string | number | Date, timeZone: string): string {
  const parts = formatter({ timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** "9:00 AM" */
export function formatTime(instant: string | number | Date, timeZone: string): string {
  return formatter({ timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(instant));
}

/** Formats a date key (no timezone shifting). Default: "Tuesday, June 2". */
export function formatDateKey(key: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }): string {
  const { y, m, d } = parseKey(key);
  return formatter({ ...opts, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "June 2026" */
export function formatMonthKey(monthKey: string): string {
  return formatDateKey(`${monthKey}-01`, { month: "long", year: "numeric" });
}

/** Slots grouped by their calendar date in `timeZone` (input order preserved). */
export function groupByDate(slots: string[], timeZone: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const s of slots) {
    const key = dateKeyInZone(s, timeZone);
    const list = map.get(key);
    if (list) list.push(s);
    else map.set(key, [s]);
  }
  return map;
}

/** "GMT-4" for the timezone at a given instant. */
export function offsetLabel(timeZone: string, at: Date = new Date()): string {
  try {
    const part = formatter({ timeZone, timeZoneName: "shortOffset" })
      .formatToParts(at)
      .find((p) => p.type === "timeZoneName");
    return part?.value ?? "";
  } catch {
    return "";
  }
}

/** "New York" from "America/New_York"; "Argentina / Buenos Aires" for nested zones. */
export function cityLabel(timeZone: string): string {
  const parts = timeZone.split("/");
  return (parts.length > 1 ? parts.slice(1) : parts).join(" / ").replace(/_/g, " ");
}

/** "New York time (GMT-4)" */
export function describeTimezone(timeZone: string, at?: Date): string {
  const off = offsetLabel(timeZone, at);
  return `${cityLabel(timeZone)} time${off ? ` (${off})` : ""}`;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const FALLBACK_ZONES = [
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Chicago",
  "America/New_York",
  "America/Halifax",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

/** Timezones grouped by region for a <select>, always including `extra` zones (e.g. detected / current). */
export function timezoneGroups(extra: string[] = []): { region: string; zones: { value: string; label: string }[] }[] {
  let all: string[] = FALLBACK_ZONES;
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone");
    if (supported?.length) all = supported;
  } catch {
    /* older browsers: fallback list */
  }
  const set = new Set([...all, ...extra.filter(isValidTimeZone)]);
  const now = new Date();
  const groups = new Map<string, { value: string; label: string }[]>();
  for (const tz of [...set].sort()) {
    const region = tz.includes("/") ? tz.split("/")[0] : "Other";
    const list = groups.get(region) ?? [];
    const off = offsetLabel(tz, now);
    list.push({ value: tz, label: `${cityLabel(tz)}${off ? ` (${off})` : ""}` });
    groups.set(region, list);
  }
  return [...groups.entries()].map(([region, zones]) => ({ region, zones }));
}
