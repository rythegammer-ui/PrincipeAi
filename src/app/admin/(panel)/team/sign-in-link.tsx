"use client";

import { Link2 } from "lucide-react";
import { useActionState } from "react";
import { CopyButton } from "@/components/marketing/copy-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { createSignInLinkAction, type SignInLinkState } from "./actions";

/** Owner only: makes a one-time sign-in link for a team member (for when email isn't set up) and shows it once. */
export function SignInLinkButton({ memberId, email }: { memberId: string; email: string }) {
  const [state, action] = useActionState<SignInLinkState, FormData>(createSignInLinkAction, {});
  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="memberId" value={memberId} />
        <SubmitButton variant="ghost" size="sm" className="min-h-11 sm:min-h-8" pendingText="Creating…">
          <Link2 aria-hidden /> {state.link ? "Create a new link" : "Create sign-in link"}
          <span className="sr-only"> for {email}</span>
        </SubmitButton>
      </form>
      {state.error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {state.error}
        </p>
      )}
      {state.link && (
        <div role="status" className="flex max-w-sm flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <span className="font-mono break-all">{state.link}</span>
          <CopyButton text={state.link} label="Copy link" srLabel={`Copy sign-in link for ${email}`} className="min-h-11 self-start sm:min-h-8" />
          <p>Works once, for 30 minutes. Send it to them privately — anyone with it can sign in as them.</p>
        </div>
      )}
    </div>
  );
}
