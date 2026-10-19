import { eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteMeetingType, MeetingTypeForm } from "@/components/booking/meeting-type-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { getDb, schema } from "@/db";
import { isUuid } from "@/lib/booking-service";
import { isBuiltInMeetingSlug } from "@/lib/scheduling";

export const metadata: Metadata = { title: "Edit meeting type" };

export default async function EditMeetingTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const db = await getDb();
  const [mt] = await db.select().from(schema.meetingTypes).where(eq(schema.meetingTypes.id, id)).limit(1);
  if (!mt) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/scheduling" className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="size-4" aria-hidden /> Availability
      </Link>
      <PageHeader
        title={mt.name}
        description="Changes apply to new bookings right away. Existing bookings keep their time and length."
        actions={
          mt.active ? (
            <a href={`/book/${mt.slug}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm", className: "h-9" })}>
              Booking page <ExternalLink aria-hidden />
            </a>
          ) : null
        }
      />
      <MeetingTypeForm
        slugLocked={isBuiltInMeetingSlug(mt.slug)}
        initial={{
          id: mt.id,
          name: mt.name,
          slug: mt.slug,
          description: mt.description,
          durationMin: mt.durationMin,
          priceCents: mt.priceCents,
          locationLabel: mt.locationLabel,
          locationUrl: mt.locationUrl ?? "",
          bufferMin: mt.bufferMin,
          minNoticeHours: mt.minNoticeHours,
          maxDaysAhead: mt.maxDaysAhead,
          questions: mt.questions,
          color: mt.color,
          active: mt.active,
          sortOrder: mt.sortOrder,
        }}
      />
      <Card className="mt-10 border-red-200">
        <CardHeader>
          <CardTitle>Delete meeting type</CardTitle>
          <CardDescription>If it already has bookings it will be hidden instead, so your booking history stays intact.</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteMeetingType id={mt.id} name={mt.name} />
        </CardContent>
      </Card>
    </div>
  );
}
