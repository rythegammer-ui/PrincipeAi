import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MeetingTypeForm } from "@/components/booking/meeting-type-form";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "New meeting type" };

export default function NewMeetingTypePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/scheduling" className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="size-4" aria-hidden /> Availability
      </Link>
      <PageHeader title="New meeting type" description="A bookable session with its own link, length, price and intake questions." />
      <MeetingTypeForm
        initial={{
          id: "",
          name: "",
          slug: "",
          description: "",
          durationMin: 30,
          priceCents: 0,
          locationLabel: "Zoom",
          locationUrl: "",
          bufferMin: 15,
          minNoticeHours: 12,
          maxDaysAhead: 30,
          questions: [{ label: "What would you like to get out of this session?", required: true }],
          color: "violet",
          active: true,
          sortOrder: 10,
        }}
      />
    </div>
  );
}
