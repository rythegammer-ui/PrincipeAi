import { ArrowDown, ExternalLink, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, type FunnelResult } from "@/lib/funnels";
import { cn, pluralize } from "@/lib/utils";

/**
 * Ordinal violet ramp (light → dark) for funnel steps. Validated with the dataviz validator
 * (--ordinal, light surface): monotone lightness, adjacent ΔL ≥ 0.06, light end 2.8:1 on white.
 * The unfilled track is a lighter step of the same ramp (brand-100).
 */
const STEP_RAMP = ["#9b8afb", "#8466f9", "#6938ef", "#5323cc", "#3e1c96"] as const;

function stepColor(index: number, total: number): string {
  if (total <= 1) return STEP_RAMP[2];
  const slot = Math.round((index * (STEP_RAMP.length - 1)) / (total - 1));
  return STEP_RAMP[Math.max(0, Math.min(STEP_RAMP.length - 1, slot))];
}

const fmt = (n: number) => n.toLocaleString("en-US");

/** One funnel: horizontal step bars (width = share of everyone who entered), step conversion between bars. */
export function FunnelCard({ funnel, rangeLabel }: { funnel: FunnelResult; rangeLabel: string }) {
  const { steps, entered, completed, biggestDropIndex } = funnel;
  const headingId = `funnel-${funnel.id}`;
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle id={headingId}>{funnel.name}</CardTitle>
            <CardDescription>{funnel.description}</CardDescription>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tracking-tight text-zinc-900">{formatPercent(funnel.overallRate)}</p>
            <p className="text-xs text-zinc-500">overall conversion</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {entered === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            Nobody entered this funnel in the {rangeLabel}. Share{" "}
            <Link href={funnel.href} target="_blank" className="font-medium text-brand-700 hover:underline">
              {funnel.href}
            </Link>{" "}
            to start filling it.
          </p>
        ) : (
          <ol aria-labelledby={headingId} className="flex flex-col">
            {steps.map((step, i) => {
              const isBiggest = i === biggestDropIndex;
              const width = step.overallRate === null ? 0 : step.overallRate;
              const summary =
                i === 0
                  ? `Step 1, ${step.label}: ${pluralize(step.count, "person", "people")} entered the funnel.`
                  : step.stepRate === null
                    ? `Step ${i + 1}, ${step.label}: nobody yet, because nobody reached the previous step.`
                    : `Step ${i + 1}, ${step.label}: ${pluralize(step.count, "person", "people")}, ${formatPercent(step.stepRate)} of the previous step and ${formatPercent(step.overallRate)} of everyone who entered. ${fmt(step.dropOff)} dropped off before this step${isBiggest ? ", the biggest drop-off in this funnel" : ""}.`;
              return (
                <li key={step.key} className="group relative">
                  <span className="sr-only">{summary}</span>
                  {i > 0 && (
                    <div
                      aria-hidden
                      className={cn(
                        "my-1.5 ml-1 flex flex-wrap items-center gap-x-2 gap-y-1 border-l-2 py-1 pl-3 text-xs",
                        isBiggest ? "border-gold-400 text-zinc-700" : "border-zinc-200 text-zinc-500",
                      )}
                    >
                      <ArrowDown className="size-3 shrink-0 text-zinc-400" />
                      {step.stepRate === null ? (
                        <span>Nobody reached the previous step yet</span>
                      ) : (
                        <>
                          <span>
                            <span className="font-semibold text-zinc-900 tabular-nums">{formatPercent(step.stepRate)}</span> continued
                          </span>
                          <span className="text-zinc-300">·</span>
                          <span className="tabular-nums">{fmt(step.dropOff)} dropped off</span>
                        </>
                      )}
                      {isBiggest && (
                        <Badge tone="gold" className="ml-0.5">
                          <TrendingDown aria-hidden /> Biggest drop-off
                        </Badge>
                      )}
                    </div>
                  )}
                  <div aria-hidden className="rounded-lg px-1 py-1 transition-colors group-hover:bg-zinc-50">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-sm text-zinc-700">
                        <span className="mr-2 text-xs text-zinc-400 tabular-nums">{i + 1}</span>
                        {step.label}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-zinc-900 tabular-nums">{fmt(step.count)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-3 flex-1 overflow-hidden rounded-r-[4px] bg-brand-100/70">
                        <div
                          className="h-full rounded-r-[4px] transition-[width] duration-500"
                          style={{ width: step.count > 0 ? `max(3px, ${(width * 100).toFixed(2)}%)` : 0, backgroundColor: stepColor(i, steps.length) }}
                        />
                      </div>
                      <span className="w-11 shrink-0 text-right text-xs text-zinc-500 tabular-nums">{formatPercent(step.overallRate)}</span>
                    </div>
                  </div>
                  {/* Pointer tooltip (every value here is also printed above, so it never gates). */}
                  <div
                    aria-hidden
                    className="pointer-events-none invisible absolute right-0 bottom-full z-10 mb-1 w-64 rounded-xl border border-zinc-200 bg-white/95 p-2.5 text-xs opacity-0 shadow-lift backdrop-blur transition-opacity group-hover:visible group-hover:opacity-100"
                  >
                    <p className="font-medium text-zinc-500">{step.label}</p>
                    <p className="mt-1">
                      <span className="font-semibold text-zinc-900 tabular-nums">{fmt(step.count)}</span> <span className="text-zinc-500">{step.count === 1 ? "person" : "people"}</span>
                    </p>
                    {i > 0 && (
                      <p className="mt-0.5 text-zinc-500">
                        <span className="font-semibold text-zinc-900 tabular-nums">{formatPercent(step.stepRate)}</span> of step {i} ·{" "}
                        <span className="font-semibold text-zinc-900 tabular-nums">{formatPercent(step.overallRate)}</span> of entrants
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
      <CardFooter className="justify-between text-xs text-zinc-500">
        <span className="tabular-nums">
          {fmt(entered)} entered · {fmt(completed)} completed
        </span>
        <Link href={funnel.href} target="_blank" className="inline-flex min-h-8 items-center gap-1 font-medium text-brand-700 hover:underline">
          View page <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
