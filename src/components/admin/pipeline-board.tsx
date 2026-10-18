"use client";

import { ChevronLeft, ChevronRight, GripVertical, ListTodo } from "lucide-react";
import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition, type DragEvent } from "react";
import { setContactStageAction } from "@/app/admin/(panel)/contacts/actions";
import { CHART_COLORS } from "@/components/analytics/charts";
import { Avatar } from "@/components/ui/misc";
import type { Stage } from "@/db/schema";
import { cn, formatMoney, timeAgo } from "@/lib/utils";
import { STAGE_META, STAGE_ORDER, displayName } from "./crm-utils";
import { DealValueEditor } from "./deal-value-editor";
import { ScoreMeter } from "./score-meter";

export type PipelineCard = {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  stage: Stage;
  score: number;
  segment: string | null;
  dealValueCents: number;
  /** ISO string */
  lastActivityAt: string;
  openTasks: number;
};

type Totals = Record<Stage, { count: number; dealCents: number }>;

const STAGE_ACCENT: Record<Stage, string> = {
  new: CHART_COLORS.ordinal[0],
  engaged: CHART_COLORS.ordinal[1],
  qualified: CHART_COLORS.ordinal[2],
  call_booked: CHART_COLORS.ordinal[3],
  proposal: CHART_COLORS.ordinal[4],
  customer: CHART_COLORS.ordinal[5],
  lost: CHART_COLORS.other,
};

/**
 * Kanban board: drag a card to another column (native HTML5 drag and drop) or use the
 * "Move to" select on each card (keyboard / touch). Moves are optimistic and saved with setStage.
 */
export function PipelineBoard({ cards, totals, now, perStageLimit }: { cards: PipelineCard[]; totals: Totals; now: string; perStageLimit: number }) {
  const [optimistic, moveOptimistic] = useOptimistic(cards, (state: PipelineCard[], move: { id: string; stage: Stage }) =>
    state.map((c) => (c.id === move.id ? { ...c, stage: move.stage, lastActivityAt: new Date().toISOString() } : c)),
  );
  const [, startTransition] = useTransition();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [lostOpen, setLostOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nowDate = useMemo(() => new Date(now), [now]);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(STAGE_ORDER.map((s) => [s, [] as PipelineCard[]])) as Record<Stage, PipelineCard[]>;
    for (const c of optimistic) map[c.stage]?.push(c);
    return map;
  }, [optimistic]);

  // Server totals, adjusted for moves that haven't round-tripped yet.
  const liveTotals = useMemo(() => {
    const t = Object.fromEntries(STAGE_ORDER.map((s) => [s, { ...totals[s] }])) as Totals;
    const original = new Map(cards.map((c) => [c.id, c]));
    for (const c of optimistic) {
      const before = original.get(c.id);
      if (before && before.stage !== c.stage) {
        t[before.stage].count -= 1;
        t[before.stage].dealCents -= before.dealValueCents;
        t[c.stage].count += 1;
        t[c.stage].dealCents += c.dealValueCents;
      }
    }
    return t;
  }, [cards, optimistic, totals]);

  const move = (id: string, stage: Stage) => {
    const card = optimistic.find((c) => c.id === id);
    if (!card || card.stage === stage) return;
    setError(null);
    startTransition(async () => {
      moveOptimistic({ id, stage });
      setAnnouncement(`Moved ${displayName(card)} to ${STAGE_META[stage].label}.`);
      const res = await setContactStageAction(id, stage);
      if (!res.ok) {
        setError(`Couldn't move ${displayName(card)}: ${res.error}`);
        setAnnouncement(`Couldn't move ${displayName(card)}.`);
      }
    });
  };

  const dropProps = (stage: Stage) => ({
    onDragOver: (e: DragEvent) => {
      if (!dragging) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== stage) setOver(stage);
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver((s) => (s === stage ? null : s));
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain") || dragging;
      setOver(null);
      setDragging(null);
      if (id) move(id, stage);
    },
  });

  const pipelineValue = STAGE_ORDER.filter((s) => s !== "lost" && s !== "customer").reduce((sum, s) => sum + liveTotals[s].dealCents, 0);
  const openCount = STAGE_ORDER.filter((s) => s !== "lost" && s !== "customer").reduce((sum, s) => sum + liveTotals[s].count, 0);

  return (
    <div className="flex flex-col gap-4">
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-zinc-600">
        <span>
          Open pipeline: <span className="font-semibold text-zinc-900 tabular-nums">{formatMoney(pipelineValue)}</span> across{" "}
          <span className="font-semibold text-zinc-900 tabular-nums">{openCount}</span> {openCount === 1 ? "deal" : "deals"}
        </span>
        <span>
          Won: <span className="font-semibold text-zinc-900 tabular-nums">{liveTotals.customer.count}</span> customers
        </span>
        <span className="hidden text-xs text-zinc-500 md:inline">Tip: drag cards between columns, or use “Move to” on a card.</span>
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex snap-x snap-mandatory gap-3 sm:snap-none">
          {STAGE_ORDER.map((stage) => {
            const list = byStage[stage];
            const total = liveTotals[stage];
            const collapsed = stage === "lost" && !lostOpen;
            const truncated = total.count > list.length && list.length >= perStageLimit;
            if (collapsed) {
              return (
                <section
                  key={stage}
                  aria-label={`${STAGE_META[stage].label} column (collapsed)`}
                  {...dropProps(stage)}
                  className={cn(
                    "flex w-14 shrink-0 snap-start flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-100/70 py-3 transition-colors",
                    over === stage && "border-red-300 bg-red-50 ring-2 ring-red-200",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setLostOpen(true)}
                    aria-expanded={false}
                    aria-label={`Show lost contacts (${total.count})`}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-brand-500"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                  </button>
                  <span className="text-xs font-semibold text-zinc-600 [writing-mode:vertical-rl]">
                    Lost · {total.count}
                  </span>
                </section>
              );
            }
            return (
              <section
                key={stage}
                aria-labelledby={`col-${stage}`}
                {...dropProps(stage)}
                className={cn(
                  "flex max-h-[calc(100vh-16rem)] min-h-64 w-[17.5rem] shrink-0 snap-start flex-col rounded-2xl border border-zinc-200 bg-zinc-100/60 transition-colors",
                  over === stage && "border-brand-300 bg-brand-50/70 ring-2 ring-brand-200",
                )}
              >
                <header className="rounded-t-2xl border-t-4 px-3 pt-2.5 pb-2" style={{ borderTopColor: STAGE_ACCENT[stage] }}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 id={`col-${stage}`} className="text-sm font-semibold text-zinc-900">
                      {STAGE_META[stage].label}
                    </h2>
                    <div className="flex items-center gap-1">
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-700 tabular-nums ring-1 ring-zinc-200">{total.count}</span>
                      {stage === "lost" && (
                        <button
                          type="button"
                          onClick={() => setLostOpen(false)}
                          aria-expanded
                          aria-label="Collapse lost column"
                          className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-900"
                        >
                          <ChevronRight className="size-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">{formatMoney(total.dealCents)} in deals</p>
                </header>
                <ol className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                  {list.length === 0 && (
                    <li className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-300 px-3 py-8 text-center text-xs text-zinc-500">
                      {dragging ? "Drop here" : "No contacts in this stage"}
                    </li>
                  )}
                  {list.map((card) => (
                    <PipelineCardItem
                      key={card.id}
                      card={card}
                      now={nowDate}
                      dragging={dragging === card.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", card.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragging(card.id);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                      onMove={(s) => move(card.id, s)}
                    />
                  ))}
                  {truncated && (
                    <li className="px-2 py-1 text-center text-xs text-zinc-500">
                      Showing the {perStageLimit} most recently active.{" "}
                      <Link href={`/admin/contacts?stage=${stage}&sort=activity`} className="font-medium text-brand-700 hover:underline">
                        See all {total.count}
                      </Link>
                    </li>
                  )}
                </ol>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PipelineCardItem({
  card,
  now,
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  card: PipelineCard;
  now: Date;
  dragging: boolean;
  onDragStart: (e: DragEvent<HTMLLIElement>) => void;
  onDragEnd: () => void;
  onMove: (stage: Stage) => void;
}) {
  const name = displayName(card);
  // Editing a field inside a draggable element would start a drag on text selection.
  const [editing, setEditing] = useState(false);
  return (
    <li
      draggable={!editing}
      onFocusCapture={(e) => setEditing(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)}
      onBlurCapture={() => setEditing(false)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab rounded-xl border border-zinc-200 bg-white p-3 shadow-xs transition-shadow hover:shadow-soft active:cursor-grabbing",
        dragging && "opacity-50 ring-2 ring-brand-300",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={card.name} email={card.email} className="size-8 text-[11px]" />
        <div className="min-w-0 flex-1">
          <Link href={`/admin/contacts/${card.id}`} className="block truncate text-sm font-semibold text-zinc-900 hover:text-brand-700" draggable={false}>
            {name}
          </Link>
          <p className="truncate text-xs text-zinc-500">{card.company || card.email}</p>
        </div>
        <GripVertical className="mt-0.5 size-4 shrink-0 text-zinc-300 group-hover:text-zinc-400" aria-hidden />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <DealValueEditor contactId={card.id} cents={card.dealValueCents} size="sm" />
        <ScoreMeter score={card.score} barClassName="w-10" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-zinc-500">
        <span>
          Active <time dateTime={card.lastActivityAt}>{timeAgo(card.lastActivityAt, now)}</time>
        </span>
        {card.openTasks > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-gold-700">
            <ListTodo className="size-3.5" aria-hidden />
            {card.openTasks} open {card.openTasks === 1 ? "task" : "tasks"}
          </span>
        )}
      </div>
      <label className="mt-2.5 flex items-center gap-2 border-t border-zinc-100 pt-2.5 text-xs text-zinc-500">
        <span className="shrink-0">Move to</span>
        <select
          value={card.stage}
          onChange={(e) => onMove(e.target.value as Stage)}
          aria-label={`Move ${name} to stage`}
          className="h-8 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:outline-none"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {STAGE_META[s].label}
            </option>
          ))}
        </select>
      </label>
    </li>
  );
}
