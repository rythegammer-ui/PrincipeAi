import Link from "next/link";

export function AnnouncementBar({ text, href }: { text: string; href: string }) {
  if (!text) return null;
  return (
    <div className="bg-ink text-white">
      <div className="container-page flex h-10 items-center justify-center text-center text-xs font-medium sm:text-sm">
        {href ? (
          // The whole 40px-high bar is the tap target.
          <Link href={href} className="flex h-full min-w-0 items-center hover:text-gold-300">
            <span aria-hidden className="mr-2 shrink-0 text-gold-300">
              ✦
            </span>
            <span className="truncate">{text}</span>
          </Link>
        ) : (
          <span className="truncate">{text}</span>
        )}
      </div>
    </div>
  );
}
