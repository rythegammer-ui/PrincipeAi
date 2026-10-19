"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getStudent } from "@/lib/auth";
import { courseProgress, getCurriculum, isEnrolled } from "@/lib/courses";
import { logActivity, recomputeScore } from "@/lib/crm";

const progressSchema = z.object({
  lessonId: z.uuid(),
  complete: z.enum(["1", "0"]),
  /** "1" = go to the next lesson after marking complete. */
  advance: z.enum(["1", "0"]).optional(),
});

/** Marks a lesson complete (or not) for the signed-in student. Optionally moves on to the next lesson. */
export async function setLessonCompleteAction(formData: FormData): Promise<void> {
  const student = await getStudent();
  if (!student) redirect("/login");
  const parsed = progressSchema.safeParse({
    lessonId: formData.get("lessonId"),
    complete: formData.get("complete"),
    advance: formData.get("advance") ?? undefined,
  });
  if (!parsed.success) throw new Error("Invalid request");
  const { lessonId, complete, advance } = parsed.data;

  const db = await getDb();
  const [row] = await db
    .select({ lesson: schema.lessons, courseSlug: schema.courses.slug, courseTitle: schema.courses.title })
    .from(schema.lessons)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.lessons.courseId))
    .where(eq(schema.lessons.id, lessonId))
    .limit(1);
  // The lesson was deleted while the student had it open: send them back to their courses.
  if (!row) redirect("/learn");
  const { lesson, courseSlug, courseTitle } = row;
  if (!(await isEnrolled(student.id, lesson.courseId))) redirect(`/courses/${courseSlug}`);

  const { lessons } = await getCurriculum(lesson.courseId);

  if (complete === "1") {
    const [inserted] = await db
      .insert(schema.lessonProgress)
      .values({ userId: student.id, lessonId: lesson.id })
      .onConflictDoNothing()
      .returning();
    if (inserted && student.contactId) {
      try {
        await logActivity(student.contactId, "lesson_completed", `Completed lesson: ${lesson.title}`, {
          meta: { courseId: lesson.courseId, lessonId: lesson.id, course: courseTitle },
        });
        const progress = await courseProgress(student.id, lesson.courseId, lessons);
        if (progress.total > 0 && progress.completed === progress.total) {
          await logActivity(student.contactId, "lesson_completed", `Finished the course “${courseTitle}”`, {
            meta: { courseId: lesson.courseId, courseCompleted: true },
          });
        }
        await recomputeScore(student.contactId);
      } catch (err) {
        console.error("[learn] failed to record lesson activity", err);
      }
    }
  } else {
    await db
      .delete(schema.lessonProgress)
      .where(and(eq(schema.lessonProgress.userId, student.id), eq(schema.lessonProgress.lessonId, lesson.id)));
  }

  revalidatePath("/learn");
  revalidatePath(`/learn/${courseSlug}/${lesson.slug}`);

  if (complete === "1" && advance === "1") {
    const idx = lessons.findIndex((l) => l.id === lesson.id);
    const next = idx >= 0 ? lessons[idx + 1] : undefined;
    if (next) redirect(`/learn/${courseSlug}/${next.slug}`);
  }
}
