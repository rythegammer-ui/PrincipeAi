# Instagram, Pinterest and Facebook kit

> **What this file is:** every Instagram feed carousel, Story, Highlight and Broadcast Channel message, every Pinterest Pin and board, and every Facebook Page, Group and group-reply post for the Principe AI launch: VC-01 to VC-83, slide by slide and word for word, each with its tagged link.
>
> **When to use it:** at each Monday batch session (design that week's carousel and Pins) and on every posting day. *When* each post goes out is set by the [launch calendar](02-launch-calendar.md); section 5 copies those dates for this kit.
>
> **How to read it:** text in a grey box is ready to paste. L is launch day, Tue Nov 10, 2026. Every date shows the L-day with the default date beside it, in ET on a 24-hour clock (20:00 is 8:00 pm). Post IDs never change. **PRICE**, **CONFIRM**, **FIXED** and **OPTIONAL** mean what they mean in the calendar. Profiles, bio links and DM automations are in [profile setup](01-profile-setup.md); the link rules are in [tools, measurement and compliance](08-tools-measurement-compliance.md), section 2. [V] means a platform's own help pages say so, [R] that third-party reports do (October 2026).

Back to the [README](README.md).

## Start with these 10

If you only make ten things from this kit, make these. They cover the always-on Highlights, the warm-up, launch day, both paths (your life and your business) and the New Year push.

1. **VC-30 to VC-35 · The six Highlights:** the permanent "start here" for every profile visitor, with tagged links to the kit, the assessment, the courses and a free call. L-9 · Sun Nov 1 · 10:00 ET.
2. **VC-07 · Fact-check any AI answer in 3 minutes:** the first feed post (warm-up), so nobody lands on an empty grid. L-5 · Thu Nov 5 · 12:30 ET.
3. **VC-59 · Facebook launch post:** the Page's one clickable launch link, to the Starter Kit. Pin it. L+0 · Tue Nov 10 · 9:30 ET.
4. **VC-16 · Launch-day Story, "It's live":** Day 1 of the 14-day Stories plan, with the Starter Kit link sticker. L+0 · Tue Nov 10 · 9:30 ET.
5. **VC-50 · The 7-day AI plan Pin:** Pinterest's main door to the Starter Kit; a second design returns for the New Year. L+0 · Tue Nov 10 · 20:00 ET, and L+34 · Mon Dec 14 · 20:00 ET.
6. **VC-01 · Start here: how Principe AI works:** the carousel that explains Assess → Learn → Implement, and a candidate for your pinned posts. Check its **CONFIRM** line. L+1 · Wed Nov 11 · 12:30 ET.
7. **VC-02 · The 5-part prompt:** the clearest demo of what you teach, with Day 2 of the kit on a slide. L+4 · Sat Nov 14 · 12:30 ET.
8. **VC-08 · Thanksgiving, planned:** the seasonal carousel, nine days before the holiday (**FIXED**); it returns on Facebook as VC-68. L+7 · Tue Nov 17 · 12:30 ET.
9. **VC-05 · Where AI pays off in a small business:** the first carousel for business owners, pointing to the assessment. L+11 · Sat Nov 21 · 12:30 ET.
10. **VC-78 · 7-Day AI Starter Challenge:** the New Year push, one post a day, built from the kit's 7-day plan. Teaser Story L+53 · Sat Jan 2 · 10:00 ET; daily L+55 to L+61 · Mon Jan 4 to Sun Jan 10.

---

> **Check prices before posting.** Course and coaching prices in this kit are the site's seed defaults (`src/db/seed-content/course-*.ts`, `src/db/seed.ts`). Confirm them in **Admin → Courses** (and the coaching session in **Admin → Availability**) the morning of any post that names a price. In this kit: VC-15 (slides 3 to 5 and 7, caption), VC-33 (frames 2 to 4) and the OPTIONAL VC-72.

**Exact offer facts used in this kit** (the same as the [content bank](07-content-bank.md), section 6; don't change them in captions)

| Offer | What to say |
|---|---|
| The AI Starter Kit (free, `/free-guide`) | "50 copy-paste prompts + a 7-day plan to make AI genuinely useful in your life and work." One small, practical win a day, about 10 minutes each. 50 prompts in 8 categories, plus 8 safety and quality tips. No card required, nothing to cancel. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini |
| Free AI Readiness Assessment (`/assessment`) | About 3 minutes, free, instant results, no tech skills needed. A readiness score out of 100, a tier (Explorer, Experimenter, Implementer or Scaler), a personalized AI action plan (three quick wins with copy-paste prompts, a 30-day roadmap and the tools worth trying) and a recommended next step. Say the plan is "written by Claude" only with **[CONFIRM: AI key live in production]** |
| Free preview lessons | 7 lessons, free to read, no login. The AI tutor is **not** on preview pages |
| Paid courses (all three) | Lifetime access, self-paced, certificate of completion. "An AI tutor in every lesson" only with **[CONFIRM: AI key live in production]** (the site falls back to plain text without the key) |
| AI Essentials: Use AI in Everyday Life | $47 · 18 lessons |
| AI for Business Owners: The Implementation Playbook | $297 · 20 lessons |
| AI Automation Accelerator: Build Workflows & Agents | $497 · 18 lessons · tool subscriptions and AI usage are paid separately |
| 1:1 AI Coaching Session | $150 · 60 minutes |
| Free AI Strategy Call (`/book/ai-strategy-call`) | 30 minutes |
| AI Implementation Discovery Call (`/book/implementation-discovery`) | Free, 45 minutes, usually reached through `/consulting` |
| Done-with-you AI implementation (`/consulting`) | Custom written scope and quote after a free discovery call. No published price |

**Never say:** testimonials, results, student counts, ratings, "trusted by", time-saved or revenue figures, "money-back guarantee", struck-through or "was" prices, guaranteed results, that previews include the AI tutor, or that Principe AI is a partner of, or approved by, Anthropic, OpenAI or Google. Leave the downloadable course app and PDF book out of every post until delivery is automated and listed on the course pages. Never invent anything about the founder: use the `[YOUR NAME]`, `[YOUR STORY: …]` and `[YOUR CREDENTIAL IF ANY]` placeholders.

**Hold back until true** (content bank, section 5, gaps 7 and 12)

- **"AI tutor inside every lesson"** depends on `ANTHROPIC_API_KEY` being set in production. Only VC-01, VC-15 and the Courses Highlight (VC-33) mention it, each marked **[CONFIRM: AI key live in production]**. Check on L-20 · Wed Oct 21; if the key still isn't live by L-1 · Mon Nov 9, delete those lines. Nothing here says the assessment plan is "written by Claude"; add that only with the same tag.
- **The downloadable offline course app and PDF course book** are sent by hand today and aren't listed on the site. No post mentions them.

**No logos.** No Claude, ChatGPT or Gemini logos on any slide, Pin or cover; name the tools only as "AI assistants like Claude, ChatGPT and Gemini", in plain text.

**Independence line** ("Principe AI is independent and not affiliated with Anthropic, OpenAI or Google."): it sits in the Pinterest About, the Facebook About and the group description, all in [profile setup](01-profile-setup.md). The posts here don't need it.

## How to use this kit

**What's in it**

| IDs | What | Section |
|---|---|---|
| VC-01 to VC-15 | Instagram feed carousels, written slide by slide, with captions. Several also go to the Facebook Page and to Pinterest | 2.2 |
| VC-16 to VC-29 | The 14-day Instagram Stories plan (L+0 · Tue Nov 10 to L+13 · Mon Nov 23) | 2.3 |
| VC-30 to VC-35 | The six Highlights and the frames in each | 2.4 |
| VC-36 to VC-38 | Broadcast Channel starter messages (Reserve: locked until 1,000 followers) | 2.5 |
| VC-39 to VC-58 | Pinterest: 20 Pins and the 10 boards | 3 |
| VC-59 | Facebook launch post (one of the Page's roughly two link posts a month) | 4.3 |
| VC-60 to VC-71 | 12 Facebook Page posts | 4.4 |
| VC-72 | **OPTIONAL** Black Friday promotion (Facebook link post plus an Instagram Story), only with a real Stripe promotion code | 4.5 |
| VC-73 to VC-78 | Your own Facebook Group (decision, rules, welcome post, weekly threads, the 7-Day AI Starter Challenge) | 4.6 |
| VC-79 to VC-83 | Five value-first templates for other people's Facebook groups | 4.7 |

Section 5 lists every post's calendar date, section 6 is the pre-post checklist and section 7 the items to confirm before launch.

**How each post block is laid out.** A heading with the ID and topic, then a short fact list: when it posts (copied from the calendar), format, destination, the tagged link, how the link is delivered, what to fill in, and the repo source. Then the content: slides (for carousels), frames (for Stories) or the post text. **Anything in a grey box is ready to paste exactly as it is.** The italic line under each box gives its length, counted by script, against the platform's limit. Counts include placeholders as written (`[YOUR NAME]` counts as 11); recount after you fill them in.

**Four conventions**

1. **Prompt brackets stay in.** Inside a quoted prompt, `[CAPITALS IN BRACKETS]` belong to the prompt: your readers fill them in.
2. **Your placeholders get filled or deleted.** Placeholders for you are `[YOUR NAME]`, `[YOUR STORY: …]`, `[YOUR CREDENTIAL IF ANY]`, `[YOUR OFFER: …]`, `[ANSWER: …]`, `[CONFIRM: …]` (including **[CONFIRM: AI key live in production]**), `[OPTIONAL: …]`, `[DATE AND TIME, ET]`, `[TAG NEW MEMBERS]` and, in group links, `[group-shortname]`. Use only true details; if you have nothing true to put in one, delete the whole line. Before posting, search the text for `[YOUR NAME`, `[YOUR STORY`, `[YOUR CREDENTIAL`, `[YOUR OFFER`, `[ANSWER`, `[CONFIRM`, `[OPTIONAL:`, `[DATE AND TIME`, `[TAG NEW` and `[group-shortname`. None of those strings appears in a quoted prompt (prompts do contain other `[YOUR …]` brackets, such as `[YOUR REASONING]`, which stay in).
3. **«Guillemets» mark the accent word.** On slides, Pins and Story frames, the word inside « » is set in Instrument Serif italic (gold on dark backgrounds, violet on light ones), as the site does in its headlines. Don't type the « » marks themselves.
4. **Hidden `<!-- prompt: … -->` comments** sit above every quoted prompt and name the repo file it comes from. They don't show when the Markdown is rendered; a script used them to check that every prompt line appears word for word in that file (cuts are marked "…").

---

## 1. Rules every post follows

### 1.1 Links and UTM tags

Every link follows the final convention in [tools, measurement and compliance](08-tools-measurement-compliance.md), section 2. For this kit:

```text
https://principeai.com{PATH}?utm_source={instagram|pinterest|facebook}&utm_medium={social|bio}&utm_campaign={launch|evergreen|bf-2026|ny-2027}&utm_content={post ID in lower case}
```

- **`utm_source`** is the platform the link sits on. A Facebook copy of an Instagram carousel uses `facebook` and a Pin cut from a carousel uses `pinterest`; both keep the carousel's ID.
- **`utm_medium`** is `social` for posts, first comments, Story link stickers and Pins, and `bio` for the Highlight frames (VC-30 to VC-35), exactly as in [profile setup](01-profile-setup.md). Links you send in a DM use `dm` (1.2).
- **`utm_campaign`** follows the day the post goes out, as in the calendar: `launch` from L-7 to L+13 (Tue Nov 3 to Mon Nov 23), `evergreen` from L+14 to L+52 (Tue Nov 24 to Fri Jan 1), `ny-2027` from Sat Jan 2 to Sun Jan 31. **Every Pin and every Highlight is `evergreen`**, whatever the day, because they keep collecting clicks for months. `bf-2026` is for VC-72 only, and only with a real Stripe promotion code. Every block's links already carry the right value for its calendar date; if you move a post, change only the campaign.
- **`utm_content`** is the post ID in lower case (`vc-07`). A Story uses its own ID even when it shares a carousel (VC-17's sticker says `vc-17`). In other people's Facebook groups, add the group's short name: `vc-83-smallbizowners`.
- Tags go before any `#section`: `…&utm_content=vc-12#apply`. Starter Kit links always go to `/free-guide`, never `/guide`. Never link a private page (`/assessment/results/…`, `/booking/…`, `/book/confirmed/…`).
- **Profile links, page buttons and DM replies live in [profile setup](01-profile-setup.md)**, not here: Instagram IG-1 to IG-16 (4.1), Facebook FB-1 to FB-5 (4.6), Pinterest PI-1 (5.3), all in its test checklist (section 8). In one line: the main bio link on every platform goes to `/links` (`utm_medium=bio`, `utm_content=bio`), which features the Starter Kit, so "tap the link in my profile" always works. On Instagram, IG-2 is the Starter Kit, IG-3 the assessment, IG-4 a free lesson and IG-5 "Courses + free lessons".

**Where the link can actually be clicked**

| Surface | Put the post's link in | Don't |
|---|---|---|
| Instagram feed carousel | The **same-day Story share** (link sticker). Everyone else gets the comment-keyword DM (1.2) or the profile links | Paste it in the caption (not clickable without paid Meta One) [R] |
| Instagram Story | The **link sticker**, tagged with the Story's own ID | Use a link sticker on a Story you plan to boost (it can't be boosted) [V] |
| Highlight | The link sticker on the frames in 2.4 (`utm_medium=bio`) | Build Highlights from launch-fortnight Stories (their links say `launch`) |
| Pinterest Pin | The Pin's **destination link** field | Link a Pin to Instagram |
| Facebook Page | The **first comment** (most reports say comment links aren't counted [R]). Only VC-59 and VC-72 are link posts | Use more than about 2 link posts a month on a free Page [R] |
| Facebook Groups | Only where the group's rules allow links, or when someone asks | Drop the same link in several groups |

**Test every link before you use it.** On L-8 · Mon Nov 2 the calendar has you test the profile links; test each post link the same way before its first use: open it in a private browser window, opt in with a test address, check the contact's UTM block in Admin → Contacts, then delete the test contact. Your own browser keeps its first `pa_utm` cookie for 90 days and would mis-attribute your tests ([tools, measurement and compliance](08-tools-measurement-compliance.md), 2.8).

### 1.2 Comment and DM keywords (shared with the short-video kit)

The automations are set up once, on L-13 · Wed Oct 28, in Meta Business Suite (Inbox → Automations → "Comment to message", on a computer). The reply texts and links are in [profile setup](01-profile-setup.md): Instagram in 4.1, the Facebook Page in 4.6. One set covers Instagram and Facebook, and the [short-video kit](03-short-video-kit.md) uses the same three. Every DM link uses `utm_medium=dm`, `utm_campaign=evergreen` and one of three `utm_content` values, whichever post triggered it, so nothing needs switching later.

| Comment hashtag (DM keyword) | Destination | Reply link (profile setup IDs) |
|---|---|---|
| `#prompts` (KIT) | Free AI Starter Kit, `/free-guide` | `dm-kit`: IG-6, FB-3 |
| `#aiready` (READY) | Free AI Readiness Assessment, `/assessment` | `dm-ready`: IG-7, FB-4 |
| `#aiworkflow` (WORKFLOW) | Free lesson, Anatomy of an AI Workflow | `dm-workflow`: IG-8, FB-5 |

- **Sending a link by hand** (a DM, or a reply to a Story): copy the matching `dm-` link from profile setup. The Instagram Starter Kit one (IG-6) is `https://principeai.com/free-guide?utm_source=instagram&utm_medium=dm&utm_campaign=evergreen&utm_content=dm-kit`.
- Keep the ask a delivery mechanism ("comment #prompts and I'll send it"), never vote bait ("comment YES if you agree").
- Questions about calls or courses get a personal reply: the convention has no `dm-` value for them yet (profile setup, section 9).

### 1.3 Limits used in this kit

| Field | Limit | Status | What this kit does |
|---|---|---|---|
| Instagram caption | 2,200 characters | [V] | Every caption is under 1,100; the keyword phrase is in the first line |
| Instagram hashtags | 5 per post | [R], since Dec 2025 | 5 or fewer, **counting the comment keyword hashtag** in the CTA. The count is under every caption |
| Instagram carousel | Up to 20 slides; the first slide sets the ratio | [V][R] | 7 to 10 slides, all 4:5 |
| Pinterest Pin title / description | 100 / 800 characters | [V] | Counts under every Pin |
| Pinterest image | 2:3, 1000×1500 px | [V] | All Pins |
| Pinterest board name / description | Not verified | UNVERIFIED | Names under 50 characters, descriptions under 500 |
| Facebook Page link posts | About 2 a month on a free Page | [R] | 2 at most, both in November: VC-59 (L+0) and the OPTIONAL VC-72 (L+17) |

Profile limits (names, bios, links, buttons) are in [profile setup](01-profile-setup.md).

### 1.4 Design system (from `src/app/globals.css` and `src/app/layout.tsx`)

**Colors**

| Token | Hex | Use |
|---|---|---|
| Royal violet (brand-600) | `#6938ef` | Primary background on light-text slides; violet accent words on light slides |
| Deep violet (brand-800) | `#4a1fb8` | Cover and CTA backgrounds (gold text passes normal-size contrast here: 6.2:1) |
| Violet tint (brand-50) | `#f4f3ff` | Light teaching slides |
| Gold (gold-300) | `#fec84b` | Accent words, eyebrows and labels on violet or ink |
| Gold (gold-400) | `#fdb022` | Buttons, pills, underlines, Highlight icons |
| Ink | `#0c0a1d` (panel `#15122b`) | Prompt cards and "dark band" slides |
| Body text on light | zinc-700 `#3f3f46` | Body copy on `#f4f3ff` (9.5:1) |

Contrast checks (computed for this kit): white on `#6938ef` 6.2:1; gold `#fec84b` on `#6938ef` only 4.0:1, so **use gold on royal violet for large headline words only** and switch to `#4a1fb8` or ink when gold text is smaller than about 48 px.

**Type.** Geist (sans) for headlines and body; **Instrument Serif italic** for the one accent word per headline (the «…» word); Geist Mono for prompts.

**Carousel templates (1080×1350, 4:5).** Keep every word inside a centered area with 90 px side margins and 100 px top and bottom margins, so the 3:4 grid thumbnail never cuts text [R]. Put a slide counter ("3/9", Geist 24 px) top right and the wordmark "principeai.com" (Geist 24 px, 70% opacity) bottom left on every slide.

| Template | Background | Headline | Body | Notes |
|---|---|---|---|---|
| **T1 Cover** | `#4a1fb8` to `#6938ef` diagonal gradient | Geist SemiBold 88–96 px, white, accent word in gold `#fec84b` Instrument Serif italic | Eyebrow above, Geist 26 px, uppercase, 0.14 em tracking, gold | At most 8 words in the headline |
| **T2 Teach** | `#f4f3ff` | Geist SemiBold 64–72 px, ink, accent word in `#6938ef` | Geist 40–44 px, `#3f3f46`, at most about 30 words | One idea per slide; a small gold `#fdb022` number or icon top left |
| **T3 Prompt card** | `#6938ef` with an ink `#15122b` panel (32 px corners) | Label "COPY THIS PROMPT", Geist 26 px, gold | Geist Mono 34–38 px, `#f4f4f5`; set every `[BRACKET]` in gold | A source line under the panel, Geist 22 px, e.g. "From the free AI Starter Kit". If a prompt doesn't fit at 34 px, cut lines (never rewrite them) |
| **T4 Before / after** | Top half `#f4f3ff` "Before" box, bottom half ink "After" box | Labels "BEFORE" / "AFTER", Geist 26 px, violet and gold | Geist Mono 32–36 px | Use the repo's exact before and after prompts |
| **T5 CTA** | Ink `#0c0a1d` | Geist SemiBold 72–80 px, white, accent word gold | A gold `#fdb022` pill with ink text: the comment keyword ("Comment #prompts") | One action only. Small line under it: "Free · no card required" where true |

**Story frames (1080×1920, 9:16).** Keep text out of the top and bottom 250 px. **S1 Text frame:** `#6938ef` background, Geist 64 px white headline, one gold accent word. **S2 Prompt frame:** ink background, the prompt in Geist Mono 40 px with gold brackets. **S3 Camera frame:** you on camera with a caption bar (ink at 85% opacity, Geist 44 px white). **No-face option for any S3 frame:** an S1 text frame with the same words, or a screen recording with your voice-over or on-screen text. Stickers sit in the middle third.

**Pin templates (1000×1500, 2:3).** **P1 Headline:** violet background, keyword headline in Geist 96–110 px with the accent word gold, an ink footer band (180 px) reading "principeai.com · Free AI Starter Kit" (or "Free AI Readiness Assessment"). **P2 Prompt card:** headline on top, the prompt in an ink card underneath. **P3 Checklist:** violet-tint background, 4–6 short lines with gold check marks. **P4 Before / after:** two stacked boxes. Put the Pin's keyword phrase in the image headline as well as the title [V].

**Highlight covers.** A 1080×1920 frame filled with `#6938ef`, a centered gold `#fec84b` line icon about 420 px wide (house, gift, checklist, book, briefcase, question mark), no text. Instagram crops the center into a circle.

**On every visual**

- **No Claude, ChatGPT or Gemini logos** and no lookalike marks ([tools, measurement and compliance](08-tools-measurement-compliance.md), 4.9). A real screenshot of your own chat is fine once names, emails and history are hidden.
- **No AI-generated photorealistic images.** Use type, brand shapes and real screenshots. Pinterest labels AI-modified images and lets people see fewer of them [V]; Meta requires disclosure for photorealistic AI video and realistic AI audio [V].
- **Alt text on every slide and Pin:** paste the slide's own text, starting "Slide 3 of 9:". If Instagram cuts it short, keep the first sentence.
- **Add quiet audio to every carousel** from Instagram's library (Meta Sound Collection on a business account), so it can appear in the Reels tab [V].
- Export PNG at full size. Never mix ratios inside one carousel.

### 1.5 Hashtag sets for Instagram

The comment keyword in the CTA is a hashtag and counts toward the cap of 5, so each set adds 4 more.

| Set | With the CTA keyword | The 4 added tags |
|---|---|---|
| Everyday life and prompts | `#prompts` | `#aitips #aiforbeginners #aiprompts #learnai` |
| Parents and home | `#prompts` | `#aitips #parentingtips #familyorganization #aiprompts` |
| Safety | `#prompts` | `#aisafety #onlinesafety #aitips #learnai` |
| Business owners | `#aiready` | `#aiforbusiness #smallbusiness #aitools #businesstips` |
| Automation | `#aiworkflow` | `#aiautomation #nocode #aitools #smallbusiness` |

Facebook posts in this kit carry no hashtags (their reach effect there is low and UNVERIFIED). Pinterest uses keywords, not hashtags [V].

---

## 2. Instagram

### 2.1 Profile setup

Done once in Setup (L-20 · Wed Oct 21): account type, name, bio, the profile links IG-1 to IG-5, the DM automations, settings and pinned posts are all in [profile setup](01-profile-setup.md), section 4.1. From L+7 · Tue Nov 17, consider swapping the LD-03 pin for VC-01.

### 2.2 Feed carousels (VC-01 to VC-15)

**Cadence.** The calendar sets every date: usually one carousel a week, on Friday at 12:30 ET, more often in the launch fortnight. Section 5 lists them all. After four weeks, compare with the times Instagram Insights shows as your followers' most active (Monday review, calendar 3.3).

**Every carousel, every time**

1. Schedule it in Meta Business Suite (up to 30 days ahead for free [V]); add alt text to each slide and quiet audio from the library.
2. Within the hour, **share it to your Story** with a link sticker. In the 14-day Stories plan (L+0 to L+13), that day's Story post (VC-17, VC-20, VC-22, VC-24, VC-27) does this with its own link; otherwise use the carousel's per-post link.
3. Spend 15 minutes replying to every comment. The `#prompts`, `#aiready` and `#aiworkflow` automations send the DMs; you reply to everything else.
4. **Facebook:** VC-03, VC-11, VC-12, VC-13, VC-14 and VC-15 are cross-posted to the Page on the dates in their blocks (4.4); VC-01, VC-02, VC-04, VC-05, VC-06, VC-08 and VC-09 return there as their own posts (VC-60 to VC-70).
5. **Pinterest:** the calendar schedules Pins cut from VC-10, VC-13, VC-14 and VC-15 (each block has the Pin's link, title and description). Cut more from other carousels only when you have time (3.4).

---

### VC-01 · Start here: how Principe AI works

- **Post:** L+1 · Wed Nov 11 · 12:30 ET · Instagram feed · campaign `launch` **CONFIRM**
- **Format:** 9 slides, 4:5
- **Destination:** `/assessment` (Assessment funnel)
- **Per-post link:** `https://principeai.com/assessment?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-01`
- **Link delivered by:** the same-day Story VC-17 (with its own link), comment `#aiready` → DM, profile link IG-3 (assessment)
- **Fill in first:** `[YOUR NAME]`, `[YOUR STORY: …]`, `[YOUR CREDENTIAL IF ANY]` on slide 8 (or delete slide 8: the no-face option); the **CONFIRM** line on slide 5
- **Source:** `src/app/(marketing)/page.tsx` (hero, `PATHS`, `HOW_IT_WORKS`, trust line); `src/config/site.ts` (tagline)

**Slides**

1. **T1 Cover.** Eyebrow: "START HERE". Headline: "Make AI work «for you» — in your life and your business." *Design:* the home page hero line; a thin gold underline under "for you".
2. **T2 Teach.** Headline: "Two paths, «one» goal". Body: "For your life: Less busywork. More of what matters." / "For your business: Put AI to work across your business." *Design:* two stacked cards on the violet tint, a gold house icon and a gold briefcase icon.
3. **T2 Teach.** Headline: "Assess → Learn → «Implement»". Body: "Three steps. Start wherever you are today." *Design:* three gold circles joined by a violet line, numbered 1–3.
4. **T2 Teach.** Headline: "1 · «Assess»". Body: "Take the free AI Readiness Assessment. You'll get a readiness score, a personalized plan and an honest recommendation for where to start."
5. **T2 Teach.** Headline: "2 · «Learn»". Body: "Follow short, practical lessons with an AI tutor beside you — or get 1:1 coaching on your real work when you want a guide." **[CONFIRM: AI key live in production. If not, cut "with an AI tutor beside you".]**
6. **T2 Teach.** Headline: "3 · «Implement»". Body: "Put AI to work. Use your new workflows straight away, or have us design and build the systems with your team."
7. **T2 Teach.** Headline: "What you'll find «here»". Body: "Copy-paste prompts for real tasks · Plain-English explanations · Safety habits that protect you · Business workflows, without the hype". Footer line, Geist 28 px: "No tech background needed · Practical, not hype · Learn at your own pace".
8. **T2 Teach, with a real photo of you.** Headline: "Hi, I'm «[YOUR NAME]»". Body: "[YOUR STORY: one sentence about why you started]" / "[YOUR CREDENTIAL IF ANY]". *Design:* a real photo, never an AI-generated portrait. Not ready to show yourself yet? Delete this slide.
9. **T5 CTA.** Headline: "Start with step 1: the free «3-minute» assessment". Pill: "Comment #aiready". Small line: "Free · instant results · no tech skills needed".

**Caption**

```text
Practical AI for your life and your business: here's how Principe AI works.

Learn AI. Implement AI. Grow with AI.

1. Assess: take the free AI Readiness Assessment and get a readiness score, a personalized plan and an honest recommendation for where to start.
2. Learn: short, plain-English lessons, or 1:1 coaching on your real work.
3. Implement: use your new workflows straight away, or have us build the systems with your team.

No tech background needed. Practical, not hype. Learn at your own pace.

I'm [YOUR NAME]. Save this post, and follow along for prompts you can copy and use today.

Comment #aiready and I'll DM you the free 3-minute assessment (or tap "Free AI Readiness Assessment" in my profile).

#aitips #aiforbusiness #learnai #aitools
```
_756 / 2,200 characters · 5 / 5 hashtags_

---

### VC-02 · The 5-part prompt

- **Post:** L+4 · Sat Nov 14 · 12:30 ET · Instagram feed · campaign `launch`
- **Format:** 10 slides, 4:5
- **Destination:** `/free-guide` (Free Guide funnel)
- **Per-post link:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-02`
- **Link delivered by:** the same-day Story VC-20 (with its own link), comment `#prompts` → DM, profile link IG-2 (Starter Kit)
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `the-five-part-prompt` (free preview lesson: the five-part table, "Before and after"); `src/content/starter-kit.ts` → Day 2 "Learn the 5-part prompt"

**Slides**

1. **T1 Cover.** Eyebrow: "SAVE THIS". Headline: "Same AI. «Better» answers." Sub-line (Geist 48 px, white): "The 5-part prompt".
2. **T2 Teach.** Headline: "1 · «Role»". Body: "Who to act as: 'a friendly personal trainer.' A role sets the expertise, vocabulary and point of view."
3. **T2 Teach.** Headline: "2 · «Context»". Body: "Your situation: 'I'm 52, haven't exercised in years, and have a bad knee.' The most important part, and the one most people skip. Your assistant has never met you." *Design:* a small gold "MOST SKIPPED" tag.
4. **T2 Teach.** Headline: "3 · «Task»". Body: "Exactly what you want: 'Create a 4-week walking plan.' Write, summarize, compare, list, plan, rewrite or explain."
5. **T2 Teach.** Headline: "4 · «Format»". Body: "What the answer should look like: 'A simple table, one row per week.' This one part saves more editing time than any other."
6. **T2 Teach.** Headline: "5 · «Examples»". Body: "What good looks like: a past email you liked, a writing sample, a layout you prefer. Examples communicate style faster than any description."
7. **T4 Before / after, top half only.** Label: "BEFORE". Prompt:
<!-- prompt: src/db/seed-content/course-ai-essentials.ts -->
```text
Write a message to my neighbor about their dog barking.
```
   Caption under it: "You get a generic, slightly stiff note."
8. **T4 Before / after, ink half.** Label: "AFTER". Prompt (cut with "…"; keep the line breaks):
<!-- prompt: src/db/seed-content/course-ai-essentials.ts -->
```text
Act as a tactful communicator who helps neighbors stay on good terms.
Context: My next-door neighbor's dog barks most weekdays from about 8am
to noon while they're at work. I work from home, so it's hard to take
calls. …
Task: Write a short, friendly text message that raises the issue and
suggests we figure out a solution together.
Format: Under 80 words. Warm and casual. No passive-aggressive phrasing.
```
   Caption under it: "A message you could send as is, in your own voice."
9. **T3 Prompt card.** Label: "COPY THIS PROMPT". Source line: "Day 2 of the free AI Starter Kit".
<!-- prompt: src/content/starter-kit.ts -->
```text
Act as [ROLE, E.G. "AN EXPERIENCED PERSONAL ASSISTANT"].
Context: [WHO YOU ARE, THE SITUATION, AND LIMITS LIKE TIME OR BUDGET]
Task: [EXACTLY WHAT YOU WANT DONE]
Format: [E.G. "A SHORT BULLET LIST" OR "AN EMAIL UNDER 120 WORDS"]
Here's an example of the style I like: [OPTIONAL EXAMPLE]
If anything is unclear, ask me questions before you answer.
```
10. **T5 CTA.** Headline: "That was «Day 2». Get all 7 days free." Pill: "Comment #prompts". Small line: "50 copy-paste prompts + a 7-day plan · no card required".

**Caption**

```text
The 5-part prompt: how to get better answers from AI assistants like Claude, ChatGPT and Gemini.

Same AI, same question. One person gets filler, the other gets something they can send almost as is. The difference is the prompt.

Role: who to act as.
Context: your situation (the part most people skip).
Task: exactly what you want.
Format: what the answer should look like.
Examples: what good looks like.

You don't need all five every time. But when an answer disappoints, the fix is almost always one of these.

Save this, and try it on one real task today.

Comment #prompts and I'll DM you the free AI Starter Kit: 50 copy-paste prompts + a 7-day plan.

#aitips #aiforbeginners #aiprompts #learnai
```
_703 / 2,200 characters · 5 / 5 hashtags_

---

### VC-03 · 7 days to make AI genuinely useful

- **Post:** L+6 · Mon Nov 16 · 12:30 ET · Instagram feed · campaign `launch`
- **Format:** 10 slides, 4:5
- **Destination:** `/free-guide`
- **Per-post link:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-03`
- **Also on the Facebook Page:** L+56 · Tue Jan 5 · 9:30 ET · cross-post · campaign `ny-2027` (4.4; first comment below the caption)
- **Link delivered by:** the same-day Story VC-22 (with its own link), comment `#prompts` → DM, profile link IG-2 (Starter Kit)
- **Source:** `src/content/starter-kit.ts` → `intro`, `days` 1–7 (titles and goals, quoted as written)

**Slides**

1. **T1 Cover.** Eyebrow: "FREE 7-DAY PLAN". Headline: "7 days to make AI «genuinely» useful".
2. **T2 Teach.** Headline: "One small win a «day»". Body: "About 10 minutes each. Each day builds on the last, so go in order. Everything works with the free versions of AI assistants like Claude, ChatGPT and Gemini."
3. **T2 Teach.** Headline: "Day «1» · Meet your AI assistant". Body: "Set up a free AI assistant safely and have your first genuinely useful conversation." *Design (slides 3–9):* the day number in Instrument Serif italic, gold, 220 px, top left; a row of 7 dots at the bottom with today's dot filled gold.
4. **T2 Teach.** Headline: "Day «2» · Learn the 5-part prompt". Body: "Turn vague requests into great answers with role, context, task, format and examples."
5. **T2 Teach.** Headline: "Day «3» · Clear a message you've been avoiding". Body: "Draft the reply you've been putting off, in your own voice, in minutes."
6. **T2 Teach.** Headline: "Day «4» · Plan something real". Body: "Let AI do the heavy lifting on your meals, your week or an upcoming trip."
7. **T2 Teach.** Headline: "Day «5» · Learn something faster". Body: "Use AI as a patient tutor to finally understand a topic you've wondered about."
8. **T2 Teach.** Headline: "Day «6» · Make a clearer decision". Body: "Weigh your options, spot blind spots and check the facts that matter."
9. **T2 Teach.** Headline: "Day «7» · Build your AI toolkit". Body: "Save your best prompts and teach your assistant about you, so the habit sticks."
10. **T5 CTA.** Headline: "Start «Day 1» tomorrow". Pill: "Comment #prompts". Small line: "Free · no card required · nothing to cancel".

**Caption**

```text
A 7-day plan to start using AI, for complete beginners. Save it and start tomorrow.

One small, practical win a day, about 10 minutes each:

Day 1: Meet your AI assistant
Day 2: Learn the 5-part prompt
Day 3: Clear a message you've been avoiding
Day 4: Plan something real
Day 5: Learn something faster
Day 6: Make a clearer decision
Day 7: Build your AI toolkit

Each day comes with a copy-paste prompt and a few short steps. No tech skills or paid tools needed: it all works with the free versions of AI assistants like Claude, ChatGPT and Gemini.

Comment #prompts and I'll DM you the full plan, free, plus the 50-prompt library.

#aitips #aiforbeginners #aiprompts #learnai
```
_677 / 2,200 characters · 5 / 5 hashtags_

**Facebook cross-post (L+56 · Tue Jan 5).** Paste the caption above without "Save it and start tomorrow.", the hashtags and the comment-keyword line, add this line at the end, then post the first comment from the Page:

```text
Today is Day 2 of the free 7-Day AI Starter Challenge: one day of this plan each day, about 10 minutes each. It's not too late to start with Day 1. Link in the first comment.
```
_174 characters_

**First comment**

```text
The free AI Starter Kit (50 copy-paste prompts + a 7-day plan): https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-03
```
_174 characters_

---

### VC-04 · 3 things never to paste into an AI chat

- **Post:** L+8 · Wed Nov 18 · 12:30 ET · Instagram feed · campaign `launch`
- **Format:** 9 slides, 4:5
- **Destination:** `/free-guide`
- **Per-post link:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-04`
- **Link delivered by:** the same-day Story VC-24 (with its own link), comment `#prompts` → DM, profile link IG-2 (Starter Kit)
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `set-up-your-ai-assistant` ("Step 3: Check four privacy settings", "The postcard rule") and `safety-ethics-and-what-never-to-share` ("What never to share"); `src/content/starter-kit.ts` → `tips` 3 and 4

**Slides**

1. **T1 Cover.** Eyebrow: "AI SAFETY". Headline: "3 things to «never» paste into an AI chat".
2. **T2 Teach.** Headline: "The «postcard» rule". Body: "Write as if your message could be read by someone else. Not because anyone is likely to read it, but because it keeps you careful by default."
3. **T2 Teach.** Headline: "1 · Passwords and «codes»". Body: "Passwords, PINs, security codes or recovery codes." *Design:* a gold lock icon, large.
4. **T2 Teach.** Headline: "2 · Financial and ID «numbers»". Body: "Full card numbers, bank details or government ID numbers. Medical record or insurance policy numbers, too."
5. **T2 Teach.** Headline: "3 · Other people's «private» information". Body: "Their address, health details or messages they shared in confidence. And confidential work material, such as client data, financials or unreleased plans, unless your employer has approved the tool for it."
6. **T2 Teach.** Headline: "Before you paste, «ask»". Body: "1. Would I be comfortable if a stranger read this? 2. Does it identify me or someone else? 3. Could I describe it instead of pasting it?"
7. **T2 Teach.** Headline: "Describe, don't «paste»". Body: "'My client, a small-business owner in Ohio' works just as well as their name and address. Rounded numbers work instead of exact balances."
8. **T2 Teach.** Headline: "Check 4 settings «once»". Body: "Model training or data controls · Chat history · Memory or personalization · Temporary or private chats. Names vary by product, but the ideas are the same."
9. **T5 CTA.** Headline: "Get all 8 «safety and quality» tips". Pill: "Comment #prompts". Small line: "Free AI Starter Kit · 50 prompts + a 7-day plan".

**Caption**

```text
What never to share with AI assistants like Claude, ChatGPT and Gemini: 3 things to keep out of every chat.

1. Passwords, PINs, security codes or recovery codes.
2. Full card numbers, bank details or government ID numbers (and medical record or insurance policy numbers).
3. Other people's private information, and confidential work material your employer hasn't approved for AI tools.

The postcard rule: write as if your message could be read by someone else. You can still get help with sensitive topics. Just remove or swap the identifying details.

Send this to someone who just started using AI.

Comment #prompts and I'll DM you the free AI Starter Kit, with all 8 safety and quality tips.

#aisafety #onlinesafety #aitips #learnai
```
_739 / 2,200 characters · 5 / 5 hashtags_

---

### VC-05 · Where AI pays off in a small business

- **Post:** L+11 · Sat Nov 21 · 12:30 ET · Instagram feed · campaign `launch`
- **Format:** 10 slides, 4:5
- **Destination:** `/assessment`
- **Per-post link:** `https://principeai.com/assessment?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-05`
- **Link delivered by:** the same-day Story VC-27 (with its own link), comment `#aiready` → DM, profile link IG-3 (assessment)
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `where-ai-pays-off` (free preview lesson: "The four payoffs", "Where it doesn't pay off (yet)", "draft, don't decide", "Do this now" prompt)

**Slides**

1. **T1 Cover.** Eyebrow: "FOR BUSINESS OWNERS". Headline: "Where AI «actually» pays off in a small business".
2. **T2 Teach.** Headline: "Start with the «work», not the tool". Body: "Most business owners meet AI the same way: a few impressive demos, a handful of experiments, and then not much changes. If you can't name the payoff, you don't have a project yet. You have a demo."
3. **T2 Teach.** Headline: "1 · «Time»". Body: "The same work takes fewer hours. Measure it in hours per week spent on the task. The easiest payoff to see and measure." *Design (slides 3–6):* a gold icon (clock, star, bolt, chart) and a small "HOW TO MEASURE" label in violet.
4. **T2 Teach.** Headline: "2 · «Quality»". Body: "Work is more consistent, thorough or polished. Measure rework, errors, complaints and review scores. The payoff owners underrate."
5. **T2 Teach.** Headline: "3 · «Speed»". Body: "Customers and staff wait less. Measure response time, turnaround time and days to deliver. Often worth more than the hours saved."
6. **T2 Teach.** Headline: "4 · «Revenue»". Body: "You win, keep or expand more business. Measure follow-ups completed, conversion rate and repeat purchases. It usually comes from work that wasn't happening at all."
7. **T2 Teach.** Headline: "Where it «doesn't» pay off (yet)". Body: "Final decisions with real consequences · Facts it hasn't been given · Rare or already-fast work · Relationships".
8. **T2 Teach, ink background.** Headline: "The rule: draft, «don't decide»". Body: "AI drafts, humans decide. A person handles judgment, accuracy and anything a customer will see."
9. **T3 Prompt card.** Label: "COPY THIS PROMPT". Source line: "From the free lesson 'Where AI Actually Pays Off'".
<!-- prompt: src/db/seed-content/course-ai-for-business.ts -->
```text
I run a [TYPE OF BUSINESS] with [NUMBER] people. A typical week looks like this: [DESCRIBE BRIEFLY].
List 15 recurring tasks in a business like mine where an AI assistant could save time, improve quality, speed up responses or increase revenue. For each one, say which of those four payoffs it creates and what a person would still need to check.
```
10. **T5 CTA.** Headline: "Find «your» best AI opportunities". Pill: "Comment #aiready". Small line: "Free AI Readiness Assessment · about 3 minutes".

**Caption**

```text
Where AI pays off in a small business: the four payoffs to look for before you buy another tool.

Time: the same work takes fewer hours.
Quality: work is more consistent, thorough or polished.
Speed: customers and staff wait less.
Revenue: you win, keep or expand more business.

If you can't name which one a project creates, you don't have a project yet. You have a demo.

And one rule keeps it safe: AI drafts, humans decide. A person still handles judgment, accuracy and anything a customer will see.

Comment #aiready and I'll DM you the free 3-minute AI Readiness Assessment. You'll get a readiness score and a personalized action plan.

#aiforbusiness #smallbusiness #aitools #businesstips
```
_696 / 2,200 characters · 5 / 5 hashtags_

---

### VC-06 · 5 prompts for busy parents

- **Post:** L+14 · Tue Nov 24 · 12:30 ET · Instagram feed · campaign `evergreen`
- **Format:** 9 slides, 4:5
- **Destination:** `/free-guide`
- **Per-post link:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=evergreen&utm_content=vc-06`
- **Link delivered by:** a same-day Story share with this link (the VC-29 countdown points here), comment `#prompts` → DM, profile link IG-2 (Starter Kit)
- **Source:** `src/content/starter-kit.ts` → Planning & organizing ("Weekly meal plan and grocery list", "Plan my week"), Personal & home ("Family routine or chore chart"), Creativity & fun ("Personalized bedtime story"), Learning & skills ("Socratic tutor"), `intro`; `src/db/seed-content/course-ai-essentials.ts` → `learn-anything-faster` ("A note for students and parents") and `safety-ethics-and-what-never-to-share`

**Slides**

1. **T1 Cover.** Eyebrow: "SAVE FOR SUNDAY NIGHT". Headline: "5 AI prompts for «busy» parents".
2. **T2 Teach.** Headline: "How to use «these»". Body: "Copy a prompt, replace everything in [BRACKETS] with your own details, and paste it into your AI assistant. Treat the first answer as a draft."
3. **T3 Prompt card.** Label: "1 · A WEEK OF DINNERS + ONE GROCERY LIST".
<!-- prompt: src/content/starter-kit.ts -->
```text
Plan [NUMBER] dinners for [NUMBER] people.
Dietary needs and dislikes: [DETAILS]. No more than [MINUTES] minutes of hands-on cooking each. Budget: [LOW / MEDIUM].
Use up what I already have: [INGREDIENTS].
Then give me one grocery list grouped by store section.
```
4. **T3 Prompt card.** Label: "2 · A WEEK THAT ACTUALLY FITS".
<!-- prompt: src/content/starter-kit.ts -->
```text
Here's everything on my plate this week: [TASKS, APPOINTMENTS, DEADLINES]
Fixed commitments: [MEETINGS, SCHOOL RUNS, ETC.]. I have the most energy in the [MORNING / AFTERNOON / EVENING].
Build a realistic day-by-day plan with buffer time. Tell me honestly what won't fit, and what I could drop, delay or delegate.
```
5. **T3 Prompt card.** Label: "3 · A FAIR CHORE CHART".
<!-- prompt: src/content/starter-kit.ts -->
```text
Our household: [WHO LIVES HERE, INCLUDING KIDS' AGES]. Our biggest pain point: [E.G. CHAOTIC MORNINGS / CHORE ARGUMENTS].
Design a simple [MORNING ROUTINE / WEEKLY CHORE CHART] that's fair, age-appropriate and realistic.
Present it as a table we can print and stick on the fridge.
```
6. **T3 Prompt card.** Label: "4 · A BEDTIME STORY STARRING THEM".
<!-- prompt: src/content/starter-kit.ts -->
```text
Write a [NUMBER]-minute bedtime story for a [AGE]-year-old who loves [INTERESTS].
The main character is [NAME OR DESCRIPTION]. Weave in a gentle lesson about [THEME, E.G. KINDNESS / BRAVERY].
Use simple words and end on a calm, cozy note.
```
7. **T3 Prompt card.** Label: "5 · HOMEWORK HELP THAT TEACHES". Line under the panel: "Use AI the way you'd use a great tutor, not a ghostwriter."
<!-- prompt: src/content/starter-kit.ts -->
```text
Act as a Socratic tutor helping me understand [TOPIC OR PROBLEM].
Don't give me the answer. Ask me guiding questions, one at a time, that help me work it out myself.
If I'm stuck twice in a row, give me a small hint.
```
8. **T2 Teach.** Headline: "One «safety» habit". Body: "Remove names and personal details before you paste anything. You can almost always get the same help by swapping specifics for descriptions."
9. **T5 CTA.** Headline: "Get the other «45», free". Pill: "Comment #prompts". Small line: "Free AI Starter Kit · 50 prompts + a 7-day plan".

**Caption**

```text
5 AI prompts for busy parents: dinners, the week, chores, bedtime and homework.

1. A week of dinners plus one grocery list, grouped by store section.
2. A realistic week, with an honest list of what won't fit.
3. A fair chore chart you can print and stick on the fridge.
4. A bedtime story starring the hero of your choice, with a gentle lesson built in.
5. Homework help that asks guiding questions instead of handing over the answer.

Each one works with the free versions of AI assistants like Claude, ChatGPT and Gemini. Swipe for the exact wording, and save this for Sunday night.

One habit: remove names and personal details before you paste anything.

Comment #prompts and I'll DM you the free AI Starter Kit with the other 45 prompts.

#aitips #parentingtips #familyorganization #aiprompts
```
_799 / 2,200 characters · 5 / 5 hashtags_

---

### VC-07 · Fact-check any AI answer in 3 minutes

- **Post:** L-5 · Thu Nov 5 · 12:30 ET · Instagram feed (warm-up value post; share it to your Story at 13:00 with its link sticker) · campaign `launch`
- **Format:** 9 slides, 4:5
- **Destination:** `/free-guide` (the kit includes the "Fact-check an answer" prompt)
- **Per-post link:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-07`
- **Link delivered by:** a same-day Story share, comment `#prompts` → DM, profile link IG-2 (Starter Kit)
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `fact-check-in-three-minutes` (steps 1–4, "Red flags"); `src/content/starter-kit.ts` → `tips` 5, Research & decisions → "Fact-check an answer"

**Slides**

1. **T1 Cover.** Eyebrow: "SAVE THIS". Headline: "Fact-check any AI answer in «3 minutes»".
2. **T2 Teach.** Headline: "Confident «isn't» correct". Body: "AI can sound confident and still be wrong. You can't verify every sentence, so check the right things, in the right way, in about three minutes."
3. **T2 Teach.** Headline: "Step 1 · Decide (10 «seconds»)". Body: "Ask: 'What happens if this is wrong?' Low stakes: a quick read-through. Medium: check the key claims. High (health, legal, money, safety): check every specific claim."
4. **T2 Teach.** Headline: "Step 2 · Spot the «claims» (30 seconds)". Body: "Names, job titles and quotes · Numbers, statistics, prices and dates · Laws, rules, policies and deadlines · Links, citations, and book or article titles · Anything that surprised you".
5. **T3 Prompt card.** Label: "OR LET THE AI DO THE SCANNING". Source line: "From the AI Essentials lesson 'Fact-Check AI in Three Minutes'".
<!-- prompt: src/db/seed-content/course-ai-essentials.ts -->
```text
List every specific factual claim in your last answer: names, numbers,
dates, quotes, sources and rules. For each one, tell me how confident
you are (high, medium or low) and the best type of source to verify it.
```
6. **T2 Teach.** Headline: "Step 3 · Verify (2 «minutes»)". Body: "Go to the source · Open every link · Search for the exact quote or title · Redo important math · Check the date".
7. **T2 Teach.** Headline: "Step 4 · Let AI check «itself», carefully". Body: "'Argue against your own answer. What would a skeptical expert say?' Self-checks help you find problems; real sources settle them."
8. **T2 Teach.** Headline: "Slow down when you «see»". Body: "Very precise statistics with no source · Quotes that are a little too perfect · Citations you can't find · Information that only confirms what you hoped · Confident answers about very recent events".
9. **T5 CTA.** Headline: "Keep the «fact-check» prompt". Pill: "Comment #prompts". Small line: "It's in the free AI Starter Kit, with 49 more".

**Caption**

```text
How to fact-check AI answers in about three minutes, without checking every sentence.

Step 1 (10 seconds): ask "What happens if this is wrong?"
Step 2 (30 seconds): spot the checkable claims: names, numbers, dates, quotes, links and rules.
Step 3 (2 minutes): verify the important ones. Go to the source, open every link, redo the math, check the date.
Step 4: let AI help check itself, carefully. Then let real sources settle it.

AI can sound confident and still be wrong. Match your checking effort to the stakes.

Save this for the next time an answer will go out under your name.

Comment #prompts and I'll DM you the free AI Starter Kit. The fact-check prompt is inside.

#aitips #aiforbeginners #learnai #aisafety
```
_721 / 2,200 characters · 5 / 5 hashtags_

---

### VC-08 · Thanksgiving, planned: 4 AI prompts

- **Post:** L+7 · Tue Nov 17 · 12:30 ET · Instagram feed (nine days before Thanksgiving, while people are still planning; share it to your Story at 13:00 with its link sticker) · campaign `launch` **FIXED**
- **Format:** 8 slides, 4:5
- **Destination:** `/free-guide`
- **Per-post link:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-08`
- **Link delivered by:** a same-day Story share, comment `#prompts` → DM, profile link IG-2 (Starter Kit)
- **Source:** `src/content/starter-kit.ts` → Planning & organizing ("Plan an event", "Weekly meal plan and grocery list"), Creativity & fun ("Party games and activities", "Write a toast or speech"), `intro`; `src/db/seed-content/course-ai-essentials.ts` → `plan-anything` (allergy note, key takeaways)

**Slides**

1. **T1 Cover.** Eyebrow: "THANKSGIVING". Headline: "Thanksgiving, «planned»: 4 AI prompts".
2. **T2 Teach.** Headline: "AI drafts the «plan»". Body: "You confirm prices, hours, rules and anything you'll pay for. A note on allergies: AI can suggest recipes that avoid an allergen, but always read the labels yourself."
3. **T3 Prompt card.** Label: "1 · FROM NOW UNTIL THE DAY". Line under the panel: "Type 'Thanksgiving dinner' for [EVENT] and cut any line that doesn't apply."
<!-- prompt: src/content/starter-kit.ts -->
```text
Help me plan [EVENT, E.G. A 40TH BIRTHDAY DINNER] for [NUMBER] guests on [DATE].
Budget: [AMOUNT]. Location: [HOME / TYPE OF VENUE]. The guest of honor loves [INTERESTS].
Give me a timeline of what to do and when, from now until the day, a budget breakdown, and 5 theme or activity ideas.
```
4. **T3 Prompt card.** Label: "2 · GAMES FOR EVERY AGE".
<!-- prompt: src/content/starter-kit.ts -->
```text
Suggest [NUMBER] games or activities for [EVENT] with [NUMBER] people aged [AGES].
Setting: [INDOORS / OUTDOORS], with [TIME AVAILABLE]. Budget: [AMOUNT].
For each one: how to play in 2-3 sentences, what's needed and how long it takes.
```
5. **T3 Prompt card.** Label: "3 · A TOAST THAT SOUNDS LIKE YOU".
<!-- prompt: src/content/starter-kit.ts -->
```text
Help me write a [NUMBER]-minute [TOAST / SPEECH] for [OCCASION].
Key details, stories and qualities to include: [DETAILS]
Tone: [HEARTFELT / FUNNY / BOTH]. Give me an outline first, then the full draft.
It should sound natural spoken aloud, like me, not like a greeting card.
```
6. **T3 Prompt card.** Label: "4 · THE WEEK AFTER: USE THE LEFTOVERS".
<!-- prompt: src/content/starter-kit.ts -->
```text
Plan [NUMBER] dinners for [NUMBER] people.
Dietary needs and dislikes: [DETAILS]. No more than [MINUTES] minutes of hands-on cooking each. Budget: [LOW / MEDIUM].
Use up what I already have: [INGREDIENTS].
Then give me one grocery list grouped by store section.
```
7. **T2 Teach.** Headline: "Then make it «better»". Body: "Follow up with 'shorter,' 'friendlier,' 'give me 3 options' or 'what's missing?' until it's right."
8. **T5 CTA.** Headline: "Get all «50» prompts, free". Pill: "Comment #prompts". Small line: "Free AI Starter Kit · no card required".

**Caption**

```text
How to plan Thanksgiving with AI: 4 copy-paste prompts for the plan, the games, the toast and the leftovers.

1. A timeline from now until the day, plus a budget breakdown.
2. Games and activities for every age at the table.
3. A toast that sounds like you, not like a greeting card.
4. The week after: dinners that use up what you already have, with one grocery list.

AI drafts the plan; you confirm prices, hours and anything you'll pay for. And if anyone has an allergy, read the labels yourself.

Save this and share it with whoever is hosting this year.

Comment #prompts and I'll DM you the free AI Starter Kit: 50 copy-paste prompts + a 7-day plan.

#thanksgiving #aitips #aiprompts #familyorganization
```
_710 / 2,200 characters · 5 / 5 hashtags_

---

### VC-09 · The 5 parts of a reliable AI workflow

- **Post:** L+24 · Fri Dec 4 · 12:30 ET · Instagram feed · campaign `evergreen`
- **Format:** 10 slides, 4:5
- **Destination:** the free preview lesson "Anatomy of an AI Workflow" (Course sales funnel)
- **Per-post link:** `https://principeai.com/courses/ai-automation-accelerator/preview/anatomy-of-an-ai-workflow?utm_source=instagram&utm_medium=social&utm_campaign=evergreen&utm_content=vc-09`
- **Link delivered by:** a same-day Story share, comment `#aiworkflow` → DM, profile link IG-5 (courses)
- **Source:** `src/db/seed-content/course-ai-automation-accelerator.ts` → `anatomy-of-an-ai-workflow` (free preview lesson: "The five parts", "Where AI belongs, and where it doesn't", "Write the spec before you build")

**Slides**

1. **T1 Cover.** Eyebrow: "AUTOMATION, WITHOUT THE HYPE". Headline: "Why most AI automations «disappoint»".
2. **T2 Teach.** Headline: "The «usual» reason". Body: "Someone dropped an AI step between two apps and hoped for the best. The automations that run quietly for months share a simple anatomy."
3. **T2 Teach.** Headline: "1 · «Trigger»". Body: "The event that starts a run: a form is submitted, an email arrives, a row is added, it's Monday at 7am." *Design (slides 3–7):* a five-step chain across the top (Trigger → Context → Model → Action → Check) with the current step filled gold.
4. **T2 Teach.** Headline: "2 · «Context»". Body: "Everything the model needs to do this particular job well: the incoming data, plus reference material such as your services, tone of voice or policies."
5. **T2 Teach.** Headline: "3 · «Model»". Body: "The AI step itself. Clear instructions and context go in; one specific, well-defined output comes out."
6. **T2 Teach.** Headline: "4 · «Action»". Body: "What happens with that output: a CRM record is updated, a draft is saved, a message is posted to your team."
7. **T2 Teach.** Headline: "5 · «Check»". Body: "How you know it worked, and what happens when it didn't. A workflow without checks doesn't fail less often. It fails silently."
8. **T2 Teach.** Headline: "The AI «sandwich»". Body: "Plain, predictable steps on both sides, one focused AI step in the middle. If 'amount is over $500' decides the route, use a filter, not a model." *Design:* a three-layer sandwich graphic: violet, gold, violet.
9. **T3 Prompt card.** Label: "WRITE THE SPEC BEFORE YOU BUILD". Source line: "From the free lesson 'Anatomy of an AI Workflow'".
<!-- prompt: src/db/seed-content/course-ai-automation-accelerator.ts -->
```text
WORKFLOW:   New enquiry triage
GOAL:       Every enquiry is categorized and has a draft reply within 5 minutes
TRIGGER:    Website enquiry form submitted
CONTEXT:    Form fields + "our services" summary + ideal client profile
MODEL STEP: Classify (hot / warm / cold / spam), give a reason, draft a reply.
ACTIONS:    Create or update CRM contact, tag with category, save reply as draft
FALLBACK:   Anything that fails a check goes to the "Needs review" list
OWNER:      Sales lead, alerted by email on any failure
```
10. **T5 CTA.** Headline: "Read the «full» lesson, free". Pill: "Comment #aiworkflow". Small line: "Free lesson · no signup · from the AI Automation Accelerator".

**Caption**

```text
The 5 parts of a reliable AI workflow: trigger, context, model, action and check.

Most AI automations that disappoint fail for the same reason: someone dropped an AI step between two apps and hoped for the best.

Trigger: the event that starts a run.
Context: everything the model needs to do this job well.
Model: one clear instruction in, one well-defined output out.
Action: what happens with that output.
Check: how you know it worked, and what happens when it didn't.

Use AI for the language and judgment step only. Keep everything else plain and predictable. If "amount is over $500" decides the route, use a filter, not a model.

Comment #aiworkflow and I'll DM you the full lesson. It's free to read, no signup.

#aiautomation #nocode #aitools #smallbusiness
```
_768 / 2,200 characters · 5 / 5 hashtags_

---

### VC-10 · How ready are you to put AI to work? 5 questions

- **Post:** L+59 · Fri Jan 8 · 12:30 ET · Instagram feed · campaign `ny-2027`
- **Format:** 10 slides, 4:5 (quiz style)
- **Destination:** `/assessment`
- **Per-post link:** `https://principeai.com/assessment?utm_source=instagram&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-10`
- **Also on Pinterest:** L+59 · Fri Jan 8 · 20:00 ET · a Pin cut from this carousel, board B10 · campaign `evergreen` (Pin text below the caption)
- **Pin link:** `https://principeai.com/assessment?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-10`
- **Link delivered by:** a same-day Story share, comment `#aiready` → DM, profile link IG-3 (assessment)
- **Source:** `src/lib/assessment.ts` → questions (`usage`, time drains, goal, tech comfort, timeline) and `TIERS`; `src/app/(marketing)/assessment/page.tsx` → headline and `WHAT_YOU_GET`

**Slides**

1. **T1 Cover.** Eyebrow: "QUICK SELF-CHECK". Headline: "How ready are you to put AI «to work?»" (the assessment page's own headline and accent).
2. **T2 Teach.** Headline: "Answer in your «head»". Body: "5 questions from the free AI Readiness Assessment. Notice where your answers land. The real one takes about 3 minutes and scores you out of 100."
3. **T2 Teach.** Headline: "Q1 · How often do you use AI «today»?" Body: "Never · I've tried it · Weekly · Daily". *Design (slides 3–7):* answers as four pill buttons, outlined in violet; the question number in a gold circle.
4. **T2 Teach.** Headline: "Q2 · Where does most of your time «go»?" Body: "Email · Writing & content · Scheduling & admin · Customer service · Sales follow-up · Research · Data & reporting · Personal planning · Learning new skills".
5. **T2 Teach.** Headline: "Q3 · What's your main «goal» with AI?" Body: "Save time · Grow revenue · Learn a valuable skill · Automate operations · Advance my career".
6. **T2 Teach.** Headline: "Q4 · How comfortable are you with new «technology»?" Body: "1 · 'I avoid new tech when I can.' → 5 · 'I'm the one people ask for tech help.'" *Design:* a 1–5 scale bar.
7. **T2 Teach.** Headline: "Q5 · When do you want to start putting AI «to work»?" Body: "Just exploring · This month · As soon as possible".
8. **T2 Teach, ink background.** Headline: "Four «tiers»". Body: "Explorer (0–30): Ready for your first real wins · Experimenter (31–55): Time to turn experiments into habits · Implementer (56–80): Ready to build real workflows · Scaler (81–100): Ready to scale with AI systems".
9. **T2 Teach.** Headline: "What you «get»". Body: "A score out of 100 · Your tier, with your strengths and the gaps worth closing first · Three quick wins with copy-paste prompts, a 30-day roadmap and the tools worth trying · An honest recommended next step".
10. **T5 CTA.** Headline: "Get «your» score". Pill: "Comment #aiready". Small line: "Free · about 3 minutes · instant results".

**Caption**

```text
How ready are you to put AI to work? 5 quick questions to find out where you stand.

1. How often do you use AI today?
2. Where does most of your time go?
3. What's your main goal with AI?
4. How comfortable are you with new technology?
5. When do you want to start?

Your answers point to one of four tiers: Explorer, Experimenter, Implementer or Scaler. Each one has a different best next step, and none of them needs a tech background.

Which tier do you think you are? Tell me in the comments.

Comment #aiready and I'll DM you the free AI Readiness Assessment: about 3 minutes, a score out of 100 and a personalized action plan.

#aiforbusiness #aitips #aitools #learnai
```
_675 / 2,200 characters · 5 / 5 hashtags_

**Pin cut from this carousel.** Redesign one or two slides at 1000×1500 (P2 or P3, 1.4), with the cover headline as the image headline.

**Title**
```text
How ready are you to put AI to work? 5 questions to find your AI tier
```
_69 / 100 characters_

**Description**
```text
How ready are you to put AI to work? Five quick questions show where you stand: how often you use AI today, where most of your time goes, your main goal with AI, how comfortable you are with new technology and when you want to start. Your answers point to one of four tiers: Explorer, Experimenter, Implementer or Scaler. Each one has a different best next step, and none of them needs a tech background. Take the free AI Readiness Assessment: about 3 minutes, a score out of 100 and a personalized action plan.
```
_511 / 800 characters_

---

### VC-11 · Ask before you click: an AI scam check

- **Post:** L+17 · Fri Nov 27 · 12:30 ET · Instagram feed (Black Friday; a value post, not a promotion) · campaign `evergreen` **FIXED**
- **Format:** 8 slides, 4:5
- **Destination:** `/free-guide` (the kit's safety tips and its "Decode a confusing bill or letter" prompt cover the same ground)
- **Per-post link:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=evergreen&utm_content=vc-11`
- **Also on the Facebook Page:** L+20 · Mon Nov 30 · 9:30 ET · cross-post · campaign `evergreen` **FIXED** (4.4; first comment below the caption)
- **Link delivered by:** a same-day Story share, comment `#prompts` → DM, profile link IG-2 (Starter Kit)
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `safety-ethics-and-what-never-to-share` ("Scams just got smarter" and its prompt); `src/content/starter-kit.ts` → `tips`

**Slides**

1. **T1 Cover.** Eyebrow: "HOLIDAY SHOPPING SEASON". Headline: "Not sure a message is real? «Ask before you click.»"
2. **T2 Teach.** Headline: "Scams just got «smarter»". Body: "Scammers use AI too, and their messages are now well written, personalized and convincing. Bad spelling used to be a giveaway. Not anymore."
3. **T2 Teach.** Headline: "Judge it by what it «asks for»". Body: "Urgency · Secrecy · Payment by gift card, wire transfer or crypto · A link to 'verify your account'. These are red flags however professional it looks."
4. **T3 Prompt card.** Label: "COPY THIS PROMPT". Source line: "From the AI Essentials lesson 'Safety, Ethics & What Never to Share'".
<!-- prompt: src/db/seed-content/course-ai-essentials.ts -->
```text
I received this message and I'm not sure it's legitimate. I haven't
clicked anything. [PASTE THE TEXT, WITHOUT PERSONAL DETAILS]
What are the warning signs, if any? How can I verify it safely without
using any of the contact details in the message?
```
5. **T2 Teach.** Headline: "Then verify it «yourself»". Body: "Use official contact details you look up yourself, not the ones in the message."
6. **T2 Teach.** Headline: "Voice «cloning»". Body: "A panicked call from a 'grandchild' or 'boss' asking for urgent money or gift cards could be fake. Agree on a family code word. If a call feels urgent and unusual, hang up and call back on a number you already know."
7. **T2 Teach.** Headline: "Deepfakes, «too»". Body: "Realistic fakes are easy to make. Be skeptical of shocking content, especially when it pushes you to act or share right away."
8. **T5 CTA.** Headline: "Get the «safety» tips + 50 prompts". Pill: "Comment #prompts". Small line: "Free AI Starter Kit · no card required".

**Caption**

```text
How to check a suspicious text or email with AI before you click anything.

Scammers use AI too. Their messages are now well written and personalized, so bad spelling is no longer a giveaway. Judge a message by what it asks for: urgency, secrecy, payment by gift card, wire transfer or crypto, or a link to "verify your account."

The prompt (swipe for the full version): paste the message, without personal details, and ask "What are the warning signs, if any? How can I verify it safely without using any of the contact details in the message?"

Then verify through official contact details you look up yourself.

Send this to someone who does a lot of online shopping this time of year.

Comment #prompts and I'll DM you the free AI Starter Kit, including 8 safety and quality tips.

#aisafety #onlinesafety #aitips #learnai
```
_827 / 2,200 characters · 5 / 5 hashtags_

**Facebook cross-post (L+20 · Mon Nov 30).** Paste the caption above without the hashtags and without the last call-to-action line (the comment keyword or "Tap … in my profile"), end with "Link in the first comment.", then post this first comment from the Page:

```text
The free AI Starter Kit (50 copy-paste prompts + a 7-day plan): https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-11
```
_176 characters_

---

### VC-12 · Green, Amber, Red: the AI data rule your team will remember

- **Post:** L+31 · Fri Dec 11 · 12:30 ET · Instagram feed · campaign `evergreen`
- **Format:** 9 slides, 4:5
- **Destination:** `/consulting#apply` (done-with-you; "Team AI training & policy" is one of its six services)
- **Per-post link:** `https://principeai.com/consulting?utm_source=instagram&utm_medium=social&utm_campaign=evergreen&utm_content=vc-12#apply`
- **Also on the Facebook Page:** L+63 · Tue Jan 12 · 9:30 ET · cross-post · campaign `ny-2027` (4.4; first comment below the caption)
- **Link delivered by:** a same-day Story share, and the main bio link IG-1 (`/links` → "Have AI built for your business"). No comment keyword on this one
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `business-context-safely` ("The traffic-light data rules", "Anonymize before you paste") and `ai-usage-policy` (opening, template section 2, key takeaways); `src/app/(marketing)/consulting/page.tsx` → services

**Slides**

1. **T1 Cover.** Eyebrow: "FOR TEAMS". Headline: "Green, Amber, Red: the AI data rule your team will «remember»".
2. **T2 Teach.** Headline: "Your team is «probably» using AI already". Body: "Possibly on personal accounts, and possibly with information that shouldn't be there. Banning AI rarely works; it just pushes use out of sight."
3. **T2 Teach.** Headline: "«Green»: public". Body: "Website content, published prices, marketing materials, general industry questions. Rule: OK in any approved AI tool." *Design (slides 3–5):* a 72 px traffic-light dot top left (green `#17b26a`, amber `#f79009`, red `#f04438`); everything else in brand colors.
4. **T2 Teach.** Headline: "«Amber»: internal". Body: "Internal processes, unpublished pricing, non-personal business data, anonymized customer scenarios. Rule: only in business-grade tools your company has approved, with training on your data turned off."
5. **T2 Teach.** Headline: "«Red»: restricted". Body: "Personal data about customers or staff, health or financial details, ID and account numbers, payment details, passwords and API keys, legal matters, anything under a confidentiality agreement. Rule: it stays out unless explicitly approved."
6. **T2 Teach.** Headline: "Anonymize «before» you paste". Body: "Replace names with roles ('the customer,' 'Client A') · Remove email addresses, phone numbers, street addresses and account numbers · Round figures when exact values don't matter · Summarize a long thread instead of pasting all of it".
7. **T2 Teach, ink background.** Headline: "One line for «personal» accounts". Body: "'Personal or free AI accounts: Green data only; never customer or confidential company information.'" Source line: "From the AI usage policy template in AI for Business Owners".
8. **T2 Teach.** Headline: "Permission «and» guardrails". Body: "A clear policy gives permission and guardrails; a ban just hides AI use. Keep it short, name an owner and review it regularly."
9. **T5 CTA.** Headline: "Want it rolled out «with» your team?" Body (Geist 36 px): "Team AI training & policy is part of our done-with-you service." Pill: "Link in my profile". Small line: "Free discovery call · clear written quote before any work begins".

**Caption**

```text
An AI data policy your team can remember: Green, Amber, Red.

Green (public): website content, published prices, marketing materials. OK in any approved AI tool.
Amber (internal): internal processes, unpublished pricing, non-personal business data. Only in business-grade tools you've approved, with training on your data turned off.
Red (restricted): personal data about customers or staff, health or financial details, passwords, legal matters. It stays out unless explicitly approved.

Your team is very likely using AI already, possibly on personal accounts. A clear policy gives permission and guardrails; a ban just hides AI use.

Want help rolling this out? Team AI training and policy is part of our done-with-you AI service. Tap the link in my profile, then "Have AI built for your business", to apply for a free discovery call. You'll get a clear written scope and quote before any work begins.

#aiforbusiness #smallbusiness #aitools #businesstips
```
_958 / 2,200 characters · 4 / 5 hashtags_

**Facebook cross-post (L+63 · Tue Jan 12).** Paste the caption above without the hashtags and without the last call-to-action line (the comment keyword or "Tap … in my profile"), end with "Link in the first comment.", then post this first comment from the Page:

```text
Apply for a free discovery call (you'll get a clear written scope and quote before any work begins): https://principeai.com/consulting?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-12#apply
```
_217 characters_

---

### VC-13 · Your AI agrees with you too much: 3 prompts for an honest second opinion

- **Post:** L+66 · Fri Jan 15 · 12:30 ET · Instagram feed · campaign `ny-2027`
- **Format:** 7 slides, 4:5
- **Destination:** `/free-guide`
- **Per-post link:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-13`
- **Also on the Facebook Page:** L+70 · Tue Jan 19 · 9:30 ET · cross-post · campaign `ny-2027` (4.4; first comment below the caption)
- **Also on Pinterest:** L+66 · Fri Jan 15 · 20:00 ET and L+79 · Thu Jan 28 · 20:00 ET · a Pin cut from this carousel, board B1 · campaign `evergreen` (Pin text below the caption)
- **Pin link:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-13`
- **Link delivered by:** a same-day Story share, comment `#prompts` → DM, profile link IG-2 (Starter Kit)
- **Source:** `src/content/starter-kit.ts` → `tips` 7; Research & decisions ("Devil's advocate", "Pre-mortem", "Weighted decision"); Day 6 step 4; `src/db/seed-content/course-ai-essentials.ts` → `why-ai-makes-things-up` ("It's built to be agreeable")

**Slides**

1. **T1 Cover.** Eyebrow: "BEFORE YOU DECIDE". Headline: "Your AI agrees with you «too much»".
2. **T2 Teach.** Headline: "It's built to be «agreeable»". Body: "Assistants are trained to be helpful, which can tip into telling you what you want to hear. 'Isn't this a great plan?' gets a different answer than 'What are the weaknesses in this plan?'"
3. **T3 Prompt card.** Label: "1 · THE DEVIL'S ADVOCATE".
<!-- prompt: src/content/starter-kit.ts -->
```text
Here's what I'm leaning toward and why: [YOUR REASONING]
Give me the strongest honest case against it. Don't soften it.
Then tell me which of my reasons hold up best.
```
4. **T3 Prompt card.** Label: "2 · THE PRE-MORTEM".
<!-- prompt: src/content/starter-kit.ts -->
```text
I'm planning to [DECISION OR PLAN].
Imagine it's a year from now and it went badly. Give me the 5 most likely reasons why, and one thing I could do now to prevent each one.
```
5. **T3 Prompt card.** Label: "3 · THE WEIGHTED DECISION".
<!-- prompt: src/content/starter-kit.ts -->
```text
Help me decide between [OPTION A] and [OPTION B].
What matters most to me, in order: [PRIORITIES]
Score each option 1-5 on each priority with a one-line reason, then tell me what the decision really hinges on.
Be honest, not just agreeable.
```
6. **T2 Teach.** Headline: "Then check the «facts»". Body: "Verify any important facts, prices or rules it mentions using official sources."
7. **T5 CTA.** Headline: "Get 47 more prompts, «free»". Pill: "Comment #prompts". Small line: "Free AI Starter Kit · 50 prompts + a 7-day plan".

**Caption**

```text
How to get an honest second opinion from AI, instead of a yes.

AI tends to agree with you. When you want a real second opinion, ask "What are the weaknesses?" or "Make the strongest case against this."

Three prompts for big decisions and New Year plans:
1. The devil's advocate: the strongest honest case against what you're leaning toward.
2. The pre-mortem: imagine it's a year from now and it went badly. Why?
3. The weighted decision: score each option on your priorities, and say what it really hinges on.

Then verify any important facts, prices or rules using official sources.

Comment #prompts and I'll DM you the free AI Starter Kit with 47 more prompts.

#aitips #aiprompts #aiforbeginners #learnai
```
_711 / 2,200 characters · 5 / 5 hashtags_

**Facebook cross-post (L+70 · Tue Jan 19).** Paste the caption above without the hashtags and without the last call-to-action line (the comment keyword or "Tap … in my profile"), end with "Link in the first comment.", then post this first comment from the Page:

```text
The free AI Starter Kit (50 copy-paste prompts + a 7-day plan): https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-13
```
_174 characters_

**Pin cut from this carousel.** Redesign one or two slides at 1000×1500 (P2 or P3, 1.4), with the cover headline as the image headline.

**Title**
```text
How to get an honest second opinion from AI: 3 prompts for big decisions
```
_72 / 100 characters_

**Description**
```text
AI tends to agree with you. When you want a real second opinion, ask "What are the weaknesses?" or "Make the strongest case against this." Three copy-and-paste prompts for big decisions and New Year plans: the devil's advocate, the pre-mortem and the weighted decision. Then verify any important facts, prices or rules using official sources. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini. Get 47 more prompts free in the AI Starter Kit.
```
_469 / 800 characters_

For the second, new design on L+79 · Thu Jan 28 · 20:00 ET, use this title instead (same link and description):

```text
Devil's advocate, pre-mortem, weighted decision: 3 AI prompts for honest advice
```
_79 / 100 characters_

---

### VC-14 · Your first three AI projects for 2027

- **Post:** L+49 · Tue Dec 29 · 12:30 ET · Instagram feed · campaign `evergreen` **FIXED**
- **Format:** 9 slides, 4:5
- **Destination:** `/assessment`
- **Per-post link:** `https://principeai.com/assessment?utm_source=instagram&utm_medium=social&utm_campaign=evergreen&utm_content=vc-14`
- **Also on the Facebook Page:** L+49 · Tue Dec 29 · 9:30 ET · cross-post · campaign `evergreen` **FIXED** (4.4; first comment below the caption)
- **Also on Pinterest:** L+56 · Tue Jan 5 · 20:00 ET · a Pin cut from this carousel, board B2 · campaign `evergreen` (Pin text below the caption)
- **Pin link:** `https://principeai.com/assessment?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-14`
- **Link delivered by:** a same-day Story share, comment `#aiready` → DM, profile link IG-3 (assessment)
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `choose-your-first-three` ("Why three, and not ten", "The balanced portfolio", "Selection filters", "Avoid the classic first-project traps", brief prompt, key takeaways)

**Slides**

1. **T1 Cover.** Eyebrow: "PLAN 2027". Headline: "Your first «three» AI projects".
2. **T2 Teach.** Headline: "Why three, not «ten»". Body: "Each project needs an owner, a little setup, testing and a change in someone's habits. Start ten and you'll likely finish none."
3. **T2 Teach.** Headline: "1 · The quick «win»". Body: "Live within days. High ease, low risk. Examples: meeting summaries, first drafts of inquiry replies, turning notes into tidy documents."
4. **T2 Teach.** Headline: "2 · The core «workflow»". Body: "Two to four weeks. A high-hours process that eats real time every week. Examples: quotes and proposals, weekly client updates, writing SOPs."
5. **T2 Teach.** Headline: "3 · The growth «bet»". Body: "Two to four weeks. Something tied to revenue. Examples: consistent lead follow-up, reactivating past customers, a content engine that keeps you visible."
6. **T2 Teach (checklist).** Headline: "Before you «commit»". Body: "A named owner who does this work today · A baseline you can measure now · Inputs that are already digital · Review takes much less time than starting from scratch · Failure would be cheap and reversible". *Design:* gold check boxes.
7. **T2 Teach, ink background.** Headline: "The classic first-project «trap»". Body: "A fully automated customer-facing chatbot as project one. Start with drafts a person sends. Earn the right to automate."
8. **T3 Prompt card.** Label: "DRAFT THE BRIEF WITH AI". Source line: "From AI for Business Owners, lesson 4".
<!-- prompt: src/db/seed-content/course-ai-for-business.ts -->
```text
Help me write a one-page project brief for an AI pilot in my business.
Project: [NAME]
What happens today, step by step: [DESCRIBE THE CURRENT PROCESS]
Who does it, how often and how long it takes: [DETAILS]
Before writing, ask me up to eight questions to fill any gaps.
```
9. **T5 CTA.** Headline: "Not sure which three are «yours»?" Body (Geist 36 px): "The free assessment ends with a recommended next step." Pill: "Comment #aiready".

**Caption**

```text
Planning AI for your business in 2027? Start with three projects, not ten.

1. A quick win, live within days: meeting summaries or first drafts of inquiry replies.
2. A core workflow, two to four weeks: quotes and proposals, weekly client updates or SOPs.
3. A growth bet, two to four weeks: consistent lead follow-up or reactivating past customers.

Every project needs an owner, a baseline, digital inputs, a review rule and cheap failure. And earn the right to automate: begin with AI drafts that a person reviews and sends.

Not sure which three are yours? Comment #aiready and I'll DM you the free 3-minute AI Readiness Assessment. It ends with a recommended next step for your situation.

#aiforbusiness #smallbusiness #aitools #businesstips
```
_747 / 2,200 characters · 5 / 5 hashtags_

**Facebook cross-post (L+49 · Tue Dec 29).** Paste the caption above without the hashtags and without the last call-to-action line (the comment keyword or "Tap … in my profile"), end with "Link in the first comment.", then post this first comment from the Page:

```text
The free AI Readiness Assessment (about 3 minutes, instant results): https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-14
```
_181 characters_

**Pin cut from this carousel.** Redesign one or two slides at 1000×1500 (P2 or P3, 1.4), with the cover headline as the image headline.

**Title**
```text
Your first three AI projects: a quick win, a core workflow and a growth bet
```
_75 / 100 characters_

**Description**
```text
Planning AI for your business in 2027? Start with three projects, not ten: a quick win that's live within days, a core workflow that takes two to four weeks, and a growth bet such as consistent lead follow-up. Every project needs an owner, a baseline, digital inputs, a review rule and cheap failure. Earn the right to automate: begin with AI drafts that a person reviews and sends. Not sure which three are yours? Take the free 3-minute AI Readiness Assessment.
```
_462 / 800 characters_

---

### VC-15 · Which way in? Courses, coaching or done-with-you

- **Post:** L+73 · Fri Jan 22 · 12:30 ET · Instagram feed · campaign `ny-2027` **PRICE** **CONFIRM**
- **Format:** 10 slides, 4:5
- **Destination:** `/courses` (Course sales funnel)
- **Per-post link:** `https://principeai.com/courses?utm_source=instagram&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-15`
- **Also on the Facebook Page:** L+77 · Tue Jan 26 · 9:30 ET · cross-post · campaign `ny-2027` **PRICE** (4.4; first comment below the caption)
- **Also on Pinterest:** L+73 · Fri Jan 22 · 20:00 ET · a Pin cut from this carousel, board B10 · campaign `evergreen` (Pin text below the caption)
- **Pin link:** `https://principeai.com/courses?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-15`
- **Link delivered by:** a same-day Story share and profile link IG-5 ("Courses + free lessons")
- **Fill in first:** check all four prices in Admin → Courses and Admin → Availability that morning (**PRICE**); the **CONFIRM** line on slide 6
- **Source:** `src/db/seed-content/course-ai-essentials.ts`, `course-ai-for-business.ts`, `course-ai-automation-accelerator.ts` (titles, subtitles, `priceCents`, `includes`, FAQs); `src/db/seed.ts` (`ai-coaching-session`); `src/app/(marketing)/consulting/page.tsx`; `src/app/(marketing)/page.tsx` (section heading "Start free. Go as far as you want." and FAQ "Should I take a course, get coaching or have you build it?")

**Slides**

1. **T1 Cover.** Eyebrow: "START FREE. GO AS FAR AS YOU WANT." Headline: "Which way «in» is right for you?"
2. **T2 Teach.** Headline: "Start «free»". Body: "The AI Starter Kit: 50 copy-paste prompts + a 7-day plan · The AI Readiness Assessment: about 3 minutes · 7 preview lessons, free to read, no signup".
3. **T2 Teach.** Headline: "AI Essentials: Use AI in «Everyday» Life". Body: "$47 · 18 short lessons · beginner. Go from curious to confident with AI assistants. If you can send an email or a text message, you can take this course."
4. **T2 Teach.** Headline: "AI for Business Owners: The Implementation «Playbook»". Body: "$297 · 20 lessons · intermediate. Find the AI opportunities that genuinely pay off in your business, and put your first three to work in 30 days, safely and measurably."
5. **T2 Teach.** Headline: "AI Automation Accelerator: Build Workflows & «Agents»". Body: "$497 · 18 lessons · advanced. Design, build and safely ship AI automations and simple agents, mostly without code. Tool subscriptions and AI usage are paid separately."
6. **T2 Teach.** Headline: "In every «course»". Body: "Copy-paste prompts and templates · A practical exercise in every lesson · AI tutor inside every lesson · Lifetime access · Certificate of completion". **[CONFIRM: AI key live in production. If not, delete "AI tutor inside every lesson".]**
7. **T2 Teach.** Headline: "1:1 AI «Coaching»". Body: "$150 · 60 minutes on Zoom. Bring your real work — we'll build prompts, workflows, or automations together live."
8. **T2 Teach, ink background.** Headline: "Done-«with»-you AI". Body: "We design, build and hand over working AI systems for your business, with your team trained to run them. A free discovery call first, then a clear written scope and quote before any work begins."
9. **T2 Teach.** Headline: "How to «choose»". Body: "A course if you want to learn and do it yourself at your own pace. Coaching for hands-on help with your real tasks. Implementation if you'd rather have it built. Not sure? The free assessment recommends a starting point."
10. **T5 CTA.** Headline: "Try a free «lesson» first". Pill: "Profile → Courses + free lessons". Small line: "7 lessons free to read · no signup".

**Caption**

```text
Courses, coaching or done-with-you AI: which way in is right for you?

Start free: the AI Starter Kit, the 3-minute AI Readiness Assessment, and 7 preview lessons you can read with no signup.

AI Essentials: Use AI in Everyday Life. $47, 18 short lessons, for beginners.
AI for Business Owners: The Implementation Playbook. $297, 20 lessons, for owners, operators and managers.
AI Automation Accelerator: Build Workflows & Agents. $497, 18 lessons, advanced. Tool subscriptions and AI usage are paid separately.
1:1 AI Coaching Session. $150 for 60 minutes on your real work.
Done-with-you AI implementation. A free discovery call, then a clear written scope and quote before any work begins.

Not sure? The free assessment recommends a starting point.

Tap "Courses + free lessons" in my profile to read a free lesson first.

#aiforbusiness #learnai #aitools #aitips
```
_867 / 2,200 characters · 4 / 5 hashtags_

**Facebook cross-post (L+77 · Tue Jan 26).** Paste the caption above without the hashtags and without the last call-to-action line (the comment keyword or "Tap … in my profile"), end with "Link in the first comment.", then post this first comment from the Page:

```text
Courses, coaching and 7 free preview lessons: https://principeai.com/courses?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-15
```
_153 characters_

**Pin cut from this carousel.** Redesign one or two slides at 1000×1500 (P2 or P3, 1.4), with the cover headline as the image headline.

**Title**
```text
Courses, coaching or done-with-you AI: which way in is right for you?
```
_69 / 100 characters_

**Description**
```text
Start free with the AI Starter Kit, the 3-minute AI Readiness Assessment and 7 preview lessons you can read with no signup. Then choose: a self-paced course if you want to learn and do it yourself, 1:1 coaching for hands-on help with your real tasks, or done-with-you implementation if you'd rather have it built. Not sure? The free assessment recommends a starting point.
```
_372 / 800 characters_

Leave prices and the AI tutor off this Pin: it stays up for months, and prices change in Admin → Courses.

---

### 2.3 Stories: the 14-day plan (VC-16 to VC-29, L+0 · Tue Nov 10 to L+13 · Mon Nov 23)

**How it runs**

- **3–5 frames a day, posted live** (5–10 minutes). In-app Story scheduling is a paid Meta One feature [V], and free Story scheduling in Business Suite is UNVERIFIED, so plan on posting live.
- **Times** (from the calendar): 13:00 ET on days that share a carousel (just after its 12:30 post), 19:15 ET on days that share a Reel (just after its 19:00 post), 9:30 ET on launch day and 10:00 ET on Day 14.
- **Stickers:** poll (2 options), quiz (4 options, one correct), question box, emoji slider and countdown [V][R].
- **Link-sticker days:** 10 of the 14 (Days 1, 2, 4, 5, 7, 8, 9, 10, 12 and 14). Every sticker carries **the Story's own ID** (`vc-16` to `vc-29`); on days that share a carousel, it goes to that carousel's destination. Set the sticker text to the words given (Instagram lets you edit it).
- **If the link sticker isn't available yet** (new accounts can be excluded [V]): replace it with the text "Reply KIT and I'll send you the link" (or READY for the assessment) and send the matching `dm-` link by hand from the Inbox (IG-6 or IG-7; 1.2). Keep posting daily and check again each week.
- **Also share every Reel** from the short-video kit to Stories on its posting day with a "new post" sticker. Those shares are listed below where they fall.
- **Highlights:** don't save these launch-fortnight Stories to Highlights; their links say `launch`. The evergreen Highlight frames in 2.4 do that job. The only exception is the question-box answers (Days 6 and 13), which carry no link and go into **FAQ**.
- **Frame templates:** S1 text, S2 prompt and S3 camera (1.4). Keep text out of the top and bottom 250 px.

---

### VC-16 · Day 1, L+0 · Tue Nov 10 · Launch day: "It's live"

- **Post:** L+0 · Tue Nov 10 · 9:30 ET, live · campaign `launch` · **Stickers:** poll, link
- **Link sticker** ("Get the free kit"): `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-16`
- **Fill in first:** `[YOUR NAME]`
- **No-face option:** make frame 1 an S1 text frame ("Principe AI is «live» today: practical AI for your life and your business."), or your voice-over on a screen recording of principeai.com/links
- **Source:** `src/config/site.ts` (tagline, description); `src/content/starter-kit.ts` (subtitle)

**Frames**

1. **S3 Camera, 10–15 seconds** (no-face option above). Say: "Hi, I'm [YOUR NAME]. Principe AI is live today: practical AI for your life and your business." On-screen text: "Principe AI is «live»."
2. **S1 Text.** "Learn AI. Implement AI. «Grow» with AI." Small line: "Courses, coaching and done-with-you AI systems, in plain English."
3. **S1 Text + poll.** Text: "Where do you most want AI to help?" Poll: **My life** / **My business**.
4. **S1 Text + link sticker.** "Start free: 50 copy-paste prompts + a 7-day «plan»." Small line: "Free · no card required".
5. **Share LD-01** (the short-video kit's 9:00 ET launch Reel) with a "new post" sticker.

---

### VC-17 · Day 2, L+1 · Wed Nov 11 · Share VC-01 ("Start here")

- **Post:** L+1 · Wed Nov 11 · 13:00 ET, live · campaign `launch` · **Stickers:** poll, link
- **Link sticker** ("Take the free assessment": VC-01's destination, this Story's own ID): `https://principeai.com/assessment?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-17`
- **Source:** `src/content/starter-kit.ts` → Day 1 step 1; `src/app/(marketing)/page.tsx` → `HOW_IT_WORKS`

**Frames**

1. **S1 Text + poll.** "Have you used an AI assistant this week?" Poll: **Yes** / **Not yet**.
2. **S1 Text.** "Not yet? Start with the «official» app or website of one of the AI assistants like Claude, ChatGPT and Gemini, and create a free account. Check the developer name if you download an app."
3. **Share VC-01** to your Story, with the link sticker on it. Text above it: "How it works: Assess → Learn → Implement. Step 1 is free."

---

### VC-18 · Day 3, L+2 · Thu Nov 12 · Question box

- **Post:** L+2 · Thu Nov 12 · 19:15 ET, live · campaign `launch` · **Stickers:** question
- **Link sticker:** none today (a listening day)
- **Link for DM replies** (send it to anyone who asks where to start; it's IG-6 in profile setup): `https://principeai.com/free-guide?utm_source=instagram&utm_medium=dm&utm_campaign=evergreen&utm_content=dm-kit`
- **Source:** the visual and community research ("Ask me anything" box); [content bank](07-content-bank.md) CB-80

**Frames**

1. **S3 Camera + question sticker.** Say: "I'm collecting real tasks to build prompts for. Tell me one." Question sticker: "What's one task you'd hand to AI tomorrow?" *No-face option:* an S1 text frame with the same line and the same sticker.
2. **Share SV-01** (founder intro Reel) with a "new post" sticker.

Save the best 3 answers for Day 6.

---

### VC-19 · Day 4, L+3 · Fri Nov 13 · Quiz: the part everyone skips

- **Post:** L+3 · Fri Nov 13 · 19:15 ET, live · campaign `launch` · **Stickers:** quiz, link
- **Link sticker** ("Read the free lesson"): `https://principeai.com/courses/ai-essentials/preview/the-five-part-prompt?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-19`
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `the-five-part-prompt` ("2. Context", "The shortcut when you're not sure what to include")

**Frames**

1. **S1 Text + quiz.** "Which part of a prompt do most people skip?" Options: A **Role** · B **Context** (correct) · C **Task** · D **Format**.
2. **S1 Text.** "«Context». Your assistant has never met you. Who's involved? What have you already tried? What constraints matter: budget, time, skill level, tone?"
3. **S2 Prompt.** Heading: "Not sure what to include? Let the AI ask:"
<!-- prompt: src/db/seed-content/course-ai-essentials.ts -->
```text
I want help with [GOAL]. Before you answer, ask me up to five questions
that would help you give me a much better, more specific answer.
Ask them all at once.
```
4. **S1 Text + link sticker.** "The full 5-part prompt lesson is «free» to read. No signup."
5. **Share SV-02** (Starter Kit Day 1 Reel) with a "new post" sticker.

---

### VC-20 · Day 5, L+4 · Sat Nov 14 · Share VC-02 (the 5-part prompt)

- **Post:** L+4 · Sat Nov 14 · 13:00 ET, live · campaign `launch` · **Stickers:** emoji slider, link
- **Link sticker** ("Get the free kit": VC-02's destination, this Story's own ID): `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-20`
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `the-five-part-prompt` ("Try it now")

**Frames**

1. **S1 Text + emoji slider (💡).** "How confident do you feel writing prompts?"
2. **Share VC-02** with the link sticker. Text above it: "Role, Context, Task, Format, Examples. Swipe through the post."
3. **S1 Text.** "Try it «today»: write one real task as a one-line prompt. Then rewrite it with all five parts in a new chat, and compare the two answers."

---

### VC-21 · Day 6, L+5 · Sun Nov 15 · Your answers

- **Post:** L+5 · Sun Nov 15 · 19:15 ET, live · campaign `launch` · **Stickers:** none
- **Link sticker:** none today
- **Link for DM replies:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=dm&utm_campaign=evergreen&utm_content=dm-kit`
- **Save to Highlight:** FAQ (frames 1–3)
- **Fill in first:** `[ANSWER: …]` on each frame
- **Source:** the Day 3 replies; prompt titles from `src/content/starter-kit.ts`

**Frames**

1–3. **Share 3 replies** from Day 3's question box (tap the reply → Share). Under each, in Geist 44 px: "Try this: [ANSWER: the Starter Kit prompt that fits, e.g. 'Turn rough notes into a clear email' or 'Plan my week']". Don't share a reply that contains personal details. Check the preview before posting: the reply's text can identify someone even if their name isn't shown.
4. **Share SV-03** (Day 2 Reel) with a "new post" sticker.

---

### VC-22 · Day 7, L+6 · Mon Nov 16 · Share VC-03 (the 7-day plan)

- **Post:** L+6 · Mon Nov 16 · 13:00 ET, live · campaign `launch` · **Stickers:** poll, link
- **Link sticker** ("Get the 7-day plan": VC-03's destination, this Story's own ID): `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-22`
- **Source:** `src/content/starter-kit.ts` → Day 1 prompt

**Frames**

1. **S1 Text + poll.** "Starting Day 1 this week?" Poll: **I'm in** / **Maybe later**.
2. **S2 Prompt.** Heading: "Day 1's prompt:"
<!-- prompt: src/content/starter-kit.ts -->
```text
I'm new to AI assistants and I'd like you to help make my everyday life easier.
A little about me: [YOUR ROLE OR SITUATION, E.G. "NURSE AND PARENT OF TWO"].
Ask me 5 short questions about my routine, work and goals, one at a time.
Then suggest 5 specific ways you could help me this week, one sentence each.
```
3. **Share VC-03** with the link sticker. Text above it: "Days 2 to 7 are in the free kit."

---

### VC-23 · Day 8, L+7 · Tue Nov 17 · Quiz: what's safe to paste?

- **Post:** L+7 · Tue Nov 17 · 19:15 ET, live · campaign `launch` · **Stickers:** quiz, link
- **Also today:** share VC-08 to your Story at 13:00 with VC-08's own link sticker (its block)
- **Link sticker** ("Get the free kit"): `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-23`
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `set-up-your-ai-assistant` ("The postcard rule"); `src/content/starter-kit.ts` → `tips` 3

**Frames**

1. **S1 Text + quiz.** "Which one is OK to paste into an AI chat?" Options: A **Your bank account number** · B **A recipe you want to make dairy-free** (correct) · C **A client's full name and address** · D **Your email password**.
2. **S1 Text.** "B. The «postcard» rule: write as if your message could be read by someone else. Never share passwords, full card or bank numbers, government ID numbers or detailed health records."
3. **S1 Text + link sticker.** "All 8 safety and quality tips are in the free «Starter Kit»."
4. **Share SV-04** (Day 3 Reel) with a "new post" sticker.

---

### VC-24 · Day 9, L+8 · Wed Nov 18 · Share VC-04 (never paste)

- **Post:** L+8 · Wed Nov 18 · 13:00 ET, live · campaign `launch` · **Stickers:** poll, link
- **Link sticker** ("Get the free kit": VC-04's destination, this Story's own ID): `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-24`
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `set-up-your-ai-assistant` ("Step 3: Check four privacy settings")

**Frames**

1. **S1 Text + poll.** "Have you checked your AI privacy settings?" Poll: **Yes** / **Not yet**.
2. **S1 Text.** "Check «4» once: model training or data controls · chat history · memory or personalization · temporary or private chats."
3. **Share VC-04** with the link sticker. Text above it: "3 things to never paste. Send it to someone who just started."

---

### VC-25 · Day 10, L+9 · Thu Nov 19 · Business: email or follow-ups?

- **Post:** L+9 · Thu Nov 19 · 19:15 ET, live · campaign `launch` · **Stickers:** poll, link
- **Link sticker** ("Take the assessment"): `https://principeai.com/assessment?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-25`
- **Source:** `src/lib/assessment.ts` → `QUICK_WINS.email`; `src/db/seed-content/course-ai-for-business.ts` → `choose-your-first-three` (key takeaways)

**Frames**

1. **S1 Text + poll.** "Business owners: which eats more of your week?" Poll: **Email** / **Follow-ups**.
2. **S1 Text.** "Either way, start with «drafts». AI drafts, a person reviews and sends. Earn the right to automate."
3. **S2 Prompt.** Heading: "A quick win for your inbox:"
<!-- prompt: src/lib/assessment.ts -->
```text
You're my email assistant. Draft a reply to the email below.
My goal for this reply: [e.g. confirm Thursday at 2pm / politely decline / ask for the missing details]
Tone: friendly, clear and professional. Keep it under 120 words.
The email I received:
[paste the email — remove anything confidential]
Give me two versions: one short and direct, one a little warmer.
```
4. **S1 Text + link sticker.** "Find «your» quickest win: the free 3-minute AI Readiness Assessment."
5. **Share SV-13** (why AI makes things up) with a "new post" sticker.

---

### VC-26 · Day 11, L+10 · Fri Nov 20 · Ask me anything about AI

- **Post:** L+10 · Fri Nov 20 · 19:15 ET, live · campaign `launch` · **Stickers:** question
- **Link sticker:** none today
- **Link for DM replies:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=dm&utm_campaign=evergreen&utm_content=dm-kit`
- **Source:** the visual and community research (question box)

**Frames**

1. **S3 Camera + question sticker.** Say: "Ask me anything about using AI, at home or at work. I'll answer the best ones on Sunday." Question sticker: "Ask me anything about AI". *No-face option:* an S1 text frame with the same line and the same sticker.
2. **Share SV-18** (where AI pays off) with a "new post" sticker.

---

### VC-27 · Day 12, L+11 · Sat Nov 21 · Share VC-05 (where AI pays off)

- **Post:** L+11 · Sat Nov 21 · 13:00 ET, live · campaign `launch` · **Stickers:** quiz, link
- **Link sticker** ("Take the assessment": VC-05's destination, this Story's own ID): `https://principeai.com/assessment?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-27`
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `where-ai-pays-off` ("The four payoffs")

**Frames**

1. **S1 Text + quiz.** "Which AI payoff is hardest to measure?" Options: A **Time** · B **Quality** · C **Speed** · D **Revenue** (correct).
2. **S1 Text.** "«Revenue». It has the highest ceiling and is the hardest to attribute. It usually comes from work that wasn't happening at all: follow-ups nobody had time for."
3. **Share VC-05** with the link sticker. Text above it: "All four payoffs, and how to measure each."

---

### VC-28 · Day 13, L+12 · Sun Nov 22 · Answers, and why I started

- **Post:** L+12 · Sun Nov 22 · 19:15 ET, live · campaign `launch` · **Stickers:** none
- **Link sticker:** none today
- **Link for DM replies:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=dm&utm_campaign=evergreen&utm_content=dm-kit`
- **Save to Highlight:** FAQ (frames 1–3)
- **Fill in first:** `[ANSWER: …]`, `[YOUR STORY: …]`
- **Source:** the Day 11 questions (Friday); `src/content/starter-kit.ts` → `tips` 6 (for health, legal and money questions)

**Frames**

1–3. **Share 3 questions** from Friday's box, each with a short, true answer: "[ANSWER: two or three sentences]". For any health, legal or money question, answer with the rule from the kit: "Use AI to understand health, legal and money topics and to prepare good questions, then make big decisions with a qualified professional."
4. **S3 Camera.** On-screen text: "Why I started Principe AI". Say: "[YOUR STORY: one sentence about why you started]." Delete this frame if you'd rather not share it yet, or use an S1 text frame with the same line (no face).
5. **Share SV-27** (holiday meal plan and one grocery list) with a "new post" sticker.

---

### VC-29 · Day 14, L+13 · Mon Nov 23 · Next week, and a countdown

- **Post:** L+13 · Mon Nov 23 · 10:00 ET, live · campaign `launch` · **Stickers:** countdown, poll, link
- **Link sticker** ("Get the free kit"): `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=vc-29`
- **Source:** `src/content/starter-kit.ts` (category names and counts)

**Frames**

1. **S1 Text + countdown sticker** (ends L+14 · Tue Nov 24 · 12:30 ET, when VC-06 posts; it counts down to a real post, never to a sale). "New on Tuesday: 5 AI prompts for «busy» parents."
2. **S1 Text + poll.** "What should I make prompts for next?" Poll: **Home life** / **Work**.
3. **S1 Text + link sticker.** "Can't wait? 50 prompts in 8 categories are in the free «Starter Kit»."

**After Day 14** (from L+14 · Tue Nov 24), Stories go out on post days only (calendar 2.2): share each carousel and Reel on its day with a link sticker carrying that post's own link. A poll or question box now and then is optional.

---

### 2.4 Highlights (VC-30 to VC-35)

**Setup: L-9 · Sun Nov 1 · 10:00 ET** (calendar). Post each set below as Stories, then save it to a new Highlight with the cover from 1.4 ([profile setup](01-profile-setup.md), 4.1, has the same steps and lists these links as IG-9 to IG-16). All links use `utm_medium=bio` and `utm_campaign=evergreen`, because Highlights stay up for months. Instagram keeps Highlights until you remove them, with no limit on how many you have [V], and public professional accounts' Highlights can be indexed by search engines [V], so keep the frame text in plain keyword language. Don't add a "Results" Highlight until there are real, permissioned client results.

| Order | Highlight title | Cover icon | ID |
|---|---|---|---|
| 1 | Start Here | House | VC-30 |
| 2 | Free Kit | Gift | VC-31 |
| 3 | AI Quiz | Checklist | VC-32 |
| 4 | Courses | Book | VC-33 |
| 5 | For Business | Briefcase | VC-34 |
| 6 | FAQ | Question mark | VC-35 |

---

### VC-30 · Highlight: Start Here

- **Post:** L-9 · Sun Nov 1 · 10:00 ET as Stories, then save to the Highlight · campaign `evergreen`
- **Links:** frame 3 ("Get the free kit") `https://principeai.com/free-guide?utm_source=instagram&utm_medium=bio&utm_campaign=evergreen&utm_content=vc-30` · frame 4 ("Take the assessment") `https://principeai.com/assessment?utm_source=instagram&utm_medium=bio&utm_campaign=evergreen&utm_content=vc-30`
- **Fill in first:** `[YOUR NAME]`, `[YOUR STORY: …]` (or delete frame 5)
- **Source:** `src/config/site.ts`; `src/app/(marketing)/page.tsx` (`PATHS`, `HOW_IT_WORKS`)

**Frames**

1. **S1.** "Welcome! «Principe AI» is practical AI for your life and your business." Small line: "Learn AI. Implement AI. Grow with AI."
2. **S1.** "How it works: Assess → Learn → «Implement»." Three short lines: "Assess: the free AI Readiness Assessment" / "Learn: short lessons or 1:1 coaching" / "Implement: use your workflows, or have us build them".
3. **S1 + link sticker.** "New to AI? Start with the free AI Starter Kit: 50 copy-paste prompts + a 7-day «plan»."
4. **S1 + link sticker.** "Running a business? Start with the free «3-minute» AI Readiness Assessment."
5. **S3 Camera.** "I'm [YOUR NAME]. [YOUR STORY: one sentence about why you started]." No-face option: the same line on an S1 text frame.

---

### VC-31 · Highlight: Free Kit

- **Post:** L-9 · Sun Nov 1 · 10:00 ET as Stories, then save to the Highlight · campaign `evergreen`
- **Link:** frame 5 ("Get the free kit") `https://principeai.com/free-guide?utm_source=instagram&utm_medium=bio&utm_campaign=evergreen&utm_content=vc-31`
- **Source:** `src/content/starter-kit.ts` (title, subtitle, `days`, category names and counts, first prompt); `src/components/marketing/free-guide-landing.tsx` (FAQ)

**Frames**

1. **S1.** "The AI Starter «Kit»: 50 copy-paste prompts + a 7-day plan to make AI genuinely useful in your life and work."
2. **S1.** "The 7-day «plan»: one small, practical win a day, about 10 minutes each." Then the seven day titles in Geist 36 px.
3. **S1.** "50 prompts in «8» categories." List: "Writing & email (7) · Planning & organizing (6) · Learning & skills (6) · Research & decisions (7) · Work & career (6) · Business & marketing (6) · Personal & home (6) · Creativity & fun (6)". Small line: "Plus 8 safety and quality tips."
4. **S2 Prompt.** Heading: "Try one now:"
<!-- prompt: src/content/starter-kit.ts -->
```text
Turn these rough notes into a clear, friendly email to [RECIPIENT]:
[YOUR NOTES OR BULLET POINTS]
Keep it under [NUMBER] words, put the most important point first, and end with a clear next step.
```
5. **S1 + link sticker.** "«Free» · no card required · nothing to cancel." Small line: "Works with the free versions of AI assistants like Claude, ChatGPT and Gemini."

---

### VC-32 · Highlight: AI Quiz

- **Post:** L-9 · Sun Nov 1 · 10:00 ET as Stories, then save to the Highlight · campaign `evergreen`
- **Link:** frame 4 ("Take the assessment") `https://principeai.com/assessment?utm_source=instagram&utm_medium=bio&utm_campaign=evergreen&utm_content=vc-32`
- **Source:** `src/app/(marketing)/assessment/page.tsx` (headline, `WHAT_YOU_GET`, FAQ); `src/lib/assessment.ts` (`TIERS`)

**Frames**

1. **S1.** "How ready are you to put AI «to work?»" Small line: "3 minutes · free · instant results".
2. **S1.** "What you «get»: a score out of 100 · your tier, with your strengths and the gaps worth closing first · a personalized AI action plan · your recommended next step".
3. **S1.** "Four «tiers»: Explorer · Experimenter · Implementer · Scaler". Each with its headline in Geist 34 px: "Ready for your first real wins", "Time to turn experiments into habits", "Ready to build real workflows", "Ready to scale with AI systems".
4. **S1 + link sticker.** "No tech skills needed. Your results are emailed to you as a «private» link."

---

### VC-33 · Highlight: Courses

- **Post:** L-9 · Sun Nov 1 · 10:00 ET as Stories, then save to the Highlight · campaign `evergreen`
- **Link:** frame 6 ("Try a free lesson") `https://principeai.com/courses?utm_source=instagram&utm_medium=bio&utm_campaign=evergreen&utm_content=vc-33`
- **Fill in first:** check prices in Admin → Courses (**PRICE**); the **CONFIRM** line on frame 5. Re-post frames 2–4 whenever a price changes
- **Source:** `src/app/(marketing)/courses/page.tsx` (headline); the three course seed files (titles, `priceCents`, lesson counts, `includes`)

**Frames**

1. **S1.** "Practical AI skills, «taught in plain English»." (the courses page headline)
2. **S1.** "AI Essentials: Use AI in Everyday Life · $47 · 18 short lessons · beginner".
3. **S1.** "AI for Business Owners: The Implementation Playbook · $297 · 20 lessons · intermediate".
4. **S1.** "AI Automation Accelerator: Build Workflows & Agents · $497 · 18 lessons · advanced". Small line: "Tool subscriptions and AI usage are paid separately."
5. **S1.** "In every «course»: copy-paste prompts and templates · a practical exercise in every lesson · AI tutor inside every lesson · lifetime access · certificate of completion". **[CONFIRM: AI key live in production. If not, delete "AI tutor inside every lesson".]**
6. **S1 + link sticker.** "Try one of 7 «free» lessons first. No signup."

---

### VC-34 · Highlight: For Business

- **Post:** L-9 · Sun Nov 1 · 10:00 ET as Stories, then save to the Highlight · campaign `evergreen`
- **Links:** frame 5 ("Apply for a discovery call") `https://principeai.com/consulting?utm_source=instagram&utm_medium=bio&utm_campaign=evergreen&utm_content=vc-34#apply` · frame 6 ("Book a free call") `https://principeai.com/book/ai-strategy-call?utm_source=instagram&utm_medium=bio&utm_campaign=evergreen&utm_content=vc-34`
- **Source:** `src/app/(marketing)/consulting/page.tsx` (headline, `PROBLEMS`, services, `PROCESS`, trust line); `src/db/seed.ts` (`ai-strategy-call`)

**Frames**

1. **S1.** "We build the AI systems your business «runs on.»" (the consulting page headline)
2. **S1.** "Sound familiar? Too many tools, no plan · Experiments that never ship · A team that's unsure — or unsafe".
3. **S1.** "What we «build»: AI assistants & chatbots · Workflow automations · Content systems · Sales & follow-up automation · Internal knowledge assistants · Team AI training & policy".
4. **S1.** "How it «works»: Discovery → Blueprint → Build → Train → Support".
5. **S1 + link sticker.** "Custom-scoped for your business. A clear quote before any work «begins»."
6. **S1 + link sticker.** "Not sure yet? Book a free «30-minute» AI Strategy Call."

---

### VC-35 · Highlight: FAQ

- **Post:** L-9 · Sun Nov 1 · 10:00 ET as Stories, then save to the Highlight · campaign `evergreen`
- **Link:** frame 6 ("Book a free call") `https://principeai.com/book/ai-strategy-call?utm_source=instagram&utm_medium=bio&utm_campaign=evergreen&utm_content=vc-35`
- **Source:** `src/app/(marketing)/page.tsx` (FAQ); `src/components/marketing/free-guide-landing.tsx` (FAQ)

**Frames**

1. **S1.** "Do I need a technical «background»?" Answer: "Not at all. Everything is taught in plain English and starts from the basics."
2. **S1.** "Which AI tools will I «learn»?" Answer: "Skills that work across AI assistants like Claude, ChatGPT and Gemini, so you're never locked into one app."
3. **S1.** "Is the Starter Kit really «free»?" Answer: "Yes. There's no card required and nothing to cancel."
4. **S1.** "Is it safe to use AI with personal or business «information»?" Answer: "It can be, when you know the rules: what's safe to share, which settings to check and how to verify AI answers."
5. **S1.** "What does AI implementation «cost»?" Answer: "Every business is different, so there's no one-size-fits-all price. After a free discovery call you'll receive a clear written scope and quote before any work begins."
6. **S1 + link sticker.** "Still deciding? Book a free strategy call for an honest «recommendation»."
7. **Add later:** the answer frames from Days 6 and 13 (VC-21, VC-28) and any later question-box answers.

---

### 2.5 Broadcast Channel (VC-36 to VC-38, after 1,000 followers)

**Reserve** (calendar, section 9). Instagram says channels "can be started by a public account with more than 1,000 followers" and are still rolling out [V]. Until then, skip this. When the option appears: name the channel **Principe AI: Weekly AI Prompt**, share it to your Story and pin it to your profile [V], and send 2–3 messages a week. Whether links in channel messages are clickable is UNVERIFIED; the messages work either way.

### VC-36 · Channel welcome message

- **Post:** Reserve: when Instagram opens Broadcast Channels to you (1,000+ followers) · campaign `evergreen`
- **Link:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=evergreen&utm_content=vc-36`
- **Source:** `src/content/starter-kit.ts` (subtitle)

```text
Welcome to Principe AI: Weekly AI Prompt.

Every week: one copy-paste prompt, a 30-second voice note on why it works, and a poll on what the next one should help with. Everything works with the free versions of AI assistants like Claude, ChatGPT and Gemini.

Want 50 prompts now? The free AI Starter Kit is here: https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=evergreen&utm_content=vc-36
```
_426 characters_

### VC-37 · Weekly prompt message (template, first example filled in)

- **Post:** Reserve: when Instagram opens Broadcast Channels to you (1,000+ followers) · campaign `evergreen`
- **Link:** `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=evergreen&utm_content=vc-37`
- **Source:** `src/content/starter-kit.ts` → Planning & organizing → "Turn chaos into a to-do list". Swap in a new library prompt each week and keep the same shape

```text
This week's prompt: turn chaos into a to-do list.

Here's a brain dump of everything on my mind: [EVERYTHING, IN ANY ORDER]
Organize it into a to-do list grouped by [WORK / HOME / ERRANDS]. Mark the 3 most important items, and point out anything I can do in under 5 minutes.

Voice note coming next on why the "under 5 minutes" line matters. More prompts like this: https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=evergreen&utm_content=vc-37
```
_479 characters_

### VC-38 · Weekly poll message

- **Post:** Reserve: when Instagram opens Broadcast Channels to you (1,000+ followers) · campaign `evergreen`
- **Link:** none in the poll itself. If members message you asking for more, send the IG-6 DM link `https://principeai.com/free-guide?utm_source=instagram&utm_medium=dm&utm_campaign=evergreen&utm_content=dm-kit`
- **Source:** `src/content/starter-kit.ts` (category names)

```text
What should next week's prompt help with?
Writing & email · Planning & organizing · Work & career · Business & marketing
```
_120 characters (use Instagram's poll in the channel; the four options are four of the kit's categories)_

---

## 3. Pinterest

**Why it's worth an hour a week.** Pinterest is search-led and slow-burning: "a Pin can gain engagement hours, days, months, or even years after it's first published" [V]. The "For your life" path (meals, trips, budgets, learning) fits it best, and Pins made now can be indexed before the Thanksgiving, holiday and New Year planning searches. Treat it as Tier 2: steady, cheap effort, not the main bet (some publishers report falling outbound clicks [R]).

**The rules this section follows**

- **Mostly free offers.** 13 of the 20 Pins go to `/free-guide`, 6 to `/assessment` and 1 to a free preview lesson.
- **All Pins are `utm_campaign=evergreen`**, even the ones published in launch week: they keep working long after it.
- **Keywords, not hashtags,** in the title, the description, the board name and the board description [V]. Validate the phrases in Pinterest Trends (US, last 12 months) before you lock them in [V]; the search volumes behind these phrases are UNVERIFIED.
- **Original Pins only.** Don't keep re-saving the same Pin or uploading duplicates; Pinterest says that can get you flagged as spam [V]. Make new designs for the same URL instead.
- **No AI-generated images** (labels and reduced reach [V]). Type, brand shapes and real screenshots only.

### 3.1 Account setup

Done once in Setup (L-15 · Mon Oct 26): Business account, name, About (with the independence line), the website field PI-1 and settings are in [profile setup](01-profile-setup.md), section 5.3.

### 3.2 Claim principeai.com

Started on L-21 · Tue Oct 20 with a DNS TXT record, because the check can take up to 72 hours [V]. The steps are in [profile setup](01-profile-setup.md), section 7.5. Once it's claimed, Pins that link to principeai.com are credited to your profile.

### 3.3 Rich Pins (optional; not a launch blocker)

A few days after the claim, check whether a Pin to `/free-guide` shows the page's own title and description ([profile setup](01-profile-setup.md), 5.3). Don't use product rich Pins: they show live prices, and course prices change in Admin → Courses.

### 3.4 Boards

Create all ten on L-15 · Mon Oct 26, with these exact names and descriptions, and put B10 first. **Keep a board secret until it holds at least 5 Pins**, then make it public; the 20 Pins below and the carousel cuts fill them over the weeks. Add Pinterest's suggested topics to each board whenever it offers them [R].

| # | Board name | Pins from this section | Carousel cuts that also go here |
|---|---|---|---|
| B1 | AI Prompts for Everyday Life | VC-42, VC-45 | VC-13 |
| B2 | AI Prompts for Small Business | VC-54, VC-56 | VC-05, VC-14 |
| B3 | AI Meal Planning & Family Organization | VC-39, VC-40, VC-44 | VC-06, VC-08 |
| B4 | AI Productivity & Planning Tips | VC-41, VC-43 | VC-03 |
| B5 | Learn AI for Beginners | VC-46, VC-47 | VC-02, VC-07 |
| B6 | AI Safety & Privacy Tips | VC-49, VC-57 | VC-04, VC-11, VC-12 |
| B7 | AI Marketing & Customer Follow-Up | VC-51, VC-55 | (more from the business carousels) |
| B8 | No-Code AI Automation Ideas | VC-58 | VC-09 |
| B9 | AI for Your Career: Resume & Interviews | VC-48 | (add Pins from the kit's Work & career prompts) |
| B10 | Free AI Resources by Principe AI | VC-50, VC-52, VC-53 | VC-01, VC-10, VC-15 |

**Pins cut from a carousel** use that carousel's ID with `utm_source=pinterest`, e.g. `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-06`, and the carousel's destination. Make each one a new 1000×1500 design (one prompt slide per Pin works well), not a crop of the 4:5 slide. The calendar schedules four: VC-10, VC-13 (twice), VC-14 and VC-15; their links, titles and descriptions are in those blocks.

**Board descriptions** (paste one into each board's description field)

B1 · AI Prompts for Everyday Life
```text
Copy-and-paste AI prompts for everyday life: writing tricky messages, saying no gracefully, gift ideas, planning, learning and clearer decisions. Plain-English prompts for beginners that work with the free versions of AI assistants like Claude, ChatGPT and Gemini. From Principe AI.
```
_282 characters_

B2 · AI Prompts for Small Business
```text
Practical AI prompts and ideas for small business owners: where AI pays off, choosing your first AI projects, customer replies, marketing and follow-up. Plain English, no hype, and a person reviews anything that matters. From Principe AI.
```
_238 characters_

B3 · AI Meal Planning & Family Organization
```text
AI prompts for busy families: weekly meal plans with one grocery list, holiday dinner planning, chore charts and routines, bedtime stories and homework help that teaches instead of answering. Copy a prompt, fill in the brackets and paste it into your AI assistant.
```
_264 characters_

B4 · AI Productivity & Planning Tips
```text
Plan your week, trips, events and budgets with AI. Prompts that ask AI to be honest about what won't fit, to show its math and to flag anything that needs booking ahead, so the plan fits your real life.
```
_202 characters_

B5 · Learn AI for Beginners
```text
Start using AI with no tech background: the 5-part prompt, how AI assistants work, why they sometimes make things up, how to fact-check an answer and a 7-day plan for complete beginners. Plus how to use AI as a patient tutor to learn anything faster.
```
_250 characters_

B6 · AI Safety & Privacy Tips
```text
Use AI safely: what never to paste into an AI chat, the privacy settings worth checking once, how to fact-check an answer, how to spot AI-powered scams, and simple Green, Amber, Red data rules for small business teams.
```
_218 characters_

B7 · AI Marketing & Customer Follow-Up
```text
AI prompts for small business marketing and sales: social media post ideas that aren't salesy, customer review replies, newsletters and lead follow-up without fake deadlines. AI drafts, people decide.
```
_200 characters_

B8 · No-Code AI Automation Ideas
```text
How reliable AI automations work, without the hype: the five parts of an AI workflow, what to automate first, and when an AI agent is the wrong choice. Ideas you can build with no-code tools such as Zapier, Make or n8n, with a person approving anything that matters.
```
_266 characters_

B9 · AI for Your Career: Resume & Interviews
```text
AI prompts for job seekers and working professionals: tailor your resume to a job without inventing experience, practice interview questions with feedback, prepare for a difficult conversation and turn meeting notes into action items.
```
_234 characters_

B10 · Free AI Resources by Principe AI
```text
Free AI resources from Principe AI: the AI Starter Kit (50 copy-paste prompts + a 7-day plan), the 3-minute AI Readiness Assessment and free preview lessons you can read with no signup. Learn AI. Implement AI. Grow with AI.
```
_223 characters_

### 3.5 Pin designs and the weekly batch

- **Templates P1–P4** are in 1.4. Every Pin carries the ink footer band with "principeai.com" and the name of the free offer it links to, so the image matches the landing page [V].
- **Prompt Pins** show the prompt exactly as quoted below. If it doesn't fit at 34 px, cut lines; never rewrite them.
- **Alt text:** the image's own text, under 250 characters (Pinterest's spec page lists a 250-character text field [V]; whether that is the alt-text limit is UNVERIFIED).
- **Design and schedule:** Pins are designed in the Monday batch session and scheduled in the Thursday sitting (calendar 2.2 and 3.2); the calendar names the Pins each batch makes. Schedule up to 30 days ahead [V]. Read Pinterest Analytics (outbound clicks, saves) in the Monday review.
- **When:** the calendar posts Pins at 20:00 ET, 2 or 3 a week. Time of day matters less on Pinterest than on Instagram, because discovery is search-led (UNVERIFIED).

---

### VC-39 · Weekly meal plan and grocery list prompt

- **Board:** B3 · **Publish:** L+2 · Thu Nov 12 · 20:00 ET · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-39`
- **Image headline:** "A week of dinners + «one» grocery list"
- **Source:** `src/content/starter-kit.ts` → Planning & organizing → "Weekly meal plan and grocery list"; `src/db/seed-content/course-ai-essentials.ts` → `plan-anything` (allergy note)

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
Plan [NUMBER] dinners for [NUMBER] people.
Dietary needs and dislikes: [DETAILS]. No more than [MINUTES] minutes of hands-on cooking each. Budget: [LOW / MEDIUM].
Use up what I already have: [INGREDIENTS].
Then give me one grocery list grouped by store section.
```

**Title**
```text
Weekly meal plan and grocery list AI prompt (copy and paste)
```
_60 / 100 characters_

**Description**
```text
Plan the week's dinners and the grocery list in one go with this copy-and-paste AI prompt. Tell your AI assistant how many people you're feeding, your dietary needs, how long you want to cook and what's already in the fridge, and it gives you a dinner plan plus one grocery list grouped by store section. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini. Allergies? Always read the labels yourself. Get 49 more prompts and a 7-day plan free in the AI Starter Kit.
```
_492 / 800 characters_

---

### VC-40 · Thanksgiving dinner planning prompt

- **Board:** B3 · **Publish:** L-6 · Wed Nov 4 · 20:00 ET **FIXED** · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-40`
- **Image headline:** "Thanksgiving, «planned»". Small line under the prompt: "Type 'Thanksgiving dinner' for [EVENT]."
- **Source:** `src/content/starter-kit.ts` → Planning & organizing → "Plan an event"; `intro` (follow-ups)

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
Help me plan [EVENT, E.G. A 40TH BIRTHDAY DINNER] for [NUMBER] guests on [DATE].
Budget: [AMOUNT]. Location: [HOME / TYPE OF VENUE]. The guest of honor loves [INTERESTS].
Give me a timeline of what to do and when, from now until the day, a budget breakdown, and 5 theme or activity ideas.
```

**Title**
```text
Plan Thanksgiving dinner with AI: a timeline and budget prompt
```
_62 / 100 characters_

**Description**
```text
Hosting Thanksgiving this year? Use this AI prompt to get a timeline of what to do and when, from now until the day, plus a budget breakdown and activity ideas. Fill in your guest count, date, budget and location, then refine the plan with follow-ups like "shorter" or "what's missing?". AI drafts the plan; you confirm prices and anything you'll pay for. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini. Get the full library of 50 prompts free in the AI Starter Kit.
```
_497 / 800 characters_

---

### VC-41 · Holiday trip itinerary prompt

- **Board:** B4 · **Publish:** L+4 · Sat Nov 14 · 20:00 ET · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-41`
- **Image headline:** "A trip plan with a «rainy-day» backup"
- **Source:** `src/content/starter-kit.ts` → Planning & organizing → "Trip itinerary"; Day 4 step 4

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
Create a [NUMBER]-day itinerary for [DESTINATION] in [MONTH] for [WHO'S GOING].
We enjoy [INTERESTS] and prefer a [RELAXED / BALANCED / PACKED] pace. Budget: [LEVEL].
Group nearby sights together, include a rainy-day option each day, and flag anything that usually needs booking ahead.
I'll confirm opening hours and prices myself.
```

**Title**
```text
Holiday trip itinerary AI prompt with a rainy-day backup for every day
```
_70 / 100 characters_

**Description**
```text
Plan holiday travel with AI. This copy-and-paste prompt builds a day-by-day itinerary that groups nearby sights together, includes a rainy-day option each day and flags anything that usually needs booking ahead. Add your destination, month, who's going, interests, pace and budget. Then confirm prices, opening hours and bookings on official websites before you rely on them. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini. Free in the AI Starter Kit, with 49 more prompts.
```
_504 / 800 characters_

---

### VC-42 · Thoughtful gift ideas prompt

- **Board:** B1 · **Publish:** L+7 · Tue Nov 17 · 20:00 ET · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-42`
- **Image headline:** "10 gift ideas that «aren't» generic"
- **Source:** `src/content/starter-kit.ts` → Personal & home → "Thoughtful gift ideas"

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
Suggest 10 gift ideas for [PERSON OR RELATIONSHIP], who is [AGE] and loves [INTERESTS].
Budget: [AMOUNT]. Avoid: [THINGS THEY ALREADY HAVE OR DISLIKE].
Mix practical, experience-based and sentimental ideas, with a one-line reason for each.
```

**Title**
```text
Thoughtful gift ideas AI prompt: 10 ideas that aren't generic
```
_61 / 100 characters_

**Description**
```text
Stuck on gift ideas? This AI prompt gives you 10 gift ideas for anyone on your list, mixing practical, experience-based and sentimental ideas, each with a one-line reason. Add their age, their interests, your budget and anything to avoid. A simple holiday shopping helper that works with the free versions of AI assistants like Claude, ChatGPT and Gemini. Get it, plus 49 more copy-paste prompts and a 7-day plan, free in the AI Starter Kit.
```
_441 / 800 characters_

---

### VC-43 · Simple monthly budget prompt

- **Board:** B4 · **Publish:** L+21 · Tue Dec 1 · 20:00 ET · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-43`
- **Image headline:** "A simple budget. «Show your math.»"
- **Source:** `src/content/starter-kit.ts` → Planning & organizing → "Simple monthly budget"; `src/db/seed-content/course-ai-essentials.ts` → `plan-anything` ("Budgets")

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
Here are my approximate monthly costs: [CATEGORIES AND ROUNDED AMOUNTS]
My take-home pay is about [AMOUNT], and I want to save [AMOUNT] a month for [GOAL].
Sort these into needs, wants and savings, suggest 3 realistic places to cut, and show a simple budget table. Show your math.
```

**Title**
```text
Simple monthly budget AI prompt: needs, wants and savings (show your math)
```
_74 / 100 characters_

**Description**
```text
Start the new year with a simple budget. This AI prompt sorts your monthly costs into needs, wants and savings, suggests 3 realistic places to cut and builds a budget table, with one instruction most people forget: show your math. Use rounded figures and categories only, never account numbers, logins or full statements, and check the totals with a calculator. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini. Free in the AI Starter Kit.
```
_468 / 800 characters_

---

### VC-44 · Family chore chart prompt

- **Board:** B3 · **Publish:** L+37 · Thu Dec 17 · 20:00 ET · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-44`
- **Image headline:** "A «fair» chore chart for the fridge"
- **Source:** `src/content/starter-kit.ts` → Personal & home → "Family routine or chore chart"; `tips` 3

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
Our household: [WHO LIVES HERE, INCLUDING KIDS' AGES]. Our biggest pain point: [E.G. CHAOTIC MORNINGS / CHORE ARGUMENTS].
Design a simple [MORNING ROUTINE / WEEKLY CHORE CHART] that's fair, age-appropriate and realistic.
Present it as a table we can print and stick on the fridge.
```

**Title**
```text
Family chore chart AI prompt: fair, age-appropriate and printable
```
_65 / 100 characters_

**Description**
```text
Make a fair family chore chart or morning routine with AI. Describe your household, your kids' ages and your biggest pain point, such as chaotic mornings or chore arguments, and this prompt designs a simple, age-appropriate routine as a table you can print and stick on the fridge. Remove names and personal details before you paste anything. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini. More family prompts are free in the AI Starter Kit.
```
_473 / 800 characters_

---

### VC-45 · Say no gracefully prompt

- **Board:** B1 · **Publish:** L+9 · Thu Nov 19 · 20:00 ET · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-45`
- **Image headline:** "Say no without «burning» a bridge"
- **Source:** `src/content/starter-kit.ts` → Writing & email → "Say no gracefully"

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
[WHO, E.G. A COLLEAGUE / A FRIEND] asked me to [REQUEST]. I need to say no because [REASON].
Write a short, kind reply that declines clearly, doesn't over-apologize, and [OFFERS AN ALTERNATIVE / LEAVES THE DOOR OPEN].
```

**Title**
```text
How to say no politely: an AI prompt for a kind, clear reply
```
_60 / 100 characters_

**Description**
```text
Need to turn down a request without burning a bridge? This copy-and-paste AI prompt writes a short, kind reply that declines clearly, doesn't over-apologize, and offers an alternative or leaves the door open. Add who asked, what they asked and your reason, then edit the draft so it sounds like you. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini. One of 50 prompts in the free AI Starter Kit.
```
_424 / 800 characters_

---

### VC-46 · The 5-part prompt template

- **Board:** B5 · **Publish:** L-4 · Fri Nov 6 · 20:00 ET · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-46`
- **Image headline:** "The «5-part» prompt"
- **Source:** `src/content/starter-kit.ts` → Day 2; `src/db/seed-content/course-ai-essentials.ts` → `the-five-part-prompt` (key takeaways)

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
Act as [ROLE, E.G. "AN EXPERIENCED PERSONAL ASSISTANT"].
Context: [WHO YOU ARE, THE SITUATION, AND LIMITS LIKE TIME OR BUDGET]
Task: [EXACTLY WHAT YOU WANT DONE]
Format: [E.G. "A SHORT BULLET LIST" OR "AN EMAIL UNDER 120 WORDS"]
Here's an example of the style I like: [OPTIONAL EXAMPLE]
If anything is unclear, ask me questions before you answer.
```

**Title**
```text
The 5-part AI prompt template: role, context, task, format, examples
```
_68 / 100 characters_

**Description**
```text
Get better answers from AI with the 5-part prompt: role, context, task, format and examples. Context is the part most people skip, and saying what format you want saves the most editing time. Copy this template, fill in the brackets and ask the AI to ask you questions if anything is unclear. A beginner-friendly prompt formula for AI assistants like Claude, ChatGPT and Gemini. It's Day 2 of the free 7-day plan in the AI Starter Kit.
```
_435 / 800 characters_

---

### VC-47 · AI tutor prompt (learn anything faster)

- **Board:** B5 · **Publish:** L+42 · Tue Dec 22 · 20:00 ET · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-47`
- **Image headline:** "Learn anything «faster» with an AI tutor"
- **Source:** `src/content/starter-kit.ts` → Day 5 "Learn something faster"; `src/db/seed-content/course-ai-essentials.ts` → `learn-anything-faster` ("Watch for accuracy")

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
Teach me about [TOPIC]. My level: [COMPLETE BEGINNER / KNOW A LITTLE].
Start with a simple explanation using an everyday analogy, then give me the 3 most important ideas.
Then quiz me with 3 questions, one at a time. Wait for my answer each time, and give me a hint if I get it wrong.
```

**Title**
```text
Learn anything faster with AI: a tutor prompt that quizzes you
```
_62 / 100 characters_

**Description**
```text
Want to learn a new skill this year? Use AI as a patient tutor. This prompt starts with a simple explanation and an everyday analogy, gives you the 3 most important ideas, then quizzes you one question at a time, with a hint when you get one wrong. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini. For niche or high-stakes topics, confirm key facts with a trusted source. It's Day 5 of the free 7-day AI plan in the AI Starter Kit.
```
_461 / 800 characters_

---

### VC-48 · Tailor your resume prompt

- **Board:** B9 · **Publish:** L+49 · Tue Dec 29 · 20:00 ET · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-48`
- **Image headline:** "Tailor your resume. «Invent nothing.»"
- **Source:** `src/content/starter-kit.ts` → Work & career → "Tailor my resume to a job", "Interview practice"

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
Here's a job description: [PASTE JOB POST]
Here's my resume summary and key experience, without contact details: [PASTE]
Suggest how to tailor my resume for this role: which experience to highlight, which keywords to include, and 3 rewritten bullet points.
Don't invent experience I don't have.
```

**Title**
```text
Tailor your resume to a job with AI (without inventing experience)
```
_66 / 100 characters_

**Description**
```text
Job hunting in the new year? This AI prompt compares your resume with a job description and suggests which experience to highlight, which keywords to include and 3 rewritten bullet points, with one firm rule: don't invent experience I don't have. Leave your contact details out before you paste. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini. Free in the AI Starter Kit, along with an interview practice prompt.
```
_443 / 800 characters_

---

### VC-49 · What never to share with AI

- **Board:** B6 · **Publish:** L-2 · Sun Nov 8 · 20:00 ET · **Template:** P3 Checklist
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-49`
- **Image text:** Headline "Never paste into an «AI chat»". Checklist (✕ marks in gold-500 `#f79009`): "Passwords, PINs, security codes or recovery codes · Full card numbers, bank details or government ID numbers · Medical record or insurance policy numbers · Other people's private information · Confidential work material your employer hasn't approved". Line at the bottom: "The postcard rule: write as if your message could be read by someone else."
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `safety-ethics-and-what-never-to-share` ("What never to share"), `set-up-your-ai-assistant` ("The postcard rule"); `src/content/starter-kit.ts` → `tips`

**Title**
```text
What never to share with AI: a privacy checklist for beginners
```
_62 / 100 characters_

**Description**
```text
AI safety for beginners: what never to paste into an AI chat. Keep out passwords, PINs and security codes; full card numbers, bank details and government ID numbers; medical record and insurance policy numbers; other people's private information; and confidential work material your employer hasn't approved. Use the postcard rule: write as if your message could be read by someone else. Get all 8 safety and quality tips free in the AI Starter Kit.
```
_449 / 800 characters_

---

### VC-50 · The 7-day AI plan for beginners

- **Board:** B10 · **Publish:** L+0 · Tue Nov 10 · 20:00 ET; a second, new design ("Your 7-day AI plan for the new year") on L+34 · Mon Dec 14 · 20:00 ET **FIXED**, same link · **Template:** P3 Checklist
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-50`
- **Image text:** Headline "7 days to make AI «genuinely» useful". Checklist: the seven day titles. Footer: "Free · about 10 minutes a day".
- **Source:** `src/content/starter-kit.ts` → `days`, `intro`

**Title**
```text
7-day AI plan for complete beginners: one small win a day
```
_57 / 100 characters_

**Description**
```text
New to AI? This free 7-day plan gives you one small, practical win a day, about 10 minutes each: meet your AI assistant, learn the 5-part prompt, clear a message you've been avoiding, plan something real, learn something faster, make a clearer decision and build your AI toolkit. No tech skills or paid tools needed. It works with the free versions of AI assistants like Claude, ChatGPT and Gemini. Get it free in the AI Starter Kit, with 50 copy-paste prompts.
```
_461 / 800 characters_

---

### VC-51 · Social media post ideas prompt for small business

- **Board:** B7 · **Publish:** L+18 · Sat Nov 28 · 20:00 ET · **Template:** P2 Prompt card
- **Destination:** `https://principeai.com/free-guide?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-51`
- **Image headline:** "10 post ideas that «aren't» salesy"
- **Source:** `src/content/starter-kit.ts` → Business & marketing → "Social media post ideas"

**Prompt on the Pin**
<!-- prompt: src/content/starter-kit.ts -->
```text
I run [TYPE OF BUSINESS] for [TARGET CUSTOMERS].
Give me 10 post ideas for [PLATFORM] that are genuinely helpful, not salesy, based on questions my customers often ask, such as: [EXAMPLE QUESTIONS]
For each one, include an attention-grabbing first line.
```

**Title**
```text
Social media post ideas for small business: an AI prompt that isn't salesy
```
_74 / 100 characters_

**Description**
```text
Out of content ideas? This AI prompt gives small business owners 10 social media post ideas that are genuinely helpful, not salesy, based on the questions your customers already ask, each with an attention-grabbing first line. Add your business, your customers and the platform, then edit the drafts so they sound like you. Works with the free versions of AI assistants like Claude, ChatGPT and Gemini. One of 6 business and marketing prompts in the free AI Starter Kit.
```
_470 / 800 characters_

---

### VC-52 · Which AI tier are you?

- **Board:** B10 · **Publish:** L+11 · Sat Nov 21 · 20:00 ET · **Template:** P3 Checklist (four rows)
- **Destination:** `https://principeai.com/assessment?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-52`
- **Image text:** Headline "Which AI «tier» are you?" Four rows: "Explorer · Ready for your first real wins" / "Experimenter · Time to turn experiments into habits" / "Implementer · Ready to build real workflows" / "Scaler · Ready to scale with AI systems". Footer: "Free AI Readiness Assessment · about 3 minutes".
- **Source:** `src/lib/assessment.ts` → `TIERS`; `src/app/(marketing)/assessment/page.tsx` → `WHAT_YOU_GET`

**Title**
```text
Explorer, Experimenter, Implementer or Scaler: which AI tier are you?
```
_69 / 100 characters_

**Description**
```text
Find out how ready you are to put AI to work. The free AI Readiness Assessment takes about 3 minutes and places you in one of four tiers: Explorer (ready for your first real wins), Experimenter (time to turn experiments into habits), Implementer (ready to build real workflows) or Scaler (ready to scale with AI systems). You get a score out of 100, a personalized AI action plan and a recommended next step. No tech skills needed.
```
_431 / 800 characters_

---

### VC-53 · Free AI Readiness Assessment

- **Board:** B10 · **Publish:** L+0 · Tue Nov 10 · 20:00 ET · **Template:** P1 Headline
- **Destination:** `https://principeai.com/assessment?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-53`
- **Image text:** Headline "How ready are you to put AI «to work?»". Four short lines: "Your score out of 100 · Your readiness tier · A personalized AI action plan · Your recommended next step". Footer: "Free · about 3 minutes · principeai.com".
- **Source:** `src/app/(marketing)/assessment/page.tsx` (headline, metadata description, `WHAT_YOU_GET`)

**Title**
```text
Free AI readiness assessment: your score and action plan in about 3 minutes
```
_75 / 100 characters_

**Description**
```text
How ready are you to put AI to work, in your life or your business? Answer a few quick questions and get your AI readiness score out of 100, your tier and a personalized AI action plan: three quick wins with copy-paste prompts, a 30-day roadmap and the tools worth trying. Plus an honest recommended next step. Free, about 3 minutes, instant results, and no tech skills needed.
```
_377 / 800 characters_

---

### VC-54 · Where AI pays off in a small business

- **Board:** B2 · **Publish:** L+14 · Tue Nov 24 · 20:00 ET · **Template:** P3 Checklist
- **Destination:** `https://principeai.com/assessment?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-54`
- **Image text:** Headline "Where AI «actually» pays off". Four rows: "Time · the same work takes fewer hours" / "Quality · more consistent, thorough or polished" / "Speed · customers and staff wait less" / "Revenue · win, keep or expand more business". Bottom line: "AI drafts, humans decide."
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `where-ai-pays-off`

**Title**
```text
Where AI pays off in a small business: the 4 payoffs to look for
```
_64 / 100 characters_

**Description**
```text
Before you buy another AI tool, find where AI actually pays off in your business. Every worthwhile AI project creates at least one of four payoffs: time, quality, speed or revenue. If you can't name which one, you have a demo, not a project. And the rule that keeps it safe: AI drafts, humans decide. Find your best opportunities with the free 3-minute AI Readiness Assessment from Principe AI.
```
_394 / 800 characters_

---

### VC-55 · Lead follow-up without fake deadlines

- **Board:** B7 · **Publish:** L+28 · Tue Dec 8 · 20:00 ET · **Template:** P3 Checklist (five rows)
- **Destination:** `https://principeai.com/assessment?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-55`
- **Image text:** Headline "Follow up. «No fake deadlines.»" Five rows, labelled "A starting point; adjust to your sales cycle": "Day 0 · Send the quote with a short recap of their goals" / "Day 2 · Any questions? Offer a 15-minute walkthrough" / "Day 6 · Add value: answer a common concern" / "Day 12 · A direct, friendly question: is this still a priority?" / "Day 25 · Close the loop politely".
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `lead-response-and-follow-up` ("Level 2: A follow-up system", cadence table and prompt rules)

**Title**
```text
Follow up with leads without fake deadlines: a simple AI follow-up plan
```
_71 / 100 characters_

**Description**
```text
Stop good leads going cold. This simple follow-up plan after a quote (day 0, 2, 6, 12 and 25) keeps every message specific to the person: under 100 words, something genuinely useful, one low-pressure question, no guilt-tripping and no fake deadlines. Let AI draft each follow-up and keep a person approving anything about price. See where AI fits in your business with the free 3-minute AI Readiness Assessment.
```
_411 / 800 characters_

---

### VC-56 · Your first three AI projects for 2027

- **Board:** B2 · **Publish:** L+23 · Thu Dec 3 · 20:00 ET · **Template:** P3 Checklist
- **Destination:** `https://principeai.com/assessment?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-56`
- **Image text:** Headline "Your first «three» AI projects". Rows: "1 · A quick win: live within days" / "2 · A core workflow: two to four weeks" / "3 · A growth bet: tied to revenue". Bottom line: "Earn the right to automate."
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `choose-your-first-three`

**Title**
```text
Plan 2027 with AI: how to choose your first three AI projects
```
_61 / 100 characters_

**Description**
```text
Planning AI for your small business in 2027? Start with three projects, not ten: a quick win that's live within days, a core workflow that eats real time every week, and a growth bet tied to revenue. Each one needs an owner, a baseline, digital inputs, a review rule and cheap failure. Begin with AI drafts that a person reviews and sends. Not sure which three are yours? Take the free 3-minute AI Readiness Assessment.
```
_419 / 800 characters_

---

### VC-57 · Green, Amber, Red data rules for teams

- **Board:** B6 · **Publish:** L+30 · Thu Dec 10 · 20:00 ET · **Template:** P3 Checklist (three colored rows, small traffic-light dots)
- **Destination:** `https://principeai.com/assessment?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-57`
- **Image text:** Headline "AI data rules your team will «remember»". Rows: "Green · public · OK in any approved AI tool" / "Amber · internal · approved business tools only" / "Red · restricted · stays out unless explicitly approved". Bottom line: "Anonymize before you paste."
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `business-context-safely` ("The traffic-light data rules", key takeaways)

**Title**
```text
AI data rules for small business teams: Green, Amber, Red
```
_57 / 100 characters_

**Description**
```text
A simple AI data policy your team can remember. Green (public): website content, published prices and marketing materials are OK in any approved AI tool. Amber (internal): only in business-grade tools you've approved, with training on your data turned off. Red (restricted): personal data, financial or health details, passwords and legal matters stay out unless explicitly approved. Anonymize before you paste. See where your business stands with the free AI Readiness Assessment.
```
_481 / 800 characters_

---

### VC-58 · The 5 parts of a reliable AI workflow

- **Board:** B8 · **Publish:** L+35 · Tue Dec 15 · 20:00 ET · **Template:** P3 Checklist
- **Destination:** `https://principeai.com/courses/ai-automation-accelerator/preview/anatomy-of-an-ai-workflow?utm_source=pinterest&utm_medium=social&utm_campaign=evergreen&utm_content=vc-58`
- **Image text:** Headline "The 5 parts of a «reliable» AI workflow". Chain: "Trigger → Context → Model → Action → Check". Bottom line: "A workflow without checks doesn't fail less often. It fails silently." Footer: "Free lesson · no signup · principeai.com".
- **Source:** `src/db/seed-content/course-ai-automation-accelerator.ts` → `anatomy-of-an-ai-workflow` (free preview lesson)

**Title**
```text
How AI automation works: the 5 parts of a reliable AI workflow
```
_62 / 100 characters_

**Description**
```text
Planning your first AI automation? Every reliable AI workflow has five parts: trigger, context, model, action and check. Use AI for the language and judgment step only, keep everything else predictable, and write a one-page spec with a fallback and an owner before you build anything in Zapier, Make or n8n. Read the full lesson free, with no signup: Anatomy of an AI Workflow, from the AI Automation Accelerator.
```
_413 / 800 characters_

---

## 4. Facebook (Page and Groups)

**What the Page is for.** Set it up properly now (Tier 1), but expect modest traffic from it (Tier 2 effort). It powers Meta Business Suite, Messenger replies and any future ads, and it gives the Instagram carousels a second home. Free Pages get about **2 organic link posts a month** [R], so the default is a native post with **the link in the first comment** (comment links are reportedly not counted [R]). Read Meta's help page "About links in organic Facebook Page posts and comments" inside your Page before launch to confirm the cap for your Page (UNVERIFIED).

**Times and cadence** (from the calendar): Page posts usually on Tuesday and Thursday at 9:30 ET, link in the first comment, plus every Instagram Reel shared to the Page. **Hashtags:** none.

### 4.1 Page setup

Done once in Setup (L-20 · Wed Oct 21): name, categories, bio, About (with the independence line), the website FB-1, the "Sign up" button FB-2, the cover and the settings are in [profile setup](01-profile-setup.md), section 4.6. Review the button on L+34 · Mon Dec 14: keep "Sign up", or test "Book now" if Facebook visitors book calls.

### 4.2 Inbox replies

Set up on L-13 · Wed Oct 28: the instant reply, the three FAQ answers and the three comment automations, with links FB-3 to FB-5, are in [profile setup](01-profile-setup.md), section 4.6. Questions about calls or courses get a personal reply.

---

### 4.3 Launch post

### VC-59 · Facebook launch post (a link post)

- **Post:** L+0 · Tue Nov 10 · 9:30 ET · Facebook Page · campaign `launch` · **a link post**: one of November's two planned link posts (the other is the OPTIONAL VC-72), within the roughly two a month a free Page gets
- **Format:** text with the link at the end, so Facebook shows the `/free-guide` share card. Pin it to the top of the Page ([profile setup](01-profile-setup.md), 1.1)
- **Link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=vc-59`
- **Fill in first:** `[YOUR NAME]`, `[YOUR STORY: …]`
- **Source:** `src/config/site.ts` (tagline, description); `src/content/starter-kit.ts` (subtitle, `intro`); `src/components/marketing/free-guide-landing.tsx` (FAQ: "no card required and nothing to cancel")

```text
Principe AI is live.

Learn AI. Implement AI. Grow with AI.

I'm [YOUR NAME]. [YOUR STORY: one sentence about why you started.]

Principe AI is practical AI education and implementation for business owners, professionals and everyday people: courses, coaching and done-with-you AI systems, all in plain English. No tech background needed, and no hype.

The best place to start is free. The AI Starter Kit is 50 copy-paste prompts + a 7-day plan to make AI genuinely useful in your life and work: one small, practical win a day, about 10 minutes each. There's no card required and nothing to cancel, and every prompt works with the free versions of AI assistants like Claude, ChatGPT and Gemini.

Get it here: https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=vc-59

One question for you: what's the one task you'd most like AI to take off your plate? Tell me in the comments. I'll turn the most common answers into posts.
```
_975 characters_

---

### 4.4 Page posts (VC-60 to VC-71)

**How these work.** Six reuse an Instagram carousel's slides (upload them as a multi-photo post, or let Business Suite cross-post the carousel and paste the Facebook caption below); six are native text posts. Each has its own ID and its own first comment. Post the first comment from the Page **right after publishing**, then reply to every comment for the first 15 minutes.

**Cross-posting the other carousels.** VC-03, VC-11, VC-12, VC-13, VC-14 and VC-15 also go to the Page, on the dates in their blocks (and in section 5). Reuse the Instagram caption, delete the hashtags and the last call-to-action line (the comment keyword, or "Tap … in my profile"), end with "Link in the first comment," and post the first comment from that carousel's block. Its link uses `utm_source=facebook` and keeps the carousel's ID (`utm_content=vc-13`). Cross-post any other carousel the same way only in an open slot.

---

### VC-60 · How Principe AI works (creative: VC-01)

- **Post:** L+2 · Thu Nov 12 · 9:30 ET · Facebook Page · campaign `launch` · multi-photo, VC-01 slides
- **First-comment link:** `https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=vc-60`
- **Source:** `src/app/(marketing)/page.tsx` (`PATHS`, `HOW_IT_WORKS`)

```text
How Principe AI works, in three steps.

1. Assess. Take the free AI Readiness Assessment. You'll get a readiness score, a personalized plan and an honest recommendation for where to start.
2. Learn. Short, practical lessons in plain English, or 1:1 coaching on your real work.
3. Implement. Use your new workflows straight away, or have us design and build the systems with your team.

Two paths, one goal: less busywork in your life, and AI that's actually working in your business.

Which path are you on: life, business or both? Tell me below. The assessment link is in the first comment.
```
_591 characters_

**First comment**

```text
Take the free AI Readiness Assessment here (about 3 minutes, instant results): https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=vc-60
```
_188 characters_

---

### VC-61 · One task you'd hand to AI (native question)

- **Post:** L-5 · Thu Nov 5 · 9:30 ET · Facebook Page (warm-up) · campaign `launch` · text only (or the text on a plain royal-violet background image)
- **First-comment link** (post it after you've replied to the first few answers): `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=vc-61`
- **Source:** `src/content/starter-kit.ts` (prompt categories, for your replies); the visual and community research (native question format)

```text
Quick question for everyone here:

What's one task you'd hand to AI tomorrow, if you knew it would do a good job?

A message you've been avoiding? The week's dinners? Following up on quotes? Something else?

I'll reply with a prompt you can try.
```
_245 characters_

**First comment**

```text
Want a head start? The free AI Starter Kit has 50 copy-paste prompts + a 7-day plan: https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=vc-61
```
_194 characters_

---

### VC-62 · The 5-part prompt (creative: VC-02)

- **Post:** L+7 · Tue Nov 17 · 9:30 ET · Facebook Page · campaign `launch` · multi-photo, VC-02 slides
- **First-comment link** (the free preview lesson): `https://principeai.com/courses/ai-essentials/preview/the-five-part-prompt?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=vc-62`
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `the-five-part-prompt` (opening paragraph, the five parts, "Try it now")

```text
Two people ask the same AI assistant for help with the same problem. One gets a bland, generic answer and decides AI is overhyped. The other gets something so useful they use it almost word for word.

The difference isn't luck or a paid plan. It's the prompt.

The 5-part prompt:
Role: who to act as.
Context: your situation. The most important part, and the one most people skip.
Task: exactly what you want.
Format: what the answer should look like. This one saves the most editing time.
Examples: what good looks like.

Try it on one real task this weekend, then compare the answer with your usual one-liner. What changed?

The full lesson is free to read, with no signup. Link in the first comment.
```
_702 characters_

**First comment**

```text
The 5-Part Prompt, a free lesson from AI Essentials: https://principeai.com/courses/ai-essentials/preview/the-five-part-prompt?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=vc-62
```
_202 characters_

---

### VC-63 · 3 things never to paste into an AI chat (creative: VC-04)

- **Post:** L+21 · Tue Dec 1 · 9:30 ET · Facebook Page · campaign `evergreen` · multi-photo, VC-04 slides
- **First-comment link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-63`
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `set-up-your-ai-assistant` ("The postcard rule"), `safety-ethics-and-what-never-to-share`

```text
Three things to never paste into an AI chat:

1. Passwords, PINs, security codes or recovery codes.
2. Full card numbers, bank details or government ID numbers, and medical record or insurance policy numbers.
3. Other people's private information, and confidential work material your employer hasn't approved for AI tools.

An easy rule to remember: write as if your message could be read by someone else. You can still get help with sensitive topics. "My client, a small-business owner in Ohio" works just as well as their name and address.

Save this for the next time you open an AI chat.

All 8 safety and quality tips are in the free AI Starter Kit. Link in the first comment.
```
_681 characters_

**First comment**

```text
The free AI Starter Kit, with all 8 safety and quality tips: https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-63
```
_173 characters_

---

### VC-64 · The [CHECK] rule (native text, business)

- **Post:** L+30 · Thu Dec 10 · 9:30 ET · Facebook Page · campaign `evergreen` · text only
- **First-comment link** (free preview lesson): `https://principeai.com/courses/ai-for-business/preview/business-prompt-framework?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-64`
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `business-prompt-framework` ("The [CHECK] rule")

```text
One line that stops AI from making up facts in your business documents:

"Use only the information I've provided. If something is missing or unclear, write [CHECK] instead of guessing."

AI fills gaps with plausible guesses. In business, a plausible guess about a price, a date or a promise is a liability. Add this line to every prompt that touches facts, then search the draft for [CHECK] before anything goes out.

It's a tiny habit that makes invented details far easier to catch.

It comes from a free lesson, "The Business Brief: Prompts That Produce Usable Work." Link in the first comment.
```
_597 characters_

**First comment**

```text
Read the free lesson (no signup): https://principeai.com/courses/ai-for-business/preview/business-prompt-framework?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-64
```
_193 characters_

---

### VC-65 · Where AI pays off (creative: VC-05)

- **Post:** L+23 · Thu Dec 3 · 9:30 ET · Facebook Page · campaign `evergreen` · multi-photo, VC-05 slides
- **First-comment link:** `https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-65`
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `where-ai-pays-off`

```text
Where does AI actually pay off in a small business? Every worthwhile AI project creates at least one of four payoffs:

Time: the same work takes fewer hours.
Quality: work is more consistent, thorough or polished.
Speed: customers and staff wait less.
Revenue: you win, keep or expand more business.

If you can't name which one a project creates, you don't have a project yet. You have a demo.

Business owners: which of the four would matter most to you this quarter?

Find your best opportunities with the free 3-minute AI Readiness Assessment. Link in the first comment.
```
_574 characters_

**First comment**

```text
The free AI Readiness Assessment (about 3 minutes): https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-65
```
_164 characters_

---

### VC-66 · 5 prompts for busy parents (creative: VC-06)

- **Post:** L+28 · Tue Dec 8 · 9:30 ET · Facebook Page · campaign `evergreen` · multi-photo, VC-06 slides
- **First-comment link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-66`
- **Source:** `src/content/starter-kit.ts` (the five prompts named in VC-06, `tips` 3)

```text
5 AI prompts for busy parents (the exact wording is in the photos):

1. A week of dinners plus one grocery list, grouped by store section.
2. A realistic plan for the week, with an honest list of what won't fit.
3. A fair chore chart you can print and stick on the fridge.
4. A bedtime story starring the hero of your choice, with a gentle lesson.
5. Homework help that asks guiding questions instead of giving the answer.

They all work with the free versions of AI assistants like Claude, ChatGPT and Gemini. One habit: remove names and personal details before you paste anything.

Which one are you trying first?

The other 45 prompts are in the free AI Starter Kit. Link in the first comment.
```
_696 characters_

**First comment**

```text
Get all 50 prompts + the 7-day plan, free: https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-66
```
_155 characters_

---

### VC-67 · AI tends to agree with you (native text)

- **Post:** L+37 · Thu Dec 17 · 9:30 ET · Facebook Page · campaign `evergreen` · text only
- **First-comment link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-67`
- **Source:** `src/content/starter-kit.ts` → `tips` 7, Research & decisions → "Devil's advocate"; `src/db/seed-content/course-ai-essentials.ts` → `why-ai-makes-things-up` ("It's built to be agreeable")

```text
Ever noticed that AI tends to agree with you?

Assistants are trained to be helpful, which can tip into telling you what you want to hear. "Isn't this a great plan?" gets a very different answer than "What are the weaknesses in this plan?"

When you want a real second opinion, try this:

Here's what I'm leaning toward and why: [YOUR REASONING]
Give me the strongest honest case against it. Don't soften it.
Then tell me which of my reasons hold up best.

What decision would you run through it this week?

It's one of 50 prompts in the free AI Starter Kit. Link in the first comment.
```
_585 characters_

**First comment**

```text
The free AI Starter Kit (50 prompts + a 7-day plan): https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-67
```
_165 characters_

---

### VC-68 · Thanksgiving, planned (creative: VC-08)

- **Post:** L+9 · Thu Nov 19 · 9:30 ET · Facebook Page · campaign `launch` **FIXED** · multi-photo, VC-08 slides
- **First-comment link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=vc-68`
- **Source:** `src/content/starter-kit.ts` (the four prompts named in VC-08); `src/db/seed-content/course-ai-essentials.ts` → `plan-anything`

```text
Hosting Thanksgiving? Here are 4 AI prompts that do the planning with you (the exact wording is in the photos):

1. A timeline from now until the day, plus a budget breakdown.
2. Games and activities for every age at the table.
3. A toast that sounds like you, not like a greeting card.
4. The week after: dinners that use up the leftovers, with one grocery list.

AI drafts the plan; you confirm prices, hours and anything you'll pay for. And if anyone has an allergy, read the labels yourself.

Hosting this year? Save this for next week.

All 50 prompts are free in the AI Starter Kit. Link in the first comment.
```
_615 characters_

**First comment**

```text
The free AI Starter Kit: https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=launch&utm_content=vc-68
```
_134 characters_

---

### VC-69 · Follow up without fake deadlines (native text, business)

- **Post:** L+14 · Tue Nov 24 · 9:30 ET · Facebook Page · campaign `evergreen` · text only
- **First-comment link:** `https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-69`
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `lead-response-and-follow-up` (opening, cadence table, prompt rules, key takeaways)

```text
For many small businesses, the cheapest new revenue comes from leads they already have.

Inquiries get answered late, quotes never get followed up, "not right now" prospects are never contacted again. That's not a marketing problem; it's a follow-up problem.

A simple cadence after a quote (a starting point; adjust it to your sales cycle):
Day 0: send the quote with a short recap of their goals.
Day 2: any questions? Offer a 15-minute walkthrough.
Day 6: add value. Answer a common concern.
Day 12: a direct, friendly question: is this still a priority?
Day 25: close the loop politely.

Let AI draft each message, keep every one specific to the person, and keep a person approving anything about price. No guilt-tripping and no fake deadlines.

Want to see where AI fits in your business first? The free 3-minute AI Readiness Assessment is in the first comment.
```
_866 characters_

**First comment**

```text
The free AI Readiness Assessment: https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-69
```
_146 characters_

---

### VC-70 · The 5 parts of a reliable AI workflow (creative: VC-09)

- **Post:** L+35 · Tue Dec 15 · 9:30 ET · Facebook Page · campaign `evergreen` · multi-photo, VC-09 slides
- **First-comment link** (free preview lesson): `https://principeai.com/courses/ai-automation-accelerator/preview/anatomy-of-an-ai-workflow?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-70`
- **Source:** `src/db/seed-content/course-ai-automation-accelerator.ts` → `anatomy-of-an-ai-workflow`

```text
Most AI automations that disappoint fail for the same reason: someone dropped an AI step between two apps and hoped for the best.

The ones that run quietly for months share five parts:
Trigger: the event that starts a run.
Context: everything the model needs to do this job well.
Model: one clear instruction in, one well-defined output out.
Action: what happens with that output.
Check: how you know it worked, and what happens when it didn't.

A workflow without checks doesn't fail less often. It fails silently.

Building anything in Zapier, Make or n8n yet? What's the first task you'd automate?

The full lesson, Anatomy of an AI Workflow, is free to read with no signup. Link in the first comment.
```
_705 characters_

**First comment**

```text
Anatomy of an AI Workflow, a free lesson from the AI Automation Accelerator: https://principeai.com/courses/ai-automation-accelerator/preview/anatomy-of-an-ai-workflow?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-70
```
_246 characters_

---

### VC-71 · Which AI tier are you? (native text)

- **Post:** L+42 · Tue Dec 22 · 9:30 ET · Facebook Page · campaign `evergreen` · text only
- **First-comment link:** `https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-71`
- **Source:** `src/lib/assessment.ts` → `TIERS`; `src/app/(marketing)/assessment/page.tsx` → `WHAT_YOU_GET`

```text
Which of these sounds most like you right now?

Explorer: ready for your first real wins with AI.
Experimenter: time to turn experiments into habits.
Implementer: ready to build real workflows.
Scaler: ready to scale with AI systems.

Reply with your tier. There's no wrong answer, and none of them needs a tech background.

Want to know for sure? The free AI Readiness Assessment takes about 3 minutes and gives you a score out of 100, your tier and a personalized action plan. Link in the first comment.
```
_505 characters_

**First comment**

```text
Find your tier with the free AI Readiness Assessment: https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-71
```
_166 characters_

---

### 4.5 Black Friday (optional)

### VC-72 · Black Friday promotion (only if you set a real one)

- **Post:** L+17 · Fri Nov 27 · 9:30 ET on the Facebook Page (a link post: November's second, after VC-59) and the same day as a 3-frame Instagram Story · campaign `bf-2026` **OPTIONAL** **FIXED** **PRICE**. If the promotion runs through Cyber Monday, re-share the Story frames on L+20 · Mon Nov 30 with the real end time
- **Decide by L+10 · Fri Nov 20** (calendar checkpoint): a real Stripe promotion code with a real end date, created by L+13 · Mon Nov 23, or no promotion. If no, skip VC-72; VC-11 still posts that day as a value post
- **Before posting:** create a real promotion: a Stripe promotion code (checkout already allows codes, per `src/lib/payments.ts`) with a real end date. **No struck-through "was" price** (`src/db/seed-content/courses.ts` allows one only at a price the course has genuinely sold at, and the courses will have only a few weeks of price history), no countdown to a sale, and no "last chance" unless it really ends. Check every price in Admin → Courses
- **Links:** Facebook `https://principeai.com/courses?utm_source=facebook&utm_medium=social&utm_campaign=bf-2026&utm_content=vc-72` · Instagram Story link sticker `https://principeai.com/courses?utm_source=instagram&utm_medium=social&utm_campaign=bf-2026&utm_content=vc-72`
- **Fill in first:** `[YOUR OFFER: …]`, `[DATE AND TIME, ET]`
- **Source:** the three course seed files (titles, prices, lesson counts); the [content bank](07-content-bank.md) seasonal shortlist; [tools, measurement and compliance](08-tools-measurement-compliance.md), 4.6

**Facebook post**

```text
[OPTIONAL: post this only if you've set up a real promotion.]

Black Friday at Principe AI: [YOUR OFFER: e.g. "15% off any course with code XXXX, entered at checkout"], until [DATE AND TIME, ET].

AI Essentials: Use AI in Everyday Life. $47, 18 lessons, for beginners.
AI for Business Owners: The Implementation Playbook. $297, 20 lessons.
AI Automation Accelerator: Build Workflows & Agents. $497, 18 lessons.

Not sure which fits? Read a free preview lesson first, or take the free 3-minute AI Readiness Assessment; it recommends a starting point.

https://principeai.com/courses?utm_source=facebook&utm_medium=social&utm_campaign=bf-2026&utm_content=vc-72
```
_658 characters_

**Instagram Story (3 frames)**

1. **S1.** "Black Friday at Principe AI: «[YOUR OFFER: …]»". Small line: "Until [DATE AND TIME, ET]".
2. **S1.** The three course names with their prices, Geist 40 px.
3. **S1 + link sticker** ("See the courses"). "Read a «free» lesson first. No signup."

---

### 4.6 Your own Facebook Group: the decision

**Decision: yes, start a free group, but not now. Open it on L+55 · Mon Jan 4, 2027, with a 7-Day AI Starter Challenge, if the L+34 · Mon Dec 14 check below passes.**

Why:

1. **An empty group is a ghost town.** At launch you have no audience to seed it, and the Instagram, Facebook Page and Pinterest work in this kit already fills its share of your week (calendar, section 2). A group adds hosting and moderation every week once it's live.
2. **You can get most of the benefit now without owning one.** Business owners already ask AI questions in existing groups. Answering there from L+7 · Tue Nov 17 (4.7) builds the same trust, with no moderation load.
3. **January is the natural start.** The New Year "learn a new skill" season gives a reason to join, and the Starter Kit's 7-day plan is ready-made challenge content: one day per post. The [short-video kit](03-short-video-kit.md) runs its own 7-Day AI Challenge the same week (L+55 to L+61 · Jan 4 to 10), so the two promote each other.
4. **It's the one Meta surface with no link rationing.** In your own group, your rules decide when a link is welcome, so it becomes a dependable home for the free offers and a place to hear real questions in customers' own words.
5. **It suits the higher-value offers.** Coaching and done-with-you work are bought on trust, and a group is where trust compounds.

**Go/no-go check on L+34 · Mon Dec 14.** Open the group on Jan 4 only if you can personally invite at least 25 people who have already engaged with you (commented, replied to a Story, messaged, or opted in). That threshold is a judgment call, not platform data; pick your own, but pick one in advance. If you're short, run the challenge on the Page and Instagram instead and check again in March.

**Name and audience.** `Practical AI for Small Business Owners (by Principe AI)`, or `Practical AI Made Simple (by Principe AI)` if you'd rather serve both paths (then keep the Monday and Wednesday posts general and alternate life and business examples). Why business owners only: a group works best when members share one identity and one kind of problem. Small business owners, freelancers and solopreneurs are also the buyers of coaching, the business course and done-with-you work, and they're the people in the groups you'll be answering in (4.7). The "For your life" path is served by Instagram and Pinterest.

**Setup** (L+53 · Sat Jan 2 or L+54 · Sun Jan 3, if the group is a go): create it as the Page, private, with Admin Assist and the group description, as in [profile setup](01-profile-setup.md), section 6.3. Turn on the group rules agreement for new members [V].

**Membership questions** (the exact number allowed is UNVERIFIED; these are three)

```text
1. What's one task you'd love AI to help with?
2. Do you run a business, or are you exploring AI for yourself?
3. Which AI assistants do you use today, if any?
```
_159 characters_

Don't collect email addresses in membership questions: whether Meta's current group terms allow it is UNVERIFIED, and the site's own opt-in (`/free-guide`) is the consented route. The welcome post links to it instead.

**Group rules** (paste each title and description into Group settings → Rules)

```text
1. Be kind, and no question is too basic
Everyone started somewhere. Assume good intent and answer the way you'd want to be answered.

2. No unsolicited DMs or pitches
Don't message members to sell anything. If someone does this to you, report it to the admins.

3. Self-promotion only in the Friday thread
Share your business, offer or link in the Friday wins and promo thread, once a week. Anywhere else, it will be removed.

4. No fake results or income claims
Share real experiences and say when results vary. No "make $X with AI" posts, and no reviews or testimonials written by AI.

5. Protect privacy
Never post client data, other people's personal details, passwords, or screenshots that show them.
```
_706 characters_

**Weekly rhythm**

| When (from the calendar) | Post | ID |
|---|---|---|
| L+55 · Mon Jan 4 · 9:00 ET, then pinned as Featured | Welcome post | VC-73 |
| Mondays at 9:00 ET from L+62 · Mon Jan 11 | "What do you want AI to help with this week?" plus new-member welcome | VC-74 |
| Wednesdays at 9:00 ET from L+64 · Wed Jan 13 | Prompt of the week | VC-75 |
| Fridays at 9:00 ET from L+66 · Fri Jan 15 | Wins and promo thread | VC-76 |
| Once a month: first announced L+72 · Thu Jan 21, live L+79 · Thu Jan 28 · 19:00 ET | Live Q&A, 30 minutes, you on camera (no-face option: a text "ask me anything" thread at the same time) | VC-77 |
| L+55 to L+61 · Mon Jan 4 to Sun Jan 10 only | 7-Day AI Starter Challenge, one post a day | VC-78 |

**If the group is a no-go,** retire VC-73 to VC-77 and post VC-78 on the Facebook Page each day instead (same link).

---

### VC-73 · Group welcome post (pin it as Featured)

- **Post:** L+55 · Mon Jan 4 · 9:00 ET · Facebook Group · campaign `ny-2027`
- **Link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-73`
- **Fill in first:** `[YOUR NAME]`
- **Source:** `src/content/starter-kit.ts` (subtitle, `tips` 3); this section's rules and rhythm

```text
Welcome to Practical AI for Small Business Owners!

I'm [YOUR NAME], founder of Principe AI. This group is for business owners, freelancers and solopreneurs who want AI to do real work, without the hype.

How it works here:
Monday: tell us what you want AI to help with this week.
Wednesday: prompt of the week, with a copy-paste prompt to try.
Friday: wins and promo thread. Share what worked, and promote your own business there (and only there).
Once a month: a live Q&A. Bring any AI question.

Start here:
1. Introduce yourself in the comments: your business, and one task you'd love to hand to AI.
2. Read the 5 group rules.
3. Grab the free AI Starter Kit (50 copy-paste prompts + a 7-day plan): https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-73

Everything we share works with AI assistants like Claude, ChatGPT and Gemini. One rule before you paste anything into them: if it's client data, a password or someone else's personal details, keep it out.
```
_1,019 characters_

### VC-74 · Monday thread

- **Post:** Mondays: L+62 · Mon Jan 11 · 9:00 ET; L+69 · Mon Jan 18 · 9:00 ET; L+76 · Mon Jan 25 · 9:00 ET · campaign `ny-2027`
- **Link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-74`
- **Fill in first:** `[TAG NEW MEMBERS]`
- **Source:** the visual and community research (weekly rhythm); `src/content/starter-kit.ts` (Day 1)

```text
Monday thread: what do you want AI to help with this week?

Reply with one task: a message you've been avoiding, a quote to write, follow-ups to send, a process to document, anything. Other members and I will reply with a prompt or an approach to try.

Welcome to everyone who joined this week! [TAG NEW MEMBERS] Tell us about your business below.

New here? Day 1 of the free Starter Kit is a good first step: https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-74
```
_521 characters_

### VC-75 · Wednesday prompt of the week (first one filled in)

- **Post:** Wednesdays: L+64 · Wed Jan 13 · 9:00 ET; L+71 · Wed Jan 20 · 9:00 ET; L+78 · Wed Jan 27 · 9:00 ET · campaign `ny-2027`. Each week, swap in a different Business & marketing or Work & career prompt from the kit and keep the same shape
- **Link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-75`
- **Source:** `src/content/starter-kit.ts` → Business & marketing → "Reply to a customer review"

```text
Prompt of the week: reply to a customer review, good or bad.

Here's a customer review of my business: [PASTE REVIEW]
Write a warm, professional reply that thanks them, honestly addresses any specific concerns, and [INVITES THEM BACK / OFFERS TO RESOLVE IT PRIVATELY].
Under 80 words, and not defensive.

Why it works: it tells the AI exactly what a good reply does, and the last line keeps the tone from getting defensive. Read the draft before you post it.

Try it on a real review and share the before and after in the comments, with names removed. More prompts like this: https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-75
```
_686 characters_

### VC-76 · Friday wins and promo thread

- **Post:** Fridays: L+66 · Fri Jan 15 · 9:00 ET; L+73 · Fri Jan 22 · 9:00 ET; L+80 · Fri Jan 29 · 9:00 ET · campaign `ny-2027`
- **Link:** in your own first comment (below)
- **Fill in first:** `[YOUR NAME]`
- **Source:** group rule 3; `src/app/(marketing)/assessment/page.tsx` (offer facts)

```text
Friday wins and promo thread!

1. Share one thing AI helped you with this week: a prompt that worked, a task you finished, or a lesson learned. Real experiences only, please. Results vary, and that's fine.
2. Promote your business: one comment each with what you do, who you help and a link. This is the only place in the group for self-promotion.

I'll go first in the comments.
```
_379 characters_

**Your first comment**

```text
[YOUR NAME] here. I run Principe AI: courses, coaching and done-with-you AI systems for business owners, in plain English. If you're not sure where AI fits in your business, the free 3-minute AI Readiness Assessment is a good start: https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-76
```
_343 characters_

### VC-77 · Monthly live Q&A announcement

- **Post:** L+72 · Thu Jan 21 · 9:00 ET, one week before the first live session (L+79 · Thu Jan 28 · 19:00 ET, 30 minutes); after that, one week before each monthly session · campaign `ny-2027`
- **No-face option:** run the session as a text "ask me anything" thread at the same time, and change "I'll answer live for 30 minutes" to "I'll answer in the comments for 30 minutes"
- **Link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-77`
- **Fill in first:** `[DATE AND TIME, ET]`, `[CONFIRM: …]`
- **Source:** the visual and community research (monthly live Q&A)

```text
Live Q&A: [DATE AND TIME, ET], right here in the group.

Bring any AI question: which tool to use, how to word a prompt, whether something is safe to paste, or what to automate first. I'll answer live for 30 minutes and share a prompt for every question I can.

Drop your question in the comments now and I'll start with those.

[CONFIRM: you'll keep the recording up] Can't make it? The recording stays in the group.

Want something to try before then? https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-77
```
_564 characters_

### VC-78 · 7-Day AI Starter Challenge (Day 1 written out)

- **Post:** teaser Story on Instagram L+53 · Sat Jan 2 · 10:00 ET · campaign `ny-2027`
- **In the group** (campaign `ny-2027`): Day 1 L+55 · Mon Jan 4 · 12:00 ET (after the welcome post); Day 2 L+56 · Tue Jan 5 · 9:00 ET; Day 3 L+57 · Wed Jan 6 · 9:00 ET; Day 4 L+58 · Thu Jan 7 · 9:00 ET; Day 5 L+59 · Fri Jan 8 · 9:00 ET; Day 6 L+60 · Sat Jan 9 · 9:00 ET; Day 7 L+61 · Sun Jan 10 · 9:00 ET. If the group is a no-go, post each day on the Facebook Page instead (same link)
- **Teaser Story link sticker** ("Get the 7-day plan"): `https://principeai.com/free-guide?utm_source=instagram&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-78`
- **Link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-78`
- **Days 2–7:** use the same shape. Copy each day's title, goal, steps and prompt word for word from `src/content/starter-kit.ts` → `days` (Day 2 "Learn the 5-part prompt" through Day 7 "Build your AI toolkit")
- **Source:** `src/content/starter-kit.ts` → Day 1

**Teaser Story (L+53 · Sat Jan 2, 2 frames)**

1. **S1 Text.** "7-Day AI Starter Challenge starts «Monday»." Small line: "One small win a day, about 10 minutes each · Jan 4 to 10 · free".
2. **S1 Text + link sticker.** "Get the free 7-day «plan» now." Small line: "Free AI Starter Kit · no card required".

**Day 1 post**

```text
7-Day AI Starter Challenge · Day 1 of 7: Meet your AI assistant

Today's goal: set up a free AI assistant safely and have your first genuinely useful conversation.

Steps (about 10 minutes):
1. Go to the official website or app for one of the AI assistants like Claude, ChatGPT and Gemini, and create a free account. Check the developer name if you download an app.
2. Open the settings and find the privacy and data controls. Choose what you're comfortable with, including whether your chats can be used for training.
3. Copy today's prompt, replace the part in [BRACKETS], and answer the questions it asks you.
4. Pick one of its suggestions and try it before the day is over.

Today's prompt:
I'm new to AI assistants and I'd like you to help make my everyday life easier.
A little about me: [YOUR ROLE OR SITUATION, E.G. "NURSE AND PARENT OF TWO"].
Ask me 5 short questions about my routine, work and goals, one at a time.
Then suggest 5 specific ways you could help me this week, one sentence each.

Reply "Done" with one suggestion it gave you. Stuck? Ask below.

The full 7-day plan, plus 50 prompts, is in the free AI Starter Kit: https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=ny-2027&utm_content=vc-78
```
_1,249 characters_

---

### 4.7 Other people's groups: answer first, link rarely

**Start L+7 · Tue Nov 17** (calendar): join 5 to 8 groups and post VC-79 where introductions are welcome. After that, use the **Tuesday and Thursday community slots** of the daily 20-minute engagement block (calendar 3.1) for VC-80 to VC-82.

**The rules (break one and you look like spam to members, moderators and probably Meta's systems; Meta's exact thresholds are UNVERIFIED)**

1. **Post from your personal profile,** with "Founder, Principe AI" in your intro and work field. A Page can only *request* to join a group, and many groups don't admit Pages [V]; peer advice also reads as more trustworthy.
2. **Pick 5–8 active groups** where your buyers are: small business owner groups, solopreneur and freelancer groups, local business and chamber groups, industry groups (real estate, coaching, bookkeeping, trades) and AI-for-beginners groups. Look for daily posts and active moderators; skip link-dump groups. No specific groups were vetted in research.
3. **Read each group's pinned rules first** and log them: group name, link, a short name for UTM tags (`smallbizowners`), its promo regime (no promo at all, a weekly promo thread, a monthly cap, or reply-only) and its promo day [R].
4. **Answer 3–5 real questions fully** each session, with the prompt or the steps inside the answer. The answer is the value; a link is never the answer.
5. **Links only where allowed:** in the official promo thread, or when someone asks for a recommendation and the rules permit it. Tag them `utm_content=vc-83-[group-shortname]` (or the template's own ID) so Admin → Contacts shows which group a lead came from. The links below say `evergreen`; the campaign goes by date, so use `launch` until L+13 · Mon Nov 23 and `ny-2027` from Sat Jan 2.
6. **Never post the same link or the same promo in several groups in a row,** and never paste one answer into several groups unchanged; adapt it to the question.
7. **Disclose that it's yours** whenever you mention Principe AI ("Full disclosure: I run Principe AI").
8. **No cold DMs** to members, and no "comment KIT and I'll DM you" in anyone else's group.

---

### VC-79 · Introduce yourself (in a group's intro thread)

- **Use:** as needed from L+7 · Tue Nov 17: the first week in each new group, only where the group has an intro thread or asks for introductions
- **Link:** none in the intro. If the group allows links in intros and someone asks: `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-79-[group-shortname]`
- **Fill in first:** `[YOUR NAME]`, `[YOUR STORY: …]`
- **Source:** `src/config/site.ts` (description); `src/app/(marketing)/about/page.tsx` (values: "Practical over hype", "Plain English, always")

```text
Hi everyone, I'm [YOUR NAME]. I help business owners and everyday people use AI for real work, in plain English, through Principe AI. [YOUR STORY: one sentence about why you started.]

I'm here to learn how you all run your businesses, and to help where I can. If you're stuck on something AI-related (a prompt that keeps giving generic answers, whether something is safe to paste, what to automate first), ask away and I'll answer in the thread.
```
_446 characters_

### VC-80 · Answer: "How do I stop AI sounding generic or robotic?"

- **Use:** as needed from L+7 · Tue Nov 17, in the Tue and Thu community slots: as a reply when someone asks this (adapt the first line to their wording)
- **Link:** only if they ask for more: `https://principeai.com/courses/ai-essentials/preview/emails-and-messages?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-80-[group-shortname]`
- **Source:** `src/db/seed-content/course-ai-essentials.ts` → `emails-and-messages` ("Keeping your own voice", free preview lesson) and `the-five-part-prompt` ("2. Context")

```text
Two things usually fix this:

1. Give it context. Your assistant has never met you. Tell it who you are, who the message is for and what you're trying to achieve.
2. Give it a sample and ban the clichés. Paste two or three messages you've written and say "Match this tone and style." Then add: "Avoid phrases like 'I hope this email finds you well' and 'Don't hesitate to reach out.'"

Then do the final edit yourself: change a word or two and add a personal detail. That last 10 percent makes it yours.

Happy to help you tweak a specific one if you want to share it here, with names removed.
```
_593 characters_

### VC-81 · Answer: "Is it safe to put client information into AI?"

- **Use:** as needed from L+7 · Tue Nov 17, in the Tue and Thu community slots: as a reply when someone asks about data safety
- **Link:** only if they ask for more: `https://principeai.com/assessment?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-81-[group-shortname]`
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `business-context-safely` ("The traffic-light data rules", "Know your tool's settings", "Anonymize before you paste")

```text
Good question to ask before, not after. A simple rule that's easy to remember is Green, Amber, Red:

Green (public): website content, published prices, marketing materials. Fine in any approved AI tool.
Amber (internal): internal processes, unpublished pricing, anonymized customer scenarios. Only in business-grade tools you've approved, with training on your data turned off.
Red (restricted): personal data about customers or staff, financial or health details, account numbers, passwords, legal matters. Keep it out unless the business has approved a specific tool and process in writing.

And anonymize before you paste: "a residential customer was charged twice for the same invoice" works as well as their name and invoice number. Check your own tool's training and retention settings too, because providers change their terms.
```
_834 characters_

### VC-82 · Value post: one line that catches invented details

- **Use:** as needed from L+7 · Tue Nov 17, in the Tue and Thu community slots: as an original post, only in groups whose rules allow members to post tips. At most one group a week, never the same week in two groups
- **Link:** none in the post. If someone asks: `https://principeai.com/courses/ai-for-business/preview/business-prompt-framework?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-82-[group-shortname]`
- **Source:** `src/db/seed-content/course-ai-for-business.ts` → `business-prompt-framework` ("The [CHECK] rule", "Make it critique itself") and `proposals-and-sales-calls` (the [PRICE] line)

```text
A one-line habit for anyone using AI to draft quotes, proposals or client emails.

Add this to the prompt: "Use only the information I've provided. If something is missing or unclear, write [CHECK] instead of guessing."

Why: AI fills gaps with plausible guesses, and in business a plausible guess about a price, a date or a promise is a liability. With that line in place, search the draft for [CHECK] before it goes out and fill those in yourself.

Two more that pair well with it:
- "Leave every price as [PRICE]. I'll add pricing from our price list."
- "Check your draft against my constraints, list anything it misses, then fix it."

What other checks do you all use before AI-drafted work goes to a client?
```
_713 characters_

### VC-83 · Promo thread, or a reply when someone asks for a recommendation

- **Use:** only where the group's rules allow links: (a) in a group's official weekly promo thread; (b) as a reply when someone asks where to start with AI and the rules allow recommendations. Never both in the same group in the same week
- **Link:** `https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-83-[group-shortname]`
- **Fill in first:** `[group-shortname]` in the link
- **Source:** `src/content/starter-kit.ts` (subtitle, `intro`); `src/components/marketing/free-guide-landing.tsx` (FAQ)

**(a) Promo thread**

```text
I run Principe AI: practical AI for business owners and everyday people, in plain English. This week's free resource is the AI Starter Kit: 50 copy-paste prompts + a 7-day plan, about 10 minutes a day, no card required. https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-83-[group-shortname] Happy to answer any AI question in the comments.
```
_399 characters_

**(b) Reply to "where should I start with AI?"**

```text
Full disclosure: I run Principe AI, so take this with that in mind.

If you want a practical place to start, the free AI Starter Kit is 50 copy-paste prompts + a 7-day plan, about 10 minutes a day, with no card required: https://principeai.com/free-guide?utm_source=facebook&utm_medium=social&utm_campaign=evergreen&utm_content=vc-83-[group-shortname]

If you run a business and want to know where AI would help most, there's also a free 3-minute AI Readiness Assessment on the same site. Happy to answer questions here either way.
```
_531 characters_

---

## 5. When each post goes out

The [launch calendar](02-launch-calendar.md) decides every date; this table copies its appendix for this kit's posts. If a date moves, change it in the calendar first, then change only `utm_campaign` in that block's links (1.1). Times are ET. Stories are posted live; everything else can be scheduled ahead (Meta Business Suite for Instagram and Facebook, Buffer Free or Metricool Free for Pinterest, or Postiz). Instagram Reels and their Facebook copies are in the [short-video kit](03-short-video-kit.md).

| ID | Post | When (L · date · ET) and where | Campaign |
|---|---|---|---|
| VC-01 | Start here: how Principe AI works | L+1 · Wed Nov 11 · 12:30 ET · Instagram feed **CONFIRM** | `launch` |
| VC-02 | The 5-part prompt | L+4 · Sat Nov 14 · 12:30 ET · Instagram feed | `launch` |
| VC-03 | 7 days to make AI genuinely useful | L+6 · Mon Nov 16 · 12:30 ET · Instagram feed<br>L+56 · Tue Jan 5 · 9:30 ET · Facebook Page (cross-post) | `launch`, `ny-2027` |
| VC-04 | 3 things never to paste into an AI chat | L+8 · Wed Nov 18 · 12:30 ET · Instagram feed | `launch` |
| VC-05 | Where AI pays off in a small business | L+11 · Sat Nov 21 · 12:30 ET · Instagram feed | `launch` |
| VC-06 | 5 prompts for busy parents | L+14 · Tue Nov 24 · 12:30 ET · Instagram feed | `evergreen` |
| VC-07 | Fact-check any AI answer in 3 minutes | L-5 · Thu Nov 5 · 12:30 ET · Instagram feed | `launch` |
| VC-08 | Thanksgiving, planned: 4 AI prompts | L+7 · Tue Nov 17 · 12:30 ET · Instagram feed **FIXED** | `launch` |
| VC-09 | The 5 parts of a reliable AI workflow | L+24 · Fri Dec 4 · 12:30 ET · Instagram feed | `evergreen` |
| VC-10 | How ready are you to put AI to work? 5 questions | L+59 · Fri Jan 8 · 12:30 ET · Instagram feed<br>L+59 · Fri Jan 8 · 20:00 ET · Pinterest (cut) | `ny-2027`, `evergreen` |
| VC-11 | Ask before you click: an AI scam check | L+17 · Fri Nov 27 · 12:30 ET · Instagram feed **FIXED**<br>L+20 · Mon Nov 30 · 9:30 ET · Facebook Page (cross-post) **FIXED** | `evergreen` |
| VC-12 | Green, Amber, Red: the AI data rule your team will remember | L+31 · Fri Dec 11 · 12:30 ET · Instagram feed<br>L+63 · Tue Jan 12 · 9:30 ET · Facebook Page (cross-post) | `evergreen`, `ny-2027` |
| VC-13 | Your AI agrees with you too much: 3 prompts for an honest second opinion | L+66 · Fri Jan 15 · 12:30 ET · Instagram feed<br>L+66 · Fri Jan 15 · 20:00 ET · Pinterest (cut)<br>L+70 · Tue Jan 19 · 9:30 ET · Facebook Page (cross-post)<br>L+79 · Thu Jan 28 · 20:00 ET · Pinterest (new design) | `ny-2027`, `evergreen` |
| VC-14 | Your first three AI projects for 2027 | L+49 · Tue Dec 29 · 9:30 ET · Facebook Page (cross-post) **FIXED**<br>L+49 · Tue Dec 29 · 12:30 ET · Instagram feed **FIXED**<br>L+56 · Tue Jan 5 · 20:00 ET · Pinterest (cut) | `evergreen` |
| VC-15 | Which way in? Courses, coaching or done-with-you | L+73 · Fri Jan 22 · 12:30 ET · Instagram feed **PRICE** **CONFIRM**<br>L+73 · Fri Jan 22 · 20:00 ET · Pinterest (cut)<br>L+77 · Tue Jan 26 · 9:30 ET · Facebook Page (cross-post) **PRICE** | `ny-2027`, `evergreen` |
| VC-16 | Story day 1: Launch day: "It's live" | L+0 · Tue Nov 10 · 9:30 ET · Instagram Story | `launch` |
| VC-17 | Story day 2: Share VC-01 ("Start here") | L+1 · Wed Nov 11 · 13:00 ET · Instagram Story | `launch` |
| VC-18 | Story day 3: Question box | L+2 · Thu Nov 12 · 19:15 ET · Instagram Story | `launch` |
| VC-19 | Story day 4: Quiz: the part everyone skips | L+3 · Fri Nov 13 · 19:15 ET · Instagram Story | `launch` |
| VC-20 | Story day 5: Share VC-02 (the 5-part prompt) | L+4 · Sat Nov 14 · 13:00 ET · Instagram Story | `launch` |
| VC-21 | Story day 6: Your answers | L+5 · Sun Nov 15 · 19:15 ET · Instagram Story | `launch` |
| VC-22 | Story day 7: Share VC-03 (the 7-day plan) | L+6 · Mon Nov 16 · 13:00 ET · Instagram Story | `launch` |
| VC-23 | Story day 8: Quiz: what's safe to paste? | L+7 · Tue Nov 17 · 19:15 ET · Instagram Story | `launch` |
| VC-24 | Story day 9: Share VC-04 (never paste) | L+8 · Wed Nov 18 · 13:00 ET · Instagram Story | `launch` |
| VC-25 | Story day 10: Business: email or follow-ups? | L+9 · Thu Nov 19 · 19:15 ET · Instagram Story | `launch` |
| VC-26 | Story day 11: Ask me anything about AI | L+10 · Fri Nov 20 · 19:15 ET · Instagram Story | `launch` |
| VC-27 | Story day 12: Share VC-05 (where AI pays off) | L+11 · Sat Nov 21 · 13:00 ET · Instagram Story | `launch` |
| VC-28 | Story day 13: Answers, and why I started | L+12 · Sun Nov 22 · 19:15 ET · Instagram Story | `launch` |
| VC-29 | Story day 14: Next week, and a countdown | L+13 · Mon Nov 23 · 10:00 ET · Instagram Story | `launch` |
| VC-30 | Highlight: Start Here | L-9 · Sun Nov 1 · 10:00 ET · Instagram Story, saved to its Highlight | `evergreen` |
| VC-31 | Highlight: Free Kit | L-9 · Sun Nov 1 · 10:00 ET · Instagram Story, saved to its Highlight | `evergreen` |
| VC-32 | Highlight: AI Quiz | L-9 · Sun Nov 1 · 10:00 ET · Instagram Story, saved to its Highlight | `evergreen` |
| VC-33 | Highlight: Courses | L-9 · Sun Nov 1 · 10:00 ET · Instagram Story, saved to its Highlight | `evergreen` |
| VC-34 | Highlight: For Business | L-9 · Sun Nov 1 · 10:00 ET · Instagram Story, saved to its Highlight | `evergreen` |
| VC-35 | Highlight: FAQ | L-9 · Sun Nov 1 · 10:00 ET · Instagram Story, saved to its Highlight | `evergreen` |
| VC-36 | Channel welcome message | Reserve: when Instagram opens Broadcast Channels to you (1,000+ followers) | `evergreen` |
| VC-37 | Weekly prompt message (template, first example filled in) | Reserve: when Instagram opens Broadcast Channels to you (1,000+ followers) | `evergreen` |
| VC-38 | Weekly poll message | Reserve: when Instagram opens Broadcast Channels to you (1,000+ followers) | `evergreen` |
| VC-39 | Weekly meal plan and grocery list prompt | L+2 · Thu Nov 12 · 20:00 ET · Pinterest | `evergreen` |
| VC-40 | Thanksgiving dinner planning prompt | L-6 · Wed Nov 4 · 20:00 ET · Pinterest **FIXED** | `evergreen` |
| VC-41 | Holiday trip itinerary prompt | L+4 · Sat Nov 14 · 20:00 ET · Pinterest | `evergreen` |
| VC-42 | Thoughtful gift ideas prompt | L+7 · Tue Nov 17 · 20:00 ET · Pinterest | `evergreen` |
| VC-43 | Simple monthly budget prompt | L+21 · Tue Dec 1 · 20:00 ET · Pinterest | `evergreen` |
| VC-44 | Family chore chart prompt | L+37 · Thu Dec 17 · 20:00 ET · Pinterest | `evergreen` |
| VC-45 | Say no gracefully prompt | L+9 · Thu Nov 19 · 20:00 ET · Pinterest | `evergreen` |
| VC-46 | The 5-part prompt template | L-4 · Fri Nov 6 · 20:00 ET · Pinterest | `evergreen` |
| VC-47 | AI tutor prompt (learn anything faster) | L+42 · Tue Dec 22 · 20:00 ET · Pinterest | `evergreen` |
| VC-48 | Tailor your resume prompt | L+49 · Tue Dec 29 · 20:00 ET · Pinterest | `evergreen` |
| VC-49 | What never to share with AI | L-2 · Sun Nov 8 · 20:00 ET · Pinterest | `evergreen` |
| VC-50 | The 7-day AI plan for beginners | L+0 · Tue Nov 10 · 20:00 ET · Pinterest<br>L+34 · Mon Dec 14 · 20:00 ET · Pinterest (new design) **FIXED** | `evergreen` |
| VC-51 | Social media post ideas prompt for small business | L+18 · Sat Nov 28 · 20:00 ET · Pinterest | `evergreen` |
| VC-52 | Which AI tier are you? | L+11 · Sat Nov 21 · 20:00 ET · Pinterest | `evergreen` |
| VC-53 | Free AI Readiness Assessment | L+0 · Tue Nov 10 · 20:00 ET · Pinterest | `evergreen` |
| VC-54 | Where AI pays off in a small business | L+14 · Tue Nov 24 · 20:00 ET · Pinterest | `evergreen` |
| VC-55 | Lead follow-up without fake deadlines | L+28 · Tue Dec 8 · 20:00 ET · Pinterest | `evergreen` |
| VC-56 | Your first three AI projects for 2027 | L+23 · Thu Dec 3 · 20:00 ET · Pinterest | `evergreen` |
| VC-57 | Green, Amber, Red data rules for teams | L+30 · Thu Dec 10 · 20:00 ET · Pinterest | `evergreen` |
| VC-58 | The 5 parts of a reliable AI workflow | L+35 · Tue Dec 15 · 20:00 ET · Pinterest | `evergreen` |
| VC-59 | Facebook launch post (a link post) | L+0 · Tue Nov 10 · 9:30 ET · Facebook Page | `launch` |
| VC-60 | How Principe AI works (creative: VC-01) | L+2 · Thu Nov 12 · 9:30 ET · Facebook Page | `launch` |
| VC-61 | One task you'd hand to AI (native question) | L-5 · Thu Nov 5 · 9:30 ET · Facebook Page | `launch` |
| VC-62 | The 5-part prompt (creative: VC-02) | L+7 · Tue Nov 17 · 9:30 ET · Facebook Page | `launch` |
| VC-63 | 3 things never to paste into an AI chat (creative: VC-04) | L+21 · Tue Dec 1 · 9:30 ET · Facebook Page | `evergreen` |
| VC-64 | The [CHECK] rule (native text, business) | L+30 · Thu Dec 10 · 9:30 ET · Facebook Page | `evergreen` |
| VC-65 | Where AI pays off (creative: VC-05) | L+23 · Thu Dec 3 · 9:30 ET · Facebook Page | `evergreen` |
| VC-66 | 5 prompts for busy parents (creative: VC-06) | L+28 · Tue Dec 8 · 9:30 ET · Facebook Page | `evergreen` |
| VC-67 | AI tends to agree with you (native text) | L+37 · Thu Dec 17 · 9:30 ET · Facebook Page | `evergreen` |
| VC-68 | Thanksgiving, planned (creative: VC-08) | L+9 · Thu Nov 19 · 9:30 ET · Facebook Page **FIXED** | `launch` |
| VC-69 | Follow up without fake deadlines (native text, business) | L+14 · Tue Nov 24 · 9:30 ET · Facebook Page | `evergreen` |
| VC-70 | The 5 parts of a reliable AI workflow (creative: VC-09) | L+35 · Tue Dec 15 · 9:30 ET · Facebook Page | `evergreen` |
| VC-71 | Which AI tier are you? (native text) | L+42 · Tue Dec 22 · 9:30 ET · Facebook Page | `evergreen` |
| VC-72 | Black Friday promotion (only if you set a real one) | L+17 · Fri Nov 27 · 9:30 ET · Facebook Page **OPTIONAL** **FIXED** **PRICE** | `bf-2026` |
| VC-73 | Group welcome post (pin it as Featured) | L+55 · Mon Jan 4 · 9:00 ET · Facebook Group | `ny-2027` |
| VC-74 | Monday thread | L+62 · Mon Jan 11 · 9:00 ET · Facebook Group<br>L+69 · Mon Jan 18 · 9:00 ET · Facebook Group<br>L+76 · Mon Jan 25 · 9:00 ET · Facebook Group | `ny-2027` |
| VC-75 | Wednesday prompt of the week (first one filled in) | L+64 · Wed Jan 13 · 9:00 ET · Facebook Group<br>L+71 · Wed Jan 20 · 9:00 ET · Facebook Group<br>L+78 · Wed Jan 27 · 9:00 ET · Facebook Group | `ny-2027` |
| VC-76 | Friday wins and promo thread | L+66 · Fri Jan 15 · 9:00 ET · Facebook Group<br>L+73 · Fri Jan 22 · 9:00 ET · Facebook Group<br>L+80 · Fri Jan 29 · 9:00 ET · Facebook Group | `ny-2027` |
| VC-77 | Monthly live Q&A announcement | L+72 · Thu Jan 21 · 9:00 ET · Facebook Group | `ny-2027` |
| VC-78 | 7-Day AI Starter Challenge (Day 1 written out) | L+53 · Sat Jan 2 · 10:00 ET · Instagram Story<br>L+55 · Mon Jan 4 · 12:00 ET · Facebook Group (Day 1)<br>L+56 · Tue Jan 5 · 9:00 ET · Facebook Group (Day 2)<br>L+57 · Wed Jan 6 · 9:00 ET · Facebook Group (Day 3)<br>L+58 · Thu Jan 7 · 9:00 ET · Facebook Group (Day 4)<br>L+59 · Fri Jan 8 · 9:00 ET · Facebook Group (Day 5)<br>L+60 · Sat Jan 9 · 9:00 ET · Facebook Group (Day 6)<br>L+61 · Sun Jan 10 · 9:00 ET · Facebook Group (Day 7) | `ny-2027` |
| VC-79 | Introduce yourself (in a group's intro thread) | As needed from L+7 · Tue Nov 17: your intro in each new Facebook group | by date |
| VC-80 | Answer: "How do I stop AI sounding generic or robotic?" | As needed from L+7 · Tue Nov 17: Tue and Thu community slots | by date |
| VC-81 | Answer: "Is it safe to put client information into AI?" | As needed from L+7 · Tue Nov 17: Tue and Thu community slots | by date |
| VC-82 | Value post: one line that catches invented details | As needed from L+7 · Tue Nov 17: Tue and Thu community slots | by date |
| VC-83 | Promo thread, or a reply when someone asks for a recommendation | Only when someone asks and the group allows links | by date |

- **No posts** on L-7 · Tue Nov 3 (Election Day), L+16 · Thu Nov 26 (Thanksgiving), Dec 24 and 25, and Dec 31 and Jan 1. These dates are **FIXED**.
- **Reserve** (calendar, section 9): VC-36 to VC-38 until the Broadcast Channel opens; VC-72 only with a real Stripe promotion code; VC-73 to VC-77 only if the L+34 · Mon Dec 14 group check passes (otherwise retire them and run VC-78 on the Page).
- **Used as needed:** VC-79 to VC-83 (4.7). "By date" means the campaign follows the day you post: `launch` until L+13 · Mon Nov 23, `evergreen` to Fri Jan 1, `ny-2027` from Sat Jan 2.
- **Open slot:** L+80 · Fri Jan 29 (carousel). Redesign your best carousel topic as **VC-84**, the next free ID, or skip it. Never renumber an existing post.
- **Your Monday review** (calendar 3.3) covers these platforms: Admin → Funnels → Attribution → "Channel (UTM source)" for `instagram`, `pinterest` and `facebook`, then a few new contacts' `utm_content` to see which VC posts brought them.

---

## 6. Pre-post checklist (every post)

- [ ] Offer facts match the table at the top; **every price checked in Admin → Courses that morning** if the post names one (**PRICE**)
- [ ] Any **[CONFIRM: AI key live in production]** line kept only if the key is live; otherwise deleted (VC-01, VC-15, VC-33)
- [ ] No mention of the downloadable course app or PDF book
- [ ] No testimonials, results, client counts, time-saved or income claims, "guaranteed", hype words, or struck-through prices
- [ ] Every `[YOUR NAME`, `[YOUR STORY`, `[YOUR CREDENTIAL`, `[YOUR OFFER`, `[ANSWER`, `[CONFIRM`, `[OPTIONAL:`, `[DATE AND TIME`, `[TAG NEW` and `[group-shortname` filled with true details or deleted; prompt brackets left in
- [ ] AI tools named only as "AI assistants like Claude, ChatGPT and Gemini"; no AI-company logos; no AI-generated photorealistic images
- [ ] Prompts on slides and Pins match the repo word for word (cuts only)
- [ ] Link copied from the post's block (never retyped): right `utm_source`; `utm_campaign` matching the calendar date (every Pin and Highlight `evergreen`, `bf-2026` only on VC-72); `utm_content` = the post ID. If you moved the post, change only the campaign (1.1)
- [ ] Instagram: 5 hashtags or fewer, counting the comment keyword; alt text on every slide; audio added; Story share with the link sticker scheduled for the same day
- [ ] Facebook: link in the first comment (not the post), except VC-59 and VC-72
- [ ] Any S3 camera frame either filmed with true details or switched to its no-face option
- [ ] Pinterest: 1000×1500; title under 100 and description under 800 characters; saved to one board only
- [ ] 15 minutes blocked after posting for replies

---

## 7. Confirm before launch (open items)

1. **Prices** in Admin → Courses and Admin → Availability, the morning of VC-15 (Instagram L+73, Facebook L+77), before re-posting the VC-33 frames, and before the OPTIONAL VC-72.
2. **`ANTHROPIC_API_KEY` in production** before VC-01, VC-15 or VC-33 mention the AI tutor (each marked **[CONFIRM: AI key live in production]**). Check on L-20 · Wed Oct 21; if it still isn't live by L-1 · Mon Nov 9, delete those lines. Nothing here says the assessment plan is "written by Claude".
3. **Facebook's link cap for your Page.** Read "About links in organic Facebook Page posts and comments" in the Page and confirm the monthly count and that first-comment links are exempt. November has two planned link posts (VC-59 and the OPTIONAL VC-72).
4. **Story link sticker** availability on the new Instagram account (fallback in 2.3).
5. **Meta comment-to-message automation:** confirm three hashtag triggers are allowed and that each sends one private reply.
6. **Pinterest:** board name and description limits, whether rich Pins apply automatically after claiming, and the scheduling window in the date picker.
7. **Free Story scheduling** in Business Suite. The calendar assumes Stories are posted live; if free scheduling is there, schedule the Highlight frames and the daily Stories.
8. **Downloadable course app and PDF book** stay out of every post until delivery is automatic and listed on the course pages (content bank gap 7).
9. **Profile URLs** go into `src/config/site.ts` → `social.instagram`, `social.facebook` and `social.pinterest` on L-12 · Thu Oct 29, so the footer, `/links` and the home page's structured data link them ([profile setup](01-profile-setup.md), section 7).
10. **Footer disclaimer.** The Pinterest About, Facebook About and group description carry "Principe AI is independent and not affiliated with Anthropic, OpenAI or Google." The site itself doesn't yet; consider adding the same line to the site footer and `/terms` ([tools, measurement and compliance](08-tools-measurement-compliance.md), 4.9).
11. **Facebook Group:** the L+34 · Mon Dec 14 go/no-go (4.6), and the face or no-face choice for the monthly live Q&A (VC-77).

Back to the [README](README.md).
