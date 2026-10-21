import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { site } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

/*
 * IMPORTANT (site owner): this privacy policy is a sensible starting template that reflects how this
 * platform actually works (CRM, analytics cookies, Anthropic, Stripe, Resend, Vercel). It is not legal
 * advice. Have it reviewed by a qualified professional for your jurisdiction (e.g. GDPR, CCPA/CPRA)
 * before relying on it, and update LAST_UPDATED whenever you change it.
 */
const LAST_UPDATED = "October 20, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} (${site.company}) collects, uses and protects your personal information.`,
  alternates: { canonical: "/privacy" },
};

const md = `
## Who we are

${site.name} is operated by **${site.company}** ("we", "us", "our"). This policy explains what personal information we collect when you use ${absoluteUrl("/")} (the "Site") and our courses, coaching, implementation services and free resources, how we use it, and the choices you have.

If you have any questions, contact us at [${site.contactEmail}](mailto:${site.contactEmail}).

## Information we collect

### Information you give us

- **Contact details** — such as your name, email address, phone number, company and website, when you download a free resource, fill in a form, book a call, apply for implementation services, buy a course or contact us.
- **Your answers and messages** — for example your AI Readiness Assessment answers, booking questions, implementation application, contact-form messages and conversations with our AI assistant or course tutor.
- **Purchase details** — what you bought, when and for how much. Card payments are handled by Stripe; we never see or store your full card number.
- **Course activity** — the courses you're enrolled in, lessons completed and sign-in history.

### Information collected automatically

- **Usage and analytics data** — pages you visit, buttons you click and the steps you take through our funnels (for example, starting the assessment or booking a call), along with the referring website and any campaign (UTM) tags in the link you followed.
- **Device and technical data** — such as your IP address and browser information, used for security, rate limiting and preventing abuse.
- **Performance data** — anonymous page-speed measurements (Core Web Vitals) collected through Vercel Speed Insights, along with the page address, browser, device type, operating system, connection speed and country. It isn't tied to you or your IP address, and we remove private links and query strings from page addresses before they're sent.
- **Cookies** — see the Cookies section below.

## How we use your information

We use personal information to:

- Provide what you asked for — deliver free resources, assessment results, courses, bookings, coaching and implementation services.
- Run our customer relationship management (CRM) system — keeping a record of your enquiries, bookings, purchases and interactions so we can follow up, prepare for calls and give you relevant help.
- Send you emails — transactional emails (such as receipts, booking confirmations and sign-in links) and, where permitted, helpful marketing emails such as tips and course updates. Every marketing email includes a one-click unsubscribe link.
- Personalise your experience — for example, generating a personalised AI action plan from your assessment answers or recommending the course that best fits your goals.
- Understand and improve the Site — measuring which pages and offers are useful and where people get stuck.
- Keep the Site secure — preventing spam, fraud and abuse, and complying with legal obligations.

Where the law requires a legal basis (for example under the GDPR), we rely on performing a contract with you, our legitimate interests in running and improving our business, your consent (for example for certain marketing), and compliance with legal obligations.

## AI processing

Some features use artificial intelligence provided by **Anthropic** (the Claude family of models), including the website AI assistant, the course AI tutor, personalised assessment plans and internal tools that help us summarise enquiries and draft replies. When you use these features, the relevant content — such as your messages or answers — is sent to Anthropic to generate a response, and is processed under Anthropic's commercial terms and privacy policy.

We send only what a feature needs to work. Please don't share sensitive information (such as health details, financial account numbers or government ID numbers) in AI chats. AI-generated content can be inaccurate, so please check anything important before relying on it.

## Who we share information with

We **do not sell** your personal information. We share it only with service providers who help us run the Site and our business, under contracts that require them to protect it, and, in the limited way described under “Our sales team” below, with independent sales agents. Our service providers include:

- **Anthropic** — AI features described above.
- **Stripe** — payment processing.
- **Resend** — sending email.
- **Vercel** — website hosting and infrastructure (including the anonymous performance measurement above), together with our database hosting provider.
- **Video-conferencing providers** (such as Zoom or Google Meet) — if you book a call with us.

We may also disclose information if required by law, to protect our rights or the safety of others, or as part of a business transfer such as a merger or acquisition.

## Our sales team

Some customers are introduced to us by independent **sales agents** who earn a commission on the courses they sell (see the [Sales Agent Program Terms](/sales-team/terms)).

- **If an agent introduced you, or we assigned you to one:** when you sign up or buy after following an agent's link, or when we assign you to an agent who is helping you, we record that you're their customer. For each sale they're credited with, the agent sees the course and the amount paid, never your name or email address.
- **If you apply to join the sales team:** we collect your name, email, phone number, city and state, and your answers about your experience and availability, to review your application. If you join, we use your details to run the program: your dashboard, commissions and payouts (including how you'd like to be paid and, for tax purposes, a Form W-9). Your first name, last initial and state appear on the team leaderboard and wins feed for other agents unless you opt out in your dashboard. We never sell this information.

## Cookies

We use a small number of first-party cookies:

| Cookie | Purpose | Duration |
| --- | --- | --- |
| \`pa_vid\` | An anonymous visitor ID used for analytics and to connect your visits once you share your details | 2 years |
| \`pa_utm\`, \`pa_ref\`, \`pa_land\` | Remember how you first found us (campaign tags, referring site, landing page) | 90 days |
| \`pa_guide\` | Remembers that you've unlocked the free AI Starter Kit | 1 year |
| \`pa_agent\` | If you followed an independent sales agent's link, their referral code, so the agent who introduced you is credited if you sign up or buy | 90 days |
| \`pa_student\`, \`pa_admin\` | Keep you signed in to the student portal (or sales agent dashboard) or admin area | Session length |

These cookies are set by us, not by third-party advertisers. You can block or delete cookies in your browser settings, although some features (such as staying signed in) may stop working. Stripe may set its own cookies on its checkout pages to prevent fraud.

## How long we keep information

We keep personal information for as long as you have a relationship with us and for a reasonable period afterwards, so we can answer questions, keep proper business records and meet legal, tax and accounting requirements. When information is no longer needed we delete or anonymise it.

## Your rights and choices

Depending on where you live, you may have the right to access, correct, delete or export your personal information, to object to or restrict certain processing, and to withdraw consent. You can:

- **Unsubscribe** from marketing emails at any time using the link in any email.
- **Request access, correction or deletion** by emailing [${site.contactEmail}](mailto:${site.contactEmail}).

We won't treat you differently for exercising your rights. If you're unhappy with how we've handled your information, you may also have the right to complain to your local data protection authority.

## Security

We use reasonable technical and organisational measures to protect personal information, including encrypted connections (HTTPS), signed and httpOnly session cookies, access controls on our admin area and rate limiting on public forms. No system is perfectly secure, so we can't guarantee absolute security.

## International transfers

Our service providers may process information in countries other than your own, including the United States. Where required, we rely on appropriate safeguards for these transfers.

## Children

Our services are intended for adults and are not directed at children under 16. We don't knowingly collect personal information from children. If you believe a child has given us their information, please contact us and we'll delete it.

## Changes to this policy

We may update this policy from time to time. When we do, we'll change the "last updated" date at the top of this page, and for significant changes we'll let you know by email or a notice on the Site.

## Contact us

**${site.company}** · [${site.contactEmail}](mailto:${site.contactEmail})
`;

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={LAST_UPDATED}
      summary="The short version: we collect what we need to help you learn and use AI, we never sell your data, and you can ask us to delete it at any time."
      markdown={md}
    />
  );
}
