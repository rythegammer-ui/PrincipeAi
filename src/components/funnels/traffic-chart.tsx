"use client";

import { BarChart3, Table2 } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Daily traffic as two lines on ONE count axis: page views and unique visitors.
 * Palette = categorical slots 1–2 (brand violet, gold), validated against #ffffff
 * (CVD ΔE 38.8, normal ΔE 45.1). Gold sits at 2.35:1, so the legend carries totals and a
 * table view is always one click away (relief rule). Text never wears series colour.
 */
const C = {
  grid: "#e4e4e7",
  baseline: "#d4d4d8",
  axis: "#71717a",
  hover: "#a1a1aa",
  surface: "#ffffff",
  views: "#6938ef",
  visitors: "#f79009",
} as const;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceMax(max: number, ticks = 4): { max: number; step: number } {
  if (max <= 0) return { max: 4, step: 1 };
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / pow;
  const step = Math.max(1, Math.ceil((norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * pow));
  return { max: Math.ceil(max / step) * step, step };
}

const compact = (n: number) => new Intl.NumberFormat("en-US", { notation: n >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
const full = (n: number) => n.toLocaleString("en-US");

function formatDay(iso: string, long = false): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", long ? { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" } : { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
}

export function TrafficChart({
  dayKeys,
  pageViews,
  visitors,
  totalPageViews,
  totalVisitors,
  height = 240,
}: {
  dayKeys: string[];
  pageViews: number[];
  visitors: number[];
  totalPageViews: number;
  totalVisitors: number;
  height?: number;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [ref, width] = useWidth<HTMLDivElement>(640);
  const [active, setActive] = useState<number | null>(null);
  const descId = useId();

  const series = [
    { key: "views", label: "Page views", color: C.views, values: pageViews, total: totalPageViews },
    { key: "visitors", label: "Unique visitors", color: C.visitors, values: visitors, total: totalVisitors },
  ];
  const n = dayKeys.length;
  const margin = { top: 12, right: 12, bottom: 26, left: 40 };
  const plotW = Math.max(10, width - margin.left - margin.right);
  const plotH = height - margin.top - margin.bottom;
  const { max, step } = niceMax(Math.max(0, ...pageViews, ...visitors));
  const x = (i: number) => margin.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => margin.top + plotH - (v / max) * plotH;
  const yTicks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) yTicks.push(v);
  const tickEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 72))));
  const xTicks = dayKeys.map((_, i) => i).filter((i) => (n - 1 - i) % tickEvery === 0);
  const path = (values: number[]) => values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const empty = totalPageViews === 0;

  const indexAt = (e: PointerEvent<SVGSVGElement>) => {
    if (!n) return null;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - margin.left;
    if (px < -8 || px > plotW + 8) return null;
    return n <= 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round((px / plotW) * (n - 1))));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, (i: number) => number> = {
      ArrowRight: (i) => Math.min(n - 1, i + 1),
      ArrowLeft: (i) => Math.max(0, i - 1),
      Home: () => 0,
      End: () => n - 1,
    };
    const move = moves[e.key];
    if (!move || !n) return;
    e.preventDefault();
    setActive((i) => move(i ?? n - 1));
  };
  const tipLeft = active === null ? 0 : Math.min(Math.max(x(active), 92), width - 92);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-600" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-0.5 w-3.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.label}</span>
              <span className="font-medium text-zinc-900 tabular-nums">{full(s.total)}</span>
            </li>
          ))}
        </ul>
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
              onClick={() => setView(id)}
              className={cn("inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors", view === id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? (
        <div className="max-h-72 overflow-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Daily page views and unique visitors</caption>
            <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Date
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Page views
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Unique visitors
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 tabular-nums">
              {dayKeys.map((d, i) => (
                <tr key={d}>
                  <th scope="row" className="px-3 py-1.5 font-normal text-zinc-600">
                    {formatDay(d, true)}
                  </th>
                  <td className="px-3 py-1.5 text-right text-zinc-900">{full(pageViews[i] ?? 0)}</td>
                  <td className="px-3 py-1.5 text-right text-zinc-900">{full(visitors[i] ?? 0)}</td>
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
          aria-label="Daily traffic chart. Use the left and right arrow keys to read each day."
          aria-describedby={descId}
          onKeyDown={onKeyDown}
          onFocus={() => setActive((i) => i ?? n - 1)}
          onBlur={() => setActive(null)}
        >
          <p id={descId} className="sr-only">
            {empty
              ? "No page views in this period yet."
              : `${full(totalPageViews)} page views from ${full(totalVisitors)} unique visitors over ${n} days. A table view is available.`}
          </p>
          <svg
            width={width}
            height={height}
            aria-hidden
            className="absolute inset-0 block touch-pan-y select-none"
            onPointerMove={(e) => setActive(indexAt(e))}
            onPointerDown={(e) => setActive(indexAt(e))}
            onPointerLeave={() => setActive(null)}
          >
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={margin.left} x2={width - margin.right} y1={y(v)} y2={y(v)} stroke={v === 0 ? C.baseline : C.grid} strokeWidth={1} shapeRendering="crispEdges" />
                <text x={margin.left - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill={C.axis} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {compact(v)}
                </text>
              </g>
            ))}
            {xTicks.map((i) => (
              <text key={dayKeys[i]} x={Math.min(Math.max(x(i), margin.left + 18), width - margin.right - 18)} y={height - 7} textAnchor="middle" fontSize={11} fill={C.axis}>
                {formatDay(dayKeys[i])}
              </text>
            ))}
            {active !== null && <line x1={x(active)} x2={x(active)} y1={margin.top} y2={margin.top + plotH} stroke={C.hover} strokeWidth={1} shapeRendering="crispEdges" />}
            {!empty &&
              series.map((s) => (
                <g key={s.key}>
                  <path d={path(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                  {n === 1 && <circle cx={x(0)} cy={y(s.values[0] ?? 0)} r={4} fill={s.color} stroke={C.surface} strokeWidth={2} />}
                </g>
              ))}
            {!empty &&
              active !== null &&
              series.map((s) => <circle key={s.key} cx={x(active)} cy={y(s.values[active] ?? 0)} r={4.5} fill={s.color} stroke={C.surface} strokeWidth={2} />)}
            {empty && (
              <text x={margin.left + plotW / 2} y={margin.top + plotH / 2} textAnchor="middle" fontSize={13} fill={C.axis}>
                No page views in this period yet.
              </text>
            )}
          </svg>
          {active !== null && dayKeys[active] && (
            <div
              className="pointer-events-none absolute top-1 z-10 w-44 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white/95 p-2.5 text-xs shadow-lift backdrop-blur"
              style={{ left: tipLeft }}
              aria-live="polite"
            >
              <p className="mb-1.5 font-medium text-zinc-500">{formatDay(dayKeys[active], true)}</p>
              <ul className="space-y-1">
                {series.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-semibold text-zinc-900 tabular-nums">{full(s.values[active] ?? 0)}</span>
                    <span className="truncate text-zinc-500">{s.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
