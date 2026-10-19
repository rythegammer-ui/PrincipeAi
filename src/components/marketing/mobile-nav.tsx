"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buttonVariants } from "@/components/ui/button";
import { useOverlay } from "@/components/ui/use-overlay";

export function MobileNav({ items }: { items: readonly { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  // Panel top = bottom edge of the sticky header (it sits lower while the announcement bar shows).
  const [top, setTop] = useState(64);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const header = () => toggleRef.current?.closest("header") ?? null;
  const measure = () => {
    const bottom = header()?.getBoundingClientRect().bottom;
    if (bottom !== undefined) setTop(Math.max(0, Math.round(bottom)));
  };

  const close = () => setOpen(false);

  useOverlay(open, {
    panel: panelRef,
    onClose: close,
    keep: header,
    returnFocus: () => toggleRef.current,
    closeOnMedia: "(min-width: 1024px)", // lg: the desktop nav takes over
  });

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      const bottom = toggleRef.current?.closest("header")?.getBoundingClientRect().bottom;
      if (bottom !== undefined) setTop(Math.max(0, Math.round(bottom)));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        onClick={() => {
          if (!open) measure();
          setOpen((o) => !o);
        }}
        className="inline-flex size-11 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {/* Portaled to <body>: the header's backdrop-filter would otherwise clip this fixed panel to the header. */}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id="mobile-menu"
            style={{ top }}
            className="fixed inset-x-0 bottom-0 z-50 overflow-y-auto border-t border-zinc-200 bg-white px-4 pt-4 pb-8 lg:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {items.map((item) => (
                <Link key={item.href} href={item.href} onClick={close} className="rounded-xl px-3 py-3 text-base font-medium text-zinc-800 hover:bg-zinc-50">
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link href="/book" onClick={close} className={buttonVariants({ size: "lg", className: "mt-6 w-full" })}>
              Book a free call
            </Link>
          </div>,
          document.body,
        )}
    </div>
  );
}
