import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  Crown,
  Flame,
  Gift,
  Laptop,
  Link2,
  Mail,
  MapPin,
  Medal,
  MessageCircleHeart,
  Rocket,
  Share2,
  Trophy,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Faq, type FaqItem } from "@/components/marketing/faq";
import { FeatureCard } from "@/components/marketing/feature-card";
import { PageHero } from "@/components/marketing/page-hero";
import { Accent, Section, SectionHeading } from "@/components/marketing/section";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/config/site";
import { listPublishedCourses } from "@/lib/courses";
import { commissionFor, formatRate, type ProgramSettings } from "@/lib/sales/game";
import { getSalesProgram } from "@/lib/sales/program";
import { shareMetadata } from "@/lib/seo";
import { cn, formatMoney, pluralize } from "@/lib/utils";
import { SalesApplyForm } from "./apply-form";

export const metadata: Metadata = {
  title: "Join the Sales Team",
  description: `Sell ${site.name} courses from anywhere in the US. Commission-only, flexible hours, your own referral link, and a team leaderboard with monthly challenges. Apply in a few minutes.`,
  alternates: { canonical: "/sales-team" },
  ...shareMetadata({
    title: `Join the ${site.name} Sales Team`,
    description: "Remote, commission-only, flexible hours. Share practical AI courses with people who'd benefit and earn on every sale.",
    url: "/sales-team",
  }),
};

const STEPS = [
  { icon: ClipboardList, title: "Apply", body: "Tell us a little about yourself and how you'd find customers. It takes about five minutes." },
  { icon: BadgeCheck, title: "Get approved", body: "We read every application ourselves. Once approved you get your own referral link and agent dashboard." },
  { icon: Share2, title: "Share with people who'd benefit", body: "Friends, colleagues, local business owners, your audience. Scripts and links are ready in your toolkit." },
  { icon: Wallet, title: "Earn on every sale", body: "When someone buys a course through your link, the commission is yours, tracked live on your dashboard." },
];

const GAME = [
  { icon: Rocket, title: "Levels", body: "Your commission rate rises as your monthly sales grow, and you keep a level through the end of the next month." },
  { icon: Trophy, title: "Monthly leaderboard", body: "See where you rank on the team each month, shown by first name, last initial and state. You can opt out any time." },
  { icon: Gift, title: "Challenges with cash bonuses", body: "Time-boxed goals like “3 sales this week”. Hit the target and the bonus is yours, on top of commission." },
  { icon: Medal, title: "Badges", body: "Unlock badges for milestones like your first sale, a 3-sale week or your first $1,000 in sales." },
  { icon: Flame, title: "Streaks", body: "Make a sale every week and watch your streak grow. Consistency beats bursts." },
  { icon: MessageCircleHeart, title: "Team wins feed", body: "See the team's sales as they happen (first name, last initial and state; never who bought) and cheer each other on." },
];

function faqs(program: ProgramSettings): FaqItem[] {
  const [first, ...rest] = program.levels;
  return [
    {
      q: "Is this a job? Is there a base salary?",
      a: "It's an independent, commission-only role. You're not an employee, there's no base pay and no minimum hours: you choose when and how much you work. What you earn depends entirely on the sales you make.",
    },
    {
      q: "Does it cost anything to join?",
      a: "No. There are no fees, nothing to buy and no inventory. You never have to purchase a course to sell one.",
    },
    {
      q: "How much commission do I earn?",
      a: `You start at ${formatRate(first.rateBps)} of every course sale${
        rest.length ? `, and move up to ${rest.map((l) => `${formatRate(l.rateBps)} at ${l.minSales}+ sales in a month`).join(" and ")}` : ""
      }. Reach a level and you keep it through the end of the following month. Challenges add cash bonuses on top.`,
    },
    {
      q: "When and how do I get paid?",
      a: `Each commission becomes payable ${program.holdDays} days after the sale, once the refund window has passed. Payouts: ${program.payoutSchedule.replace(/\.$/, "")}, once you're owed at least ${formatMoney(program.minPayoutCents)}, by PayPal, Venmo, Zelle, Cash App or bank transfer.`,
    },
    {
      q: "What happens if a customer gets a refund?",
      a: "The commission on that sale is cancelled. If it was already paid, it's taken off your next payout. That's why commissions wait out the refund window before they're paid.",
    },
    {
      q: "How do I know a sale is mine?",
      a: `Someone new to us who first signs up through your link (or any page with your code) becomes your customer, and so does anyone who buys through your link. They stay yours for ${program.attributionDays} days from then, and their course purchases in that time earn you commission. The first agent to bring a customer keeps them. Your link is remembered in their browser for 90 days. Purchases you make yourself don't count, and every payout is reviewed.`,
    },
    {
      q: "Do I earn for recruiting other agents?",
      a: "No. This is a single-level program: you only ever earn on courses your own customers buy. There are no recruiting bonuses or “downlines”.",
    },
    {
      q: "What about taxes?",
      a: "As an independent contractor you're responsible for your own taxes. We'll ask for a W-9 before your first payout and may send you a 1099 where the law requires it.",
    },
    {
      q: "Who can apply?",
      a: "Anyone 18 or older who lives in the United States. No sales experience needed: if you know people who'd benefit from learning practical AI, and you're happy to talk to them honestly, you can do this.",
    },
  ];
}

export default async function SalesTeamPage() {
  const [program, courses] = await Promise.all([getSalesProgram(), listPublishedCourses()]);
  const paid = courses.filter((c) => c.priceCents > 0);
  const [first] = program.levels;
  const top = program.levels[program.levels.length - 1];
  const lowest = paid.length ? Math.min(...paid.map((c) => commissionFor(c.priceCents, first.rateBps))) : null;

  return (
    <>
      <PageHero
        tone="dark"
        eyebrow="Remote · Commission-only · Anywhere in the US"
        title={
          <>
            Join the {site.name} <Accent tone="gold">Sales Team</Accent>
          </>
        }
        description={`Help people and businesses get practical with AI, and earn ${formatRate(first.rateBps)}${top !== first ? `–${formatRate(top.rateBps)}` : ""} of every course you sell. Flexible hours, your own referral link, and a team that makes it fun.`}
        aside={<LevelsVisual program={program} />}
      >
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <TrackedLink href="#apply" trackId="sales_team_hero_apply" className={buttonVariants({ variant: "gold", size: "lg", className: "w-full sm:w-auto" })}>
            Apply to join <ArrowRight aria-hidden />
          </TrackedLink>
          <a
            href="#how-it-works"
            className={buttonVariants({ variant: "ghost", size: "lg", className: "w-full text-white ring-1 ring-white/15 hover:bg-white/10 hover:text-white sm:w-auto" })}
          >
            How it works
          </a>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
          <li className="inline-flex items-center gap-1.5">
            <Laptop className="size-4 text-zinc-500" aria-hidden /> Work from anywhere
          </li>
          <li className="inline-flex items-center gap-1.5">
            <CalendarClock className="size-4 text-zinc-500" aria-hidden /> Set your own hours
          </li>
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-zinc-500" aria-hidden /> US-based, 18+
          </li>
        </ul>
      </PageHero>

      <Section id="how-it-works" labelledBy="how-heading">
        <SectionHeading
          id="how-heading"
          eyebrow="How it works"
          title={
            <>
              Four steps from applying to <Accent>your first sale</Accent>
            </>
          }
          description="No inventory, no fees, no quotas. You share courses you can stand behind; we handle checkout, delivery and customer support."
        />
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <s.icon className="size-5" aria-hidden />
              </span>
              <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-brand-600 uppercase">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted" labelledBy="levels-heading">
        <SectionHeading
          id="levels-heading"
          eyebrow="Commission levels"
          title={
            <>
              Sell more, <Accent>earn a bigger share</Accent>
            </>
          }
          description="Your level is set by your sales in the calendar month. Reach a level and you keep it through the end of next month, so one great month carries into the next."
        />
        <ol className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-3">
          {program.levels.map((level, i) => {
            const isTop = i === program.levels.length - 1 && i > 0;
            return (
              <li
                key={level.key}
                className={cn(
                  "relative flex flex-col rounded-2xl p-6 text-center sm:p-8",
                  isTop ? "bg-ink text-white shadow-lift ring-1 ring-brand-500/30" : "border border-zinc-200/80 bg-white shadow-soft",
                )}
              >
                {isTop && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-ink shadow-sm">Top level</span>}
                <p className={cn("text-sm font-semibold tracking-[0.14em] uppercase", isTop ? "text-gold-300" : "text-brand-600")}>Level {i + 1}</p>
                <h3 className={cn("mt-2 text-2xl font-semibold tracking-tight", isTop ? "text-white" : "text-zinc-900")}>{level.name}</h3>
                <p className={cn("mt-4 font-display text-6xl italic", isTop ? "text-gold-300" : "text-brand-700")}>{formatRate(level.rateBps)}</p>
                <p className={cn("mt-1 text-sm", isTop ? "text-zinc-300" : "text-zinc-500")}>of every course sale</p>
                <p className={cn("mt-6 border-t pt-4 text-sm", isTop ? "border-white/10 text-zinc-300" : "border-zinc-100 text-zinc-600")}>
                  {level.minSales === 0 ? "From your very first sale" : `${pluralize(level.minSales, "sale")} in a month`}
                </p>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section labelledBy="game-heading">
        <SectionHeading
          id="game-heading"
          eyebrow="The game"
          title={
            <>
              Selling is better <Accent>as a team</Accent>
            </>
          }
          description="Your dashboard turns the work into a game: progress you can see, goals worth chasing, and a team to compete with and cheer on."
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GAME.map((g) => (
            <li key={g.title}>
              <FeatureCard icon={g.icon} title={g.title}>
                {g.body}
              </FeatureCard>
            </li>
          ))}
        </ul>
      </Section>

      {paid.length > 0 && (
        <Section tone="muted" labelledBy="sell-heading">
          <SectionHeading
            id="sell-heading"
            eyebrow="What you'll sell"
            title={
              <>
                Practical AI courses <Accent>people actually use</Accent>
              </>
            }
            description={
              lowest !== null
                ? `Plain-English courses for everyday life and for business. At the starting rate you earn from ${formatMoney(lowest)} per sale.`
                : "Plain-English courses for everyday life and for business."
            }
          />
          <ul className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2 lg:grid-cols-3">
            {paid.map((course) => (
              <li key={course.id} className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-soft">
                <span className="text-3xl" aria-hidden>
                  {course.coverEmoji}
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">
                  <Link href={`/courses/${course.slug}`} className="hover:text-brand-700 hover:underline">
                    {course.title}
                  </Link>
                </h3>
                {course.subtitle && <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{course.subtitle}</p>}
                <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-sm">
                  <div>
                    <dt className="text-zinc-500">Price</dt>
                    <dd className="font-semibold text-zinc-900 tabular-nums">{formatMoney(course.priceCents, site.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">You earn</dt>
                    <dd className="font-semibold text-brand-700 tabular-nums">
                      {formatMoney(commissionFor(course.priceCents, first.rateBps))}
                      {top !== first && <span className="font-normal text-zinc-500">–{formatMoney(commissionFor(course.priceCents, top.rateBps))}</span>}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section labelledBy="payouts-heading">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              id="payouts-heading"
              align="left"
              eyebrow="Getting paid"
              title={
                <>
                  Clear, <Accent>predictable</Accent> payouts
                </>
              }
              description="Every sale, commission and payout is on your dashboard, so you always know what you've earned and when it's coming."
            />
          </div>
          <ul className="flex flex-col gap-4">
            {[
              {
                icon: CalendarClock,
                title: `${program.holdDays}-day refund window`,
                body: `A commission becomes payable ${program.holdDays} days after the sale. If the customer is refunded first, it's cancelled.`,
              },
              {
                icon: Wallet,
                title: program.payoutSchedule,
                body: `Paid once you're owed at least ${formatMoney(program.minPayoutCents)}, by PayPal, Venmo, Zelle, Cash App or bank transfer.`,
              },
              {
                icon: Crown,
                title: "Bonuses on top",
                body: "Challenge bonuses are paid with your commission once the challenge's refund window has passed.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-soft">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-700 ring-1 ring-gold-200">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-zinc-900">{item.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-zinc-600">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="muted" labelledBy="sales-faq-heading" narrow>
        <SectionHeading id="sales-faq-heading" eyebrow="Questions" title="Sales team FAQ" />
        <Faq items={faqs(program)} className="mt-12" />
        <p className="mt-8 text-center text-sm text-zinc-600">
          Read the full{" "}
          <Link href="/sales-team/terms" className="font-medium text-brand-700 underline underline-offset-2">
            Sales Agent Program Terms
          </Link>
          .
        </p>
      </Section>

      <section id="apply" aria-labelledby="apply-heading" className="relative isolate scroll-mt-16 overflow-hidden bg-ink py-20 text-white sm:py-28">
        <div className="bg-grid-dark pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_left,black,transparent_70%)]" aria-hidden />
        <div className="pointer-events-none absolute -top-40 -left-40 -z-10 size-[32rem] rounded-full bg-brand-600/35 blur-[120px]" aria-hidden />
        <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-gold-300 uppercase">Apply</p>
            <h2 id="apply-heading" className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Ready to <Accent tone="gold">join the team?</Accent>
            </h2>
            <p className="mt-4 leading-relaxed text-zinc-300">
              We&apos;re building a team of honest, friendly people across the US who like helping others get more done with AI. Experience is welcome but not
              required.
            </p>
            <ul className="mt-10 space-y-4">
              {[
                { icon: Link2, text: "Your own referral link and short link" },
                { icon: Trophy, text: "Leaderboard, badges, streaks and challenges" },
                { icon: ClipboardList, text: "Ready-made scripts and a clear do's and don'ts" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-zinc-200">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-gold-300 ring-1 ring-white/10">
                    <item.icon className="size-4" aria-hidden />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
            <p className="mt-10 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              <Mail className="size-4 text-zinc-500" aria-hidden />
              Already on the team?{" "}
              <Link href="/agent/login" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
                Sign in to your dashboard
              </Link>
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 text-zinc-900 shadow-lift sm:p-8">
            {program.applicationsOpen ? (
              <SalesApplyForm contactEmail={site.contactEmail} />
            ) : (
              <Alert tone="info" title="Applications are closed for now">
                We&apos;re not taking new agents at the moment. Please check back soon, or email{" "}
                <a href={`mailto:${site.contactEmail}`} className="font-medium underline">
                  {site.contactEmail}
                </a>{" "}
                to hear when we reopen.
              </Alert>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/** Decorative hero card: the commission levels as a climb (HTML/CSS only). */
function LevelsVisual({ program }: { program: ProgramSettings }) {
  return (
    <div
      role="img"
      aria-label={`Illustration: commission levels ${program.levels.map((l) => `${l.name} ${formatRate(l.rateBps)}`).join(", ")}.`}
      className="relative mx-auto w-full max-w-md select-none lg:max-w-none"
    >
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-500/30 via-transparent to-gold-400/20 blur-2xl" aria-hidden />
      <div className="rounded-[1.4rem] bg-white/[0.06] p-5 ring-1 ring-white/15 backdrop-blur sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white">Your level this month</p>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.6875rem] font-medium text-zinc-300">Example</span>
        </div>
        <ul className="mt-5 space-y-3">
          {program.levels.map((level, i) => (
            <li key={level.key} className="flex items-center gap-3 rounded-xl bg-ink/60 p-3 ring-1 ring-white/10">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                  i === 1 ? "bg-gold-400 text-ink" : "bg-white/[0.08] text-white",
                )}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.8125rem] font-medium text-zinc-100">{level.name}</span>
                <span className="block text-[0.75rem] text-zinc-400">{level.minSales === 0 ? "From your first sale" : `${level.minSales}+ sales a month`}</span>
              </span>
              <span className="shrink-0 font-display text-2xl text-gold-300 italic">{formatRate(level.rateBps)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 p-3.5">
          <Flame className="size-4 shrink-0 text-gold-300" />
          <p className="text-[0.8125rem] font-medium text-white">Weekly streaks, badges and monthly challenges along the way</p>
        </div>
      </div>
    </div>
  );
}
