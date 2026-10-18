"use client";

import { ArrowLeft, CalendarCheck2, Clock, Loader2, Lock } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { createBookingAction, type BookingFormState } from "@/app/(marketing)/book/[slug]/actions";
import { track } from "@/components/analytics/page-view-tracker";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { cn, formatMoney } from "@/lib/utils";
import { SlotPicker } from "./slot-picker";
import { dateKeyInZone, describeTimezone, formatDateKey, formatTime } from "./time";
import { useVisitorTimezone } from "./use-timezone";

export type BookingFlowMeetingType = {
  slug: string;
  name: string;
  durationMin: number;
  priceCents: number;
  locationLabel: string;
  questions: { id: string; label: string; required: boolean }[];
};

type Props = {
  meetingType: BookingFlowMeetingType;
  businessTimezone: string;
  initialMonth: string;
  minMonth: string;
  maxMonth: string;
  prefill: { name: string; email: string };
};

export function BookingFlow({ meetingType, businessTimezone, initialMonth, minMonth, maxMonth, prefill }: Props) {
  const { timezone, ready, setTimezone } = useVisitorTimezone(businessTimezone);
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [slot, setSlot] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({ name: prefill.name, email: prefill.email });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tracked = useRef(false);
  const moved = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    track("booking_viewed", { meetingType: meetingType.slug });
  }, [meetingType.slug]);

  // Move focus to the step heading when the step changes (not on first render).
  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  function goTo(next: "pick" | "details") {
    moved.current = true;
    setStep(next);
  }

  return (
    <div>
      <ol className="mb-6 flex items-center gap-2 text-xs font-medium text-zinc-500" aria-label="Booking steps">
        <StepPill n={1} label="Choose a time" active={step === "pick"} done={step === "details"} />
        <li aria-hidden className="h-px w-6 bg-zinc-200" />
        <StepPill n={2} label="Your details" active={step === "details"} done={false} />
      </ol>

      <h2 ref={headingRef} tabIndex={-1} className="mb-5 text-lg font-semibold tracking-tight text-zinc-900 outline-none sm:text-xl">
        {step === "pick" ? "Pick a day and time" : "Tell us a little about you"}
      </h2>

      {step === "pick" ? (
        <SlotPicker
          meetingTypeSlug={meetingType.slug}
          timezone={timezone}
          onTimezoneChange={setTimezone}
          timezoneReady={ready}
          initialMonth={initialMonth}
          minMonth={minMonth}
          maxMonth={maxMonth}
          selectedSlot={slot}
          reloadSignal={reload}
          onSelectSlot={(iso) => {
            setSlot(iso);
            goTo("details");
          }}
        />
      ) : (
        slot && (
          <DetailsForm
            meetingType={meetingType}
            slot={slot}
            timezone={timezone}
            values={values}
            onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
            onBack={() => goTo("pick")}
            onSlotTaken={() => {
              setSlot(null);
              setReload((n) => n + 1);
              goTo("pick");
            }}
          />
        )
      )}
    </div>
  );
}

function StepPill({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <li className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
          active ? "bg-brand-600 text-white" : done ? "bg-brand-100 text-brand-700" : "bg-zinc-100 text-zinc-500",
        )}
      >
        {n}
      </span>
      <span className={cn(active && "text-zinc-900")}>{label}</span>
    </li>
  );
}

function DetailsForm({
  meetingType,
  slot,
  timezone,
  values,
  onChange,
  onBack,
  onSlotTaken,
}: {
  meetingType: BookingFlowMeetingType;
  slot: string;
  timezone: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onBack: () => void;
  onSlotTaken: () => void;
}) {
  const [state, dispatch, pending] = useActionState<BookingFormState, FormData>(createBookingAction, {});
  const errors = state.fieldErrors ?? {};
  const paid = meetingType.priceCents > 0;
  const end = new Date(Date.parse(slot) + meetingType.durationMin * 60_000);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  }

  const field = (key: string) => ({
    id: `booking-${key}`,
    name: key,
    value: values[key] ?? "",
    onChange: (e: { target: { value: string } }) => onChange(key, e.target.value),
    "aria-invalid": errors[key] ? true : undefined,
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-soft ring-1 ring-brand-100">
            <CalendarCheck2 className="size-4" aria-hidden />
          </span>
          <div className="text-sm">
            <p className="font-semibold text-zinc-900">{formatDateKey(dateKeyInZone(slot, timezone), { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            <p className="text-zinc-600">
              {formatTime(slot, timezone)} – {formatTime(end, timezone)} · {describeTimezone(timezone, new Date(slot))}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onBack} className="self-start sm:self-center">
          <ArrowLeft /> Change time
        </Button>
      </div>

      {state.error && (
        <Alert tone="error" title={state.slotTaken ? "That time is no longer available" : undefined}>
          <p>{state.error}</p>
          {state.slotTaken && (
            <Button size="sm" variant="outline" className="mt-3" onClick={onSlotTaken}>
              Choose another time
            </Button>
          )}
        </Alert>
      )}

      <input type="hidden" name="type" value={meetingType.slug} />
      <input type="hidden" name="start" value={slot} />
      <input type="hidden" name="timezone" value={timezone} />
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="booking-website">Leave this field empty</label>
        <input id="booking-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="booking-name" required error={errors.name}>
          <Input {...field("name")} autoComplete="name" required maxLength={120} placeholder="Jane Smith" />
        </Field>
        <Field label="Email" htmlFor="booking-email" required error={errors.email} hint="Your confirmation and calendar invite go here.">
          <Input {...field("email")} type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" inputMode="email" />
        </Field>
      </div>
      <Field label="Phone (optional)" htmlFor="booking-phone" error={errors.phone} hint="Only used if we need to reach you about this meeting.">
        <Input {...field("phone")} type="tel" autoComplete="tel" maxLength={40} placeholder="+1 555 123 4567" />
      </Field>

      {meetingType.questions.map((q) => {
        const key = `q_${q.id}`;
        return (
          <Field key={q.id} label={q.label} htmlFor={`booking-${key}`} required={q.required} error={errors[key]}>
            <Textarea {...field(key)} required={q.required} maxLength={2000} rows={3} />
          </Field>
        );
      })}

      <Field label="Anything else we should know? (optional)" htmlFor="booking-notes" error={errors.notes}>
        <Textarea {...field("notes")} maxLength={2000} rows={3} placeholder="Links, tools you use, questions you'd like answered…" />
      </Field>

      <div className="flex flex-col gap-3 border-t border-zinc-100 pt-5">
        <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="w-full sm:w-auto sm:self-start">
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> {paid ? "Holding your time…" : "Booking…"}
            </>
          ) : paid ? (
            <>
              <Lock aria-hidden /> Continue to payment · {formatMoney(meetingType.priceCents)}
            </>
          ) : (
            <>
              <CalendarCheck2 aria-hidden /> Confirm booking
            </>
          )}
        </Button>
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-zinc-500">
          <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {paid
            ? "We'll hold this time for 30 minutes while you complete secure checkout. You can reschedule or cancel from your confirmation email."
            : "You'll get a confirmation email with a calendar invite, and you can reschedule or cancel anytime from that email."}
        </p>
      </div>
    </form>
  );
}
