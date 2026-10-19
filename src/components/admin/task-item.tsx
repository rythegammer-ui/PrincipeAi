"use client";

import { Bot, Check, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { deleteTaskAction, setTaskDoneAction } from "@/app/admin/(panel)/tasks/actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { titleCase, type TaskBucket, type TaskItemData } from "./crm-utils";

export type { TaskBucket, TaskItemData } from "./crm-utils";

const PRIORITY = {
  high: { label: "High", tone: "red" },
  normal: { label: "Normal", tone: "neutral" },
  low: { label: "Low", tone: "blue" },
} as const;

function formatDue(iso: string, tz: string, bucket: TaskBucket): string {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(d);
  if (bucket === "today") return `Today, ${time}`;
  const sameYear = d.getUTCFullYear() === new Date().getUTCFullYear();
  const date = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }), timeZone: tz }).format(d);
  return `${date}, ${time}`;
}

/** One task row: complete / reopen (optimistic), contact link, due date, priority + origin badges, delete. */
export function TaskItem({ task, tz, bucket, showContact = true }: { task: TaskItemData; tz: string; bucket: TaskBucket; showContact?: boolean }) {
  const [done, setDone] = useOptimistic(Boolean(task.completedAt));
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      setDone(!done);
      const res = await setTaskDoneAction(task.id, !done);
      if (!res.ok) setError(res.error);
    });
  };
  const remove = () => {
    if (!confirming) return setConfirming(true);
    startDelete(async () => {
      const res = await deleteTaskAction(task.id);
      if (!res.ok) setError(res.error);
    });
  };

  const overdue = bucket === "overdue" && !done;
  const automated = task.origin && task.origin !== "manual";

  return (
    <li className={cn("group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-50/70", deleting && "opacity-50")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Reopen “${task.title}”` : `Mark “${task.title}” as done`}
        onClick={toggle}
        disabled={pending}
        className="-m-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-brand-500"
      >
        <span
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-full border-2 transition-colors",
            done ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 bg-white text-transparent hover:border-brand-500",
          )}
        >
          {pending ? <Loader2 className="size-3 animate-spin text-zinc-500" aria-hidden /> : <Check className="size-3" strokeWidth={3} aria-hidden />}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium break-words text-zinc-900", done && "text-zinc-500 line-through")}>{task.title}</p>
        {task.description && <p className={cn("mt-0.5 text-sm break-words whitespace-pre-wrap text-zinc-600", done && "text-zinc-500")}>{task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          {task.dueAt && (
            <span className={cn(overdue && "font-medium text-red-700")}>
              {overdue ? "Overdue · " : ""}
              <time dateTime={task.dueAt}>{formatDue(task.dueAt, tz, bucket)}</time>
            </span>
          )}
          {showContact && task.contactId && (
            <Link href={`/admin/contacts/${task.contactId}`} className="font-medium text-brand-700 hover:underline">
              {task.contactName || task.contactEmail}
            </Link>
          )}
          {task.priority !== "normal" && <Badge tone={PRIORITY[task.priority].tone}>{PRIORITY[task.priority].label} priority</Badge>}
          {automated && (
            <Badge tone="gold" title="Created automatically">
              <Bot aria-hidden /> {titleCase(task.origin)}
            </Badge>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-1 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={deleting}
        aria-label={confirming ? `Confirm delete “${task.title}”` : `Delete “${task.title}”`}
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-500",
          confirming ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
        )}
      >
        <Trash2 className="size-3.5" aria-hidden />
        {confirming ? "Delete?" : <span className="sr-only">Delete</span>}
      </button>
    </li>
  );
}
