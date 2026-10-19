import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Order } from "@/db/schema";
import { site } from "@/config/site";
import { stopAutomations } from "@/lib/automations";
import { CHECKOUT_FAILED_REASON, confirmPaidBooking, HOLD_EXPIRED_REASON } from "@/lib/booking-service";
import { emailHasCourse, enrollInCourse } from "@/lib/courses";
import { addLifetimeValue, captureLead, logActivity } from "@/lib/crm";
import { escapeMarkdown, notifyOwner, sendEmail } from "@/lib/email";
import { testCheckoutAllowed } from "@/lib/integrations";
import { rateLimit } from "@/lib/rate-limit";
import { formatMeetingTime, getBusinessTimezone } from "@/lib/scheduling";
import { getStripe } from "@/lib/stripe";
import { absoluteUrl, firstName, formatDate, formatDateTime, formatMoney, normalizeEmail } from "@/lib/utils";

/**
 * Checkout + order fulfilment (Stripe, or the built-in test checkout when Stripe isn't configured).
 * OWNER: courses & payments feature. Other features call these two functions only.
 */

export type CheckoutInput =
  | { itemType: "course"; courseId: string; email: string; name?: string | null }
  | { itemType: "booking"; bookingId: string; email: string; name?: string | null };

/** How buyers will pay right now: real Stripe Checkout, the built-in test checkout, or not at all. */
export function checkoutMode(): "stripe" | "test" | "disabled" {
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

  // 2. CRM, automations, receipt — best effort, never undo a delivered order.
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
    if (!order.bookingId) throw new Error(`Order ${order.id} has no booking`);
    await confirmPaidBooking(order.bookingId);
  }
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

/** Tells the owner (once per order) about a payment that can never be delivered, so they can refund it. */
async function alertUndeliverable(order: Order, why: string): Promise<void> {
  try {
    // rate_limits doubles as a cheap "already sent" marker: Stripe retries the event for days.
    if (!(await rateLimit(`undeliverable-order:${order.id}`, 1, 7 * 86_400)).ok) return;
    await notifyOwner(
      `Action needed: payment received for an order that can't be delivered`,
      [
        `**${escapeMarkdown(order.name || order.email)}** paid for **${escapeMarkdown(order.description)}**, but ${why}, so nothing could be delivered.`,
        `Please contact them and refund the payment${order.stripePaymentIntentId ? " in Stripe" : ""}.`,
        `- Email: ${escapeMarkdown(order.email)}`,
        `- Order: ${order.id}`,
      ].join("\n\n"),
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

async function recordPurchase(order: Order): Promise<void> {
  const db = await getDb();
  const amount = formatMoney(order.amountCents, order.currency);
  const booking = await loadBookingSnapshot(order);
  const businessTz = booking ? await getBusinessTimezone() : null;
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
      subject: `New purchase: ${order.description} (${amount})`,
      // Name and email are buyer-supplied: escape them so they can't become links in the owner's inbox.
      markdown: [
        `**${escapeMarkdown(order.name || order.email)}** just bought **${escapeMarkdown(order.description)}** for **${amount}**${order.isTest ? " _(test payment — no real money)_" : ""}.`,
        booking && businessTz ? `- Session: ${formatMeetingTime(booking.startAt, booking.endAt, businessTz)}` : "",
        booking && !isBookedStatus(booking.status) ? "- **The time was no longer available** — see the separate “Action needed” email." : "",
        `- Email: ${escapeMarkdown(order.email)}`,
        `- Order: ${order.id}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  });
  await addLifetimeValue(contact.id, order.amountCents);
  if (order.contactId !== contact.id) {
    await db.update(schema.orders).set({ contactId: contact.id }).where(eq(schema.orders.id, order.id));
  }
  // They bought — stop the top-of-funnel nurture sequences.
  await stopAutomations(contact.id, "lead_magnet");
  await stopAutomations(contact.id, "quiz_completed");
  await sendReceipt(order, contact.id, booking);
}

/** Booking statuses that mean the paid session actually holds its time. */
function isBookedStatus(status: string): boolean {
  return status === "confirmed" || status === "completed" || status === "no_show";
}

async function sendReceipt(order: Order, contactId: string, booking: BookingSnapshot | null): Promise<void> {
  const amount = formatMoney(order.amountCents, order.currency);
  const next =
    order.itemType === "course"
      ? `Your course access link is in a separate email. You can sign in any time at ${absoluteUrl("/login")} with this email address.`
      : booking && isBookedStatus(booking.status)
        ? "Your session is confirmed — the calendar invite and meeting details are in your confirmation email."
        : "**Your session isn't booked yet:** your payment arrived after the time you picked had been released, and it's no longer available. We'll be in touch shortly to find a new time or refund you in full — or just reply to this email.";
  await sendEmail({
    to: order.email,
    subject: `Your receipt from ${site.name}`,
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

/** Records a refund: order → refunded, lifetime value reduced, timeline entry, and (optionally) course access removed. */
export async function refundOrder(
  orderId: string,
  opts: { revokeAccess?: boolean; reason?: string; source: "stripe" | "manual" },
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
  if (order.contactId) {
    await addLifetimeValue(order.contactId, -order.amountCents);
    await logActivity(order.contactId, "note", `Refunded ${order.description} (${formatMoney(order.amountCents, order.currency)})`, {
      body: opts.reason ?? null,
      meta: { orderId: order.id, amountCents: order.amountCents, refund: true, source: opts.source, accessRevoked: revoked },
    });
  }
  return true;
}
