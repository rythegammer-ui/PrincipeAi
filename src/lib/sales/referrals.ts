import "server-only";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, schema } from "@/db";
import type { SalesAgent } from "@/db/schema";
import { normalizeAgentCode, sameMailbox } from "@/lib/sales/game";
import { getSalesProgram } from "@/lib/sales/program";

/**
 * Which agent a customer belongs to. An agent's link (?ref=CODE on any page, or /r/CODE) leaves a cookie (src/proxy.ts).
 * A visitor with that cookie who becomes a new contact (opt-in, assessment, checkout…) is claimed for the agent, and a
 * checkout started with it carries the code on the order (orders.agent_code; payment-link checkouts get it from Stripe's
 * client_reference_id, set by /buy/[slug]), which claims the buyer when it's paid. The first agent keeps the customer
 * for the program's attribution window, counted from the claim; after that another agent's link can claim them. A
 * customer an admin assigned stays with that agent until an admin changes it.
 */

/** Set by src/proxy.ts from ?ref=CODE, and by /r/CODE. */
export const AGENT_COOKIE = "pa_agent";
export const AGENT_REF_PARAM = "ref";
/** Stripe client_reference_id prefix for payment-link checkouts started from an agent's link. */
export const CLIENT_REFERENCE_PREFIX = "agent_";

/** The referral code in this visitor's cookie, if any (not checked against the agents). */
export async function referralCodeFromCookie(): Promise<string | null> {
  try {
    return normalizeAgentCode((await cookies()).get(AGENT_COOKIE)?.value);
  } catch {
    // Outside a request (scripts, tests without a request scope).
    return null;
  }
}

/** The approved agent with this referral code, or null. */
export async function approvedAgentByCode(code: string | null | undefined): Promise<SalesAgent | null> {
  const clean = normalizeAgentCode(code);
  if (!clean) return null;
  const db = await getDb();
  const [agent] = await db
    .select()
    .from(schema.salesAgents)
    .where(and(eq(schema.salesAgents.code, clean), eq(schema.salesAgents.status, "approved")))
    .limit(1);
  return agent ?? null;
}

/** True while a claim made at `claimedAt` still holds. */
export function claimActive(claimedAt: Date, attributionDays: number, now = Date.now()): boolean {
  return now - claimedAt.getTime() < attributionDays * 86_400_000;
}

/** Whether an existing claim keeps the customer with its agent: an admin's assignment always does, a link claim for the window. */
async function claimHolds(existing: typeof schema.agentReferrals.$inferSelect, at: Date): Promise<boolean> {
  const db = await getDb();
  const [holder] = await db.select({ status: schema.salesAgents.status }).from(schema.salesAgents).where(eq(schema.salesAgents.id, existing.agentId)).limit(1);
  if (existing.source === "manual") return holder?.status === "approved" || holder?.status === "paused";
  if (holder?.status !== "approved") return false;
  const { attributionDays } = await getSalesProgram();
  return claimActive(existing.createdAt, attributionDays, at.getTime());
}

/**
 * Makes the contact this agent's customer (a link claim dated `at`), unless another agent's claim still holds or the
 * contact is the agent themself. Renews the agent's own lapsed link claim. Returns whether the contact is now theirs.
 */
export async function claimContactFor(contactId: string, agent: Pick<SalesAgent, "id" | "email">, at = new Date()): Promise<boolean> {
  const db = await getDb();
  const [contact] = await db.select({ email: schema.contacts.email }).from(schema.contacts).where(eq(schema.contacts.id, contactId)).limit(1);
  if (!contact || sameMailbox(contact.email, agent.email)) return false;
  const [existing] = await db.select().from(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contactId)).limit(1);
  if (existing?.agentId === agent.id) {
    if (existing.source === "link" && !(await claimHolds(existing, at))) {
      await db.update(schema.agentReferrals).set({ createdAt: at }).where(and(eq(schema.agentReferrals.contactId, contactId), eq(schema.agentReferrals.agentId, agent.id)));
    }
    return true;
  }
  if (existing) {
    if (await claimHolds(existing, at)) return false;
    const [moved] = await db
      .update(schema.agentReferrals)
      .set({ agentId: agent.id, source: "link", createdAt: at })
      .where(and(eq(schema.agentReferrals.contactId, contactId), eq(schema.agentReferrals.agentId, existing.agentId)))
      .returning();
    return Boolean(moved);
  }
  const [created] = await db
    .insert(schema.agentReferrals)
    // The app's clock, like orders.paid_at: a claim counts for purchases paid after it (recordAgentSale).
    .values({ contactId, agentId: agent.id, source: "link", createdAt: at })
    .onConflictDoNothing({ target: schema.agentReferrals.contactId })
    .returning();
  return Boolean(created);
}

/**
 * Claims a contact for the approved agent with this code (see claimContactFor). Never throws: attribution must not
 * break a sign-up or a checkout.
 */
export async function claimContactForAgent(contactId: string, code: string | null | undefined): Promise<boolean> {
  try {
    const agent = await approvedAgentByCode(code);
    return agent ? await claimContactFor(contactId, agent) : false;
  } catch (err) {
    console.error("[sales] referral claim failed", contactId, err);
    return false;
  }
}

/**
 * A contact created just now by a visitor who came through an agent's link becomes that agent's customer. Only new
 * contacts: anyone can type any address into a public form, so a form never moves a contact that already exists
 * (an existing customer is credited to an agent only by a checkout that came through the agent's link: orders.agent_code).
 */
export async function claimNewContactFromCookie(contactId: string): Promise<boolean> {
  const code = await referralCodeFromCookie();
  return code ? claimContactForAgent(contactId, code) : false;
}

/**
 * Admin: assigns a customer to an agent for good (until an admin changes it), or with null removes the assignment.
 * Choosing the agent they already belong to changes nothing.
 */
export async function assignContactToAgent(contactId: string, agentId: string | null): Promise<void> {
  const db = await getDb();
  if (!agentId) {
    await db.delete(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contactId));
    return;
  }
  const [existing] = await db.select({ agentId: schema.agentReferrals.agentId }).from(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contactId)).limit(1);
  if (existing?.agentId === agentId) return;
  await db
    .insert(schema.agentReferrals)
    .values({ contactId, agentId, source: "manual", createdAt: new Date() })
    .onConflictDoUpdate({ target: schema.agentReferrals.contactId, set: { agentId, source: "manual", createdAt: new Date() } });
}
