import "server-only";
import { and, asc, count, eq, gte, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { SequenceTrigger } from "@/db/schema";
import { defaultTemplateVars, escapeMarkdown, fillTemplate, sendEmail, type TemplateVars } from "@/lib/email";
import { firstName } from "@/lib/utils";

const HOUR = 3_600_000;

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
  const fullName = (contact.name ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const subjectVars: TemplateVars = {
    ...defaultTemplateVars(),
    firstName: firstName(contact.name, contact.email),
    name: fullName,
    email: contact.email,
  };
  const bodyVars: TemplateVars = { ...subjectVars, name: escapeMarkdown(fullName), email: escapeMarkdown(contact.email) };
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
