"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useId, useState, type ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Level } from "@/lib/sales/game";
import { cn } from "@/lib/utils";
import type { SalesFormState } from "./actions";

type FormAction = (prev: SalesFormState, formData: FormData) => Promise<SalesFormState>;

function Feedback({ state, className }: { state: SalesFormState; className?: string }) {
  if (state.error) {
    return (
      <p role="alert" className={cn("text-xs font-medium text-red-600", className)}>
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p role="status" className={cn("text-xs font-medium text-emerald-700", className)}>
        {state.message}
      </p>
    );
  }
  return null;
}

/** A form posting to a server action, with a submit button and the action's error / success message below it. */
export function ActionForm({
  action,
  hidden,
  children,
  submit,
  pendingText = "Saving…",
  variant,
  size = "md",
  className,
  buttonClassName,
  disabled = false,
}: {
  action: FormAction;
  hidden?: Record<string, string>;
  children?: ReactNode;
  submit: ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  buttonClassName?: string;
  /** Keeps the form (and the last result message) on screen with the button off, e.g. once nothing is owed. */
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState<SalesFormState, FormData>(action, {});
  return (
    <form action={formAction} className={cn("flex flex-col gap-3", className)}>
      {hidden && Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      {children}
      <div className="flex flex-col gap-1.5">
        <SubmitButton variant={variant} size={size} pendingText={pendingText} disabled={disabled} className={cn("min-h-11 sm:min-h-0 self-start", buttonClassName)}>
          {submit}
        </SubmitButton>
        <Feedback state={state} />
      </div>
    </form>
  );
}

/** A button that asks for a second click before posting (remove, decline, cancel…). */
export function ConfirmAction({
  action,
  hidden,
  label,
  confirmLabel,
  description,
  variant = "outline",
  confirmVariant = "danger",
  children,
}: {
  action: FormAction;
  hidden: Record<string, string>;
  label: ReactNode;
  confirmLabel: string;
  description?: ReactNode;
  variant?: ButtonVariant;
  confirmVariant?: ButtonVariant;
  /** Extra fields shown in the confirm step (e.g. a "send an email" checkbox). */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<SalesFormState, FormData>(action, {});
  if (!open) {
    return (
      <div className="flex flex-col gap-1">
        <Button variant={variant} size="sm" className="min-h-11 self-start sm:min-h-8" onClick={() => setOpen(true)}>
          {label}
        </Button>
        <Feedback state={state} />
      </div>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-soft">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {description && <p className="text-xs text-zinc-600">{description}</p>}
      {children}
      <div className="flex flex-wrap gap-1.5">
        <Button variant="ghost" size="sm" className="min-h-11 sm:min-h-8" onClick={() => setOpen(false)}>
          Keep
        </Button>
        <SubmitButton variant={confirmVariant} size="sm" className="min-h-11 sm:min-h-8" pendingText="Working…">
          {confirmLabel}
        </SubmitButton>
      </div>
      <Feedback state={state} />
    </form>
  );
}

type LevelRow = { key: string; name: string; minSales: string; rate: string };

const toRow = (l: Level): LevelRow => ({ key: l.key, name: l.name, minSales: String(l.minSales), rate: String(l.rateBps / 100) });

/** Program levels editor (1–5 rows): name, sales per month to reach it, commission %. Posts them as JSON in `levels`. */
export function LevelsEditor({ levels }: { levels: Level[] }) {
  const [rows, setRows] = useState<LevelRow[]>(() => levels.map(toRow));
  const id = useId();
  const update = (i: number, patch: Partial<LevelRow>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const payload = JSON.stringify(
    rows.map((r, i) => ({
      key: r.key || `level-${i + 1}`,
      name: r.name,
      minSales: i === 0 ? 0 : Number(r.minSales),
      rateBps: Math.round(Number(r.rate) * 100),
    })),
  );
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-zinc-800">Levels</legend>
      <p className="text-xs text-zinc-500">
        Agents move up as their sales this calendar month grow. Reach a level and you keep it through the end of next month. The first level
        starts at 0 sales.
      </p>
      <input type="hidden" name="levels" value={payload} />
      <div className="hidden grid-cols-[1fr_8rem_7rem_2.75rem] gap-2 px-1 text-xs font-medium text-zinc-500 sm:grid">
        <span>Name</span>
        <span>Sales / month</span>
        <span>Commission %</span>
        <span className="sr-only">Remove</span>
      </div>
      <ol className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <li key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-200 p-2 sm:grid-cols-[1fr_8rem_7rem_2.75rem] sm:border-0 sm:p-0">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor={`${id}-name-${i}`} className="text-xs font-medium text-zinc-500 sm:sr-only">
                Level {i + 1} name
              </label>
              <Input id={`${id}-name-${i}`} value={row.name} maxLength={40} required onChange={(e) => update(i, { name: e.target.value })} />
            </div>
            <div>
              <label htmlFor={`${id}-min-${i}`} className="text-xs font-medium text-zinc-500 sm:sr-only">
                Sales per month to reach level {i + 1}
              </label>
              <Input
                id={`${id}-min-${i}`}
                type="number"
                min={i === 0 ? 0 : 1}
                max={100000}
                step={1}
                inputMode="numeric"
                value={i === 0 ? "0" : row.minSales}
                disabled={i === 0}
                required
                onChange={(e) => update(i, { minSales: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor={`${id}-rate-${i}`} className="text-xs font-medium text-zinc-500 sm:sr-only">
                Level {i + 1} commission percent
              </label>
              <Input
                id={`${id}-rate-${i}`}
                type="number"
                min={0}
                max={90}
                step={0.5}
                inputMode="decimal"
                value={row.rate}
                required
                onChange={(e) => update(i, { rate: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex justify-end sm:col-span-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                disabled={rows.length <= 1}
                aria-label={`Remove level ${i + 1}`}
                onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      {rows.length < 5 && (
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 self-start sm:min-h-8"
          onClick={() => {
            const last = rows[rows.length - 1];
            setRows((r) => [
              ...r,
              { key: "", name: "", minSales: String((Number(last?.minSales) || 0) + 5), rate: String((Number(last?.rate) || 20) + 5) },
            ]);
          }}
        >
          <Plus aria-hidden /> Add a level
        </Button>
      )}
    </fieldset>
  );
}
