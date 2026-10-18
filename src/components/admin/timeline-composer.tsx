"use client";

import { Phone, StickyNote } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { addTimelineEntryAction, type FormState } from "@/app/admin/(panel)/contacts/actions";
import { Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

const OUTCOMES = [
  { value: "connected", label: "Connected" },
  { value: "voicemail", label: "Left voicemail" },
  { value: "no_answer", label: "No answer" },
] as const;

/** "Add note" / "Log call" composer above the timeline. */
export function TimelineComposer({ contactId }: { contactId: string }) {
  const [kind, setKind] = useState<"note" | "call">("note");
  const [state, action] = useActionState<FormState, FormData>(addTimelineEntryAction, {});
  const uid = useId();
  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3">
      <input type="hidden" name="id" value={contactId} />
      <input type="hidden" name="kind" value={kind} />
      <div role="group" aria-label="Entry type" className="flex gap-1">
        {(
          [
            { id: "note", label: "Add note", Icon: StickyNote },
            { id: "call", label: "Log call", Icon: Phone },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={kind === id}
            onClick={() => setKind(id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-500",
              kind === id ? "bg-white text-zinc-900 shadow-xs ring-1 ring-zinc-200" : "text-zinc-600 hover:bg-white/70",
            )}
          >
            <Icon className="size-3.5" aria-hidden /> {label}
          </button>
        ))}
      </div>
      <label htmlFor={`${uid}-body`} className="sr-only">
        {kind === "note" ? "Note" : "Call notes"}
      </label>
      <Textarea
        id={`${uid}-body`}
        name="body"
        rows={3}
        maxLength={5000}
        required
        className="min-h-20 bg-white"
        placeholder={kind === "note" ? "What should you remember about this contact?" : "What did you talk about? Any next steps?"}
        defaultValue={state.ok ? "" : state.values?.body}
      />
      {kind === "call" && (
        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <legend className="sr-only">Call outcome</legend>
          {OUTCOMES.map((o) => (
            <label key={o.value} className="inline-flex items-center gap-1.5 text-sm text-zinc-700">
              <input type="radio" name="outcome" value={o.value} defaultChecked={o.value === "connected"} className="size-4 accent-brand-600" />
              {o.label}
            </label>
          ))}
        </fieldset>
      )}
      <div className="flex items-center gap-3">
        <SubmitButton size="sm" pendingText="Saving…">
          {kind === "note" ? "Add note" : "Log call"}
        </SubmitButton>
        <p aria-live="polite" className={state.error ? "text-xs font-medium text-red-600" : "text-xs text-emerald-700"}>
          {state.error ?? (state.ok ? state.message : "")}
        </p>
      </div>
    </form>
  );
}
