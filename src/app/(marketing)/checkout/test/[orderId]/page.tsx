import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { testCheckoutAllowed } from "@/lib/integrations";
import { bookingHoldExpired, getOrderDetails } from "@/lib/payments";
import { formatMoney } from "@/lib/utils";
import { TestPurchaseForm } from "../../checkout-forms";
import { OrderSummary } from "../../order-summary";

export const metadata: Metadata = { title: "Test checkout", robots: { index: false, follow: false } };

export default async function TestCheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  if (!testCheckoutAllowed()) notFound();
  const { orderId } = await params;
  if (!z.uuid().safeParse(orderId).success) notFound();
  const details = await getOrderDetails(orderId);
  if (!details) notFound();
  const { order, course, booking } = details;
  if (order.status === "paid") redirect(`/checkout/success?order=${order.id}`);

  const backHref = course ? `/courses/${course.slug}` : booking ? `/booking/${booking.manageToken}` : "/";
  const holdExpired = order.itemType === "booking" && bookingHoldExpired(booking);
  const inactive = order.status !== "pending" || holdExpired;

  return (
    <section className="bg-zinc-50 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6">
        <Alert tone="warning" title="Test mode — no real payment">
          Stripe isn&apos;t connected yet, so this simulated checkout lets you try the full purchase flow end to end. No card is needed and
          nothing is charged. Add <code>STRIPE_SECRET_KEY</code> to accept real payments.
        </Alert>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lift sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Checkout</h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Lock className="size-3.5" aria-hidden /> Simulated
            </span>
          </div>
          <div className="mt-5">
            <OrderSummary details={details} />
          </div>
          <div className="mt-6">
            {inactive ? (
              <div className="flex flex-col gap-3">
                <Alert tone="info" title="This checkout is no longer active">
                  {holdExpired
                    ? "The hold on this time slot has expired, so it has been released. Please choose a new time."
                    : "This checkout has expired. Start again and it only takes a moment."}
                </Alert>
                <ButtonLink href={course ? `/courses/${course.slug}` : "/book"} variant="outline" className="w-full">
                  {course ? "Back to the course" : "Choose a new time"}
                </ButtonLink>
              </div>
            ) : (
              <TestPurchaseForm orderId={order.id} amountLabel={formatMoney(order.amountCents, order.currency)} />
            )}
          </div>
          {!inactive && (
            <p className="mt-4 text-center text-sm">
              <Link href={`/checkout/cancelled?order=${order.id}`} className="font-medium text-zinc-500 hover:text-zinc-900 hover:underline">
                Cancel and go back
              </Link>
            </p>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-zinc-500">
          Changed your mind?{" "}
          <Link href={backHref} className="font-medium text-brand-700 hover:underline">
            Return to {course ? "the course page" : "your booking"}
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
