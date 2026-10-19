import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { AiReplyBudget } from "@/lib/ai";

/**
 * A student's enrollment in a course (null when not enrolled), with the site-wide AI budget their tutor replies
 * draw on. The tutor's own budget is for students who paid for the course or were given access by the owner.
 * Everyone else (a free course, or the built-in test checkout) shares the public chat's: those sign-ups cost nothing
 * and one inbox can make many (+tag addresses), so they mustn't be able to switch the AI tutor off for paying
 * students. Decided by the enrollment's own order, so a later price change doesn't move students between budgets.
 */
export async function tutorEnrollment(userId: string, courseId: string): Promise<{ budget: AiReplyBudget } | null> {
  const db = await getDb();
  const [row] = await db
    .select({ source: schema.enrollments.source, amountCents: schema.orders.amountCents, isTest: schema.orders.isTest })
    .from(schema.enrollments)
    .leftJoin(schema.orders, eq(schema.orders.id, schema.enrollments.orderId))
    .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)))
    .limit(1);
  if (!row) return null;
  const paid = (row.amountCents ?? 0) > 0 && !row.isTest;
  return { budget: row.source === "manual" || paid ? "tutor" : "chat" };
}
