import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SequenceForm } from "@/components/funnels/sequence-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New automation" };

export default async function NewSequencePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/sequences" className="mb-4 inline-flex min-h-8 items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="size-4" aria-hidden /> Email Automations
      </Link>
      <PageHeader title="New automation" description="Name it and choose what starts it. You'll write the emails on the next screen." />
      <Card>
        <CardContent>
          <SequenceForm mode="create" sequence={{ name: "", description: "", trigger: "manual", active: true }} />
        </CardContent>
      </Card>
    </div>
  );
}
