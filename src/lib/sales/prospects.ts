import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import type { AgentProspect, ProspectStatus, SalesAgent } from "@/db/schema";
import { areaKeyOf, matchKey } from "@/lib/sales/match-keys";
import { PLACE_ID_RE } from "@/lib/sales/places";
import { absoluteUrl, isValidEmail } from "@/lib/utils";

/**
 * Businesses a sales agent is reaching out to (Agent portal → Leads). Rules:
 * - One agent per business across the team. The same business is recognized by its Google place ID, its website, its
 *   email or phone, or (when either side was added by hand) its name in the same town (`sameBusiness`). Agents never see
 *   who holds a claim, only that someone does.
 * - A claim lasts while the agent works it: it runs out `CLAIM_DAYS` after their last activity, or `HOLD_DAYS` once
 *   they've closed it or someone signed up through its link (so nobody else cold-contacts it soon after). Then another
 *   agent can add the business, and the old row becomes history.
 * - "Do not contact" never runs out and blocks the business for everyone, matched by name alone, until an admin clears
 *   it. The agent can't change it or the details it's matched by.
 */

export const CLAIM_DAYS = 30;
export const HOLD_DAYS = 90;
/** Businesses in progress (new, contacted or replied, and still claimed) an agent can have at once. */
export const MAX_ACTIVE_PROSPECTS = 200;
/** The first message plus two follow-ups; after that no more reminders. */
export const MAX_CONTACTS = 3;
export const DEFAULT_FOLLOW_UP_DAYS = 3;
const DAY = 86_400_000;
/** The most prospects the Leads list shows (follow-ups first, then the most recently worked). */
export const LIST_LIMIT = 500;

export { areaKeyOf, matchKey };

export const PROSPECT_STATUSES: { value: ProspectStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "not_interested", label: "Closed" },
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

/** Hosts many businesses share (social, maps, booking and ordering sites, link pages), with any subdomain: a page there doesn't identify one business. */
const SHARED_HOSTS = [
  "facebook.com",
  "fb.com",
  "fb.me",
  "instagram.com",
  "threads.net",
  "linktr.ee",
  "linkin.bio",
  "beacons.ai",
  "google.com",
  "g.page",
  "goo.gl",
  "share.google",
  "bit.ly",
  "yelp.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "nextdoor.com",
  "wa.me",
  "whatsapp.com",
  "tripadvisor.com",
  "vagaro.com",
  "booksy.com",
  "styleseat.com",
  "schedulicity.com",
  "fresha.com",
  "glossgenius.com",
  "mindbodyonline.com",
  "calendly.com",
  "acuityscheduling.com",
  "squareup.com",
  "toasttab.com",
  "doordash.com",
  "ubereats.com",
  "grubhub.com",
  "opentable.com",
  "resy.com",
  "zocdoc.com",
  "healthgrades.com",
  "etsy.com",
  "amazon.com",
  "shopify.com",
];
/** Site builders whose bare domain is shared, but where each business gets its own subdomain (joes.square.site). */
const SHARED_EXACT = new Set(["square.site", "wixsite.com", "godaddysites.com", "weebly.com", "business.site"]);

/** The website's domain as a business identity (null for shared hosts like facebook.com). */
export function claimDomain(website: string | null | undefined): string | null {
  const domain = normalizeDomain(website);
  if (!domain || SHARED_EXACT.has(domain)) return null;
  return SHARED_HOSTS.some((h) => domain === h || domain.endsWith(`.${h}`)) ? null : domain;
}

/** The last 10 digits of a phone number, or null when it has fewer. */
function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

type BusinessKey = { placeId: string | null; domain: string | null; email: string | null; phone: string | null; nameKey: string; areaKey: string };

/** Whether an existing row is the business described by `key` (see the rules above). */
function sameBusiness(row: AgentProspect, key: BusinessKey): boolean {
  if (key.placeId && row.placeId === key.placeId) return true;
  if (key.domain && row.domain === key.domain) return true;
  if (key.email && row.email === key.email) return true;
  if (key.phone && phoneKey(row.phone) === key.phone) return true;
  if (key.nameKey.length < 2 || row.nameKey !== key.nameKey) return false;
  const sameTown = !row.areaKey || !key.areaKey || row.areaKey === key.areaKey;
  // Two Google listings with different place IDs are usually different businesses (branches of a chain). But listings
  // get duplicated and place IDs change, so a do-not-contact listing still blocks one of the same name in the same,
  // named town (an unknown town isn't enough here).
  if (row.placeId && key.placeId) return row.status === "do_not_contact" && Boolean(row.areaKey) && row.areaKey === key.areaKey;
  return row.status === "do_not_contact" || sameTown;
}

/** A row's own identity, to compare it with other rows. */
const keyOfRow = (r: AgentProspect): BusinessKey => ({
  placeId: r.placeId,
  domain: r.domain,
  email: r.email,
  phone: phoneKey(r.phone),
  nameKey: r.nameKey,
  areaKey: r.areaKey,
});

/** Rows that could be `key`'s business (sameBusiness narrows them down). */
function candidatesWhere(key: BusinessKey): SQL | undefined {
  const p = schema.agentProspects;
  const ors: SQL[] = [];
  if (key.placeId) ors.push(eq(p.placeId, key.placeId));
  if (key.domain) ors.push(eq(p.domain, key.domain));
  if (key.email) ors.push(eq(p.email, key.email));
  if (key.phone) ors.push(sql`right(regexp_replace(coalesce(${p.phone}, ''), '[^0-9]', '', 'g'), 10) = ${key.phone}`);
  if (key.nameKey.length >= 2) ors.push(eq(p.nameKey, key.nameKey));
  return ors.length ? and(isNull(p.releasedAt), or(...ors)) : undefined;
}

/** Whether `row`'s claim has run out, so another agent may take the business. */
export function claimExpired(row: Pick<AgentProspect, "status" | "contactId" | "activeAt">, now = Date.now()): boolean {
  if (row.status === "do_not_contact") return false;
  const days = row.contactId || row.status === "not_interested" ? HOLD_DAYS : CLAIM_DAYS;
  return now - row.activeAt.getTime() >= days * DAY;
}

/** A unique-index violation (Postgres 23505), also when the driver wraps it (drizzle puts the original in `cause`). */
function isUniqueViolation(err: unknown): boolean {
  for (let e = err as { code?: unknown; cause?: unknown } | null | undefined, depth = 0; e && depth < 4; e = e.cause as typeof e, depth++) {
    if (e.code === "23505") return true;
  }
  return false;
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

export type AddProspectResult =
  | { status: "added"; prospect: AgentProspect }
  | { status: "already_yours"; prospect: AgentProspect }
  | { status: "claimed" | "do_not_contact" | "limit" };

/** In-progress prospects (they count towards MAX_ACTIVE_PROSPECTS): new, contacted or replied, not signed up, still claimed. */
const inProgress = () => {
  const p = schema.agentProspects;
  return sql`${p.status} in ('new', 'contacted', 'replied') and ${p.contactId} is null and ${p.activeAt} > now() - make_interval(days => ${CLAIM_DAYS})`;
};

/** Adds a business to the agent's prospects, following the claim rules above. */
export async function addProspect(agent: Pick<SalesAgent, "id">, input: ProspectInput): Promise<AddProspectResult> {
  const db = await getDb();
  const p = schema.agentProspects;
  const website = normalizeWebsite(input.website);
  const key: BusinessKey = {
    placeId: input.placeId,
    domain: claimDomain(website),
    email: input.email?.toLowerCase() ?? null,
    phone: phoneKey(input.phone),
    nameKey: matchKey(input.name),
    areaKey: areaKeyOf(input.area),
  };
  try {
    return await db.transaction(async (tx) => {
      const where = candidatesWhere(key);
      const candidates = where ? await tx.select().from(p).where(where).for("update") : [];
      const same = candidates.filter((r) => sameBusiness(r, key));
      const mine = same.find((r) => r.agentId === agent.id);
      if (mine) return { status: "already_yours", prospect: mine } as const;
      if (same.some((r) => r.status === "do_not_contact")) return { status: "do_not_contact" } as const;
      if (same.some((r) => !claimExpired(r))) return { status: "claimed" } as const;
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(p)
        .where(and(eq(p.agentId, agent.id), isNull(p.releasedAt), inProgress()));
      if (count >= MAX_ACTIVE_PROSPECTS) return { status: "limit" } as const;
      if (same.length) {
        await tx
          .update(p)
          .set({ releasedAt: new Date(), releaseReason: "expired", updatedAt: new Date() })
          .where(inArray(p.id, same.map((r) => r.id)));
      }
      const [prospect] = await tx
        .insert(p)
        .values({
          agentId: agent.id,
          placeId: input.placeId,
          name: input.name,
          nameKey: key.nameKey,
          category: input.category,
          area: input.area,
          areaKey: key.areaKey,
          website,
          domain: key.domain,
          phone: input.phone,
          email: key.email,
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

/** For search results (searched in `where`): which businesses are already the agent's, someone else's, or blocked. */
export async function claimStatesForPlaces(agentId: string, places: { placeId: string; name: string }[], where: string): Promise<Map<string, PlaceClaimState>> {
  const states = new Map<string, PlaceClaimState>();
  if (!places.length) return states;
  const keys = places.map((pl) => ({
    placeId: pl.placeId,
    key: { placeId: pl.placeId, domain: null, email: null, phone: null, nameKey: matchKey(pl.name), areaKey: areaKeyOf(where) } satisfies BusinessKey,
  }));
  const nameKeys = [...new Set(keys.map((k) => k.key.nameKey).filter((k) => k.length >= 2))];
  const p = schema.agentProspects;
  const db = await getDb();
  const rows = await db
    .select()
    .from(p)
    .where(
      and(
        isNull(p.releasedAt),
        or(
          inArray(
            p.placeId,
            places.map((pl) => pl.placeId),
          ),
          nameKeys.length ? and(inArray(p.nameKey, nameKeys), or(isNull(p.placeId), eq(p.status, "do_not_contact"))) : undefined,
        ),
      ),
    );
  for (const { placeId, key } of keys) {
    const same = rows.filter((r) => sameBusiness(r, key));
    states.set(
      placeId,
      same.some((r) => r.agentId === agentId)
        ? "mine"
        : same.some((r) => r.status === "do_not_contact")
          ? "do_not_contact"
          : same.some((r) => !claimExpired(r))
            ? "claimed"
            : "available",
    );
  }
  return states;
}

/**
 * A prospect as its agent sees it. `signedUp`: someone signed up through its link. Who, and what they did next, stays
 * private (only people who tick the follow-up box appear to the agent, under Warm leads).
 */
export type ProspectRow = AgentProspect & { signedUp: boolean };

const toRow = (r: AgentProspect): ProspectRow => ({ ...r, signedUp: Boolean(r.contactId) });

/** The agent's prospects: due follow-ups first, then the most recently worked. */
export async function listProspects(agentId: string): Promise<ProspectRow[]> {
  const db = await getDb();
  const p = schema.agentProspects;
  const rows = await db
    .select()
    .from(p)
    .where(and(eq(p.agentId, agentId), isNull(p.releasedAt)))
    .orderBy(sql`${p.nextFollowUpAt} is null`, asc(p.nextFollowUpAt), desc(p.activeAt))
    .limit(LIST_LIMIT);
  return rows.map(toRow);
}

/** One of the agent's own active prospects. */
export async function getProspect(agentId: string, id: string): Promise<ProspectRow | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const db = await getDb();
  const p = schema.agentProspects;
  const [r] = await db
    .select()
    .from(p)
    .where(and(eq(p.id, id), eq(p.agentId, agentId), isNull(p.releasedAt)))
    .limit(1);
  return r ? toRow(r) : null;
}

/** For updates: a field the form didn't send stays undefined (unchanged); an empty one becomes null (cleared). */
const patchText = (max: number) =>
  text(max)
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null));

/** A real calendar date, yyyy-mm-dd. */
function isDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export const prospectUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "replied", "not_interested", "do_not_contact"]).optional(),
  notes: patchText(2000),
  /** yyyy-mm-dd, or "" to clear. */
  nextFollowUp: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (isDate(v) && v >= "2000-01-01" && v <= "2100-12-31"), "Please choose a date."),
  website: patchText(300).refine((v) => v == null || normalizeDomain(v) !== null, "Please enter a website like example.com."),
  phone: patchText(40),
  email: patchText(254).refine((v) => v == null || isValidEmail(v), "Please enter a valid email address."),
});
export type ProspectUpdate = z.infer<typeof prospectUpdateSchema>;

export type UpdateProspectResult = "ok" | "not_found" | "locked" | "taken" | "blocked" | "limit";

const IN_PROGRESS: ProspectStatus[] = ["new", "contacted", "replied"];

/** Whether the row counts towards MAX_ACTIVE_PROSPECTS now (in progress, not signed up, claim still fresh). */
function countsNow(row: AgentProspect, now = Date.now()): boolean {
  return IN_PROGRESS.includes(row.status) && !row.contactId && now - row.activeAt.getTime() < CLAIM_DAYS * DAY;
}

/** Whether saving `row` with `nextStatus` (renewing it) would put the agent over MAX_ACTIVE_PROSPECTS. */
async function overCap(agentId: string, row: AgentProspect, nextStatus: ProspectStatus): Promise<boolean> {
  if (countsNow(row) || !IN_PROGRESS.includes(nextStatus) || row.contactId) return false;
  const db = await getDb();
  const p = schema.agentProspects;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(p)
    .where(and(eq(p.agentId, agentId), isNull(p.releasedAt), inProgress()));
  return count >= MAX_ACTIVE_PROSPECTS;
}

/** A business just became do-not-contact: other agents' copies of it stop asking them to follow up. */
async function clearOtherFollowUps(blocked: AgentProspect): Promise<void> {
  const where = candidatesWhere(keyOfRow(blocked));
  if (!where) return;
  const db = await getDb();
  const p = schema.agentProspects;
  const ids = (await db.select().from(p).where(and(where, ne(p.id, blocked.id)))).filter((r) => sameBusiness(blocked, keyOfRow(r))).map((r) => r.id);
  if (ids.length) await db.update(p).set({ nextFollowUpAt: null }).where(inArray(p.id, ids));
}

/**
 * Whether another agent's row says this business asked not to be contacted (the rows can coexist: added by hand and from
 * Google in different towns, say). Checked before every message, mark-as-sent and tracked link.
 */
export async function blockedByDoNotContact(row: AgentProspect): Promise<boolean> {
  if (row.status === "do_not_contact") return true;
  const key = keyOfRow(row);
  const where = candidatesWhere(key);
  if (!where) return false;
  const db = await getDb();
  const p = schema.agentProspects;
  const rows = await db
    .select()
    .from(p)
    .where(and(where, ne(p.id, row.id), eq(p.status, "do_not_contact")));
  return rows.some((r) => sameBusiness(r, key));
}

/**
 * The agent updates their prospect from its Status and notes form. "Do not contact" is final for them: only their
 * notes still change (an admin can clear it). New contact details mustn't point at a business that's blocked or
 * another agent's. The first move from New to Contacted counts as one message. Any save renews the claim.
 */
export async function updateProspect(agentId: string, id: string, input: ProspectUpdate): Promise<UpdateProspectResult> {
  const current = await getProspect(agentId, id);
  if (!current) return "not_found";
  const p = schema.agentProspects;
  const now = new Date();
  const patch: Partial<typeof p.$inferInsert> = { activeAt: now, updatedAt: now };
  let countContact = false;
  if (current.status === "do_not_contact") {
    // Its contact details are what blocks the business for the team: they stay as they are.
    const changes = (input.status && input.status !== "do_not_contact") || input.nextFollowUp || [input.website, input.phone, input.email].some((v) => v !== undefined);
    if (changes) return "locked";
    if (input.notes !== undefined) patch.notes = input.notes;
  } else {
    if (await overCap(agentId, current, input.status ?? current.status)) return "limit";
    if (input.status) patch.status = input.status;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.nextFollowUp !== undefined) patch.nextFollowUpAt = input.nextFollowUp ? new Date(`${input.nextFollowUp}T14:00:00Z`) : null;
    if (input.status === "contacted" && current.status === "new" && current.contactCount === 0) {
      patch.lastContactedAt = now;
      countContact = true;
    }
    if (input.status === "not_interested" || input.status === "do_not_contact") patch.nextFollowUpAt = null;
    // Contact details are the agent's own notes, editable only on businesses they added by hand (Google details stay with
    // Google). Not with a move to Do not contact: nothing may stand in the way of recording an opt-out.
    if (!current.placeId && input.status !== "do_not_contact") {
      if (input.website !== undefined) {
        patch.website = normalizeWebsite(input.website);
        patch.domain = claimDomain(patch.website);
      }
      if (input.phone !== undefined) patch.phone = input.phone;
      if (input.email !== undefined) patch.email = input.email?.toLowerCase() ?? null;
      // Only what changed: does it identify a business that's blocked or another agent's?
      const key: BusinessKey = {
        placeId: null,
        domain: patch.domain && patch.domain !== current.domain ? patch.domain : null,
        email: patch.email && patch.email !== current.email ? patch.email : null,
        phone: patch.phone && phoneKey(patch.phone) !== phoneKey(current.phone) ? phoneKey(patch.phone) : null,
        nameKey: "",
        areaKey: "",
      };
      const where = candidatesWhere(key);
      if (where) {
        const db = await getDb();
        const others = (await db.select().from(p).where(and(where, ne(p.id, id)))).filter((r) => sameBusiness(r, key));
        if (others.some((r) => r.status === "do_not_contact")) return "blocked";
        if (others.some((r) => r.agentId !== agentId && !claimExpired(r))) return "taken";
        // Another agent's lapsed claim on that business ends here, as it would if this agent had added it now.
        const lapsed = others.filter((r) => r.agentId !== agentId).map((r) => r.id);
        if (lapsed.length) await db.update(p).set({ releasedAt: now, releaseReason: "expired", updatedAt: now }).where(inArray(p.id, lapsed));
      }
    }
  }
  const db = await getDb();
  try {
    const [updated] = await db
      .update(p)
      .set({ ...patch, ...(countContact ? { contactCount: sql`${p.contactCount} + 1` } : {}) })
      // Re-checks the status in the same statement: an admin may have marked it do not contact since it was read.
      .where(and(eq(p.id, id), eq(p.agentId, agentId), isNull(p.releasedAt), current.status === "do_not_contact" ? undefined : ne(p.status, "do_not_contact")))
      .returning({ id: p.id });
    if (!updated) return (await getProspect(agentId, id))?.status === "do_not_contact" ? "locked" : "not_found";
    if (input.status === "do_not_contact" && current.status !== "do_not_contact") await clearOtherFollowUps({ ...current, status: "do_not_contact" });
    return "ok";
  } catch (err) {
    // A website that another agent's active prospect already uses.
    if (isUniqueViolation(err)) return "taken";
    throw err;
  }
}

export type MarkContactedResult = { status: "ok"; count: number; followUpAt: Date | null } | { status: "not_found" | "locked" | "limit" };

/**
 * "I sent it": the agent reached out once more. Sets a follow-up reminder `DEFAULT_FOLLOW_UP_DAYS` out, up to
 * `MAX_CONTACTS` messages to a business that hasn't replied; after the last one there's no reminder. A business that
 * replied is a conversation, so its reminders carry on. A new or closed prospect becomes Contacted.
 */
export async function markProspectContacted(agentId: string, id: string): Promise<MarkContactedResult> {
  const current = await getProspect(agentId, id);
  if (!current) return { status: "not_found" };
  if (await blockedByDoNotContact(current)) return { status: "locked" };
  const nextStatus = current.status === "new" || current.status === "not_interested" ? "contacted" : current.status;
  if (await overCap(agentId, current, nextStatus)) return { status: "limit" };
  const p = schema.agentProspects;
  const now = new Date();
  const remind = current.status === "replied" || current.contactCount + 1 < MAX_CONTACTS;
  const followUpAt = remind ? new Date(now.getTime() + DEFAULT_FOLLOW_UP_DAYS * DAY) : null;
  const db = await getDb();
  const [updated] = await db
    .update(p)
    .set({
      status: nextStatus,
      lastContactedAt: now,
      contactCount: sql`${p.contactCount} + 1`,
      nextFollowUpAt: followUpAt,
      activeAt: now,
      updatedAt: now,
    })
    .where(and(eq(p.id, id), eq(p.agentId, agentId), isNull(p.releasedAt), ne(p.status, "do_not_contact")))
    .returning({ contactCount: p.contactCount });
  if (updated) return { status: "ok", count: updated.contactCount, followUpAt };
  return (await getProspect(agentId, id))?.status === "do_not_contact" ? { status: "locked" } : { status: "not_found" };
}

/** Before writing a message: whether the agent may (not blocked, and not over the cap by renewing a lapsed claim). */
export async function messageAllowed(agentId: string, row: AgentProspect): Promise<"ok" | "blocked" | "limit"> {
  if (await blockedByDoNotContact(row)) return "blocked";
  if (await overCap(agentId, row, row.status === "not_interested" ? "contacted" : row.status)) return "limit";
  return "ok";
}

/** Renews the claim (e.g. after writing a message), without changing anything the agent sees. */
export async function touchProspect(agentId: string, id: string): Promise<void> {
  const db = await getDb();
  const p = schema.agentProspects;
  await db
    .update(p)
    .set({ activeAt: new Date() })
    .where(and(eq(p.id, id), eq(p.agentId, agentId), isNull(p.releasedAt)));
}

/** The prospect's tracked link: opens the free AI Readiness Assessment and credits the agent (and this prospect). */
export function prospectLink(code: string, token: string): string {
  return absoluteUrl(`/r/${encodeURIComponent(code)}?to=${encodeURIComponent("/assessment")}&p=${encodeURIComponent(token)}`);
}

/** For /r/CODE?p=TOKEN: whether the token is this agent's active prospect that's still OK to contact. */
export async function prospectTokenValid(agentId: string, token: string): Promise<boolean> {
  if (!LINK_TOKEN_RE.test(token)) return false;
  const db = await getDb();
  const p = schema.agentProspects;
  const [row] = await db
    .select()
    .from(p)
    .where(and(eq(p.linkToken, token), eq(p.agentId, agentId), isNull(p.releasedAt)))
    .limit(1);
  return Boolean(row && !(await blockedByDoNotContact(row)));
}

/** A new contact who came through a prospect link: links them to that prospect (only the agent's own, only once). */
export async function attachContactToProspect(agentId: string, token: string, contactId: string): Promise<boolean> {
  if (!LINK_TOKEN_RE.test(token)) return false;
  const db = await getDb();
  const p = schema.agentProspects;
  const now = new Date();
  const [row] = await db
    .update(p)
    .set({ contactId, signedUpAt: now, activeAt: now, updatedAt: now })
    .where(and(eq(p.linkToken, token), eq(p.agentId, agentId), isNull(p.releasedAt), isNull(p.contactId), sql`${p.status} <> 'do_not_contact'`))
    .returning({ id: p.id });
  return Boolean(row);
}

// ---------------------------------------------------------------------------------------------------------- admin

export type AdminProspectRow = AgentProspect & { agentName: string; agentCode: string | null; expired: boolean };

/** Admin → Sales Team → Prospects: every active prospect (or one agent's), newest activity first. */
export async function adminListProspects(opts: { agentId?: string; status?: ProspectStatus; limit?: number } = {}): Promise<AdminProspectRow[]> {
  const db = await getDb();
  const p = schema.agentProspects;
  const where = [isNull(p.releasedAt)];
  if (opts.agentId) where.push(eq(p.agentId, opts.agentId));
  if (opts.status) where.push(eq(p.status, opts.status));
  const rows = await db
    .select({ p, agentName: schema.salesAgents.name, agentCode: schema.salesAgents.code })
    .from(p)
    .innerJoin(schema.salesAgents, eq(schema.salesAgents.id, p.agentId))
    .where(and(...where))
    .orderBy(desc(p.activeAt))
    .limit(opts.limit ?? 500);
  return rows.map((r) => ({ ...r.p, agentName: r.agentName, agentCode: r.agentCode, expired: claimExpired(r.p) }));
}

/** Admin: ends a claim (frees the business for other agents, or clears "do not contact"). The row stays as history. */
export async function adminReleaseProspect(id: string, reason: string): Promise<boolean> {
  if (!z.string().uuid().safeParse(id).success) return false;
  const db = await getDb();
  const p = schema.agentProspects;
  const now = new Date();
  const [row] = await db
    .update(p)
    .set({ releasedAt: now, releaseReason: reason.slice(0, 200), updatedAt: now })
    .where(and(eq(p.id, id), isNull(p.releasedAt)))
    .returning({ id: p.id });
  return Boolean(row);
}

/** Admin: the business asked us (not the agent) to stop. Blocks it for the whole team, like an agent's "Do not contact". */
export async function adminMarkDoNotContact(id: string): Promise<boolean> {
  if (!z.string().uuid().safeParse(id).success) return false;
  const db = await getDb();
  const p = schema.agentProspects;
  const now = new Date();
  const [row] = await db
    .update(p)
    .set({ status: "do_not_contact", nextFollowUpAt: null, activeAt: now, updatedAt: now })
    .where(and(eq(p.id, id), isNull(p.releasedAt)))
    .returning();
  if (row) await clearOtherFollowUps(row);
  return Boolean(row);
}

/** Active prospect counts per status for one agent (admin agent page). */
export async function prospectCounts(agentId: string): Promise<{ total: number; contacted: number; signedUp: number; doNotContact: number }> {
  const db = await getDb();
  const p = schema.agentProspects;
  const [r] = await db
    .select({
      total: sql<number>`count(*)::int`,
      contacted: sql<number>`count(*) filter (where ${p.lastContactedAt} is not null)::int`,
      signedUp: sql<number>`count(*) filter (where ${p.contactId} is not null)::int`,
      doNotContact: sql<number>`count(*) filter (where ${p.status} = 'do_not_contact')::int`,
    })
    .from(p)
    .where(and(eq(p.agentId, agentId), isNull(p.releasedAt)));
  return { total: r?.total ?? 0, contacted: r?.contacted ?? 0, signedUp: r?.signedUp ?? 0, doNotContact: r?.doNotContact ?? 0 };
}
