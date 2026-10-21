import { desc } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { DateTime } from "luxon";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/misc";
import { getDb, schema } from "@/db";
import type { AgentChallenge } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { challengeScores, describeTarget } from "@/lib/sales/commissions";
import { getSalesProgram } from "@/lib/sales/program";
import { getBusinessTimezone } from "@/lib/scheduling";
import { formatDate, formatMoney, pluralize } from "@/lib/utils";
import { cancelChallengeAction, createChallengeAction, saveProgramAction } from "../actions";
import { ActionForm, ConfirmAction, LevelsEditor } from "../forms";

export const metadata: Metadata = { title: "Program & challenges · Sales Team" };

type Phase = "upcoming" | "live" | "ended" | "awarded" | "cancelled";
const PHASES: Record<Phase, { label: string; tone: BadgeTone }> = {
  upcoming: { label: "Upcoming", tone: "blue" },
  live: { label: "Live", tone: "green" },
  ended: { label: "Ended: awarding", tone: "amber" },
  awarded: { label: "Awarded", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

function phaseOf(ch: AgentChallenge, now: Date): Phase {
  if (ch.cancelledAt) return "cancelled";
  if (ch.awardedAt) return "awarded";
  if (now < ch.startsAt) return "upcoming";
  return now < ch.endsAt ? "live" : "ended";
}

export default async function SalesProgramPage() {
  await requireAdmin();
  const db = await getDb();
  const now = new Date();
  const [program, tz, challenges] = await Promise.all([
    getSalesProgram(),
    getBusinessTimezone(),
    db.select().from(schema.agentChallenges).orderBy(desc(schema.agentChallenges.startsAt)).limit(50),
  ]);
  const finishers = new Map<string, number>();
  for (const ch of challenges) {
    if (ch.cancelledAt) continue;
    const scores = await challengeScores(ch);
    finishers.set(ch.id, [...scores.values()].filter((s) => s >= ch.target).length);
  }
  const today = DateTime.fromJSDate(now, { zone: tz });

  return (
    <>
      <Link href="/admin/sales" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 sm:min-h-0">
        <ArrowLeft className="size-4" aria-hidden /> Sales Team
      </Link>
      <PageHeader title="Program & challenges" description="How agents earn, how long customers stay theirs, and the contests that keep things exciting." />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Commission program</CardTitle>
            <CardDescription>Changes apply to new sales. Commissions already earned keep the rate they were made at.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm action={saveProgramAction} submit="Save program" className="gap-5">
              <label className="flex min-h-11 items-start gap-3 text-sm text-zinc-800">
                <Checkbox name="applicationsOpen" defaultChecked={program.applicationsOpen} className="mt-0.5" />
                <span>
                  <span className="font-medium">Accept new applications</span>
                  <span className="block text-xs text-zinc-500">When off, the public sales-team page says applications are closed.</span>
                </span>
              </label>

              {/* Remounts with the saved levels after each save (the editor keeps its rows in state while you edit). */}
              <LevelsEditor key={JSON.stringify(program.levels)} levels={program.levels} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Hold period (days)"
                  htmlFor="holdDays"
                  hint="A sale's commission waits this long before you pay it, so a refund cancels it instead of you chasing the money back."
                >
                  <Input id="holdDays" name="holdDays" type="number" min={0} max={180} step={1} inputMode="numeric" defaultValue={program.holdDays} required />
                </Field>
                <Field
                  label="Customer window (days)"
                  htmlFor="attributionDays"
                  hint="A visitor's browser remembers an agent's link for 90 days. Once they sign up for the first time or buy through it, they're that agent's customer for this many days: their purchases in that time earn the agent commission."
                >
                  <Input
                    id="attributionDays"
                    name="attributionDays"
                    type="number"
                    min={1}
                    max={3650}
                    step={1}
                    inputMode="numeric"
                    defaultValue={program.attributionDays}
                    required
                  />
                </Field>
                <Field label="Minimum payout ($)" htmlFor="minPayout" hint="Agents are paid once they're owed at least this much. You can still pay any amount.">
                  <Input id="minPayout" name="minPayout" inputMode="decimal" defaultValue={(program.minPayoutCents / 100).toString()} maxLength={10} />
                </Field>
                <Field label="Payout schedule" htmlFor="payoutSchedule" hint="Shown to agents, e.g. “Twice a month, on the 1st and the 15th”.">
                  <Input id="payoutSchedule" name="payoutSchedule" defaultValue={program.payoutSchedule} maxLength={200} />
                </Field>
              </div>
            </ActionForm>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>New challenge</CardTitle>
              <CardDescription>
                Every agent who reaches the target between the start and end dates wins the bonus. Bonuses are awarded the day after it ends and paid after the
                hold period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActionForm action={createChallengeAction} submit="Create challenge" pendingText="Creating…">
                <Field label="Title" htmlFor="ch-title">
                  <Input id="ch-title" name="title" required minLength={3} maxLength={80} placeholder="November Sprint" />
                </Field>
                <Field label="Description (optional)" htmlFor="ch-desc">
                  <Textarea id="ch-desc" name="description" maxLength={1000} rows={2} placeholder="Make 5 sales this month and earn an extra $100." />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Goal" htmlFor="ch-metric">
                    <Select id="ch-metric" name="metric" defaultValue="sales">
                      <option value="sales">Number of sales</option>
                      <option value="revenue">Sales volume ($)</option>
                    </Select>
                  </Field>
                  <Field label="Target" htmlFor="ch-target" hint="Sales, or dollars for volume.">
                    <Input id="ch-target" name="target" inputMode="decimal" required maxLength={12} placeholder="5" />
                  </Field>
                  <Field label="Starts" htmlFor="ch-start">
                    <Input id="ch-start" name="startDate" type="date" required defaultValue={today.toISODate() ?? undefined} />
                  </Field>
                  <Field label="Ends (last day)" htmlFor="ch-end">
                    <Input id="ch-end" name="endDate" type="date" required defaultValue={today.endOf("month").toISODate() ?? undefined} />
                  </Field>
                </div>
                <Field label="Bonus per winner ($)" htmlFor="ch-bonus" hint="0 for bragging rights (and the Challenge Winner badge).">
                  <Input id="ch-bonus" name="bonus" inputMode="decimal" defaultValue="50" maxLength={10} />
                </Field>
                <p className="text-xs text-zinc-500">Dates are in your business time zone ({tz}).</p>
              </ActionForm>
            </CardContent>
          </Card>
        </div>
      </div>

      <section aria-labelledby="challenges" className="mt-8">
        <h2 id="challenges" className="mb-3 text-lg font-semibold text-zinc-900">
          Challenges
        </h2>
        {challenges.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-6 text-sm text-zinc-500">
            No challenges yet. A monthly challenge with a small cash bonus is a simple way to keep agents selling.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {challenges.map((ch) => {
              const phase = phaseOf(ch, now);
              const meta = PHASES[phase];
              const done = finishers.get(ch.id) ?? 0;
              return (
                <li key={ch.id}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex flex-wrap items-center gap-2">
                        {ch.title} <Badge tone={meta.tone}>{meta.label}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {formatDate(ch.startsAt, {}, tz)} – {formatDate(new Date(ch.endsAt.getTime() - 1), {}, tz)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm">
                      {ch.description && <p className="text-zinc-700">{ch.description}</p>}
                      <p className="text-zinc-600">
                        Target: <strong className="text-zinc-900">{describeTarget(ch)}</strong> · Bonus:{" "}
                        <strong className="text-zinc-900">{ch.bonusCents > 0 ? formatMoney(ch.bonusCents) : "badge only"}</strong>
                      </p>
                      {phase !== "cancelled" && phase !== "upcoming" && (
                        <p className="text-zinc-600">{done === 0 ? "Nobody has hit the target yet." : `${pluralize(done, "agent")} hit the target.`}</p>
                      )}
                      {!ch.awardedAt && !ch.cancelledAt && (
                        <div className="pt-1">
                          <ConfirmAction
                            action={cancelChallengeAction}
                            hidden={{ challengeId: ch.id }}
                            label="Cancel challenge"
                            confirmLabel="Yes, cancel it"
                            subject={ch.title}
                            variant="ghost"
                            description="Agents stop seeing it and nobody is awarded the bonus."
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
