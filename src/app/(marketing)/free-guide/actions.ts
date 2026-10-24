"use server";

import { redirect } from "next/navigation";
import { OPT_IN_PLACEMENTS, type LeadFormState, type OptInPlacement } from "@/components/marketing/lead-options";
import { captureGuideOptIn, fieldErrorsOf, grantGuideAccess, isSpam, optInSchema, readFields } from "@/lib/leads";
import { rateLimitByIp } from "@/lib/rate-limit";
import { followUpConsentFrom } from "@/lib/sales/referrals";

// agentFollowUp: the optional "OK for <agent> to follow up" box, echoed back so it stays ticked after an error.
const FIELDS = ["name", "email", "interest", "agentFollowUp"] as const;
export type OptInField = (typeof FIELDS)[number];
export type OptInState = LeadFormState<OptInField>;

const PLACEMENT_PATH: Record<OptInPlacement, string> = {
  "free-guide": "/free-guide",
  guide: "/guide",
  home: "/",
};

/**
 * Starter Kit opt-in: validate → rate limit → capture lead (+ kit link email) → unlock /guide → thank-you page.
 * `sent=0` tells the next page no link email went out, so it doesn't promise one.
 */
export async function optInAction(_prev: OptInState, formData: FormData): Promise<OptInState> {
  const values = readFields(formData, FIELDS);
  const rawPlacement = String(formData.get("placement") ?? "");
  const placement: OptInPlacement = (OPT_IN_PLACEMENTS as readonly string[]).includes(rawPlacement) ? (rawPlacement as OptInPlacement) : "free-guide";
  // Visitors who opt in from inside the guide go straight back to it.
  const next = placement === "guide" ? "/guide?welcome=1" : "/free-guide/thank-you";

  if (isSpam(formData)) redirect(next);

  const parsed = optInSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error, FIELDS), values };

  const limit = await rateLimitByIp("optin", 8, 10 * 60);
  if (!limit.ok) return { error: "Too many attempts. Please wait a few minutes and try again.", values };

  let emailed: boolean;
  try {
    ({ emailed } = await captureGuideOptIn(parsed.data, PLACEMENT_PATH[placement], { agentFollowUpConsent: followUpConsentFrom(formData) }));
  } catch (err) {
    console.error("[leads] opt-in failed", err);
    return { error: "Something went wrong on our side. Please try again in a moment.", values };
  }
  await grantGuideAccess();
  redirect(emailed ? next : `${next}${next.includes("?") ? "&" : "?"}sent=0`);
}
