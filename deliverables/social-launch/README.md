# Principe AI social launch: start here

> **What this file is:** the start-here playbook. It answers "What can I do to launch and push Principe AI on all my social media?"
>
> **When to use it:** read it first, today (L-21 · Tue Oct 20), in about 10 minutes. Come back whenever you need the map. The detail lives in the files in section 9.

---

## 1. The plan in one paragraph

You launch everywhere on one day, **Tue Nov 10, 2026 (L+0)**, after two weeks of setup and one week of value-only warm-up posts. Every post teaches one useful thing and points to a free first step: the AI Starter Kit, the AI Readiness Assessment or a free preview lesson. The site's emails, calls and courses do the rest. You batch the week's posts every Monday, reply to everyone, and review what worked. Setup is about 46 hours over three weeks; then about 8 hours a week, or 3 at a minimum ([calendar](02-launch-calendar.md), section 2).

| Phase | L-days | Default dates |
|---|---|---|
| Setup | L-21 to L-8 | Tue Oct 20 to Mon Nov 2 |
| Warm-up (no posts on Election Day, Tue Nov 3) | L-7 to L-1 | Tue Nov 3 to Mon Nov 9 |
| Launch week | L+0 to L+6 | Tue Nov 10 to Mon Nov 16 |
| Growth (Thanksgiving, Black Friday, Cyber Monday) | L+7 to L+40 | Tue Nov 17 to Sun Dec 20 |
| Holiday slow-down, pre-scheduled | L+41 to L+52 | Mon Dec 21 to Fri Jan 1 |
| New Year push (`ny-2027`) | L+53 to L+82 | Sat Jan 2 to Sun Jan 31 |

**Moving the launch date.** Every date is an L-day with the default date beside it. Pick a new Tuesday (no later than Tue Nov 17) and shift every L-date by the same number of days. **FIXED** posts (holidays), `bf-2026` and `ny-2027` keep their dates. Steps: [calendar](02-launch-calendar.md), "Moving launch day".

---

## 2. Which platforms, and why

| Tier | Platforms | Why | Time a week |
|---|---|---|---|
| **1 · Now** | Instagram (Reels, carousels, Stories), TikTok, YouTube (Shorts now, long-form from the free preview lessons), LinkedIn (your profile, then the Company Page), Facebook Page (Reels shared from Instagram, plus link posts) | Short video reaches non-followers; Instagram has the most free link spots; YouTube is searchable; LinkedIn reaches business owners; Facebook is nearly free to add | About 6.5 h |
| **2 · Cross-post** | Threads (from Instagram), X, Pinterest | Copies, not new work. Evergreen Pins bring search traffic to `/free-guide` and `/assessment` | About 0.5 h |
| **3 · Later** | Bluesky; Reddit (comments only for 3 weeks, posts from Thu Dec 3); your own Facebook Group (Mon Jan 4, if go); podcast, partner and local outreach (5 pitches a week from Mon Nov 23) | Each needs an audience, a comment history or a rule check first | About 1 h |

Hours split the calendar's 8-hour week. The Jan 11 and Feb 1 retros keep, cut or promote platforms by your own lead numbers ([08](08-tools-measurement-compliance.md), 3.4).

**Create once, post everywhere.** Monday's 2-hour batch makes the next week:

| Make once | Post to |
|---|---|
| 3 short videos | TikTok and YouTube Shorts; Instagram Reels shared to Facebook Reels; an Instagram Story with a link sticker |
| 1 carousel | Instagram feed, then the Facebook Page, then 1 to 3 Pins. LinkedIn document carousels use the same Canva templates |
| Text posts from the text kit | 3 LinkedIn posts, reshared on the Company Page next morning; 2 or 3 short posts for Threads, X and Bluesky |
| 1 free preview lesson, every second week | One recording, two cuts: the course video and a YouTube long-form video that Shorts link to |

---

## 3. Where every post sends people

1. **A free first step:** the Starter Kit at `/free-guide` (everyday and prompt posts), the assessment at `/assessment` (business posts) or a free preview lesson.
2. **Email:** opting in or finishing the assessment starts an email series automatically.
3. **A call or a course:** the Free AI Strategy Call (`/book/ai-strategy-call`), the courses (`/courses`) or 1:1 coaching.
4. **Implementation:** done-with-you work at `/consulting`, then the free AI Implementation Discovery Call.

DM keywords: **KIT** (comment `#prompts`) → Starter Kit, **READY** (`#aiready`) → assessment, **WORKFLOW** (`#aiworkflow`) → the free lesson "Anatomy of an AI Workflow". Starter Kit links go to `/free-guide`, never `/guide`. Never share `/assessment/results/…`, `/booking/…` or `/book/confirmed/…` pages.

**How tracking works.** Every link carries UTM tags: platform (`utm_source`), placement (`utm_medium`), campaign by posting date (`launch`, `evergreen`, `bf-2026`, `ny-2027`) and post ID (`utm_content`, e.g. `sv-07`). The site keeps a visitor's first tagged click for 90 days and copies it onto the contact when they give an email. **Admin → Funnels → Attribution → "Channel (UTM source)"** shows leads, calls, customers and revenue per platform; each contact's page shows the post. Every main bio link goes to the `/links` page (Starter Kit first): `https://principeai.com/links?utm_source=<platform>&utm_medium=bio&utm_campaign=evergreen&utm_content=bio`. Copy links from the kits; never retype them ([08](08-tools-measurement-compliance.md), section 2).

---

## 4. Before you post anything

Tick all of these by L-1 · Mon Nov 9.

- [ ] **Vercel production:** `NEXT_PUBLIC_SITE_URL=https://principeai.com`; Stripe, Resend and Anthropic keys live (L-20 · Wed Oct 21).
- [ ] **AI key:** if `ANTHROPIC_API_KEY` isn't live by L-1, delete every **[CONFIRM: AI key live in production]** line.
- [ ] **Prices** checked in Admin → Courses (coaching: Admin → Availability), and again the morning of any **PRICE** post.
- [ ] **CAN-SPAM postal address** (a PO box is fine) in the email footer before any link sends people to `/free-guide` or `/assessment`, by L-8 · Mon Nov 2. Until then, pause the two prospect email automations ([08](08-tools-measurement-compliance.md), 4.1).
- [ ] **Branch `claude/sweet-edison-ne5duy` merged** into the branch Vercel deploys.
- [ ] **`src/config/site.ts` → `social`** filled with full `https://` URLs and redeployed (L-12 · Thu Oct 29; [01](01-profile-setup.md), section 7).
- [ ] **Handles reserved:** `@principeai`, else `@principe.ai`, `@principe_ai`, `@getprincipeai`; two-factor login on (L-21 · today).
- [ ] **Slow verifications started:** TikTok business, YouTube ID, LinkedIn identity, DNS records for Pinterest, Meta and Bluesky (L-21 · today).
- [ ] **Profiles complete** from [01](01-profile-setup.md) (L-20 to L-15).
- [ ] **Keyword DM replies** live for KIT, READY and WORKFLOW (L-13 · Wed Oct 28).
- [ ] **Every profile link tested in a private window,** with one test opt-in per platform (L-8 · Mon Nov 2).
- [ ] **First batches filmed:** A (LD-01 to LD-03, SV-01), B (SV-09, SV-15, SV-12, SV-02), plus LC-04 and LC-08.
- [ ] **Tools connected** on America/New_York; warm-up scheduled, nothing on Tue Nov 3.

---

## 5. The first 3 weeks at a glance

| Week | Main jobs |
|---|---|
| **1 · L-21 to L-15 · Oct 20 to 26** | Today: pick tools, reserve handles, start verifications. Then Tier 1 profiles (Wed to Fri), **film batch A** (Sat), record LC-04 and LC-08 (Sun), Tier 2 and 3 profiles (Mon) |
| **2 · L-14 to L-8 · Oct 27 to Nov 2** | Canva templates (Tue), DM automations (Wed), `site.social` (Thu), Highlights and first Pins (Fri), **film batch B** (Sat), post Highlights (Sun), **test every link** and schedule the warm-up (Mon) |
| **3 · L-7 to L-1 · Nov 3 to 9** | Election Day: no posts, film batch C. From Wed: warm-up posts and the daily engagement block. Mon: schedule launch week and week 2, then go/no-go |

Then **launch week** (Tue Nov 10): announce everywhere, pin the launch posts, run 14 days of Stories, reply to everyone. **Week 2** settles into the rhythm; Mon Nov 23 brings the first podcast pitches. **Week 3** is Thanksgiving: lighter, nothing on Thu Nov 26. Every slot: [calendar](02-launch-calendar.md), sections 4 to 7.

**Weekly rhythm (Growth).** **Mon:** 9:00 review (30 min), 9:30 batch (2 h). **Tue:** outreach, LinkedIn, long-form video every second week. **Wed:** edit videos. **Thu:** schedule next week. **Fri:** carousel. **Sat:** long-form recording every second week. **Sun:** off. Plus 20 minutes of engagement each weekday: replies first, then comments on other people's posts ([calendar](02-launch-calendar.md), section 3).

---

## 6. Decisions only you can make

| Decision | Default until you decide | Decide by |
|---|---|---|
| **Face on camera** | Nothing assumed. Every script has a no-face version: screen recording plus your voice-over or on-screen text | L-17 · Sat Oct 24 |
| **Name, story, credentials** | `[YOUR NAME]`, `[YOUR STORY: …]`, `[YOUR CREDENTIAL IF ANY]`: fill with true details or delete the line | Before TP-01 (L+0) |
| **Launch date** | Tue Nov 10 | Go/no-go L-1 · Mon Nov 9 |
| **Black Friday promo** | None: value posts and TP-16 version B. A promo needs a real Stripe promotion code with a real end date | L+10 · Fri Nov 20 (code by Mon Nov 23) |
| **Facebook Group** | Opens Mon Jan 4 only if you can personally invite 25+ people who've engaged | L+34 · Mon Dec 14 |
| **X Premium** | Free account; X stays Tier 2 | Only if X brings leads by L+27 · Mon Dec 7 |
| **Scheduling tool** | The $0 stack: native schedulers plus Buffer Free or Metricool Free. Upgrade: Postiz and Canva Pro ([08](08-tools-measurement-compliance.md), 1.1) | Postiz trial from Sun Nov 1; decide by Sun Nov 8 |

Smaller ones: [01](01-profile-setup.md), section 9; [08](08-tools-measurement-compliance.md), section 6.

---

## 7. Claim rules for every post

- No testimonials, student counts, results, time-saved or income claims, or guarantees. None exist yet.
- No "was" or struck-through prices, no fake deadlines. Prices only where useful, checked in Admin → Courses.
- "AI tutor in every lesson" and "plan written by Claude" only with **[CONFIRM: AI key live in production]**. No mention of the course app or PDF book yet.
- Say "AI assistants like Claude, ChatGPT and Gemini", no logos. In About sections: "Principe AI is independent and not affiliated with Anthropic, OpenAI or Google."

The 60-second pre-post check: [08](08-tools-measurement-compliance.md), 4.2.

---

## 8. What changed on the website

On branch `claude/sweet-edison-ne5duy` (commits `daad673`, `3468fa6`):

| Change | To switch it on |
|---|---|
| **Footer social links** (`rel="me"`) and **Organization `sameAs`** on the home page, for each full `https://` URL in `site.social`; blank or non-https entries are skipped | Fill `site.social` ([01](01-profile-setup.md), 7.2), merge, redeploy, check (7.4) |
| **`/links` bio page:** Starter Kit first, then the assessment, courses, strategy call, implementation and your profiles. Hidden from search | Deploy, then point every main bio link at it ([01](01-profile-setup.md), section 8) |
| **Share cards for free preview lessons:** "Free lesson: {title}" plus its summary | Deploy with the correct `NEXT_PUBLIC_SITE_URL` |

Still open: the email postal address, the independence line in the footer and `/terms`, and real testimonials (only with permission).

---

## 9. File map

| File | What's in it |
|---|---|
| [README.md](README.md) | This page |
| [01-profile-setup.md](01-profile-setup.md) | Handles, bios, images, verification, the `site.ts` step, all 57 tagged profile links |
| [02-launch-calendar.md](02-launch-calendar.md) | Day-by-day plan to Jan 31, time budget, rituals, checkpoints, every post's date |
| [03-short-video-kit.md](03-short-video-kit.md) | LD-01 to LD-03, SV-01 to SV-27: scripts, filming, no-face version, captions |
| [04-linkedin-x-threads-bluesky.md](04-linkedin-x-threads-bluesky.md) | TP-01 to TP-66, the engagement routine, the LinkedIn newsletter |
| [05-instagram-pinterest-facebook.md](05-instagram-pinterest-facebook.md) | VC-01 to VC-83: carousels, Stories, Highlights, Pins, Facebook Page and Group |
| [06-youtube-reddit-outreach.md](06-youtube-reddit-outreach.md) | LC-01 to LC-60: YouTube channel and long-form, Reddit, outreach templates |
| [07-content-bank.md](07-content-bank.md) | CB-01 to CB-83 ideas, the funnel map, website gaps, offer facts |
| [08-tools-measurement-compliance.md](08-tools-measurement-compliance.md) | Tools, UTM rules, Monday scorecard, compliance, paid boosting |

Short of time? Kits 03 to 06 each open with "Start with these 10". The [research/](research/) folder holds the sourced background research; you don't need it to post.

---

## 10. How Claude can help next

- **Schedule the calendar** through Postiz once you connect it (API key stored as a secret): Claude drafts each week with tagged links, you approve, Claude schedules.
- **Make the site changes:** merge this branch, fill `site.social`, add the email postal address and the independence line.
- **Make scripts record-ready:** your true details, teleprompter cuts, shot lists, and the missing LC-15 script (due Fri Dec 11).
- **Design carousels and Pins** as image files in the brand colours and fonts, ready to post or finish in Canva.
- **Run the Monday review** from your Admin → Contacts export and Funnels numbers: scorecard, winners, next experiment.
