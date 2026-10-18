import Link from "next/link";

export function AnnouncementBar({ text, href }: { text: string; href: string }) {
  if (!text) return null;
  return (
    <div className="bg-ink text-white">
      <div className="container-page flex h-10 items-center justify-center text-center text-xs font-medium sm:text-sm">
        {href ? (
          <Link href={href} className="truncate hover:text-gold-300">
            <span className="mr-2 text-gold-300">✦</span>
            {text}
          </Link>
        ) : (
          <span className="truncate">{text}</span>
        )}
      </div>
    </div>
  );
}
