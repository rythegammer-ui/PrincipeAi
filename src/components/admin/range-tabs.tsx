import Link from "next/link";
import { cn } from "@/lib/utils";

/** Segmented control of links (state lives in the URL). */
export function SegmentedLinks({ items, label, className }: { items: { href: string; label: string; active: boolean }[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("inline-flex rounded-xl border border-zinc-200 bg-white p-0.5 shadow-xs", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          scroll={false}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors",
            item.active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
