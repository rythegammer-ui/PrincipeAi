import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// next/headers outside a request: an in-memory cookie jar (student session) and a fixed client IP.
const mocks = vi.hoisted(() => ({ jar: new Map<string, string>() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (mocks.jar.has(name) ? { name, value: mocks.jar.get(name) } : undefined),
    set: (name: string, value: string) => void mocks.jar.set(name, value),
    delete: (name: string) => void mocks.jar.delete(name),
  }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.42" }),
}));

import { startCourseCheckoutAction, type EnrollState } from "@/app/(marketing)/courses/actions";
import { getDb, schema } from "@/db";
import { startStudentSession, upsertStudent } from "@/lib/auth";
import { getCourseWithCurriculum } from "@/lib/courses";
import { fulfillOrder } from "@/lib/payments";

/** Runs the enroll form's action; a redirect (to checkout) comes back as its target URL. */
async function enroll(courseId: string, email: string): Promise<EnrollState | { redirectTo: string }> {
  const form = new FormData();
  form.set("courseId", courseId);
  form.set("email", email);
  form.set("name", "Form Visitor");
  try {
    return await startCourseCheckoutAction({}, form);
  } catch (err) {
    const digest = (err as { digest?: string }).digest ?? "";
    if (!digest.startsWith("NEXT_REDIRECT;")) throw err;
    return { redirectTo: digest.split(";")[2] };
  }
}

describe("course enroll form", () => {
  let courseId: string;
  let ownerEmail: string;

  beforeAll(async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    const data = await getCourseWithCurriculum("ai-essentials");
    if (!data) throw new Error("seed course missing");
    courseId = data.course.id;

    // Someone who already bought the course.
    ownerEmail = `owner-${randomUUID()}@example.com`;
    const db = await getDb();
    const [order] = await db
      .insert(schema.orders)
      .values({ email: ownerEmail, name: "Course Owner", itemType: "course", courseId, description: data.course.title, amountCents: data.course.priceCents })
      .returning();
    await fulfillOrder(order.id, { isTest: true });
  }, 60_000);

  beforeEach(() => mocks.jar.clear());

  it("never tells a signed-out visitor whether an email already has the course", async () => {
    const owned = await enroll(courseId, ownerEmail);
    const fresh = await enroll(courseId, `new-${randomUUID()}@example.com`);
    // Both go straight to checkout — exactly what a new buyer gets.
    expect(owned).toEqual({ redirectTo: expect.stringMatching(/^\/checkout\/test\/[0-9a-f-]{36}$/) });
    expect(fresh).toEqual({ redirectTo: expect.stringMatching(/^\/checkout\/test\/[0-9a-f-]{36}$/) });
  });

  it("doesn't tell a signed-in student about someone else's email either", async () => {
    const other = await upsertStudent(`other-${randomUUID()}@example.com`, "Other Student");
    await startStudentSession(other);
    expect(await enroll(courseId, ownerEmail)).toEqual({ redirectTo: expect.stringMatching(/^\/checkout\/test\//) });
  });

  it("points the signed-in owner to the course they already have", async () => {
    const db = await getDb();
    const [owner] = await db.select().from(schema.users).where(eq(schema.users.email, ownerEmail));
    await startStudentSession(owner);
    expect(await enroll(courseId, ownerEmail)).toMatchObject({ alreadyOwned: true });
  });
});
