import { ArrowRight, Clock, History } from "lucide-react";
import { DateTime } from "luxon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCalendar } from "@/components/booking/add-to-calendar";
import { BookingSummary } from "@/components/booking/booking-summary";
import { ManageBooking } from "@/components/booking/manage-booking";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/config/site";
import {
  bookingGoogleCalendarUrl,
  getBookingDetails,
  isChangeable,
  isHoldExpired,
  isManageToken,
  meetingLinkFor,
  PAID_UNAVAILABLE_REASON,
  paidOrderForBooking,
} from "@/lib/booking-service";
import { bookingWindow, describeTime, getBusinessTimezone } from "@/lib/scheduling";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage your booking", robots: { index: false, follow: false } };

export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const [{ token }, { updated }] = await Promise.all([params, searchParams]);
  if (!isManageToken(token)) notFound();
  const details = await getBookingDetails({ token });
  if (!details) notFound();
  const { booking, meetingType, contact } = details;
  const rebookHref = meetingType.active ? `/book/${meetingType.slug}` : "/book";
  // A session that was paid for (and not refunded): cancelling it is refunded on request, by replying to the email.
  const payment = booking.status === "confirmed" || booking.status === "cancelled" ? await paidOrderForBooking(booking.id) : null;
  const paidLabel = payment ? formatMoney(payment.amountCents, payment.currency) : null;

  const now = new Date();
  const changeable = isChangeable(booking, now);
  const holdExpired = isHoldExpired(booking, now);
  const canReschedule = changeable && booking.status === "confirmed";
  const canCancel = changeable && !holdExpired;
  // Back from checkout without paying (Stripe's cancel_url lands here): let them pay or pick another time.
  const canPay = changeable && booking.status === "pending_payment" && !holdExpired;
  const holdUntil = booking.holdExpiresAt ? describeTime(booking.holdExpiresAt, booking.holdExpiresAt, booking.timezone) : null;
  const isPast = booking.startAt.getTime() <= now.getTime();

  const timezone = await getBusinessTimezone();
  const { todayKey, lastDateKey } = bookingWindow(meetingType, timezone, now);
  const minMonth = todayKey.slice(0, 7);
  const maxMonth = (DateTime.fromISO(lastDateKey).plus({ days: 1 }).toISODate() ?? lastDateKey).slice(0, 7);
  const currentMonth = DateTime.fromJSDate(booking.startAt, { zone: timezone }).toFormat("yyyy-MM");
  const initialMonth = currentMonth < minMonth ? minMonth : currentMonth > maxMonth ? maxMonth : currentMonth;

  return (
    <section className="relative overflow-hidden bg-zinc-50">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-72 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container-narrow relative py-12 sm:py-16">
        <p className="eyebrow">Your booking</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Manage your booking</h1>
        {/* No greeting by name: anyone can book with any email, and the contact's stored name may be someone else's. */}
        <p className="mt-2 text-zinc-600">Here are the details of your booking.</p>

        {updated === "rescheduled" && booking.status === "confirmed" && (
          <Alert tone="success" title="Your booking has been moved" className="mt-6">
            We&apos;ve emailed you an updated calendar invite to {contact.email}.
          </Alert>
        )}
        {updated === "cancelled" && booking.status === "cancelled" && (
          <Alert tone="success" title="Your booking has been cancelled" className="mt-6">
            We&apos;ve let the team know. You&apos;re welcome to book again whenever it suits you.
            {paidLabel && !booking.cancelReason?.startsWith(PAID_UNAVAILABLE_REASON) && (
              <> If you&apos;d like a refund of {paidLabel}, just reply to the cancellation email we&apos;ve sent to {contact.email}.</>
            )}
          </Alert>
        )}

        <BookingSummary
          className="mt-6"
          meetingType={meetingType}
          start={booking.startAt}
          end={booking.endAt}
          timezone={booking.timezone}
          meetingUrl={meetingLinkFor(details)}
          status={booking.status}
          showJoin={booking.status === "confirmed" && !isPast}
        />

        <div className="mt-6 flex flex-col gap-6">
          {booking.status === "confirmed" && !isPast && (
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700">Add it to your calendar</p>
              <AddToCalendar googleUrl={bookingGoogleCalendarUrl(details)} icsUrl={`/api/bookings/${booking.manageToken}/ics`} />
            </div>
          )}

          {booking.status === "pending_payment" && (
            <Alert tone={holdExpired ? "warning" : "info"} title={holdExpired ? "This reserved time has expired" : "Waiting for payment"}>
              {holdExpired
                ? "Payment wasn't completed in time, so this slot has been released. Please choose a new time."
                : `This time is held for you until ${holdUntil ? `${holdUntil.startTimeLabel} ${holdUntil.zoneAbbr}` : "shortly"}. Complete your payment to confirm the booking, or choose a different time.`}
            </Alert>
          )}

          {(canReschedule || canCancel || canPay) && (
            <ManageBooking
              token={booking.manageToken}
              meetingTypeSlug={meetingType.slug}
              durationMin={meetingType.durationMin}
              bookingTimezone={booking.timezone}
              currentStart={booking.startAt.toISOString()}
              canReschedule={canReschedule}
              canCancel={canCancel}
              canPay={canPay}
              priceLabel={meetingType.priceCents > 0 ? formatMoney(meetingType.priceCents) : undefined}
              paidLabel={booking.status === "confirmed" ? (paidLabel ?? undefined) : undefined}
              initialMonth={initialMonth}
              minMonth={minMonth}
              maxMonth={maxMonth < initialMonth ? initialMonth : maxMonth}
            />
          )}

          {!changeable && booking.status !== "pending_payment" && (
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft">
              <div className="flex items-start gap-3">
                {booking.status === "cancelled" ? (
                  <Clock className="mt-0.5 size-5 text-zinc-400" aria-hidden />
                ) : (
                  <History className="mt-0.5 size-5 text-zinc-400" aria-hidden />
                )}
                <p className="text-sm leading-relaxed text-zinc-600">
                  {booking.cancelReason?.startsWith(PAID_UNAVAILABLE_REASON)
                    ? "We received your payment, but this time was released before it completed. We'll email you to arrange a new time or a full refund."
                    : booking.status === "cancelled"
                    ? `This booking has been cancelled, so it can no longer be changed.${paidLabel && updated !== "cancelled" ? ` If you'd like a refund of ${paidLabel}, just email us.` : ""}`
                    : "This meeting has already taken place, so it can no longer be changed online. We hope it was useful!"}
                </p>
              </div>
              <ButtonLink href={rebookHref}>
                Book another time <ArrowRight />
              </ButtonLink>
            </div>
          )}

          {holdExpired && (
            <ButtonLink href={rebookHref} className="self-start">
              Choose a new time <ArrowRight />
            </ButtonLink>
          )}
        </div>

        <p className="mt-10 text-sm text-zinc-500">
          Questions? Email{" "}
          <a href={`mailto:${site.contactEmail}`} className="font-medium text-brand-700 hover:underline">
            {site.contactEmail}
          </a>{" "}
          or{" "}
          <Link href="/book" className="font-medium text-brand-700 hover:underline">
            see all booking options
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
