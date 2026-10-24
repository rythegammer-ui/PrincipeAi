import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import type { AgentProspect, ProspectStatus, SalesAgent } from "@/db/schema";
import { PLACE_ID_RE } from "@/lib/sales/places";
import { absoluteUrl, isValidEmail } from "@/lib/utils";

/**
 * Businesses a sales agent is reaching out to (Agent portal → Leads). Rules:
 * - One active owner per business across the team, matched by Google place ID, or by website for businesses added by
 *   hand. Agents never see who holds a claim, only that someone does.
 * - A claim lasts while the agent works it: it runs out `CLAIM_DAYS` after their last activity (`NOT_INTERESTED_DAYS`
 *   once the business said no). Then another agent can add the business, and the old row becomes history.
 * - "Do not contact" never runs out and blocks the business for everyone, until an admin clears it.
 * - A business that signed up through the agent's prospect link stays theirs.
 */

export const CLAIM_DAYS = 30;
export const NOT_INTERESTED_DAYS = 90;
export const MAX_ACTIVE_PROSPECTS = 200;
export const DEFAULT_FOLLOW_UP_DAYS = 3;
const DAY = 86_400_000;

export const PROSPECT_STATUSES: { value: ProspectStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "not_interested", label: "Not interested" },
  { value: "do_not_contact", label: "Do not contact" },
];

/** Prospect link tokens: 12 URL-safe characters. */
export const LINK_TOKEN_RE = /^[A-Za-z0-9_-]{12}$/;
const newLinkToken = () => randomBytes(9).toString("base64url");

/** "https://www.Example.com/about" → "example.com"; null when it isn't a usable web address. */
export function normalizeDomain(website: string | null | undefined): string | null {
  const raw = website?.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
  } catch {
    return null;
  }
}

/** A typed-in website as a full https URL (or null). */
export function normalizeWebsite(website: string | null | undefined): string | null {
  const raw = website?.trim();
  if (!raw || !normalizeDomain(raw)) return null;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).toString();
  } catch {
    return null;
  }
}

/** Whether `row`'s claim has run out, so another agent may take the business. */
export function claimExpired(row: Pick<AgentProspect, "status" | "contactId" | "activeAt">, now = Date.now()): boolean {
  if (row.status === "do_not_contact" || row.contactId) return false;
  const days = row.status === "not_interested" ? NOT_INTERESTED_DAYS : CLAIM_DAYS;
  return now - row.activeAt.getTime() >= days * DAY;
}

const text = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);
const optionalText = (max: number) =>
  text(max)
    .optional()
    .transform((v) => v || null);

export const prospectInputSchema = z.object({
  placeId: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || PLACE_ID_RE.test(v), "That search result is no longer valid. Please search again."),
  name: text(200).min(2, "Please enter the business name."),
  category: optionalText(100),
  area: optionalText(120),
  website: optionalText(300).refine((v) => v === null || normalizeDomain(v) !== null, "Please enter a website like example.com."),
  phone: optionalText(40),
  email: optionalText(254).refine((v) => v === null || isValidEmail(v), "Please enter a valid email address."),
  notes: optionalText(2000),
});
export type ProspectInput = z.infer<typeof prospectInputSchema>;

/** A unique-index violation (Postgres 23505), also when the driver wraps it (drizzle puts the original in `cause`). */
function isUniqueViolation(err: unknown): boolean {
  for (let e = err as { code?: unknown; cause?: unknown } | null | undefined, depth = 0; e && depth < 4; e = e.cause as typeof e, depth++) {
    if (e.code === "23505") return true;
  }
  return false;
}

export type AddProspectResult =
  | { status: "added"; prospect: AgentProspect }
  | { status: "already_yours"; prospect: AgentProspect }
  | { status: "claimed" | "do_not_contact" | "limit" };

/** Adds a business to the agent's prospects, following the claim rules above. */
export async function addProspect(agent: Pick<SalesAgent, "id">, input: ProspectInput): Promise<AddProspectResult> {
  const db = await getDb();
  const website = normalizeWebsite(input.website);
  const domain = normalizeDomain(website);
  try {
    return await db.transaction(async (tx) => {
      const matches = [];
      if (input.placeId) matches.push(eq(schema.agentProspects.placeId, input.placeId));
      if (domain) matches.push(eq(schema.agentProspects.domain, domain));
      if (matches.length) {
        const existing = await tx
          .select()
          .from(schema.agentProspects)
          .where(and(isNull(schema.agentProspects.releasedAt), matches.length === 1 ? matches[0] : sql`(${sql.join(matches, sql` or `)})`))
          .for("update");
        const mine = existing.find((r) => r.agentId === agent.id);
        if (mine) return { status: "already_yours", prospect: mine } as const;
        if (existing.some((r) => r.status === "do_not_contact")) return { status: "do_not_contact" } as const;
        if (existing.some((r) => !claimExpired(r))) return { status: "claimed" } as const;
        if (existing.length) {
          await tx
            .update(schema.agentProspects)
            .set({ releasedAt: new Date(), releaseReason: "expired", updatedAt: new Date() })
            .where(inArray(schema.agentProspects.id, existing.map((r) => r.id)));
        }
      }
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.agentProspects)
        .where(and(eq(schema.agentProspects.agentId, agent.id), isNull(schema.agentProspects.releasedAt)));
      if (count >= MAX_ACTIVE_PROSPECTS) return { status: "limit" } as const;
      const [prospect] = await tx
        .insert(schema.agentProspects)
        .values({
          agentId: agent.id,
          placeId: input.placeId,
          name: input.name,
          category: input.category,
          area: input.area,
          website,
          domain,
          phone: input.phone,
          email: input.email?.toLowerCase() ?? null,
          notes: input.notes,
          linkToken: newLinkToken(),
        })
        .returning();
      return { status: "added", prospect } as const;
    });
  } catch (err) {
    // Two agents adding the same business at once: the unique index lets only one through.
    if (isUniqueViolation(err)) return { status: "claimed" };
    throw err;
  }
}

export type PlaceClaimState = "mine" | "claimed" | "do_not_contact" | "available";

/** For search results: which businesses are already the agent's, someone else's, or blocked. */
export async function claimStatesForPlaces(agentId: string, placeIds: string[]): Promise<Map<string, PlaceClaimState>> {
  const states = new Map<string, PlaceClaimState>();
  if (!placeIds.length) return states;
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.agentProspects)
    .where(and(isNull(schema.agentProspects.releasedAt), inArray(schema.agentProspects.placeId, placeIds)));
  for (const r of rows) {
    if (!r.placeId) continue;
    const state: PlaceClaimState =
      r.agentId === agentId ? "mine" : r.status === "do_not_contact" ? "do_not_contact" : claimExpired(r) ? "available" : "claimed";
    // A business can't hold two active rows (unique index), but stay safe: "mine" and "do not contact" win.
    const prev = states.get(r.placeId);
    if (!prev || prev === "available" || state === "mine" || state === "do_not_contact") states.set(r.placeId, state);
  }
  return states;
}

export type ProspectRow = AgentProspect & {
  /** From the contact who signed up through this prospect's link. */
  signedUp: boolean;
  tookAssessment: boolean;
  customer: boolean;
};

const contactFlags = {
  tookAssessment: sql<boolean>`exists (select 1 from ${schema.quizSubmissions} q where q.contact_id = ${schema.agentProspects.contactId})`,
  customer: sql<boolean>`coalesce(${schema.contacts.stage} = 'customer', false)`,
};

function toRow(r: AgentProspect, flags: { tookAssessment: boolean; customer: boolean }): ProspectRow {
  return { ...r, signedUp: Boolean(r.contactId), tookAssessment: Boolean(flags.tookAssessment), customer: Boolean(flags.customer) };
}

/** The agent's active prospects: due follow-ups first, then the most recently worked. */
export async function listProspects(agentId: string): Promise<ProspectRow[]> {
  const db = await getDb();
  const rows = await db
    .select({ p: schema.agentProspects, ...contactFlags })
    .from(schema.agentProspects)
    .leftJoin(schema.contacts, eq(schema.contacts.id, schema.agentProspects.contactId))
    .where(and(eq(schema.agentProspects.agentId, agentId), isNull(schema.agentProspects.releasedAt)))
    .orderBy(sql`${schema.agentProspects.nextFollowUpAt} is null`, asc(schema.agentProspects.nextFollowUpAt), desc(schema.agentProspects.activeAt))
    .limit(MAX_ACTIVE_PROSPECTS);
  return rows.map((r) => toRow(r.p, r));
}

/** One of the agent's own active prospects. */
export async function getProspect(agentId: string, id: string): Promise<ProspectRow | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const db = await getDb();
  const [r] = await db
    .select({ p: schema.agentProspects, ...contactFlags })
    .from(schema.agentProspects)
    .leftJoin(schema.contacts, eq(schema.contacts.id, schema.agentProspects.contactId))
    .where(and(eq(schema.agentProspects.id, id), eq(schema.agentProspects.agentId, agentId), isNull(schema.agentProspects.releasedAt)))
    .limit(1);
  return r ? toRow(r.p, r) : null;
}

/** For updates: a field the form didn't send stays undefined (unchanged); an empty one becomes null (cleared). */
const patchText = (max: number) =>
  text(max)
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null));

export const prospectUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "replied", "not_interested", "do_not_contact"]).optional(),
  notes: patchText(2000),
  /** yyyy-mm-dd, or "" to clear. */
  nextFollowUp: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Please choose a date."),
  website: patchText(300).refine((v) => v == null || normalizeDomain(v) !== null, "Please enter a website like example.com."),
  phone: patchText(40),
  email: patchText(254).refine((v) => v == null || isValidEmail(v), "Please enter a valid email address."),
});
export type ProspectUpdate = z.infer<typeof prospectUpdateSchema>;

export type UpdateProspectResult = "ok" | "not_found" | "locked" | "taken";

/**
 * The agent updates their prospect. "Do not contact" is final for them (an admin can clear it). Marking it contacted
 * sets a follow-up `DEFAULT_FOLLOW_UP_DAYS` out unless they chose a date. Any change renews the claim.
 */
export async function updateProspect(agentId: string, id: string, input: ProspectUpdate): Promise<UpdateProspectResult> {
  const current = await getProspect(agentId, id);
  if (!current) return "not_found";
  if (current.status === "do_not_contact" && input.status && input.status !== "do_not_contact") return "locked";
  const now = new Date();
  const patch: Partial<typeof schema.agentProspects.$inferInsert> = { activeAt: now, updatedAt: now };
  if (input.status) patch.status = input.status;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.nextFollowUp !== undefined) patch.nextFollowUpAt = input.nextFollowUp ? new Date(`${input.nextFollowUp}T14:00:00Z`) : null;
  if (input.status === "contacted") {
    patch.lastContactedAt = now;
    if (!input.nextFollowUp) patch.nextFollowUpAt = new Date(now.getTime() + DEFAULT_FOLLOW_UP_DAYS * DAY);
  }
  if (input.status === "not_interested" || input.status === "do_not_contact") patch.nextFollowUpAt = null;
  // Contact details are the agent's own notes, editable only on businesses they added by hand (Google details stay with Google).
  if (!current.placeId) {
    if (input.website !== undefined) {
      patch.website = normalizeWebsite(input.website);
      patch.domain = normalizeDomain(patch.website);
    }
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.email !== undefined) patch.email = input.email?.toLowerCase() ?? null;
  }
  const db = await getDb();
  try {
    const [updated] = await db
      .update(schema.agentProspects)
      .set(patch)
      .where(and(eq(schema.agentProspects.id, id), eq(schema.agentProspects.agentId, agentId), isNull(schema.agentProspects.releasedAt)))
      .returning({ id: schema.agentProspects.id });
    return updated ? "ok" : "not_found";
  } catch (err) {
    // A website that another agent's active prospect already uses.
    if (isUniqueViolation(err)) return "taken";
    throw err;
  }
}

/** Renews the claim (e.g. after writing a message), without changing anything the agent sees. */
export async function touchProspect(agentId: string, id: string): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.agentProspects)
    .set({ activeAt: new Date() })
    .where(and(eq(schema.agentProspects.id, id), eq(schema.agentProspects.agentId, agentId), isNull(schema.agentProspects.releasedAt)));
}

/** The prospect's tracked link: opens the free AI Readiness Assessment and credits the agent (and this prospect). */
export function prospectLink(code: string, token: string): string {
  return absoluteUrl(`/r/${encodeURIComponent(code)}?to=${encodeURIComponent("/assessment")}&p=${encodeURIComponent(token)}`);
}

/** For /r/CODE?p=TOKEN: whether the token is this agent's active prospect that's still OK to contact. */
export async function prospectTokenValid(agentId: string, token: string): Promise<boolean> {
  if (!LINK_TOKEN_RE.test(token)) return false;
  const db = await getDb();
  const [row] = await db
    .select({ status: schema.agentProspects.status })
    .from(schema.agentProspects)
    .where(and(eq(schema.agentProspects.linkToken, token), eq(schema.agentProspects.agentId, agentId), isNull(schema.agentProspects.releasedAt)))
    .limit(1);
  return Boolean(row && row.status !== "do_not_contact");
}

/** A new contact who came through a prospect link: links them to that prospect (only the agent's own, only once). */
export async function attachContactToProspect(agentId: string, token: string, contactId: string): Promise<boolean> {
  if (!LINK_TOKEN_RE.test(token)) return false;
  const db = await getDb();
  const now = new Date();
  const [row] = await db
    .update(schema.agentProspects)
    .set({ contactId, signedUpAt: now, activeAt: now, updatedAt: now })
    .where(
      and(
        eq(schema.agentProspects.linkToken, token),
        eq(schema.agentProspects.agentId, agentId),
        isNull(schema.agentProspects.releasedAt),
        isNull(schema.agentProspects.contactId),
        sql`${schema.agentProspects.status} <> 'do_not_contact'`,
      ),
    )
    .returning({ id: schema.agentProspects.id });
  return Boolean(row);
}

// ---------------------------------------------------------------------------------------------------------- admin

export type AdminProspectRow = AgentProspect & { agentName: string; agentCode: string | null; expired: boolean };

/** Admin → Sales Team → Prospects: every active prospect (or one agent's), newest activity first. */
export async function adminListProspects(opts: { agentId?: string; status?: ProspectStatus; limit?: number } = {}): Promise<AdminProspectRow[]> {
  const db = await getDb();
  const where = [isNull(schema.agentProspects.releasedAt)];
  if (opts.agentId) where.push(eq(schema.agentProspects.agentId, opts.agentId));
  if (opts.status) where.push(eq(schema.agentProspects.status, opts.status));
  const rows = await db
    .select({ p: schema.agentProspects, agentName: schema.salesAgents.name, agentCode: schema.salesAgents.code })
    .from(schema.agentProspects)
    .innerJoin(schema.salesAgents, eq(schema.salesAgents.id, schema.agentProspects.agentId))
    .where(and(...where))
    .orderBy(desc(schema.agentProspects.activeAt))
    .limit(opts.limit ?? 500);
  return rows.map((r) => ({ ...r.p, agentName: r.agentName, agentCode: r.agentCode, expired: claimExpired(r.p) }));
}

/** Admin: ends a claim (frees the business for other agents, or clears "do not contact"). The row stays as history. */
export async function adminReleaseProspect(id: string, reason: string): Promise<boolean> {
  if (!z.string().uuid().safeParse(id).success) return false;
  const db = await getDb();
  const now = new Date();
  const [row] = await db
    .update(schema.agentProspects)
    .set({ releasedAt: now, releaseReason: reason.slice(0, 200), updatedAt: now })
    .where(and(eq(schema.agentProspects.id, id), isNull(schema.agentProspects.releasedAt)))
    .returning({ id: schema.agentProspects.id });
  return Boolean(row);
}

/** Active prospect counts per status for one agent (admin agent page). */
export async function prospectCounts(agentId: string): Promise<{ total: number; contacted: number; signedUp: number; doNotContact: number }> {
  const db = await getDb();
  const [r] = await db
    .select({
      total: sql<number>`count(*)::int`,
      contacted: sql<number>`count(*) filter (where ${schema.agentProspects.lastContactedAt} is not null)::int`,
      signedUp: sql<number>`count(*) filter (where ${schema.agentProspects.contactId} is not null)::int`,
      doNotContact: sql<number>`count(*) filter (where ${schema.agentProspects.status} = 'do_not_contact')::int`,
    })
    .from(schema.agentProspects)
    .where(and(eq(schema.agentProspects.agentId, agentId), isNull(schema.agentProspects.releasedAt)));
  return { total: r?.total ?? 0, contacted: r?.contacted ?? 0, signedUp: r?.signedUp ?? 0, doNotContact: r?.doNotContact ?? 0 };
}

/** Prospects whose follow-up date has come (dashboard nudge). */
export async function dueFollowUps(agentId: string, now = new Date()): Promise<number> {
  const db = await getDb();
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.agentProspects)
    .where(
      and(
        eq(schema.agentProspects.agentId, agentId),
        isNull(schema.agentProspects.releasedAt),
        isNotNull(schema.agentProspects.nextFollowUpAt),
        sql`${schema.agentProspects.nextFollowUpAt} <= ${now}`,
        inArray(schema.agentProspects.status, ["new", "contacted", "replied"]),
      ),
    );
  return r?.n ?? 0;
}
