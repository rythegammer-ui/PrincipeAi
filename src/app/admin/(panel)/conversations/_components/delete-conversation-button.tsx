"use client";

import { Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteConversationAction } from "../actions";

/** Permanently deletes a conversation after a confirmation prompt. */
export function DeleteConversationButton({ id }: { id: string }) {
  return (
    <form
      action={deleteConversationAction}
      onSubmit={(e) => {
        if (!window.confirm("Delete this conversation permanently? This can't be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="outline" size="sm" pendingText="Deleting…" className="w-full text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800">
        <Trash2 aria-hidden /> Delete conversation
      </SubmitButton>
    </form>
  );
}
