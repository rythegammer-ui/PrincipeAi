"use client";

import { Check, Loader2, UserX, X } from "lucide-react";
import { useActionState, useState } from "react";
import { adminCancelBookingAction, markBookingOutcomeAction, type AdminBookingState } from "@/app/admin/(panel)/bookings/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/** Outcome buttons for bookings that have started (completed / no-show). */
export function OutcomeActions({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState<AdminBookingState, FormData>(markBookingOutcomeAction, {});
  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <form action={action} className="flex flex-wrap gap-1.5">
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          name="outcome"
          value="completed"
          size="sm"
          variant={status === "completed" ? "secondary" : "outline"}
          aria-pressed={status === "completed"}
          disabled={pending}
          className={cn("h-9 sm:h-8", status === "completed" && "ring-1 ring-brand-300")}
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />} Completed
        </Button>
        <Button
          type="submit"
          name="outcome"
          value="no_show"
          size="sm"
          variant={status === "no_show" ? "secondary" : "outline"}
          aria-pressed={status === "no_show"}
          disabled={pending}
          className={cn("h-9 sm:h-8", status === "no_show" && "ring-1 ring-brand-300")}
        >
          <UserX aria-hidden /> No-show
        </Button>
      </form>
      {state.error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {state.error}
        </p>
      )}
    </div>
  );
}

/** Inline cancel control for upcoming bookings. */
export function CancelAction({ id, paid }: { id: string; paid: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdminBookingState, FormData>(adminCancelBookingAction, {});

  if (!open) {
    return (
      <Button size="sm" variant="ghost" className="h-9 text-red-700 hover:bg-red-50 hover:text-red-800 sm:h-8" onClick={() => setOpen(true)}>
        <X aria-hidden /> Cancel
      </Button>
    );
  }
  return (
    <form action={action} className="flex w-full flex-col gap-2 rounded-xl border border-red-200 bg-red-50/50 p-3 sm:w-72">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`cancel-reason-${id}`} className="text-xs font-medium text-zinc-700">
        Reason (shared with the invitee)
      </label>
      <Textarea id={`cancel-reason-${id}`} name="reason" rows={2} maxLength={1000} className="min-h-16 bg-white text-sm" />
      <label className="flex items-center gap-2 text-xs text-zinc-700">
        <Checkbox name="notify" defaultChecked /> Email the invitee a cancellation
      </label>
      {paid && <p className="text-xs text-amber-800">Paid session: refund the payment in Stripe if appropriate.</p>}
      {state.error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="danger" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />} Cancel booking
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Keep
        </Button>
      </div>
    </form>
  );
}
