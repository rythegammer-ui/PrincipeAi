"use client";

import type { ComponentProps } from "react";
import { SubmitButton } from "@/components/ui/submit-button";

/** Submit button that asks for confirmation first (for destructive admin actions). */
export function ConfirmSubmit({ confirmMessage, ...props }: ComponentProps<typeof SubmitButton> & { confirmMessage: string }) {
  return (
    <SubmitButton
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    />
  );
}
