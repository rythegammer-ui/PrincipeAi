import { and, eq, max } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LocalDate } from "@/components/learn/local-date";
import { PrintButton } from "@/components/learn/print-button";
import { Logo } from "@/components/ui/misc";
import { site } from "@/config/site";
import { getDb, schema } from "@/db";
import { requireStudent } from "@/lib/auth";
import { courseProgress, getCourseWithCurriculum, isEnrolled } from "@/lib/courses";
import { getBusinessTimezone } from "@/lib/scheduling";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Certificate of completion" };

export default async function CertificatePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const student = await requireStudent(`/learn/${courseSlug}/certificate`);
  const data = await getCourseWithCurriculum(courseSlug, { includeUnpublished: true });
  if (!data) notFound();
  const { course, lessons } = data;
  if (!(await isEnrolled(student.id, course.id))) redirect(course.published ? `/courses/${course.slug}` : "/learn");
  const progress = await courseProgress(student.id, course.id, lessons);
  if (progress.total === 0 || progress.completed < progress.total) redirect(`/learn/${course.slug}`);

  const db = await getDb();
  const [{ completedAt }] = await db
    .select({ completedAt: max(schema.lessonProgress.completedAt) })
    .from(schema.lessonProgress)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonProgress.lessonId))
    .where(and(eq(schema.lessonProgress.userId, student.id), eq(schema.lessons.courseId, course.id)));
  // The student's own name, else their email: never the CRM contact's name, which anyone can set with a public form.
  const recipient = student.name?.trim() || student.email;
  const completedOn = completedAt ?? new Date();
  const tz = await getBusinessTimezone();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Back to my courses
        </Link>
        <PrintButton />
      </div>

      <article
        aria-label={`Certificate of completion for ${course.title}`}
        className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-lift print:rounded-none print:border-0 print:shadow-none"
      >
        <div className="relative rounded-xl border-2 border-double border-gold-300 px-6 py-12 text-center sm:px-16 sm:py-16">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
          <div className="relative">
            <div className="flex justify-center">
              <Logo />
            </div>
            <p className="mt-10 text-xs font-semibold tracking-[0.3em] text-gold-600 uppercase">Certificate of completion</p>
            <p className="mt-8 text-sm text-zinc-500">This certifies that</p>
            <p className="mt-3 font-display text-4xl break-words text-zinc-900 italic sm:text-6xl">{recipient}</p>
            <p className="mt-6 text-sm text-zinc-500">has successfully completed every lesson of</p>
            <h1 className="mx-auto mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-balance text-brand-800 sm:text-3xl">{course.title}</h1>
            <div className="mx-auto mt-12 grid grid-cols-1 max-w-lg gap-8 text-sm sm:grid-cols-2">
              <div>
                <p className="border-t border-zinc-300 pt-2 font-medium text-zinc-900"><LocalDate iso={completedOn.toISOString()} fallback={formatDate(completedOn, { dateStyle: "long" }, tz)} /></p>
                <p className="text-xs text-zinc-500">Date completed</p>
              </div>
              <div>
                <p className="border-t border-zinc-300 pt-2 font-medium text-zinc-900">{site.company}</p>
                <p className="text-xs text-zinc-500">{site.name}</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
