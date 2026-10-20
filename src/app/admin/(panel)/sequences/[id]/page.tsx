import { and, asc, count, desc, eq, gt, sql } from "drizzle-orm";
import { ArrowLeft, Users, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StopEnrollmentButton } from "@/components/admin/stop-enrollment-button";
import { ActiveToggle } from "@/components/funnels/active-toggle";
import { ENROLLMENT_STATUS_META, TRIGGER_META } from "@/components/funnels/automation-utils";
import { SequenceForm } from "@/components/funnels/sequence-form";
import { DeleteSequenceButton, EnrollContactForm } from "@/components/funnels/sequence-widgets";
import { StepsEditor } from "@/components/funnels/steps-editor";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb, schema } from "@/db";
import type { EnrollmentStatus } from "@/db/schema";
import { getAdminSession, requireAdmin } from "@/lib/auth";
import { getBusinessTimezone } from "@/lib/scheduling";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const ENROLLMENT_LIMIT = 100;
const STATUS_FILTERS = ["all", "active", "completed", "stopped"] as const;

async function loadSequence(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const db = await getDb();
  const [seq] = await db.select().from(schema.emailSequences).where(eq(schema.emailSequences.id, id)).limit(1);
  return seq ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await requireAdmin();
  const seq = await loadSequence((await params).id);
  return { title: seq ? seq.name : "Automation not found" };
}

export default async function SequencePage({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const seq = await loadSequence(id);
  if (!seq) notFound();
  const statusParam = typeof sp.status === "string" && (STATUS_FILTERS as readonly string[]).includes(sp.status) ? (sp.status as (typeof STATUS_FILTERS)[number]) : "all";

  const db = await getDb();
  const e = schema.sequenceEnrollments;
  const [steps, statusCounts, enrollments, sentRow, session, tz, buyLinkCourses] = await Promise.all([
    db
      .select({ id: schema.sequenceSteps.id, position: schema.sequenceSteps.position, delayHours: schema.sequenceSteps.delayHours, subject: schema.sequenceSteps.subject, body: schema.sequenceSteps.body })
      .from(schema.sequenceSteps)
      .where(eq(schema.sequenceSteps.sequenceId, seq.id))
      .orderBy(asc(schema.sequenceSteps.position), asc(schema.sequenceSteps.createdAt)),
    db.select({ status: e.status, n: count() }).from(e).where(eq(e.sequenceId, seq.id)).groupBy(e.status),
    db
      .select({
        id: e.id,
        status: e.status,
        nextStep: e.nextStep,
        nextRunAt: e.nextRunAt,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        contactId: schema.contacts.id,
        name: schema.contacts.name,
        email: schema.contacts.email,
        unsubscribed: schema.contacts.unsubscribed,
      })
      .from(e)
      .innerJoin(schema.contacts, eq(schema.contacts.id, e.contactId))
      .where(statusParam === "all" ? eq(e.sequenceId, seq.id) : and(eq(e.sequenceId, seq.id), eq(e.status, statusParam)))
      .orderBy(sql`case ${e.status} when 'active' then 0 else 1 end`, asc(e.nextRunAt), desc(e.updatedAt))
      .limit(ENROLLMENT_LIMIT),
    db
      .select({ n: count() })
      .from(schema.activities)
      .where(and(eq(schema.activities.type, "email_sent"), sql`${schema.activities.meta}->>'sequenceId' = ${seq.id}`)),
    getAdminSession(),
    getBusinessTimezone(),
    // Paid, published courses: offered as {{buy_link:<slug>}} placeholders.
    db
      .select({ slug: schema.courses.slug, title: schema.courses.title })
      .from(schema.courses)
      .where(and(eq(schema.courses.published, true), gt(schema.courses.priceCents, 0)))
      .orderBy(asc(schema.courses.sortOrder)),
  ]);
  const counts: Record<EnrollmentStatus, number> = { active: 0, completed: 0, stopped: 0 };
  for (const r of statusCounts) counts[r.status] = Number(r.n);
  const total = counts.active + counts.completed + counts.stopped;
  const sent = Number(sentRow[0]?.n ?? 0);
  const filteredTotal = statusParam === "all" ? total : counts[statusParam];
  const trigger = TRIGGER_META[seq.trigger];
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/sequences" className="mb-3 inline-flex min-h-8 items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="size-4" aria-hidden /> Email Automations
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{seq.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <Badge tone="gold">
                <Zap aria-hidden /> {trigger.label}
              </Badge>
              <span>
                {steps.length} {steps.length === 1 ? "email" : "emails"} · {sent.toLocaleString()} sent
              </span>
            </p>
          </div>
          <ActiveToggle sequenceId={seq.id} name={seq.name} active={seq.active} />
        </div>
      </div>

      {sp.created === "1" && <Alert tone="success">Automation created. Now add the emails it should send.</Alert>}
      {!seq.active && (
        <Alert tone="warning" title="This automation is off">
          Nobody new will join, and anyone in progress stops at their next scheduled email. Turn it on when the emails are ready.
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <section aria-labelledby="emails-heading" className="flex min-w-0 flex-col gap-3 xl:col-span-2">
          <div>
            <h2 id="emails-heading" className="text-lg font-semibold tracking-tight text-zinc-900">
              Emails
            </h2>
            <p className="text-sm text-zinc-500">
              Sent in order. Each wait counts from the previous email. Edits never re-send an email someone already received.
            </p>
          </div>
          <StepsEditor sequenceId={seq.id} initialSteps={steps} adminEmail={session?.email ?? "your admin email"} buyLinkCourses={buyLinkCourses} />
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>{trigger.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <SequenceForm
                mode="edit"
                sequence={{ id: seq.id, name: seq.name, description: seq.description ?? "", trigger: seq.trigger, active: seq.active }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>Deleting removes this automation, its emails and everyone&apos;s progress. Sent emails stay in the Email Log.</CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteSequenceButton sequenceId={seq.id} name={seq.name} />
            </CardContent>
          </Card>
        </div>
      </div>

      <section aria-labelledby="people-heading" className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="people-heading" className="text-lg font-semibold tracking-tight text-zinc-900">
              People in this automation
            </h2>
            <p className="text-sm text-zinc-500">
              {total.toLocaleString()} enrolled · {counts.active.toLocaleString()} in progress · {counts.completed.toLocaleString()} completed ·{" "}
              {counts.stopped.toLocaleString()} stopped
            </p>
          </div>
          <nav aria-label="Filter by status" className="inline-flex self-start rounded-xl border border-zinc-200 bg-white p-0.5 shadow-xs">
            {STATUS_FILTERS.map((s) => (
              <Link
                key={s}
                href={s === "all" ? `/admin/sequences/${seq.id}#people-heading` : `/admin/sequences/${seq.id}?status=${s}#people-heading`}
                scroll={false}
                aria-current={statusParam === s ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                  statusParam === s ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                )}
              >
                {s === "all" ? "All" : ENROLLMENT_STATUS_META[s].label}
              </Link>
            ))}
          </nav>
        </div>

        {seq.trigger === "manual" && (
          <Card>
            <CardHeader>
              <CardTitle>Enroll someone</CardTitle>
              <CardDescription>This is a manual automation, so people join only when you add them here.</CardDescription>
            </CardHeader>
            <CardContent>
              <EnrollContactForm sequenceId={seq.id} />
            </CardContent>
          </Card>
        )}

        {enrollments.length === 0 ? (
          <EmptyState
            icon={Users}
            title={statusParam === "all" ? "Nobody has joined yet" : `No ${ENROLLMENT_STATUS_META[statusParam].label.toLowerCase()} enrollments`}
            description={seq.trigger === "manual" ? "Enroll someone above to start sending." : `People join automatically when they ${trigger.label.toLowerCase()}.`}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
            <Table>
              <caption className="sr-only">People enrolled in {seq.name}</caption>
              <THead>
                <tr>
                  <TH scope="col">Contact</TH>
                  <TH scope="col">Progress</TH>
                  <TH scope="col" className="hidden md:table-cell">
                    Next email
                  </TH>
                  <TH scope="col" className="hidden sm:table-cell">
                    Status
                  </TH>
                  <TH scope="col" className="relative px-2 text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {enrollments.map((r) => {
                  const meta = ENROLLMENT_STATUS_META[r.status];
                  const nextSubject = r.status === "active" ? steps[r.nextStep]?.subject : null;
                  const sentCount = Math.min(r.nextStep, steps.length);
                  return (
                    <TR key={r.id}>
                      <TD className="max-w-[12rem] sm:max-w-xs">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.name} email={r.email} className="hidden sm:inline-flex" />
                          <div className="min-w-0">
                            <Link href={`/admin/contacts/${r.contactId}`} className="block truncate font-medium text-zinc-900 hover:text-brand-700 hover:underline">
                              {r.name || r.email}
                            </Link>
                            <p className="truncate text-xs text-zinc-500">
                              {r.name ? r.email : `Joined ${timeAgo(r.createdAt, now)}`}
                              {r.unsubscribed && <span className="ml-1 text-amber-700">· unsubscribed</span>}
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD className="tabular-nums">
                        <span className="text-sm text-zinc-900">
                          {sentCount} of {steps.length}
                        </span>
                        <span className="block text-xs text-zinc-500">sent</span>
                        <Badge tone={meta.tone} className="mt-1 sm:hidden">
                          {meta.label}
                        </Badge>
                      </TD>
                      <TD className="hidden max-w-xs md:table-cell">
                        {r.status === "active" && r.nextRunAt ? (
                          <>
                            <span className="block truncate text-sm text-zinc-900">{nextSubject ?? "Final check"}</span>
                            <span className="text-xs text-zinc-500">
                              {r.nextRunAt <= now ? "Due now · sends on the next run" : formatDateTime(r.nextRunAt, tz)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-zinc-400">—</span>
                        )}
                      </TD>
                      <TD className="hidden sm:table-cell">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </TD>
                      <TD className="px-2 text-right">
                        {r.status === "active" && <StopEnrollmentButton contactId={r.contactId} enrollmentId={r.id} sequenceName={seq.name} />}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            {filteredTotal > enrollments.length && (
              <p className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500">
                Showing the first {enrollments.length.toLocaleString()} of {filteredTotal.toLocaleString()}. Open a contact to see their full history.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
