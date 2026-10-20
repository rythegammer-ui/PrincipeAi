import { and, asc, count, countDistinct, eq, gte, sql } from "drizzle-orm";
import { CheckCircle2, DollarSign, Eye, GraduationCap, Pencil, Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PaymentLinksPanel, type PaymentLinkRow } from "@/components/courses/admin/payment-links-panel";
import { CourseCover } from "@/components/courses/course-cover";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { site } from "@/config/site";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { linkMatchesCourse, readLastSync, readPaymentLinks, readWebhookSecret } from "@/lib/payment-links";
import { livePaymentsBlocked } from "@/lib/payments";
import { getStripe, stripeTestMode } from "@/lib/stripe";
import { absoluteUrl, formatMoney } from "@/lib/utils";
import { toggleCoursePublishedAction } from "./actions";

export const metadata: Metadata = { title: "Courses" };

async function loadCourses() {
  const db = await getDb();
  const [courses, lessonCounts, enrollmentCounts, revenue, [students], [completions], [courseRevenue]] = await Promise.all([
    db.select().from(schema.courses).orderBy(asc(schema.courses.sortOrder), asc(schema.courses.createdAt)),
    db.select({ courseId: schema.lessons.courseId, n: count() }).from(schema.lessons).groupBy(schema.lessons.courseId),
    db.select({ courseId: schema.enrollments.courseId, n: count() }).from(schema.enrollments).groupBy(schema.enrollments.courseId),
    db
      .select({
        courseId: schema.orders.courseId,
        real: sql<number>`coalesce(sum(case when ${schema.orders.isTest} then 0 else ${schema.orders.amountCents} end), 0)`.mapWith(Number),
        test: sql<number>`coalesce(sum(case when ${schema.orders.isTest} then ${schema.orders.amountCents} else 0 end), 0)`.mapWith(Number),
      })
      .from(schema.orders)
      .where(and(eq(schema.orders.status, "paid"), eq(schema.orders.itemType, "course")))
      .groupBy(schema.orders.courseId),
    db.select({ n: countDistinct(schema.enrollments.userId) }).from(schema.enrollments),
    db
      .select({ n: count() })
      .from(schema.lessonProgress)
      .where(gte(schema.lessonProgress.completedAt, new Date(Date.now() - 30 * 86_400_000))),
    db
      .select({ cents: sql<number>`coalesce(sum(${schema.orders.amountCents}), 0)`.mapWith(Number) })
      .from(schema.orders)
      .where(and(eq(schema.orders.status, "paid"), eq(schema.orders.itemType, "course"), eq(schema.orders.isTest, false))),
  ]);
  const lessonsBy = new Map(lessonCounts.map((r) => [r.courseId, r.n]));
  const enrolledBy = new Map(enrollmentCounts.map((r) => [r.courseId, r.n]));
  const revenueBy = new Map(revenue.map((r) => [r.courseId, r]));
  return {
    rows: courses.map((c) => ({
      course: c,
      lessons: lessonsBy.get(c.id) ?? 0,
      students: enrolledBy.get(c.id) ?? 0,
      revenue: revenueBy.get(c.id)?.real ?? 0,
      testRevenue: revenueBy.get(c.id)?.test ?? 0,
    })),
    totals: { students: students?.n ?? 0, completions: completions?.n ?? 0, revenue: courseRevenue?.cents ?? 0 },
  };
}

/** Each course's Stripe payment link (src/lib/payment-links.ts) and whether it sells at the current price. */
async function loadPaymentLinks(courses: (typeof schema.courses.$inferSelect)[]) {
  const db = await getDb();
  const mode = stripeTestMode() ? "test" : "live";
  const stripe = livePaymentsBlocked() ? "blocked" : getStripe() ? "connected" : "missing";
  const [links, storedWebhook, lastSync] = await Promise.all([readPaymentLinks(db, mode), readWebhookSecret(db, mode), readLastSync(db)]);
  const rows: PaymentLinkRow[] = courses.map((course) => {
    const link = links.get(course.id);
    const forSale = course.published && course.priceCents > 0;
    const status: PaymentLinkRow["status"] = !forSale
      ? link?.active
        ? "still-selling"
        : "off"
      : linkMatchesCourse(link, course, site.currency)
        ? "ready"
        : link
          ? "stale"
          : "missing";
    return {
      courseId: course.id,
      title: course.title,
      slug: course.slug,
      price: course.priceCents > 0 ? formatMoney(course.priceCents) : "Free",
      status,
      stripeUrl: link?.url ?? null,
      buyUrl: absoluteUrl(`/buy/${course.slug}`),
    };
  });
  const webhook = process.env.STRIPE_WEBHOOK_SECRET?.trim() ? "env" : storedWebhook ? "auto" : "missing";
  const syncErrors = lastSync && lastSync.mode === mode ? lastSync.errors : [];
  return { rows, stripe, mode, webhook, syncErrors } as const;
}

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const { rows, totals } = await loadCourses();
  const paymentLinks = await loadPaymentLinks(rows.map((r) => r.course));
  const published = rows.filter((r) => r.course.published).length;

  return (
    <>
      <PageHeader
        title="Courses"
        description="Build your catalog, edit lessons, and manage who has access."
        actions={
          <ButtonLink href="/admin/courses/new">
            <Plus aria-hidden /> New course
          </ButtonLink>
        }
      />
      {deleted && (
        <Alert tone="success" className="mb-6">
          Course deleted.
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Published courses" value={`${published} / ${rows.length}`} icon={GraduationCap} />
        <StatCard label="Students" value={totals.students} icon={Users} hint="Unique people with course access" />
        <StatCard label="Course revenue" value={formatMoney(totals.revenue)} icon={DollarSign} hint="Paid orders, excluding test checkouts" />
        <StatCard label="Lessons completed" value={totals.completions} icon={CheckCircle2} hint="Last 30 days" />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet"
          description="Create your first course — it starts as a draft so you can build it out before publishing."
          action={<ButtonLink href="/admin/courses/new">Create a course</ButtonLink>}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Course</TH>
                <TH>Price</TH>
                <TH>Status</TH>
                <TH className="text-right">Lessons</TH>
                <TH className="text-right">Students</TH>
                <TH className="text-right">Revenue</TH>
                <TH>
                  <span className="sr-only">Actions</span>
                </TH>
              </tr>
            </THead>
            <TBody>
              {rows.map(({ course, lessons, students, revenue, testRevenue }) => (
                <TR key={course.id}>
                  <TD>
                    <div className="flex min-w-64 items-center gap-3">
                      <CourseCover emoji={course.coverEmoji} audience={course.audience} size="sm" className="size-10 shrink-0 rounded-lg [&_span]:text-xl" />
                      <div className="min-w-0">
                        <Link href={`/admin/courses/${course.id}`} className="font-medium text-zinc-900 hover:text-brand-700">
                          {course.title}
                        </Link>
                        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                          /courses/{course.slug}
                          {course.featured && <Badge tone="gold">Featured</Badge>}
                        </p>
                      </div>
                    </div>
                  </TD>
                  <TD className="whitespace-nowrap tabular-nums">
                    {course.priceCents > 0 ? formatMoney(course.priceCents) : "Free"}
                    {course.compareAtCents ? <span className="ml-1.5 text-xs text-zinc-500 line-through">{formatMoney(course.compareAtCents)}</span> : null}
                  </TD>
                  <TD>
                    <form action={toggleCoursePublishedAction}>
                      <input type="hidden" name="id" value={course.id} />
                      <SubmitButton
                        variant="ghost"
                        size="sm"
                        className="-ml-2 gap-1.5 px-2"
                        title={course.published ? "Click to unpublish" : "Click to publish"}
                        // Name starts with the visible text so voice control ("click Published") finds it.
                        aria-label={`${course.published ? "Published" : "Draft"} – click to ${course.published ? "unpublish" : "publish"} ${course.title}`}
                      >
                        <span className={`size-2 rounded-full ${course.published ? "bg-emerald-500" : "bg-zinc-300"}`} aria-hidden />
                        {course.published ? "Published" : "Draft"}
                      </SubmitButton>
                    </form>
                  </TD>
                  <TD className="text-right tabular-nums">{lessons}</TD>
                  <TD className="text-right tabular-nums">{students}</TD>
                  <TD className="text-right whitespace-nowrap tabular-nums">
                    {formatMoney(revenue)}
                    {testRevenue > 0 && <span className="block text-xs text-zinc-500">+{formatMoney(testRevenue)} test</span>}
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1">
                      <ButtonLink href={`/admin/courses/${course.id}`} variant="ghost" size="sm" aria-label={`Edit ${course.title}`}>
                        <Pencil aria-hidden /> Edit
                      </ButtonLink>
                      <ButtonLink href={`/courses/${course.slug}`} target="_blank" variant="ghost" size="sm" aria-label={`View ${course.title} sales page`}>
                        <Eye aria-hidden />
                      </ButtonLink>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {rows.length > 0 && <PaymentLinksPanel {...paymentLinks} />}
    </>
  );
}
