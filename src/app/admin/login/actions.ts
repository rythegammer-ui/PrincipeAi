"use server";

import { redirect } from "next/navigation";
import { activeAdminMember, checkAdminCredentials, createLoginToken, endAdminSession, isAdminRedirect, startAdminSession } from "@/lib/auth";
import { notifyOwner, sendEmail } from "@/lib/email";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { adminCredentials } from "@/lib/runtime-mode";
import { site } from "@/config/site";
import { absoluteUrl, isValidEmail, normalizeEmail, safeRedirectPath } from "@/lib/utils";

export type LoginState = { error?: string };

/** Failed sign-ins per hour, across every address, before the owner is alerted and replies slow down. */
const ACCOUNT_FAILURE_BUDGET = 30;
const OVER_BUDGET_DELAY_MS = 1500;

export async function adminLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""), "/admin");
  if (!next.startsWith("/admin")) return { error: "Invalid redirect." };

  const limit = await rateLimitByIp("admin-login", 10, 15 * 60);
  if (!limit.ok) return { error: "Too many attempts. Please wait 15 minutes and try again." };

  if (!checkAdminCredentials(email, password)) {
    // There is one admin account, so also count failures account-wide (guessing spread over many
    // addresses). Over budget, alert the owner once and slow replies down rather than locking the
    // account, which would let an attacker keep the owner out.
    const failures = await rateLimit("admin-login:fail", ACCOUNT_FAILURE_BUDGET, 60 * 60);
    if (failures.count === ACCOUNT_FAILURE_BUDGET + 1) {
      await notifyOwner(
        "Repeated failed admin sign-ins",
        `More than ${ACCOUNT_FAILURE_BUDGET} sign-in attempts to your admin dashboard have failed in the last hour.\n\n` +
          "If this wasn't you, make sure `ADMIN_PASSWORD` is long and unique. Changing it in Vercel (then redeploying) also signs out every admin session.",
      ).catch((err) => console.error("[admin-login] failed to notify owner", err));
    }
    if (!failures.ok) await new Promise((resolve) => setTimeout(resolve, OVER_BUDGET_DELAY_MS));
    return { error: "Incorrect email or password." };
  }
  await startAdminSession(email);
  redirect(next);
}

export type TeamLinkState = { sent?: boolean; email?: string; error?: string; devLink?: string };

/**
 * Admin team members (Admin → Team) sign in with a one-time link to their email. Always reports success, so the form
 * doesn't reveal who is on the team.
 */
export async function requestAdminLinkAction(_prev: TeamLinkState, formData: FormData): Promise<TeamLinkState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const next = safeRedirectPath(String(formData.get("next") ?? ""), "/admin");
  if (!isValidEmail(email)) return { error: "Please enter a valid email address." };
  if (!adminCredentials()) return { error: "Admin login isn't configured yet." };

  const ipLimit = await rateLimitByIp("admin-link", 10, 15 * 60);
  const emailLimit = await rateLimit(`admin-link:${email}`, 5, 15 * 60);
  if (!ipLimit.ok || !emailLimit.ok) return { error: "Too many requests. Please wait a few minutes and try again." };

  const member = await activeAdminMember(email);
  if (!member) return { sent: true, email };
  const token = await createLoginToken(member.email, isAdminRedirect(next) ? next : "/admin");
  const link = absoluteUrl(`/auth/verify?token=${encodeURIComponent(token)}&for=admin`);
  await sendEmail({
    to: member.email,
    subject: `Your ${site.name} admin sign-in link`,
    kind: "magic_link",
    markdown: `Click below to sign in to the ${site.name} admin dashboard. This link expires in 30 minutes and can only be used once.\n\n**[Sign in to the dashboard →](${link})**\n\nIf you didn't request this, you can safely ignore this email.`,
  });
  // Local development only: on any deployed server (a demo included) showing it would let anyone sign in as a team
  // member. Without email there, the owner creates a link for them in Admin → Admin Team.
  const showDevLink = !process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production";
  return { sent: true, email, devLink: showDevLink ? link : undefined };
}

export async function adminLogoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}
