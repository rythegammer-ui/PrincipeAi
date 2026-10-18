"use client";

import { BarChart3, Table2 } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Hand-built, dependency-free charts for the admin (light surface).
 *
 * Palette (validated with the dataviz validator against #ffffff):
 * - categorical, in fixed order: brand violet, gold, aqua, blue, magenta — adjacent CVD ΔE ≥ 8.6,
 *   normal-vision ΔE ≥ 24. Gold/aqua/magenta sit below 3:1 contrast, so every multi-series chart
 *   ships a legend with totals and a table view (the "relief" channel).
 * - ordinal (funnel / pipeline stages): one violet ramp, light → dark, adjacent ΔL ≥ 0.06,
 *   light end ≥ 2:1 on white.
 * Text never wears a series colour; identity comes from the swatch beside it.
 */
export const CHART_COLORS = {
  surface: "#ffffff",
  grid: "#e4e4e7",
  baseline: "#d4d4d8",
  axisText: "#71717a",
  hover: "#f4f4f5",
  series: ["#6938ef", "#f79009", "#1baf7a", "#2a78d6", "#e87ba4"],
  other: "#a1a1aa",
  ordinal: ["#9b8afb", "#8466f9", "#6938ef", "#5323cc", "#3e1c96", "#27115f"],
  deemphasis: "#a1a1aa",
  accent: "#6938ef",
} as const;

export type ValueFormat = "number" | "currency" | "percent";

/** Formats a chart value. Currency values are integer cents. */
export function formatChartValue(value: number, format: ValueFormat = "number", compact = false): string {
  if (format === "currency") {
    const dollars = value / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: compact && Math.abs(dollars) >= 1000 ? "compact" : "standard",
      maximumFractionDigits: compact || Number.isInteger(dollars) ? (compact && Math.abs(dollars) >= 1000 ? 1 : 0) : 2,
    }).format(dollars);
  }
  if (format === "percent") return `${(value * 100).toFixed(value < 0.1 && value > 0 ? 1 : 0)}%`;
  return new Intl.NumberFormat("en-US", { notation: compact && Math.abs(value) >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

/** "2026-10-14" → "Oct 14" (date-only strings are formatted in UTC so server and client agree). */
function formatDay(iso: string, long = false): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", long ? { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" } : { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
}

/** Rounds an axis maximum up to a clean 1/2/5 × 10ⁿ step. */
function niceScale(max: number, ticks = 4, integer = true): { max: number; step: number } {
  if (max <= 0) return { max: integer ? 4 : 1, step: integer ? 1 : 0.25 };
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / pow;
  let step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * pow;
  if (integer) step = Math.max(1, Math.ceil(step));
  return { max: Math.ceil(max / step) * step, step };
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(200, Math.round(el.getBoundingClientRect().width)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Path for a rectangle with rounded top corners and a square base. */
function topRoundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

/* ------------------------------------------------------------------ */
/* Legend + chart/table toggle                                         */
/* ------------------------------------------------------------------ */

export type LegendItem = { label: string; color: string; value?: string };

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-600", className)}>
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
          {item.value !== undefined && <span className="font-medium text-zinc-900 tabular-nums">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}

function ViewToggle({ view, onChange }: { view: "chart" | "table"; onChange: (v: "chart" | "table") => void }) {
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-zinc-200 bg-white p-0.5" role="group" aria-label="Display as">
      {(
        [
          { id: "chart", label: "Chart", Icon: BarChart3 },
          { id: "table", label: "Table", Icon: Table2 },
        ] as const
      ).map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
            view === id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stacked column chart (time series)                                  */
/* ------------------------------------------------------------------ */

export type ColumnSeries = { key: string; label: string; values: number[]; color?: string };

export function seriesColor(index: number, key?: string): string {
  if (key === "other") return CHART_COLORS.other;
  return CHART_COLORS.series[index] ?? CHART_COLORS.other;
}

/**
 * Daily (or any ordered) stacked columns with a hover/focus readout listing every series,
 * a legend with totals, and a table view. Keyboard: focus the plot, then ← / → / Home / End.
 */
export function StackedColumnChart({
  labels,
  series,
  ariaLabel,
  valueFormat = "number",
  height = 232,
  emptyMessage = "No data for this period yet.",
  totalLabel = "Total",
}: {
  /** ISO dates (YYYY-MM-DD), one per column. */
  labels: string[];
  series: ColumnSeries[];
  ariaLabel: string;
  valueFormat?: ValueFormat;
  /** Total height including the x-axis band. */
  height?: number;
  emptyMessage?: string;
  totalLabel?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [ref, width] = useElementWidth<HTMLDivElement>(640);
  const [active, setActive] = useState<number | null>(null);
  const descId = useId();

  const colored = useMemo(() => series.map((s, i) => ({ ...s, color: s.color ?? seriesColor(i, s.key) })), [series]);
  const totals = useMemo(() => labels.map((_, i) => colored.reduce((sum, s) => sum + (s.values[i] ?? 0), 0)), [labels, colored]);
  const seriesTotals = colored.map((s) => s.values.reduce((a, b) => a + b, 0));
  const grand = totals.reduce((a, b) => a + b, 0);
  const visibleSeries = colored.filter((_, i) => seriesTotals[i] > 0 || colored.length <= 3);

  const margin = { top: 10, right: 4, bottom: 24, left: 36 };
  const plotW = Math.max(10, width - margin.left - margin.right);
  const plotH = height - margin.top - margin.bottom;
  const { max, step } = niceScale(Math.max(...totals, 0), 4, valueFormat === "number");
  const y = (v: number) => margin.top + plotH - (v / max) * plotH;
  const n = labels.length;
  const slot = n ? plotW / n : plotW;
  const colW = slot >= 8 ? Math.min(24, slot * 0.7) : Math.max(1, slot - 1);
  const gap = slot >= 8 ? 2 : 1;
  const colX = (i: number) => margin.left + i * slot + (slot - colW) / 2;

  const tickCount = Math.max(2, Math.floor(plotW / 70));
  const tickEvery = Math.max(1, Math.ceil(n / tickCount));
  const xTicks = labels.map((_, i) => i).filter((i) => (n - 1 - i) % tickEvery === 0);
  const yTicks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) yTicks.push(v);

  const indexFromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;
    if (x < 0 || x > plotW) return null;
    return Math.max(0, Math.min(n - 1, Math.floor(x / slot)));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!n) return;
    const keys: Record<string, (i: number) => number> = {
      ArrowRight: (i) => Math.min(n - 1, i + 1),
      ArrowLeft: (i) => Math.max(0, i - 1),
      Home: () => 0,
      End: () => n - 1,
    };
    const fn = keys[e.key];
    if (!fn) return;
    e.preventDefault();
    setActive((i) => fn(i ?? n - 1));
  };

  const tooltipLeft = active === null ? 0 : Math.min(Math.max(colX(active) + colW / 2, 96), width - 96);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <ChartLegend items={visibleSeries.map((s) => ({ label: s.label, color: s.color, value: formatChartValue(seriesTotals[colored.indexOf(s)], valueFormat) }))} />
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "table" ? (
        <div className="max-h-72 overflow-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{ariaLabel}</caption>
            <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Date
                </th>
                {colored.map((s) => (
                  <th key={s.key} scope="col" className="px-3 py-2 text-right font-medium">
                    {s.label}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {totalLabel}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 tabular-nums">
              {labels.map((label, i) => (
                <tr key={label}>
                  <th scope="row" className="px-3 py-1.5 font-normal text-zinc-600">
                    {formatDay(label, true)}
                  </th>
                  {colored.map((s) => (
                    <td key={s.key} className="px-3 py-1.5 text-right text-zinc-700">
                      {formatChartValue(s.values[i] ?? 0, valueFormat)}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-right font-medium text-zinc-900">{formatChartValue(totals[i], valueFormat)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          ref={ref}
          className="relative w-full min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          style={{ height }}
          tabIndex={n ? 0 : -1}
          role="group"
          aria-label={`${ariaLabel}. Use the left and right arrow keys to read each day.`}
          aria-describedby={descId}
          onKeyDown={onKeyDown}
          onFocus={() => setActive((i) => i ?? n - 1)}
          onBlur={() => setActive(null)}
        >
          <p id={descId} className="sr-only">
            {grand === 0 ? emptyMessage : `${formatChartValue(grand, valueFormat)} in total across ${n} days. A table view is available.`}
          </p>
          <svg
            width={width}
            height={height}
            className="absolute inset-0 block touch-pan-y select-none"
            aria-hidden
            onPointerMove={(e) => setActive(indexFromPointer(e))}
            onPointerDown={(e) => setActive(indexFromPointer(e))}
            onPointerLeave={() => setActive(null)}
          >
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={margin.left} x2={width - margin.right} y1={y(v)} y2={y(v)} stroke={v === 0 ? CHART_COLORS.baseline : CHART_COLORS.grid} strokeWidth={1} shapeRendering="crispEdges" />
                <text x={margin.left - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill={CHART_COLORS.axisText} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatChartValue(v, valueFormat, true)}
                </text>
              </g>
            ))}
            {active !== null && <rect x={margin.left + active * slot} y={margin.top} width={slot} height={plotH} fill={CHART_COLORS.hover} />}
            {labels.map((label, i) => {
              let base = y(0);
              const segments = colored
                .map((s) => ({ key: s.key, color: s.color, v: s.values[i] ?? 0 }))
                .filter((s) => s.v > 0);
              return (
                <g key={label} opacity={active === null || active === i ? 1 : 0.55}>
                  {segments.map((s, si) => {
                    const h = (s.v / max) * plotH;
                    const top = base - h;
                    const gapBelow = si > 0 ? gap : 0;
                    const drawH = Math.max(0.5, h - gapBelow);
                    base = top;
                    const isTop = si === segments.length - 1;
                    return isTop ? (
                      <path key={s.key} d={topRoundedRect(colX(i), top, colW, drawH, 4)} fill={s.color} />
                    ) : (
                      <rect key={s.key} x={colX(i)} y={top} width={colW} height={drawH} fill={s.color} />
                    );
                  })}
                </g>
              );
            })}
            {xTicks.map((i) => (
              <text
                key={labels[i]}
                x={Math.min(Math.max(colX(i) + colW / 2, margin.left + 16), width - margin.right - 16)}
                y={height - 6}
                textAnchor="middle"
                fontSize={11}
                fill={CHART_COLORS.axisText}
              >
                {formatDay(labels[i])}
              </text>
            ))}
            {grand === 0 && (
              <text x={margin.left + plotW / 2} y={margin.top + plotH / 2} textAnchor="middle" fontSize={13} fill={CHART_COLORS.axisText}>
                {emptyMessage}
              </text>
            )}
          </svg>
          {active !== null && labels[active] && (
            <div
              className="pointer-events-none absolute top-1 z-10 w-48 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white/95 p-2.5 text-xs shadow-lift backdrop-blur"
              style={{ left: tooltipLeft }}
              aria-live="polite"
            >
              <p className="mb-1.5 font-medium text-zinc-500">{formatDay(labels[active], true)}</p>
              <ul className="space-y-1">
                {colored.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-semibold text-zinc-900 tabular-nums">{formatChartValue(s.values[active] ?? 0, valueFormat)}</span>
                    <span className="truncate text-zinc-500">{s.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 flex items-center justify-between border-t border-zinc-100 pt-1.5 text-zinc-500">
                {totalLabel} <span className="font-semibold text-zinc-900 tabular-nums">{formatChartValue(totals[active], valueFormat)}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal bar list                                                 */
/* ------------------------------------------------------------------ */

/**
 * Colour for one bar. Server components can't read CHART_COLORS (this is a client module), so
 * they pass a serialisable token instead: "ordinal-<n>" (n = 0…5, light → dark), "series-<n>"
 * (categorical slot), "other" (neutral grey), or a hex string.
 */
export type ChartColor = `ordinal-${number}` | `series-${number}` | "other" | `#${string}`;

export function resolveChartColor(color: ChartColor | undefined): string {
  if (!color) return CHART_COLORS.accent;
  if (color === "other") return CHART_COLORS.other;
  if (color.startsWith("#")) return color;
  const [kind, n] = color.split("-");
  const idx = Number(n);
  const list: readonly string[] = kind === "ordinal" ? CHART_COLORS.ordinal : CHART_COLORS.series;
  return list[Math.max(0, Math.min(list.length - 1, Number.isFinite(idx) ? idx : 0))];
}

export type BarItem = {
  key: string;
  label: string;
  value: number;
  /** Extra text after the value, e.g. a deal value. */
  secondary?: string;
  /** Omit for nominal categories (one colour for every bar); use ordinal tokens for ordered data. */
  color?: ChartColor;
};

/**
 * Ranked horizontal bars with the value at each bar's tip. One colour for nominal categories
 * (pass `color` per item only for ordinal data such as pipeline stages).
 */
export function BarList({
  items,
  ariaLabel,
  valueFormat = "number",
  emptyMessage = "Nothing to show yet.",
  labelWidth = "7.5rem",
}: {
  items: BarItem[];
  ariaLabel: string;
  valueFormat?: ValueFormat;
  emptyMessage?: string;
  /** Width of the label column (CSS length). */
  labelWidth?: string;
}) {
  const max = Math.max(0, ...items.map((i) => i.value));
  if (!items.length || max === 0) {
    return <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">{emptyMessage}</p>;
  }
  return (
    <ul aria-label={ariaLabel} className="flex flex-col gap-1">
      {items.map((item) => {
        const ratio = item.value / max;
        return (
          <li
            key={item.key}
            className="grid items-center gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-zinc-50"
            style={{ gridTemplateColumns: `minmax(0, ${labelWidth}) minmax(0, 1fr)` }}
          >
            <span className="truncate text-sm text-zinc-700" title={item.label}>
              {item.label}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="h-3 shrink-0 rounded-r-[4px]"
                style={{
                  width: item.value > 0 ? `max(3px, calc((100% - 6.5rem) * ${ratio.toFixed(4)}))` : 0,
                  backgroundColor: resolveChartColor(item.color),
                }}
              />
              <span className="shrink-0 text-sm font-medium text-zinc-900 tabular-nums">{formatChartValue(item.value, valueFormat)}</span>
              {item.secondary && <span className="truncate text-xs text-zinc-500 tabular-nums">{item.secondary}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */

/** Tiny trend line: the period in a de-emphasised hue, the latest point as an accent dot. */
export function Sparkline({ values, className, label }: { values: number[]; className?: string; label?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 28 - ((v - min) / span) * 24] as const);
  const line = pts.map(([x, yy], i) => `${i ? "L" : "M"}${x.toFixed(2)},${yy.toFixed(2)}`).join("");
  const area = `${line}L100,32L0,32Z`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <div className={cn("relative h-8 w-full", className)} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <path d={area} fill={CHART_COLORS.accent} opacity={0.08} />
        <path d={line} fill="none" stroke={CHART_COLORS.deemphasis} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
        style={{ left: `${lx}%`, top: `${(ly / 32) * 100}%`, backgroundColor: CHART_COLORS.accent }}
      />
    </div>
  );
}
