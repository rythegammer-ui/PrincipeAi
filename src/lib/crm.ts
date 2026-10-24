import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { ActivityType, Contact, SequenceTrigger, Stage } from "@/db/schema";
import { STAGES } from "@/db/schema";
import { SCORE_RULES } from "@/components/admin/crm-utils";
import { stopAutomations, triggerAutomations } from "@/lib/automations";
import { notifyOwner } from "@/lib/email";
import { claimNewContactFromCookie, clearFollowUpConsent } from "@/lib/sales/referrals";
import { getSettings } from "@/lib/settings";
import { getVisitorContext, linkVisitorToContact, trackEvent, type FunnelEventName, type VisitorContext } from "@/lib/tracking";
import { absoluteUrl, normalizeEmail } from "@/lib/utils";

/** Pipeline order used for automatic forward-only stage advancement ("lost" is outside the order). */
const STAGE_RANK: Record<Stage, number> = {
  new: 0,
  engaged: 1,
  qualified: 2,
  call_booked: 3,
  proposal: 4,
  customer: 5,
  lost: -1,
};

export function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

export async function logActivity(
  contactId: string,
  type: ActivityType,
  title: string,
  opts: { body?: string | null; meta?: Record<string, unknown> } = {},
): Promise<void> {
  const db = await getDb();
  await db.insert(schema.activities).values({ contactId, type, title, body: opts.body ?? null, meta: opts.meta ?? {} });
  await db.update(schema.contacts).set({ lastActivityAt: new Date() }).where(eq(schema.contacts.id, contactId));
}

/** Moves a contact forward in the pipeline (never backwards; a "lost" contact re-enters at `stage`). */
export async function advanceStage(contactId: string, stage: Stage): Promise<void> {
  const db = await getDb();
  const [c] = await db.select({ stage: schema.contacts.stage }).from(schema.contacts).where(eq(schema.contacts.id, contactId)).limit(1);
  if (!c) return;
  if (c.stage === "lost" || STAGE_RANK[stage] > STAGE_RANK[c.stage]) {
    await db.update(schema.contacts).set({ stage }).where(eq(schema.contacts.id, contactId));
    await logActivity(contactId, "stage_changed", `Stage → ${stage.replace("_", " ")}`, { meta: { from: c.stage, to: stage, auto: true } });
  }
}

/** Manually set a stage (admin). Logs the change. */
export async function setStage(contactId: string, stage: Stage): Promise<void> {
  const db = await getDb();
  const [c] = await db.select({ stage: schema.contacts.stage }).from(schema.contacts).where(eq(schema.contacts.id, contactId)).limit(1);
  if (!c || c.stage === stage) return;
  await db.update(schema.contacts).set({ stage }).where(eq(schema.contacts.id, contactId));
  await logActivity(contactId, "stage_changed", `Stage → ${stage.replace("_", " ")}`, { meta: { from: c.stage, to: stage } });
}

export async function addTags(contactId: string, tags: string[]): Promise<void> {
  const clean = [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  if (!clean.length) return;
  const db = await getDb();
  const [c] = await db.select({ tags: schema.contacts.tags }).from(schema.contacts).where(eq(schema.contacts.id, contactId)).limit(1);
  if (!c) return;
  const merged = [...new Set([...(c.tags ?? []), ...clean])];
  await db.update(schema.contacts).set({ tags: merged }).where(eq(schema.contacts.id, contactId));
}

/**
 * Recomputes the 0–100 lead score from profile completeness + engagement history.
 * Quiz activities may carry meta.scoreBoost (0–20) for buying-intent signals (budget, timeline).
 */
export async function recomputeScore(contactId: string): Promise<number> {
  const db = await getDb();
  const [c] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, contactId)).limit(1);
  if (!c) return 0;
  const acts = await db
    .select({ type: schema.activities.type, meta: schema.activities.meta })
    .from(schema.activities)
    .where(eq(schema.activities.contactId, contactId));
  let score = 0;
  if (c.name) score += 3;
  if (c.phone) score += 5;
  if (c.company) score += 5;
  const totals: Partial<Record<ActivityType, number>> = {};
  let boost = 0;
  for (const a of acts) {
    const rule = SCORE_RULES[a.type];
    if (rule) totals[a.type] = Math.min(rule.max, (totals[a.type] ?? 0) + rule.points);
    const b = Number((a.meta as Record<string, unknown>)?.scoreBoost ?? 0);
    if (a.type === "quiz_completed" && Number.isFinite(b)) boost = Math.max(boost, Math.min(20, b));
  }
  score += Object.values(totals).reduce((s, n) => s + (n ?? 0), 0) + boost;
  if (c.unsubscribed) score -= 10;
  score = Math.max(0, Math.min(100, score));
  await db.update(schema.contacts).set({ score }).where(eq(schema.contacts.id, contactId));
  return score;
}

export async function createTask(input: {
  title: string;
  contactId?: string | null;
  description?: string | null;
  dueAt?: Date | null;
  priority?: "low" | "normal" | "high";
  origin?: string;
}): Promise<void> {
  const db = await getDb();
  await db.insert(schema.tasks).values({
    title: input.title,
    contactId: input.contactId ?? null,
    description: input.description ?? null,
    dueAt: input.dueAt ?? null,
    priority: input.priority ?? "normal",
    origin: input.origin ?? "manual",
  });
}

export type UpsertContactInput = {
  email: string;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  segment?: string | null;
  source: string;
  tags?: string[];
  visitor?: VisitorContext | null;
};

/**
 * Finds or creates a contact by email. Fills in missing profile fields but never overwrites
 * existing ones, and keeps first-touch attribution (source, UTM, referrer, landing page).
 */
export async function upsertContact(input: UpsertContactInput): Promise<{ contact: Contact; created: boolean }> {
  const db = await getDb();
  const email = normalizeEmail(input.email);
  const v = input.visitor;
  const [inserted] = await db
    .insert(schema.contacts)
    .values({
      email,
      name: input.name?.trim() || null,
      phone: input.phone?.trim() || null,
      company: input.company?.trim() || null,
      website: input.website?.trim() || null,
      segment: input.segment ?? null,
      source: input.source,
      utm: v?.utm ?? {},
      referrer: v?.referrer ?? null,
      landingPage: v?.landingPage ?? null,
      visitorId: v?.visitorId ?? null,
    })
    .onConflictDoNothing({ target: schema.contacts.email })
    .returning();
  let contact: Contact;
  let created = false;
  if (inserted) {
    contact = inserted;
    created = true;
    await logActivity(contact.id, "created", `Contact created via ${input.source.replace(/_/g, " ")}`, {
      meta: { source: input.source, utm: v?.utm ?? {}, referrer: v?.referrer, landingPage: v?.landingPage },
    });
  } else {
    const [existing] = await db.select().from(schema.contacts).where(eq(schema.contacts.email, email)).limit(1);
    const patch: Partial<typeof schema.contacts.$inferInsert> = {};
    if (!existing.name && input.name?.trim()) patch.name = input.name.trim();
    if (!existing.phone && input.phone?.trim()) patch.phone = input.phone.trim();
    if (!existing.company && input.company?.trim()) patch.company = input.company.trim();
    if (!existing.website && input.website?.trim()) patch.website = input.website.trim();
    if (input.segment && existing.segment !== input.segment) patch.segment = existing.segment && existing.segment !== input.segment ? "both" : input.segment;
    if (!existing.visitorId && v?.visitorId) patch.visitorId = v.visitorId;
    if (Object.keys(patch).length) {
      [contact] = await db.update(schema.contacts).set(patch).where(eq(schema.contacts.id, existing.id)).returning();
    } else {
      contact = existing;
    }
  }
  if (input.tags?.length) await addTags(contact.id, input.tags);
  if (v?.visitorId) await linkVisitorToContact(v.visitorId, contact.id);
  return { contact, created };
}

export type CaptureLeadInput = Omit<UpsertContactInput, "visitor"> & {
  /** False when the visitor's referral cookie must not claim a new contact (payment-link orders carry their own code). */
  claimReferral?: boolean;
  /** The agent code shown in a ticked "OK for <agent> to follow up with me" box (lib/sales/referrals.ts). */
  agentFollowUpConsent?: string | null;
  /** Timeline entry describing what the lead just did. */
  activity: { type: ActivityType; title: string; body?: string | null; meta?: Record<string, unknown> };
  /** Funnel event to record (e.g. "optin"). */
  event?: { name: FunnelEventName; path?: string; props?: Record<string, unknown> };
  /** Advance the pipeline to at least this stage. */
  stage?: Stage;
  /** Enroll in email automations with this trigger. */
  automation?: SequenceTrigger;
  /** Owner notification (respecting settings). */
  notify?: { subject: string; markdown: string; kind: "lead" | "booking" | "purchase" };
};

/**
 * The single entry point for every funnel conversion (opt-in, quiz, booking, chat lead,
 * contact form, purchase). Upserts the contact, logs the activity + funnel event,
 * advances the stage, re-scores, enrolls automations, and notifies the owner.
 */
export async function captureLead(input: CaptureLeadInput): Promise<{ contact: Contact; created: boolean }> {
  const visitor = await getVisitorContext().catch(() => null);
  const { contact, created } = await upsertContact({ ...input, visitor });
  // A new contact who came through a sales agent's link becomes that agent's customer (lib/sales/referrals.ts).
  if (created && input.claimReferral !== false) await claimNewContactFromCookie(contact.id, { followUpConsentCode: input.agentFollowUpConsent });
  await logActivity(contact.id, input.activity.type, input.activity.title, { body: input.activity.body, meta: input.activity.meta });
  if (input.event) {
    await trackEvent({ name: input.event.name, path: input.event.path, props: input.event.props, contactId: contact.id, visitorId: visitor?.visitorId });
  }
  await advanceStage(contact.id, input.stage ?? "new");
  await recomputeScore(contact.id);
  if (input.automation) await triggerAutomations(input.automation, contact.id);
  if (input.notify) {
    try {
      const s = await getSettings();
      const enabled =
        (input.notify.kind === "lead" && s.notifyOnLead) ||
        (input.notify.kind === "booking" && s.notifyOnBooking) ||
        (input.notify.kind === "purchase" && s.notifyOnPurchase);
      if (enabled) {
        await notifyOwner(
          input.notify.subject,
          `${input.notify.markdown}\n\n[Open contact in CRM](${absoluteUrl(`/admin/contacts/${contact.id}`)})`,
          // Replying from the inbox answers the lead (their address is validated and normalized by upsertContact).
          { replyTo: contact.email },
        );
      }
    } catch (err) {
      console.error("[crm] owner notification failed", err);
    }
  }
  const db = await getDb();
  const [fresh] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, contact.id)).limit(1);
  return { contact: fresh ?? contact, created };
}

/** Adds a paid order's amount to the contact's lifetime value. */
export async function addLifetimeValue(contactId: string, cents: number): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.contacts)
    .set({ lifetimeValueCents: sql`${schema.contacts.lifetimeValueCents} + ${cents}` })
    .where(eq(schema.contacts.id, contactId));
}

/** Looks up the contact for a visitor cookie, if they've identified themselves before. */
export async function contactForVisitor(visitorId: string | null): Promise<Contact | null> {
  if (!visitorId) return null;
  const db = await getDb();
  const [c] = await db.select().from(schema.contacts).where(eq(schema.contacts.visitorId, visitorId)).limit(1);
  return c ?? null;
}

/** Format of `contacts.unsubscribe_token` links (validate before querying). */
export const UNSUBSCRIBE_TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * Sets the marketing-email subscription of the contact behind an unsubscribe token. On a change it
 * stops running automations (when unsubscribing), logs a timeline note and re-scores.
 * Returns null for an unknown token.
 */
export async function setMarketingSubscription(
  token: string,
  subscribed: boolean,
  via: "unsubscribe_link" | "one_click",
): Promise<{ contactId: string; changed: boolean } | null> {
  if (!UNSUBSCRIBE_TOKEN_RE.test(token)) return null;
  const db = await getDb();
  const c = schema.contacts;
  const [contact] = await db.select({ id: c.id, unsubscribed: c.unsubscribed }).from(c).where(eq(c.unsubscribeToken, token)).limit(1);
  if (!contact) return null;
  const unsubscribe = !subscribed;
  if (contact.unsubscribed === unsubscribe) return { contactId: contact.id, changed: false };
  await db.update(c).set({ unsubscribed: unsubscribe }).where(eq(c.id, contact.id));
  if (unsubscribe) {
    await stopAutomations(contact.id);
    // Unsubscribing also withdraws any OK for a sales agent to follow up (lib/sales/referrals.ts).
    await clearFollowUpConsent(contact.id);
  }
  await logActivity(contact.id, "note", unsubscribe ? "Unsubscribed from marketing emails" : "Resubscribed to marketing emails", {
    meta: { via, unsubscribed: unsubscribe },
  });
  await recomputeScore(contact.id);
  return { contactId: contact.id, changed: true };
}
