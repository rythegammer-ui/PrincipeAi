import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getDb, schema } from "@/db";
import { formatDuration, savingsPercent } from "@/components/courses/course-utils";
import { emailHasCourse, firstIncomplete, getCourseWithCurriculum } from "@/lib/courses";
import { checkoutMode, createCheckout, fulfillOrder, refundOrder, withinClaimWindow } from "@/lib/payments";
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
  });

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
    expect(contact.lifetimeValueCents).toBe(priceCents);
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
});
