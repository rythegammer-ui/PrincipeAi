"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { stopAutomations } from "@/lib/automations";
import { logActivity, recomputeScore } from "@/lib/crm";
import { rateLimitByIp } from "@/lib/rate-limit";

export type UnsubscribeState = { ok?: boolean; error?: string };

const Input = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
  intent: z.enum(["unsubscribe", "resubscribe"]),
});

/** Unsubscribes (or resubscribes) the contact behind a one-click token. Never runs on GET. */
export async function setSubscriptionAction(_prev: UnsubscribeState, formData: FormData): Promise<UnsubscribeState> {
  const parsed = Input.safeParse({ token: formData.get("token"), intent: formData.get("intent") });
  if (!parsed.success) return { error: "This link isn't valid. Please use the link from your most recent email." };
  const limit = await rateLimitByIp("unsubscribe", 20, 10 * 60);
  if (!limit.ok) return { error: "Too many requests. Please wait a few minutes and try again." };

  const db = await getDb();
  const c = schema.contacts;
  const [contact] = await db.select({ id: c.id, unsubscribed: c.unsubscribed }).from(c).where(eq(c.unsubscribeToken, parsed.data.token)).limit(1);
  if (!contact) return { error: "This link isn't valid. Please use the link from your most recent email." };

  const unsubscribe = parsed.data.intent === "unsubscribe";
  if (contact.unsubscribed !== unsubscribe) {
    await db.update(c).set({ unsubscribed: unsubscribe }).where(eq(c.id, contact.id));
    if (unsubscribe) await stopAutomations(contact.id);
    await logActivity(contact.id, "note", unsubscribe ? "Unsubscribed from marketing emails" : "Resubscribed to marketing emails", {
      meta: { via: "unsubscribe_link", unsubscribed: unsubscribe },
    });
    await recomputeScore(contact.id);
  }
  revalidatePath(`/unsubscribe/${parsed.data.token}`);
  return { ok: true };
}
