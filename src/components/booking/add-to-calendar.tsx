import { CalendarPlus, Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** "Add to calendar" buttons: Google Calendar template link + .ics download (Apple, Outlook, others). */
export function AddToCalendar({ googleUrl, icsUrl, className }: { googleUrl: string; icsUrl: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      <a href={googleUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", className: "h-11 sm:h-10" })}>
        <CalendarPlus aria-hidden /> Add to Google Calendar
      </a>
      <a href={icsUrl} download className={buttonVariants({ variant: "outline", className: "h-11 sm:h-10" })}>
        <Download aria-hidden /> Apple / Outlook (.ics)
      </a>
    </div>
  );
}
