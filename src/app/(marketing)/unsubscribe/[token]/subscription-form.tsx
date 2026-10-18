"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { setSubscriptionAction, type UnsubscribeState } from "./actions";

/** One button that unsubscribes or resubscribes (POST via server action). */
export function SubscriptionForm({ token, intent }: { token: string; intent: "unsubscribe" | "resubscribe" }) {
  const [state, action] = useActionState<UnsubscribeState, FormData>(setSubscriptionAction, {});
  return (
    <form action={action} className="flex flex-col items-center gap-3">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="intent" value={intent} />
      {state.error && <Alert tone="error" className="w-full text-left">{state.error}</Alert>}
      {intent === "unsubscribe" ? (
        <SubmitButton size="lg" pendingText="Unsubscribing…" className="w-full sm:w-auto">
          Unsubscribe
        </SubmitButton>
      ) : (
        <SubmitButton variant="outline" pendingText="Resubscribing…" className="w-full sm:w-auto">
          Resubscribe
        </SubmitButton>
      )}
    </form>
  );
}
