"use server";

import type { LeadFormState } from "@/components/marketing/lead-options";
import { captureContactMessage, contactSchema, fieldErrorsOf, isSpam, readFields } from "@/lib/leads";
import { rateLimitByIp } from "@/lib/rate-limit";
import { firstName } from "@/lib/utils";

const FIELDS = ["name", "email", "topic", "message"] as const;
export type ContactField = (typeof FIELDS)[number];
export type ContactState = LeadFormState<ContactField>;

/** Contact form: validate → rate limit → capture lead + reply task → success state. */
export async function sendContactMessageAction(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = readFields(formData, FIELDS);
  if (isSpam(formData)) return { ok: true, firstName: firstName(values.name) };

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error, FIELDS), values };

  const limit = await rateLimitByIp("contact", 5, 15 * 60);
  if (!limit.ok) return { error: "Too many messages in a short time. Please wait a few minutes, or email us directly.", values };

  try {
    await captureContactMessage(parsed.data);
  } catch (err) {
    console.error("[leads] contact form failed", err);
    return { error: "Your message couldn't be sent just now. Please try again, or email us directly.", values };
  }
  return { ok: true, firstName: firstName(parsed.data.name) };
}
