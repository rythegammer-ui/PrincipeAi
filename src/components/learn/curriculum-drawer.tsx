"use client";

import { ChevronDown, ListTree } from "lucide-react";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * On large screens the curriculum is always visible in the sidebar. On small screens it collapses
 * behind a toggle so the lesson comes first; it closes again after navigating to another lesson.
 */
export function CurriculumDrawer({ summary, children }: { summary: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  // Remember which page the drawer was opened on, so navigating to another lesson closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const panelId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenOn(open ? null : pathname)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50 lg:hidden"
      >
        <ListTree className="size-4 shrink-0 text-brand-600" aria-hidden />
        <span className="min-w-0 flex-1">{summary}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-zinc-400 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <div id={panelId} className={cn(open ? "block" : "hidden", "border-t border-zinc-100 lg:block lg:border-t-0")}>
        {children}
      </div>
    </>
  );
}
