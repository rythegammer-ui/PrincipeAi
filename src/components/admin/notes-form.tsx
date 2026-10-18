"use client";

import { useActionState, useId } from "react";
import { saveContactNotesAction, type FormState } from "@/app/admin/(panel)/contacts/actions";
import { Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

/** Free-form notes pinned to the contact (separate from timeline notes). */
export function NotesForm({ contactId, notes }: { contactId: string; notes: string | null }) {
  const [state, action] = useActionState<FormState, FormData>(saveContactNotesAction, {});
  const id = useId();
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={contactId} />
      <label htmlFor={id} className="sr-only">
        Notes
      </label>
      <Textarea
        id={id}
        name="notes"
        rows={4}
        maxLength={10000}
        placeholder="Context worth remembering: goals, budget, decision makers, preferences…"
        defaultValue={state.values?.notes ?? notes ?? ""}
      />
      <div className="flex items-center gap-3">
        <SubmitButton size="sm" variant="outline" pendingText="Saving…">
          Save notes
        </SubmitButton>
        <p aria-live="polite" className={state.error ? "text-xs font-medium text-red-600" : "text-xs text-emerald-700"}>
          {state.error ?? (state.ok ? state.message : "")}
        </p>
      </div>
    </form>
  );
}
