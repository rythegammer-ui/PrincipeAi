"use client";

import { Loader2, RotateCw } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { resendEmailAction, type ResendResult } from "@/app/admin/(panel)/emails/actions";
import { EMAIL_STATUS_META } from "@/components/funnels/automation-utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** "Resend" for a failed email log entry. */
export function ResendButton({ emailId }: { emailId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ResendResult | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="primary"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              setResult(await resendEmailAction(emailId));
            } catch {
              setResult({ ok: false, error: "Couldn't resend. Check your connection and try again." });
            }
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <RotateCw aria-hidden />} Resend email
      </Button>
      {result &&
        (result.ok ? (
          <Alert tone={result.status === "failed" ? "error" : "success"}>
            {result.status === "failed" ? "The resend failed too. " : `Resent: ${EMAIL_STATUS_META[result.status].label.toLowerCase()}. `}
            <Link href="/admin/emails" className="font-medium underline">
              See it in the Email Log
            </Link>
          </Alert>
        ) : (
          <Alert tone="error">{result.error}</Alert>
        ))}
    </div>
  );
}
