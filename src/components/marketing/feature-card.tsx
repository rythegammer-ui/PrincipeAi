import { CheckCircle2, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Icon + title + body card used in outcome / service grids. */
export function FeatureCard({
  icon: Icon,
  title,
  children,
  tone = "light",
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "group relative flex h-full gap-4 rounded-2xl p-5 transition-all duration-200 sm:flex-col sm:gap-0 sm:p-6",
        dark
          ? "bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.07]"
          : "border border-zinc-200/80 bg-white shadow-soft hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          dark ? "bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/20" : "bg-brand-50 text-brand-600 ring-1 ring-brand-100",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <h3 className={cn("text-base font-semibold tracking-tight sm:mt-5", dark ? "text-white" : "text-zinc-900")}>{title}</h3>
        <div className={cn("mt-1.5 text-sm leading-relaxed sm:mt-2", dark ? "text-zinc-400" : "text-zinc-600")}>{children}</div>
      </div>
    </div>
  );
}

/** Bulleted list with check icons. */
export function CheckList({
  items,
  tone = "light",
  className,
  iconClassName,
}: {
  items: readonly ReactNode[];
  tone?: "light" | "dark";
  className?: string;
  iconClassName?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, i) => (
        <li key={i} className={cn("flex gap-3 text-sm leading-relaxed sm:text-[0.9375rem]", tone === "dark" ? "text-zinc-300" : "text-zinc-700")}>
          <CheckCircle2 className={cn("mt-0.5 size-[1.125rem] shrink-0", tone === "dark" ? "text-gold-300" : "text-brand-600", iconClassName)} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
