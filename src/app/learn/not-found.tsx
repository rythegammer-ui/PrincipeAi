import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

/**
 * `notFound()` anywhere in the student portal (an unknown course or lesson, or a course the student
 * isn't enrolled in) renders here, inside the portal header, instead of the public marketing 404.
 */
export default function LearnNotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="sr-only">Page not found</h1>
      <EmptyState
        icon={SearchX}
        title="We couldn't find that lesson"
        description="The link may be out of date, or this course isn't part of your account yet."
        className="bg-white"
        action={
          <Link href="/learn" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft aria-hidden /> Back to my courses
          </Link>
        }
      />
    </div>
  );
}
