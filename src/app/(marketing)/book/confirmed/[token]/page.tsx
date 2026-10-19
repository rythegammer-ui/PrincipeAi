import { ArrowRight, BookOpen, CalendarX2, CheckCircle2, Clock, Gauge, Gift, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCalendar } from "@/components/booking/add-to-calendar";
import { BookingSummary } from "@/components/booking/booking-summary";
import { PendingPaymentActions } from "@/components/booking/pending-payment-actions";
import { ButtonLink } from "@/components/ui/button";
import { bookingGoogleCalendarUrl, getBookingDetails, isHoldExpired, isManageToken, meetingLinkFor, PAID_UNAVAILABLE_REASON, prepTips } from "@/lib/booking-service";
import { describeTime } from "@/lib/scheduling";
import { firstName, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Booking confirmed", robots: { index: false, follow: false } };

const NEXT_STEPS = [
  {
    href: "/assessment",
    icon: Gauge,
    title: "Take the free AI Readiness Assessment",
    body: "Three minutes. Use the same email and we'll have your results ready for our call.",
  },
  {
    href: "/courses",
    icon: BookOpen,
    title: "Browse the courses",
    body: "Self-paced, practical lessons for using AI in everyday work and in your business.",
  },
  {
    href: "/free-guide",
    icon: Gift,
    title: "Grab the free AI Starter Kit",
    body: "Ready-to-use prompts and quick wins you can try before we meet.",
  },
];

export default async function BookingConfirmedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isManageToken(token)) notFound();
  const details = await getBookingDetails({ token });
  if (!details) notFound();
  const { booking, meetingType, contact } = details;
  const rebookHref = meetingType.active ? `/book/${meetingType.slug}` : "/book";
  const name = firstName(contact.name, contact.email);

  if (booking.status === "pending_payment") {
    const expired = isHoldExpired(booking);
    const holdUntil = booking.holdExpiresAt ? describeTime(booking.holdExpiresAt, booking.holdExpiresAt, booking.timezone) : null;
    return (
      <Shell>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <Clock className="size-7" aria-hidden />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          {expired ? "Your reserved time has expired" : "Almost there: complete your payment"}
        </h1>
        <p className="mt-3 text-lg text-zinc-600">
          {expired
            ? "We held this time for 30 minutes, but payment wasn't completed, so it's been released. You're welcome to choose a new time."
            : `We're holding this time for you${holdUntil ? ` until ${holdUntil.startTimeLabel} (${holdUntil.zoneAbbr})` : ""}. Your booking is confirmed as soon as payment goes through, and we'll email your calendar invite.`}
        </p>
        <BookingSummary
          className="mt-8"
          meetingType={meetingType}
          start={booking.startAt}
          end={booking.endAt}
          timezone={booking.timezone}
          status={booking.status}
          showJoin={false}
        />
        {expired ? (
          <ButtonLink href={rebookHref} size="lg" className="mt-8">
            Choose a new time <ArrowRight />
          </ButtonLink>
        ) : (
          <div className="mt-8">
            <PendingPaymentActions token={booking.manageToken} priceLabel={meetingType.priceCents > 0 ? formatMoney(meetingType.priceCents) : undefined}>
              <ButtonLink href={`/booking/${booking.manageToken}`} variant="ghost" size="lg">
                Manage booking
              </ButtonLink>
            </PendingPaymentActions>
          </div>
        )}
      </Shell>
    );
  }

  if (booking.status === "cancelled") {
    const paidButReleased = booking.cancelReason?.startsWith(PAID_UNAVAILABLE_REASON) ?? false;
    return (
      <Shell>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200">
          <CalendarX2 className="size-7" aria-hidden />
        </div>
        {paidButReleased ? (
          <>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">We received your payment, but this time was released</h1>
            <p className="mt-3 text-lg text-zinc-600">
              Sorry, {name}: the time you picked was released before your payment completed, and it&apos;s since been taken. We&apos;ve let the team know,
              and we&apos;ll email you at {contact.email} to arrange a new time or a full refund.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">This booking was cancelled</h1>
            <p className="mt-3 text-lg text-zinc-600">No problem, {name}. Whenever you&apos;re ready, pick a new time that works for you.</p>
          </>
        )}
        <BookingSummary
          className="mt-8"
          meetingType={meetingType}
          start={booking.startAt}
          end={booking.endAt}
          timezone={booking.timezone}
          status={booking.status}
          showJoin={false}
        />
        {!paidButReleased && (
          <ButtonLink href={rebookHref} size="lg" className="mt-8">
            Book a new time <ArrowRight />
          </ButtonLink>
        )}
      </Shell>
    );
  }

  const upcoming = booking.startAt.getTime() > new Date().getTime();
  return (
    <Shell>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
        <CheckCircle2 className="size-7" aria-hidden />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
        You&apos;re <span className="font-display text-[1.1em] font-normal text-brand-700 italic">booked</span>, {name}!
      </h1>
      <p className="mt-3 text-lg text-pretty text-zinc-600">
        We&apos;ve sent a confirmation with a calendar invite to <span className="font-medium break-all text-zinc-900">{contact.email}</span>. If
        it&apos;s not in your inbox in a few minutes, check your spam or promotions folder.
      </p>

      <BookingSummary
        className="mt-8"
        meetingType={meetingType}
        start={booking.startAt}
        end={booking.endAt}
        timezone={booking.timezone}
        meetingUrl={meetingLinkFor(details)}
        status={booking.status}
        showJoin={upcoming && booking.status === "confirmed"}
      />

      {upcoming && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-700">Add it to your calendar</p>
          <AddToCalendar googleUrl={bookingGoogleCalendarUrl(details)} icsUrl={`/api/bookings/${booking.manageToken}/ics`} />
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-gold-200 bg-gold-50/60 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-zinc-900">
          <Lightbulb className="size-5 text-gold-600" aria-hidden /> How to prepare
        </h2>
        <ul className="mt-3 space-y-2.5">
          {prepTips(meetingType).map((tip) => (
            <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-zinc-700">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">While you wait</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {NEXT_STEPS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="group flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <s.icon className="size-5 text-brand-600" aria-hidden />
                <span className="mt-3 text-sm font-semibold text-zinc-900">{s.title}</span>
                <span className="mt-1 flex-1 text-sm leading-relaxed text-zinc-600">{s.body}</span>
                <ArrowRight className="mt-3 size-4 text-brand-600 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-10 text-sm text-zinc-500">
        Need to make a change?{" "}
        <Link href={`/booking/${booking.manageToken}`} className="font-medium text-brand-700 underline-offset-2 hover:underline">
          Reschedule or cancel your booking
        </Link>
        .
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-zinc-50">
      <div aria-hidden className="glow-brand pointer-events-none absolute inset-x-0 top-0 h-80" />
      <div className="container-narrow relative py-12 sm:py-20">{children}</div>
    </section>
  );
}
