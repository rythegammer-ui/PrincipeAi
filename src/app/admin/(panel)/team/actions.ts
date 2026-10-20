"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addAdminMember, createTeamSignInLink, removeAdminMember } from "@/lib/admin-team";
import { assertAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type TeamFormState = { ok?: boolean; error?: string; message?: string };

const ADD_ERRORS = {
  "invalid-email": "Please enter a valid email address.",
  owner: "That's the owner's login (ADMIN_EMAIL), which already has full access.",
  "already-member": "They're already on the admin team.",
} as const;

const addSchema = z.object({ email: z.string().trim().max(254), name: z.string().trim().max(120) });

/** Adds someone to the admin team with full access and emails them how to sign in. */
export async function addTeamMemberAction(_prev: TeamFormState, fd: FormData): Promise<TeamFormState> {
  const session = await assertAdmin();
  const parsed = addSchema.safeParse({ email: String(fd.get("email") ?? ""), name: String(fd.get("name") ?? "") });
  if (!parsed.success) return { error: "Please check the email and name." };
  const limit = await rateLimit(`admin-team:${session.email}`, 20, 600);
  if (!limit.ok) return { error: "Too many changes in a short time. Please wait a few minutes." };
  const result = await addAdminMember({ email: parsed.data.email, name: parsed.data.name || null, addedBy: session.email });
  revalidatePath("/admin/team");
  if (!result.ok) return { error: ADD_ERRORS[result.error] };
  return { ok: true, message: `${result.member.email} was added. We emailed them how to sign in.` };
}

/** Removes a team member: they're signed out everywhere at once. */
export async function removeTeamMemberAction(_prev: TeamFormState, fd: FormData): Promise<TeamFormState> {
  const session = await assertAdmin();
  const id = z.uuid().safeParse(String(fd.get("memberId") ?? ""));
  if (!id.success) return { error: "Invalid request." };
  if (session.teamVersion !== undefined && session.sub === id.data) return { error: "You can't remove yourself. Ask another admin to." };
  const member = await removeAdminMember(id.data);
  revalidatePath("/admin/team");
  if (!member) return { error: "They're no longer on the team." };
  return { ok: true, message: `${member.email} was removed and signed out.` };
}

export type SignInLinkState = { error?: string; link?: string };

/**
 * Owner only: a one-time sign-in link for a team member, to pass on privately when email isn't set up. Team members
 * can't make one (it would let any admin sign in as another).
 */
export async function createSignInLinkAction(_prev: SignInLinkState, fd: FormData): Promise<SignInLinkState> {
  const session = await assertAdmin();
  if (session.teamVersion !== undefined) return { error: "Only the owner can create sign-in links." };
  const id = z.uuid().safeParse(String(fd.get("memberId") ?? ""));
  if (!id.success) return { error: "Invalid request." };
  const limit = await rateLimit(`admin-team-link:${session.email}`, 20, 600);
  if (!limit.ok) return { error: "Too many links in a short time. Please wait a few minutes." };
  const link = await createTeamSignInLink(id.data);
  if (!link) return { error: "They're no longer on the team." };
  return { link };
}
