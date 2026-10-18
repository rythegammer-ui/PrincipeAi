"use client";

import { Bell, Bot, Building2, CalendarClock, Megaphone, Save } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useActionState, type ReactNode } from "react";
import { updateSettingsAction, type SettingsFormState } from "@/app/admin/(panel)/settings/actions";
import { Alert } from "@/components/ui/alert";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Settings } from "@/lib/settings";

function Group({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: ReactNode }) {
  const id = `settings-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <fieldset aria-labelledby={id} className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <h2 id={id} className="font-semibold text-zinc-900">
            {title}
          </h2>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

function Toggle({ name, label, description, defaultChecked }: { name: string; label: string; description?: string; defaultChecked: boolean }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-1 py-1.5 hover:bg-zinc-50">
      <Checkbox name={name} defaultChecked={defaultChecked} className="mt-0.5" />
      <span className="text-sm">
        <span className="font-medium text-zinc-900">{label}</span>
        {description && <span className="block text-zinc-500">{description}</span>}
      </span>
    </label>
  );
}

/** Every admin-editable setting, grouped, saved in one go. */
export function SettingsForm({ settings, timezones }: { settings: Settings; timezones: { region: string; zones: string[] }[] }) {
  const [state, action] = useActionState<SettingsFormState, FormData>(updateSettingsAction, {});
  const v = state.values;
  const fe = state.fieldErrors ?? {};
  const text = (key: keyof Settings) => v?.[key] ?? String(settings[key] ?? "");
  const bool = (key: keyof Settings) => (v ? v[key] === "on" : Boolean(settings[key]));

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

      <Group icon={Building2} title="Business" description="How your business appears, and the timezone your calendar runs on.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Business name" htmlFor="s-businessName" error={fe.businessName} required>
            <Input id="s-businessName" name="businessName" defaultValue={text("businessName")} maxLength={80} required aria-invalid={Boolean(fe.businessName)} />
          </Field>
          <Field label="Timezone" htmlFor="s-timezone" error={fe.timezone} hint="Your availability hours are interpreted in this timezone." required>
            <Select id="s-timezone" name="timezone" defaultValue={text("timezone")} aria-invalid={Boolean(fe.timezone)}>
              {timezones.map((g) => (
                <optgroup key={g.region} label={g.region}>
                  {g.zones.map((z) => (
                    <option key={z} value={z}>
                      {z.replace(/_/g, " ")}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
        </div>
      </Group>

      <Group icon={Bell} title="Notifications" description="Get an email the moment something important happens.">
        <Field label="Send notifications to" htmlFor="s-notifyEmail" error={fe.notifyEmail} hint="Leave blank to turn all notifications off.">
          <Input id="s-notifyEmail" name="notifyEmail" type="email" defaultValue={text("notifyEmail")} maxLength={254} aria-invalid={Boolean(fe.notifyEmail)} />
        </Field>
        <div className="grid gap-1 sm:grid-cols-3">
          <Toggle name="notifyOnLead" label="New leads" description="Opt-ins, assessments, chats, forms" defaultChecked={bool("notifyOnLead")} />
          <Toggle name="notifyOnBooking" label="New bookings" description="Every call booked on your calendar" defaultChecked={bool("notifyOnBooking")} />
          <Toggle name="notifyOnPurchase" label="New purchases" description="Course and session payments" defaultChecked={bool("notifyOnPurchase")} />
        </div>
      </Group>

      <Group icon={Bot} title="AI assistant" description="The chat assistant on your website that answers questions and recommends next steps.">
        <Toggle name="aiAssistantEnabled" label="Show the AI assistant on the website" defaultChecked={bool("aiAssistantEnabled")} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Assistant name" htmlFor="s-aiAssistantName" error={fe.aiAssistantName} required>
            <Input id="s-aiAssistantName" name="aiAssistantName" defaultValue={text("aiAssistantName")} maxLength={60} aria-invalid={Boolean(fe.aiAssistantName)} />
          </Field>
          <Field label="Greeting" htmlFor="s-aiAssistantGreeting" error={fe.aiAssistantGreeting} hint="The first message visitors see." required>
            <Textarea
              id="s-aiAssistantGreeting"
              name="aiAssistantGreeting"
              defaultValue={text("aiAssistantGreeting")}
              maxLength={400}
              rows={3}
              className="min-h-20"
              aria-invalid={Boolean(fe.aiAssistantGreeting)}
            />
          </Field>
        </div>
        <Field
          label="Extra instructions"
          htmlFor="s-aiAssistantInstructions"
          error={fe.aiAssistantInstructions}
          hint="Optional. For example: mention this month's workshop, or always suggest the free assessment first."
        >
          <Textarea
            id="s-aiAssistantInstructions"
            name="aiAssistantInstructions"
            defaultValue={text("aiAssistantInstructions")}
            maxLength={4000}
            rows={4}
            aria-invalid={Boolean(fe.aiAssistantInstructions)}
          />
        </Field>
      </Group>

      <Group icon={Megaphone} title="Announcement bar" description="A slim banner across the top of every marketing page.">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <Field label="Announcement" htmlFor="s-announcement" error={fe.announcement} hint="Leave blank to hide the bar.">
            <Input id="s-announcement" name="announcement" defaultValue={text("announcement")} maxLength={160} aria-invalid={Boolean(fe.announcement)} />
          </Field>
          <Field label="Links to" htmlFor="s-announcementHref" error={fe.announcementHref} hint="A page like /assessment, or a full link.">
            <Input id="s-announcementHref" name="announcementHref" defaultValue={text("announcementHref")} maxLength={300} aria-invalid={Boolean(fe.announcementHref)} />
          </Field>
        </div>
      </Group>

      <Group icon={CalendarClock} title="Scheduling reminders" description="Automatic reminder emails before booked calls.">
        <Field
          label="Send reminders this many hours before a call"
          htmlFor="s-bookingReminderHours"
          error={fe.bookingReminderHours}
          hint="24 is a good default. Reminders go out on the next background run inside this window."
          required
        >
          <Input
            id="s-bookingReminderHours"
            name="bookingReminderHours"
            type="number"
            inputMode="numeric"
            min={1}
            max={336}
            step={1}
            defaultValue={text("bookingReminderHours")}
            className="max-w-40"
            aria-invalid={Boolean(fe.bookingReminderHours)}
          />
        </Field>
      </Group>

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 shadow-lift backdrop-blur">
        <SubmitButton pendingText="Saving…">
          <Save aria-hidden /> Save settings
        </SubmitButton>
        <p className="text-xs text-zinc-500">Changes apply across the site immediately.</p>
      </div>
    </form>
  );
}
