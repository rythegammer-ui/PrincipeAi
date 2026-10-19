"use client";

import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useMemo, useState, type FormEvent } from "react";
import { saveAvailabilityAction, type SchedulingFormState } from "@/app/admin/(panel)/scheduling/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/form";
import type { WeeklyRule } from "@/lib/scheduling";
import { cn } from "@/lib/utils";

type Range = { start: string; end: string };
type Week = Record<number, Range[]>;

const DAYS = [
  [1, "Monday"],
  [2, "Tuesday"],
  [3, "Wednesday"],
  [4, "Thursday"],
  [5, "Friday"],
  [6, "Saturday"],
  [7, "Sunday"],
] as const;

const pad = (n: number) => String(n).padStart(2, "0");
const toTime = (m: number) => (m >= 1440 ? "00:00" : `${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
/** "HH:MM" → minutes. An end of "00:00" means midnight (end of day). */
function toMinutes(value: string, isEnd: boolean): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const mins = Number(m[1]) * 60 + Number(m[2]);
  return isEnd && mins === 0 ? 1440 : mins;
}

function fromRules(rules: WeeklyRule[]): Week {
  const week: Week = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  for (const r of [...rules].sort((a, b) => a.startMinute - b.startMinute)) {
    week[r.weekday]?.push({ start: toTime(r.startMinute), end: toTime(r.endMinute) });
  }
  return week;
}

function validateDay(ranges: Range[]): string | null {
  const parsed = ranges.map((r) => ({ s: toMinutes(r.start, false), e: toMinutes(r.end, true) }));
  if (parsed.some((p) => p.s === null || p.e === null)) return "Enter a start and end time.";
  if (parsed.some((p) => (p.e as number) <= (p.s as number))) return "End time must be after start time.";
  const sorted = [...parsed].sort((a, b) => (a.s as number) - (b.s as number));
  for (let i = 1; i < sorted.length; i++) if ((sorted[i].s as number) < (sorted[i - 1].e as number)) return "Time ranges overlap.";
  return null;
}

/** Weekly hours editor: multiple time ranges per weekday, validated client- and server-side. */
export function AvailabilityEditor({ initialRules, timezone }: { initialRules: WeeklyRule[]; timezone: string }) {
  const [week, setWeek] = useState<Week>(() => fromRules(initialRules));
  const [saved, setSaved] = useState(() => JSON.stringify(fromRules(initialRules)));
  const [state, dispatch, pending] = useActionState<SchedulingFormState, FormData>(async (prev, fd) => {
    const result = await saveAvailabilityAction(prev, fd);
    if (!result.error) setSaved(fd.get("snapshot") as string);
    return result;
  }, {});

  const errors = useMemo(() => Object.fromEntries(DAYS.map(([d]) => [d, validateDay(week[d])])) as Record<number, string | null>, [week]);
  const hasErrors = Object.values(errors).some(Boolean);
  const snapshot = JSON.stringify(week);
  const dirty = snapshot !== saved;
  const rules = DAYS.flatMap(([d]) =>
    week[d].map((r) => ({ weekday: d, startMinute: toMinutes(r.start, false) ?? 0, endMinute: toMinutes(r.end, true) ?? 0 })),
  );

  const update = (day: number, fn: (ranges: Range[]) => Range[]) => setWeek((w) => ({ ...w, [day]: fn(w[day]) }));

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (hasErrors) return;
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="rules" value={JSON.stringify(rules)} />
      <input type="hidden" name="snapshot" value={snapshot} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          Times are in <span className="font-medium text-zinc-700">{timezone.replace(/_/g, " ")}</span>. Use 00:00 as an end time for midnight.
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setWeek((w) => ({ ...w, 2: [...w[1]], 3: [...w[1]], 4: [...w[1]], 5: [...w[1]] }))}
          disabled={!week[1].length}
        >
          <Copy aria-hidden /> Copy Monday to weekdays
        </Button>
      </div>
      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
        {DAYS.map(([day, name]) => {
          const ranges = week[day];
          const on = ranges.length > 0;
          return (
            <li key={day} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:gap-4 sm:p-4">
              <label className="flex min-h-10 items-center gap-2.5 sm:w-32">
                <Checkbox
                  checked={on}
                  onChange={(e) => update(day, () => (e.target.checked ? [{ start: "09:00", end: "17:00" }] : []))}
                  aria-label={`Available on ${name}`}
                />
                <span className={cn("text-sm font-medium", on ? "text-zinc-900" : "text-zinc-500")}>{name}</span>
              </label>
              <div className="flex flex-1 flex-col gap-2">
                {!on && <p className="flex min-h-10 items-center text-sm text-zinc-500">Unavailable</p>}
                {ranges.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <Input
                      type="time"
                      step={900}
                      value={r.start}
                      onChange={(e) => update(day, (rs) => rs.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                      aria-label={`${name} range ${i + 1} start`}
                      className="h-10 w-36"
                      required
                    />
                    <span className="text-zinc-400" aria-hidden>
                      –
                    </span>
                    <Input
                      type="time"
                      step={900}
                      value={r.end}
                      onChange={(e) => update(day, (rs) => rs.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                      aria-label={`${name} range ${i + 1} end`}
                      className="h-10 w-36"
                      required
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10"
                      onClick={() => update(day, (rs) => rs.filter((_, j) => j !== i))}
                      aria-label={`Remove ${name} ${r.start} to ${r.end}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                {errors[day] && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {errors[day]}
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 self-start text-brand-700 hover:bg-brand-50 hover:text-brand-800"
                  onClick={() => {
                    // New range starts an hour after the last one ends (default 9:00), lasting one hour.
                    const last = ranges.at(-1);
                    const lastEnd = last ? (toMinutes(last.end, true) ?? 1020) : null;
                    const s = lastEnd === null ? 540 : Math.min(lastEnd + 60, 1380);
                    update(day, (rs) => [...rs, { start: toTime(s), end: toTime(Math.min(s + 60, 1440)) }]);
                  }}
                  aria-label={`Add hours on ${name}`}
                >
                  <Plus aria-hidden /> Add hours
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {state.error && (
        <Alert tone="error" className="mt-4">
          {state.error}
        </Alert>
      )}
      {state.message && !dirty && (
        <Alert tone="success" className="mt-4">
          {state.message}
        </Alert>
      )}
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={pending || hasErrors || !dirty}>
          {pending && <Loader2 className="animate-spin" aria-hidden />} Save weekly hours
        </Button>
        {dirty && !pending && <span className="text-xs font-medium text-amber-700">Unsaved changes</span>}
      </div>
    </form>
  );
}
