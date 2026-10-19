"use server";

import { redirect } from "next/navigation";
import { checkAdminCredentials, endAdminSession, startAdminSession } from "@/lib/auth";
import { notifyOwner } from "@/lib/email";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { safeRedirectPath } from "@/lib/utils";

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

export async function adminLogoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}
