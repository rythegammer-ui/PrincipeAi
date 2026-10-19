import { asc, count, eq } from "drizzle-orm";
import { CalendarOff, ExternalLink, Globe, Pencil, Plus, Trash2 } from "lucide-react";
import { DateTime } from "luxon";
import type { Metadata } from "next";
import Link from "next/link";
import { AvailabilityEditor } from "@/components/booking/availability-editor";
import { BlockedDateForm } from "@/components/booking/blocked-date-form";
import { meetingColor } from "@/components/booking/meeting-colors";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { checkoutMode } from "@/lib/payments";
import { formatDuration, getBusinessTimezone, loadAvailabilityConfig } from "@/lib/scheduling";
import { cn, formatMoney } from "@/lib/utils";
import { removeBlockedDateAction } from "./actions";

export const metadata: Metadata = { title: "Availability" };

export default async function SchedulingPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const db = await getDb();
  const [types, bookingCounts, config, blocked, timezone] = await Promise.all([
    db.select().from(schema.meetingTypes).orderBy(asc(schema.meetingTypes.sortOrder), asc(schema.meetingTypes.name)),
    db.select({ id: schema.bookings.meetingTypeId, n: count() }).from(schema.bookings).where(eq(schema.bookings.status, "confirmed")).groupBy(schema.bookings.meetingTypeId),
    loadAvailabilityConfig(),
    db.select().from(schema.blockedDates).orderBy(asc(schema.blockedDates.date)),
    getBusinessTimezone(),
  ]);
  const confirmedByType = new Map(bookingCounts.map((r) => [r.id, r.n]));
  const now = DateTime.now().setZone(timezone);
  const todayKey = now.toISODate() ?? "";
  const upcomingBlocked = blocked.filter((b) => b.date >= todayKey);
  const pastBlocked = blocked.length - upcomingBlocked.length;
  // Paid meeting types can't be booked online without a way to pay: the booking page asks visitors to get in touch.
  const paymentsOff = checkoutMode() === "disabled";

  return (
    <div>
      <PageHeader
        title="Availability & meeting types"
        description="Control what people can book, when, and what you ask them beforehand."
        actions={
          <>
            <a href="/book" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm", className: "h-9" })}>
              View booking page <ExternalLink aria-hidden />
            </a>
            <ButtonLink href="/admin/scheduling/types/new" size="sm" className="h-9">
              <Plus aria-hidden /> New meeting type
            </ButtonLink>
          </>
        }
      />

      {saved && (
        <Alert tone="success" className="mb-6">
          &ldquo;{saved}&rdquo; was saved.
        </Alert>
      )}
      {deleted && (
        <Alert tone="success" className="mb-6">
          &ldquo;{deleted}&rdquo; was deleted.
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Meeting types</CardTitle>
              <CardDescription>Each one gets its own booking link at /book/&lt;url&gt;.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-2 sm:px-0">
              {types.length === 0 ? (
                <div className="px-5 sm:px-6">
                  <EmptyState
                    title="No meeting types yet"
                    description="Create one so visitors can book time with you."
                    action={
                      <ButtonLink href="/admin/scheduling/types/new" size="sm">
                        <Plus /> New meeting type
                      </ButtonLink>
                    }
                  />
                </div>
              ) : (
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>Name</TH>
                      <TH>Length</TH>
                      <TH>Price</TH>
                      <TH>Status</TH>
                      <TH className="relative text-right">
                        <span className="sr-only">Actions</span>
                      </TH>
                    </TR>
                  </THead>
                  <TBody>
                    {types.map((t) => (
                      <TR key={t.id}>
                        <TD>
                          <div className="flex items-center gap-2.5">
                            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", meetingColor(t.color).dot)} />
                            <div className="min-w-0">
                              <Link href={`/admin/scheduling/types/${t.id}`} className="font-medium text-zinc-900 hover:text-brand-700 hover:underline">
                                {t.name}
                              </Link>
                              <p className="text-xs text-zinc-500">
                                /book/{t.slug}
                                <span className="hidden md:inline">
                                  {" "}
                                  · {t.bufferMin} min buffer · {t.minNoticeHours}h notice · {t.maxDaysAhead} days ahead
                                  {t.questions.length > 0 && ` · ${t.questions.length} question${t.questions.length === 1 ? "" : "s"}`}
                                </span>
                              </p>
                              {t.active && !t.locationUrl?.trim() && (
                                <p className="mt-1 text-xs text-amber-700">No meeting link: invitees are told you&apos;ll email one before each call.</p>
                              )}
                              {t.active && t.priceCents > 0 && paymentsOff && (
                                <p className="mt-1 text-xs text-amber-700">
                                  Online payment is off, so visitors are asked to contact you instead of booking this online.{" "}
                                  <Link href="/admin/settings" className="font-medium underline-offset-2 hover:underline">
                                    Set up payments
                                  </Link>
                                </p>
                              )}
                            </div>
                          </div>
                        </TD>
                        <TD className="whitespace-nowrap">{formatDuration(t.durationMin)}</TD>
                        <TD className="whitespace-nowrap">{t.priceCents ? formatMoney(t.priceCents) : "Free"}</TD>
                        <TD>
                          <div className="flex flex-col items-start gap-1">
                            {t.active ? <Badge tone="green">Active</Badge> : <Badge tone="neutral">Hidden</Badge>}
                            {(confirmedByType.get(t.id) ?? 0) > 0 && <span className="text-xs text-zinc-500">{confirmedByType.get(t.id)} confirmed</span>}
                          </div>
                        </TD>
                        <TD className="text-right">
                          <div className="flex justify-end gap-1">
                            {t.active && (
                              <a
                                href={`/book/${t.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonVariants({ variant: "ghost", size: "icon" })}
                                aria-label={`Open booking page for ${t.name}`}
                              >
                                <ExternalLink />
                              </a>
                            )}
                            <ButtonLink href={`/admin/scheduling/types/${t.id}`} variant="ghost" size="icon" aria-label={`Edit ${t.name}`}>
                              <Pencil />
                            </ButtonLink>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly hours</CardTitle>
              <CardDescription>When people can book you. Meetings must fit entirely inside a time range.</CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityEditor initialRules={config.rules} timezone={timezone} />
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-4 text-brand-600" aria-hidden /> Business timezone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-zinc-900">{timezone.replace(/_/g, " ")}</p>
              <p className="mt-1 text-sm text-zinc-500">
                It&apos;s {now.toFormat("h:mm a")} ({now.toFormat("ZZZZ")}) there now. Your weekly hours and blocked dates use this timezone; visitors see
                times in their own.
              </p>
              <Link href="/admin/settings" className="mt-3 inline-flex text-sm font-medium text-brand-700 hover:underline">
                Change in Settings
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarOff className="size-4 text-brand-600" aria-hidden /> Blocked dates
              </CardTitle>
              <CardDescription>Days off, holidays and vacations. No new bookings can be made on these dates.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <BlockedDateForm minDate={todayKey} />
              {upcomingBlocked.length === 0 ? (
                <p className="text-sm text-zinc-500">No upcoming blocked dates.</p>
              ) : (
                <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
                  {upcomingBlocked.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{DateTime.fromISO(d.date).toFormat("ccc, LLL d, yyyy")}</p>
                        {d.reason && <p className="truncate text-xs text-zinc-500">{d.reason}</p>}
                      </div>
                      <form action={removeBlockedDateAction}>
                        <input type="hidden" name="id" value={d.id} />
                        <button
                          type="submit"
                          className={buttonVariants({ variant: "ghost", size: "icon", className: "size-10 text-zinc-500 hover:text-red-600" })}
                          aria-label={`Unblock ${d.date}`}
                        >
                          <Trash2 />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              {pastBlocked > 0 && (
                <p className="text-xs text-zinc-400">
                  {pastBlocked} past blocked date{pastBlocked === 1 ? "" : "s"} hidden.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
