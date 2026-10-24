import "server-only";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, schema } from "@/db";
import type { SalesAgent } from "@/db/schema";
import { firstName } from "@/lib/utils";
import { normalizeAgentCode, sameMailbox } from "@/lib/sales/game";
import { getSalesProgram } from "@/lib/sales/program";
import { attachContactToProspect, LINK_TOKEN_RE } from "@/lib/sales/prospects";

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
/** Set by /r/CODE?p=TOKEN: the agent's prospect (business) the visitor came from (lib/sales/prospects.ts). */
export const PROSPECT_COOKIE = "pa_prospect";
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

/** The agent with this referral code who is on the team (approved, or paused), or null. */
export async function agentByCode(code: string | null | undefined): Promise<SalesAgent | null> {
  const clean = normalizeAgentCode(code);
  if (!clean) return null;
  const db = await getDb();
  const [agent] = await db
    .select()
    .from(schema.salesAgents)
    .where(and(eq(schema.salesAgents.code, clean), inArray(schema.salesAgents.status, ["approved", "paused"])))
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
      // Consent to follow up was given to the previous agent only.
      .set({ agentId: agent.id, source: "link", createdAt: at, followUpConsentAt: null })
      .where(and(eq(schema.agentReferrals.contactId, contactId), eq(schema.agentReferrals.agentId, existing.agentId)))
      .returning();
    if (moved) await noteClaim(contactId, agent, at);
    return Boolean(moved);
  }
  const [created] = await db
    .insert(schema.agentReferrals)
    // The app's clock, like orders.paid_at: a claim counts for purchases paid after it (recordAgentSale).
    .values({ contactId, agentId: agent.id, source: "link", createdAt: at })
    .onConflictDoNothing({ target: schema.agentReferrals.contactId })
    .returning();
  if (created) await noteClaim(contactId, agent, at);
  return Boolean(created);
}

/** A line on the contact's timeline, so admins can see when and how a customer became an agent's. */
async function noteClaim(contactId: string, agent: Pick<SalesAgent, "id" | "email">, at: Date): Promise<void> {
  try {
    const db = await getDb();
    const [row] = await db.select({ name: schema.salesAgents.name, code: schema.salesAgents.code }).from(schema.salesAgents).where(eq(schema.salesAgents.id, agent.id)).limit(1);
    await db.insert(schema.activities).values({
      contactId,
      type: "note",
      title: `Became a customer of sales agent ${row?.name ?? "?"}${row?.code ? ` (${row.code})` : ""} through their link`,
      meta: { agentId: agent.id, referral: true },
      createdAt: at,
    });
  } catch (err) {
    console.error("[sales] claim note failed", contactId, err);
  }
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

/** The approved agent whose link this visitor followed (first name for the follow-up consent checkbox), or null. */
export async function referringAgent(): Promise<{ code: string; firstName: string } | null> {
  try {
    const agent = await approvedAgentByCode(await referralCodeFromCookie());
    return agent?.code ? { code: agent.code, firstName: firstName(agent.name) || "your sales agent" } : null;
  } catch (err) {
    console.error("[sales] referring agent lookup failed", err);
    return null;
  }
}

/** From a lead form: the agent code of a ticked follow-up consent box (components/marketing/agent-follow-up-consent.tsx), or null. */
export function followUpConsentFrom(formData: FormData): string | null {
  if (formData.get("agentFollowUp") !== "on") return null;
  return normalizeAgentCode(String(formData.get("agentFollowUpCode") ?? ""));
}

async function prospectTokenFromCookie(): Promise<string | null> {
  try {
    const token = (await cookies()).get(PROSPECT_COOKIE)?.value ?? "";
    return LINK_TOKEN_RE.test(token) ? token : null;
  } catch {
    return null;
  }
}

/**
 * A contact created just now by a visitor who came through an agent's link becomes that agent's customer. Only new
 * contacts: anyone can type any address into a public form, so a form never moves a contact that already exists
 * (an existing customer is credited to an agent only by a checkout that came through the agent's link: orders.agent_code).
 * When the claim succeeds:
 * - `followUpConsentCode`: the form's "OK for <agent> to follow up with me" box was ticked for this agent's code, so
 *   the agent may see the contact's name and email (Leads → Warm leads). Only for the agent the box named.
 * - A prospect link (/r/CODE?p=TOKEN) of the same agent gets this contact as its sign-up.
 * Never throws: attribution must not break a sign-up.
 */
export async function claimNewContactFromCookie(contactId: string, opts: { followUpConsentCode?: string | null } = {}): Promise<boolean> {
  try {
    const agent = await approvedAgentByCode(await referralCodeFromCookie());
    if (!agent) return false;
    if (!(await claimContactFor(contactId, agent))) return false;
    if (agent.code && normalizeAgentCode(opts.followUpConsentCode) === agent.code) {
      const db = await getDb();
      await db
        .update(schema.agentReferrals)
        .set({ followUpConsentAt: new Date() })
        .where(and(eq(schema.agentReferrals.contactId, contactId), eq(schema.agentReferrals.agentId, agent.id)));
    }
    const token = await prospectTokenFromCookie();
    if (token) await attachContactToProspect(agent.id, token, contactId);
    return true;
  } catch (err) {
    console.error("[sales] referral claim failed", contactId, err);
    return false;
  }
}

/**
 * Withdraws a contact's OK for their agent to follow up (they unsubscribed, or asked us). For good: subscribing again
 * doesn't show them to the agent again; only ticking the box on a new sign-up would, and that only happens for new contacts.
 */
export async function clearFollowUpConsent(contactId: string): Promise<void> {
  const db = await getDb();
  await db.update(schema.agentReferrals).set({ followUpConsentAt: null }).where(eq(schema.agentReferrals.contactId, contactId));
}

/** What a warm lead agreed to share: their name, email and which free resource they signed up for. */
export type WarmLead = {
  contactId: string;
  name: string | null;
  email: string;
  source: string | null;
  consentedAt: Date;
};

/**
 * The agent's warm leads: their customers who said it's OK for them to follow up. Someone who unsubscribed, or who
 * now belongs to another agent, drops off the list.
 */
export async function listWarmLeads(agentId: string): Promise<WarmLead[]> {
  const db = await getDb();
  const rows = await db
    .select({
      contactId: schema.contacts.id,
      name: schema.contacts.name,
      email: schema.contacts.email,
      source: schema.contacts.source,
      consentedAt: schema.agentReferrals.followUpConsentAt,
    })
    .from(schema.agentReferrals)
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.agentReferrals.contactId))
    .where(
      and(
        eq(schema.agentReferrals.agentId, agentId),
        isNotNull(schema.agentReferrals.followUpConsentAt),
        eq(schema.contacts.unsubscribed, false),
      ),
    )
    .orderBy(desc(schema.agentReferrals.followUpConsentAt))
    .limit(200);
  return rows.map((r) => ({ ...r, consentedAt: r.consentedAt as Date }));
}

/**
 * Admin: assigns a customer to an agent for good (until an admin changes it), or with null removes the assignment.
 * Choosing the agent they already belong to changes nothing, unless `permanent` turns their link claim (which runs
 * out) into an assignment.
 */
export async function assignContactToAgent(contactId: string, agentId: string | null, opts: { permanent?: boolean } = {}): Promise<void> {
  const db = await getDb();
  if (!agentId) {
    await db.delete(schema.agentReferrals).where(eq(schema.agentReferrals.contactId, contactId));
    return;
  }
  const [existing] = await db
    .select({ agentId: schema.agentReferrals.agentId, source: schema.agentReferrals.source })
    .from(schema.agentReferrals)
    .where(eq(schema.agentReferrals.contactId, contactId))
    .limit(1);
  if (existing?.agentId === agentId) {
    // Same agent: only `permanent` changes anything, and it keeps the claim's date (purchases since then stay theirs).
    if (opts.permanent && existing.source === "link") {
      await db.update(schema.agentReferrals).set({ source: "manual" }).where(and(eq(schema.agentReferrals.contactId, contactId), eq(schema.agentReferrals.agentId, agentId)));
    }
    return;
  }
  await db
    .insert(schema.agentReferrals)
    .values({ contactId, agentId, source: "manual", createdAt: new Date() })
    .onConflictDoUpdate({ target: schema.agentReferrals.contactId, set: { agentId, source: "manual", createdAt: new Date(), followUpConsentAt: null } });
}
