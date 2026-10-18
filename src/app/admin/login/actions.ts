"use server";

import { redirect } from "next/navigation";
import { checkAdminCredentials, endAdminSession, startAdminSession } from "@/lib/auth";
import { rateLimitByIp } from "@/lib/rate-limit";
import { safeRedirectPath } from "@/lib/utils";

export type LoginState = { error?: string };

export async function adminLoginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? ""), "/admin");
  if (!next.startsWith("/admin")) return { error: "Invalid redirect." };

  const limit = await rateLimitByIp("admin-login", 10, 15 * 60);
  if (!limit.ok) return { error: "Too many attempts. Please wait 15 minutes and try again." };

  if (!checkAdminCredentials(email, password)) {
    return { error: "Incorrect email or password." };
  }
  await startAdminSession(email);
  redirect(next);
}

export async function adminLogoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}
