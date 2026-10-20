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
 * the assignment. Saving the agent they already have changes nothing.
 */
export async function assignContactAgentAction(_prev: AssignAgentState, fd: FormData): Promise<AssignAgentState> {
  await assertAdmin();
  const contactId = z.uuid().safeParse(String(fd.get("contactId") ?? ""));
  const rawAgent = String(fd.get("agentId") ?? "");
  const agentId = rawAgent ? z.uuid().safeParse(rawAgent) : null;
  if (!contactId.success || (agentId && !agentId.success)) return { error: "Invalid request." };
  const db = await getDb();
  if (agentId?.success) {
    const [agent] = await db.select({ status: schema.salesAgents.status }).from(schema.salesAgents).where(eq(schema.salesAgents.id, agentId.data)).limit(1);
    if (!agent || (agent.status !== "approved" && agent.status !== "paused")) return { error: "That agent isn't on the team." };
  }
  const [current] = await db
    .select({ agentId: schema.agentReferrals.agentId })
    .from(schema.agentReferrals)
    .where(eq(schema.agentReferrals.contactId, contactId.data))
    .limit(1);
  if ((current?.agentId ?? null) === (agentId?.success ? agentId.data : null)) return { ok: true, message: "No change." };
  await assignContactToAgent(contactId.data, agentId?.success ? agentId.data : null);
  revalidatePath(`/admin/contacts/${contactId.data}`);
  if (agentId?.success) revalidatePath(`/admin/sales/${agentId.data}`);
  return { ok: true, message: agentId?.success ? "Assigned." : "Assignment removed." };
}
