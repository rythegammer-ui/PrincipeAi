"use client";

import { CalendarClock, CreditCard, Loader2 } from "lucide-react";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { pendingPaymentAction, type ManageBookingState } from "@/app/(marketing)/booking/[token]/actions";
import { Alert } from "@/components/ui/alert";
import { Button, type ButtonVariant } from "@/components/ui/button";

/**
 * Actions for a held, unpaid booking (the invitee left checkout without paying): go back to
 * checkout, or release the hold and pick another time. `children` adds more buttons to the row.
 */
export function PendingPaymentActions({ token, priceLabel, children }: { token: string; priceLabel?: string; children?: ReactNode }) {
  const [state, action] = useActionState<ManageBookingState, FormData>(pendingPaymentAction, {});
  return (
    <div className="flex flex-col gap-3">
      {state.error && (
        <Alert tone="error">{state.error}</Alert>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <form action={action} className="contents">
          <input type="hidden" name="token" value={token} />
          <IntentButton intent="pay" pendingText="Opening checkout…">
            <CreditCard aria-hidden /> Complete payment{priceLabel ? ` (${priceLabel})` : ""}
          </IntentButton>
          <IntentButton intent="change" variant="outline" pendingText="Releasing this time…">
            <CalendarClock aria-hidden /> Choose a different time
          </IntentButton>
        </form>
        {children}
      </div>
    </div>
  );
}

function IntentButton({ intent, variant, pendingText, children }: { intent: "pay" | "change"; variant?: ButtonVariant; pendingText: string; children: ReactNode }) {
  const { pending, data } = useFormStatus();
  const mine = pending && data?.get("intent") === intent;
  return (
    <Button type="submit" name="intent" value={intent} size="lg" variant={variant} disabled={pending} aria-busy={mine}>
      {mine ? (
        <>
          <Loader2 className="animate-spin" aria-hidden /> {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
