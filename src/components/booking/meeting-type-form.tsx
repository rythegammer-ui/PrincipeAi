"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { deleteMeetingTypeAction, saveMeetingTypeAction, type SchedulingFormState } from "@/app/admin/(panel)/scheduling/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { cn, slugify } from "@/lib/utils";
import { MEETING_COLORS, MEETING_COLOR_NAMES } from "./meeting-colors";

export type MeetingTypeFormValues = {
  id: string;
  name: string;
  slug: string;
  description: string;
  durationMin: number;
  priceCents: number;
  locationLabel: string;
  locationUrl: string;
  bufferMin: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  questions: { id?: string; label: string; required: boolean }[];
  color: string;
  active: boolean;
  sortOrder: number;
};

type Question = { key: number; id?: string; label: string; required: boolean };

/**
 * Create / edit a meeting type. Inputs stay filled when the server returns validation errors.
 * `slugLocked`: the site's funnels link to this type's URL, so it can't be edited.
 */
export function MeetingTypeForm({ initial, slugLocked = false }: { initial: MeetingTypeFormValues; slugLocked?: boolean }) {
  const isNew = !initial.id;
  const [state, dispatch, pending] = useActionState<SchedulingFormState, FormData>(saveMeetingTypeAction, {});
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [color, setColor] = useState(initial.color in MEETING_COLORS ? initial.color : "violet");
  const [questions, setQuestions] = useState<Question[]>(() => initial.questions.map((q, i) => ({ ...q, key: i })));
  const [nextKey, setNextKey] = useState(initial.questions.length);
  const errors = state.fieldErrors ?? {};
  const effectiveSlug = slugLocked ? initial.slug : slugTouched ? slug : slugify(name);
  const slugHint = slugLocked ? (
    `Booking link: /book/${initial.slug}. The site's funnels (home page, consulting, assessment) link here, so this URL can't be changed.`
  ) : !isNew && effectiveSlug !== initial.slug ? (
    <span className="font-medium text-amber-700">
      New booking link: /book/{effectiveSlug || "…"}. Existing links to /book/{initial.slug} (emails, ads, shared posts) will stop working.
    </span>
  ) : (
    `Booking link: /book/${effectiveSlug || "…"}`
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  }

  const move = (index: number, delta: number) =>
    setQuestions((qs) => {
      const next = [...qs];
      const target = index + delta;
      if (target < 0 || target >= next.length) return qs;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={initial.id} />
      <input type="hidden" name="questions" value={JSON.stringify(questions.map(({ id, label, required }) => ({ id, label, required })))} />
      <input type="hidden" name="color" value={color} />

      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>What visitors see on your booking page.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="mt-name" required error={errors.name} className="sm:col-span-2">
            <Input id="mt-name" name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required placeholder="Free AI Strategy Call" />
          </Field>
          <Field label="URL" htmlFor="mt-slug" error={errors.slug} hint={slugHint} className="sm:col-span-2">
            <Input
              id="mt-slug"
              name="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              readOnly={slugLocked}
              aria-readonly={slugLocked || undefined}
              className={slugLocked ? "bg-zinc-50 text-zinc-600" : undefined}
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="ai-strategy-call"
            />
          </Field>
          <Field label="Description" htmlFor="mt-description" error={errors.description} className="sm:col-span-2">
            <Textarea
              id="mt-description"
              name="description"
              defaultValue={initial.description}
              maxLength={1000}
              rows={3}
              placeholder="What the session covers and who it's for."
            />
          </Field>
          <Field label="Duration (minutes)" htmlFor="mt-duration" required error={errors.durationMin}>
            <Input id="mt-duration" name="durationMin" type="number" inputMode="numeric" min={5} max={480} step={5} defaultValue={initial.durationMin} required />
          </Field>
          <Field label="Price (USD)" htmlFor="mt-price" error={errors.price} hint="0 = free. Paid sessions go through checkout before they're confirmed.">
            <Input
              id="mt-price"
              name="price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              defaultValue={(initial.priceCents / 100).toFixed(initial.priceCents % 100 ? 2 : 0)}
            />
          </Field>
          <Field label="Location label" htmlFor="mt-location-label" required error={errors.locationLabel} hint="Shown to invitees, e.g. Zoom or Google Meet.">
            <Input id="mt-location-label" name="locationLabel" defaultValue={initial.locationLabel} maxLength={80} required />
          </Field>
          <Field label="Meeting link (optional)" htmlFor="mt-location-url" error={errors.locationUrl} hint="Included in confirmation emails and invites.">
            <Input id="mt-location-url" name="locationUrl" type="url" defaultValue={initial.locationUrl} maxLength={500} placeholder="https://zoom.us/j/…" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduling rules</CardTitle>
          <CardDescription>Applied on top of your weekly hours and blocked dates.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Buffer (minutes)" htmlFor="mt-buffer" error={errors.bufferMin} hint="Free time kept before and after each meeting.">
            <Input id="mt-buffer" name="bufferMin" type="number" inputMode="numeric" min={0} max={240} step={5} defaultValue={initial.bufferMin} required />
          </Field>
          <Field label="Minimum notice (hours)" htmlFor="mt-notice" error={errors.minNoticeHours} hint="How far ahead people must book.">
            <Input id="mt-notice" name="minNoticeHours" type="number" inputMode="numeric" min={0} max={720} defaultValue={initial.minNoticeHours} required />
          </Field>
          <Field label="Booking window (days)" htmlFor="mt-window" error={errors.maxDaysAhead} hint="How far into the future people can book.">
            <Input id="mt-window" name="maxDaysAhead" type="number" inputMode="numeric" min={1} max={365} defaultValue={initial.maxDaysAhead} required />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intake questions</CardTitle>
          <CardDescription>Asked on the booking form after name, email and phone. Answers appear in Bookings and the contact timeline.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {questions.length === 0 && <p className="text-sm text-zinc-500">No extra questions. Invitees only share their contact details and optional notes.</p>}
          <ol className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <li key={q.key} className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 sm:flex-row sm:items-center">
                <span className="hidden w-5 text-center text-xs font-medium text-zinc-400 sm:block" aria-hidden>
                  {i + 1}
                </span>
                <Input
                  value={q.label}
                  onChange={(e) => setQuestions((qs) => qs.map((x) => (x.key === q.key ? { ...x, label: e.target.value } : x)))}
                  aria-label={`Question ${i + 1}`}
                  maxLength={200}
                  placeholder="e.g. What would you like to automate?"
                  className="h-10 flex-1"
                  required
                />
                <div className="flex items-center gap-1">
                  <label className="mr-2 flex min-h-10 items-center gap-2 text-sm text-zinc-700">
                    <Checkbox
                      checked={q.required}
                      onChange={(e) => setQuestions((qs) => qs.map((x) => (x.key === q.key ? { ...x, required: e.target.checked } : x)))}
                    />
                    Required
                  </label>
                  <Button variant="ghost" size="icon" className="size-10" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move question ${i + 1} up`}>
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10"
                    onClick={() => move(i, 1)}
                    disabled={i === questions.length - 1}
                    aria-label={`Move question ${i + 1} down`}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 text-red-600 hover:bg-red-50"
                    onClick={() => setQuestions((qs) => qs.filter((x) => x.key !== q.key))}
                    aria-label={`Remove question ${i + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          {errors.questions && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {errors.questions}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            disabled={questions.length >= 10}
            onClick={() => {
              setQuestions((qs) => [...qs, { key: nextKey, label: "", required: false }]);
              setNextKey((k) => k + 1);
            }}
          >
            <Plus aria-hidden /> Add question
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium text-zinc-800">Color</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {MEETING_COLOR_NAMES.map((c) => (
                <label
                  key={c}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500",
                    color === c ? "border-brand-500 bg-brand-50 text-brand-800" : "border-zinc-200 text-zinc-700 hover:border-zinc-300",
                  )}
                >
                  <input type="radio" name="colorChoice" value={c} checked={color === c} onChange={() => setColor(c)} className="sr-only" />
                  <span aria-hidden className={cn("size-3.5 rounded-full", MEETING_COLORS[c].dot)} />
                  {MEETING_COLORS[c].label}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Sort order" htmlFor="mt-sort" error={errors.sortOrder} hint="Lower numbers appear first on /book.">
            <Input id="mt-sort" name="sortOrder" type="number" inputMode="numeric" min={0} max={1000} defaultValue={initial.sortOrder} />
          </Field>
          <label className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 sm:self-end">
            <Checkbox name="active" defaultChecked={initial.active} className="mt-0.5" />
            <span className="text-sm">
              <span className="font-medium text-zinc-900">Active</span>
              <span className="block text-zinc-500">Show on the booking page and accept new bookings.</span>
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />} {isNew ? "Create meeting type" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

/** Delete (or hide, when it has bookings) a meeting type. */
export function DeleteMeetingType({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState<SchedulingFormState, FormData>(deleteMeetingTypeAction, {});
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.message && <Alert tone="info">{state.message}</Alert>}
      {confirming ? (
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <span className="text-sm text-zinc-700">Delete &ldquo;{name}&rdquo;?</span>
          <Button type="submit" variant="danger" size="sm" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />} Yes, delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
            Cancel
          </Button>
        </form>
      ) : (
        <Button variant="outline" size="sm" className="self-start text-red-700 hover:bg-red-50" onClick={() => setConfirming(true)}>
          <Trash2 aria-hidden /> Delete meeting type
        </Button>
      )}
    </div>
  );
}
