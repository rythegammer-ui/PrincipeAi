import { BellRing, Building2, HeartHandshake, Search, ShieldCheck, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, StatCard } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { agentLocation, currentAgent } from "@/lib/sales/agents";
import { placesConfigured } from "@/lib/sales/places";
import { CLAIM_DAYS, listProspects, MAX_ACTIVE_PROSPECTS } from "@/lib/sales/prospects";
import { listWarmLeads } from "@/lib/sales/referrals";
import { formatDate, pluralize, timeAgo } from "@/lib/utils";
import { NotAnAgent } from "../not-agent";
import { AddProspectForm } from "./add-prospect-form";
import { ProspectBadges, SOURCE_LABELS } from "./labels";
import { SearchPanel } from "./search-panel";

export const metadata: Metadata = { title: "Leads" };

const SHORT_DATE: Intl.DateTimeFormatOptions = { dateStyle: undefined, month: "short", day: "numeric" };

const RULES = [
  "Message one business at a time, as yourself. The messages here include your commission disclosure and, for email, the opt-out line and our address. Keep them in.",
  "Use a business's public contact details (website, business phone, business email) or details they gave you. Never buy or scrape email lists.",
  "Don't text anyone's cell phone unless they've told you it's OK, and never use auto-dialers or recorded calls.",
  "If anyone says no, \"stop\" or \"don't contact me\", mark them Do not contact straight away. That blocks them for the whole team.",
  "Follow up at most twice. Then move on.",
];

export default async function AgentLeadsPage() {
  const agent = await currentAgent();
  if (!agent) return <NotAnAgent />;
  const [prospects, warm] = await Promise.all([listProspects(agent.id), listWarmLeads(agent.id)]);
  const now = new Date();
  const due = prospects.filter((p) => p.nextFollowUpAt && p.nextFollowUpAt <= now && ["new", "contacted", "replied"].includes(p.status));
  const signedUp = prospects.filter((p) => p.signedUp).length;
  const area = agentLocation(agent);
  const active = agent.status === "approved" && Boolean(agent.code);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <p className="eyebrow">Sales team</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Leads</h1>
      <p className="mt-1 text-zinc-600">Find local businesses, write a personal first message in one click, and keep track of who to follow up with.</p>

      {!active && (
        <Alert tone="warning" title="Your agent account is paused" className="mt-6">
          Prospecting is on hold while your account is paused: your links don&apos;t earn commission. Your list is kept for when it&apos;s active again.
        </Alert>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Prospects" value={String(prospects.length)} icon={Building2} />
        <StatCard label="Follow up today" value={String(due.length)} icon={BellRing} />
        <StatCard label="Signed up" value={String(signedUp)} icon={UserPlus} />
        <StatCard label="Warm leads" value={String(warm.length)} icon={HeartHandshake} />
      </div>

      {due.length > 0 && (
        <Card className="mt-6 border-gold-200 bg-gold-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="size-4 text-gold-700" aria-hidden /> Follow up today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {due.map((p) => (
                <li key={p.id}>
                  <Link href={`/agent/leads/${p.id}`} className="inline-flex min-h-11 items-center gap-2 font-medium text-brand-700 hover:underline sm:min-h-0">
                    {p.name}
                  </Link>
                  <span className="ml-2 text-sm text-zinc-500">
                    {p.lastContactedAt ? `last contacted ${timeAgo(p.lastContactedAt)}` : "not contacted yet"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {active && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-4 text-brand-600" aria-hidden /> Find businesses
            </CardTitle>
            <CardDescription>
              Search Google for local businesses that could use practical AI help, then add the ones you&apos;ll reach out to. A business you add is yours
              for {CLAIM_DAYS} days after you last work on it, so two agents never contact the same one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchPanel defaultWhere={area} enabled={placesConfigured()} />
            <details className="group mt-6 rounded-xl border border-zinc-200">
              <summary className="flex min-h-11 cursor-pointer list-none items-center px-4 text-sm font-semibold text-zinc-800 [&::-webkit-details-marker]:hidden">
                <span className="mr-2 text-brand-600 group-open:rotate-90">›</span> Add a business you found yourself
              </summary>
              <div className="border-t border-zinc-200 p-4">
                <AddProspectForm defaultArea={area} />
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-brand-600" aria-hidden /> My prospects
          </CardTitle>
          <CardDescription>
            Open one to write your message, copy its tracked link and update its status. Up to {MAX_ACTIVE_PROSPECTS} at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prospects.length === 0 ? (
            <EmptyState icon={Building2} title="No prospects yet" description="Search above or add a business you know, and it shows up here." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Business</TH>
                  <TH>Status</TH>
                  <TH className="hidden sm:table-cell">Next follow-up</TH>
                </TR>
              </THead>
              <TBody>
                {prospects.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <Link href={`/agent/leads/${p.id}`} className="font-medium text-zinc-900 hover:text-brand-700 hover:underline">
                        {p.name}
                      </Link>
                      {(p.category || p.area) && <p className="text-xs text-zinc-500">{[p.category, p.area].filter(Boolean).join(" · ")}</p>}
                    </TD>
                    <TD>
                      <ProspectBadges p={p} />
                    </TD>
                    <TD className="hidden text-sm text-zinc-600 sm:table-cell">{p.nextFollowUpAt ? formatDate(p.nextFollowUpAt, SHORT_DATE) : "—"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake className="size-4 text-brand-600" aria-hidden /> Warm leads
          </CardTitle>
          <CardDescription>
            People who signed up through your link and ticked &ldquo;OK for you to follow up&rdquo;. Reach out personally, mention you earn a commission,
            and stop if they ask. Anyone who unsubscribes drops off this list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {warm.length === 0 ? (
            <EmptyState
              icon={HeartHandshake}
              title="No warm leads yet"
              description="When someone signs up through your link and agrees to hear from you, they appear here."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Signed up for</TH>
                  <TH className="hidden sm:table-cell">When</TH>
                </TR>
              </THead>
              <TBody>
                {warm.map((w) => (
                  <TR key={w.contactId}>
                    <TD>
                      <p className="font-medium text-zinc-900">{w.name || "—"}</p>
                      <a href={`mailto:${w.email}`} className="text-sm break-all text-brand-700 hover:underline">
                        {w.email}
                      </a>
                    </TD>
                    <TD className="text-sm text-zinc-700">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {SOURCE_LABELS[w.source ?? ""] ?? "Free resources"}
                        {w.stage === "customer" ? <Badge tone="green">Customer</Badge> : w.tookAssessment ? <Badge tone="gold">Took the assessment</Badge> : null}
                      </span>
                    </TD>
                    <TD className="hidden text-sm text-zinc-600 sm:table-cell">{timeAgo(w.consentedAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand-600" aria-hidden /> Reaching out the right way
          </CardTitle>
          <CardDescription>
            These keep you, your prospects and the team on the right side of anti-spam rules. Full details are in the{" "}
            <Link href="/sales-team/terms" className="font-medium text-brand-700 underline underline-offset-2">
              program terms
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-zinc-700">
            {RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            {pluralize(prospects.length, "prospect")} in your list. Businesses you&apos;ve marked Do not contact stay blocked for everyone.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
