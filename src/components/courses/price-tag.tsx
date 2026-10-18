import { cn, formatMoney } from "@/lib/utils";
import { savingsPercent } from "./course-utils";

/** Price with an optional struck-through compare-at price and saving badge. */
export function PriceTag({
  priceCents,
  compareAtCents,
  size = "md",
  tone = "light",
  showSavings = false,
  className,
}: {
  priceCents: number;
  compareAtCents?: number | null;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  showSavings?: boolean;
  className?: string;
}) {
  const saving = savingsPercent(priceCents, compareAtCents);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span
        className={cn(
          "font-semibold tracking-tight tabular-nums",
          tone === "dark" ? "text-white" : "text-zinc-900",
          size === "sm" && "text-lg",
          size === "md" && "text-2xl",
          size === "lg" && "text-4xl",
        )}
      >
        {priceCents > 0 ? formatMoney(priceCents) : "Free"}
      </span>
      {saving !== null && compareAtCents ? (
        <>
          <span className={cn("tabular-nums line-through", tone === "dark" ? "text-zinc-400" : "text-zinc-400", size === "lg" ? "text-lg" : "text-sm")}>
            <span className="sr-only">Regular price </span>
            {formatMoney(compareAtCents)}
          </span>
          {showSavings && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                tone === "dark" ? "bg-gold-400/15 text-gold-300" : "bg-gold-50 text-gold-700 ring-1 ring-gold-200 ring-inset",
              )}
            >
              Save {saving}%
            </span>
          )}
        </>
      ) : null}
    </div>
  );
}
