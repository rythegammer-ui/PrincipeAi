/**
 * Pure helpers shared by the email-automation admin (server actions + client editors) and the
 * unsubscribe page. No server-only imports, so client components and unit tests can use them.
 */
import type { EmailStatus, EnrollmentStatus, SequenceTrigger } from "@/db/schema";

export const SUBJECT_MAX = 200;
export const BODY_MAX = 20_000;
/** Longest allowed wait between two emails (90 days). */
export const DELAY_MAX_HOURS = 24 * 90;

/* ------------------------------------------------------------------ */
/* Triggers                                                            */
/* ------------------------------------------------------------------ */

export const TRIGGERS = ["lead_magnet", "quiz_completed", "call_booked", "purchase", "contact_form", "manual"] as const satisfies readonly SequenceTrigger[];

export const TRIGGER_META: Record<SequenceTrigger, { label: string; description: string }> = {
  lead_magnet: { label: "Downloads the free guide", description: "Starts when someone opts in for the AI Starter Kit." },
  quiz_completed: { label: "Completes the AI assessment", description: "Starts when someone finishes the AI readiness assessment." },
  call_booked: { label: "Books a call", description: "Starts when someone books any call on your calendar." },
  purchase: { label: "Makes a purchase", description: "Starts after a successful course purchase (paid sessions start “Books a call” instead)." },
  contact_form: { label: "Sends the contact form", description: "Starts when someone sends a message through the contact page." },
  manual: { label: "Added manually", description: "Only people you enroll by hand from this page." },
};

export function isTrigger(value: unknown): value is SequenceTrigger {
  return typeof value === "string" && (TRIGGERS as readonly string[]).includes(value);
}

export function triggerLabel(trigger: string): string {
  return isTrigger(trigger) ? TRIGGER_META[trigger].label : trigger;
}

/* ------------------------------------------------------------------ */
/* Placeholders                                                        */
/* ------------------------------------------------------------------ */

export const PLACEHOLDERS = [
  { key: "firstName", description: "First name (or the start of their email)" },
  { key: "name", description: "Full name — may be blank" },
  { key: "siteUrl", description: "Your homepage" },
  { key: "bookUrl", description: "Booking page" },
  { key: "coursesUrl", description: "Course catalog" },
  { key: "assessmentUrl", description: "Free AI assessment" },
  { key: "guideUrl", description: "AI Starter Kit (free guide)" },
  { key: "loginUrl", description: "Student login" },
  { key: "businessName", description: "Your business name (Settings → Business)" },
] as const;
// Plus {{buy_link:<course-slug>}}: a checkout link for that course (see fillTemplate and /buy/[slug]); the step
// editor offers one per paid course.

/** Sample person used for previews and test sends. */
export const SAMPLE_PERSON = { firstName: "Alex", name: "Alex Rivera", email: "alex@example.com" } as const;

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */

/** 0 → "immediately", 26 → "1 day 2 hours", 48 → "2 days". */
export function formatDelay(hours: number): string {
  const h = Math.max(0, Math.round(hours));
  if (h === 0) return "immediately";
  const days = Math.floor(h / 24);
  const rest = h % 24;
  const parts: string[] = [];
  if (days) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (rest) parts.push(`${rest} ${rest === 1 ? "hour" : "hours"}`);
  return parts.join(" ");
}

/** Plain-English timing for step `index` (0-based). */
export function describeStepTiming(index: number, delayHours: number): string {
  if (index === 0) return delayHours <= 0 ? "Sends as soon as someone joins" : `Sends ${formatDelay(delayHours)} after someone joins`;
  return delayHours <= 0 ? "Sends right after the previous email" : `Sends ${formatDelay(delayHours)} after the previous email`;
}

/** Day number (from enrollment) each step goes out on, e.g. [0, 1, 3]. */
export function stepDays(delays: number[]): number[] {
  let total = 0;
  return delays.map((d) => {
    total += Math.max(0, d);
    return Math.floor(total / 24);
  });
}

/* ------------------------------------------------------------------ */
/* Status metadata                                                     */
/* ------------------------------------------------------------------ */

type Tone = "neutral" | "brand" | "gold" | "green" | "red" | "blue" | "amber";

export const EMAIL_STATUS_META: Record<EmailStatus, { label: string; tone: Tone; hint: string }> = {
  sent: { label: "Sent", tone: "green", hint: "Accepted by Resend for delivery." },
  simulated: { label: "Simulated", tone: "blue", hint: "Logged only — add RESEND_API_KEY to deliver real email." },
  failed: { label: "Failed", tone: "red", hint: "The email provider rejected the message." },
  skipped: { label: "Skipped", tone: "neutral", hint: "Not sent because the contact unsubscribed." },
};
export const EMAIL_STATUSES = Object.keys(EMAIL_STATUS_META) as EmailStatus[];

export const ENROLLMENT_STATUS_META: Record<EnrollmentStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "brand" },
  completed: { label: "Completed", tone: "green" },
  stopped: { label: "Stopped", tone: "neutral" },
};

/** "booking_confirmation" → "Booking confirmation". */
export function humanizeKind(kind: string): string {
  const s = kind.replace(/[_-]+/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Email";
}

/* ------------------------------------------------------------------ */
/* Privacy                                                             */
/* ------------------------------------------------------------------ */

/** "alex.rivera@gmail.com" → "al•••@g•••.com" (length-hiding). */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "•••";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const keep = local.length > 3 ? 2 : 1;
  const dot = domain.lastIndexOf(".");
  const host = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : "";
  return `${local.slice(0, keep)}•••@${host.slice(0, 1)}•••${tld}`;
}

/* ------------------------------------------------------------------ */
/* AI drafts                                                           */
/* ------------------------------------------------------------------ */

export type StepDraft = { subject: string; body: string };

function cleanDraft(subject: string, body: string): StepDraft | null {
  const s = subject
    .replace(/\s+/g, " ")
    .replace(/^["'*_#\s]+|["'*_\s]+$/g, "")
    .slice(0, SUBJECT_MAX)
    .trim();
  const b = body
    .replace(/^\s*(?:\*\*)?body:?(?:\*\*)?\s*\n/i, "")
    .trim()
    .slice(0, BODY_MAX);
  return s && b.length >= 20 ? { subject: s, body: b } : null;
}

/**
 * Parses an AI reply into { subject, body }. Accepts "SUBJECT: … / BODY: …", a JSON object
 * (optionally fenced), or a leading "Subject:" line. Returns null when nothing usable is found.
 */
export function parseStepDraft(raw: string | null | undefined): StepDraft | null {
  if (!raw) return null;
  const text = raw.replace(/^```[a-z]*[ \t]*\n?|\n?```[ \t]*$/gim, "").trim();
  const tagged = text.match(/(?:^|\n)\s*(?:\*\*)?SUBJECT:?(?:\*\*)?:?\s*(.+?)\s*\n+\s*(?:\*\*)?BODY:?(?:\*\*)?:?\s*\n?([\s\S]+)/i);
  if (tagged) return cleanDraft(tagged[1], tagged[2]);
  const json = text.match(/\{[\s\S]*\}/);
  if (json) {
    try {
      const obj = JSON.parse(json[0]) as { subject?: unknown; body?: unknown };
      if (typeof obj.subject === "string" && typeof obj.body === "string") return cleanDraft(obj.subject, obj.body);
    } catch {
      /* fall through */
    }
  }
  const subjectLine = text.match(/^\s*subject:\s*(.+)$/im);
  if (subjectLine) return cleanDraft(subjectLine[1], text.replace(subjectLine[0], ""));
  return null;
}

type DraftSlot = "first" | "middle" | "last";

const SIGN_OFF = "Talk soon,\nThe {{businessName}} team";

const FALLBACK_DRAFTS: Record<SequenceTrigger, Record<DraftSlot, StepDraft>> = {
  lead_magnet: {
    first: {
      subject: "Your AI Starter Kit is ready, {{firstName}}",
      body: `Hi {{firstName}},\n\nThanks for grabbing the AI Starter Kit. Here it is:\n\n**[Open your Starter Kit]({{guideUrl}})**\n\nStart with Day 1 of the plan. It takes about 10 minutes, and you'll have your first useful result before your coffee goes cold.\n\nIf you get stuck, just reply to this email.\n\n${SIGN_OFF}`,
    },
    middle: {
      subject: "One small AI win to try today",
      body: `Hi {{firstName}},\n\nHere's a quick one. Open your AI assistant and paste this:\n\n> "Here's my to-do list for this week: [paste it]. Group it by priority, flag anything I could delegate or drop, and suggest the order to tackle it in."\n\nTwo minutes, and you'll have a clearer week. Small wins like this are how AI becomes a habit.\n\nMore prompts like this are in your [Starter Kit]({{guideUrl}}).\n\n${SIGN_OFF}`,
    },
    last: {
      subject: "Want help putting AI to work?",
      body: `Hi {{firstName}},\n\nBy now you've seen what a few good prompts can do. If you'd like a structured path from here, you have two options:\n\n- **Learn at your own pace** with our [courses]({{coursesUrl}}).\n- **Get a plan for your situation** on a [free strategy call]({{bookUrl}}).\n\nEither way, keep going. A little practice each week adds up fast.\n\n${SIGN_OFF}`,
    },
  },
  quiz_completed: {
    first: {
      subject: "What your AI readiness score means",
      body: `Hi {{firstName}},\n\nThanks for taking the AI readiness assessment. Your score isn't a grade. It's a starting point, and it tells you which next step will pay off fastest.\n\nPick **one** action from your plan and do it this week. One finished action beats five good intentions.\n\nWant to retake it later and see how far you've come? It's always here: [AI assessment]({{assessmentUrl}}).\n\n${SIGN_OFF}`,
    },
    middle: {
      subject: "The habit that makes AI pay off",
      body: `Hi {{firstName}},\n\nThe people who get the most from AI aren't the most technical. They just use it a little, every day.\n\nTry this: each morning, give AI one real task from your list. A draft, a summary, a plan. After two weeks you'll know exactly where it saves you time.\n\n${SIGN_OFF}`,
    },
    last: {
      subject: "Ready to turn your plan into results?",
      body: `Hi {{firstName}},\n\nIf you'd like help putting your AI plan into action, let's talk. On a free call we'll pick the two or three changes that will save you the most time and map out how to make them.\n\n**[Book your free strategy call]({{bookUrl}})**\n\nPrefer to learn on your own? Our [courses]({{coursesUrl}}) walk you through it step by step.\n\n${SIGN_OFF}`,
    },
  },
  call_booked: {
    first: {
      subject: "How to get the most from our call",
      body: `Hi {{firstName}},\n\nYou're booked in. To make our time count, think about these before we talk:\n\n- The one task that eats the most of your week\n- What you've already tried with AI (it's fine if the answer is nothing)\n- What a great result from this call would look like for you\n\nYour confirmation email has the time and how to join.\n\n${SIGN_OFF}`,
    },
    middle: {
      subject: "A quick note before we talk",
      body: `Hi {{firstName}},\n\nLooking forward to our call. If anything comes up, use the link in your confirmation email to reschedule. It only takes a moment.\n\nIf there's something specific you want to cover, reply to this email and we'll come prepared.\n\n${SIGN_OFF}`,
    },
    last: {
      subject: "Three things to bring to our call",
      body: `Hi {{firstName}},\n\nTo get the most from our time together, bring:\n\n1. **One real example** of a task you'd love to hand off to AI\n2. **The tools you use every day** (email, calendar, CRM, spreadsheets)\n3. **Your biggest question** about AI, however basic it seems\n\nIf our call has already happened, thank you. Reply with any follow-up questions.\n\n${SIGN_OFF}`,
    },
  },
  purchase: {
    first: {
      subject: "Welcome aboard — here's how to start",
      body: `Hi {{firstName}},\n\nWelcome! Your course is ready whenever you are.\n\n1. Go to the [student login]({{loginUrl}}) and enter the email you used at checkout.\n2. Click the link we send you. No password needed.\n3. Start with the first lesson. Each lesson has an AI tutor you can ask questions as you go.\n\nReply to this email if anything isn't working.\n\n${SIGN_OFF}`,
    },
    middle: {
      subject: "Quick check-in: how's it going?",
      body: `Hi {{firstName}},\n\nJust checking in. Have you had a chance to start your course?\n\nHere's a tip: block 20 minutes on your calendar, three times this week, and treat them like meetings. Short, regular sessions beat one long weekend binge.\n\n[Pick up where you left off]({{loginUrl}})\n\n${SIGN_OFF}`,
    },
    last: {
      subject: "What did you think so far?",
      body: `Hi {{firstName}},\n\nYou've had the course for a week. We'd love to hear how it's going. What's been most useful, and what's still unclear? Just hit reply. We read every answer.\n\nIf you'd like hands-on help applying it, you can always [book a call]({{bookUrl}}).\n\n${SIGN_OFF}`,
    },
  },
  contact_form: {
    first: {
      subject: "We got your message",
      body: `Hi {{firstName}},\n\nThanks for reaching out. We've received your message and will reply within one business day.\n\nIn the meantime, you might find these useful:\n\n- [Take the free AI assessment]({{assessmentUrl}})\n- [Browse our courses]({{coursesUrl}})\n\n${SIGN_OFF}`,
    },
    middle: {
      subject: "Following up on your message",
      body: `Hi {{firstName}},\n\nJust making sure our reply reached you. If you're still looking for help, reply to this email or [book a time to talk]({{bookUrl}}).\n\n${SIGN_OFF}`,
    },
    last: {
      subject: "Anything else we can help with?",
      body: `Hi {{firstName}},\n\nWe hope we answered your question. If anything else comes up, we're one reply away.\n\n${SIGN_OFF}`,
    },
  },
  manual: {
    first: {
      subject: "A quick note from {{businessName}}",
      body: `Hi {{firstName}},\n\nThanks for being in touch with us. Over the next few emails we'll share practical ways to use AI in your work and life. No jargon, just things you can try the same day.\n\n${SIGN_OFF}`,
    },
    middle: {
      subject: "An AI idea you can use this week",
      body: `Hi {{firstName}},\n\nHere's one to try: before your next meeting, ask AI to turn your notes or the agenda into three questions you want answered. You'll walk in focused and walk out with decisions.\n\n${SIGN_OFF}`,
    },
    last: {
      subject: "Can we help with your next step?",
      body: `Hi {{firstName}},\n\nIf you'd like a hand putting AI to work, [book a free call]({{bookUrl}}) or [explore our courses]({{coursesUrl}}).\n\n${SIGN_OFF}`,
    },
  },
};

/** A ready-to-edit draft for step `index` of `total` when AI isn't available. */
export function fallbackStepDraft(trigger: SequenceTrigger, index: number, total: number): StepDraft {
  const slot: DraftSlot = index <= 0 ? "first" : index >= total - 1 ? "last" : "middle";
  return { ...(FALLBACK_DRAFTS[trigger] ?? FALLBACK_DRAFTS.manual)[slot] };
}

/* ------------------------------------------------------------------ */
/* Email log                                                           */
/* ------------------------------------------------------------------ */

const LAYOUT_BODY = /<td[^>]*class="content"[^>]*>\n?([\s\S]*?)\n?<\/td><\/tr>\s*<tr><td style="padding:20px 32px;border-top/;

/**
 * The inner body of a logged email (the part inside the branded layout), so it can be re-sent
 * without wrapping the layout twice. Fragments without a layout are returned as-is; full
 * documents in an unknown layout return null.
 */
export function extractEmailBody(html: string): string | null {
  const match = html.match(LAYOUT_BODY);
  if (match) return match[1].trim() || null;
  if (/<html[\s>]|<body[\s>]/i.test(html)) return null;
  return html.trim() || null;
}

/* ------------------------------------------------------------------ */
/* Scheduled jobs                                                      */
/* ------------------------------------------------------------------ */

/** Jobs run by /api/cron and "Run automations now", in run order. */
export const JOB_LABELS = {
  automations: "Automation emails sent",
  bookingReminders: "Booking reminders sent",
  stripeCheckouts: "Missed Stripe payments recovered",
  expiredHolds: "Unpaid booking holds released",
  expiredOrders: "Abandoned checkouts expired",
  rateLimits: "Old rate-limit records cleared",
  loginTokens: "Expired login links cleared",
} as const;
export type JobKey = keyof typeof JOB_LABELS;
