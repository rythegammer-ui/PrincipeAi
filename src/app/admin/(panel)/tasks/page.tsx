import { AlertCircle, CalendarClock, CalendarDays, CheckCircle2, Inbox, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { toTaskItem, type TaskBucket } from "@/components/admin/crm-utils";
import { TaskForm } from "@/components/admin/task-form";
import { TaskItem } from "@/components/admin/task-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { contactOptions, getTaskBoard, type TaskRow } from "@/lib/crm-queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tasks" };

function TaskSection({
  title,
  icon: Icon,
  tasks,
  tz,
  bucket,
  empty,
  tone = "default",
  description,
}: {
  title: string;
  icon: LucideIcon;
  tasks: TaskRow[];
  tz: string;
  bucket: TaskBucket;
  empty: string;
  tone?: "default" | "danger";
  description?: string;
}) {
  const headingId = `tasks-${bucket}`;
  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
      <header className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
        <h2 id={headingId} className={cn("flex items-center gap-2 text-sm font-semibold", tone === "danger" && tasks.length ? "text-red-700" : "text-zinc-900")}>
          <Icon className="size-4" aria-hidden />
          {title}
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 tabular-nums">{tasks.length}</span>
        </h2>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </header>
      {tasks.length === 0 ? (
        <p className="px-4 py-5 text-sm text-zinc-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {tasks.map((t) => (
            <TaskItem key={t.id} task={toTaskItem(t)} tz={tz} bucket={bucket} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function TasksPage() {
  const [board, contacts] = await Promise.all([getTaskBoard(), contactOptions()]);
  const { tz } = board;
  const open = board.overdue.length + board.today.length + board.upcoming.length + board.noDate.length;

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={
          open === 0
            ? "Nothing open. Follow-ups you add here (or that automations create) show up on the dashboard and on each contact."
            : `${open} open ${open === 1 ? "task" : "tasks"}${board.overdue.length ? ` · ${board.overdue.length} overdue` : ""}. Automated follow-ups are marked with a robot badge.`
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <TaskSection title="Overdue" icon={AlertCircle} tasks={board.overdue} tz={tz} bucket="overdue" tone="danger" empty="Nothing overdue — nice work." />
          <TaskSection title="Today" icon={CalendarDays} tasks={board.today} tz={tz} bucket="today" empty="Nothing else due today." />
          <TaskSection title="Upcoming" icon={CalendarClock} tasks={board.upcoming} tz={tz} bucket="upcoming" empty="No upcoming tasks with a due date." />
          <TaskSection title="No date" icon={Inbox} tasks={board.noDate} tz={tz} bucket="none" empty="No undated tasks." />
          <TaskSection title="Completed" icon={CheckCircle2} tasks={board.completed} tz={tz} bucket="done" description="Last 20" empty="Completed tasks will appear here." />
        </div>
        <Card id="new-task" className="h-fit scroll-mt-24 lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>New task</CardTitle>
            <CardDescription>Assign it to a contact to see it on their profile and in the pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskForm contacts={contacts} tz={tz} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
