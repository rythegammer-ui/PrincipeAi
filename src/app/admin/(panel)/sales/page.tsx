import { and, gte, lt, sql } from "drizzle-orm";
import { DollarSign, ExternalLink, Inbox, Settings2, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/marketing/copy-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/form";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { agentLinks, agentLocation } from "@/lib/sales/agents";
import { agentBalances, awardDueChallenges, countingSale } from "@/lib/sales/commissions";
import { formatRate, monthBounds } from "@/lib/sales/game";
import { EXPERIENCE_OPTIONS, HOURS_OPTIONS, optionLabel, PAYOUT_METHODS } from "@/lib/sales/options";
import { getSalesProgram } from "@/lib/sales/program";
import { adminAgentRows, leaderboard } from "@/lib/sales/stats";
import { getBusinessTimezone } from "@/lib/scheduling";
import { cn, formatDate, formatMoney, pluralize } from "@/lib/utils";
import { approveAgentAction, declineAgentAction } from "./actions";
import { ActionForm, ConfirmAction } from "./forms";
import { STATUS_META } from "./status";

export const metadata: Metadata = { title: "Sales Team" };

const FILTERS = [
  { key: "active", label: "Active", statuses: ["approved"] },
  { key: "paused", label: "Paused", statuses: ["paused"] },
  { key: "all", label: "All", statuses: null },
] as const;

export default async function SalesTeamPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin();
  // Challenges that ended since the daily job last ran get their bonuses now (safe to repeat).
  await awardDueChallenges().catch((err) => console.error("[admin/sales] awarding challenges failed", err));
  const { show } = await searchParams;
  const filter = FILTERS.find((f) => f.key === show) ?? FILTERS[0];

  const db = await getDb();
  const now = new Date();
  const [program, tz, rows, balances] = await Promise.all([getSalesProgram(), getBusinessTimezone(), adminAgentRows(now), agentBalances()]);
  const bounds = monthBounds(now, tz);
  const [board, [month]] = await Promise.all([
    leaderboard(bounds.thisMonth, bounds.nextMonth, { forAdmin: true }),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number), volume: sql<number>`coalesce(sum(${schema.agentCommissions.saleCents}), 0)`.mapWith(Number) })
      .from(schema.agentCommissions)
      // Same rule as levels and the leaderboard: no refunded sales, and no test payments on a live site.
      .where(and(countingSale(), gte(schema.agentCommissions.createdAt, bounds.thisMonth), lt(schema.agentCommissions.createdAt, bounds.nextMonth))),
  ]);

  const applications = rows.filter((r) => r.status === "applied").sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const agents = rows.filter((r) => r.status !== "applied" && (filter.statuses === null || (filter.statuses as readonly string[]).includes(r.status)));
  const active = rows.filter((r) => r.status === "approved").length;
  const owedTotal = [...balances.values()].reduce((sum, b) => sum + Math.max(0, b.owedCents), 0);
  const toPay = rows
    .map((r) => ({ agent: r, balance: balances.get(r.id) }))
    .filter((x): x is { agent: (typeof rows)[number]; balance: NonNullable<typeof x.balance> } => Boolean(x.balance && x.balance.owedCents > 0))
    .sort((a, b) => b.balance.owedCents - a.balance.owedCents);
  const monthName = formatDate(now, { dateStyle: undefined, month: "long", year: "numeric" }, tz);

  return (
    <>
      <PageHeader
        title="Sales Team"
        description={`Remote agents who sell your courses on commission (${program.levels.map((l) => formatRate(l.rateBps)).join(" → ")}). Approve applicants, track their sales, and record what you pay them.`}
        actions={
          <>
            <Link href="/admin/sales/program" className={buttonVariants({ variant: "outline", className: "min-h-11 sm:min-h-10" })}>
              <Settings2 aria-hidden /> Program &amp; challenges
            </Link>
            <a href="/sales-team" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost", className: "min-h-11 sm:min-h-10" })}>
              Public page <ExternalLink aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active agents" value={active} icon={Users} hint={program.applicationsOpen ? "Applications are open" : "Applications are closed"} />
        <StatCard label="Applications waiting" value={applications.length} icon={Inbox} hint={applications.length ? "Review them below" : "All caught up"} />
        <StatCard label={`Agent sales in ${monthName}`} value={month?.n ?? 0} icon={Trophy} hint={`${formatMoney(month?.volume ?? 0)} in sales`} />
        <StatCard label="Owed now" value={formatMoney(owedTotal)} icon={DollarSign} hint={`${pluralize(toPay.length, "agent")} to pay`} />
      </div>

      <section aria-labelledby="applications" className="mb-8">
        <h2 id="applications" className="mb-3 text-lg font-semibold text-zinc-900">
          Applications
        </h2>
        {applications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500">
            No applications waiting. Share <a href="/sales-team" className="font-medium text-brand-700 hover:underline">your sales-team page</a> to find agents.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {applications.map((a) => (
              <li key={a.id}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/sales/${a.id}`} className="hover:text-brand-700">
                        {a.name}
                      </Link>
                      {agentLocation(a) && <span className="text-sm font-normal text-zinc-500">{agentLocation(a)}</span>}
                    </CardTitle>
                    <CardDescription>
                      {a.email}
                      {a.phone ? ` · ${a.phone}` : ""} · applied {formatDate(a.createdAt, {}, tz)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 text-sm">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="blue">{optionLabel(EXPERIENCE_OPTIONS, a.application.experience) || "Experience not given"}</Badge>
                      <Badge tone="neutral">{optionLabel(HOURS_OPTIONS, a.application.hours) || "Hours not given"}</Badge>
                    </div>
                    {a.application.channels && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500">How they&apos;d find customers</p>
                        <p className="mt-0.5 line-clamp-4 whitespace-pre-line text-zinc-800">{a.application.channels}</p>
                      </div>
                    )}
                    {a.application.why && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500">Why they want to join</p>
                        <p className="mt-0.5 line-clamp-3 whitespace-pre-line text-zinc-800">{a.application.why}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-start gap-2 border-t border-zinc-100 pt-3">
                      <ActionForm
                        action={approveAgentAction}
                        hidden={{ agentId: a.id }}
                        submit={
                          <>
                            Approve<span className="sr-only"> {a.name}</span>
                          </>
                        }
                        pendingText="Approving…"
                        size="sm"
                      />
                      <ConfirmAction
                        action={declineAgentAction}
                        hidden={{ agentId: a.id }}
                        label="Decline"
                        confirmLabel="Decline application"
                        subject={a.name}
                        variant="ghost"
                        description={`Decline ${a.name}'s application?`}
                      >
                        <label className="flex min-h-11 items-center gap-2 text-xs text-zinc-700 sm:min-h-0">
                          <Checkbox name="notify" defaultChecked /> Send them a polite email
                        </label>
                      </ConfirmAction>
                      <Link href={`/admin/sales/${a.id}`} className="ml-auto inline-flex min-h-11 items-center text-xs font-medium text-brand-700 hover:underline sm:min-h-8">
                        Full application
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toPay.length > 0 && (
        <section aria-labelledby="to-pay" className="mb-8">
          <h2 id="to-pay" className="mb-1 text-lg font-semibold text-zinc-900">
            Ready to pay
          </h2>
          <p className="mb-3 text-sm text-zinc-500">
            Commission past its {program.holdDays}-day hold. Pay through the agent&apos;s method, then record it on their page. Minimum payout:{" "}
            {formatMoney(program.minPayoutCents)}.
          </p>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-zinc-100">
              {toPay.map(({ agent, balance }) => {
                const below = balance.owedCents < program.minPayoutCents;
                return (
                  <li key={agent.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-medium text-zinc-900">
                        {agent.name}
                        <span className="font-semibold tabular-nums">{formatMoney(balance.owedCents)}</span>
                        {below && <Badge tone="neutral">Below minimum</Badge>}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {agent.payoutMethod ? (
                          <>
                            {optionLabel(PAYOUT_METHODS, agent.payoutMethod)}
                            {agent.payoutHandle ? `: ${agent.payoutHandle}` : ""}
                          </>
                        ) : (
                          "No payout method yet: ask them to add one in their dashboard."
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/admin/sales/${agent.id}#payout`}
                      className={buttonVariants({ variant: below ? "outline" : "primary", size: "sm", className: "min-h-11 self-start sm:min-h-8 sm:self-auto" })}
                    >
                      Record payout
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      )}

      <section aria-labelledby="agents" className="mb-8">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="agents" className="text-lg font-semibold text-zinc-900">
            Agents
          </h2>
          <nav aria-label="Filter agents" className="flex gap-1 self-start rounded-xl border border-zinc-200 bg-white p-1">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={f.key === "active" ? "/admin/sales" : `/admin/sales?show=${f.key}`}
                aria-current={filter.key === f.key ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors sm:min-h-8",
                  filter.key === f.key ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                {f.label}
              </Link>
            ))}
          </nav>
        </div>
        {agents.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filter.key === "active" ? "No active agents yet" : "No agents here"}
            description={filter.key === "active" ? "Approve an application and they'll show up here with their referral link." : "Try another filter."}
          />
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <THead>
                <tr>
                  <TH>Agent</TH>
                  <TH>Code &amp; link</TH>
                  <TH>Level this month</TH>
                  <TH className="text-right">Sales (this / last month)</TH>
                  <TH className="text-right">Customers</TH>
                  <TH className="text-right">Owed</TH>
                  <TH className="text-right">On hold</TH>
                </tr>
              </THead>
              <TBody>
                {agents.map((a) => {
                  const b = balances.get(a.id);
                  const meta = STATUS_META[a.status];
                  return (
                    <TR key={a.id}>
                      <TD>
                        <Link href={`/admin/sales/${a.id}`} className="font-medium text-zinc-900 hover:text-brand-700">
                          {a.name}
                        </Link>
                        <span className="block text-xs text-zinc-500">{a.email}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                          {a.status !== "approved" && <Badge tone={meta.tone}>{meta.label}</Badge>}
                          {agentLocation(a)}
                        </span>
                      </TD>
                      <TD>
                        {a.code ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-mono text-xs font-semibold text-zinc-800">{a.code}</span>
                            <CopyButton text={agentLinks(a.code).short} label="Copy link" srLabel={`Copy ${a.name}'s referral link`} className="min-h-11 sm:min-h-8" />
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </TD>
                      <TD>
                        <span className="font-medium text-zinc-800">{a.level}</span>
                        <span className="block text-xs text-zinc-500">{formatRate(a.rateBps)}</span>
                      </TD>
                      <TD className="text-right tabular-nums">
                        <span className="font-medium text-zinc-900">{a.thisMonth}</span>
                        <span className="text-zinc-400"> / {a.lastMonth}</span>
                      </TD>
                      <TD className="text-right tabular-nums">{a.customers}</TD>
                      <TD className="text-right font-medium tabular-nums">{formatMoney(b?.owedCents ?? 0)}</TD>
                      <TD className="text-right text-zinc-500 tabular-nums">{formatMoney(b?.pendingCents ?? 0)}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </Card>
        )}
      </section>

      <section aria-labelledby="leaderboard">
        <h2 id="leaderboard" className="mb-1 text-lg font-semibold text-zinc-900">
          {monthName} leaderboard
        </h2>
        <p className="mb-3 text-sm text-zinc-500">
          Agents see first names and last initials only, and don&apos;t see sales volume. Agents who opted out of the leaderboard are marked.
        </p>
        {board.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500">No agent sales this month yet.</p>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <THead>
                <tr>
                  <TH className="w-12">#</TH>
                  <TH>Agent</TH>
                  <TH className="text-right">Sales</TH>
                  <TH className="text-right">Volume</TH>
                </tr>
              </THead>
              <TBody>
                {board.map((r) => (
                  <TR key={r.agentId}>
                    <TD className="font-semibold tabular-nums">{r.rank}</TD>
                    <TD>
                      <Link href={`/admin/sales/${r.agentId}`} className="font-medium text-zinc-900 hover:text-brand-700">
                        {r.name}
                      </Link>
                      {r.state && <span className="ml-2 text-xs text-zinc-500">{r.state}</span>}
                      {r.hidden && (
                        <Badge tone="neutral" className="ml-2">
                          Hidden
                        </Badge>
                      )}
                    </TD>
                    <TD className="text-right tabular-nums">{r.sales}</TD>
                    <TD className="text-right tabular-nums">{formatMoney(r.volumeCents)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
      </section>
    </>
  );
}
