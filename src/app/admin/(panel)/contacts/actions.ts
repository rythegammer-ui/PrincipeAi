"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { FOLLOW_UP_PURPOSES, SEGMENTS, STAGE_ORDER, parseDollarsToCents, safeWebsiteUrl, type FollowUpPurpose } from "@/components/admin/crm-utils";
import { draftFollowUpEmail, summarizeContact } from "@/lib/ai-crm";
import { assertAdmin } from "@/lib/auth";
import { recipientTemplateVars, stopAutomations } from "@/lib/automations";
import { addTags, logActivity, recomputeScore, setStage, upsertContact } from "@/lib/crm";
import { emailBusinessName, fillTemplate, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { PENDING_ORDER_TTL_MS } from "@/lib/jobs";
import { isValidEmail, normalizeEmail, truncate } from "@/lib/utils";

export type FormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string | undefined>;
  /** Submitted values, echoed back so fields keep their input after a validation error. */
  values?: Record<string, string>;
};
export type ActionResult = { ok: true } | { ok: false; error: string };

const Id = z.uuid();
const c = schema.contacts;

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};
const formValues = (fd: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, str(fd, k)]));

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

function revalidateCrm() {
  revalidatePath("/admin", "layout");
}

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((v) => v || null);

const ProfileFields = z.object({
  name: optionalText(120, "Name"),
  email: z
    .string()
    .trim()
    .max(254, "Email is too long.")
    .refine(isValidEmail, "Enter a valid email address.")
    .transform(normalizeEmail),
  phone: optionalText(40, "Phone").refine((v) => !v || /^[+()\d\s.\-x]{5,40}$/i.test(v), "Enter a valid phone number."),
  company: optionalText(120, "Company"),
  website: optionalText(200, "Website").refine((v) => !v || safeWebsiteUrl(v) !== null, "Enter a valid website, e.g. example.com."),
  segment: z.enum(["", ...SEGMENTS], { message: "Choose a valid interest." }).transform((v) => v || null),
});

const PROFILE_KEYS = ["name", "email", "phone", "company", "website", "segment"];

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

const NewContactSchema = ProfileFields.extend({
  stage: z.enum(STAGE_ORDER, { message: "Choose a pipeline stage." }),
  dealValue: z.string().transform((v, ctx) => {
    const cents = parseDollarsToCents(v);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Enter an amount like 1500 or 997.50." });
      return z.NEVER;
    }
    return cents;
  }),
  tags: z
    .string()
    .max(400, "Too many tags.")
    .transform((v) =>
      v
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20),
    )
    .refine((tags) => tags.every((t) => t.length <= 40), "Tags must be 40 characters or fewer."),
  note: z.string().trim().max(5000, "Keep the note under 5,000 characters."),
});

export async function createContactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const keys = [...PROFILE_KEYS, "stage", "dealValue", "tags", "note"];
  const values = formValues(formData, keys);
  const parsed = NewContactSchema.safeParse(values);
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };
  const input = parsed.data;

  const db = await getDb();
  const [existing] = await db.select({ id: c.id }).from(c).where(eq(c.email, input.email)).limit(1);
  if (existing) {
    return { error: "A contact with this email already exists.", fieldErrors: { email: "Already in your CRM." }, values, message: existing.id };
  }

  const { contact } = await upsertContact({
    email: input.email,
    name: input.name,
    phone: input.phone,
    company: input.company,
    website: input.website,
    segment: input.segment,
    source: "manual",
    tags: input.tags,
  });
  if (input.dealValue) await db.update(c).set({ dealValueCents: input.dealValue }).where(eq(c.id, contact.id));
  if (input.stage !== "new") await setStage(contact.id, input.stage);
  if (input.note) await logActivity(contact.id, "note", "Note", { body: input.note, meta: { by: "admin" } });
  await recomputeScore(contact.id);
  revalidateCrm();
  redirect(`/admin/contacts/${contact.id}`);
}

/* ------------------------------------------------------------------ */
/* Profile, stage, deal value, tags, notes                             */
/* ------------------------------------------------------------------ */

export async function updateContactProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const values = formValues(formData, PROFILE_KEYS);
  const id = Id.safeParse(str(formData, "id"));
  if (!id.success) return { error: "Invalid contact." };
  const parsed = ProfileFields.safeParse(values);
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error), values };

  const db = await getDb();
  const [clash] = await db
    .select({ id: c.id })
    .from(c)
    .where(and(eq(c.email, parsed.data.email), ne(c.id, id.data)))
    .limit(1);
  if (clash) return { error: "Another contact already uses that email.", fieldErrors: { email: "Already used by another contact." }, values };

  const [updated] = await db.update(c).set(parsed.data).where(eq(c.id, id.data)).returning({ id: c.id });
  if (!updated) return { error: "This contact no longer exists." };
  // Keep the student account's name (portal greeting, completion certificates) in step with a corrected name.
  if (parsed.data.name) {
    await db.update(schema.users).set({ name: parsed.data.name }).where(eq(schema.users.contactId, id.data));
  }
  await recomputeScore(id.data);
  revalidateCrm();
  return { ok: true, message: "Profile saved." };
}

export async function setContactStageAction(contactId: string, stage: string): Promise<ActionResult> {
  await assertAdmin();
  const parsed = z.object({ id: Id, stage: z.enum(STAGE_ORDER) }).safeParse({ id: contactId, stage });
  if (!parsed.success) return { ok: false, error: "Invalid stage." };
  await setStage(parsed.data.id, parsed.data.stage);
  revalidateCrm();
  return { ok: true };
}

export async function setDealValueAction(contactId: string, amount: string): Promise<ActionResult & { cents?: number }> {
  await assertAdmin();
  const id = Id.safeParse(contactId);
  const cents = parseDollarsToCents(String(amount ?? "").slice(0, 20));
  if (!id.success) return { ok: false, error: "Invalid contact." };
  if (cents === null) return { ok: false, error: "Enter an amount like 1500 or 997.50." };
  const db = await getDb();
  await db.update(c).set({ dealValueCents: cents }).where(eq(c.id, id.data));
  revalidateCrm();
  return { ok: true, cents };
}

const TagInput = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter a tag.")
  .max(40, "Tags must be 40 characters or fewer.")
  .regex(/^[\p{L}\p{N} _\-:./&+]+$/u, "Use letters, numbers, spaces or - _ : . / & +");

export async function addContactTagAction(contactId: string, tag: string): Promise<ActionResult> {
  await assertAdmin();
  const id = Id.safeParse(contactId);
  const t = TagInput.safeParse(tag);
  if (!id.success) return { ok: false, error: "Invalid contact." };
  if (!t.success) return { ok: false, error: t.error.issues[0]?.message ?? "Invalid tag." };
  const db = await getDb();
  const [row] = await db.select({ tags: c.tags }).from(c).where(eq(c.id, id.data)).limit(1);
  if (!row) return { ok: false, error: "This contact no longer exists." };
  if (row.tags.length >= 30 && !row.tags.includes(t.data)) return { ok: false, error: "A contact can have up to 30 tags." };
  await addTags(id.data, [t.data]);
  revalidateCrm();
  return { ok: true };
}

export async function removeContactTagAction(contactId: string, tag: string): Promise<ActionResult> {
  await assertAdmin();
  const id = Id.safeParse(contactId);
  const t = z.string().max(40).safeParse(tag);
  if (!id.success || !t.success) return { ok: false, error: "Invalid tag." };
  const db = await getDb();
  await db
    .update(c)
    .set({ tags: sql`${c.tags} - ${t.data}::text` })
    .where(eq(c.id, id.data));
  revalidateCrm();
  return { ok: true };
}

export async function setUnsubscribedAction(contactId: string, unsubscribed: boolean): Promise<ActionResult> {
  await assertAdmin();
  const parsed = z.object({ id: Id, unsubscribed: z.boolean() }).safeParse({ id: contactId, unsubscribed });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const db = await getDb();
  await db.update(c).set({ unsubscribed: parsed.data.unsubscribed }).where(eq(c.id, parsed.data.id));
  if (parsed.data.unsubscribed) await stopAutomations(parsed.data.id);
  await recomputeScore(parsed.data.id);
  revalidateCrm();
  return { ok: true };
}

export async function saveContactNotesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const parsed = z
    .object({ id: Id, notes: z.string().max(10_000, "Notes must be under 10,000 characters.") })
    .safeParse({ id: str(formData, "id"), notes: str(formData, "notes") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request.", values: { notes: str(formData, "notes") } };
  const db = await getDb();
  await db
    .update(c)
    .set({ notes: parsed.data.notes.trim() || null })
    .where(eq(c.id, parsed.data.id));
  revalidateCrm();
  return { ok: true, message: "Notes saved." };
}

/* ------------------------------------------------------------------ */
/* Timeline: notes + calls                                             */
/* ------------------------------------------------------------------ */

const CALL_OUTCOMES = { connected: "Connected", voicemail: "Left voicemail", no_answer: "No answer" } as const;

export async function addTimelineEntryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const values = formValues(formData, ["kind", "body", "outcome"]);
  const parsed = z
    .object({
      id: Id,
      kind: z.enum(["note", "call"]),
      body: z.string().trim().min(1, "Write a few words first.").max(5000, "Keep it under 5,000 characters."),
      outcome: z.enum(["", "connected", "voicemail", "no_answer"]).catch(""),
    })
    .safeParse({ ...values, id: str(formData, "id") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request.", values };
  const { id, kind, body, outcome } = parsed.data;
  const title = kind === "note" ? "Note" : `Call logged${outcome ? ` — ${CALL_OUTCOMES[outcome]}` : ""}`;
  const db = await getDb();
  const [exists] = await db.select({ id: c.id }).from(c).where(eq(c.id, id)).limit(1);
  if (!exists) return { error: "This contact no longer exists." };
  await logActivity(id, kind, title, { body, meta: { by: "admin", ...(outcome ? { outcome: CALL_OUTCOMES[outcome] } : {}) } });
  revalidateCrm();
  return { ok: true, message: kind === "note" ? "Note added." : "Call logged." };
}

/* ------------------------------------------------------------------ */
/* AI + email                                                          */
/* ------------------------------------------------------------------ */

async function aiQuota(email: string) {
  return rateLimit(`ai-crm:${email}`, 60, 60 * 60);
}

export async function summarizeContactAction(
  contactId: string,
): Promise<{ ok: true; summary: string; at: string; source: "ai" | "rules" } | { ok: false; error: string }> {
  const session = await assertAdmin();
  const id = Id.safeParse(contactId);
  if (!id.success) return { ok: false, error: "Invalid contact." };
  if (!(await aiQuota(session.email)).ok) return { ok: false, error: "You've hit the hourly AI limit. Try again in a little while." };
  try {
    const result = await summarizeContact(id.data);
    if (!result) return { ok: false, error: "This contact no longer exists." };
    if (result.kept) return { ok: false, error: "Claude couldn't write a new brief just now, so the previous one was kept. Please try again in a moment." };
    revalidateCrm();
    return { ok: true, summary: result.summary, at: result.at.toISOString(), source: result.source };
  } catch (err) {
    console.error("[crm] summarize failed", err);
    return { ok: false, error: "Couldn't generate the summary. Please try again." };
  }
}

export async function draftFollowUpAction(
  contactId: string,
  purpose: string,
  instructions: string,
): Promise<{ ok: true; subject: string; body: string; source: "ai" | "template" } | { ok: false; error: string }> {
  const session = await assertAdmin();
  const parsed = z
    .object({
      id: Id,
      purpose: z.enum(Object.keys(FOLLOW_UP_PURPOSES) as [FollowUpPurpose, ...FollowUpPurpose[]]),
      instructions: z.string().max(500, "Keep the guidance under 500 characters."),
    })
    .safeParse({ id: contactId, purpose, instructions: instructions ?? "" });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  if (!(await aiQuota(session.email)).ok) return { ok: false, error: "You've hit the hourly AI limit. Try again in a little while." };
  try {
    const draft = await draftFollowUpEmail(parsed.data.id, parsed.data.purpose, parsed.data.instructions);
    if (!draft) return { ok: false, error: "This contact no longer exists." };
    return { ok: true, ...draft };
  } catch (err) {
    console.error("[crm] draft failed", err);
    return { ok: false, error: "Couldn't draft the email. Please try again." };
  }
}

export async function sendContactEmailAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const values = formValues(formData, ["subject", "body"]);
  const parsed = z
    .object({
      id: Id,
      subject: z.string().trim().min(1, "Add a subject line.").max(200, "Keep the subject under 200 characters."),
      body: z.string().trim().min(1, "Write the email first.").max(20_000, "The email is too long."),
    })
    .safeParse({ ...values, id: str(formData, "id") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request.", fieldErrors: fieldErrors(parsed.error), values };
  const { id, subject, body } = parsed.data;
  const db = await getDb();
  const [contact] = await db.select({ id: c.id, email: c.email, name: c.name }).from(c).where(eq(c.id, id)).limit(1);
  if (!contact) return { error: "This contact no longer exists.", values };

  // Only {{firstName}} and {{buy_link:<course-slug>}}, the two the composer mentions. Anything else in double braces
  // (say, a prompt template quoted from a lesson, with its own {{name}}) is sent as typed.
  const vars = recipientTemplateVars(contact, await emailBusinessName());
  const pick = (v: typeof vars.body) => ({ firstName: v.firstName, "buy_link:*": v["buy_link:*"] });
  const filledSubject = fillTemplate(subject, pick(vars.subject), false, true).replace(/\s+/g, " ").trim();
  const filledBody = fillTemplate(body, pick(vars.body), false, true);
  if (!filledSubject) return { error: "The subject is empty once its placeholders are filled in.", fieldErrors: { subject: "Add a subject line." }, values };
  const result = await sendEmail({ to: contact.email, subject: filledSubject, markdown: filledBody, kind: "manual", contactId: contact.id });
  if (result.status === "failed") {
    revalidateCrm();
    return { error: "The email provider rejected the message. Check the Email Log for details.", values };
  }
  await logActivity(contact.id, "email_sent", `Email sent: ${truncate(filledSubject, 120)}`, {
    body: truncate(filledBody, 2000),
    meta: { by: "admin", delivery: result.status },
  });
  revalidateCrm();
  return {
    ok: true,
    message: result.status === "simulated" ? "Logged as simulated — add RESEND_API_KEY to deliver real email." : `Email sent to ${contact.email}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Automations + delete                                                */
/* ------------------------------------------------------------------ */

export async function stopEnrollmentAction(contactId: string, enrollmentId: string): Promise<ActionResult> {
  await assertAdmin();
  const parsed = z.object({ contactId: Id, enrollmentId: Id }).safeParse({ contactId, enrollmentId });
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const db = await getDb();
  const e = schema.sequenceEnrollments;
  const [stopped] = await db
    .update(e)
    .set({ status: "stopped", nextRunAt: null })
    .where(and(eq(e.id, parsed.data.enrollmentId), eq(e.contactId, parsed.data.contactId), eq(e.status, "active")))
    .returning({ id: e.id });
  if (!stopped) return { ok: false, error: "This automation is no longer active." };
  revalidateCrm();
  return { ok: true };
}

export async function deleteContactAction(contactId: string): Promise<ActionResult> {
  await assertAdmin();
  const id = Id.safeParse(contactId);
  if (!id.success) return { ok: false, error: "Invalid contact." };
  const db = await getDb();
  // Deleting a contact deletes their bookings too: never while a checkout could still be paid, or the payment
  // would arrive for a booking that no longer exists and couldn't be delivered.
  const inCheckout = await db.execute<{ hold: boolean }>(sql`
    select true as hold from bookings b
    where b.contact_id = ${id.data} and b.status = 'pending_payment' and (b.hold_expires_at is null or b.hold_expires_at > now())
    union all
    select true from orders o
    where o.status = 'pending' and o.created_at > ${new Date(Date.now() - PENDING_ORDER_TTL_MS).toISOString()}::timestamptz
      and (o.contact_id = ${id.data} or o.booking_id in (select b2.id from bookings b2 where b2.contact_id = ${id.data}))
    limit 1
  `);
  const busy = Array.isArray(inCheckout) ? inCheckout.length > 0 : (inCheckout as unknown as { rows: unknown[] }).rows.length > 0;
  if (busy) {
    return {
      ok: false,
      error: "This contact has a checkout in progress (an unpaid booking hold or a pending order). Try again once it has been paid or has expired.",
    };
  }
  const [deleted] = await db.delete(c).where(eq(c.id, id.data)).returning({ id: c.id });
  if (!deleted) return { ok: false, error: "This contact was already deleted." };
  revalidateCrm();
  redirect("/admin/contacts?deleted=1");
}
