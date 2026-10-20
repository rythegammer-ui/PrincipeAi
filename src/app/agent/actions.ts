"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { site } from "@/config/site";
import { createLoginToken, endStudentSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { rateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { isDemoMode } from "@/lib/runtime-mode";
import { agentProfileSchema, currentAgent, PORTAL_STATUSES, updateAgentProfile } from "@/lib/sales/agents";
import { absoluteUrl, isValidEmail, normalizeEmail } from "@/lib/utils";

export type AgentLinkState = { sent?: boolean; error?: string; devLink?: string; email?: string };

/**
 * Emails a sales agent a one-time sign-in link to /agent. Always reports success, so the form never reveals who is on
 * the team; only agents who can open the portal (approved or paused) get an email.
 */
export async function requestAgentLinkAction(_prev: AgentLinkState, formData: FormData): Promise<AgentLinkState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) return { error: "Please enter a valid email address." };

  const ipLimit = await rateLimitByIp("agent-link", 10, 15 * 60);
  const emailLimit = await rateLimit(`agent-link:${email}`, 5, 15 * 60);
  if (!ipLimit.ok || !emailLimit.ok) return { error: "Too many requests. Please wait a few minutes and try again." };

  const db = await getDb();
  const [agent] = await db
    .select({ email: schema.salesAgents.email })
    .from(schema.salesAgents)
    .where(and(eq(schema.salesAgents.email, email), inArray(schema.salesAgents.status, [...PORTAL_STATUSES])))
    .limit(1);
  if (!agent) return { sent: true, email };

  const token = await createLoginToken(agent.email, "/agent");
  const link = absoluteUrl(`/auth/verify?token=${encodeURIComponent(token)}&for=agent`);
  await sendEmail({
    to: agent.email,
    subject: `Your ${site.name} agent dashboard sign-in link`,
    kind: "magic_link",
    markdown: `Click below to sign in to your sales agent dashboard. This link expires in 30 minutes and can only be used once.\n\n**[Sign in to my dashboard →](${link})**\n\nIf you didn't request this, you can safely ignore this email.`,
  });

  const showDevLink = !process.env.RESEND_API_KEY && (process.env.NODE_ENV !== "production" || isDemoMode());
  return { sent: true, email, devLink: showDevLink ? link : undefined };
}

export async function agentLogoutAction() {
  await endStudentSession();
  redirect("/agent/login");
}

export type AgentProfileState = { ok?: boolean; error?: string };

/** The signed-in agent's own profile: payout details, phone, and whether they show on the leaderboard. */
export async function updateAgentProfileAction(_prev: AgentProfileState, formData: FormData): Promise<AgentProfileState> {
  const agent = await currentAgent();
  if (!agent) redirect("/agent/login");
  const parsed = agentProfileSchema.safeParse({
    phone: String(formData.get("phone") ?? ""),
    payoutMethod: String(formData.get("payoutMethod") ?? ""),
    payoutHandle: String(formData.get("payoutHandle") ?? ""),
    showOnLeaderboard: formData.get("showOnLeaderboard") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details and try again." };
  if (parsed.data.payoutMethod && !parsed.data.payoutHandle) return { error: "Add the account, handle or email we should send your payouts to." };

  const limit = await rateLimit(`agent-profile:${agent.id}`, 20, 60 * 60);
  if (!limit.ok) return { error: "Too many changes in a short time. Please try again later." };

  await updateAgentProfile(agent.id, parsed.data);
  revalidatePath("/agent");
  return { ok: true };
}
