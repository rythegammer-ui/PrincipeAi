"use server";

import type { LeadFormState } from "@/components/marketing/lead-options";
import { fieldErrorsOf, isSpam } from "@/lib/leads";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { agentApplicationSchema, submitAgentApplication } from "@/lib/sales/agents";
import { getSalesProgram } from "@/lib/sales/program";
import { firstName } from "@/lib/utils";

const FIELDS = ["name", "email", "phone", "city", "state", "experience", "hours", "channels", "why", "agree", "adult"] as const;
export type SalesApplyField = (typeof FIELDS)[number];
export type SalesApplyState = LeadFormState<SalesApplyField>;

function readValues(formData: FormData): Record<SalesApplyField, string> {
  const out = {} as Record<SalesApplyField, string>;
  for (const key of FIELDS) {
    const v = formData.get(key);
    out[key] = typeof v === "string" ? v.trim().slice(0, 2000) : "";
  }
  return out;
}

/**
 * Sales-team application: validate → rate limit → saved for review + the admin team alerted. Always ends in the same
 * success state, whether or not the address was already on the team (the form never reveals who is an agent).
 */
export async function applyToSalesTeamAction(_prev: SalesApplyState, formData: FormData): Promise<SalesApplyState> {
  const values = readValues(formData);
  if (isSpam(formData)) return { ok: true, firstName: firstName(values.name) };

  const parsed = agentApplicationSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error, FIELDS), values };

  const program = await getSalesProgram();
  if (!program.applicationsOpen) return { error: "Applications are closed for now. Please check back soon.", values };

  const limit = await rateLimitByIp("sales-apply", 5, 60 * 60);
  // Per address too, so nobody can keep re-sending applications (and the emails they trigger) for someone else's email.
  if (!limit.ok) return { error: "Too many applications from your connection. Please wait a little while and try again.", values };
  const emailLimit = await rateLimit(`sales-apply:${parsed.data.email}`, 5, 24 * 60 * 60);
  if (!emailLimit.ok) return { error: "We've already received several applications for this email address today. If you need to change yours, just email us.", values };

  try {
    await submitAgentApplication(parsed.data);
  } catch (err) {
    console.error("[sales] application failed", err);
    return { error: "Something went wrong on our side. Please try again in a moment.", values };
  }
  return { ok: true, firstName: firstName(parsed.data.name) };
}
