"use server";

import { redirect } from "next/navigation";
import { createLoginToken, consumeLoginToken, endStudentSession, isAdminRedirect, startStudentSession, startTeamAdminSession } from "@/lib/auth";
import { logActivity, recomputeScore } from "@/lib/crm";
import { sendEmail } from "@/lib/email";
import { isDemoMode } from "@/lib/runtime-mode";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { absoluteUrl, isValidEmail, normalizeEmail, safeRedirectPath } from "@/lib/utils";

export type MagicLinkState = { sent?: boolean; error?: string; devLink?: string; email?: string };

/** Emails a one-time sign-in link. Always reports success to avoid revealing which emails exist. */
export async function requestMagicLinkAction(_prev: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const next = safeRedirectPath(String(formData.get("next") ?? ""), "/learn");
  if (!isValidEmail(email)) return { error: "Please enter a valid email address." };

  const ipLimit = await rateLimitByIp("magic-link", 10, 15 * 60);
  const emailLimit = await rateLimit(`magic-link:${email}`, 5, 15 * 60);
  if (!ipLimit.ok || !emailLimit.ok) return { error: "Too many requests. Please wait a few minutes and try again." };

  const token = await createLoginToken(email, next.startsWith("/learn") ? next : "/learn");
  const link = absoluteUrl(`/auth/verify?token=${encodeURIComponent(token)}`);
  await sendEmail({
    to: email,
    subject: "Your sign-in link",
    kind: "magic_link",
    markdown: `Click below to sign in to your courses. This link expires in 30 minutes and can only be used once.\n\n**[Sign in to Principe AI →](${link})**\n\nIf you didn't request this, you can safely ignore this email.`,
  });

  const showDevLink = !process.env.RESEND_API_KEY && (process.env.NODE_ENV !== "production" || isDemoMode());
  return { sent: true, email, devLink: showDevLink ? link : undefined };
}

export type VerifyState = { error?: string };

/**
 * Consumes the magic-link token (POST, so email link scanners can't burn it) and starts a session: an admin team
 * member's for a link into /admin, otherwise a student's (sales agents use the student session for /agent).
 */
export async function verifyMagicLinkAction(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const token = String(formData.get("token") ?? "");
  const result = await consumeLoginToken(token);
  if (!result) return { error: "This sign-in link is invalid or has expired. Request a new one below." };
  if (result.kind === "admin") {
    await startTeamAdminSession(result.member);
    const to = safeRedirectPath(result.redirectTo, "/admin");
    redirect(isAdminRedirect(to) ? to : "/admin");
  }
  await startStudentSession(result.user);
  // A sales agent signing in to /agent isn't a student logging in: no timeline entry or lead-score bump.
  if (result.user.contactId && !result.redirectTo.startsWith("/agent")) {
    await logActivity(result.user.contactId, "login", "Signed in to the student portal").catch(() => {});
    // Logins count toward the lead score: keep the stored score in step with the timeline.
    await recomputeScore(result.user.contactId).catch(() => {});
  }
  redirect(safeRedirectPath(result.redirectTo, "/learn"));
}

export async function studentLogoutAction() {
  await endStudentSession();
  redirect("/login");
}
