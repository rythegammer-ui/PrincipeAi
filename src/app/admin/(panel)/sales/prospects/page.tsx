import { ArrowLeft, Building2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { ProspectStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { placesConfigured, placesLimits } from "@/lib/sales/places";
import { adminListProspects, CLAIM_DAYS, PROSPECT_STATUSES } from "@/lib/sales/prospects";
import { formatDate, timeAgo, truncate } from "@/lib/utils";
import { markProspectDoNotContactAction, releaseProspectAction } from "../actions";
import { ConfirmAction } from "../forms";

export const metadata: Metadata = { title: "Prospects · Sales Team" };

const TONES: Record<ProspectStatus, BadgeTone> = {
  new: "neutral",
  contacted: "blue",
  replied: "brand",
  not_interested: "amber",
  do_not_contact: "red",
};

type Search = { agent?: string | string[]; status?: string | string[] };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminProspectsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = PROSPECT_STATUSES.find((s) => s.value === one(sp.status))?.value;
  const agentId = /^[0-9a-f-]{36}$/i.test(one(sp.agent)) ? one(sp.agent) : undefined;
  const rows = await adminListProspects({ agentId, status });
  const limits = placesLimits();

  return (
    <>
      <PageHeader
        title="Prospects"
        description={`Businesses your agents are reaching out to from their Leads tab. Each business has one agent at a time; a claim runs out ${CLAIM_DAYS} days after the agent last works on it. "Do not contact" blocks a business for everyone until you release it.`}
        actions={
          <Link href="/admin/sales" className={buttonVariants({ variant: "outline", className: "min-h-11 sm:min-h-10" })}>
            <ArrowLeft aria-hidden /> Sales Team
          </Link>
        }
      />

      <p className="mb-4 text-sm text-zinc-600">
        Google business search is{" "}
        {placesConfigured() ? (
          <>
            <strong className="font-medium text-zinc-900">on</strong>: each agent can run {limits.searchesPerAgentPerDay} searches and {limits.detailsPerAgentPerDay}{" "}
            detail lookups a day, and the team {limits.searchesPerMonth} searches and {limits.detailsPerMonth} lookups each calendar month (it starts over on the 1st,
            Pacific time).
          </>
        ) : (
          <>
            <strong className="font-medium text-zinc-900">off</strong> (set <code className="font-mono text-xs">GOOGLE_MAPS_API_KEY</code> in Vercel to switch it on).
            Agents can still add businesses by hand.
          </>
        )}
      </p>

      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        {agentId && <input type="hidden" name="agent" value={agentId} />}
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
          Status
          <Select name="status" defaultValue={status ?? ""} className="min-w-44">
            <option value="">All</option>
            {PROSPECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </label>
        <button type="submit" className={buttonVariants({ variant: "outline", className: "min-h-11 sm:min-h-10" })}>
          Filter
        </button>
        {(agentId || status) && (
          <Link href="/admin/sales/prospects" className="min-h-11 content-center text-sm font-medium text-brand-700 hover:underline sm:min-h-10">
            Show all
          </Link>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={Building2} title="No prospects" description="When agents add businesses in their Leads tab, they show up here." className="m-6" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Business</TH>
                  <TH>Agent</TH>
                  <TH>Status</TH>
                  <TH className="hidden md:table-cell">Last update</TH>
                  <TH className="text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <p className="font-medium text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-500">{[p.category, p.area, p.placeId ? "from Google" : "added by hand"].filter(Boolean).join(" · ")}</p>
                      {p.notes && <p className="mt-1 max-w-md text-xs text-zinc-500">{truncate(p.notes, 160)}</p>}
                    </TD>
                    <TD>
                      <Link href={`/admin/sales/${p.agentId}`} className="text-sm font-medium text-brand-700 hover:underline">
                        {p.agentName}
                      </Link>
                      {p.agentCode && <p className="font-mono text-xs text-zinc-500">{p.agentCode}</p>}
                    </TD>
                    <TD>
                      <span className="flex flex-wrap gap-1.5">
                        <Badge tone={TONES[p.status]}>{PROSPECT_STATUSES.find((s) => s.value === p.status)?.label ?? p.status}</Badge>
                        {p.contactId && <Badge tone="green">Signed up</Badge>}
                        {p.expired && <Badge>Claim ran out</Badge>}
                      </span>
                      {p.lastContactedAt && <p className="mt-1 text-xs text-zinc-500">Contacted {formatDate(p.lastContactedAt)}</p>}
                    </TD>
                    <TD className="hidden text-sm text-zinc-600 md:table-cell">{timeAgo(p.activeAt)}</TD>
                    <TD className="text-right">
                      <span className="flex flex-col items-end gap-1.5">
                        {p.status !== "do_not_contact" && (
                          <ConfirmAction
                            action={markProspectDoNotContactAction}
                            hidden={{ prospectId: p.id }}
                            label="Mark do not contact"
                            confirmLabel="Yes, block it"
                            subject={p.name}
                            description="When the business asked us not to be contacted. No agent can add or contact it until you clear it."
                          />
                        )}
                        <ConfirmAction
                          action={releaseProspectAction}
                          hidden={{ prospectId: p.id }}
                          label={p.status === "do_not_contact" ? "Clear do-not-contact" : "Release"}
                          confirmLabel={p.status === "do_not_contact" ? "Yes, clear it" : "Yes, release"}
                          subject={p.name}
                          description={
                            p.status === "do_not_contact"
                              ? "Only if the business has asked to hear from us again. Any agent could then contact it."
                              : `${p.agentName} loses this business and any agent can add it.`
                          }
                        />
                      </span>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
