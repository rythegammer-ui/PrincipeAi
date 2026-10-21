"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { assertAdmin } from "@/lib/auth";
import { assignContactToAgent } from "@/lib/sales/referrals";

export type AssignAgentState = { ok?: boolean; error?: string; message?: string };

/**
 * Assigns a contact to a sales agent until an admin changes it (their purchases earn that agent commission), or removes
 * the assignment. Saving the agent they already have changes nothing; `permanent=1` (the "Assign to this agent until
 * changed" button) turns that agent's link claim, which would run out, into an assignment.
 */
export async function assignContactAgentAction(_prev: AssignAgentState, fd: FormData): Promise<AssignAgentState> {
  await assertAdmin();
  const contactId = z.uuid().safeParse(String(fd.get("contactId") ?? ""));
  const rawAgent = String(fd.get("agentId") ?? "");
  const agentId = rawAgent ? z.uuid().safeParse(rawAgent) : null;
  if (!contactId.success || (agentId && !agentId.success)) return { error: "Invalid request." };
  const selected = agentId?.success ? agentId.data : null;
  const permanent = fd.get("permanent") === "1";
  const db = await getDb();
  const [current] = await db
    .select({ agentId: schema.agentReferrals.agentId, source: schema.agentReferrals.source })
    .from(schema.agentReferrals)
    .where(eq(schema.agentReferrals.contactId, contactId.data))
    .limit(1);
  // The "assign until changed" button only ever converts the link claim it was shown for: if the customer has moved to
  // another agent since the page loaded, it must not hand them back.
  if (permanent && (!selected || current?.agentId !== selected || current.source !== "link")) {
    return current?.agentId === selected && current?.source === "manual"
      ? { ok: true, message: "Already assigned to this agent until an admin changes it." }
      : { error: "This customer's agent has changed since the page loaded. Reload the page and check." };
  }
  // Before the agent check: the current agent may have been removed since, and saving unchanged must not drop them.
  if ((current?.agentId ?? null) === selected && !permanent) {
    return { ok: true, message: "No change." };
  }
  if (selected) {
    const [agent] = await db.select({ status: schema.salesAgents.status }).from(schema.salesAgents).where(eq(schema.salesAgents.id, selected)).limit(1);
    if (!agent || (agent.status !== "approved" && agent.status !== "paused")) return { error: "That agent isn't on the team." };
  }
  await assignContactToAgent(contactId.data, selected, { permanent });
  revalidatePath(`/admin/contacts/${contactId.data}`);
  if (selected) revalidatePath(`/admin/sales/${selected}`);
  if (current?.agentId && current.agentId !== selected) revalidatePath(`/admin/sales/${current.agentId}`);
  if (permanent && current?.agentId === selected) return { ok: true, message: "Now assigned to this agent until an admin changes it." };
  return { ok: true, message: selected ? "Assigned." : "Assignment removed." };
}
