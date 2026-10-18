import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkline } from "@/components/analytics/charts";
import { cn } from "@/lib/utils";

export type KpiDelta = {
  current: number | null;
  previous: number | null;
  /** pct: relative change · points: change of a 0–1 rate in percentage points · abs: raw difference */
  mode?: "pct" | "points" | "abs";
  upIsGood?: boolean;
};

function describeDelta({ current, previous, mode = "pct", upIsGood = true }: KpiDelta): { text: string; dir: "up" | "down" | "flat"; good: boolean | null } | null {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  if (mode === "pct") {
    if (previous === 0) return current === 0 ? { text: "No change", dir: "flat", good: null } : { text: "New", dir: "up", good: upIsGood };
    const pct = (diff / Math.abs(previous)) * 100;
    if (Math.abs(pct) < 0.5) return { text: "No change", dir: "flat", good: null };
    const dir = pct > 0 ? "up" : "down";
    return { text: `${pct > 0 ? "+" : "−"}${Math.abs(pct) >= 10 ? Math.round(Math.abs(pct)) : Math.abs(pct).toFixed(1)}%`, dir, good: dir === "up" ? upIsGood : !upIsGood };
  }
  if (mode === "points") {
    const pts = diff * 100;
    if (Math.abs(pts) < 0.05) return { text: "No change", dir: "flat", good: null };
    const dir = pts > 0 ? "up" : "down";
    return { text: `${pts > 0 ? "+" : "−"}${Math.abs(pts).toFixed(1)} pts`, dir, good: dir === "up" ? upIsGood : !upIsGood };
  }
  if (Math.abs(diff) < 0.05) return { text: "No change", dir: "flat", good: null };
  const dir = diff > 0 ? "up" : "down";
  const abs = Math.abs(diff);
  return { text: `${diff > 0 ? "+" : "−"}${Number.isInteger(abs) ? abs : abs.toFixed(1)}`, dir, good: dir === "up" ? upIsGood : !upIsGood };
}

/**
 * KPI stat tile: label · value · signed delta vs the previous period (icon + text, never colour alone)
 * · optional sparkline of the current period.
 */
export function KpiTile({
  label,
  value,
  icon: Icon,
  delta,
  comparison,
  hint,
  spark,
  href,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  delta?: KpiDelta;
  /** e.g. "vs prior 30 days" */
  comparison?: string;
  hint?: ReactNode;
  spark?: number[];
  href?: string;
}) {
  const d = delta ? describeDelta(delta) : null;
  const DeltaIcon = d?.dir === "up" ? ArrowUpRight : d?.dir === "down" ? ArrowDownRight : Minus;
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        {Icon && <Icon className="size-4 text-zinc-400" aria-hidden />}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
      <div className="mt-1 flex min-h-5 flex-wrap items-center gap-x-1.5 text-xs text-zinc-500">
        {d && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              d.good === null ? "text-zinc-600" : d.good ? "text-emerald-700" : "text-red-700",
            )}
          >
            <DeltaIcon className="size-3.5" aria-hidden />
            <span className="sr-only">{d.dir === "up" ? "Up" : d.dir === "down" ? "Down" : ""}</span>
            {d.text}
          </span>
        )}
        {d && comparison && <span>{comparison}</span>}
        {hint && <span>{hint}</span>}
      </div>
      {spark && spark.length > 1 && <Sparkline values={spark} className="mt-3" />}
    </>
  );
  const cls = "flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft";
  return href ? (
    <Link href={href} className={cn(cls, "transition-shadow hover:shadow-lift focus-visible:outline-2 focus-visible:outline-brand-500")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
