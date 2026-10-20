import "server-only";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, schema } from "@/db";
import type { SalesAgent } from "@/db/schema";
import { normalizeAgentCode } from "@/lib/sales/game";
import { getSalesProgram } from "@/lib/sales/program";
import { normalizeEmail } from "@/lib/utils";

/**
 * Which agent a customer belongs to. An agent's link (?ref=CODE on any page, or /r/CODE) leaves a cookie (src/proxy.ts);
 * the first time that visitor becomes a contact (opt-in, assessment, checkout…) or buys, the contact is claimed for the
 * agent. The first agent keeps the customer for the program's attribution window, counted from that claim; after that
 * another agent's link can claim them. A customer an admin assigned stays with that agent until an admin changes it.
 * Payment-link checkouts carry the code in Stripe's client_reference_id (see /buy/[slug]).
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

/**
 * Claims a contact for the agent with this code, unless another agent's claim still holds (or the contact is the agent
 * themself). Returns whether the contact now belongs to that agent. Never throws: attribution must not break a checkout.
 */
export async function claimContactForAgent(contactId: string, code: string | null | undefined): Promise<boolean> {
  try {
    const agent = await approvedAgentByCode(code);
    if (!agent) return false;
    const db = await getDb();
    const [contact] = await db.select({ email: schema.contacts.email }).from(schema.contacts).where(eq(schema.contacts.id, contactId)).limit(1);
    if (!contact || normalizeEmail(contact.email) === agent.email) return false;
    const [existing] = await db.select().from(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contactId)).limit(1);
    if (existing?.agentId === agent.id) return true;
    if (existing) {
      const { attributionDays } = await getSalesProgram();
      const [holder] = await db.select({ status: schema.salesAgents.status }).from(schema.salesAgents).where(eq(schema.salesAgents.id, existing.agentId)).limit(1);
      // Another agent's customer: theirs while the claim holds (an admin's assignment always does) and they're on the team.
      if (holder?.status === "approved" && (existing.source === "manual" || claimActive(existing.createdAt, attributionDays))) return false;
      const [moved] = await db
        .update(schema.agentReferrals)
        .set({ agentId: agent.id, source: "link", createdAt: new Date() })
        .where(and(eq(schema.agentReferrals.contactId, contactId), eq(schema.agentReferrals.agentId, existing.agentId)))
        .returning();
      return Boolean(moved);
    }
    const [created] = await db
      .insert(schema.agentReferrals)
      // The app's clock, like orders.paid_at: a claim counts for purchases paid after it (recordAgentSale).
      .values({ contactId, agentId: agent.id, source: "link", createdAt: new Date() })
      .onConflictDoNothing({ target: schema.agentReferrals.contactId })
      .returning();
    return Boolean(created);
  } catch (err) {
    console.error("[sales] referral claim failed", contactId, err);
    return false;
  }
}

/** Claims the contact for the agent in this visitor's referral cookie, if there is one. */
export async function claimContactFromCookie(contactId: string): Promise<boolean> {
  const code = await referralCodeFromCookie();
  return code ? claimContactForAgent(contactId, code) : false;
}

/** Admin: assigns a customer to an agent (or, with null, removes the assignment). */
export async function assignContactToAgent(contactId: string, agentId: string | null): Promise<void> {
  const db = await getDb();
  if (!agentId) {
    await db.delete(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contactId));
    return;
  }
  await db
    .insert(schema.agentReferrals)
    .values({ contactId, agentId, source: "manual", createdAt: new Date() })
    .onConflictDoUpdate({ target: schema.agentReferrals.contactId, set: { agentId, source: "manual", createdAt: new Date() } });
}
