# Principe AI: complete briefing

*Prepared Thursday, October 22, 2026 (L-19, which means 19 days before the social launch). Paste this whole document into any AI assistant.*

## For the AI reading this

You are helping Ryan, the founder of Principe AI. This document is a complete briefing on his business: what Principe AI is, who it serves, every offer and price, how the website and platform work, the tech and deploy setup, and exactly where the social media launch stands today, **Thursday, October 22, 2026**.

How to use it:

- **Treat it as ground truth.** If Ryan, a tool result or your own assumption contradicts it, point out the conflict and ask before you act on it. Ryan's latest word wins.
- **Never invent** stats, testimonials, reviews, student counts, results, time saved, revenue, credentials or founder details. Principe AI has none of those yet. If something here is marked *unconfirmed*, treat it as unknown and say so.
- **Prices** below are code defaults. Before quoting one publicly, check with Ryan (he can see live prices in Admin → Courses and Admin → Availability).
- **Times** are US Eastern (America/New_York) unless marked UTC. Clocks go back on Sun Nov 1, 2026.
- **Work Ryan's way** (section 15): one task at a time, with copy-paste-ready text. Then wait until he says "done" or "completed".
- **Shorthand.** *L-day* means days relative to launch day: L+0 is Tue Nov 10, 2026 and today is L-19. *Post IDs* (LD-, SV-, TP-, VC-, LC-, CB-) refer to items in the social launch kit in the repo at `deliverables/social-launch/`.

## At a glance

- **What it is:** Principe AI teaches practical, plain-English AI and implements it for businesses. It is the AI practice of Principe Consults. Tagline: "Learn AI. Implement AI. Grow with AI." Method: **Assess → Learn → Implement**.
- **Who it's for:** everyday people, professionals, business owners and founders, and team leaders. There are two paths, "For your life" and "For your business".
- **Founder:** Ryan (Ryan Principe on LinkedIn). He is US-based and appears on camera. Business contact: principeconsults@gmail.com.
- **Free offers:** the AI Starter Kit (50 prompts plus a 7-day plan) at `/free-guide`; the AI Readiness Assessment (about 3 minutes, a score out of 100 and a personalised plan) at `/assessment`; a free 30-minute AI Strategy Call; 7 free preview lessons.
- **Courses (code-default prices):** AI Essentials $47, AI for Business Owners $297 (featured), AI Automation Accelerator $497.
- **Calls:** a 1:1 AI Coaching Session is $150 for 60 minutes. The strategy call (30 min) and the implementation discovery call (45 min) are free. Live prices are **unconfirmed** (editable in Admin → Courses and Admin → Availability).
- **Done-with-you AI implementation:** prices are never published. Clients get a custom quote after a free 45-minute discovery call. Apply at `/consulting`.
- **Website:** https://principeai.com is a custom Next.js 16 app on Vercel. It includes a CRM, email automations, booking, Stripe checkout, a student portal with a Claude AI tutor, a site chat assistant and an admin panel.
- **Code:** GitHub repo `rythegammer-ui/PrincipeAi`. Production branch: `claude/upbeat-hypatia-sh31wl`. Work branch: `claude/sweet-edison-ne5duy`.
- **Social launch:** Tue Nov 10, 2026. Warm-up posts start Wed Nov 4. Tier 1 platforms: Instagram, TikTok, YouTube, LinkedIn, Facebook Page.
- **Status:** every profile is set up except the LinkedIn Company Page, which is blocked, and the Reddit personal account (prompt given, rules table pending). LD-01 is scheduled in Postiz for Nov 10 at 9:00 am ET on 4 platforms. Batch A filming is Sat Oct 24.
- **Tools:** Postiz handles scheduling and is connected to Claude via MCP. Never schedule to the personal Instagram "ryan principe" or the Reddit brand account. Claude in Chrome handles browser tasks.
- **Bio link everywhere:** `https://principeai.com/links?utm_source=<platform>&utm_medium=bio&utm_campaign=evergreen&utm_content=bio`
- **DM keywords:** KIT goes to the Starter Kit, READY to the assessment, WORKFLOW to a free lesson.
- **Hard rules:**
  - No testimonials, results, income or time-saved claims, student counts, "was" prices or guarantees.
  - No claim of partnership with Anthropic, OpenAI or Google.
  - The "AI tutor" and "plan written by Claude" lines may only be used once the production AI key is confirmed working.
- **Biggest open items:**
  - Verify that `ANTHROPIC_API_KEY` actually works.
  - Confirm live prices.
  - Create the LinkedIn Company Page.
  - Confirm Stripe, Resend and the env vars. Claude's Vercel access is blocked with a 403.

---

## 1. The founder and the company

- **Founder and owner:** Ryan, shown as Ryan Principe on LinkedIn: https://www.linkedin.com/in/ryan-principe-90268b445/. He is based in the US (America/New_York) and appears on camera (decided Oct 21).
- **Approved founder line, in his words:** "Hi, I'm Ryan. I use AI in just about everything I do. I've built several businesses, from Principe Consults and Parts Pro to Principe Repair and Performance, a local business serving my community. Principe AI is where I share how I actually use it."
- **No credential line.** Do not add credentials, titles, years of experience or client results.
  - The kit has placeholders `[YOUR NAME]`, `[YOUR STORY: …]` and `[YOUR CREDENTIAL IF ANY]`. Fill them only with true details, or delete them.
  - The founder story still has to go into TP-01, TP-02, TP-05, TP-12, the LinkedIn About section and the LC-04 YouTube trailer.
- **Company:** Principe AI is "the AI education and implementation practice of Principe Consults" (About page).
  - The site's Organization structured data lists Principe Consults as parent organization.
  - Principe Consults' legal form (sole proprietorship or LLC) is **unconfirmed**. It matters for the LinkedIn Page organization type.
  - The Terms set governing law as the jurisdiction where Principe Consults is established, which is not named.
- **Contact:** principeconsults@gmail.com is the public contact and the reply-to on customer emails (the `CONTACT_EMAIL` default). Currency is USD.
- **Business mailing address:** Ryan reports it is entered in Admin → Settings for the CAN-SPAM email footer. Claude has not verified this.
- **What does not exist yet:**
  - A founder name or bio on the About page.
  - Testimonials (`site.testimonials` is empty, so the testimonial sections stay hidden).
  - Recorded lesson videos.
  - A LinkedIn Company Page.

## 2. Brand

### Positioning

- **Name:** Principe AI. **Tagline:** "Learn AI. Implement AI. Grow with AI."
- **Description:** "Practical AI education and implementation for business owners, professionals, and everyday people. Courses, coaching, and done-with-you AI systems."
- **Core promise:** "Make AI work for you — in your life and your business."
- **Offer ladder:** "Start free. Go as far as you want." Free resources lead to self-paced courses, then 1:1 coaching, then done-with-you implementation.
- **Model:** Assess. Learn. Implement. The About page uses Teach. Coach. Build.
- **Tool-agnostic:** teaches Claude, ChatGPT and Gemini, plus Microsoft Copilot in the courses. Free versions are enough for the Starter Kit and AI Essentials.
- **Mission (About):** "Close the gap between AI's promise and everyday results." The goal is to make AI understandable, practical and safe, so that:
  - a parent can plan a busy week in minutes;
  - a professional can reclaim hours of writing and research;
  - a small business can serve customers like much larger companies.
- **Honesty promise (About):** "We'll always recommend the simplest thing that works for you — even when that's a free resource rather than a paid course or project. AI is powerful, but it isn't magic..."
- **About-page principles card:**
  - Principles: "Practical over hype", "Plain English, always", "Your goals before our tools", "Responsible by default".
  - Quote: "The simplest thing that genuinely works for you." ("The test we apply to every recommendation we make.")
- **Six values:** Practical over hype; Plain English, always; Your goals first; Responsible by default; Learn by doing; Here for the long run.
- **Working principle:** "AI drafts, people decide."

### Voice

- **Tone:** confident, warm, plain English, focused on outcomes, no hype. American spelling.
- **Hard limits:** no invented stats or testimonials.
- **Calls to action:**
  - Video CTAs end with "Link's in my profile."
  - One CTA per video.
  - Keyword asks are a way to deliver something ("comment #prompts and I'll send it"), never vote-bait.
- **Six content pillars**, each with its destination:
  - **P1 Prompt like a pro:** `/free-guide`, then AI Essentials ($47).
  - **P2 AI for everyday life:** `/free-guide`.
  - **P3 Use AI safely and smartly:** AI Essentials.
  - **P4 AI for business owners:** `/assessment`, then AI for Business Owners ($297). Secondary: strategy call, `/consulting`.
  - **P5 Automations and agents, without the hype:** AI Automation Accelerator ($497), `/consulting`.
  - **P6 Assess, Learn, Implement (brand and offers):** `/assessment`, strategy call, coaching, consulting.

### Visual identity

- **Primary colour:** royal violet `#6938EF` (brand-600). Full scale:
  - 50 #f4f3ff, 100 #ebe9fe, 200 #d9d6fe, 300 #bdb4fe, 400 #9b8afb, 500 #7a5af8
  - 600 #6938ef, 700 #5925dc, 800 #4a1fb8, 900 #3e1c96, 950 #27115f
- **Accent gold:** 50 #fffaeb, 100 #fef0c7, 200 #fedf89, 300 **#fec84b**, 400 **#fdb022**, 500 #f79009, 600 #dc6803, 700 #b54708.
- **Other colours:** dark "ink" bands use #0c0a1d and #15122b. Neutrals are Tailwind zinc.
- **Fonts:**
  - Geist for body text, plus Geist Mono.
  - Instrument Serif for display accents, often italic.
  - Free Canva stand-ins: Inter, plus DM Serif Display or Playfair Display Italic.
- **Logo mark:**
  - A 512×512 rounded square (corner radius 116) with a diagonal violet gradient #7a5af8 → #6938ef → #4a1fb8 and a soft white glow.
  - On it sit a large white four-point sparkle and a small gold (#fec84b) sparkle.
  - The avatar has no text.
- **Wordmark:** "Principe" + " AI". "AI" is violet on light backgrounds and gold on dark ones.
- **Site style:**
  - Sections alternate white, zinc-50 and ink. Cards are rounded-2xl with soft shadows.
  - Icons come from lucide-react.
  - Button variants: primary, secondary, outline, ghost, danger, gold, white.
- **OG share image:** 1200×630 with the "Principe AI" wordmark ("AI" in gold) and "Make AI work for you.", where "for you." is gold.
- **Banner headline:** "Learn AI. Implement AI. Grow with AI." with "Grow with AI." in gold serif italic.
- **Logo files** in `deliverables/brand/`:
  - `principe-ai-logo.svg`
  - `principe-ai-logo-square.svg`
  - `principe-ai-logo-1024.png`
  - `principe-ai-logo-512.png`
  - `principe-ai-vercel-avatar-512.png`
- **Social images** in `deliverables/social-launch/images/` (all uploaded to the profiles, per Ryan):
  - `profile-picture-1080.png` (also the LinkedIn Page logo)
  - `facebook-cover-1640x624.png`
  - `linkedin-page-cover-4200x700.png`
  - `linkedin-profile-banner-1584x396.png`
  - `x-bluesky-header-1500x500.png`
  - `youtube-banner-2560x1440.png`
  - `youtube-watermark-300.png`

### Profile copy

- **Display names:**
  - Instagram and TikTok: "Principe AI | AI Tips & Tools".
  - X: "Principe AI | Practical AI for Life & Business".
  - Pinterest: "Principe AI | AI Prompt Ideas".
  - YouTube, LinkedIn Page, Facebook and Bluesky: "Principe AI".
- **Instagram bio:** "Practical AI for your life and business. / Assess → Learn → Implement. / Free AI Starter Kit: 50 copy-paste prompts + a 7-day plan ↓"
- **Facebook bio:** "Practical AI for your life and business. Learn AI. Implement AI. Grow with AI."
- **LinkedIn headline:** "Founder, Principe AI · I help business owners and busy professionals put AI to work, in plain English · Courses, coaching and done-with-you AI systems"
- **LinkedIn Page tagline:** "Learn AI. Implement AI. Grow with AI. Practical AI courses, coaching and done-with-you AI systems."
- **Category and contact:** category is Education; contact is principeconsults@gmail.com.
- **Never in profiles:** prices, the AI tutor, or the downloadable app or book.

## 3. Audience and the two paths

### Who it serves

- **Groups:** everyday people, busy professionals and parents, business owners and founders, and team leaders. No technical background is needed.
- **Free guide audience:** "Curious beginners; Busy professionals & parents; Business owners & teams."
- **Implementation audience:** businesses and teams that want AI systems built for them rather than doing it themselves. Training-only engagements are also available.
- **AI for Business Owners suits:** service businesses, trades, agencies, consultancies, e-commerce, local businesses and professional practices. Regulated fields need extra care.

### The home page (`/`)

- **Hero:**
  - Pill: "AI education & implementation".
  - H1: "Make AI work **for you** — in your life and your business."
  - Sub: "Practical, plain-English AI education for everyday people and business owners — plus hands-on coaching and done-with-you implementation when you want AI working for you, fast."
  - CTAs: "Take the free AI assessment" and "Explore courses".
  - Ticks: "No tech background needed", "Practical, not hype", "Learn at your own pace".
- **The two paths** ("Two paths, one goal" / "AI that fits your world"):
  - **For your life:** "Less busywork. More of what matters."
    - Outcomes: plan meals, trips and busy weeks in minutes; write emails, messages and documents faster in your own voice; learn new skills with a patient tutor; get a clear second opinion on bills, contracts and big decisions.
    - CTAs: "Courses for everyday life" (`/courses?for=life`) and "Get the free Starter Kit" (`/free-guide`).
  - **For your business:** "Put AI to work across your business."
    - Outcomes: a 24/7 customer-question assistant that knows your business; one idea turned into a week of posts, emails and content; automated lead follow-up, scheduling and routine admin; team AI workflows, guardrails and training.
    - CTAs: "Courses for business" (`/courses?for=business`) and "Have it built for you" (`/consulting`).
- **Outcomes** ("Skills you'll use every single week"): Write prompts that work; Write and edit in your voice; Research and summarise fast; Automate repetitive work; Build your own AI assistants; Spot your best opportunities; Use AI safely and responsibly; Bring your team along.
- **How it works:**
  - **Assess:** the free assessment gives a score, a personalised plan and an honest recommendation.
  - **Learn:** short practical lessons with an AI tutor, or 1:1 coaching.
  - **Implement:** use the workflows yourself, or have them designed and built with your team.
- **Assessment band:**
  - Headline: "How ready are you for AI? Find out in three minutes."
  - Chips: "Your AI readiness score", "A personalised action plan", "Your best next step".
  - Secondary link: "Or book a free strategy call".
- **FAQs:**
  - Do I need a technical background? No.
  - Which AI tools will I learn? ChatGPT, Claude and Gemini; you are not locked to one app.
  - Is it safe with personal or business information?
  - How is this different from free videos? A clear path, exercises, an AI tutor in every lesson and real people.
  - Course vs coaching vs build?
  - How quickly will I see results? Something usable from the first lesson; the Starter Kit's day-by-day plan is designed to make AI part of your routine within a week.
  - What does implementation cost? No published prices; a written scope and quote come after a free discovery call.
  - Can I get help choosing? Yes: a free strategy call or a message.
- **Final CTA:** "Ready to make AI work for you?" It leads to the assessment, the Starter Kit and booking a free call.
- **Testimonials section:** hidden while there are none.

### The About page

- **H1:** "AI should make life **easier** — for everyone."
- **What we do:**
  - **Teach:** short practical courses.
  - **Coach:** one-on-one sessions on your real tasks.
  - **Build:** done-with-you assistants, automations and training.
- **Final CTA:** "Let's find your first AI win".

## 4. Offers

**Prices are editable in Admin → Courses (courses) and Admin → Availability (calls).** The figures below are the code defaults. Ryan has **not yet confirmed** the live prices, so check before you name one.

### 4.1 Free offers

- **AI Starter Kit** at `/free-guide`. Details in section 5.
- **AI Readiness Assessment** at `/assessment`. Details in section 6.
- **Free AI Strategy Call:** 30 minutes, at `/book/ai-strategy-call`.
- **Free AI Implementation Discovery Call:** 45 minutes, at `/book/implementation-discovery`, for businesses.
- **Free preview lessons:** 7 in total. No login is needed. The AI tutor is **not** available on previews.
  - Each one has its own page and share card ("Free lesson: <title>") at `/courses/<course>/preview/<lesson>`.
  - Non-preview lessons redirect to the sales page.

| Course | Preview lesson slug | Lesson | Min |
|---|---|---|---|
| ai-essentials | `what-ai-really-is` | 1.1 What AI Really Is (and Isn't) | 9 |
| ai-essentials | `the-five-part-prompt` | 2.1 The 5-Part Prompt | 12 |
| ai-essentials | `emails-and-messages` | 3.1 Emails, Texts & Tricky Messages | 10 |
| ai-for-business | `where-ai-pays-off` | 1.1 Where AI Actually Pays Off | 12 |
| ai-for-business | `business-prompt-framework` | 2.1 The Business Brief | 16 |
| ai-automation-accelerator | `anatomy-of-an-ai-workflow` | 1.1 Anatomy of an AI Workflow (the WORKFLOW DM keyword) | 14 |
| ai-automation-accelerator | `blueprint-lead-qualification` | 3.1 Blueprint: Lead Capture, AI Qualification and Follow-Up | 22 |

- **Site chat assistant (Claude):**
  - Name "Principe AI Assistant". Greeting: "Hi! I'm the Principe AI assistant. Ask me anything about using AI in your life or business — or which course is right for you."
  - It answers questions and points visitors to offers. It cannot book calls or take payments.

### 4.2 Courses

| Course | Slug | Price | Level | Audience | Modules / lessons | Length | Previews |
|---|---|---|---|---|---|---|---|
| AI Essentials: Use AI in Everyday Life | `ai-essentials` | **$47** | Beginner | life | 5 / 18 | 194 min (~3 h) | 3 |
| AI for Business Owners: The Implementation Playbook | `ai-for-business` | **$297** | Intermediate | business | 6 / 20 | 299 min (~5 h) | 2 |
| AI Automation Accelerator: Build Workflows & Agents | `ai-automation-accelerator` | **$497** | Advanced | both | 5 / 18 | 320 min (5 h 20 m) | 2 |

What all three courses share:

- **Catalog:** order is Essentials, Business Owners, Accelerator. AI for Business Owners is **featured** (highlighted in the catalog and the offer ladder).
- **No compare-at ("was") price** is set. Leave it blank so the site makes no former-price claim.
  - Old databases may still hold compare-at values of $97, $497 and $797. Clear them.
- **Every course lists:** "AI tutor inside every lesson", "Lifetime access" and "Certificate of completion".
  - The printable certificate unlocks once every lesson is complete.
- **Catalog features:** short, practical lessons; an AI tutor in every lesson; learn at your own pace (progress saved); lifetime access ("Buy once and keep access, including updates").
- **Catalog filter:** `/courses?for=life` or `?for=business`. Courses for "both" audiences show in both.
- **No lesson videos are recorded or linked yet.** Lessons are text (Markdown) plus exercises.
- **AI tutor:** Claude, Socratic in style and grounded in the lesson.
  - Replies run under about 200 words and can offer exercises, prompts and 3-question quizzes.
  - Paying students and students Ryan grants access get the tutor budget. Free enrollments use the chat budget.

#### AI Essentials: Use AI in Everyday Life ($47)

- **Subtitle:** "Go from curious to confident with AI assistants. 18 short, plain-English lessons, no tech background needed."
- **Includes:**
  - 18 bite-size lessons (about 3 hours in total)
  - 60+ copy-paste prompts and templates
  - A hands-on exercise in every lesson
  - The 30-day AI habit plan
  - AI tutor, lifetime access, certificate
- **Outcomes:** understand what AI is and why it makes things up; write prompts that work first time; use AI to write, plan, learn, research and decide; handle health, legal and money questions safely; privacy, fact-checking and spotting AI scams; a personal AI toolkit and a daily habit.
- **FAQs:**
  - Technical skills? None needed.
  - Which assistant? Any; free versions are enough.
  - Will it stay useful as AI changes?
  - Time? About 3 hours, in lessons of about 10 minutes.
  - Is it safe with personal information?
  - I run a business: is this right for me? It is the foundation; AI for Business Owners goes deeper.

| Module | Lessons (minutes; **P** = free preview) |
|---|---|
| 1 Getting Started | 1.1 What AI Really Is (and Isn't) 9 **P** · 1.2 How AI Assistants Work, and Why They Make Things Up 10 · 1.3 Set Up Your AI Assistant (and Protect Your Privacy) 10 |
| 2 Prompting That Works | 2.1 The 5-Part Prompt: Role, Context, Task, Format, Examples 12 **P** · 2.2 Iterate Like a Pro: Follow-Ups That Fix Any Answer 10 · 2.3 Give AI Your Context: Custom Instructions, Projects & Templates 11 |
| 3 AI for Everyday Life | 3.1 Emails, Texts & Tricky Messages 10 **P** · 3.2 Plan Anything: Meals, Travel, Budgets & Your Week 12 · 3.3 Learn Anything Faster with an AI Tutor 11 · 3.4 Health, Legal & Money Questions: Using AI Safely 12 |
| 4 AI for Work & Productivity | 4.1 Write and Edit Better (Without Sounding Like a Robot) 11 · 4.2 Research and Summarize Documents You Can Trust 12 · 4.3 Better Decisions and Brainstorming 11 · 4.4 Talk, Snap & Show: Voice and Image Features 10 |
| 5 Make It a Habit | 5.1 Fact-Check AI in Three Minutes 10 · 5.2 Safety, Ethics & What Never to Share 11 · 5.3 Build Your Personal AI Toolkit 12 · 5.4 Your 30-Day AI Habit Plan 10 |

#### AI for Business Owners: The Implementation Playbook ($297, featured)

- **Subtitle:** "Find the AI opportunities that genuinely pay off in your business, and put your first three to work in 30 days, safely and measurably."
- **Approach:** tool-agnostic (Claude, ChatGPT, Gemini, Microsoft Copilot), no coding. Principle: "AI drafts, people decide."
- **Includes:**
  - 20 in-depth lessons across 6 modules (about 5 hours)
  - AI Opportunity Audit worksheet and scoring model
  - 40+ copy-paste prompts and templates
  - AI usage policy template and data traffic-light rules
  - ROI calculator and monthly AI scorecard
  - 30-day rollout plan and four-session team training plan
  - AI tutor, lifetime access, certificate
- **Outcomes:** audit and rank opportunities by impact, ease and risk; choose the first three projects, with a baseline; business prompts, a brand voice guide and a team prompt library; AI across marketing, sales, service and operations, with human review; data rules and an AI usage policy; train the team, measure ROI and roll out in 30 days.
- **FAQs:**
  - Is it right for my business?
  - Technical skills? None needed.
  - Which tools? Any; a business-grade plan is advised for internal data.
  - Time? About 5 hours of lessons plus about 3–5 hours a week over 30 days.
  - How does it compare with AI Essentials?
  - Will it stay useful as tools change?
  - Can you implement it for us? Yes, through the done-with-you service.

| Module | Lessons (minutes; **P** = free preview) |
|---|---|
| 1 The AI Opportunity Audit | 1.1 Where AI Actually Pays Off 12 **P** · 1.2 Map Your Workflows in One Afternoon 15 · 1.3 Score Your Opportunities: Impact × Ease × Risk 16 · 1.4 Choose Your First Three Projects 13 |
| 2 Prompting for Business | 2.1 The Business Brief: Prompts That Produce Usable Work 16 **P** · 2.2 Your Brand Voice Guide and Team Prompt Library 16 · 2.3 Give AI Your Business Context, Safely 14 |
| 3 Marketing & Content | 3.1 The Content Engine: One Idea, Many Assets 15 · 3.2 SEO and Website Copy That Converts 15 · 3.3 Email, Social and Ad Campaigns (With Human Review) 16 |
| 4 Sales & Customer Service | 4.1 Respond to Leads Fast and Follow Up Consistently 15 · 4.2 Sales Call Prep, Call Notes and Proposals 15 · 4.3 Customer Support: Drafts, FAQ Assistants and Escalation 16 |
| 5 Operations & Admin | 5.1 Turn Know-How into SOPs and Meetings into Action Items 15 · 5.2 Documents, Spreadsheets and Reports (With Verification) 16 · 5.3 Hiring and HR Drafts, Done Fairly 14 |
| 6 Rollout, Safety & ROI | 6.1 Write Your AI Usage Policy 15 · 6.2 Train Your Team and Win Over the Skeptics 14 · 6.3 Measure ROI: Baseline, Measure, Iterate 15 · 6.4 Your 30-Day Rollout Plan (and When to Get Help) 16 |

#### AI Automation Accelerator: Build Workflows & Agents ($497)

- **Subtitle:** "Design, build and safely ship AI automations and simple agents that do real work in your business, mostly without code."
- **Audience:** builders, operators and ambitious owners.
- **Tools:** no-code platforms Zapier, Make or n8n, with optional TypeScript and Python examples. Tool subscriptions and AI usage are paid separately.
- **Includes:**
  - 18 in-depth lessons (over 5 hours)
  - 4 step-by-step automation blueprints
  - Copy-paste prompt, schema and spec templates
  - Agent Design Canvas and tool spec template
  - Golden test set, runbook and launch checklists
  - The 30-day build plan
  - Optional code examples
  - AI tutor, lifetime access, certificate
- **Outcomes:**
  - Understand workflow anatomy: trigger, context, model step, action, checks.
  - Connect apps with Zapier, Make or n8n, using structured output.
  - Build four automations: lead qualification, a content pipeline, inbox triage and weekly reporting.
  - Handle errors, retries and human review.
  - Design agents with scoped tools, memory, guardrails and approvals.
  - Test, monitor, secure and cost-control them, with a 30-day ship plan.
- **FAQs:**
  - Need to code? No.
  - Which tools?
  - Running cost? Lesson 16 estimates the cost per run.
  - New to AI? Start with Essentials.
  - What will I have built? At least one automation in production with tests, monitoring and a runbook; blueprints for three more; and a designed agent ready to pilot.
  - Will it go out of date?
  - Can you build it for me? Yes, through the implementation service.

| Module | Lessons (minutes; **P** = free preview) |
|---|---|
| 1 Automation Foundations | 1.1 Anatomy of an AI Workflow 14 **P** · 1.2 Map a Process into Steps 16 · 1.3 Choose What to Automate (and What Not To) 15 |
| 2 No-Code AI Workflows | 2.1 Connecting Your Apps: Triggers, Actions and Data 17 · 2.2 Structured Outputs: JSON You Can Trust 18 · 2.3 Error Handling, Retries and Human Review 20 |
| 3 Real Automations to Build | 3.1 Blueprint: Lead Capture, AI Qualification and Follow-Up 22 **P** · 3.2 Blueprint: A Content Pipeline from Idea to Published 20 · 3.3 Blueprint: Inbox and Support Triage 20 · 3.4 Blueprint: The Weekly Reporting Digest 18 |
| 4 AI Agents | 4.1 What an AI Agent Really Is (and When Not to Use One) 16 · 4.2 Designing Tools and Instructions for Agents 20 · 4.3 Memory and Context: What Your Agent Knows 16 · 4.4 Guardrails, Permissions and Human-in-the-Loop 18 |
| 5 Ship It | 5.1 Testing and Evaluation with Golden Test Sets 18 · 5.2 Monitoring, Logging and Managing Costs 18 · 5.3 Security and Privacy: Prompt Injection, Secrets and Data 18 · 5.4 Document, Maintain and Your 30-Day Build Plan 16 |

### 4.3 Calls and coaching (editable in Admin → Availability)

| Meeting type | Slug | Length | Price | Location | Buffer | Min notice | Book ahead | Intake questions |
|---|---|---|---|---|---|---|---|---|
| Free AI Strategy Call | `ai-strategy-call` | 30 min | $0 | Google Meet / Zoom | 15 min | 12 h | 30 days | "What's the #1 thing you'd like AI to help you with?" (required); "Tell us about your business or role (optional)" |
| 1:1 AI Coaching Session | `ai-coaching-session` | 60 min | **$150** | Zoom | 15 min | 24 h | 45 days | "What would you like to work on together?" (required) |
| AI Implementation Discovery Call | `implementation-discovery` | 45 min | $0 | Zoom | 15 min | 24 h | 30 days | "Company name and website" (req.); "What would you like to automate or build with AI?" (req.); "Rough budget range" (optional) |

- **Descriptions:**
  - **Strategy call:** "A 30-minute call to map where AI can save you the most time and money — and whether our courses or done-with-you implementation is the right fit."
  - **Coaching:** "60 minutes of hands-on coaching. Bring your real work — we'll build prompts, workflows, or automations together live."
  - **Discovery:** "For businesses ready to have AI systems built for them. 45 minutes to scope your project, timeline, and investment."
- **Colours:** violet, amber and emerald.
- **Coaching payment:** coaching is paid at booking and confirmed once payment completes. The slot is held 30 minutes while the client pays (max 60), and the cron releases unpaid holds.
- **Coaching bullets on the offer ladder:**
  - "Bring your real work, not hypotheticals"
  - "Prompts and workflows built around your tasks"
  - "Honest advice on which tools are worth paying for"
  - "Book one session, or come back as you grow"
- **Availability and logistics:**
  - Default availability is Mon–Fri 9:00–17:00 America/New_York.
  - Visitors see times in their own timezone.
  - The app does not generate Zoom or Meet links; the location is a text label only.

### 4.4 Done-with-you AI implementation (`/consulting`)

- **Hero (dark):** "Done-with-you AI implementation" / "We build the AI systems your business **runs on.**"
  - Note: "Custom-scoped for your business · Clear quote before any work begins".
  - The hero visual is a labelled "Example" roadmap, not a real client.
- **Problems it solves:** too many tools and no plan; experiments that never ship; a team that's unsure, or unsafe.
- **What gets built:** AI assistants and chatbots; workflow automations; content systems; sales and follow-up automation; internal knowledge assistants; team AI training and policy.
- **Process:**
  1. Discovery: a free call.
  2. Blueprint: a written plan, timeline and clear quote.
  3. Build: with the client's real workflows and data; the client approves each step.
  4. Train: the team, plus written guides.
  5. Support: monitor, refine, expand.
- **Engagements** (all "Custom quote after a free discovery call"):
  - **Quick-start build:** one focused system, best for a first visible AI win.
  - **Implementation project:** featured as "Most comprehensive". Connected assistants and automations plus training: discovery and blueprint, phased build, team training and an AI use policy.
  - **Ongoing AI partner:** regular check-ins, new use cases and tool advice.
- **No fixed prices, ever.** The site AI is told to "never quote one".
- **FAQs:**
  - No technical staff needed.
  - Tools are chosen to fit (Claude or ChatGPT, automation platforms, accounts the business owns).
  - The timeline is set in the blueprint and phased.
  - Data and privacy are agreed up front.
  - Team training is available on its own.
- **Application form fields:** name, work email, company, website (optional), team size, ideal timeline, "What would you like AI to automate or build?", and budget range.
  - Team size options: Just me / 2–10 / 11–50 / 51–200 / More than 200.
  - Timeline options: As soon as possible / In the next 1–3 months / In 3–6 months / Just exploring for now.
  - Budget options: Under $2,000 / $2,000 – $5,000 / $5,000 – $15,000 / $15,000 or more / Not sure yet.
- **What a submission does:**
  - Tags the contact `implementation` and sets stage `qualified`.
  - Sets an estimated deal value by budget band: $1,500, $3,500, $10,000, $15,000, or $0 for unsure.
  - Emails Ryan and creates a high-priority "Review implementation application" task, due within 24 h.
  - Redirects to `/book/implementation-discovery` with the name and email prefilled.
- **Steps shown to the applicant:** "Share a few details" (about two minutes), then "Book a free 45-minute discovery call", then "Get your blueprint" (plan, timeline and quote, no obligation).
- **Rate limit:** 5 submissions per IP per 30 minutes.

### 4.5 How buying works

- **Checkout:** Stripe Checkout in USD. Promotion codes are allowed.
- **Payment Links:**
  - Each paid, published course gets one Stripe Product, Price and Payment Link.
  - They sync automatically on production builds, from Admin → Courses → "Sync with Stripe", after course edits, and by the daily cron.
  - No `buy.stripe.com` URLs are hard-coded. Whether live links exist is **unconfirmed**; it depends on the Stripe keys set in Vercel.
- **Buy links:** `/buy/<course-slug>?email=…` redirects to the current Payment Link, or to the sales page if there is none. In emails the tag is `{{buy_link:<slug>}}`.
- **After a purchase:**
  - The order is marked paid, the student is enrolled and gets a receipt and an access email.
  - The contact's stage becomes `customer` and its lifetime value updates.
  - The Free Guide Nurture and Assessment Follow-up sequences stop, New Student Onboarding starts, and Ryan is notified.
  - A duplicate purchase by the same email is refunded automatically.
- **Refunds:**
  - A full refund in Stripe revokes access. Partial refunds are noted on the timeline.
  - "Mark refunded" in Admin → Orders only updates records. The actual refund must be issued in Stripe.
  - The Terms say refunds are "reviewed individually and fairly". There is **no** money-back guarantee.

### 4.6 Course kits (offline delivery)

- **Customer zips** (built Oct 20) in `deliverables/dist/`: `AI-Essentials.zip`, `AI-for-Business-Owners.zip` and `AI-Automation-Accelerator.zip`, about 1.6–1.7 MB each. Each zip contains:
  - a single-file offline course app;
  - a PDF course book;
  - a "Start here" note.
- **The offline app has:** lessons, copy-to-clipboard prompts, exercise checklists, a 3-question check per lesson, notes, progress tracking, a printable certificate and light/dark mode.
  - Its searchable prompt library holds 62, 45 and 33 prompts (Essentials, Business, Accelerator).
- **Video scripts:** `<Course>-Video-Scripts.pdf` is for Ryan's own use. Scripts are also in `deliverables/video-scripts/`: 19, 21 and 19 scripts (59 total).
  - Each script uses recording cues: [ON CAMERA], [SCREEN RECORDING], [ON SCREEN TEXT], [B-ROLL].
  - Timings assume about 140 words per minute.
- **Quizzes:** in `deliverables/quizzes/`, 56 files with 168 questions (3 per lesson).
- **Licensed copies:** `npx tsx scripts/course-kit/build.ts --course <slug> --licensee "Name"`.
- **Do not mention the app or the PDF book in marketing.** They are sent manually and are not listed on the course pages.

### 4.7 Remote sales team (PR #7)

- **What it is:** a commission-only US sales-agent program. Agents apply at `/sales-team` and use a portal at `/agent` with referral links `?ref=CODE` and `/r/CODE`.
- **Levels:** Starter 20%, Pro 25% (5 sales a month) and Elite 30% (10 sales a month).
- **Rules:** 30-day refund hold, 90-day attribution and a $25 minimum payout. It also has a leaderboard, badges, streaks and challenges.
- **Status:** it is merged on the production branch, but whether it is live is **unconfirmed**.
  - Agent terms at `/sales-team/terms` should be reviewed before recruiting.
  - Agents need a W-9 before their first payout.

## 5. The free AI Starter Kit

- **Title:** "The AI Starter Kit". **Subtitle:** "50 copy-paste prompts + a 7-day plan to make AI genuinely useful in your life and work."
- **Tools:** works with the free versions of Claude, ChatGPT and Gemini.
- **Daily format:** each day takes about 10 minutes and has a goal, steps and a copy-paste prompt.
- **7-day plan:**
  - Day 1: Meet your AI assistant.
  - Day 2: Learn the 5-part prompt (role, context, task, format, examples).
  - Day 3: Clear a message you've been avoiding.
  - Day 4: Plan something real.
  - Day 5: Learn something faster.
  - Day 6: Make a clearer decision.
  - Day 7: Build your AI toolkit.
- **Prompt library: 50 prompts in 8 categories:**
  - **Writing & email (7)** ("Clear, kind, professional messages in a fraction of the time."): Turn rough notes into a clear email; Reply to a tricky email; Say no gracefully; Check how a message will land; Write a complaint that gets results; A thank-you that feels personal; Follow up without being pushy.
  - **Planning & organizing (6):** Plan my week; Weekly meal plan and grocery list; Trip itinerary; Turn chaos into a to-do list; Plan an event; Simple monthly budget.
  - **Learning & skills (6):** Explain it simply; Quiz me; Check my understanding; Build a learning plan; Practice a new language; Socratic tutor.
  - **Research & decisions (7):** Summarize with a purpose; Compare options side by side; Weighted decision; Pre-mortem; Devil's advocate; Fact-check an answer; Make sense of jargon.
  - **Work & career (6):** Meeting notes to action items; Tailor my resume to a job; Interview practice; Prepare for a difficult conversation; Write a clear status update; Explain what I do.
  - **Business & marketing (6):** Social media post ideas; Product or service description; Reply to a customer review; FAQ from customer questions; Understand my ideal customer; Email newsletter draft.
  - **Personal & home (6):** Prepare for a doctor's appointment; Decode a confusing bill or letter; Home project plan; Declutter plan; Thoughtful gift ideas; Family routine or chore chart.
  - **Creativity & fun (6):** Personalized bedtime story; Brainstorm names; Write a toast or speech; Party games and activities; Start a creative hobby; Poem or card message.
- **8 safety and quality tips:**
  - Give context.
  - Treat the first answer as a draft.
  - Never share passwords, card, bank, ID or health records.
  - Check privacy settings.
  - AI can be confidently wrong, so verify.
  - Use AI to prepare for professionals, not replace them; in an emergency, call emergency services.
  - Ask for the case against.
  - You're the author.
- **Opt-in page `/free-guide`:**
  - Fields: first name, email, and interest (My life / My business / Both).
  - Copy: "Get instant access · Free · opens straight away". A public "Try one now" sample shows the first prompt.
  - FAQs: it is free with no card; no paid AI tool is needed; your email gets the kit plus a short series of tips, with one-click unsubscribe and never sold; it is written for non-technical people.
- **What an opt-in does:**
  - Creates the contact at stage `new` with tag `starter-kit`.
  - Starts the Free Guide Nurture sequence and alerts Ryan.
  - Sets a 1-year cookie and redirects to `/free-guide/thank-you`.
- **Where the kit lives:** at `/guide`. It is noindexed and unlocked by the cookie, by being a known contact, or by `?src=email`.
- **Linking rule:** **social posts must link `/free-guide`, never `/guide`.**

## 6. The AI Readiness Assessment (`/assessment`)

- **Format:** free, "3 minutes · free · instant results".
- **What it gives:**
  - a score out of 100;
  - a tier, with strengths and gaps;
  - a personalised AI action plan;
  - a recommended next step.
- **Questions:** 11 in total. Industry is asked only if the focus includes business. Team size is skipped for individuals focused on life.
  1. **Role:** Individual or professional / Business owner or founder / Team leader or manager.
  2. **Focus:** My everyday life / My business or work / A bit of both.
  3. **Industry (12 options):** Professional services; Marketing, media or creative agency; Real estate; Health, fitness or wellness; Coaching, training or education; E-commerce or retail; Hospitality, food or travel; Trades or home services; Finance or insurance; Technology or software; Nonprofit or community; Something else.
  4. **Team size:** Just me / 2–10 / 11–50 / 51 or more.
  5. **AI usage:** Never / I've tried it / Weekly / Daily.
  6. **Tools used** (multi-select): ChatGPT, Claude, Gemini, Microsoft Copilot, Image tools, Automation tools (Zapier, Make, n8n), None yet.
  7. **Tech comfort,** on a 1–5 scale from "I avoid it" to "I'm the go-to person".
  8. **Time drains** (up to 3): Email; Writing & content; Scheduling & admin; Customer service; Sales follow-up; Research; Data & reporting; Personal planning; Learning new skills.
  9. **Main goal:** Save time / Grow revenue / Learn a valuable skill / Automate operations / Advance my career.
  10. **Timeline:** Just exploring / This month / As soon as possible.
  11. **Investment preference:** Do it myself (free, under $100) / A self-paced course ($100–$500) / Coaching ($500–$2k) / Done for you ($2k+).
- **Contact step:** name, email, optional company, plus a hidden honeypot field against spam.
- **Scoring (0–100):**
  - Usage: up to 45 (never 0, tried 15, weekly 30, daily 45).
  - Tools: up to 25 (5 per real tool, max 4 counted, +5 for automation tools).
  - Comfort: up to 20 ((level − 1) × 5).
  - Clarity: up to 10 (goal 5, or 3 for "learn a skill"; plus 3, 4 or 5 for 1, 2 or 3 time drains).
- **Tiers:**
  - **Explorer 0–30:** "Ready for your first real wins".
  - **Experimenter 31–55:** "Time to turn experiments into habits".
  - **Implementer 56–80:** "Ready to build real workflows".
  - **Scaler 81–100:** "Ready to scale with AI systems".
- **Recommendation logic** (first rule that applies wins):
  1. **Consulting** (`/book/implementation-discovery`) if the investment answer is "done for you", or the team is 11+ with an ASAP timeline.
  2. Otherwise **AI Automation Accelerator** if the score is 56 or more and the goal is automating operations (or the focus is life and the score is 81 or more).
  3. Otherwise **AI Essentials** if the focus is life or the score is 30 or less.
  4. Otherwise **AI for Business Owners**.
  - The free strategy call is always shown as an alternative.
- **Buying-intent boost (0–20) for the CRM lead score:**
  - Timeline: exploring 0, this month 5, ASAP 8.
  - Investment: DIY 0, course 3, coaching 7, done-for-you 10.
  - Team: solo 0, 2–10 1, 11+ 2.
  - **Hot lead** means a boost of 12 or more, or a consulting recommendation. Hot leads go to stage `qualified` and get a high-priority follow-up task due in 24 h. Other leads go to `engaged`.
  - The contact is tagged `assessment` plus a tier tag.
- **Quick wins:** there are 9 templates, one per time drain. Examples:
  - "Clear your inbox faster with AI-drafted replies"
  - "Turn rough notes into a polished first draft"
  - "Plan your week in ten minutes"
  - "Build a reply library for your most common questions"
  - "Write follow-ups that feel helpful, not pushy"
  - "Get a structured research brief in minutes"
  - "Turn a spreadsheet into insights you can act on"
  - "Get a realistic plan for your goals and errands"
  - "Turn AI into your personal tutor"
- **The AI plan:**
  - Written by Claude (default model `claude-opus-5-5`), 600–900 words.
  - Exactly six sections: Your AI snapshot; 3 quick wins for this week; Your 30-day roadmap (Weeks 1–4); Tools worth trying; Watch-outs; Your recommended next step.
  - Without a working AI key, a fixed non-AI fallback plan with the same sections is shown instead.
- **Outputs:**
  - A private results page `/assessment/results/<token>`. It is noindexed; never share or link it.
  - A results email: "Your AI readiness results: {score}/100 ({tier})".
  - An alert to Ryan: "New assessment: {name} scored {score} ({tier})".
  - The Assessment Follow-up sequence starts.
- **Key check:** the FAQ "How is my plan created?" says "using Claude, Anthropic's AI assistant" **only when an AI key is set**. Otherwise it says "using our AI readiness framework".

## 7. The customer journey and funnel

### The path every post feeds

1. **Free first step:**
   - the Starter Kit `/free-guide` (everyday and prompt content);
   - the assessment `/assessment` (business content);
   - or a free preview lesson.
2. **Email nurture:** opting in starts Free Guide Nurture (6 emails over 12 days); finishing the assessment starts Assessment Follow-up (4 emails).
3. **Call or course:**
   - the free strategy call `/book/ai-strategy-call`;
   - courses `/courses`;
   - coaching `/book/ai-coaching-session`.
4. **Implementation:** `/consulting` (application at `#apply`), leading to the free discovery call `/book/implementation-discovery`.

**Never link publicly:** `/guide`, `/free-guide/thank-you`, `/assessment/results/…`, `/booking/…`, `/book/confirmed/…`, `/checkout/…`, `/learn/…`, `/unsubscribe/…`, `/admin/…`.

### CRM

- **Pipeline stages:** New Lead (`new`), `engaged`, `qualified`, Call Booked (`call_booked`), Proposal Sent (`proposal`), `customer`, plus `lost`.
  - Automatic moves only go forward. An admin can set any stage.
- **Automatic moves:**
  - An opt-in sets `new`.
  - An assessment, chat lead or started checkout sets `engaged`.
  - A hot assessment or a consulting application sets `qualified`.
  - A booking sets `call_booked`.
  - A purchase sets `customer`.
- **Lead score (0–100):**

  | Signal | Points |
  |---|---|
  | Name | 3 |
  | Phone | 5 |
  | Company | 5 |
  | Opt-in | 10 |
  | Quiz completed | 15, plus the 0–20 boost |
  | Form | 10 (max 15) |
  | Chat | 5 (max 10) |
  | Booking | 25 (max 30) |
  | Purchase | 30 (max 40) |
  | Login | 3 (max 6) |
  | Lesson completed | 2 (max 10) |
  | Unsubscribed | −10 |

- **Auto tags:** `starter-kit`, `assessment` plus the tier, `implementation`, `contact-form`.
- **Auto tasks:**
  - Hot assessment follow-up: high priority, due in 24 h.
  - Implementation application review: high priority, due in 24 h.
  - Contact-form reply: due in 24 h (high priority for implementation topics).
  - Booking prep: "Prepare for <type> with <name>", due 1 h before the call.
  - Refund a duplicate payment (a paid booking paid twice): high priority.
- **Contact sources:** lead_magnet, assessment, chat, application, contact_form, booking, checkout, manual.
- **Single entry point:** every conversion goes through `captureLead()`. It never overwrites existing fields and keeps the first-touch source, UTM, referrer and landing page.

### Funnel events tracked

- **Client side:** `page_view`, `cta_click`, `quiz_started`, `booking_viewed`, `guide_viewed`, `chat_opened`.
- **Server side:** `optin`, `quiz_completed`, `booking_created`, `checkout_started`, `purchase`, `chat_started`, `chat_lead`, `contact_form`, `application`.

### Email automations (editable in Admin → Email Automations)

- **Delays** are hours after the previous email. A delay of 0 sends immediately. Everything else goes out on the daily cron at 14:00 UTC, so real timing rounds up to the next run.
- **Signature:** "Talk soon, The {{businessName}} team".
- **Marketing emails** carry an unsubscribe link and the mailing-address footer.
- **Example rule:** every example is clearly hypothetical. Never present invented clients or results.

| Sequence | Trigger | Emails (delay → subject) |
|---|---|---|
| Free Guide Nurture | `lead_magnet` (Starter Kit opt-in) | +0h "Your AI Starter Kit is here, {{firstName}}" · +24h "Your first 10-minute AI win" · +48h "The 3 prompting mistakes almost everyone makes" · +72h "What AI looks like in a normal week" · +72h "How ready are you for AI? (3-minute check)" · +72h "Your next step with AI" (buy links to AI Essentials and AI for Business Owners). Days 0, 1, 3, 6, 9, 12 |
| Assessment Follow-up | `quiz_completed` (after the immediate results email) | +20h "What your AI readiness tier really means" · +48h "The one AI habit that compounds" · +72h "DIY or get help? An honest look" · +72h "Let's turn your AI plan into results" (call invite + buy links). Days ~1, 3, 6, 9 |
| Call Prep | `call_booked` | +1h "How to get the most out of our call" · +24h "Bring these 3 things to our call" |
| New Student Onboarding | `purchase` | +1h "Welcome! Here's how to get started" · +71h "Day 3 check-in (plus a tip that saves hours)" · +96h "One week in: how's it going?" |
| Contact Auto-reply | `contact_form` | +0h "We got your message, {{firstName}}" |

- **Other trigger:** `manual`.
- **What stops a sequence:**
  - A purchase stops the nurture and assessment sequences.
  - Cancelling a booking stops Call Prep, unless another confirmed booking is upcoming.
  - Unsubscribing stops everything.
- **Placeholders:** `{{firstName}}`, `{{name}}`, `{{siteUrl}}`, `{{bookUrl}}`, `{{coursesUrl}}`, `{{assessmentUrl}}`, `{{guideUrl}}` (`/guide?src=email`), `{{loginUrl}}`, `{{businessName}}`, `{{buy_link:<slug>}}`.
- **Status: unconfirmed.** The launch plan wanted Free Guide Nurture and Assessment Follow-up switched off until a test email shows the postal address in the footer. Ryan reports the address is entered. Whether the two sequences are active now is unconfirmed.

## 8. The website and platform

### Public routes

- **Marketing layout:**
  - Announcement bar (default "New: take the free 3-minute AI Readiness Assessment →", linking to `/assessment`).
  - Header nav: Courses, AI Implementation (`/consulting`), Free AI Assessment, Free Guide, About.
  - Footer columns:
    - **Learn:** All courses, AI Readiness Assessment, Free AI Starter Kit, Student login.
    - **Work with us:** AI Implementation, Book a call, Join our sales team, Contact.
    - **Company:** About, Privacy, Terms.
    - The brand column holds the description, the contact email and the social profile links (text labels, `rel="me"`).
  - A page-view tracker and the AI chat widget run on every marketing page.
- **Main pages:**
  - `/` home, `/about`, `/courses`.
  - `/courses/<slug>`: sales page with curriculum, outcomes, FAQ, a buy box and free enroll for $0 courses.
  - `/courses/<slug>/preview/<lesson>`: free preview lessons.
  - `/assessment`, `/free-guide`, `/guide`, `/consulting`, `/contact`.
  - `/book`, `/book/<slug>`, `/book/confirmed/<token>`, `/booking/<token>`: manage a booking (cancel, reschedule, resume checkout).
  - `/links`, `/privacy`, `/terms`, `/sales-team`, `/sales-team/terms`.
  - `/checkout/success`, `/checkout/test/<orderId>`, `/checkout/cancelled`.
  - `/unsubscribe/<token>`, `/login`, `/auth/verify`, `/learn/**`, `/agent/**`, `/buy/<slug>`, `/r/<CODE>`, `/admin/**`.
- **`/links`:** the link-in-bio hub. Title "Start here", headline "Make AI work *for you*" plus the tagline.
  - **Buttons, in order:**
    1. Get the free AI Starter Kit (featured)
    2. Take the free AI Readiness Assessment
    3. Browse the courses ("with free preview lessons")
    4. Book a free AI Strategy Call (falls back to `/book` if that meeting type is off)
    5. Have AI built for your business (`/consulting`)
  - Below the buttons: social profile links (`rel="me"`) and the contact email.
  - It is noindexed and not in the sitemap.
  - Click IDs: `links_starter_kit`, `links_assessment`, `links_courses`, `links_strategy_call` (or `links_book`), `links_consulting`.
  - UTM tags are stored as first-touch the moment the page loads.
  - **Confirmed live by Ryan.**
- **`/contact`:**
  - Fields: name, email, "What's this about?" and a message.
  - Topic options: A general question / Courses & enrollment / 1:1 AI coaching / AI implementation for my business / Team training or a workshop / Something else.
  - A submission tags the contact `contact-form`, sends the auto-reply and creates a reply task.
- **Legal pages:**
  - **Terms**, last updated Oct 18, 2026. It is a template flagged "not legal advice, have reviewed".
    - Prices are in USD and paid through Stripe. Refunds are reviewed individually.
    - Missed paid sessions may not be refunded. If Principe cancels, the client gets a new time or a full refund.
    - The course licence is personal and non-transferable. No resale.
    - There is a "No guaranteed results" section.
  - **Privacy**, last updated Oct 20, 2026.
    - AI processing is by Anthropic (Claude).
    - Processors: Anthropic, Stripe, Resend, Vercel plus the database host, and Zoom or Google Meet.
    - "We do not sell your personal information."

### Student portal (`/learn`)

- **Login:** passwordless magic link. The link is valid 30 minutes and the session 30 days.
  - **In production without Resend, students cannot sign in.**
- **Pages:**
  - Course list.
  - Course overview with progress.
  - Lesson pages: Markdown, video embeds (YouTube, Vimeo or Loom), mark complete, curriculum sidebar and the AI tutor panel.
  - A printable certificate once every lesson is complete.

### Admin panel (`/admin`)

- **Dashboard:**
  - 7/30/90-day KPIs: new leads, calls booked, revenue, lead-to-customer rate, open tasks, average lead score.
  - Leads per day, pipeline, lead sources, hot leads, upcoming calls, due and overdue tasks, recent activity.
  - It warns if `CRON_SECRET` is missing.
- **Contacts:**
  - Search, filter and CSV export.
  - Each contact page has: stage, deal value, tags, unsubscribe toggle, notes, AI "Summarize" and AI follow-up draft, send email (with buy links), stop automation, assign to an agent.
  - "Attribution & web activity" shows the post ID.
- **Pipeline:** a kanban board; drag cards between stages.
- **Tasks; Bookings:** mark completed or no-show, or cancel.
- **Availability:** meeting types, weekly hours, blocked dates.
- **Funnels:** see Tracking below.
- **Email Automations:**
  - Create, edit, activate or delete sequences and steps.
  - Preview, send test, "Draft with AI", manual enroll.
- **AI Conversations:** every chat and tutor transcript, plus AI insights ("what prospects keep asking").
- **Courses:**
  - Courses, modules and Markdown lessons; publish.
  - Grant or revoke access.
  - Payment links panel with "Sync with Stripe".
- **Orders:** includes the agent code; mark refunded.
- **Sales Team** (`/admin/sales`, `/admin/sales/program`).
- **Email Log:** every email with status `sent`, `simulated`, `failed` or `skipped`; resend.
- **Admin Team:** members sign in by email link.
- **Settings:**
  - **Business:** name, timezone, **mailing address**.
  - **Notifications:** send-to address; toggles for leads, bookings and purchases.
  - **AI assistant:** show on site, name, greeting, extra instructions.
  - **Announcement bar.**
  - **Reminders:** hours before a call, default 24.
  - **Integrations checklist:** Database, Login security, Admin login, Site address, Email delivery (Resend), Mailing address, AI (Claude), Payments (Stripe), Scheduled jobs (Vercel Cron).
  - "Send test email" and "Run automations now".

### AI features and limits

- **Provider:** Anthropic Claude through the official SDK. Default model `claude-opus-5-5`, overridable with `ANTHROPIC_MODEL` (cheaper options: `claude-sonnet-5-5`, `claude-haiku-5-5`).
- **Uses:**
  - site chat;
  - the course tutor;
  - assessment plans;
  - admin contact summaries and follow-up drafts;
  - "Draft with AI" for automation emails;
  - conversation insights.
- **Site chat rules:**
  - Concise, under about 150 words.
  - Quotes only listed prices and offers, and never quotes an implementation price.
  - No invented results, testimonials, stats, credentials or guarantees.
  - No legal, medical, financial or tax advice.
  - Discloses that it is an AI.
  - Cannot book or take payments.
- **Chat knowledge base:** built live from published courses, active meeting types, free resources and Ryan's extra instructions.
- **Chat lead capture:** a lead is captured only when the visitor gives their own email or clicks "Get a human follow-up".
- **Fallbacks:** if no key is set, the call fails, the key is invalid, or a daily ceiling is hit, every feature quietly shows built-in non-AI fallback text.
  - An invalid key logs `[ai] invalid ANTHROPIC_API_KEY` in the Vercel runtime logs.
- **Limits:**
  - Daily site-wide ceilings: `AI_DAILY_LIMIT` (chat) and `AI_TUTOR_DAILY_LIMIT` (tutor), 2,000 each by default, reset at midnight UTC.
  - Chat: 20/min and 200/day per IP.
  - Tutor: 15/min and 150/day per student.
  - Assessment plans: 3 per submission per day, 30 per IP per day, 500 site-wide per day.

### Payments, email, scheduling, cron

- **Payments:**
  - Stripe mode needs `STRIPE_SECRET_KEY`. **Without it, nothing can be bought in production.** A test checkout exists only locally or in demo mode.
  - Webhook `/api/stripe/webhook` handles checkout completed, async succeeded or failed, expired, refunds and disputes.
    - If no webhook secret is set, the app creates its own endpoint.
    - Disputes alert Ryan, and a lost dispute removes access.
  - Pending checkouts are reconciled for 3 days; pending orders expire after 1 day.
  - **Live vs test Stripe status: unconfirmed.**
- **Email:**
  - Sent through Resend and logged in Admin → Email Log.
  - The sender `EMAIL_FROM` must use a verified Resend domain. If it is unset, the default is `Principe AI <onboarding@resend.dev>`, which is not suitable for production.
  - **Resend and domain status: unconfirmed.**
  - **Marketing emails** (sequences, broadcasts, nurture) respect unsubscribes and include an unsubscribe link, one-click unsubscribe headers and the **CAN-SPAM mailing address** from Admin → Settings → Business → "Mailing address".
    - They still send if the address is empty; Settings flags it.
  - **Transactional emails** (logins, receipts, bookings, results) carry no unsubscribe link.
  - **Owner alerts** go to the Settings notification address with the subject prefix `[Principe AI]`, and reply-to set to the lead.
- **Scheduling:**
  - Built-in, timezone-aware slots.
  - The confirmation email includes an ICS invite. Ryan gets a Google Calendar link.
  - Every booking sets stage `call_booked`, starts Call Prep and creates a prep task.
  - Reminders go out at the last cron run before the call.
- **Cron:**
  - `/api/cron` runs daily at **14:00 UTC**: 10:00 am ET now, 9:00 am ET after Nov 1. Daily is the Vercel Hobby-plan limit; Pro could run it hourly.
  - It requires `CRON_SECRET`; without it, every production run is refused.
  - Jobs: due automation emails, booking reminders, Stripe checkout recovery, expired holds and orders, cleanup, sales-team commissions, payment-link re-sync.
  - It can also be run manually from Admin → Settings.

### Tracking and attribution

- **First-touch cookies on the first visit:**
  - `pa_vid`: visitor ID, kept 2 years.
  - `pa_ref`: referrer, 90 days.
  - `pa_land`: landing page, 90 days.
  - `pa_utm`: first-touch UTMs, 90 days. **First touch wins.**
- **On the contact:** these are copied onto the contact when it is created and never overwritten. Each browser, and each in-app browser, counts separately.
- **Admin → Funnels (7/30/90 days):**
  - Stat cards: unique visitors, new leads, booked calls, revenue.
  - Four funnels:
    - **Free Guide:** visited `/free-guide` → opted in → opened kit → booked → purchased.
    - **Assessment:** visited → started → completed → booked → purchased.
    - **Course sales:** viewed `/courses` → started checkout → purchased.
    - **Booking:** opened a booking page → booked.
  - Also: traffic chart, Top landing pages (bio visitors show as `/links`), Top referrers.
  - **Attribution table**, grouped two ways:
    - by "Channel (UTM source)";
    - by "Signup path": Free guide, AI assessment, Booking, AI chat, Checkout, Contact form, Application, Added manually.
- **Post IDs:** the `utm_content` post ID shows only on each contact's page.
  - The CSV export has source, medium, campaign, referrer and landing page, but **no utm_content**. Extract the post ID from `landing_page` with a formula.
  - The Contacts list has no UTM filter.
- **Performance:** the site includes Vercel Speed Insights (whether it is enabled in the Vercel project is unconfirmed). **Vercel Web Analytics is not on production.** An unmerged Vercel branch adds it.

### SEO

- **Sitemap priorities:** home 1.0; `/courses` and `/assessment` 0.9; `/free-guide` and `/consulting` 0.8; `/book` 0.7; `/about` 0.6; `/sales-team` and `/contact` 0.5; legal pages 0.2; featured course 0.85, other courses 0.75.
- **robots.txt** disallows `/admin`, `/learn`, `/agent`, `/api`, `/booking`, `/assessment/results`, `/checkout`, `/unsubscribe`, `/auth`.
- **Noindexed pages:** `/links`, `/guide`, thank-you pages and results pages.
- **Titles:**
  - Root title: "Principe AI — Learn AI. Implement AI. Grow with AI.", with the template "%s · Principe AI".
  - Home title: "Principe AI — Practical AI courses, coaching & implementation".
- **Share cards:** Open Graph and Twitter large-image cards. Preview lessons have their own share cards.
- **Structured data:**
  - Organization JSON-LD on the home page: name, url, email, description, slogan, parentOrganization Principe Consults, and `sameAs` with the social URLs.
  - FAQPage on pages with FAQs.
- **Social URLs:** in `src/config/site.ts` → `site.social`. They feed the footer, `/links` and `sameAs`. LinkedIn is empty, so it is hidden.

### Security basics

- **Admin access:** admin pages and actions require admin checks.
- **Public forms:** every public form is validated and rate-limited per IP.
- **Data storage:** money is stored as integer cents and times in UTC.
- **Headers:** security headers are set, plus a CSP on `/admin`.
- **Missing keys:** the site degrades gracefully without Anthropic, Stripe or Resend keys.

## 9. Tech stack, hosting, repo, deploy

- **Stack:**
  - Next.js **16.4.2** App Router (this version differs from older Next.js).
    - Middleware lives in `src/proxy.ts`.
    - Params, cookies and headers are async.
    - `next lint` is removed; use `npx eslint`.
    - Read `node_modules/next/dist/docs/` before writing Next code.
  - React 19.3.0, TypeScript (strict), Tailwind CSS 4, Drizzle ORM with Postgres (PGlite for local dev and tests).
  - Libraries: `@anthropic-ai/sdk`, `stripe`, `zod`, `jose` (JWT), `luxon`, `lucide-react`, `@vercel/speed-insights`.
  - Node 20.9 or newer.
  - In-house UI components (no shadcn).
- **Hosting:**
  - Vercel project **`principeai`**, team `principeconsults-9234s-projects`.
  - Production deploys from branch **`claude/upbeat-hypatia-sh31wl`**.
  - The build runs `tsx scripts/migrate.ts && next build`. Migrate applies SQL migrations, seeds the catalog only into an empty DB, adds `ADMIN_TEAM_EMAILS` and syncs Stripe Payment Links on production builds.
- **Database:**
  - Postgres via Vercel Storage (Neon or Supabase); **which provider is unconfirmed**.
  - Seed data (prices, sequences, meeting types) is inserted only once, so **the live DB may differ from the code defaults**.
- **Repository:**
  - GitHub `rythegammer-ui/PrincipeAi`. The production branch has 64 commits; the root commits are from Oct 18, 2026.
  - The work branch is **`claude/sweet-edison-ne5duy`**. It has 3 docs-only commits that are not on production (the batch A filming pack, Ryan's name in the SV-01 captions, the LD-01 scheduling record). It is also 20 commits behind production, because it lacks PR #7.
- **Deploy process:**
  1. Work on a branch.
  2. Open a PR into `claude/upbeat-hypatia-sh31wl`.
  3. Merge; Vercel builds and deploys production.
  - **Claude's Vercel connector gets a 403 on the team**, so Claude cannot check env vars or deploys. Fix: claude.ai → Settings → Connectors → Vercel → reconnect and pick that team.
  - The latest production deploy status is unconfirmed.
- **Tests and commands:**
  - Unit tests: 34 Vitest files, 450 tests on production.
  - E2E tests: 12 Playwright specs, 61 runs (desktop, mobile and a mock-Claude project). They need no keys. Never point them at production.
  - Commands: `npm run dev` (localhost:3000 with an embedded DB), `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run db:generate`, `npm run db:migrate`.
  - Test pass status this session: not run.
- **Environment variable names** (no values here):
  - **Required:** `DATABASE_URL` (or `POSTGRES_URL`), `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL` (should be https://principeai.com), `CRON_SECRET`.
  - **To sell:** `STRIPE_SECRET_KEY`; optional `STRIPE_WEBHOOK_SECRET`.
  - **Email:** `RESEND_API_KEY`, `EMAIL_FROM`; optional `CONTACT_EMAIL`.
  - **AI:** `ANTHROPIC_API_KEY` (or `ANTHROPIC_AUTH_TOKEN`), plus optional `ANTHROPIC_MODEL`, `AI_DAILY_LIMIT`, `AI_TUTOR_DAILY_LIMIT`.
  - **Optional:** `ADMIN_SESSION_VERSION`, `ADMIN_TEAM_EMAILS`, `BUSINESS_TIMEZONE`, `CRON_INTERVAL_HOURS`, and `DEMO_MODE` (leave unset).
  - **Which of these are actually set in Vercel: unconfirmed.**
- **Recent changes.** All merged PRs below landed Oct 20, 2026:
  - **#1:** Vercel Speed Insights, the downloadable course kits and the lesson video scripts.
  - **#2:** Stripe Payment Links, `/buy/<slug>` links, `{{buy_link}}` in emails and the auto-created webhook.
  - **#3:** brand logo, site icons and the Vercel avatar.
  - **#4:** social launch kit, `/links` bio page, footer social links and `sameAs`, preview-lesson share cards, and the CAN-SPAM mailing-address setting.
  - **#5:** real social profile URLs, YouTube watermark and the progress tracker (`PROGRESS.md`).
  - **#6:** TikTok URL.
  - **#7:** remote sales team and admin team members. It is on the production branch; whether it is live is unconfirmed.
- **Unmerged branches:**
  - `claude/deploy-principeai-vercel-dqw00z` has Oct 21–22 docs and media:
    - launch Story art, a 23-second launch video and video-safe frames;
    - Claude in Chrome prompts (LinkedIn profile, Company Page, YouTube) and Grok prompts;
    - **a record that launch posts went out early on Wed Oct 21** (see section 13).
  - `vercel/install-vercel-web-analytics-crir2q` adds Vercel Web Analytics (probably an open Vercel PR; unconfirmed).

## 10. Social media accounts

| Platform | Handle | URL | Type / status | Postiz channel | Tier |
|---|---|---|---|---|---|
| YouTube | @PrincipeAi | https://www.youtube.com/@PrincipeAi | Phone verified; ID/advanced features requested, pending (until approved, description links aren't clickable and Related video can't be set) | YouTube PrincipeAi | 1 |
| Instagram | principe.ai | https://www.instagram.com/principe.ai/ | Live | Instagram PrincipeAi (principe.ai) | 1 |
| TikTok | @principeai | https://www.tiktok.com/@principeai | Business account; business verification submitted, pending | TikTok Business PrincipeAi | 1 |
| Facebook Page | (username `principeai` not set yet) | https://www.facebook.com/profile.php?id=61595512175708 | Live | Facebook PrincipeAi | 1 |
| LinkedIn personal | Ryan Principe | https://www.linkedin.com/in/ryan-principe-90268b445/ | Live; Experience reads "Owner" at "PrincipeAi" (typed text) | LinkedIn personal "Ryan Principe" | 1 |
| LinkedIn Company Page | planned `linkedin.com/company/principeai` (availability unconfirmed) | — | **Not created (blocked)** | Not added | 1 |
| Threads | @principe.ai | https://www.threads.com/@principe.ai | Live | Threads principe.ai | 2 |
| X | @PrincipeAi | https://x.com/PrincipeAi | Free Professional account, Business, category Education | X PrincipeAi | 2 |
| Pinterest | principeconsults | https://www.pinterest.com/principeconsults/ | Business | Pinterest principeconsults | 2 |
| Bluesky | principeai.bsky.social | https://bsky.app/profile/principeai.bsky.social | Live; domain handle `@principeai.com` not switched yet (needs `_atproto` DNS TXT, then reconnect in Postiz) | Bluesky principeai | 3 |
| Reddit (brand) | u/PrincipeAi | — | **Reserved only. Never post or comment from it.** Comment from a personal account | Reddit PrincipeAi (**don't schedule**) | 3 |

- **Postiz caution:** the "ryan principe" Instagram channel is Ryan's **personal account. Never schedule to it.**
- **Reserve-only handles:** Snapchat, Medium, Substack, Discord, Mastodon, Telegram and Product Hunt are to be claimed Sun Nov 8. No posts on them.
- **Handle rules:** `@principeai` is preferred, with fallbacks `@principe.ai`, `@principe_ai` and `@getprincipeai`. The display name always starts with "Principe AI".
  - The kit's template URLs assume `@principeai` everywhere. **The actual URLs above, also in `src/config/site.ts`, are correct.**

## 11. Social launch plan

### Dates and system

- **Launch day:** **Tue Nov 10, 2026 (L+0).** The plan runs from L-21 (Tue Oct 20) to L+82 (Sun Jan 31, 2027). Retros fall on L+27, L+62 and L+83.
- **Moving the launch:**
  - Pick a new Tuesday, no later than Tue Nov 17 (otherwise launch week hits Thanksgiving), and shift every L-date by the same amount.
  - FIXED holiday posts, `bf-2026` and `ny-2027` keep their calendar dates.
  - Re-check the dated wording in VC-16 to VC-29, LC-16, LC-11 and TP-63.
- **Markers:**
  - **FIXED:** tied to a holiday.
  - **OPTIONAL:** the first thing to skip.
  - **PRICE:** check Admin → Courses and Admin → Availability that morning.
  - **CONFIRM:** keep the AI tutor or "plan written by Claude" line only if the AI key works in production.
- **Never post on:** Tue Nov 3 (Election Day), Thu Nov 26 (Thanksgiving), Dec 24, Dec 25, Dec 31, Jan 1.

### Phases

| Phase | L-days | Dates | Goal |
|---|---|---|---|
| Setup | L-21 to L-8 | Oct 20 – Nov 2 | Handles, verifications, profiles, links, templates, first filming. No posting except Highlight Stories on L-9 |
| Warm-up | L-7 to L-1 | Nov 3 – Nov 9 | Value-only posts, no launch announcement; nothing on Nov 3 |
| Launch week | L+0 to L+6 | Nov 10 – Nov 16 | Announce everywhere, pin launch posts, daily Stories, reply to everyone |
| Growth | L+7 to L+40 | Nov 17 – Dec 20 | Weekly rhythm, outreach (5 pitches/week), Thanksgiving off, BF/CM promo OPTIONAL, holidays scheduled by Dec 20 |
| Holiday slow-down | L+41 to L+52 | Dec 21 – Jan 1 | About 1 post/week/platform, all pre-scheduled |
| New Year push (`ny-2027`) | L+53 to L+82 | Jan 2 – Jan 31 | "Build a 30-day AI habit" with AI Essentials; 7-Day AI Challenge Jan 4–10; FB Group Jan 4 (if go); LinkedIn newsletter issue 1 Jan 5 |

### Tiers

- **Tier 1, now (about 8 h/week):**
  - **Platforms:** Instagram (Reels, carousels, Stories), TikTok, YouTube (Shorts now; long-form from the free preview lessons), LinkedIn (personal profile first, then the Company Page), Facebook Page (Reels shared from IG, plus link posts).
  - **Why these:**
    - Short video reaches non-followers.
    - IG has the most free link spots.
    - YouTube is searchable.
    - LinkedIn reaches business owners.
    - Facebook is nearly free to add.
- **Tier 2, cross-post (about 0.5 h/week):** Threads, X, Pinterest. These are copies, not new work. Evergreen Pins drive search traffic to `/free-guide` and `/assessment`.
- **Tier 3, later (about 1 h/week):**
  - Bluesky: small audience, often hostile to generative AI.
  - Reddit: comments only for 3 weeks, posts from Dec 3.
  - Own Facebook Group: Jan 4, if go.
  - Podcast, partner and local outreach: 5 pitches a week from Nov 23.
- **Reviews:** tiers are reviewed at the retros on Dec 7, Jan 11 and Feb 1.
  - Downgrade a platform that brings under 10% of social leads **and** under 10% of social visitors after about 30 short videos.
  - Move Facebook up if it is within 25% of the top source after 60 days.
  - X stays Tier 2 unless it brings leads.
  - "Leads beat views." Never delete an account.

### Time, output and rhythm

- **Time budget:**
  - Setup is about 53 h over three weeks; the lighter version is about 37 h.
  - Launch week is 10 h. A standard Growth week is about 9.5 h; Dec 14–20 is 14–15 h.
  - Holidays take 1–3 h a week; New Year 10 h.
  - The minimum is "the 3-hour week".
- **Weekly output:**
  - 3 short videos on 4 platforms.
  - 1 IG carousel (shared to the FB Page).
  - 2 FB Page posts.
  - 3 LinkedIn posts plus Page reshares.
  - 2–3 Threads and X posts.
  - 2–3 Pins.
  - Stories on post days.
  - A long-form video every other week.
  - 1 Reddit post a week in Dec–Jan.
  - 5 pitches.
- **Rhythm (one week ahead: film Mon, edit Tue/Wed, schedule Thu, posts go out from the following Tue):**
  - **Mon:** 9:00 review (30 min), 9:30–11:30 batch, 7 pm live touch.
  - **Tue:** 9:30 FB live touch, 10:00 outreach, LinkedIn, long-form every other week.
  - **Wed:** 10:00 Page reshare, edit videos, 7 pm live touch.
  - **Thu:** 9:30 live touch, 10:00 reshare, schedule next week (about 30 items).
  - **Fri:** 10:00 reshare, 12:30 carousel Story share.
  - **Sat:** 7 pm live touch, plus a long-form session every other Sat.
  - **Sun:** off.
- **Live touches (no free scheduler does these):**
  - The FB first comment with the link at 9:30 am Tue and Thu.
  - The 7 pm Reel first comment, plus an IG Story share with a link sticker.
  - The Company Page reshare at 10:00 am the day after each LinkedIn profile post.
- **Daily 20-minute engagement block (weekdays):**
  - Minutes 0–6: replies and DMs.
  - Minutes 6–12: LinkedIn (3–4 comments, 5 connection requests).
  - Minutes 12–18: community slot (Mon IG/TikTok; Tue/Thu other FB groups; Wed Reddit; Fri Threads/X).
  - Minutes 18–20: log line.
  - LinkedIn commenting starts Mon Oct 26; the full block starts Wed Nov 4.
  - No pods, auto-commenters or bought followers.
- **3-hour-week cut order:** outreach, then YouTube long-form, then X/Bluesky/Reddit, then FB Page posts, then carousels every other week, then LinkedIn at 1 a week, then shorts at 2 a week, then engagement at 15 min × 3, then a 20-minute review.
  - Never cut replies, the Monday review, link testing, launch day or FIXED posts that are already made.
- **Default posting slots (ET):**

  | Content | Slot |
  |---|---|
  | TikTok and YouTube Shorts | 1:00 pm |
  | IG Reels (and FB Reels) | 7:00 pm |
  | IG carousel | 12:30 pm, usually Fri |
  | Stories | within an hour of the post |
  | FB Page | Tue/Thu 9:30 am, link in first comment |
  | LinkedIn profile | Tue–Thu 2:30 pm |
  | LinkedIn Page | next day 10:00 am |
  | LinkedIn newsletter | every other Tue from Jan 5, 9:00 am |
  | Threads | 8:30 am |
  | X | 9:00 am, link in own first reply |
  | Bluesky | 11:30 am |
  | Pinterest | 8:00 pm |
  | YouTube long-form | every other Tue, 11:00 am |
  | Reddit | Tue–Thu 8:30 am |
  | FB Group | Mon/Wed/Fri 9:00 am |

- **Create once, post everywhere:**
  - **3 short videos** go to TikTok and Shorts, IG Reels shared to FB Reels, and an IG Story.
  - **1 carousel** goes to the IG feed, the FB Page and 1–3 Pins. LinkedIn document carousels use the same templates.
  - **Text posts** become 3 LinkedIn posts and 2–3 short posts for Threads, X and Bluesky.
  - **A free preview lesson every other week:** one recording, two cuts (the course video plus a YouTube long-form video that the Shorts link to).

### Key schedule

- **Warm-up:**
  - Wed Nov 4: SV-09 (4 video platforms), TP-34 LinkedIn, VC-40 Pin.
  - Thu Nov 5: VC-61 FB, VC-07 IG, TP-29 LinkedIn.
  - Fri Nov 6: VC-46 Pin.
  - Sat Nov 7: SV-15.
  - Sun Nov 8: VC-49 Pin.
  - Mon Nov 9: SV-12.
- **Launch day, Tue Nov 10 (ET):**

  | Time | Post |
  |---|---|
  | 8:30 | TP-05 Threads |
  | 9:00 | **LD-01** on 4 video platforms (PRICE, CONFIRM; already scheduled) and TP-03 X |
  | 9:30 | VC-59 FB launch link post (pin it) and VC-16 IG Story |
  | 11:00 | LC-04 YouTube trailer and LC-08 first long-form lesson |
  | 11:30 | TP-06 Bluesky and LC-16 YouTube Post |
  | 1:00 pm | **LD-02** |
  | 2:30 pm | TP-01 LinkedIn |
  | 7:00 pm | **LD-03** |
  | 8:00 pm | VC-50 and VC-53 Pins |

  - **Pin these:** LD-01 to LD-03 on TikTok and IG; VC-59 on FB; TP-05 on Threads; TP-06 on Bluesky; LC-04 on YouTube; TP-01 in LinkedIn Featured.
- **After launch:**
  - **Wed Nov 11:** TP-04 X thread (8 posts) and pinned; TP-02 LinkedIn Page launch post at 11:00 (PRICE; needs the Page); VC-01 IG carousel (CONFIRM); VC-17 Story.
  - **Thu Nov 12:** **SV-01 founder intro** (1:00 pm TikTok/Shorts, 7:00 pm IG/FB), plus TP-07, TP-08 and VC-60.
  - A 14-day Stories plan runs VC-16 to VC-29 (Nov 10–23). The last `launch`-tagged post is Mon Nov 23.
- **YouTube long-form (every other Tue, 11:00):**

  | Publish | Video | Recorded |
  |---|---|---|
  | Nov 10 | LC-04 trailer + LC-08 first lesson | Sun Oct 25 |
  | Nov 24 | LC-11 | Sat Nov 14 |
  | Dec 8 | LC-10 | Sat Nov 28 |
  | Dec 22 | LC-13 | Sat Dec 12 |
  | Jan 5 | LC-15 (the only one with no script yet; due Fri Dec 11) | Sat Dec 19 |
  | Jan 19 | LC-09 | Sat Jan 9 |
  | Feb 2 | LC-12 | Sat Jan 23 |
  | Feb 16 | LC-14 | Early Feb |

  - Playlists: LC-05 Start Here, LC-06 small business, LC-07 automation.
- **Filming batches:**
  - **A, Sat Oct 24:** LD-01 to LD-03 and SV-01. LD-01 is already done.
  - **B, Sat Oct 31:** SV-09, SV-15, SV-12, SV-02.
  - **C, Tue Nov 3:** SV-03, SV-04, SV-13, SV-18, SV-27.
  - After that, Monday batches, plus a holiday batch on Fri Dec 18.
- **Batch A filming pack** (`deliverables/social-launch/filming/batch-a-sat-oct-24.md`):
  - **Lengths:** LD-01 about 60 s, LD-02 about 57 s, LD-03 about 58 s, SV-01 about 70 s. About 2.5 h in total.
  - **Setup:** window light, vertical 1080×1920 at 30 fps, eye level. Keep the top 15%, the bottom 25% and the right edge clear of text.
  - **Shooting order:** the on-camera parts (hook × 3, both endings); then screen recordings; then a safety pass.
    - Screen recordings: the home page, `/free-guide`, the "rough notes → email" prompt in a fresh AI chat, and `/assessment` with a `+test` email (then delete the test contact).
  - Name clips by ID, e.g. `LD-02_hook_take2`.
  - TikTok endings say "DM me KIT/READY…".
  - **Alternative LD-01 line:** a "Learn" line without the AI tutor, in case the AI key isn't working by Mon Nov 9.
  - SV-01 uses "Hi, I'm Ryan" and his story.
  - Teleprompter apps: Teleprompter Premium, PromptSmart.
  - Only the batch A pack exists so far.

### Seasonal

- **Thanksgiving, Black Friday and Cyber Monday (Nov 24–30):**
  - A lighter week. No posts or engagement on Thu Nov 26.
  - No Reddit, outreach or pitches Nov 25–29.
  - FIXED items:
    - VC-08 Thanksgiving carousel on Tue Nov 17 (returns as VC-68 on FB Thu Nov 19).
    - TP-13 on Nov 23 (OPTIONAL), TP-60 on Nov 24, TP-15 on Nov 25.
    - SV-16 on Nov 28.
    - VC-11 scam check on Fri Nov 27 (IG) and Mon Nov 30 (FB).
    - TP-16 on Fri Nov 27 at 11:30: version A is a real promo (`bf-2026`), version B the free kit (`evergreen`).
    - TP-61 on Nov 27; TP-17 on Nov 30 (OPTIONAL).
    - VC-72 on Fri Nov 27 (OPTIONAL, PRICE).
  - **Black Friday rules:**
    - Only run it with a real Stripe promotion code that has a real end date, set up by Mon Nov 23.
    - No "was" prices and no countdown to a sale.
    - If it runs, move IG-5 (Courses) to second place Nov 26–30.
    - No paid boosts that week.
    - **Go/no-go: Fri Nov 20. Default: no promo** (value posts plus TP-16 version B).
- **Holidays:**
  - Dec 15–20 is the heavy pre-scheduling week: everything for Dec 21 to Jan 10 is filmed by Sat Dec 19 and scheduled by Sun Dec 20.
  - Slow-down posts: SV-08 (Dec 21); VC-71, TP-30, TP-51, VC-47 and LC-13 (Dec 22); SV-26 (Dec 28); VC-14 (FIXED), TP-62 (FIXED) and VC-48 (Dec 29).
  - Write newsletter issue 1 on Mon Dec 28.
- **New Year push (`ny-2027`):**
  - VC-78 teaser Story Sat Jan 2 at 10:00.
  - **7-Day AI Starter Challenge, Mon Jan 4 to Sun Jan 10:** daily re-cuts of SV-02 to SV-08 with new hooks and files, never re-uploads. VC-78 runs daily in the FB Group, or on the FB Page at 9:00 if the Group is a no-go.
  - LC-15 on Jan 5; TP-37 strategy-call offer on Thu Jan 7.
  - Shorts drop to 2 a week from Jan 11.
  - VC-15 (PRICE, CONFIRM) on Fri Jan 22; TP-38 coaching offer (PRICE) on Tue Jan 26.
  - Open slots Jan 27–30: SV-28, SV-29, VC-84, TP-67, TP-68.
  - Course mentions lead with AI Essentials.
- **Facebook Group:**
  - **Go/no-go Mon Dec 14:** go only if Ryan can personally invite 25+ people who already engaged.
  - Create it Fri Dec 18, as the Page and private. Name: "Practical AI for Small Business Owners (by Principe AI)" (alternative: "Practical AI Made Simple (by Principe AI)").
  - Invites Jan 2–3.
  - Posts:
    - VC-73 welcome, Jan 4;
    - VC-74 Monday thread, VC-75 Wednesday prompt and VC-76 Friday wins, from Jan 11;
    - VC-77 Q&A announcement, Jan 21.
  - Live Q&A Thu Jan 28 at 7:00 pm.
  - If no-go: run the challenge on the Page and IG, and check again in March.
- **LinkedIn newsletter:**
  - Published from the personal profile. It needs 150+ followers or connections; check Creator tools on Dec 7.
  - **Issue 1, TP-63, Tue Jan 5, 2027 at 9:00 (FIXED):** "Your 2027 AI habit, ten minutes a day". Then TP-64 Jan 19, TP-65 Feb 2, TP-66 Feb 16.
  - Every other week, 700–1,000 words, one tagged link.
  - Suggested name: "The Practical AI Brief".
  - Without access, post TP-63 as a normal post.

### Outreach and Reddit

- **Outreach priority:** podcasts and local talks are Tier 1, collaborations and communities Tier 2, newsletter swaps Tier 3 (these need 4+ issues first).
- **Outreach schedule:**
  - One-sheet LC-40 made Nov 17–19, in two exports: `utm_source=podcast` and `local`.
  - Podcast pitches LC-41, 5 at a time: first batch **Mon Nov 23 at 10:00**, then Tuesdays (Dec 1, 8, 15; Jan 5, 12, 19, 26).
  - Follow-ups and thank-yous: LC-42 follow-up (once); LC-43 show notes; LC-44 thank-you.
  - Local:
    - LC-50 Chamber pitch, Dec 1 and Dec 8;
    - LC-51 listing;
    - LC-52 45-minute talk with handout;
    - LC-53 follow-up;
    - LC-54 library or adult-ed class, Dec 1.
  - Collaborations: LC-45 (Dec 8), LC-46 (Dec 9), LC-47.
  - No pitches Dec 21 – Jan 1. Tracking sheet LC-60 from Nov 17. No Product Hunt or AI directories for now.
- **Outreach rules:**
  - Personalize the first line.
  - No invented credentials or results.
  - One follow-up, then stop.
  - Send one-to-one from Ryan's own inbox.
  - Never add hosts to the email list.
- **Reddit:**
  - Use Ryan's personal account only, with the disclosure "I run Principe AI, so I'm biased."
  - Comments only for the first 3 weeks, from Wed Nov 4: 3–5 a day, no links, using templates LC-27 to LC-34.
  - Posts from Dec 3:
    - LC-21 r/PromptEngineering (Dec 3);
    - LC-23 r/artificial or r/ClaudeAI (Dec 10);
    - LC-24 r/smallbusiness (Dec 16);
    - LC-22 r/ChatGPT or r/ChatGPTPromptGenius (Jan 6);
    - LC-26 r/automation or r/nocode (Jan 13);
    - LC-25 r/sweatystartup (Jan 20).
  - **All subreddit rules are unverified.** Do a 5-minute rules check before every first post.
  - Never: second accounts, upvote asks, cross-posting the same text, or unsolicited DMs.
  - The personal About text is LC-20, with link RD-1.

### DM keywords

| DM keyword | IG/FB comment hashtag | Destination | utm_content |
|---|---|---|---|
| KIT | `#prompts` | `/free-guide` (Starter Kit) | `dm-kit` |
| READY | `#aiready` | `/assessment` | `dm-ready` |
| WORKFLOW | `#aiworkflow` | `/courses/ai-automation-accelerator/preview/anatomy-of-an-ai-workflow` | `dm-workflow` |

- **IG and FB:** set up in Meta Business Suite → Inbox → Automations → "Comment to message" (desktop only; one private reply per comment within 7 days). **Due Wed Oct 28.**
- **TikTok:**
  - Keyword replies need business verification.
  - US accounts have no comment-to-DM, so answer by hand until then.
  - The TikTok bio says "DM me KIT…" (version A) until the website link works, then switches to version B.
- **Disclosure line:** every auto-DM ends "(Automated message. Reply HUMAN and [YOUR NAME] will answer personally.)"
- **Hand-written DMs:** use `dm-call`, `dm-courses` or the post ID, always with `utm_medium=dm` and `evergreen`.

### UTM convention

- **Format:** all lowercase, no spaces, hyphens only. Copy links; never retype them.
- **utm_source:**
  - `instagram`, `tiktok`, `youtube`, `linkedin`, `x`, `threads`, `facebook`, `pinterest`, `reddit`, `bluesky`;
  - off-platform: `podcast`, `newsletter`, `community`, `local`, `partner`.
  - A cross-post takes the source of the platform it appears on.
- **utm_medium:**
  - `bio`: profile links, buttons, Highlights.
  - `social`: posts, captions, first comments, Story stickers, Pins, video descriptions.
  - `dm`.
  - `paid_social`.
  - `referral`: podcasts, partners, talks, swaps.
- **utm_campaign:**
  - `launch`: Nov 3 – Nov 23.
  - `evergreen`: bios, buttons, Highlights, every Pin, DM replies, playlists and outreach, plus everything Nov 24 – Jan 1.
  - `bf-2026`: Nov 26–30 promo posts only, with a real Stripe code (VC-72, TP-16 version A).
  - `ny-2027`: Jan 2–31.
- **utm_content:**
  - the post ID in lowercase (`ld-01`, `tp-12`, `vc-05`);
  - `bio`;
  - `bio-kit`, `bio-assessment`, `bio-free-lesson`, `bio-courses`, `bio-call`;
  - `button`;
  - `dm-kit`, `dm-ready`, `dm-workflow`;
  - `<post-id>-<partnername>`.
  - `utm_term` is not used. Re-cuts keep their ID.
- **Template:** `https://principeai.com<PATH>?utm_source=<PLATFORM>&utm_medium=<MEDIUM>&utm_campaign=<CAMPAIGN>&utm_content=<POST-ID>`
  - Anchors go after the tags (`...&utm_content=cb-60#apply`).
  - Don't tag links between Ryan's own profiles or internal site links.
- **Retired values (replace if seen):**
  - `link-in-bio`, `profile`, `starter-kit`, `assessment` become `evergreen`.
  - `launch-2026`, `bfcm-2026`, `newyear-2027` become `launch`, `bf-2026`, `ny-2027`.
  - `utm_source=email` becomes `newsletter`.
  - `utm_medium=video` becomes `social`.
  - `bio-starter-kit`, `bio-strategy-call`, `page-button` become `bio-kit`, `bio-call`, `button`.
- **Extra profile links:**
  - **Instagram (5):** IG-1 `/links`, IG-2 kit, IG-3 assessment, IG-4 five-part-prompt lesson, IG-5 courses.
  - **YouTube:** 6 links, adding YT-6 strategy call.
  - **Threads:** 5 links.
  - **LinkedIn personal:** LI-1 website, plus Featured LI-2 to LI-5 (LI-5 is the `where-ai-pays-off` lesson).
  - **X:** X-1 website, X-2 Link Spotlight to the kit.
  - **Facebook:** FB-1 website, FB-2 "Sign up" button to `/free-guide`.
  - **LinkedIn Page:** LP-1 and LP-2 "Sign up".
  - **Pinterest** PI-1, **Bluesky** BS-1, **Reddit** RD-1.
  - **TikTok:** TT-1, after verification or 1,000 followers.
- **Known limits:**
  - LinkedIn profile and Page links both use `utm_content=bio`, so they can't be told apart.
  - The kit lists 59 tagged links (the README says 57).
- **Link builder:** a spreadsheet link builder holds the launch date in cell K1 = `2026-11-10`.

### Measurement

- **Link test, Mon Nov 2:**
  - Open each link in a private window and opt in with a new `+alias` email (the site allows 8 opt-ins per 10 minutes).
  - Check the contact's UTM block and the Funnels row, then delete the test contact.
  - Test once inside each app as well.
- **Monday review (30 min):** 10 min site, 10 min native analytics, 5 min hygiene, 5 min decide.
- **Scorecard:** six tabs (Posts, Weekly, Engagement, Conversations, Outreach, Community rules).
- **Rules of judgment:**
  - A winner is 2× or more of its own median baseline, or brought a lead.
  - Retire formats that sit in the bottom 20% three weeks running.
  - Run one experiment a week.
  - Don't judge platforms before Dec 7.
- **Paid boosting:**
  - None before Mon Dec 7, and none Thanksgiving through Cyber Monday.
  - First test: $25–35 on one proven post, pointing to `/free-guide`. Options: Meta $5/day × 7, TikTok Promote $5/day × 5, or LinkedIn $10/day × 3.
  - The best window is Jan 2–14.
  - Reels auto-shared to FB can't be boosted on IG.

### Kit files (`deliverables/social-launch/`)

| File | Holds | IDs |
|---|---|---|
| `README.md` | Start-here playbook | — |
| `PROGRESS.md` | Step tracker, blockers, notes | Steps 1–15 |
| `01-profile-setup.md` | Handles, bios, images, verification, every tagged profile link | IG-1..16, TT-1..4, YT-1..6, LI-1..8, LP-1..2, FB-1..7, TH-1..8, X-1..5, PI-1, BS-1, RD-1 |
| `02-launch-calendar.md` | Day-by-day plan to Jan 31, time budget, rituals, appendix of every post ID and date | — |
| `03-short-video-kit.md` | Scripts, filming, no-face versions, captions | 30 videos: LD-01..03, SV-01..27 |
| `04-linkedin-x-threads-bluesky.md` | Text posts, engagement routine, newsletter | 66: TP-01..66 (launch 01–08; LinkedIn library 09–38; short posts 39–62; newsletter 63–66) |
| `05-instagram-pinterest-facebook.md` | Carousels, Stories, Highlights, Broadcast Channel, Pins, FB Page and Group | 83: VC-01..83 (carousels 01–15; Stories 16–29; Highlights 30–35; Broadcast 36–38; Pins 39–58; FB Page 59–71; BF 72; Group 73–78; other groups 79–83) |
| `06-youtube-reddit-outreach.md` | YouTube, Reddit, outreach | LC-01..16 (YouTube), LC-20..34 (Reddit), LC-40..54 (outreach), LC-60 (tracking sheet) |
| `07-content-bank.md` | 83 ideas, funnel map, UTM convention, website gaps, offer facts | CB-01..83 |
| `08-tools-measurement-compliance.md` | Tools, UTMs, scorecard, compliance, paid boosting | — |
| `filming/batch-a-sat-oct-24.md` | Batch A filming pack | — |
| `images/` (7), `research/` (6 sourced background files) | — | — |

- **Next free IDs:** SV-28, TP-67, VC-84, LC-61, CB-84. Never renumber.
- **"Start with these 10":**
  - **Video:** LD-02, LD-03, LD-01, SV-09, SV-15, SV-12, SV-01, SV-02, SV-03, SV-18.
  - **Text:** TP-34, TP-05, TP-01, TP-04, TP-02, TP-07, TP-10, TP-14, TP-63, TP-37.
  - **Visual:** VC-30..35, VC-07, VC-59, VC-16, VC-50, VC-01, VC-02, VC-08, VC-05, VC-78.
  - **Long-form:** LC-08, LC-04, LC-03, LC-27..34, LC-40, LC-41, LC-43, LC-11, LC-50 (+LC-52), LC-15.

### Tools

- **Scheduling:** **Postiz**, in use and connected to Claude via MCP (plan tier unconfirmed).
  - Claude creates drafts and Ryan approves them. Times are ET.
  - Caveats:
    - TikTok "upload" mode lands in the inbox unpublished, so use direct posting.
    - Trending sounds must be posted from the phone.
    - Replies are still done in each app.
    - Notes on an unmerged branch say Postiz strips links and bare domains from X posts and makes no Bluesky link cards.
- **Plan as originally written:**
  - A $0 stack: Meta Business Suite, TikTok Studio, YouTube Studio, LinkedIn scheduler, Buffer Free, Pinterest scheduler.
  - Upgrade path: Postiz Team ($39/mo, or $31 billed yearly, 10 channels) plus Canva Pro ($144/yr), about $43/mo. Adding Descript and ManyChat ($14/mo) brings it to about $73.
  - Skip Hootsuite, Later, Meta One, Linktree and X Premium for now.
- **Design:** Canva.
  - The Free plan has 1 brand kit with colours `#6938EF`, `#FDB022`, `#0C0A1D`. Pro is needed to upload fonts.
  - Templates due Tue Oct 27: carousel 4:5, Story frames, Pins, Highlight covers, YouTube thumbnail, LinkedIn document carousel.
- **Video:**
  - Kit default: phone plus Meta **Edits** (free, auto-captions). Descript for long-form and screen-recorded lessons. CapCut is allowed, but never with client data.
  - For more energetic edits, Claude recommended **Submagic or CapCut** (also the Captions app and Descript).
  - **No AI voices or avatars**, because those would need AI labels.
- **DMs:** Meta "Comment to message" (free). ManyChat only if volume outgrows it.

## 12. Content rules and compliance

**Posts and all copy must never claim:**

- testimonials, reviews, ratings, student counts or "trusted by";
- results, time saved, revenue or income figures, or "10x";
- guaranteed results or a "money-back guarantee". The Terms only promise refunds "reviewed individually and fairly", and state no guaranteed outcomes;
- "was" or struck-through prices, fake deadlines or countdowns to a sale. Leave "Compare-at price" blank in Admin → Courses;
- that free previews include the AI tutor (they don't);
- that Principe AI is a partner of, or approved, official or certified by, Anthropic, OpenAI or Google;
- invented founder details or credentials.

**Do:**

- **Testimonials:** add one only if it is a real quote with written permission.
- **Prices:** mention them only where useful, and check them that morning (PRICE marker).
- **Tool names:** write "AI assistants like Claude, ChatGPT and Gemini" in plain text, with no tool logos in thumbnails.
- **Non-affiliation line** (About and description sections): "Principe AI is independent and not affiliated with Anthropic, OpenAI or Google." Adding it to the footer and `/terms` is still recommended.
- **CONFIRM gating:**
  - "AI tutor in every lesson" and "plan written by Claude" may only be used once the production AI key is confirmed working.
  - Affected items: LD-01 (the filming pack has an alternative line without the AI tutor; which line the Oct 21 cut uses is unconfirmed), VC-01 (and VC-60 slides), VC-15, the VC-33 Highlight, and TP-16 version A.
  - Decide VC-33 by Fri Oct 30. The final decision is Mon Nov 9, when the matching LD-01 cut gets scheduled.
- **Course app and PDF book:** leave them out of all posts until delivery is automated and listed on the course pages.
- **FTC:**
  - The Endorsement Guides (2023) require typical results, visible disclosures and disclosed material connections.
  - 16 CFR Part 465 (since Oct 21, 2024) bans fake or AI-generated reviews and bought followers, views or likes; penalties are up to $53,088 per violation.
  - Earnings claims are a risk (Operation AI Comply, Lurn, Air AI).
  - A Business Opportunity Rule extension is pending; whether it is final is unverified.
  - TikTok own-offer posts carry the "Your brand" disclosure on every video.
- **CAN-SPAM:**
  - Every commercial email needs a valid postal address (a PO box or CMRA is fine).
  - Opt-outs must be honoured within 10 business days (built in).
  - The From line must be accurate: set `EMAIL_FROM` to a verified domain.
  - Penalties are up to $53,088 per email.
  - Only people who opted in themselves go on the list.
- **AI labels:**
  - Real footage, and real screen recordings with Ryan's voice or on-screen text, need no label.
  - AI voices, AI avatars, AI b-roll and photorealistic AI images do need one.
  - YouTube "Altered or synthetic content" is set to No for these videos.
  - Never run Principe AI as an AI persona, and never use an AI-generated person as a profile picture.
- **Music:** use only the TikTok Commercial Music Library, Meta Sound Collection or YouTube Audio Library. Never trending commercial songs on promotional posts.
- **60-second pre-post check:**
  - no testimonials, no income claims, no "was" prices;
  - AI names in plain text;
  - CONFIRM items checked;
  - no app or book;
  - an AI label if there is realistic AI media;
  - TikTok disclosure on;
  - licensed music;
  - captions burned in and proofread ("Claude" and "Gemini" are often mis-captioned);
  - alt text;
  - link tagged and tested.

## 13. Current status (as of Thu Oct 22, 2026)

| Step | Task | Status |
|---|---|---|
| 1 | Reserve handles, 2FA | Done |
| 2 | Connect channels to Postiz; profile pictures and covers | Done (no LinkedIn Page channel yet) |
| 3 | Website update (`/links`, footer links, share cards, mailing-address setting) | Done: PR #4 merged; `/links` confirmed live |
| 4 | Mailing address in marketing emails | Done per Ryan (entered in Admin → Settings); footer test email not verified |
| 5 | Instagram profile | Done |
| 6 | Facebook Page | Done (username `principeai` not set) |
| 7 | TikTok profile | Done; business verification pending |
| 8 | YouTube channel | Done (phone verified); ID/advanced features pending |
| 9 | LinkedIn personal profile | Done |
| 10 | LinkedIn Company Page | **Blocked** |
| 11 | Threads, X, Bluesky, Pinterest | Done per Ryan (bios plus UTM-tagged `/links` links). PROGRESS.md still lists the X header re-upload, X Link Spotlight and the Pinterest website link; unconfirmed |
| 12 | Reddit personal account About and link | Prompt given; rules table pending |
| 13 | Profile links on the website | Done for 8 platforms; LinkedIn added once the Page exists |
| 14 | Batch A filming pack | Ready |
| 15 | Schedule batch A in Postiz | **LD-01 scheduled**; LD-02, LD-03, SV-01 still to film and schedule |

**Scheduled now:**

- **LD-01** "What Principe AI is" (about 60 s, talking head). Filmed Oct 21 and uploaded to Postiz as `1021.mp4`.
- Scheduled for **Tue Nov 10, 2026 at 9:00 am ET (14:00 UTC)** on four channels:
  - Instagram Reels (PrincipeAi);
  - Facebook, with a first-comment link;
  - YouTube Shorts, titled "What is Principe AI? Practical AI for your life and your business";
  - TikTok, with the DM KIT caption and the "Your brand" label.
- **Postiz post IDs:**
  - IG `cmvibh5m50csepg0y9mwfvqgf`
  - FB `cmvibh5z40csgpg0yj84g1l69`
  - YT `cmvibh6vd0csipg0yf869zh5y`
  - TikTok `cmvibh78c0csjpg0yd3jn0pqj`
- **Unconfirmed:** which "Learn" line this cut contains (with or without the AI tutor). LD-01 is PRICE-marked: recheck the morning of Nov 10.

**Possible early posts (needs Ryan's confirmation):**

- Notes on the unmerged branch `claude/deploy-principeai-vercel-dqw00z` say some launch posts **already went out early on Wed Oct 21** via Postiz:
  - TP-01 LinkedIn, TP-03 X, TP-05 Threads, TP-06 Bluesky, VC-59 Facebook;
  - a launch slideshow on Instagram, TikTok and YouTube.
  - Pinterest VC-50, posted Thu Oct 22 once its first board existed (VC-50 is also on the launch-day schedule).
- Those notes add: "Don't repost them on launch day."
- **Ask Ryan whether this happened** before scheduling any launch-day items.

**Blocked: LinkedIn Company Page.**

- **Why:** Claude in Chrome couldn't create it on Oct 21. LinkedIn requires 2+ connections and an account older than about 24 h.
- **Retry settings:** company size "0-1 employees"; organization type "Self-employed" (sole prop) or "Privately held" (LLC). Which applies to Principe Consults is unconfirmed.
- **Ryan must:**
  - tick the authorized-representative box;
  - upload the logo (`images/profile-picture-1080.png`) and the cover (`images/linkedin-page-cover-4200x700.png`).
- **Afterwards:**
  - Change the Experience entry from "Owner" at "PrincipeAi" (typed text) to "Founder" at "Principe AI", picked from the dropdown so it links to the Page.
  - Keep "Share profile updates" off until Mon Nov 9 (L-1), when it goes back on.
  - Add the Page to Postiz (Add Channel → LinkedIn Page).
  - Fill `site.social.linkedin`.
- **Deadline:** the Page's first post, TP-02, is due Wed Nov 11 (about 3 weeks of slack).

**Pending verifications and checks:**

- **Production AI key.** Ryan reports he added `ANTHROPIC_API_KEY` in Vercel, but the key he pasted began `sk-ant-usr-`, not the usual Console format `sk-ant-api03-`, so it may not work.
  - The FAQ "How is my plan created?" mentioning Claude, and Admin → Settings showing AI connected, prove only that a key is present.
  - To prove it works, get a real AI answer from the chat or an assessment plan, or check the Vercel logs for `[ai] invalid ANTHROPIC_API_KEY`.
- **Live prices** in Admin → Courses and Availability (defaults $47 / $297 / $497 and $150).
- **Vercel env:** `NEXT_PUBLIC_SITE_URL`, Stripe (live or test), Resend plus a verified `EMAIL_FROM` domain, `CRON_SECRET`, and the DB connection. Claude's Vercel connector is blocked by a 403.
- **TikTok business verification.** Once the Website field appears:
  - add TT-1 (`/links`);
  - switch to bio version B;
  - set up the KIT/READY/WORKFLOW keyword replies.
- **YouTube advanced features.**
- **Other unconfirmed items:**
  - LinkedIn identity verification (CLEAR);
  - Pinterest website-claim DNS and Meta domain verification DNS;
  - the Bluesky domain handle;
  - Google Search Console;
  - whether the two prospect email automations are on;
  - backup admins on the Meta portfolio and the LinkedIn Page.

**Open owner decisions:**

- Launch go/no-go (Mon Nov 9).
- Black Friday promo (Fri Nov 20; the code would be needed by Mon Nov 23).
- Facebook Group (Mon Dec 14).
- X Premium (only if X brings leads by Dec 7).
- FB action button: "Sign up" vs testing "Book now" (Dec 14).
- LinkedIn Page size and type.
- FB username.
- Newsletter name.
- A USPTO trademark for "Principe AI".
- Backup admins.
- The first paid-test platform.
- A lawyer review of compliance before any paid push or BF offer.
- **Already decided:** on camera = yes; scheduling = Postiz; no AI voice or avatars.

## 14. Next steps (dated)

- **Thu Oct 22 (today):**
  - Retry the LinkedIn Company Page once the 2+ connections and 24 h requirements are met.
  - Verify the AI key (the `/assessment` FAQ and a real AI answer).
  - Confirm the live prices.
- **Fri Oct 23:** YouTube channel copy LC-01 to LC-03 and three empty playlists LC-05/06/07.
- **Sat Oct 24:**
  - Film the rest of batch A: LD-02, LD-03, SV-01.
  - Upload them to Postiz and schedule:
    - **LD-02: Tue Nov 10 at 1:00 pm ET.**
    - **LD-03: Tue Nov 10 at 7:00 pm ET.**
    - **SV-01: Thu Nov 12** (1:00 pm TikTok/Shorts, 7:00 pm IG/FB Reels).
- **Sun Oct 25:** record the YouTube trailer LC-04 and the first long-form free lesson LC-08 (a course take and a public take).
- **Mon Oct 26:**
  - Tier 2/3 profile leftovers: Pinterest boards stay secret until they hold 5 Pins; the Reddit personal account.
  - Start LinkedIn engagement, 10 min each weekday.
- **Tue Oct 27:** Canva brand kit and carousel templates.
- **Wed Oct 28:** comment-to-DM automations KIT/READY/WORKFLOW in Meta Business Suite (plus TikTok if verified); backup admins.
- **Thu Oct 29:** site config check; design VC-07.
- **Fri Oct 30:**
  - Edit batch A (export both LD-01 cuts).
  - Highlight frames VC-30 to VC-35, including the VC-33 CONFIRM decision.
  - First Pins: VC-40, VC-46, VC-49.
- **Sat Oct 31:** film batch B (SV-09, SV-15, SV-12, SV-02).
- **Sun Nov 1:**
  - Clocks go back; check that the schedulers use America/New_York.
  - Post the IG Highlights.
  - Edit LC-04 and LC-08, and add the course cut to Admin → Courses.
- **Mon Nov 2:**
  - Send a test email and check the CAN-SPAM footer.
  - Test every link in a private window with test opt-ins.
  - Create the tracking sheet.
  - Edit batch B.
  - Schedule the warm-up posts.
- **Tue Nov 3:** Election Day, **no posts**. Film batch C (SV-03, SV-04, SV-13, SV-18, SV-27).
- **Wed Nov 4:** first warm-up post (SV-09, TP-34, VC-40). The full engagement block starts, including Reddit comments.
- **Sun Nov 8:** launch-fortnight Pins; claim the reserve-only handles.
- **Mon Nov 9:**
  - Schedule launch week and week 2.
  - CONFIRM decision, plus the matching LD-01 cut.
  - Price check and go/no-go.
  - Turn LinkedIn profile-update sharing back on.
- **Tue Nov 10: LAUNCH.**
- **Wed Nov 11:** TP-02 LinkedIn Page post (needs the Page).
- **Mon Nov 16:** first Monday review.
- **Fri Nov 20:** Black Friday go/no-go.
- **Mon Nov 23:** first podcast pitches; last `launch` post.
- **Thu Dec 3:** first Reddit post.
- **Mon Dec 7:** retro 1, newsletter access check, X Premium check, earliest paid test.
- **Mon Dec 14:** Facebook Group go/no-go.
- **Sun Dec 20:** everything up to Jan 10 scheduled.
- **Sat Jan 2:** `ny-2027` starts.
- **Mon Jan 4:** 7-Day Challenge, plus the Group if go.
- **Tue Jan 5, 2027:** LinkedIn newsletter issue 1 (TP-63) and LC-15.
- **Mon Jan 11:** retro 2.
- **Mon Feb 1:** retro 3.

## 15. How to help Ryan

- **One task at a time, step by step.**
  - Give Ryan a single task with everything he needs to do it, then **wait until he says "done" or "completed"** before giving the next one.
  - Don't dump a long list of tasks at once.
- **Make output copy-paste ready:**
  - finished captions, bios, emails, prompts and links (UTM-tagged per section 11);
  - no placeholders he has to fill in, unless the information is genuinely unknown.
  - If it is unknown, ask.
- **Browser tasks: write a Claude in Chrome prompt.** Ryan often uses Claude in Chrome, so for anything done in a web browser (LinkedIn, Meta Business Suite, YouTube Studio, Vercel, Admin pages), give him a ready-to-paste prompt for it.
- **Scheduling goes through Postiz.**
  - Claude drafts and Ryan approves.
  - Use the correct channels: the brand Instagram is PrincipeAi (principe.ai). **Never** schedule to the personal Instagram "ryan principe" or to Reddit PrincipeAi.
  - Times are in ET.
  - Check that a post isn't already published or scheduled (see the possible early posts in section 13).
- **Keep messages short and practical.** Plain English, no hype, no filler.
- **Before any public copy, run the section 12 checks:**
  - no invented claims;
  - prices checked;
  - CONFIRM items gated on the AI key;
  - the non-affiliation wording.
- **When something is unconfirmed, say so** and suggest the quickest way for Ryan to check it, such as the `/assessment` FAQ for the AI key or Admin → Courses for prices.
- **Code changes:**
  - The site is Next.js 16 with breaking changes; read `docs/ARCHITECTURE.md` and `node_modules/next/dist/docs/` first.
  - Work on a branch and open a PR into the production branch `claude/upbeat-hypatia-sh31wl`.
  - Never put secrets in the repo or in chat.
- **Never ask for or repeat** passwords, API keys or other secrets.
