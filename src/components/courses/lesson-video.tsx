import { VIDEO_PROVIDER_LABELS, parseVideoUrl } from "@/lib/video";
import { cn } from "@/lib/utils";

/** Responsive, privacy-friendly embed for YouTube / Vimeo / Loom. Renders nothing for unsupported URLs. */
export function LessonVideo({ url, title, className }: { url: string | null | undefined; title: string; className?: string }) {
  const video = parseVideoUrl(url);
  if (!video) return null;
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-ink shadow-lift ring-1 ring-zinc-900/10", className)}>
      <iframe
        src={video.embedUrl}
        title={`${title} — ${VIDEO_PROVIDER_LABELS[video.provider]} video`}
        className="absolute inset-0 size-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
