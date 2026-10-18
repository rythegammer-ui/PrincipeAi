import { and, eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmit } from "@/components/courses/admin/confirm-submit";
import { LessonForm } from "@/components/courses/admin/lesson-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { getDb, schema } from "@/db";
import { getCurriculum } from "@/lib/courses";
import { deleteLessonAction } from "../../../actions";

export const metadata: Metadata = { title: "Edit lesson" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; lessonId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id, lessonId }, { created }] = await Promise.all([params, searchParams]);
  if (!UUID.test(id) || !UUID.test(lessonId)) notFound();
  const db = await getDb();
  const [row] = await db
    .select({ lesson: schema.lessons, course: schema.courses })
    .from(schema.lessons)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.lessons.courseId))
    .where(and(eq(schema.lessons.id, lessonId), eq(schema.lessons.courseId, id)))
    .limit(1);
  if (!row) notFound();
  const { lesson, course } = row;
  const { modules, lessons } = await getCurriculum(course.id);
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const previewHref = lesson.isPreview && course.published ? `/courses/${course.slug}/preview/${lesson.slug}` : null;

  return (
    <>
      <Link href={`/admin/courses/${course.id}?tab=curriculum`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="size-4" aria-hidden /> {course.title}
      </Link>
      <PageHeader
        title={lesson.title}
        description={`Lesson ${index + 1} of ${lessons.length}`}
        actions={
          <>
            {previewHref && (
              <ButtonLink href={previewHref} target="_blank" variant="outline" size="sm">
                View free preview <ExternalLink aria-hidden />
              </ButtonLink>
            )}
            <form action={deleteLessonAction}>
              <input type="hidden" name="lessonId" value={lesson.id} />
              <input type="hidden" name="redirect" value="1" />
              <ConfirmSubmit
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                confirmMessage={`Delete the lesson “${lesson.title}”? Student progress on it is removed too. This can't be undone.`}
                pendingText="Deleting…"
              >
                <Trash2 aria-hidden /> Delete
              </ConfirmSubmit>
            </form>
          </>
        }
      />
      {created && (
        <Alert tone="success" className="mb-6">
          Lesson created. Keep editing below, or head back to the curriculum to add the next one.
        </Alert>
      )}
      <LessonForm
        courseId={course.id}
        modules={modules.map((m) => ({ id: m.id, title: m.title }))}
        lesson={{
          id: lesson.id,
          moduleId: lesson.moduleId,
          title: lesson.title,
          slug: lesson.slug,
          summary: lesson.summary,
          content: lesson.content,
          videoUrl: lesson.videoUrl ?? "",
          durationMin: lesson.durationMin,
          isPreview: lesson.isPreview,
        }}
      />
    </>
  );
}
