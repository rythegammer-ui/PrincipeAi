import { KeyRound, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { Avatar, PageHeader } from "@/components/ui/misc";
import { listAdminMembers, ownerEmail } from "@/lib/admin-team";
import { requireAdmin } from "@/lib/auth";
import { getBusinessTimezone } from "@/lib/scheduling";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ActionForm, ConfirmAction } from "../sales/forms";
import { addTeamMemberAction, removeTeamMemberAction } from "./actions";
import { SignInLinkButton } from "./sign-in-link";

export const metadata: Metadata = { title: "Admin Team" };

export default async function AdminTeamPage() {
  const session = await requireAdmin();
  const [members, tz] = await Promise.all([listAdminMembers(), getBusinessTimezone()]);
  const owner = ownerEmail();
  // Only the owner (signed in with the Vercel password) can make sign-in links for team members.
  const isOwner = session.teamVersion === undefined;

  return (
    <>
      <PageHeader title="Admin team" description="People who can sign in to this dashboard." />

      <Alert tone="info" className="mb-6" title="Team members have full access">
        They can see and change everything here: contacts, orders, courses, automations, settings and the sales team (approving agents and recording
        payouts), and they can add or remove other team members. They sign in at <strong>/admin/login</strong> with{" "}
        <strong>Email me a sign-in link</strong> (no password). Removing someone signs them out everywhere straight away.
        {isOwner && " If email isn't set up yet, use “Create sign-in link” and send them the link privately."}
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
            {owner && (
              <li className="flex items-start gap-3 px-5 py-4 sm:px-6">
                <Avatar email={owner} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-zinc-900">
                    <span className="truncate">{owner}</span>
                    <Badge tone="brand">
                      <KeyRound aria-hidden /> Owner
                    </Badge>
                    {session.email === owner && <span className="text-xs font-normal text-zinc-500">(you)</span>}
                  </p>
                  <p className="text-xs text-zinc-500">Signs in with the password set in Vercel (ADMIN_PASSWORD). Can&apos;t be removed here.</p>
                </div>
              </li>
            )}
            {members.map((m) => (
              <li key={m.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:px-6">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar name={m.name} email={m.email} />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-zinc-900">
                      <span className="truncate">{m.name || m.email}</span>
                      <Badge tone="neutral">
                        <ShieldCheck aria-hidden /> Admin
                      </Badge>
                      {session.email === m.email && <span className="text-xs font-normal text-zinc-500">(you)</span>}
                    </p>
                    {m.name && <p className="truncate text-sm text-zinc-600">{m.email}</p>}
                    <p className="text-xs text-zinc-500">
                      Added {formatDate(m.createdAt, {}, tz)}
                      {m.addedBy ? ` by ${m.addedBy === "ADMIN_TEAM_EMAILS" ? "deployment settings" : m.addedBy}` : ""} ·{" "}
                      {m.lastLoginAt ? `last signed in ${formatDateTime(m.lastLoginAt, tz)}` : "hasn't signed in yet"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  {isOwner && <SignInLinkButton memberId={m.id} email={m.email} />}
                  {session.email !== m.email && (
                    <ConfirmAction
                      action={removeTeamMemberAction}
                      hidden={{ memberId: m.id }}
                      label="Remove"
                      confirmLabel="Remove and sign out"
                      subject={m.email}
                      variant="ghost"
                      description={`${m.email} loses access to the dashboard right away.`}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
          {members.length === 0 && (
            <CardContent>
              <p className="text-sm text-zinc-500">No team members yet. Add someone to share the work.</p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a team member</CardTitle>
            <CardDescription>They get an email telling them how to sign in.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm action={addTeamMemberAction} submit="Add to the team" pendingText="Adding…">
              <Field label="Email" htmlFor="member-email" required>
                <Input id="member-email" name="email" type="email" autoComplete="off" required maxLength={254} />
              </Field>
              <Field label="Name" htmlFor="member-name">
                <Input id="member-name" name="name" autoComplete="off" maxLength={120} />
              </Field>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
