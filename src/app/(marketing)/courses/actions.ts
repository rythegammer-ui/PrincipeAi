"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { emailHasCourse } from "@/lib/courses";
import { CheckoutError, createCheckout } from "@/lib/payments";
import { rateLimitByIp } from "@/lib/rate-limit";

export type EnrollState = {
  error?: string;
  fieldErrors?: { email?: string; name?: string };
  /** The email already has access — show a sign-in link instead. */
  alreadyOwned?: boolean;
  values?: { email: string; name: string };
};

const enrollSchema = z.object({
  courseId: z.uuid(),
  email: z.email({ error: "Please enter a valid email address." }).max(254),
  name: z.string().trim().min(1, { error: "Please tell us your name." }).max(120, { error: "That name is a little long." }),
});

/** Sales-page enroll form → pending order → Stripe Checkout (or the built-in test checkout). */
export async function startCourseCheckoutAction(_prev: EnrollState, formData: FormData): Promise<EnrollState> {
  const raw = {
    courseId: String(formData.get("courseId") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    name: String(formData.get("name") ?? ""),
  };
  const values = { email: raw.email, name: raw.name };
  const parsed = enrollSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: EnrollState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if ((key === "email" || key === "name") && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Object.keys(fieldErrors).length
      ? { fieldErrors, values }
      : { error: "Something went wrong. Please refresh the page and try again.", values };
  }

  const limit = await rateLimitByIp("course-checkout", 10, 10 * 60);
  if (!limit.ok) return { error: "Too many attempts. Please wait a few minutes and try again.", values };

  const { courseId, email, name } = parsed.data;
  if (await emailHasCourse(email, courseId)) {
    return { alreadyOwned: true, values };
  }

  let url: string;
  try {
    ({ url } = await createCheckout({ itemType: "course", courseId, email, name }));
  } catch (err) {
    if (err instanceof CheckoutError) return { error: err.message, values };
    console.error("[courses] checkout failed", err);
    const notConfigured = err instanceof Error && err.message === "Payments are not configured";
    return {
      error: notConfigured
        ? "Online checkout isn't available right now. Please contact us and we'll get you enrolled."
        : "We couldn't start checkout. Please try again in a moment.",
      values,
    };
  }
  redirect(url);
}
