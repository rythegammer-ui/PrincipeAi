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

const ROW = "grid grid-cols-[auto_1fr] gap-x-3";
const TERM = "flex pt-0.5";
const ICON = "size-4 shrink-0 text-brand-600";

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
        {/* dl > div > dt + dd: each row's <dt> holds the icon and a screen-reader term; its <dd>s sit in the second column. */}
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div className={ROW}>
            <dt className={TERM}>
              <CalendarDays className={ICON} aria-hidden />
              <span className="sr-only">Date</span>
            </dt>
            <dd className="col-start-2 font-medium text-zinc-900">{when.dateLabel}</dd>
            <dd className="col-start-2 text-zinc-600">{when.timeLabel}</dd>
          </div>
          <div className={ROW}>
            <dt className={TERM}>
              <Globe className={ICON} aria-hidden />
              <span className="sr-only">Timezone</span>
            </dt>
            <dd className="col-start-2 font-medium text-zinc-900">{when.zoneLong}</dd>
            <dd className="col-start-2 text-zinc-600">{timezone.replace(/_/g, " ")}</dd>
          </div>
          <div className={ROW}>
            <dt className={TERM}>
              <Clock className={ICON} aria-hidden />
              <span className="sr-only">Length</span>
            </dt>
            <dd className="col-start-2 text-zinc-700">{formatDuration(meetingType.durationMin)}</dd>
          </div>
          <div className={ROW}>
            <dt className={TERM}>
              {meetingUrl ? <Video className={ICON} aria-hidden /> : <MapPin className={ICON} aria-hidden />}
              <span className="sr-only">Location</span>
            </dt>
            <dd className="col-start-2 min-w-0 text-zinc-700">{meetingType.locationLabel}</dd>
            {showJoin &&
              (meetingUrl ? (
                <dd className="col-start-2 min-w-0">
                  <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="font-medium break-all text-brand-700 underline-offset-2 hover:underline">
                    Join the video call
                  </a>
                </dd>
              ) : (
                <dd className="col-start-2 text-zinc-500">We&apos;ll email your meeting link before the call.</dd>
              ))}
          </div>
        </dl>
      </div>
    </div>
  );
}
