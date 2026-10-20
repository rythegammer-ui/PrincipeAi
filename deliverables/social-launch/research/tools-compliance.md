> **Background research, tools-compliance.** Written on 2026-10-20 while building this kit. Sources are listed with their URLs and dates; anything marked UNVERIFIED still needs checking in the app. Where this file disagrees with the kit (tracking links, dates, file names), the kit wins: see [README](../README.md) and [08-tools-measurement-compliance.md](../08-tools-measurement-compliance.md).

# Principe AI social launch: tools, measurement and compliance (research notes)

Researched 2026-10-20 for a solo, US-based (America/New_York) founder launching Principe AI from zero followers. Verified facts carry a source tag like [S12]. Each source's URL and date are in the list at the end. **UNVERIFIED** marks anything I could not confirm on an official or reputable 2025-2026 page. **Recommendation** and **Hypothesis** mark my own judgement, not platform facts. None of this is legal advice. Have an attorney look at the compliance section before any paid push or any earnings or outcome claims.

---

## 0. Summary of the 12 recommendations

1. **Use one handle everywhere: `@principeai`.** X does not allow periods [S48], so `@principe.ai` cannot work on every platform. Spot checks on 2026-10-20: YouTube `@principeai` returned a 404 and X `@principeai` returned "This account doesn't exist", so both look free. I could not check Instagram, TikTok or LinkedIn automatically. Claim all of them this week (section 3).
2. **Use the site's own link-in-bio page, not Linktree.** Build `principeai.com/links`, and give every platform's bio its own UTM-tagged URL. Until the page exists, point bios at `/free-guide` with UTMs (section 2).
3. **Stack for $0/month:** native schedulers, plus Buffer Free for X and LinkedIn, plus Metricool Free for IG, FB, TikTok, YouTube and Threads, plus Canva Free, Edits, and Meta Business Suite's free "Comment to message" automation (section 1).
4. **Stack for about $45-70/month once you post 5+ times a week:** Postiz Team ($39/month, or $31/month billed yearly, 10 channels, includes API and MCP), plus Canva Pro ($144/year), plus Descript Hobbyist (about $16/month billed yearly; third-party figure). Add ManyChat Essential ($14/month) only once DM volume outgrows Meta's native tool. Postiz is attractive here because this environment has a Postiz skill: once the owner connects a Postiz account, Claude can draft and schedule posts across channels (sections 1 and 5).
5. **TikTok account type:** switch to a Business account and complete business verification. A "Verified Business Account" can post a website link before it reaches 1,000 followers [S14][S15]. In exchange it uses only the Commercial Music Library, so build videos on original voice-over plus CML tracks [S15][S17].
6. **Fix CAN-SPAM before emailing social leads.** The site's marketing-email footer (`emailLayout` in `src/lib/email.ts`) has an unsubscribe link but **no physical postal address**, which CAN-SPAM requires. A USPS PO box or a registered private mailbox (CMRA) is allowed [S32].
7. **No testimonials, earnings claims, time-saved numbers or "was/now" prices until they can be substantiated.** The FTC is actively pursuing AI money-making and coaching claims [S28][S29][S30]. Fake or AI-written reviews and **bought followers or views** violate 16 CFR 465 [S23][S25]. Penalties run up to $53,088 per violation, unchanged for 2026 [S27].
8. **Turn on TikTok's content-disclosure toggle on posts that promote your own courses** (the post then shows a "Promotional content" label) [S16]. Use "Paid partnership" labels only for real third-party deals or affiliate links [S16][S33].
9. **AI labels:** a real screen recording of you using ChatGPT, Claude or Gemini does not need an AI label. Realistic AI video or images, AI avatars, and AI voices (including a clone of your own voice on TikTok and Meta) do (section 6.5) [S18][S19][S20].
10. **Name AI tools only in plain text.** Do not use their logos, and do not use "official", "partner" or "certified". Add a not-affiliated line to the site footer. The site has none today (section 6.6) [S36][S37].
11. **Hold off on paid ads until the conditions in section 7 are met.** When you do test, boost one proven organic post to `/free-guide` at the platform minimum: Meta about $1/day (third-party figure), TikTok Promote about $3/day (third-party figure), LinkedIn $10/day for at least 2 days [S52].
12. **Hold a 30-minute review every Monday.** Pull native analytics per platform plus Admin → Funnels → 7 days → Attribution "by channel" (section 8).

---

## 1. Scheduling and cross-posting

### 1.1 Native schedulers (all free)

| Platform | Native scheduling | Limits I could verify | Source |
|---|---|---|---|
| Facebook + Instagram | Meta Business Suite (desktop and mobile) schedules posts, stories and reels; Planner shows a calendar | The Instagram app schedules up to **75 days** ahead for professional accounts (reported at the 2022 rollout). The Facebook/Meta Business Suite window is **UNVERIFIED**: one third-party guide says 29 days for Facebook Reels | [S12][S11] |
| Threads | In-app: composer ⋯ → Schedule. "Multiple posts a day, multiple days in advance" | Maximum window **UNVERIFIED** | [S10] |
| TikTok | TikTok Studio **web (desktop)** scheduler | TikTok Creator Academy now says **up to 30 days** ahead. An older Academy page said 15 minutes to 10 days, so check what your account shows. The mobile app has no scheduler (third-party reports) | [S7] |
| YouTube | YouTube Studio (web or app): set the publish time for videos and Shorts | Free | [S9] |
| LinkedIn (profile) | Clock icon in the composer | **10 minutes to 3 months** ahead | [S6] |
| LinkedIn (Company Page) | Page admin composer | **1 hour to 3 months** ahead | [S6] |
| X | Officially documented in **X Pro** ("schedule posts in advance") and the Ads composer | X Pro is generally reported to require Premium. Whether free accounts can schedule from the x.com composer is **UNVERIFIED**, and sources conflict. X reportedly reshuffled its paid tiers on 2026-10-12 (single blog, **UNVERIFIED**) | [S8] |

**Hypothesis (third-party claim):** Scheduled Reels and TikToks can lose access to some trending sounds. Post anything that depends on a sound natively from the phone, and schedule talking-head or voice-over pieces.

### 1.2 Third-party tools: free tiers and prices (US, as published on 2026-10-20)

| Tool | Free tier | Cheapest paid tier | Notes for Principe AI | Source |
|---|---|---|---|---|
| **Buffer** | Free forever: **3 channels, 10 scheduled posts per channel at a time** (a slot refills when a post publishes), 1 user, AI Assistant, community inbox, 30-day insights. **No custom UTM feature**, but pasting a UTM'd URL by hand works | **Essentials $5/channel/month billed yearly ($60/year)**; monthly billing costs about 20% more. Team $10/channel/month billed yearly. 14-day trial. Prices last updated Nov 2025 | Auto-publishes to IG business or creator accounts, FB Pages, LinkedIn profiles and Pages, Threads, TikTok **business** profiles, YouTube Shorts, and X free and premium profiles. **Instagram personal profiles get reminders only** | [S1] |
| **Metricool** | Free: **1 brand, every network except LinkedIn and X, 20 posts/month**, 30 days of analytics, 5 competitor profiles, AI assistant, MCP | **Starter from $20/month billed yearly ($25 monthly)** for up to 5 brands; adds LinkedIn, unlimited posts (fair use), unlimited history, multiple link-in-bio. X is a paid add-on (price **UNVERIFIED**; third parties say +$5/month) | Whether a single post sent to 5 networks counts as 1 or 5 against the 20-post limit is **UNVERIFIED** | [S2] |
| **Later** | No free plan on the pricing page; 14-day trial | **Starter $18.75/month billed yearly**: 1 social set (8 profiles), 30 posts per profile per month, 1 user. Growth $37.50/month and Scale $82.50/month billed yearly. Monthly-billing prices are not shown | Built around Instagram; not needed here | [S3] |
| **Postiz** (hosted) | 7-day free trial on every plan. **No permanent hosted free tier** | **Standard $29/month** ($23 billed yearly): 5 channels, unlimited posts, no team members. **Team $39/month** ($31 billed yearly): 10 channels. Pro $49, Ultimate $99. **Every plan includes the MCP server, CLI, API and webhooks** | Supports X, LinkedIn, Instagram, Facebook, TikTok, YouTube, Threads, Pinterest, Reddit, Bluesky, Mastodon and more | [S4] |
| **Postiz** (self-hosted) | Open source, no licence fee | Server costs and maintenance. You need **your own app approval from each network**, and Postiz says Facebook, Instagram, Threads and YouTube "usually take more than a month" | Not worth it for a solo founder | [S4] |
| **Hootsuite** | No free plan; 14-day trial | **Standard $99/month** (1 user, 10 accounts); Professional $199; Advanced $399 | Too expensive for this stage | [S5] |

**The Postiz skill in this environment.** The `postiz:postiz` skill can schedule to 28+ channels, including X, LinkedIn, LinkedIn Page, Instagram, Facebook Page, Threads, YouTube, TikTok and Pinterest, once the owner creates a Postiz account and connects the channels. The workflow would be: Claude drafts each week's posts from the repo content (the starter kit, lesson content, video scripts), the owner approves them, and Claude schedules them through Postiz with UTM'd links. **Recommendation:** start the 7-day trial in the same week you batch-produce the first two weeks of content, so the trial actually gets tested.

### 1.3 Recommended stacks

**Stack A: near-zero budget ($0/month)**
- **Metricool Free** for Instagram, Facebook, TikTok, YouTube Shorts and Threads, staying under 20 posts/month. When you go over, use the native schedulers (Meta Business Suite, TikTok Studio web, YouTube Studio, Threads).
- **Buffer Free** for X, the LinkedIn profile and the LinkedIn Page. That is its 3 channels, each with 10 queued posts.
- **Canva Free, Edits (free), and phone auto-captions** for creative work (section 4).
- **Meta Business Suite "Comment to message"** for keyword DMs on IG and FB (free, desktop only) (section 5).
- **Admin → Funnels** on the site plus each platform's native analytics for measurement.
- Weekly time cost: one 2-3 hour batch session plus about 15 minutes a day replying to comments. Replying is not optional at zero followers.

**Stack B: modest budget (about $45-70/month)**
- **Postiz Team** ($31/month billed yearly or $39/month): 10 channels covers IG, FB, Threads, TikTok, YouTube, LinkedIn profile, LinkedIn Page and X, with room for 2 more. Claude can schedule through the Postiz skill. If the owner prefers a simpler UI and no AI agent, use Buffer Essentials instead: 8 channels × $5 = $40/month billed yearly.
- **Canva Pro** ($144/year).
- **Descript Hobbyist** (about $16/month billed yearly per third parties, **UNVERIFIED** on Descript's own page) for screen-recorded AI demos and long-form YouTube.
- **ManyChat Essential** ($14/month for 250 active contacts) only once comment-keyword volume outgrows the native Meta tool.
- **Skip** Hootsuite, Later and Meta One. Meta One is a new Meta subscription announced 2026-09-15 with creator and business features; pricing is **UNVERIFIED** and nothing in it is needed at launch [S62].

### 1.4 Default posting slots (Hypothesis, not platform data)

Set these as the first scheduler slots in **America/New_York**, then replace them after 2-3 weeks with your own audience-activity data. Look for the native "most active times" views in Instagram Insights, TikTok Studio follower analytics, YouTube Studio's "When your viewers are on YouTube", and Metricool's "Best times". Menu paths are **UNVERIFIED** and change often.

| Audience | Starting slots (ET) | Why |
|---|---|---|
| "For your business" (owners, professionals): LinkedIn, X | Tue-Thu 7:30-9:00 and 12:00-13:00 | Commute and lunch for a US East/Central audience |
| "For your life": IG, TikTok, Shorts, Threads | Mon-Fri 12:00-13:00 and 19:00-21:00; Sat 9:00-11:00 | Lunch and evening scrolling |
| YouTube long-form | Tue or Thu 10:00-12:00 | Gives the video a full US day of first-day watch time |

---

## 2. Link-in-bio

### 2.1 What each platform allows (verified where marked)

| Platform | Profile links | Source |
|---|---|---|
| Instagram | **Up to 5 links.** Only the first one shows on the profile; visitors tap to see the rest. Links open in Instagram's in-app browser | [S13] (2023 rollout reporting) |
| TikTok | A website link needs **≥1,000 followers OR a Verified Business Account**. Unverified business accounts can be reverted to General accounts | [S14][S15] |
| YouTube | Channel header links; specifics **UNVERIFIED**. Links in Shorts descriptions are reported to be not clickable (**UNVERIFIED**, from memory of a 2023 change), so treat the channel links and long-form descriptions as the link surfaces | none |
| X, LinkedIn, Threads, Facebook | Website field in the profile or Page; link counts and button options **UNVERIFIED** | none |

### 2.2 Recommendation: a site page, not Linktree, Beacons and similar tools

Why the site's own page wins for Principe AI:
- **Attribution survives.** The site sets a first-party `pa_utm` cookie the first time someone arrives with UTM parameters. The cookie lasts 90 days, and later visits do not overwrite it (`src/proxy.ts`). The opt-in stores that UTM on the contact, and **Admin → Funnels → Attribution groups "channel" by `lower(utm_source)`** (`src/lib/funnels.ts`). With a site `/links` page, one UTM'd bio URL credits every downstream click (Starter Kit, assessment, booking, course) to the right platform. A Linktree hop would make the referrer `linktr.ee`, and every outbound button would need its own UTMs.
- **One less tap, and on brand.** The page uses your colours and fonts, and the site's AI chat assistant is on it.
- **No cost or commerce cut.** Linktree's free plan reportedly takes a 12% cut of digital sales, and paid tiers are about $8, $15 and $35/month. These are third-party figures and **UNVERIFIED**.
- The site's privacy policy already discloses the UTM, referrer and landing cookies (`/privacy`, Cookies table), so no new disclosure is needed.

**What to build at `/links`.** This is a separate engineering task; no such route exists today. The page needs one column of large buttons, in this order:
1. **Free AI Starter Kit** → `/free-guide` (primary, gold button)
2. **Take the free AI Readiness Assessment** → `/assessment`
3. **Book a free AI Strategy Call** → `/book/ai-strategy-call`
4. **Courses** → `/courses` (or the course currently being featured, e.g. `/courses/ai-essentials`)
5. **Done-with-you AI implementation** → `/consulting` (free discovery call at `/book/implementation-discovery`)
6. Optional: "Latest video" (YouTube) and a contact email

Keep it `noindex`. The links inside it need no UTMs, because the bio URL already set the cookie.

**Until `/links` exists,** point each bio straight at `/free-guide` with UTMs.

### 2.3 UTM convention (one table for everyone)

Channel reports group on `utm_source` alone, lowercased. Use **exactly** these values and never variants such as `ig`, `insta` or `Twitter`:

| Field | Allowed values | Example |
|---|---|---|
| `utm_source` | `instagram`, `facebook`, `threads`, `tiktok`, `youtube`, `linkedin`, `x`, `pinterest`, `bluesky`, `reddit`, `email`, `partner-<name>` | `instagram` |
| `utm_medium` | `bio` (profile link), `social` (link in a post, caption, comment or story), `dm` (automated or manual DM), `paid_social` (boosts and ads), `video` (YouTube description) | `bio` |
| `utm_campaign` | `profile` (evergreen bio), `launch-2026` (launch window), `starter-kit`, `assessment`, `bfcm-2026`, `newyear-2027` | `launch-2026` |
| `utm_content` | `YYYYMMDD-format-topic` | `20261103-reel-5-prompts` |

Ready-to-paste bio links:
- Instagram: `https://principeai.com/links?utm_source=instagram&utm_medium=bio&utm_campaign=profile`
- TikTok: `https://principeai.com/links?utm_source=tiktok&utm_medium=bio&utm_campaign=profile`
- YouTube channel link: `https://principeai.com/links?utm_source=youtube&utm_medium=bio&utm_campaign=profile`
- LinkedIn (Page website plus founder profile featured link): `...utm_source=linkedin&utm_medium=bio...`
- X, Threads and Facebook follow the same pattern.
- DM automation (Starter Kit): `https://principeai.com/free-guide?utm_source=instagram&utm_medium=dm&utm_campaign=starter-kit&utm_content=20261103-reel-5-prompts`

Attribution caveats to know:
- **In-app browsers.** Instagram and TikTok open links in their own browser. Visits that arrive without UTMs are reported to show up as "(direct)", which is why every link needs UTMs. That claim comes from a vendor, link.boo, and is **UNVERIFIED** against Meta docs. In-app browsers are also widely reported to keep a cookie jar separate from Safari or Chrome, so someone who later opens the site in Safari looks like a new, direct visitor (**UNVERIFIED**). **Recommendation:** keep the Starter Kit opt-in fast enough to finish inside the in-app browser. The UTM is written to the contact at opt-in, so a lead captured there stays credited even if they buy later in another browser.
- **Platform numbers will not match the site.** "Link taps" in Instagram Insights will never equal "visitors" in Admin → Funnels. Trust the site for leads and revenue, and native analytics for reach.

---

## 3. Handle strategy

### 3.1 Platform handle rules

| Platform | Length | Allowed characters | Source |
|---|---|---|---|
| X | **max 15** | letters, numbers, **underscore only** (no periods or dashes); suspended or deactivated names are not released immediately | [S48] |
| Instagram (and Threads, which uses the Instagram handle) | max 30 | letters, numbers, periods, underscores; cannot start or end with a period | [S50] |
| TikTok | 2-24 (third-party) | letters, numbers, periods, underscores; can be changed once every 30 days (third-party) | **UNVERIFIED** |
| YouTube | 3-30 | letters, numbers, underscores, hyphens, periods (not at the start or end); not case-sensitive | [S49] |
| Facebook Page username / LinkedIn Page URL | — | **UNVERIFIED** (Facebook is commonly cited as letters, numbers and periods with a 5-character minimum; LinkedIn as letters, numbers and hyphens) | none |

**Conclusion:** only `principeai` is valid on every platform. `principe.ai` fails on X and probably on LinkedIn, and `principe_ai` probably fails on Facebook and LinkedIn.

### 3.2 Availability and fallbacks

- **Spot checks on 2026-10-20 (Firecrawl):** `youtube.com/@principeai` returned 404, so it looks available. `x.com/principeai` returned "This account doesn't exist", so it also looks available, though a suspended or deactivated name can still be held [S48]. Instagram, TikTok and LinkedIn could not be scraped, so check them by hand. A web search found no existing "Principe AI" brand. Note that the name collides with the country "São Tomé and Príncipe" in search results, so tag posts with "AI" keywords.
- **Checker tools:** Namecheckr (about 38 networks and 17 TLDs), Namechk (82-157 sites) and InstantUsername (100+ sites). Coverage figures come from directories and are **UNVERIFIED**. Use them for a first pass, then **confirm in each app's sign-up or edit-profile screen**, since checkers often get Instagram and TikTok wrong.
- **Fallback order if `principeai` is taken on a platform:** `principeai.hq` (not valid on X) → `principe_ai` → `getprincipeai` → `principeaihq`. Keep the **display name identical everywhere**: "Principe AI", with the tagline in the bio. **Recommendation:** if X forces a fallback, use `@principe_ai` on X only and keep `principeai` everywhere else.
- **If the handle is taken by an inactive account,** do not pay for it: account sales usually breach platform terms (**UNVERIFIED** per platform). Trademark-based handle claims generally need a registered mark. **Open question:** whether to file a USPTO trademark for "Principe AI".

### 3.3 Claim list for launch week (in priority order)

1. **Primary (active from day 1):** Instagram (switch to a Professional → Business account, linked to a Facebook Page), TikTok (Business account, then verify the business), YouTube (`@principeai`), LinkedIn Company Page plus the founder's personal profile (on LinkedIn the founder profile usually out-reaches the Page; **Hypothesis**), Facebook Page (needed for Meta Business Suite and ads), Threads (auto-created from Instagram).
2. **Reserve only (claim, add the bio and link, post nothing yet):** X (or post occasionally through Buffer or Postiz), Pinterest, Bluesky, Reddit (username only, never brand-spam), Snapchat, Medium or Substack, Discord.
3. **Hygiene:** sign every account up with a domain mailbox such as `social@principeai.com` rather than a personal inbox. Turn on 2FA everywhere and store recovery codes in a password manager. Write the final URLs into `src/config/site.ts → social` (currently empty), and check whether the footer renders them; it may not yet.

---

## 4. Design and video tools

### 4.1 Brand kit values (taken from `src/app/globals.css` and `src/app/layout.tsx`)

| Token | Hex | Use on social |
|---|---|---|
| brand-600 (primary royal violet) | `#6938EF` | Backgrounds, headline highlights, buttons |
| brand-500 | `#7A5AF8` | Gradients, secondary shapes |
| brand-700 | `#5925DC` | Text on light backgrounds, gradient end |
| brand-50 | `#F4F3FF` | Light card backgrounds |
| gold-400 (accent) | `#FDB022` | CTA pill ("Free Starter Kit"), underline accents |
| gold-500 | `#F79009` | Gradient end (site gradient: brand-600 → brand-500 → gold-500) |
| ink | `#0C0A1D` | Dark "ink band" backgrounds |
| ink-2 | `#15122B` | Secondary dark |

- **Fonts:** **Geist** (sans, body and UI) and **Instrument Serif** (italic, for large headline accents). The site loads both from Google Fonts through `next/font/google`, so both are free Google Fonts. Whether Canva's built-in library has them is **UNVERIFIED**. **Uploading custom fonts in Canva requires Pro**, per several third-party tutorials (**UNVERIFIED** on Canva's help center). Fallbacks if neither is available on Canva Free: Inter or Montserrat for Geist; DM Serif Display or Playfair Display Italic for Instrument Serif (**Recommendation**).
- **Small inconsistency to flag:** the email header gradient uses `#4F46E5 → #7C3AED` (`src/lib/email.ts`), not the site's brand-600/500. Not a social blocker.

### 4.2 Canva

- **Free:** 1 Brand Kit limited to 3 colours. Use **#6938EF, #FDB022 and #0C0A1D**. About 1.6M+ templates. **No** background remover, Magic Resize or social scheduling [S43].
- **Pro:** **US$144/year** for one person, 5 Brand Kits, 3.6M+ templates including premium, background remover, resize and translate AI tools, and **social scheduling** [S43]. The monthly price is **UNVERIFIED**; third parties say about $15-18.
- **Templates to build once (Recommendation):**
  1. Reel/TikTok/Shorts cover, 1080×1920, with a large Instrument Serif italic hook word on an ink background.
  2. Instagram/LinkedIn carousel at 1080×1350 (8-10 slides), built from prompts in `src/content/starter-kit.ts`.
  3. LinkedIn document carousel (PDF export of the same file).
  4. YouTube thumbnail, 1280×720.
  5. Quote or "prompt of the day" card, 1080×1350.
  6. Story with a link-sticker frame, 1080×1920.
  7. X/LinkedIn link image, 1200×627.
  8. A "3-step model" graphic (Assess → Learn → Implement).

  Sizes are common conventions; confirm them against Canva's presets.

### 4.3 Video editing and captions

| Tool | Cost | Best use for Principe AI | Caveats | Source |
|---|---|---|---|---|
| **Edits** (Meta, iOS/Android) | Free. No watermark and no premium tier (third-party reports) | Reels, TikToks and Shorts filmed on the phone: auto-captions, title cards, text styles, keyframes; since Nov 2025, bulk caption editing and 400+ sound effects | Official pages confirm the features, not "no watermark" | [S45] |
| **Descript** | Free plan: about 60 media minutes/month, 720p export with watermark. Hobbyist about $16/month billed yearly; Creator about $24/month billed yearly (third-party) | Screen-recorded AI demos, editing by transcript, long-form YouTube, cutting one recording into clips | Prices **UNVERIFIED** on Descript's own page | [S46] |
| **CapCut** | Free tier; Pro about $19.99/month or $179.99/year (third-party) | Fast templates and auto-captions | Since 2026-01-22 US CapCut is reportedly run by the TikTok USDS Joint Venture (third-party). Its mid-2025 terms grant a broad licence over uploaded content, including name, image and likeness "for use in sponsored content" (press reports). **Do not put client screens or client data in CapCut.** Fine for your own public content | [S47] |
| **Native auto-captions** (TikTok, Instagram, YouTube) | Free | A fallback for every post | **Always proofread brand names.** Auto-captions often mishear "Claude" (as "cloud") and "Gemini". Fix them before posting | — |

**Recommendation:** use the phone plus Edits for every short video at launch. Add Descript once you start recording lessons; the `deliverables/video-scripts/<course>/*.md` scripts and the per-course welcome videos are the first candidates. Burn captions into every video, since many viewers watch muted.

---

## 5. Comment-to-DM automation

### 5.1 Options

| Option | Cost | Channels | Limits | Source |
|---|---|---|---|---|
| **Meta Business Suite, Inbox → Automations, "Comment to message"** | Free | FB + IG | "Reply to a comment that contains specific hashtags." **Desktop only.** Third parties report it needs exact keyword matches | [S40] |
| **ManyChat Free** | $0 | Any 2 of IG, TikTok, Messenger, Telegram | **25 active contacts per month**, up to 4 active automations | [S41] |
| **ManyChat Essential** | $14/month ($168/year) | Any 2 channels | 250 active contacts per month | [S41] |
| **ManyChat Pro** | $29/month ($348/year) | Any 3 channels, adds WhatsApp, SMS and Email | 2,500 active contacts per month | [S41] |
| TikTok comment-to-DM | — | — | **Not reliably available in the US** in 2026. ManyChat's TikTok support covers DM-triggered automations; comment triggers are reported as limited or region-gated (Vietnam, Thailand, Indonesia). Sources conflict | [S42] |

### 5.2 Meta's rules for these automations (official developer policy)

- **Private replies:** a business may send **one** private message in reply to a comment, **within 7 days** of the comment (Instagram Live comments only during the broadcast) [S39].
- **Standard messaging window:** 24 hours after the user's last message; promotional content is allowed inside it. The **Human Agent** tag allows manual replies for 7 days. Promotional messages outside the window need paid Sponsored Messages [S39].
- **Bot disclosure:** "When required by applicable law, automated chat experiences must disclose that a person is interacting with an automated service" at the start of a thread, after a long gap, or when switching from a human to automation [S39]. **Recommendation:** always disclose; it costs nothing.

### 5.3 Flows to set up (Recommendation)

| Keyword | Trigger post | DM text (one message, because a private reply is a single message) |
|---|---|---|
| `KIT` | Any post about prompts or the 7-day plan | "Here's your free AI Starter Kit: 50 copy-paste prompts and a 7-day plan → [UTM'd /free-guide link]. (Automated message. Reply HUMAN to reach [YOUR NAME].)" |
| `PLAN` | "How ready is your business for AI?" posts | "Take the free 3-minute AI Readiness Assessment. You'll get a score and a personalised plan → [UTM'd /assessment link]. (Automated.)" |
| `CALL` | Implementation and case-style posts | "Book a free AI Strategy Call here → [UTM'd /book/ai-strategy-call link]. (Automated.)" |

- **TikTok:** no automation. Pin a comment saying "Free Starter Kit: link in bio", or answer comments by hand. Do not write "comment KIT and I'll DM you" on TikTok unless you will actually reply to every comment by hand.
- **The site's AI chat assistant** already shows an "AI" badge and says "AI can make mistakes. Check important info." (`src/components/chat/chat-panel.tsx`). Social copy can say: "Ask our AI assistant anything about the courses at principeai.com." There is no deep link that opens the chat from a URL (it opens through an in-page event), so a `?chat=1` deep link is a possible small enhancement.

---

## 6. Compliance (US; owner in New York)

### 6.1 FTC Endorsement Guides (revised 2023) [S22]

- **Testimonials must reflect typical results.** "Results not typical" or "Individual results may vary" does not cure an atypical testimonial. Either have proof the results are typical, or "clearly and conspicuously disclose the generally expected performance" [S22].
- **The disclosure must be visible without tapping "more".** Platform tools are not automatically sufficient [S22].
- **Material connections must be disclosed:** affiliate commissions (e.g., "I get commissions for purchases made through links in this post"), free products or perks, and employees ("Listing your employer on your profile page isn't enough") [S22].
- **What this means for Principe AI today:** there are **no testimonials**, so never write or imply any: no "students say…", no invented DMs, no AI-generated quotes. After launch:
  - Collect real feedback with written permission to quote it.
  - If early students got free or discounted access in exchange for feedback, disclose that next to their quote, e.g. "received free course access".
  - When outcomes vary, state what is typical.

### 6.2 FTC Rule on Consumer Reviews and Testimonials, 16 CFR Part 465 (effective 2024-10-21) [S23][S24][S25]

The rule prohibits:
- Fake or false reviews and testimonials, **including AI-generated ones** and anything from someone without real experience.
- Buying reviews conditioned on positive or negative sentiment.
- Insider reviews without a disclosed connection.
- Company-controlled "independent" review sites.
- Review suppression.
- **Selling or buying fake indicators of social media influence**, i.e. fake followers, views or likes.

**Penalties:** civil penalties are available for knowing violations, **up to $53,088 per violation** (2025 adjustment; the FTC's figures are unchanged for 2026) [S26][S27]. The FTC sent a round of warning letters in Dec 2025 [S26].

**Practical rules:** never buy followers, views or engagement pods, including "starter packs" for a new account. Do not have friends or family post reviews without disclosure. Never condition a course discount on a 5-star review.

### 6.3 Earnings, outcome and "AI will make you money" claims (highest risk for this category)

- **Operation AI Comply** (Sept 2024) targeted schemes claiming AI tools would produce passive income [S28]. Earlier cases include Automators AI (2023), and **Lurn** (Sept 2023), an online business-coaching program that had received a 2021 Notice of Penalty Offenses on earnings claims [S30]. **Air AI** (complaint Aug 2025; March 2026 settlement bans its owners from marketing business opportunities) was charged with deceptive claims about "business growth, earnings potential, and refund guarantees" [S29].
- **Pending rule:** in Jan 2025 the FTC proposed extending the Business Opportunity Rule to "money-making opportunities", including **business coaching**. The proposal would require written substantiation that earnings claims reflect typical purchaser results [S31]. Whether it has been finalized is **UNVERIFIED**.
- **What this means for Principe AI (Recommendation):**
  - **Do not claim** income, revenue, "10x", clients won, or specific hours saved without written substantiation. "Grow with AI" is fine as a tagline; "Add $5k/month with AI" is not.
  - Show processes, not promised outcomes: "Here's the 3-step workflow I use to draft client replies. How much time it saves depends on your volume."
  - Keep a substantiation file: screenshots, before-and-after timings of your own work labelled as yours, and sources for any statistic. Brand voice already bans fabricated statistics.
  - Avoid "guaranteed" language and keep refund claims exactly matched to the `/terms` policy (Air AI was charged partly over refund guarantees) [S29].
- **Black Friday pricing:** a "was $297, now $197" claim is only legitimate if $297 was "the actual, bona fide price at which the article was offered to the public on a regular basis for a reasonably substantial period of time" [S57]. Courses that launch in late October have only about 4-5 weeks of price history by Black Friday (2026-11-27). **Recommendation:** advertise "Black Friday price: $X through Mon Dec 1" or "launch bonus" with no struck-through former price. Do not use fake countdown timers.

### 6.4 Platform disclosure labels

| Situation | TikTok | Instagram / Facebook / Threads | YouTube | LinkedIn |
|---|---|---|---|---|
| Promoting **your own** courses or services | **Turn on the content-disclosure setting** (label: "Promotional content") [S16] | No partnership tag needed (no third party) | No paid-promotion box needed (you aren't being paid by a third party) | Nothing required |
| A third party pays or gifts you (sponsorship, free tool access in exchange for coverage) | Disclosure setting with the "Paid partnership" label [S16], plus a verbal or on-screen disclosure | **Branded content tool: tag the partner → "Paid partnership with" label** [S33], plus an in-caption disclosure | Tick **"Video contains paid promotion"**; YouTube shows a 10-second disclosure [S34], plus a verbal disclosure | **Brand Partnership** toggle, which resets after each post [S35], plus an in-text disclosure |
| Affiliate links (e.g., an AI tool's referral program) | Disclose in the caption and on screen | **"Paid partnership with" label required; no partner tag needed** [S33] | Paid-promotion box if it applies, plus a description disclosure | In-text disclosure |

The FTC position stands regardless: the disclosure must be clear and visible without tapping "more" [S22].

### 6.5 AI-generated content labels (and what a screen recording counts as)

| Platform | Rule (official) | Source |
|---|---|---|
| **TikTok** | **Must label** all AI-generated content containing **realistic images, audio, and video**. "Encouraged" to label anything completely generated or significantly edited by AI, including subjects shown saying things they didn't say ("AI-generated speech") or face-swaps. TikTok auto-labels its own AI effects. Turning the label on "won't affect the distribution of your video" | [S18] |
| **Meta (IG/FB/Threads)** | "We require people to disclose, using our AI-disclosure tool, whenever they post organic content with **photorealistic video or realistic-sounding audio** that was digitally created or altered, and we may apply penalties if they fail to do so." Meta also auto-applies "AI info" labels from industry signals (C2PA and similar) | [S20] |
| **Meta ads** | Ads made with Meta's gen-AI tools, or third-party tools whose metadata Meta detects, get an "AI info" label automatically. The mandatory self-disclosure is for social-issue, election and political ads | [S21] |
| **YouTube** | Disclose realistic content that makes a real person say or do something they didn't, alters real events or places, generates a realistic scene that didn't happen, or uses **AI music as the main focus**. **Not required** for production assistance (AI-written outline, script, thumbnail, title or infographic), captions, idea generation, beauty or lighting filters, **cloning your own voice for voice-overs**, or clearly unrealistic content. Repeated non-disclosure can mean removal or YPP suspension. YouTube auto-labels C2PA content and content made with its own AI tools | [S19] |

**Decision guide for Principe AI content.** This applies the policies above; it is my interpretation, not platform guidance.

| Content | Label? |
|---|---|
| A real screen recording of you prompting ChatGPT, Claude or Gemini, showing real text output | **No label on any platform.** It is real footage of a real event; the AI text on screen is not synthetic image, video or audio. Note on screen if the clip is sped up or trimmed ("sped up 4×") so viewers aren't misled |
| You on camera reading a script that AI helped write | **No** (YouTube explicitly exempts scripts; TikTok and Meta don't cover text) |
| An AI voice-over: your cloned voice, or a synthetic narrator | **TikTok: label** (AI speech); **Meta: label** (realistic-sounding audio); **YouTube: not required for your own voice clone**, but label if it's a realistic voice of another real person |
| An AI avatar of you (HeyGen and similar) or AI b-roll (Veo, Sora, Runway) | **Label on all three platforms** |
| Photorealistic AI images in a carousel | TikTok: label. Meta: the mandatory rule names video and audio, but Meta auto-labels detected images; **label anyway (Recommendation)**. YouTube: label if realistic |
| A screen recording that shows an AI-generated *photorealistic* image or video as the subject | Safest to **label** on TikTok and Meta |

**Recommendation for an AI-education brand:** label generously. It costs nothing (TikTok says no reach penalty [S18]) and it signals trust.

### 6.6 Using AI brand names (Claude, ChatGPT, Gemini) without implying endorsement

- **Anthropic's trademark guidelines:** "You may not use our trademarks in a manner that implies Anthropic's sponsorship or endorsement, or a relationship or affiliation with Anthropic". Trademarks (names, logos, brand elements) may be used only "as specifically permitted… in materials we approve beforehand". The marks may not be altered or shown with a ™ symbol [S36].
- **OpenAI's brand page:** it does "not permit our GPT brand to be used in app, product, developer or company names"; if you reference a model, "be precise and accurate" [S37]. The full "Non-partnerships" section could not be retrieved (**UNVERIFIED**).
- **Google's Gemini brand rules:** current third-party guidance **UNVERIFIED**.
- **Practical rules (Recommendation; the legal principle is usually called "nominative fair use" — confirm with counsel):**
  - Refer to tools **by name, in plain text, factually**, e.g. "how to write better prompts in ChatGPT, Claude and Gemini". This matches the site's current FAQ copy.
  - **Do not put their logos** in thumbnails, carousels, profile pictures or ads without written permission. Use generic icons or a screenshot of your own screen showing the product UI in context.
  - Never say "official", "partner", "certified", "approved by" or "in partnership with", and never style a course title like a product (no "ClaudeGPT Academy").
  - It's fine to say the assessment plan is "written by Claude", because that's factual. Avoid wording that implies Anthropic endorses Principe AI.
  - **Add to the site footer and `/terms`:** "Principe AI is an independent education and consulting company and is not affiliated with, sponsored by, or endorsed by Anthropic, OpenAI, Google, or any other AI provider. Product names are trademarks of their respective owners." No such line exists today.

### 6.7 Music on business accounts

- **TikTok:** the CML is "pre-cleared for commercial use". Verified Business Accounts and Organization Accounts **cannot use the general music library**, which is "restricted to personal entertainment use only" [S15]. Even on other account types, TikTok recommends using only CML music when posting content that promotes a brand, product or service [S17].
- **Instagram/Facebook:** business accounts have a limited licensed library. **Meta Sound Collection** "can be used for commercial purposes like ads" [S38].
- **YouTube:** the YouTube Audio Library is the safe source; specific licence terms **UNVERIFIED** in this session.
- **Rules (Recommendation):**
  - Lead with your own voice-over (this is education content).
  - Use CML or Sound Collection tracks at low volume underneath.
  - **Never** download a trending commercial song into CapCut or Edits and upload it.
  - Do not use AI-generated music as the main focus of a YouTube video unless it's disclosed [S19].

### 6.8 CAN-SPAM, for every email captured through social (Starter Kit, assessment, DMs)

FTC requirements for commercial email [S32]:
- Accurate header information.
- A subject line that matches the content.
- A clear and conspicuous disclosure that the message is an advertisement.
- **A valid physical postal address.** A street address, a registered USPS PO box, or a private mailbox at a commercial mail receiving agency all qualify.
- A clear opt-out, honoured **within 10 business days**, and working for **at least 30 days** after sending.
- You stay responsible even when a vendor (here, Resend) sends the email.
- Penalties: **up to $53,088 per email.**
- Purely transactional or relationship emails (receipts, booking confirmations, course access links) are exempt from most of these provisions.

**Site gap (verified in code):** `emailLayout()` in `src/lib/email.ts` prints `© {year} Principe Consults · Principe AI` plus an unsubscribe link, but **no postal address**, and there is no address field in Settings. **Fix before the launch email sequence goes out:** rent a PO box or CMRA address, add a business-address setting, and render it in the marketing-email footer. The unsubscribe side is already in place (tokenized link plus one-click unsubscribe; automations stop on unsubscribe; see `src/lib/crm.ts`).

**Also:**
- Add people from DMs or comments to the email list only when they submitted the opt-in form themselves. Don't paste DM handles into the CRM as subscribers.
- **Out of scope here:** non-US privacy and consent laws (GDPR, CASL) for international visitors and state privacy laws (**UNVERIFIED applicability**).

### 6.9 Ad policies for later boosts (Meta)

- Meta prohibits ads that "assert or imply the personal attributes of their audience" [S55]. Avoid "Are you overwhelmed and behind?" in boosted copy; write "Feeling behind on AI? Here's a 7-day plan" in the third person, or describe the offer.
- Meta separately prohibits ads implying unrealistic or unexpected results [S55]. Keep boosted posts free of earnings and outcome claims (see 6.3).

---

## 7. Paid boost (optional) and when not to spend

### 7.1 Do NOT spend yet if any of these is true (Recommendation)

- `/links` and `/free-guide` are not live with UTMs, or **Admin → Funnels shows a free-guide visitor → lead rate below about 20-25%** for social traffic. This threshold is my **Hypothesis** for a free opt-in, not a benchmark. Paying to send traffic to a leaky page wastes money.
- The welcome email sequence is not running, or the CAN-SPAM postal-address gap is not fixed.
- You have posted consistently for **fewer than 3-4 weeks**, so there are fewer than about 20 posts to choose a winner from.
- No post has beaten your own median views by **2-3×** organically. Boost proven posts only, never a new one.
- **Hypothesis (not verified):** ad prices are commonly reported to spike from Black Friday week to Cyber Monday (around 2026-11-23 to 2026-12-01). A zero-follower brand should avoid its first test that week and aim for **Dec 2026 (pre-holiday "learn AI in the new year")** or the **2027-01-01 to 01-15 "new skill" window** instead.

### 7.2 Smallest sensible tests

| Platform | Platform minimum | Suggested first test (Recommendation) | Source |
|---|---|---|---|
| **Meta boost** (IG Reel or FB post) | About $1/day; Metricool's docs describe a 2-day, $2-minimum boost. Third-party figure, **UNVERIFIED** on a Meta page | **$5/day × 7 days ($35)**, goal "website visits" → `/free-guide?utm_source=instagram&utm_medium=paid_social&utm_campaign=starter-kit&utm_content=<post>`, US audience aged 25-65, automatic placements | [S54] |
| **TikTok Promote** | About $3/day (Sprout Social; third-party, **UNVERIFIED**). TikTok Ads Manager is far higher: **campaign daily budget above $50, ad group above $20** [S53] | **$5/day × 5 days ($25)** in Promote, goal "More website visits" [S53]. On iPhone, Promote may be paid in TikTok Coins with Apple's fee on top (third-party, **UNVERIFIED**); pay from desktop or the web to avoid it | [S53] |
| **LinkedIn boost** | **$10/day for at least 2 days** (mobile boost help page) | Only once a *Company Page* post outperforms. **$10/day × 3 days ($30)**, aimed at small-business owners and job functions such as operations and marketing | [S52] |
| **YouTube / X** | — | Skip for now | — |

**Kill or keep rules (Hypothesis):** after the test, compare **cost per lead** (spend ÷ new leads from `utm_medium=paid_social` in Admin → Funnels/Contacts) against what a lead is worth. With a $47 entry course, even a 2% lead-to-buyer rate makes a lead worth about $0.94 in direct revenue. Coaching ($150) and implementation (custom quotes) raise that, so a **CPL ceiling of roughly $3-5 for the Starter Kit** is a reasonable first guard rail. Stop any boost that has produced no leads after about $20.

---

## 8. Measurement

### 8.1 Weekly per-platform metrics (native analytics)

| Platform | Track weekly | Notes | Source |
|---|---|---|---|
| Instagram | **Views** (the primary metric across formats), reach (follower vs non-follower), **sends/shares per reach**, saves, follows, profile visits, **external link taps** | Mosseri highlighted Views and sends per reach. Profile visits and website clicks are reportedly no longer in the API since Jan 2025, so read them in the app (**UNVERIFIED**) | [S56] |
| TikTok | Video views, average watch time, % watched full video, new followers, profile views, traffic source share (For You) | Analytics need at least one public post [S15] | [S15] |
| YouTube Shorts | Views, **engaged views**, "viewed vs swiped away", subscribers gained | Since 2025-03-31 a Shorts view counts on any start or replay, so engaged views are the better quality signal (third-party, **UNVERIFIED** on YouTube Help) | — |
| YouTube long-form | Impressions click-through rate, average view duration, subscribers per video, clicks to the description link (via site UTMs) | — | — |
| LinkedIn (founder plus Page) | Impressions, members reached, comments (the strongest signal), reposts, followers, profile views | — | — |
| X | Impressions, link clicks (via site UTMs) | Native analytics may now need a paid tier; sources conflict (**UNVERIFIED**) | — |
| Facebook / Threads | Views, link clicks or replies | — | — |

### 8.2 Site metrics (the ones that pay the bills)

**Admin → Funnels**, with the range set to **7 days** (options are 7, 30 and 90; times are in the business time zone):
- **Key numbers:** Unique visitors, New leads (with % of visitors), Booked calls, Revenue.
- **Attribution → by channel.** This is `utm_source`, so you get rows like `instagram`, `tiktok` and `linkedin`; untagged traffic shows as `direct`. It shows leads, booked calls, customers and revenue, credited first-touch.
- **Attribution → by source.** This is the signup path (Starter Kit vs assessment vs booking vs chat).
- **Funnel cards:** free-guide, assessment, course-sales and booking. Watch where social visitors drop off.
- **Top landing pages** (lead rate per page) and **Top referrers**. Referrers such as `l.instagram.com` or `linktr.ee` mean some link is missing UTMs.

**Admin → Contacts:** filter or sort new contacts by source and UTM, and use the CSV export (`/api/admin/contacts/export`) for a monthly sheet. Read 3-5 new contact records a week to learn who is actually signing up.

### 8.3 The 30-minute Monday review

Suggested slot: Monday 9:00-9:30 ET, before the week's batch session.
1. **(5 min) Site first.** Admin → Funnels → 7 days. Write down visitors, leads, booked calls and revenue, and leads **by channel**. Compare with last week.
2. **(10 min) Native analytics.** For each active platform, record views, follows, and link taps or clicks for the week. Mark the **top 2 posts** by views *and* by profile actions, and the **bottom 2**.
3. **(5 min) Hygiene.**
   - Does any referrer show untagged traffic? Fix those links.
   - Did any DM automation fail or reply with the wrong link?
   - Are unsubscribes or spam complaints rising (Admin → Email Log)?
   - Are there comments still unanswered?
4. **(5 min) Decide.**
   - Make **2 more posts in the format of last week's winner** (same hook style, new topic).
   - **Retire any format** that has been in the bottom 20% three weeks running.
   - Pick **one experiment** (a new hook, length, posting slot, or CTA keyword).
5. **(5 min) Plan the batch.** Choose next week's topics from the repo content (starter-kit prompts, lesson blueprints, video scripts). Queue them in the scheduler or Postiz with `utm_content` already filled in.
6. **Monthly add-on (first Monday):**
   - Compute leads → customers by channel (CSV export).
   - Re-check the free-tier limits in section 1.2 against what you actually use.
   - Re-read section 6 before any promotion (BFCM, New Year).

**One-line weekly log (copy into a sheet):**
`Week | Posts (by platform) | Views | Follows | Link taps | Site visitors | Leads (IG/TT/YT/LI/X) | Booked calls | Revenue | Top post | Experiment | Next action`

---

## 9. Open questions and items marked UNVERIFIED

- The Facebook/Meta Business Suite scheduling window (third parties say 29 days for FB Reels). Threads' maximum window. Whether free X accounts can schedule natively.
- Whether a Metricool Free cross-post counts once or once per network against the 20-post limit. Metricool's X add-on price. Monthly prices for Later Starter, Canva Pro and Buffer Essentials.
- Descript, CapCut and Linktree prices (third-party only). CapCut's current US terms of service.
- Whether Geist and Instrument Serif are in Canva's free font library. Whether custom font upload is Pro-only (third-party tutorials say yes).
- Handle availability on Instagram, TikTok, LinkedIn and Facebook (could not be checked automatically). TikTok and Facebook username rules from official pages.
- Business verification documents TikTok requires for a Verified Business Account.
- Whether the FTC's proposed "money-making opportunity" amendments to the Business Opportunity Rule (Jan 2025 NPRM) have been finalized.
- Google's Gemini brand rules for third parties. OpenAI's full "Non-partnerships" text.
- Whether X native analytics now require a paid tier. Instagram in-app-browser referrer and cookie behaviour.
- Exact minimum budgets for Meta boosts and TikTok Promote from official pages.
- **Owner decisions:**
  - Postiz (Claude-assisted scheduling) or Buffer?
  - Which PO box or CMRA address to use for CAN-SPAM?
  - File a USPTO trademark for "Principe AI"?
  - Does the founder appear on camera, or use voice-over with screen recordings? This drives the AI-label decisions in 6.5.

---

## Sources (accessed 2026-10-20 unless a date is given)

- [S1] Buffer Pricing. https://buffer.com/pricing (page says prices last updated Nov 2025)
- [S2] Metricool Pricing. https://metricool.com/pricing/
- [S3] Later Pricing. https://later.com/pricing/
- [S4] Postiz Pricing and FAQ. https://postiz.com/pricing
- [S5] Hootsuite Plans. https://www.hootsuite.com/plans
- [S6] LinkedIn Help, "Schedule posts" https://www.linkedin.com/help/linkedin/answer/a1347212 and "Schedule a LinkedIn Page post" https://www.linkedin.com/help/linkedin/answer/a1419179
- [S7] TikTok Creator Academy, "TikTok Studio Web" (30 days) https://www.tiktok.com/creator-academy/article/tool-web-creation-intro and the older "Advanced Desktop Tools" (10 days) https://www.tiktok.com/creator-academy/article/advanced-desktop-tools (both undated)
- [S8] X Help, "About advanced X Pro features" https://help.x.com/en/using-x/advanced-xpro-features and "Scheduled Posts" (Ads) https://help.x.com/en/business-and-advertising/scheduled-tweets
- [S9] YouTube Help, "Schedule video publish time" https://support.google.com/youtube/answer/1270709
- [S10] Meta, "New Threads Features for Creators and Businesses" (2024-08-15) https://about.fb.com/news/2024/08/new-threads-features-for-creators-and-businesses/ and @creators on Threads https://www.threads.com/@creators/post/DF53B4cJATQ (2025)
- [S11] TechCrunch, Instagram scheduling for all professional accounts (2022-11-08) https://techcrunch.com/2022/11/08/instagram-scheduling-tool-all-professional-accounts/
- [S12] Meta Business Help, "Use Planner in Meta Business Suite" https://www.facebook.com/business/help/1678733516458988 and "Schedule… on Meta Business Suite mobile" https://www.facebook.com/business/help/609176706604372
- [S13] Search Engine Land, "Instagram now allows up to 5 links in bio" (Apr 2023) https://searchengineland.com/instagram-now-allows-up-to-5-links-in-bio-395742
- [S14] TikTok Support, "Adding a website link to your profile" https://support.tiktok.com/en/getting-started/setting-up-your-profile/linking-another-social-media-account
- [S15] TikTok Support, "Account types on TikTok, Verified Business Accounts" https://support.tiktok.com/en/using-tiktok/growing-your-audience/switching-to-a-creator-or-business-account
- [S16] TikTok Support, "Promoting a brand, product, or service on TikTok" https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/promoting-a-brand-product-or-service
- [S17] TikTok Support, "Commercial use of music on TikTok" https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/commercial-use-of-music-on-tiktok and TikTok Ads Help, "About the Commercial Music Library" https://ads.tiktok.com/resources/help/article/commercial-music-library?lang=en
- [S18] TikTok Support, "AI-generated content labeling" https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content
- [S19] YouTube Help, "Disclosing use of GenAI content" https://support.google.com/youtube/answer/14328491
- [S20] Meta Transparency Center, Misinformation policy (AI disclosure) https://transparency.meta.com/policies/community-standards/misinformation/; Meta, "Labeling AI-Generated Images…" (2024-02) https://about.fb.com/news/2024/02/labeling-ai-generated-images-on-facebook-instagram-and-threads/; Meta, "Our Approach to Labeling AI-Generated Content…" (2024-04-05, updated 2025-10-23) https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/
- [S21] Meta Business Help, "About AI info on ads…" https://www.facebook.com/business/help/1010479435004531
- [S22] FTC, "FTC's Endorsement Guides: What People Are Asking" (modified 2025-07-15; reflects the 2023 revision) https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
- [S23] FTC press release, final rule banning fake reviews and testimonials (2024-08-14) https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials
- [S24] FTC, "The Consumer Reviews and Testimonials Rule: Questions and Answers" https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers
- [S25] eCFR, 16 CFR Part 465 https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465
- [S26] FTC Business Blog, "A warning letter (or ten)…" (Dec 2025) https://www.ftc.gov/business-guidance/blog/2025/12/warning-letter-or-ten-businesses-comply-ftcs-consumer-review-rule
- [S27] FTC, inflation-adjusted civil penalties for 2025 ($53,088) https://www.ftc.gov/news-events/news/press-releases/2025/02/ftc-publishes-inflation-adjusted-civil-penalty-amounts-2025; Federal Register, "Civil Penalty Inflation Adjustments" (2026-09-15, FTC amounts unchanged for 2026) https://www.federalregister.gov/documents/2026/09/15/2026-18853/civil-penalty-inflation-adjustments
- [S28] FTC, "Operation AI Comply" (2024-09) https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes
- [S29] FTC, Air AI settlement (2026-03) https://www.ftc.gov/news-events/news/press-releases/2026/03/air-ai-its-owners-will-be-banned-marketing-business-opportunities-settle-ftc-charges-company-misled
- [S30] FTC, Lurn business-coaching case (2023-09) https://www.ftc.gov/news-events/news/press-releases/2023/09/ftc-acts-stop-online-business-coaching-scheme-lurn-deceiving-consumers-about-money-making-potential
- [S31] FTC, 16 CFR 437 Business Opportunity Rule NPRM (2025-01-13) https://www.ftc.gov/legal-library/browse/federal-register-notices/16-cfr-437-business-opportunity-rule-notice-proposed-rulemaking-0
- [S32] FTC, "CAN-SPAM Act: A Compliance Guide for Business" (modified 2025-07-22) https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- [S33] Meta Business Help, "About branded content on Facebook, Instagram and Threads" https://www.facebook.com/business/help/788160621327601
- [S34] YouTube Help, "Add paid product placements, sponsorships and endorsements" https://support.google.com/youtube/answer/154235
- [S35] Social Media Today, LinkedIn Brand Partnership tags (undated in results) https://www.socialmediatoday.com/news/linkedin-rolls-out-brand-partnership-tags/691582/
- [S36] Anthropic Trademark Guidelines https://www.anthropic.com/legal/trademark-guidelines
- [S37] OpenAI Brand Guidelines https://openai.com/brand/
- [S38] Instagram Help, "Access to the licensed music library on Instagram" https://help.instagram.com/402084904469945/
- [S39] Meta for Developers, "Private replies – Instagram Messaging" https://developers.facebook.com/documentation/business-messaging/instagram-messaging/features/private-replies and "Messenger Platform and IG Messaging API policy" https://developers.facebook.com/documentation/business-messaging/messenger-platform/policy
- [S40] Meta Business Help, "About Automated Responses in Meta Business Suite Inbox" https://www.facebook.com/business/help/395965998733706
- [S41] ManyChat Pricing https://manychat.com/pricing
- [S42] ManyChat Community, TikTok automation https://community.manychat.com/general-q-a-43/tiktok-automation-4175; InstantDM, "TikTok Comment to DM" (Aug 2026, third-party) https://instantdm.com/blog/tiktok-comment-to-dm
- [S43] Canva Pricing (US) https://www.canva.com/pricing/
- [S44] Third-party Canva font-upload tutorials, e.g. https://shotkit.com/upload-fonts-canva/ (UNVERIFIED)
- [S45] Meta, "Introducing Edits" (2025-04) https://about.fb.com/news/2025/04/introducing-edits-streamlined-video-creation-app/; Meta, Instagram and Edits update (2025-11) https://about.fb.com/news/2025/11/instagram-empowers-creators-to-go-global-with-local-voice-translations-and-fonts/
- [S46] Sonix, "Descript Pricing 2026" (third-party) https://sonix.ai/resources/descript-pricing/
- [S47] BIGVU, "CapCut pricing 2026" (third-party) https://www.bigvu.tv/blog/capcut-pricing-2026-free-vs-pro-included-alternatives; TechRadar on CapCut's 2025 terms https://www.techradar.com/pro/popular-video-editing-app-capcut-wants-to-use-any-content-you-produce-for-free-forever-heres-what-you-should-know; Hooked, CapCut US status (2026, third-party) https://www.hooked.so/guides/is-capcut-getting-banned
- [S48] X Help, "Help with username registration" https://help.x.com/en/managing-your-account/x-username-rules
- [S49] YouTube Help, "Learn about YouTube handles" https://support.google.com/youtube/answer/11585688
- [S50] Meta fb-answers, Instagram username rules https://www.facebook.com/fb-answers/instagram-username-allowed-characters-periods-underscores-official-help/
- [S52] LinkedIn Help, "Prepaid ad credits for boosting your LinkedIn post on mobile" https://www.linkedin.com/help/lms/answer/a10331039
- [S53] TikTok Ads Help, "About Budget" https://ads.tiktok.com/resources/help/article/budget?lang=en; "How to set up Promote for website visits" https://ads.tiktok.com/help/article/how-to-set-up-promote-for-website-visits-and-conversions; Sprout Social, TikTok Promote ($3/day, third-party) https://sproutsocial.com/insights/tiktok-promotion/
- [S54] Metricool Help, "How to boost your posts" (third-party view of Meta boost minimums) https://help.metricool.com/en/article/how-to-boost-your-posts-84jehj
- [S55] Meta Transparency Center, "Privacy Violations and Personal Attributes" https://transparency.meta.com/policies/ad-standards/objectionable-content/privacy-violations-personal-attributes/; Meta Business Help, "About Meta Advertising Standards" https://www.facebook.com/business/help/488043719226449
- [S56] Social Media Today, "Instagram updates metrics to focus creators on views" https://socialmediatoday.com/news/instagram-updates-metrics-to-focus-creators-on-views/723645/
- [S57] eCFR, 16 CFR 233.1 Former price comparisons https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-233/section-233.1
- [S62] Meta, "Introducing Meta One" (2026-09-15) https://about.fb.com/news/2026/09/introducing-meta-one-subscription-service-more-features-ai/

Repo facts are cited by file path and were checked on 2026-10-20: `src/proxy.ts` (first-touch UTM cookie, 90-day TTL), `src/lib/funnels.ts` (channel = `lower(utm->>'source')`, range options 7/30/90), `src/app/admin/(panel)/funnels/page.tsx`, `src/lib/email.ts` (footer has no postal address), `src/lib/crm.ts` (unsubscribe), `src/components/chat/chat-panel.tsx` (AI badge and disclaimer), `src/app/(marketing)/privacy/page.tsx` (cookie disclosure), `src/config/site.ts` (empty social links), `src/app/globals.css` (brand hex values), `src/app/layout.tsx` (Geist and Instrument Serif via `next/font/google`), `src/db/seed.ts` (booking slugs `ai-strategy-call`, `ai-coaching-session`, `implementation-discovery`).
