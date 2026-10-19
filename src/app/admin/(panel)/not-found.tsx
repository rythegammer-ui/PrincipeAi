import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

/**
 * `notFound()` from any admin page (a deleted contact, sequence, email…) renders here, inside the
 * admin shell, instead of bubbling up to the public marketing 404.
 */
export default function AdminNotFound() {
  return (
    <>
      <h1 className="sr-only">Not found</h1>
      <EmptyState
        icon={SearchX}
        title="We couldn't find that"
        description="It may have been deleted, or the link is out of date."
        className="mt-6"
        action={
          <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft aria-hidden /> Back to dashboard
          </Link>
        }
      />
    </>
  );
}
