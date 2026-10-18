"use client";

import { Loader2, Trash2, UserPlus } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { deleteSequenceAction, enrollContactAction, type FormState } from "@/app/admin/(panel)/sequences/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

/** Deletes an automation (and its emails + enrollments) after confirmation. */
export function DeleteSequenceButton({ sequenceId, name }: { sequenceId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="self-start border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Delete “${name}”? Its emails are deleted and everyone in it stops receiving them. This can't be undone.`)) return;
          startTransition(async () => {
            const res = await deleteSequenceAction(sequenceId);
            if (res && !res.ok) setError(res.error);
          });
        }}
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />} Delete automation
      </Button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Manually enroll someone (by email) in a manual-trigger automation. */
export function EnrollContactForm({ sequenceId }: { sequenceId: string }) {
  const [state, action] = useActionState<FormState, FormData>(enrollContactAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="sequenceId" value={sequenceId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
        <Field label="Email" htmlFor="enroll-email" error={fe.email} required>
          <Input
            id="enroll-email"
            name="email"
            type="email"
            autoComplete="off"
            required
            maxLength={254}
            placeholder="name@company.com"
            defaultValue={state.ok ? "" : state.values?.email}
            aria-invalid={Boolean(fe.email)}
          />
        </Field>
        <Field label="Name (optional)" htmlFor="enroll-name" error={fe.name}>
          <Input id="enroll-name" name="name" maxLength={120} defaultValue={state.ok ? "" : state.values?.name} aria-invalid={Boolean(fe.name)} />
        </Field>
        <div className="sm:pt-[1.625rem]">
          <SubmitButton pendingText="Enrolling…" className="h-11 w-full sm:w-auto">
            <UserPlus aria-hidden /> Enroll
          </SubmitButton>
        </div>
      </div>
      <p className="text-xs text-zinc-500">New email addresses are added to your contacts automatically. People who unsubscribed can&apos;t be enrolled.</p>
    </form>
  );
}
