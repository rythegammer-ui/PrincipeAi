import "server-only";
import { inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { site } from "@/config/site";

/** Admin-editable settings (stored in the `settings` table, with code defaults). */
export type Settings = {
  businessName: string;
  /** Where new-lead / booking / purchase notifications go. */
  notifyEmail: string;
  /** IANA timezone used to interpret availability rules. */
  timezone: string;
  /** Optional announcement bar text on the marketing site ("" hides it). */
  announcement: string;
  announcementHref: string;
  aiAssistantEnabled: boolean;
  aiAssistantName: string;
  aiAssistantGreeting: string;
  /** Extra instructions appended to the AI assistant's system prompt. */
  aiAssistantInstructions: string;
  /** Send booking reminders this many hours before the meeting. */
  bookingReminderHours: number;
  /** Notify the owner by email on new leads / bookings / purchases. */
  notifyOnLead: boolean;
  notifyOnBooking: boolean;
  notifyOnPurchase: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  businessName: site.name,
  notifyEmail: site.contactEmail,
  timezone: site.timezone,
  announcement: "New: take the free 3-minute AI Readiness Assessment →",
  announcementHref: "/assessment",
  aiAssistantEnabled: true,
  aiAssistantName: "Principe AI Assistant",
  aiAssistantGreeting: "Hi! I'm the Principe AI assistant. Ask me anything about using AI in your life or business — or which course is right for you.",
  aiAssistantInstructions: "",
  bookingReminderHours: 24,
  notifyOnLead: true,
  notifyOnBooking: true,
  notifyOnPurchase: true,
};

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.select().from(schema.settings);
  const out: Settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in DEFAULT_SETTINGS) {
      (out as Record<string, unknown>)[row.key] = row.value;
    }
  }
  return out;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const db = await getDb();
  const entries = Object.entries(patch).filter(([k]) => k in DEFAULT_SETTINGS);
  if (!entries.length) return;
  await db.delete(schema.settings).where(inArray(schema.settings.key, entries.map(([k]) => k)));
  await db.insert(schema.settings).values(entries.map(([key, value]) => ({ key, value, updatedAt: new Date() })));
}
