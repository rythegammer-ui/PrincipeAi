"use client";

import { Loader2, Plus } from "lucide-react";
import { useActionState } from "react";
import { addBlockedDateAction, type SchedulingFormState } from "@/app/admin/(panel)/scheduling/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

/** Add a blocked date (vacation, holiday). The form resets after a successful submit. */
export function BlockedDateForm({ minDate }: { minDate: string }) {
  const [state, action, pending] = useActionState<SchedulingFormState, FormData>(addBlockedDateAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr] xl:grid-cols-1">
        <Field label="Date" htmlFor="blocked-date">
          <Input id="blocked-date" name="date" type="date" min={minDate} required className="h-10" />
        </Field>
        <Field label="Reason (optional)" htmlFor="blocked-reason">
          <Input id="blocked-reason" name="reason" maxLength={200} placeholder="e.g. Public holiday" className="h-10" />
        </Field>
      </div>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.message && <Alert tone={state.message.includes("Heads up") ? "warning" : "success"}>{state.message}</Alert>}
      <Button type="submit" variant="outline" size="sm" disabled={pending} className="self-start">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />} Block date
      </Button>
    </form>
  );
}
