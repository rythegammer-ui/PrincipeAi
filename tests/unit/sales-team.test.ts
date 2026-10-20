import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { NextRequest } from "next/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

// next/headers outside a request: an in-memory cookie jar (the visitor's referral cookie, session cookies).
const mocks = vi.hoisted(() => ({ jar: new Map<string, string>() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (mocks.jar.has(name) ? { name, value: mocks.jar.get(name) } : undefined),
    set: (name: string, value: string) => void mocks.jar.set(name, value),
    delete: (name: string) => void mocks.jar.delete(name),
  }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }),
}));

import { getDb, schema } from "@/db";
import type { SalesAgent } from "@/db/schema";
import { addAdminMember, createTeamSignInLink, removeAdminMember } from "@/lib/admin-team";
import { ADMIN_COOKIE, consumeLoginToken, createLoginToken, getAdminSession, startAdminSession, startTeamAdminSession } from "@/lib/auth";
import { captureLead } from "@/lib/crm";
import { fulfillOrder, orderIdForCheckoutSession, refundOrder } from "@/lib/payments";
import { approveAgent, rejectAgent, setAgentStatus, submitAgentApplication, type AgentApplication } from "@/lib/sales/agents";
import {
  addAgentAdjustment,
  agentBalance,
  awardDueChallenges,
  holdAgentSaleForDispute,
  monthlySales,
  reconcileAgentSales,
  recordPayout,
  releaseAgentSaleDispute,
  reverseAgentSale,
} from "@/lib/sales/commissions";
import {
  commissionFor,
  computeBadges,
  DEFAULT_LEVELS,
  normalizeAgentCode,
  normalizeLevels,
  publicName,
  standing,
  suggestAgentCode,
  weeklyStreak,
} from "@/lib/sales/game";
import { saveSalesProgram, getSalesProgram } from "@/lib/sales/program";
import { AGENT_COOKIE, assignContactToAgent, claimContactForAgent } from "@/lib/sales/referrals";
import { agentDashboard, leaderboard } from "@/lib/sales/stats";
import { proxy } from "@/proxy";

type DB = Awaited<ReturnType<typeof getDb>>;
const DAY = 86_400_000;
const unique = (label: string) => `${label}-${randomUUID().slice(0, 8)}@example.com`;

describe("program rules (pure)", () => {
  it("climbs 20% → 25% → 30% with monthly sales, and keeps last month's level through this month", () => {
    expect(standing(DEFAULT_LEVELS, 0).level.rateBps).toBe(2000);
    expect(standing(DEFAULT_LEVELS, 4)).toMatchObject({ toNext: 1, next: { key: "pro" } });
    expect(standing(DEFAULT_LEVELS, 5).level.rateBps).toBe(2500);
    expect(standing(DEFAULT_LEVELS, 10)).toMatchObject({ level: { rateBps: 3000 }, next: null, toNext: 0 });
    // 7 sales last month: Pro from this month's first sale.
    expect(standing(DEFAULT_LEVELS, 1, 7).level.key).toBe("pro");
    expect(commissionFor(29_700, 2000)).toBe(5940);
    expect(commissionFor(4_999, 2500)).toBe(1250);
  });

  it("cleans admin-entered levels", () => {
    const levels = normalizeLevels([
      { key: "", name: " Gold ", minSales: 12, rateBps: 99_999 },
      { key: "base", name: "Base", minSales: 3, rateBps: 1500 },
      { key: "dup", name: "Dup", minSales: 12, rateBps: 100 },
      { key: "x", name: "  ", minSales: 1, rateBps: 100 },
    ]);
    expect(levels).toEqual([
      { key: "base", name: "Base", minSales: 0, rateBps: 1500 },
      { key: "gold", name: "Gold", minSales: 12, rateBps: 9000 },
    ]);
    expect(normalizeLevels([])).toEqual(DEFAULT_LEVELS);
  });

  it("formats names, codes and streaks", () => {
    expect(publicName("  jane   van doe ")).toBe("jane D.");
    expect(publicName("Prince")).toBe("Prince");
    expect(normalizeAgentCode(" jane27 ")).toBe("JANE27");
    expect(normalizeAgentCode("ja")).toBeNull();
    expect(normalizeAgentCode("jane-27")).toBeNull();
    expect(suggestAgentCode("Émile Zola", () => 0.5)).toBe("MILE55");
    expect(suggestAgentCode("A", () => 0)).toBe("AGENT10");

    const tz = "America/New_York";
    const now = new Date("2026-10-21T15:00:00Z"); // a Wednesday
    const weeksAgo = (w: number) => new Date(now.getTime() - w * 7 * DAY);
    expect(weeklyStreak([now, weeksAgo(1), weeksAgo(2)], now, tz)).toBe(3);
    // No sale yet this week: last week's streak still stands.
    expect(weeklyStreak([weeksAgo(1), weeksAgo(2)], now, tz)).toBe(2);
    expect(weeklyStreak([weeksAgo(2)], now, tz)).toBe(0);

    const badges = computeBadges({
      sales: [now, now, now, weeksAgo(1)].map((at) => ({ at, saleCents: 29_700 })),
      levels: DEFAULT_LEVELS,
      challengesWon: 0,
      monthsWon: 1,
      now,
      tz,
    });
    const byKey = Object.fromEntries(badges.map((b) => [b.key, b]));
    expect(byKey["first-sale"].earned).toBe(true);
    expect(byKey["hat-trick"].earned).toBe(true);
    expect(byKey["club-1k"].earned).toBe(true);
    expect(byKey["level-2"]).toMatchObject({ earned: false, progress: "4 / 5" });
    expect(byKey["champion"].earned).toBe(true);
    expect(byKey["challenger"].earned).toBe(false);
  });
});

describe("sales team", () => {
  let db: DB;
  let course: { id: string; title: string; priceCents: number };

  beforeAll(async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    db = await getDb();
    const [row] = await db.select().from(schema.courses).where(eq(schema.courses.slug, "ai-for-business")).limit(1);
    course = { id: row.id, title: row.title, priceCents: row.priceCents };
  }, 60_000);

  beforeEach(() => mocks.jar.clear());

  const application = (email: string, name = "Jane Tester"): AgentApplication => ({
    name,
    email,
    phone: "555-0100",
    city: "Austin",
    state: "TX",
    experience: "some",
    hours: "5-10",
    channels: "Local business owners I know from my chamber of commerce.",
    why: "",
    agree: "yes",
    adult: "yes",
  });

  async function newAgent(name = "Jane Tester"): Promise<SalesAgent> {
    const email = unique("agent");
    expect(await submitAgentApplication(application(email, name))).toBe("created");
    const [applied] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.email, email));
    const agent = await approveAgent(applied.id, "owner@example.com");
    if (!agent?.code) throw new Error("approval failed");
    return agent;
  }

  /** A customer who came through the agent's link and bought the course (built-in test checkout). */
  async function sale(agent: SalesAgent, opts: { email?: string; amountCents?: number } = {}) {
    const email = opts.email ?? unique("buyer");
    mocks.jar.set(AGENT_COOKIE, agent.code!);
    const { contact } = await captureLead({ email, name: "Buyer", source: "checkout", activity: { type: "form", title: "Started checkout" }, stage: "engaged" });
    mocks.jar.clear();
    const [order] = await db
      .insert(schema.orders)
      .values({ contactId: contact.id, email, name: "Buyer", itemType: "course", courseId: course.id, description: course.title, amountCents: opts.amountCents ?? course.priceCents })
      .returning();
    await fulfillOrder(order.id, { isTest: true });
    const [commission] = await db
      .select()
      .from(schema.agentCommissions)
      .where(and(eq(schema.agentCommissions.orderId, order.id), eq(schema.agentCommissions.kind, "sale")));
    return { order, contact, commission };
  }

  it("takes applications quietly, and approval gives a unique referral code", async () => {
    const email = unique("apply");
    expect(await submitAgentApplication(application(email))).toBe("created");
    expect(await submitAgentApplication(application(email))).toBe("updated");
    const [row] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.email, email));
    expect(row).toMatchObject({ status: "applied", code: null, state: "TX" });
    expect(await rejectAgent(row.id, "owner@example.com", { notify: true })).toMatchObject({ status: "rejected" });
    // Re-applying after a decline puts them back in the queue.
    expect(await submitAgentApplication(application(email))).toBe("updated");
    const approved = await approveAgent(row.id, "owner@example.com");
    expect(approved?.code).toMatch(/^JANE\d{2}$/);
    // Someone already on the team can't be reset by applying again.
    expect(await submitAgentApplication(application(email))).toBe("unchanged");

    const emails = await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email));
    expect(emails.map((e) => e.subject)).toEqual(expect.arrayContaining([expect.stringContaining("got your application"), expect.stringContaining("You're on the")]));
    expect(emails.find((e) => e.subject.includes("You're on the"))?.html).toContain(`/r/${approved?.code}`);
  });

  it("credits the referring agent's sale at their level, and the first agent keeps the customer", async () => {
    const jane = await newAgent();
    const { commission, contact } = await sale(jane);
    expect(commission).toMatchObject({ agentId: jane.id, rateBps: 2000, level: "Starter", status: "held", isTest: true });
    expect(commission.amountCents).toBe(commissionFor(course.priceCents, 2000));
    const program = await getSalesProgram();
    expect(commission.availableAt.getTime() - commission.createdAt.getTime()).toBeGreaterThan((program.holdDays - 1) * DAY);

    // Another agent's link doesn't take the customer while the first claim holds.
    const sam = await newAgent("Sam Other");
    expect(await claimContactForAgent(contact.id, sam.code)).toBe(false);
    const [ref] = await db.select().from(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contact.id));
    expect(ref.agentId).toBe(jane.id);
    // Once it runs out, the next agent's link claims them.
    await db.update(schema.agentReferrals).set({ createdAt: new Date(Date.now() - (program.attributionDays + 1) * DAY) }).where(eq(schema.agentReferrals.contactId, contact.id));
    expect(await claimContactForAgent(contact.id, sam.code)).toBe(true);

    const mail = await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, jane.email));
    expect(mail.some((m) => m.subject.startsWith("You made a sale!"))).toBe(true);
  });

  it("pays nothing for self-purchases, unknown codes, or a paused agent's links", async () => {
    const jane = await newAgent();
    const own = await sale(jane, { email: jane.email });
    expect(own.commission).toBeUndefined();

    mocks.jar.set(AGENT_COOKIE, "NOSUCHCODE");
    const { contact } = await captureLead({ email: unique("stray"), source: "lead_magnet", activity: { type: "optin", title: "Opt-in" } });
    expect(await db.select().from(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contact.id))).toHaveLength(0);

    await setAgentStatus(jane.id, "paused", "owner@example.com");
    const paused = await sale(jane);
    expect(paused.commission).toBeUndefined();
  });

  it("levels up on the 5th sale of the month and keeps the level next month", async () => {
    const jane = await newAgent();
    const rates: number[] = [];
    for (let i = 0; i < 6; i++) rates.push((await sale(jane)).commission.rateBps);
    expect(rates).toEqual([2000, 2000, 2000, 2000, 2500, 2500]);
    const levelUp = (await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, jane.email))).filter((m) => m.html.includes("Level up"));
    expect(levelUp).toHaveLength(1);

    // Move those sales into last month (its 15th, business time zone): this month's first sale still earns the Pro rate.
    const lastMonth15 = DateTime.now().setZone("America/New_York").startOf("month").minus({ months: 1 }).plus({ days: 14, hours: 12 }).toJSDate();
    await db.update(schema.agentCommissions).set({ createdAt: lastMonth15 }).where(eq(schema.agentCommissions.agentId, jane.id));
    expect(await monthlySales(jane.id)).toMatchObject({ thisMonth: 0 });
    expect((await sale(jane)).commission.rateBps).toBe(2500);
  });

  it("cancels an unpaid commission on refund, claws back a paid one, and pays only what's owed", async () => {
    const jane = await newAgent();
    const first = await sale(jane);
    const second = await sale(jane);
    const third = await sale(jane);
    const each = first.commission.amountCents;

    // Nothing is payable during the hold period.
    expect(await recordPayout({ agentId: jane.id, by: "owner@example.com" })).toBeNull();
    expect(await agentBalance(jane.id)).toMatchObject({ owedCents: 0, pendingCents: 3 * each });

    // Refund while held: cancelled, and the sale stops counting.
    await refundOrder(first.order.id, { source: "manual", reason: "Changed their mind" });
    const [voided] = await db.select().from(schema.agentCommissions).where(eq(schema.agentCommissions.id, first.commission.id));
    expect(voided).toMatchObject({ status: "void", voidReason: "Changed their mind" });
    expect((await monthlySales(jane.id)).thisMonth).toBe(2);

    // The hold passes: both are owed; a payout takes them.
    await db.update(schema.agentCommissions).set({ availableAt: new Date(Date.now() - DAY) }).where(eq(schema.agentCommissions.agentId, jane.id));
    const payout = await recordPayout({ agentId: jane.id, method: "Venmo", reference: "txn-1", by: "owner@example.com" });
    expect(payout?.amountCents).toBe(2 * each);
    expect(await agentBalance(jane.id)).toMatchObject({ owedCents: 0, paidCents: 2 * each });
    expect(await recordPayout({ agentId: jane.id, by: "owner@example.com" })).toBeNull();

    // A refund after payment: clawed back from the next payout, once.
    await refundOrder(second.order.id, { source: "stripe", reason: "Refunded in Stripe" });
    expect(await reverseAgentSale(second.order.id, "again")).toBeNull();
    expect((await agentBalance(jane.id)).owedCents).toBe(-each);
    // Owed is negative: nothing to pay until it's earned back.
    expect(await recordPayout({ agentId: jane.id, by: "owner@example.com" })).toBeNull();
    await addAgentAdjustment({ agentId: jane.id, amountCents: each + 1000, note: "Great first week", by: "owner@example.com" });
    const next = await recordPayout({ agentId: jane.id, by: "owner@example.com" });
    expect(next?.amountCents).toBe(1000);
    expect(third.commission.status).toBe("held");
  });

  it("awards challenge bonuses after the challenge ends, and takes them back if refunds drop the agent below target", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Second");
    const start = new Date(Date.now() - DAY);
    const [challenge] = await db
      .insert(schema.agentChallenges)
      .values({ title: "Two by Friday", metric: "sales", target: 2, bonusCents: 5000, startsAt: start, endsAt: new Date(Date.now() + DAY) })
      .returning();
    const a = await sale(jane);
    await sale(jane);
    await sale(sam);

    // Still running: nothing yet.
    expect(await awardDueChallenges()).toBe(0);
    const ended = new Date(Date.now() + 2 * DAY);
    // (Agents from the tests above sold in this window too.)
    expect(await awardDueChallenges(ended)).toBeGreaterThanOrEqual(1);
    expect(await awardDueChallenges(ended)).toBe(0);
    const bonuses = await db.select().from(schema.agentCommissions).where(eq(schema.agentCommissions.challengeId, challenge.id));
    const bonus = bonuses.find((b) => b.agentId === jane.id)!;
    expect(bonus).toMatchObject({ kind: "bonus", amountCents: 5000, status: "held" });
    expect(bonuses.some((b) => b.agentId === sam.id)).toBe(false);

    await refundOrder(a.order.id, { source: "manual" });
    const [after] = await db.select().from(schema.agentCommissions).where(eq(schema.agentCommissions.id, bonus.id));
    expect(after.status).toBe("void");
  });

  it("credits payment-link checkouts started from an agent's /buy link", async () => {
    const jane = await newAgent();
    const email = unique("link-buyer");
    const session = {
      id: `cs_test_${randomUUID().replace(/-/g, "")}`,
      object: "checkout.session",
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      payment_link: "plink_test_123",
      client_reference_id: `agent_${jane.code}`,
      amount_total: course.priceCents,
      currency: "usd",
      livemode: false,
      customer_details: { email, name: "Link Buyer" },
      metadata: { courseId: course.id },
      payment_intent: null,
    } as unknown as Parameters<typeof orderIdForCheckoutSession>[0];
    const orderId = await orderIdForCheckoutSession(session, { create: true });
    expect(orderId).toBeTruthy();
    await fulfillOrder(orderId!, { isTest: true, amountPaidCents: course.priceCents });
    const [commission] = await db.select().from(schema.agentCommissions).where(eq(schema.agentCommissions.orderId, orderId!));
    expect(commission).toMatchObject({ agentId: jane.id, kind: "sale" });
  });

  it("only credits customers who were the agent's before they paid, and the daily sweep fills gaps", async () => {
    const jane = await newAgent();
    // Bought first, came through the agent's link afterwards (e.g. the success page saw the cookie, the webhook didn't).
    const email = unique("late");
    const { contact } = await captureLead({ email, source: "checkout", activity: { type: "form", title: "Started checkout" } });
    const [order] = await db
      .insert(schema.orders)
      .values({ contactId: contact.id, email, itemType: "course", courseId: course.id, description: course.title, amountCents: course.priceCents })
      .returning();
    await fulfillOrder(order.id, { isTest: true });
    expect(await claimContactForAgent(contact.id, jane.code)).toBe(true);
    expect(await reconcileAgentSales()).toMatchObject({ credited: 0 });
    expect(await db.select().from(schema.agentCommissions).where(eq(schema.agentCommissions.orderId, order.id))).toHaveLength(0);

    // A sale whose bookkeeping failed: the sweep credits it, dated when it sold.
    const missed = await sale(jane);
    await db.delete(schema.agentCommissions).where(eq(schema.agentCommissions.id, missed.commission.id));
    expect((await reconcileAgentSales()).credited).toBe(1);
    const [again] = await db.select().from(schema.agentCommissions).where(eq(schema.agentCommissions.orderId, missed.order.id));
    expect(again.createdAt.getTime()).toBe(missed.commission.createdAt.getTime());
    // A refund the reversal missed.
    await db.update(schema.orders).set({ status: "refunded" }).where(eq(schema.orders.id, missed.order.id));
    expect((await reconcileAgentSales()).reversed).toBe(1);
    expect((await reconcileAgentSales()).reversed).toBe(0);
  });

  it("keeps an admin's assignment until an admin changes it", async () => {
    const jane = await newAgent();
    const sam = await newAgent("Sam Third");
    const { contact } = await captureLead({ email: unique("assigned"), source: "manual", activity: { type: "note", title: "Added" } });
    await assignContactToAgent(contact.id, jane.id);
    await db.update(schema.agentReferrals).set({ createdAt: new Date(Date.now() - 400 * DAY) }).where(eq(schema.agentReferrals.contactId, contact.id));
    expect(await claimContactForAgent(contact.id, sam.code)).toBe(false);
    const [order] = await db
      .insert(schema.orders)
      .values({ contactId: contact.id, email: contact.email, itemType: "course", courseId: course.id, description: course.title, amountCents: course.priceCents })
      .returning();
    await fulfillOrder(order.id, { isTest: true });
    const [commission] = await db.select().from(schema.agentCommissions).where(eq(schema.agentCommissions.orderId, order.id));
    expect(commission.agentId).toBe(jane.id);
    await assignContactToAgent(contact.id, null);
    expect(await claimContactForAgent(contact.id, sam.code)).toBe(true);
  });

  it("holds a disputed sale's commission until the dispute is resolved", async () => {
    const jane = await newAgent();
    const { order, commission } = await sale(jane);
    expect(await holdAgentSaleForDispute(order.id)).toBe(true);
    const [held] = await db.select().from(schema.agentCommissions).where(eq(schema.agentCommissions.id, commission.id));
    expect(held.availableAt.getTime()).toBeGreaterThan(Date.now() + 80 * DAY);
    expect(await releaseAgentSaleDispute(order.id)).toBe(true);
    const [released] = await db.select().from(schema.agentCommissions).where(eq(schema.agentCommissions.id, commission.id));
    expect(released.availableAt.getTime()).toBe(commission.availableAt.getTime());
    expect(released.note).toBeNull();
  });

  it("never owes or counts test payments once the site takes live payments", async () => {
    const jane = await newAgent();
    const { commission } = await sale(jane);
    await db.update(schema.agentCommissions).set({ availableAt: new Date(Date.now() - DAY) }).where(eq(schema.agentCommissions.id, commission.id));
    expect((await agentBalance(jane.id)).owedCents).toBe(commission.amountCents);
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_principe_unit_tests_only");
    onTestFinished(() => vi.unstubAllEnvs());
    expect((await agentBalance(jane.id)).owedCents).toBe(0);
    expect(await recordPayout({ agentId: jane.id, by: "owner@example.com" })).toBeNull();
    expect((await monthlySales(jane.id)).thisMonth).toBe(0);
  });

  it("builds the agent dashboard and leaderboard", async () => {
    const program = await getSalesProgram();
    await saveSalesProgram({ ...program, holdDays: 14 });
    onTestFinished(() => saveSalesProgram(program).then(() => undefined));
    const jane = await newAgent("Jane Board");
    await sale(jane);
    await sale(jane);
    const dash = await agentDashboard(jane);
    expect(dash).toMatchObject({ thisMonth: 2, lifetimeSales: 2, customers: 2, streak: 1 });
    expect(dash.standing).toMatchObject({ toNext: 3, next: { key: "pro" } });
    expect(dash.badges.find((b) => b.key === "first-sale")?.earned).toBe(true);
    expect(dash.myRank?.publicName).toBe("Jane B.");
    expect(dash.ledger[0].availableAt.getTime() - dash.ledger[0].createdAt.getTime()).toBeLessThan(15 * DAY);
    const board = await leaderboard(new Date(Date.now() - DAY), new Date(Date.now() + DAY));
    expect(board.length).toBeGreaterThan(0);
    expect(board[0].rank).toBe(1);
  });
});

describe("admin team sign-in", () => {
  beforeEach(() => {
    mocks.jar.clear();
    vi.stubEnv("ADMIN_EMAIL", "owner@example.com");
    vi.stubEnv("ADMIN_PASSWORD", "a-long-owner-password-123");
    vi.stubEnv("ADMIN_SESSION_VERSION", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  const adminPage = (cookie: string) => new NextRequest("http://localhost:3000/admin/contacts", { headers: { cookie: `${ADMIN_COOKIE}=${cookie}` } });
  const passed = (res: Response) => !res.headers.get("location");

  it("signs a member in with an emailed link, and removing them ends every session at once", async () => {
    const added = await addAdminMember({ email: "Ayan.Test@Example.com", name: "Ayan", addedBy: "owner@example.com" });
    if (!added.ok) throw new Error(added.error);
    expect(added.member.email).toBe("ayan.test@example.com");
    expect(await addAdminMember({ email: "ayan.test@example.com", addedBy: "owner@example.com" })).toEqual({ ok: false, error: "already-member" });
    expect(await addAdminMember({ email: "owner@example.com", addedBy: "x" })).toEqual({ ok: false, error: "owner" });

    const token = await createLoginToken("ayan.test@example.com", "/admin/sales");
    const result = await consumeLoginToken(token);
    expect(result).toMatchObject({ kind: "admin", redirectTo: "/admin/sales", member: { email: "ayan.test@example.com" } });
    // Single use.
    expect(await consumeLoginToken(token)).toBeNull();

    if (result?.kind !== "admin") throw new Error("expected an admin sign-in");
    await startTeamAdminSession(result.member);
    const cookie = mocks.jar.get(ADMIN_COOKIE)!;
    expect(await getAdminSession()).toMatchObject({ email: "ayan.test@example.com", teamVersion: 1 });
    expect(passed(await proxy(adminPage(cookie)))).toBe(true);

    await removeAdminMember(result.member.id);
    expect(await getAdminSession()).toBeNull();
    // A link for someone no longer on the team doesn't sign them in.
    expect(await consumeLoginToken(await createLoginToken("ayan.test@example.com", "/admin"))).toBeNull();

    // Added back: a fresh sign-in works; the old cookie stays dead.
    const back = await addAdminMember({ email: "ayan.test@example.com", addedBy: "owner@example.com" });
    if (!back.ok) throw new Error(back.error);
    expect(await getAdminSession()).toBeNull();
    await startTeamAdminSession(back.member);
    expect(await getAdminSession()).toMatchObject({ teamVersion: 2 });
  });

  it("signs team members out too when the owner's password changes, and keeps the owner's own session rules", async () => {
    const added = await addAdminMember({ email: unique("member"), addedBy: "owner@example.com" });
    if (!added.ok) throw new Error(added.error);
    await startTeamAdminSession(added.member);
    const member = mocks.jar.get(ADMIN_COOKIE)!;
    await startAdminSession("owner@example.com");
    const owner = mocks.jar.get(ADMIN_COOKIE)!;
    expect(passed(await proxy(adminPage(member)))).toBe(true);
    expect(passed(await proxy(adminPage(owner)))).toBe(true);

    vi.stubEnv("ADMIN_PASSWORD", "a-different-owner-password-456");
    expect(passed(await proxy(adminPage(member)))).toBe(false);
    expect(passed(await proxy(adminPage(owner)))).toBe(false);
  });

  it("lets the owner hand a member a one-time link", async () => {
    const added = await addAdminMember({ email: unique("linked"), addedBy: "owner@example.com" });
    if (!added.ok) throw new Error(added.error);
    const link = await createTeamSignInLink(added.member.id);
    expect(link).toMatch(/\/auth\/verify\?token=.+&for=admin$/);
    const token = decodeURIComponent(new URL(link!).searchParams.get("token")!);
    expect(await consumeLoginToken(token)).toMatchObject({ kind: "admin", member: { id: added.member.id } });
    await removeAdminMember(added.member.id);
    expect(await createTeamSignInLink(added.member.id)).toBeNull();
  });

  it("never turns a student or agent link into an admin session", async () => {
    const email = unique("student");
    const result = await consumeLoginToken(await createLoginToken(email, "/learn"));
    expect(result?.kind).toBe("student");
    // Not on the team: an /admin link for them is refused.
    expect(await consumeLoginToken(await createLoginToken(email, "/admin"))).toBeNull();
  });
});

describe("referral links", () => {
  it("remembers ?ref=CODE on any page, and keeps /agent behind a sign-in", async () => {
    const res = await proxy(new NextRequest("http://localhost:3000/courses/ai-for-business?ref=jane27"));
    expect(res.cookies.get(AGENT_COOKIE)?.value).toBe("JANE27");
    expect((await proxy(new NextRequest("http://localhost:3000/?ref=<script>"))).cookies.get(AGENT_COOKIE)).toBeUndefined();

    const portal = await proxy(new NextRequest("http://localhost:3000/agent"));
    expect(new URL(portal.headers.get("location")!).pathname).toBe("/agent/login");
    expect(new URL((await proxy(new NextRequest("http://localhost:3000/agent/toolkit?ref=JANE27"))).headers.get("location")!).pathname).toBe("/agent/login");
    expect((await proxy(new NextRequest("http://localhost:3000/agent/login"))).headers.get("location")).toBeNull();
  });

  it("/r/CODE sets the cookie only for an active agent and never redirects into private areas", async () => {
    const { GET } = await import("@/app/r/[code]/route");
    const db = await getDb();
    const email = unique("short");
    const [agent] = await db.insert(schema.salesAgents).values({ email, name: "Short Link", code: `SL${randomUUID().slice(0, 6).toUpperCase().replace(/-/g, "")}`, status: "approved" }).returning();
    const call = (code: string, to = "") => GET(new Request(`http://localhost:3000/r/${code}${to}`), { params: Promise.resolve({ code }) });

    const ok = await call(agent.code!.toLowerCase(), "?to=/courses/ai-for-business");
    expect(ok.headers.get("location")).toBe("http://localhost:3000/courses/ai-for-business");
    expect(ok.headers.get("set-cookie")).toContain(`${AGENT_COOKIE}=${agent.code}`);
    expect((await call("NOSUCHCODE")).headers.get("set-cookie")).toBeNull();
    expect((await call(agent.code!, "?to=/admin/sales")).headers.get("location")).toBe("http://localhost:3000/");
    expect((await call(agent.code!, "?to=//evil.example")).headers.get("location")).toBe("http://localhost:3000/");
  });
});
