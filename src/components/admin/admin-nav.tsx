"use client";

import {
  CalendarDays,
  CheckSquare,
  Clock,
  ExternalLink,
  Filter,
  GraduationCap,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Receipt,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { adminLogoutAction } from "@/app/admin/login/actions";
import { useOverlay } from "@/components/ui/use-overlay";
import { adminNav, type AdminIconName } from "@/config/site";
import { cn } from "@/lib/utils";

const ICONS: Record<AdminIconName, LucideIcon> = {
  LayoutDashboard,
  Users,
  KanbanSquare,
  CheckSquare,
  CalendarDays,
  Clock,
  Filter,
  Mail,
  MessageSquare,
  GraduationCap,
  Receipt,
  Inbox,
  Settings,
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {adminNav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            <Icon className={cn("size-4", active ? "text-gold-300" : "")} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebarNav() {
  return <NavLinks />;
}

/** Below lg: menu button + full-height drawer (with the account controls the hidden sidebar holds). */
export function AdminMobileNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const openRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useOverlay(open, {
    panel: panelRef,
    onClose: close,
    initialFocus: () => closeRef.current,
    returnFocus: () => openRef.current,
    closeOnMedia: "(min-width: 1024px)", // lg: the sidebar takes over
  });

  return (
    <div className="lg:hidden">
      <button
        ref={openRef}
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
      >
        <Menu className="size-5" />
      </button>
      {/* Portaled to <body>: the sticky header's backdrop-filter would otherwise confine this fixed overlay to the header. */}
      {open &&
        createPortal(
          <div ref={panelRef} className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              className="relative flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-ink p-4"
            >
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="inline-flex size-11 items-center justify-center self-end rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </button>
              <NavLinks onNavigate={close} />
              <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-400">
                <p className="truncate font-medium text-zinc-200">{email}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <Link href="/" target="_blank" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 hover:text-white">
                    View site <ExternalLink className="size-3.5" aria-hidden />
                  </Link>
                  <form action={adminLogoutAction}>
                    <button type="submit" className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 hover:text-white">
                      <LogOut className="size-3.5" aria-hidden /> Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
