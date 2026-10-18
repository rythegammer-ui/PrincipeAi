import { ArrowLeft, BellRing, CheckCircle2, Clock, CreditCard, RefreshCcw, Video } from "lucide-react";
import { DateTime } from "luxon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import { meetingColor } from "@/components/booking/meeting-colors";
import { Badge } from "@/components/ui/badge";
import type { MeetingType } from "@/db/schema";
import { bookingWindow, formatDuration, getActiveMeetingType, getBusinessTimezone, slotsForMeetingType } from "@/lib/scheduling";
import { cn, formatMoney, truncate } from "@/lib/utils";

type Params = { slug: string };
type Search = { name?: string | string[]; email?: string | string[] };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const mt = await getActiveMeetingType(slug);
  if (!mt) return { title: "Book a call" };
  return { title: `Book: ${mt.name}`, description: truncate(mt.description || `Book a ${formatDuration(mt.durationMin)} ${mt.name}.`, 160) };
}

function expectations(mt: MeetingType): string[] {
  if (mt.slug === "implementation-discovery") {
    return [
      "A walkthrough of the processes you'd like to automate",
      "A rough scope, timeline and investment range",
      "Clear next steps, with no obligation",
    ];
  }
  if (mt.priceCents > 0) {
    return [
      "Hands-on help with your real work, not a slide deck",
      "Prompts, workflows or automations built together live",
      "Clear next steps you can keep working on afterwards",
    ];
  }
  return [
    "A focused conversation about your goals and where you're stuck",
    "Practical ideas you can try straight away",
    "An honest recommendation for your best next step",
  ];
}

const one = (v: string | string[] | undefined, max: number) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, max) ?? "";

export default async function BookMeetingPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const meetingType = await getActiveMeetingType(slug);
  if (!meetingType) notFound();

  const timezone = await getBusinessTimezone();
  const { todayKey, lastDateKey } = bookingWindow(meetingType, timezone);
  // Open the calendar on the month of the first available slot.
  const now = new Date().getTime();
  const lookahead = Math.min(meetingType.maxDaysAhead + 1, 45) * 86_400_000;
  const { slots } = await slotsForMeetingType(meetingType, now, now + lookahead).catch(() => ({ slots: [] as string[] }));
  const first = slots[0] ? DateTime.fromISO(slots[0], { zone: timezone }).toISODate() : null;
  const initialMonth = (first ?? todayKey).slice(0, 7);
  const minMonth = todayKey.slice(0, 7);
  // +1 day so visitors ahead of the business timezone can still reach the last bookable slot.
  const maxMonth = (DateTime.fromISO(lastDateKey).plus({ days: 1 }).toISODate() ?? lastDateKey).slice(0, 7);

  const color = meetingColor(meetingType.color);
  const free = meetingType.priceCents === 0;

  return (
    <section className="relative bg-zinc-50">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-72 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container-page relative py-8 sm:py-12">
        <Link href="/book" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="size-4" aria-hidden /> All ways to book
        </Link>

        <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-8">
          <aside className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft lg:sticky lg:top-24">
            <div className={cn("h-1.5 bg-gradient-to-r", color.bar)} aria-hidden />
            <div className="p-6">
              <div className="flex items-center gap-2">
                <Badge tone={free ? "green" : "gold"}>{free ? "Free" : formatMoney(meetingType.priceCents)}</Badge>
                <span className="text-xs font-medium text-zinc-500">One-on-one</span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">{meetingType.name}</h1>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                <li className="flex items-center gap-2">
                  <Clock className="size-4 text-zinc-400" aria-hidden /> {formatDuration(meetingType.durationMin)}
                </li>
                <li className="flex items-center gap-2">
                  <Video className="size-4 text-zinc-400" aria-hidden /> {meetingType.locationLabel}
                </li>
                {!free && (
                  <li className="flex items-center gap-2">
                    <CreditCard className="size-4 text-zinc-400" aria-hidden /> {formatMoney(meetingType.priceCents)}, paid securely at checkout
                  </li>
                )}
              </ul>
              {meetingType.description && <p className="mt-5 text-sm leading-relaxed text-zinc-600">{meetingType.description}</p>}

              <div className="mt-6 border-t border-zinc-100 pt-5">
                <p className="text-xs font-semibold tracking-[0.12em] text-zinc-500 uppercase">What you&apos;ll get</p>
                <ul className="mt-3 space-y-2.5">
                  {expectations(meetingType).map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm text-zinc-700">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="mt-6 space-y-2 rounded-xl bg-zinc-50 p-4 text-xs text-zinc-600">
                <li className="flex items-center gap-2">
                  <RefreshCcw className="size-3.5 text-zinc-400" aria-hidden /> Reschedule or cancel anytime from your email
                </li>
                <li className="flex items-center gap-2">
                  <BellRing className="size-3.5 text-zinc-400" aria-hidden /> Calendar invite plus a reminder before we meet
                </li>
              </ul>
            </div>
          </aside>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft sm:p-8">
            <BookingFlow
              meetingType={{
                slug: meetingType.slug,
                name: meetingType.name,
                durationMin: meetingType.durationMin,
                priceCents: meetingType.priceCents,
                locationLabel: meetingType.locationLabel,
                questions: meetingType.questions,
              }}
              businessTimezone={timezone}
              initialMonth={initialMonth}
              minMonth={minMonth}
              maxMonth={maxMonth < initialMonth ? initialMonth : maxMonth}
              prefill={{ name: one(search.name, 120), email: one(search.email, 254) }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
