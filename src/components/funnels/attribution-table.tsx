"use client";

import { useState } from "react";
import { sourceLabel, utmSourceLabel } from "@/components/admin/crm-utils";
import { cn, formatMoney } from "@/lib/utils";

export type AttributionRowData = { key: string; leads: number; bookedCalls: number; customers: number; revenueCents: number };

const fmt = (n: number) => n.toLocaleString("en-US");

/** First-touch attribution, switchable between signup path (contacts.source) and channel (UTM source). */
export function AttributionTable({
  bySource,
  byChannel,
  totals,
}: {
  bySource: AttributionRowData[];
  byChannel: AttributionRowData[];
  totals: Omit<AttributionRowData, "key">;
}) {
  const [view, setView] = useState<"source" | "channel">("source");
  const rows = view === "source" ? bySource : byChannel;
  const label = view === "source" ? sourceLabel : utmSourceLabel;
  const maxRevenue = Math.max(0, ...rows.map((r) => r.revenueCents));

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex self-start rounded-lg border border-zinc-200 bg-white p-0.5" role="group" aria-label="Group by">
        {(
          [
            { id: "source", label: "Signup path" },
            { id: "channel", label: "Channel (UTM source)" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={view === t.id}
            onClick={() => setView(t.id)}
            className={cn("h-8 rounded-md px-2.5 text-xs font-medium transition-colors", view === t.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
          No new leads, bookings or sales in this period yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">
              Leads, booked calls, customers and revenue by first-touch {view === "source" ? "signup path" : "marketing channel"}
            </caption>
            <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs text-zinc-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium tracking-wide">
                  {view === "source" ? "Signup path" : "Channel"}
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium tracking-wide">
                  Leads
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium tracking-wide">
                  Booked calls
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium tracking-wide">
                  Customers
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium tracking-wide">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 tabular-nums">
              {rows.map((r) => (
                <tr key={r.key} className="hover:bg-zinc-50/70">
                  <th scope="row" className="px-4 py-2.5 font-medium text-zinc-900">
                    {label(r.key === "unknown" ? null : r.key)}
                  </th>
                  <td className="px-4 py-2.5 text-right text-zinc-700">{fmt(r.leads)}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-700">{fmt(r.bookedCalls)}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-700">{fmt(r.customers)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="inline-flex items-center justify-end gap-2">
                      <span aria-hidden className="hidden h-2 w-16 overflow-hidden rounded-r-[3px] bg-zinc-100 sm:inline-block">
                        <span className="block h-full rounded-r-[3px] bg-brand-600" style={{ width: maxRevenue > 0 ? `${(r.revenueCents / maxRevenue) * 100}%` : 0 }} />
                      </span>
                      <span className="font-medium text-zinc-900">{formatMoney(r.revenueCents)}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-zinc-200 bg-zinc-50/60 tabular-nums">
              <tr>
                <th scope="row" className="px-4 py-2.5 font-semibold text-zinc-900">
                  Total
                </th>
                <td className="px-4 py-2.5 text-right font-semibold text-zinc-900">{fmt(totals.leads)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-zinc-900">{fmt(totals.bookedCalls)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-zinc-900">{fmt(totals.customers)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-zinc-900">{formatMoney(totals.revenueCents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
