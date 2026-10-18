import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/*
 * CSS-only animation so the final score is server-rendered (no hydration flash) and the
 * global prefers-reduced-motion rule in globals.css makes it instant.
 * The number counts up via a registered integer custom property + CSS counter.
 */
const RING_CSS = `
@property --pa-score-n { syntax: "<integer>"; initial-value: 0; inherits: false; }
.pa-ring-arc { animation: pa-ring-fill 1.5s cubic-bezier(.22,1,.36,1) .2s both; }
@keyframes pa-ring-fill { from { stroke-dashoffset: var(--pa-ring-c); } }
.pa-score-count { --pa-score-n: var(--pa-score); counter-reset: pa-score var(--pa-score-n); animation: pa-score-count 1.5s cubic-bezier(.22,1,.36,1) .2s both; }
.pa-score-count::after { content: counter(pa-score); }
@keyframes pa-score-count { from { --pa-score-n: 0; } }
`;

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Animated circular readiness score (0–100) for dark backgrounds. */
export function ScoreRing({ score, className }: { score: number; className?: string }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const offset = CIRCUMFERENCE * (1 - value / 100);
  return (
    <div role="img" aria-label={`AI readiness score: ${value} out of 100`} className={cn("relative size-44 sm:size-52", className)}>
      <style href="pa-score-ring" precedence="default">
        {RING_CSS}
      </style>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="pa-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9b8afb" />
            <stop offset="55%" stopColor="#7a5af8" />
            <stop offset="100%" stopColor="#fec84b" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="url(#pa-ring-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="pa-ring-arc"
          style={{ "--pa-ring-c": CIRCUMFERENCE } as CSSProperties}
        />
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="pa-score-count text-5xl font-semibold tracking-tight text-white tabular-nums sm:text-6xl" style={{ "--pa-score": value } as CSSProperties} />
        <span className="mt-1 text-xs font-medium tracking-[0.14em] text-zinc-400 uppercase">out of 100</span>
      </div>
    </div>
  );
}
