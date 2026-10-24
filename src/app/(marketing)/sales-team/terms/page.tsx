import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { site } from "@/config/site";
import { formatRate } from "@/lib/sales/game";
import { getSalesProgram } from "@/lib/sales/program";
import { absoluteUrl, formatMoney } from "@/lib/utils";

/*
 * IMPORTANT (site owner): this agreement is a sensible starting template for a commission-only sales program. It is
 * not legal advice. Have it reviewed by a qualified professional (in particular the contractor status, tax, payment
 * and termination sections, and any state-specific rules for where your agents live) before relying on it, and update
 * LAST_UPDATED whenever you change it. Rates, the hold period, the attribution window and the payout schedule are
 * read from Admin → Sales Team → Program, so the page always shows the current numbers.
 */
const LAST_UPDATED = "October 24, 2026";

export const metadata: Metadata = {
  title: "Sales Agent Program Terms",
  description: `The terms that apply when you sell ${site.name} courses as an independent sales agent for ${site.company}.`,
  alternates: { canonical: "/sales-team/terms" },
};

export default async function SalesAgentTermsPage() {
  const program = await getSalesProgram();
  const levels = program.levels
    .map((l) => `- **${l.name}:** ${formatRate(l.rateBps)} of the amount paid, ${l.minSales === 0 ? "from your first sale" : `from ${l.minSales} sales in a calendar month`}`)
    .join("\n");

  const md = `
## 1. About these terms

These Sales Agent Program Terms ("Terms") apply when you take part in the ${site.name} Sales Team (the "Program") run by **${site.company}** ("we", "us", "our"). By applying to or taking part in the Program you agree to these Terms, to our [Terms of Service](/terms) and to our [Privacy Policy](/privacy). If anything here conflicts with the Terms of Service, these Terms apply to your work as an agent.

## 2. Who can join

You must be at least 18 years old and live in the United States. We review every application and may accept or decline any application at our discretion. Being accepted lets you promote our courses using your own referral link; it doesn't give you any other right to act for us.

## 3. You're an independent contractor

You take part as an **independent contractor**, not as an employee, partner, agent with authority to bind us, or franchisee. That means:

- **No base pay.** You earn only the commissions and bonuses described below. There's no salary, hourly pay, minimum earnings or reimbursement of your expenses.
- **You set your own hours and methods,** within the conduct rules in section 9. There are no quotas.
- **No fees.** You never pay us anything to join or stay in the Program, and you never have to buy a course.
- **Taxes are your responsibility.** We'll ask you for a completed IRS Form W-9 before your first payout, and we may issue you a Form 1099 where the law requires it. We don't withhold taxes from your payouts.
- You're responsible for any business licences, equipment, phone and internet costs you need.

## 4. Commission

You earn a commission on each **course purchase** made by a customer who is attributed to you (section 5). Commission is a percentage of the amount the customer actually paid for the course, after any discount. The rate depends on your level, set by your sales in the calendar month:

${levels}

Reach a level and you keep it through the end of the following calendar month. Months are counted in our business time zone. A sale that is later refunded doesn't count toward your level.

From time to time we may run **challenges** with a cash bonus for every agent who reaches the target within the challenge period. Bonuses wait out the same refund window as commissions, and are cancelled if refunds take you below the target.

We may change the rates, levels, bonuses or any other part of the Program for **future** sales by giving you notice by email or on your dashboard. Changes never reduce commission on sales already made.

## 5. Which customers are yours (attribution)

- A customer is attributed to you when:
  - they're **new to us** and first sign up on our site (for example for the free guide, the assessment or a call) after coming through your referral link (any page with your code, or your short link); or
  - they **buy a course through your referral link**, even if they'd been in touch with us before; or
  - we **assign** them to you.
- Someone already in touch with us becomes your customer only by buying through your link: signing up again through it isn't enough.
- **The first agent to bring a customer keeps them** for ${program.attributionDays} days from when they first sign up or buy through your link. Their course purchases in that time earn you commission. After that, another agent's link can bring them in again. A customer we assign to you stays yours until we change it.
- Your link is remembered in a visitor's browser for 90 days. If they clear their cookies, use another device, or buy without using your link, we may not be able to credit you. Tell us if you think a sale was missed and we'll look into it; our records decide.
- Purchases you make yourself or for yourself don't earn commission: we check your own email address automatically, and we review every payout, so purchases from another address of yours, or made with someone else's details to get around these rules, don't earn either.
- Sales made while your participation is paused don't earn commission, including after it's turned back on.

## 6. Refunds and chargebacks

Each commission is held for **${program.holdDays} days** after the sale (the "hold period") so that refunds happen first. If an order is refunded in full:

- before its commission is paid, the commission is cancelled; or
- after the commission was paid, the same amount is deducted from your next payout.

If an order is **partly refunded**, its commission is recalculated on what the customer kept (and any difference already paid is deducted from your next payout). If a customer **disputes the payment** with their bank (a chargeback), the commission isn't paid until the dispute is resolved: if we win it, it's paid as usual; if we lose it, it's treated as a full refund. Refunded and charged-back sales don't count toward your level or challenges.

## 7. Payouts

- Commission becomes payable once its hold period has passed. Payouts: **${program.payoutSchedule.replace(/\.$/, "")}**, once you're owed at least **${formatMoney(program.minPayoutCents)}**.
- We pay by PayPal, Venmo, Zelle, Cash App or bank transfer, to the details you give us in your dashboard. Keep them accurate: we aren't responsible for payments sent to details you gave us.
- Your dashboard shows each sale, commission, bonus, deduction and payout. If you think something is wrong, tell us within 60 days of the payout or sale in question.
- We may hold a payout while we look into suspected fraud or a breach of these Terms.

## 8. Single-level only

This is a **single-level** program. You only earn on courses bought by your own customers. There are **no commissions, bonuses or overrides for recruiting other agents**, and you must not describe the Program as a business opportunity in which people earn by recruiting others.

## 9. How you must promote ${site.name}

You represent our brand, so please promote it honestly and lawfully. You must:

- **Always disclose that you earn a commission** whenever you recommend our courses, clearly and close to the recommendation (for example, "I earn a commission if you buy through my link", or #ad on social media), as required by the FTC's Endorsement Guides. On social media, put the disclosure at the start of the post, before any link and where it can't be cut off by a "more" link.
- **Never make income or results claims.** Don't promise that a course will save anyone a particular amount of time or money, or produce any particular result, and don't make claims about what anyone earns in this Program.
- Describe our courses accurately, using the information on our site. Don't invent features, discounts, guarantees or deadlines.
- **No spam.** Follow the CAN-SPAM Act: only email people in a way the law allows, identify yourself, and include in every promotional email a clear way to opt out and our mailing address (shown in your toolkit's email script). Honour every request to stop straight away, and within 10 business days at the latest, and forward any "stop" or unsubscribe reply to us so we can honour it too.
- **No unsolicited texts or calls.** Follow the Telephone Consumer Protection Act (TCPA) and the Do Not Call rules: don't send marketing texts or make robocalls or autodialed calls without the person's prior consent.
- **No fake reviews** or testimonials, and no posing as a customer.
- **Don't bid on our brand** (such as "${site.name}" or "${site.company}") or close misspellings in paid search or social ads, and don't create websites, social accounts or usernames that could be mistaken for ours.
- **Don't impersonate us** or say you're an employee. You may say you're an independent sales agent for ${site.name}.
- **Don't offer unauthorized discounts, rebates or cash back,** including sharing part of your commission with a customer.
- Follow the rules of every platform you use (social networks, marketplaces, groups and forums).
- Send customers to us for questions about refunds, access or support. Don't promise refunds or exceptions.

**Reaching out to businesses (the Leads tab in your dashboard).** The Leads tab helps you find local businesses, write a first message and track follow-ups. When you use it:

- Contact **one business at a time, as yourself.** Don't send bulk or automated messages, and don't load prospects into another mailing or dialing tool.
- Use a business's **public business contact details** (its website, business phone or business email) or details the business gave you. Don't buy, rent or scrape contact lists, and don't guess personal email addresses.
- Keep the **commission disclosure** in every message, and in email the opt-out line and our mailing address. The messages the Leads tab writes include them.
- **No texts to cell phones** without the person's prior consent, and no auto-dialers, recorded calls or calls to numbers on the Do Not Call Registry.
- If anyone says no, "stop" or asks not to be contacted, **mark the business "Do not contact" straight away.** That blocks it for the whole team. Follow up at most twice with anyone who hasn't replied.
- A business you add is yours while you're working on it: the claim runs out 30 days after you last update it (90 days once it's marked "Not interested"), and then another agent may contact it. We may release a claim at any time.
- Business search results come from Google Maps. Use them only to find businesses to contact through the Leads tab, and don't copy them into other lists.

## 10. Customer information

Treat anything you learn about customers or prospects through the Program as confidential. Don't sell or share it, and only use it to help them with our courses. Your dashboard doesn't show customers' names or emails, with one exception: someone who signs up through your link and ticks the box saying it's OK for you to follow up appears under **Warm leads** with their name and email. Use those details only to follow up with them personally about ${site.name}, never add them to a mailing list or share them, and stop as soon as they ask. If they unsubscribe, they disappear from your list. Please don't ask us for anyone else's details.

## 11. Our name and materials

While you're in the Program, you may use our name, the scripts and the links we provide to promote our courses in line with these Terms. You may not change our logo or create materials that could mislead people about who you are. This permission ends when you leave the Program.

## 12. Pausing or leaving the Program

You can leave at any time by telling us. We can pause or end your participation at any time, including if you break these Terms. When your participation is paused or ends, your link stops earning commission on new sales (sales made during a pause don't earn commission later either). Commission you've already earned on valid sales is still paid after its hold period, unless it came from a breach of these Terms (such as self-purchases, misleading claims or spam), in which case we may withhold it.

## 13. Liability

We provide the Program, the dashboard and our materials "as is". To the extent the law allows, we aren't liable for lost profits or indirect losses, and our total liability to you in connection with the Program is limited to the commissions owed to you. You're responsible for your own conduct and will cover any claims, fines or costs that arise from you breaking these Terms or the law.

## 14. Changes to these terms

We may update these Terms from time to time. We'll tell you about material changes by email or on your dashboard before they take effect, and the "Last updated" date above will change. If you keep promoting our courses after a change takes effect, the updated Terms apply.

## 15. Contact

Questions about the Program? Email [${site.contactEmail}](mailto:${site.contactEmail}). You can sign in to your agent dashboard at ${absoluteUrl("/agent")}.
`;

  return (
    <LegalPage
      title="Sales Agent Program Terms"
      updated={LAST_UPDATED}
      summary={`The plain-English rules for selling ${site.name} courses as an independent, commission-only sales agent: how you earn, how sales are credited, how you're paid, and how to promote us honestly.`}
      markdown={md}
    />
  );
}
