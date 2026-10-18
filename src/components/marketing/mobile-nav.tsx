"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";

export function MobileNav({ items }: { items: readonly { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-10 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-zinc-200 bg-white px-4 pt-4 pb-8">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {items.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-medium text-zinc-800 hover:bg-zinc-50">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/book" onClick={() => setOpen(false)} className={buttonVariants({ size: "lg", className: "mt-6 w-full" })}>
            Book a free call
          </Link>
        </div>
      )}
    </div>
  );
}
