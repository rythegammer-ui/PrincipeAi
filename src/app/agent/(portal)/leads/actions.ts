"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { SalesAgent } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { currentAgent } from "@/lib/sales/agents";
import { OUTREACH_CHANNELS, writeOutreach, type OutreachChannel } from "@/lib/sales/outreach";
import { placeDetails, placesErrorMessage, searchPlaces, type PlaceDetails, type PlaceResult } from "@/lib/sales/places";
import {
  addProspect,
  claimStatesForPlaces,
  getProspect,
  prospectInputSchema,
  prospectLink,
  prospectUpdateSchema,
  touchProspect,
  updateProspect,
  type AddProspectResult,
  type PlaceClaimState,
} from "@/lib/sales/prospects";

/**
 * Agent portal → Leads. Only approved agents can search, add and write messages (a paused agent's links don't earn,
 * so outreach waits). Every action checks the signed-in agent itself and only ever touches their own prospects.
 */

const PAUSED = "Your agent account is paused, so prospecting is on hold until it's active again.";

async function outreachAgent(): Promise<SalesAgent & { code: string }> {
  const agent = await currentAgent();
  if (!agent) redirect("/agent/login");
  if (agent.status !== "approved" || !agent.code) throw new Error(PAUSED);
  return agent as SalesAgent & { code: string };
}

/** Runs `fn` for an approved agent, turning the paused case into a friendly error. */
async function asAgent<T extends { error?: string }>(fn: (agent: SalesAgent & { code: string }) => Promise<T>): Promise<T> {
  let agent: SalesAgent & { code: string };
  try {
    agent = await outreachAgent();
  } catch (err) {
    if (err instanceof Error && err.message === PAUSED) return { error: PAUSED } as T;
    throw err;
  }
  return fn(agent);
}

const str = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
};

// ------------------------------------------------------------------------------------------------- Google search

export type SearchResultView = PlaceResult & { claim: PlaceClaimState };
export type SearchState = { results?: SearchResultView[]; error?: string; what?: string; where?: string };

const searchSchema = z.object({
  what: z.string().trim().min(2, "What kind of business? For example: dentists.").max(80),
  where: z.string().trim().min(2, "Where? For example: Tampa, FL.").max(120),
});

export async function searchBusinessesAction(_prev: SearchState, formData: FormData): Promise<SearchState> {
  return asAgent(async (agent) => {
    const what = str(formData, "what");
    const where = str(formData, "where");
    const parsed = searchSchema.safeParse({ what, where });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message, what, where };
    const res = await searchPlaces(agent.id, parsed.data.what, parsed.data.where);
    if (!res.ok) return { error: placesErrorMessage(res.error), what, where };
    const states = await claimStatesForPlaces(agent.id, res.data.map((r) => r.placeId));
    return {
      what,
      where,
      results: res.data.map((r) => ({ ...r, claim: states.get(r.placeId) ?? "available" })),
    };
  });
}

export type AddState = { error?: string; result?: AddProspectResult["status"]; prospectId?: string };

const ADD_MESSAGES: Record<Exclude<AddProspectResult["status"], "added" | "already_yours">, string> = {
  claimed: "Another agent is already working with this business.",
  do_not_contact: "This business asked not to be contacted.",
  limit: "You have the maximum number of active prospects. Mark some as not interested, or finish with them, first.",
};

async function add(agent: SalesAgent, values: Record<string, string>): Promise<AddState> {
  const limit = await rateLimit(`agent-prospect-add:${agent.id}`, 60, 24 * 60 * 60);
  if (!limit.ok) return { error: "You've added a lot of businesses today. Please try again tomorrow." };
  const parsed = prospectInputSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the details." };
  const res = await addProspect(agent, parsed.data);
  if (res.status === "added" || res.status === "already_yours") {
    revalidatePath("/agent/leads");
    return { result: res.status, prospectId: res.prospect.id };
  }
  return { result: res.status, error: ADD_MESSAGES[res.status] };
}

/** "Add to my prospects" on a search result: the place ID, the name and what/where the agent searched. */
export async function addFromSearchAction(_prev: AddState, formData: FormData): Promise<AddState> {
  return asAgent((agent) =>
    add(agent, {
      placeId: str(formData, "placeId"),
      name: str(formData, "name").slice(0, 200),
      category: str(formData, "what"),
      area: str(formData, "where"),
    }),
  );
}

export type ManualAddState = AddState & { values?: Record<string, string> };

const MANUAL_FIELDS = ["name", "category", "area", "website", "phone", "email", "notes"] as const;

export async function addManualProspectAction(_prev: ManualAddState, formData: FormData): Promise<ManualAddState> {
  const values = Object.fromEntries(MANUAL_FIELDS.map((k) => [k, str(formData, k)]));
  const state = await asAgent((agent) => add(agent, values));
  if (state.prospectId && state.result === "added") redirect(`/agent/leads/${state.prospectId}`);
  if (state.prospectId && state.result === "already_yours") return { ...state, error: "This business is already in your prospects.", values };
  return { ...state, values };
}

// ------------------------------------------------------------------------------------------------- one prospect

export type UpdateState = { ok?: boolean; error?: string };

export async function updateProspectAction(_prev: UpdateState, formData: FormData): Promise<UpdateState> {
  return asAgent(async (agent) => {
    const id = str(formData, "id");
    const limit = await rateLimit(`agent-prospect-update:${agent.id}`, 300, 60 * 60);
    if (!limit.ok) return { error: "Too many changes in a short time. Please try again later." };
    const raw: Record<string, string | undefined> = {};
    for (const key of ["status", "notes", "nextFollowUp", "website", "phone", "email"]) {
      if (formData.has(key)) raw[key] = str(formData, key);
    }
    if (raw.status === "") delete raw.status;
    const parsed = prospectUpdateSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the details." };
    const res = await updateProspect(agent.id, id, parsed.data);
    if (res === "not_found") return { error: "That prospect isn't in your list any more." };
    if (res === "locked") return { error: "This business asked not to be contacted. Only an admin can change that." };
    if (res === "taken") return { error: "Another agent is already working with the business at that website." };
    revalidatePath("/agent/leads");
    revalidatePath(`/agent/leads/${id}`);
    return { ok: true };
  });
}

export type MessageState = { error?: string; subject?: string | null; body?: string; ai?: boolean; channel?: OutreachChannel };

const channelSchema = z.enum(OUTREACH_CHANNELS.map((c) => c.value) as [OutreachChannel, ...OutreachChannel[]]);

/** Writes a one-to-one message for the prospect. The agent copies and sends it themselves. */
export async function writeMessageAction(_prev: MessageState, formData: FormData): Promise<MessageState> {
  return asAgent(async (agent) => {
    const channel = channelSchema.safeParse(str(formData, "channel"));
    if (!channel.success) return { error: "Choose how you'll reach out." };
    const prospect = await getProspect(agent.id, str(formData, "id"));
    if (!prospect) return { error: "That prospect isn't in your list any more." };
    if (prospect.status === "do_not_contact") return { error: "This business asked not to be contacted." };
    const limit = await rateLimit(`agent-outreach:${agent.id}`, 40, 24 * 60 * 60);
    if (!limit.ok) return { error: "You've written a lot of messages today. Please try again tomorrow." };
    const message = await writeOutreach({
      channel: channel.data,
      agentName: agent.name,
      businessName: prospect.name,
      category: prospect.category,
      area: prospect.area,
      notes: prospect.notes,
      link: prospectLink(agent.code, prospect.linkToken),
    });
    await touchProspect(agent.id, prospect.id);
    return { ...message, channel: channel.data };
  });
}

export type DetailsState = { error?: string; details?: PlaceDetails };

/** The Google listing's address, website and phone, fetched when the agent asks (Google's terms: not stored). */
export async function placeDetailsAction(_prev: DetailsState, formData: FormData): Promise<DetailsState> {
  return asAgent(async (agent) => {
    const prospect = await getProspect(agent.id, str(formData, "id"));
    if (!prospect?.placeId) return { error: "This business wasn't added from Google search." };
    const res = await placeDetails(agent.id, prospect.placeId);
    return res.ok ? { details: res.data } : { error: placesErrorMessage(res.error) };
  });
}
