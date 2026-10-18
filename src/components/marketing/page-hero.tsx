import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Top-of-page hero for inner marketing pages (about, contact, consulting, legal…). */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  tone = "light",
  align = "left",
  className,
  aside,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** CTAs / extra content under the description. */
  children?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
  /** Optional right-hand column (form, visual). */
  aside?: ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <section className={cn("relative isolate overflow-hidden", dark ? "bg-ink text-white" : "border-b border-zinc-200/70 bg-white", className)}>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]",
          dark ? "bg-grid-dark" : "bg-grid",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute -top-48 left-1/2 -z-10 h-[30rem] w-[52rem] max-w-[150vw] -translate-x-1/2 rounded-full blur-[110px]",
          dark ? "bg-brand-600/35" : "bg-brand-400/20",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "container-page grid gap-12 py-16 sm:py-20 lg:py-24",
          aside ? "items-center lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16" : "",
        )}
      >
        <div className={cn("animate-fade-up", align === "center" && !aside ? "mx-auto max-w-3xl text-center" : "max-w-2xl")}>
          {eyebrow && <p className={cn("eyebrow", dark && "text-gold-300")}>{eyebrow}</p>}
          <h1
            className={cn(
              "mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]",
              dark ? "text-white" : "text-zinc-900",
            )}
          >
            {title}
          </h1>
          {description && (
            <p className={cn("mt-5 text-base leading-relaxed text-pretty sm:text-lg", dark ? "text-zinc-300" : "text-zinc-600")}>{description}</p>
          )}
          {children}
        </div>
        {aside && <div className="animate-fade-up [animation-delay:120ms]">{aside}</div>}
      </div>
    </section>
  );
}
