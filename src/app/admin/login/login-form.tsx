"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { adminLoginAction, requestAdminLinkAction, type LoginState, type TeamLinkState } from "./actions";

export function AdminLoginForm({ next, defaultEmail }: { next: string; defaultEmail?: string }) {
  const [state, action] = useActionState<LoginState, FormData>(adminLoginAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required defaultValue={defaultEmail} />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton size="lg" className="mt-2 w-full" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

/** "Team member?" sign-in: admins added in Admin → Team get a one-time link by email (no password). */
export function TeamLinkForm({ next }: { next: string }) {
  const [state, action] = useActionState<TeamLinkState, FormData>(requestAdminLinkAction, {});
  if (state.sent) {
    return (
      <div role="status" className="flex flex-col gap-2 text-sm text-zinc-600">
        <p>
          If <strong>{state.email}</strong> is on the admin team, a sign-in link is on its way. It expires in 30 minutes.
        </p>
        {state.devLink && (
          <Alert tone="info" title="Email isn't configured yet">
            For testing, use this link directly:{" "}
            <a href={state.devLink} className="font-medium break-all underline">
              Sign in now
            </a>
          </Alert>
        )}
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Your email" htmlFor="team-email">
        <Input id="team-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <SubmitButton variant="outline" className="w-full" pendingText="Sending link…">
        Email me a sign-in link
      </SubmitButton>
    </form>
  );
}
