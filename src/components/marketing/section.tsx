import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionTone = "white" | "muted" | "ink";

const tones: Record<SectionTone, string> = {
  white: "bg-white",
  muted: "bg-zinc-50",
  ink: "bg-ink text-white",
};

/** A full-width marketing band with consistent vertical rhythm. */
export function Section({
  tone = "white",
  id,
  labelledBy,
  className,
  containerClassName,
  narrow = false,
  children,
}: {
  tone?: SectionTone;
  id?: string;
  /** id of the heading that names this section (for landmarks). */
  labelledBy?: string;
  className?: string;
  containerClassName?: string;
  narrow?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("relative scroll-mt-20 py-20 sm:py-28", tones[tone], className)}>
      <div className={cn(narrow ? "container-narrow" : "container-page", "relative", containerClassName)}>{children}</div>
    </section>
  );
}

/** Eyebrow + title + supporting copy. Put a `font-display italic` <span> inside `title` for the accent word. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
  as: Tag = "h2",
  className,
}: {
  id?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  tone?: "light" | "dark";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("max-w-3xl", align === "center" ? "mx-auto text-center" : "text-left", className)}>
      {eyebrow && <p className={cn("eyebrow", dark && "text-gold-300")}>{eyebrow}</p>}
      <Tag
        id={id}
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
          dark ? "text-white" : "text-zinc-900",
        )}
      >
        {title}
      </Tag>
      {description && (
        <p className={cn("mt-4 text-base leading-relaxed text-pretty sm:text-lg", dark ? "text-zinc-300" : "text-zinc-600", align === "center" && "mx-auto max-w-2xl")}>
          {description}
        </p>
      )}
    </div>
  );
}

/** Instrument Serif italic accent used inside headlines. */
export function Accent({ children, tone = "brand", className }: { children: ReactNode; tone?: "brand" | "gold" | "gradient"; className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-[1.08em] font-normal whitespace-nowrap italic",
        tone === "brand" && "text-brand-700",
        tone === "gold" && "text-gold-300",
        tone === "gradient" && "text-gradient pr-1",
        className,
      )}
    >
      {children}
    </span>
  );
}
