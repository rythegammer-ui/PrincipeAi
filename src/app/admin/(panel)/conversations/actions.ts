"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { assertAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { generateConversationInsights, type StoredInsights } from "./insights";

export type InsightsResult = { ok: true; insights: StoredInsights } | { ok: false; error: string };

/** Admin: (re)generate the "AI insights" summary across recent assistant conversations. */
export async function generateInsightsAction(): Promise<InsightsResult> {
  const session = await assertAdmin();
  const limit = await rateLimit(`ai-insights:${session.email}`, 12, 60 * 60);
  if (!limit.ok) return { ok: false, error: "You've refreshed the insights a lot this hour. Please try again a little later." };
  try {
    const insights = await generateConversationInsights();
    if (!insights) return { ok: false, error: "There are no visitor conversations to analyze yet." };
    revalidatePath("/admin/conversations");
    return { ok: true, insights };
  } catch (err) {
    console.error("[conversations] insights failed", err);
    return { ok: false, error: "Couldn't analyze the conversations. Please try again." };
  }
}

/** Admin: permanently delete a conversation (e.g. on a privacy request). */
export async function deleteConversationAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const db = await getDb();
  await db.delete(schema.chatConversations).where(eq(schema.chatConversations.id, id.data));
  revalidatePath("/admin/conversations");
  redirect("/admin/conversations?deleted=1");
}
