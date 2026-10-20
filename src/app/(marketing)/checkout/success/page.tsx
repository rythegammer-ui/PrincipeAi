import { eq } from "drizzle-orm";
import { AlertTriangle, ArrowRight, CalendarCheck, CalendarX, CheckCircle2, Clock, Mail, PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ButtonLink } from "@/components/ui/button";
import { getStudent } from "@/lib/auth";
import { PAID_UNAVAILABLE_REASON } from "@/lib/booking-service";
import { getDb, schema } from "@/db";
import { fulfillOrder, getOrderDetails, isDuplicatePurchase, isStripeSessionId, orderIdForCheckoutSession, withinClaimWindow, type OrderDetails } from "@/lib/payments";
import { rateLimitByIp } from "@/lib/rate-limit";
import { getStripe, paymentIntentId } from "@/lib/stripe";
import { formatDateTime } from "@/lib/utils";
import { AccessLinkForm } from "../checkout-forms";
import { OrderSummary } from "../order-summary";

export const metadata: Metadata = { title: "Thank you", robots: { index: false, follow: false } };

type Search = { order?: string; session_id?: string };

/**
 * A Stripe Payment Link sends buyers back with only `session_id` (no order id): finds the order for that session,
 * creating it from Stripe's copy of the session when the webhook hasn't arrived yet. The session id can't be guessed;
 * lookups that have to ask Stripe are rate limited all the same.
 */
async function orderIdForSession(sessionId: string): Promise<string | null> {
  const db = await getDb();
  const [order] = await db.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.stripeSessionId, sessionId)).limit(1);
  if (order) return order.id;
  const stripe = getStripe();
  if (!stripe || !(await rateLimitByIp("checkout-session-lookup", 20, 600)).ok) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_link ? await orderIdForCheckoutSession(session, { create: true }) : null;
  } catch (err) {
    console.error("[checkout] could not look up Stripe session", err);
    return null;
  }
}

/**
 * Stripe redirects here after payment. When the session id matches the order we trust the URL as
 * proof of purchase: we confirm payment with Stripe (fulfilling now if the webhook hasn't arrived yet,
 * e.g. in local dev) and show the order. It is NOT proof of identity — the buyer typed the email at
 * checkout — so course access always goes through the magic link emailed to that address.
 */
async function resolve(search: Search): Promise<{ details: OrderDetails | null; proof: boolean; processing: boolean }> {
  let orderId = search.order;
  if (!orderId && search.session_id && isStripeSessionId(search.session_id) && search.session_id.length <= 200) {
    orderId = (await orderIdForSession(search.session_id)) ?? undefined;
  }
  if (!orderId || !z.uuid().safeParse(orderId).success) return { details: null, proof: false, processing: false };
  let details = await getOrderDetails(orderId);
  if (!details) return { details: null, proof: false, processing: false };

  const sessionId = search.session_id;
  const proof = Boolean(sessionId && details.order.stripeSessionId && details.order.stripeSessionId === sessionId);
  let processing = false;

  if (proof && sessionId && isStripeSessionId(sessionId) && (details.order.status === "pending" || details.order.status === "expired")) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        // Our own checkouts carry the order id; a payment-link checkout's order was made for this session.
        const sameOrder = session.payment_link ? session.id === details.order.stripeSessionId : (session.metadata?.orderId ?? session.client_reference_id) === details.order.id;
        if (sameOrder && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
          await fulfillOrder(details.order.id, {
            stripePaymentIntentId: paymentIntentId(session.payment_intent),
            isTest: session.livemode === false,
            amountPaidCents: session.amount_total,
          });
          details = (await getOrderDetails(orderId)) ?? details;
        } else if (sameOrder && session.status === "complete") {
          processing = true; // delayed payment method (e.g. bank debit) still clearing
        }
      } catch (err) {
        console.error("[checkout] could not confirm Stripe session", err);
      }
    }
  }
  return { details, proof, processing };
}

function Shell({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-zinc-50 py-14 sm:py-24">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" aria-hidden />
      <div className="relative mx-auto w-full max-w-xl px-4 sm:px-6">
        <div className="animate-fade-up rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-lift sm:p-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm shadow-brand-900/30">
            {icon}
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">{title}</h1>
          {children}
        </div>
      </div>
    </section>
  );
}

function CheckEmail({ loginHref }: { loginHref?: string }) {
  return (
    <Shell icon={<Mail className="size-6" aria-hidden />} title="Payment received — check your email">
      <p className="mx-auto mt-3 max-w-md text-zinc-600">
        Thank you! Your receipt and everything you need to get started are on their way to your inbox. If you don&apos;t see them in a few
        minutes, check your spam folder.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href={loginHref ?? "/login"}>Sign in to your courses</ButtonLink>
        <ButtonLink href="/" variant="outline">
          Back to home
        </ButtonLink>
      </div>
    </Shell>
  );
}

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const { details, proof, processing } = await resolve(search);
  if (!details) return <CheckEmail />;

  const { order, course, booking } = details;
  const student = await getStudent();
  const isBuyer = Boolean(student && student.email === order.email);
  const learnHref = course ? `/learn/${course.slug}` : "/learn";
  const loginHref = `/login?next=${encodeURIComponent(learnHref)}`;
  const trusted = proof || isBuyer;

  if (order.status === "refunded") {
    // Paid for a course this email already had (checkout doesn't reveal ownership): refunded automatically.
    // Only the payer sees why — anyone else with the order link gets the plain notice below.
    if (trusted && course && (await isDuplicatePurchase(order))) {
      return (
        <Shell icon={<CheckCircle2 className="size-6" aria-hidden />} title="You already have this course">
          <p className="mx-auto mt-3 max-w-md text-zinc-600">
            <strong className="text-zinc-900">{order.email}</strong> already has access to <strong className="text-zinc-900">{course.title}</strong>, so
            this payment has been refunded in full{order.isTest ? " (test mode — no real payment was taken)" : ""}. We&apos;ve emailed a one-click
            sign-in link to that address.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={isBuyer ? learnHref : loginHref}>
              {isBuyer ? "Go to course" : "Sign in to start learning"} <ArrowRight aria-hidden />
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline">
              Contact us
            </ButtonLink>
          </div>
        </Shell>
      );
    }
    return (
      <Shell icon={<CheckCircle2 className="size-6" aria-hidden />} title="This order was refunded">
        <p className="mx-auto mt-3 max-w-md text-zinc-600">If you have any questions about your refund, just reply to your receipt email.</p>
      </Shell>
    );
  }

  // A paid session whose booking is still awaiting payment is mid-confirmation: show the same "confirming" view.
  if (order.status !== "paid" || (order.itemType === "booking" && booking?.status === "pending_payment")) {
    if (!trusted) return <CheckEmail loginHref={loginHref} />;
    if ((order.status === "failed" || order.status === "expired") && !processing) {
      const retryHref = course ? `/courses/${course.slug}` : "/book";
      return (
        <Shell icon={<AlertTriangle className="size-6" aria-hidden />} title="Your payment didn't go through">
          <p className="mx-auto mt-3 max-w-md text-zinc-600">
            We weren&apos;t able to collect the payment for this order, so it wasn&apos;t completed. You can start again and choose a different
            payment method.
          </p>
          <div className="mt-6 text-left">
            <OrderSummary details={details} showBuyer={false} />
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={retryHref}>{course ? "Try again" : "Pick a time again"}</ButtonLink>
            <ButtonLink href="/contact" variant="outline">
              Contact us
            </ButtonLink>
          </div>
        </Shell>
      );
    }
    return (
      <Shell icon={<Clock className="size-6" aria-hidden />} title={processing ? "Your payment is processing" : "Confirming your payment…"}>
        <p className="mx-auto mt-3 max-w-md text-zinc-600">
          {processing
            ? "Some payment methods take a little while to clear. We'll email you the moment it's confirmed — no need to keep this page open."
            : "This usually takes just a few seconds. Refresh this page in a moment — we'll also email you as soon as it's confirmed."}
        </p>
        <div className="mt-6">
          <OrderSummary details={details} />
        </div>
        <ButtonLink href={`/checkout/success?order=${order.id}${search.session_id ? `&session_id=${encodeURIComponent(search.session_id)}` : ""}`} variant="outline" className="mt-6">
          Refresh status
        </ButtonLink>
      </Shell>
    );
  }

  if (order.itemType === "course" && course) {
    if (!trusted) return <CheckEmail loginHref={loginHref} />;
    // The URL proves the purchase, not the email address: the buyer signs in through the emailed link.
    const canResend = !isBuyer && proof && withinClaimWindow(order);
    return (
      <Shell icon={<PartyPopper className="size-6" aria-hidden />} title="You're in! Welcome aboard.">
        <p className="mx-auto mt-3 max-w-md text-zinc-600">
          Your purchase of <strong className="text-zinc-900">{course.title}</strong> is complete
          {order.isTest ? " (test mode — no real payment was taken)" : ""}. We&apos;ve emailed your receipt and a one-click sign-in link to{" "}
          <strong className="text-zinc-900">{order.email}</strong>
          {isBuyer ? "." : " — open it to start learning."}
        </p>
        <div className="mt-6 text-left">
          <OrderSummary details={details} showBuyer={false} />
        </div>
        <div className="mt-8 flex flex-col items-center gap-3">
          {isBuyer ? (
            <ButtonLink href={learnHref} size="lg" className="w-full sm:w-auto">
              Start learning <ArrowRight aria-hidden />
            </ButtonLink>
          ) : canResend && search.session_id ? (
            <AccessLinkForm orderId={order.id} sessionId={search.session_id} loginHref={loginHref} />
          ) : (
            <ButtonLink href={loginHref} size="lg" className="w-full sm:w-auto">
              Sign in to start learning <ArrowRight aria-hidden />
            </ButtonLink>
          )}
          <p className="text-xs text-zinc-500">Tip: bookmark your student portal — you can always sign in with just your email.</p>
        </div>
      </Shell>
    );
  }

  if (order.itemType === "booking" && booking) {
    if (!proof) return <CheckEmail />;
    if (booking.status === "cancelled") {
      // Paid after the hold lapsed and someone else took the time — or the booking was cancelled since.
      const lostSlot = Boolean(booking.cancelReason?.startsWith(PAID_UNAVAILABLE_REASON));
      return (
        <Shell icon={<CalendarX className="size-6" aria-hidden />} title={lostSlot ? "Payment received — but this time is no longer available" : "This session was cancelled"}>
          <p className="mx-auto mt-3 max-w-md text-zinc-600">
            {lostSlot
              ? "Your payment arrived after the time you picked had been released, and it's no longer available. We'll contact you shortly to find a new time or refund you in full."
              : "This booking has been cancelled. If you have any questions about it or your payment, we're happy to help."}
            {order.isTest ? " (Test mode — no real payment was taken.)" : ""}
          </p>
          <div className="mt-6 text-left">
            <OrderSummary details={details} showBuyer={false} />
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/contact">Contact us</ButtonLink>
            <ButtonLink href={`/booking/${booking.manageToken}`} variant="outline">
              View your booking
            </ButtonLink>
          </div>
        </Shell>
      );
    }
    return (
      <Shell icon={<CalendarCheck className="size-6" aria-hidden />} title="Your session is confirmed">
        <p className="mx-auto mt-3 max-w-md text-zinc-600">
          See you on <strong className="text-zinc-900">{formatDateTime(booking.startAt, booking.timezone)}</strong>
          {order.isTest ? " (test mode — no real payment was taken)" : ""}. A calendar invite and your receipt are on their way to{" "}
          <strong className="text-zinc-900">{order.email}</strong>.
        </p>
        <div className="mt-6 text-left">
          <OrderSummary details={details} showBuyer={false} />
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={`/booking/${booking.manageToken}`}>Manage your booking</ButtonLink>
          <ButtonLink href="/courses" variant="outline">
            Explore our courses
          </ButtonLink>
        </div>
        <p className="mt-6 text-xs text-zinc-500">
          Need to change something? Use the manage link above or in your confirmation email to reschedule or cancel.{" "}
          <Link href="/contact" className="font-medium text-brand-700 hover:underline">
            Contact us
          </Link>{" "}
          with any questions.
        </p>
      </Shell>
    );
  }

  return <CheckEmail loginHref={loginHref} />;
}
