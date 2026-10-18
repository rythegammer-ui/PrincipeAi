import { cn } from "@/lib/utils";

/** Lead score 0–100 as a number + meter (violet fill on a lighter violet track). */
export function ScoreMeter({ score, className, barClassName }: { score: number; className?: string; barClassName?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="w-6 text-right text-sm font-medium text-zinc-900 tabular-nums">{v}</span>
      <span
        role="meter"
        aria-label={`Lead score ${v} out of 100`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        className={cn("block h-1.5 w-16 overflow-hidden rounded-full bg-brand-100", barClassName)}
      >
        <span className="block h-full rounded-full bg-brand-600" style={{ width: `${v}%` }} />
      </span>
    </span>
  );
}
