import { CheckCircle2, Lightbulb, Link2, MessageSquareText, ShieldCheck, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { CopyButton } from "@/components/marketing/copy-button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { site } from "@/config/site";
import { listPublishedCourses } from "@/lib/courses";
import { agentLinks, currentAgent } from "@/lib/sales/agents";
import { getSalesProgram } from "@/lib/sales/program";
import { absoluteUrl, firstName, formatMoney } from "@/lib/utils";
import { NotAnAgent } from "../not-agent";

export const metadata: Metadata = { title: "Toolkit" };

const DOS = [
  "Say you earn a commission every time you recommend a course: “I earn a commission if you buy through my link.”",
  "On social media, put #ad and the commission line at the start of the post, before the link and above any “more” cut-off.",
  "In every promotional email, include a way to opt out (“reply stop”) and our mailing address, and honour opt-outs straight away (within 10 business days at the latest).",
  "Describe the courses accurately, using what's on the course pages.",
  "Reach out to people you know, or people who've asked to hear from you.",
  "Stop messaging anyone who says no or asks you to stop, straight away.",
  "Send questions about refunds, access or support to us.",
];

const DONTS = [
  "Promise results, like “this will save you 10 hours a week” or “you'll make more money”.",
  "Make claims about what anyone earns on the sales team.",
  "Send texts, calls or emails to people who haven't agreed to hear from you, or buy contact lists.",
  "Post fake reviews or pretend to be a customer.",
  `Run ads on our name (“${site.name}”) or make pages and accounts that look like ours.`,
  "Offer discounts, rebates or a share of your commission. Only the prices on the site are real.",
  "Say you work for us. You're an independent sales agent.",
];

const TIPS = [
  { title: "Start with people you know", body: "Friends, family, former colleagues and clients who've mentioned AI, or who are stretched for time. A personal note beats any post." },
  { title: "Local business groups", body: "Chambers of commerce, BNI chapters, co-working spaces and meetups. Small-business owners are a natural fit for the business courses." },
  { title: "LinkedIn", body: "Share what you've learned about using AI at work, and mention the courses where they genuinely fit. Comment helpfully on others' posts." },
  { title: "Community events", body: "Libraries, community colleges, churches and clubs often welcome a short “AI for everyday life” talk. Ask the organizer first." },
  { title: "Make useful content", body: "Short videos or posts showing one practical AI tip. Point people to the free assessment or a course when they want more." },
];

/** The postal address CAN-SPAM requires in promotional email (Settings: BUSINESS_POSTAL_ADDRESS). */
const mailingAddress = () => site.postalAddress.trim() || "[mailing address: ask the team]";

function scripts(name: string, link: string) {
  return [
    {
      title: "Text or DM to someone you know",
      body: `Hey! I remember you saying you wanted to get more out of AI. I've been working with ${site.name}: they have short, plain-English courses on using AI in everyday life and at work. Here's the link if you want a look: ${link}\n\n(Full disclosure: I earn a commission if you buy through my link.)`,
    },
    {
      title: "Social media post",
      // Disclosure first (truncated captions hide the end); fits X's 280 characters, which counts a link as 23.
      body: `#ad — I earn a commission if you buy through my link.\n\nWant to get practical with AI but not sure where to start? ${site.name} teaches it in short, plain-English lessons for everyday life and business.\n\n${link}`,
    },
    {
      title: "Email to a contact",
      body: `Subject: A practical way to start using AI\n\nHi [name],\n\nYou mentioned recently that [their situation, e.g. you're short on time / curious about AI for your business]. I thought of ${site.name}: they teach practical AI skills in plain English, in short lessons you can use the same day.\n\nHave a look here: ${link}\n\nHappy to answer any questions. Just so you know, I earn a commission if you buy through my link.\n\nBest,\n${name}\n\nNot interested? Reply "stop" and I won't email you about this again.\n${site.company}, ${mailingAddress()}`,
    },
    {
      title: "Friendly follow-up",
      body: `Hi [name], just following up on the AI courses I sent over. No pressure at all; if it's not the right time, no worries. The link's here if you want it later: ${link}\n\n(As before: I earn a commission if you buy through it. Reply "stop" and I won't follow up again.)`,
    },
  ];
}

export default async function AgentToolkitPage() {
  const agent = await currentAgent();
  if (!agent) return <NotAnAgent />;
  const [program, courses] = await Promise.all([getSalesProgram(), listPublishedCourses()]);
  const code = agent.code;
  const links = code ? agentLinks(code) : null;
  const paid = courses.filter((c) => c.priceCents > 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <p className="eyebrow">Sales team</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Toolkit</h1>
      <p className="mt-1 text-zinc-600">Your links, ready-to-use messages, and the rules that keep the team trusted.</p>

      {agent.status === "paused" && (
        <Alert tone="warning" title="Your agent account is paused" className="mt-6">
          Your links don&apos;t earn commission while your account is paused, including on sales made now once it&apos;s turned back on. Please hold off
          sharing them until we let you know it&apos;s active again.
        </Alert>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-4 text-brand-600" aria-hidden /> Your links
          </CardTitle>
          <CardDescription>
            Every link carries your code. You can also add <code className="font-mono text-xs">?ref={code ?? "YOURCODE"}</code> to any page on the site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!links ? (
            <p className="text-sm text-zinc-600">Your links appear here once your account is approved.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
              <LinkRow label="Short link" hint="Easiest to share anywhere" url={links.short} />
              <LinkRow label="Home page" url={links.home} />
              <LinkRow label="All courses" url={links.courses} />
              {paid.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 p-4">
                  <p className="font-medium text-zinc-900">
                    {c.coverEmoji} {c.title} <span className="text-sm font-normal text-zinc-500 tabular-nums">{formatMoney(c.priceCents)}</span>
                  </p>
                  <LinkLine label="Course page" url={absoluteUrl(`/courses/${c.slug}?ref=${code}`)} sr={`${c.title} course page`} />
                  <LinkLine label="Straight to checkout" url={absoluteUrl(`/buy/${c.slug}?ref=${code}`)} sr={`${c.title} checkout`} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="size-4 text-brand-600" aria-hidden /> Messages you can copy
          </CardTitle>
          <CardDescription>Make them your own: a personal touch works far better than a copy-paste. Keep the commission line in.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4 md:grid-cols-2">
            {scripts(firstName(agent.name, agent.email), links?.short ?? absoluteUrl("/")).map((s) => (
              <li key={s.title} className="flex flex-col rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-zinc-900">{s.title}</p>
                  <CopyButton text={s.body} label="Copy" srLabel={`Copy message: ${s.title}`} className="min-h-11 sm:min-h-9" />
                </div>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-zinc-700">{s.body}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand-600" aria-hidden /> Do&apos;s and don&apos;ts
          </CardTitle>
          <CardDescription>
            These keep customers&apos; trust and keep you on the right side of the law (FTC disclosure rules, CAN-SPAM and the TCPA). Breaking them can end your
            place on the team.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-emerald-800">Do</h2>
            <ul className="mt-3 space-y-3">
              {DOS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-zinc-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-red-800">Don&apos;t</h2>
            <ul className="mt-3 space-y-3">
              {DONTS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-zinc-700">
                  <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-4 text-gold-600" aria-hidden /> Where to find customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {TIPS.map((t) => (
                <li key={t.title}>
                  <p className="text-sm font-semibold text-zinc-900">{t.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{t.body}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>How sales are credited</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-relaxed text-zinc-700">
              <li>
                Someone new to us who first signs up through your link (the free guide, the assessment, a booking…) becomes your customer. Anyone who buys
                through your link does too, even if they&apos;d been in touch with us before.
              </li>
              <li>
                They stay yours for <strong>{program.attributionDays} days</strong> from then: the first agent to bring a customer keeps them, even if they
                later click another agent&apos;s link. Customers the team assigns to you stay yours until that&apos;s changed.
              </li>
              <li>Your code works on any page: the home page, a course, the free assessment or the free guide.</li>
              <li>
                Your link is remembered in the visitor&apos;s browser for 90 days. If someone switches device or clears their browser, ask them to use your
                link again before they buy. The &ldquo;Straight to checkout&rdquo; links work on any device.
              </li>
              <li>Purchases you make yourself, from any of your email addresses, don&apos;t earn commission. Nor do sales while your account is paused.</li>
              <li>
                Commission is held for <strong>{program.holdDays} days</strong> in case of a refund (until it&apos;s resolved if the payment is disputed),
                then paid: {program.payoutSchedule.replace(/\.$/, "")}. A partial refund reduces the commission to match.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LinkRow({ label, hint, url }: { label: string; hint?: string; url: string }) {
  return (
    <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-900">
          {label}
          {hint && <span className="ml-2 text-xs font-normal text-zinc-500">{hint}</span>}
        </p>
        <p className="mt-0.5 font-mono text-xs break-all text-zinc-500">{url}</p>
      </div>
      <CopyButton text={url} label="Copy" srLabel={`Copy link: ${label}`} className="min-h-11 self-start sm:min-h-9 sm:self-center" />
    </li>
  );
}

function LinkLine({ label, url, sr }: { label: string; url: string; sr: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-700">{label}</p>
        <p className="font-mono text-xs break-all text-zinc-500">{url}</p>
      </div>
      <CopyButton text={url} label="Copy" srLabel={`Copy link: ${sr}`} className="min-h-11 self-start sm:min-h-9 sm:self-center" />
    </div>
  );
}
