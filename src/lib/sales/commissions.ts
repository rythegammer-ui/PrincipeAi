import "server-only";
import { and, asc, eq, gte, inArray, isNotNull, isNull, lt, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { AgentChallenge, AgentCommission, AgentPayout, Order, SalesAgent } from "@/db/schema";
import { logActivity } from "@/lib/crm";
import { getBusinessTimezone } from "@/lib/scheduling";
import { emailAgent, dashboardLink } from "@/lib/sales/emails";
import { commissionFor, formatRate, monthBounds, sameMailbox, standing } from "@/lib/sales/game";
import { getSalesProgram } from "@/lib/sales/program";
import { agentByCode, claimActive, claimContactFor } from "@/lib/sales/referrals";
import { stripeTestMode } from "@/lib/stripe";
import { escapeMarkdown, formatDate, formatMoney, pluralize } from "@/lib/utils";

/**
 * The commission ledger (agent_commissions). A course sale by a customer an agent referred earns a commission at the
 * agent's level; it's "held" until the hold period passes (so refunds come first), then counts as owed until an admin
 * records a payout. A refund cancels an unpaid commission, or claws a paid one back from the next payout. Challenge
 * bonuses are awarded by the daily job once a challenge ends.
 */

const DAY = 86_400_000;
const c = schema.agentCommissions;

/**
 * True when the site takes real payments (a live Stripe key). Then commissions from test payments (Stripe test mode,
 * the built-in test checkout) are never owed or paid and don't count toward levels, challenges or the leaderboard.
 * Without live payments (local development, a demo) they count like real ones, so the program can be tried out.
 */
export function livePayments(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim()) && !stripeTestMode();
}

/** Ledger rows that are real money right now (see livePayments). */
export function realMoney() {
  return livePayments() ? eq(c.isTest, false) : undefined;
}

/**
 * Sales that count (for levels, challenges, the leaderboard): commissions on sales, minus refunded ones (cancelled
 * before payout, or paid and then clawed back: voided_at is set on those too).
 */
export function countingSale() {
  return and(eq(c.kind, "sale"), ne(c.status, "void"), isNull(c.voidedAt), realMoney());
}

/** Marks an unpaid commission as waiting on a chargeback (see holdAgentSaleForDispute). */
export const DISPUTE_NOTE = "On hold: the payment is disputed";

/**
 * A disputed sale waits at most this long past its own payable date: Stripe resolves disputes within about 75 days,
 * and if the close event never arrives the commission isn't stuck for ever (a dispute lost later still claws it back).
 */
const DISPUTE_HOLD_CAP_DAYS = 120;

/** Held rows an admin can pay now: past their hold, not waiting on a dispute, real money. */
function payableNow(at: Date | SQL) {
  const now = at instanceof Date ? sql`${at.toISOString()}::timestamptz` : at;
  return and(
    eq(c.status, "held"),
    sql`${c.availableAt} <= ${now}`,
    sql`(${c.note} is distinct from ${DISPUTE_NOTE} or ${c.availableAt} <= ${now} - make_interval(days => ${DISPUTE_HOLD_CAP_DAYS}))`,
    realMoney(),
  );
}

async function salesBetween(agentId: string, from: Date, to: Date): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(c)
    .where(and(eq(c.agentId, agentId), countingSale(), gte(c.createdAt, from), lt(c.createdAt, to)));
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

type Credit = { agent: SalesAgent; paused: boolean };

/**
 * The agent a paid order is credited to:
 * 1. the customer's agent: a claim made before they paid that still holds (an admin's assignment always does);
 *    otherwise
 * 2. the agent whose link the checkout came through (orders.agent_code), who then becomes the customer's agent, unless
 *    another agent's claim still holds.
 * A claim made after paying only counts for later purchases, so whether the webhook or the success page records the
 * purchase first never changes the outcome. Never the agent buying for themself. `paused`: the agent it belongs to was
 * paused when it sold, so it earns nothing (recorded as such, so it isn't credited later when they're resumed).
 */
async function creditedAgent(order: Order, contactId: string, soldAt: Date): Promise<Credit | null> {
  const db = await getDb();
  const { attributionDays } = await getSalesProgram();
  const [ref] = await db.select().from(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contactId)).limit(1);
  let pausedHolder: SalesAgent | null = null;
  if (ref && ref.createdAt.getTime() <= soldAt.getTime()) {
    const [holder] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.id, ref.agentId)).limit(1);
    const holds = ref.source === "manual" || claimActive(ref.createdAt, attributionDays, soldAt.getTime());
    if (holder && holds && !sameMailbox(order.email, holder.email)) {
      if (holder.status === "approved") return { agent: holder, paused: false };
      if (holder.status === "paused") {
        // An admin's assignment stays theirs while paused; a link claim doesn't hold against another agent's link.
        if (ref.source === "manual") return { agent: holder, paused: true };
        pausedHolder = holder;
      }
    }
  }
  if (order.agentCode) {
    const agent = await agentByCode(order.agentCode);
    if (agent && !sameMailbox(order.email, agent.email)) {
      if (agent.status === "paused") return { agent, paused: true };
      if (await claimContactFor(contactId, agent, soldAt)) return { agent, paused: false };
    }
  }
  return pausedHolder ? { agent: pausedHolder, paused: true } : null;
}

/**
 * Credits a paid course order to the agent who sold it (see creditedAgent). Called once the purchase is recorded, and
 * by the daily sweep; safe to call again. Returns the new commission, or null.
 */
export async function recordAgentSale(order: Order, contactId: string): Promise<AgentCommission | null> {
  if (order.itemType !== "course" || order.status !== "paid" || order.amountCents <= 0) return null;
  const soldAt = order.paidAt ?? new Date();
  const credit = await creditedAgent(order, contactId, soldAt);
  if (!credit) return null;
  const { agent } = credit;
  if (credit.paused) {
    // Sold while paused: no commission, recorded so the daily sweep doesn't credit it once they're resumed.
    const db = await getDb();
    await db
      .insert(c)
      .values({
        agentId: agent.id,
        kind: "sale",
        orderId: order.id,
        contactId,
        saleCents: order.amountCents,
        amountCents: 0,
        currency: order.currency,
        status: "void",
        voidedAt: soldAt,
        voidReason: "Sold while your account was paused",
        isTest: order.isTest,
        createdAt: soldAt,
      })
      .onConflictDoNothing({ target: c.orderId, where: sql`${c.kind} = 'sale'` });
    return null;
  }
  const db = await getDb();
  const program = await getSalesProgram();

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
      // When it sold (the daily sweep may record it later): months, levels and challenges go by this.
      createdAt: soldAt,
    })
    .onConflictDoNothing({ target: c.orderId, where: sql`${c.kind} = 'sale'` })
    .returning();
  if (!row) return null;

  await db
    .update(schema.salesAgents)
    .set({ lastSaleAt: soldAt })
    .where(and(eq(schema.salesAgents.id, agent.id), sql`(${schema.salesAgents.lastSaleAt} is null or ${schema.salesAgents.lastSaleAt} < ${soldAt.toISOString()}::timestamptz)`));
  await logActivity(contactId, "note", `Sale credited to sales agent ${agent.name}${agent.code ? ` (${agent.code})` : ""}`, {
    meta: { agentId: agent.id, orderId: order.id, commissionCents: amountCents, rateBps: after.level.rateBps },
  }).catch((err) => console.error("[sales] activity log failed", err));

  if (order.isTest && livePayments()) {
    // A test payment on a live site: recorded, but it isn't money and doesn't count (see livePayments).
    await emailAgent(agent, "A test purchase came through your link", [
      `Someone made a test purchase of **${escapeMarkdown(order.description)}** through your link. Test purchases aren't real money: they're never paid out and don't count toward your level, challenges or the leaderboard.`,
      dashboardLink(),
    ]);
    return row;
  }
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
  // One transaction, the sale row locked: a payout or a partial refund can't slip in between, and a failure leaves
  // nothing half done (the daily sweep tries again).
  const result = await db.transaction(async (tx) => {
    const [sale] = await tx.select().from(c).where(and(eq(c.orderId, orderId), eq(c.kind, "sale"))).for("update");
    if (!sale || sale.status === "void" || sale.voidedAt) return null;
    const label = reason.slice(0, 200);
    if (sale.status === "held") {
      await tx.update(c).set({ status: "void", voidedAt: new Date(), voidReason: label }).where(eq(c.id, sale.id));
      return { sale, outcome: "voided" as const };
    }
    // Paid: it stops counting, and what was paid comes off the next payout.
    await tx.update(c).set({ voidedAt: new Date(), voidReason: label }).where(eq(c.id, sale.id));
    await takeBack(tx, sale, sale.amountCents, label);
    return { sale, outcome: "clawback" as const };
  });
  if (!result) return null;
  const { sale, outcome } = result;

  await recheckChallengeBonuses(sale.agentId).catch((err) => console.error("[sales] challenge re-check failed", err));
  const [agent] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.id, sale.agentId)).limit(1);
  if (agent && sale.amountCents > 0) {
    const amount = formatMoney(sale.amountCents, sale.currency);
    await emailAgent(agent, "A sale was refunded", [
      outcome === "voided"
        ? `A customer you referred was refunded for a ${formatMoney(sale.saleCents, sale.currency)} purchase, so its ${amount} commission was cancelled. It no longer counts toward your level or challenges.`
        : `A customer you referred was refunded for a ${formatMoney(sale.saleCents, sale.currency)} purchase after its commission was paid, so what's still owed back comes off your next payout. It no longer counts toward your level or challenges.`,
      "Refunds happen. Customers who know exactly what they're buying rarely ask for one, so keep setting clear expectations.",
      dashboardLink(),
    ]);
  }
  return outcome;
}

type Tx = Parameters<Parameters<Awaited<ReturnType<typeof getDb>>["transaction"]>[0]>[0];

/**
 * Brings what's taken back from a paid sale's agent up to `totalCents` (never down: a late or repeated refund event
 * changes nothing). Raises the order's unpaid take-back row, or adds one. Call inside a transaction holding the sale row.
 */
async function takeBack(tx: Tx, sale: AgentCommission, totalCents: number, note: string): Promise<boolean> {
  const rows = await tx
    .select({ id: c.id, amountCents: c.amountCents, status: c.status })
    .from(c)
    .where(and(eq(c.orderId, sale.orderId!), eq(c.kind, "clawback"), ne(c.status, "void")));
  const taken = rows.reduce((sum, r) => sum - r.amountCents, 0);
  const more = Math.min(totalCents, sale.amountCents) - taken;
  if (more <= 0) return false;
  const open = rows.find((r) => r.status === "held");
  if (open) {
    await tx.update(c).set({ amountCents: open.amountCents - more, note: note.slice(0, 200) }).where(eq(c.id, open.id));
  } else {
    await tx.insert(c).values({
      agentId: sale.agentId,
      kind: "clawback",
      orderId: sale.orderId,
      contactId: sale.contactId,
      saleCents: sale.saleCents,
      rateBps: sale.rateBps,
      level: sale.level,
      amountCents: -more,
      currency: sale.currency,
      status: "held",
      availableAt: new Date(),
      isTest: sale.isTest,
      note: note.slice(0, 200),
    });
  }
  return true;
}

/**
 * A partial refund (Stripe reports the running total refunded): the commission is recalculated on what the customer
 * kept. Unpaid: the commission itself shrinks. Paid: the difference comes off the next payout. Only ever downwards, so
 * events arriving late or twice change nothing. Returns whether anything changed.
 */
export async function adjustAgentSaleForPartialRefund(orderId: string, refundedCents: number): Promise<boolean> {
  const db = await getDb();
  const [order] = await db.select({ amountCents: schema.orders.amountCents }).from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!order) return false;
  const kept = Math.max(0, order.amountCents - refundedCents);
  const note = `Partly refunded (${formatMoney(Math.min(refundedCents, order.amountCents))})`;
  const result = await db.transaction(async (tx) => {
    const [sale] = await tx.select().from(c).where(and(eq(c.orderId, orderId), eq(c.kind, "sale"))).for("update");
    if (!sale || sale.status === "void" || sale.voidedAt || kept >= sale.saleCents) return null;
    const due = commissionFor(kept, sale.rateBps);
    if (sale.status === "held") {
      await tx
        .update(c)
        .set({ saleCents: kept, amountCents: Math.min(due, sale.amountCents), note: sale.note === DISPUTE_NOTE ? DISPUTE_NOTE : note })
        .where(eq(c.id, sale.id));
    } else {
      await tx.update(c).set({ saleCents: kept }).where(eq(c.id, sale.id));
      await takeBack(tx, sale, sale.amountCents - due, note);
    }
    return { sale, due };
  });
  if (!result) return false;
  const { sale, due } = result;
  // Less sales volume: a revenue challenge it helped win may no longer be won.
  await recheckChallengeBonuses(sale.agentId).catch((err) => console.error("[sales] challenge re-check failed", err));
  const [agent] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.id, sale.agentId)).limit(1);
  if (agent) {
    await emailAgent(agent, "A sale was partly refunded", [
      `A customer you referred was partly refunded, so the commission on that sale is now **${formatMoney(due, sale.currency)}** (${formatRate(sale.rateBps)} of the ${formatMoney(kept, sale.currency)} they kept).${sale.status === "paid" ? " The difference comes off your next payout." : ""}`,
      dashboardLink(),
    ]);
  }
  return true;
}

/**
 * A chargeback was opened: the unpaid commission isn't paid until it's resolved (its own payable date is kept). A lost
 * dispute cancels it (refundOrder); a won one releases it.
 */
export async function holdAgentSaleForDispute(orderId: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .update(c)
    .set({ note: DISPUTE_NOTE })
    .where(and(eq(c.orderId, orderId), eq(c.kind, "sale"), eq(c.status, "held")))
    .returning({ id: c.id });
  return Boolean(row);
}

/** The dispute was won (or closed without a loss): the commission is payable from its usual date again. */
export async function releaseAgentSaleDispute(orderId: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .update(c)
    .set({ note: null })
    .where(and(eq(c.orderId, orderId), eq(c.kind, "sale"), eq(c.status, "held"), eq(c.note, DISPUTE_NOTE)))
    .returning({ id: c.id });
  return Boolean(row);
}

/**
 * Daily safety net: credits paid course orders whose commission wasn't recorded (recordPurchase is best effort and
 * runs once), and reverses commissions on orders refunded since. Looks back `days` days.
 */
export async function reconcileAgentSales(days = 45): Promise<{ credited: number; reversed: number }> {
  const db = await getDb();
  const since = new Date(Date.now() - days * DAY);
  const o = schema.orders;
  const r = schema.agentReferrals;
  // Paid course orders with no commission row whose customer had an agent before paying, or whose checkout carried the
  // code of an agent on the team. Oldest first, like they were paid, so claims settle in the same order as live.
  const a = schema.salesAgents;
  const missing = await db
    .select({ order: o })
    .from(o)
    .leftJoin(r, eq(r.contactId, o.contactId))
    .leftJoin(a, and(eq(a.code, o.agentCode), inArray(a.status, ["approved", "paused"])))
    .leftJoin(c, and(eq(c.orderId, o.id), eq(c.kind, "sale")))
    .where(
      and(
        eq(o.status, "paid"),
        eq(o.itemType, "course"),
        gte(o.paidAt, since),
        sql`${o.amountCents} > 0`,
        isNotNull(o.contactId),
        isNull(c.id),
        or(isNotNull(a.id), lte(r.createdAt, o.paidAt)),
      ),
    )
    .orderBy(asc(o.paidAt))
    .limit(200);
  // Lazily: payments.ts imports this module.
  const { isDuplicatePurchase } = await import("@/lib/payments");
  let credited = 0;
  for (const { order } of missing) {
    try {
      // A second purchase of a course the buyer already had (its automatic refund may have failed) earns nothing.
      if (await isDuplicatePurchase(order)) continue;
      if (await recordAgentSale(order, order.contactId!)) credited++;
    } catch (err) {
      console.error("[sales] commission backfill failed", order.id, err);
    }
  }
  const refunded = await db
    .select({ orderId: o.id })
    .from(o)
    .innerJoin(c, and(eq(c.orderId, o.id), eq(c.kind, "sale"), ne(c.status, "void"), isNull(c.voidedAt)))
    .where(and(eq(o.status, "refunded"), gte(o.updatedAt, since)))
    .limit(200);
  let reversed = 0;
  for (const { orderId } of refunded) {
    try {
      if (await reverseAgentSale(orderId, "Refunded")) reversed++;
    } catch (err) {
      console.error("[sales] commission reversal failed", orderId, err);
    }
  }
  return { credited, reversed };
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
  const payable = payableNow(now);
  const rows = await db
    .select({
      agentId: c.agentId,
      owed: sql<number>`coalesce(sum(${c.amountCents}) filter (where ${payable}), 0)`.mapWith(Number),
      pending: sql<number>`coalesce(sum(${c.amountCents}) filter (where ${c.status} = 'held' and not (${payable})), 0)`.mapWith(Number),
      paid: sql<number>`coalesce(sum(${c.amountCents}) filter (where ${c.status} = 'paid'), 0)`.mapWith(Number),
      earned: sql<number>`coalesce(sum(${c.amountCents}) filter (where ${c.status} <> 'void'), 0)`.mapWith(Number),
      next: sql<string | null>`min(${c.availableAt}) filter (where ${c.status} = 'held' and ${c.availableAt} > ${now} and ${c.note} is distinct from ${DISPUTE_NOTE})`,
    })
    .from(c)
    .where(and(agentIds ? inArray(c.agentId, agentIds) : undefined, realMoney()))
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
/** The amount owed changed between the admin seeing it and recording the payout (see recordPayout's expectedCents). */
export class PayoutChangedError extends Error {
  constructor(readonly owedCents: number) {
    super("The amount owed changed");
    this.name = "PayoutChangedError";
  }
}

export async function recordPayout(input: {
  agentId: string;
  method?: string | null;
  reference?: string | null;
  note?: string | null;
  by: string;
  /** What the admin saw and sent: nothing is recorded (PayoutChangedError) when the amount owed is different now. */
  expectedCents?: number;
}): Promise<AgentPayout | null> {
  const db = await getDb();
  const now = new Date();
  const payout = await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: c.id, amountCents: c.amountCents, currency: c.currency })
      .from(c)
      .where(and(eq(c.agentId, input.agentId), payableNow(now)))
      .for("update");
    const total = rows.reduce((sum, r) => sum + r.amountCents, 0);
    if (input.expectedCents !== undefined && total !== input.expectedCents) throw new PayoutChangedError(total);
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
  console.log(`[sales] ${input.by} added a ${input.amountCents > 0 ? "bonus" : "correction"} of ${input.amountCents} cents for agent ${input.agentId}`);
  const [row] = await db
    .insert(c)
    .values({
      agentId: input.agentId,
      kind: input.amountCents > 0 ? "bonus" : "adjustment",
      amountCents: Math.round(input.amountCents),
      status: "held",
      availableAt: new Date(),
      // Agents see this note: who added it is in the server log, not here.
      note: input.note.trim().slice(0, 300),
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
    .where(and(countingSale(), gte(c.createdAt, challenge.startsAt), lt(c.createdAt, challenge.endsAt), agentIds ? inArray(c.agentId, agentIds) : undefined))
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
    // Bonuses first (one per agent: a repeat or a concurrent run inserts nothing and emails no one), then the challenge
    // is marked done, so a run cut short is finished by the next one.
    const scores = await challengeScores(challenge);
    const winners = [...scores].filter(([, score]) => score >= challenge.target).map(([agentId]) => agentId);
    const agents = winners.length
      ? await db
          .select()
          .from(schema.salesAgents)
          .where(and(inArray(schema.salesAgents.id, winners), inArray(schema.salesAgents.status, ["approved", "paused"])))
      : [];
    for (const agent of agents) {
      // Cancelled by an admin meanwhile: stop (cancelChallenge cancels the bonuses already written).
      const [current] = await db.select({ cancelledAt: schema.agentChallenges.cancelledAt }).from(schema.agentChallenges).where(eq(schema.agentChallenges.id, challenge.id));
      if (current?.cancelledAt) break;
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
          // Won with test sales (no live payments): a test bonus, never owed on a live site.
          isTest: !livePayments(),
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
    await db
      .update(schema.agentChallenges)
      .set({ awardedAt: now })
      .where(and(eq(schema.agentChallenges.id, challenge.id), isNull(schema.agentChallenges.awardedAt), isNull(schema.agentChallenges.cancelledAt)));
  }
  return awarded;
}

/**
 * Cancels a challenge that hasn't been awarded yet. Bonuses already written for it (an award run in progress) are
 * cancelled too. Returns whether it was cancelled.
 */
export async function cancelChallenge(id: string): Promise<boolean> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [cancelled] = await tx
      .update(schema.agentChallenges)
      .set({ cancelledAt: new Date() })
      .where(and(eq(schema.agentChallenges.id, id), isNull(schema.agentChallenges.awardedAt), isNull(schema.agentChallenges.cancelledAt)))
      .returning({ id: schema.agentChallenges.id });
    if (!cancelled) return false;
    await tx
      .update(c)
      .set({ status: "void", voidedAt: new Date(), voidReason: "Challenge cancelled" })
      .where(and(eq(c.challengeId, id), eq(c.status, "held")));
    return true;
  });
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
