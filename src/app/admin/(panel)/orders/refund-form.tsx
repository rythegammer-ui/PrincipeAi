"use client";

import { Undo2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { markOrderRefundedAction, type RefundState } from "./actions";

/** Inline "Mark refunded" control with an explicit confirm step. */
export function RefundOrderForm({ orderId, isCourse }: { orderId: string; isCourse: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<RefundState, FormData>(markOrderRefundedAction, {});

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-zinc-600">
        <Undo2 aria-hidden /> Mark refunded
      </Button>
    );
  }
  return (
    <form action={action} className="flex min-w-56 flex-col items-end gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-soft">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="w-full text-xs text-zinc-600">Records the refund here only — issue the money back in Stripe.</p>
      {isCourse && (
        <label className="flex w-full items-center gap-2 text-xs text-zinc-700">
          <Checkbox name="revokeAccess" defaultChecked /> Remove course access
        </label>
      )}
      <label className="sr-only" htmlFor={`reason-${orderId}`}>
        Reason
      </label>
      <input
        id={`reason-${orderId}`}
        name="reason"
        placeholder="Reason (optional)"
        maxLength={500}
        className="h-8 w-full rounded-lg border border-zinc-300 px-2.5 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:outline-none"
      />
      {state.error && (
        <p className="w-full text-xs font-medium text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex gap-1.5">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <SubmitButton variant="danger" size="sm" pendingText="Saving…">
          Confirm refund
        </SubmitButton>
      </div>
    </form>
  );
}
