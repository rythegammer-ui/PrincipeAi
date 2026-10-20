import "server-only";
import { and, asc, count, eq, gt, gte, inArray, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { SequenceTrigger } from "@/db/schema";
import { seedSequences, sequenceCopyUpgrades } from "@/db/seed-content/sequences";
import { buyLinkPattern, defaultTemplateVars, emailBusinessName, escapeMarkdown, fillTemplate, sendEmail, type TemplateVars } from "@/lib/email";
import { firstName } from "@/lib/utils";

const HOUR = 3_600_000;

/**
 * Template variables for one recipient: plain text for the subject, and the body's visitor- and owner-typed values
 * (name, email, business name) Markdown-escaped so they can't add links or formatting. Shared with the automation
 * editor's preview and test send so they match what is really emailed.
 */
export function recipientTemplateVars(
  person: { name: string | null; email: string },
  businessName: string,
): { subject: TemplateVars; body: TemplateVars } {
  const fullName = (person.name ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const subject: TemplateVars = {
    ...defaultTemplateVars(businessName),
    firstName: firstName(person.name, person.email),
    name: fullName,
    email: person.email,
    // {{buy_link:<course-slug>}}: checkout with the recipient's email already filled in.
    "buy_link:*": buyLinkPattern(person.email),
  };
  const body: TemplateVars = { ...subject, name: escapeMarkdown(fullName), email: escapeMarkdown(person.email), businessName: escapeMarkdown(businessName) };
  return { subject, body };
}

/** Settings row listing the copy upgrades already applied, so each runs once and an owner's later edit is never undone. */
export const COPY_UPGRADES_KEY = "seedCopyUpgradesApplied";

/**
 * Brings default email copy seeded before a feature existed up to date (e.g. course buy links): see
 * `sequenceCopyUpgrades` in seed-content/sequences.ts. Each upgrade runs once, only on steps nobody has edited since
 * they were seeded (so an owner's wording is never touched), where the old paragraph is still a whole paragraph, and
 * only once the courses it pitches are for sale (until then it waits). Runs at the start of the scheduled automations
 * job, i.e. on code that can render the new copy, before any of it is sent; never from a preview deployment, which
 * shares the production database while production may still run code that can't. Returns how many steps changed.
 */
export async function upgradeSequenceCopy(): Promise<number> {
  if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") return 0;
  const db = await getDb();
  const [row] = await db.select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, COPY_UPGRADES_KEY)).limit(1);
  const applied = new Set(Array.isArray(row?.value) ? (row.value as unknown[]).filter((v): v is string => typeof v === "string") : []);
  const pending = sequenceCopyUpgrades.filter((u) => !applied.has(u.id));
  if (pending.length === 0) return 0;
  let changed = 0;
  for (const u of pending) {
    const forSale = await db
      .select({ slug: schema.courses.slug })
      .from(schema.courses)
      .where(and(inArray(schema.courses.slug, u.requires), eq(schema.courses.published, true), gt(schema.courses.priceCents, 0)));
    if (forSale.length < u.requires.length) continue;
    const steps = await db
      .select({ id: schema.sequenceSteps.id, body: schema.sequenceSteps.body, createdAt: schema.sequenceSteps.createdAt, updatedAt: schema.sequenceSteps.updatedAt })
      .from(schema.sequenceSteps)
      .innerJoin(schema.emailSequences, eq(schema.emailSequences.id, schema.sequenceSteps.sequenceId))
      .where(and(eq(schema.emailSequences.name, u.sequence), eq(schema.sequenceSteps.subject, u.subject)));
    // The step exactly as the version before this upgrade seeded it (reordering emails bumps updated_at without an edit).
    const seeded = seedSequences.find((q) => q.name === u.sequence)?.steps.find((st) => st.subject === u.subject)?.body.replace(u.to, u.from);
    for (const step of steps) {
      const untouched = step.updatedAt.getTime() - step.createdAt.getTime() < 1000 || step.body === seeded;
      const at = step.body.indexOf(u.from);
      const wholeParagraph = at >= 0 && (at === 0 || step.body[at - 1] === "\n") && /^(\n|$)/.test(step.body.slice(at + u.from.length));
      if (!untouched || !wholeParagraph || step.body.includes(u.to)) continue;
      // Only if nobody saved the step in the meantime.
      const updated = await db
        .update(schema.sequenceSteps)
        .set({ body: step.body.slice(0, at) + u.to + step.body.slice(at + u.from.length) })
        .where(and(eq(schema.sequenceSteps.id, step.id), eq(schema.sequenceSteps.body, step.body)))
        .returning({ id: schema.sequenceSteps.id });
      changed += updated.length;
    }
    applied.add(u.id);
  }
  if (applied.size === 0 || pending.every((u) => !applied.has(u.id))) return changed;
  const value = [...applied];
  await db
    .insert(schema.settings)
    .values({ key: COPY_UPGRADES_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
  return changed;
}

/**
 * Triggers that fire on every occurrence (each message, booking or purchase), so a finished or
 * stopped enrollment is restarted. One-time funnels (guide, quiz, manual) enroll a contact once.
 */
const RETRIGGERABLE = new Set<SequenceTrigger>(["contact_form", "call_booked", "purchase"]);

/** Failed sends of one step before the enrollment is stopped (retries back off 1h, 2h, 4h…). */
const MAX_SEND_ATTEMPTS = 4;

/**
 * Enrolls a contact in every active email sequence with the given trigger.
 * Steps with delayHours = 0 are sent immediately.
 */
export async function triggerAutomations(trigger: SequenceTrigger, contactId: string): Promise<void> {
  try {
    const db = await getDb();
    const sequences = await db
      .select()
      .from(schema.emailSequences)
      .where(and(eq(schema.emailSequences.trigger, trigger), eq(schema.emailSequences.active, true)));
    for (const seq of sequences) {
      const [first] = await db
        .select()
        .from(schema.sequenceSteps)
        .where(eq(schema.sequenceSteps.sequenceId, seq.id))
        .orderBy(asc(schema.sequenceSteps.position))
        .limit(1);
      if (!first) continue;
      const nextRunAt = new Date(Date.now() + first.delayHours * HOUR);
      const insert = db
        .insert(schema.sequenceEnrollments)
        .values({ sequenceId: seq.id, contactId, nextStep: 0, nextRunAt, status: "active" });
      const [enrollment] = await (RETRIGGERABLE.has(trigger)
        ? // Restart a completed/stopped enrollment, but never interrupt one that is still running.
          insert.onConflictDoUpdate({
            target: [schema.sequenceEnrollments.sequenceId, schema.sequenceEnrollments.contactId],
            set: { status: "active", nextStep: 0, nextRunAt, updatedAt: new Date() },
            setWhere: sql`${schema.sequenceEnrollments.status} <> 'active'`,
          })
        : insert.onConflictDoNothing()
      ).returning();
      if (enrollment && first.delayHours === 0) {
        await processEnrollment(enrollment.id);
      }
    }
  } catch (err) {
    console.error(`[automations] trigger ${trigger} failed`, err);
  }
}

/** Stops all active sequences for a contact (e.g. after they purchase or unsubscribe). */
export async function stopAutomations(contactId: string, trigger?: SequenceTrigger): Promise<void> {
  const db = await getDb();
  if (trigger) {
    await db.execute(sql`
      update sequence_enrollments set status = 'stopped', updated_at = now()
      where contact_id = ${contactId} and status = 'active'
        and sequence_id in (select id from email_sequences where trigger = ${trigger})`);
  } else {
    await db
      .update(schema.sequenceEnrollments)
      .set({ status: "stopped" })
      .where(and(eq(schema.sequenceEnrollments.contactId, contactId), eq(schema.sequenceEnrollments.status, "active")));
  }
}

/**
 * Sends the next step of one enrollment if it is due. Claims the row first
 * (pushes next_run_at forward) so concurrent runners never double-send.
 */
export async function processEnrollment(
  enrollmentId: string,
): Promise<"sent" | "completed" | "skipped" | "failed" | "not_due"> {
  const db = await getDb();
  const [claimed] = await db
    .update(schema.sequenceEnrollments)
    .set({ nextRunAt: new Date(Date.now() + 15 * 60_000) })
    .where(
      and(
        eq(schema.sequenceEnrollments.id, enrollmentId),
        eq(schema.sequenceEnrollments.status, "active"),
        lte(schema.sequenceEnrollments.nextRunAt, new Date()),
      ),
    )
    .returning();
  if (!claimed) return "not_due";

  const steps = await db
    .select()
    .from(schema.sequenceSteps)
    .where(eq(schema.sequenceSteps.sequenceId, claimed.sequenceId))
    .orderBy(asc(schema.sequenceSteps.position));
  const step = steps[claimed.nextStep];
  const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, claimed.contactId)).limit(1);
  const [sequence] = await db.select().from(schema.emailSequences).where(eq(schema.emailSequences.id, claimed.sequenceId)).limit(1);

  if (!step || !contact || !sequence?.active || contact.unsubscribed) {
    await db
      .update(schema.sequenceEnrollments)
      .set({ status: contact?.unsubscribed || !sequence?.active ? "stopped" : "completed", nextRunAt: null })
      .where(eq(schema.sequenceEnrollments.id, claimed.id));
    return step ? "skipped" : "completed";
  }

  // Visitor-supplied fields: plain text for the subject, Markdown-escaped for the body.
  const { subject: subjectVars, body: bodyVars } = recipientTemplateVars(contact, await emailBusinessName());
  const subject = fillTemplate(step.subject, subjectVars).replace(/\s+/g, " ").trim();
  const result = await sendEmail({
    to: contact.email,
    subject,
    markdown: fillTemplate(step.body, bodyVars),
    kind: "sequence",
    contactId: contact.id,
    unsubscribeToken: contact.unsubscribeToken,
    unsubscribed: contact.unsubscribed,
  });

  if (result.status === "skipped") {
    // Unsubscribed between the check above and the send.
    await db
      .update(schema.sequenceEnrollments)
      .set({ status: "stopped", nextRunAt: null })
      .where(eq(schema.sequenceEnrollments.id, claimed.id));
    return "skipped";
  }
  if (result.status === "failed") {
    // Don't advance: retry this step later with backoff, and give up on a persistently bad address.
    const [{ attempts }] = await db
      .select({ attempts: count() })
      .from(schema.emailLog)
      .where(
        and(
          eq(schema.emailLog.contactId, contact.id),
          eq(schema.emailLog.subject, subject),
          eq(schema.emailLog.kind, "sequence"),
          eq(schema.emailLog.status, "failed"),
          gte(schema.emailLog.createdAt, new Date(Date.now() - 14 * 24 * HOUR)),
        ),
      );
    await db
      .update(schema.sequenceEnrollments)
      .set(
        attempts >= MAX_SEND_ATTEMPTS
          ? { status: "stopped", nextRunAt: null }
          : { nextRunAt: new Date(Date.now() + HOUR * 2 ** Math.max(0, attempts - 1)) },
      )
      .where(eq(schema.sequenceEnrollments.id, claimed.id));
    return "failed";
  }

  await db.insert(schema.activities).values({
    contactId: contact.id,
    type: "email_sent",
    title: `Email sent: ${subject}`,
    meta: { sequenceId: sequence.id, sequence: sequence.name, step: claimed.nextStep },
  });

  const next = steps[claimed.nextStep + 1];
  await db
    .update(schema.sequenceEnrollments)
    .set(
      next
        ? { nextStep: claimed.nextStep + 1, nextRunAt: new Date(Date.now() + next.delayHours * HOUR) }
        : { nextStep: claimed.nextStep + 1, status: "completed", nextRunAt: null },
    )
    .where(eq(schema.sequenceEnrollments.id, claimed.id));
  return "sent";
}

/** Processes every due enrollment (called by the cron route). */
export async function processDueEnrollments(limit = 200): Promise<{ processed: number; sent: number }> {
  const db = await getDb();
  const due = await db
    .select({ id: schema.sequenceEnrollments.id })
    .from(schema.sequenceEnrollments)
    .where(and(eq(schema.sequenceEnrollments.status, "active"), lte(schema.sequenceEnrollments.nextRunAt, new Date())))
    .limit(limit);
  let sent = 0;
  for (const { id } of due) {
    try {
      if ((await processEnrollment(id)) === "sent") sent++;
    } catch (err) {
      console.error("[automations] enrollment failed", id, err);
    }
  }
  return { processed: due.length, sent };
}
