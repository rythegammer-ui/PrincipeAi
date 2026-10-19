import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getDb, schema } from "@/db";
import { formatDuration, savingsPercent } from "@/components/courses/course-utils";
import { emailHasCourse, firstIncomplete, getCourseWithCurriculum } from "@/lib/courses";
import { HOLD_EXPIRED_REASON, PAID_UNAVAILABLE_REASON } from "@/lib/booking-service";
import { upsertContact } from "@/lib/crm";
import { runScheduledJobs } from "@/lib/jobs";
import {
  checkoutMode,
  createCheckout,
  formatWithZone,
  fulfillOrder,
  isDuplicatePurchase,
  refundOrder,
  UNDELIVERABLE_ALERT_PREFIX,
  withinClaimWindow,
} from "@/lib/payments";
import { parseVideoUrl, toEmbedUrl } from "@/lib/video";

describe("video URLs", () => {
  it("converts YouTube watch, short, shorts and embed links", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1");
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ?t=90")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&start=90");
    expect(toEmbedUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s")).toContain("start=90");
    expect(toEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toContain("/embed/dQw4w9WgXcQ");
    expect(toEmbedUrl("youtube.com/embed/dQw4w9WgXcQ")).toContain("/embed/dQw4w9WgXcQ");
    expect(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")?.provider).toBe("youtube");
  });

  it("converts Vimeo links, keeping the private hash for unlisted videos", () => {
    expect(toEmbedUrl("https://vimeo.com/76979871")).toBe("https://player.vimeo.com/video/76979871?dnt=1");
    expect(toEmbedUrl("https://vimeo.com/76979871/8272103f6e")).toBe("https://player.vimeo.com/video/76979871?dnt=1&h=8272103f6e");
    expect(toEmbedUrl("https://player.vimeo.com/video/76979871?h=8272103f6e")).toBe("https://player.vimeo.com/video/76979871?dnt=1&h=8272103f6e");
  });

  it("converts Loom share links", () => {
    expect(toEmbedUrl("https://www.loom.com/share/0281766fa2d04bb788eaf19e65135184")).toBe(
      "https://www.loom.com/embed/0281766fa2d04bb788eaf19e65135184",
    );
  });

  it("rejects other hosts and malformed links", () => {
    for (const bad of [
      "",
      "not a url",
      "javascript:alert(1)",
      "https://evil.example.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=short",
      "https://www.youtube.com/channel/UC123",
      "https://vimeo.com/about",
      "https://www.loom.com/looms/videos",
      "ftp://youtube.com/watch?v=dQw4w9WgXcQ",
    ]) {
      expect(toEmbedUrl(bad), bad).toBeNull();
    }
    expect(toEmbedUrl(null)).toBeNull();
  });
});

describe("course display helpers", () => {
  it("formats durations and savings", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(95)).toBe("1h 35m");
    expect(savingsPercent(4700, 9700)).toBe(52);
    expect(savingsPercent(4700, null)).toBeNull();
    expect(savingsPercent(4700, 4700)).toBeNull();
  });

  it("finds the first incomplete lesson", () => {
    const lessons = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(firstIncomplete(lessons, ["a"])?.id).toBe("b");
    expect(firstIncomplete(lessons, ["a", "b", "c"])).toBeNull();
  });
});

describe("checkout + fulfilment", () => {
  let courseId: string;
  let priceCents: number;

  beforeAll(async () => {
    // captureLead logs a harmless warning when there's no request (no visitor cookies) — keep test output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const data = await getCourseWithCurriculum("ai-essentials");
    if (!data) throw new Error("seed course missing");
    courseId = data.course.id;
    priceCents = data.course.priceCents;
    // The first query boots the embedded database (migrate + seed), which can be slow while other suites run.
  }, 60_000);

  async function pendingOrder(email: string) {
    const db = await getDb();
    const [order] = await db
      .insert(schema.orders)
      .values({ email, name: "Test Buyer", itemType: "course", courseId, description: "AI Essentials", amountCents: priceCents })
      .returning();
    return order;
  }

  it("uses the built-in test checkout when Stripe isn't configured", async () => {
    expect(checkoutMode()).toBe("test");
    const email = `lead-${randomUUID()}@example.com`;
    const { url, orderId } = await createCheckout({ itemType: "course", courseId, email, name: "Abandoned Cart" });
    expect(url).toBe(`/checkout/test/${orderId}`);
    const db = await getDb();
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(order.status).toBe("pending");
    expect(order.amountCents).toBe(priceCents);
    // The abandoned checkout is already a CRM lead.
    const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.email, email));
    expect(contact.stage).toBe("engaged");
    expect(order.contactId).toBe(contact.id);
  });

  it("fulfils an order exactly once, even when called repeatedly or concurrently", async () => {
    const email = `buyer-${randomUUID()}@example.com`;
    const order = await pendingOrder(email);

    await fulfillOrder(order.id, { isTest: true });
    await fulfillOrder(order.id, { isTest: true });
    await Promise.all([fulfillOrder(order.id, { isTest: true }), fulfillOrder(order.id, { isTest: true })]);

    const db = await getDb();
    const [paid] = await db.select().from(schema.orders).where(eq(schema.orders.id, order.id));
    expect(paid.status).toBe("paid");
    expect(paid.isTest).toBe(true);
    expect(paid.paidAt).toBeInstanceOf(Date);
    expect(withinClaimWindow(paid)).toBe(true);

    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    const enrollments = await db.select().from(schema.enrollments).where(eq(schema.enrollments.userId, user.id));
    expect(enrollments).toHaveLength(1);
    expect(enrollments[0]).toMatchObject({ courseId, source: "purchase", orderId: order.id });
    expect(await emailHasCourse(email, courseId)).toBe(true);

    const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.email, email));
    expect(contact.stage).toBe("customer");
    // A test purchase isn't real money, so it never counts toward lifetime value.
    expect(contact.lifetimeValueCents).toBe(0);
    expect(user.contactId).toBe(contact.id);

    const purchases = await db
      .select()
      .from(schema.activities)
      .where(and(eq(schema.activities.contactId, contact.id), eq(schema.activities.type, "purchase")));
    expect(purchases).toHaveLength(1);

    const emails = await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email));
    expect(emails.filter((e) => e.kind === "receipt")).toHaveLength(1);
    expect(emails.filter((e) => e.kind === "welcome")).toHaveLength(1);
  });

  it("enrolls free courses instantly with a proof token for the success page", async () => {
    const db = await getDb();
    const [free] = await db
      .insert(schema.courses)
      .values({ slug: `free-${randomUUID().slice(0, 8)}`, title: "Free AI Mini Course", priceCents: 0, published: true })
      .returning();
    const email = `free-${randomUUID()}@example.com`;
    const { url, orderId } = await createCheckout({ itemType: "course", courseId: free.id, email, name: "Free Learner" });
    expect(url).toMatch(new RegExp(`^/checkout/success\\?order=${orderId}&session_id=free_`));
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(order.status).toBe("paid");
    expect(url).toContain(encodeURIComponent(order.stripeSessionId ?? "missing"));
    expect(await emailHasCourse(email, free.id)).toBe(true);
  });

  it("records refunds once and can remove the course access bought with the order", async () => {
    const email = `refund-${randomUUID()}@example.com`;
    const order = await pendingOrder(email);
    await fulfillOrder(order.id, { isTest: true });

    expect(await refundOrder(order.id, { revokeAccess: true, source: "manual" })).toBe(true);
    expect(await refundOrder(order.id, { revokeAccess: true, source: "manual" })).toBe(false);

    const db = await getDb();
    const [row] = await db.select().from(schema.orders).where(eq(schema.orders.id, order.id));
    expect(row.status).toBe("refunded");
    expect(await emailHasCourse(email, courseId)).toBe(false);
    const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.email, email));
    expect(contact.lifetimeValueCents).toBe(0);

    // A refunded order can't be fulfilled again.
    await fulfillOrder(order.id, { isTest: true });
    expect(await emailHasCourse(email, courseId)).toBe(false);
  });
  it("refunds a test purchase of a course the email already has, without touching its existing access", async () => {
    const db = await getDb();
    const email = `twice-${randomUUID()}@example.com`;
    const first = await pendingOrder(email);
    await fulfillOrder(first.id, { isTest: true });
    const second = await pendingOrder(email);
    await fulfillOrder(second.id, { isTest: true });

    const [row] = await db.select().from(schema.orders).where(eq(schema.orders.id, second.id));
    expect(row.status).toBe("refunded");
    expect(await isDuplicatePurchase(row)).toBe(true);
    expect(await isDuplicatePurchase(first)).toBe(false);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    const enrollments = await db.select().from(schema.enrollments).where(eq(schema.enrollments.userId, user.id));
    expect(enrollments).toEqual([expect.objectContaining({ courseId, orderId: first.id })]);

    // Not a second purchase: one receipt, one purchase activity, and a sign-in link instead of a receipt.
    const emails = await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email));
    expect(emails.filter((e) => e.kind === "receipt")).toHaveLength(1);
    const [notice] = emails.filter((e) => e.subject.startsWith("You already have"));
    expect(notice.html).toContain("no payment was taken");
    const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.email, email));
    const activities = await db.select().from(schema.activities).where(eq(schema.activities.contactId, contact.id));
    expect(activities.filter((a) => a.type === "purchase")).toHaveLength(1);
    expect(activities.some((a) => a.title === "Bought AI Essentials again — already had access")).toBe(true);
    expect(contact.lifetimeValueCents).toBe(0);
  });

  it("re-sends the sign-in link (and nothing else) when a free course is claimed again", async () => {
    const db = await getDb();
    const [free] = await db
      .insert(schema.courses)
      .values({ slug: `free-again-${randomUUID().slice(0, 8)}`, title: "Free Starter Course", priceCents: 0, published: true })
      .returning();
    const email = `free-again-${randomUUID()}@example.com`;
    await createCheckout({ itemType: "course", courseId: free.id, email, name: "Free Learner" });
    const { url, orderId } = await createCheckout({ itemType: "course", courseId: free.id, email, name: "Free Learner" });

    // Same response as a first enrollment: straight to the success page.
    expect(url).toMatch(new RegExp(`^/checkout/success\\?order=${orderId}&session_id=free_`));
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(order.status).toBe("paid");
    const emails = await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email));
    expect(emails.filter((e) => e.kind === "receipt")).toHaveLength(1);
    expect(emails.filter((e) => e.subject === "You already have Free Starter Course")).toHaveLength(1);
  });
});

describe("undeliverable payments", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  async function alertsFor(orderId: string) {
    const db = await getDb();
    return (await db.select().from(schema.emailLog).where(eq(schema.emailLog.kind, "notification"))).filter(
      (e) => e.subject.includes("can't be delivered") && e.html.includes(orderId),
    );
  }

  it("alerts the owner (once) when a paid session's booking was deleted mid-checkout", async () => {
    const db = await getDb();
    const [order] = await db
      .insert(schema.orders)
      .values({ email: `gone-${randomUUID()}@example.com`, name: "Gone Booking", itemType: "booking", bookingId: null, description: "1:1 AI Coaching Session", amountCents: 15_000 })
      .returning();

    await expect(fulfillOrder(order.id, { isTest: true })).rejects.toThrow(/has no booking/);
    await expect(fulfillOrder(order.id, { isTest: true })).rejects.toThrow(/has no booking/);
    // Left unpaid so a later retry can still deliver it, and the owner hears about it exactly once.
    expect((await db.select().from(schema.orders).where(eq(schema.orders.id, order.id)))[0].status).toBe("pending");
    const alerts = await alertsFor(order.id);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].html).toContain("the booking it was for has been deleted");
  });

  it("keeps the 'already alerted' marker through Stripe's retry window when old rate limits are cleared", async () => {
    const db = await getDb();
    const day = 86_400_000;
    const recentMarker = `${UNDELIVERABLE_ALERT_PREFIX}${randomUUID()}`;
    const oldMarker = `${UNDELIVERABLE_ALERT_PREFIX}${randomUUID()}`;
    const oldLimit = `course-checkout:${randomUUID()}`;
    await db.insert(schema.rateLimits).values([
      { key: recentMarker, count: 1, windowStart: new Date(Date.now() - 3 * day) },
      { key: oldMarker, count: 1, windowStart: new Date(Date.now() - 8 * day) },
      { key: oldLimit, count: 1, windowStart: new Date(Date.now() - 3 * day) },
    ]);

    const summary = await runScheduledJobs();
    expect(summary.jobs.rateLimits.ok).toBe(true);
    const left = new Set((await db.select({ key: schema.rateLimits.key }).from(schema.rateLimits)).map((r) => r.key));
    expect(left.has(recentMarker)).toBe(true);
    expect(left.has(oldMarker)).toBe(false);
    expect(left.has(oldLimit)).toBe(false);
  });
});

describe("purchase notifications and paid-session receipts", () => {
  let meetingTypeId: string;
  let sessionPrice: number;

  beforeAll(async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const db = await getDb();
    const [mt] = await db.select().from(schema.meetingTypes).where(eq(schema.meetingTypes.slug, "ai-coaching-session"));
    meetingTypeId = mt.id;
    sessionPrice = mt.priceCents;
  });

  it("labels session times with their zone", () => {
    const at = new Date("2026-10-20T18:30:00Z");
    expect(formatWithZone(at, "Asia/Kolkata")).toMatch(/^Oct 21, 2026, 12:00\sAM GMT\+5:30$/);
    expect(formatWithZone(at, "America/New_York")).toMatch(/^Oct 20, 2026, 2:30\sPM EDT$/);
  });

  it("escapes buyer-supplied text in the owner's purchase alert", async () => {
    const data = await getCourseWithCurriculum("ai-essentials");
    if (!data) throw new Error("seed course missing");
    const db = await getDb();
    const email = `phish-${randomUUID()}@example.com`;
    const [order] = await db
      .insert(schema.orders)
      .values({
        email,
        name: "Buck [Verify payment](https://evil.example.com/pay) https://evil.example.com",
        itemType: "course",
        courseId: data.course.id,
        description: data.course.title,
        amountCents: data.course.priceCents,
      })
      .returning();
    await fulfillOrder(order.id, { isTest: true });
    const alerts = (await db.select().from(schema.emailLog).where(eq(schema.emailLog.kind, "notification"))).filter((e) => e.html.includes(order.id));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].html).not.toContain("evil.example.com/pay\"");
    expect(alerts[0].html).not.toMatch(/<a [^>]*evil\.example\.com/);
    expect(alerts[0].html).toContain("Verify payment");
  });

  async function paidSessionOrder(opts: { startAt: Date; status: "pending_payment" | "cancelled"; cancelReason?: string; timezone?: string }) {
    const db = await getDb();
    const email = `session-${randomUUID()}@example.com`;
    const { contact } = await upsertContact({ email, name: "Session Buyer", source: "booking" });
    const [booking] = await db
      .insert(schema.bookings)
      .values({
        meetingTypeId,
        contactId: contact.id,
        startAt: opts.startAt,
        endAt: new Date(opts.startAt.getTime() + 60 * 60_000),
        timezone: opts.timezone ?? "America/New_York",
        status: opts.status,
        cancelReason: opts.cancelReason ?? null,
        cancelledAt: opts.status === "cancelled" ? new Date() : null,
        holdExpiresAt: opts.status === "pending_payment" ? new Date(Date.now() + 30 * 60_000) : null,
      })
      .returning();
    return { email, contact, booking };
  }

  it("confirms a paid session in the receipt and shows the owner the time in business hours", async () => {
    const startAt = new Date(Date.now() + 40 * 86_400_000);
    startAt.setUTCHours(15, 0, 0, 0);
    const { email, contact, booking } = await paidSessionOrder({ startAt, status: "pending_payment", timezone: "Asia/Kolkata" });

    // createCheckout (test mode) stores a zone-labelled description, since the owner reads it too.
    const { orderId } = await createCheckout({ itemType: "booking", bookingId: booking.id, email, name: "Session Buyer" });
    const db = await getDb();
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(order.description).toContain(formatWithZone(startAt, "Asia/Kolkata"));
    expect(order.contactId).toBe(contact.id);

    await fulfillOrder(orderId, { isTest: true });
    const [after] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, booking.id));
    expect(after.status).toBe("confirmed");
    const [receipt] = (await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, email))).filter((e) => e.kind === "receipt");
    expect(receipt.html).toContain("Your session is confirmed");
    const [alert] = (await db.select().from(schema.emailLog).where(eq(schema.emailLog.kind, "notification"))).filter((e) => e.html.includes(orderId));
    expect(alert.html).toContain("Session:");
  });

  it("doesn't tell the buyer a session is confirmed when the time was taken before payment arrived", async () => {
    const startAt = new Date(Date.now() + 50 * 86_400_000);
    startAt.setUTCHours(15, 0, 0, 0);
    // The hold lapsed (released) and someone else booked the same time.
    const lapsed = await paidSessionOrder({ startAt, status: "cancelled", cancelReason: HOLD_EXPIRED_REASON });
    const taker = await paidSessionOrder({ startAt, status: "pending_payment" });
    const db = await getDb();
    await db.update(schema.bookings).set({ status: "confirmed", holdExpiresAt: null }).where(eq(schema.bookings.id, taker.booking.id));

    const [order] = await db
      .insert(schema.orders)
      .values({
        email: lapsed.email,
        name: "Session Buyer",
        contactId: lapsed.contact.id,
        itemType: "booking",
        bookingId: lapsed.booking.id,
        description: "1:1 AI Coaching Session",
        amountCents: sessionPrice,
        status: "expired",
      })
      .returning();
    await fulfillOrder(order.id, { isTest: true });

    const [booking] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, lapsed.booking.id));
    expect(booking.status).toBe("cancelled");
    expect(booking.cancelReason?.startsWith(PAID_UNAVAILABLE_REASON)).toBe(true);
    const [receipt] = (await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, lapsed.email))).filter((e) => e.kind === "receipt");
    expect(receipt.html).not.toContain("Your session is confirmed");
    expect(receipt.html).toContain("isn&#39;t booked yet");

    // A duplicate delivery doesn't re-process it (no second owner alert, no second receipt).
    await fulfillOrder(order.id, { isTest: true });
    const receipts = (await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, lapsed.email))).filter((e) => e.kind === "receipt");
    expect(receipts).toHaveLength(1);
  });
});
