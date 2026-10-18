import { ArrowRight, CalendarCheck, CheckCircle2, Clock, Mail, PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ButtonLink } from "@/components/ui/button";
import { getStudent } from "@/lib/auth";
import { fulfillOrder, getOrderDetails, isStripeSessionId, withinClaimWindow, type OrderDetails } from "@/lib/payments";
import { getStripe, paymentIntentId } from "@/lib/stripe";
import { formatDateTime } from "@/lib/utils";
import { ClaimAccessForm } from "../checkout-forms";
import { OrderSummary } from "../order-summary";

export const metadata: Metadata = { title: "Thank you", robots: { index: false, follow: false } };

type Search = { order?: string; session_id?: string };

/**
 * Stripe redirects here after payment. When the session id matches the order we trust the URL as
 * proof of purchase: we confirm payment with Stripe (fulfilling now if the webhook hasn't arrived yet,
 * e.g. in local dev) and let the buyer go straight into their course.
 */
async function resolve(search: Search): Promise<{ details: OrderDetails | null; proof: boolean; processing: boolean }> {
  const orderId = search.order;
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
        const sameOrder = (session.metadata?.orderId ?? session.client_reference_id) === details.order.id;
        if (sameOrder && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
          await fulfillOrder(details.order.id, { stripePaymentIntentId: paymentIntentId(session.payment_intent) });
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
    return (
      <Shell icon={<CheckCircle2 className="size-6" aria-hidden />} title="This order was refunded">
        <p className="mx-auto mt-3 max-w-md text-zinc-600">If you have any questions about your refund, just reply to your receipt email.</p>
      </Shell>
    );
  }

  if (order.status !== "paid") {
    if (!trusted) return <CheckEmail loginHref={loginHref} />;
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
    const canClaim = !isBuyer && proof && withinClaimWindow(order);
    return (
      <Shell icon={<PartyPopper className="size-6" aria-hidden />} title="You're in! Welcome aboard.">
        <p className="mx-auto mt-3 max-w-md text-zinc-600">
          Your purchase of <strong className="text-zinc-900">{course.title}</strong> is complete
          {order.isTest ? " (test mode — no real payment was taken)" : ""}. We&apos;ve emailed your receipt and a sign-in link to{" "}
          <strong className="text-zinc-900">{order.email}</strong>.
        </p>
        <div className="mt-6 text-left">
          <OrderSummary details={details} showBuyer={false} />
        </div>
        <div className="mt-8 flex flex-col items-center gap-3">
          {isBuyer ? (
            <ButtonLink href={learnHref} size="lg" className="w-full sm:w-auto">
              Start learning <ArrowRight aria-hidden />
            </ButtonLink>
          ) : canClaim && search.session_id ? (
            <ClaimAccessForm orderId={order.id} sessionId={search.session_id} loginHref={loginHref} />
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
