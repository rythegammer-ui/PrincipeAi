import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Safe Markdown renderer (raw HTML is NOT rendered). Use for lesson content,
 * AI-generated text, and email previews. Works in server and client components.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Wide tables scroll sideways on phones instead of squashing their cells.
          table: ({ children, ...props }) => (
            <div className="not-prose my-6 overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-sm [&_td]:border-t [&_td]:border-zinc-100 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:bg-zinc-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:whitespace-nowrap" {...props}>
                {children}
              </table>
            </div>
          ),
          a: ({ href, children, ...props }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
