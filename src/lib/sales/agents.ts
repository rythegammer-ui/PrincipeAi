import "server-only";
import { and, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import type { AgentStatus, SalesAgent } from "@/db/schema";
import { notifyAdminTeam } from "@/lib/admin-team";
import { getStudent } from "@/lib/auth";
import { agentLoginUrl, dashboardLink, emailAgent, programName } from "@/lib/sales/emails";
import { AGENT_CODE_RE, formatRate, normalizeAgentCode, suggestAgentCode } from "@/lib/sales/game";
import { EXPERIENCE_OPTIONS, HOURS_OPTIONS, optionLabel, PAYOUT_METHODS, US_STATE_CODES } from "@/lib/sales/options";
import { getSalesProgram } from "@/lib/sales/program";
import { absoluteUrl, escapeMarkdown, isValidEmail, normalizeEmail } from "@/lib/utils";

/** Applying, approval, status changes and the signed-in agent. */

const line = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);

export const agentApplicationSchema = z.object({
  name: line(120).min(2, "Please enter your full name."),
  email: z.string().trim().toLowerCase().max(254).refine(isValidEmail, "Please enter a valid email address."),
  phone: line(40).min(7, "Please enter a phone number we can reach you on."),
  city: line(80).min(2, "Please enter your city."),
  state: z.string().refine((v) => US_STATE_CODES.includes(v), "Please choose your state."),
  experience: z.enum(EXPERIENCE_OPTIONS.map((o) => o.value) as [string, ...string[]], { message: "Please choose one." }),
  hours: z.enum(HOURS_OPTIONS.map((o) => o.value) as [string, ...string[]], { message: "Please choose one." }),
  channels: line(1500).min(10, "Tell us a little about how you'd find customers."),
  why: line(1500).optional().default(""),
  agree: z.literal("yes", { message: "Please confirm you've read and agree to the program terms." }),
  adult: z.literal("yes", { message: "You must be 18 or older and live in the US to join." }),
});
export type AgentApplication = z.infer<typeof agentApplicationSchema>;

/**
 * Records an application (or updates a pending or rejected one) and alerts the admin team. An address that's already
 * on the team is left as it is. Callers report success either way, so the form never reveals who is an agent.
 */
export async function submitAgentApplication(input: AgentApplication): Promise<"created" | "updated" | "unchanged"> {
  const db = await getDb();
  const email = normalizeEmail(input.email);
  const application = {
    experience: input.experience,
    hours: input.hours,
    channels: input.channels,
    why: input.why ?? "",
    agreedAt: new Date().toISOString(),
  };
  const values = { name: input.name.trim(), phone: input.phone.trim(), city: input.city.trim(), state: input.state, application };
  const [created] = await db
    .insert(schema.salesAgents)
    .values({ email, ...values, status: "applied" })
    .onConflictDoNothing({ target: schema.salesAgents.email })
    .returning();
  let agent = created;
  let outcome: "created" | "updated" | "unchanged" = "created";
  if (!agent) {
    const [updated] = await db
      .update(schema.salesAgents)
      .set({ ...values, status: "applied" })
      .where(and(eq(schema.salesAgents.email, email), inArray(schema.salesAgents.status, ["applied", "rejected"])))
      .returning();
    if (!updated) return "unchanged";
    agent = updated;
    outcome = "updated";
  }

  await emailAgent(agent, `We got your application to the ${programName()}`, [
    "Thanks for applying to sell with us! We read every application ourselves and usually reply within 2 business days.",
    "Once you're approved you'll get your own referral link and access to your agent dashboard, with your sales, commissions, level and the team leaderboard.",
    `Questions in the meantime? Just reply to this email.`,
  ]);
  const where = [agent.city, agent.state].filter(Boolean).join(", ");
  await notifyAdminTeam(
    `New sales agent application: ${agent.name}${where ? ` (${where})` : ""}`,
    [
      `**${escapeMarkdown(agent.name)}** applied to join the sales team${outcome === "updated" ? " (again)" : ""}.`,
      `- Email: ${escapeMarkdown(agent.email)}`,
      agent.phone ? `- Phone: ${escapeMarkdown(agent.phone)}` : "",
      where ? `- Location: ${escapeMarkdown(where)}` : "",
      `- Experience: ${escapeMarkdown(optionLabel(EXPERIENCE_OPTIONS, application.experience))}`,
      `- Time: ${escapeMarkdown(optionLabel(HOURS_OPTIONS, application.hours))}`,
      `**How they'd find customers:**\n\n${escapeMarkdown(application.channels)}`,
      application.why ? `**Why they want to join:**\n\n${escapeMarkdown(application.why)}` : "",
      `**[Review the application →](${absoluteUrl(`/admin/sales/${agent.id}`)})**`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    { replyTo: agent.email },
  );
  return outcome;
}

/** A referral code nobody else has, from the requested one or the agent's name. */
async function uniqueCode(agent: Pick<SalesAgent, "id" | "name">, wanted?: string | null): Promise<string> {
  const db = await getDb();
  const taken = async (code: string) =>
    (await db.select({ id: schema.salesAgents.id }).from(schema.salesAgents).where(and(eq(schema.salesAgents.code, code), ne(schema.salesAgents.id, agent.id))).limit(1))
      .length > 0;
  const requested = normalizeAgentCode(wanted);
  if (requested && !(await taken(requested))) return requested;
  for (let i = 0; i < 50; i++) {
    const code = suggestAgentCode(agent.name);
    if (!(await taken(code))) return code;
  }
  return `AGENT${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export type AgentLinks = { home: string; short: string; courses: string };

/** The links an agent shares (all carry their code). */
export function agentLinks(code: string): AgentLinks {
  return {
    home: absoluteUrl(`/?ref=${code}`),
    short: absoluteUrl(`/r/${code}`),
    courses: absoluteUrl(`/courses?ref=${code}`),
  };
}

/** Approves an applicant (or re-activates a paused agent): gives them a referral code and emails them their links. */
export async function approveAgent(id: string, by: string): Promise<SalesAgent | null> {
  const db = await getDb();
  const [agent] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.id, id)).limit(1);
  if (!agent || agent.status === "approved") return agent ?? null;
  const code = agent.code ?? (await uniqueCode(agent));
  const firstApproval = !agent.approvedAt;
  const [approved] = await db
    .update(schema.salesAgents)
    .set({ status: "approved", code, reviewedBy: by, reviewedAt: new Date(), approvedAt: agent.approvedAt ?? new Date() })
    .where(and(eq(schema.salesAgents.id, id), ne(schema.salesAgents.status, "approved")))
    .returning();
  if (!approved) return null;
  const program = await getSalesProgram();
  const links = agentLinks(code);
  const [first, ...rest] = program.levels;
  await emailAgent(
    approved,
    firstApproval ? `You're on the ${programName()}!` : "Your agent account is active again",
    firstApproval
      ? [
          "Welcome aboard! Your application is approved and your agent account is live.",
          `**Your referral code: ${code}**\n\nYour link: ${links.short}\n\nAnyone who comes to the site through your link (or any page with \`?ref=${code}\`) and buys a course within ${program.attributionDays} days is your customer.`,
          `**How you earn:** ${formatRate(first.rateBps)} of every course sale to start${rest.length ? `, rising to ${rest.map((l) => `${formatRate(l.rateBps)} at ${l.name} (${l.minSales}+ sales a month)`).join(" and ")}` : ""}. Reach a level and you keep it through the end of next month.`,
          `**Sign in to your dashboard** at ${agentLoginUrl()} with this email address. You'll find your links, scripts, the leaderboard and your earnings there. Add how you'd like to be paid (PayPal, Venmo, Zelle…) in your profile.`,
          "Before you start, please read the do's and don'ts in your dashboard's toolkit: always say you earn a commission, never promise results or income, and only message people who'd welcome it.",
        ]
      : ["Your agent account is active again, and your referral link is earning commission.", `Your link: ${links.short}`, dashboardLink()],
  );
  return approved;
}

/** Declines an application. */
export async function rejectAgent(id: string, by: string, opts: { notify: boolean }): Promise<SalesAgent | null> {
  const db = await getDb();
  const [agent] = await db
    .update(schema.salesAgents)
    .set({ status: "rejected", reviewedBy: by, reviewedAt: new Date() })
    .where(and(eq(schema.salesAgents.id, id), eq(schema.salesAgents.status, "applied")))
    .returning();
  if (agent && opts.notify) {
    await emailAgent(agent, `Your application to the ${programName()}`, [
      "Thank you for applying to join our sales team. We're not able to offer you a place right now.",
      "We really appreciate your interest, and we wish you all the best.",
    ]);
  }
  return agent ?? null;
}

/**
 * Pauses (links stop earning), resumes, or removes an agent. Money already owed stays owed: pay it from their page.
 */
export async function setAgentStatus(id: string, status: Extract<AgentStatus, "paused" | "removed">, by: string): Promise<SalesAgent | null> {
  const db = await getDb();
  const [agent] = await db
    .update(schema.salesAgents)
    .set({ status, reviewedBy: by, reviewedAt: new Date() })
    .where(and(eq(schema.salesAgents.id, id), inArray(schema.salesAgents.status, status === "paused" ? ["approved"] : ["approved", "paused"])))
    .returning();
  if (!agent) return null;
  await emailAgent(
    agent,
    status === "paused" ? "Your agent account is paused" : "Your agent account has been closed",
    status === "paused"
      ? [
          "Your agent account is paused for now: your referral link won't earn commission on new sales until it's turned back on.",
          "Anything you've already earned is still yours and will be paid as usual. Reply to this email if you have questions.",
        ]
      : [
          "Your agent account has been closed, so your referral link no longer earns commission.",
          "Anything you've already earned and are owed will still be paid. Reply to this email if you have questions.",
        ],
  );
  return agent;
}

/** Changes an agent's referral code. Old links stop working, so only do it for a good reason. */
export async function setAgentCode(id: string, raw: string): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const code = normalizeAgentCode(raw);
  if (!code || !AGENT_CODE_RE.test(code)) return { ok: false, error: "Use 4–16 letters and digits." };
  const db = await getDb();
  const [clash] = await db
    .select({ id: schema.salesAgents.id })
    .from(schema.salesAgents)
    .where(and(eq(schema.salesAgents.code, code), ne(schema.salesAgents.id, id)))
    .limit(1);
  if (clash) return { ok: false, error: "Another agent already has that code." };
  await db.update(schema.salesAgents).set({ code }).where(eq(schema.salesAgents.id, id));
  return { ok: true, code };
}

export const agentProfileSchema = z.object({
  phone: line(40).optional().default(""),
  payoutMethod: z.union([z.enum(PAYOUT_METHODS.map((o) => o.value) as [string, ...string[]]), z.literal("")]),
  payoutHandle: line(120).optional().default(""),
  showOnLeaderboard: z.boolean(),
});

/** The agent's own profile: how to pay them, and whether they appear on the leaderboard. */
export async function updateAgentProfile(agentId: string, input: z.infer<typeof agentProfileSchema>): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.salesAgents)
    .set({
      ...(input.phone ? { phone: input.phone } : {}),
      payoutMethod: input.payoutMethod || null,
      payoutHandle: input.payoutHandle || null,
      showOnLeaderboard: input.showOnLeaderboard,
    })
    .where(eq(schema.salesAgents.id, agentId));
}

/** Statuses that can open the agent portal (a paused agent still sees their earnings). */
export const PORTAL_STATUSES: readonly AgentStatus[] = ["approved", "paused"];

/** The signed-in sales agent (student session + an approved or paused agent with that email), or null. */
export async function currentAgent(): Promise<SalesAgent | null> {
  const user = await getStudent();
  if (!user) return null;
  const db = await getDb();
  const [agent] = await db
    .select()
    .from(schema.salesAgents)
    .where(and(eq(schema.salesAgents.email, normalizeEmail(user.email)), inArray(schema.salesAgents.status, [...PORTAL_STATUSES])))
    .limit(1);
  return agent ?? null;
}

/** "Austin, TX" */
export function agentLocation(agent: Pick<SalesAgent, "city" | "state">): string {
  return [agent.city, agent.state].filter(Boolean).join(", ");
}
