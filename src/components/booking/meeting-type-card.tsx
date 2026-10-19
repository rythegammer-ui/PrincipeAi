import { ArrowRight, Clock, Video } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { MeetingType } from "@/db/schema";
import { formatDuration } from "@/lib/scheduling";
import { cn, formatMoney } from "@/lib/utils";
import { meetingColor } from "./meeting-colors";

type Props = { meetingType: Pick<MeetingType, "slug" | "name" | "description" | "durationMin" | "priceCents" | "locationLabel" | "color">; className?: string };

/**
 * Card on /book. The whole card is one link (the title is the accessible name). The focus ring sits
 * on the card itself: an outline on the stretched link would be clipped by overflow-hidden.
 */
export function MeetingTypeCard({ meetingType: mt, className }: Props) {
  const color = meetingColor(mt.color);
  const free = mt.priceCents === 0;
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-within:shadow-lift focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2",
        className,
      )}
    >
      <div className={cn("h-1.5 bg-gradient-to-r", color.bar)} aria-hidden />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg leading-snug font-semibold tracking-tight text-zinc-900">
            <Link href={`/book/${mt.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl">
              {mt.name}
            </Link>
          </h2>
          <Badge tone={free ? "green" : "gold"} className="shrink-0 text-[13px]">
            {free ? "Free" : formatMoney(mt.priceCents)}
          </Badge>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-zinc-600">
          <li className="flex items-center gap-1.5">
            <Clock className="size-4 text-zinc-400" aria-hidden /> {formatDuration(mt.durationMin)}
          </li>
          <li className="flex items-center gap-1.5">
            <Video className="size-4 text-zinc-400" aria-hidden /> {mt.locationLabel}
          </li>
        </ul>
        {mt.description && <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-600">{mt.description}</p>}
        <p className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700" aria-hidden>
          Choose a time <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </article>
  );
}
