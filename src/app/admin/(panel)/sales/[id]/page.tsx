import { desc, eq, inArray } from "drizzle-orm";
import { ArrowLeft, Banknote, Hourglass, Mail, MapPin, Phone, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";
import { CopyButton } from "@/components/marketing/copy-button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { StatCard } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb, schema } from "@/db";
import type { AgentCommission, CommissionKind } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { agentLinks, agentLocation } from "@/lib/sales/agents";
import { agentBalance, agentLedger, DISPUTE_HOLD_CAP, DISPUTE_NOTE, livePayments, monthlySales } from "@/lib/sales/commissions";
import { formatRate, standing } from "@/lib/sales/game";
import { EXPERIENCE_OPTIONS, HOURS_OPTIONS, optionLabel, PAYOUT_METHODS, stateName } from "@/lib/sales/options";
import { getSalesProgram } from "@/lib/sales/program";
import { getBusinessTimezone } from "@/lib/scheduling";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import {
  addAdjustmentAction,
  approveAgentAction,
  declineAgentAction,
  recordPayoutAction,
  saveAgentCodeAction,
  saveAgentNotesAction,
  setAgentStatusAction,
  voidCommissionAction,
} from "../actions";
import { ActionForm, ConfirmAction } from "../forms";
import { STATUS_META } from "../status";

type Params = { params: Promise<{ id: string }> };

const KIND_LABELS: Record<CommissionKind, string> = { sale: "Sale", bonus: "Bonus", clawback: "Taken back (refund)", adjustment: "Correction" };

/** A clawback, or the adjustment row a refund adds once its clawback was already paid out: money taken back for a sale. */
const kindLabel = (row: AgentCommission) => (row.kind === "adjustment" && row.orderId ? KIND_LABELS.clawback : KIND_LABELS[row.kind]);

async function loadAgent(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const db = await getDb();
  const [agent] = await db.select().from(schema.salesAgents).where(eq(schema.salesAgents.id, id)).limit(1);
  return agent ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await requireAdmin();
  const agent = await loadAgent((await params).id);
  return { title: agent ? `${agent.name} · Sales Team` : "Sales agent" };
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900">{children}</dd>
    </div>
  );
}

/** Recorded for a sale made while the agent was paused (lib/sales/commissions.ts recordAgentSale). */
const PAUSED_SALE_REASON = "Sold while your account was paused";

function rowStatus(row: AgentCommission, now: Date, tz: string, live: boolean): { label: string; tone: BadgeTone; detail?: string } {
  if (row.status === "void" && row.voidReason === PAUSED_SALE_REASON) return { label: "Sold while paused · no commission", tone: "neutral" };
  // A test payment on a site taking real payments: recorded, never owed or paid (see livePayments). One already paid
  // out (while the site ran on test keys) stays as paid.
  if (row.isTest && live && row.status === "held") return { label: "Test · never paid", tone: "neutral" };
  if (row.status === "paid" && row.isTest && live) return { label: "Paid (test)", tone: "neutral" };
  if (row.status === "paid" && row.voidedAt) return { label: "Paid, then refunded", tone: "red", detail: "Refunded after payout: see the take-back rows" };
  if (row.status === "paid" && row.amountCents < 0) return { label: "Taken back", tone: "neutral" };
  if (row.status === "paid") return { label: "Paid", tone: "green" };
  if (row.status === "void") return { label: "Cancelled", tone: "neutral", detail: row.voidReason ?? undefined };
  if (row.amountCents < 0) return { label: "Taken back from next payout", tone: "red" };
  if (row.note === DISPUTE_NOTE && row.availableAt.getTime() > now.getTime() - DISPUTE_HOLD_CAP * 86_400_000) {
    return { label: "On hold: payment disputed", tone: "red", detail: `Payable if the dispute is won, or automatically ${DISPUTE_HOLD_CAP} days after its usual date` };
  }
  if (row.availableAt > now) return { label: `Pending until ${formatDate(row.availableAt, {}, tz)}`, tone: "amber" };
  return { label: "Owed", tone: "brand" };
}

export default async function SalesAgentPage({ params }: Params) {
  await requireAdmin();
  const { id } = await params;
  const agent = await loadAgent(id);
  if (!agent) notFound();

  const db = await getDb();
  const now = new Date();
  const [tz, program, balance, ledger, payouts, customers, monthly] = await Promise.all([
    getBusinessTimezone(),
    getSalesProgram(),
    agentBalance(agent.id),
    agentLedger(agent.id, 200),
    db.select().from(schema.agentPayouts).where(eq(schema.agentPayouts.agentId, agent.id)).orderBy(desc(schema.agentPayouts.paidAt)).limit(50),
    db
      .select({
        contactId: schema.agentReferrals.contactId,
        source: schema.agentReferrals.source,
        since: schema.agentReferrals.createdAt,
        name: schema.contacts.name,
        email: schema.contacts.email,
      })
      .from(schema.agentReferrals)
      .innerJoin(schema.contacts, eq(schema.contacts.id, schema.agentReferrals.contactId))
      .where(eq(schema.agentReferrals.agentId, agent.id))
      .orderBy(desc(schema.agentReferrals.createdAt))
      .limit(50),
    monthlySales(agent.id, now),
  ]);
  const orderIds = [...new Set(ledger.map((r) => r.orderId).filter((v): v is string => Boolean(v)))];
  const orders = orderIds.length
    ? await db.select({ id: schema.orders.id, description: schema.orders.description }).from(schema.orders).where(inArray(schema.orders.id, orderIds))
    : [];
  const orderDescription = new Map(orders.map((o) => [o.id, o.description]));
  const level = standing(program.levels, monthly.thisMonth, monthly.lastMonth);
  const status = STATUS_META[agent.status];
  const links = agent.code ? agentLinks(agent.code) : null;
  const where = agentLocation(agent);
  const app = agent.application;
  const method = agent.payoutMethod ? optionLabel(PAYOUT_METHODS, agent.payoutMethod) : null;
  const live = livePayments();
  const disputed = balance.disputedCents > 0;

  return (
    <div>
      <Link href="/admin/sales" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 sm:min-h-0">
        <ArrowLeft className="size-4" aria-hidden /> Sales Team
      </Link>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900">
                {agent.name} <Badge tone={status.tone}>{status.label}</Badge>
              </h1>
              <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                <li className="flex min-w-0 items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
                  <a href={`mailto:${agent.email}`} className="truncate hover:text-brand-700 hover:underline">
                    {agent.email}
                  </a>
                </li>
                {agent.phone && (
                  <li className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-zinc-400" aria-hidden />
                    <a href={`tel:${agent.phone.replace(/[^+\d]/g, "")}`} className="hover:text-brand-700 hover:underline">
                      {agent.phone}
                    </a>
                  </li>
                )}
                {where && (
                  <li className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-zinc-400" aria-hidden />
                    {agent.city ? `${agent.city}, ` : ""}
                    {stateName(agent.state) ?? agent.state}
                  </li>
                )}
              </ul>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              {(agent.status === "applied" || agent.status === "paused") && (
                <ActionForm
                  action={approveAgentAction}
                  hidden={{ agentId: agent.id }}
                  submit={agent.status === "paused" ? "Resume" : "Approve"}
                  pendingText="Saving…"
                  size="sm"
                />
              )}
              {agent.status === "applied" && (
                <ConfirmAction
                  action={declineAgentAction}
                  hidden={{ agentId: agent.id }}
                  label="Decline"
                  confirmLabel="Decline application"
                  subject={agent.name}
                  variant="ghost"
                >
                  <label className="flex min-h-11 items-center gap-2 text-xs text-zinc-700 sm:min-h-0">
                    <Checkbox name="notify" defaultChecked /> Send them a polite email
                  </label>
                </ConfirmAction>
              )}
              {agent.status === "approved" && (
                <ConfirmAction
                  action={setAgentStatusAction}
                  hidden={{ agentId: agent.id, status: "paused" }}
                  label="Pause"
                  confirmLabel="Pause agent"
                  subject={agent.name}
                  confirmVariant="primary"
                  description="Their link stops earning on new sales until you resume them. Money they're owed stays owed. They'll get an email."
                />
              )}
              {(agent.status === "approved" || agent.status === "paused") && (
                <ConfirmAction
                  action={setAgentStatusAction}
                  hidden={{ agentId: agent.id, status: "removed" }}
                  label="Remove"
                  confirmLabel="Remove from team"
                  subject={agent.name}
                  variant="ghost"
                  description="Closes their agent account: their link stops earning and they lose dashboard access. Pay anything still owed first. They'll get an email."
                />
              )}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-zinc-100 pt-5 sm:grid-cols-3 lg:grid-cols-6">
            <Detail label="Applied">{formatDate(agent.createdAt, {}, tz)}</Detail>
            <Detail label="Approved">{agent.approvedAt ? formatDate(agent.approvedAt, {}, tz) : "—"}</Detail>
            <Detail label="Last reviewed by">{agent.reviewedBy ? `${agent.reviewedBy}${agent.reviewedAt ? `, ${formatDate(agent.reviewedAt, {}, tz)}` : ""}` : "—"}</Detail>
            <Detail label="Level this month">
              {level.level.name} · {formatRate(level.level.rateBps)}
            </Detail>
            <Detail label="Sales this / last month">
              <span className="tabular-nums">
                {monthly.thisMonth} / {monthly.lastMonth}
              </span>
            </Detail>
            <Detail label="Last sale">{agent.lastSaleAt ? formatDate(agent.lastSaleAt, {}, tz) : "—"}</Detail>
          </dl>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Owed now" value={formatMoney(balance.owedCents)} icon={Wallet} hint={`Minimum payout ${formatMoney(program.minPayoutCents)}`} />
        <StatCard
          label="On hold"
          value={formatMoney(balance.pendingCents)}
          icon={Hourglass}
          hint={
            balance.pendingCents === 0
              ? "Nothing on hold"
              : [disputed ? "Includes disputed sales" : null, balance.nextAvailableAt ? `Next becomes payable ${formatDate(balance.nextAvailableAt, {}, tz)}` : null]
                  .filter(Boolean)
                  .join(" · ") || "Waiting on the refund window"
          }
        />
        <StatCard label="Paid to date" value={formatMoney(balance.paidCents)} icon={Banknote} hint={`${formatMoney(balance.earnedCents)} earned in total`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Card id="payout">
            <CardHeader>
              <CardTitle>Record a payout</CardTitle>
              <CardDescription>
                Send the money yourself ({method ?? "no payout method on file yet"}
                {agent.payoutHandle ? `: ${agent.payoutHandle}` : ""}), then record it here. Everything owed now is marked paid and the agent gets an email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Stays mounted when nothing is owed, so the confirmation of the payout just recorded stays on screen. */}
              <ActionForm
                action={recordPayoutAction}
                // The amount shown: if more becomes owed (or is taken back) before the click, nothing is recorded.
                hidden={{ agentId: agent.id, expectedCents: String(Math.max(0, balance.owedCents)) }}
                submit={balance.owedCents > 0 ? `Mark ${formatMoney(balance.owedCents)} paid` : "Mark paid"}
                pendingText="Recording…"
                disabled={balance.owedCents <= 0}
              >
                {balance.owedCents <= 0 ? (
                  <p className="text-sm text-zinc-500">Nothing is owed right now.</p>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Paid with" htmlFor="payout-method">
                        <Input id="payout-method" name="method" maxLength={60} defaultValue={method ?? ""} placeholder="Venmo" />
                      </Field>
                      <Field label="Reference" htmlFor="payout-ref" hint="Transaction id or note from the payment app (optional).">
                        <Input id="payout-ref" name="reference" maxLength={200} />
                      </Field>
                    </div>
                    <Field label="Note (optional)" htmlFor="payout-note">
                      <Input id="payout-note" name="note" maxLength={500} />
                    </Field>
                  </>
                )}
              </ActionForm>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Earnings ledger</CardTitle>
              <CardDescription>Commissions, bonuses and corrections. A sale stays on hold for {program.holdDays} days so refunds come first.</CardDescription>
            </CardHeader>
            {ledger.length === 0 ? (
              <CardContent>
                <p className="text-sm text-zinc-500">No earnings yet.</p>
              </CardContent>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Date</TH>
                    <TH>What</TH>
                    <TH className="text-right">Sale</TH>
                    <TH className="text-right">Commission</TH>
                    <TH>Status</TH>
                  </tr>
                </THead>
                <TBody>
                  {ledger.map((row) => {
                    const st = rowStatus(row, now, tz, live);
                    const what = (row.orderId && orderDescription.get(row.orderId)) || row.note || kindLabel(row);
                    // A partial refund's note on a sale ("Partly refunded ($X)"); a dispute shows in the status instead.
                    const saleNote = row.kind !== "bonus" && row.orderId && row.note && row.note !== DISPUTE_NOTE ? row.note : null;
                    return (
                      <TR key={row.id}>
                        <TD className="whitespace-nowrap text-zinc-500">{formatDate(row.createdAt, {}, tz)}</TD>
                        <TD className="min-w-40">
                          <span className="text-xs font-medium text-zinc-500">{kindLabel(row)}</span>
                          <span className="line-clamp-2 block text-zinc-800">{what}</span>
                          {saleNote && <span className="block text-xs text-zinc-500">{saleNote}</span>}
                          {row.isTest && !live && <Badge tone="amber">Test</Badge>}
                        </TD>
                        <TD className="text-right whitespace-nowrap text-zinc-500 tabular-nums">
                          {row.saleCents ? formatMoney(row.saleCents, row.currency) : "—"}
                          {row.rateBps > 0 && (
                            <span className="block text-xs">
                              {formatRate(row.rateBps)}
                              {row.level ? ` · ${row.level}` : ""}
                            </span>
                          )}
                        </TD>
                        <TD className="text-right font-medium whitespace-nowrap tabular-nums">{formatMoney(row.amountCents, row.currency)}</TD>
                        <TD>
                          <Badge tone={st.tone}>{st.label}</Badge>
                          {st.detail && <span className="mt-0.5 block max-w-40 text-xs text-zinc-500">{st.detail}</span>}
                          {row.status === "held" && (
                            <div className="mt-1">
                              <ConfirmAction
                                action={voidCommissionAction}
                                hidden={{ id: row.id, agentId: agent.id }}
                                label="Cancel"
                                confirmLabel="Cancel entry"
                                subject={`${kindLabel(row)} of ${formatMoney(row.amountCents, row.currency)} on ${formatDate(row.createdAt, {}, tz)}`}
                                variant="ghost"
                                description="Removes this unpaid entry (e.g. a mistake). Refunds are handled automatically."
                              >
                                <label htmlFor={`void-${row.id}`} className="sr-only">
                                  Reason the agent sees (optional)
                                </label>
                                <Input
                                  id={`void-${row.id}`}
                                  name="reason"
                                  placeholder="Reason the agent sees (optional)"
                                  maxLength={150}
                                  className="h-11 text-xs sm:h-9"
                                />
                              </ConfirmAction>
                            </div>
                          )}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payouts</CardTitle>
            </CardHeader>
            {payouts.length === 0 ? (
              <CardContent>
                <p className="text-sm text-zinc-500">No payouts recorded yet.</p>
              </CardContent>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Date</TH>
                    <TH className="text-right">Amount</TH>
                    <TH>Method</TH>
                    <TH>Reference</TH>
                    <TH>Recorded by</TH>
                  </tr>
                </THead>
                <TBody>
                  {payouts.map((p) => (
                    <TR key={p.id}>
                      <TD className="whitespace-nowrap text-zinc-500">{formatDate(p.paidAt, {}, tz)}</TD>
                      <TD className="text-right font-medium tabular-nums">{formatMoney(p.amountCents, p.currency)}</TD>
                      <TD>{p.method ?? "—"}</TD>
                      <TD className="max-w-48 break-words text-zinc-600">
                        {p.reference ?? "—"}
                        {p.note && <span className="block text-xs text-zinc-500">{p.note}</span>}
                      </TD>
                      <TD className="text-xs text-zinc-500">{p.createdBy ?? "—"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Customers ({customers.length}
                {customers.length === 50 ? "+" : ""})
              </CardTitle>
              <CardDescription>
                People who signed up or bought through this agent&apos;s link (their purchases earn this agent commission for {program.attributionDays} days from
                then), and customers an admin assigned (until an admin changes it). Reassign a customer from their contact page.
              </CardDescription>
            </CardHeader>
            {customers.length === 0 ? (
              <CardContent>
                <p className="text-sm text-zinc-500">No customers yet.</p>
              </CardContent>
            ) : (
              <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
                {customers.map((cu) => (
                  <li key={cu.contactId} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <Link href={`/admin/contacts/${cu.contactId}`} className="min-w-0 truncate font-medium text-zinc-900 hover:text-brand-700">
                      {cu.name || cu.email}
                      {cu.name && <span className="ml-2 text-xs font-normal text-zinc-500">{cu.email}</span>}
                    </Link>
                    <span className="text-xs text-zinc-500">
                      {cu.source === "manual"
                        ? `Assigned ${formatDate(cu.since, {}, tz)} · until changed`
                        : (() => {
                            const ends = new Date(cu.since.getTime() + program.attributionDays * 86_400_000);
                            return `Via link ${formatDate(cu.since, {}, tz)} · ${ends > now ? `until ${formatDate(ends, {}, tz)}` : `lapsed ${formatDate(ends, {}, tz)}`}`;
                          })()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Referral code</CardTitle>
              <CardDescription>Changing it breaks links they&apos;ve already shared.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {links ? (
                <ul className="flex flex-col gap-2 text-xs">
                  {[
                    ["Short link", links.short],
                    ["Home page", links.home],
                    ["Courses", links.courses],
                  ].map(([label, url]) => (
                    <li key={label} className="flex flex-col gap-1">
                      <span className="font-medium text-zinc-500">{label}</span>
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 font-mono break-all text-zinc-800">{url}</span>
                        <CopyButton text={url} label="Copy" srLabel={`Copy ${label.toLowerCase()} link`} className="min-h-11 shrink-0 sm:min-h-8" />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">A code is created when you approve them.</p>
              )}
              {agent.code && (
                <ActionForm action={saveAgentCodeAction} hidden={{ agentId: agent.id }} submit="Change code" variant="outline" size="sm">
                  <Field label="Code" htmlFor="agent-code" hint="4–16 letters and digits, including at least one digit.">
                    <Input id="agent-code" name="code" defaultValue={agent.code} maxLength={16} pattern="[A-Za-z0-9]{4,16}" className="font-mono uppercase" required />
                  </Field>
                </ActionForm>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payout details</CardTitle>
              <CardDescription>The agent sets these in their dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3">
                <Detail label="Method">{method ?? "Not set"}</Detail>
                <Detail label="Account">{agent.payoutHandle ? <span className="break-all">{agent.payoutHandle}</span> : "Not set"}</Detail>
                <Detail label="On the leaderboard">{agent.showOnLeaderboard ? "Yes" : "No (opted out)"}</Detail>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bonus or correction</CardTitle>
              <CardDescription>Positive amounts are bonuses (the agent is emailed); negative ones reduce what they&apos;re owed. Payable straight away.</CardDescription>
            </CardHeader>
            <CardContent>
              <ActionForm action={addAdjustmentAction} hidden={{ agentId: agent.id }} submit="Add" variant="outline" size="sm">
                <Field label="Amount ($)" htmlFor="adj-amount" hint="e.g. 50 or -12.50">
                  <Input id="adj-amount" name="amount" inputMode="decimal" required maxLength={12} />
                </Field>
                <Field label="What it's for" htmlFor="adj-note" hint="The agent sees this.">
                  <Input id="adj-note" name="note" required minLength={3} maxLength={300} />
                </Field>
              </ActionForm>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3">
                <Detail label="Experience">{optionLabel(EXPERIENCE_OPTIONS, app.experience) || "—"}</Detail>
                <Detail label="Time available">{optionLabel(HOURS_OPTIONS, app.hours) || "—"}</Detail>
                <Detail label="How they'd find customers">
                  <span className="whitespace-pre-line">{app.channels || "—"}</span>
                </Detail>
                {app.why && (
                  <Detail label="Why they want to join">
                    <span className="whitespace-pre-line">{app.why}</span>
                  </Detail>
                )}
                {app.agreedAt && <Detail label="Agreed to the program terms">{formatDateTime(new Date(app.agreedAt), tz)}</Detail>}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Private notes</CardTitle>
              <CardDescription>Only admins see these.</CardDescription>
            </CardHeader>
            <CardContent>
              <ActionForm action={saveAgentNotesAction} hidden={{ agentId: agent.id }} submit="Save notes" variant="outline" size="sm">
                <label htmlFor="agent-notes" className="sr-only">
                  Notes
                </label>
                <Textarea id="agent-notes" name="notes" defaultValue={agent.notes ?? ""} maxLength={5000} rows={4} />
              </ActionForm>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
