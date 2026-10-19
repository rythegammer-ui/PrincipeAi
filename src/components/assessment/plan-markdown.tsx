import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

/**
 * Markdown for the action plan. The prompts live in fenced code blocks, so keep them readable:
 * `.prose-content` styles every <code> like inline code (light background), including code inside
 * <pre>, which makes block text invisible on the dark <pre> background. Reset that here and wrap
 * long prompt lines instead of scrolling sideways.
 */
export function PlanMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <Markdown
      untrusted
      className={cn(
        "prose-h2:mt-10 prose-h2:border-t prose-h2:border-zinc-100 prose-h2:pt-8 prose-h3:text-lg [&>h2:first-child]:mt-0 [&>h2:first-child]:border-0 [&>h2:first-child]:pt-0",
        "[&_pre]:rounded-xl [&_pre]:text-[13px] [&_pre]:leading-relaxed [&_pre]:whitespace-pre-wrap",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-zinc-100 [&_pre_code]:whitespace-pre-wrap",
        className,
      )}
    >
      {children}
    </Markdown>
  );
}
