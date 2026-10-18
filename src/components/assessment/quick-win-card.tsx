import type { QuickWin } from "@/lib/assessment";
import { CopyButton } from "./copy-button";

/** A quick win with its copy-paste prompt. */
export function QuickWinCard({ win, index }: { win: QuickWin; index: number }) {
  const promptId = `quick-win-${win.id}`;
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
      <div className="p-5 sm:p-6">
        <span className="flex size-8 items-center justify-center rounded-full bg-gold-50 text-sm font-semibold text-gold-700 ring-1 ring-gold-200 ring-inset">
          {index + 1}
        </span>
        <h3 className="mt-4 font-semibold text-balance text-zinc-900">{win.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{win.why}</p>
      </div>
      <div className="mt-auto bg-ink">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
          <span id={`${promptId}-label`} className="text-xs font-medium text-zinc-400">
            Copy-paste prompt
          </span>
          <CopyButton text={win.prompt} />
        </div>
        <pre
          aria-labelledby={`${promptId}-label`}
          tabIndex={0}
          className="max-h-64 overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-zinc-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-400"
        >
          {win.prompt}
        </pre>
      </div>
    </li>
  );
}
