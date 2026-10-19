import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Filter,
  Flame,
  Gauge,
  ListTodo,
  Percent,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActivityIcon } from "@/components/admin/activity-icon";
import { displayName, sourceLabel, STAGE_META, utmSourceLabel, toTaskItem } from "@/components/admin/crm-utils";
import { KpiTile } from "@/components/admin/kpi-tile";
import { SegmentedLinks } from "@/components/admin/range-tabs";
import { ScoreMeter } from "@/components/admin/score-meter";
import { SourceBreakdown } from "@/components/admin/source-breakdown";
import { TaskItem } from "@/components/admin/task-item";
import { BarList, StackedColumnChart } from "@/components/analytics/charts";
import { meetingColor } from "@/components/booking/meeting-colors";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/misc";
import { DASHBOARD_RANGES, getDashboard, parseRange } from "@/lib/crm-queries";
import { cn, formatMoney, timeAgo } from "@/lib/utils";

// title.template from admin/(panel)/layout.tsx only applies to child segments, not this same-segment page.
export const metadata: Metadata = { title: { absolute: "Dashboard · Admin" } };

function SectionHeader({ title, description, href, linkLabel }: { title: string; description?: string; href?: string; linkLabel?: string }) {
  return (
    <CardHeader className="flex-row items-start justify-between gap-3">
      <div>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
          {linkLabel ?? "View all"} <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </CardHeader>
  );
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  const range = parseRange((await searchParams).range);
  const data = await getDashboard(range);
  const now = new Date();
  const { kpis, tz } = data;
  const comparison = `vs prior ${range} days`;

  const header = (
    <PageHeader
      title="Dashboard"
      description={`Leads, pipeline and revenue for the last ${range} days.`}
      actions={
        <SegmentedLinks
          label="Date range"
          items={DASHBOARD_RANGES.map((r) => ({ href: r === 30 ? "/admin" : `/admin?range=${r}`, label: `${r} days`, active: r === range }))}
        />
      }
    />
  );

  const quickActions = (
    <div className="mb-6 flex flex-wrap gap-2">
      <ButtonLink href="/admin/contacts/new" size="sm">
        <UserPlus aria-hidden /> Add contact
      </ButtonLink>
      <ButtonLink href="/admin/tasks#new-task" size="sm" variant="outline">
        <Plus aria-hidden /> Add task
      </ButtonLink>
      <ButtonLink href="/admin/funnels" size="sm" variant="outline">
        <Filter aria-hidden /> View funnels
      </ButtonLink>
      <ButtonLink href="/admin/pipeline" size="sm" variant="ghost">
        Open pipeline <ArrowRight aria-hidden />
      </ButtonLink>
    </div>
  );

  if (data.totalContacts === 0) {
    return (
      <div>
        {header}
        {quickActions}
        <EmptyState
          icon={Users}
          title="Your CRM fills itself as leads arrive"
          description="Every free-guide download, AI assessment, booked call, chat lead and purchase creates a contact here automatically — with its source, timeline and lead score. Share your funnels to get the first ones in."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/assessment" size="sm" variant="outline" target="_blank">
                AI assessment
              </ButtonLink>
              <ButtonLink href="/free-guide" size="sm" variant="outline" target="_blank">
                Free guide
              </ButtonLink>
              <ButtonLink href="/book" size="sm" variant="outline" target="_blank">
                Booking page
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  const pipelineItems = data.pipelineSummary.map((p, i) => ({
    key: p.stage,
    label: STAGE_META[p.stage].label,
    value: p.count,
    secondary: p.dealCents ? formatMoney(p.dealCents) : undefined,
    color: p.stage === "lost" ? ("other" as const) : (`ordinal-${i}` as const),
  }));
  const openDeals = data.pipelineSummary.filter((p) => p.stage !== "customer" && p.stage !== "lost");
  const openValue = openDeals.reduce((s, p) => s + p.dealCents, 0);

  return (
    <div>
      {header}
      {quickActions}

      <section aria-label="Key metrics" className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <KpiTile
          label="New leads"
          value={kpis.leads.value.toLocaleString()}
          icon={Users}
          delta={{ current: kpis.leads.value, previous: kpis.leads.prev }}
          comparison={comparison}
          spark={kpis.leads.spark}
          href={`/admin/contacts`}
        />
        <KpiTile
          label="Calls booked"
          value={kpis.calls.value.toLocaleString()}
          icon={CalendarCheck2}
          delta={{ current: kpis.calls.value, previous: kpis.calls.prev }}
          comparison={comparison}
          spark={kpis.calls.spark}
          href="/admin/bookings"
        />
        <KpiTile
          label="Revenue"
          value={formatMoney(kpis.revenue.value)}
          icon={CircleDollarSign}
          delta={{ current: kpis.revenue.value, previous: kpis.revenue.prev }}
          comparison={comparison}
          hint={kpis.revenue.testOrders > 0 ? "incl. test orders" : undefined}
          spark={kpis.revenue.spark}
          href="/admin/orders"
        />
        <KpiTile
          label="Lead → customer"
          value={kpis.conversion.value === null ? "—" : `${(kpis.conversion.value * 100).toFixed(1)}%`}
          icon={Percent}
          delta={{ current: kpis.conversion.value, previous: kpis.conversion.prev, mode: "points" }}
          comparison={comparison}
          hint={kpis.conversion.value === null ? "no new leads yet" : undefined}
        />
        <KpiTile
          label="Open tasks"
          value={kpis.openTasks.value.toLocaleString()}
          icon={ListTodo}
          hint={
            kpis.openTasks.overdue > 0 ? (
              <span className="font-medium text-red-700">{kpis.openTasks.overdue} overdue</span>
            ) : (
              "nothing overdue"
            )
          }
          href="/admin/tasks"
        />
        <KpiTile
          label="Avg. lead score"
          value={kpis.avgScore.value === null ? "—" : Math.round(kpis.avgScore.value)}
          icon={Gauge}
          delta={{ current: kpis.avgScore.value, previous: kpis.avgScore.prev, mode: "abs" }}
          comparison={comparison}
          hint={kpis.avgScore.value === null ? "of new leads" : undefined}
        />
      </section>

      <div className="mb-6 grid gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        <Card className="min-w-0 xl:col-span-2">
          <SectionHeader title="New leads per day" description="Stacked by where they signed up." />
          <CardContent>
            <StackedColumnChart
              labels={data.days}
              series={data.leadSeries.map((s) => ({ key: s.key, label: s.label, values: s.values }))}
              ariaLabel={`New leads per day for the last ${range} days, by signup path`}
              emptyMessage="No new leads in this period yet."
              totalLabel="All leads"
            />
          </CardContent>
        </Card>
        <Card>
          <SectionHeader title="Pipeline" description={`${formatMoney(openValue)} in open deals`} href="/admin/pipeline" linkLabel="Board" />
          <CardContent>
            <BarList items={pipelineItems} ariaLabel="Contacts and deal value by pipeline stage" labelWidth="6.5rem" emptyMessage="No contacts yet." />
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        <Card>
          <SectionHeader title="Lead sources" description={`New leads, last ${range} days`} href="/admin/funnels" linkLabel="Funnels" />
          <CardContent>
            <SourceBreakdown
              paths={data.sources.map((s) => ({ key: s.key, label: sourceLabel(s.key === "unknown" ? null : s.key), value: s.n }))}
              channels={data.utmSources.map((s) => ({ key: s.key, label: utmSourceLabel(s.key), value: s.n }))}
            />
          </CardContent>
        </Card>

        <Card>
          <SectionHeader title="Hot leads" description="Score 60+ and not yet a customer" href="/admin/contacts?minScore=60&sort=score" />
          <CardContent className="pt-4">
            {data.hotLeads.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
                No hot leads right now. Leads heat up when they take the assessment, chat or book a call.
              </p>
            ) : (
              <ul className="-mx-2 flex flex-col">
                {data.hotLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link href={`/admin/contacts/${lead.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50">
                      <Avatar name={lead.name} email={lead.email} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 truncate text-sm font-medium text-zinc-900">
                          {displayName(lead)}
                          {lead.score >= 80 && <Flame className="size-3.5 shrink-0 text-gold-600" aria-label="Very hot" />}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                          {STAGE_META[lead.stage].label} · active {timeAgo(lead.lastActivityAt, now)}
                        </span>
                      </span>
                      <ScoreMeter score={lead.score} barClassName="w-12" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader title="Upcoming calls" description="Next 5 on the calendar" href="/admin/bookings" />
          <CardContent className="pt-4">
            {data.upcoming.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
                Nothing booked yet. Share your <Link href="/book" className="font-medium text-brand-700 hover:underline">booking page</Link> to fill the calendar.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-100">
                {data.upcoming.map((b) => {
                  const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: tz }).format(b.startAt);
                  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(b.startAt);
                  return (
                    <li key={b.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                      <div className="w-24 shrink-0 text-xs whitespace-nowrap">
                        <p className="font-semibold text-zinc-900">{day}</p>
                        <p className="text-zinc-500 tabular-nums">{time}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-zinc-900">
                          <span aria-hidden className={cn("size-2 shrink-0 rounded-full", meetingColor(b.color).dot)} />
                          {b.meetingType}
                        </p>
                        <Link href={`/admin/contacts/${b.contactId}`} className="block truncate text-xs text-brand-700 hover:underline">
                          {b.contactName || b.contactEmail}
                        </Link>
                      </div>
                      {b.status === "pending_payment" && <Badge tone="amber">Awaiting payment</Badge>}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <SectionHeader title="Due today & overdue" href="/admin/tasks" linkLabel="All tasks" />
          <CardContent className="px-0 pt-3 sm:px-0">
            {data.dueTasks.length === 0 ? (
              <div className="px-5 sm:px-6">
                <p className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-sm text-zinc-500 justify-center">
                  <ClipboardList className="size-4" aria-hidden /> You’re all caught up.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {data.dueTasks.map((t) => (
                  <TaskItem key={t.id} task={toTaskItem(t)} tz={tz} bucket={t.dueAt && t.dueAt < now ? "overdue" : "today"} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader title="Recent activity" description="Across all contacts" />
          <CardContent className="pt-4">
            {data.recent.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">No activity yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.recent.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <ActivityIcon type={a.type} className="size-7 [&_svg]:size-3.5" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="break-words text-zinc-700">
                        <Link href={`/admin/contacts/${a.contactId}`} className="font-medium text-zinc-900 hover:text-brand-700">
                          {a.contactName || a.contactEmail}
                        </Link>{" "}
                        <span className="text-zinc-400">·</span> {a.title}
                      </p>
                      <time dateTime={a.createdAt.toISOString()} className="text-xs text-zinc-500">
                        {timeAgo(a.createdAt, now)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-zinc-500">
        <CalendarDays className="size-3.5" aria-hidden /> Days are counted in {tz.replace(/_/g, " ")}.
      </p>
    </div>
  );
}
