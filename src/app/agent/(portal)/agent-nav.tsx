"use client";

import { Building2, LayoutDashboard, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/agent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agent/leads", label: "Leads", icon: Building2 },
  { href: "/agent/toolkit", label: "Toolkit", icon: Wrench },
] as const;

export function AgentNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Agent portal" className="flex items-center gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/agent" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors sm:px-3",
              active ? "bg-brand-50 text-brand-800" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="max-[399px]:sr-only">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
