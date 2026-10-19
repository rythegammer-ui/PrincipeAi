import { and, count, desc, eq } from "drizzle-orm";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Eye, FileText, Plus, Trash2, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmit } from "@/components/courses/admin/confirm-submit";
import { CourseForm } from "@/components/courses/admin/course-form";
import { GrantAccessForm } from "@/components/courses/admin/grant-access-form";
import { formatDuration } from "@/components/courses/course-utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { EmptyState, PageHeader, Progress } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb, schema } from "@/db";
import type { Course } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { getCurriculum, type CurriculumModule } from "@/lib/courses";
import { getBusinessTimezone } from "@/lib/scheduling";
import { cn, formatDate, pluralize } from "@/lib/utils";
import {
  addModuleAction,
  deleteCourseAction,
  deleteLessonAction,
  deleteModuleAction,
  moveLessonAction,
  moveModuleAction,
  renameModuleAction,
  revokeAccessAction,
} from "../actions";

export const metadata: Metadata = { title: "Edit course" };

const TABS = [
  { key: "details", label: "Details" },
  { key: "curriculum", label: "Curriculum" },
  { key: "students", label: "Students" },
] as const;
type Tab = (typeof TABS)[number]["key"];

function IconForm({
  action,
  fields,
  label,
  disabled,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton variant="ghost" size="icon" className="size-8" aria-label={label} title={label} disabled={disabled}>
        {children}
      </SubmitButton>
    </form>
  );
}

function CurriculumEditor({ course, modules }: { course: Course; modules: CurriculumModule[] }) {
  return (
    <div className="flex flex-col gap-5">
      {modules.length === 0 && (
        <EmptyState title="No modules yet" description="Modules group your lessons into chapters. Add the first one below." />
      )}
      {modules.map((m, mi) => (
        <Card key={m.id}>
          <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center sm:px-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700 tabular-nums">{mi + 1}</span>
            <form action={renameModuleAction} className="flex min-w-0 flex-1 items-center gap-2">
              <input type="hidden" name="moduleId" value={m.id} />
              <label htmlFor={`module-${m.id}`} className="sr-only">
                Module {mi + 1} title
              </label>
              <Input id={`module-${m.id}`} name="title" defaultValue={m.title} required maxLength={160} className="h-9 font-medium" />
              <SubmitButton variant="outline" size="sm" pendingText="Saving…">
                Rename
              </SubmitButton>
            </form>
            <div className="flex items-center gap-0.5 self-end sm:self-auto">
              <IconForm action={moveModuleAction} fields={{ moduleId: m.id, direction: "up" }} label={`Move module ${mi + 1} up`} disabled={mi === 0}>
                <ArrowUp aria-hidden />
              </IconForm>
              <IconForm action={moveModuleAction} fields={{ moduleId: m.id, direction: "down" }} label={`Move module ${mi + 1} down`} disabled={mi === modules.length - 1}>
                <ArrowDown aria-hidden />
              </IconForm>
              <form action={deleteModuleAction}>
                <input type="hidden" name="moduleId" value={m.id} />
                <ConfirmSubmit
                  variant="ghost"
                  size="icon"
                  className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                  aria-label={`Delete module ${mi + 1}`}
                  title="Delete module"
                  confirmMessage={`Delete “${m.title}” and its ${pluralize(m.lessons.length, "lesson")}? Student progress on those lessons is removed too. This can't be undone.`}
                >
                  <Trash2 aria-hidden />
                </ConfirmSubmit>
              </form>
            </div>
          </div>
          <ol className="divide-y divide-zinc-100">
            {m.lessons.map((l, li) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:flex-nowrap sm:px-5">
                <span className="w-8 shrink-0 text-center text-xs text-zinc-500 tabular-nums">
                  {mi + 1}.{li + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/courses/${course.id}/lessons/${l.id}`} className="text-sm font-medium text-zinc-900 hover:text-brand-700">
                    {l.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                    <span>{formatDuration(l.durationMin)}</span>
                    {l.isPreview && (
                      <Badge tone="brand">
                        <Eye aria-hidden /> Free preview
                      </Badge>
                    )}
                    {l.videoUrl ? (
                      <Badge tone="blue">
                        <Video aria-hidden /> Video
                      </Badge>
                    ) : (
                      <Badge>
                        <FileText aria-hidden /> Text
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <IconForm action={moveLessonAction} fields={{ lessonId: l.id, direction: "up" }} label={`Move “${l.title}” up`} disabled={li === 0}>
                    <ArrowUp aria-hidden />
                  </IconForm>
                  <IconForm action={moveLessonAction} fields={{ lessonId: l.id, direction: "down" }} label={`Move “${l.title}” down`} disabled={li === m.lessons.length - 1}>
                    <ArrowDown aria-hidden />
                  </IconForm>
                  <ButtonLink href={`/admin/courses/${course.id}/lessons/${l.id}`} variant="ghost" size="sm">
                    Edit
                  </ButtonLink>
                  <form action={deleteLessonAction}>
                    <input type="hidden" name="lessonId" value={l.id} />
                    <ConfirmSubmit
                      variant="ghost"
                      size="icon"
                      className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                      aria-label={`Delete “${l.title}”`}
                      title="Delete lesson"
                      confirmMessage={`Delete the lesson “${l.title}”? Student progress on it is removed too. This can't be undone.`}
                    >
                      <Trash2 aria-hidden />
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            ))}
            {m.lessons.length === 0 && <li className="px-5 py-4 text-sm text-zinc-500">No lessons in this module yet.</li>}
          </ol>
          <div className="border-t border-zinc-100 px-4 py-3 sm:px-5">
            <ButtonLink href={`/admin/courses/${course.id}/lessons/new?module=${m.id}`} variant="secondary" size="sm">
              <Plus aria-hidden /> Add lesson
            </ButtonLink>
          </div>
        </Card>
      ))}

      <Card>
        <CardContent>
          <form action={addModuleAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="courseId" value={course.id} />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <label htmlFor="new-module" className="text-sm font-medium text-zinc-800">
                New module
              </label>
              <Input id="new-module" name="title" placeholder="e.g. Putting it into practice" required maxLength={160} />
            </div>
            <SubmitButton variant="outline" pendingText="Adding…">
              <Plus aria-hidden /> Add module
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

async function StudentsPanel({ course, totalLessons }: { course: Course; totalLessons: number }) {
  const db = await getDb();
  const [students, progressRows, tz] = await Promise.all([
    db
      .select({
        userId: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        contactId: schema.users.contactId,
        lastLoginAt: schema.users.lastLoginAt,
        source: schema.enrollments.source,
        enrolledAt: schema.enrollments.createdAt,
      })
      .from(schema.enrollments)
      .innerJoin(schema.users, eq(schema.users.id, schema.enrollments.userId))
      .where(eq(schema.enrollments.courseId, course.id))
      .orderBy(desc(schema.enrollments.createdAt))
      .limit(500),
    db
      .select({ userId: schema.lessonProgress.userId, n: count() })
      .from(schema.lessonProgress)
      .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonProgress.lessonId))
      .where(eq(schema.lessons.courseId, course.id))
      .groupBy(schema.lessonProgress.userId),
    getBusinessTimezone(),
  ]);
  const completedBy = new Map(progressRows.map((r) => [r.userId, r.n]));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Grant access</CardTitle>
          <CardDescription>Give someone this course without payment — for comps, partners or offline sales.</CardDescription>
        </CardHeader>
        <CardContent>
          <GrantAccessForm courseId={course.id} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4 sm:pb-4">
          <CardTitle>Enrolled students ({students.length})</CardTitle>
        </CardHeader>
        {students.length === 0 ? (
          <CardContent>
            <EmptyState title="No students yet" description="Students appear here as soon as they buy the course or you grant them access." />
          </CardContent>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Student</TH>
                <TH>Source</TH>
                <TH>Enrolled</TH>
                <TH className="min-w-48">Progress</TH>
                <TH>Last sign-in</TH>
                <TH>
                  <span className="sr-only">Actions</span>
                </TH>
              </tr>
            </THead>
            <TBody>
              {students.map((s) => {
                const done = Math.min(completedBy.get(s.userId) ?? 0, totalLessons);
                const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
                return (
                  <TR key={s.userId}>
                    <TD>
                      {s.contactId ? (
                        <Link href={`/admin/contacts/${s.contactId}`} className="font-medium text-zinc-900 hover:text-brand-700">
                          {s.name || s.email}
                        </Link>
                      ) : (
                        <span className="font-medium text-zinc-900">{s.name || s.email}</span>
                      )}
                      {s.name && <span className="block text-xs text-zinc-500">{s.email}</span>}
                    </TD>
                    <TD>
                      <Badge tone={s.source === "purchase" ? "green" : "neutral"}>{s.source === "purchase" ? "Purchase" : "Manual"}</Badge>
                    </TD>
                    <TD className="whitespace-nowrap">{formatDate(s.enrolledAt, {}, tz)}</TD>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Progress value={pct} className="w-28" label={`${s.name || s.email} progress`} />
                        <span className="text-xs whitespace-nowrap text-zinc-500 tabular-nums">
                          {done}/{totalLessons}
                        </span>
                      </div>
                    </TD>
                    <TD className="whitespace-nowrap text-zinc-500">{s.lastLoginAt ? formatDate(s.lastLoginAt, {}, tz) : "Never"}</TD>
                    <TD className="text-right">
                      <form action={revokeAccessAction}>
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="userId" value={s.userId} />
                        <ConfirmSubmit
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          confirmMessage={`Remove ${s.email}'s access to “${course.title}”? Their progress is kept if you grant access again.`}
                        >
                          Remove access
                        </ConfirmSubmit>
                      </form>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; created?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await getDb();
  const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, id)).limit(1);
  if (!course) notFound();
  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab) : "details";
  const { modules, lessons } = await getCurriculum(course.id);
  const [[{ value: studentCount }], [{ value: paidOrders }]] = await Promise.all([
    db.select({ value: count() }).from(schema.enrollments).where(eq(schema.enrollments.courseId, course.id)),
    db.select({ value: count() }).from(schema.orders).where(and(eq(schema.orders.courseId, course.id), eq(schema.orders.status, "paid"))),
  ]);

  return (
    <>
      <Link href="/admin/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="size-4" aria-hidden /> All courses
      </Link>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span aria-hidden>{course.coverEmoji}</span> {course.title}
            <Badge tone={course.published ? "green" : "neutral"}>{course.published ? "Published" : "Draft"}</Badge>
          </span>
        }
        description={`${pluralize(modules.length, "module")} · ${pluralize(lessons.length, "lesson")} · ${pluralize(studentCount, "student")}`}
        actions={
          <ButtonLink href={`/courses/${course.slug}`} target="_blank" variant="outline" size="sm">
            View sales page <ExternalLink aria-hidden />
          </ButtonLink>
        }
      />

      {sp.created && (
        <Alert tone="success" title="Draft course created" className="mb-6">
          Fill in the sales page below, then add modules and lessons in the Curriculum tab. Publish when you&apos;re ready.
        </Alert>
      )}
      {sp.error === "has-students" && (
        <Alert tone="warning" title="This course can't be deleted" className="mb-6">
          It has students or paid orders. Unpublish it instead to hide it from the catalog — existing students keep access.
        </Alert>
      )}
      {sp.error === "open-checkouts" && (
        <Alert tone="warning" title="Someone is mid-checkout for this course" className="mb-6">
          Deleting it now would leave their payment with nothing to deliver. Unpublish it now to stop new checkouts, then delete it after 24
          hours.
        </Alert>
      )}

      <nav aria-label="Course sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-zinc-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "details" ? `/admin/courses/${course.id}` : `/admin/courses/${course.id}?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              tab === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-zinc-500 hover:text-zinc-900",
            )}
          >
            {t.label}
            {t.key === "curriculum" && <span className="ml-1.5 text-xs text-zinc-500">{lessons.length}</span>}
            {t.key === "students" && <span className="ml-1.5 text-xs text-zinc-500">{studentCount}</span>}
          </Link>
        ))}
      </nav>

      {tab === "details" && (
        <div className="flex flex-col gap-8">
          <CourseForm
            course={{
              id: course.id,
              title: course.title,
              slug: course.slug,
              subtitle: course.subtitle,
              description: course.description,
              audience: course.audience,
              level: course.level,
              priceCents: course.priceCents,
              compareAtCents: course.compareAtCents,
              coverEmoji: course.coverEmoji,
              featured: course.featured,
              published: course.published,
              sortOrder: course.sortOrder,
              outcomes: course.outcomes,
              includes: course.includes,
              faqs: course.faqs,
            }}
          />
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Delete course</CardTitle>
              <CardDescription>
                {studentCount > 0 || paidOrders > 0
                  ? "This course has students or paid orders, so it can't be deleted. Unpublish it to hide it from the catalog."
                  : "Permanently delete this draft, its modules and lessons. This can't be undone."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentCount > 0 || paidOrders > 0 ? (
                <Button variant="outline" disabled>
                  <Trash2 aria-hidden /> Delete course
                </Button>
              ) : (
                <form action={deleteCourseAction}>
                  <input type="hidden" name="id" value={course.id} />
                  <ConfirmSubmit variant="danger" confirmMessage={`Delete “${course.title}” permanently? This can't be undone.`} pendingText="Deleting…">
                    <Trash2 aria-hidden /> Delete course
                  </ConfirmSubmit>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {tab === "curriculum" && <CurriculumEditor course={course} modules={modules} />}
      {tab === "students" && <StudentsPanel course={course} totalLessons={lessons.length} />}
    </>
  );
}
