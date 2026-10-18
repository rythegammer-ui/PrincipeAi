import "server-only";
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { SequenceTrigger } from "@/db/schema";
import { defaultTemplateVars, fillTemplate, sendEmail } from "@/lib/email";
import { firstName } from "@/lib/utils";

const HOUR = 3_600_000;

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
      const [enrollment] = await db
        .insert(schema.sequenceEnrollments)
        .values({
          sequenceId: seq.id,
          contactId,
          nextStep: 0,
          nextRunAt: new Date(Date.now() + first.delayHours * HOUR),
          status: "active",
        })
        .onConflictDoNothing()
        .returning();
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
export async function processEnrollment(enrollmentId: string): Promise<"sent" | "completed" | "skipped" | "not_due"> {
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

  const vars = { ...defaultTemplateVars(), firstName: firstName(contact.name, contact.email), name: contact.name ?? "", email: contact.email };
  await sendEmail({
    to: contact.email,
    subject: fillTemplate(step.subject, vars),
    markdown: fillTemplate(step.body, vars),
    kind: "sequence",
    contactId: contact.id,
    unsubscribeToken: contact.unsubscribeToken,
    unsubscribed: contact.unsubscribed,
  });
  await db.insert(schema.activities).values({
    contactId: contact.id,
    type: "email_sent",
    title: `Email sent: ${fillTemplate(step.subject, vars)}`,
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
