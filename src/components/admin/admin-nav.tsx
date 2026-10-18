"use client";

import {
  CalendarDays,
  CheckSquare,
  Clock,
  Filter,
  GraduationCap,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
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
import { useState } from "react";
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

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative flex w-72 flex-col gap-4 bg-ink p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="self-end rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </button>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
