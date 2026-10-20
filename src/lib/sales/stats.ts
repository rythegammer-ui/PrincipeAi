import "server-only";
import { and, desc, eq, gte, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { AgentChallenge, AgentCommission, AgentPayout, SalesAgent } from "@/db/schema";
import { getBusinessTimezone } from "@/lib/scheduling";
import { agentBalance, challengeScores, countingSale, monthlySales, realMoney, type AgentBalance } from "@/lib/sales/commissions";
import { computeBadges, monthBounds, monthKey, publicName, standing, weeklyStreak, type Badge, type LevelStanding, type ProgramSettings } from "@/lib/sales/game";
import { getSalesProgram } from "@/lib/sales/program";

/** Read models for the agent portal and Admin → Sales Team: leaderboards, the team feed, challenges, badges. */

const c = schema.agentCommissions;

export type LeaderboardRow = {
  agentId: string;
  name: string;
  publicName: string;
  state: string | null;
  sales: number;
  volumeCents: number;
  rank: number;
  /** Hidden from other agents (opted out of the leaderboard). */
  hidden: boolean;
};

/**
 * Agents ranked by sales between two dates (ties: more volume, then whoever got there first). Agents only see
 * approved agents who show on the leaderboard; admins see everyone.
 */
export async function leaderboard(from: Date, to: Date, opts: { forAdmin?: boolean } = {}): Promise<LeaderboardRow[]> {
  const db = await getDb();
  const rows = await db
    .select({
      agentId: c.agentId,
      sales: sql<number>`count(*)`.mapWith(Number),
      volume: sql<number>`coalesce(sum(${c.saleCents}), 0)`.mapWith(Number),
      last: sql<string>`max(${c.createdAt})`,
      name: schema.salesAgents.name,
      state: schema.salesAgents.state,
      status: schema.salesAgents.status,
      show: schema.salesAgents.showOnLeaderboard,
    })
    .from(c)
    .innerJoin(schema.salesAgents, eq(schema.salesAgents.id, c.agentId))
    .where(and(countingSale(), gte(c.createdAt, from), lt(c.createdAt, to)))
    .groupBy(c.agentId, schema.salesAgents.name, schema.salesAgents.state, schema.salesAgents.status, schema.salesAgents.showOnLeaderboard);
  const visible = rows.filter((r) => opts.forAdmin || r.status === "approved");
  visible.sort((a, b) => b.sales - a.sales || b.volume - a.volume || new Date(a.last).getTime() - new Date(b.last).getTime());
  return visible.map((r, i) => ({
    agentId: r.agentId,
    name: r.name,
    publicName: publicName(r.name),
    state: r.state,
    sales: r.sales,
    volumeCents: r.volume,
    rank: i + 1,
    hidden: !r.show,
  }));
}

/**
 * How many past months each agent finished with the most sales on the team (this month doesn't count until it's
 * over). Ties: more sales volume, then whoever got there first, as on the leaderboard.
 */
export async function monthsWon(tz: string, now = new Date()): Promise<Map<string, number>> {
  const db = await getDb();
  const rows = await db
    .select({ agentId: c.agentId, at: c.createdAt, sale: c.saleCents })
    .from(c)
    .where(and(countingSale(), lt(c.createdAt, monthBounds(now, tz).thisMonth)));
  const byMonth = new Map<string, Map<string, { n: number; v: number; last: number }>>();
  for (const r of rows) {
    const key = monthKey(r.at, tz);
    const month = byMonth.get(key) ?? new Map();
    const t = month.get(r.agentId) ?? { n: 0, v: 0, last: 0 };
    month.set(r.agentId, { n: t.n + 1, v: t.v + r.sale, last: Math.max(t.last, r.at.getTime()) });
    byMonth.set(key, month);
  }
  const wins = new Map<string, number>();
  for (const month of byMonth.values()) {
    const [winner] = [...month].sort((a, b) => b[1].n - a[1].n || b[1].v - a[1].v || a[1].last - b[1].last);
    if (winner) wins.set(winner[0], (wins.get(winner[0]) ?? 0) + 1);
  }
  return wins;
}

export type FeedItem = { publicName: string; state: string | null; at: Date; level: string | null };

/** Recent team sales, for the "wins" feed (agents who show on the leaderboard only; no customer details). */
export async function teamFeed(limit = 8): Promise<FeedItem[]> {
  const db = await getDb();
  const rows = await db
    .select({ name: schema.salesAgents.name, state: schema.salesAgents.state, at: c.createdAt, level: c.level })
    .from(c)
    .innerJoin(schema.salesAgents, eq(schema.salesAgents.id, c.agentId))
    .where(and(countingSale(), eq(schema.salesAgents.status, "approved"), eq(schema.salesAgents.showOnLeaderboard, true)))
    .orderBy(desc(c.createdAt))
    .limit(limit);
  return rows.map((r) => ({ publicName: publicName(r.name), state: r.state, at: r.at, level: r.level }));
}

export type ChallengeView = AgentChallenge & {
  /** This agent's score (sales, or cents for revenue challenges). */
  score: number;
  done: boolean;
  phase: "upcoming" | "live" | "ended";
  /** Agents who have hit the target so far. */
  finishers: number;
};

/** Live and upcoming challenges, plus ones that ended in the last 30 days, with this agent's progress. */
export async function challengesFor(agentId: string | null, now = new Date()): Promise<ChallengeView[]> {
  const db = await getDb();
  const challenges = await db
    .select()
    .from(schema.agentChallenges)
    .where(and(isNull(schema.agentChallenges.cancelledAt), gte(schema.agentChallenges.endsAt, new Date(now.getTime() - 30 * 86_400_000))))
    .orderBy(schema.agentChallenges.endsAt);
  const views: ChallengeView[] = [];
  for (const ch of challenges) {
    const scores = await challengeScores(ch);
    const score = agentId ? (scores.get(agentId) ?? 0) : 0;
    views.push({
      ...ch,
      score,
      done: score >= ch.target,
      phase: now < ch.startsAt ? "upcoming" : now < ch.endsAt ? "live" : "ended",
      finishers: [...scores.values()].filter((s) => s >= ch.target).length,
    });
  }
  const order = { live: 0, upcoming: 1, ended: 2 } as const;
  return views.sort((a, b) => order[a.phase] - order[b.phase]);
}

export type AgentDashboard = {
  agent: SalesAgent;
  program: ProgramSettings;
  tz: string;
  now: Date;
  thisMonth: number;
  lastMonth: number;
  standing: LevelStanding;
  /** Set when the level comes from last month: sales needed this month to keep it next month. */
  keepNeeded: number;
  monthVolumeCents: number;
  lifetimeSales: number;
  lifetimeVolumeCents: number;
  customers: number;
  streak: number;
  balance: AgentBalance;
  ledger: AgentCommission[];
  payouts: AgentPayout[];
  badges: Badge[];
  board: LeaderboardRow[];
  myRank: LeaderboardRow | null;
  feed: FeedItem[];
  challenges: ChallengeView[];
};

/** Everything the agent portal shows, for one agent. */
export async function agentDashboard(agent: SalesAgent, now = new Date()): Promise<AgentDashboard> {
  const db = await getDb();
  const [program, tz] = await Promise.all([getSalesProgram(), getBusinessTimezone()]);
  const bounds = monthBounds(now, tz);
  const [{ thisMonth, lastMonth }, balance, ledger, payouts, sales, [customers], wins, board, feed, challenges, [challengesWon]] = await Promise.all([
    monthlySales(agent.id, now, tz),
    agentBalance(agent.id),
    db.select().from(c).where(eq(c.agentId, agent.id)).orderBy(desc(c.createdAt)).limit(25),
    db.select().from(schema.agentPayouts).where(eq(schema.agentPayouts.agentId, agent.id)).orderBy(desc(schema.agentPayouts.paidAt)).limit(12),
    db.select({ at: c.createdAt, saleCents: c.saleCents }).from(c).where(and(eq(c.agentId, agent.id), countingSale())),
    db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(schema.agentReferrals).where(eq(schema.agentReferrals.agentId, agent.id)),
    monthsWon(tz, now),
    leaderboard(bounds.thisMonth, bounds.nextMonth),
    teamFeed(),
    challengesFor(agent.id, now),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(c)
      .where(and(eq(c.agentId, agent.id), eq(c.kind, "bonus"), ne(c.status, "void"), sql`${c.challengeId} is not null`, realMoney())),
  ]);
  // Agents who opted out don't appear to others (ranked without them); you always see yourself.
  const visibleBoard = board.filter((r) => !r.hidden || r.agentId === agent.id).map((r, i) => ({ ...r, rank: i + 1 }));
  const level = standing(program.levels, thisMonth, lastMonth);
  const fromLastMonth = lastMonth > thisMonth && standing(program.levels, thisMonth).index < level.index;
  const monthSales = sales.filter((s) => s.at >= bounds.thisMonth && s.at < bounds.nextMonth);
  return {
    agent,
    program,
    tz,
    now,
    thisMonth,
    lastMonth,
    standing: level,
    keepNeeded: fromLastMonth ? Math.max(0, level.level.minSales - thisMonth) : 0,
    monthVolumeCents: monthSales.reduce((sum, s) => sum + s.saleCents, 0),
    lifetimeSales: sales.length,
    lifetimeVolumeCents: sales.reduce((sum, s) => sum + s.saleCents, 0),
    customers: customers?.n ?? 0,
    streak: weeklyStreak(
      sales.map((s) => s.at),
      now,
      tz,
    ),
    balance,
    ledger,
    payouts,
    badges: computeBadges({ sales, levels: program.levels, challengesWon: challengesWon?.n ?? 0, monthsWon: wins.get(agent.id) ?? 0, now, tz }),
    board: visibleBoard.slice(0, 10),
    myRank: visibleBoard.find((r) => r.agentId === agent.id) ?? null,
    feed,
    challenges,
  };
}

export type AdminAgentRow = SalesAgent & { thisMonth: number; lastMonth: number; level: string; rateBps: number; customers: number };

/** Every agent with this month's sales and level (Admin → Sales Team). */
export async function adminAgentRows(now = new Date()): Promise<AdminAgentRow[]> {
  const db = await getDb();
  const [program, tz] = await Promise.all([getSalesProgram(), getBusinessTimezone()]);
  const bounds = monthBounds(now, tz);
  const [agents, counts, customers] = await Promise.all([
    db.select().from(schema.salesAgents).orderBy(desc(schema.salesAgents.createdAt)),
    db
      .select({
        agentId: c.agentId,
        thisMonth: sql<number>`count(*) filter (where ${c.createdAt} >= ${bounds.thisMonth.toISOString()}::timestamptz)`.mapWith(Number),
        lastMonth: sql<number>`count(*) filter (where ${c.createdAt} < ${bounds.thisMonth.toISOString()}::timestamptz)`.mapWith(Number),
      })
      .from(c)
      .where(and(countingSale(), gte(c.createdAt, bounds.lastMonth), lt(c.createdAt, bounds.nextMonth)))
      .groupBy(c.agentId),
    db
      .select({ agentId: schema.agentReferrals.agentId, n: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.agentReferrals)
      .groupBy(schema.agentReferrals.agentId),
  ]);
  const countBy = new Map(counts.map((r) => [r.agentId, r]));
  const customersBy = new Map(customers.map((r) => [r.agentId, r.n]));
  return agents.map((a) => {
    const n = countBy.get(a.id);
    const s = standing(program.levels, n?.thisMonth ?? 0, n?.lastMonth ?? 0);
    return { ...a, thisMonth: n?.thisMonth ?? 0, lastMonth: n?.lastMonth ?? 0, level: s.level.name, rateBps: s.level.rateBps, customers: customersBy.get(a.id) ?? 0 };
  });
}

/** Commission rows for these orders (Admin → Orders shows which agent sold what). */
export async function agentsForOrders(orderIds: string[]): Promise<Map<string, { agentId: string; name: string; code: string | null; status: AgentCommission["status"] }>> {
  if (!orderIds.length) return new Map();
  const db = await getDb();
  const rows = await db
    .select({ orderId: c.orderId, agentId: c.agentId, name: schema.salesAgents.name, code: schema.salesAgents.code, status: c.status })
    .from(c)
    .innerJoin(schema.salesAgents, eq(schema.salesAgents.id, c.agentId))
    .where(and(eq(c.kind, "sale"), inArray(c.orderId, orderIds)));
  return new Map(rows.filter((r) => r.orderId).map((r) => [r.orderId as string, { agentId: r.agentId, name: r.name, code: r.code, status: r.status }]));
}

/** The agent a contact belongs to (Admin → Contacts). */
export async function agentForContact(contactId: string): Promise<{ agent: SalesAgent; source: string; since: Date } | null> {
  const db = await getDb();
  const [row] = await db
    .select({ agent: schema.salesAgents, source: schema.agentReferrals.source, since: schema.agentReferrals.createdAt })
    .from(schema.agentReferrals)
    .innerJoin(schema.salesAgents, eq(schema.salesAgents.id, schema.agentReferrals.agentId))
    .where(eq(schema.agentReferrals.contactId, contactId))
    .limit(1);
  return row ?? null;
}

/** Agents an admin can assign customers to. */
export async function assignableAgents(): Promise<Pick<SalesAgent, "id" | "name" | "code" | "status">[]> {
  const db = await getDb();
  return db
    .select({ id: schema.salesAgents.id, name: schema.salesAgents.name, code: schema.salesAgents.code, status: schema.salesAgents.status })
    .from(schema.salesAgents)
    .where(or(eq(schema.salesAgents.status, "approved"), eq(schema.salesAgents.status, "paused")))
    .orderBy(schema.salesAgents.name);
}
