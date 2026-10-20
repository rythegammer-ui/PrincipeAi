import "server-only";
import { and, eq, gte, inArray, isNotNull, isNull, lt, lte, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { AgentChallenge, AgentCommission, AgentPayout, Order } from "@/db/schema";
import { logActivity } from "@/lib/crm";
import { getBusinessTimezone } from "@/lib/scheduling";
import { emailAgent, dashboardLink } from "@/lib/sales/emails";
import { commissionFor, formatRate, monthBounds, standing } from "@/lib/sales/game";
import { getSalesProgram } from "@/lib/sales/program";
import { claimActive } from "@/lib/sales/referrals";
import { escapeMarkdown, formatDate, formatMoney, normalizeEmail, pluralize } from "@/lib/utils";

/**
 * The commission ledger (agent_commissions). A course sale by a customer an agent referred earns a commission at the
 * agent's level; it's "held" until the hold period passes (so refunds come first), then counts as owed until an admin
 * records a payout. A refund cancels an unpaid commission, or claws a paid one back from the next payout. Challenge
 * bonuses are awarded by the daily job once a challenge ends.
 */

const DAY = 86_400_000;
const c = schema.agentCommissions;

/** Sales that count (for levels, challenges, the leaderboard): commissions on sales, minus refunded ones. */
const countingSale = and(eq(c.kind, "sale"), ne(c.status, "void"));

async function salesBetween(agentId: string, from: Date, to: Date): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(c)
    .where(and(eq(c.agentId, agentId), countingSale, gte(c.createdAt, from), lt(c.createdAt, to)));
  return row?.n ?? 0;
}

/** This month's and last month's sales for an agent (business time zone). */
export async function monthlySales(agentId: string, now = new Date(), tz?: string): Promise<{ thisMonth: number; lastMonth: number }> {
  const bounds = monthBounds(now, tz ?? (await getBusinessTimezone()));
  const [thisMonth, lastMonth] = await Promise.all([
    salesBetween(agentId, bounds.thisMonth, bounds.nextMonth),
    salesBetween(agentId, bounds.lastMonth, bounds.thisMonth),
  ]);
  return { thisMonth, lastMonth };
}

/**
 * Credits a paid course order to the agent who referred its customer (called once the purchase is recorded; safe to
 * call again). No commission when nobody referred the customer, the claim has run out, the agent isn't active, or the
 * agent bought for themself. Returns the new commission, or null.
 */
export async function recordAgentSale(order: Order, contactId: string): Promise<AgentCommission | null> {
  if (order.itemType !== "course" || order.status !== "paid" || order.amountCents <= 0) return null;
  const db = await getDb();
  const [ref] = await db.select().from(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contactId)).limit(1);
  if (!ref) return null;
  const [agent] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.id, ref.agentId)).limit(1);
  if (!agent || agent.status !== "approved" || normalizeEmail(order.email) === agent.email) return null;
  const program = await getSalesProgram();
  const soldAt = order.paidAt ?? new Date();
  if (!claimActive(ref.createdAt, program.attributionDays, soldAt.getTime())) return null;

  const tz = await getBusinessTimezone();
  const { thisMonth, lastMonth } = await monthlySales(agent.id, soldAt, tz);
  const before = standing(program.levels, thisMonth, lastMonth);
  const after = standing(program.levels, thisMonth + 1, lastMonth);
  const amountCents = commissionFor(order.amountCents, after.level.rateBps);
  const availableAt = new Date(soldAt.getTime() + program.holdDays * DAY);
  const [row] = await db
    .insert(c)
    .values({
      agentId: agent.id,
      kind: "sale",
      orderId: order.id,
      contactId,
      saleCents: order.amountCents,
      rateBps: after.level.rateBps,
      level: after.level.name,
      amountCents,
      currency: order.currency,
      status: "held",
      availableAt,
      isTest: order.isTest,
    })
    .onConflictDoNothing({ target: [c.orderId, c.kind] })
    .returning();
  if (!row) return null;

  await db.update(schema.salesAgents).set({ lastSaleAt: new Date() }).where(eq(schema.salesAgents.id, agent.id));
  await logActivity(contactId, "note", `Sale credited to sales agent ${agent.name}${agent.code ? ` (${agent.code})` : ""}`, {
    meta: { agentId: agent.id, orderId: order.id, commissionCents: amountCents, rateBps: after.level.rateBps },
  }).catch((err) => console.error("[sales] activity log failed", err));

  const levelUp = after.index > before.index;
  const sales = thisMonth + 1;
  await emailAgent(agent, `You made a sale! +${formatMoney(amountCents, order.currency)} commission`, [
    `A customer you referred just bought **${escapeMarkdown(order.description)}** for ${formatMoney(order.amountCents, order.currency)}. Your commission: **${formatMoney(amountCents, order.currency)}** (${formatRate(after.level.rateBps)}, ${escapeMarkdown(after.level.name)} level).`,
    order.isTest && "_This was a test purchase, so no real money changed hands._",
    `It becomes payable on **${formatDate(availableAt, {}, tz)}**, once the refund window has passed. Sales this month: **${sales}**.`,
    levelUp
      ? `🚀 **Level up: you're now ${escapeMarkdown(after.level.name)}!** Every sale earns ${formatRate(after.level.rateBps)} for the rest of this month and all of next month.`
      : after.next
        ? `${pluralize(after.toNext, "more sale")} this month to reach **${escapeMarkdown(after.next.name)}** and earn ${formatRate(after.next.rateBps)} on every sale.`
        : "You're at the top level. Keep it going!",
    dashboardLink(),
  ]);
  return row;
}

/**
 * A refunded (or charged-back) order: its commission is cancelled when it hasn't been paid yet, or clawed back from
 * the agent's next payout when it has. Challenge bonuses that sale helped win are checked again.
 */
export async function reverseAgentSale(orderId: string, reason: string): Promise<"voided" | "clawback" | null> {
  const db = await getDb();
  const [sale] = await db.select().from(c).where(and(eq(c.orderId, orderId), eq(c.kind, "sale"))).limit(1);
  if (!sale || sale.status === "void") return null;
  let outcome: "voided" | "clawback" | null = null;
  const [voided] = await db
    .update(c)
    .set({ status: "void", voidedAt: new Date(), voidReason: reason.slice(0, 200) })
    .where(and(eq(c.id, sale.id), eq(c.status, "held")))
    .returning({ id: c.id });
  if (voided) {
    outcome = "voided";
  } else {
    // Already paid (perhaps a moment ago): take it back from the next payout.
    const [current] = await db.select({ status: c.status }).from(c).where(eq(c.id, sale.id)).limit(1);
    if (current?.status === "paid") {
      const [clawback] = await db
        .insert(c)
        .values({
          agentId: sale.agentId,
          kind: "clawback",
          orderId,
          contactId: sale.contactId,
          saleCents: sale.saleCents,
          rateBps: sale.rateBps,
          level: sale.level,
          amountCents: -sale.amountCents,
          currency: sale.currency,
          status: "held",
          availableAt: new Date(),
          isTest: sale.isTest,
          note: reason.slice(0, 200),
        })
        .onConflictDoNothing({ target: [c.orderId, c.kind] })
        .returning({ id: c.id });
      if (clawback) outcome = "clawback";
    }
  }
  if (!outcome) return null;

  await recheckChallengeBonuses(sale.agentId).catch((err) => console.error("[sales] challenge re-check failed", err));
  const [agent] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.id, sale.agentId)).limit(1);
  if (agent) {
    const amount = formatMoney(sale.amountCents, sale.currency);
    await emailAgent(agent, "A sale was refunded", [
      outcome === "voided"
        ? `A customer you referred was refunded for a ${formatMoney(sale.saleCents, sale.currency)} purchase, so its ${amount} commission was cancelled. It no longer counts toward your level or challenges.`
        : `A customer you referred was refunded for a ${formatMoney(sale.saleCents, sale.currency)} purchase after its ${amount} commission was paid, so ${amount} will come off your next payout.`,
      "Refunds happen. Customers who know exactly what they're buying rarely ask for one, so keep setting clear expectations.",
      dashboardLink(),
    ]);
  }
  return outcome;
}

/* ------------------------------------------------------------------ */
/* Balances + payouts                                                  */
/* ------------------------------------------------------------------ */

export type AgentBalance = {
  /** Ready to pay now (held rows past their hold, clawbacks included). */
  owedCents: number;
  /** Earned but still in the hold period. */
  pendingCents: number;
  paidCents: number;
  /** Everything not cancelled. */
  earnedCents: number;
  /** When the next held commission becomes payable. */
  nextAvailableAt: Date | null;
};

const EMPTY_BALANCE: AgentBalance = { owedCents: 0, pendingCents: 0, paidCents: 0, earnedCents: 0, nextAvailableAt: null };

/** Balances for every agent with ledger rows (or just the given ones). */
export async function agentBalances(agentIds?: string[]): Promise<Map<string, AgentBalance>> {
  if (agentIds && !agentIds.length) return new Map();
  const db = await getDb();
  const now = sql`${new Date().toISOString()}::timestamptz`;
  const rows = await db
    .select({
      agentId: c.agentId,
      owed: sql<number>`coalesce(sum(${c.amountCents}) filter (where ${c.status} = 'held' and ${c.availableAt} <= ${now}), 0)`.mapWith(Number),
      pending: sql<number>`coalesce(sum(${c.amountCents}) filter (where ${c.status} = 'held' and ${c.availableAt} > ${now}), 0)`.mapWith(Number),
      paid: sql<number>`coalesce(sum(${c.amountCents}) filter (where ${c.status} = 'paid'), 0)`.mapWith(Number),
      earned: sql<number>`coalesce(sum(${c.amountCents}) filter (where ${c.status} <> 'void'), 0)`.mapWith(Number),
      next: sql<string | null>`min(${c.availableAt}) filter (where ${c.status} = 'held' and ${c.availableAt} > ${now})`,
    })
    .from(c)
    .where(agentIds ? inArray(c.agentId, agentIds) : undefined)
    .groupBy(c.agentId);
  return new Map(
    rows.map((r) => [
      r.agentId,
      { owedCents: r.owed, pendingCents: r.pending, paidCents: r.paid, earnedCents: r.earned, nextAvailableAt: r.next ? new Date(r.next) : null },
    ]),
  );
}

export async function agentBalance(agentId: string): Promise<AgentBalance> {
  return (await agentBalances([agentId])).get(agentId) ?? EMPTY_BALANCE;
}

/**
 * Records money the owner sent an agent (outside the app): every payable row (owed now, clawbacks included) moves into
 * the payout. Returns null when nothing is owed.
 */
export async function recordPayout(input: {
  agentId: string;
  method?: string | null;
  reference?: string | null;
  note?: string | null;
  by: string;
}): Promise<AgentPayout | null> {
  const db = await getDb();
  const now = new Date();
  const payout = await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: c.id, amountCents: c.amountCents, currency: c.currency })
      .from(c)
      .where(and(eq(c.agentId, input.agentId), eq(c.status, "held"), lte(c.availableAt, now)))
      .for("update");
    const total = rows.reduce((sum, r) => sum + r.amountCents, 0);
    if (!rows.length || total <= 0) return null;
    const [created] = await tx
      .insert(schema.agentPayouts)
      .values({
        agentId: input.agentId,
        amountCents: total,
        currency: rows[0].currency,
        method: input.method?.trim().slice(0, 60) || null,
        reference: input.reference?.trim().slice(0, 200) || null,
        note: input.note?.trim().slice(0, 500) || null,
        createdBy: input.by,
        paidAt: now,
      })
      .returning();
    await tx
      .update(c)
      .set({ status: "paid", payoutId: created.id })
      .where(and(inArray(c.id, rows.map((r) => r.id)), eq(c.status, "held")));
    return created;
  });
  if (!payout) return null;
  const [agent] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.id, input.agentId)).limit(1);
  if (agent) {
    await emailAgent(agent, `Payout sent: ${formatMoney(payout.amountCents, payout.currency)}`, [
      `We just sent you **${formatMoney(payout.amountCents, payout.currency)}**${payout.method ? ` by ${escapeMarkdown(payout.method)}` : ""}.${payout.reference ? ` Reference: ${escapeMarkdown(payout.reference)}.` : ""}`,
      "Thanks for everything you're doing for the team. Your dashboard has the breakdown of what this payout covers.",
      dashboardLink(),
    ]);
  }
  return payout;
}

/** A manual bonus (positive) or correction (negative), payable straight away. */
export async function addAgentAdjustment(input: { agentId: string; amountCents: number; note: string; by: string }): Promise<AgentCommission> {
  const db = await getDb();
  const [row] = await db
    .insert(c)
    .values({
      agentId: input.agentId,
      kind: input.amountCents > 0 ? "bonus" : "adjustment",
      amountCents: Math.round(input.amountCents),
      status: "held",
      availableAt: new Date(),
      note: `${input.note.trim().slice(0, 300)} (by ${input.by})`,
    })
    .returning();
  if (input.amountCents > 0) {
    const [agent] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.id, input.agentId)).limit(1);
    if (agent) {
      await emailAgent(agent, `Bonus: +${formatMoney(input.amountCents)}`, [
        `You've been given a **${formatMoney(input.amountCents)}** bonus: ${escapeMarkdown(input.note.trim())}`,
        "It's included in your next payout.",
        dashboardLink(),
      ]);
    }
  }
  return row;
}

/** Cancels an unpaid ledger row (a mistake). Paid rows can't be cancelled: add a negative adjustment instead. */
export async function voidCommission(id: string, reason: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .update(c)
    .set({ status: "void", voidedAt: new Date(), voidReason: reason.slice(0, 200) })
    .where(and(eq(c.id, id), eq(c.status, "held")))
    .returning({ agentId: c.agentId, kind: c.kind });
  if (row?.kind === "sale") await recheckChallengeBonuses(row.agentId).catch(() => {});
  return Boolean(row);
}

/* ------------------------------------------------------------------ */
/* Challenges                                                          */
/* ------------------------------------------------------------------ */

/** Each agent's score in a challenge so far: sales count, or sales volume in cents. */
export async function challengeScores(challenge: Pick<AgentChallenge, "metric" | "startsAt" | "endsAt">, agentIds?: string[]): Promise<Map<string, number>> {
  if (agentIds && !agentIds.length) return new Map();
  const db = await getDb();
  const rows = await db
    .select({
      agentId: c.agentId,
      sales: sql<number>`count(*)`.mapWith(Number),
      volume: sql<number>`coalesce(sum(${c.saleCents}), 0)`.mapWith(Number),
    })
    .from(c)
    .where(and(countingSale, gte(c.createdAt, challenge.startsAt), lt(c.createdAt, challenge.endsAt), agentIds ? inArray(c.agentId, agentIds) : undefined))
    .groupBy(c.agentId);
  return new Map(rows.map((r) => [r.agentId, challenge.metric === "revenue" ? r.volume : r.sales]));
}

export function describeTarget(challenge: Pick<AgentChallenge, "metric" | "target">): string {
  return challenge.metric === "revenue" ? `${formatMoney(challenge.target)} in sales` : pluralize(challenge.target, "sale");
}

/**
 * Awards the bonus to every agent who reached the target of a challenge that has ended (daily job; safe to repeat).
 * Bonuses wait out the hold period after the challenge ends, and are cancelled if refunds take the agent below target.
 */
export async function awardDueChallenges(now = new Date()): Promise<number> {
  const db = await getDb();
  const due = await db
    .select()
    .from(schema.agentChallenges)
    .where(and(lte(schema.agentChallenges.endsAt, now), isNull(schema.agentChallenges.awardedAt), isNull(schema.agentChallenges.cancelledAt)));
  if (!due.length) return 0;
  const { holdDays } = await getSalesProgram();
  let awarded = 0;
  for (const challenge of due) {
    const [claimed] = await db
      .update(schema.agentChallenges)
      .set({ awardedAt: now })
      .where(and(eq(schema.agentChallenges.id, challenge.id), isNull(schema.agentChallenges.awardedAt)))
      .returning({ id: schema.agentChallenges.id });
    if (!claimed) continue;
    const scores = await challengeScores(challenge);
    const winners = [...scores].filter(([, score]) => score >= challenge.target).map(([agentId]) => agentId);
    if (!winners.length) continue;
    const agents = await db
      .select()
      .from(schema.salesAgents)
      .where(and(inArray(schema.salesAgents.id, winners), inArray(schema.salesAgents.status, ["approved", "paused"])));
    for (const agent of agents) {
      const availableAt = new Date(challenge.endsAt.getTime() + holdDays * DAY);
      const [bonus] = await db
        .insert(c)
        .values({
          agentId: agent.id,
          kind: "bonus",
          challengeId: challenge.id,
          amountCents: challenge.bonusCents,
          status: "held",
          availableAt,
          note: `Challenge: ${challenge.title}`.slice(0, 300),
        })
        .onConflictDoNothing({ target: [c.challengeId, c.agentId] })
        .returning({ id: c.id });
      if (!bonus) continue;
      awarded++;
      await emailAgent(agent, `You won “${challenge.title}”`, [
        `You hit the target in **${escapeMarkdown(challenge.title)}** (${describeTarget(challenge)}). 🏆`,
        challenge.bonusCents > 0
          ? `Your **${formatMoney(challenge.bonusCents)}** bonus becomes payable on ${formatDate(availableAt)}, once the refund window on those sales has passed.`
          : "The Challenge Winner badge is now on your dashboard.",
        dashboardLink(),
      ]);
    }
  }
  return awarded;
}

/** Cancels unpaid challenge bonuses an agent no longer qualifies for (after a refund). */
export async function recheckChallengeBonuses(agentId: string): Promise<number> {
  const db = await getDb();
  const bonuses = await db
    .select({ id: c.id, challenge: schema.agentChallenges })
    .from(c)
    .innerJoin(schema.agentChallenges, eq(schema.agentChallenges.id, c.challengeId))
    .where(and(eq(c.agentId, agentId), eq(c.kind, "bonus"), eq(c.status, "held"), isNotNull(c.challengeId)));
  let voided = 0;
  for (const { id, challenge } of bonuses) {
    const score = (await challengeScores(challenge, [agentId])).get(agentId) ?? 0;
    if (score >= challenge.target) continue;
    const [row] = await db
      .update(c)
      .set({ status: "void", voidedAt: new Date(), voidReason: "A refund took this challenge below its target" })
      .where(and(eq(c.id, id), eq(c.status, "held")))
      .returning({ id: c.id });
    if (row) voided++;
  }
  return voided;
}

/** Ledger rows for one agent, newest first. */
export async function agentLedger(agentId: string, limit = 100): Promise<AgentCommission[]> {
  const db = await getDb();
  return db.select().from(c).where(eq(c.agentId, agentId)).orderBy(sql`${c.createdAt} desc`).limit(limit);
}
