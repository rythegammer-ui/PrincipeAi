import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn, initials } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-12 text-center", className)}>
      {Icon && (
        <div className="flex size-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-soft ring-1 ring-zinc-200">
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <div className="max-w-sm">
        <p className="font-semibold text-zinc-900">{title}</p>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  /** e.g. { value: "+12%", positive: true } */
  trend?: { value: string; positive: boolean } | null;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        {Icon && <Icon className="size-4 text-zinc-400" aria-hidden />}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums">{value}</p>
      {(hint || trend) && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
          {trend && <span className={trend.positive ? "font-medium text-emerald-600" : "font-medium text-red-600"}>{trend.value}</span>}
          {hint}
        </p>
      )}
    </div>
  );
}

export function Avatar({ name, email, className }: { name?: string | null; email?: string | null; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white", className)}
    >
      {initials(name, email)}
    </span>
  );
}

export function Progress({ value, className, label = "Progress" }: { value: number; className?: string; /** Accessible name. */ label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-100", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-[width] duration-500" style={{ width: `${v}%` }} />
    </div>
  );
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", light ? "text-white" : "text-zinc-900", className)}>
      <span className="relative inline-flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white shadow-sm shadow-brand-900/30">
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
          <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z" />
          <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" opacity=".7" />
        </svg>
      </span>
      <span>
        Principe<span className={light ? "text-gold-300" : "text-brand-600"}> AI</span>
      </span>
    </span>
  );
}
