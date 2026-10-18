import Link from "next/link";
import { marketingNav } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/misc";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label="Principe AI home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Student login
          </Link>
          <ButtonLink href="/book" size="sm">
            Book a free call
          </ButtonLink>
        </div>
        <MobileNav items={[...marketingNav, { href: "/login", label: "Student login" }]} />
      </div>
    </header>
  );
}
