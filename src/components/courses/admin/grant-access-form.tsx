"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";
import { grantAccessAction, type FormState } from "@/app/admin/(panel)/courses/actions";
import { Alert } from "@/components/ui/alert";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

/** Give someone access to a course without payment (comps, partners, offline sales). */
export function GrantAccessForm({ courseId }: { courseId: string }) {
  const [state, action] = useActionState<FormState, FormData>(grantAccessAction, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="courseId" value={courseId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="grant-email" error={fe.email} required>
          <Input id="grant-email" name="email" type="email" autoComplete="off" placeholder="student@example.com" aria-invalid={fe.email ? true : undefined} />
        </Field>
        <Field label="Name" htmlFor="grant-name" error={fe.name}>
          <Input id="grant-name" name="name" autoComplete="off" placeholder="Optional" maxLength={120} />
        </Field>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-zinc-700">
        <Checkbox name="sendEmail" defaultChecked />
        Email them a one-click sign-in link
      </label>
      <div>
        <SubmitButton pendingText="Granting access…">
          <UserPlus aria-hidden /> Grant access
        </SubmitButton>
      </div>
    </form>
  );
}
