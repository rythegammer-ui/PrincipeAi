import { ArrowLeft, Building2, ExternalLink, Link2, MessageSquareText, NotebookPen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/marketing/copy-button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currentAgent } from "@/lib/sales/agents";
import { OUTREACH_CHANNELS } from "@/lib/sales/outreach";
import { CLAIM_DAYS, getProspect, HOLD_DAYS, MAX_CONTACTS, prospectLink } from "@/lib/sales/prospects";
import { formatDate, timeAgo } from "@/lib/utils";
import { NotAnAgent } from "../../not-agent";
import { ProspectBadges } from "../labels";
import { MessageWriter, PlaceDetailsLoader, ProspectUpdateForm } from "./prospect-forms";

export const metadata: Metadata = { title: "Prospect" };

export default async function ProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const agent = await currentAgent();
  if (!agent) return <NotAnAgent />;
  const { id } = await params;
  const p = await getProspect(agent.id, id);
  if (!p) notFound();
  const active = agent.status === "approved" && Boolean(agent.code);
  const link = agent.code ? prospectLink(agent.code, p.linkToken) : null;
  const blocked = p.status === "do_not_contact";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link href="/agent/leads" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900">
        <ArrowLeft className="size-4" aria-hidden /> All leads
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">{p.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <ProspectBadges p={p} />
        {(p.category || p.area) && <span>{[p.category, p.area].filter(Boolean).join(" · ")}</span>}
        <span>Added {formatDate(p.createdAt)}</span>
        {p.lastContactedAt && (
          <span>
            · Contacted {p.contactCount} of {MAX_CONTACTS} times, last {timeAgo(p.lastContactedAt)}
          </span>
        )}
      </div>

      {blocked && (
        <Alert tone="error" title="Do not contact" className="mt-6">
          This business asked not to be contacted. Don&apos;t reach out again, and don&apos;t pass their details to anyone.
        </Alert>
      )}
      {!active && !blocked && (
        <Alert tone="warning" title="Your agent account is paused" className="mt-6">
          Hold off contacting this business until your account is active again. If they asked not to be contacted, you can still mark them Do not
          contact below.
        </Alert>
      )}
      {p.signedUp && (
        <Alert tone="success" title="Someone signed up through your link" className="mt-6">
          Someone signed up through this business&apos;s link{p.signedUpAt ? ` ${timeAgo(p.signedUpAt)}` : ""}, so they&apos;re your customer. If they buy a course,
          the commission shows on your dashboard. Their details stay private unless they said it&apos;s OK for you to follow up (then they&apos;re under Warm
          leads).
        </Alert>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-brand-600" aria-hidden /> Contact details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {p.placeId ? (
            <PlaceDetailsLoader id={p.id} />
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm text-zinc-700">
              <li>
                <span className="text-zinc-500">Website:</span>{" "}
                {p.website ? (
                  <a href={p.website} target="_blank" rel="noopener noreferrer" className="break-all text-brand-700 hover:underline">
                    {p.website}
                    <ExternalLink className="ml-1 inline size-3" aria-hidden />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  "—"
                )}
              </li>
              <li>
                <span className="text-zinc-500">Phone:</span> {p.phone || "—"}
              </li>
              <li>
                <span className="text-zinc-500">Email:</span> {p.email || "—"}
              </li>
            </ul>
          )}
        </CardContent>
      </Card>

      {!blocked && link && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="size-4 text-brand-600" aria-hidden /> Your link for this business
            </CardTitle>
            <CardDescription>
              Opens the free AI Readiness Assessment. When someone signs up through it, this business shows as signed up and they become your customer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200 sm:flex-row sm:items-center sm:justify-between">
              <code className="font-mono text-xs break-all text-zinc-700">{link}</code>
              <CopyButton text={link} label="Copy link" srLabel={`Copy your link for ${p.name}`} className="min-h-11 shrink-0 sm:min-h-9" />
            </div>
          </CardContent>
        </Card>
      )}

      {!blocked && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="size-4 text-brand-600" aria-hidden /> Write your first message
            </CardTitle>
            <CardDescription>
              A short, personal message written for this business, with your link and the commission line already in. You send it yourself.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MessageWriter id={p.id} channels={OUTREACH_CHANNELS} disabled={!active} />
          </CardContent>
        </Card>
      )}

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <NotebookPen className="size-4 text-brand-600" aria-hidden /> Status and notes
          </CardTitle>
          <CardDescription>
            This business stays yours while you work on it: the claim runs out {CLAIM_DAYS} days after your last update ({HOLD_DAYS} once it&apos;s Closed or
            someone signed up).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProspectUpdateForm
            manual={!p.placeId}
            prospect={{
              id: p.id,
              status: p.status,
              notes: p.notes,
              nextFollowUp: p.nextFollowUpAt ? p.nextFollowUpAt.toISOString().slice(0, 10) : "",
              website: p.website,
              phone: p.phone,
              email: p.email,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
