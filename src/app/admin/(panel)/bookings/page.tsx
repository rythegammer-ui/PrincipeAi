import { and, asc, desc, eq, gt, gte, inArray, lt, lte, or, sql, type SQL } from "drizzle-orm";
import { CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, ExternalLink, List, Mail, UserX, Video } from "lucide-react";
import { DateTime } from "luxon";
import type { Metadata } from "next";
import Link from "next/link";
import { CancelAction, OutcomeActions } from "@/components/booking/admin-booking-actions";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { meetingColor } from "@/components/booking/meeting-colors";
import { WeekGrid } from "@/components/booking/week-grid";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Avatar, EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { getDb, schema } from "@/db";
import { describeTime, loadAvailabilityConfig, getBusinessTimezone, occupiesSlot } from "@/lib/scheduling";
import { cn, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Bookings" };

type Tab = "upcoming" | "past" | "cancelled";
const TABS: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
];

const b = schema.bookings;

async function loadRows(where: SQL | undefined, order: "asc" | "desc", limit = 200) {
  const db = await getDb();
  return db
    .select({
      booking: b,
      meetingType: {
        name: schema.meetingTypes.name,
        slug: schema.meetingTypes.slug,
        color: schema.meetingTypes.color,
        priceCents: schema.meetingTypes.priceCents,
        questions: schema.meetingTypes.questions,
        locationUrl: schema.meetingTypes.locationUrl,
      },
      contact: { id: schema.contacts.id, name: schema.contacts.name, email: schema.contacts.email, phone: schema.contacts.phone },
    })
    .from(b)
    .innerJoin(schema.meetingTypes, eq(schema.meetingTypes.id, b.meetingTypeId))
    .innerJoin(schema.contacts, eq(schema.contacts.id, b.contactId))
    .where(where)
    .orderBy(order === "asc" ? asc(b.startAt) : desc(b.startAt))
    .limit(limit);
}

type Row = Awaited<ReturnType<typeof loadRows>>[number];

function tabWhere(tab: Tab, now: Date): SQL | undefined {
  if (tab === "upcoming") return and(gt(b.endAt, now), or(eq(b.status, "confirmed"), and(eq(b.status, "pending_payment"), gt(b.holdExpiresAt, now))));
  if (tab === "past") return and(lte(b.endAt, now), inArray(b.status, ["confirmed", "completed", "no_show"]));
  return or(eq(b.status, "cancelled"), and(eq(b.status, "pending_payment"), lte(b.holdExpiresAt, now)));
}

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; view?: string; week?: string }> }) {
  const sp = await searchParams;
  const tab: Tab = sp.tab === "past" || sp.tab === "cancelled" ? sp.tab : "upcoming";
  const view = sp.view === "week" ? "week" : "list";
  const timezone = await getBusinessTimezone();
  const now = new Date();
  const db = await getDb();

  const count = (cond: SQL) => sql<number>`count(*) filter (where ${cond})`.mapWith(Number);
  const [stats] = await db
    .select({
      upcoming: count(tabWhere("upcoming", now)!),
      next7: count(and(eq(b.status, "confirmed"), gt(b.startAt, now), lte(b.startAt, new Date(now.getTime() + 7 * 86_400_000)))!),
      awaiting: count(and(eq(b.status, "pending_payment"), gt(b.holdExpiresAt, now))!),
      needsOutcome: count(and(eq(b.status, "confirmed"), lte(b.endAt, now))!),
      completed30: count(and(eq(b.status, "completed"), gte(b.startAt, new Date(now.getTime() - 30 * 86_400_000)))!),
      noShow30: count(and(eq(b.status, "no_show"), gte(b.startAt, new Date(now.getTime() - 30 * 86_400_000)))!),
    })
    .from(b);

  const viewToggle = (
    <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-0.5 shadow-xs" role="group" aria-label="View">
      <Link
        href={`/admin/bookings?tab=${tab}`}
        aria-current={view === "list" ? "page" : undefined}
        className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium", view === "list" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}
      >
        <List className="size-4" aria-hidden /> List
      </Link>
      <Link
        href="/admin/bookings?view=week"
        aria-current={view === "week" ? "page" : undefined}
        className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium", view === "week" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}
      >
        <CalendarDays className="size-4" aria-hidden /> Week
      </Link>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Bookings"
        description={`Calls and sessions booked through your site. Times shown in ${timezone.replace(/_/g, " ")}.`}
        actions={
          <>
            {viewToggle}
            <ButtonLink href="/admin/scheduling" variant="outline" size="sm" className="h-9">
              Availability
            </ButtonLink>
            <a href="/book" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm", className: "h-9" })}>
              Booking page <ExternalLink aria-hidden />
            </a>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Next 7 days" value={stats?.next7 ?? 0} icon={CalendarCheck2} hint="confirmed" />
        <StatCard label="Awaiting payment" value={stats?.awaiting ?? 0} icon={CircleDollarSign} hint="held slots" />
        <StatCard label="Completed" value={stats?.completed30 ?? 0} icon={CalendarDays} hint="last 30 days" />
        <StatCard label="No-shows" value={stats?.noShow30 ?? 0} icon={UserX} hint="last 30 days" />
      </div>

      {view === "week" ? (
        <WeekView timezone={timezone} weekParam={sp.week} now={now} />
      ) : (
        <ListView tab={tab} timezone={timezone} now={now} counts={{ upcoming: stats?.upcoming ?? 0, past: stats?.needsOutcome ?? 0 }} />
      )}
    </div>
  );
}

async function ListView({ tab, timezone, now, counts }: { tab: Tab; timezone: string; now: Date; counts: { upcoming: number; past: number } }) {
  const rows = await loadRows(tabWhere(tab, now), tab === "upcoming" ? "asc" : "desc");
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = DateTime.fromJSDate(r.booking.startAt, { zone: timezone }).toISODate() ?? "";
    const list = groups.get(key);
    if (list) list.push(r);
    else groups.set(key, [r]);
  }
  const today = DateTime.fromJSDate(now, { zone: timezone }).startOf("day");

  return (
    <div>
      <nav aria-label="Booking lists" className="mb-4 flex gap-1 border-b border-zinc-200">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/bookings?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors",
              tab === t.id ? "border-brand-600 text-brand-700" : "border-transparent text-zinc-500 hover:text-zinc-800",
            )}
          >
            {t.label}
            {t.id === "upcoming" && counts.upcoming > 0 && <Badge tone="brand">{counts.upcoming}</Badge>}
            {t.id === "past" && counts.past > 0 && (
              <Badge tone="amber" title="Past bookings without an outcome">
                {counts.past} to review
              </Badge>
            )}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={tab === "upcoming" ? "No upcoming bookings yet" : tab === "past" ? "No past bookings" : "No cancelled bookings"}
          description={
            tab === "upcoming"
              ? "Share your booking page, or link to it from your emails and social profiles. New bookings appear here instantly."
              : "Nothing to show here yet."
          }
          action={
            tab === "upcoming" ? (
              <ButtonLink href="/book" target="_blank" variant="outline" size="sm">
                Open booking page <ExternalLink />
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {[...groups.entries()].map(([key, list]) => {
            const day = DateTime.fromISO(key, { zone: timezone });
            const diff = Math.round(day.diff(today, "days").days);
            const relative = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday" : null;
            return (
              <section key={key} aria-labelledby={`day-${key}`}>
                <h2 id={`day-${key}`} className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  {day.toFormat("cccc, LLLL d")}
                  {day.year !== today.year && <span className="font-normal text-zinc-500">{day.year}</span>}
                  {relative && <Badge tone={diff === 0 ? "brand" : "neutral"}>{relative}</Badge>}
                </h2>
                <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
                  {list.map((r) => (
                    <BookingRow key={r.booking.id} row={r} tab={tab} timezone={timezone} now={now} />
                  ))}
                </ul>
              </section>
            );
          })}
          {rows.length >= 200 && <p className="text-center text-xs text-zinc-500">Showing the 200 most relevant bookings.</p>}
        </div>
      )}
    </div>
  );
}

function BookingRow({ row, tab, timezone, now }: { row: Row; tab: Tab; timezone: string; now: Date }) {
  const { booking, meetingType, contact } = row;
  const biz = describeTime(booking.startAt, booking.endAt, timezone);
  const theirs = booking.timezone !== timezone ? describeTime(booking.startAt, booking.endAt, booking.timezone) : null;
  const color = meetingColor(meetingType.color);
  const labels = new Map(meetingType.questions.map((q) => [q.id, q.label]));
  const answers = Object.entries(booking.answers ?? {}).filter(([, v]) => typeof v === "string" && v.trim());
  const meetingLink = booking.meetingUrl || meetingType.locationUrl;
  const holdExpired = booking.status === "pending_payment" && (!booking.holdExpiresAt || booking.holdExpiresAt <= now);
  const needsOutcome = tab === "past" && booking.status === "confirmed";

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
      <div className="shrink-0 sm:w-36">
        <p className="font-semibold text-zinc-900 tabular-nums">{biz.timeLabel}</p>
        <p className="text-xs text-zinc-500">{biz.zoneAbbr}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Avatar name={contact.name} email={contact.email} className="size-7 text-[10px]" />
          <Link href={`/admin/contacts/${contact.id}`} className="font-semibold text-zinc-900 hover:text-brand-700 hover:underline">
            {contact.name || contact.email}
          </Link>
          {holdExpired ? <Badge tone="neutral">Hold expired</Badge> : <BookingStatusBadge status={booking.status} />}
          {needsOutcome && <Badge tone="amber">Needs outcome</Badge>}
        </div>
        <p className="mt-1 truncate text-sm text-zinc-500">
          <a href={`mailto:${contact.email}`} className="hover:text-zinc-800 hover:underline">
            {contact.email}
          </a>
          {contact.phone && (
            <>
              {" · "}
              <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`} className="hover:text-zinc-800 hover:underline">
                {contact.phone}
              </a>
            </>
          )}
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
          <span aria-hidden className={cn("size-2 rounded-full", color.dot)} />
          {meetingType.name}
          {meetingType.priceCents > 0 && <span className="text-zinc-500">· {formatMoney(meetingType.priceCents)}</span>}
        </p>
        {theirs && (
          <p className="mt-1 text-xs text-zinc-500">
            Their time: {theirs.shortDateLabel}, {theirs.startTimeLabel} {theirs.zoneAbbr} ({booking.timezone.replace(/_/g, " ")})
          </p>
        )}
        {booking.status === "cancelled" && (
          <p className="mt-2 text-xs text-zinc-600">
            Cancelled{booking.cancelledAt ? ` ${DateTime.fromJSDate(booking.cancelledAt, { zone: timezone }).toFormat("LLL d, h:mm a")}` : ""}
            {booking.cancelReason ? (
              <>
                : <span className="whitespace-pre-wrap text-zinc-800">{booking.cancelReason}</span>
              </>
            ) : null}
          </p>
        )}
        {(answers.length > 0 || booking.notes) && (
          <details className="group mt-3 rounded-xl bg-zinc-50 px-3 py-2 text-sm">
            <summary className="cursor-pointer list-none font-medium text-zinc-700 select-none marker:hidden hover:text-zinc-900 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1">
                <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
                Intake answers ({answers.length + (booking.notes ? 1 : 0)})
              </span>
            </summary>
            <dl className="mt-2 space-y-2 pb-1">
              {answers.map(([id, value]) => (
                <div key={id}>
                  <dt className="text-xs font-medium text-zinc-500">{labels.get(id) ?? id}</dt>
                  <dd className="whitespace-pre-wrap text-zinc-800">{value}</dd>
                </div>
              ))}
              {booking.notes && (
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Notes</dt>
                  <dd className="whitespace-pre-wrap text-zinc-800">{booking.notes}</dd>
                </div>
              )}
            </dl>
          </details>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:max-w-80 sm:flex-col sm:items-end">
        {meetingLink && tab === "upcoming" && (
          <a href={meetingLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm", className: "h-9 sm:h-8" })}>
            <Video aria-hidden /> Meeting link
          </a>
        )}
        {!meetingLink && tab === "upcoming" && booking.status === "confirmed" && (
          // No link on the booking or its type: the invitee was told "we'll email your meeting link".
          <a
            href={`mailto:${contact.email}?subject=${encodeURIComponent(`Your meeting link: ${meetingType.name}, ${biz.shortDateLabel}`)}`}
            className={buttonVariants({ variant: "outline", size: "sm", className: "h-9 border-amber-300 text-amber-800 hover:bg-amber-50 sm:h-8" })}
          >
            <Mail aria-hidden /> Email meeting link
          </a>
        )}
        <a
          href={`/booking/${booking.manageToken}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 sm:min-h-0"
        >
          Invitee page <ExternalLink className="size-3" aria-hidden />
        </a>
        {tab === "upcoming" && <CancelAction id={booking.id} paid={booking.status === "confirmed" && meetingType.priceCents > 0} />}
        {tab === "past" && <OutcomeActions id={booking.id} status={booking.status} />}
      </div>
    </li>
  );
}

async function WeekView({ timezone, weekParam, now }: { timezone: string; weekParam?: string; now: Date }) {
  const requested = weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? DateTime.fromISO(weekParam, { zone: timezone }) : null;
  const base = requested?.isValid ? requested : DateTime.fromJSDate(now, { zone: timezone });
  const weekStart = base.startOf("week"); // ISO week: Monday
  const weekEnd = weekStart.plus({ weeks: 1 });
  const [rows, config, blocked] = await Promise.all([
    loadRows(and(gte(b.startAt, weekStart.toJSDate()), lt(b.startAt, weekEnd.toJSDate()), occupiesSlot(now)), "asc", 500),
    loadAvailabilityConfig(),
    (async () => {
      const db = await getDb();
      return db.select({ date: schema.blockedDates.date, reason: schema.blockedDates.reason }).from(schema.blockedDates);
    })(),
  ]);
  const key = (dt: DateTime) => dt.toISODate() ?? "";
  const thisWeek = DateTime.fromJSDate(now, { zone: timezone }).startOf("week");
  const label =
    weekStart.month === weekEnd.minus({ days: 1 }).month
      ? `${weekStart.toFormat("LLLL d")} – ${weekEnd.minus({ days: 1 }).toFormat("d, yyyy")}`
      : `${weekStart.toFormat("LLL d")} – ${weekEnd.minus({ days: 1 }).toFormat("LLL d, yyyy")}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900">{label}</h2>
        <div className="flex items-center gap-1">
          <ButtonLink href={`/admin/bookings?view=week&week=${key(weekStart.minus({ weeks: 1 }))}`} variant="outline" size="icon" aria-label="Previous week">
            <ChevronLeft />
          </ButtonLink>
          {!weekStart.hasSame(thisWeek, "day") && (
            <ButtonLink href="/admin/bookings?view=week" variant="outline" size="sm" className="h-9">
              This week
            </ButtonLink>
          )}
          <ButtonLink href={`/admin/bookings?view=week&week=${key(weekStart.plus({ weeks: 1 }))}`} variant="outline" size="icon" aria-label="Next week">
            <ChevronRight />
          </ButtonLink>
        </div>
      </div>
      <WeekGrid
        timezone={timezone}
        weekStartKey={key(weekStart)}
        now={now}
        rules={config.rules}
        blockedDates={blocked}
        bookings={rows.map((r) => ({
          id: r.booking.id,
          startAt: r.booking.startAt,
          endAt: r.booking.endAt,
          status: r.booking.status,
          meetingType: { name: r.meetingType.name, color: r.meetingType.color },
          contact: { id: r.contact.id, name: r.contact.name, email: r.contact.email },
        }))}
      />
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-sm bg-brand-50 ring-1 ring-brand-100" /> Bookable hours
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-sm border border-dashed border-amber-400 bg-amber-50" /> Awaiting payment
        </span>
        <span>{rows.length === 0 ? "No bookings this week." : `${rows.length} booking${rows.length === 1 ? "" : "s"} this week.`}</span>
      </p>
    </div>
  );
}
