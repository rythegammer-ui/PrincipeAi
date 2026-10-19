import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

/** Origins whose links stay clickable in untrusted Markdown (same values on server and client). */
function siteOrigins(): Set<string> {
  const origins = new Set<string>();
  for (const url of [process.env.NEXT_PUBLIC_SITE_URL, site.url]) {
    try {
      if (url) origins.add(new URL(url).origin);
    } catch {
      // ignore a malformed env value
    }
  }
  return origins;
}

/** True for relative links and absolute http(s) links to this site. */
export function isSiteLink(href: string | undefined): boolean {
  if (!href) return false;
  const origins = siteOrigins();
  const base = origins.values().next().value ?? "http://localhost";
  try {
    const url = new URL(href, base);
    return (url.protocol === "http:" || url.protocol === "https:") && origins.has(url.origin);
  } catch {
    return false;
  }
}

function textOf(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textOf).join("");
  return "";
}

/** react-markdown passes its AST `node` to custom components; keep it off the DOM element. */
function domProps<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

function BaseLink(allProps: React.ComponentProps<"a"> & { node?: unknown }) {
  const { href, children, ...props } = domProps(allProps);
  const external = href?.startsWith("http");
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...props}>
      {children}
    </a>
  );
}

const baseComponents: Components = {
  // Wide tables scroll sideways on phones instead of squashing their cells.
  table: (allProps) => {
    const { children, ...props } = domProps(allProps);
    return (
      <div className="not-prose my-6 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-left text-sm [&_td]:border-t [&_td]:border-zinc-100 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:bg-zinc-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:whitespace-nowrap" {...props}>
          {children}
        </table>
      </div>
    );
  },
  a: BaseLink,
};

/**
 * For text that may carry instructions from visitors (AI output, chat transcripts): no remote
 * images (a zero-click tracking/exfiltration channel) and no clickable links off this site
 * (the full URL is shown as text instead, so nothing hides behind a friendly label).
 */
const untrustedComponents: Components = {
  ...baseComponents,
  img: ({ alt }) => (alt ? <span>[{alt}]</span> : null),
  a: (props) => {
    const { href, children } = props;
    if (isSiteLink(href)) return <BaseLink {...props} />;
    const label = textOf(children);
    const shown = href?.replace(/^mailto:/, "");
    return (
      <span className="break-words">
        {children}
        {shown && label !== shown ? ` (${shown})` : null}
      </span>
    );
  },
};

/**
 * Safe Markdown renderer (raw HTML is NOT rendered). Use for lesson content,
 * AI-generated text, and email previews. Works in server and client components.
 * Pass `untrusted` for AI output and visitor-written text: images are dropped and
 * links that leave this site are shown as plain text.
 */
export function Markdown({ children, className, untrusted = false }: { children: string; className?: string; untrusted?: boolean }) {
  return (
    <div className={cn("prose-content", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={untrusted ? untrustedComponents : baseComponents}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
