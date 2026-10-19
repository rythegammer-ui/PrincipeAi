import "server-only";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  BUDGET_OPTIONS,
  CONTACT_TOPIC_OPTIONS,
  INTEREST_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  optionLabel,
  optionValues,
  type Budget,
} from "@/components/marketing/lead-options";
import { getDb, schema } from "@/db";
import type { Contact } from "@/db/schema";
import { captureLead, contactForVisitor, createTask } from "@/lib/crm";
import { escapeMarkdown } from "@/lib/email";
import { getVisitorContext } from "@/lib/tracking";

/**
 * Lead capture for the marketing funnels: free Starter Kit opt-in, consulting application
 * and contact form. Server actions live next to their pages and call into this module.
 * OWNER: marketing feature.
 */

/* ------------------------------------------------------------------ */
/* Guide access                                                        */
/* ------------------------------------------------------------------ */

/** httpOnly cookie set after the Starter Kit opt-in; unlocks /guide on this browser. */
export const GUIDE_COOKIE = "pa_guide";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function grantGuideAccess(): Promise<void> {
  const jar = await cookies();
  jar.set(GUIDE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

/**
 * Soft gate for /guide: unlocked when this browser opted in (cookie), the visitor is already a
 * known contact, or they arrived from one of our emails (?src=email). Also returns the contact
 * (when known) so the page can greet them by name.
 */
export async function getGuideAccess(src?: string | null): Promise<{ unlocked: boolean; contact: Contact | null }> {
  const jar = await cookies();
  const hasCookie = jar.get(GUIDE_COOKIE)?.value === "1";
  const { visitorId } = await getVisitorContext();
  const contact = await contactForVisitor(visitorId).catch(() => null);
  return { unlocked: hasCookie || Boolean(contact) || src === "email", contact };
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const nameField = z
  .string()
  .trim()
  .min(1, { error: "Please tell us your name." })
  .max(120, { error: "That name is a little long — 120 characters max." });

const emailField = z.email({ error: "Please enter a valid email address." }).max(254, { error: "That email address is too long." });

export const optInSchema = z.object({
  name: nameField,
  email: emailField,
  interest: z.enum(optionValues(INTEREST_OPTIONS), { error: "Choose where you'd like AI to help most." }),
});
export type OptInInput = z.infer<typeof optInSchema>;

/** Accepts "example.com", "www.example.com" or a full http(s) URL; returns a normalised URL or null when blank. */
export function normalizeWebsite(input: string | null | undefined): string | null | undefined {
  const raw = input?.trim();
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".") || /\s/.test(raw)) return undefined;
    return url.href.replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export const applicationSchema = z.object({
  name: nameField,
  email: emailField,
  company: z.string().trim().min(1, { error: "Please tell us your company or business name." }).max(160, { error: "Please shorten the company name." }),
  website: z
    .string()
    .trim()
    .max(300, { error: "That website address is too long." })
    .transform((v, ctx) => {
      const url = normalizeWebsite(v);
      if (url === undefined) {
        ctx.addIssue({ code: "custom", message: "Please enter a valid website, like example.com (or leave it blank)." });
        return z.NEVER;
      }
      return url;
    }),
  teamSize: z.enum(optionValues(TEAM_SIZE_OPTIONS), { error: "Please choose your team size." }),
  goals: z
    .string()
    .trim()
    .min(15, { error: "A sentence or two helps us prepare — what would you like AI to take off your plate?" })
    .max(4000, { error: "Please keep this under 4,000 characters — we'll go deeper on the call." }),
  budget: z.enum(optionValues(BUDGET_OPTIONS), { error: "Please choose a budget range (\"Not sure yet\" is fine)." }),
  timeline: z.enum(optionValues(TIMELINE_OPTIONS), { error: "Please choose a timeline." }),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  topic: z.enum(optionValues(CONTACT_TOPIC_OPTIONS), { error: "Please choose what your message is about." }),
  message: z
    .string()
    .trim()
    .min(10, { error: "Please add a little more detail so we can help." })
    .max(5000, { error: "Please keep your message under 5,000 characters." }),
});
export type ContactInput = z.infer<typeof contactSchema>;

/** Reads the given string fields from a FormData (trimmed, length-capped, email lowercased). */
export function readFields<K extends string>(formData: FormData, keys: readonly K[]): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const key of keys) {
    const v = formData.get(key);
    let s = typeof v === "string" ? v.trim().slice(0, 6000) : "";
    if (key === "email") s = s.toLowerCase();
    out[key] = s;
  }
  return out;
}

/** First message per top-level field. */
export function fieldErrorsOf<K extends string>(error: z.ZodError, keys: readonly K[]): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && (keys as readonly string[]).includes(key) && !out[key as K]) out[key as K] = issue.message;
  }
  return out;
}

/** True when the hidden honeypot field was filled in (bots fill every input). */
export function isSpam(formData: FormData): boolean {
  const v = formData.get("company_url");
  return typeof v === "string" && v.trim().length > 0;
}

/** Escapes Markdown control characters (and `.` `:` `@`, so URLs and addresses can't autolink) in visitor text for emails. */
export { escapeMarkdown };

/* ------------------------------------------------------------------ */
/* Captures                                                            */
/* ------------------------------------------------------------------ */

/** Starter Kit opt-in → contact (stage "new", tagged starter-kit) + welcome sequence + owner alert. */
export async function captureGuideOptIn(input: OptInInput, path: string): Promise<Contact> {
  const interest = optionLabel(INTEREST_OPTIONS, input.interest);
  const { contact } = await captureLead({
    email: input.email,
    name: input.name,
    segment: input.interest,
    source: "lead_magnet",
    tags: ["starter-kit"],
    activity: { type: "optin", title: "Downloaded the AI Starter Kit", meta: { interest, path } },
    event: { name: "optin", path, props: { offer: "starter-kit", interest: input.interest } },
    stage: "new",
    automation: "lead_magnet",
    notify: {
      kind: "lead",
      subject: `New lead: ${input.name} downloaded the Starter Kit`,
      markdown: [
        `**${escapeMarkdown(input.name)}** (${escapeMarkdown(input.email)}) just downloaded the AI Starter Kit.`,
        "",
        `- **Wants AI help with:** ${interest}`,
        `- **Signed up on:** ${path}`,
        "",
        "They've been enrolled in the Starter Kit welcome sequence.",
      ].join("\n"),
    },
  });
  return contact;
}

/** Plain-text summary of an application (CRM timeline + task description). */
export function formatApplication(input: ApplicationInput): string {
  return [
    `Company: ${input.company}`,
    `Website: ${input.website || "—"}`,
    `Team size: ${optionLabel(TEAM_SIZE_OPTIONS, input.teamSize)}`,
    `Budget: ${optionLabel(BUDGET_OPTIONS, input.budget)}`,
    `Timeline: ${optionLabel(TIMELINE_OPTIONS, input.timeline)}`,
    "",
    "What they'd like to automate or build:",
    input.goals,
  ].join("\n");
}

/** Rough pipeline value for a stated budget (only used when the contact has no deal value yet). */
const BUDGET_DEAL_VALUE_CENTS: Record<Budget, number> = {
  "under-2k": 150_000,
  "2k-5k": 350_000,
  "5k-15k": 1_000_000,
  "15k-plus": 1_500_000,
  unsure: 0,
};

/**
 * Implementation application → qualified contact (+ estimated deal value), timeline entry,
 * funnel event, owner alert and a high-priority follow-up task due tomorrow.
 */
export async function captureApplication(input: ApplicationInput): Promise<Contact> {
  const answers = {
    company: input.company,
    teamSize: optionLabel(TEAM_SIZE_OPTIONS, input.teamSize),
    budget: optionLabel(BUDGET_OPTIONS, input.budget),
    timeline: optionLabel(TIMELINE_OPTIONS, input.timeline),
    website: input.website ?? "",
    goals: input.goals,
  };
  const summary = formatApplication(input);
  const { contact } = await captureLead({
    email: input.email,
    name: input.name,
    company: input.company,
    website: input.website,
    segment: "business",
    source: "application",
    tags: ["implementation"],
    activity: { type: "form", title: "Implementation application", body: summary, meta: answers },
    event: { name: "application", path: "/consulting", props: { teamSize: input.teamSize, budget: input.budget, timeline: input.timeline } },
    stage: "qualified",
    notify: {
      kind: "lead",
      subject: `New implementation application: ${input.company}`,
      markdown: [
        `**${escapeMarkdown(input.name)}** (${escapeMarkdown(input.email)}) applied for AI implementation.`,
        "",
        `- **Company:** ${escapeMarkdown(input.company)}`,
        `- **Website:** ${input.website ? escapeMarkdown(input.website) : "—"}`,
        `- **Team size:** ${answers.teamSize}`,
        `- **Budget:** ${answers.budget}`,
        `- **Timeline:** ${answers.timeline}`,
        "",
        "**What they'd like to automate or build:**",
        "",
        escapeMarkdown(input.goals),
        "",
        "They're being sent to book an implementation discovery call next.",
      ].join("\n"),
    },
  });

  const estimate = BUDGET_DEAL_VALUE_CENTS[input.budget];
  if (estimate > 0 && contact.dealValueCents === 0) {
    const db = await getDb();
    await db
      .update(schema.contacts)
      .set({ dealValueCents: estimate })
      .where(and(eq(schema.contacts.id, contact.id), eq(schema.contacts.dealValueCents, 0)));
  }

  await createTask({
    title: `Review implementation application — ${input.company}`,
    contactId: contact.id,
    description: summary,
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    priority: "high",
    origin: "application",
  });
  return contact;
}

/** Contact form → contact + timeline entry + owner alert + a reply-to task. */
export async function captureContactMessage(input: ContactInput): Promise<Contact> {
  const topic = optionLabel(CONTACT_TOPIC_OPTIONS, input.topic);
  const { contact } = await captureLead({
    email: input.email,
    name: input.name,
    segment: input.topic === "implementation" || input.topic === "workshop" ? "business" : null,
    source: "contact_form",
    tags: ["contact-form"],
    activity: { type: "form", title: `Contact form: ${topic}`, body: input.message, meta: { topic } },
    event: { name: "contact_form", path: "/contact", props: { topic: input.topic } },
    automation: "contact_form",
    notify: {
      kind: "lead",
      subject: `New message from ${input.name}: ${topic}`,
      markdown: [
        `**${escapeMarkdown(input.name)}** (${escapeMarkdown(input.email)}) sent a message through the contact form.`,
        "",
        `**Topic:** ${topic}`,
        "",
        escapeMarkdown(input.message),
      ].join("\n"),
    },
  });
  await createTask({
    title: `Reply to ${input.name} — ${topic.toLowerCase()}`,
    contactId: contact.id,
    description: input.message,
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    priority: input.topic === "implementation" ? "high" : "normal",
    origin: "contact_form",
  });
  return contact;
}
