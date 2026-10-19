import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  Bot,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  Globe,
  Inbox,
  Mail,
  MessageSquare,
  MousePointerClick,
  Phone,
  Receipt,
  Workflow,
} from "lucide-react";
import { DateTime } from "luxon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";
import { AiBrief } from "@/components/admin/ai-brief";
import { ContactProfileForm } from "@/components/admin/contact-forms";
import {
  displayName,
  humanizeSlug,
  safeWebsiteUrl,
  scoreBreakdown,
  segmentLabel,
  sourceLabel,
  titleCase,
  toTaskItem,
  utmSourceLabel,
} from "@/components/admin/crm-utils";
import { DealValueEditor } from "@/components/admin/deal-value-editor";
import { DeleteContact } from "@/components/admin/delete-contact";
import { EmailComposer } from "@/components/admin/email-composer";
import { NotesForm } from "@/components/admin/notes-form";
import { ScoreMeter } from "@/components/admin/score-meter";
import { StageSelect } from "@/components/admin/stage-select";
import { StopEnrollmentButton } from "@/components/admin/stop-enrollment-button";
import { TagEditor } from "@/components/admin/tag-editor";
import { TaskForm } from "@/components/admin/task-form";
import { TaskItem } from "@/components/admin/task-item";
import { ActivityTimeline } from "@/components/admin/timeline";
import { TimelineComposer } from "@/components/admin/timeline-composer";
import { UnsubscribeToggle } from "@/components/admin/unsubscribe-toggle";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { meetingColor } from "@/components/booking/meeting-colors";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { Avatar } from "@/components/ui/misc";
import { getDb, schema } from "@/db";
import type { OrderStatus } from "@/db/schema";
import { aiEnabled } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { getContact360 } from "@/lib/crm-queries";
import { getBusinessTimezone } from "@/lib/scheduling";
import { cn, formatDate, formatDateTime, formatMoney, timeAgo } from "@/lib/utils";

const ORDER_TONES: Record<OrderStatus, BadgeTone> = { paid: "green", pending: "neutral", refunded: "amber", failed: "red", expired: "neutral" };
const EMAIL_TONES: Record<string, BadgeTone> = { sent: "green", simulated: "blue", failed: "red", skipped: "neutral" };
const ENROLLMENT_TONES: Record<string, BadgeTone> = { active: "brand", completed: "green", stopped: "neutral" };

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return { title: "Contact" };
  const db = await getDb();
  const [row] = await db.select({ name: schema.contacts.name, email: schema.contacts.email }).from(schema.contacts).where(eq(schema.contacts.id, id)).limit(1);
  return { title: row ? displayName(row) : "Contact" };
}

function Section({ title, icon: Icon, count, children, action, id }: { title: string; icon: typeof Mail; count?: number; children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <Card id={id}>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4 text-zinc-400" aria-hidden />
          {title}
          {count !== undefined && count > 0 && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 tabular-nums">{count}</span>}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}

export default async function ContactPage({ params }: Params) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [data, tz] = await Promise.all([getContact360(id), getBusinessTimezone()]);
  if (!data) notFound();

  const { contact: ct } = data;
  const now = new Date();
  const name = displayName(ct);
  const website = safeWebsiteUrl(ct.website);
  const score = scoreBreakdown(ct, data.scoreActivities);
  const openTasks = data.tasks.filter((t) => !t.completedAt);
  const doneTasks = data.tasks.filter((t) => t.completedAt);
  const endOfToday = DateTime.fromJSDate(now, { zone: tz }).endOf("day").toJSDate();
  const quiz = data.quizzes[0];
  const firstSeen = [ct.createdAt, data.eventSummary?.firstSeen].filter((d): d is Date => d instanceof Date).sort((a, b) => a.getTime() - b.getTime())[0];
  const utmEntries = Object.entries(ct.utm ?? {}).filter(([, v]) => Boolean(v));
  const aiConfigured = aiEnabled();

  const bucketFor = (t: (typeof data.tasks)[number]) => {
    if (t.completedAt) return "done" as const;
    if (!t.dueAt) return "none" as const;
    if (t.dueAt < now) return "overdue" as const;
    return t.dueAt <= endOfToday ? ("today" as const) : ("upcoming" as const);
  };

  return (
    <div>
      <Link href="/admin/contacts" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="size-4" aria-hidden /> Contacts
      </Link>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Avatar name={ct.name} email={ct.email} className="size-14 text-base" />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-900">{name}</h1>
                <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                  <li className="flex min-w-0 items-center gap-1.5">
                    <Mail className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
                    <a href={`mailto:${ct.email}`} className="truncate hover:text-brand-700 hover:underline">
                      {ct.email}
                    </a>
                  </li>
                  {ct.phone && (
                    <li className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-zinc-400" aria-hidden />
                      <a href={`tel:${ct.phone.replace(/[^+\d]/g, "")}`} className="hover:text-brand-700 hover:underline">
                        {ct.phone}
                      </a>
                    </li>
                  )}
                  {ct.company && (
                    <li className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-zinc-400" aria-hidden />
                      {ct.company}
                    </li>
                  )}
                  {website && (
                    <li className="flex min-w-0 items-center gap-1.5">
                      <Globe className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
                      <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="truncate hover:text-brand-700 hover:underline">
                        {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            <StageSelect contactId={ct.id} stage={ct.stage} label="Pipeline stage" hideLabel={false} className="md:w-52" />
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-zinc-100 pt-5 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Lead score</dt>
              <dd className="mt-1">
                <ScoreMeter score={ct.score} />
                <details className="group mt-1">
                  <summary className="cursor-pointer text-xs font-medium text-brand-700 hover:underline">Why this score?</summary>
                  <ul className="mt-2 flex w-56 flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-3 text-xs shadow-soft">
                    {score.items.length === 0 && <li className="text-zinc-500">No scoring activity yet.</li>}
                    {score.items.map((item) => (
                      <li key={item.label} className="flex justify-between gap-2">
                        <span className="text-zinc-600">{item.label}</span>
                        <span className={cn("font-medium tabular-nums", item.points < 0 ? "text-red-700" : "text-zinc-900")}>
                          {item.points > 0 ? "+" : "−"}
                          {Math.abs(item.points)}
                        </span>
                      </li>
                    ))}
                    <li className="mt-1 flex justify-between border-t border-zinc-100 pt-1.5 font-semibold text-zinc-900">
                      Total (max 100) <span className="tabular-nums">{score.total}</span>
                    </li>
                  </ul>
                </details>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Deal value</dt>
              <dd className="mt-1">
                <DealValueEditor contactId={ct.id} cents={ct.dealValueCents} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Lifetime value</dt>
              <dd className="mt-1 text-base font-semibold text-zinc-900 tabular-nums">{formatMoney(ct.lifetimeValueCents)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Interested in</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900">{segmentLabel(ct.segment)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Source</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900">
                {sourceLabel(ct.source)}
                {ct.utm?.source && <span className="block text-xs font-normal text-zinc-500">via {utmSourceLabel(ct.utm.source)}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Contact since</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900">
                {formatDate(ct.createdAt, {}, tz)}
                <span className="block text-xs font-normal text-zinc-500">active {timeAgo(ct.lastActivityAt, now)}</span>
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-4 border-t border-zinc-100 pt-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs font-medium text-zinc-500">Tags</p>
              <TagEditor contactId={ct.id} tags={ct.tags} />
            </div>
            <UnsubscribeToggle contactId={ct.id} unsubscribed={ct.unsubscribed} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <AiBrief contactId={ct.id} summary={ct.aiSummary} summaryAt={ct.aiSummaryAt?.toISOString() ?? null} aiConfigured={aiConfigured} tz={tz} />

          <Section title="Send an email" icon={Mail} id="email">
            <EmailComposer contactId={ct.id} contactEmail={ct.email} unsubscribed={ct.unsubscribed} aiConfigured={aiConfigured} />
          </Section>

          <Section title="Timeline" icon={CalendarDays} count={data.activities.length}>
            <TimelineComposer contactId={ct.id} />
            <div className="mt-6">
              {data.activities.length === 0 ? (
                <Empty>No activity yet.</Empty>
              ) : (
                <ActivityTimeline items={data.activities} tz={tz} now={now} />
              )}
              {data.activities.length >= 200 && <p className="mt-4 text-xs text-zinc-500">Showing the latest 200 entries.</p>}
            </div>
          </Section>
        </div>

        {/* Side column */}
        <div className="flex min-w-0 flex-col gap-6">
          <Section title="Notes" icon={ClipboardCheck}>
            <NotesForm contactId={ct.id} notes={ct.notes} />
          </Section>

          <Section title="Tasks" icon={ClipboardCheck} count={openTasks.length}>
            <TaskForm contact={{ id: ct.id, label: name }} tz={tz} compact />
            {data.tasks.length > 0 && (
              <ul className="-mx-5 mt-4 divide-y divide-zinc-100 border-t border-zinc-100 sm:-mx-6">
                {[...openTasks, ...doneTasks.slice(0, 5)].map((t) => (
                  <TaskItem key={t.id} task={toTaskItem(t)} tz={tz} bucket={bucketFor(t)} showContact={false} />
                ))}
              </ul>
            )}
          </Section>

          <Section title="Bookings" icon={CalendarDays} count={data.bookings.length}>
            {data.bookings.length === 0 ? (
              <Empty>No calls booked yet.</Empty>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.bookings.map((b) => {
                  const firstAnswer = Object.values(b.answers ?? {}).find(Boolean);
                  return (
                    <li key={b.id} className="rounded-xl border border-zinc-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-900">
                          <span aria-hidden className={cn("size-2 shrink-0 rounded-full", meetingColor(b.color).dot)} />
                          {b.meetingType}
                        </p>
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{formatDateTime(b.startAt, tz)}</p>
                      {firstAnswer && <p className="mt-1.5 line-clamp-2 text-xs text-zinc-600">“{firstAnswer}”</p>}
                      <div className="mt-2 flex gap-3 text-xs font-medium">
                        <a href={`/booking/${b.manageToken}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                          Manage <ExternalLink className="size-3" aria-hidden />
                        </a>
                        <Link href="/admin/bookings" className="text-zinc-600 hover:underline">
                          All bookings
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="AI assessment" icon={ClipboardCheck} count={data.quizzes.length}>
            {!quiz ? (
              <Empty>Hasn’t taken the AI readiness assessment.</Empty>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <p className="text-3xl font-semibold tracking-tight text-zinc-900">
                    {quiz.score}
                    <span className="text-base font-normal text-zinc-400">/100</span>
                  </p>
                  <div className="flex flex-col gap-1">
                    <Badge tone="gold" className="self-start">
                      {titleCase(quiz.tier)}
                    </Badge>
                    <p className="text-xs text-zinc-500">
                      Recommended: <span className="font-medium text-zinc-700">{humanizeSlug(quiz.recommendation)}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">Taken {formatDateTime(quiz.createdAt, tz)}</p>
                {Object.keys(quiz.answers ?? {}).length > 0 && (
                  <details className="rounded-xl bg-zinc-50 p-3 text-sm">
                    <summary className="cursor-pointer font-medium text-zinc-800">Answers</summary>
                    <dl className="mt-2 flex flex-col gap-2">
                      {Object.entries(quiz.answers).map(([k, v]) => (
                        <div key={k}>
                          {/* "_name" / "_company": what was typed in with this submission (not quiz answers). */}
                          <dt className="text-xs text-zinc-500">{k.startsWith("_") ? `${titleCase(k.slice(1))} entered` : titleCase(k)}</dt>
                          <dd className="text-zinc-800">{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
                {quiz.plan && (
                  <details className="rounded-xl bg-zinc-50 p-3 text-sm">
                    <summary className="cursor-pointer font-medium text-zinc-800">Personalised AI plan</summary>
                    <Markdown untrusted className="prose-sm mt-2">{quiz.plan}</Markdown>
                  </details>
                )}
                {data.quizzes.length > 1 && <p className="text-xs text-zinc-500">{data.quizzes.length - 1} earlier submission(s).</p>}
              </div>
            )}
          </Section>

          <Section title="Orders" icon={Receipt} count={data.orders.length} action={data.orders.length > 0 ? <Link href="/admin/orders" className="text-sm font-medium text-brand-700 hover:underline">All orders</Link> : undefined}>
            {data.orders.length === 0 ? (
              <Empty>No orders yet.</Empty>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-100">
                {data.orders.map((o) => (
                  <li key={o.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{o.description}</p>
                      <p className="text-xs text-zinc-500">{formatDate(o.paidAt ?? o.createdAt, {}, tz)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-zinc-900 tabular-nums">{formatMoney(o.amountCents, o.currency)}</span>
                      <span className="flex gap-1">
                        {o.isTest && <Badge tone="neutral">Test</Badge>}
                        <Badge tone={ORDER_TONES[o.status] ?? "neutral"}>{titleCase(o.status)}</Badge>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Email automations" icon={Workflow} count={data.enrollments.filter((e) => e.status === "active").length}>
            {data.enrollments.length === 0 ? (
              <Empty>Not enrolled in any automation.</Empty>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.enrollments.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{e.sequenceName}</p>
                      <p className="text-xs text-zinc-500">
                        {e.status === "active"
                          ? `Next: email ${Math.min(e.nextStep + 1, e.stepCount)} of ${e.stepCount}${e.nextRunAt ? ` · ${formatDateTime(e.nextRunAt, tz)}` : ""}`
                          : `${Math.min(e.nextStep, e.stepCount)} of ${e.stepCount} emails sent`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge tone={ENROLLMENT_TONES[e.status] ?? "neutral"}>{titleCase(e.status)}</Badge>
                      {e.status === "active" && <StopEnrollmentButton contactId={ct.id} enrollmentId={e.id} sequenceName={e.sequenceName} />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Emails sent" icon={Inbox} count={data.emails.length}>
            {data.emails.length === 0 ? (
              <Empty>No emails sent yet.</Empty>
            ) : (
              <ul className="flex max-h-80 flex-col divide-y divide-zinc-100 overflow-y-auto">
                {data.emails.map((e) => (
                  <li key={e.id} className="py-2 first:pt-0 last:pb-0">
                    <p className="truncate text-sm text-zinc-900" title={e.subject}>
                      {e.subject}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                      <Badge tone={EMAIL_TONES[e.status] ?? "neutral"}>{titleCase(e.status)}</Badge>
                      <span>{titleCase(e.kind)}</span>·<time dateTime={e.createdAt.toISOString()}>{timeAgo(e.createdAt, now)}</time>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="AI chats" icon={MessageSquare} count={data.chats.length}>
            {data.chats.length === 0 ? (
              <Empty>No AI chat conversations linked to this contact.</Empty>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.chats.map((chat) => (
                  <li key={chat.id}>
                    <details className="group rounded-xl border border-zinc-200">
                      <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <Bot className="size-4 shrink-0 text-brand-600" aria-hidden />
                          <span className="truncate font-medium text-zinc-900">{chat.kind === "tutor" ? "Course tutor" : "Website assistant"}</span>
                        </span>
                        <span className="shrink-0 text-xs text-zinc-500">
                          {chat.messages.length} msgs · {timeAgo(chat.updatedAt, now)}
                        </span>
                      </summary>
                      <ol className="flex max-h-96 flex-col gap-2 overflow-y-auto border-t border-zinc-100 p-3">
                        {chat.path && <li className="text-xs text-zinc-500">Started on {chat.path}</li>}
                        {chat.messages.map((m, i) => (
                          <li key={i} className={cn("max-w-[92%] rounded-xl px-3 py-2 text-sm", m.role === "user" ? "self-end bg-brand-600 text-white" : "self-start bg-zinc-100 text-zinc-800")}>
                            {m.role === "user" ? <p className="break-words whitespace-pre-wrap">{m.content}</p> : <Markdown untrusted className="prose-sm">{m.content}</Markdown>}
                          </li>
                        ))}
                      </ol>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Attribution & web activity" icon={MousePointerClick}>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              <dt className="text-zinc-500">First seen</dt>
              <dd className="text-zinc-900">{firstSeen ? formatDateTime(firstSeen, tz) : "—"}</dd>
              <dt className="text-zinc-500">Signup path</dt>
              <dd className="text-zinc-900">{sourceLabel(ct.source)}</dd>
              {utmEntries.length === 0 ? (
                <>
                  <dt className="text-zinc-500">Campaign</dt>
                  <dd className="text-zinc-900">Direct / no UTM tags</dd>
                </>
              ) : (
                utmEntries.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-zinc-500">UTM {k}</dt>
                    <dd className="break-words text-zinc-900">{String(v)}</dd>
                  </div>
                ))
              )}
              <dt className="text-zinc-500">Referrer</dt>
              <dd className="break-all text-zinc-900">{ct.referrer || "—"}</dd>
              <dt className="text-zinc-500">Landing page</dt>
              <dd className="break-all text-zinc-900">{ct.landingPage || "—"}</dd>
              <dt className="text-zinc-500">Page views</dt>
              <dd className="text-zinc-900 tabular-nums">
                {data.eventSummary?.pageViews ?? 0}
                {data.eventSummary && data.eventSummary.pages > 0 && <span className="text-zinc-500"> · {data.eventSummary.pages} unique pages</span>}
              </dd>
              <dt className="text-zinc-500">Last seen</dt>
              <dd className="text-zinc-900">{data.eventSummary?.lastSeen ? timeAgo(data.eventSummary.lastSeen, now) : "—"}</dd>
            </dl>
            {data.recentEvents.length > 0 && (
              <div className="mt-4 border-t border-zinc-100 pt-3">
                <p className="mb-2 text-xs font-medium text-zinc-500">Recent site events</p>
                <ol className="flex flex-col gap-1.5 text-xs">
                  {data.recentEvents.map((ev) => (
                    <li key={ev.id} className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate">
                        <span className="font-medium text-zinc-800">{titleCase(ev.name)}</span>
                        {ev.path && <span className="text-zinc-500"> · {ev.path}</span>}
                      </span>
                      <time dateTime={ev.createdAt.toISOString()} className="shrink-0 text-zinc-400">
                        {timeAgo(ev.createdAt, now)}
                      </time>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Section>

          <Card>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-2 p-5 text-base font-semibold text-zinc-900 sm:p-6">
                Edit profile
                <span className="text-sm font-medium text-brand-700 group-open:hidden">Edit</span>
              </summary>
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <ContactProfileForm
                  contactId={ct.id}
                  defaults={{ name: ct.name, email: ct.email, phone: ct.phone, company: ct.company, website: ct.website, segment: ct.segment }}
                />
              </div>
            </details>
          </Card>

          <div className="flex justify-end">
            <DeleteContact contactId={ct.id} label={name} />
          </div>
        </div>
      </div>
    </div>
  );
}
