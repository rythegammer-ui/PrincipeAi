import { TIERS, type TierId } from "@/lib/assessment";
import { cn } from "@/lib/utils";

/** Four-segment readiness scale with the visitor's tier highlighted (for dark backgrounds). */
export function TierScale({ current, className }: { current: TierId; className?: string }) {
  return (
    <ol className={cn("grid grid-cols-4 gap-1.5", className)} aria-label="AI readiness tiers">
      {TIERS.map((tier) => {
        const active = tier.id === current;
        return (
          <li key={tier.id} aria-current={active ? "step" : undefined} className="min-w-0">
            <span className={cn("block h-1.5 rounded-full", active ? "bg-gradient-to-r from-brand-400 to-gold-300" : "bg-white/15")} aria-hidden />
            <span className={cn("mt-2 block truncate text-[11px] font-semibold sm:text-xs", active ? "text-white" : "text-zinc-500")}>{tier.label}</span>
            <span className={cn("block text-[11px] tabular-nums", active ? "text-gold-300" : "text-zinc-600")}>
              {tier.min}–{tier.max}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
