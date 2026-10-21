import "server-only";
import type { SalesAgent } from "@/db/schema";
import { site } from "@/config/site";
import { emailBusinessName, sendEmail } from "@/lib/email";
import { absoluteUrl, escapeMarkdown, firstName } from "@/lib/utils";

/** Emails to sales agents (kind "agent", logged in Admin → Email Log like every email). Never throws. */
export async function emailAgent(agent: Pick<SalesAgent, "email" | "name">, subject: string, paragraphs: (string | false | null | undefined)[]): Promise<void> {
  try {
    const business = await emailBusinessName();
    await sendEmail({
      to: agent.email,
      subject,
      kind: "agent",
      markdown: [`Hi ${escapeMarkdown(firstName(agent.name, agent.email))},`, ...paragraphs.filter(Boolean), `— The ${escapeMarkdown(business)} team`].join("\n\n"),
    });
  } catch (err) {
    console.error("[sales] agent email failed", agent.email, subject, err);
  }
}

export const dashboardLink = () => `**[Open your agent dashboard →](${absoluteUrl("/agent")})**`;
export const agentLoginUrl = () => absoluteUrl("/agent/login");
export const programName = () => `${site.name} Sales Team`;
