import { ArrowRight, BookOpen, CalendarDays, Gauge, Gift, Home, Mail } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const LINKS = [
  { href: "/courses", label: "Browse courses", body: "Practical AI courses for life and business", icon: BookOpen },
  { href: "/assessment", label: "Free AI assessment", body: "Your readiness score and a personal plan", icon: Gauge },
  { href: "/free-guide", label: "Free AI Starter Kit", body: "A quick-start plan and copy-paste prompts", icon: Gift },
  { href: "/book", label: "Book a free call", body: "Talk it through with a real person", icon: CalendarDays },
];

/** Branded 404 body with helpful next steps (used by the root and marketing not-found files). */
export function NotFoundContent() {
  return (
    <div className="relative isolate overflow-hidden bg-white">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
      <div className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[30rem] w-[52rem] max-w-[150vw] -translate-x-1/2 rounded-full bg-brand-400/20 blur-[110px]" aria-hidden />
      <div className="container-narrow py-16 text-center sm:py-24">
        <p className="font-display text-8xl leading-none text-brand-700 italic sm:text-9xl">404</p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl">We couldn&apos;t find that page</h1>
        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-zinc-600">
          The link may be old, or the page may have moved. Here are some good places to pick things up again.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            <Home aria-hidden /> Back to home
          </Link>
          <Link href="/contact" className={buttonVariants({ variant: "outline", size: "lg" })}>
            <Mail aria-hidden /> Contact us
          </Link>
        </div>
        <ul className="mx-auto mt-14 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="group flex h-full items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <l.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-zinc-900">{l.label}</span>
                  <span className="block text-sm text-zinc-500">{l.body}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
