import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AiReplyBudget } from "@/lib/ai";

// The tutor route outside a request: a chosen signed-in student, no cookies, and the budget it claims recorded.
const mocks = vi.hoisted(() => ({ student: null as unknown, claims: [] as string[] }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }),
  cookies: async () => ({ get: () => undefined, set: () => {} }),
}));
vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  getStudent: async () => mocks.student,
}));
vi.mock("@/lib/ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai")>()),
  claimAiReply: async (budget: AiReplyBudget) => {
    mocks.claims.push(budget);
    return true;
  },
}));

import { tutorEnrollment } from "@/app/api/tutor/enrollment";
import { POST } from "@/app/api/tutor/route";
import { getDb, schema } from "@/db";
import { enrollInCourse, getCourseWithCurriculum } from "@/lib/courses";
import { createCheckout, fulfillOrder } from "@/lib/payments";

type Course = { id: string; slug: string; lessonId: string };

/** A student who bought `course` with an order of `amountCents` (`isTest`: through the built-in test checkout). */
async function buyer(course: Course, amountCents: number, isTest = false): Promise<string> {
  const db = await getDb();
  const email = `buyer-${randomUUID()}@example.com`;
  const [order] = await db
    .insert(schema.orders)
    .values({ email, name: "Bea Buyer", itemType: "course", courseId: course.id, description: "Course", amountCents })
    .returning();
  await fulfillOrder(order.id, { isTest });
  return userIdFor(email);
}

async function userIdFor(email: string): Promise<string> {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  return user.id;
}

/** Calls the tutor route with a JSON body. */
async function post(body: Record<string, string>): Promise<Response> {
  const res = await POST(
    new NextRequest("http://localhost/api/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  );
  if (!res) throw new Error("no response");
  return res;
}

/** Asks the tutor one question as `userId`; returns the budget the reply was charged to. */
async function ask(userId: string, course: Course): Promise<string | undefined> {
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  mocks.student = user;
  const res = await post({ courseSlug: course.slug, lessonId: course.lessonId, message: "What is this lesson about?" });
  expect(res.status).toBe(200);
  await res.text();
  return mocks.claims.at(-1);
}

describe("AI tutor budget", () => {
  let paid: Course;
  let free: Course;

  beforeAll(async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const data = await getCourseWithCurriculum("ai-essentials");
    if (!data || data.course.priceCents <= 0) throw new Error("seed course missing");
    paid = { id: data.course.id, slug: data.course.slug, lessonId: data.lessons[0].id };

    // A free course the owner published ("Use 0 for a free course").
    const db = await getDb();
    const [course] = await db.insert(schema.courses).values({ slug: `free-${randomUUID().slice(0, 8)}`, title: "Free Course", priceCents: 0 }).returning();
    const [mod] = await db.insert(schema.courseModules).values({ courseId: course.id, title: "Start" }).returning();
    const [lesson] = await db
      .insert(schema.lessons)
      .values({ courseId: course.id, moduleId: mod.id, slug: "intro", title: "Intro", content: "Hello." })
      .returning();
    free = { id: course.id, slug: course.slug, lessonId: lesson.id };
  }, 60_000);

  beforeEach(() => {
    mocks.claims.length = 0;
  });

  it("charges paying and owner-granted students to the tutor's budget", async () => {
    const student = await buyer(paid, 4900);
    expect(await tutorEnrollment(student, paid.id)).toEqual({ budget: "tutor" });
    expect(await ask(student, paid)).toBe("tutor");

    const email = `granted-${randomUUID()}@example.com`;
    await enrollInCourse({ email, courseId: free.id, source: "manual", sendAccessEmail: false });
    expect(await tutorEnrollment(await userIdFor(email), free.id)).toEqual({ budget: "tutor" });
  });

  it("charges free enrollments to the public chat's budget, so free sign-ups can't use up the paid tutor", async () => {
    // Enrolled through the real free checkout (no payment), as anyone with an inbox can, again and again.
    const email = `free-${randomUUID()}@example.com`;
    await createCheckout({ itemType: "course", courseId: free.id, email, name: "Free Rider" });
    const student = await userIdFor(email);
    expect(await tutorEnrollment(student, free.id)).toEqual({ budget: "chat" });
    expect(await ask(student, free)).toBe("chat");

    // The built-in test checkout takes no money either.
    const tester = await buyer(paid, 4900, true);
    expect(await ask(tester, paid)).toBe("chat");
  });

  it("goes by what the student paid, not the course's current price", async () => {
    const db = await getDb();
    const email = `early-${randomUUID()}@example.com`;
    await createCheckout({ itemType: "course", courseId: free.id, email, name: "Early Bird" });
    const freeStudent = await userIdFor(email);
    const payer = await buyer(paid, 4900);

    const [{ priceCents }] = await db.select({ priceCents: schema.courses.priceCents }).from(schema.courses).where(eq(schema.courses.id, paid.id));
    await db.update(schema.courses).set({ priceCents: 9900 }).where(eq(schema.courses.id, free.id));
    await db.update(schema.courses).set({ priceCents: 0 }).where(eq(schema.courses.id, paid.id));
    try {
      expect(await tutorEnrollment(freeStudent, free.id)).toEqual({ budget: "chat" });
      expect(await tutorEnrollment(payer, paid.id)).toEqual({ budget: "tutor" });
    } finally {
      await db.update(schema.courses).set({ priceCents: 0 }).where(eq(schema.courses.id, free.id));
      await db.update(schema.courses).set({ priceCents }).where(eq(schema.courses.id, paid.id));
    }
  });

  it("refuses students who aren't enrolled, without claiming any budget", async () => {
    const outsider = await buyer(free, 0);
    expect(await tutorEnrollment(outsider, paid.id)).toBeNull();
    const db = await getDb();
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, outsider));
    mocks.student = user;
    const res = await post({ courseSlug: paid.slug, lessonId: paid.lessonId, message: "Hi" });
    expect(res.status).toBe(403);
    expect(mocks.claims).toEqual([]);
  });
});
