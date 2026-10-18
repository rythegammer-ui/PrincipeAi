"use client";

import { Loader2, Square } from "lucide-react";
import { useState, useTransition } from "react";
import { stopEnrollmentAction } from "@/app/admin/(panel)/contacts/actions";

export function StopEnrollmentButton({ contactId, enrollmentId, sequenceName }: { contactId: string; enrollmentId: string; sequenceName: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await stopEnrollmentAction(contactId, enrollmentId);
            if (!res.ok) setError(res.error);
          })
        }
        aria-label={`Stop the “${sequenceName}” automation for this contact`}
        className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-brand-500 disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Square className="size-3" aria-hidden />} Stop
      </button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
