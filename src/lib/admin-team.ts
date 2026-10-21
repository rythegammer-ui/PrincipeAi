import "server-only";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { AdminMember } from "@/db/schema";
import { site } from "@/config/site";
import { notifyOwner, sendEmail } from "@/lib/email";
import { createLoginToken } from "@/lib/auth";
import { adminCredentials } from "@/lib/runtime-mode";
import { absoluteUrl, isValidEmail, normalizeEmail } from "@/lib/utils";

/**
 * The admin team: the owner (ADMIN_EMAIL / ADMIN_PASSWORD, from the environment) plus the members in admin_members,
 * who sign in with an emailed link and have the same access as the owner. Any admin can add or remove members; the
 * owner can't be removed (their login lives in Vercel).
 */

export type TeamMemberError = "invalid-email" | "owner" | "already-member";

/** The owner's login email (ADMIN_EMAIL), or null when admin login isn't configured. */
export function ownerEmail(): string | null {
  return adminCredentials()?.email ?? null;
}

/** Members who can sign in, oldest first. */
export async function listAdminMembers(): Promise<AdminMember[]> {
  const db = await getDb();
  return db.select().from(schema.adminMembers).where(isNull(schema.adminMembers.removedAt)).orderBy(asc(schema.adminMembers.createdAt));
}

/**
 * Adds someone to the admin team (or brings back a removed member) and emails them how to sign in.
 * Returns the member, or why they couldn't be added.
 */
export async function addAdminMember(input: {
  email: string;
  name?: string | null;
  addedBy: string;
  invite?: boolean;
}): Promise<{ ok: true; member: AdminMember } | { ok: false; error: TeamMemberError }> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) return { ok: false, error: "invalid-email" };
  if (email === ownerEmail()) return { ok: false, error: "owner" };
  const name = input.name?.trim().slice(0, 120) || null;
  const db = await getDb();
  const [created] = await db
    .insert(schema.adminMembers)
    .values({ email, name, addedBy: input.addedBy })
    .onConflictDoNothing({ target: schema.adminMembers.email })
    .returning();
  let member = created;
  if (!member) {
    // Removed earlier: bring them back (their old sessions stay ended: the version was bumped on removal).
    const [restored] = await db
      .update(schema.adminMembers)
      .set({ removedAt: null, addedBy: input.addedBy, ...(name ? { name } : {}) })
      .where(and(eq(schema.adminMembers.email, email), sql`${schema.adminMembers.removedAt} is not null`))
      .returning();
    if (!restored) return { ok: false, error: "already-member" };
    member = restored;
  }
  if (input.invite !== false) await sendAdminInvite(member, input.addedBy).catch((err) => console.error("[admin-team] invite email failed", err));
  return { ok: true, member };
}

/** Removes a member: they're signed out everywhere at once (their session version changes). */
export async function removeAdminMember(id: string): Promise<AdminMember | null> {
  const db = await getDb();
  const [member] = await db
    .update(schema.adminMembers)
    .set({ removedAt: new Date(), sessionVersion: sql`${schema.adminMembers.sessionVersion} + 1` })
    .where(and(eq(schema.adminMembers.id, id), isNull(schema.adminMembers.removedAt)))
    .returning();
  return member ?? null;
}

/**
 * A one-time sign-in link for a member (30 minutes, single use), for the owner to pass on when email isn't working.
 * Callers must check the signed-in admin is the owner: anyone holding the link signs in as that member.
 */
export async function createTeamSignInLink(memberId: string): Promise<string | null> {
  const db = await getDb();
  const [member] = await db
    .select({ email: schema.adminMembers.email })
    .from(schema.adminMembers)
    .where(and(eq(schema.adminMembers.id, memberId), isNull(schema.adminMembers.removedAt)))
    .limit(1);
  if (!member) return null;
  const token = await createLoginToken(member.email, "/admin");
  return absoluteUrl(`/auth/verify?token=${encodeURIComponent(token)}&for=admin`);
}

async function sendAdminInvite(member: AdminMember, addedBy: string): Promise<void> {
  const loginUrl = absoluteUrl("/admin/login");
  await sendEmail({
    to: member.email,
    subject: `You've been added to the ${site.name} admin team`,
    kind: "admin_invite",
    markdown: [
      `Hi${member.name ? ` ${member.name.split(/\s+/)[0]}` : ""},`,
      `${addedBy} added you to the **${site.name}** admin dashboard, with full access: contacts, orders, courses, automations and the sales team.`,
      `To sign in, open the dashboard and choose **Email me a sign-in link** under *Team member?*. No password needed: each link works once, for 30 minutes.`,
      `**[Open the admin dashboard →](${loginUrl})**`,
      `If you weren't expecting this, you can ignore this email.`,
    ].join("\n\n"),
  });
}

/**
 * Sends an alert to the owner (Settings → notification email) and every admin team member, e.g. a new sales-agent
 * application, so whoever is free can act on it.
 */
export async function notifyAdminTeam(subject: string, markdown: string, opts: { replyTo?: string | null } = {}): Promise<void> {
  await notifyOwner(subject, markdown, opts).catch((err) => console.error("[admin-team] owner notification failed", err));
  const { getSettings } = await import("@/lib/settings");
  const ownerInbox = normalizeEmail((await getSettings()).notifyEmail || "");
  for (const member of await listAdminMembers()) {
    if (member.email === ownerInbox) continue;
    await sendEmail({ to: member.email, subject: `[${site.name}] ${subject}`, markdown, kind: "notification", replyTo: opts.replyTo || undefined }).catch((err) =>
      console.error("[admin-team] team notification failed", member.email, err),
    );
  }
}
