"use client";

import { Check } from "lucide-react";
import { useRef } from "react";
import { Select } from "@/components/ui/form";
import { type Question, toggleMultiValue } from "@/lib/assessment";
import { cn } from "@/lib/utils";
import { OPTION_ICONS } from "./option-icons";

type Props = {
  question: Question;
  value: string | string[] | undefined;
  /** `viaPointer` is true when the choice came from a mouse/touch tap (the quiz may auto-advance). */
  onChange: (value: string | string[], viaPointer: boolean) => void;
  labelledBy: string;
  describedBy?: string;
};

const card =
  "group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 bg-white text-left shadow-xs transition-[border-color,background-color,box-shadow] duration-150 hover:border-brand-300 hover:bg-brand-50/40 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/70 has-[:checked]:shadow-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:disabled]:hover:border-zinc-200 has-[:disabled]:hover:bg-white";

/** Renders one assessment question as accessible radio cards, checkbox cards, a 1–5 scale or a select. */
export function QuestionField({ question, value, onChange, labelledBy, describedBy }: Props) {
  const pointer = useRef(false);
  const markPointer = () => {
    pointer.current = true;
  };
  const markKeyboard = () => {
    pointer.current = false;
  };
  const emit = (next: string | string[]) => {
    const viaPointer = pointer.current;
    pointer.current = false;
    onChange(next, viaPointer);
  };

  if (question.kind === "select") {
    return (
      <Select
        id={`q-${question.id}`}
        name={question.id}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => emit(e.target.value)}
        className="h-12 text-base sm:text-sm"
      >
        <option value="" disabled>
          {question.placeholder}
        </option>
        {question.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    );
  }

  if (question.kind === "scale") {
    const selected = question.options.find((o) => o.value === value);
    return (
      <fieldset aria-labelledby={labelledBy} aria-describedby={describedBy} onKeyDown={markKeyboard}>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {question.options.map((o) => (
            <label key={o.value} onPointerDown={markPointer} className={cn(card, "h-16 flex-col justify-center gap-0.5 p-1 sm:h-20")}>
              <input
                type="radio"
                name={question.id}
                value={o.value}
                checked={value === o.value}
                onChange={() => emit(o.value)}
                className="sr-only"
              />
              <span className="text-xl font-semibold text-zinc-800 tabular-nums group-has-[:checked]:text-brand-700 sm:text-2xl">{o.label}</span>
              <span className="sr-only">— {o.description}</span>
            </label>
          ))}
        </div>
        <div className="mt-2 flex justify-between gap-4 text-xs text-zinc-500" aria-hidden>
          <span>{question.minLabel}</span>
          <span className="text-right">{question.maxLabel}</span>
        </div>
        <p className="mt-4 min-h-6 text-center text-sm font-medium text-brand-800" aria-live="polite">
          {selected?.description ?? ""}
        </p>
      </fieldset>
    );
  }

  if (question.kind === "multi") {
    const list = Array.isArray(value) ? value : [];
    const atMax = Boolean(question.maxSelections && list.length >= question.maxSelections);
    return (
      <fieldset aria-labelledby={labelledBy} aria-describedby={describedBy} onKeyDown={markKeyboard}>
        <div className={cn("grid gap-2.5", question.options.length > 7 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 min-[440px]:grid-cols-2")}>
          {question.options.map((o) => {
            const checked = list.includes(o.value);
            const Icon = o.icon ? OPTION_ICONS[o.icon] : undefined;
            return (
              <label key={o.value} className={cn(card, "min-h-14 p-3 sm:p-3.5")}>
                <input
                  type="checkbox"
                  name={question.id}
                  value={o.value}
                  checked={checked}
                  disabled={!checked && atMax}
                  onChange={() => emit(toggleMultiValue(question, list, o.value))}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className="flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-zinc-300 bg-white text-white transition-colors group-has-[:checked]:border-brand-600 group-has-[:checked]:bg-brand-600"
                >
                  <Check className="size-3.5 opacity-0 transition-opacity group-has-[:checked]:opacity-100" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-snug font-medium text-zinc-900">{o.label}</span>
                  {o.description && <span className="mt-0.5 block text-xs leading-snug text-zinc-500">{o.description}</span>}
                </span>
                {Icon && <Icon aria-hidden className="hidden size-4.5 shrink-0 text-zinc-400 group-has-[:checked]:text-brand-600 sm:block" />}
              </label>
            );
          })}
        </div>
        {question.maxSelections ? (
          <p className="mt-3 text-sm text-zinc-500" aria-live="polite">
            {atMax
              ? `You've picked ${question.maxSelections} — unselect one to swap it for another.`
              : `${list.length} of ${question.maxSelections} selected`}
          </p>
        ) : null}
      </fieldset>
    );
  }

  // Single choice radio cards.
  const withDescriptions = question.options.some((o) => o.description);
  return (
    <fieldset aria-labelledby={labelledBy} aria-describedby={describedBy} onKeyDown={markKeyboard}>
      <div className={cn("grid gap-3", question.options.length >= 4 && "sm:grid-cols-2")}>
        {question.options.map((o) => {
          const Icon = o.icon ? OPTION_ICONS[o.icon] : undefined;
          return (
            <label key={o.value} onPointerDown={markPointer} className={cn(card, withDescriptions ? "min-h-18 p-4" : "min-h-14 px-4 py-3")}>
              <input type="radio" name={question.id} value={o.value} checked={value === o.value} onChange={() => emit(o.value)} className="sr-only" />
              {Icon && (
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-brand-100 group-hover:text-brand-700 group-has-[:checked]:bg-brand-600 group-has-[:checked]:text-white"
                >
                  <Icon className="size-5" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block leading-snug font-medium text-zinc-900">{o.label}</span>
                {o.description && <span className="mt-0.5 block text-sm leading-snug text-zinc-500">{o.description}</span>}
              </span>
              <span
                aria-hidden
                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 bg-white transition-colors group-has-[:checked]:border-brand-600"
              >
                <span className="size-2.5 rounded-full bg-brand-600 opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
