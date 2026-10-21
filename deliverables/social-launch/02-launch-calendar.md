# Principe AI launch calendar: L-21 to L+82

**What this file is:** the single source of truth for *when* everything happens, from today (Tue Oct 20, 2026, L-21) to Sun Jan 31, 2027 (L+82). Every post appears here by its ID. The words, links and designs live in the kits.
**When to use it:** every Monday (review, then the batch session), and any day you want to know what goes out and what to prepare.
**Launch day is Tue Nov 10, 2026 (L+0).** Every date is written as an L-day plus the default calendar date, so you can move the whole plan in one step.
Back to the [README](README.md).

---

## How to read this calendar

### The kits

| Kit (as named in the tables) | File | IDs inside |
|---|---|---|
| Profile setup | [01-profile-setup.md](01-profile-setup.md) | Bios, profile links, verification steps |
| Video | [03-short-video-kit.md](03-short-video-kit.md) | LD-01 to LD-03, SV-01 to SV-27 |
| Text | [04-linkedin-x-threads-bluesky.md](04-linkedin-x-threads-bluesky.md) | TP-01 to TP-66 |
| Visual | [05-instagram-pinterest-facebook.md](05-instagram-pinterest-facebook.md) | VC-01 to VC-83 |
| Long-form | [06-youtube-reddit-outreach.md](06-youtube-reddit-outreach.md) | 47 IDs: LC-01 to LC-16, LC-20 to LC-34, LC-40 to LC-54 and LC-60 (the numbers in between are unused) |

### Markers

- **FIXED**: tied to a calendar date (a holiday or a season). If you move launch day, these stay where they are.
- **OPTIONAL**: the first thing to skip when you're short on time. Nothing breaks if you skip it.
- **PRICE**: the post names a price. Check it in Admin → Courses (and the coaching session in Admin → Availability) that morning.
- **CONFIRM**: the post mentions the AI tutor or a plan written by Claude. Keep that line only if `ANTHROPIC_API_KEY` is live in production, because the site falls back to plain text without it. Otherwise delete the line.

### Which `utm_campaign` to use

The campaign follows the day the post goes out. The kits hold every link; change only the campaign value if a date moves.

| Posted | `utm_campaign` |
|---|---|
| Bios, profile links, page buttons, Highlights, every Pin, DM keyword replies, playlist descriptions and outreach material (whatever the date) | `evergreen` |
| L-7 to L+13 (Tue Nov 3 to Mon Nov 23) | `launch` |
| Thanksgiving to Cyber Monday promotion posts, **only** with a real Stripe promotion code (VC-72, TP-16 version A) | `bf-2026` |
| L+14 to L+52 (Tue Nov 24 to Fri Jan 1) | `evergreen` |
| Sat Jan 2 to Sun Jan 31, 2027 | `ny-2027` |

`utm_content` is always the post ID in lower case (`sv-07`). A New Year re-cut keeps its ID (`sv-03`); the `ny-2027` campaign tells it apart from the November original. DM keyword replies use `utm_medium=dm` and `evergreen` from the day you set them up, so nothing needs switching later.

### Default time slots (ET)

These are starting points from the research, not promises. Change them after three or four weeks of your own data (Monday review).

| Platform | Days | Time (ET) |
|---|---|---|
| TikTok and YouTube Shorts | Each short-video day | 1:00 pm |
| Instagram Reels, shared to Facebook Reels in the same Meta Business Suite post | Each short-video day | 7:00 pm |
| Instagram feed carousel | Usually Friday (more often in the launch fortnight) | 12:30 pm |
| Instagram Stories | Daily Nov 10 to 23, then on post days | Within an hour of the post they share |
| Facebook Page | Usually Tue and Thu | 9:30 am, link in the first comment |
| LinkedIn profile | Tue, Wed, Thu (Mon and Fri are OPTIONAL) | 2:30 pm |
| LinkedIn Company Page | The day after each profile post | 10:00 am |
| LinkedIn newsletter | Every second Tuesday from Jan 5 | 9:00 am |
| Threads, then X | 2 or 3 weekdays | Threads 8:30 am, X 9:00 am (link in your own first reply) |
| Bluesky (Tier 3, optional) | Same days as X | 11:30 am |
| Pinterest | 2 or 3 a week | 8:00 pm (timing matters less here) |
| YouTube long-form | Every second Tuesday | 11:00 am |
| Reddit (posts from Dec 3) | Tue to Thu | 8:30 am, then check back for 2 hours |
| Your Facebook Group (from Jan 4, if go) | Mon, Wed, Fri | 9:00 am |
| Outreach emails | Tuesdays (first batch Mon Nov 23) | 10:00 am, from your own inbox |

**Never post on:** Tue Nov 3 (Election Day), Thu Nov 26 (Thanksgiving), Dec 24 and 25, Dec 31 and Jan 1.

### Moving launch day

1. Pick the new launch date. A Tuesday is best. Don't move it later than Tue Nov 17, or launch week runs into Thanksgiving.
2. Every date in this file is launch day + its L-number. Move them all together.
3. **FIXED** posts stay on their calendar date. If one now lands in your setup phase, post it as a value post anyway or skip it.
4. The `launch` campaign moves with L (L-7 to L+13). `bf-2026` and `ny-2027` don't move.
5. Check the date-linked wording in the kits: VC-16 ("live today"), VC-17 to VC-29 (day numbers), VC-29 (countdown end time = the VC-06 post), LC-16 (when new tutorials go up), LC-11 ("with the holidays coming"), TP-63 (the date of issue 2).
6. Re-check the scheduler windows (TikTok Studio may only allow 10 days ahead).

---

## 1. The phases on one screen

| Phase | L-days | Default dates | Goal |
|---|---|---|---|
| **Setup** | L-21 to L-8 | Tue Oct 20 to Mon Nov 2 | Claim handles, start the slow verifications, write the profiles, fill the site's social links, make templates, film and design the first posts. No posting, apart from the Highlight Stories on L-9 |
| **Warm-up** | L-7 to L-1 | Tue Nov 3 to Mon Nov 9 | A few value-only posts on each Tier-1 platform, so nobody lands on an empty profile. No launch announcement. **Nothing on Tue Nov 3 (Election Day)** |
| **Launch week** | L+0 to L+6 | Tue Nov 10 to Mon Nov 16 | Announce everywhere on one day, pin the launch posts, run daily Stories, reply to everyone |
| **Growth** | L+7 to L+40 | Tue Nov 17 to Sun Dec 20 | A steady weekly rhythm. Outreach starts (5 pitches a week). Thanksgiving (Thu Nov 26) off. Black Friday (Fri Nov 27) to Cyber Monday (Mon Nov 30): promotion posts are **OPTIONAL** and need a real Stripe promotion code. Everything for the holidays is scheduled by Sun Dec 20 |
| **Holiday slow-down** | L+41 to L+52 | Mon Dec 21 to Fri Jan 1 | About one post a week per platform, all pre-scheduled. Light check-ins only |
| **New Year push** | L+53 to L+82 | Sat Jan 2 to Sun Jan 31, 2027 | Campaign `ny-2027`: "build a 30-day AI habit" with AI Essentials, starting free with the 7-day plan. 7-Day AI Challenge Jan 4 to 10. Facebook Group opens Mon Jan 4 (if the Dec 14 check passes). LinkedIn newsletter issue 1 on Tue Jan 5 |

**Platform tiers used here.** Tier 1: Instagram, TikTok, YouTube (Shorts now, long-form from the free preview lessons), LinkedIn (profile first, Company Page second), Facebook Page. Tier 2, low-effort cross-posts: Threads, X, Pinterest. Tier 3, optional: Bluesky, Reddit (comments only for the first 3 weeks), your own Facebook Group (Jan 4), and podcast, partner and local outreach (from Growth).

---

## 2. Weekly time budget

### 2.1 Hours by phase

| Phase | Dates | About | What makes it that size |
|---|---|---|---|
| Setup, week 1 | Tue Oct 20 to Sun Oct 25 | 18 h | Handles, verifications, Tier 1 profiles, first filming, first long-form recording |
| Setup, week 2 | Mon Oct 26 to Sun Nov 1 | 17 h | Tier 2 and 3 profiles, templates, automations, site config, Highlights, filming, editing |
| Last setup day + warm-up (8 days) | Mon Nov 2 to Mon Nov 9 | 18 h | Link tests and test opt-ins, filming and designing the launch fortnight, scheduling it, first posts, the reserve-only handles |
| Launch week | Tue Nov 10 to Mon Nov 16 | 10 h | Daily Stories, replies to everyone, the first Monday batch, one long-form recording |
| Week 2 | Tue Nov 17 to Mon Nov 23 | 10 h | Daily Stories end, outreach set-up (one-sheet and target lists) |
| Growth, standard week | Nov 24 to Dec 13 | 9.5 h | See 2.2. Tue Dec 1 and Tue Dec 8 add about 1 to 1.5 h of outreach |
| Growth, last week | Mon Dec 14 to Sun Dec 20 | 14 to 15 h | Filming, editing and scheduling everything for Dec 21 to Jan 10 |
| Holiday slow-down | Dec 21 to Jan 1 | 1 to 3 h a week | Check-ins, plus writing newsletter issue 1 (1.5 h) |
| New Year push | Jan 2 to 31 | 10 h | Group and newsletter added; short videos drop to 2 a week from Jan 11 |

Setup is the heavy part: about 53 hours over three weeks (about 18 a week). If that isn't possible, use the lighter setup, move launch day back one week (see "Moving launch day"), or both. A lighter setup (about 37 hours): film the no-face versions, design only VC-07 and VC-01 to VC-03 before launch, and set up X, Bluesky and Reddit after launch.

### 2.2 A standard Growth week, task by task

| Task | Hours a week | Notes |
|---|---|---|
| Monday review | 0.5 | Mon 9:00 to 9:30 (section 3.3) |
| Weekly batch session | 2.0 | Mon 9:30 to 11:30: film 3 short videos (about 75 min), design 1 carousel, 2 or 3 Pins and any LinkedIn document carousel from templates (about 45 min) |
| Edit 3 short videos | 1.0 | About 20 minutes each, Tue and Wed |
| Schedule the week | 0.75 | One sitting on Thursday: about 30 items across 5 or 6 tools. Copy and links are ready in the kits |
| Live touches | 1.25 | What no free scheduler does: Facebook first comments, Story shares with the link sticker, Company Page reshares (section 3, "Live touches") |
| Daily engagement block | 1.67 | 20 minutes × 5 weekdays, including first-hour replies on your own posts (section 3.1) |
| YouTube long-form | 1.5 | One free preview lesson video every second week, about 3 hours each (record, edit, package). The course cut doubles as the lesson's video |
| Outreach | 0.75 | 5 personalized pitches (about 8 minutes each) plus last week's follow-ups, Tuesdays |
| **Total** | **9.4** | **About 9.5 hours** |

What that buys each week: 3 short videos on 4 platforms, 1 Instagram carousel (later cross-posted to the Facebook Page), 2 Facebook Page posts, 3 LinkedIn posts plus Page reshares, 2 or 3 posts on Threads and X, 2 or 3 Pins, Stories on post days, a long-form video every second week, one Reddit post a week in Dec and Jan, and 5 pitches.

Design beyond one carousel and 3 Pins in a week moves to Wednesday (about 30 minutes per extra carousel).

### 2.3 If you only have 3 hours a week

Cut in this order. Stop when the week fits.

| Order | Cut | Saves | The week becomes |
|---|---|---|---|
| 1 | Pause outreach | 0.75 h | 8.7 h |
| 2 | Pause YouTube long-form (Shorts keep the channel active) | 1.5 h | 7.2 h |
| 3 | Stop X, Bluesky and Reddit; keep Threads | 0.2 h | 7.0 h |
| 4 | Facebook Page: only the Reels shared from Instagram, with no Page posts and no Facebook Reel first comments (so no 9:30 am live touches) | 0.7 h | 6.3 h |
| 5 | Carousels every second week; Stories only to share a post; Pins only from existing designs | 0.6 h | 5.7 h |
| 6 | LinkedIn: 1 post a week plus the Page reshare | 0.3 h | 5.4 h |
| 7 | Short videos: 2 a week instead of 3 | 0.9 h | 4.5 h |
| 8 | Engagement block: 15 minutes, 3 days a week | 0.9 h | 3.6 h |
| 9 | Monday review: 20 minutes; scheduling in one short sitting | 0.6 h | 3.0 h |

**The 3-hour week**

| Task | Time |
|---|---|
| Monday review | 20 min |
| Batch: film 2 short videos (plus a carousel every second week) | 50 min |
| Edit 2 short videos | 35 min |
| Schedule: 2 short videos on 4 platforms, 1 LinkedIn post, 2 Threads posts, 2 Pins | 15 min |
| Live touches: the Story share for each Reel at 7:00 pm, and the Page reshare | 15 min |
| Engagement: 15 minutes × 3 days | 45 min |
| **Total** | **3 h** |

**Never cut:** replies to comments and DMs on your own posts, the Monday review, testing a new link in a private window before you use it, launch day, and any **FIXED** post you've already made. Posts you drop move to the Reserve (section 9) and can come back later.

### 2.4 If you fall behind

The pipeline runs one week ahead, so one missed Monday batch empties the next week. When that happens:

1. **Never double up.** At most one short video and one LinkedIn post a day, even when catching up.
2. **Protect, in this order:** replies and DMs on your own posts, **FIXED** posts you've already made, the short videos, LinkedIn.
3. **Missed a batch:** post what's already filmed, and fill the gaps with posts that need no new work (share an earlier Reel to Stories, a Pin cut from an existing carousel, a Company Page reshare). Move each post you didn't make to the next open slot or to the Reserve (section 9). It keeps its ID; only `utm_campaign` changes, to match the new date.
4. **A scheduled post failed:** post it by hand the same day. If it's **FIXED** and its date has passed, move it to the Reserve.
5. **Two weeks behind:** run the 3-hour week (2.3) until the Monday batch is 8 days ahead again. Don't try to restore the skipped posts.
6. **A post flopped:** leave it up. Judge formats only with the rules in the Monday review (3.3, step 4).

---

## 3. Recurring rituals

### The weekly rhythm (Growth)

| Day | Rituals | Usual posts |
|---|---|---|
| Mon | 9:00 review · 9:30 batch session · 20-minute block · 7:00 pm live touch | Short video |
| Tue | 9:30 am live touch · outreach (10:00 am) · 20-minute block (2:30 pm, with LinkedIn) | LinkedIn, Threads and X, Facebook Page, a Pin, long-form every second week |
| Wed | 10:00 am Page reshare · 20-minute block · edit short videos · 7:00 pm live touch | Short video, LinkedIn, Threads and X |
| Thu | 9:30 am live touch · 10:00 am Page reshare · 20-minute block · schedule next week (45 min) | LinkedIn, Threads and X, Facebook Page, a Pin |
| Fri | 10:00 am Page reshare · 12:30 pm carousel Story share · 20-minute block | Carousel |
| Sat | 7:00 pm live touch · long-form session every second week (3 h) | Short video |
| Sun | Off. A standard Growth Sunday has no posts (in the launch fortnight and the Jan 4 to 10 challenge, do that day's 7:00 pm live touch) | None |

The pipeline is always one week ahead: film on Monday, edit Tuesday and Wednesday, schedule Thursday, and those posts go out from the following Tuesday.

**Live touches (no free scheduler does these).** About 1.25 hours a week, in short slots:

- **Tue and Thu, 9:30 am:** when the Facebook Page post goes out, post its first comment with the link, then reply to comments for 15 minutes.
- **Each short-video day at 7:00 pm, Saturdays included:** post the Facebook Reel's first comment with the link, and share the Reel to Instagram Stories with its link sticker (5 to 10 minutes). Carousel days: the same Story share at 12:30 pm.
- **10:00 am the day after each LinkedIn profile post:** the Company Page reshare with one line. Check whether LinkedIn lets you schedule a reshare; if it doesn't, do it live.
- **LinkedIn days, 2:30 pm:** stay on the post and reply. This is the start of the 20-minute block, not extra time.
- **Reddit post days:** check back a few times in the first 2 hours.

### 3.1 Daily 20-minute engagement block (weekdays)

Start it when your main post of the day goes live (2:30 pm on LinkedIn days). At zero followers, your comments on other people's posts are seen by more people than your own posts.

| Minutes | Do this |
|---|---|
| 0 to 6 | Reply to every new comment and DM on your own posts: Meta Business Suite inbox (Instagram and Facebook), then TikTok, YouTube, LinkedIn, Threads and X. Answer KIT, READY and WORKFLOW DMs by hand wherever the automation isn't live yet (TikTok until business verification is approved) |
| 6 to 12 | LinkedIn: 3 or 4 useful comments (add one thing, show one tip, ask one question) and 5 connection requests, as in the text kit's engagement routine |
| 12 to 18 | Community slot, by day: **Mon** Instagram and TikTok comments in your niche · **Tue** other people's Facebook groups (VC-80 to VC-82) · **Wed** Reddit comments (LC-27 to LC-34) · **Thu** Facebook groups · **Fri** Threads and X replies. From Jan 4, if your group is open: your own group on Mon, Wed and Fri |
| 18 to 20 | One line in your log: date, comments, requests sent, conversations to follow up |

Rules: no links unless someone asks and the space allows it (LC-33, VC-83). Never pitch in someone else's comments, group or DMs. No engagement pods, auto-commenters or bought followers. LinkedIn commenting starts on Mon Oct 26 (10 minutes a weekday); the full block starts on Wed Nov 4. Skip it on the no-post days.

**Replies and DMs on your own posts.**

- Answer within the reply time you set in the Facebook instant reply (one business day is a sensible default). Messages that say HUMAN come first.
- A question you can answer: answer it in the comment, with no link.
- Wants the kit, the assessment or the workflow lesson: send that platform's `dm-kit`, `dm-ready` or `dm-workflow` link from the profile setup file.
- A business owner describing a real problem, or asking to work together: one helpful reply, then the call link `https://principeai.com/book/ai-strategy-call?utm_source=<platform>&utm_medium=dm&utm_campaign=evergreen&utm_content=dm-call`.
- "Which course is right for me?": `https://principeai.com/courses?utm_source=<platform>&utm_medium=dm&utm_campaign=evergreen&utm_content=dm-courses`.
- A link you send in reply to a specific post: `utm_medium=dm`, `utm_campaign=evergreen`, and that post's ID as `utm_content`.
- A customer with a login, payment or refund problem: move it to email through `https://principeai.com/contact`. Never handle it in public.
- A skeptic: one calm, factual reply in the style of LC-34, then stop.
- Hide or delete only spam, scams, slurs or personal data. Block repeat offenders.
- Every lead conversation goes in your log (minutes 18 to 20) with a follow-up date.

### 3.2 Weekly batch session (Mondays 9:30 to 11:30)

1. Open this calendar at the week that starts **8 days later** and list its IDs (the week tables in section 7 also name what to film and design in each batch).
2. Fill the prompt brackets and prepare the screen recordings. Keep personal data out of every shot.
3. Film the short videos with the video kit's filming steps (about 75 minutes for 3). **No-face option:** screen recording with voice-over or on-screen text, as the video kit describes.
4. Design that week's carousel, Pins and any LinkedIn document carousel from your Canva templates (about 45 minutes).
5. Name every file by ID (`SV-21_hook_take2`) and back it up.

On Postiz (the upgrade option), Claude can queue the week's posts from this calendar after your review, for you to approve.

### 3.3 Monday review (30 minutes, 9:00 to 9:30)

1. **Site first (10 min).** Admin → Funnels, range **7 days**:
   - Stat cards: unique visitors, new leads, booked calls, revenue. Compare with last week.
   - Attribution, toggle **"Channel (UTM source)"**: leads, booked calls, customers and revenue for each platform (`instagram`, `tiktok`, `youtube`, `linkedin`, `facebook`, `threads`, `x`, `pinterest`, `reddit`, `podcast`, `local`, `partner`...). "Direct / none" means no UTM.
   - Attribution, toggle **"Signup path"**: Free guide vs AI assessment vs Booking.
   - Funnel cards (free-guide, assessment, course-sales, booking): where social visitors drop off.
   - Top landing pages and Top referrers. A referrer such as `instagram.com` or `linktr.ee` means some link is missing its UTM. Find it and fix it.
   - Admin → Contacts: open 3 to 5 new contacts and note their `utm_content` (which post, bio link or DM brought them; this is the only place post IDs show).
2. **Native analytics (10 min).** Note the top 2 and bottom 2 posts per platform.

   | Platform | Look at |
   |---|---|
   | Instagram | Views, reach (followers vs non-followers), shares and saves, follows, profile visits, link taps |
   | TikTok | Views, average watch time, % watched to the end, new followers, For You share |
   | YouTube Shorts | Engaged views, "viewed vs swiped away", subscribers |
   | YouTube long-form | Impressions click-through rate, average view duration, subscribers per video |
   | LinkedIn | Impressions, comments (the strongest signal), reposts, followers, profile views |
   | Facebook, Threads, X | Views, replies, link clicks |
   | Pinterest | Outbound clicks, saves, impressions |

3. **Hygiene (5 min).** Did a DM automation fail or send the wrong link? Any comments still unanswered? Unsubscribes or bounces rising in Admin → Email Log? Is the next 7 days queued, with nothing on a no-post day?
4. **Decide (5 min).** Make 2 more posts in the format of last week's winner. Retire any format that's been in the bottom 20% three weeks running. Pick one experiment (a hook, a length, a time slot or a CTA).

One-line log: `Week | Posts by platform | Views | Follows | Link taps | Site visitors | Leads by channel | Booked calls | Revenue | Top post | Experiment | Next action`

### 3.4 Monthly retro (60 minutes, replaces that Monday's review)

Dates: **Mon Dec 7 (L+27)**, **Mon Jan 11 (L+62)**, **Mon Feb 1 (L+83)**.

1. Export the contacts CSV (Admin → Contacts → export). Count leads and customers by `utm_source` and by `utm_campaign` (`launch`, `evergreen`, `bf-2026`, `ny-2027`).
2. For each platform: keep, change or cut. The research's rules: after about 30 short videos (the Jan 11 retro), downgrade any platform giving under 10% of social leads **and** under 10% of social visitors. Move Facebook up a tier if `facebook` is within 25% of your top source after 60 days (also Jan 11). Reassess X in January.
3. Outreach: pitches sent, replies, bookings. Fewer than 2 replies from 20 pitches means the angle or the shows need to change.
4. Check the free-tier limits you rely on (Buffer Free: 10 queued posts per channel; Metricool Free: 20 posts a month).
5. Update the Reserve (section 9) and choose skipped OPTIONAL posts for the open slots.
6. If a customer or student tells you something good, ask whether you may quote them, in writing. Only then add it to `site.testimonials` or a post.
7. Before any promotion, re-read the claim rules in the README.

### 3.5 Long-form session (every second Saturday, about 3 hours)

Record one free preview lesson (course takes and public takes), edit both cuts, then package the public one (title, thumbnail, description, chapters, end screen). Put the course cut in Admin → Courses → the lesson's Video URL. Dates: Sun Oct 25 (LC-04 and LC-08), Sat Nov 14 (LC-11), Sat Nov 28 (LC-10), Sat Dec 12 (LC-13), Sat Dec 19 (LC-15), Sat Jan 9 (LC-09), Sat Jan 23 (LC-12). Section 8 has the publishing dates.

### 3.6 Dated checkpoints

| L | Date | Decide or check |
|---|---|---|
| L-20 | Wed Oct 21 | Is `ANTHROPIC_API_KEY` live in production? If it still isn't by L-1, delete the **CONFIRM** lines (VC-01, VC-15, TP-16 version A) and schedule the LD-01 cut without the AI-tutor line. VC-33 is decided earlier, on L-11, because its Highlight goes up on L-9 |
| L-8 | Mon Nov 2 | CAN-SPAM: the postal address is in the marketing-email footer, or "Free Guide Nurture" and "Assessment Follow-up" stay off ([08](08-tools-measurement-compliance.md), 4.1) |
| L-1 | Mon Nov 9 | Launch go/no-go: profiles complete, links tested, prices checked, footer shows the social links, and the marketing-email footer shows the postal address with both prospect automations on (or both still deliberately off). If not ready, move launch day |
| L+7 | Tue Nov 17 | Consider swapping the LD-03 pin on Instagram for the VC-01 carousel |
| L+10 | Fri Nov 20 | Black Friday: a real Stripe promotion code with a real end date, or no promotion |
| L+13 | Mon Nov 23 | Last `launch`-tagged post |
| L+27 | Mon Dec 7 | Retro 1. LinkedIn newsletter access (Analytics & tools → Creator tools; needs 150+ followers or connections). Without access, publish TP-63 as a normal post on Jan 5 |
| L+34 | Mon Dec 14 | Facebook Group go/no-go: open on Jan 4 only if you can personally invite at least 25 people who already engaged. Facebook action button: keep "Sign up" or test "Book now" |
| L+40 | Sun Dec 20 | Everything from Dec 21 to Jan 10 is scheduled |
| L+62 | Mon Jan 11 | Retro 2: keep or cut each platform; X and Facebook tiers |
| L+83 | Mon Feb 1 | Retro 3: plan February (LC-12 and TP-65 on Tue Feb 2, LC-14 and TP-66 on Tue Feb 16) |

---

## 4. Setup and warm-up, day by day (L-21 to L-1)

Two verifications can take days and are started on L-21 so they finish before launch: **TikTok business verification** (it gives you a clickable bio link and DM auto-replies; review time is unknown) and **YouTube feature eligibility** (phone verification gives intermediate features at once; advanced features, which make description and pinned-comment links clickable, need ID or video verification or some channel history). The Pinterest website claim and the Bluesky domain handle use DNS records, which Pinterest says can take up to 72 hours.

| L | Date | Do this | Time |
|---|---|---|---|
| L-21 | Tue Oct 20 | **Read, decide, reserve, start the slow checks.** Read the README and, in this file, "How to read this calendar" and sections 1 to 4. Pick the stack: the $0 default (Meta Business Suite for Instagram and Facebook, TikTok Studio, YouTube Studio, LinkedIn's own scheduler, plus Buffer Free for X, Threads and Bluesky (its 3 free channels) and Pinterest's own scheduler for Pins; Metricool Free also covers Pinterest, Threads and Bluesky, but not X) or the upgrade (Postiz and Canva Pro). **Decide** your public name and whether you'll show your face on camera ([README](README.md), section 6): the LinkedIn profile needs both tomorrow. **Reserve the handle** on every Tier 1 to 3 platform, including the ones you won't use yet (the reserve-only platforms wait until L-2): `@principeai`, checked in each app's own sign-up screen; if it's taken, `@principe.ai` where periods are allowed, then `@principe_ai`, then `@getprincipeai`. Display name starts with "Principe AI" everywhere. Two-factor sign-in on every account. **Start the checks that take days:** TikTok business verification (Business account first), YouTube ID or video verification (after phone verification), LinkedIn identity (CLEAR), and the DNS TXT records for Pinterest and Meta domain verification, plus the Bluesky handle record. TikTok's profile basics ([01-profile-setup.md](01-profile-setup.md), 4.2) | 4.5 h |
| L-20 | Wed Oct 21 | **Before any bio link (owner or engineering):** merge `claude/sweet-edison-ne5duy` into the branch Vercel deploys and redeploy. Blank `site.social` entries are skipped, so this is safe today. Open `https://principeai.com/links` in a private window, and paste no bio link until it loads. If the merge can't happen today, use `https://principeai.com/free-guide?utm_source=<platform>&utm_medium=bio&utm_campaign=evergreen&utm_content=bio-kit` as the temporary main link and swap it on L-12. **CAN-SPAM stop-gap, also before any bio link:** in Admin → Email Automations, switch off "Free Guide Nurture" and "Assessment Follow-up", and send no broadcasts, until the postal address prints in the email footer ([08](08-tools-measurement-compliance.md), 4.1). Then: avatar and banners in Canva (the site has no brand image files). **Instagram** (Professional, Business type) and the **Facebook Page**, connected in Accounts Center, with bios and links from [01-profile-setup.md](01-profile-setup.md). Every main bio link is `https://principeai.com/links?utm_source=<platform>&utm_medium=bio&utm_campaign=evergreen&utm_content=bio`, plus extra direct links where a platform allows several. **Owner or engineering:** in Vercel, confirm `NEXT_PUBLIC_SITE_URL=https://principeai.com` and the live Stripe, Resend and Anthropic keys. **CAN-SPAM:** order a PO box or registered mailbox now; its address must be in marketing emails by L-8 | 3.5 h |
| L-19 | Thu Oct 22 | **LinkedIn profile** (turn off sharing profile updates first, so edits don't announce themselves): headline, About, Featured links, Service Page, custom URL | 2 h |
| L-18 | Fri Oct 23 | **YouTube** (LC-01 to LC-03: description, links, banner text, keywords, upload defaults) and the three playlists LC-05, LC-06, LC-07 (empty for now). **LinkedIn Company Page** "Principe AI", linked from your Experience | 2.75 h |
| L-17 | Sat Oct 24 | **Batch-film A** (video kit filming steps): LD-01, LD-02, LD-03, SV-01. For LD-01, record both the AI-tutor line and the alternative line under it, so either cut is ready after the **CONFIRM** decision. No-face option: screen recording with voice-over or on-screen text | 2.5 h |
| L-16 | Sun Oct 25 | **Long-form session 1:** record LC-04 (trailer) and LC-08, course and public takes. LC-04 assumes you on camera; the no-face version is a screen recording of principeai.com/links with your voice-over | 2.5 h |
| L-15 | Mon Oct 26 | **Tier 2 and 3 profiles:** Threads, X (Professional account), Pinterest (About and the 10 boards, kept secret until each holds 5 Pins), Bluesky, Reddit (a personal account to post from; `u/principeai` reserved, LC-20). Start LinkedIn engagement: 10 minutes each weekday (3 comments, 5 connection requests) | 3.5 h |
| L-14 | Tue Oct 27 | **Canva:** brand kit (royal violet and gold, Geist, Instrument Serif italic for accents) and templates: carousel (4:5), Story frames, Pins, Highlight covers, YouTube thumbnail, LinkedIn document carousel | 2.5 h |
| L-13 | Wed Oct 28 | **DM automations** (desktop): Meta Business Suite "Comment to message" for `#prompts`, `#aiready` and `#aiworkflow` (Instagram and Facebook), the Facebook Inbox replies, and TikTok's KIT, READY and WORKFLOW auto-replies if business verification is through. Every DM link: `utm_medium=dm`, `utm_campaign=evergreen`, `utm_content=dm-kit`, `dm-ready` or `dm-workflow`. Add a trusted backup admin to the Meta business portfolio and the LinkedIn Page, if you have someone ([01-profile-setup.md](01-profile-setup.md), 2.6) | 1.5 h |
| L-12 | Thu Oct 29 | **Site config:** on the merged branch, paste each full `https://` profile URL into `src/config/site.ts` → `social` (youtube, instagram, linkedin, x, tiktok, threads, facebook, pinterest, bluesky; blank or non-https entries are skipped) and redeploy. Check that the footer links appear and that `/links` lists the profiles. If you used the temporary `/free-guide` main link on L-20, swap every bio to its `/links` link now. **Engineering:** print the postal address in the footer of every email as soon as the box address arrives ([08](08-tools-measurement-compliance.md), 4.1, step 2); it must be live by L-8. Design VC-07 | 2 h |
| L-11 | Fri Oct 30 | Edit batch A, with both LD-01 cuts (with and without the AI-tutor line). Design the Highlight frames (VC-30 to VC-35; delete VC-33's **CONFIRM** lines unless the AI key is live in production today, and add them later as a new frame once it is) and Pins VC-40, VC-46, VC-49 | 2.5 h |
| L-10 | Sat Oct 31 | **Batch-film B:** SV-09, SV-15, SV-12, SV-02 | 2 h |
| L-9 | Sun Nov 1 | Clocks go back an hour at 2:00 am: check every scheduler is set to America/New_York. Post the six Highlight frame sets as Stories and save each into its Highlight (VC-30 to VC-35). Edit LC-04 and LC-08 (public and course cuts) and add the course cut to the lesson's Video URL in Admin → Courses | 3 h |
| L-8 | Mon Nov 2 | **CAN-SPAM deadline (first thing):** send yourself a test email and read the footer ([08](08-tools-measurement-compliance.md), 4.1, step 3). If the postal address shows, switch "Free Guide Nurture" and "Assessment Follow-up" back on before the test opt-ins. If it doesn't, leave both off and send no broadcasts until it does. **Test every link in a private window** (the test checklist in the profile setup file): bio links, page buttons, DM auto-replies. For one link per platform and every DM keyword link, opt in with a new `+alias` address ([08](08-tools-measurement-compliance.md), 2.8; the site accepts 8 opt-ins per 10 minutes), check each contact's UTM block in Admin → Contacts, then delete the test contacts (your normal browser keeps its first UTM for 90 days). Tick each "done when" list. **Create the tracking sheet** (one sheet, six tabs, about 15 minutes; [08](08-tools-measurement-compliance.md), 3.2) before the first warm-up post. Edit batch B. **Schedule every warm-up post** (Nov 4 to 9) and check that nothing is set for Tue Nov 3. Optional: start a Postiz trial if you're testing it; decide by L-2 (Sun Nov 8), and keep the warm-up queued in the native tools until you decide | 4.5 h |
| L-7 | Tue Nov 3 | **Election Day: no posts, no public commenting.** Production only: **batch-film C** (SV-03, SV-04, SV-13, SV-18, SV-27) | 2.5 h |
| L-6 | Wed Nov 4 | Warm-up posts go out (table below). The 20-minute engagement block starts, including Reddit comments. Design VC-01 and VC-02 | 1.5 h |
| L-5 | Thu Nov 5 | Warm-up posts. Design VC-03 and VC-04. Engagement block | 1.5 h |
| L-4 | Fri Nov 6 | Warm-up post. Edit batch C (5 videos). Engagement block | 2.5 h |
| L-3 | Sat Nov 7 | Warm-up post. Design VC-05 and VC-08 | 1 h |
| L-2 | Sun Nov 8 | Design the launch-fortnight Pins: VC-50, VC-53, VC-39, VC-41, VC-42, VC-45, VC-52. **Reserve-only handles** ([01-profile-setup.md](01-profile-setup.md), 6.4): Snapchat, Medium, Substack, Discord, Mastodon, Telegram and Product Hunt, with the name, avatar and short bio, two-factor login on, no posts | 2 h |
| L-1 | Mon Nov 9 | Warm-up post. **Schedule launch week and week 2** in every scheduler (Stories are posted live). Final checks: prices for LD-01 and TP-02, the **CONFIRM** decision (schedule the matching LD-01 cut), every launch-day link opened in a private window, the footer showing the social links, the marketing-email footer showing the postal address (or both prospect automations still off), LinkedIn profile-update sharing back on. Engagement block | 2.5 h |

### Warm-up posts (L-7 to L-1)

Value-only: no launch announcement, no "coming soon". The LinkedIn Company Page stays quiet until its launch post (TP-02) on L+1.

| L | Date | Posts (ET) | Kit |
|---|---|---|---|
| L-7 | Tue Nov 3 | **No posts (Election Day)** | - |
| L-6 | Wed Nov 4 | **SV-09** TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm<br>**TP-34** LinkedIn profile 2:30 pm<br>**VC-40** Pinterest 8:00 pm | Text, Video, Visual |
| L-5 | Thu Nov 5 | **VC-61** Facebook Page 9:30 am<br>**VC-07** Instagram feed 12:30 pm<br>**TP-29** LinkedIn profile 2:30 pm | Text, Visual |
| L-4 | Fri Nov 6 | **VC-46** Pinterest 8:00 pm | Visual |
| L-3 | Sat Nov 7 | **SV-15** TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Video |
| L-2 | Sun Nov 8 | **VC-49** Pinterest 8:00 pm | Visual |
| L-1 | Mon Nov 9 | **SV-12** TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Video |

---

## 5. Launch week, day by day (L+0 to L+6)

Every row is one post. "Kit" tells you which file holds the copy, link and design. Short videos on launch day go to all four video platforms at the same time; from L+2 they follow the default slots (TikTok and YouTube Shorts 1:00 pm, Instagram and Facebook Reels 7:00 pm).

**Launch-day order of work:** 8:00 am, open every launch link in a private window one last time. Then post, and keep the engagement block going in short bursts all day: reply to every comment within the first hour. Pin as the profile setup file lists: LD-01 to LD-03 on TikTok and Instagram, VC-59 on the Facebook Page, TP-05 on Threads, TP-06 on Bluesky, LC-04 as the YouTube trailer and TP-01 at the top of LinkedIn Featured; on L+1, TP-02 on the LinkedIn Page and TP-04 on X. Invite your connections to follow the LinkedIn Page today (then again on the 1st of each month, when the invite credits reset).

#### L+0 · Tue Nov 10 · Launch day

> **Launch posts already out (Wed Oct 21, via Postiz).** The owner chose to announce early. TP-01 (LinkedIn), TP-03 (X), TP-05 (Threads), TP-06 (Bluesky) and VC-59 (Facebook) are live, and so is a launch slideshow on Instagram, TikTok and YouTube (ST-01 to ST-06, [stories](stories/README.md), section 8). **Don't post those again on Nov 10.** Use Nov 10 for what's still unposted: LD-01 to LD-03, VC-16, LC-04, LC-08, LC-16, and VC-50/VC-53 once a Pinterest board exists. The [tracker](PROGRESS.md) lists the post IDs.

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 8:30 am | Threads | TP-05 | Text | launch | launch post with a text attachment |
| 9:00 am | TikTok + YouTube Shorts + Instagram + Facebook Reels | LD-01 | Video | launch | **PRICE** **CONFIRM** pin on TikTok and Instagram |
| 9:00 am | X | TP-03 | Text | launch | single launch post; link in your own first reply |
| 9:30 am | Facebook Page | VC-59 | Visual | launch | launch link post (one of the roughly 2 link posts a month); pin it to the Page |
| 9:30 am | Instagram Stories | VC-16 | Visual | launch | Day 1 "It's live"; frame 5 shares LD-01 |
| 11:00 am | YouTube | LC-04 | Long-form | launch | channel trailer: publish, then set it as the trailer for non-subscribers |
| 11:00 am | YouTube | LC-08 | Long-form | launch | **PRICE** first tutorial; add it to playlist LC-05 |
| 11:30 am | Bluesky | TP-06 | Text | launch | OPTIONAL (Tier 3) |
| 11:30 am | YouTube Post | LC-16 | Long-form | launch | version A, attach LC-08 |
| 1:00 pm | TikTok + YouTube Shorts + Instagram + Facebook Reels | LD-02 | Video | launch | pin on TikTok and Instagram |
| 2:30 pm | LinkedIn profile | TP-01 | Text | launch | launch post, link in the body; reply to every comment for 30 minutes |
| 7:00 pm | TikTok + YouTube Shorts + Instagram + Facebook Reels | LD-03 | Video | launch | pin on TikTok and Instagram |
| 8:00 pm | Pinterest | VC-50 | Visual | evergreen |  |
| 8:00 pm | Pinterest | VC-53 | Visual | evergreen |  |

- After LC-08 is live, set it as the Related video on LD-01 to LD-03, SV-09, SV-12 and SV-15.

#### L+1 · Wed Nov 11 · Veterans Day

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 8:30 am | Threads | Replies only | - | - | no new post: reply to every reply on TP-05 |
| 9:00 am | X | TP-04 | Text | launch | 8-post launch thread; pin post 1 to your profile |
| 11:00 am | LinkedIn Page | TP-02 | Text | launch | **PRICE** Company Page launch post |
| 12:30 pm | Instagram feed | VC-01 | Visual | launch | **CONFIRM** "Start here" carousel |
| 1:00 pm | Instagram Stories | VC-17 | Visual | launch | Day 2; shares VC-01 with its link sticker |
| 3:00 pm | LinkedIn Page | TP-01 | Text | launch | reshare TP-01 with the one line under TP-02 |

#### L+2 · Thu Nov 12

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 8:30 am | Threads | TP-08 | Text | launch | follow-up: seven free lessons |
| 9:00 am | X | TP-08 | Text | launch | follow-up: seven free lessons; link in your own first reply |
| 9:30 am | Facebook Page | VC-60 | Visual | launch | VC-01 slides; link in the first comment |
| 11:30 am | Bluesky | TP-08 | Text | launch | OPTIONAL (Tier 3) |
| 12:00 pm | YouTube Post | LC-16 | Long-form | launch | **OPTIONAL** version B (poll) |
| 1:00 pm | TikTok + YouTube Shorts | SV-01 | Video | launch | founder intro (no-face version allowed) |
| 2:30 pm | LinkedIn profile | TP-07 | Text | launch | three free ways to start |
| 7:00 pm | Instagram + Facebook Reels | SV-01 | Video | launch | founder intro (no-face version allowed) |
| 7:15 pm | Instagram Stories | VC-18 | Visual | launch | Day 3 question box; shares SV-01 |
| 8:00 pm | Pinterest | VC-39 | Visual | evergreen |  |

#### L+3 · Fri Nov 13

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 10:00 am | LinkedIn Page | TP-07 | Text | launch | reshare with one line |
| 1:00 pm | TikTok + YouTube Shorts | SV-02 | Video | launch | Starter Kit Day 1 |
| 7:00 pm | Instagram + Facebook Reels | SV-02 | Video | launch | Starter Kit Day 1 |
| 7:15 pm | Instagram Stories | VC-19 | Visual | launch | Day 4 quiz; shares SV-02 |

#### L+4 · Sat Nov 14

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 12:30 pm | Instagram feed | VC-02 | Visual | launch | the 5-part prompt |
| 1:00 pm | Instagram Stories | VC-20 | Visual | launch | Day 5; shares VC-02 |
| 8:00 pm | Pinterest | VC-41 | Visual | evergreen |  |

- Long-form session (3 h, course production): record LC-11.

#### L+5 · Sun Nov 15

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 1:00 pm | TikTok + YouTube Shorts | SV-03 | Video | launch | Starter Kit Day 2 |
| 7:00 pm | Instagram + Facebook Reels | SV-03 | Video | launch | Starter Kit Day 2 |
| 7:15 pm | Instagram Stories | VC-21 | Visual | launch | Day 6 your answers; shares SV-03 |

#### L+6 · Mon Nov 16

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 12:30 pm | Instagram feed | VC-03 | Visual | launch | 7 days to make AI useful |
| 1:00 pm | Instagram Stories | VC-22 | Visual | launch | Day 7; shares VC-03 |

- 9:00 Monday review #1. 9:30 batch session: film SV-11, SV-16, SV-05; design VC-06 and the TP-10 document carousel (TP-10 posts Wed).


---

## 6. Week 2, day by day (L+7 to L+13)

Growth starts. Daily Stories finish on L+13 (Day 14). Outreach starts with preparation; the first 5 pitches go out on Mon Nov 23. This is the last week tagged `launch`.

#### L+7 · Tue Nov 17

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 8:30 am | Threads | TP-39 | Text | launch |  |
| 9:00 am | X | TP-39 | Text | launch | link in your own first reply |
| 9:30 am | Facebook Page | VC-62 | Visual | launch | VC-02 slides; link in the first comment |
| 11:30 am | Bluesky | TP-39 | Text | launch | OPTIONAL (Tier 3) |
| 12:30 pm | Instagram feed | VC-08 | Visual | launch | **FIXED** Thanksgiving, nine days ahead; share it to Stories with its link sticker |
| 1:00 pm | TikTok + YouTube Shorts | SV-04 | Video | launch | Starter Kit Day 3 |
| 2:30 pm | LinkedIn profile | TP-09 | Text | launch | prompt breakdown |
| 7:00 pm | Instagram + Facebook Reels | SV-04 | Video | launch | Starter Kit Day 3 |
| 7:15 pm | Instagram Stories | VC-23 | Visual | launch | Day 8 quiz; shares SV-04 (plus the VC-08 share at 1:00 pm) |
| 8:00 pm | Pinterest | VC-42 | Visual | evergreen |  |

- Growth starts. Outreach prep: create the LC-60 tracking sheet and start the LC-40 one-sheet. Join 5 to 8 Facebook groups (VC-79 where intros are welcome).

#### L+8 · Wed Nov 18

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 8:30 am | Threads | TP-40 | Text | launch |  |
| 9:00 am | X | TP-40 | Text | launch | link in your own first reply |
| 10:00 am | LinkedIn Page | TP-09 | Text | launch | reshare with one line |
| 11:30 am | Bluesky | TP-40 | Text | launch | OPTIONAL (Tier 3) |
| 12:30 pm | Instagram feed | VC-04 | Visual | launch | 3 things never to paste |
| 1:00 pm | Instagram Stories | VC-24 | Visual | launch | Day 9; shares VC-04 |
| 2:30 pm | LinkedIn profile | TP-10 | Text | launch | Carousel 1 (document); the week's one "comment KIT" post |

- Join 2 or 3 online communities; post LC-47 where introductions are welcome.
- Design VC-11 and the TP-14 document carousel (about 1 h).

#### L+9 · Thu Nov 19

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 8:30 am | Threads | TP-41 | Text | launch |  |
| 9:00 am | X | TP-41 | Text | launch | link in your own first reply |
| 9:30 am | Facebook Page | VC-68 | Visual | launch | **FIXED** VC-08 slides (Thanksgiving) |
| 10:00 am | LinkedIn Page | TP-10 | Text | launch | reshare with one line |
| 11:30 am | Bluesky | TP-41 | Text | launch | OPTIONAL (Tier 3) |
| 1:00 pm | TikTok + YouTube Shorts | SV-13 | Video | launch | why AI makes things up |
| 2:30 pm | LinkedIn profile | TP-11 | Text | launch | the four payoffs |
| 7:00 pm | Instagram + Facebook Reels | SV-13 | Video | launch | why AI makes things up |
| 7:15 pm | Instagram Stories | VC-25 | Visual | launch | Day 10 business poll; shares SV-13 |
| 8:00 pm | Pinterest | VC-45 | Visual | evergreen |  |

- Finish LC-40 (one-sheet PDF). List 30 podcasts and 10 local organizations in LC-60.

#### L+10 · Fri Nov 20

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 10:00 am | LinkedIn Page | TP-11 | Text | launch | reshare with one line |
| 1:00 pm | TikTok + YouTube Shorts | SV-18 | Video | launch | where AI pays off |
| 2:30 pm | LinkedIn profile | TP-12 | Text | launch | **OPTIONAL** founder story: post only if every placeholder holds something true |
| 7:00 pm | Instagram + Facebook Reels | SV-18 | Video | launch | where AI pays off |
| 7:15 pm | Instagram Stories | VC-26 | Visual | launch | Day 11 ask me anything; shares SV-18 |

- **Black Friday go/no-go.** Decide today whether you will run a real Stripe promotion code. If yes, create it with a real end date by Mon Nov 23. If no, skip VC-72 and use TP-16 version B.

#### L+11 · Sat Nov 21

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 12:30 pm | Instagram feed | VC-05 | Visual | launch | where AI pays off in a small business |
| 1:00 pm | Instagram Stories | VC-27 | Visual | launch | Day 12; shares VC-05 |
| 8:00 pm | Pinterest | VC-52 | Visual | evergreen |  |

- Design and schedule Pins VC-54 and VC-51 (about 30 min).

#### L+12 · Sun Nov 22

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 1:00 pm | TikTok + YouTube Shorts | SV-27 | Video | launch | **FIXED** Thanksgiving meal plan |
| 7:00 pm | Instagram + Facebook Reels | SV-27 | Video | launch | **FIXED** Thanksgiving meal plan |
| 7:15 pm | Instagram Stories | VC-28 | Visual | launch | Day 13 answers; frame 5 shares SV-27 (not SV-10) |

#### L+13 · Mon Nov 23

| Time (ET) | Platform | Post | Kit | Campaign | Notes |
|---|---|---|---|---|---|
| 10:00 am | Email (one-to-one) | LC-41 | Long-form | evergreen | first 5 podcast pitches, each personalized |
| 10:00 am | Instagram Stories | VC-29 | Visual | launch | Day 14; countdown sticker ends Tue Nov 24, 12:30 pm (VC-06) |
| 10:00 am | LinkedIn Page | TP-32 | Text | launch | Page-only post (reserve) |
| 2:30 pm | LinkedIn profile | TP-13 | Text | launch | **OPTIONAL** **FIXED** Thanksgiving hosting how-to |

- 9:00 Monday review. 9:30 batch session: film SV-19, SV-20, SV-06; design VC-09, the TP-19 document carousel, Pins VC-43 and VC-56.

- Last day of `utm_campaign=launch`. From tomorrow every new post is `evergreen` (or `bf-2026` for a real promotion).


---

## 7. Week by week, L+14 to L+82

**Standing rules for every week below.**
- **LinkedIn Page:** reshare each profile post the next day at 10:00 am with one line of context (only the Page-only posts are listed).
- **Instagram Stories:** share each Reel and carousel on its day; the link sticker carries that post's link.
- **Facebook Page:** link in the first comment, posted right after publishing. Only VC-59 and VC-72 are link posts (free Pages are reported to get about 2 a month).
- **Bluesky** (optional): the same short post as X, at 11:30 am.
- **Reddit:** comments in the engagement block every Wednesday; posts only after the subreddit's rules are checked and logged that day.
- **Pinterest:** add 1 to 3 Pins cut from that week's carousel (new 1000 × 1500 designs, the carousel's own ID). Make each board public once it holds 5 Pins.

### Week 3 · L+14 to L+20 · Tue Nov 24 to Mon Nov 30 · Thanksgiving, Black Friday, Cyber Monday

Lighter on purpose. Campaign `evergreen`, except the OPTIONAL promotion posts (`bf-2026`). **Black Friday rules:** only with a real Stripe promotion code and a real end date set up by Mon Nov 23; no "was" or struck-through prices; no countdown to a sale; check every price in Admin → Courses. If you run one, move Instagram's Courses link (IG-5) up to second place, under IG-1, from Thu Nov 26 to Mon Nov 30, and move it back on Tue Dec 1.

| Where | Posts and tasks (ET) |
|---|---|
| Short videos: TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Wed Nov 25 **SV-11**<br>Sat Nov 28 **SV-16** **FIXED**<br>Mon Nov 30 **SV-05** |
| Instagram feed carousel 12:30 pm | Tue Nov 24 **VC-06**: the countdown's post<br>Fri Nov 27 **VC-11** **FIXED**: scam check |
| Instagram Stories | Mon Nov 30: OPTIONAL: if your promotion runs through today, re-share the VC-72 Story frames with the real end time. |
| Facebook Page 9:30 am (link in the first comment) | Tue Nov 24 **VC-69**: follow up without fake deadlines<br>Fri Nov 27 **VC-72** **OPTIONAL** **FIXED** **PRICE**: Black Friday link post plus a 3-frame Instagram Story; only with a real Stripe promotion code<br>Mon Nov 30 **VC-11** **FIXED**: cross-post of the VC-11 carousel, Cyber Monday |
| LinkedIn profile 2:30 pm | Tue Nov 24 **TP-14**: Carousel 2 (document)<br>Wed Nov 25 **TP-15** **FIXED**: Black Friday copy without fake urgency<br>Fri Nov 27 11:30 am **TP-16** **FIXED**: version A (real promotion, `bf-2026`) or version B (free kit, `evergreen`)<br>Mon Nov 30 **TP-17** **OPTIONAL** **FIXED**: holiday scam check |
| Threads 8:30 am + X 9:00 am (Bluesky 11:30 am, optional) | Tue Nov 24 **TP-60** **FIXED**<br>Fri Nov 27 **TP-61** **FIXED** |
| Pinterest 8:00 pm (always `evergreen`) | Tue Nov 24 **VC-54**<br>Sat Nov 28 **VC-51** |
| YouTube long-form 11:00 am | Tue Nov 24 **LC-11** **PRICE**: holiday-message angle; add to LC-05; Related video on SV-04, SV-10, SV-11 |
| Reddit 8:30 am | Tue Nov 24: Thanksgiving week: Reddit comments today and Mon Nov 30 only. No Reddit, no outreach and no new pitches Wed Nov 25 to Sun Nov 29. |
| Production | Sat Nov 28: Long-form session: record LC-10. |
| Rituals and checkpoints | Thu Nov 26: **Thanksgiving: no posts, no engagement block.**<br>Mon Nov 30: Monday review + batch: film SV-21, SV-22, SV-07; design VC-12, Pins VC-55, VC-57 and the new VC-50 design. |

### Week 4 · L+21 to L+27 · Tue Dec 1 to Mon Dec 7

First Reddit post (comments started Nov 4, so the 3-week comment-only period is over). First local outreach: this Tuesday's outreach takes about 1.5 hours (11 personalized messages plus follow-ups). If you can't personalize every one, send the 5 podcast pitches and move the rest to the next Tuesday, keeping their IDs.

| Where | Posts and tasks (ET) |
|---|---|
| Short videos: TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Wed Dec 2 **SV-19**<br>Sat Dec 5 **SV-20**<br>Mon Dec 7 **SV-06** |
| Instagram feed carousel 12:30 pm | Fri Dec 4 **VC-09**: 5 parts of a reliable AI workflow |
| Facebook Page 9:30 am (link in the first comment) | Tue Dec 1 **VC-63**: VC-04 slides<br>Thu Dec 3 **VC-65**: VC-05 slides |
| LinkedIn profile 2:30 pm | Tue Dec 1 **TP-18**<br>Wed Dec 2 **TP-19**: Carousel 3 (document)<br>Thu Dec 3 **TP-20**<br>Fri Dec 4 **TP-21** **OPTIONAL**: poll (December's one poll)<br>Mon Dec 7 **TP-22** **OPTIONAL**: personal instructions how-to |
| LinkedIn Page 10:00 am | Mon Dec 7 **TP-33**: Page-only post (reserve) |
| Threads 8:30 am + X 9:00 am (Bluesky 11:30 am, optional) | Tue Dec 1 **TP-42**<br>Wed Dec 2 **TP-43**<br>Thu Dec 3 **TP-44** |
| Pinterest 8:00 pm (always `evergreen`) | Tue Dec 1 **VC-43**<br>Thu Dec 3 **VC-56** |
| Reddit 8:30 am | Thu Dec 3 **LC-21**: first post, r/PromptEngineering, only if your verification log clears it; check back for 2 hours |
| Outreach (from your own inbox, `utm_medium=referral`) | Tue Dec 1 **LC-41** 5 new pitches<br>Tue Dec 1 **LC-42** follow-ups to the Nov 23 pitches<br>Tue Dec 1 **LC-50** talk pitch to 5 local organizations, for January and February dates<br>Tue Dec 1 **LC-54** library or adult-education class pitch |
| Rituals and checkpoints | Mon Dec 7: **Monthly retro #1** (60 min, replaces the review). Check LinkedIn newsletter access (Analytics & tools → Creator tools). Batch: film SV-23, SV-24, SV-08, SV-26; design VC-14, Pins VC-58 and VC-44. |

### Week 5 · L+28 to L+34 · Tue Dec 8 to Mon Dec 14

The heaviest outreach Tuesday of the plan: about 2 hours (13 personalized messages, plus follow-ups and nudges). If you can't personalize every one, send the 5 podcast pitches and the 5 local talk pitches, and move LC-45 to the next Tuesday, keeping its ID.

| Where | Posts and tasks (ET) |
|---|---|
| Short videos: TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Wed Dec 9 **SV-21**<br>Sat Dec 12 **SV-22**<br>Mon Dec 14 **SV-07** |
| Instagram feed carousel 12:30 pm | Fri Dec 11 **VC-12**: Green, Amber, Red |
| Facebook Page 9:30 am (link in the first comment) | Tue Dec 8 **VC-66**: VC-06 slides<br>Thu Dec 10 **VC-64**: the [CHECK] rule |
| LinkedIn profile 2:30 pm | Tue Dec 8 **TP-23**<br>Wed Dec 9 **TP-24**<br>Thu Dec 10 **TP-25**<br>Fri Dec 11 **TP-26** **OPTIONAL**: fact-check how-to<br>Mon Dec 14 **TP-28** **OPTIONAL**: AI drafts the proposal, never the price |
| Threads 8:30 am + X 9:00 am (Bluesky 11:30 am, optional) | Tue Dec 8 **TP-45**<br>Wed Dec 9 **TP-46**<br>Thu Dec 10 **TP-47** |
| Pinterest 8:00 pm (always `evergreen`) | Tue Dec 8 **VC-55**<br>Thu Dec 10 **VC-57**<br>Mon Dec 14 **VC-50** **FIXED**: the second, new design: "Your 7-day AI plan for the new year" |
| YouTube long-form 11:00 am | Tue Dec 8 **LC-10** **PRICE**: add it to playlist LC-06; Related video on SV-18, SV-19, SV-20, SV-21, SV-26 |
| Reddit 8:30 am | Thu Dec 10 **LC-23**: r/artificial or r/ClaudeAI (not the same subreddit as last week) |
| Outreach (from your own inbox, `utm_medium=referral`) | Tue Dec 8 **LC-41** 5 new pitches<br>Tue Dec 8 **LC-42** follow-ups to the Dec 1 pitches<br>Tue Dec 8 **LC-50** talk pitch to the other 5 organizations, plus one short nudge to the first 5<br>Tue Dec 8 **LC-45** 3 collaboration DMs, for January workshops<br>Wed Dec 9 **LC-46** guest-lesson DM to one community owner where you've been active 3+ weeks |
| Production | Fri Dec 11: LC-15 script due (it's the one video with no existing script).<br>Sat Dec 12: Long-form session: record LC-13. |
| Rituals and checkpoints | Mon Dec 14: **Facebook Group go/no-go** (open on Jan 4 only if you can personally invite 25+ people who already engaged). Review the Facebook action button. Batch: film the New Year re-cuts of SV-02 to SV-05 (new hooks and opening shots); design VC-10, VC-13, Pins VC-47 and VC-48. |

### Week 6 · L+35 to L+40 · Tue Dec 15 to Sun Dec 20 · the holiday pre-scheduling week

The heaviest Growth week (about 14 to 15 hours): everything from Dec 21 to Jan 10 is filmed and designed by Sat Dec 19 and scheduled by Sun Dec 20. No carousel this week, to make room.

| Where | Posts and tasks (ET) |
|---|---|
| Short videos: TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Wed Dec 16 **SV-23**<br>Sat Dec 19 **SV-24** |
| Facebook Page 9:30 am (link in the first comment) | Tue Dec 15 **VC-70**: VC-09 slides<br>Thu Dec 17 **VC-67**: AI tends to agree with you |
| LinkedIn profile 2:30 pm | Tue Dec 15 **TP-27**: last post of the LinkedIn 30-day library<br>Thu Dec 17 **Open slot**: post one OPTIONAL post you skipped (TP-12, TP-21, TP-22, TP-26 or TP-28), or nothing |
| Threads 8:30 am + X 9:00 am (Bluesky 11:30 am, optional) | Tue Dec 15 **TP-48**<br>Wed Dec 16 **TP-49**<br>Thu Dec 17 **TP-50** |
| Pinterest 8:00 pm (always `evergreen`) | Tue Dec 15 **VC-58**<br>Thu Dec 17 **VC-44** |
| Reddit 8:30 am | Wed Dec 16 **LC-24**: r/smallbusiness, only after 3+ weeks of comments there |
| Outreach (from your own inbox, `utm_medium=referral`) | Tue Dec 15 **LC-41** 5 pitches aimed at January "new year, new skills" episodes<br>Tue Dec 15 **LC-42** follow-ups to the Dec 8 pitches |
| Production | Fri Dec 18: **Holiday batch (2 h):** film the New Year re-cuts of SV-06 to SV-08 plus SV-14 and SV-10. If the group is a go, create it as the Page (private, rules, questions) and draft VC-73 (30 min).<br>Sat Dec 19: Long-form session: record LC-15; then edit the five Dec 18 re-cuts (about 1.75 h).<br>Sun Dec 20: schedule everything from Dec 21 to Jan 10, LC-15 included (about 1.5 h). |
| Rituals and checkpoints | Sun Dec 20: After scheduling, check every scheduler: Dec 21 to Jan 10 is queued, and nothing is set for Dec 24, Dec 25, Dec 31 or Jan 1. |

### Holiday slow-down, part 1 · L+41 to L+47 · Mon Dec 21 to Sun Dec 27

All pre-scheduled. No posts on Dec 24 and 25. No outreach, no Reddit posts.

| Where | Posts and tasks (ET) |
|---|---|
| Short videos: TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Mon Dec 21 **SV-08** |
| Facebook Page 9:30 am (link in the first comment) | Tue Dec 22 **VC-71**: which AI tier are you? |
| LinkedIn profile 2:30 pm | Tue Dec 22 **TP-30**: reserve post |
| Threads 8:30 am + X 9:00 am (Bluesky 11:30 am, optional) | Tue Dec 22 **TP-51** |
| Pinterest 8:00 pm (always `evergreen`) | Tue Dec 22 **VC-47** |
| YouTube long-form 11:00 am | Tue Dec 22 **LC-13** **PRICE**: pre-scheduled; add it to playlist LC-07; Related video on SV-22, SV-23, SV-24, SV-25 |
| Rituals and checkpoints | Mon Dec 21: Light 15-minute check instead of the review. Engagement is optional this week: 10 minutes on Mon to Wed if you like.<br>Thu Dec 24: **Christmas Eve and Christmas Day (Thu Dec 24 and Fri Dec 25): no posts.** |

### Holiday slow-down, part 2 · L+48 to L+52 · Mon Dec 28 to Fri Jan 1

All pre-scheduled. No posts on Dec 31 and Jan 1.

| Where | Posts and tasks (ET) |
|---|---|
| Short videos: TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Mon Dec 28 **SV-26** |
| Instagram feed carousel 12:30 pm | Tue Dec 29 **VC-14** **FIXED**: first three AI projects for 2027 |
| Facebook Page 9:30 am (link in the first comment) | Tue Dec 29 **VC-14** **FIXED**: cross-post of the VC-14 carousel |
| Threads 8:30 am + X 9:00 am (Bluesky 11:30 am, optional) | Tue Dec 29 **TP-62** **FIXED** |
| Pinterest 8:00 pm (always `evergreen`) | Tue Dec 29 **VC-48** |
| Production | Mon Dec 28: Write newsletter issue 1 (TP-63) from its outline and schedule it for Tue Jan 5 (about 1.5 h). |
| Rituals and checkpoints | Mon Dec 28: 15-minute check. If TikTok Studio only lets you schedule 10 days ahead, schedule the Jan 4 to 10 TikToks now.<br>Thu Dec 31: **New Year's Eve and New Year's Day (Thu Dec 31 and Fri Jan 1): no posts.** |

### New Year push, part 1 · L+53 to L+61 · Sat Jan 2 to Sun Jan 10 · the 7-Day AI Challenge

Campaign `ny-2027` from Jan 2. The angle: build a 30-day AI habit, starting free with the Starter Kit's 7-day plan; posts that name a paid course lead with AI Essentials (check its price). The challenge re-cuts of SV-02 to SV-08 post daily (new hooks and new files, never a re-upload). If the group is a no-go, VC-78 runs on the Facebook Page at 9:00 am each day instead and VC-73 moves to the Reserve.

| Where | Posts and tasks (ET) |
|---|---|
| Short videos: TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Mon Jan 4 **SV-02** **FIXED**<br>Tue Jan 5 **SV-03** **FIXED**<br>Wed Jan 6 **SV-04** **FIXED**<br>Thu Jan 7 **SV-05** **FIXED**<br>Fri Jan 8 **SV-06** **FIXED**<br>Sat Jan 9 **SV-07** **FIXED**<br>Sun Jan 10 **SV-08** **FIXED** |
| Instagram feed carousel 12:30 pm | Fri Jan 8 **VC-10**: how ready are you to put AI to work? |
| Instagram Stories | Sat Jan 2 10:00 am **VC-78**: teaser Story: "7-Day AI Starter Challenge starts Monday", link sticker to /free-guide with `utm_content=vc-78` |
| Facebook Page 9:30 am (link in the first comment) | Tue Jan 5 **VC-03**: cross-post of the VC-03 carousel, with one line inviting people to the challenge |
| Facebook Group (if go) | Mon Jan 4 **VC-73**: welcome post; pin it as Featured<br>Mon Jan 4 12:00 pm **VC-78**: challenge Day 1<br>Tue Jan 5 **VC-78**: challenge Day 2<br>Wed Jan 6 **VC-78**: challenge Day 3<br>Thu Jan 7 **VC-78**: challenge Day 4<br>Fri Jan 8 **VC-78**: challenge Day 5<br>Sat Jan 9 **VC-78**: challenge Day 6<br>Sun Jan 10 **VC-78**: challenge Day 7 |
| LinkedIn profile 2:30 pm | Tue Jan 5 9:00 am LinkedIn newsletter **TP-63** **FIXED**: issue 1; no other profile post today<br>Thu Jan 7 **TP-37**: free AI Strategy Call offer; link in the body |
| LinkedIn Page 10:00 am | Wed Jan 6 **TP-63**: reshare the newsletter with one line |
| Threads 8:30 am + X 9:00 am (Bluesky 11:30 am, optional) | Tue Jan 5 **TP-52**<br>Thu Jan 7 **TP-53** |
| Pinterest 8:00 pm (always `evergreen`) | Tue Jan 5 **VC-14**: a Pin cut from the VC-14 carousel<br>Fri Jan 8 **VC-10**: a Pin cut from the VC-10 carousel |
| YouTube long-form 11:00 am | Tue Jan 5 **LC-15** **FIXED**: add to LC-05; Related video on SV-02, SV-05 to SV-08 and every challenge re-cut; move SV-15, SV-16, SV-17 here |
| Reddit 8:30 am | Wed Jan 6 **LC-22**: r/ChatGPT or r/ChatGPTPromptGenius (new-year window) |
| Outreach (from your own inbox, `utm_medium=referral`) | Tue Jan 5 **LC-41** 5 new pitches<br>Tue Jan 5 **LC-42** follow-ups to the Dec 15 pitches |
| Production | Sat Jan 9: Long-form session: record LC-09. |
| Rituals and checkpoints | Sat Jan 2: New Year push starts: new posts use `utm_campaign=ny-2027`. If the group is a go, send your personal invitations today and tomorrow.<br>Mon Jan 4: Short 15-minute review today (challenge day 1). If the group is a no-go, post VC-78 on the Facebook Page each day instead. |

### New Year push, part 2 · L+62 to L+68 · Mon Jan 11 to Sun Jan 17

Short videos drop to 2 a week, to make room for the group and the newsletter.

| Where | Posts and tasks (ET) |
|---|---|
| Short videos: TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Wed Jan 13 **SV-14**<br>Sat Jan 16 **SV-10** |
| Instagram feed carousel 12:30 pm | Fri Jan 15 **VC-13**: honest second opinion |
| Facebook Page 9:30 am (link in the first comment) | Tue Jan 12 **VC-12**: cross-post of the VC-12 carousel |
| Facebook Group (if go) | Mon Jan 11 **VC-74**: Monday thread (every Monday from now)<br>Wed Jan 13 **VC-75**: prompt of the week (every Wednesday from now)<br>Fri Jan 15 **VC-76**: wins and promo thread (every Friday from now) |
| LinkedIn profile 2:30 pm | Tue Jan 12 **TP-31**: reserve post<br>Thu Jan 14 **TP-36**: reserve poll (January's one poll) |
| Threads 8:30 am + X 9:00 am (Bluesky 11:30 am, optional) | Tue Jan 12 **TP-54**<br>Wed Jan 13 **TP-55**<br>Thu Jan 14 **TP-56** |
| Pinterest 8:00 pm (always `evergreen`) | Fri Jan 15 **VC-13**: a Pin cut from the VC-13 carousel |
| Reddit 8:30 am | Wed Jan 13 **LC-26**: r/automation or r/nocode |
| Outreach (from your own inbox, `utm_medium=referral`) | Tue Jan 12 **LC-41** 5 new pitches<br>Tue Jan 12 **LC-42** follow-ups to last week's pitches |
| Rituals and checkpoints | Mon Jan 11: **Monthly retro #2** (60 min): the 8-week keep-or-cut call per platform. Batch: film SV-17 and SV-25; design VC-15. |

### New Year push, part 3 · L+69 to L+75 · Mon Jan 18 to Sun Jan 24

| Where | Posts and tasks (ET) |
|---|---|
| Short videos: TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Wed Jan 20 **SV-17**<br>Sat Jan 23 **SV-25** |
| Instagram feed carousel 12:30 pm | Fri Jan 22 **VC-15** **PRICE** **CONFIRM**: which way in: courses, coaching or done-with-you |
| Facebook Page 9:30 am (link in the first comment) | Tue Jan 19 **VC-13**: cross-post of the VC-13 carousel |
| Facebook Group (if go) | Mon Jan 18 **VC-74**<br>Wed Jan 20 **VC-75**<br>Thu Jan 21 **VC-77**: live Q&A announcement for Thu Jan 28<br>Fri Jan 22 **VC-76** |
| LinkedIn profile 2:30 pm | Tue Jan 19 9:00 am LinkedIn newsletter **TP-64**: issue 2; no other profile post today<br>Thu Jan 21 **Open slot**: a skipped OPTIONAL post, or nothing |
| LinkedIn Page 10:00 am | Wed Jan 20 **TP-64**: reshare the newsletter with one line |
| Threads 8:30 am + X 9:00 am (Bluesky 11:30 am, optional) | Tue Jan 19 **TP-57**<br>Thu Jan 21 **TP-58** |
| Pinterest 8:00 pm (always `evergreen`) | Fri Jan 22 **VC-15**: a Pin cut from the VC-15 carousel |
| YouTube long-form 11:00 am | Tue Jan 19 **LC-09** **PRICE**: add to LC-05; Related video on SV-03 and SV-09 |
| Reddit 8:30 am | Wed Jan 20 **LC-25**: r/sweatystartup |
| Outreach (from your own inbox, `utm_medium=referral`) | Tue Jan 19 **LC-41** 5 new pitches<br>Tue Jan 19 **LC-42** follow-ups to last week's pitches |
| Production | Mon Jan 18: Write newsletter issue 2 (TP-64) from its outline and schedule it for Tue Jan 19 (about 1.5 h).<br>Sat Jan 23: Long-form session: record LC-12 (for Tue Feb 2). |
| Rituals and checkpoints | Mon Jan 18: Monday review + batch (MLK Day: keep it light). Film any new Shorts for Jan 27 and 30. |

### New Year push, part 4 · L+76 to L+82 · Mon Jan 25 to Sun Jan 31

The open slots are for new posts based on what January taught you. Give each new post the next free ID (section 9).

| Where | Posts and tasks (ET) |
|---|---|
| Short videos: TikTok + YouTube Shorts 1:00 pm, Instagram + Facebook Reels 7:00 pm | Wed Jan 27 **Open slot**: planned: a Short cut from the LC-15 or LC-09 footage (next free ID, SV-28)<br>Sat Jan 30 **Open slot**: planned: a second Short cut from long-form footage (next free ID, SV-29), or skip |
| Instagram feed carousel 12:30 pm | Fri Jan 29 **Open slot**: redesign your best carousel topic (next free ID, VC-84), or skip |
| Facebook Page 9:30 am (link in the first comment) | Tue Jan 26 **VC-15** **PRICE**: cross-post of the VC-15 carousel |
| Facebook Group (if go) | Mon Jan 25 **VC-74**<br>Wed Jan 27 **VC-75**<br>Thu Jan 28 7:00 pm **Live Q&A**: the session VC-77 announced, 30 minutes (no-face option: a text "ask me anything" thread)<br>Fri Jan 29 **VC-76** |
| LinkedIn profile 2:30 pm | Tue Jan 26 **TP-38** **PRICE**: 1:1 coaching offer; link in the body<br>Thu Jan 28 **Open slot**: a skipped OPTIONAL post, or a new post (next free ID, TP-67) |
| Threads 8:30 am + X 9:00 am (Bluesky 11:30 am, optional) | Tue Jan 26 **TP-59**<br>Thu Jan 28 **Open slot**: a new short post (next free ID, TP-68), or no post |
| Pinterest 8:00 pm (always `evergreen`) | Thu Jan 28 **VC-13**: a second, new Pin design cut from the VC-13 carousel |
| Outreach (from your own inbox, `utm_medium=referral`) | Tue Jan 26 **LC-41** 5 new pitches<br>Tue Jan 26 **LC-42** follow-ups to last week's pitches |
| Rituals and checkpoints | Mon Jan 25: Monday review + batch for February. |

---

## 8. YouTube long-form plan and the Shorts links

One free preview lesson every second Tuesday at 11:00 am. The three playlists are created empty on L-18 and filled as videos go live. A Short can't carry a clickable link, so each Short's **Related video** points to the long-form video on the same topic. Until a Short's match is live, point it at LC-08.

| L | Date | Long-form | Playlist | Recorded on | Set it as the Related video on |
|---|---|---|---|---|---|
| L+0 | Tue Nov 10 | LC-04 (trailer) and LC-08 | LC-05 | Sun Oct 25 | LD-01 to LD-03, SV-01, SV-12, SV-13, SV-14, and for now every other Short |
| L+14 | Tue Nov 24 | LC-11 | LC-05 | Sat Nov 14 | SV-04, SV-10, SV-11 |
| L+28 | Tue Dec 8 | LC-10 | LC-06 | Sat Nov 28 | SV-18, SV-20, SV-26, and for now SV-19 and SV-21 |
| L+42 | Tue Dec 22 | LC-13 (pre-scheduled) | LC-07 | Sat Dec 12 | SV-22, SV-24, SV-25, and for now SV-23 |
| L+56 | Tue Jan 5 | LC-15 (needs a new script by Fri Dec 11) | LC-05 | Sat Dec 19 | SV-02, SV-05 to SV-08 and every challenge re-cut; move SV-15, SV-16, SV-17 here |
| L+70 | Tue Jan 19 | LC-09 | LC-05 | Sat Jan 9 | SV-03, SV-09 |
| L+84 | Tue Feb 2 | LC-12 (after this calendar; delete its Black Friday line) | LC-06 | Sat Jan 23 | SV-19 |
| L+98 | Tue Feb 16 | LC-14 (after this calendar) | LC-07 and LC-06 | Early February | SV-21, SV-23 |

LC-16 (the YouTube Post) goes out on launch day, with its optional poll on L+2. Weekly long-form is an option only if Admin → Funnels shows YouTube producing leads at the Jan 11 retro.

---

## 9. Reserve, open slots and items without a fixed date

### Not scheduled (Reserve)

| IDs | Why it waits | When to use it |
|---|---|---|
| TP-35 | One LinkedIn poll a month (TP-21 in December, TP-36 in January) | February |
| VC-36, VC-37, VC-38 | Instagram Broadcast Channel opens only after 1,000 followers | When Instagram offers it |
| LC-48, LC-49 | Newsletter swaps need your own regular newsletter first | After 4 or more newsletter issues |
| VC-72, TP-16 version A | Only with a real Stripe promotion code | Fri Nov 27 if you run one; otherwise retire until next year |
| VC-73 to VC-77 | Only if the Dec 14 group check passes | Jan 4 onward if go; otherwise retire (VC-78 runs on the Page) |
| CB-01 to CB-83 | The research idea bank, not written posts | Source for new posts in open slots |

### OPTIONAL posts you may skip

TP-12, TP-13, TP-17, TP-21, TP-22, TP-26, TP-28 and LC-16 version B. Skipped ones (except the seasonal TP-13 and TP-17) can fill the LinkedIn open slots on Thu Dec 17, Thu Jan 21 and Thu Jan 28.

### Open slots for new posts

Wed Jan 27 and Sat Jan 30 (short videos), Thu Jan 28 (LinkedIn, Threads and X), Fri Jan 29 (carousel). Next free IDs: **SV-28**, **TP-67**, **VC-84**, **LC-61**, **CB-84**. Never renumber an existing post.

### Scheduled after Jan 31

LC-12 and TP-65 on Tue Feb 2 (L+84); LC-14 and TP-66 on Tue Feb 16 (L+98).

### Used as needed (templates)

| IDs | Use |
|---|---|
| LC-27 to LC-34 | Reddit comment replies, from Wed Nov 4, in the Wednesday community slot |
| VC-79 | Your introduction in each new Facebook group, from Tue Nov 17 |
| VC-80 to VC-82 | Answers and value posts in other people's groups, Tue and Thu community slots |
| VC-83 and LC-33 | Only when someone asks for a recommendation or a link, and the space allows it |

### Set up once, or triggered by an event

| IDs | When |
|---|---|
| LC-01, LC-02, LC-03 | Channel copy, L-18 (Fri Oct 23) |
| LC-20 | Reddit account, L-15 (Mon Oct 26) |
| LC-05, LC-06, LC-07 | Playlists created on L-18 (Fri Oct 23); first videos added Nov 10, Dec 8 and Dec 22 |
| LC-60 | Outreach tracking sheet, from Tue Nov 17; update it after every send |
| LC-40 | One-sheet, made Nov 17 to 19, then attached to every LC-41 and LC-50 |
| LC-47 | Introduction post when you join a community, from Wed Nov 18 |
| LC-43 | When a podcast books you |
| LC-44 | After each recording |
| LC-51 | When an organization says yes to a talk |
| LC-52 | One week before a booked talk (talks pitched in December are for January or February) |
| LC-53 | The day after a talk |

---

## Appendix: every post ID and its date

Use this to find any post fast, or to copy dates into a kit. Times are ET. "4 video platforms" means TikTok, YouTube Shorts, Instagram Reels and Facebook Reels.

| ID | When (L · date) and where (ET) | Campaign |
|---|---|---|
| LD-01 | L+0 · Tue Nov 10: 4 video platforms 9:00 am **CONFIRM** **PRICE** | launch |
| LD-02 | L+0 · Tue Nov 10: 4 video platforms 1:00 pm | launch |
| LD-03 | L+0 · Tue Nov 10: 4 video platforms 7:00 pm | launch |
| SV-01 | L+2 · Thu Nov 12: 4 video platforms 1:00 pm / 7:00 pm | launch |
| SV-02 | L+3 · Fri Nov 13: 4 video platforms 1:00 pm / 7:00 pm<br>L+55 · Mon Jan 4: 4 video platforms 1:00 pm / 7:00 pm **FIXED** | launch, ny-2027 |
| SV-03 | L+5 · Sun Nov 15: 4 video platforms 1:00 pm / 7:00 pm<br>L+56 · Tue Jan 5: 4 video platforms 1:00 pm / 7:00 pm **FIXED** | launch, ny-2027 |
| SV-04 | L+7 · Tue Nov 17: 4 video platforms 1:00 pm / 7:00 pm<br>L+57 · Wed Jan 6: 4 video platforms 1:00 pm / 7:00 pm **FIXED** | launch, ny-2027 |
| SV-05 | L+20 · Mon Nov 30: 4 video platforms 1:00 pm / 7:00 pm<br>L+58 · Thu Jan 7: 4 video platforms 1:00 pm / 7:00 pm **FIXED** | evergreen, ny-2027 |
| SV-06 | L+27 · Mon Dec 7: 4 video platforms 1:00 pm / 7:00 pm<br>L+59 · Fri Jan 8: 4 video platforms 1:00 pm / 7:00 pm **FIXED** | evergreen, ny-2027 |
| SV-07 | L+34 · Mon Dec 14: 4 video platforms 1:00 pm / 7:00 pm<br>L+60 · Sat Jan 9: 4 video platforms 1:00 pm / 7:00 pm **FIXED** | evergreen, ny-2027 |
| SV-08 | L+41 · Mon Dec 21: 4 video platforms 1:00 pm / 7:00 pm<br>L+61 · Sun Jan 10: 4 video platforms 1:00 pm / 7:00 pm **FIXED** | evergreen, ny-2027 |
| SV-09 | L-6 · Wed Nov 4: 4 video platforms 1:00 pm / 7:00 pm | launch |
| SV-10 | L+67 · Sat Jan 16: 4 video platforms 1:00 pm / 7:00 pm | ny-2027 |
| SV-11 | L+15 · Wed Nov 25: 4 video platforms 1:00 pm / 7:00 pm | evergreen |
| SV-12 | L-1 · Mon Nov 9: 4 video platforms 1:00 pm / 7:00 pm | launch |
| SV-13 | L+9 · Thu Nov 19: 4 video platforms 1:00 pm / 7:00 pm | launch |
| SV-14 | L+64 · Wed Jan 13: 4 video platforms 1:00 pm / 7:00 pm | ny-2027 |
| SV-15 | L-3 · Sat Nov 7: 4 video platforms 1:00 pm / 7:00 pm | launch |
| SV-16 | L+18 · Sat Nov 28: 4 video platforms 1:00 pm / 7:00 pm **FIXED** | evergreen |
| SV-17 | L+71 · Wed Jan 20: 4 video platforms 1:00 pm / 7:00 pm | ny-2027 |
| SV-18 | L+10 · Fri Nov 20: 4 video platforms 1:00 pm / 7:00 pm | launch |
| SV-19 | L+22 · Wed Dec 2: 4 video platforms 1:00 pm / 7:00 pm | evergreen |
| SV-20 | L+25 · Sat Dec 5: 4 video platforms 1:00 pm / 7:00 pm | evergreen |
| SV-21 | L+29 · Wed Dec 9: 4 video platforms 1:00 pm / 7:00 pm | evergreen |
| SV-22 | L+32 · Sat Dec 12: 4 video platforms 1:00 pm / 7:00 pm | evergreen |
| SV-23 | L+36 · Wed Dec 16: 4 video platforms 1:00 pm / 7:00 pm | evergreen |
| SV-24 | L+39 · Sat Dec 19: 4 video platforms 1:00 pm / 7:00 pm | evergreen |
| SV-25 | L+74 · Sat Jan 23: 4 video platforms 1:00 pm / 7:00 pm | ny-2027 |
| SV-26 | L+48 · Mon Dec 28: 4 video platforms 1:00 pm / 7:00 pm | evergreen |
| SV-27 | L+12 · Sun Nov 22: 4 video platforms 1:00 pm / 7:00 pm **FIXED** | launch |
| TP-01 | L+0 · Tue Nov 10: LinkedIn profile 2:30 pm<br>L+1 · Wed Nov 11: LinkedIn Page 3:00 pm | launch |
| TP-02 | L+1 · Wed Nov 11: LinkedIn Page 11:00 am **PRICE** | launch |
| TP-03 | L+0 · Tue Nov 10: X 9:00 am | launch |
| TP-04 | L+1 · Wed Nov 11: X 9:00 am | launch |
| TP-05 | L+0 · Tue Nov 10: Threads 8:30 am | launch |
| TP-06 | L+0 · Tue Nov 10: Bluesky 11:30 am | launch |
| TP-07 | L+2 · Thu Nov 12: LinkedIn profile 2:30 pm<br>L+3 · Fri Nov 13: LinkedIn Page 10:00 am | launch |
| TP-08 | L+2 · Thu Nov 12: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | launch |
| TP-09 | L+7 · Tue Nov 17: LinkedIn profile 2:30 pm<br>L+8 · Wed Nov 18: LinkedIn Page 10:00 am | launch |
| TP-10 | L+8 · Wed Nov 18: LinkedIn profile 2:30 pm<br>L+9 · Thu Nov 19: LinkedIn Page 10:00 am | launch |
| TP-11 | L+9 · Thu Nov 19: LinkedIn profile 2:30 pm<br>L+10 · Fri Nov 20: LinkedIn Page 10:00 am | launch |
| TP-12 | L+10 · Fri Nov 20: LinkedIn profile 2:30 pm **OPTIONAL** | launch |
| TP-13 | L+13 · Mon Nov 23: LinkedIn profile 2:30 pm **FIXED** **OPTIONAL** | launch |
| TP-14 | L+14 · Tue Nov 24: LinkedIn profile 2:30 pm | evergreen |
| TP-15 | L+15 · Wed Nov 25: LinkedIn profile 2:30 pm **FIXED** | evergreen |
| TP-16 | L+17 · Fri Nov 27: LinkedIn profile 11:30 am **FIXED** | A: bf-2026 · B: evergreen |
| TP-17 | L+20 · Mon Nov 30: LinkedIn profile 2:30 pm **FIXED** **OPTIONAL** | evergreen |
| TP-18 | L+21 · Tue Dec 1: LinkedIn profile 2:30 pm | evergreen |
| TP-19 | L+22 · Wed Dec 2: LinkedIn profile 2:30 pm | evergreen |
| TP-20 | L+23 · Thu Dec 3: LinkedIn profile 2:30 pm | evergreen |
| TP-21 | L+24 · Fri Dec 4: LinkedIn profile 2:30 pm **OPTIONAL** | evergreen |
| TP-22 | L+27 · Mon Dec 7: LinkedIn profile 2:30 pm **OPTIONAL** | evergreen |
| TP-23 | L+28 · Tue Dec 8: LinkedIn profile 2:30 pm | evergreen |
| TP-24 | L+29 · Wed Dec 9: LinkedIn profile 2:30 pm | evergreen |
| TP-25 | L+30 · Thu Dec 10: LinkedIn profile 2:30 pm | evergreen |
| TP-26 | L+31 · Fri Dec 11: LinkedIn profile 2:30 pm **OPTIONAL** | evergreen |
| TP-27 | L+35 · Tue Dec 15: LinkedIn profile 2:30 pm | evergreen |
| TP-28 | L+34 · Mon Dec 14: LinkedIn profile 2:30 pm **OPTIONAL** | evergreen |
| TP-29 | L-5 · Thu Nov 5: LinkedIn profile 2:30 pm | launch |
| TP-30 | L+42 · Tue Dec 22: LinkedIn profile 2:30 pm | evergreen |
| TP-31 | L+63 · Tue Jan 12: LinkedIn profile 2:30 pm | ny-2027 |
| TP-32 | L+13 · Mon Nov 23: LinkedIn Page 10:00 am | launch |
| TP-33 | L+27 · Mon Dec 7: LinkedIn Page 10:00 am | evergreen |
| TP-34 | L-6 · Wed Nov 4: LinkedIn profile 2:30 pm | launch |
| TP-35 | Reserve: February (one LinkedIn poll a month) | evergreen |
| TP-36 | L+65 · Thu Jan 14: LinkedIn profile 2:30 pm | ny-2027 |
| TP-37 | L+58 · Thu Jan 7: LinkedIn profile 2:30 pm | ny-2027 |
| TP-38 | L+77 · Tue Jan 26: LinkedIn profile 2:30 pm **PRICE** | ny-2027 |
| TP-39 | L+7 · Tue Nov 17: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | launch |
| TP-40 | L+8 · Wed Nov 18: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | launch |
| TP-41 | L+9 · Thu Nov 19: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | launch |
| TP-42 | L+21 · Tue Dec 1: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | evergreen |
| TP-43 | L+22 · Wed Dec 2: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | evergreen |
| TP-44 | L+23 · Thu Dec 3: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | evergreen |
| TP-45 | L+28 · Tue Dec 8: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | evergreen |
| TP-46 | L+29 · Wed Dec 9: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | evergreen |
| TP-47 | L+30 · Thu Dec 10: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | evergreen |
| TP-48 | L+35 · Tue Dec 15: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | evergreen |
| TP-49 | L+36 · Wed Dec 16: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | evergreen |
| TP-50 | L+37 · Thu Dec 17: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | evergreen |
| TP-51 | L+42 · Tue Dec 22: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | evergreen |
| TP-52 | L+56 · Tue Jan 5: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | ny-2027 |
| TP-53 | L+58 · Thu Jan 7: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | ny-2027 |
| TP-54 | L+63 · Tue Jan 12: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | ny-2027 |
| TP-55 | L+64 · Wed Jan 13: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | ny-2027 |
| TP-56 | L+65 · Thu Jan 14: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | ny-2027 |
| TP-57 | L+70 · Tue Jan 19: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | ny-2027 |
| TP-58 | L+72 · Thu Jan 21: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | ny-2027 |
| TP-59 | L+77 · Tue Jan 26: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am | ny-2027 |
| TP-60 | L+14 · Tue Nov 24: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am **FIXED** | evergreen |
| TP-61 | L+17 · Fri Nov 27: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am **FIXED** | evergreen |
| TP-62 | L+49 · Tue Dec 29: Threads 8:30 am, X 9:00 am, Bluesky 11:30 am **FIXED** | evergreen |
| TP-63 | L+56 · Tue Jan 5: LinkedIn newsletter 9:00 am **FIXED**<br>L+57 · Wed Jan 6: LinkedIn Page 10:00 am | ny-2027 |
| TP-64 | L+70 · Tue Jan 19: LinkedIn newsletter 9:00 am<br>L+71 · Wed Jan 20: LinkedIn Page 10:00 am | ny-2027 |
| TP-65 | L+84 · Tue Feb 2: LinkedIn newsletter 9:00 am (after this calendar) | evergreen |
| TP-66 | L+98 · Tue Feb 16: LinkedIn newsletter 9:00 am (after this calendar) | evergreen |
| VC-01 | L+1 · Wed Nov 11: IG feed 12:30 pm **CONFIRM** | launch |
| VC-02 | L+4 · Sat Nov 14: IG feed 12:30 pm | launch |
| VC-03 | L+6 · Mon Nov 16: IG feed 12:30 pm<br>L+56 · Tue Jan 5: Facebook Page 9:30 am | launch, ny-2027 |
| VC-04 | L+8 · Wed Nov 18: IG feed 12:30 pm | launch |
| VC-05 | L+11 · Sat Nov 21: IG feed 12:30 pm | launch |
| VC-06 | L+14 · Tue Nov 24: IG feed 12:30 pm | evergreen |
| VC-07 | L-5 · Thu Nov 5: IG feed 12:30 pm | launch |
| VC-08 | L+7 · Tue Nov 17: IG feed 12:30 pm **FIXED** | launch |
| VC-09 | L+24 · Fri Dec 4: IG feed 12:30 pm | evergreen |
| VC-10 | L+59 · Fri Jan 8: IG feed 12:30 pm, Pinterest 8:00 pm | ny-2027, evergreen |
| VC-11 | L+17 · Fri Nov 27: IG feed 12:30 pm **FIXED**<br>L+20 · Mon Nov 30: Facebook Page 9:30 am **FIXED** | evergreen |
| VC-12 | L+31 · Fri Dec 11: IG feed 12:30 pm<br>L+63 · Tue Jan 12: Facebook Page 9:30 am | evergreen, ny-2027 |
| VC-13 | L+66 · Fri Jan 15: IG feed 12:30 pm, Pinterest 8:00 pm<br>L+70 · Tue Jan 19: Facebook Page 9:30 am<br>L+79 · Thu Jan 28: Pinterest 8:00 pm | ny-2027, evergreen |
| VC-14 | L+49 · Tue Dec 29: Facebook Page 9:30 am, IG feed 12:30 pm **FIXED**<br>L+56 · Tue Jan 5: Pinterest 8:00 pm | evergreen |
| VC-15 | L+73 · Fri Jan 22: IG feed 12:30 pm, Pinterest 8:00 pm **CONFIRM** **PRICE**<br>L+77 · Tue Jan 26: Facebook Page 9:30 am **PRICE** | ny-2027, evergreen |
| VC-16 | L+0 · Tue Nov 10: IG Stories 9:30 am | launch |
| VC-17 | L+1 · Wed Nov 11: IG Stories 1:00 pm | launch |
| VC-18 | L+2 · Thu Nov 12: IG Stories 7:15 pm | launch |
| VC-19 | L+3 · Fri Nov 13: IG Stories 7:15 pm | launch |
| VC-20 | L+4 · Sat Nov 14: IG Stories 1:00 pm | launch |
| VC-21 | L+5 · Sun Nov 15: IG Stories 7:15 pm | launch |
| VC-22 | L+6 · Mon Nov 16: IG Stories 1:00 pm | launch |
| VC-23 | L+7 · Tue Nov 17: IG Stories 7:15 pm | launch |
| VC-24 | L+8 · Wed Nov 18: IG Stories 1:00 pm | launch |
| VC-25 | L+9 · Thu Nov 19: IG Stories 7:15 pm | launch |
| VC-26 | L+10 · Fri Nov 20: IG Stories 7:15 pm | launch |
| VC-27 | L+11 · Sat Nov 21: IG Stories 1:00 pm | launch |
| VC-28 | L+12 · Sun Nov 22: IG Stories 7:15 pm | launch |
| VC-29 | L+13 · Mon Nov 23: IG Stories 10:00 am | launch |
| VC-30 | L-9 · Sun Nov 1: IG Stories 10:00 am | evergreen |
| VC-31 | L-9 · Sun Nov 1: IG Stories 10:00 am | evergreen |
| VC-32 | L-9 · Sun Nov 1: IG Stories 10:00 am | evergreen |
| VC-33 | L-9 · Sun Nov 1: IG Stories 10:00 am | evergreen |
| VC-34 | L-9 · Sun Nov 1: IG Stories 10:00 am | evergreen |
| VC-35 | L-9 · Sun Nov 1: IG Stories 10:00 am | evergreen |
| VC-36 | Reserve: when Instagram opens Broadcast Channels to you (1,000+ followers) | evergreen |
| VC-37 | Reserve: when Instagram opens Broadcast Channels to you (1,000+ followers) | evergreen |
| VC-38 | Reserve: when Instagram opens Broadcast Channels to you (1,000+ followers) | evergreen |
| VC-39 | L+2 · Thu Nov 12: Pinterest 8:00 pm | evergreen |
| VC-40 | L-6 · Wed Nov 4: Pinterest 8:00 pm **FIXED** | evergreen |
| VC-41 | L+4 · Sat Nov 14: Pinterest 8:00 pm | evergreen |
| VC-42 | L+7 · Tue Nov 17: Pinterest 8:00 pm | evergreen |
| VC-43 | L+21 · Tue Dec 1: Pinterest 8:00 pm | evergreen |
| VC-44 | L+37 · Thu Dec 17: Pinterest 8:00 pm | evergreen |
| VC-45 | L+9 · Thu Nov 19: Pinterest 8:00 pm | evergreen |
| VC-46 | L-4 · Fri Nov 6: Pinterest 8:00 pm | evergreen |
| VC-47 | L+42 · Tue Dec 22: Pinterest 8:00 pm | evergreen |
| VC-48 | L+49 · Tue Dec 29: Pinterest 8:00 pm | evergreen |
| VC-49 | L-2 · Sun Nov 8: Pinterest 8:00 pm | evergreen |
| VC-50 | L+0 · Tue Nov 10: Pinterest 8:00 pm<br>L+34 · Mon Dec 14: Pinterest 8:00 pm **FIXED** | evergreen |
| VC-51 | L+18 · Sat Nov 28: Pinterest 8:00 pm | evergreen |
| VC-52 | L+11 · Sat Nov 21: Pinterest 8:00 pm | evergreen |
| VC-53 | L+0 · Tue Nov 10: Pinterest 8:00 pm | evergreen |
| VC-54 | L+14 · Tue Nov 24: Pinterest 8:00 pm | evergreen |
| VC-55 | L+28 · Tue Dec 8: Pinterest 8:00 pm | evergreen |
| VC-56 | L+23 · Thu Dec 3: Pinterest 8:00 pm | evergreen |
| VC-57 | L+30 · Thu Dec 10: Pinterest 8:00 pm | evergreen |
| VC-58 | L+35 · Tue Dec 15: Pinterest 8:00 pm | evergreen |
| VC-59 | L+0 · Tue Nov 10: Facebook Page 9:30 am | launch |
| VC-60 | L+2 · Thu Nov 12: Facebook Page 9:30 am | launch |
| VC-61 | L-5 · Thu Nov 5: Facebook Page 9:30 am | launch |
| VC-62 | L+7 · Tue Nov 17: Facebook Page 9:30 am | launch |
| VC-63 | L+21 · Tue Dec 1: Facebook Page 9:30 am | evergreen |
| VC-64 | L+30 · Thu Dec 10: Facebook Page 9:30 am | evergreen |
| VC-65 | L+23 · Thu Dec 3: Facebook Page 9:30 am | evergreen |
| VC-66 | L+28 · Tue Dec 8: Facebook Page 9:30 am | evergreen |
| VC-67 | L+37 · Thu Dec 17: Facebook Page 9:30 am | evergreen |
| VC-68 | L+9 · Thu Nov 19: Facebook Page 9:30 am **FIXED** | launch |
| VC-69 | L+14 · Tue Nov 24: Facebook Page 9:30 am | evergreen |
| VC-70 | L+35 · Tue Dec 15: Facebook Page 9:30 am | evergreen |
| VC-71 | L+42 · Tue Dec 22: Facebook Page 9:30 am | evergreen |
| VC-72 | L+17 · Fri Nov 27: Facebook Page 9:30 am **FIXED** **OPTIONAL** **PRICE** | bf-2026 |
| VC-73 | L+55 · Mon Jan 4: Facebook Group 9:00 am | ny-2027 |
| VC-74 | L+62 · Mon Jan 11: Facebook Group 9:00 am<br>L+69 · Mon Jan 18: Facebook Group 9:00 am<br>L+76 · Mon Jan 25: Facebook Group 9:00 am | ny-2027 |
| VC-75 | L+64 · Wed Jan 13: Facebook Group 9:00 am<br>L+71 · Wed Jan 20: Facebook Group 9:00 am<br>L+78 · Wed Jan 27: Facebook Group 9:00 am | ny-2027 |
| VC-76 | L+66 · Fri Jan 15: Facebook Group 9:00 am<br>L+73 · Fri Jan 22: Facebook Group 9:00 am<br>L+80 · Fri Jan 29: Facebook Group 9:00 am | ny-2027 |
| VC-77 | L+72 · Thu Jan 21: Facebook Group 9:00 am | ny-2027 |
| VC-78 | L+53 · Sat Jan 2: IG Stories 10:00 am<br>L+55 · Mon Jan 4: Facebook Group 12:00 pm<br>L+56 · Tue Jan 5: Facebook Group 9:00 am<br>L+57 · Wed Jan 6: Facebook Group 9:00 am<br>L+58 · Thu Jan 7: Facebook Group 9:00 am<br>L+59 · Fri Jan 8: Facebook Group 9:00 am<br>L+60 · Sat Jan 9: Facebook Group 9:00 am<br>L+61 · Sun Jan 10: Facebook Group 9:00 am | ny-2027 |
| VC-79 | As needed from L+7 · Tue Nov 17: your intro in each new Facebook group | by date |
| VC-80 | As needed from L+7 · Tue Nov 17: Tue and Thu community slots | by date |
| VC-81 | As needed from L+7 · Tue Nov 17: Tue and Thu community slots | by date |
| VC-82 | As needed from L+7 · Tue Nov 17: Tue and Thu community slots | by date |
| VC-83 | Only when someone asks and the group allows links | by date |
| LC-01 | Set up on L-18 · Fri Oct 23 (channel copy, not a post) | evergreen |
| LC-02 | Set up on L-18 · Fri Oct 23 (channel links, not a post) | evergreen |
| LC-03 | Set up on L-18 · Fri Oct 23 (banner, keywords, upload defaults) | evergreen |
| LC-04 | L+0 · Tue Nov 10: YouTube 11:00 am | launch |
| LC-05 | Created on L-18 · Fri Oct 23; LC-08 added L+0 · Tue Nov 10 | evergreen |
| LC-06 | Created on L-18 · Fri Oct 23; LC-10 added L+28 · Tue Dec 8 | evergreen |
| LC-07 | Created on L-18 · Fri Oct 23; LC-13 added L+42 · Tue Dec 22 | evergreen |
| LC-08 | L+0 · Tue Nov 10: YouTube 11:00 am **PRICE** | launch |
| LC-09 | L+70 · Tue Jan 19: YouTube 11:00 am **PRICE** | ny-2027 |
| LC-10 | L+28 · Tue Dec 8: YouTube 11:00 am **PRICE** | evergreen |
| LC-11 | L+14 · Tue Nov 24: YouTube 11:00 am **PRICE** | evergreen |
| LC-12 | L+84 · Tue Feb 2: YouTube 11:00 am (after this calendar) | evergreen |
| LC-13 | L+42 · Tue Dec 22: YouTube 11:00 am **PRICE** | evergreen |
| LC-14 | L+98 · Tue Feb 16: YouTube 11:00 am (after this calendar) | evergreen |
| LC-15 | L+56 · Tue Jan 5: YouTube 11:00 am **FIXED** | ny-2027 |
| LC-16 | L+0 · Tue Nov 10: YouTube Post 11:30 am<br>L+2 · Thu Nov 12: YouTube Post 12:00 pm **OPTIONAL** | launch |
| LC-20 | Set up on L-15 · Mon Oct 26 (Reddit account; handle reserved L-21) | evergreen |
| LC-21 | L+23 · Thu Dec 3: Reddit 8:30 am | evergreen |
| LC-22 | L+57 · Wed Jan 6: Reddit 8:30 am | ny-2027 |
| LC-23 | L+30 · Thu Dec 10: Reddit 8:30 am | evergreen |
| LC-24 | L+36 · Wed Dec 16: Reddit 8:30 am | evergreen |
| LC-25 | L+71 · Wed Jan 20: Reddit 8:30 am | ny-2027 |
| LC-26 | L+64 · Wed Jan 13: Reddit 8:30 am | ny-2027 |
| LC-27 | As needed from L-6 · Wed Nov 4: Reddit comment replies (Wednesday community slot) | by date |
| LC-28 | As needed from L-6 · Wed Nov 4: Reddit comment replies (Wednesday community slot) | by date |
| LC-29 | As needed from L-6 · Wed Nov 4: Reddit comment replies (Wednesday community slot) | by date |
| LC-30 | As needed from L-6 · Wed Nov 4: Reddit comment replies (Wednesday community slot) | by date |
| LC-31 | As needed from L-6 · Wed Nov 4: Reddit comment replies (Wednesday community slot) | by date |
| LC-32 | As needed from L-6 · Wed Nov 4: Reddit comment replies (Wednesday community slot) | by date |
| LC-33 | As needed from L-6 · Wed Nov 4: Reddit comment replies (Wednesday community slot) | by date |
| LC-34 | As needed from L-6 · Wed Nov 4: Reddit comment replies (Wednesday community slot) | by date |
| LC-40 | Made L+7 to L+9 · Nov 17 to 19, then attached to every LC-41 and LC-50 | evergreen |
| LC-41 | L+13 · Mon Nov 23: Email (one-to-one) 10:00 am<br>L+21 · Tue Dec 1: Email (one-to-one) 10:00 am<br>L+28 · Tue Dec 8: Email (one-to-one) 10:00 am<br>L+35 · Tue Dec 15: Email (one-to-one) 10:00 am<br>L+56 · Tue Jan 5: Email (one-to-one) 10:00 am<br>L+63 · Tue Jan 12: Email (one-to-one) 10:00 am<br>L+70 · Tue Jan 19: Email (one-to-one) 10:00 am<br>L+77 · Tue Jan 26: Email (one-to-one) 10:00 am | evergreen |
| LC-42 | L+21 · Tue Dec 1: Email (one-to-one) 10:00 am<br>L+28 · Tue Dec 8: Email (one-to-one) 10:00 am<br>L+35 · Tue Dec 15: Email (one-to-one) 10:00 am<br>L+56 · Tue Jan 5: Email (one-to-one) 10:00 am<br>L+63 · Tue Jan 12: Email (one-to-one) 10:00 am<br>L+70 · Tue Jan 19: Email (one-to-one) 10:00 am<br>L+77 · Tue Jan 26: Email (one-to-one) 10:00 am | evergreen |
| LC-43 | When a podcast books you | evergreen |
| LC-44 | After each recording | evergreen |
| LC-45 | L+28 · Tue Dec 8: DM 10:00 am | evergreen |
| LC-46 | L+29 · Wed Dec 9: DM 10:00 am | evergreen |
| LC-47 | When you join a community, from L+8 · Wed Nov 18 | evergreen |
| LC-48 | Reserve: after 4 or more newsletter issues | evergreen |
| LC-49 | Reserve: after 4 or more newsletter issues | evergreen |
| LC-50 | L+21 · Tue Dec 1: Email (one-to-one) 10:00 am<br>L+28 · Tue Dec 8: Email (one-to-one) 10:00 am | evergreen |
| LC-51 | When an organization says yes to a talk | evergreen |
| LC-52 | One week before a booked talk | evergreen |
| LC-53 | The day after a talk | evergreen |
| LC-54 | L+21 · Tue Dec 1: Email (one-to-one) 10:00 am | evergreen |
| LC-60 | From L+7 · Tue Nov 17; update after every send | - |

Back to the [README](README.md).
