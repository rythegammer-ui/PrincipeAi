import { cn } from "@/lib/utils";
import { coverGradient } from "./course-utils";

/** Emoji cover art on a brand gradient (used until a course has a real image). */
export function CourseCover({
  emoji,
  audience,
  size = "md",
  className,
  children,
}: {
  emoji: string;
  audience: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-gradient-to-br", coverGradient(audience), className)}>
      <div className="bg-grid-dark absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="absolute -top-1/3 left-1/2 -z-10 size-2/3 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" aria-hidden />
      <div className="flex h-full w-full items-center justify-center">
        <span
          aria-hidden
          className={cn(
            "drop-shadow-[0_8px_24px_rgba(12,10,29,0.35)] select-none",
            size === "sm" && "text-3xl",
            size === "md" && "text-6xl",
            size === "lg" && "text-7xl sm:text-8xl",
          )}
        >
          {emoji || "✨"}
        </span>
      </div>
      {children}
    </div>
  );
}
