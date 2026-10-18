import "server-only";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { aiText } from "@/lib/ai";
import { buildInsightsDigest, buildInsightsSystemPrompt } from "@/lib/ai-prompts";
import { buildInsightsFallback } from "@/lib/chat-fallback";

/** Stored in the key/value `settings` table (getSettings() ignores unknown keys). */
const INSIGHTS_KEY = "aiConversationInsights";
/** How many recent assistant conversations the analysis covers. */
export const INSIGHTS_SAMPLE = 50;

const StoredInsightsSchema = z.object({
  markdown: z.string(),
  generatedAt: z.string(),
  source: z.enum(["ai", "rules"]),
  conversations: z.number().int().nonnegative(),
});
export type StoredInsights = z.infer<typeof StoredInsightsSchema>;

export async function readStoredInsights(): Promise<StoredInsights | null> {
  const db = await getDb();
  const [row] = await db.select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, INSIGHTS_KEY)).limit(1);
  const parsed = StoredInsightsSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : null;
}

/**
 * Summarizes the most common questions, objections, content ideas and FAQ gaps across the
 * last 50 assistant conversations — with Claude when configured, otherwise by keyword frequency.
 * Returns null when there are no visitor messages to analyze.
 */
export async function generateConversationInsights(): Promise<StoredInsights | null> {
  const db = await getDb();
  const t = schema.chatConversations;
  const [rows, courses] = await Promise.all([
    db
      .select({ path: t.path, messages: t.messages })
      .from(t)
      .where(eq(t.kind, "assistant"))
      .orderBy(desc(t.updatedAt))
      .limit(INSIGHTS_SAMPLE),
    db.select({ faqs: schema.courses.faqs }).from(schema.courses).where(eq(schema.courses.published, true)),
  ]);
  const conversations = rows.filter((r) => r.messages.some((m) => m.role === "user" && m.content.trim()));
  if (!conversations.length) return null;

  const faqs = courses.flatMap((course) => course.faqs.map((f) => f.q));
  const ai = await aiText({
    system: buildInsightsSystemPrompt(),
    messages: [{ role: "user", content: buildInsightsDigest(conversations, faqs) }],
    effort: "medium",
    maxTokens: 8000,
  });

  const insights: StoredInsights = {
    markdown: ai ?? buildInsightsFallback(conversations),
    generatedAt: new Date().toISOString(),
    source: ai ? "ai" : "rules",
    conversations: conversations.length,
  };
  await db
    .insert(schema.settings)
    .values({ key: INSIGHTS_KEY, value: insights, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: insights, updatedAt: new Date() } });
  return insights;
}
