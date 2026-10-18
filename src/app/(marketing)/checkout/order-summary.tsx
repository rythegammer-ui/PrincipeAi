import { CalendarClock } from "lucide-react";
import { CourseCover } from "@/components/courses/course-cover";
import type { OrderDetails } from "@/lib/payments";
import { formatDateTime, formatMoney } from "@/lib/utils";

/** Line-item summary shared by the test checkout and success pages. */
export function OrderSummary({ details, showBuyer = true }: { details: OrderDetails; showBuyer?: boolean }) {
  const { order, course, booking } = details;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-start gap-4 p-5">
        {course ? (
          <CourseCover emoji={course.coverEmoji} audience={course.audience} size="sm" className="size-14 shrink-0 rounded-xl" />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <CalendarClock className="size-6" aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{order.itemType === "course" ? "Online course" : "Coaching session"}</p>
          <p className="mt-0.5 font-semibold text-zinc-900">{course?.title ?? booking?.meetingTypeName ?? order.description}</p>
          {booking && (
            <p className="mt-1 text-sm text-zinc-600">
              {formatDateTime(booking.startAt, booking.timezone)} · {booking.durationMin} min
              <span className="block text-xs text-zinc-500">Times shown in {booking.timezone.replace(/_/g, " ")}</span>
            </p>
          )}
        </div>
      </div>
      <dl className="divide-y divide-zinc-100 border-t border-zinc-100 text-sm">
        {showBuyer && (
          <div className="flex justify-between gap-4 px-5 py-3">
            <dt className="shrink-0 text-zinc-500">Billed to</dt>
            <dd className="min-w-0 truncate text-right text-zinc-800">{order.name ? `${order.name} · ${order.email}` : order.email}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 px-5 py-3">
          <dt className="font-medium text-zinc-900">Total</dt>
          <dd className="font-semibold text-zinc-900 tabular-nums">{formatMoney(order.amountCents, order.currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
