import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { site } from "@/config/site";
import { linkMatchesCourse, readPaymentLinks } from "@/lib/payment-links";
import { checkoutMode } from "@/lib/payments";
import { stripeTestMode } from "@/lib/stripe";
import { isValidEmail, normalizeEmail } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Buy link for emails, `/buy/<course-slug>?email=…` ({{buy_link:<course-slug>}} in a template). Sends the visitor
 * to the course's Stripe Payment Link with their email filled in. When there's no current link (Stripe not set up,
 * a price changed since the last sync, the course unpublished) it goes to the sales page instead, which has its
 * own checkout. The Stripe link is looked up on every click, so emails already sent keep working after a price change.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const redirect = (to: string | URL) =>
    new Response(null, { status: 307, headers: { Location: new URL(to, request.url).toString(), "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });

  if (slug.length > 120 || !SLUG.test(slug)) return redirect("/courses");
  const db = await getDb();
  const [course] = await db
    .select({ id: schema.courses.id, slug: schema.courses.slug, published: schema.courses.published, priceCents: schema.courses.priceCents })
    .from(schema.courses)
    .where(eq(schema.courses.slug, slug))
    .limit(1);
  if (!course?.published) return redirect("/courses");
  const salesPage = `/courses/${course.slug}#enroll`;
  if (course.priceCents <= 0 || checkoutMode() !== "stripe") return redirect(salesPage);

  const link = (await readPaymentLinks(db, stripeTestMode() ? "test" : "live")).get(course.id);
  if (!linkMatchesCourse(link, course, site.currency)) return redirect(salesPage);

  const target = new URL(link.url);
  const email = new URL(request.url).searchParams.get("email")?.trim();
  if (email && email.length <= 254 && isValidEmail(email)) target.searchParams.set("prefilled_email", normalizeEmail(email));
  return redirect(target);
}
