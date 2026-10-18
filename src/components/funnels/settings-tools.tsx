"use client";

import { CheckCircle2, Loader2, Play, Send, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { runJobsNowAction, sendTestEmailAction, type RunJobsResult, type TestEmailResult } from "@/app/admin/(panel)/settings/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { JOB_LABELS, type JobKey } from "@/components/funnels/automation-utils";

/** "Send test email" + "Run automations now" buttons with inline results. */
export function SettingsTools({ notifyEmail }: { notifyEmail: string }) {
  const [testPending, startTest] = useTransition();
  const [jobsPending, startJobs] = useTransition();
  const [test, setTest] = useState<TestEmailResult | null>(null);
  const [jobs, setJobs] = useState<RunJobsResult | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft">
        <div>
          <h3 className="font-semibold text-zinc-900">Send a test email</h3>
          <p className="text-sm text-zinc-500">Goes to {notifyEmail || "your admin email"}. Use it to confirm delivery after connecting Resend.</p>
        </div>
        <Button
          variant="outline"
          className="self-start"
          disabled={testPending}
          onClick={() =>
            startTest(async () => {
              try {
                setTest(await sendTestEmailAction());
              } catch {
                setTest({ ok: false, error: "Couldn't send the test. Check your connection and try again." });
              }
            })
          }
        >
          {testPending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} Send test email
        </Button>
        {test &&
          (test.ok ? (
            <Alert tone={test.status === "sent" ? "success" : "info"}>
              {test.status === "sent" ? (
                <>Sent to {test.to}. Check your inbox (and spam folder, the first time).</>
              ) : test.status === "simulated" ? (
                <>
                  Simulated: email delivery isn&apos;t connected, so the test was only recorded in the{" "}
                  <Link href="/admin/emails" className="font-medium underline">
                    Email Log
                  </Link>
                  .
                </>
              ) : (
                <>Skipped. That address is marked as unsubscribed.</>
              )}
            </Alert>
          ) : (
            <Alert tone="error">{test.error}</Alert>
          ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft">
        <div>
          <h3 className="font-semibold text-zinc-900">Run automations now</h3>
          <p className="text-sm text-zinc-500">Does everything the scheduled job does: sends due automation emails and reminders, and tidies up.</p>
        </div>
        <Button
          variant="outline"
          className="self-start"
          disabled={jobsPending}
          onClick={() =>
            startJobs(async () => {
              try {
                setJobs(await runJobsNowAction());
              } catch {
                setJobs({ ok: false, error: "Couldn't run the jobs. Check your connection and try again." });
              }
            })
          }
        >
          {jobsPending ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />} Run automations now
        </Button>
        {jobs &&
          (jobs.ok ? (
            <div role="status" className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-sm">
              <p className="mb-2 font-medium text-zinc-900">
                {jobs.summary.ok ? "All jobs finished" : "Finished with errors"} in {(jobs.summary.durationMs / 1000).toFixed(1)}s
              </p>
              <ul className="flex flex-col gap-1.5">
                {(Object.keys(JOB_LABELS) as JobKey[]).map((key) => {
                  const r = jobs.summary.jobs[key];
                  if (!r) return null;
                  return (
                    <li key={key} className="flex items-start gap-2">
                      {r.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden /> : <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />}
                      <span className="min-w-0 flex-1 text-zinc-700">
                        {JOB_LABELS[key]}
                        {!r.ok && <span className="block text-xs break-words text-red-700">Error: {r.error}</span>}
                      </span>
                      {r.ok && <span className="font-semibold text-zinc-900 tabular-nums">{r.count}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <Alert tone="error">{jobs.error}</Alert>
          ))}
      </div>
    </div>
  );
}
