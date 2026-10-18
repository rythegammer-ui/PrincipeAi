"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteContactAction } from "@/app/admin/(panel)/contacts/actions";
import { Button } from "@/components/ui/button";

/** Two-step delete with a clear explanation of what is removed. */
export function DeleteContact({ contactId, label }: { contactId: string; label: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden /> Delete contact
      </Button>
    );
  }
  return (
    <div role="alertdialog" aria-labelledby="delete-contact-title" aria-describedby="delete-contact-desc" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/60 p-4">
      <p id="delete-contact-title" className="text-sm font-semibold text-red-900">
        Delete {label} permanently?
      </p>
      <p id="delete-contact-desc" className="text-sm text-red-900/80">
        This removes their timeline, tasks, bookings, assessment results and automation enrollments. Orders and email history are kept but unlinked. This can’t be undone.
      </p>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          autoFocus
          onClick={() =>
            startTransition(async () => {
              const res = await deleteContactAction(contactId);
              if (res && !res.ok) setError(res.error);
            })
          }
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />} Yes, delete
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
