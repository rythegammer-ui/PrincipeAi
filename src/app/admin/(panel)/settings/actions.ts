"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { EmailStatus } from "@/db/schema";
import { site } from "@/config/site";
import { assertAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { runScheduledJobs, type JobsSummary } from "@/lib/jobs";
import { rateLimit } from "@/lib/rate-limit";
import { getSettings, updateSettings, type Settings } from "@/lib/settings";
import { isValidEmail, normalizeEmail } from "@/lib/utils";
import { isSupportedTimezone } from "./timezones";

export type SettingsFormState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string | undefined>;
  values?: Record<string, string>;
};

const TEXT_KEYS = [
  "businessName",
  "timezone",
  "notifyEmail",
  "aiAssistantName",
  "aiAssistantGreeting",
  "aiAssistantInstructions",
  "announcement",
  "announcementHref",
  "bookingReminderHours",
] as const;
const BOOL_KEYS = ["notifyOnLead", "notifyOnBooking", "notifyOnPurchase", "aiAssistantEnabled"] as const;

function isSafeHref(value: string): boolean {
  if (value.startsWith("/")) return !value.startsWith("//") && !value.startsWith("/\\");
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const SettingsSchema = z
  .object({
    businessName: z.string().trim().min(1, "Enter your business name.").max(80, "Keep it under 80 characters."),
    timezone: z.string().refine(isSupportedTimezone, "Choose a timezone from the list."),
    notifyEmail: z
      .string()
      .trim()
      .max(254, "Email is too long.")
      .refine((v) => v === "" || isValidEmail(v), "Enter a valid email address, or leave it blank to turn notifications off.")
      .transform((v) => (v ? normalizeEmail(v) : "")),
    notifyOnLead: z.boolean(),
    notifyOnBooking: z.boolean(),
    notifyOnPurchase: z.boolean(),
    aiAssistantEnabled: z.boolean(),
    aiAssistantName: z.string().trim().min(1, "Give your assistant a name.").max(60, "Keep the name under 60 characters."),
    aiAssistantGreeting: z.string().trim().min(1, "Write a short greeting.").max(400, "Keep the greeting under 400 characters."),
    aiAssistantInstructions: z.string().trim().max(4000, "Keep instructions under 4,000 characters."),
    announcement: z.string().trim().max(160, "Keep the announcement under 160 characters."),
    announcementHref: z
      .string()
      .trim()
      .max(300, "Link is too long.")
      .refine((v) => v === "" || isSafeHref(v), "Use a page path like /assessment or a full https:// link."),
    bookingReminderHours: z.coerce
      .number({ message: "Enter a number of hours." })
      .int("Use whole hours.")
      .min(1, "Send reminders at least 1 hour before.")
      .max(336, "The longest reminder window is 336 hours (14 days)."),
  })
  .superRefine((v, ctx) => {
    if (v.announcement && !v.announcementHref) ctx.addIssue({ code: "custom", path: ["announcementHref"], message: "Add where the announcement should link to." });
  });

export async function updateSettingsAction(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await assertAdmin();
  const text = Object.fromEntries(TEXT_KEYS.map((k) => [k, String(formData.get(k) ?? "")])) as Record<(typeof TEXT_KEYS)[number], string>;
  const bools = Object.fromEntries(BOOL_KEYS.map((k) => [k, formData.get(k) === "on"])) as Record<(typeof BOOL_KEYS)[number], boolean>;
  const values = { ...text, ...Object.fromEntries(BOOL_KEYS.map((k) => [k, bools[k] ? "on" : ""])) };
  const parsed = SettingsSchema.safeParse({ ...text, ...bools });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { error: "Please fix the highlighted fields.", fieldErrors, values };
  }
  const patch: Settings = parsed.data;
  await updateSettings(patch);
  // Announcement bar + assistant settings appear across the whole site.
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved.", values };
}

export type TestEmailResult = { ok: true; to: string; status: EmailStatus } | { ok: false; error: string };

/** Sends a test email to the notification address. */
export async function sendTestEmailAction(): Promise<TestEmailResult> {
  const session = await assertAdmin();
  const limit = await rateLimit(`admin-settings-test:${session.email}`, 5, 600);
  if (!limit.ok) return { ok: false, error: "That's a few tests already. Please wait a few minutes." };
  const settings = await getSettings();
  const to = settings.notifyEmail || session.email;
  const result = await sendEmail({
    to,
    subject: `Test email from ${settings.businessName || site.name}`,
    markdown: [
      "Hi there,",
      `This is a test from your **${settings.businessName || site.name}** dashboard. If you're reading it in your inbox, email delivery is working.`,
      "Automation emails, booking confirmations, receipts and login links all go out the same way.",
      "Nothing else to do. You can delete this email.",
    ].join("\n\n"),
    kind: "test",
  });
  if (result.status === "failed") return { ok: false, error: "The email provider rejected the test. Open the Email Log to see the error." };
  return { ok: true, to, status: result.status };
}

export type RunJobsResult = { ok: true; summary: JobsSummary } | { ok: false; error: string };

/** Runs the same scheduled jobs as the cron endpoint, right now. */
export async function runJobsNowAction(): Promise<RunJobsResult> {
  const session = await assertAdmin();
  const limit = await rateLimit(`admin-run-jobs:${session.email}`, 10, 600);
  if (!limit.ok) return { ok: false, error: "You've run the jobs several times just now. Please wait a few minutes." };
  const summary = await runScheduledJobs();
  revalidatePath("/admin", "layout");
  return { ok: true, summary };
}
