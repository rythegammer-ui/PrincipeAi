import { CalendarCheck, CalendarRange, DollarSign, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import { SegmentedLinks } from "@/components/admin/range-tabs";
import { BarList } from "@/components/analytics/charts";
import { AttributionTable } from "@/components/funnels/attribution-table";
import { FunnelCard } from "@/components/funnels/funnel-card";
import { TrafficChart } from "@/components/funnels/traffic-chart";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { RANGE_OPTIONS, formatPercent, getFunnelDashboard, parseRangeDays, rate, type EntranceRow } from "@/lib/funnels";
import { formatMoney, pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Funnels" };

const fmt = (n: number) => n.toLocaleString("en-US");

export default async function FunnelsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const days = parseRangeDays(sp.range);
  const { range, funnels, traffic, entrances, attribution } = await getFunnelDashboard(days);
  const rangeLabel = `last ${days} days`;
  const nothingYet = traffic.totalPageViews === 0 && attribution.totals.leads === 0 && funnels.every((f) => f.entered === 0);
  const day = (d: Date, year = false) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: year ? "numeric" : undefined, timeZone: range.tz }).format(d);
  const dateSpan = `${day(range.from)} – ${day(range.to, true)}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0"
        title="Funnels"
        description="Where your visitors come from, where they drop off, and which channels turn into clients."
      />

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedLinks
          label="Date range"
          items={RANGE_OPTIONS.map((d) => ({ href: d === 30 ? "/admin/funnels" : `/admin/funnels?range=${d}`, label: `${d} days`, active: d === days }))}
        />
        <p className="inline-flex items-center gap-1.5 text-sm text-zinc-500">
          <CalendarRange className="size-4" aria-hidden />
          {dateSpan} <span className="hidden sm:inline">· {range.tz.replace(/_/g, " ")}</span>
        </p>
      </div>

      {nothingYet && (
        <Alert tone="info" title="No visits recorded in this period yet">
          Page views and funnel steps are tracked automatically as people use your site: opt-ins, assessments, bookings and purchases. Share your free guide or
          assessment link to start filling these funnels.
        </Alert>
      )}

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Unique visitors" value={fmt(traffic.totalVisitors)} icon={Users} hint={`${fmt(traffic.totalPageViews)} page views`} />
        <StatCard
          label="New leads"
          value={fmt(attribution.totals.leads)}
          icon={UserPlus}
          hint={traffic.totalVisitors > 0 ? `${formatPercent(rate(attribution.totals.leads, traffic.totalVisitors))} of visitors` : undefined}
        />
        <StatCard label="Booked calls" value={fmt(attribution.totals.bookedCalls)} icon={CalendarCheck} hint={`${pluralize(attribution.totals.customers, "customer")}`} />
        <StatCard
          label="Revenue"
          value={formatMoney(attribution.totals.revenueCents)}
          icon={DollarSign}
          hint={attribution.testOrders > 0 ? `includes ${pluralize(attribution.testOrders, "test order")}` : "from paid orders"}
        />
      </section>

      <section aria-labelledby="funnels-heading">
        <h2 id="funnels-heading" className="sr-only">
          Conversion funnels
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {funnels.map((f) => (
            <FunnelCard key={f.id} funnel={f} rangeLabel={rangeLabel} />
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          A person counts at a step only if they completed every earlier step first, within the selected period. Anonymous visits are joined to the contact
          once someone identifies themselves.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Traffic</CardTitle>
          <CardDescription>Daily page views and unique visitors ({rangeLabel}).</CardDescription>
        </CardHeader>
        <CardContent>
          <TrafficChart
            dayKeys={traffic.dayKeys}
            pageViews={traffic.pageViews}
            visitors={traffic.visitors}
            totalPageViews={traffic.totalPageViews}
            totalVisitors={traffic.totalVisitors}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader>
            <CardTitle>Top landing pages</CardTitle>
            <CardDescription>The first page each visitor saw, and how many of them became leads.</CardDescription>
          </CardHeader>
          <CardContent>
            <LandingPages rows={entrances.landingPages} />
          </CardContent>
        </Card>
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Top referrers</CardTitle>
            <CardDescription>Where visitors arrived from (by domain).</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              ariaLabel="Visitors by referring domain"
              emptyMessage="No visits in this period yet."
              labelWidth="8.5rem"
              items={entrances.referrers.map((r) => ({
                key: r.key,
                label: r.label,
                value: r.visitors,
                secondary: r.leads ? pluralize(r.leads, "lead") : undefined,
                color: r.key === "(direct)" ? "other" : undefined,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attribution</CardTitle>
          <CardDescription>
            Results credited to each contact&apos;s first touch. Leads are new contacts in the {rangeLabel}; booked calls, customers and revenue are bookings
            made and orders paid in the same period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttributionTable bySource={attribution.bySource} byChannel={attribution.byChannel} totals={attribution.totals} />
        </CardContent>
      </Card>
    </div>
  );
}

function LandingPages({ rows }: { rows: EntranceRow[] }) {
  if (!rows.length) {
    return <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">No visits in this period yet.</p>;
  }
  const max = Math.max(...rows.map((r) => r.visitors));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[19rem] text-left text-sm">
        <caption className="sr-only">Top landing pages by visitors, with leads and lead rate</caption>
        <thead className="text-xs text-zinc-500 uppercase">
          <tr className="border-b border-zinc-100">
            <th scope="col" className="py-2 pr-3 font-medium tracking-wide">
              Page
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium tracking-wide">
              Visitors
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium tracking-wide">
              Leads
            </th>
            <th scope="col" className="py-2 text-right font-medium tracking-wide">
              Lead rate
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 tabular-nums">
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row" className="max-w-[12rem] py-2 pr-3 font-normal">
                <span className="block truncate font-mono text-xs text-zinc-800" title={r.label}>
                  {r.label}
                </span>
                <span aria-hidden className="mt-1 block h-1.5 overflow-hidden rounded-r-[3px] bg-zinc-100">
                  <span className="block h-full rounded-r-[3px] bg-brand-600" style={{ width: `${(r.visitors / max) * 100}%` }} />
                </span>
              </th>
              <td className="py-2 pr-3 text-right text-zinc-900">{fmt(r.visitors)}</td>
              <td className="py-2 pr-3 text-right text-zinc-700">{fmt(r.leads)}</td>
              <td className="py-2 text-right text-zinc-700">{formatPercent(rate(r.leads, r.visitors))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
