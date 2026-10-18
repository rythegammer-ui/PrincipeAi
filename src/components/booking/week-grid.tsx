import { DateTime } from "luxon";
import Link from "next/link";
import type { BookingStatus } from "@/db/schema";
import type { WeeklyRule } from "@/lib/scheduling";
import { cn } from "@/lib/utils";
import { meetingColor } from "./meeting-colors";

const HOUR_PX = 64;

export type WeekGridBooking = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: BookingStatus;
  meetingType: { name: string; color: string };
  contact: { id: string; name: string | null; email: string };
};

type Props = {
  timezone: string;
  /** Monday of the week (business timezone), "YYYY-MM-DD". */
  weekStartKey: string;
  bookings: WeekGridBooking[];
  rules: WeeklyRule[];
  blockedDates: { date: string; reason: string | null }[];
  now: Date;
};

/** 7-day calendar of bookings with weekly availability shaded, in the business timezone. */
export function WeekGrid({ timezone, weekStartKey, bookings, rules, blockedDates, now }: Props) {
  const weekStart = DateTime.fromISO(weekStartKey, { zone: timezone }).startOf("day");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i }));
  const todayKey = DateTime.fromJSDate(now, { zone: timezone }).toISODate();
  const blocked = new Map(blockedDates.map((b) => [b.date, b.reason]));

  const local = (d: Date) => DateTime.fromJSDate(d, { zone: timezone });
  const minuteOfDay = (dt: DateTime) => dt.hour * 60 + dt.minute;

  let minHour = 24;
  let maxHour = 0;
  for (const r of rules) {
    minHour = Math.min(minHour, Math.floor(r.startMinute / 60));
    maxHour = Math.max(maxHour, Math.ceil(r.endMinute / 60));
  }
  for (const b of bookings) {
    const s = local(b.startAt);
    const e = local(b.endAt);
    minHour = Math.min(minHour, s.hour);
    maxHour = Math.max(maxHour, e.hasSame(s, "day") ? Math.ceil(minuteOfDay(e) / 60) : 24);
  }
  if (minHour >= maxHour) {
    minHour = 8;
    maxHour = 18;
  }
  minHour = Math.max(0, minHour - 1);
  maxHour = Math.min(24, maxHour + 1);
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);
  const height = hours.length * HOUR_PX;
  const y = (minutes: number) => ((minutes - minHour * 60) / 60) * HOUR_PX;

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-zinc-200 bg-zinc-50/80">
          <div />
          {days.map((d) => {
            const key = d.toISODate();
            const isToday = key === todayKey;
            return (
              <div key={key} className="border-l border-zinc-200 px-2 py-2 text-center">
                <p className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">{d.toFormat("ccc")}</p>
                <p className={cn("mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-semibold", isToday ? "bg-brand-600 text-white" : "text-zinc-900")}>
                  {d.day}
                </p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <div className="relative" style={{ height }}>
            {hours.map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-zinc-400 tabular-nums" style={{ top: y(h * 60) }}>
                {h === minHour ? "" : DateTime.fromObject({ hour: h % 24 }).toFormat("h a")}
              </span>
            ))}
          </div>
          {days.map((day) => {
            const key = day.toISODate() ?? "";
            const dayBookings = bookings.filter((b) => local(b.startAt).toISODate() === key);
            const isBlocked = blocked.has(key);
            return (
              <div key={key} className="relative border-l border-zinc-200" style={{ height }}>
                {hours.map((h) => (
                  <div key={h} aria-hidden className="absolute inset-x-0 border-t border-zinc-100" style={{ top: y(h * 60) }} />
                ))}
                {!isBlocked &&
                  rules
                    .filter((r) => r.weekday === day.weekday)
                    .map((r, i) => (
                      <div
                        key={i}
                        aria-hidden
                        className="absolute inset-x-0 bg-brand-50/60"
                        style={{ top: y(r.startMinute), height: ((r.endMinute - r.startMinute) / 60) * HOUR_PX }}
                      />
                    ))}
                {isBlocked && (
                  <div className="absolute inset-0 flex items-start justify-center bg-[repeating-linear-gradient(135deg,var(--color-zinc-100)_0,var(--color-zinc-100)_6px,transparent_6px,transparent_12px)] pt-3">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200">
                      Blocked{blocked.get(key) ? `: ${blocked.get(key)}` : ""}
                    </span>
                  </div>
                )}
                {dayBookings.map((b) => {
                  const s = local(b.startAt);
                  const e = local(b.endAt);
                  const top = y(minuteOfDay(s));
                  const endMinute = e.hasSame(s, "day") ? minuteOfDay(e) : 24 * 60;
                  const h = Math.max(22, ((endMinute - minuteOfDay(s)) / 60) * HOUR_PX - 2);
                  const color = meetingColor(b.meetingType.color);
                  return (
                    <Link
                      key={b.id}
                      href={`/admin/contacts/${b.contact.id}`}
                      title={`${s.toFormat("h:mm a")} – ${e.toFormat("h:mm a")} · ${b.contact.name ?? b.contact.email} · ${b.meetingType.name}`}
                      className={cn(
                        "absolute inset-x-1 overflow-hidden rounded-lg border-l-4 bg-white px-2 py-1.5 text-[11px] leading-tight shadow-sm ring-1 ring-zinc-200 transition hover:z-10 hover:ring-brand-400",
                        color.border,
                        b.status === "pending_payment" && "border-dashed bg-amber-50/80",
                        (b.status === "completed" || b.status === "no_show") && "opacity-70",
                      )}
                      style={{ top, height: h }}
                    >
                      {h < 44 ? (
                        <span className="block truncate">
                          <span className="font-semibold text-zinc-900 tabular-nums">{s.toFormat("h:mm")}</span>{" "}
                          <span className="text-zinc-700">{b.contact.name ?? b.contact.email}</span>
                        </span>
                      ) : (
                        <>
                          <span className="block font-semibold text-zinc-900 tabular-nums">{s.toFormat("h:mm a")}</span>
                          <span className="block truncate text-zinc-700">{b.contact.name ?? b.contact.email}</span>
                          <span className="block truncate text-zinc-500">{b.meetingType.name}</span>
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
