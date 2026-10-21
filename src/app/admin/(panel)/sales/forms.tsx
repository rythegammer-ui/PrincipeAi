"use client";

import { Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
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

/**
 * A form posting to a server action, with a submit button and the action's error / success message below it.
 * Once hydrated it submits through a transition (onSubmit), so React doesn't clear what the admin typed when the
 * action returns an error; the fields are reset only after a success (unless `resetOnSuccess` is false). The form
 * keeps `action` too, so a submit before the page has hydrated is still an ordinary server-action POST.
 */
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
  resetOnSuccess = true,
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
  /** Off for forms whose fields show the saved value (a select of the current choice): a reset would show the old one. */
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, isPending] = useActionState<SalesFormState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(e) => {
        // Handled here (React sees the transition and skips its own submit, which would reset the fields first).
        e.preventDefault();
        if (isPending || disabled) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className={cn("flex flex-col gap-3", className)}
    >
      {hidden && Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      {children}
      <div className="flex flex-col gap-1.5">
        <SubmitButton
          variant={variant}
          size={size}
          pendingText={pendingText}
          pending={isPending}
          disabled={disabled}
          className={cn("min-h-11 sm:min-h-0 self-start", buttonClassName)}
        >
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
  subject,
  variant = "outline",
  confirmVariant = "danger",
  children,
}: {
  action: FormAction;
  hidden: Record<string, string>;
  label: ReactNode;
  confirmLabel: string;
  description?: ReactNode;
  /** What it acts on, read to screen readers after the labels ("Remove avery@example.com"), so each row's button is distinct. */
  subject?: string;
  variant?: ButtonVariant;
  confirmVariant?: ButtonVariant;
  /** Extra fields shown in the confirm step (e.g. a "send an email" checkbox). */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<SalesFormState, FormData>(action, {});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLFormElement>(null);
  const id = useId();
  // Where keyboard focus goes: the confirm panel itself when the step opens (not its destructive button, so a double
  // Enter can't confirm), back to the trigger when it's dismissed.
  const focusNext = useRef<"trigger" | "panel" | null>(null);
  useEffect(() => {
    const target = focusNext.current === "panel" ? panelRef.current : focusNext.current === "trigger" ? triggerRef.current : null;
    target?.focus();
    focusNext.current = null;
  }, [open]);
  const about = subject ? <span className="sr-only"> {subject}</span> : null;
  if (!open) {
    return (
      <div className="flex flex-col gap-1">
        <Button
          ref={triggerRef}
          variant={variant}
          size="sm"
          className="min-h-11 self-start sm:min-h-8"
          onClick={() => {
            focusNext.current = "panel";
            setOpen(true);
          }}
        >
          {label}
          {about}
        </Button>
        <Feedback state={state} />
      </div>
    );
  }
  return (
    <form
      ref={panelRef}
      action={formAction}
      tabIndex={-1}
      role="group"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      <span id={`${id}-title`} className="sr-only">
        {confirmLabel}
        {subject ? ` ${subject}` : ""}?
      </span>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {description && (
        <p id={`${id}-desc`} className="text-xs text-zinc-600">
          {description}
        </p>
      )}
      {children}
      <div className="flex flex-wrap gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 sm:min-h-8"
          onClick={() => {
            focusNext.current = "trigger";
            setOpen(false);
          }}
        >
          Keep
        </Button>
        <SubmitButton variant={confirmVariant} size="sm" className="min-h-11 sm:min-h-8" pendingText="Working…">
          {confirmLabel}
          {about}
        </SubmitButton>
      </div>
      <Feedback state={state} />
    </form>
  );
}

type LevelRow = { key: string; name: string; minSales: string; rate: string };

const toRow = (l: Level): LevelRow => ({ key: l.key, name: l.name, minSales: String(l.minSales), rate: String(l.rateBps / 100) });

/** A key no row has: levels are matched by key, so a new one must never reuse an existing (or removed-then-re-added) one. */
function newKey(rows: LevelRow[]): string {
  for (let n = rows.length + 1; ; n++) {
    const key = `level-${n}`;
    if (!rows.some((r) => r.key === key)) return key;
  }
}

/** Program levels editor (1–5 rows): name, sales per month to reach it, commission %. Posts them as JSON in `levels`. */
export function LevelsEditor({ levels }: { levels: Level[] }) {
  const [rows, setRows] = useState<LevelRow[]>(() => levels.map(toRow));
  const id = useId();
  const update = (i: number, patch: Partial<LevelRow>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const payload = JSON.stringify(
    rows.map((r, i) => ({
      key: r.key,
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
          <li key={row.key} className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-200 p-2 sm:grid-cols-[1fr_8rem_7rem_2.75rem] sm:border-0 sm:p-0">
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
              { key: newKey(r), name: "", minSales: String((Number(last?.minSales) || 0) + 5), rate: String((Number(last?.rate) || 20) + 5) },
            ]);
          }}
        >
          <Plus aria-hidden /> Add a level
        </Button>
      )}
    </fieldset>
  );
}
