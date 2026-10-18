import { BookOpen } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { requireStudent } from "@/lib/auth";
import { courseProgress, firstIncomplete, getCourseWithCurriculum, isEnrolled } from "@/lib/courses";

/** /learn/[course] → the student's next incomplete lesson (or the first lesson once they've finished). */
export default async function CourseHomePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const student = await requireStudent(`/learn/${courseSlug}`);
  const data = await getCourseWithCurriculum(courseSlug, { includeUnpublished: true });
  if (!data) notFound();
  const { course, lessons } = data;
  if (!(await isEnrolled(student.id, course.id))) {
    if (course.published) redirect(`/courses/${course.slug}`);
    notFound();
  }

  const progress = await courseProgress(student.id, course.id, lessons);
  const target = firstIncomplete(lessons, progress.completedLessonIds) ?? lessons[0];
  if (target) redirect(`/learn/${course.slug}/${target.slug}`);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <EmptyState
        className="bg-white"
        icon={BookOpen}
        title={`${course.title} is almost ready`}
        description="The lessons are being added right now. You'll get access to each one automatically as soon as it's published."
        action={<ButtonLink href="/learn">Back to my courses</ButtonLink>}
      />
    </div>
  );
}
