/**
 * Pure CRM helpers shared by server pages, client components, the demo seed and unit tests.
 * No server-only imports and no runtime dependency on drizzle, so it is safe in the browser bundle.
 */
import type { ActivityType, Stage } from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Pipeline stages                                                     */
/* ------------------------------------------------------------------ */

export type StageTone = "neutral" | "brand" | "gold" | "green" | "red" | "blue" | "amber";

/** Mirrors STAGES / STAGE_LABELS in db/schema.ts (Record<Stage, …> keeps it exhaustive). */
export const STAGE_META: Record<Stage, { label: string; tone: StageTone; hint: string }> = {
  new: { label: "New Lead", tone: "neutral", hint: "Opted in, not yet engaged" },
  engaged: { label: "Engaged", tone: "blue", hint: "Took the assessment, chatted or started checkout" },
  qualified: { label: "Qualified", tone: "brand", hint: "Clear need, budget or timeline" },
  call_booked: { label: "Call Booked", tone: "gold", hint: "Has a call on the calendar" },
  proposal: { label: "Proposal Sent", tone: "amber", hint: "Waiting on a decision" },
  customer: { label: "Customer", tone: "green", hint: "Bought a course or service" },
  lost: { label: "Lost", tone: "red", hint: "Not moving forward for now" },
};

/** Funnel order (lost last). */
export const STAGE_ORDER = ["new", "engaged", "qualified", "call_booked", "proposal", "customer", "lost"] as const satisfies readonly Stage[];
export const OPEN_STAGES = ["new", "engaged", "qualified", "call_booked", "proposal"] as const satisfies readonly Stage[];

export function isStageValue(value: unknown): value is Stage {
  return typeof value === "string" && (STAGE_ORDER as readonly string[]).includes(value);
}

export function stageLabel(stage: string): string {
  return isStageValue(stage) ? STAGE_META[stage].label : stage.replace(/_/g, " ");
}

/* ------------------------------------------------------------------ */
/* Sources, segments, labels                                           */
/* ------------------------------------------------------------------ */

export const SOURCE_LABELS: Record<string, string> = {
  lead_magnet: "Free guide",
  assessment: "AI assessment",
  booking: "Booking",
  chat: "AI chat",
  checkout: "Checkout",
  contact_form: "Contact form",
  application: "Application",
  manual: "Added manually",
};

export function sourceLabel(source: string | null | undefined): string {
  if (!source) return "Unknown";
  return SOURCE_LABELS[source] ?? titleCase(source);
}

export const SEGMENTS = ["life", "business", "both"] as const;
export type Segment = (typeof SEGMENTS)[number];
export const SEGMENT_LABELS: Record<Segment, string> = { life: "Personal use", business: "Business", both: "Life + business" };

export function segmentLabel(segment: string | null | undefined): string {
  if (!segment) return "Not set";
  return (SEGMENT_LABELS as Record<string, string>)[segment] ?? titleCase(segment);
}

export function utmSourceLabel(source: string | null | undefined): string {
  const s = source?.trim();
  if (!s || s === "direct") return "Direct / none";
  return s.length <= 3 ? s.toUpperCase() : s.charAt(0).toUpperCase() + s.slice(1);
}

export function titleCase(value: string): string {
  const s = value.replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "ai-for-business" → "AI For Business" (keeps "AI" upper-case). */
export function humanizeSlug(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => (/^ai$/i.test(w) ? "AI" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function displayName(c: { name?: string | null; email: string }): string {
  return c.name?.trim() || c.email;
}

/** Returns an http(s) URL for a user-entered website, or null when it isn't a safe link. */
export function safeWebsiteUrl(website: string | null | undefined): string | null {
  const raw = website?.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Parses a dollar amount typed by an admin ("1,500", "$997.50") into integer cents. */
export function parseDollarsToCents(input: string | null | undefined): number | null {
  const cleaned = (input ?? "").replace(/[$,\s]/g, "");
  if (cleaned === "") return 0;
  if (!/^\d{1,9}(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/** Follow-up email goals offered in the contact composer (see lib/ai-crm.ts). */
export const FOLLOW_UP_PURPOSES = {
  next_step: "Best next step",
  book_call: "Invite to a strategy call",
  call_prep: "Before our call",
  after_call: "Recap after a call",
  proposal: "Proposal follow-up",
  reengage: "Re-engage a quiet lead",
  customer_checkin: "Customer check-in",
} as const;
export type FollowUpPurpose = keyof typeof FOLLOW_UP_PURPOSES;

/* ------------------------------------------------------------------ */
/* Lead score explanation                                              */
/* ------------------------------------------------------------------ */

/**
 * Lead-score rules: the single source of truth for recomputeScore() in src/lib/crm.ts,
 * the score explanation on contact pages, and the demo seed.
 */
export const SCORE_RULES: Partial<Record<ActivityType, { points: number; max: number; label: string }>> = {
  optin: { points: 10, max: 10, label: "Downloaded the free guide" },
  quiz_completed: { points: 15, max: 15, label: "Completed the AI assessment" },
  form: { points: 10, max: 15, label: "Submitted a form" },
  chat: { points: 5, max: 10, label: "Chatted with the AI assistant" },
  booking_created: { points: 25, max: 30, label: "Booked a call" },
  purchase: { points: 30, max: 40, label: "Made a purchase" },
  login: { points: 3, max: 6, label: "Logged in to the course portal" },
  lesson_completed: { points: 2, max: 10, label: "Completed lessons" },
};

export type ScoreItem = { label: string; points: number };

export function scoreBreakdown(
  profile: { name?: string | null; phone?: string | null; company?: string | null; unsubscribed?: boolean | null },
  activities: { type: string; meta?: unknown }[],
): { total: number; items: ScoreItem[] } {
  const items: ScoreItem[] = [];
  if (profile.name) items.push({ label: "Name on file", points: 3 });
  if (profile.phone) items.push({ label: "Phone number on file", points: 5 });
  if (profile.company) items.push({ label: "Company on file", points: 5 });
  const totals = new Map<ActivityType, number>();
  let boost = 0;
  for (const a of activities) {
    const type = a.type as ActivityType;
    const rule = SCORE_RULES[type];
    if (rule) totals.set(type, Math.min(rule.max, (totals.get(type) ?? 0) + rule.points));
    if (type === "quiz_completed") {
      const raw = Number((a.meta as Record<string, unknown> | null | undefined)?.scoreBoost ?? 0);
      if (Number.isFinite(raw)) boost = Math.max(boost, Math.min(20, raw));
    }
  }
  for (const [type, points] of totals) items.push({ label: SCORE_RULES[type]?.label ?? type, points });
  if (boost > 0) items.push({ label: "Buying intent from the assessment", points: boost });
  if (profile.unsubscribed) items.push({ label: "Unsubscribed from emails", points: -10 });
  const raw = items.reduce((s, i) => s + i.points, 0);
  return { total: Math.max(0, Math.min(100, raw)), items };
}

export function scoreTone(score: number): "hot" | "warm" | "cool" {
  if (score >= 60) return "hot";
  if (score >= 30) return "warm";
  return "cool";
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Escapes one CSV cell (RFC 4180) and neutralises spreadsheet formula injection: text starting
 * with = + - @ (or a tab / carriage return) is prefixed with a single quote so Excel, Sheets and
 * Numbers treat it as text. Numbers are written as-is.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "true" : "false";
  let s: string;
  if (value instanceof Date) s = value.toISOString();
  else if (Array.isArray(value)) s = value.map((v) => String(v)).join("; ");
  else s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/* ------------------------------------------------------------------ */
/* Activity meta → short human-readable details                        */
/* ------------------------------------------------------------------ */

const HIDDEN_META_KEYS = new Set([
  "auto",
  "by",
  "step",
  "scoreBoost",
  "sequenceId",
  "bookingId",
  "orderId",
  "courseId",
  "submissionId",
  "conversationId",
  "meetingType",
  "utm",
  "token",
  "kind",
  "status",
]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Short "key: value" details for a timeline entry (plain text only). */
export function activityDetails(type: string, meta: Record<string, unknown> | null | undefined, tz = "UTC"): string[] {
  if (!meta) return [];
  const out: string[] = [];
  if (type === "stage_changed" && typeof meta.from === "string" && typeof meta.to === "string") {
    out.push(`${stageLabel(meta.from)} → ${stageLabel(meta.to)}${meta.auto ? " (automatic)" : ""}`);
    return out;
  }
  for (const [key, value] of Object.entries(meta)) {
    if (HIDDEN_META_KEYS.has(key) || value === null || value === undefined || value === "") continue;
    if (key === "from" || key === "to") continue;
    let text: string;
    if (typeof value === "string") text = value;
    else if (typeof value === "number" || typeof value === "boolean") text = String(value);
    else continue;
    if (key === "amountCents" && typeof value === "number") {
      out.push(`Amount: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100)}`);
      continue;
    }
    if (key === "source") text = sourceLabel(text);
    if (ISO_DATE.test(text) && !Number.isNaN(Date.parse(text))) {
      text = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(new Date(text));
    }
    out.push(`${titleCase(key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase())}: ${text.length > 120 ? `${text.slice(0, 119)}…` : text}`);
    if (out.length >= 4) break;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Tasks (server → client serialisation)                               */
/* ------------------------------------------------------------------ */

export type TaskBucket = "overdue" | "today" | "upcoming" | "none" | "done";

export type TaskItemData = {
  id: string;
  title: string;
  description: string | null;
  /** ISO string */
  dueAt: string | null;
  priority: "low" | "normal" | "high";
  origin: string;
  completedAt: string | null;
  contactId: string | null;
  contactName: string | null;
  contactEmail: string | null;
};

export function toTaskItem(t: Omit<TaskItemData, "dueAt" | "completedAt"> & { dueAt: Date | null; completedAt: Date | null }): TaskItemData {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    dueAt: t.dueAt?.toISOString() ?? null,
    priority: t.priority,
    origin: t.origin,
    completedAt: t.completedAt?.toISOString() ?? null,
    contactId: t.contactId,
    contactName: t.contactName,
    contactEmail: t.contactEmail,
  };
}
