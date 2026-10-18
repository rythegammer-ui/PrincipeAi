"use server";

import { redirect } from "next/navigation";
import type { LeadFormState } from "@/components/marketing/lead-options";
import { applicationSchema, captureApplication, fieldErrorsOf, isSpam, readFields } from "@/lib/leads";
import { rateLimitByIp } from "@/lib/rate-limit";
import { getActiveMeetingType } from "@/lib/scheduling";
import { firstName } from "@/lib/utils";

const FIELDS = ["name", "email", "company", "website", "teamSize", "goals", "budget", "timeline"] as const;
export type ApplicationField = (typeof FIELDS)[number];
export type ApplicationState = LeadFormState<ApplicationField>;

const DISCOVERY_SLUG = "implementation-discovery";

/**
 * Implementation application: validate → rate limit → qualified lead + follow-up task →
 * straight to booking the discovery call (name + email prefilled).
 */
export async function applyForImplementationAction(_prev: ApplicationState, formData: FormData): Promise<ApplicationState> {
  const values = readFields(formData, FIELDS);
  if (isSpam(formData)) return { ok: true, firstName: firstName(values.name) };

  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error, FIELDS), values };

  const limit = await rateLimitByIp("application", 5, 30 * 60);
  if (!limit.ok) return { error: "Too many attempts. Please wait a little while and try again, or email us directly.", values };

  try {
    await captureApplication(parsed.data);
  } catch (err) {
    console.error("[leads] application failed", err);
    return { error: "Something went wrong on our side. Please try again in a moment.", values };
  }

  const discovery = await getActiveMeetingType(DISCOVERY_SLUG).catch(() => null);
  if (!discovery) {
    // Booking is switched off for this call type: confirm on the page instead.
    return { ok: true, firstName: firstName(parsed.data.name) };
  }
  const query = new URLSearchParams({ name: parsed.data.name, email: parsed.data.email });
  redirect(`/book/${DISCOVERY_SLUG}?${query.toString()}`);
}
