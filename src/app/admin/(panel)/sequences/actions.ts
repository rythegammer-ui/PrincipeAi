"use server";

import { and, asc, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  BODY_MAX,
  DELAY_MAX_HOURS,
  SAMPLE_PERSON,
  SUBJECT_MAX,
  TRIGGERS,
  TRIGGER_META,
  describeStepTiming,
  fallbackStepDraft,
  formatDelay,
  parseStepDraft,
  type StepDraft,
} from "@/components/funnels/automation-utils";
import { getDb, schema } from "@/db";
import { site } from "@/config/site";
import { aiText } from "@/lib/ai";
import { assertAdmin } from "@/lib/auth";
import { processEnrollment, recipientTemplateVars } from "@/lib/automations";
import { logActivity, upsertContact } from "@/lib/crm";
import { emailBusinessName, emailLayout, emailMailingAddress, fillTemplate, markdownToEmailHtml, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, isValidEmail, normalizeEmail } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

export type FormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string | undefined>;
  /** Submitted values, echoed back so fields keep their input after a validation error. */
  values?: Record<string, string>;
};

export type StepData = { id: string; position: number; delayHours: number; subject: string; body: string };
export type StepsResult = { ok: true; steps: StepData[] } | { ok: false; error: string; fieldErrors?: Record<string, string> };
export type ActionResult = { ok: true } | { ok: false; error: string };

const Id = z.uuid();
const seqT = schema.emailSequences;
const stepT = schema.sequenceSteps;
const enrT = schema.sequenceEnrollments;

const HOUR = 3_600_000;

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}

function revalidateSequences(id?: string) {
  revalidatePath("/admin/sequences");
  if (id) revalidatePath(`/admin/sequences/${id}`);
}

async function orderedSteps(sequenceId: string): Promise<StepData[]> {
  const db = await getDb();
  return db
    .select({ id: stepT.id, position: stepT.position, delayHours: stepT.delayHours, subject: stepT.subject, body: stepT.body })
    .from(stepT)
    .where(eq(stepT.sequenceId, sequenceId))
    .orderBy(asc(stepT.position), asc(stepT.createdAt));
}

/** Rewrites positions as 0…n-1 in the given order. */
async function renumber(sequenceId: string, ids: string[]) {
  const db = await getDb();
  for (const [position, id] of ids.entries()) {
    await db.update(stepT).set({ position }).where(and(eq(stepT.id, id), eq(stepT.sequenceId, sequenceId)));
  }
}

/* ------------------------------------------------------------------ */
/* Sequences                                                           */
/* ------------------------------------------------------------------ */

const SequenceFields = z.object({
  name: z.string().trim().min(1, "Give this automation a name.").max(120, "Keep the name under 120 characters."),
  description: z
    .string()
    .trim()
    .max(500, "Keep the description under 500 characters.")
    .transform((v) => v || null),
  trigger: z.enum(TRIGGERS, { message: "Choose what starts this automation." }),
  active: z.boolean(),
});

const SEQUENCE_KEYS = ["name", "description", "trigger"];

function sequenceInput(formData: FormData) {
  return {
    name: str(formData, "name"),
    description: str(formData, "description"),
    trigger: str(formData, "trigger"),
    active: formData.get("active") === "on",
  };
}

export async function createSequenceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const values = { ...Object.fromEntries(SEQUENCE_KEYS.map((k) => [k, str(formData, k)])), active: formData.get("active") === "on" ? "on" : "" };
  const parsed = SequenceFields.safeParse(sequenceInput(formData));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  const db = await getDb();
  const [created] = await db.insert(seqT).values(parsed.data).returning({ id: seqT.id });
  revalidateSequences();
  redirect(`/admin/sequences/${created.id}?created=1`);
}

export async function updateSequenceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const values = { ...Object.fromEntries(SEQUENCE_KEYS.map((k) => [k, str(formData, k)])), active: formData.get("active") === "on" ? "on" : "" };
  const id = Id.safeParse(str(formData, "id"));
  if (!id.success) return { error: "Invalid automation.", values };
  const parsed = SequenceFields.safeParse(sequenceInput(formData));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  const db = await getDb();
  const [updated] = await db.update(seqT).set(parsed.data).where(eq(seqT.id, id.data)).returning({ id: seqT.id });
  if (!updated) return { error: "This automation no longer exists.", values };
  revalidateSequences(id.data);
  return { ok: true, message: "Automation saved.", values };
}

export async function setSequenceActiveAction(sequenceId: string, active: boolean): Promise<ActionResult> {
  await assertAdmin();
  const parsed = z.object({ id: Id, active: z.boolean() }).safeParse({ id: sequenceId, active });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const db = await getDb();
  const [updated] = await db.update(seqT).set({ active: parsed.data.active }).where(eq(seqT.id, parsed.data.id)).returning({ id: seqT.id });
  if (!updated) return { ok: false, error: "This automation no longer exists." };
  revalidateSequences(parsed.data.id);
  return { ok: true };
}

export async function deleteSequenceAction(sequenceId: string): Promise<ActionResult> {
  await assertAdmin();
  const id = Id.safeParse(sequenceId);
  if (!id.success) return { ok: false, error: "Invalid automation." };
  const db = await getDb();
  const [deleted] = await db.delete(seqT).where(eq(seqT.id, id.data)).returning({ id: seqT.id });
  if (!deleted) return { ok: false, error: "This automation was already deleted." };
  revalidateSequences();
  redirect("/admin/sequences?deleted=1");
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const StepFields = z.object({
  sequenceId: Id,
  stepId: Id.nullable(),
  delayHours: z
    .number({ message: "Enter a number of hours." })
    .int("Use whole hours.")
    .min(0, "The wait can't be negative.")
    .max(DELAY_MAX_HOURS, `The longest wait is ${DELAY_MAX_HOURS / 24} days.`),
  subject: z.string().trim().min(1, "Add a subject line.").max(SUBJECT_MAX, `Keep the subject under ${SUBJECT_MAX} characters.`),
  body: z.string().trim().min(1, "Write the email body.").max(BODY_MAX, `Keep the email under ${BODY_MAX.toLocaleString()} characters.`),
});

export async function saveStepAction(input: { sequenceId: string; stepId: string | null; delayHours: number; subject: string; body: string }): Promise<StepsResult> {
  await assertAdmin();
  const parsed = StepFields.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const { sequenceId, stepId, delayHours, subject, body } = parsed.data;
  const db = await getDb();
  const [seq] = await db.select({ id: seqT.id }).from(seqT).where(eq(seqT.id, sequenceId)).limit(1);
  if (!seq) return { ok: false, error: "This automation no longer exists." };
  if (stepId) {
    const [updated] = await db
      .update(stepT)
      .set({ delayHours, subject, body })
      .where(and(eq(stepT.id, stepId), eq(stepT.sequenceId, sequenceId)))
      .returning({ id: stepT.id });
    if (!updated) return { ok: false, error: "This email was deleted. Reload the page to see the latest version." };
  } else {
    const [{ next }] = await db
      .select({ next: sql<number>`coalesce(max(${stepT.position}) + 1, 0)`.mapWith(Number) })
      .from(stepT)
      .where(eq(stepT.sequenceId, sequenceId));
    await db.insert(stepT).values({ sequenceId, position: next, delayHours, subject, body });
  }
  await db.update(seqT).set({ updatedAt: new Date() }).where(eq(seqT.id, sequenceId));
  revalidateSequences(sequenceId);
  return { ok: true, steps: await orderedSteps(sequenceId) };
}

export async function deleteStepAction(sequenceId: string, stepId: string): Promise<StepsResult> {
  await assertAdmin();
  const parsed = z.object({ sequenceId: Id, stepId: Id }).safeParse({ sequenceId, stepId });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const steps = await orderedSteps(parsed.data.sequenceId);
  const index = steps.findIndex((s) => s.id === parsed.data.stepId);
  if (index === -1) return { ok: false, error: "This email was already deleted." };
  const db = await getDb();
  await db.delete(stepT).where(eq(stepT.id, parsed.data.stepId));
  await renumber(
    parsed.data.sequenceId,
    steps.filter((s) => s.id !== parsed.data.stepId).map((s) => s.id),
  );
  // People already past this email keep their place, so nobody is skipped or sent a repeat.
  await db
    .update(enrT)
    .set({ nextStep: sql`${enrT.nextStep} - 1` })
    .where(and(eq(enrT.sequenceId, parsed.data.sequenceId), eq(enrT.status, "active"), gt(enrT.nextStep, index)));
  revalidateSequences(parsed.data.sequenceId);
  return { ok: true, steps: await orderedSteps(parsed.data.sequenceId) };
}

export async function moveStepAction(sequenceId: string, stepId: string, direction: "up" | "down"): Promise<StepsResult> {
  await assertAdmin();
  const parsed = z.object({ sequenceId: Id, stepId: Id, direction: z.enum(["up", "down"]) }).safeParse({ sequenceId, stepId, direction });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const steps = await orderedSteps(parsed.data.sequenceId);
  const index = steps.findIndex((s) => s.id === parsed.data.stepId);
  if (index === -1) return { ok: false, error: "This email no longer exists. Reload the page." };
  const target = parsed.data.direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= steps.length) return { ok: true, steps };
  const ids = steps.map((s) => s.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];
  await renumber(parsed.data.sequenceId, ids);
  // Someone between the two swapped emails has received the first but not the second. After the
  // swap the already-sent one comes second, so move them past it rather than sending it twice.
  const db = await getDb();
  const second = Math.max(index, target);
  await db
    .update(enrT)
    .set({ nextStep: second + 1 })
    .where(and(eq(enrT.sequenceId, parsed.data.sequenceId), eq(enrT.status, "active"), eq(enrT.nextStep, second)));
  revalidateSequences(parsed.data.sequenceId);
  return { ok: true, steps: await orderedSteps(parsed.data.sequenceId) };
}

/* ------------------------------------------------------------------ */
/* Preview, AI draft, test send                                        */
/* ------------------------------------------------------------------ */

const ContentFields = z.object({
  subject: z.string().max(SUBJECT_MAX * 2),
  body: z.string().max(BODY_MAX * 2),
});

/** The sample person's variables, built exactly like a real send's (business name from Settings, escaped body values). */
async function sampleVars() {
  return recipientTemplateVars(SAMPLE_PERSON, await emailBusinessName());
}

/** Renders a step exactly as it will be emailed (sample person, branded layout). */
export async function previewStepAction(input: { subject: string; body: string }): Promise<{ ok: true; subject: string; html: string } | { ok: false; error: string }> {
  await assertAdmin();
  const parsed = ContentFields.safeParse(input);
  if (!parsed.success) return { ok: false, error: "This email is too long to preview." };
  const vars = await sampleVars();
  const body = parsed.data.body.trim() ? fillTemplate(parsed.data.body, vars.body) : "_Start writing to see your email here._";
  return {
    ok: true,
    subject: fillTemplate(parsed.data.subject, vars.subject),
    html: emailLayout(markdownToEmailHtml(body), { unsubscribeUrl: absoluteUrl("/unsubscribe/preview"), mailingAddress: await emailMailingAddress() }),
  };
}

export async function sendTestStepAction(input: { subject: string; body: string }): Promise<{ ok: true; to: string; status: string } | { ok: false; error: string }> {
  const session = await assertAdmin();
  const parsed = ContentFields.safeParse(input);
  if (!parsed.success || !parsed.data.subject.trim() || !parsed.data.body.trim()) return { ok: false, error: "Add a subject and body before sending a test." };
  const limit = await rateLimit(`admin-test-email:${session.email}`, 10, 600);
  if (!limit.ok) return { ok: false, error: "That's a lot of test emails. Please wait a few minutes." };
  const vars = await sampleVars();
  const result = await sendEmail({
    to: session.email,
    subject: `[Test] ${fillTemplate(parsed.data.subject, vars.subject)}`,
    markdown: fillTemplate(parsed.data.body, vars.body),
    kind: "test",
  });
  if (result.status === "failed") return { ok: false, error: "The email provider rejected the test. Open the Email Log for details." };
  return { ok: true, to: session.email, status: result.status };
}

const DraftFields = z.object({
  sequenceId: Id,
  index: z.number().int().min(0).max(100),
  delayHours: z.number().int().min(0).max(DELAY_MAX_HOURS),
  subject: z.string().max(SUBJECT_MAX * 2).optional(),
});

function draftSystemPrompt(businessName: string): string {
  return `You write email-automation copy for ${businessName}, which teaches individuals and business owners to use AI in practical ways through online courses, 1:1 coaching and done-with-you AI implementation.

Voice: warm, expert and plain-English. Confident, never hypey. Short paragraphs of one to three sentences. Speak to one reader as "you".

Rules:
- One clear call to action per email, written as a Markdown link using a placeholder URL.
- Never invent client stories, testimonials, statistics, results, credentials or guarantees. If an example helps, make it clearly hypothetical ("imagine…", "for example…").
- Markdown only: paragraphs, **bold**, lists, links and > quotes. No HTML, no images, no headings larger than ###.
- Only these placeholders, written exactly like this: {{firstName}} {{name}} {{siteUrl}} {{bookUrl}} {{coursesUrl}} {{assessmentUrl}} {{guideUrl}} {{loginUrl}} {{businessName}}. Never invent other placeholders or real URLs.
- Start with "Hi {{firstName}}," and sign off with "Talk soon," then "The {{businessName}} team" on its own line.
- 90 to 220 words. Subject line under 70 characters, specific and curiosity-driven, no clickbait, no emoji.

Reply in exactly this format and nothing else:
SUBJECT: <subject line>
BODY:
<Markdown body>`;
}

/** Drafts subject + body for one step with Claude, falling back to a solid template without AI. */
export async function draftStepAction(input: { sequenceId: string; index: number; delayHours: number; subject?: string }): Promise<{ ok: true; draft: StepDraft; source: "ai" | "template" } | { ok: false; error: string }> {
  const session = await assertAdmin();
  const parsed = DraftFields.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const db = await getDb();
  const [seq] = await db.select().from(seqT).where(eq(seqT.id, parsed.data.sequenceId)).limit(1);
  if (!seq) return { ok: false, error: "This automation no longer exists." };
  const steps = await orderedSteps(seq.id);
  const { index, delayHours } = parsed.data;
  const total = Math.max(steps.length, index + 1);
  const fallback = fallbackStepDraft(seq.trigger, index, total);

  const limit = await rateLimit(`admin-ai-draft:${session.email}`, 30, 600);
  if (!limit.ok) return { ok: true, draft: fallback, source: "template" };

  const [settings, courses, meetingTypes] = await Promise.all([
    getSettings(),
    db
      .select({ title: schema.courses.title, subtitle: schema.courses.subtitle })
      .from(schema.courses)
      .where(eq(schema.courses.published, true))
      .orderBy(asc(schema.courses.sortOrder)),
    db
      .select({ name: schema.meetingTypes.name, durationMin: schema.meetingTypes.durationMin, priceCents: schema.meetingTypes.priceCents })
      .from(schema.meetingTypes)
      .where(eq(schema.meetingTypes.active, true))
      .orderBy(asc(schema.meetingTypes.sortOrder)),
  ]);
  const outline = Array.from({ length: total }, (_, i) => {
    const existing = i === index ? null : steps[i];
    return i === index ? `${i + 1}. (THIS EMAIL)` : `${i + 1}. ${existing?.subject ?? "(not written yet)"}`;
  }).join("\n");
  const trigger = TRIGGER_META[seq.trigger];
  const user = [
    `Business: ${settings.businessName}. ${site.description}`,
    courses.length ? `Courses: ${courses.map((c) => `${c.title} (${c.subtitle})`).join("; ")}` : "",
    meetingTypes.length ? `Calls people can book: ${meetingTypes.map((m) => `${m.name}, ${m.durationMin} min, ${m.priceCents ? "paid" : "free"}`).join("; ")}` : "",
    "",
    `Automation: "${seq.name}"${seq.description ? ` (${seq.description})` : ""}`,
    `Who receives it: people who ${trigger.label.toLowerCase()}. ${trigger.description}`,
    `This is email ${index + 1} of ${total}. Timing: ${describeStepTiming(index, delayHours)}.`,
    `Emails in this automation:\n${outline}`,
    parsed.data.subject?.trim() ? `The owner's working subject line (improve or keep it): ${parsed.data.subject.trim()}` : "",
    "",
    "Write this email so it fits its place in the sequence: build on the earlier emails without repeating them.",
  ]
    .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
    .join("\n");

  const text = await aiText({ system: draftSystemPrompt(settings.businessName), messages: [{ role: "user", content: user }], effort: "medium", maxTokens: 4000 });
  const draft = parseStepDraft(text);
  return draft ? { ok: true, draft, source: "ai" } : { ok: true, draft: fallback, source: "template" };
}

/* ------------------------------------------------------------------ */
/* Enrollments                                                         */
/* ------------------------------------------------------------------ */

const EnrollFields = z.object({
  sequenceId: Id,
  email: z.string().trim().max(254, "Email is too long.").refine(isValidEmail, "Enter a valid email address.").transform(normalizeEmail),
  name: z
    .string()
    .trim()
    .max(120, "Name must be 120 characters or fewer.")
    .transform((v) => v || null),
});

export async function enrollContactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const values = { email: str(formData, "email"), name: str(formData, "name") };
  const parsed = EnrollFields.safeParse({ sequenceId: str(formData, "sequenceId"), ...values });
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  const { sequenceId, email, name } = parsed.data;
  const db = await getDb();
  const [seq] = await db.select().from(seqT).where(eq(seqT.id, sequenceId)).limit(1);
  if (!seq) return { error: "This automation no longer exists.", values };
  if (seq.trigger !== "manual") return { error: "Only manual automations accept people by hand.", values };
  if (!seq.active) return { error: "Turn this automation on before enrolling people.", values };
  const steps = await orderedSteps(seq.id);
  if (!steps.length) return { error: "Add at least one email before enrolling people.", values };

  const { contact, created } = await upsertContact({ email, name, source: "manual" });
  if (contact.unsubscribed) return { error: `${email} unsubscribed from marketing emails, so they can't be enrolled.`, values };

  const nextRunAt = new Date(Date.now() + steps[0].delayHours * HOUR);
  const [existing] = await db
    .select()
    .from(enrT)
    .where(and(eq(enrT.sequenceId, seq.id), eq(enrT.contactId, contact.id)))
    .limit(1);
  if (existing?.status === "active") return { error: `${email} is already in this automation.`, values };
  let enrollmentId: string;
  if (existing) {
    await db.update(enrT).set({ status: "active", nextStep: 0, nextRunAt }).where(eq(enrT.id, existing.id));
    enrollmentId = existing.id;
  } else {
    const [row] = await db.insert(enrT).values({ sequenceId: seq.id, contactId: contact.id, nextStep: 0, nextRunAt, status: "active" }).returning({ id: enrT.id });
    enrollmentId = row.id;
  }
  await logActivity(contact.id, "note", `Enrolled in automation: ${seq.name}`, { meta: { sequenceId: seq.id, sequence: seq.name, manual: true } });
  let sentNow = false;
  if (steps[0].delayHours === 0) sentNow = (await processEnrollment(enrollmentId)) === "sent";
  revalidateSequences(seq.id);
  revalidatePath(`/admin/contacts/${contact.id}`);
  const who = created ? `${email} was added to your contacts and enrolled` : `${email} was enrolled`;
  const when = steps[0].delayHours === 0 ? "shortly" : `in ${formatDelay(steps[0].delayHours)}`;
  return { ok: true, message: sentNow ? `${who}. The first email just went out.` : `${who}. The first email goes out ${when}.` };
}
