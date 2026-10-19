import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { LessonForm } from "@/components/courses/admin/lesson-form";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getCurriculum } from "@/lib/courses";

export const metadata: Metadata = { title: "New lesson" };

export default async function NewLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ module?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { module: moduleParam }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await getDb();
  const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, id)).limit(1);
  if (!course) notFound();
  const { modules } = await getCurriculum(course.id);
  const moduleId = modules.find((m) => m.id === moduleParam)?.id ?? modules.at(-1)?.id;

  return (
    <>
      <Link href={`/admin/courses/${course.id}?tab=curriculum`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="size-4" aria-hidden /> {course.title}
      </Link>
      <PageHeader title="New lesson" description="Write the lesson in Markdown — the preview shows exactly what students will see." />
      {moduleId ? (
        <LessonForm
          courseId={course.id}
          modules={modules.map((m) => ({ id: m.id, title: m.title }))}
          lesson={{ moduleId, title: "", slug: "", summary: "", content: "", videoUrl: "", durationMin: 10, isPreview: false }}
        />
      ) : (
        <EmptyState
          title="Add a module first"
          description="Lessons live inside modules. Create a module in the Curriculum tab, then add lessons to it."
          action={<ButtonLink href={`/admin/courses/${course.id}?tab=curriculum`}>Go to curriculum</ButtonLink>}
        />
      )}
    </>
  );
}
