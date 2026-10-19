"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort error page for failures in the root layout (or anything no nearer error.tsx catches).
 * It replaces the root layout, so it renders its own <html>/<body> and keeps to plain markup.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 antialiased">
        <title>Something went wrong · Principe AI</title>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center" role="alert">
          <p className="text-sm font-semibold tracking-tight text-brand-700">Principe AI</p>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Something went wrong</h1>
          <p className="text-zinc-600">
            The site hit an unexpected problem. It&apos;s usually temporary — please try again in a moment.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              Try again
            </button>
            {/* A full page load on purpose: the root layout (and with it client navigation) is what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              Back to home
            </a>
          </div>
          {digest && <p className="text-xs text-zinc-500">Reference: {digest}</p>}
        </main>
      </body>
    </html>
  );
}
