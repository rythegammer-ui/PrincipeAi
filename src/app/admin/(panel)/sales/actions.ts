"use server";

import { eq } from "drizzle-orm";
import { DateTime } from "luxon";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { assertAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { approveAgent, rejectAgent, setAgentCode, setAgentStatus } from "@/lib/sales/agents";
import { addAgentAdjustment, cancelChallenge, PayoutChangedError, recordPayout, voidCommission } from "@/lib/sales/commissions";
import { MAX_RATE_BPS } from "@/lib/sales/game";
import { getSalesProgram, saveSalesProgram } from "@/lib/sales/program";
import { adminMarkDoNotContact, adminReleaseProspect } from "@/lib/sales/prospects";
import { getBusinessTimezone } from "@/lib/scheduling";
import { formatMoney } from "@/lib/utils";

export type SalesFormState = { ok?: boolean; error?: string; message?: string };

const Id = z.uuid();
const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};

function refresh(agentId?: string) {
  revalidatePath("/admin/sales");
  if (agentId) revalidatePath(`/admin/sales/${agentId}`);
}

/** "$12.50", "-5", "1,200" → cents (negative allowed when `signed`), or null when it isn't an amount. */
function dollarsToCents(input: string, signed = false): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  const re = signed ? /^-?\d{1,7}(\.\d{1,2})?$/ : /^\d{1,7}(\.\d{1,2})?$/;
  if (!re.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/* ------------------------------------------------------------------ */
/* Applications + status                                               */
/* ------------------------------------------------------------------ */

export async function approveAgentAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  const session = await assertAdmin();
  const id = Id.safeParse(str(fd, "agentId"));
  if (!id.success) return { error: "Invalid request." };
  const agent = await approveAgent(id.data, session.email);
  refresh(id.data);
  if (!agent) return { error: "Only new applications and paused agents can be approved." };
  return { ok: true, message: `${agent.name} is active. We emailed them their referral link (${agent.code}).` };
}

export async function declineAgentAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  const session = await assertAdmin();
  const id = Id.safeParse(str(fd, "agentId"));
  if (!id.success) return { error: "Invalid request." };
  const agent = await rejectAgent(id.data, session.email, { notify: fd.get("notify") === "on" });
  refresh(id.data);
  if (!agent) return { error: "Only pending applications can be declined." };
  return { ok: true, message: "Application declined." };
}

const statusSchema = z.object({ agentId: Id, status: z.enum(["paused", "removed"]) });

export async function setAgentStatusAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  const session = await assertAdmin();
  const parsed = statusSchema.safeParse({ agentId: str(fd, "agentId"), status: str(fd, "status") });
  if (!parsed.success) return { error: "Invalid request." };
  const agent = await setAgentStatus(parsed.data.agentId, parsed.data.status, session.email);
  refresh(parsed.data.agentId);
  if (!agent) return { error: "That change doesn't apply to this agent's current status." };
  return { ok: true, message: parsed.data.status === "paused" ? "Agent paused." : "Agent removed." };
}

export async function saveAgentCodeAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  await assertAdmin();
  const id = Id.safeParse(str(fd, "agentId"));
  if (!id.success) return { error: "Invalid request." };
  const result = await setAgentCode(id.data, str(fd, "code"));
  refresh(id.data);
  if (!result.ok) return { error: result.error };
  return { ok: true, message: `Code changed to ${result.code}. Links with the old code no longer earn.` };
}

export async function saveAgentNotesAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  await assertAdmin();
  const parsed = z.object({ agentId: Id, notes: z.string().max(5000) }).safeParse({ agentId: str(fd, "agentId"), notes: str(fd, "notes") });
  if (!parsed.success) return { error: "Notes are limited to 5,000 characters." };
  const db = await getDb();
  await db
    .update(schema.salesAgents)
    .set({ notes: parsed.data.notes || null })
    .where(eq(schema.salesAgents.id, parsed.data.agentId));
  refresh(parsed.data.agentId);
  return { ok: true, message: "Notes saved." };
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

const payoutSchema = z.object({
  agentId: Id,
  method: z.string().max(60),
  reference: z.string().max(200),
  note: z.string().max(500),
  /** The amount owed the page showed (what the admin sent): nothing is recorded if it has changed since. */
  expectedCents: z.coerce.number().int().min(0).max(100_000_000),
});

export async function recordPayoutAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  const session = await assertAdmin();
  const parsed = payoutSchema.safeParse({
    agentId: str(fd, "agentId"),
    method: str(fd, "method"),
    reference: str(fd, "reference"),
    note: str(fd, "note"),
    expectedCents: str(fd, "expectedCents"),
  });
  if (!parsed.success) return { error: "Please check the payout details (method up to 60 characters, reference up to 200)." };
  const limit = await rateLimit(`admin-payout:${session.email}`, 30, 600);
  if (!limit.ok) return { error: "Too many payouts in a short time. Please wait a few minutes." };
  let payout;
  try {
    payout = await recordPayout({ ...parsed.data, by: session.email });
  } catch (err) {
    if (err instanceof PayoutChangedError) {
      refresh(parsed.data.agentId);
      return { error: `The amount owed changed to ${formatMoney(err.owedCents)} since this page loaded. Check it before recording.` };
    }
    throw err;
  }
  refresh(parsed.data.agentId);
  if (!payout) return { error: "Nothing is owed to this agent right now." };
  return { ok: true, message: `Payout of ${formatMoney(payout.amountCents, payout.currency)} recorded. The agent was emailed.` };
}

export async function addAdjustmentAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  const session = await assertAdmin();
  const id = Id.safeParse(str(fd, "agentId"));
  if (!id.success) return { error: "Invalid request." };
  const cents = dollarsToCents(str(fd, "amount"), true);
  if (cents === null || cents === 0) return { error: "Enter an amount in dollars, e.g. 50 or -12.50." };
  if (Math.abs(cents) > 1_000_000) return { error: "Amounts are limited to $10,000 at a time." };
  const note = str(fd, "note");
  if (note.length < 3 || note.length > 300) return { error: "Add a short note (3–300 characters) saying what it's for. The agent sees it." };
  await addAgentAdjustment({ agentId: id.data, amountCents: cents, note, by: session.email });
  refresh(id.data);
  return { ok: true, message: cents > 0 ? `Bonus of ${formatMoney(cents)} added (the agent was emailed).` : `Correction of ${formatMoney(cents)} added.` };
}

export async function voidCommissionAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  await assertAdmin();
  const parsed = z.object({ id: Id, agentId: Id }).safeParse({ id: str(fd, "id"), agentId: str(fd, "agentId") });
  if (!parsed.success) return { error: "Invalid request." };
  // The reason can show in the agent's own dashboard, so it carries no admin details.
  const reason = str(fd, "reason").slice(0, 150);
  const done = await voidCommission(parsed.data.id, reason || "Cancelled by the team");
  refresh(parsed.data.agentId);
  if (!done) return { error: "Only unpaid entries can be cancelled. For a paid one, add a negative correction." };
  return { ok: true, message: "Entry cancelled." };
}

/* ------------------------------------------------------------------ */
/* Program + challenges                                                */
/* ------------------------------------------------------------------ */

const levelInput = z.array(
  z.object({
    key: z.string().max(40),
    name: z.string().trim().min(1, "Every level needs a name.").max(40),
    minSales: z.number().int().min(0).max(100_000),
    rateBps: z.number().int().min(0).max(MAX_RATE_BPS),
  }),
);

export async function saveProgramAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  await assertAdmin();
  let levelsRaw: unknown;
  try {
    levelsRaw = JSON.parse(str(fd, "levels") || "[]");
  } catch {
    return { error: "The levels couldn't be read. Reload the page and try again." };
  }
  const levels = levelInput.safeParse(levelsRaw);
  if (!levels.success || levels.data.length < 1 || levels.data.length > 5) {
    return { error: "Each level needs a name, a whole number of sales (0 or more) and a commission between 0% and 90%. Keep 1 to 5 levels." };
  }
  const later = levels.data.slice(1).map((l) => l.minSales);
  if (later.some((n) => n < 1) || new Set(later).size !== later.length) {
    return { error: "Each level after the first needs its own number of sales per month (1 or more)." };
  }
  // Levels are matched by key: a repeated one would be dropped when saving, so refuse it instead of losing a level.
  const keys = levels.data.map((l) => l.key.trim());
  if (keys.some((k) => !k) || new Set(keys).size !== keys.length) {
    return { error: "Two levels got mixed up. Reload the page and make your changes again." };
  }
  const holdDays = Number(str(fd, "holdDays"));
  const attributionDays = Number(str(fd, "attributionDays"));
  const minPayoutCents = dollarsToCents(str(fd, "minPayout") || "0");
  const payoutSchedule = str(fd, "payoutSchedule");
  if (!Number.isInteger(holdDays) || holdDays < 0 || holdDays > 180) return { error: "The hold period must be 0–180 days." };
  if (!Number.isInteger(attributionDays) || attributionDays < 1 || attributionDays > 3650) return { error: "The customer window must be 1–3650 days." };
  if (minPayoutCents === null || minPayoutCents > 1_000_000) return { error: "Enter a minimum payout in dollars (up to $10,000)." };
  if (payoutSchedule.length > 200) return { error: "Keep the payout schedule under 200 characters." };
  const current = await getSalesProgram();
  await saveSalesProgram({
    ...current,
    applicationsOpen: fd.get("applicationsOpen") === "on",
    levels: levels.data,
    holdDays,
    attributionDays,
    minPayoutCents,
    payoutSchedule,
  });
  revalidatePath("/admin/sales", "layout");
  revalidatePath("/sales-team");
  return { ok: true, message: "Program settings saved." };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function createChallengeAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  const session = await assertAdmin();
  const title = str(fd, "title");
  const description = str(fd, "description");
  const metric = str(fd, "metric") === "revenue" ? "revenue" : "sales";
  if (title.length < 3 || title.length > 80) return { error: "Give the challenge a title (3–80 characters)." };
  if (description.length > 1000) return { error: "Keep the description under 1,000 characters." };
  let target: number | null;
  if (metric === "revenue") {
    target = dollarsToCents(str(fd, "target"));
  } else {
    const n = Number(str(fd, "target"));
    target = Number.isInteger(n) ? n : null;
  }
  if (target === null || target < 1 || target > 100_000_000) {
    return { error: metric === "revenue" ? "Enter the sales target in dollars." : "Enter the number of sales to reach (1 or more)." };
  }
  const bonusCents = dollarsToCents(str(fd, "bonus") || "0");
  if (bonusCents === null || bonusCents > 1_000_000) return { error: "Enter the bonus in dollars (up to $10,000), or 0 for bragging rights." };
  const start = str(fd, "startDate");
  const end = str(fd, "endDate");
  if (!DATE.test(start) || !DATE.test(end)) return { error: "Choose a start and an end date." };
  const tz = await getBusinessTimezone();
  const startsAt = DateTime.fromISO(start, { zone: tz }).startOf("day");
  const endsAt = DateTime.fromISO(end, { zone: tz }).plus({ days: 1 }).startOf("day");
  if (!startsAt.isValid || !endsAt.isValid) return { error: "Those dates aren't valid." };
  if (endsAt <= startsAt) return { error: "The end date must be on or after the start date." };
  if (endsAt.toJSDate() <= new Date()) return { error: "The end date has already passed." };
  if (endsAt.diff(startsAt, "days").days > 366) return { error: "Challenges can run for up to a year." };
  const db = await getDb();
  await db.insert(schema.agentChallenges).values({
    title,
    description,
    metric,
    target,
    bonusCents,
    startsAt: startsAt.toJSDate(),
    endsAt: endsAt.toJSDate(),
    createdBy: session.email,
  });
  revalidatePath("/admin/sales", "layout");
  return { ok: true, message: `“${title}” created. Agents see it on their dashboard.` };
}

export async function cancelChallengeAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  await assertAdmin();
  const id = Id.safeParse(str(fd, "challengeId"));
  if (!id.success) return { error: "Invalid request." };
  const cancelled = await cancelChallenge(id.data);
  revalidatePath("/admin/sales", "layout");
  if (!cancelled) return { error: "Only challenges that haven't been awarded yet can be cancelled." };
  return { ok: true, message: "Challenge cancelled." };
}

/* ------------------------------------------------------------------ */
/* Prospects (agents' business outreach)                               */
/* ------------------------------------------------------------------ */

/**
 * Ends an agent's claim on a business: frees it for other agents, or clears "do not contact" (only when the business
 * has asked to hear from us again). The row stays as history.
 */
export async function releaseProspectAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  const session = await assertAdmin();
  const id = Id.safeParse(str(fd, "prospectId"));
  if (!id.success) return { error: "That prospect couldn't be found." };
  const released = await adminReleaseProspect(id.data, `released by ${session.email}`);
  if (!released) return { error: "That prospect was already released." };
  revalidatePath("/admin/sales/prospects");
  return { ok: true, message: "Released. Any agent can add this business again." };
}

/** The business asked us (not the agent) not to be contacted: blocks it for the whole team. */
export async function markProspectDoNotContactAction(_prev: SalesFormState, fd: FormData): Promise<SalesFormState> {
  await assertAdmin();
  const id = Id.safeParse(str(fd, "prospectId"));
  if (!id.success) return { error: "That prospect couldn't be found." };
  if (!(await adminMarkDoNotContact(id.data))) return { error: "That prospect was already released." };
  revalidatePath("/admin/sales/prospects");
  return { ok: true, message: "Marked do not contact. No agent can contact this business now." };
}
