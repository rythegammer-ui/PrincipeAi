import { DateTime } from "luxon";

/**
 * The sales-agent program's rules and game mechanics: commission levels, badges, streaks and leaderboard names.
 * Pure (no database, no server-only imports): used by the commission engine, the agent portal and admin pages.
 */

export type Level = {
  /** Stable id (stored on commissions as the level name at the time, so renaming doesn't rewrite history). */
  key: string;
  name: string;
  /** Sales in a calendar month that reach this level. The first level starts at 0. */
  minSales: number;
  /** Commission rate in basis points (2000 = 20%). */
  rateBps: number;
};

export type ProgramSettings = {
  /** Whether /sales-team takes new applications. */
  applicationsOpen: boolean;
  /** Ascending by minSales; the first one has minSales 0. */
  levels: Level[];
  /** Days a sale's commission waits before it can be paid, so refunds come first. */
  holdDays: number;
  /** How long a customer stays with the agent who referred them: days from when they first signed up or bought through the agent's link. */
  attributionDays: number;
  /** Agents are paid once they're owed at least this much (cents). Shown to agents; admins can pay any time. */
  minPayoutCents: number;
  /** Shown to agents, e.g. "Twice a month, on the 1st and 15th". */
  payoutSchedule: string;
};

export const DEFAULT_LEVELS: Level[] = [
  { key: "starter", name: "Starter", minSales: 0, rateBps: 2000 },
  { key: "pro", name: "Pro", minSales: 5, rateBps: 2500 },
  { key: "elite", name: "Elite", minSales: 10, rateBps: 3000 },
];

export const DEFAULT_PROGRAM: ProgramSettings = {
  applicationsOpen: true,
  levels: DEFAULT_LEVELS,
  holdDays: 30,
  attributionDays: 90,
  minPayoutCents: 2500,
  payoutSchedule: "Twice a month, on the 1st and the 15th",
};

export const MAX_RATE_BPS = 9000;

export function formatRate(bps: number): string {
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}

/** Commission on a sale, rounded to the cent. */
export function commissionFor(saleCents: number, rateBps: number): number {
  return Math.round((Math.max(0, saleCents) * rateBps) / 10_000);
}

/** Cleans admin-entered levels: sorted, unique thresholds, the first at 0, rates within 0–90%. */
export function normalizeLevels(levels: readonly Level[]): Level[] {
  const clean = levels
    .filter((l) => l.name.trim() && Number.isFinite(l.minSales) && Number.isFinite(l.rateBps))
    .map((l) => ({
      key: l.key.trim() || l.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: l.name.trim().slice(0, 40),
      minSales: Math.max(0, Math.floor(l.minSales)),
      rateBps: Math.max(0, Math.min(MAX_RATE_BPS, Math.round(l.rateBps))),
    }))
    .sort((a, b) => a.minSales - b.minSales);
  const out: Level[] = [];
  for (const l of clean) if (!out.some((o) => o.minSales === l.minSales || o.key === l.key)) out.push(l);
  if (!out.length) return DEFAULT_LEVELS;
  out[0] = { ...out[0], minSales: 0 };
  return out;
}

export type LevelStanding = {
  level: Level;
  index: number;
  next: Level | null;
  /** Sales still needed this month to reach the next level (0 at the top). */
  toNext: number;
};

/**
 * The level an agent sells at: reached by sales this calendar month, or kept from last month ("reach a level and you
 * keep it through the end of next month"). `thisMonth` counts sales so far (pass +1 for the sale being recorded).
 */
export function standing(levels: readonly Level[], thisMonth: number, lastMonth = 0): LevelStanding {
  const list = levels.length ? levels : DEFAULT_LEVELS;
  const effective = Math.max(thisMonth, lastMonth);
  let index = 0;
  list.forEach((l, i) => {
    if (effective >= l.minSales) index = i;
  });
  const next = list[index + 1] ?? null;
  return { level: list[index], index, next, toNext: next ? Math.max(0, next.minSales - thisMonth) : 0 };
}

/** "Jane D." — how agents appear to each other on the leaderboard and team feed. */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Agent";
  const first = parts[0].slice(0, 24);
  const last = parts.length > 1 ? ` ${parts[parts.length - 1][0]!.toUpperCase()}.` : "";
  return `${first}${last}`;
}

/* ------------------------------------------------------------------ */
/* Referral codes                                                      */
/* ------------------------------------------------------------------ */

/**
 * 4–16 letters and digits, with at least one digit (generated codes end in two), so everyday `?ref=` values other
 * sites add to links (ref=producthunt, ref=newsletter) are never taken for an agent's code and never replace one.
 */
export const AGENT_CODE_RE = /^(?=.*\d)[A-Z0-9]{4,16}$/;

/** A referral code from a link or form (case-insensitive), or null when it can't be one. */
export function normalizeAgentCode(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  return AGENT_CODE_RE.test(code) ? code : null;
}

/** A readable code suggestion from the agent's name: up to 8 letters of their first name plus 2 digits. */
export function suggestAgentCode(name: string, random: () => number = Math.random): string {
  const letters = (name.trim().split(/\s+/)[0] ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
  const base = letters.length >= 2 ? letters : "AGENT";
  return `${base}${String(Math.floor(random() * 90) + 10)}`;
}

/**
 * True when two addresses reach the same inbox, ignoring case and a "+tag" (jane+x@gmail.com is jane@gmail.com), and
 * for Gmail the dots and googlemail.com: an agent's own purchase never earns them commission. A different address of
 * theirs can't be detected, which is why payouts are reviewed by an admin.
 */
export function sameMailbox(a: string, b: string): boolean {
  const canon = (email: string) => {
    const [rawLocal = "", rawDomain = ""] = email.trim().toLowerCase().split("@");
    const domain = rawDomain === "googlemail.com" ? "gmail.com" : rawDomain;
    const local = rawLocal.split("+")[0];
    return `${domain === "gmail.com" ? local.replace(/\./g, "") : local}@${domain}`;
  };
  return canon(a) === canon(b);
}

export type InactivePeriod = { from: string; to: string | null; status: "paused" | "removed" };

/** Whether an agent was on the team and active at `at`: approved by then, and not inside a pause or removal. */
export function wasActiveAt(agent: { approvedAt: Date | null; inactivePeriods: readonly InactivePeriod[] }, at: Date): boolean {
  if (!agent.approvedAt || agent.approvedAt.getTime() > at.getTime()) return false;
  const t = at.getTime();
  return !agent.inactivePeriods.some((p) => new Date(p.from).getTime() <= t && (p.to === null || t < new Date(p.to).getTime()));
}

/** Adds the start of a pause or removal (none if one is already open). */
export function openInactivePeriod(periods: readonly InactivePeriod[], status: InactivePeriod["status"], at: Date): InactivePeriod[] {
  if (periods.some((p) => p.to === null)) return [...periods];
  return [...periods, { from: at.toISOString(), to: null, status }];
}

/** Ends the open pause or removal (on approval). */
export function closeInactivePeriod(periods: readonly InactivePeriod[], at: Date): InactivePeriod[] {
  return periods.map((p) => (p.to === null ? { ...p, to: at.toISOString() } : p));
}

/* ------------------------------------------------------------------ */
/* Months, weeks, streaks                                              */
/* ------------------------------------------------------------------ */

/** Start of this calendar month and of the previous one, in the business time zone. */
export function monthBounds(now: Date, tz: string): { thisMonth: Date; lastMonth: Date; nextMonth: Date } {
  const start = DateTime.fromJSDate(now, { zone: tz }).startOf("month");
  return { thisMonth: start.toJSDate(), lastMonth: start.minus({ months: 1 }).toJSDate(), nextMonth: start.plus({ months: 1 }).toJSDate() };
}

/** "2026-10" for a date in the business time zone. */
export function monthKey(date: Date, tz: string): string {
  return DateTime.fromJSDate(date, { zone: tz }).toFormat("yyyy-MM");
}

function weekKey(date: Date, tz: string): string {
  return DateTime.fromJSDate(date, { zone: tz }).toFormat("kkkk-'W'WW");
}

/**
 * Weeks in a row (Monday–Sunday, business time zone) with at least one sale, ending this week, or last week while
 * this week has none yet (the streak isn't broken until a whole week passes without a sale).
 */
export function weeklyStreak(saleDates: readonly Date[], now: Date, tz: string): number {
  const weeks = new Set(saleDates.map((d) => weekKey(d, tz)));
  let cursor = DateTime.fromJSDate(now, { zone: tz }).startOf("week");
  if (!weeks.has(weekKey(cursor.toJSDate(), tz))) cursor = cursor.minus({ weeks: 1 });
  let streak = 0;
  while (weeks.has(weekKey(cursor.toJSDate(), tz))) {
    streak++;
    cursor = cursor.minus({ weeks: 1 });
  }
  return streak;
}

/** Most sales in any single week. */
function bestWeek(saleDates: readonly Date[], tz: string): number {
  const counts = new Map<string, number>();
  for (const d of saleDates) counts.set(weekKey(d, tz), (counts.get(weekKey(d, tz)) ?? 0) + 1);
  return Math.max(0, ...counts.values());
}

/** Most sales in any single calendar month. */
function bestMonth(saleDates: readonly Date[], tz: string): number {
  const counts = new Map<string, number>();
  for (const d of saleDates) counts.set(monthKey(d, tz), (counts.get(monthKey(d, tz)) ?? 0) + 1);
  return Math.max(0, ...counts.values());
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type BadgeIcon = "sparkles" | "flame" | "trophy" | "crown" | "target" | "rocket" | "gem" | "medal" | "star" | "zap";

export type Badge = {
  key: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  earned: boolean;
  /** "2 / 3" style progress toward a badge not earned yet. */
  progress?: string;
};

export type BadgeInput = {
  /** Every sale that counts (not refunded): when, and what the customer paid. */
  sales: readonly { at: Date; saleCents: number }[];
  levels: readonly Level[];
  /** Challenges this agent completed. */
  challengesWon: number;
  /** Past months this agent finished #1 on the leaderboard. */
  monthsWon: number;
  now: Date;
  tz: string;
};

const money = (cents: number) => `$${Math.floor(cents / 100).toLocaleString("en-US")}`;

export function computeBadges(input: BadgeInput): Badge[] {
  const dates = input.sales.map((s) => s.at);
  const total = input.sales.length;
  const volume = input.sales.reduce((sum, s) => sum + s.saleCents, 0);
  const week = bestWeek(dates, input.tz);
  const month = bestMonth(dates, input.tz);
  const streak = weeklyStreak(dates, input.now, input.tz);
  const levels = input.levels.length ? input.levels : DEFAULT_LEVELS;
  const second = levels[1];
  const top = levels[levels.length - 1];
  const count = (have: number, need: number) => ({ earned: have >= need, progress: have >= need ? undefined : `${Math.min(have, need)} / ${need}` });
  const cash = (have: number, need: number) => ({ earned: have >= need, progress: have >= need ? undefined : `${money(have)} / ${money(need)}` });

  const badges: Badge[] = [
    { key: "first-sale", name: "First Sale", description: "Make your first sale.", icon: "sparkles", ...count(total, 1) },
    { key: "hat-trick", name: "Hat Trick", description: "Make 3 sales in a single week.", icon: "zap", ...count(week, 3) },
  ];
  if (second) {
    badges.push({ key: "level-2", name: `Going ${second.name}`, description: `Reach ${second.name} (${second.minSales} sales in a month).`, icon: "rocket", ...count(month, second.minSales) });
  }
  if (top && top !== second && top.minSales > 0) {
    badges.push({ key: "level-top", name: `${top.name} Closer`, description: `Reach ${top.name} (${top.minSales} sales in a month).`, icon: "gem", ...count(month, top.minSales) });
  }
  badges.push(
    { key: "streak-4", name: "On Fire", description: "Make a sale 4 weeks in a row.", icon: "flame", ...count(streak, 4) },
    { key: "club-1k", name: "$1K Club", description: "Sell $1,000 in total.", icon: "medal", ...cash(volume, 100_000) },
    { key: "club-10k", name: "$10K Club", description: "Sell $10,000 in total.", icon: "star", ...cash(volume, 1_000_000) },
    { key: "half-century", name: "Half Century", description: "Make 50 sales in total.", icon: "target", ...count(total, 50) },
    { key: "challenger", name: "Challenge Winner", description: "Hit the target in a sales challenge.", icon: "trophy", ...count(input.challengesWon, 1) },
    { key: "champion", name: "Monthly Champion", description: "Finish a month with the most sales on the team.", icon: "crown", ...count(input.monthsWon, 1) },
  );
  return badges;
}
