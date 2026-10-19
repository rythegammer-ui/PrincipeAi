"use client";

import { FlaskConical, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { completeTestPurchaseAction, emailCourseAccessAction, type AccessLinkState, type CheckoutActionState } from "./actions";

export function TestPurchaseForm({ orderId, amountLabel }: { orderId: string; amountLabel: string }) {
  const [state, action] = useActionState<CheckoutActionState, FormData>(completeTestPurchaseAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <SubmitButton size="lg" variant="gold" className="w-full" pendingText="Completing test purchase…">
        <FlaskConical aria-hidden /> Complete test purchase · {amountLabel}
      </SubmitButton>
    </form>
  );
}

/** Success page: re-sends the buyer's one-click sign-in link to the email on the order. */
export function AccessLinkForm({ orderId, sessionId, loginHref }: { orderId: string; sessionId: string; loginHref: string }) {
  const [state, action] = useActionState<AccessLinkState, FormData>(emailCourseAccessAction, {});

  if (state.sent) {
    return (
      <Alert tone="success" title="Check your inbox" className="w-full text-left">
        A fresh sign-in link is on its way to <strong>{state.email}</strong>. It works once and expires in 30 minutes.
        {state.devLink && (
          <>
            {" "}
            Email isn&apos;t configured yet, so for testing you can{" "}
            <a href={state.devLink} className="font-medium break-all underline">
              sign in now
            </a>
            .
          </>
        )}
      </Alert>
    );
  }

  return (
    <form action={action} className="flex w-full flex-col items-center gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="sessionId" value={sessionId} />
      {state.error && (
        <Alert tone="warning" className="w-full text-left">
          {state.error}{" "}
          <Link href={loginHref} className="font-medium underline">
            Sign in
          </Link>
        </Alert>
      )}
      <SubmitButton size="lg" variant="outline" className="w-full sm:w-auto" pendingText="Sending your link…">
        <Mail aria-hidden /> Email me a new sign-in link
      </SubmitButton>
    </form>
  );
}
