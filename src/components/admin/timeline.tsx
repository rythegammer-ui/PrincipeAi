import Link from "next/link";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { ActivityIcon } from "./activity-icon";
import { activityDetails, displayName } from "./crm-utils";

export type TimelineItem = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: Date;
  contact?: { id: string; name: string | null; email: string } | null;
};

const LONG_BODY = 320;

/** Vertical activity timeline (newest first). Bodies are plain text — never HTML. */
export function ActivityTimeline({ items, tz, now = new Date(), compact = false }: { items: TimelineItem[]; tz: string; now?: Date; compact?: boolean }) {
  return (
    <ol className="relative flex flex-col">
      {items.map((item, i) => {
        const details = compact ? [] : activityDetails(item.type, item.meta, tz);
        const body = compact ? null : item.body?.trim();
        return (
          <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < items.length - 1 && <span aria-hidden className="absolute top-9 bottom-1 left-4 w-px bg-zinc-200" />}
            <ActivityIcon type={item.type} />
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                <p className="text-sm font-medium break-words text-zinc-900">
                  {item.contact && (
                    <>
                      <Link href={`/admin/contacts/${item.contact.id}`} className="text-brand-700 hover:underline">
                        {displayName(item.contact)}
                      </Link>
                      <span className="text-zinc-400"> · </span>
                    </>
                  )}
                  {item.title}
                </p>
                <time dateTime={item.createdAt.toISOString()} title={formatDateTime(item.createdAt, tz)} className="shrink-0 text-xs text-zinc-500">
                  {timeAgo(item.createdAt, now)}
                </time>
              </div>
              {details.length > 0 && (
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                  {details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
              {body &&
                (body.length > LONG_BODY ? (
                  <details className="group mt-1.5 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    <summary className="cursor-pointer list-none text-zinc-700 [&::-webkit-details-marker]:hidden">
                      <span className="whitespace-pre-wrap group-open:hidden">{body.slice(0, LONG_BODY)}…</span>
                      <span className="mt-1 block text-xs font-medium text-brand-700 group-open:hidden">Show more</span>
                      <span className="hidden text-xs font-medium text-brand-700 group-open:inline">Show less</span>
                    </summary>
                    <p className="mt-1 break-words whitespace-pre-wrap">{body}</p>
                  </details>
                ) : (
                  <p className="mt-1.5 rounded-xl bg-zinc-50 px-3 py-2 text-sm break-words whitespace-pre-wrap text-zinc-700">{body}</p>
                ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
