> **Background research, text-professional.** Written on 2026-10-20 while building this kit. Sources are listed with their URLs and dates; anything marked UNVERIFIED still needs checking in the app. Where this file disagrees with the kit (tracking links, dates, file names), the kit wins: see [README](../README.md) and [08-tools-measurement-compliance.md](../08-tools-measurement-compliance.md).

# Principe AI: 2026 playbook for LinkedIn, X, Threads and Bluesky (research notes)

Researched on 2026-10-20 for a solo, US-based founder (America/New_York) who is launching Principe AI with zero followers. Every platform fact carries a source tag like [L7], and the URL and date for each tag are in section 9. **UNVERIFIED** marks anything I could not confirm on an official page or a reputable 2025-2026 source. **Recommendation** and **Hypothesis** mark my own judgement, not platform facts.

How I checked: live web search plus Firecrawl, on 2026-10-20. LinkedIn's Help Center blocked full-page scraping, so the LinkedIn Help facts come from the official help-page excerpts that the search returned. Buffer and Sprout figures are averages across all their customers, not your audience, so test them against your own analytics after 2-3 weeks.

Related files in this folder: `tools-compliance.md` covers schedulers, the `/links` page, the UTM convention, handles and FTC rules. This file uses its UTM convention (section 7) and does not repeat the compliance material.

---

## 0. The short version

1. **LinkedIn is the main channel**, and the founder's personal profile does the work. The Company Page is a credibility anchor and a reshare target, not a reach engine. Personal profiles get far more distribution than Pages [L22, vendor data].
2. **On LinkedIn, keep links out of the feed.** Third-party studies put the cut at 45-70% (reported as about 60%), and LinkedIn has not published a figure [L16][L24]. Put the funnel in the Featured section, the free Service Page, the newsletter, and DMs sent when someone asks.
3. **LinkedIn rewards topic consistency, document carousels and real conversation.** Its new LLM-based feed (2026-03-12) "understands what a post is actually about" and is filtering engagement bait [L14]. Carousels had the highest median engagement of any LinkedIn format in Buffer's 2026 data, at 21.77% [B1].
4. **Delay newsletter edition #1 until early January.** LinkedIn invites all your connections and followers to subscribe when the first edition is published [L21]. Publishing it then gets the biggest one-time invite and lands in the "new year, new skill" season.
5. **On X, free accounts get almost no reach.** Buffer's 18.8M-post study found a median of under 100 impressions per post for free accounts, against more than 600 for Premium [B3]. Either pay $8/month for Premium and reply every day, or keep X in light maintenance mode. Musk says links are not penalized (2026-07-29) [X7]. Link posts still had the lowest engagement in Buffer's X data [B1].
6. **Threads is the cheapest growth channel to run alongside Instagram.** Use one topic tag per post; Meta says tagged posts get more views [T1][T2]. Post on weekday mornings [T4], and reply to every reply. Replying gave the biggest engagement lift on Threads (+42%) of any platform in Buffer's data [B2].
7. **Bluesky is Tier 3, but claim `@principeai.com` this week.** The domain handle is a 10-minute DNS job [BS3]. The audience is small and shrinking, about 10.4M mobile MAU in June 2026, down 27% year on year [BS7], and it is openly hostile to generative AI [BS8]. Cross-post there, but do not invest heavily.

---

## 1. Quick reference: limits that matter

| Item | LinkedIn profile | LinkedIn Page | X | Threads | Bluesky |
|---|---|---|---|---|---|
| Post text | 3,000 chars [L1] | 3,000 chars (assumed same composer; **UNVERIFIED**) | 280 free; 25,000 on any Premium tier, Basic included [X1] | 500 chars, plus a 10,000-char "text attachment" [T3] | 300 graphemes [BS9] |
| Bio or headline | Headline 220; About 2,600 (third-party, consistent across sources; **official page not reached**) | Tagline 120; About 2,000 (third-party; **UNVERIFIED** officially) | Bio 160, display name 50 [X2] | Bio 150 (third-party; **UNVERIFIED**) | Bio 256, display name 64 (third-party, checked against lexicons) [BS9] |
| Profile links | Contact-info website (free); custom button (Premium only) [L3] | Custom CTA button (free) [L6] | 1 website field; Link Spotlight on Professional accounts [X3] | Up to 5 bio links [T15] | Links in the bio text (no separate field; **UNVERIFIED**) |
| Video | Up to 15 min, 5 GB [L9] | Same, 5 GB (third-party re-check of Help) | 140 s free [X6]; about 3 h / 8 GB on Premium [X1] | Up to 5 min (third-party, consistent) | Up to 10 min / 300 MB (since 2026-08-26) [BS1] |
| Documents (PDF carousels) | 100 MB, 300 pages; PDF, PPT(X), DOC(X) [L8] | Same [L8] | n/a | Carousel of up to 20 photos or videos (third-party) | Up to 4 images (third-party; **UNVERIFIED**) |
| Polls | Question 140, options 30 [L10] | Pages can create polls [L10] | Yes (limits **UNVERIFIED**) | Yes (excluded from fediverse sharing) [T8] | No native polls (**UNVERIFIED**) |
| Hashtags | Weak keyword signal; hashtag following removed [L20] | Same | Optional; Musk: "stop using" (Dec 2024) [X11] | **One topic tag per post** [T1] | Hashtags drive many custom feeds [BS10] |
| Native scheduling | Yes, 10 min to 3 months ahead (per `tools-compliance.md` [S6]) | Yes, 1 h to 3 months | Via X Pro, which is Premium+ only since 2026-03-26 [X5]; free composer scheduling **UNVERIFIED** | Yes (in-app) | **No.** Drafts since Feb 2026 [BS5]; scheduling needs a third-party tool |

---

## 2. LinkedIn

### 2.1 What changed in 2026 (read this first)

- **The feed was rebuilt on LLMs on 2026-03-12.** LinkedIn said the new ranking system "better understands what a post is actually about and how it relates to a member's evolving interests and career goals." It also said: "Over the next few months we'll be improving our systems to reduce repetitive, click-driven posts and filter out engagement bait." [L14] Social Media Today's examples of engagement bait include "Comment 'Yes' if you agree" and a video unrelated to the post text [L14].
- **Distribution shifted from connections to interests.** Richard van der Blom's 2026 Algorithm Insights report (about 1.3M posts) calls the move from a relationship graph to an interest graph the biggest shift in 10 years. Reach for *active creators* is down about 60% over two years. 9% of the feed is now suggested posts [L15]. This is independent research, not a LinkedIn figure.
- **"Topic fingerprint."** Van der Blom recommends keeping about 80% of posts on one or two core topics. He also suggests pasting your last 20 posts into an AI tool and checking that it finds no more than 2 topics [L15]. **Recommendation for Principe AI:** use two lanes only. (1) Practical AI for small-business owners and professionals. (2) AI for everyday life. Both are already the site's two paths, "For your business" and "For your life".
- **Creator Mode is gone,** but its features are now available to everyone. You choose **Follow or Connect** as the primary profile button. The Featured section, newsletters and post analytics are open to all members. LinkedIn Live, Audio Events and the Follow link have their own eligibility criteria [L2].

### 2.2 Personal profile setup (the founder): do this before the first post

| Field | Rule | What to put (Recommendation) |
|---|---|---|
| Photo + banner | n/a | A real face photo. Banner in brand violet with gold accent: "Learn AI. Implement AI. Grow with AI." plus "Free AI Starter Kit at principeai.com" |
| Headline (220 chars) | Shows in search, comments and DMs | `Founder, Principe AI · I help business owners and busy professionals put AI to work, in plain English · Courses, coaching and done-with-you AI systems` (about 150 chars) |
| About (2,600 chars) | Only the first lines show before "see more" (2-3 lines, or about 300 chars on desktop; third-party, **UNVERIFIED**) | Open with the promise, not a biography. Example: "Most people don't need more AI hype. They need one useful thing they can do with AI this week." Then three short blocks: who you help (life and business), how (Assess → Learn → Implement), and the free starting points with plain URLs. End with `principeconsults@gmail.com`. No invented stats or client results. |
| Primary button | Follow or Connect [L2] | **Connect for the first 60-90 days.** At zero you need 1st-degree connections, because they seed the newsletter invite and early reach. Switch to Follow after about 1,000 connections (**Hypothesis**). |
| Featured section | Pin posts, articles or external links; links here carry no feed penalty [L16] | In order: (1) Free AI Starter Kit, (2) AI Readiness Assessment, (3) Book a free AI Strategy Call, (4) the newsletter once it exists, (5) your best carousel. Every link UTM-tagged (section 7). |
| Contact info → Website | Free | `principeai.com/links?utm_source=linkedin&utm_medium=bio&utm_campaign=profile` (until `/links` exists, use `/free-guide`) |
| Custom button | **Premium only.** Options: Visit my store, Visit my website, View my portfolio, View my blog, Book an appointment, View my newsletter [L3]. Premium Business adds a "Request services" button [L4] | Skip at launch (section 2.10) |
| Service Page | **Free.** A dedicated landing page that "showcases your services and operates on a request and proposal model" [L13] | **Create it.** List AI Coaching (1:1), AI Implementation (done-with-you) and AI Training. It gives you a services storefront and inbound requests without Premium. |
| Verification | **Free** identity check through CLEAR in the US (government ID + phone); separate from Premium [L11] | Do it on day 1. A free trust signal for a brand with no testimonials yet. |
| Experience | n/a | "Founder, Principe AI (Principe Consults)", linked to the Company Page so its logo shows |

### 2.3 Company Page setup

- **Basics:** Name "Principe AI". Tagline (120 chars; third-party figure): `Learn AI. Implement AI. Grow with AI. Practical AI courses, coaching and done-with-you AI systems.` (about 98 chars). About (2,000 chars): adapt the founder About into the third person. Industry, company size and location menu values are **UNVERIFIED**, so pick the closest options in the Page editor.
- **Custom button (free):** Visit website, Contact us, Learn more, Sign up, Register (also Give, Volunteer, Request demo, Buy) [L6]. **Recommendation:** "Sign up" → `/free-guide?utm_source=linkedin&utm_medium=bio&utm_campaign=profile&utm_content=page-button`.
- **Page verification badge:** available; it signals an official organization Page [L11]. Eligibility criteria are **UNVERIFIED**, so check whether your Page qualifies.
- **Invite connections to follow:** credits are monthly, shared across admins, and reset on the 1st [L12]. LinkedIn recommends Pages have at least 150 followers [L12]. Third parties report that a 2026 rollout cut free Pages from 250 to as few as 50 credits a month (**UNVERIFIED**; LinkedIn has not confirmed it) [L23]. **Recommendation:** spend the full allowance on the 1st of each month, inviting people who already engage with your posts.
- **Page newsletter:** possible once the Page meets the access criteria (more than 150 followers and/or connections, plus recent original posts) and you are a super or content admin [L7]. **Recommendation:** run the newsletter from the founder profile, not the Page. The profile has the larger network and LinkedIn invites that network.
- **How to run the Page:** Pages are a weak organic channel. Vendor analyses put Page posts at about 1.6% of followers reached, and say employee or founder posts get several times the reach of identical Page posts [L22] (third-party, **UNVERIFIED** methodology). **Recommendation:** post on the founder profile first. The next day, repost to the Page with one line of context. About once a week, publish a Page-only announcement, such as a new course module, an event or an offer.
- **Premium Company Page** costs $99.99/month or $839.88/year [L5]. The reported benefits are seeing who visited the Page and auto-inviting people who engaged with your posts. **Skip at launch.**

### 2.4 Post formats and what to make from the repo

| Format | 2026 evidence | Principe AI use (Recommendation) |
|---|---|---|
| **Document / PDF carousel** | Buffer (45M+ posts, 2026-03-19): carousels had a **21.77%** median engagement rate, versus 7.35% for video, 6.52% for images, 3.81% for links and 3.18% for text [B1]. Van der Blom also rates documents/carousels and images highest [L15] | Weekly flagship. 6-10 slides in brand violet and gold. First sources: the starter kit's **"Day 2: the 5-part prompt (role, context, task, format, examples)"**, the 7-day plan as a 7-slide "save this" carousel, prompt-library categories ("5 prompts for [task]"), and lesson summaries from `src/db/seed-content/course-*.ts`. Last slide: "Get all 50 prompts free, link in my Featured section" |
| **Text + image** | Van der Blom's suggested 3-post week is text+image, carousel, text+image. He says he "definitely wouldn't do" text-only "unless you are an exceptional copywriter" [L15] | Lessons learned, "what I'd do if I ran a [plumbing / dental / accounting] business with AI", plain-English myth-busting. Use a screenshot of a real prompt and output as the image |
| **Native video** | 2nd in Buffer's engagement data [B1]. Van der Blom: only do it "if you genuinely like it" [L15]. Up to 15 min [L9] | Cut the course **welcome videos** (`deliverables/video-scripts/*/00-welcome.md`) into 45-90 s native clips. Upload them natively; never post a YouTube link |
| **Polls** | Van der Blom: "would not do" [L15]. Limits: 140-char question, 30-char options [L10] | At most one a month, and only to research an offer ("What's stopping you from using AI at work?") |
| **Newsletter / long form** | Van der Blom: newsletters outperform regular posts on reach, engagement and conversion. A standalone article gets about 0.4x normal reach [L15] | See 2.8. Do not publish standalone LinkedIn Articles |
| **Link post** | Lowest-but-one engagement (3.81%) [B1] and the reach cut in 2.5 | At most 1 post in 5 (2.5) |

### 2.5 Links in 2026: the rules

- **The penalty is real but unofficial.** Forbes (contributor piece, 2026-07-30): "Every time you put a link in a LinkedIn post, the algorithm cuts its reach by around 60%" [L16]. Other vendor studies give 45-70% [L24]. LinkedIn has published no figure, and Sendible notes this [L24].
- **Links in the first comment no longer clearly work.** Forbes says the first-comment trick "gets the same cut now" [L16]. Gromming says comment links still do better than body links but now lose 10-15% [L24]. Treat the first-comment trick as **unreliable**.
- **Where links cost nothing:** the Featured section, the About section, the headline, the newsletter, native uploads (a video instead of a YouTube link, a PDF instead of a Drive link), and DMs [L16].
- **Recommendation for Principe AI:**
  1. Write every post so it is useful without a click. For example, give 3 of the 50 prompts in full.
  2. Make the CTA "Comment **KIT** and I'll DM you the free AI Starter Kit" or "It's in my Featured section." Then DM the UTM-tagged `/free-guide` link by hand (`utm_medium=dm`). **Caution:** LinkedIn's March 2026 statement targets engagement bait such as "Comment 'Yes' if you agree" [L14]. Keep keyword CTAs to the content-delivery kind (people get something they asked for), use them at most once a week, and make sure the post body is valuable on its own. Whether "comment for the link" posts are demoted is **UNVERIFIED**.
  3. When a link has to be in the post (Black Friday on 2026-11-27, or a cohort launch), put it in the body. Make it 1 post in 5, on a day the other posts did not need [L16].

### 2.6 Cadence, timing and the first hour

- **Frequency:** Buffer (2M+ posts, 2025-08-28) calls 2-5 posts a week the sweet spot. Against posting once a week, 2-5 posts a week added about 1,182 impressions per post; 6-10 posts added about 5,001 [L18]. Van der Blom says the average creator does best on 2-3 posts a week, down from 5-6 [L15]. **Recommendation: 3 posts a week** (Tue/Wed/Thu), never two on one day.
- **Times (the two big studies disagree):**
  - Sprout Social 2026: Tue 11 a.m.-5 p.m., Wed 11 a.m.-4 p.m., Thu 11 a.m. and 1-5 p.m. local time; weekends weakest [L19].
  - Buffer (4.8M posts, 2026-09-09): late afternoon and evening are best (3-8 p.m. on weekdays). The best single slot is **Wednesday at 4 p.m.**, then Friday at 3 and 4 p.m. Monday, Tuesday and mornings are the weakest [L17].
  - **Recommendation:** start at **Tue-Thu 2:00-4:00 p.m. ET**, where both studies overlap. That is 11 a.m.-1 p.m. Pacific, so the whole US is awake. After 3 weeks, A/B one slot against 8:00 a.m. ET. **Conflict to resolve:** `tools-compliance.md` §1.4 proposes LinkedIn slots at 7:30-9:00 and 12:00-13:00 ET as a hypothesis. Buffer's 2026 data finds mornings weakest, so I would move those slots later.
- **First 15-60 minutes:** van der Blom stresses the first 10-15 minutes after publishing, when you should recognize and answer engagement [L15]. In Buffer's data, accounts that reply to comments see about **30% more engagement on LinkedIn** [B2]. **Recommendation:** block 30 minutes after each post. Reply to every comment with a real sentence, and ask a follow-up question so the thread keeps going.

### 2.7 Daily engagement routine (where a zero-follower account actually grows)

Van der Blom's routine takes 25-30 minutes a day [L15]:
- Engage with **5-10 peers** in the morning.
- Check a list of clients or prospects and add something meaningful to their posts.
- Leave **5-10 comments** on interesting discussions in your 2nd- and 3rd-degree network.
- **Stay in your topic cluster.** Commenting on off-topic posts, such as a former client's job opening, confuses LinkedIn about what you are about.
- Van der Blom says **80% of the comments he gets in the first 5 minutes are AI-written** [L15]. Do not use AI comment tools. Commenting as a human is your differentiator.

**Recommendation for Principe AI:** keep a saved list of about 30 accounts. Mix small-business coaches, local chambers of commerce, industry associations and AI-for-SMB creators. Every weekday, leave 5 substantive comments (2-4 sentences, with one concrete AI tip) and send 10 personalized connection requests to owners in your two lanes. Never use engagement pods or automation tools. **UNVERIFIED (not re-checked today):** LinkedIn's User Agreement prohibits bots and automated methods for messaging and connecting.

### 2.8 LinkedIn newsletter

- **Access criteria:** more than 150 followers and/or connections, recent original content of any type, and a record of good standing [L7]. Meeting the criteria does not guarantee immediate access, because the rollout is gradual. Check under Analytics & tools → Creator tools, where Newsletter shows "Available" (third-party description of the menu) [L7].
- **How it grows:** when you publish the **first edition**, LinkedIn automatically invites your connections and followers to subscribe [L21]. One guide says LinkedIn does not re-invite people who ignored that first invite (**UNVERIFIED**). New followers are also prompted to subscribe; van der Blom reports a 60% conversion on his account [L15]. Each profile or Page can run up to 5 newsletters [L21]. Per-link click tracking is now live [L15].
- **LinkedIn's own growth tactics** (Nov 2025): consistent topic and schedule, an email-signature link, cross-platform links (including QR codes), creator collaborations, conversation-starting content, explicit share requests, and paid Article/Newsletter Ads [L21].
- **Recommendation (timing matters):**
  - **Nov-Dec 2026:** grow connections to 500+ through the daily routine.
  - **Week of 2027-01-04:** publish edition #1, "Your 2027 AI plan in 30 minutes a week". This gets the biggest one-time invite and lands in New Year "learn a skill" season.
  - **After that:** publish every two weeks (weekly if you can sustain it). Name it something like *"The Practical AI Brief by Principe AI"*.
  - **Each edition:** one idea, one prompt and one CTA to `/free-guide` or `/assessment` (`utm_medium=social&utm_campaign=newsletter-linkedin`). Links inside the newsletter are fine [L16].
  - Treat the newsletter as a bridge to your **email list**. LinkedIn owns its subscriber list; the site's opt-in is the asset you own.

### 2.9 Hashtags

LinkedIn has removed hashtag following, dropped hashtags from profiles, and stopped surfacing them in the search dropdown. Hashtags now work as minor keyword signals [L20]. Van der Blom finds they are no longer a meaningful lever (older edition) [L15]. **Recommendation:** use 0-3 specific tags at the end, such as `#SmallBusiness #AI`. Put effort into clear words in the first two lines, because the LLM ranker reads meaning, not tags [L14].

### 2.10 LinkedIn Premium: worth it for a new brand?

- **Premium Business:** from $69.99/month or $539.88/year [L4]. Includes a custom profile button, featured profile content and more. The "Request services" button also appears on your feed posts, messages and search results [L4].
- **Premium Company Page:** $99.99/month or $839.88/year [L5].
- **Verdict (Recommendation): not at launch.** Every must-have is free: Featured links, the Service Page, the contact-info website, CLEAR verification, newsletters and the Page CTA button. Consider a Premium Business trial in month 3 *only if* profile views pass about 300 a week and you want the "Book an appointment" button pointing at `/book/ai-strategy-call`. LinkedIn has not said that Premium boosts feed reach (**UNVERIFIED**).

### 2.11 AI-content rules on LinkedIn

- LinkedIn reads C2PA "Content Credentials" metadata and shows a small label on images and video that carry it. LinkedIn admits it cannot identify all AI content [L25].
- No self-disclosure toggle for AI-written *text* was found (**UNVERIFIED**). The real risk is the ranker. LinkedIn is filtering "repetitive, click-driven posts" and engagement bait [L14], and generic AI-sounding posts are exactly that.
- **Recommendation:** use Claude to draft, then rewrite the hook and add one personal observation per post. Never post AI images of people. Screenshots of real prompts and outputs are your best visuals: honest, on-topic and label-free.

---

## 3. X (Twitter)

### 3.1 Profile setup

- **Fields:** display name up to 50 chars, bio up to 160, plus location and website [X2]. Handle `@principeai`: X allows at most 15 characters and no periods (see `tools-compliance.md` §3).
- **Convert to a free Professional Account.** You get Professional Home analytics, a professional category label, and Profile Spotlights, including a **Link Spotlight** [X3]. Category: "Education" or "Software company" (menu values **UNVERIFIED**).
- **Bio draft (about 140 chars):** `Practical AI for business owners and everyday people. Plain English, no hype. Run by [YOUR NAME]. Free AI Starter Kit: 50 prompts + 7-day plan`
- **Website:** `principeai.com/links?utm_source=x&utm_medium=bio&utm_campaign=profile`
- **Pinned post:** a 5-post thread, "The 5-part prompt that fixes most bad AI answers" (role, context, task, format, examples, from starter-kit Day 2). Do not put a percentage in the hook unless you can back it up. End the thread with the Starter Kit link.
- **Recommendation: a founder-voiced brand account.** Use the brand handle, but write in the first person and say who runs it. People follow people on X and Threads.

### 3.2 Post limits and features

- 280 characters free; **25,000** on any paid tier, including Basic [X1].
- Video: **140 seconds** for free users [X6]; about 3 hours / 8 GB (1080p) on Premium, on the web and iOS [X1]. Course welcome clips must be cut to 2:20 or less unless you pay.
- **Articles** (long-form): "Publishing Articles is a feature limited to Premium subscribers" [X1]. Basic does not include it.
- **Communities:** in April 2026, X said it would shut Communities down on 2026-05-06, citing spam. A later source says they are still active, so the status is **UNVERIFIED** [X12]. Do not build a plan on them.
- Schedulers: since April 2026, X's API charges about **$0.20 per post with a URL**, against about $0.015 without. Some third-party schedulers strip links, some charge you, and some absorb the cost [X16]. Post link posts natively on x.com.

### 3.3 What the 2026 algorithm rewards (from the open-sourced code)

X open-sourced its Grok-based For You ranking code on 2026-01-20, with further releases through September 2026 [X10]. From analyses of the code (postory.io, 2026-05-16) [X9]:
- **Positive signals, strongest first:** following the author from the feed (+++); reply (++); repost (++); then quote, profile click, share by DM or copied link, photo expand, link click, video quality view (only above a minimum duration), dwell, and like (+).
- **Negative signals:** "Not interested" (−); block, mute or report (−−).
- **Author diversity decay:** a viewer's second post from you in one session is attenuated, and the third is "crushed." Out-of-network candidates are down-weighted [X9]. *Implication:* space posts out, and do not burst-post.
- **Replies are scored by Grok for quality on a 0-3 scale.** Low-effort replies ("this", emoji) score near zero. Accounts **under 1,000 followers get an extra spam screen** on replies [X9].
- **Mutual-follow boost (2026-07-13):** posts from mutuals get more visibility, including in replies [X10].
- Exact weights are in a parameters module that was not published, so treat any article quoting precise multipliers as **UNVERIFIED** [X9].

### 3.4 Links on X

- **Official:** on 2026-07-28 Nikita Bier said "you do not need to put the links in replies anymore." On 2026-07-29 Elon Musk said X hasn't penalized link posts "for over a year" [X7]. The open code has no hard-coded link penalty, and link clicks count as positive [X9]. Since October 2025, links open with the post's engagement bar still visible, which was meant to fix link posts' weak engagement signals [X15].
- **Observed:** link posts had the lowest median engagement in Buffer's X data, 2.25% against 3.56% for text [B1]. PPC Land measured about 94% fewer views for link posts and attributes this to lower engagement, not a coded penalty [X8].
- **Recommendation:** links in the post body are allowed, but they still underperform. Default to a value-first post, add the link in **your own first reply**, and keep the bio link working. Run your own 4-week test: alternate body-link and reply-link versions of similar posts.

### 3.5 Formats, cadence and times

- **Formats (Buffer 2026):** text 3.56% median engagement, images 3.40%, video 2.96%, links 2.25% [B1]. **Principe AI ideas:**
  - one prompt per post, with a before/after screenshot;
  - "Day N" posts from the 7-day plan;
  - short threads (5-7 posts) for each lesson;
  - quote-posts of AI news, adding "what this means for a small business".
- **Cadence:** the author-diversity rule above means more than 3-5 standalone posts a day starts to hurt [X9]. **Recommendation for a solo founder:** 1 post a day on weekdays (5 a week) plus 10-15 thoughtful replies a day *if* you pay for Premium. Without Premium, 3 a week cross-posted from LinkedIn/Threads ideas, and replies only.
- **Times:**
  - Sprout (updated March 2026, about 2B engagements): Tue-Thu 12-6 p.m. local; Mon 2-3 and 5 p.m.; weekends worst [L19].
  - Buffer (8.7M posts, 2026): best slot **Tuesday at 9 a.m.**, then Wednesday 9-10 a.m.; best days Tue-Thu; weakest Friday and Saturday [X14].
  - **Recommendation:** Tue-Thu at **9:00 a.m. ET** for the main post, plus a reply session at 12:00-1:00 p.m. ET.

### 3.6 Engagement and the first hour

- Reply to every reply on your post within the first hour. The code analysis says replies the author engages with carry extra weight and are separately scored [X9]. Buffer measured only a +8% engagement lift from replying on X, the smallest after Bluesky [B2]. On X, **replying under other people's posts** matters more than replying under your own.
- Make every reply additive, because Grok scores reply quality 0-3 [X9]. Each weekday, write 10 replies of 2-3 sentences with a concrete tip under posts from mid-size accounts (5k-100k followers) in AI-for-business, small-business and productivity.
- Follow back real people in your niche; mutuals get a boost [X10].

### 3.7 Hashtags

Musk told users in December 2024 to stop using hashtags, saying they "look ugly" and the system no longer needs them. X banned hashtags in ads in June 2025 [X11]. No official evidence that they help organic reach. **Recommendation:** use 0 hashtags; put keywords ("AI for small business", "ChatGPT", "Claude") in plain text.

### 3.8 X Premium: worth it?

| Tier (web, US) | Price | What matters for Principe AI [X1] |
|---|---|---|
| Basic | $3/month or $32/year | 25k-char posts, editing, longer video, "reply prioritization". **No checkmark, no Articles, no Media Studio** |
| **Premium** | **$8/month or $84/year** | Blue checkmark after review, "larger reply prioritization", Articles, Media Studio, about 50% fewer ads, can apply for creator monetization |
| Premium+ | $40/month or $395/year | Largest reply prioritization, no ads, X Pro (TweetDeck; Premium+ only since 2026-03-26 [X5]), SuperGrok |
| Premium Business (Verified Organizations) Basic | $200/month or $2,000/year [X4] | Gold check for orgs. **Not for this stage** |

- **Evidence:** Buffer's study (18.8M posts, 71k accounts, Aug 2024-Aug 2025) found free accounts' median reach under 100 impressions per post, Premium accounts above 600, and Premium+ above 1,550. By early 2025, free accounts' median engagement rate had fallen to about 0% [B3]. A smaller Buffer test found only about a 2x gap [B3]. This is correlational: people who pay may also post more.
- **Verdict (Recommendation):** if X gets real time, **Premium at $8/month is the minimum viable setup.** Skip Basic (no check), Premium+ and Premium Business. If X is only a cross-post destination, do not pay. Set the final name, photo and handle *before* subscribing: changing any of them removes the checkmark until X re-reviews the account [X1]. All tiers require phone confirmation [X1].

### 3.9 AI-content rules on X

In February 2026, X was reported to be developing a "Made with AI" label that users can apply to their own posts. Whether it has launched is **UNVERIFIED** [X13]. X's synthetic and manipulated media policy was not re-checked today (**UNVERIFIED**). **Recommendation:** add "(AI-generated image)" in the text whenever you post an AI image, and prefer real screenshots.

---

## 4. Threads

### 4.1 Context

- **Scale:** Meta reported 400M monthly users in August 2025, and secondary sources cite 500M in June 2026 (**UNVERIFIED** against Meta's newsroom) [T10]. Similarweb put Threads at about 147M mobile daily users in July 2026, ahead of X's roughly 124M [BS7]. Pew (survey Feb-Jun 2025, published 2025-11-20): 8% of US adults use Threads, against 21% for X and 4% for Bluesky [T11].
- **Fit:** Threads suits the "For your life" lane and small-business owners who already use Instagram. Threads is tied to the Instagram account, which `tools-compliance.md` lists as a primary channel, so the profile is close to free to run.

### 4.2 Profile setup

- **Handle:** the Instagram handle (`@principeai`). Some users report being able to create Threads accounts without Instagram, but that is not needed here [T16].
- **Bio:** 150 characters (third-party). Draft: `Practical AI for your life and your business. Plain English, no hype. Run by [YOUR NAME]. Free AI Starter Kit below`
- **Links:** up to **5 bio links**, with link-click analytics [T15]. Order them: `/links` (or `/free-guide`), `/assessment`, `/courses`, each with `utm_source=threads&utm_medium=bio`.
- **Fediverse sharing:** optional. Once on, new posts are shared to Mastodon and other servers after a 5-minute delay. It is not retroactive, and polls and reply-limited posts are excluded [T8]. **Recommendation:** turn it on. It is free reach into a tech-literate audience.

### 4.3 Post limits and features

- **500 characters** per post or reply. A **text attachment** holds up to 10,000 characters, with bold/italic formatting and links (launched 2025-09-04). Attachments are not indexed by search engines and are not federated [T3]. Use attachments for "full prompt" posts: the hook goes in the post, and the complete copy-paste prompt goes in the attachment.
- **One topic tag per post** [T1]. Meta's own data: "posts with tagged topics generally receive more views than those without one" [T2].
- **Video** up to 5 minutes; carousels of up to 20 items (third-party, consistent).
- **Links:** a single source citing Meta's API documentation says up to 5 links per post (**UNVERIFIED**) [T17].
- **Communities** came out of beta in June 2026, with a hub and icons. Live chats with up to 3 co-hosts arrived in July 2026, and Threads is testing user votes to turn tags into communities (October 2026) [T5][T6]. **Ghost posts** (posts that disappear after 24 hours) launched in October 2025 [T5].
- **Feed controls for users:** "Dear Algo" (February 2026, US/UK/AU/NZ) and "Your Algo" (June 2026) let people tune their own feed by topic [T5]. *Implication:* being clearly about one topic matters more than tricks.

### 4.4 Links on Threads

- Adam Mosseri said in 2025 that the team had been working to make sure links are "ranked properly," and that they had worked "much better for more than a month" [T7]. In late 2024 he said Threads doesn't downrank links, but places little value on link clicks [T7].
- Buffer 2026: link posts still had the lowest median engagement, 2.34%, against 2.79% for text [B1]. The gap is small.
- **Recommendation:** put links in the post body when the post is an offer (for example, Black Friday). For everything else, use the bio links, or put the link inside a text attachment.

### 4.5 Formats, cadence and times

- **Formats (Buffer 2026):** video 5.55%, images 4.55%, text 2.79%, links 2.34% [B1]. Video does best on a "text" platform. **Recommendation:** for each lesson, post a 30-60 s vertical clip (reuse your Reels/TikToks), an image post (a prompt screenshot), and one plain-text opinion or question.
- **Cadence:** Buffer says posting daily, or more, correlates with stronger growth. If that is too much, start at 3-4 posts a week [T4]. **Recommendation: 1 post a day on weekdays** plus replies.
- **Times:** Buffer (2.5M posts, 2026-02-04). Best window: **weekday mornings 6-11 a.m. local**. Best slot: Thursday 9 a.m., then Wednesday at noon and Wednesday 9 a.m. **Evenings (6-11 p.m.) are worst**, and Saturday is weakest [T4].
  - **Recommendation:** 8:00-10:00 a.m. ET on weekdays.
  - **Conflict to resolve:** `tools-compliance.md` §1.4 groups Threads with Instagram and TikTok at 19:00-21:00 ET. Buffer's Threads data says evenings are the worst window, so give Threads its own morning slot.

### 4.6 Engagement

- Replying is worth more on Threads than on any other platform in Buffer's data (**+42%**) [B2]. Reply to every reply within the first hour, and keep conversations going for 2-3 turns.
- Join 2-3 Communities (AI, small business, productivity) and post useful answers there, not promotions.
- End text posts with a specific question ("What's one task you'd hand to AI tomorrow?"). Avoid "comment YES" bait. I did not check how Threads ranks bait in 2026 (**UNVERIFIED**), but LinkedIn has said it is filtering it [L14].

### 4.7 Paid verification (Meta Verified)

Prices in 2026 sources conflict. A September 2026 guide gives $14.99/month in-app and $11.99/month on the web for the entry tier (**UNVERIFIED**) [T12]. **Recommendation: skip.** It is not needed for reach at this stage, and nothing found shows a reach benefit on Threads.

### 4.8 AI-content rules (Meta)

On Facebook, Instagram and Threads, Meta may **require** an "AI info" label for photorealistic video or realistic-sounding audio that was digitally created or altered, including with AI. Content shared without a required label can be penalized. The requirement does not apply to images, but Meta may label images automatically from industry metadata [T9]. **For Principe AI:** a real screen recording needs no label. An AI avatar of [YOUR NAME] or a cloned voice does (this matches `tools-compliance.md` §6.5).

---

## 5. Bluesky

### 5.1 Context: is it worth it?

- **Size:** Similarweb counted 10.4M mobile monthly users in June 2026, down 27.2% year on year, and about 3M mobile daily users in July. The quarterly average fell about 52% from Q4 2024 [BS7]. Registered accounts are about 46M (secondary) [BS7]. Pew: 4% of US adults [T11].
- **Hostility to AI:** in March 2026, Bluesky's own AI feed-building tool, Attie, was blocked about 125,000 times and became the second most-blocked account. Critics said it betrayed Bluesky's "implicit anti-AI brand identity" [BS8]. A brand-new AI education account should expect some hostility.
- **The upside:** chronological "Following" feeds, links that are not penalized (link posts matched text posts in Buffer's data), custom feeds, and starter packs. It is also the easiest place to show a verified domain identity.

### 5.2 Profile setup

- **Handle `@principeai.com`.** Create the account with a `.bsky.social` handle first. Then go to Settings → Advanced → "Change my handle" → "I have my own domain", and add a DNS TXT record named `_atproto` with the DID value the app shows. Wait a few minutes, then click "Verify DNS Record" [BS3]. The alternative is to serve the DID as plain text at `https://principeai.com/.well-known/atproto-did` [BS3]. This is a Next.js site, so that could be a route handler, but DNS is simpler. Bluesky "highly encourage[s]" custom domains as a verification signal [BS2].
- **Blue checks:** Bluesky verifies notable and authentic accounts and has a request form. Trusted Verifiers issue scalloped badges [BS2]. Not likely at launch; the domain handle does that job.
- **Display name and bio:** display name up to 64; bio up to 256 graphemes [BS9]. Draft: `Practical AI for your life and your business, in plain English. Honest about what AI can and can't do. Run by [YOUR NAME]. Free AI Starter Kit: principeai.com/free-guide`. The bio link needs the UTM version, so a short `/links` path helps here.

### 5.3 Post limits and features

- **300 graphemes** per post [BS9]. One third-party guide (ferryman.io) says URLs count as 27 characters whatever their length (**UNVERIFIED**). **Hypothesis:** in the official app, a pasted URL generates a link card, and you can then delete the URL text to save characters.
- **Video:** up to 10 minutes / 300 MB (since 2026-08-26) [BS1]. **Drafts:** since February 2026 [BS5]. **No native scheduling** as of October 2026 [BS10].
- **Starter packs:** up to 150 people and 3 custom feeds [BS4].
- **2026 roadmap:** a smarter Discover feed, better follow recommendations, and real-time and live-event features [BS6].

### 5.4 Discovery, formats, links and hashtags

- Discovery comes from the Following feed, the algorithmic Discover feed, thousands of custom feeds (many built from keywords and hashtags), and starter packs [BS4][BS6][BS10].
- **Formats (Buffer 2026, median interactions per post):** video 5, images 4, links 3, text 3 [B1]. **Links perform as well as text**, so put the UTM link right in the post.
- **Hashtags:** 1-2 niche tags such as `#AI` or `#SmallBusiness`. They feed custom feeds (third-party) [BS10].
- **Growth tactics (Recommendation):**
  - Get added to AI or small-business starter packs by DMing their curators.
  - Build your own starter pack, "Practical AI for small business" [BS4].
  - Reply thoughtfully in threads (Buffer measured only +5% from replying on your own posts [B2], so outbound replies matter more).
- **Tone:** lead with honesty and limits, for example "3 things I would NOT use AI for in my business." Never post AI-generated images.

### 5.5 Cadence and times

There is no large 2026 timing study for Bluesky, so all timing advice here is **UNVERIFIED**. **Recommendation:** 3 posts a week, weekdays 9:00 a.m.-1:00 p.m. ET, cross-posted from the Threads/X versions and trimmed to 300 characters. Check replies for 5 minutes a day.

### 5.6 Paid verification and AI labels

There is no paid verification: blue checks are free and handed out by Bluesky or Trusted Verifiers [BS2]. No native AI-content label was found. Moderation runs through optional third-party "labelers," some of which tag AI imagery (**UNVERIFIED** detail) [BS10].

---

## 6. Cross-posting between Threads, Instagram, Bluesky and X

**Native bridges:**
- **Instagram → Threads:** Meta has tested a "Share to Threads" toggle for photos only. Whether it is generally available in October 2026 is **UNVERIFIED** [T13].
- **Threads → Instagram Stories:** supported; stories expire after 24 hours, and a linked account is required [T14].
- **Threads → fediverse:** an official setting, with a 5-minute delay [T8].
- **Bluesky ↔ fediverse:** a third-party opt-in bridge called Bridgy Fed exists (**UNVERIFIED**, not re-checked).
- **X:** has no native bridge to anything.

**Tools:** the Postiz skill in this environment can publish to X, LinkedIn (profile and Page), Threads and Bluesky once the owner connects a Postiz account. Prices and Buffer's alternative are in `tools-compliance.md` §1.2. **Watch:** X charges API apps about $0.20 per link post [X16], so post X link posts natively.

**Do not paste one text everywhere.** The limits differ (LinkedIn 3,000, Threads 500, Bluesky 300, X 280 free), and so do the link and hashtag rules. Use the "one idea, four cuts" workflow below.

| Step | LinkedIn (Tue 2-4 p.m. ET) | Threads (weekday 8-10 a.m. ET) | X (9 a.m. ET) | Bluesky (weekday late morning) |
|---|---|---|---|---|
| Format | 8-slide carousel: "The 5-part prompt" from starter-kit Day 2 | Hook + prompt template in a text attachment; topic tag "AI tips" | Text post with the template, then the link in your own first reply | Short hook + template under 300 chars + link card |
| Link | None in the post; "Featured section" / DM on request | In the attachment or the bio | First reply | In the post |
| Tags | 0-3 hashtags | 1 topic tag | 0 | 1-2 hashtags |
| Day after | Repost to the Company Page with one line of context | Reply to every reply | Quote-post it with a reader's question | None |

---

## 7. UTM-tagged links for these four platforms

These follow the convention in `tools-compliance.md` §2.3: `utm_source` is lowercase and comes from the fixed list; `utm_medium` is `bio`, `social` or `dm`.

| Placement | URL |
|---|---|
| LinkedIn profile website / Featured: Starter Kit | `https://principeai.com/free-guide?utm_source=linkedin&utm_medium=bio&utm_campaign=profile&utm_content=featured-starter-kit` |
| LinkedIn Featured: Assessment | `https://principeai.com/assessment?utm_source=linkedin&utm_medium=bio&utm_campaign=profile&utm_content=featured-assessment` |
| LinkedIn Featured: Strategy Call | `https://principeai.com/book/ai-strategy-call?utm_source=linkedin&utm_medium=bio&utm_campaign=profile&utm_content=featured-call` (confirm the slug in Admin → Scheduling) |
| LinkedIn Page button | `https://principeai.com/free-guide?utm_source=linkedin&utm_medium=bio&utm_campaign=profile&utm_content=page-button` |
| LinkedIn DM after a "KIT" comment | `https://principeai.com/free-guide?utm_source=linkedin&utm_medium=dm&utm_campaign=starter-kit&utm_content=20261103-carousel-5-part-prompt` |
| LinkedIn newsletter CTA | `https://principeai.com/free-guide?utm_source=linkedin&utm_medium=social&utm_campaign=newsletter-linkedin&utm_content=YYYYMMDD-newsletter-topic` |
| X bio | `https://principeai.com/links?utm_source=x&utm_medium=bio&utm_campaign=profile` |
| X first-reply link | `https://principeai.com/free-guide?utm_source=x&utm_medium=social&utm_campaign=launch-2026&utm_content=YYYYMMDD-thread-topic` |
| Threads bio link 1 | `https://principeai.com/links?utm_source=threads&utm_medium=bio&utm_campaign=profile` |
| Bluesky bio and posts | `https://principeai.com/free-guide?utm_source=bluesky&utm_medium=bio&utm_campaign=profile` (bio) and `...utm_medium=social...` (posts) |

Note: `utm_content` values like `featured-starter-kit` (for evergreen links that have no date) and the campaign value `newsletter-linkedin` are additions to the convention table. Add them to the table in `tools-compliance.md`, or replace them with allowed values, so reports stay consistent.

Also update `src/config/site.ts` → `site.social.linkedin`, `x`, `threads` and `bluesky` once the accounts exist. The file says filled links appear in the footer and in search-engine structured data.

---

## 8. Recommendations for Principe AI

### 8.1 Platform priority

| Platform | Tier | Why |
|---|---|---|
| **LinkedIn: founder's personal profile** | **Tier 1 (must do)** | It reaches the buyers of the $297 and $497 courses, $150 coaching and custom implementation. Carousels and newsletters are proven formats here [B1][L15], and the Service Page is a free storefront [L13]. |
| **LinkedIn: Company Page** | **Tier 1 setup, low effort to run** | Needed for credibility, the Experience logo and the free CTA button [L6]. Organic reach is weak [L22], so mostly reshare founder posts the next day. |
| **Threads** | **Tier 2** | Large and growing [T10][BS7]. It runs off the Instagram account, rewards replies more than any platform [B2], and suits the "For your life" lane. |
| **X** | **Tier 2 only if you pay $8/month Premium and reply daily; otherwise Tier 3** | The AI conversation happens here, but free reach is near zero [B3]. It skews toward builders more than beginners (**Hypothesis**). Reassess in January. |
| **Bluesky** | **Tier 3 (later)** | Small and shrinking [BS7], and hostile to AI [BS8]. Claim `@principeai.com` now (10 minutes) [BS3] and cross-post 3 times a week. No dedicated effort. |

### 8.2 Realistic weekly cadence and time cost (solo founder)

| Platform | Weekly output | Weekly time |
|---|---|---|
| LinkedIn profile | 3 posts (1 carousel, 1 text+image, 1 native video clip or text+image), Tue-Thu 2-4 p.m. ET; 30 min of replies after each; 5 comments + 10 connection requests each weekday | about 4-5 h (2 h creating, including the carousel in Canva; 1.5 h first-hour replies; 2 h daily commenting at 25 min/day) |
| LinkedIn Page | 3 reposts with context + 1 Page-only post; monthly invites on the 1st | about 20-30 min |
| LinkedIn newsletter (from Jan 2027) | 1 edition every 2 weeks | about 45 min/week on average (1.5 h per edition) |
| Threads | 5 posts (weekday mornings) reusing LinkedIn ideas and Reels; first-hour replies | about 1.5-2 h |
| X (Premium path) | 5 posts at 9 a.m. ET + 10 replies/day | about 2 h (Premium) / 30 min (maintenance: 3 cross-posts, no Premium) |
| Bluesky | 3 cross-posts + a 5-minute daily check | about 30 min |
| **Total** | | **about 9-10 h/week on the full plan.** The **minimum viable version is about 5 h/week**: LinkedIn profile + Page + Threads only, X and Bluesky as cross-posts. |

The cheapest way to hit this cadence is one 2-3 hour Monday batch. Claude drafts the week's four cuts of 3 core ideas from `src/content/starter-kit.ts`, the lesson content and the video scripts; the owner edits the hooks and schedules. Every other day gets a 25-30 minute engagement block.

**Launch timing tie-ins (Recommendation):**
- **Now to Nov 25:** set up profiles and post on the LinkedIn cadence. Build connections toward 500.
- **Nov 27 (Black Friday):** this is the one week to allow 2 link posts on LinkedIn, one on Thanksgiving week and one on Black Friday itself, pointing to the course offer if one exists. No fake "was/now" prices (see `tools-compliance.md`).
- **Week of Jan 4, 2027:** LinkedIn newsletter edition #1, and an X/Threads "7-day AI plan" challenge using the starter kit's 7 days.

### 8.3 The 5 most important do's

1. **Finish the free trust stack before posting:** CLEAR verification, Featured links, a Service Page, a Company Page with the "Sign up" button, and `@principeai.com` on Bluesky [L11][L13][L6][BS3].
2. **Make every LinkedIn post useful without a click.** Send people to Featured, the newsletter or a DM. Allow a body link in at most 1 post in 5 [L16].
3. **Own the first hour and the comment section.** Reply to every comment, and spend 25-30 minutes a day writing human comments within your two topics [L15][B2].
4. **Rebuild existing assets in each platform's native format:** carousels from the starter kit and lessons, native video from the welcome scripts, Threads text attachments for full prompts [B1][T3].
5. **Stay in two lanes and UTM-tag everything,** so the LLM rankers learn what Principe AI is about [L14][L15]. Admin → Funnels can then credit each platform.

### 8.4 The 5 most important don'ts

1. **Don't fabricate.** No invented stats, testimonials, client results or "AI will save you X hours" claims. The site has no testimonials yet, so say so honestly. See `tools-compliance.md` §6.
2. **Don't use engagement bait, pods, automation or AI-comment tools.** LinkedIn's 2026 ranker is built to filter bait [L14], and on X, replies under 1,000 followers get an extra spam screen [X9].
3. **Don't pay for LinkedIn Premium, Premium Company Page, Meta Verified, X Premium+ or X Verified Organizations at launch.** The only paid exception worth considering is **X Premium at $8/month**, and only if X gets daily effort [X1][B3].
4. **Don't paste one post everywhere or stuff hashtags.** Use 0-3 on LinkedIn, 0 on X, 1 topic tag on Threads and 1-2 on Bluesky. Don't put body links on LinkedIn by default.
5. **Don't post AI-generated people, avatars or voices without a label,** and don't post AI art on Bluesky at all. Meta can require "AI info" labels and penalize missing ones [T9], and Bluesky's audience punishes AI content [BS8]. Real screen recordings and screenshots are safe and on-brand.

---

## 9. Sources (accessed 2026-10-20 unless noted)

**LinkedIn**
- [L1] LinkedIn Help, "Post and share updates" (posts up to 3,000 characters). https://www.linkedin.com/help/linkedin/answer/a528176 (undated help page; search excerpt)
- [L2] LinkedIn Help, "Updates to Creator Mode" (Follow/Connect primary action; features for all). https://www.linkedin.com/help/linkedin/answer/a5999182. Context: Creator Mode toggle removed in early 2024 (Social Media Today https://www.socialmediatoday.com/news/linkedins-removing-creator-mode-option/706585/)
- [L3] LinkedIn Help, "Add or remove a custom button from your profile" (Premium; button options). https://www.linkedin.com/help/linkedin/answer/a1484520
- [L4] LinkedIn Premium Business pricing: "starts at US$69.99 per month… or US$539.88 per year". https://premium.linkedin.com/small-business/business. Features: https://www.linkedin.com/help/linkedin/answer/a7475356 and https://www.linkedin.com/help/lms/answer/a6505305
- [L5] LinkedIn Premium Company Page pricing: "US$99.99 per month… or US$839.88 per year". https://premium.linkedin.com/business/company-page/essentials. Help: https://www.linkedin.com/help/linkedin/answer/a6250035
- [L6] LinkedIn Help, "Custom call-to-action options for your LinkedIn Page". https://www.linkedin.com/help/recruiter/answer/a5970273 and https://www.linkedin.com/help/linkedin/answer/a5993422
- [L7] LinkedIn Help, "LinkedIn Newsletter access criteria" (150 followers and/or connections, recent original content, good standing). https://www.linkedin.com/help/linkedin/answer/a591266. Page newsletters: https://www.linkedin.com/help/linkedin/answer/a596833
- [L8] LinkedIn Help, "Upload and share documents" (100 MB, 300 pages). https://www.linkedin.com/help/linkedin/answer/a518909. File types: https://www.linkedin.com/help/linkedin/answer/a564109
- [L9] LinkedIn Help, "Share videos on LinkedIn" (5 GB, 15 minutes). https://www.linkedin.com/help/linkedin/answer/a7174587 and https://www.linkedin.com/help/linkedin/answer/a548372
- [L10] LinkedIn Help, "LinkedIn Polls – FAQ" (140/30 characters; Pages can create polls). https://www.linkedin.com/help/linkedin/answer/a527270
- [L11] LinkedIn Help, "Verifications on your LinkedIn profile" https://www.linkedin.com/help/linkedin/answer/a1359065; CLEAR https://www.linkedin.com/help/linkedin/answer/a1458457 and https://www.clearme.com/partner-detail-pages/linkedin; Page verification https://www.linkedin.com/help/linkedin/answer/a6275638
- [L12] LinkedIn Help, "Invite connections to follow your LinkedIn Page" https://www.linkedin.com/help/linkedin/answer/a1313099; "Invitations to follow a LinkedIn Page" (150 followers recommended) https://www.linkedin.com/help/linkedin/answer/a6202478; "Invitation limits" https://www.linkedin.com/help/linkedin/answer/a547492
- [L13] LinkedIn Help, "Get started as a service provider on LinkedIn" https://www.linkedin.com/help/linkedin/answer/a550345; "Offer services on LinkedIn with your personal profile" https://www.linkedin.com/help/linkedin/answer/a569554
- [L14] Social Media Today, "LinkedIn updates its Feed algorithm," 2026-03-12 (quotes LinkedIn's announcement). https://www.socialmediatoday.com/news/linkedin-updates-its-feed-algorithm/814638/. Also PPC Land https://ppc.land/linkedin-rebuilds-its-feed-from-scratch-with-llms-and-gpu-powered-ranking/
- [L15] Creator Science podcast #307, "Richard van der Blom — The state of LinkedIn in 2026 (based on data from 1.3 million posts)," published 2026-06-02 (updated 2026-10-15). https://creatorscience.com/podcast/richard-van-der-blom-2/
- [L16] Forbes (Jodie Cook, senior contributor), "The LinkedIn Link Penalty Cutting Your Reach By 60%," 2026-07-30. https://www.forbes.com/sites/jodiecook/2026/07/30/the-linkedin-link-penalty-cutting-your-reach-by-60/
- [L17] Buffer, "Best Time to Post on LinkedIn in 2026: 4.8M Posts Analyzed," 2026-09-09. https://buffer.com/resources/best-time-to-post-on-linkedin/
- [L18] Buffer, "How Often Should You Post on LinkedIn in 2026? Data From 2 Million+ Posts," 2025-08-28. https://buffer.com/resources/how-often-to-post-on-linkedin/
- [L19] Sprout Social, "Best Times to Post on Social Media 2026" https://sproutsocial.com/insights/best-times-to-post-on-social-media/ and "Best Times to Post on Twitter (X) in 2026" (updated March 2026) https://sproutsocial.com/insights/best-times-to-post-on-twitter/
- [L20] Sprout Social, "LinkedIn hashtags: The complete guide for 2026." https://sproutsocial.com/insights/linkedin-hashtags/
- [L21] PPC Land, "LinkedIn outlines seven promotion tactics for newsletter subscriber growth," 2025-11-23 (summarizes LinkedIn's guidance). https://ppc.land/linkedin-outlines-seven-promotion-tactics-for-newsletter-subscriber-growth/
- [L22] Vendor analyses of Company Page reach (third-party): SocialNexis https://socialnexis.com/guides/company-page-organic-reach-numbers ; ZoomSphere (2026) https://www.zoomsphere.com/blog/linkedin-algorithm-2026-why-generic-ai-content-kills-your-organic-reach
- [L23] The X Concept, "LinkedIn Just Killed Your Company Page Growth" (invitation credits 250 → 50), 2026-03-18 (third-party). https://thexconcept.com/2026/03/18/linkedin-just-killed-your-company-page-growth-what-the-50-invitation-limit-really-means-for-your-business/
- [L24] Link-penalty range and first-comment debate (third-party, 2026): Sendible https://www.sendible.com/insights/linkedin-algorithm ; Gromming https://gromming.com/blog/linkedin-algorithm-external-links ; Digital Applied https://www.digitalapplied.com/blog/linkedin-algorithm-2026-engagement-strategy-guide
- [L25] MediaPost, "LinkedIn Begins Labeling AI-Generated Content" (C2PA; 2024). https://www.mediapost.com/publications/article/396225/linkedin-begins-labeling-ai-generated-content.html

**Cross-platform data**
- [B1] Buffer, "Best Content Format on Social Platforms in 2026: 45M+ Posts Analyzed," 2026-03-19. https://buffer.com/resources/data-best-content-format-social-media/
- [B2] Buffer, "The State of Social Media Engagement in 2026: 52M+ Posts Analyzed," 2026-03-05. https://buffer.com/resources/state-of-social-media-engagement-2026/
- [B3] Buffer's X Premium study (18.8M posts, 71k accounts, Aug 2024-Aug 2025), as reported by Social Media Today https://www.socialmediatoday.com/news/report-shows-paying-for-x-twitter-premkum-has-significant-reach-benefits/801881 and Digital Information World (2025-10) https://www.digitalinformationworld.com/2025/10/buffer-study-finds-x-premium-users-gain.html

**X**
- [X1] X Help Center, "About X Premium" (tiers, prices, 25,000 chars, about 3 h video, Articles, checkmark rules; page cached 2026-10-20). https://help.x.com/en/using-x/x-premium
- [X2] X Help Center, "How to customize your profile" (bio 160) https://help.x.com/en/managing-your-account/how-to-customize-your-profile ; "How to change your X username" (name 50) https://help.x.com/en/managing-your-account/change-x-handle
- [X3] X Help Center, "Professional Accounts." https://help.x.com/en/business-and-advertising/professional-accounts
- [X4] X Help Center, "Premium Business" ($200/month Basic). https://help.x.com/en/using-x/premium-business
- [X5] MacRumors, "X Moves X Pro Behind $40/Month Premium+ Paywall," 2026-03-26. https://www.macrumors.com/2026/03/26/x-pro-premium-plus-restriction/
- [X6] TechCrunch, "Bluesky now lets you upload 10-minute long videos," 2026-08-26 (also states X free users get 140-second videos). https://techcrunch.com/2026/08/26/bluesky-now-lets-you-upload-10-minute-long-videos/
- [X7] PPC Land, "X drops year-old link penalty, Musk tells Zuckerberg on platform," 2026-07-30 (Bier 2026-07-28; Musk 2026-07-29). https://ppc.land/x-drops-year-old-link-penalty-musk-tells-zuckerberg-on-platform/
- [X8] PPC Land, "How X's algorithm silently kills your links without explicitly penalizing them" (2026). https://ppc.land/how-xs-algorithm-silently-kills-your-links-without-explicitly-penalizing-them/
- [X9] Postory, "Twitter/X Algorithm 2026: What xAI's Open-Sourced Code Shows," 2026-05-16 (updated 2026-10-12), a code analysis of github.com/xai-org/x-algorithm. https://postory.io/blog/x-algorithm-2026
- [X10] OpenTweet, "Twitter Algorithm Changes 2026: Dated X Changelog" (open-source release dates, mutual-follow signal 2026-07-13). https://opentweet.io/x-algorithm-changes. Background on the 2026-01-20 release: Decrypt https://decrypt.co/355108/elon-musks-x-open-sources-grok-powered-algorithm-driving-for-you-feed
- [X11] Musk on hashtags (Dec 2024): Fox Baltimore https://www.foxbaltimore.com/news/offbeat/they-look-ugly-elon-musk-asks-x-users-to-stop-using-hashtags-social-media-platform-billionaire-tesla-donald-trump-electric-car-manufacturer-tesla-spacex-technology-company-brain-link-company-neuralink-xai-tunneling-operator-boring-co ; hashtag ad ban (June 2025): Storyboard18 https://www.storyboard18.com/amp/brand-makers/elon-musk-bans-hashtags-from-ads-on-x-calls-them-esthetic-nightmare-71969.htm
- [X12] Communities shutdown announced for 2026-05-06: Global Dating Insights https://www.globaldatinginsights.com/featured/x-to-close-communities-feature-due-to-low-usage-and-spam/ ; Mezha https://mezha.net/eng/?p=1931457 ; conflicting "still active" report: https://inspiretothrive.com/join-x-community/
- [X13] Gigazine, "X is developing a label for 'AI-generated posts'," 2026-02-25. https://www.gigazine.net/gsc_news/en/20260225-x-ai-labels/
- [X14] Buffer, "The Best Time to Post on Twitter/X in 2026: 8.7 Million Posts Analyzed" https://buffer.com/resources/best-time-to-post-on-twitter-x/ ; Buffer's summary post ("9 a.m. on Tuesday") https://x.com/buffer/status/2035008834150776850
- [X15] Nikita Bier on X, new link experience test (October 2025). https://x.com/nikitabier/status/1979994223224209709 ; Social Media Today https://www.socialmediatoday.com/news/x-formerly-twitter-testing-links-in-app-link-post-penalties/803176/
- [X16] X API link-post fee ($0.20 with URL vs about $0.015 without, from April 2026), third-party (a competing scheduler). https://opentweet.io/blog/x-api-link-post-fee and https://opentweet.io/answers/why-are-links-removed-from-scheduled-x-posts

**Threads / Meta**
- [T1] Instagram Help Center, "Tag a topic in your post on Threads" ("up to one topic per post"). https://help.instagram.com/1356090605000312/
- [T2] Meta Newsroom, "New Threads Features for a More Personalized Experience That You Control," 2025-03-20, updated 2025-04-24 ("posts with tagged topics generally receive more views"). https://about.fb.com/news/2025/03/new-threads-features-more-personalized-experience-you-control/
- [T3] TechCrunch, "Threads challenges X by offering free support for up to 10k characters," 2025-09-04. https://techcrunch.com/2025/09/04/threads-challenges-x-by-offering-free-support-for-up-to-10k-characters-plus-prominent-links
- [T4] Buffer, "The Best Time to Post on Threads in 2026 — Data from 2.5M Posts," 2026-02-04. https://buffer.com/resources/the-best-time-to-post-on-threads/
- [T5] SocialBee, "2026 Threads news, updates, and features" (updated 2026-10-19). https://socialbee.com/blog/threads-news/
- [T6] Digital Trends, Threads Communities out of beta, 2026-06-17. https://www.digitaltrends.com/social-media/threads-makes-it-easier-to-find-your-community-and-tune-out-what-you-dont-want-to-see/
- [T7] Social Media Today, "Meta Says Link Posts on Threads Are Seeing Better Performance" (Mosseri, 2025). https://www.socialmediatoday.com/news/meta-says-link-posts-ranked-properly-threads-reach/750126/
- [T8] Instagram Help Center page on Threads fediverse sharing (5-minute delay; not retroactive; polls excluded), from a 2026-10-20 search summary. **Exact URL not captured.**
- [T9] Meta, "Labeling AI Content" https://transparency.meta.com/governance/tracking-impact/labeling-ai-content ; Meta Help, "How to identify AI content on Meta products" https://www.meta.com/en-gb/help/artificial-intelligence/1783222608822690/
- [T10] Threads usage figures (secondary): Search Engine Land guide https://searchengineland.com/guide/threads-users ; Sociallyin https://sociallyin.com/threads-statistics/
- [T11] Pew Research Center, social media use 2025 (survey 2025-02-05 to 06-18; published 2025-11-20), via Engadget https://engadget.com/social-media/the-most-popular-social-media-platform-among-us-adults-isnt-instagram-or-tiktok-195823871.html and the Pew fact sheet https://www.pewresearch.org/internet/fact-sheet/social-media/
- [T12] Meta Verified pricing (third-party, conflicting): https://creatorflow.so/blog/is-meta-verified-worth-it/ ; https://handles.gg/blog/instagram-verification-cost-how-much-2026-actual-price
- [T13] MediaPost, "Instagram Tests Cross-Platform Posting To Threads." https://www.mediapost.com/publications/article/395857/instagram-tests-cross-platform-posting-to-threads.html
- [T14] Meta for Developers, Threads "Share to IG Stories" (updated July 2026). https://developers.facebook.com/documentation/threads/create-posts/share-to-ig-stories
- [T15] Influencer Marketing Hub, Mosseri on links / 5 bio links with link analytics. https://influencermarketinghub.com/adam-mosseri-links-on-threads-are-performing-better/
- [T16] Reports of Threads sign-up without Instagram (user posts; **UNVERIFIED**). https://www.threads.com/@oncescuradu/post/DJz0ZUAsvZW/
- [T17] BulkPublish, "Threads Limits 2026" (5 links per post, attributed to Meta's API docs). https://www.bulkpublish.com/blog/threads-limits/

**Bluesky**
- [BS1] TechCrunch, "Bluesky now lets you upload 10-minute long videos," 2026-08-26. https://techcrunch.com/2026/08/26/bluesky-now-lets-you-upload-10-minute-long-videos/
- [BS2] Bluesky blog, "A New Form of Verification on Bluesky," 2025-04-21. https://bsky.social/about/blog/04-21-2025-verification ; Engadget https://engadget.com/social-media/bluesky-is-getting-blue-checkmarks-and-an-official-verification-system-173204662.html
- [BS3] Bluesky Help, "How to Set your Domain as your Handle" https://blueskyweb.zendesk.com/hc/en-us/articles/19001802873101-How-to-Set-your-Domain-as-your-Handle ; AT Protocol docs, "Resolving Identities" (`/.well-known/atproto-did`) https://docs.bsky.app/docs/advanced-guides/resolving-identities
- [BS4] Bluesky blog, "Introducing Bluesky Starter Packs," 2024-06-26 (up to 150 people, 3 feeds). https://bsky.social/about/blog/06-26-2024-starter-packs
- [BS5] TechCrunch, "Bluesky finally adds drafts," 2026-02-09. https://techcrunch.com/2026/02/09/bluesky-finally-adds-drafts
- [BS6] Gigazine, Bluesky 2026 roadmap, 2026-01-28 https://gigazine.net/gsc_news/en/20260128-bluesky-2026-roadmap ; Bluesky, "What's Next at Bluesky" (2026-01-26; text not read) https://bsky.social/about/blog/01-26-2026-whats-next-at-bluesky
- [BS7] TechCrunch (Similarweb data), "Bluesky's active user base is shrinking…," 2026-08-11 (also Threads 147M and X 123.7M mobile DAU in July 2026), via Slashdot https://tech.slashdot.org/story/26/08/16/0326249/ and Gigazine https://gigazine.net/gsc_news/en/20260812-blueskys-active-user/
- [BS8] Decrypt, "Bluesky Users Revolt Against AI Tool Attie…" (March 2026). https://decrypt.co/362721/bluesky-users-revolt-ai-tool-attie-blocking-more-ice-white-house
- [BS9] OpenTweet, "Every Bluesky Limit in 2026" (checked 2026-10-10 against AT Protocol lexicons; third-party). https://opentweet.io/answers/bluesky-limits
- [BS10] Third-party Bluesky growth and scheduling guides (custom feeds, hashtags, labelers; no native scheduler as of October 2026): https://www.sendcove.app/integrations/bluesky/how-to-grow-followers ; https://theguidex.com/resources/schedule-bluesky-posts ; https://wisechecker.com/bluesky-labeler-subscription-how-to-add-a-custom-moderation-service/
