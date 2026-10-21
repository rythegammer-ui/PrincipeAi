import { and, eq, inArray } from "drizzle-orm";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Crown,
  Flame,
  Gem,
  Hourglass,
  Lock,
  Medal,
  Rocket,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/marketing/copy-button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, StatCard } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb, schema } from "@/db";
import type { AgentCommission } from "@/db/schema";
import { agentLinks, currentAgent } from "@/lib/sales/agents";
import { describeTarget, DISPUTE_NOTE, livePayments } from "@/lib/sales/commissions";
import { formatRate, type BadgeIcon } from "@/lib/sales/game";
import { agentDashboard, type ChallengeView } from "@/lib/sales/stats";
import { cn, firstName, formatDate, formatMoney, pluralize, timeAgo } from "@/lib/utils";
import { NotAnAgent } from "./not-agent";
import { AgentProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Dashboard" };

const BADGE_ICONS: Record<BadgeIcon, LucideIcon> = {
  sparkles: Sparkles,
  flame: Flame,
  trophy: Trophy,
  crown: Crown,
  target: Target,
  rocket: Rocket,
  gem: Gem,
  medal: Medal,
  star: Star,
  zap: Zap,
};

/** "Oct 20" (formatDate's default dateStyle can't be combined with month/day options). */
const SHORT_DATE: Intl.DateTimeFormatOptions = { dateStyle: undefined, month: "short", day: "numeric" };

/** Older manual bonuses stored "(by admin@…)" after the reason: agents see the reason only. */
const cleanNote = (note: string | null) => note?.replace(/\s*\(by [^)]*\)$/, "") ?? null;

/** Notes the system writes on a sale itself (never an admin's words): a partial refund. */
const saleNote = (row: AgentCommission) => (row.kind === "sale" && row.note?.startsWith("Partly refunded") ? row.note : null);

export default async function AgentDashboardPage() {
  const agent = await currentAgent();
  if (!agent) return <NotAnAgent />;
  const d = await agentDashboard(agent);
  const { program, standing, balance, tz, now } = d;
  // On a site taking real payments, test purchases are recorded but never paid.
  const live = livePayments();
  const disputed = d.ledger.some((r) => r.status === "held" && r.note === DISPUTE_NOTE);

  // Course titles for the earnings table (never the customer).
  const orderIds = d.ledger.map((r) => r.orderId).filter((id): id is string => Boolean(id));
  const db = await getDb();
  const orderTitles = new Map(
    orderIds.length
      ? (
          await db
            .select({ id: schema.orders.id, description: schema.orders.description })
            .from(schema.orders)
            .where(and(inArray(schema.orders.id, orderIds), eq(schema.orders.itemType, "course")))
        ).map((o) => [o.id, o.description])
      : [],
  );

  const link = agent.code ? agentLinks(agent.code) : null;
  const next = standing.next;
  const percent = next ? Math.min(100, Math.round((d.thisMonth / Math.max(1, next.minSales)) * 100)) : 100;
  const liveChallenges = d.challenges.filter((c) => c.phase !== "ended");
  const endedChallenges = d.challenges.filter((c) => c.phase === "ended");
  const earned = d.badges.filter((b) => b.earned).length;
  const inTop = d.myRank ? d.board.some((r) => r.agentId === agent.id) : false;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-1">
        <p className="eyebrow">Sales team</p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Welcome back, {firstName(agent.name, agent.email)}</h1>
        <p className="text-zinc-600">
          {d.thisMonth > 0
            ? `${pluralize(d.thisMonth, "sale")} so far this month. Nice work.`
            : "A fresh month. Your first sale is the hardest: the toolkit has scripts to get you going."}
        </p>
      </div>

      {agent.status === "paused" && (
        <Alert tone="warning" title="Your agent account is paused" className="mt-6">
          Your link isn&apos;t earning commission on new sales right now. Everything you&apos;ve already earned is still yours and will be paid as usual.
          Questions? Reply to any of our emails.
        </Alert>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-3 [&>*]:min-w-0">
        <section aria-labelledby="level-heading" className="relative isolate overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-lift sm:p-8 lg:col-span-2">
          <div className="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-brand-600/40 blur-[90px]" aria-hidden />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">Your level</p>
              <h2 id="level-heading" className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight">
                <Rocket className="size-7 text-gold-300" aria-hidden />
                {standing.level.name}
              </h2>
            </div>
            <div className="text-right">
              <p className="font-display text-5xl text-gold-300 italic">{formatRate(standing.level.rateBps)}</p>
              <p className="text-sm text-zinc-400">on every sale</p>
            </div>
          </div>
          <div className="mt-8">
            {next ? (
              <>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <p className="font-medium text-zinc-100">
                    {standing.toNext > 0
                      ? `${pluralize(standing.toNext, "more sale")} this month to reach ${next.name} (${formatRate(next.rateBps)})`
                      : `You've hit ${next.minSales} sales: your next sale is at ${next.name}`}
                  </p>
                  <p className="shrink-0 text-zinc-400 tabular-nums">
                    {d.thisMonth} / {next.minSales}
                  </p>
                </div>
                <Progress value={percent} label={`Progress to ${next.name}`} className="mt-3 h-3 bg-white/10" />
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-zinc-100">Top level: every sale earns {formatRate(standing.level.rateBps)}.</p>
                <Progress value={100} label="Top level reached" className="mt-3 h-3 bg-white/10" />
              </>
            )}
            {d.keepNeeded > 0 && (
              <p className="mt-4 text-sm text-zinc-300">
                You&apos;re {standing.level.name} thanks to last month&apos;s {pluralize(d.lastMonth, "sale")}. Make {pluralize(d.keepNeeded, "more sale")} this month to
                keep it through next month.
              </p>
            )}
            <p className="mt-4 text-xs text-zinc-400">
              Levels:{" "}
              {program.levels.map((l, i) => (
                <span key={l.key}>
                  {i > 0 && " · "}
                  {l.name} {formatRate(l.rateBps)}
                  {l.minSales > 0 ? ` at ${l.minSales}+ sales/month` : ""}
                </span>
              ))}
              . Reach a level and you keep it through the end of next month.
            </p>
          </div>
        </section>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Your link</CardTitle>
            <CardDescription>
              New people who first sign up through it, and anyone who buys through it, stay your customers for {program.attributionDays} days from then.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {link ? (
              <>
                <div className="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
                  <p className="font-mono text-sm break-all text-zinc-900">{link.short}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Code <span className="font-mono font-semibold text-zinc-700">{agent.code}</span>
                  </p>
                </div>
                <CopyButton text={link.short} label="Copy my link" srLabel="Copy my referral link" className="min-h-11 self-start" />
              </>
            ) : (
              <p className="text-sm text-zinc-600">Your link appears here once your account is approved.</p>
            )}
            <Link href="/agent/toolkit" className={buttonVariants({ variant: "outline", className: "mt-auto min-h-11 w-full" })}>
              Course links &amp; scripts <ArrowRight aria-hidden />
            </Link>
          </CardContent>
        </Card>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-label="Your numbers">
        <li>
          <StatCard label="Sales this month" value={d.thisMonth} icon={ShoppingBag} hint={d.monthVolumeCents ? `${formatMoney(d.monthVolumeCents)} in sales` : "Make your first one"} />
        </li>
        <li>
          <StatCard
            label="Owed to you"
            value={formatMoney(Math.max(0, balance.owedCents))}
            icon={Wallet}
            hint={balance.owedCents >= program.minPayoutCents && balance.owedCents > 0 ? "In the next payout" : `Paid from ${formatMoney(program.minPayoutCents)}`}
          />
        </li>
        <li>
          <StatCard
            label="Pending"
            value={formatMoney(balance.pendingCents)}
            icon={Hourglass}
            hint={
              [
                disputed ? "Includes a disputed payment" : null,
                balance.nextAvailableAt ? `Next unlocks ${formatDate(balance.nextAvailableAt, {}, tz)}` : null,
              ]
                .filter(Boolean)
                .join(" · ") || `${program.holdDays}-day refund window`
            }
          />
        </li>
        <li>
          <StatCard label="Paid to you" value={formatMoney(balance.paidCents)} icon={CheckCircle2} hint={`${pluralize(d.lifetimeSales, "sale")} all time`} />
        </li>
        <li>
          <StatCard
            label="Weekly streak"
            value={
              <span className="inline-flex items-center gap-1.5">
                {d.streak}
                <Flame className={cn("size-5", d.streak > 0 ? "text-orange-500" : "text-zinc-300")} aria-hidden />
              </span>
            }
            hint={d.streak > 0 ? "Weeks in a row with a sale" : "Make a sale this week to start one"}
          />
        </li>
        <li>
          <StatCard label="Customers" value={d.customers} icon={Users} hint="People who bought through you" />
        </li>
      </ul>

      <div className="mt-5 grid gap-5 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-gold-600" aria-hidden /> Challenges
            </CardTitle>
            <CardDescription>Hit the target before the deadline and the bonus is yours, on top of commission.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {liveChallenges.length === 0 && endedChallenges.length === 0 ? (
              <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">No challenges running right now. New ones are announced here and by email.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {[...liveChallenges, ...endedChallenges].map((c) => (
                  <ChallengeCard key={c.id} challenge={c} now={now} tz={tz} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="size-4 text-gold-600" aria-hidden /> Leaderboard
            </CardTitle>
            <CardDescription>Sales this month. Ties go to more sales volume, then whoever got there first.</CardDescription>
          </CardHeader>
          <CardContent>
            {d.board.length === 0 ? (
              <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">No sales on the team yet this month. The top spot is wide open.</p>
            ) : (
              <ol className="flex flex-col gap-1.5">
                {d.board.map((row) => (
                  <LeaderRow key={row.agentId} rank={row.rank} name={row.publicName} state={row.state} sales={row.sales} you={row.agentId === agent.id} />
                ))}
                {d.myRank && !inTop && (
                  <>
                    <li className="px-3 text-center text-zinc-400" aria-hidden>
                      ⋯
                    </li>
                    <LeaderRow rank={d.myRank.rank} name={d.myRank.publicName} state={d.myRank.state} sales={d.myRank.sales} you />
                  </>
                )}
              </ol>
            )}
            {!agent.showOnLeaderboard && <p className="mt-3 text-xs text-zinc-500">You&apos;re hidden from other agents. Change this in your profile below.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="size-4 text-brand-600" aria-hidden /> Badges
            </CardTitle>
            <CardDescription>
              {earned} of {d.badges.length} unlocked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {d.badges.map((b) => {
                const Icon = BADGE_ICONS[b.icon];
                return (
                  <li
                    key={b.key}
                    className={cn(
                      "flex flex-col items-center rounded-2xl p-4 text-center ring-1",
                      b.earned ? "bg-gradient-to-b from-gold-50 to-white ring-gold-200" : "bg-zinc-50 ring-zinc-200",
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex size-12 items-center justify-center rounded-full",
                        b.earned ? "bg-gradient-to-br from-brand-500 to-brand-700 text-gold-200 shadow-sm" : "bg-zinc-200 text-zinc-400",
                      )}
                    >
                      <Icon className="size-6" aria-hidden />
                      {!b.earned && <Lock className="absolute -right-1 -bottom-1 size-4 rounded-full bg-white p-0.5 text-zinc-500" aria-hidden />}
                    </span>
                    <p className={cn("mt-3 text-sm font-semibold", b.earned ? "text-zinc-900" : "text-zinc-500")}>{b.name}</p>
                    <p className="mt-0.5 text-xs leading-snug text-zinc-500">{b.description}</p>
                    <p className={cn("mt-2 text-xs font-medium", b.earned ? "text-emerald-700" : "text-zinc-500 tabular-nums")}>
                      {b.earned ? "Unlocked" : (b.progress ?? "Locked")}
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand-600" aria-hidden /> Team wins
            </CardTitle>
            <CardDescription>The latest sales across the team.</CardDescription>
          </CardHeader>
          <CardContent>
            {d.feed.length === 0 ? (
              <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">No team sales yet. Be the first on the board.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-100">
                {d.feed.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 py-2.5">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                      <ShoppingBag className="size-4" aria-hidden />
                    </span>
                    <p className="text-sm text-zinc-700">
                      <span className="font-semibold text-zinc-900">{f.publicName}</span>
                      {f.state ? <span className="text-zinc-500"> · {f.state}</span> : null} made a sale
                      <span className="block text-xs text-zinc-500">
                        {timeAgo(f.at, now)}
                        {f.level ? ` · ${f.level}` : ""}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
          <CardDescription>
            Each commission is paid once its {program.holdDays}-day refund window has passed. Payouts: {program.payoutSchedule.replace(/\.$/, "")}.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {d.ledger.length === 0 ? (
            <p className="mx-6 mb-6 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">Your commissions will appear here as soon as you make a sale.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>What</TH>
                  <TH className="text-right">Sale</TH>
                  <TH className="text-right">Rate</TH>
                  <TH className="text-right">Amount</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {d.ledger.map((row) => (
                  <TR key={row.id}>
                    <TD className="whitespace-nowrap">{formatDate(row.createdAt, {}, tz)}</TD>
                    <TD className="min-w-48">
                      <span className="font-medium text-zinc-900">{ledgerLabel(row, orderTitles)}</span>
                      {row.isTest && (
                        <Badge tone="amber" className="ml-2">
                          Test
                        </Badge>
                      )}
                      {row.kind === "sale" && row.level && <span className="block text-xs text-zinc-500">{row.level} level</span>}
                      {saleNote(row) && <span className="block text-xs text-zinc-500">{saleNote(row)}</span>}
                    </TD>
                    <TD className="text-right tabular-nums">{row.saleCents ? formatMoney(row.saleCents, row.currency) : "—"}</TD>
                    <TD className="text-right tabular-nums">{row.rateBps ? formatRate(row.rateBps) : "—"}</TD>
                    <TD
                      className={cn(
                        "text-right font-semibold tabular-nums",
                        row.amountCents < 0 ? "text-red-700" : "text-zinc-900",
                        (row.status === "void" || (row.isTest && live && row.status === "held")) && "text-zinc-400 line-through",
                      )}
                    >
                      {formatMoney(row.amountCents, row.currency)}
                    </TD>
                    <TD>
                      <LedgerStatus row={row} now={now} tz={tz} live={live} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>Money we&apos;ve sent you.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {d.payouts.length === 0 ? (
              <p className="mx-6 mb-6 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
                No payouts yet. You&apos;re paid once you&apos;re owed at least {formatMoney(program.minPayoutCents)}.
              </p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Date</TH>
                    <TH className="text-right">Amount</TH>
                    <TH>Method</TH>
                    <TH>Reference</TH>
                  </TR>
                </THead>
                <TBody>
                  {d.payouts.map((p) => (
                    <TR key={p.id}>
                      <TD className="whitespace-nowrap">{formatDate(p.paidAt, {}, tz)}</TD>
                      <TD className="text-right font-semibold text-zinc-900 tabular-nums">{formatMoney(p.amountCents, p.currency)}</TD>
                      <TD>{p.method ?? "—"}</TD>
                      <TD className="font-mono text-xs break-all">{p.reference ?? "—"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
            <CardDescription>How we pay you, and how you appear to the team.</CardDescription>
          </CardHeader>
          <CardContent>
            {!agent.payoutMethod && (
              <Alert tone="info" className="mb-4">
                Add how you&apos;d like to be paid so your first payout isn&apos;t delayed.
              </Alert>
            )}
            <AgentProfileForm payoutMethod={agent.payoutMethod} payoutHandle={agent.payoutHandle} phone={agent.phone} showOnLeaderboard={agent.showOnLeaderboard} />
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-xs text-zinc-500">
        Earnings depend entirely on your own sales. Questions about a sale or payout? Reply to any of our emails.{" "}
        <Link href="/sales-team/terms" className="underline underline-offset-2 hover:text-zinc-700">
          Program terms
        </Link>
      </p>
    </div>
  );
}

function ledgerLabel(row: AgentCommission, orderTitles: Map<string, string>): string {
  const title = row.orderId ? orderTitles.get(row.orderId) : undefined;
  if (row.kind === "sale") return title ?? "Course sale";
  // Money taken back for a refunded (or partly refunded) sale.
  if (row.kind === "clawback" || (row.kind === "adjustment" && row.orderId)) return `Refund: ${title ?? "course sale"}`;
  if (row.kind === "bonus") return cleanNote(row.note) || "Bonus";
  return cleanNote(row.note) || "Adjustment";
}

/** Recorded for a sale made while the agent was paused (lib/sales/commissions.ts recordAgentSale). */
const PAUSED_SALE_REASON = "Sold while your account was paused";

function LedgerStatus({ row, now, tz, live }: { row: AgentCommission; now: Date; tz: string; live: boolean }) {
  if (row.status === "void" && row.voidReason === PAUSED_SALE_REASON) {
    return (
      <Badge tone="neutral" className="whitespace-nowrap">
        Sold while paused · no commission
      </Badge>
    );
  }
  // A test payment on a site taking real payments is never paid; one paid out while the site ran on test keys stays paid.
  if (row.isTest && live && row.status === "held") {
    return (
      <Badge tone="neutral" className="whitespace-nowrap">
        Test · never paid
      </Badge>
    );
  }
  if (row.isTest && live && row.status === "paid") {
    return (
      <Badge tone="neutral" className="whitespace-nowrap">
        Paid (test)
      </Badge>
    );
  }
  if (row.status === "void") {
    return (
      <span className="flex flex-col">
        <Badge tone="neutral" className="self-start">
          Cancelled
        </Badge>
        {row.voidReason && <span className="mt-1 text-xs text-zinc-500">{row.voidReason}</span>}
      </span>
    );
  }
  if (row.amountCents < 0) {
    return row.status === "paid" ? (
      <Badge tone="neutral">Taken back</Badge>
    ) : (
      <Badge tone="red" className="whitespace-nowrap">
        Taken back from next payout
      </Badge>
    );
  }
  if (row.status === "paid") {
    if (row.kind === "sale" && row.voidedAt) {
      return (
        <span className="flex flex-col">
          <Badge tone="amber" className="self-start whitespace-nowrap">
            Paid, then refunded
          </Badge>
          {row.voidReason && <span className="mt-1 text-xs text-zinc-500">{row.voidReason}</span>}
        </span>
      );
    }
    return <Badge tone="green">Paid</Badge>;
  }
  if (row.note === DISPUTE_NOTE) {
    return (
      <Badge tone="amber" className="whitespace-nowrap">
        <Hourglass aria-hidden /> On hold: payment disputed
      </Badge>
    );
  }
  if (row.availableAt <= now) return <Badge tone="brand">Owed</Badge>;
  return (
    <Badge tone="amber" className="whitespace-nowrap">
      <CalendarClock aria-hidden /> Pending until {formatDate(row.availableAt, SHORT_DATE, tz)}
    </Badge>
  );
}

function LeaderRow({ rank, name, state, sales, you }: { rank: number; name: string; state: string | null; sales: number; you: boolean }) {
  const medal = rank === 1 ? "bg-gold-400 text-ink" : rank === 2 ? "bg-zinc-300 text-zinc-800" : rank === 3 ? "bg-amber-600/80 text-white" : "bg-zinc-100 text-zinc-600";
  return (
    <li className={cn("flex items-center gap-3 rounded-xl px-3 py-2", you ? "bg-brand-50 ring-1 ring-brand-200" : "")}>
      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums", medal)}>{rank}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
        <span className="font-medium">{name}</span>
        {state && <span className="text-zinc-500"> · {state}</span>}
        {you && <span className="ml-1.5 text-xs font-semibold text-brand-700">(you)</span>}
      </span>
      <span className="shrink-0 text-sm font-semibold text-zinc-900 tabular-nums">{pluralize(sales, "sale")}</span>
    </li>
  );
}

function ChallengeCard({ challenge: c, now, tz }: { challenge: ChallengeView; now: Date; tz: string }) {
  const value = (n: number) => (c.metric === "revenue" ? formatMoney(n) : String(n));
  const percent = Math.min(100, Math.round((c.score / Math.max(1, c.target)) * 100));
  const when =
    c.phase === "upcoming"
      ? `Starts ${formatDate(c.startsAt, SHORT_DATE, tz)}`
      : c.phase === "live"
        ? `Ends ${timeAgo(c.endsAt, now)}`
        : // endsAt is the first moment after the last day.
          `Ended ${formatDate(new Date(c.endsAt.getTime() - 1), SHORT_DATE, tz)}`;
  return (
    <li className={cn("rounded-2xl p-4 ring-1 sm:p-5", c.done ? "bg-emerald-50/60 ring-emerald-200" : c.phase === "ended" ? "bg-zinc-50 ring-zinc-200" : "bg-white ring-zinc-200")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-zinc-900">
            {c.title}
            <Badge tone={c.phase === "live" ? "green" : c.phase === "upcoming" ? "blue" : "neutral"}>
              {c.phase === "live" ? "Live" : c.phase === "upcoming" ? "Upcoming" : "Ended"}
            </Badge>
          </p>
          {c.description && <p className="mt-1 text-sm text-zinc-600">{c.description}</p>}
        </div>
        {c.bonusCents > 0 && (
          <span className="shrink-0 rounded-full bg-gold-100 px-3 py-1 text-sm font-semibold text-gold-700 ring-1 ring-gold-200">{formatMoney(c.bonusCents)} bonus</span>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3 text-sm">
        <p className="text-zinc-700">
          Target: <span className="font-medium">{describeTarget(c)}</span>
        </p>
        <p className="shrink-0 text-zinc-500 tabular-nums">
          {value(c.score)} / {value(c.target)}
        </p>
      </div>
      <Progress value={percent} label={`${c.title} progress`} className="mt-2" />
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span>{when}</span>
        {c.finishers > 0 && <span>{pluralize(c.finishers, "agent has", "agents have")} hit the target</span>}
      </p>
      {c.done && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="size-4" aria-hidden />
          {c.phase === "ended"
            ? c.bonusCents > 0
              ? "You hit the target! The bonus is paid once the refund window after the challenge has passed, as long as refunds don't take you back below the target."
              : "You hit the target!"
            : c.bonusCents > 0
              ? "Target hit! Keep it up: refunds before your bonus is paid could take you back below it."
              : "Target hit! Keep it up: refunds before the end could take you back below it."}
        </p>
      )}
    </li>
  );
}
