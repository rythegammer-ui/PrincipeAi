"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestAgentLinkAction, type AgentLinkState } from "../actions";

export function AgentLoginForm() {
  const [state, action] = useActionState<AgentLinkState, FormData>(requestAgentLinkAction, {});

  if (state.sent) {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold">Check your inbox</h2>
        <p className="text-sm text-zinc-600">
          If <strong>{state.email}</strong> is on the sales team, a sign-in link is on its way. It expires in 30 minutes.
        </p>
        {state.devLink && (
          <Alert tone="info" title="Email isn't configured yet" className="mt-2 text-left">
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
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Email address" htmlFor="agent-email" hint="Use the email you applied with.">
        <Input id="agent-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>
      <SubmitButton size="lg" className="w-full" pendingText="Sending link…">
        Email me a sign-in link
      </SubmitButton>
    </form>
  );
}
