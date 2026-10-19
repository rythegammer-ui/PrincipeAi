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
import { emailBusinessName, escapeMarkdown, sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { getVisitorContext } from "@/lib/tracking";
import { absoluteUrl, firstName, normalizeEmail } from "@/lib/utils";

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

/** Ids of this address's enrollments in the Starter Kit ("lead_magnet") email sequences. */
async function kitEnrollmentIds(email: string): Promise<Set<string>> {
  const db = await getDb();
  const e = schema.sequenceEnrollments;
  const rows = await db
    .select({ id: e.id })
    .from(e)
    .innerJoin(schema.emailSequences, eq(schema.emailSequences.id, e.sequenceId))
    .innerJoin(schema.contacts, eq(schema.contacts.id, e.contactId))
    .where(and(eq(schema.contacts.email, email), eq(schema.emailSequences.trigger, "lead_magnet")));
  return new Set(rows.map((r) => r.id));
}

/**
 * Kit link emails one address can be sent per day. The opt-in form is public and takes any address, so it mustn't be
 * usable to flood someone's inbox; the visitor who opted in has the kit unlocked in their browser either way.
 */
const GUIDE_LINK_EMAILS_PER_DAY = 1;

/**
 * Emails the Starter Kit link on its own (not a marketing email: the visitor just asked for it), for opt-ins the
 * welcome sequence won't email: a repeat opt-in or the sequence paused. Never to an unsubscribed contact (anyone can
 * type their address into the form) and at most once a day per address. True when sent.
 */
async function sendGuideLinkEmail(contact: Contact, name: string): Promise<boolean> {
  if (contact.unsubscribed) return false;
  const limit = await rateLimit(`guide-link:${contact.email}`, GUIDE_LINK_EMAILS_PER_DAY, 24 * 60 * 60);
  if (!limit.ok) return false;
  const businessName = await emailBusinessName();
  const { status } = await sendEmail({
    to: contact.email,
    subject: "Here's your link to the AI Starter Kit",
    preheader: "Open your kit and come back to it anytime.",
    markdown: [
      `Hi ${escapeMarkdown(firstName(name, contact.email))},`,
      "",
      "Here's the link to your AI Starter Kit, as requested:",
      "",
      `**[Open your AI Starter Kit](${absoluteUrl("/guide?src=email")})**`,
      "",
      "Bookmark it so you can come back to the plan and the prompt library anytime.",
      "",
      "If you didn't ask for this, you can safely ignore this email.",
      "",
      `Talk soon,  \nThe ${escapeMarkdown(businessName)} team`,
    ].join("\n"),
    kind: "guide_link",
    contactId: contact.id,
  });
  return status === "sent" || status === "simulated";
}

/**
 * Starter Kit opt-in → contact (stage "new", tagged starter-kit) + welcome sequence + owner alert. The welcome
 * sequence's first email carries the kit link, but it only starts once per contact; when it doesn't start, the link
 * is emailed on its own (see `sendGuideLinkEmail` for when it isn't). `emailed` says whether a link email went out or
 * is queued, so the confirmation can promise one only then.
 */
export async function captureGuideOptIn(input: OptInInput, path: string): Promise<{ contact: Contact; emailed: boolean }> {
  const interest = optionLabel(INTEREST_OPTIONS, input.interest);
  const email = normalizeEmail(input.email);
  const before = await kitEnrollmentIds(email);
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
        before.size > 0
          ? "They'd opted in before, so the welcome sequence wasn't restarted."
          : "They've been enrolled in the Starter Kit welcome sequence.",
      ].join("\n"),
    },
  });

  let emailed = false;
  try {
    // A new enrollment for a subscribed contact means the welcome sequence sends (or has queued) the kit email.
    const after = await kitEnrollmentIds(email);
    const sequenceStarted = !contact.unsubscribed && [...after].some((id) => !before.has(id));
    emailed = sequenceStarted || (await sendGuideLinkEmail(contact, input.name));
  } catch (err) {
    console.error("[leads] Starter Kit link email failed", err);
  }
  return { contact, emailed };
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

/* ------------------------------------------------------------------ */
/* Discovery-call prefill                                              */
/* ------------------------------------------------------------------ */

/** Booking page the consulting application sends applicants to next. */
export const DISCOVERY_MEETING_SLUG = "implementation-discovery";

/**
 * Short-lived httpOnly cookie that carries the application's answers into the discovery booking form, so applicants
 * don't type them twice. Not the URL: page-view tracking stores query strings.
 */
export const DISCOVERY_PREFILL_COOKIE = "pa_discovery_prefill";
const DISCOVERY_PREFILL_MAX_AGE = 60 * 60;
/** Booking answers are capped at this many characters (the booking form and its server action use the same limit). */
const PREFILL_ANSWER_MAX = 2000;
/** Browsers drop a cookie whose name + value pass 4 KB; Next.js URI-encodes the value, so budget the encoded size. */
const PREFILL_COOKIE_MAX_BYTES = 3800;

/** Answers to the discovery call's questions, keyed by question id. */
export type DiscoveryPrefill = { company: string; project: string; budget: string };

/** Cuts text to `max` UTF-16 units without leaving half of a surrogate pair (an emoji) at the end. */
function cut(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).replace(/[\uD800-\uDBFF]$/, "");
}

export function discoveryPrefillFrom(input: ApplicationInput): DiscoveryPrefill {
  return {
    company: cut([input.company, input.website].filter(Boolean).join(" · "), PREFILL_ANSWER_MAX),
    project: cut(input.goals, PREFILL_ANSWER_MAX),
    budget: optionLabel(BUDGET_OPTIONS, input.budget),
  };
}

/** The cookie value (JSON), with the project text shortened as needed so the encoded cookie fits. */
export function encodeDiscoveryPrefill(prefill: DiscoveryPrefill): string {
  let project = prefill.project;
  for (;;) {
    const value = JSON.stringify({ ...prefill, project });
    if (!project || DISCOVERY_PREFILL_COOKIE.length + 1 + encodeURIComponent(value).length <= PREFILL_COOKIE_MAX_BYTES) return value;
    project = cut(project, Math.floor(project.length * 0.9)).trimEnd();
  }
}

/** Remembers an application's answers (for an hour, on /book only) to prefill the discovery booking form. */
export async function rememberDiscoveryPrefill(input: ApplicationInput): Promise<void> {
  const jar = await cookies();
  jar.set(DISCOVERY_PREFILL_COOKIE, encodeDiscoveryPrefill(discoveryPrefillFrom(input)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/book",
    maxAge: DISCOVERY_PREFILL_MAX_AGE,
  });
}

/**
 * Booking-form values (`q_<question id>` → answer) from a prefill cookie value, for the meeting type's own questions
 * only. Empty for any other meeting type and for a missing or malformed cookie.
 */
export function parseDiscoveryPrefill(
  raw: string | null | undefined,
  meetingType: { slug: string; questions: readonly { id: string }[] },
): Record<string, string> {
  if (!raw || meetingType.slug !== DISCOVERY_MEETING_SLUG) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out: Record<string, string> = {};
  for (const q of meetingType.questions) {
    const value = Object.hasOwn(data, q.id) ? (data as Record<string, unknown>)[q.id] : undefined;
    if (typeof value !== "string") continue;
    const answer = cut(value.trim(), PREFILL_ANSWER_MAX);
    if (answer) out[`q_${q.id}`] = answer;
  }
  return out;
}

/** The discovery booking form's prefilled answers for this browser (see `parseDiscoveryPrefill`). */
export async function readDiscoveryPrefill(meetingType: { slug: string; questions: readonly { id: string }[] }): Promise<Record<string, string>> {
  if (meetingType.slug !== DISCOVERY_MEETING_SLUG) return {};
  const jar = await cookies();
  return parseDiscoveryPrefill(jar.get(DISCOVERY_PREFILL_COOKIE)?.value, meetingType);
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
