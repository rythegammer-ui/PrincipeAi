import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NewContactForm } from "@/components/admin/contact-forms";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "New contact" };

export default function NewContactPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/contacts" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="size-4" aria-hidden /> Contacts
      </Link>
      <PageHeader
        title="New contact"
        description="Add someone you met at a workshop, a referral or a cold conversation. Their timeline, tasks and AI brief start here."
      />
      <Card>
        <CardContent>
          <NewContactForm />
        </CardContent>
      </Card>
    </div>
  );
}
