import { CalendarDays, Clock, Globe, MapPin, Video } from "lucide-react";
import type { BookingStatus } from "@/db/schema";
import { describeTime, formatDuration } from "@/lib/scheduling";
import { cn, formatMoney } from "@/lib/utils";
import { BookingStatusBadge } from "./booking-status-badge";
import { meetingColor } from "./meeting-colors";

type Props = {
  meetingType: { name: string; durationMin: number; locationLabel: string; color: string; priceCents: number };
  start: Date;
  end: Date;
  timezone: string;
  meetingUrl?: string | null;
  status?: BookingStatus;
  /** Show the "Join" link (only for confirmed, upcoming meetings). */
  showJoin?: boolean;
  className?: string;
};

/** Server component: the key facts of a booking, shown in the invitee's timezone. */
export function BookingSummary({ meetingType, start, end, timezone, meetingUrl, status, showJoin = true, className }: Props) {
  const when = describeTime(start, end, timezone);
  const color = meetingColor(meetingType.color);
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft", className)}>
      <div className={cn("h-1.5 bg-gradient-to-r", color.bar)} aria-hidden />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">{meetingType.name}</p>
            {meetingType.priceCents > 0 && <p className="mt-0.5 text-sm text-zinc-500">{formatMoney(meetingType.priceCents)} session</p>}
          </div>
          {status && <BookingStatusBadge status={status} />}
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex gap-3">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
            <div>
              <dt className="sr-only">Date</dt>
              <dd className="font-medium text-zinc-900">{when.dateLabel}</dd>
              <dd className="text-zinc-600">{when.timeLabel}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Globe className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
            <div>
              <dt className="sr-only">Timezone</dt>
              <dd className="font-medium text-zinc-900">{when.zoneLong}</dd>
              <dd className="text-zinc-600">{timezone.replace(/_/g, " ")}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
            <div>
              <dt className="sr-only">Length</dt>
              <dd className="text-zinc-700">{formatDuration(meetingType.durationMin)}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            {meetingUrl ? <Video className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden /> : <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />}
            <div className="min-w-0">
              <dt className="sr-only">Location</dt>
              <dd className="text-zinc-700">{meetingType.locationLabel}</dd>
              {showJoin &&
                (meetingUrl ? (
                  <dd>
                    <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="font-medium break-all text-brand-700 underline-offset-2 hover:underline">
                      Join the video call
                    </a>
                  </dd>
                ) : (
                  <dd className="text-zinc-500">We&apos;ll email your meeting link before the call.</dd>
                ))}
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
