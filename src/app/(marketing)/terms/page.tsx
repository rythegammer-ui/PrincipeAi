import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { site } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

/*
 * IMPORTANT (site owner): these terms are a sensible starting template for an AI education and
 * implementation business. They are not legal advice. Have them reviewed by a qualified professional —
 * in particular the refund, liability and governing-law sections — before relying on them, and update
 * LAST_UPDATED whenever you change them.
 */
const LAST_UPDATED = "October 18, 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that apply when you use ${site.name} and buy courses, coaching or services from ${site.company}.`,
  alternates: { canonical: "/terms" },
};

const md = `
## 1. About these terms

These Terms of Service ("Terms") apply to your use of ${absoluteUrl("/")} (the "Site") and to the courses, coaching sessions, implementation services, free resources and AI tools (together, the "Services") offered by **${site.company}** under the ${site.name} name ("we", "us", "our"). By using the Site or buying any of the Services, you agree to these Terms and to our [Privacy Policy](/privacy).

## 2. Our services

- **Free resources** — such as the AI Starter Kit and the AI Readiness Assessment.
- **Online courses** — self-paced lessons delivered through the student portal.
- **Coaching and calls** — free strategy calls and paid one-on-one coaching sessions, booked through the Site.
- **Implementation services** — custom AI systems, automations and training for businesses.
- **AI tools** — such as the website assistant and the course AI tutor.

We may update, improve or discontinue parts of the Services from time to time.

## 3. Your account and sign-in

Students sign in with a secure one-time link sent by email. You're responsible for keeping access to your email account secure and for activity under your account. Course access is for you personally — please don't share your sign-in links or account with others.

## 4. Purchases and payment

Prices are shown on the Site and at checkout in US dollars unless stated otherwise. Payments are processed securely by Stripe, and you agree to Stripe's terms when you pay. You're responsible for any taxes that apply to your purchase where they aren't included at checkout.

## 5. Refunds

If you're not satisfied with a purchase, contact us at [${site.contactEmail}](mailto:${site.contactEmail}) and tell us what happened. We review every request individually and fairly, and any refund will be returned to your original payment method. Nothing in these Terms limits rights you have under consumer protection laws that apply to you.

## 6. Bookings, cancellations and rescheduling

You can reschedule or cancel a booked call using the link in your confirmation email. Paid sessions are confirmed once payment is complete. If you need to cancel a paid session, please do so as early as possible so we can offer you another time; if you miss a session without notice, we may not be able to offer a refund or a replacement. If we ever need to cancel, we'll offer you a new time or a full refund.

## 7. Implementation services

Implementation projects are scoped after a discovery call and are governed by a separate written proposal or agreement (covering scope, deliverables, timeline, fees and ownership). If that agreement conflicts with these Terms, the agreement takes priority for that project.

## 8. Course content and licence

When you buy a course, we grant you a personal, non-exclusive, non-transferable licence to access and use the course materials for your own learning. You may use what you learn — including prompts and templates — in your own life and business. You may not copy, resell, publicly share or redistribute the course materials, or use them to create a competing course.

## 9. AI-generated content

Some Services use artificial intelligence. AI output can be incomplete, outdated or wrong, and it may not reflect our views. You're responsible for reviewing AI-generated content before relying on or publishing it. Nothing produced by our AI tools — or taught in our courses — is legal, financial, medical, tax or other professional advice; please consult a qualified professional for those matters.

## 10. Acceptable use

When using the Services, you agree not to:

- break the law or infringe anyone else's rights;
- upload malicious code, attempt to gain unauthorised access, or disrupt the Site;
- use our AI tools to create harmful, deceptive, harassing or illegal content;
- scrape the Site or use automated means to access the Services without our permission;
- misuse forms or bookings (for example, by sending spam or making false bookings).

We may suspend or end access for anyone who breaches these Terms.

## 11. Intellectual property

The Site and Services — including course content, text, graphics, logos and software — belong to ${site.company} or our licensors and are protected by intellectual property laws. These Terms don't give you any rights in them except the limited licence described above. Anything you submit to us (such as form answers) remains yours; you give us permission to use it to provide the Services.

## 12. No guaranteed results

We work hard to make our Services practical and useful, but results depend on many factors outside our control, including how you apply what you learn. We don't guarantee any particular outcome, such as time saved, revenue or business results.

## 13. Disclaimers and limitation of liability

The Site and Services are provided "as is" and "as available". To the fullest extent permitted by law, we disclaim all implied warranties, including fitness for a particular purpose and non-infringement.

To the fullest extent permitted by law, we won't be liable for any indirect, incidental, special or consequential losses, or for loss of profits, data or goodwill. Our total liability for any claim relating to the Services is limited to the amount you paid us for the Service in question in the twelve months before the claim. Nothing in these Terms limits liability that cannot be limited by law.

## 14. Changes to these terms

We may update these Terms from time to time. When we do, we'll change the "last updated" date above. If you keep using the Services after an update, the new Terms apply.

## 15. Governing law

These Terms are governed by the laws of the jurisdiction in which ${site.company} is established, without regard to conflict-of-law rules, and disputes will be handled by the courts of that jurisdiction unless the law where you live gives you the right to bring a claim locally.

## 16. Contact us

**${site.company}** · [${site.contactEmail}](mailto:${site.contactEmail})
`;

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated={LAST_UPDATED}
      summary={`The ground rules for using ${site.name} and buying our courses, coaching and services — written to be as clear as possible.`}
      markdown={md}
    />
  );
}
