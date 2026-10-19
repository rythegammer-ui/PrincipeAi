import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { NewCourseForm } from "@/components/courses/admin/new-course-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900">
        <ArrowLeft className="size-4" aria-hidden /> All courses
      </Link>
      <PageHeader title="New course" description="Start with the basics — you'll add the sales copy, modules and lessons next." />
      <Card>
        <CardContent>
          <NewCourseForm />
        </CardContent>
      </Card>
    </div>
  );
}
