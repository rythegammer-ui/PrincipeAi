import "server-only";
import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb, isDemoMode, schema } from "@/db";
import type { Order } from "@/db/schema";
import { site } from "@/config/site";
import { stopAutomations } from "@/lib/automations";
import { createLoginToken } from "@/lib/auth";
import { CHECKOUT_FAILED_REASON, confirmPaidBooking, HOLD_EXPIRED_REASON } from "@/lib/booking-service";
import { emailHasCourse, enrollInCourse } from "@/lib/courses";
import { addLifetimeValue, captureLead, logActivity, upsertContact } from "@/lib/crm";
import { emailBusinessName, escapeMarkdown, notifyOwner, sendEmail } from "@/lib/email";
import { testCheckoutAllowed } from "@/lib/integrations";
import { PaymentLinkSyncBusyError, stripeInstallId, syncPaymentLinks, type PaymentLinkSyncResult } from "@/lib/payment-links";
import { rateLimit } from "@/lib/rate-limit";
import { recordAgentSale, reverseAgentSale } from "@/lib/sales/commissions";
import { normalizeAgentCode } from "@/lib/sales/game";
import { CLIENT_REFERENCE_PREFIX, referralCodeFromCookie } from "@/lib/sales/referrals";
import { formatMeetingTime, getBusinessTimezone } from "@/lib/scheduling";
import { getStripe, paymentIntentId, stripeDashboardUrl, stripeTestMode, type Stripe } from "@/lib/stripe";
import { absoluteUrl, firstName, formatDate, formatDateTime, formatMoney, isValidEmail, normalizeEmail } from "@/lib/utils";

/**
 * Checkout + order fulfilment (Stripe, or the built-in test checkout when Stripe isn't configured).
 * OWNER: courses & payments feature. Other features call these two functions only.
 */

export type CheckoutInput =
  | { itemType: "course"; courseId: string; email: string; name?: string | null }
  | { itemType: "booking"; bookingId: string; email: string; name?: string | null };

/**
 * A demo deployment (DEMO_MODE=1, in-memory database) never takes real money: its orders live in one
 * server instance's memory and are lost. With a live Stripe key there, checkout is turned off (a test key is fine).
 */
export function livePaymentsBlocked(): boolean {
  return isDemoMode() && Boolean(getStripe()) && !stripeTestMode();
}

/** How buyers will pay right now: real Stripe Checkout, the built-in test checkout, or not at all. */
export function checkoutMode(): "stripe" | "test" | "disabled" {
  if (livePaymentsBlocked()) return "disabled";
  if (getStripe()) return "stripe";
  return testCheckoutAllowed() ? "test" : "disabled";
}

/** Stripe needs at least 30 minutes; one extra keeps us clear of clock skew. */
const BOOKING_CHECKOUT_TTL_MS = 31 * 60_000;

/** Thrown for problems the buyer can act on (message is safe to show). */
export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

type Item = {
  description: string;
  productName: string;
  productDescription: string | null;
  amountCents: number;
  contactId: string | null;
  cancelPath: string;
  courseId: string | null;
  bookingId: string | null;
  bookingExpiresAt: Date | null;
};

async function loadItem(input: CheckoutInput, email: string, name: string | null): Promise<Item> {
  const db = await getDb();
  if (input.itemType === "course") {
    const [course] = await db
      .select()
      .from(schema.courses)
      .where(and(eq(schema.courses.id, input.courseId), eq(schema.courses.published, true)))
      .limit(1);
    if (!course) throw new CheckoutError("This course isn't available right now.");
    // Record the lead now so abandoned checkouts still land in the CRM.
    const { contact } = await captureLead({
      email,
      name,
      source: "checkout",
      segment: course.audience === "life" || course.audience === "business" ? course.audience : null,
      activity: { type: "form", title: `Started checkout: ${course.title}`, meta: { courseId: course.id, amountCents: course.priceCents } },
      event: { name: "checkout_started", path: `/courses/${course.slug}`, props: { itemType: "course", courseId: course.id, slug: course.slug, amountCents: course.priceCents } },
      stage: "engaged",
    });
    return {
      description: course.title,
      productName: course.title,
      productDescription: course.subtitle || null,
      amountCents: course.priceCents,
      contactId: contact.id,
      cancelPath: `/courses/${course.slug}?checkout=cancelled`,
      courseId: course.id,
      bookingId: null,
      bookingExpiresAt: null,
    };
  }

  const [row] = await db
    .select({ booking: schema.bookings, meetingType: schema.meetingTypes })
    .from(schema.bookings)
    .innerJoin(schema.meetingTypes, eq(schema.meetingTypes.id, schema.bookings.meetingTypeId))
    .where(and(eq(schema.bookings.id, input.bookingId), eq(schema.bookings.status, "pending_payment")))
    .limit(1);
  if (!row) throw new CheckoutError("This booking is no longer awaiting payment.");
  const { booking, meetingType } = row;
  if (booking.holdExpiresAt && booking.holdExpiresAt.getTime() < Date.now()) {
    throw new CheckoutError("The hold on this time slot has expired. Please pick a new time.");
  }
  if (meetingType.priceCents <= 0) throw new CheckoutError("This session doesn't require payment.");
  const when = formatDateTime(booking.startAt, booking.timezone);
  return {
    // Stored on the order and shown to the owner too, so the buyer's local time carries its zone name.
    description: `${meetingType.name} — ${formatWithZone(booking.startAt, booking.timezone)}`,
    productName: meetingType.name,
    productDescription: `${meetingType.durationMin}-minute session on ${when} (${booking.timezone})`,
    amountCents: meetingType.priceCents,
    contactId: booking.contactId,
    cancelPath: `/booking/${booking.manageToken}`,
    courseId: null,
    bookingId: booking.id,
    bookingExpiresAt: new Date(Date.now() + BOOKING_CHECKOUT_TTL_MS),
  };
}

/**
 * Creates a pending order and returns the URL to send the buyer to
 * (Stripe Checkout, or /checkout/test/[orderId] in test mode).
 */
export async function createCheckout(input: CheckoutInput): Promise<{ url: string; orderId: string }> {
  const stripe = getStripe();
  const email = normalizeEmail(input.email);
  const name = input.name?.trim() || null;
  const item = await loadItem(input, email, name);
  if (item.amountCents > 0 && livePaymentsBlocked()) throw new CheckoutError("Payments are turned off on this demo site.");
  if (item.amountCents > 0 && !stripe && !testCheckoutAllowed()) throw new Error("Payments are not configured");

  const db = await getDb();
  const [order] = await db
    .insert(schema.orders)
    .values({
      contactId: item.contactId,
      email,
      name,
      itemType: input.itemType,
      courseId: item.courseId,
      bookingId: item.bookingId,
      description: item.description,
      amountCents: item.amountCents,
      currency: site.currency,
      status: "pending",
      // Started by a visitor who came through a sales agent's link: credited to them once paid (lib/sales/commissions.ts).
      agentCode: input.itemType === "course" ? await referralCodeFromCookie() : null,
    })
    .returning();

  // Free items skip payment entirely. The token lets the success page show the order; access itself comes
  // from the magic link enrollInCourse emails (the token proves an order, not ownership of the email).
  if (item.amountCents <= 0) {
    const proof = proofToken("free");
    await db.update(schema.orders).set({ stripeSessionId: proof }).where(eq(schema.orders.id, order.id));
    await fulfillOrder(order.id, {});
    return { url: `/checkout/success?order=${order.id}&session_id=${encodeURIComponent(proof)}`, orderId: order.id };
  }

  if (!stripe) return { url: `/checkout/test/${order.id}`, orderId: order.id };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, itemType: input.itemType },
      payment_intent_data: { metadata: { orderId: order.id }, description: item.description },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: site.currency,
            unit_amount: item.amountCents,
            product_data: {
              name: item.productName,
              ...(item.productDescription ? { description: item.productDescription } : {}),
            },
          },
        },
      ],
      allow_promotion_codes: true,
      success_url: absoluteUrl(`/checkout/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`),
      cancel_url: absoluteUrl(item.cancelPath),
      ...(item.bookingExpiresAt ? { expires_at: Math.floor(item.bookingExpiresAt.getTime() / 1000) } : {}),
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    await db.update(schema.orders).set({ stripeSessionId: session.id }).where(eq(schema.orders.id, order.id));
    return { url: session.url, orderId: order.id };
  } catch (err) {
    console.error("[payments] Stripe checkout session failed", err);
    await db.update(schema.orders).set({ status: "failed" }).where(eq(schema.orders.id, order.id));
    throw new CheckoutError("We couldn't start the secure checkout. Please try again in a moment.");
  }
}

export type PaymentDetails = {
  stripePaymentIntentId?: string | null;
  /** True for the built-in test checkout and for Stripe test-mode payments (not real money). */
  isTest?: boolean;
  /** What was actually charged (Stripe `amount_total`, after promotion codes). Defaults to the order's list price. */
  amountPaidCents?: number | null;
};

/**
 * Marks an order paid and delivers it (course enrollment + access email, or paid booking confirmation).
 * MUST be idempotent — Stripe can deliver the same webhook more than once, and the success page and the
 * webhook often run at the same moment.
 */
export async function fulfillOrder(orderId: string, payment: PaymentDetails = {}): Promise<void> {
  const db = await getDb();
  const [before] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!before) throw new Error(`Order ${orderId} not found`);

  // Atomically claim the order. Only one caller can move it to "paid" (and record the purchase).
  const [order] = await db
    .update(schema.orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      ...(payment.stripePaymentIntentId ? { stripePaymentIntentId: payment.stripePaymentIntentId } : {}),
      ...(payment.isTest !== undefined ? { isTest: payment.isTest } : {}),
      // Revenue, lifetime value, the receipt and refunds all use what the buyer actually paid.
      ...(typeof payment.amountPaidCents === "number" && payment.amountPaidCents >= 0 ? { amountCents: payment.amountPaidCents } : {}),
    })
    .where(and(eq(schema.orders.id, orderId), inArray(schema.orders.status, ["pending", "expired"])))
    .returning();

  if (!order) {
    // Someone else claimed it. They may still be delivering — or have failed or died part-way — and this call
    // may be Stripe's only delivery of the event. So finish the delivery here too (enrollment and paid-booking
    // confirmation are both safe to run concurrently) and let errors propagate: the webhook then answers 500
    // and Stripe retries, instead of acknowledging a paid order nobody delivered.
    const [current] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
    if (current?.status === "paid" && (current.courseId || current.bookingId) && !(await isDelivered(current))) {
      await deliver(current);
    }
    return;
  }

  // 1. Deliver what was bought. If this fails, release the claim so a retry (Stripe re-delivery) can finish the job.
  try {
    await deliver(order);
  } catch (err) {
    // A concurrent call may have completed the delivery meanwhile — then the order really is paid and delivered.
    if (!(await isDelivered(order).catch(() => false))) {
      await db
        .update(schema.orders)
        .set({ status: before.status === "expired" ? "expired" : "pending", paidAt: null })
        .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "paid")));
      throw err;
    }
    console.error("[payments] delivery raised an error but the order was delivered concurrently", order.id, err);
  }

  // 2. A course this email already had: nothing new was delivered, so don't keep the money.
  let duplicate = false;
  try {
    duplicate = await isDuplicatePurchase(order);
  } catch (err) {
    console.error("[payments] duplicate-purchase check failed", order.id, err);
  }
  if (duplicate) {
    await settleDuplicatePurchase(order);
    return;
  }

  // 3. CRM, automations, receipt — best effort, never undo a delivered order.
  try {
    await recordPurchase(order);
  } catch (err) {
    console.error("[payments] post-purchase bookkeeping failed", order.id, err);
  }
}

async function deliver(order: Order): Promise<void> {
  if (order.itemType === "course") {
    if (!order.courseId) {
      await alertUndeliverable(order, "the course it was for has been deleted");
      throw new Error(`Order ${order.id} has no course`);
    }
    await enrollInCourse({ email: order.email, name: order.name, courseId: order.courseId, source: "purchase", orderId: order.id });
  } else {
    if (!order.bookingId) {
      // orders.booking_id is cleared when the booking is deleted (e.g. along with its contact) mid-checkout.
      await alertUndeliverable(order, "the booking it was for has been deleted");
      throw new Error(`Order ${order.id} has no booking`);
    }
    await confirmPaidBooking(order.bookingId);
  }
}

/**
 * True when a course order bought nothing new: this email already had the course through another order or a
 * manual grant. The enroll form only tells a signed-in owner that they have a course (never a signed-out
 * visitor, or it would reveal who bought what), so a buyer can pay for a course their email already has.
 */
export async function isDuplicatePurchase(order: Pick<Order, "id" | "itemType" | "courseId" | "email">): Promise<boolean> {
  if (order.itemType !== "course" || !order.courseId) return false;
  const db = await getDb();
  const [enrollment] = await db
    .select({ orderId: schema.enrollments.orderId })
    .from(schema.enrollments)
    .innerJoin(schema.users, eq(schema.users.id, schema.enrollments.userId))
    .where(and(eq(schema.users.email, normalizeEmail(order.email)), eq(schema.enrollments.courseId, order.courseId)))
    .limit(1);
  return enrollment !== undefined && enrollment.orderId !== order.id;
}

/**
 * Settles a paid order for a course the email already had (see isDuplicatePurchase): refunds the payment —
 * through Stripe for real checkouts — and emails the buyer a sign-in link instead of a receipt. Never throws;
 * when the refund can't be made automatically, the owner is asked to make it.
 */
async function settleDuplicatePurchase(claimed: Order): Promise<void> {
  let order = claimed;
  try {
    // Link the order to the buyer's CRM contact (as recordPurchase does) so lifetime value and the timeline stay right.
    if (!order.contactId) {
      const { contact } = await upsertContact({ email: order.email, name: order.name, source: "checkout" });
      const db = await getDb();
      await db.update(schema.orders).set({ contactId: contact.id }).where(eq(schema.orders.id, order.id));
      order = { ...order, contactId: contact.id };
    }
  } catch (err) {
    console.error("[payments] linking a duplicate purchase to its contact failed", order.id, err);
  }
  const outcome = order.amountCents <= 0 ? "free" : (await refundDuplicatePayment(order)) ? "refunded" : "refund_pending";
  try {
    if (order.contactId) {
      await logActivity(order.contactId, "note", `Bought ${order.description} again — already had access`, {
        body: outcome === "refunded" ? "Payment refunded automatically." : outcome === "refund_pending" ? "The automatic refund failed — please refund this payment." : null,
        meta: { orderId: order.id, courseId: order.courseId, duplicatePurchase: true, amountCents: order.amountCents, refunded: outcome === "refunded" },
      });
    }
    await sendAlreadyOwnedEmail(order, outcome);
  } catch (err) {
    console.error("[payments] duplicate-purchase follow-up failed", order.id, err);
  }
}

/** Refunds a duplicate purchase in full. Returns false (after asking the owner to do it) when that wasn't possible. */
async function refundDuplicatePayment(order: Order): Promise<boolean> {
  // Lifetime value counts the payment as received; recording the refund then takes it off again.
  const countPayment = async () => {
    if (order.contactId && !order.isTest) await addLifetimeValue(order.contactId, order.amountCents);
  };
  try {
    if (order.stripePaymentIntentId) {
      const stripe = getStripe();
      if (!stripe) throw new Error("Stripe is not configured");
      await stripe.refunds.create(
        { payment_intent: order.stripePaymentIntentId, reason: "duplicate", metadata: { orderId: order.id } },
        { idempotencyKey: `duplicate-purchase-refund:${order.id}` },
      );
    } else if (!order.isTest) {
      throw new Error("No Stripe payment to refund");
    }
  } catch (err) {
    console.error("[payments] automatic refund of a duplicate purchase failed", order.id, err);
    await alertDuplicateRefund(order);
    // Still a paid order until the owner refunds it (their refund then subtracts it again).
    await countPayment().catch((e) => console.error("[payments] lifetime value update failed", order.id, e));
    return false;
  }
  // The money is on its way back. The charge.refunded webhook records the refund too; refundOrder applies it once.
  try {
    await countPayment();
    await refundOrder(order.id, { source: order.stripePaymentIntentId ? "stripe" : "auto", reason: "Duplicate purchase: this email already had the course" });
  } catch (err) {
    console.error("[payments] recording the duplicate-purchase refund failed", order.id, err);
  }
  return true;
}

/** Asks the owner to refund a duplicate purchase the app couldn't refund itself. */
async function alertDuplicateRefund(order: Order): Promise<void> {
  try {
    await notifyOwner(
      `Action needed: refund a duplicate purchase`,
      [
        `**${escapeMarkdown(order.name || order.email)}** paid ${formatMoney(order.amountCents, order.currency)} for **${escapeMarkdown(order.description)}**, which this email address already had, and the automatic refund didn't go through.`,
        order.stripePaymentIntentId
          ? `Please [refund the payment in Stripe](${stripeDashboardUrl(order.stripePaymentIntentId, order.isTest)}) — their existing access is unaffected.`
          : `Please refund the payment — their existing access is unaffected.`,
        `- Email: ${escapeMarkdown(order.email)}`,
        `- Order: ${order.id}`,
      ].join("\n\n"),
    );
  } catch (err) {
    console.error("[payments] duplicate-refund alert failed", order.id, err);
  }
}

/** Tells a buyer who paid for a course they already had where their payment went, with a fresh sign-in link. */
async function sendAlreadyOwnedEmail(order: Order, outcome: "free" | "refunded" | "refund_pending"): Promise<void> {
  if (!order.courseId) return;
  const db = await getDb();
  const [course] = await db
    .select({ slug: schema.courses.slug, title: schema.courses.title })
    .from(schema.courses)
    .where(eq(schema.courses.id, order.courseId))
    .limit(1);
  if (!course) return;
  const token = await createLoginToken(order.email, `/learn/${course.slug}`);
  const link = absoluteUrl(`/auth/verify?token=${encodeURIComponent(token)}`);
  const amount = formatMoney(order.amountCents, order.currency);
  const payment =
    outcome === "free"
      ? ""
      : order.isTest
        ? "This was a test purchase, so no payment was taken."
        : outcome === "refunded"
          ? `So you're not charged twice, we've refunded the ${amount} you just paid in full. Refunds usually reach your account within 5–10 business days.`
          : `So you're not charged twice, we'll refund the ${amount} you just paid in full — we'll be in touch shortly.`;
  await sendEmail({
    to: order.email,
    subject: `You already have ${course.title}`,
    kind: "welcome",
    contactId: order.contactId,
    preheader: "Your course is ready — here's your sign-in link.",
    markdown: [
      `Hi ${firstName(order.name, order.email)},`,
      `Good news: this email address already has access to **${course.title}**, so there was nothing new to buy.`,
      payment,
      `**[Sign in and keep learning →](${link})**`,
      `This one-click sign-in link works once and expires in 30 minutes. After that, you can always get a fresh link at ${absoluteUrl("/login")} using this email address.`,
      `Questions? Just reply to this email.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
}

/**
 * True once the buyer has what they paid for: course access for this email, or a booking that is no longer
 * waiting for its payment (confirmed — or already handled as "paid after the time was released"). Bookings the
 * invitee or admin cancelled on purpose also count, so a duplicate event never re-processes them.
 */
async function isDelivered(order: Order): Promise<boolean> {
  if (order.itemType === "course") return order.courseId ? emailHasCourse(order.email, order.courseId) : false;
  if (!order.bookingId) return false;
  const db = await getDb();
  const [booking] = await db
    .select({ status: schema.bookings.status, cancelReason: schema.bookings.cancelReason })
    .from(schema.bookings)
    .where(eq(schema.bookings.id, order.bookingId))
    .limit(1);
  if (!booking) return false;
  if (booking.status === "pending_payment") return false;
  return !(booking.status === "cancelled" && (booking.cancelReason === HOLD_EXPIRED_REASON || booking.cancelReason === CHECKOUT_FAILED_REASON));
}

/**
 * rate_limits key prefix of the "owner already alerted" marker for an undeliverable order. The marker must outlive
 * Stripe's webhook retries (about 3 days), so the rate-limit cleanup job keeps these rows for UNDELIVERABLE_ALERT_TTL_MS.
 */
export const UNDELIVERABLE_ALERT_PREFIX = "undeliverable-order:";
export const UNDELIVERABLE_ALERT_TTL_MS = 7 * 86_400_000;

/** Tells the owner (once per order) about a payment that can never be delivered, so they can refund it. */
async function alertUndeliverable(order: Order, why: string): Promise<void> {
  try {
    // rate_limits doubles as a cheap "already sent" marker: Stripe retries the event for days.
    if (!(await rateLimit(`${UNDELIVERABLE_ALERT_PREFIX}${order.id}`, 1, UNDELIVERABLE_ALERT_TTL_MS / 1000)).ok) return;
    await notifyOwner(
      `Action needed: payment received for an order that can't be delivered`,
      [
        `**${escapeMarkdown(order.name || order.email)}** paid for **${escapeMarkdown(order.description)}**, but ${why}, so nothing could be delivered.`,
        `Please contact them and refund the payment${order.stripePaymentIntentId ? " in Stripe" : ""}.`,
        `- Email: ${escapeMarkdown(order.email)}`,
        `- Order: ${order.id}`,
      ].join("\n\n"),
      // Reply goes straight to the buyer (checkout only takes validated addresses; re-checked as defense in depth).
      { replyTo: isValidEmail(order.email) ? order.email : null },
    );
  } catch (err) {
    console.error("[payments] undeliverable-order alert failed", order.id, err);
  }
}

type BookingSnapshot = { status: string; startAt: Date; endAt: Date };

async function loadBookingSnapshot(order: Order): Promise<BookingSnapshot | null> {
  if (order.itemType !== "booking" || !order.bookingId) return null;
  const db = await getDb();
  const [booking] = await db
    .select({ status: schema.bookings.status, startAt: schema.bookings.startAt, endAt: schema.bookings.endAt })
    .from(schema.bookings)
    .where(eq(schema.bookings.id, order.bookingId))
    .limit(1);
  return booking ?? null;
}

/**
 * True when another order paid for the same booking first: this payment bought nothing new. Same order as
 * confirmPaidBooking, which asks the owner to refund every paid order after the first one.
 */
async function isDuplicateBookingPayment(order: Order): Promise<boolean> {
  if (order.itemType !== "booking" || !order.bookingId) return false;
  const db = await getDb();
  const [first] = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(and(eq(schema.orders.bookingId, order.bookingId), eq(schema.orders.status, "paid")))
    .orderBy(asc(schema.orders.paidAt), asc(schema.orders.createdAt))
    .limit(1);
  return first !== undefined && first.id !== order.id;
}

async function recordPurchase(order: Order): Promise<void> {
  const db = await getDb();
  const amount = formatMoney(order.amountCents, order.currency);
  const booking = await loadBookingSnapshot(order);
  const businessTz = booking ? await getBusinessTimezone() : null;
  // A second payment for a booking that was already paid for: the owner gets the separate "duplicate payment"
  // alert (from confirmPaidBooking), so this notification says so, and the buyer's receipt says it will be refunded.
  const duplicateBookingPayment = await isDuplicateBookingPayment(order);
  const { contact } = await captureLead({
    email: order.email,
    name: order.name,
    source: "checkout",
    activity: {
      type: "purchase",
      title: `Purchased ${order.description}`,
      meta: { orderId: order.id, amountCents: order.amountCents, itemType: order.itemType, isTest: order.isTest },
    },
    event: { name: "purchase", props: { amountCents: order.amountCents, orderId: order.id, itemType: order.itemType } },
    stage: "customer",
    // Course buyers get the student onboarding sequence; paid sessions already got the call_booked one.
    automation: order.itemType === "course" ? "purchase" : undefined,
    notify: {
      kind: "purchase",
      subject: duplicateBookingPayment ? `Duplicate payment: ${order.description} (${amount})` : `New purchase: ${order.description} (${amount})`,
      // Name and email are buyer-supplied: escape them so they can't become links in the owner's inbox.
      markdown: [
        `**${escapeMarkdown(order.name || order.email)}** just bought **${escapeMarkdown(order.description)}** for **${amount}**${order.isTest ? " _(test payment — no real money)_" : ""}.`,
        booking && businessTz ? `- Session: ${formatMeetingTime(booking.startAt, booking.endAt, businessTz)}` : "",
        duplicateBookingPayment
          ? "- **This booking was already paid for** — see the separate “Action needed: duplicate payment” email."
          : booking && !isBookedStatus(booking.status)
            ? "- **The time was no longer available** — see the separate “Action needed” email."
            : "",
        `- Email: ${escapeMarkdown(order.email)}`,
        `- Order: ${order.id}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  });
  // Test payments (built-in test checkout, Stripe test mode) aren't real money. A duplicate booking payment still
  // counts until the owner refunds it: refundOrder (Stripe's charge.refunded, or Admin → Orders) then subtracts it.
  if (!order.isTest) await addLifetimeValue(contact.id, order.amountCents);
  if (order.contactId !== contact.id) {
    await db.update(schema.orders).set({ contactId: contact.id }).where(eq(schema.orders.id, order.id));
  }
  // A customer a sales agent referred: their commission (and a "you made a sale" email). Never blocks the receipt.
  await recordAgentSale(order, contact.id).catch((err) => console.error("[payments] agent commission failed", order.id, err));
  // They bought — stop the top-of-funnel nurture sequences.
  await stopAutomations(contact.id, "lead_magnet");
  await stopAutomations(contact.id, "quiz_completed");
  await sendReceipt(order, contact.id, booking, duplicateBookingPayment);
}

/** Booking statuses that mean the paid session actually holds its time. */
function isBookedStatus(status: string): boolean {
  return status === "confirmed" || status === "completed" || status === "no_show";
}

async function sendReceipt(order: Order, contactId: string, booking: BookingSnapshot | null, duplicateBookingPayment = false): Promise<void> {
  const amount = formatMoney(order.amountCents, order.currency);
  const next =
    order.itemType === "course"
      ? `Your course access link is in a separate email. You can sign in any time at ${absoluteUrl("/login")} with this email address.`
      : duplicateBookingPayment
        ? `**This session was already paid for**, so this second payment wasn't needed. ${order.isTest ? "As a test purchase, no money was taken." : "We'll refund it in full — refunds usually reach your account within 5–10 business days."} Your session is unaffected.`
      : booking && isBookedStatus(booking.status)
        ? "Your session is confirmed — the calendar invite and meeting details are in your confirmation email."
        : "**Your session isn't booked yet:** your payment arrived after the time you picked had been released, and it's no longer available. We'll be in touch shortly to find a new time or refund you in full — or just reply to this email.";
  await sendEmail({
    to: order.email,
    subject: `Your receipt from ${await emailBusinessName()}`,
    kind: "receipt",
    contactId,
    preheader: `${amount} — ${order.description}`,
    markdown: [
      `Hi ${firstName(order.name, order.email)},`,
      `Thanks for your purchase! Here's your receipt.`,
      `| | |\n|---|---|\n| **Item** | ${order.description.replace(/\|/g, "/")} |\n| **Amount** | ${amount} |\n| **Date** | ${formatDate(order.paidAt ?? new Date())} |\n| **Order** | ${order.id} |`,
      order.isTest ? "_This was a test purchase — no payment was taken._" : "",
      next,
      `Questions about your order? Just reply to this email.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
}

export type OrderDetails = {
  order: Order;
  course: { id: string; slug: string; title: string; coverEmoji: string; audience: string } | null;
  booking: {
    id: string;
    status: string;
    startAt: Date;
    endAt: Date;
    timezone: string;
    manageToken: string;
    holdExpiresAt: Date | null;
    cancelReason: string | null;
    meetingTypeName: string;
    durationMin: number;
  } | null;
};

/** An order plus the course or booking it's for (used by the checkout pages). */
export async function getOrderDetails(orderId: string): Promise<OrderDetails | null> {
  const db = await getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).limit(1);
  if (!order) return null;
  let course: OrderDetails["course"] = null;
  let booking: OrderDetails["booking"] = null;
  if (order.courseId) {
    const [c] = await db
      .select({
        id: schema.courses.id,
        slug: schema.courses.slug,
        title: schema.courses.title,
        coverEmoji: schema.courses.coverEmoji,
        audience: schema.courses.audience,
      })
      .from(schema.courses)
      .where(eq(schema.courses.id, order.courseId))
      .limit(1);
    course = c ?? null;
  }
  if (order.bookingId) {
    const [b] = await db
      .select({
        id: schema.bookings.id,
        status: schema.bookings.status,
        startAt: schema.bookings.startAt,
        endAt: schema.bookings.endAt,
        timezone: schema.bookings.timezone,
        manageToken: schema.bookings.manageToken,
        holdExpiresAt: schema.bookings.holdExpiresAt,
        cancelReason: schema.bookings.cancelReason,
        meetingTypeName: schema.meetingTypes.name,
        durationMin: schema.meetingTypes.durationMin,
      })
      .from(schema.bookings)
      .innerJoin(schema.meetingTypes, eq(schema.meetingTypes.id, schema.bookings.meetingTypeId))
      .where(eq(schema.bookings.id, order.bookingId))
      .limit(1);
    booking = b ?? null;
  }
  return { order, course, booking };
}

/**
 * How long the success-page "proof of purchase" (session id in the URL) can be used to email the buyer a fresh
 * sign-in link. It proves a payment, not ownership of the email address, so it never signs anyone in itself.
 */
export const PURCHASE_CLAIM_WINDOW_MS = 24 * 60 * 60_000;

/** True while a paid order's checkout session id may still be used to re-send the buyer's sign-in link. */
export function withinClaimWindow(order: Pick<Order, "paidAt">, now = Date.now()): boolean {
  return Boolean(order.paidAt && now - order.paidAt.getTime() < PURCHASE_CLAIM_WINDOW_MS);
}

/** "Oct 21, 2026, 12:00 AM GMT+5:30" — a date and time in `timeZone`, labelled with the zone. */
export function formatWithZone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
      timeZoneName: "short",
    }).format(date);
  } catch {
    return `${formatDateTime(date, "UTC")} UTC`;
  }
}

/** Emails the buyer when a delayed payment (e.g. a bank debit) fails, with a link to try again. */
export async function sendPaymentFailedEmail(order: Order): Promise<void> {
  let retryPath = "/book";
  if (order.itemType === "course") {
    retryPath = "/courses";
    if (order.courseId) {
      const db = await getDb();
      const [course] = await db
        .select({ slug: schema.courses.slug, published: schema.courses.published })
        .from(schema.courses)
        .where(eq(schema.courses.id, order.courseId))
        .limit(1);
      if (course?.published) retryPath = `/courses/${course.slug}`;
    }
  }
  await sendEmail({
    to: order.email,
    subject: `Your payment didn't go through`,
    kind: "payment_failed",
    contactId: order.contactId,
    preheader: `Your order for ${order.description} wasn't completed.`,
    markdown: [
      `Hi ${firstName(order.name, order.email)},`,
      `Unfortunately the payment for **${escapeMarkdown(order.description)}** didn't go through, so your order wasn't completed.`,
      `**[${order.itemType === "course" ? "Try again →" : "Pick a time and try again →"}](${absoluteUrl(retryPath)})**`,
      `If you think this is a mistake, or you'd like a hand, just reply to this email.`,
    ].join("\n\n"),
  });
}

/**
 * Marks a still-pending order failed (its payment didn't go through) and emails the buyer a link to try again.
 * Returns the order when it changed (null for duplicate or late events). The email is best effort.
 */
export async function failPendingOrder(orderId: string): Promise<Order | null> {
  const db = await getDb();
  const [order] = await db
    .update(schema.orders)
    .set({ status: "failed" })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "pending")))
    .returning();
  if (!order) return null;
  await sendPaymentFailedEmail(order).catch((err) => console.error("[payments] payment-failed email failed", order.id, err));
  return order;
}

/** Why payment links can't be synced from here, or null when they can. */
export function paymentLinkSyncBlocked(): string | null {
  if (!getStripe()) return "Stripe isn't connected. Add STRIPE_SECRET_KEY in your Vercel environment variables, then redeploy.";
  // Each instance of a demo has its own throwaway database, so each would make (and abandon) its own Stripe objects.
  if (isDemoMode()) return "Payment links aren't created on a demo site.";
  // A preview deployment would point the links and the webhook at itself.
  if (process.env.VERCEL && process.env.VERCEL_ENV !== "production") return "Payment links are only synced from the production site.";
  if (!stripeTestMode() && !/^https:\/\/(?!localhost|127\.0\.0\.1)/.test(absoluteUrl("/"))) {
    return "Live payment links need the site's public https address: set NEXT_PUBLIC_SITE_URL.";
  }
  return null;
}

/**
 * Brings every course's Stripe Payment Link up to date (src/lib/payment-links.ts), and sets up the Stripe webhook
 * endpoint if STRIPE_WEBHOOK_SECRET isn't set. Null when that can't be done here (see paymentLinkSyncBlocked).
 */
export async function syncCoursePaymentLinks(opts: { lockWaitMs?: number; signal?: AbortSignal } = {}): Promise<PaymentLinkSyncResult | null> {
  const stripe = getStripe();
  if (!stripe || paymentLinkSyncBlocked()) return null;
  return syncPaymentLinks({
    db: await getDb(),
    stripe,
    mode: stripeTestMode() ? "test" : "live",
    siteUrl: absoluteUrl("/"),
    currency: site.currency,
    // This runs on the live deployment, so it may retire the site's own endpoint once STRIPE_WEBHOOK_SECRET replaces it.
    webhook: { envSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || null, removeReplaced: true },
    ...opts,
  });
}

/** Runs syncCoursePaymentLinks after the response (call it after a course's price, status or details change). */
export function syncCoursePaymentLinksLater(): void {
  if (paymentLinkSyncBlocked()) return;
  const run = async () => {
    try {
      const result = await syncCoursePaymentLinks({ lockWaitMs: 15_000 });
      if (result?.errors.length) console.error("[payments] payment-link sync problems", result.errors);
    } catch (err) {
      // A sync already running goes again when it finishes, so this change isn't lost.
      if (err instanceof PaymentLinkSyncBusyError) console.info("[payments]", err.message);
      else console.error("[payments] payment-link sync failed", err);
    }
  };
  try {
    after(run);
  } catch {
    // Outside a request (a script or a test): just start it.
    void run();
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Our order for a Stripe Checkout session. Sessions createCheckout made carry the order id. A Stripe Payment Link
 * session (src/lib/payment-links.ts) has none: its order is found by the session id, or, with `create`, made now
 * from the course in the link's metadata and the buyer's checkout details, then fulfilled like any other order.
 * Returns null for a session that isn't for anything this site sells (e.g. a link made by hand in Stripe).
 */
export async function orderIdForCheckoutSession(session: Stripe.Checkout.Session, opts: { create: boolean }): Promise<string | null> {
  if (!session.payment_link) {
    const id = session.metadata?.orderId ?? session.client_reference_id;
    return id && UUID.test(id) ? id : null;
  }
  // Anyone holding a payment link can add ?client_reference_id=… to it, so for these sessions it's never used.
  const db = await getDb();
  const [existing] = await db.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.stripeSessionId, session.id)).limit(1);
  if (existing) return existing.id;
  if (!opts.create || session.mode !== "payment" || session.status !== "complete") return null;
  // A link made by another database on the same Stripe account (e.g. a local copy): that site's sale, not ours.
  // Unless it names one of our courses (course ids are random per database): then it's ours from before a restore.
  const meta = session.metadata ?? {};
  if (meta.install && meta.install !== (await stripeInstallId(db))) {
    const known =
      meta.courseId && UUID.test(meta.courseId)
        ? (await db.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.id, meta.courseId)).limit(1)).length > 0
        : false;
    if (!known) {
      console.warn("[payments] ignoring a checkout from another site's payment link", session.id);
      return null;
    }
  }
  return createPaymentLinkOrder(session);
}

async function createPaymentLinkOrder(session: Stripe.Checkout.Session): Promise<string | null> {
  const meta = session.metadata ?? {};
  if (!meta.courseId && !meta.courseSlug) return null;
  const db = await getDb();
  const courseColumns = { id: schema.courses.id, slug: schema.courses.slug, title: schema.courses.title, priceCents: schema.courses.priceCents };
  // By id when the link names one: if that course was deleted, a newer course that took over its slug isn't what
  // was paid for. By slug only for links made by hand with just a courseSlug.
  const [course] = meta.courseId
    ? UUID.test(meta.courseId)
      ? await db.select(courseColumns).from(schema.courses).where(eq(schema.courses.id, meta.courseId)).limit(1)
      : []
    : await db.select(courseColumns).from(schema.courses).where(eq(schema.courses.slug, meta.courseSlug)).limit(1);

  const email = normalizeEmail(session.customer_details?.email ?? session.customer_email ?? "");
  if (!isValidEmail(email)) {
    // Stripe always asks for an email at checkout, so this shouldn't happen; the payment stays visible in Stripe.
    console.error("[payments] payment-link checkout without a usable email", session.id);
    return null;
  }
  const name = session.customer_details?.name?.trim() || null;
  const amountCents = session.amount_total ?? course?.priceCents ?? 0;
  const { contact } = await upsertContact({ email, name, source: "checkout" });
  // Started from a sales agent's link (/buy/<course>?ref=CODE, or with their cookie): credited to them once paid.
  // Anyone can add a client_reference_id to a payment link, but that's no more than buying through the agent's link.
  const ref = session.client_reference_id;
  const agentCode = ref?.startsWith(CLIENT_REFERENCE_PREFIX) ? normalizeAgentCode(ref.slice(CLIENT_REFERENCE_PREFIX.length)) : null;
  const [row] = await db
    .insert(schema.orders)
    .values({
      contactId: contact.id,
      email,
      name,
      itemType: "course",
      // A course deleted since the link was made: fulfilment alerts the owner (see deliver()).
      courseId: course?.id ?? null,
      description: course?.title ?? `Course: ${meta.courseSlug || "deleted course"}`,
      amountCents,
      currency: session.currency ?? site.currency,
      status: "pending",
      stripeSessionId: session.id,
      // Stored now so a refund or dispute finds the order even before it's fulfilled.
      stripePaymentIntentId: paymentIntentId(session.payment_intent),
      isTest: session.livemode === false,
      agentCode,
    })
    .onConflictDoNothing({ target: schema.orders.stripeSessionId })
    .returning({ id: schema.orders.id });
  if (!row) {
    // The webhook and the success page raced: the other one created it.
    const [again] = await db.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.stripeSessionId, session.id)).limit(1);
    return again?.id ?? null;
  }
  if (course) {
    // Same CRM trail as a checkout started on the site, so funnels count payment-link sales too.
    await captureLead({
      email,
      name,
      source: "checkout",
      // The webhook has no visitor cookies and the success page does: the order's own code decides, the same either way.
      claimReferral: false,
      activity: { type: "form", title: `Started checkout: ${course.title} (payment link)`, meta: { courseId: course.id, amountCents, paymentLink: session.payment_link } },
      event: { name: "checkout_started", path: `/courses/${course.slug}`, props: { itemType: "course", courseId: course.id, slug: course.slug, amountCents, via: "payment_link" } },
      stage: "engaged",
    }).catch((err) => console.error("[payments] payment-link lead capture failed", row.id, err));
  }
  return row.id;
}

/**
 * Marks an order that was never delivered (pending or expired) refunded, because its payment was refunded in full in
 * Stripe first: a retried checkout event, the success page or the reconcile job then can't deliver it. Returns
 * whether it changed.
 */
export async function refundUndeliveredOrder(orderId: string): Promise<boolean> {
  const db = await getDb();
  const [order] = await db
    .update(schema.orders)
    .set({ status: "refunded" })
    .where(and(eq(schema.orders.id, orderId), inArray(schema.orders.status, ["pending", "expired"])))
    .returning();
  if (!order) return false;
  if (order.contactId) {
    await logActivity(order.contactId, "note", `Refunded ${order.description} before it was delivered`, {
      meta: { orderId: order.id, amountCents: order.amountCents, refund: true, source: "stripe", accessRevoked: false },
    });
  }
  return true;
}

/** True when a session's payment was refunded in full (needs `payment_intent.latest_charge` expanded to tell). */
export function sessionFullyRefunded(session: Stripe.Checkout.Session): boolean {
  const pi = session.payment_intent;
  if (!pi || typeof pi === "string") return false;
  const charge = pi.latest_charge;
  return Boolean(charge && typeof charge !== "string" && charge.refunded);
}

/**
 * Safety net for missed webhooks on Payment Link checkouts (createCheckout's orders are covered by the reconcile
 * job's order scan): fulfils paid payment-link sessions completed since `since` that have no paid order yet.
 */
export async function recoverPaymentLinkCheckouts(stripe: Stripe, since: Date): Promise<{ checked: number; recovered: number; failed: number }> {
  const sessions = await stripe.checkout.sessions
    .list({ status: "complete", created: { gte: Math.floor(since.getTime() / 1000) }, limit: 100, expand: ["data.payment_intent.latest_charge"] })
    .autoPagingToArray({ limit: 300 });
  const db = await getDb();
  let checked = 0;
  let recovered = 0;
  let failed = 0;
  for (const session of sessions) {
    if (!session.payment_link) continue;
    checked++;
    try {
      const [existing] = await db
        .select({ id: schema.orders.id, status: schema.orders.status })
        .from(schema.orders)
        .where(eq(schema.orders.stripeSessionId, session.id))
        .limit(1);
      if (existing && existing.status !== "pending" && existing.status !== "expired") continue;
      // Refunded before the webhook (or this job) caught up: there's nothing to deliver, and nothing may deliver it later.
      if (sessionFullyRefunded(session)) {
        const orderId = existing?.id ?? (await orderIdForCheckoutSession(session, { create: true }));
        if (orderId) await refundUndeliveredOrder(orderId);
        continue;
      }
      const orderId = existing?.id ?? (await orderIdForCheckoutSession(session, { create: true }));
      if (orderId && (session.payment_status === "paid" || session.payment_status === "no_payment_required")) {
        await fulfillOrder(orderId, {
          stripePaymentIntentId: paymentIntentId(session.payment_intent),
          isTest: session.livemode === false,
          amountPaidCents: session.amount_total,
        });
        recovered++;
      }
    } catch (err) {
      failed++;
      console.error("[payments] payment-link recovery failed for session", session.id, err);
    }
  }
  return { checked, recovered, failed };
}

/** True when a pending-payment booking can no longer be paid for (released or hold expired). */
export function bookingHoldExpired(booking: OrderDetails["booking"], now = Date.now()): boolean {
  if (!booking || booking.status !== "pending_payment") return true;
  return booking.holdExpiresAt !== null && booking.holdExpiresAt.getTime() < now;
}

/**
 * Proof-of-purchase token for orders that never touch Stripe (built-in test checkout, free items).
 * Stored in `stripeSessionId` and passed as `session_id` to the success page, just like a real Checkout session id.
 */
function proofToken(prefix: "test" | "free"): string {
  return `${prefix}_${randomBytes(18).toString("base64url")}`;
}

/** True for real Stripe Checkout session ids (as opposed to our own test/free proof tokens). */
export function isStripeSessionId(id: string): boolean {
  return id.startsWith("cs_");
}

/** Generates the proof-of-purchase token used by the built-in test checkout. */
export function newTestSessionId(): string {
  return proofToken("test");
}

/**
 * Records a refund: order → refunded, lifetime value reduced, timeline entry, and (optionally) course access removed.
 * `source`: refunded in Stripe, marked by the admin, or settled automatically by the app without Stripe (test orders).
 */
export async function refundOrder(
  orderId: string,
  opts: { revokeAccess?: boolean; reason?: string; source: "stripe" | "manual" | "auto" },
): Promise<boolean> {
  const db = await getDb();
  const [order] = await db
    .update(schema.orders)
    .set({ status: "refunded" })
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "paid")))
    .returning();
  if (!order) return false;
  let revoked = false;
  if (opts.revokeAccess && order.itemType === "course") {
    const removed = await db.delete(schema.enrollments).where(eq(schema.enrollments.orderId, order.id)).returning();
    revoked = removed.length > 0;
  }
  // The sales agent's commission on it is cancelled (or clawed back from their next payout if already paid). The agent
  // sees a plain label, never the admin's note or Stripe's dispute reason.
  const agentReason = opts.source === "stripe" && opts.reason?.startsWith("Dispute lost") ? "Payment disputed" : "Refunded";
  await reverseAgentSale(order.id, agentReason).catch((err) => console.error("[payments] agent commission reversal failed", order.id, err));
  if (order.contactId) {
    // Test payments never added to lifetime value (see recordPurchase).
    if (!order.isTest) await addLifetimeValue(order.contactId, -order.amountCents);
    await logActivity(order.contactId, "note", `Refunded ${order.description} (${formatMoney(order.amountCents, order.currency)})`, {
      body: opts.reason ?? null,
      meta: { orderId: order.id, amountCents: order.amountCents, refund: true, source: opts.source, accessRevoked: revoked },
    });
  }
  return true;
}
