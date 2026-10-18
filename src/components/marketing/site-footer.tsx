import Link from "next/link";
import { site } from "@/config/site";
import { Logo } from "@/components/ui/misc";

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/courses", label: "All courses" },
      { href: "/assessment", label: "AI Readiness Assessment" },
      { href: "/free-guide", label: "Free AI Starter Kit" },
      { href: "/login", label: "Student login" },
    ],
  },
  {
    title: "Work with us",
    links: [
      { href: "/consulting", label: "AI Implementation" },
      { href: "/book", label: "Book a call" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">{site.description}</p>
          <p className="mt-4 text-sm text-zinc-600">
            <a href={`mailto:${site.contactEmail}`} className="font-medium text-brand-700 hover:underline">
              {site.contactEmail}
            </a>
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-zinc-900">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-600 transition-colors hover:text-zinc-900">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-200">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.company}. All rights reserved.
          </p>
          <p>{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
