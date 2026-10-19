"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";

/**
 * Shared behaviour for a menu or drawer that is portaled into `document.body` while open
 * (portaling escapes ancestors with `backdrop-filter`, which would otherwise become the
 * containing block of a `position: fixed` panel and clip it to the header):
 *
 * - locks page scroll,
 * - makes the rest of the page `inert` (except the panel and `keep`, e.g. the header holding
 *   the toggle), so Tab moves from the toggle straight into the panel and can't reach the page,
 * - closes on Escape, and when `closeOnMedia` starts matching (e.g. the desktop breakpoint where
 *   the panel is hidden, so the page isn't left scroll-locked and inert),
 * - focuses `initialFocus()` (or the first link/button in the panel) on open, and moves focus
 *   back to `returnFocus()` (the toggle) on close if it would otherwise be lost.
 */
export function useOverlay(
  open: boolean,
  opts: {
    panel: RefObject<HTMLElement | null>;
    onClose: () => void;
    keep?: () => Element | null | undefined;
    initialFocus?: () => HTMLElement | null | undefined;
    returnFocus?: () => HTMLElement | null | undefined;
    closeOnMedia?: string;
  },
) {
  const { panel } = opts;
  const close = useEffectEvent(() => opts.onClose());
  const keepEl = useEffectEvent(() => opts.keep?.() ?? null);
  const focusTarget = useEffectEvent(
    () => opts.initialFocus?.() ?? panel.current?.querySelector<HTMLElement>("a[href], button:not([disabled])") ?? null,
  );
  const returnTarget = useEffectEvent(() => opts.returnFocus?.() ?? null);
  const closeMedia = useEffectEvent(() => (opts.closeOnMedia ? window.matchMedia(opts.closeOnMedia) : null));

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const keep = keepEl();
    const made: HTMLElement[] = [];
    for (const el of Array.from(body.children)) {
      if (!(el instanceof HTMLElement) || el === panel.current || el.inert) continue;
      if (keep && el.contains(keep)) continue;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      el.inert = true;
      made.push(el);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    const media = closeMedia();
    const onMedia = () => {
      if (media?.matches) close();
    };
    media?.addEventListener("change", onMedia);
    focusTarget()?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      media?.removeEventListener("change", onMedia);
      for (const el of made) el.inert = false;
      body.style.overflow = prevOverflow;
      // The panel (and the focus inside it) is gone: hand focus back to the toggle.
      const active = document.activeElement;
      if (!active || active === body || !active.isConnected) returnTarget()?.focus();
    };
  }, [open, panel]);
}
