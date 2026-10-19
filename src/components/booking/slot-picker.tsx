"use client";

import { CalendarX2, ChevronLeft, ChevronRight, Globe, Loader2, RotateCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  addDays,
  addMonths,
  addMonthsToKey,
  daysInMonth,
  formatDateKey,
  formatMonthKey,
  formatTime,
  groupByDate,
  monthWeeks,
  timezoneGroups,
  weekdayOf,
} from "./time";

type MonthData = { slots: string[]; error: string | null; version: string };

export type SlotPickerProps = {
  meetingTypeSlug: string;
  /** Timezone the times are displayed in. */
  timezone: string;
  onTimezoneChange: (tz: string) => void;
  /** Whether the browser timezone has been detected (enables the full timezone list). */
  timezoneReady: boolean;
  /** Month shown first ("YYYY-MM"). */
  initialMonth: string;
  minMonth: string;
  maxMonth: string;
  selectedSlot: string | null;
  onSelectSlot: (iso: string) => void;
  /** Manage token when rescheduling (the booking's own time is treated as free). */
  rescheduleToken?: string;
  /** The booking's current start, shown as "current" and not selectable. */
  currentSlot?: string | null;
  /** Bump to force a refetch (e.g. after a slot was taken). */
  reloadSignal?: number;
};

const WEEKDAYS = [
  ["Sun", "Sunday"],
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
] as const;

export function SlotPicker({
  meetingTypeSlug,
  timezone,
  onTimezoneChange,
  timezoneReady,
  initialMonth,
  minMonth,
  maxMonth,
  selectedSlot,
  onSelectSlot,
  rescheduleToken,
  currentSlot,
  reloadSignal = 0,
}: SlotPickerProps) {
  const [month, setMonth] = useState(initialMonth);
  const [store, setStore] = useState<Record<string, MonthData>>({});
  const [retry, setRetry] = useState(0);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const focusAfterRender = useRef<string | null>(null);
  const version = `${reloadSignal}:${retry}`;

  // Load slots for the visible month (padded by 2 days so any visitor timezone is covered).
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      type: meetingTypeSlug,
      from: addDays(`${month}-01`, -2),
      to: addDays(`${month}-${String(daysInMonth(month)).padStart(2, "0")}`, 2),
    });
    if (rescheduleToken) params.set("reschedule", rescheduleToken);
    fetch(`/api/slots?${params.toString()}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { slots?: string[]; error?: string };
        if (!res.ok || !Array.isArray(body.slots)) throw new Error(body.error || "We couldn't load available times.");
        setStore((s) => ({ ...s, [month]: { slots: body.slots ?? [], error: null, version } }));
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "We couldn't load available times.";
        setStore((s) => ({ ...s, [month]: { slots: s[month]?.slots ?? [], error: message, version } }));
      });
    return () => controller.abort();
  }, [meetingTypeSlug, month, rescheduleToken, version]);

  const entry = store[month];
  const loading = !entry || entry.version !== version;
  const byDate = useMemo(() => groupByDate(entry?.slots ?? [], timezone), [entry, timezone]);
  const weeks = useMemo(() => monthWeeks(month), [month]);
  const firstAvailable = useMemo(() => [...byDate.keys()].filter((k) => k.startsWith(month)).sort()[0] ?? null, [byDate, month]);
  const selectedDate = pickedDate && pickedDate.startsWith(month) && byDate.has(pickedDate) ? pickedDate : firstAvailable;
  const focusKey = activeKey?.startsWith(month) ? activeKey : (selectedDate ?? `${month}-01`);
  const daySlots = selectedDate ? (byDate.get(selectedDate) ?? []) : [];
  const zoneGroups = useMemo(() => (timezoneReady ? timezoneGroups([timezone]) : []), [timezoneReady, timezone]);

  // Move keyboard focus to the requested day after the grid re-renders (e.g. after changing month).
  useEffect(() => {
    const key = focusAfterRender.current;
    if (!key) return;
    focusAfterRender.current = null;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${key}"]`)?.focus();
  }, [focusKey, month]);

  function goToMonth(next: string) {
    if (next < minMonth || next > maxMonth) return;
    setMonth(next);
    setActiveKey(null);
  }

  function selectDate(key: string) {
    if (!byDate.has(key)) return;
    setPickedDate(key);
    setActiveKey(key);
    // On small screens the time list sits below the calendar; bring it into view.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => timesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  function onDayKeyDown(e: KeyboardEvent<HTMLButtonElement>, key: string) {
    let next: string;
    switch (e.key) {
      case "ArrowLeft":
        next = addDays(key, -1);
        break;
      case "ArrowRight":
        next = addDays(key, 1);
        break;
      case "ArrowUp":
        next = addDays(key, -7);
        break;
      case "ArrowDown":
        next = addDays(key, 7);
        break;
      case "Home":
        next = addDays(key, -weekdayOf(key));
        break;
      case "End":
        next = addDays(key, 6 - weekdayOf(key));
        break;
      case "PageUp":
        next = addMonthsToKey(key, -1);
        break;
      case "PageDown":
        next = addMonthsToKey(key, 1);
        break;
      default:
        return;
    }
    e.preventDefault();
    const nextMonth = next.slice(0, 7);
    if (nextMonth < minMonth || nextMonth > maxMonth) return;
    if (nextMonth !== month) setMonth(nextMonth);
    setActiveKey(next);
    focusAfterRender.current = next;
  }

  const monthLabel = formatMonthKey(month);
  const monthHasSlots = firstAvailable !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] xl:grid-cols-[minmax(0,1fr)_17rem]">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 id="booking-month-label" className="text-base font-semibold text-zinc-900" aria-live="polite">
            {monthLabel}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-11 sm:size-9"
              onClick={() => goToMonth(addMonths(month, -1))}
              disabled={month <= minMonth}
              aria-label="Previous month"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 sm:size-9"
              onClick={() => goToMonth(addMonths(month, 1))}
              disabled={month >= maxMonth}
              aria-label="Next month"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div ref={gridRef} role="grid" aria-labelledby="booking-month-label" aria-busy={loading} className="relative">
          <div role="row" className="grid grid-cols-7 pb-1">
            {WEEKDAYS.map(([short, long]) => (
              <div key={short} role="columnheader" aria-label={long} className="py-1 text-center text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                {short}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div role="row" key={wi} className="grid grid-cols-7 gap-0.5 py-0.5 sm:gap-1">
              {week.map((key, di) => {
                if (!key) return <div role="gridcell" key={`pad-${di}`} aria-hidden />;
                const count = byDate.get(key)?.length ?? 0;
                const available = count > 0;
                const selected = key === selectedDate;
                const day = Number(key.slice(8));
                return (
                  <div role="gridcell" key={key} aria-selected={selected} className="flex justify-center">
                    <button
                      type="button"
                      data-day={key}
                      tabIndex={key === focusKey ? 0 : -1}
                      aria-disabled={!available}
                      aria-label={`${formatDateKey(key)}${available ? `, ${count} ${count === 1 ? "time" : "times"} available` : ", no times available"}`}
                      onClick={() => selectDate(key)}
                      onKeyDown={(e) => onDayKeyDown(e, key)}
                      onFocus={() => setActiveKey(key)}
                      className={cn(
                        // 44px tall on phones (cells are narrower than 44px at 360px); square from sm up.
                        "relative flex h-11 w-full max-w-12 items-center justify-center rounded-xl text-sm tabular-nums transition-colors sm:aspect-square sm:h-auto",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                        selected
                          ? "bg-brand-600 font-semibold text-white shadow-sm shadow-brand-900/20"
                          : available
                            ? "bg-brand-50 font-semibold text-brand-700 hover:bg-brand-100"
                            : "cursor-default text-zinc-300",
                      )}
                    >
                      {day}
                      {available && !selected && <span aria-hidden className="absolute bottom-1.5 size-1 rounded-full bg-brand-500" />}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
          {loading && !entry && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
              <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden />
              <span className="sr-only">Loading available times…</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <label htmlFor="booking-timezone" className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
            <Globe className="size-3.5" aria-hidden /> Times shown in
          </label>
          <Select id="booking-timezone" value={timezone} onChange={(e) => onTimezoneChange(e.target.value)} className="h-10 text-sm">
            {timezoneReady ? (
              zoneGroups.map((g) => (
                <optgroup key={g.region} label={g.region}>
                  {g.zones.map((z) => (
                    <option key={z.value} value={z.value}>
                      {z.label}
                    </option>
                  ))}
                </optgroup>
              ))
            ) : (
              <option value={timezone}>{timezone.replace(/_/g, " ")}</option>
            )}
          </Select>
        </div>
      </div>

      <div ref={timesRef} className="scroll-mt-24 lg:border-l lg:border-zinc-100 lg:pl-6">
        {entry?.error && !loading ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p>{entry.error}</p>
            <Button size="sm" variant="outline" onClick={() => setRetry((n) => n + 1)}>
              <RotateCw /> Try again
            </Button>
          </div>
        ) : loading && !entry ? (
          <div className="space-y-2" aria-hidden>
            <div className="h-5 w-40 animate-pulse rounded bg-zinc-100" />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        ) : !monthHasSlots ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-5 text-sm text-zinc-600">
            <CalendarX2 className="size-5 text-zinc-400" aria-hidden />
            <p>
              No open times left in <span className="font-medium text-zinc-900">{monthLabel}</span>.
            </p>
            {month < maxMonth && (
              <Button size="sm" variant="secondary" onClick={() => goToMonth(addMonths(month, 1))}>
                Check {formatMonthKey(addMonths(month, 1)).split(" ")[0]} <ChevronRight />
              </Button>
            )}
          </div>
        ) : (
          selectedDate && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">{formatDateKey(selectedDate)}</h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                {daySlots.length} {daySlots.length === 1 ? "time" : "times"} available
              </p>
              <ul className="mt-3 grid max-h-[26rem] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-1" aria-label={`Available times on ${formatDateKey(selectedDate)}`}>
                {daySlots.map((iso) => {
                  const isCurrent = currentSlot != null && Date.parse(currentSlot) === Date.parse(iso);
                  const isSelected = selectedSlot != null && Date.parse(selectedSlot) === Date.parse(iso);
                  return (
                    <li key={iso}>
                      <button
                        type="button"
                        disabled={isCurrent}
                        aria-pressed={isSelected}
                        onClick={() => onSelectSlot(iso)}
                        className={cn(
                          "flex h-11 w-full items-center justify-center rounded-xl border text-sm font-semibold tabular-nums transition-all",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                          isSelected
                            ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                            : isCurrent
                              ? "cursor-not-allowed border-dashed border-zinc-300 bg-zinc-50 text-zinc-400"
                              : "border-brand-200 bg-white text-brand-700 hover:border-brand-500 hover:bg-brand-50",
                        )}
                      >
                        {formatTime(iso, timezone)}
                        {isCurrent && <span className="ml-1.5 text-[11px] font-medium">(current)</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        )}
      </div>
    </div>
  );
}
