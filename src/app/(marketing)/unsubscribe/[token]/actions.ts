"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setMarketingSubscription } from "@/lib/crm";
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

  // Same update, automation stop, timeline entry and score refresh as the List-Unsubscribe one-click endpoint.
  const result = await setMarketingSubscription(parsed.data.token, parsed.data.intent === "resubscribe", "unsubscribe_link");
  if (!result) return { error: "This link isn't valid. Please use the link from your most recent email." };
  revalidatePath(`/unsubscribe/${parsed.data.token}`);
  return { ok: true };
}
