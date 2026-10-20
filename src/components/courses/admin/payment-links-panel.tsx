"use client";

import { ExternalLink, Link2, Loader2, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { syncPaymentLinksAction, type PaymentLinkSyncState } from "@/app/admin/(panel)/courses/actions";
import { CopyButton } from "@/components/marketing/copy-button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type PaymentLinkRow = {
  courseId: string;
  title: string;
  slug: string;
  price: string;
  /**
   * ready: selling at the current price · stale: made for an old price (sync) · missing: not created yet ·
   * off: unpublished or free · still-selling: unpublished or free, but its link hasn't been switched off yet (sync).
   */
  status: "ready" | "stale" | "missing" | "off" | "still-selling";
  stripeUrl: string | null;
  /** Absolute /buy/<slug> link: works anywhere and always points at the current Stripe link. */
  buyUrl: string;
};

const STATUS: Record<PaymentLinkRow["status"], { label: string; tone: "green" | "amber" | "neutral" }> = {
  ready: { label: "Live", tone: "green" },
  stale: { label: "Price changed: sync", tone: "amber" },
  missing: { label: "Not created yet", tone: "amber" },
  off: { label: "Not for sale", tone: "neutral" },
  "still-selling": { label: "Still on sale in Stripe: sync", tone: "amber" },
};

/** Admin → Courses: each paid course's Stripe payment link, the email tag for it, and a "Sync with Stripe" button. */
export function PaymentLinksPanel({
  rows,
  stripe,
  mode,
  webhook,
  syncErrors,
}: {
  rows: PaymentLinkRow[];
  stripe: "connected" | "missing" | "blocked";
  mode: "test" | "live";
  webhook: "env" | "auto" | "missing";
  /** Problems from the last sync (on deploy, after a course change, or the daily check). */
  syncErrors: readonly string[];
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<PaymentLinkSyncState | null>(null);

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Link2 className="size-4 text-brand-600" aria-hidden /> Payment links
            {stripe === "connected" && <Badge tone={mode === "live" ? "green" : "blue"}>{mode === "live" ? "Live mode" : "Test mode"}</Badge>}
          </CardTitle>
          <CardDescription className="mt-1 max-w-2xl">
            A Stripe checkout link for every paid course. In any email (Automations or a contact email), write{" "}
            <code className="font-mono text-xs">{"{{buy_link:course-slug}}"}</code> and each reader gets a link with their email already filled in. Buyers are
            enrolled and emailed their access automatically. Links update on every deploy and when you change a course.
          </CardDescription>
        </div>
        {stripe === "connected" && (
          <Button
            variant="outline"
            className="h-11 shrink-0 self-start sm:h-10"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setResult(null);
                try {
                  setResult(await syncPaymentLinksAction());
                } catch {
                  setResult({ ok: false, error: "Couldn't reach the server. Check your connection and try again." });
                }
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />} Sync with Stripe
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* The one announcer for screen readers (the result Alert below is silent), so every sync is read out once. */}
        <p role="status" aria-live="polite" className="sr-only">
          {pending ? "Syncing with Stripe…" : result ? (result.ok ? result.message : result.error) : ""}
        </p>
        {stripe === "missing" && (
          <Alert tone="info">Connect Stripe (Settings → Integrations) to create payment links. Until then, the buy links below open each course&apos;s sales page.</Alert>
        )}
        {stripe === "blocked" && <Alert tone="info">Payments are turned off on this demo site, so no payment links are created.</Alert>}
        {stripe === "connected" && webhook === "missing" && (
          <Alert tone="warning">
            Stripe isn&apos;t sending payment notifications to this site yet. Click <strong>Sync with Stripe</strong> to set that up automatically, or add a
            webhook in Stripe (Settings → Integrations shows how). Until then, buyers are enrolled when they return to the site after paying, or by the
            daily check.
          </Alert>
        )}
        {!result && syncErrors.length > 0 && (
          <Alert tone="warning" title="The last sync with Stripe had problems. Click Sync with Stripe to try again.">
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs break-all">
              {syncErrors.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </Alert>
        )}
        {result && (
          <Alert tone={result.ok ? "success" : "error"} title={result.ok ? result.message : result.error} role="none">
            {result.details && result.details.length > 0 && (
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs break-all">
                {result.details.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No courses yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {rows.map((row) => {
              const status = STATUS[row.status];
              const tag = `{{buy_link:${row.slug}}}`;
              return (
                <li key={row.courseId} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-zinc-900">
                      {row.title} <span className="text-sm font-normal text-zinc-500 tabular-nums">{row.price}</span>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </p>
                    <p className="mt-1 font-mono text-xs break-all text-zinc-500">{row.status === "off" ? `/courses/${row.slug}` : tag}</p>
                    {row.stripeUrl && row.status === "ready" && <p className="mt-0.5 font-mono text-xs break-all text-zinc-400">{row.stripeUrl}</p>}
                  </div>
                  {row.status !== "off" && row.status !== "still-selling" && (
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <CopyButton text={tag} label="Copy email tag" className="min-h-11 sm:min-h-9" srLabel={`Copy email tag for ${row.title}`} />
                      <CopyButton text={row.buyUrl} label="Copy buy link" className="min-h-11 sm:min-h-9" srLabel={`Copy buy link for ${row.title}`} />
                      {row.stripeUrl && row.status === "ready" && (
                        <>
                          <CopyButton text={row.stripeUrl} label="Copy Stripe link" className="min-h-11 sm:min-h-9" srLabel={`Copy Stripe payment link for ${row.title}`} />
                          <a
                            href={row.stripeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 sm:min-h-9 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 ring-inset hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                          >
                            <ExternalLink className="size-3.5" aria-hidden /> Open
                            <span className="sr-only"> Stripe checkout for {row.title} (opens in a new tab)</span>
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-zinc-500">
          The <strong>buy link</strong> (your site&apos;s /buy/… address) is best for emails and posts: it always opens the current checkout, even after a price change.
          The Stripe link is replaced when the price changes.
        </p>
      </CardContent>
    </Card>
  );
}
