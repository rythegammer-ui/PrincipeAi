import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  hrefFor,
  noun = "contacts",
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  hrefFor: (page: number) => string;
  noun?: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const linkCls = "inline-flex h-9 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-xs hover:bg-zinc-50";
  const disabledCls = "pointer-events-none opacity-40";
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 text-sm text-zinc-500 sm:flex-row">
      <p className="tabular-nums">
        Showing <span className="font-medium text-zinc-900">{from.toLocaleString()}</span>–<span className="font-medium text-zinc-900">{to.toLocaleString()}</span> of{" "}
        <span className="font-medium text-zinc-900">{total.toLocaleString()}</span> {noun}
      </p>
      <div className="flex items-center gap-2">
        <Link href={hrefFor(page - 1)} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={cn(linkCls, page <= 1 && disabledCls)}>
          <ChevronLeft className="size-4" aria-hidden /> Previous
        </Link>
        <span className="tabular-nums">
          Page {page} of {pageCount}
        </span>
        <Link href={hrefFor(page + 1)} aria-disabled={page >= pageCount} tabIndex={page >= pageCount ? -1 : undefined} className={cn(linkCls, page >= pageCount && disabledCls)}>
          Next <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
