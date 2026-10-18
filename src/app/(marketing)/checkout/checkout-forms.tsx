"use client";

import { ArrowRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { claimCourseAccessAction, completeTestPurchaseAction, type CheckoutActionState } from "./actions";

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

export function ClaimAccessForm({ orderId, sessionId, loginHref }: { orderId: string; sessionId: string; loginHref: string }) {
  const [state, action] = useActionState<CheckoutActionState, FormData>(claimCourseAccessAction, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="sessionId" value={sessionId} />
      {state.error && (
        <Alert tone="warning">
          {state.error}{" "}
          <Link href={loginHref} className="font-medium underline">
            Sign in
          </Link>
        </Alert>
      )}
      <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Opening your course…">
        Start learning <ArrowRight aria-hidden />
      </SubmitButton>
    </form>
  );
}
