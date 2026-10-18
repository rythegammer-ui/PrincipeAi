"use client";

import { ArrowLeft, CalendarClock, CalendarX2, Loader2 } from "lucide-react";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { cancelBookingAction, rescheduleBookingAction, type ManageBookingState } from "@/app/(marketing)/booking/[token]/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/form";
import { SlotPicker } from "./slot-picker";
import { dateKeyInZone, describeTimezone, formatDateKey, formatTime } from "./time";
import { useVisitorTimezone } from "./use-timezone";

type Props = {
  token: string;
  meetingTypeSlug: string;
  durationMin: number;
  bookingTimezone: string;
  currentStart: string;
  canReschedule: boolean;
  canCancel: boolean;
  initialMonth: string;
  minMonth: string;
  maxMonth: string;
};

function submitWith(dispatch: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
}

/** Reschedule / cancel controls on the public manage-booking page. */
export function ManageBooking(props: Props) {
  const [mode, setMode] = useState<"idle" | "reschedule" | "cancel">("idle");

  if (mode === "reschedule") return <Reschedule {...props} onClose={() => setMode("idle")} />;
  if (mode === "cancel") return <Cancel token={props.token} onClose={() => setMode("idle")} />;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {props.canReschedule && (
        <Button size="lg" onClick={() => setMode("reschedule")}>
          <CalendarClock aria-hidden /> Reschedule
        </Button>
      )}
      {props.canCancel && (
        <Button size="lg" variant="outline" onClick={() => setMode("cancel")}>
          <CalendarX2 aria-hidden /> Cancel booking
        </Button>
      )}
    </div>
  );
}

function Reschedule({ token, meetingTypeSlug, durationMin, bookingTimezone, currentStart, initialMonth, minMonth, maxMonth, onClose }: Props & { onClose: () => void }) {
  const { timezone, ready, setTimezone } = useVisitorTimezone(bookingTimezone);
  const [slot, setSlot] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [state, dispatch, pending] = useActionState<ManageBookingState, FormData>(async (prev, fd) => {
    const result = await rescheduleBookingAction(prev, fd);
    if (result.slotTaken) {
      setSlot(null);
      setReload((n) => n + 1);
    }
    return result;
  }, {});

  return (
    <section aria-labelledby="reschedule-heading" className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id="reschedule-heading" className="text-lg font-semibold tracking-tight text-zinc-900">
          Pick a new time
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft /> Back
        </Button>
      </div>
      {state.error && (
        <Alert tone="error" className="mb-5">
          {state.error}
        </Alert>
      )}
      {slot ? (
        <form onSubmit={submitWith(dispatch)} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="start" value={slot} />
          <input type="hidden" name="timezone" value={timezone} />
          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-sm">
            <p className="text-zinc-600">Your new time</p>
            <p className="mt-1 font-semibold text-zinc-900">
              {formatDateKey(dateKeyInZone(slot, timezone), { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            <p className="text-zinc-700">
              {formatTime(slot, timezone)} – {formatTime(Date.parse(slot) + durationMin * 60_000, timezone)} · {describeTimezone(timezone, new Date(slot))}
            </p>
          </div>
          <p className="text-sm text-zinc-600">We&apos;ll email you an updated calendar invite that replaces the old one.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <CalendarClock aria-hidden />}
              {pending ? "Updating…" : "Confirm new time"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => setSlot(null)} disabled={pending}>
              Choose a different time
            </Button>
          </div>
        </form>
      ) : (
        <SlotPicker
          meetingTypeSlug={meetingTypeSlug}
          timezone={timezone}
          onTimezoneChange={setTimezone}
          timezoneReady={ready}
          initialMonth={initialMonth}
          minMonth={minMonth}
          maxMonth={maxMonth}
          selectedSlot={slot}
          onSelectSlot={setSlot}
          rescheduleToken={token}
          currentSlot={currentStart}
          reloadSignal={reload}
        />
      )}
    </section>
  );
}

function Cancel({ token, onClose }: { token: string; onClose: () => void }) {
  const [state, dispatch, pending] = useActionState<ManageBookingState, FormData>(cancelBookingAction, {});
  return (
    <section aria-labelledby="cancel-heading" className="rounded-2xl border border-red-200 bg-white p-5 shadow-soft sm:p-8">
      <h2 id="cancel-heading" className="text-lg font-semibold tracking-tight text-zinc-900">
        Cancel this booking?
      </h2>
      <p className="mt-1 text-sm text-zinc-600">We&apos;ll let the team know and send you a cancellation for your calendar. You can always book again later.</p>
      {state.error && (
        <Alert tone="error" className="mt-4">
          {state.error}
        </Alert>
      )}
      <form onSubmit={submitWith(dispatch)} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <Field label="Reason (optional)" htmlFor="cancel-reason" hint="A quick note helps us improve. It's completely optional.">
          <Textarea id="cancel-reason" name="reason" maxLength={1000} rows={3} />
        </Field>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" variant="danger" size="lg" disabled={pending} aria-busy={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <CalendarX2 aria-hidden />}
            {pending ? "Cancelling…" : "Yes, cancel booking"}
          </Button>
          <Button variant="ghost" size="lg" onClick={onClose} disabled={pending}>
            Keep my booking
          </Button>
        </div>
      </form>
    </section>
  );
}
