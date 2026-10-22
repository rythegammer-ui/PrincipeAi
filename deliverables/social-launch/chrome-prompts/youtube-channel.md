# Claude in Chrome prompt: finish the YouTube channel (L-18)

> **What this is:** a prompt to paste into Claude in Chrome while you're signed in to YouTube Studio. It finishes LC-01 to LC-03 and creates the playlists LC-05 to LC-07 from [profile setup](../01-profile-setup.md), section 4.3, and the [YouTube kit](../06-youtube-reddit-outreach.md), sections 1.2 and 1.3. It checks each item first and changes only what's missing or different. It never uploads, edits or deletes a video, Short or post. It does click Publish on the channel profile (the description and links go live right away), and it creates three empty public playlists.
>
> **You do yourself:** upload the banner (`images/youtube-banner-2560x1440.png`), the avatar and the watermark (`images/youtube-watermark-300.png`) if they aren't up yet, and check on ID/video verification (tracker, Step 8). Add the LinkedIn Company Page link once the Page exists.

```text
You're helping me (Ryan Principe) finish setting up my YouTube channel with the handle @principeai (YouTube may show it as @PrincipeAi, and the channel name may read "Principe AI" or "PrincipeAi"). I'm signed in. Use YouTube Studio (studio.youtube.com). Before anything else, open the account menu (top right) and check that Studio is showing the channel with that handle, not a personal channel; use "Switch account" if you need to. If you can't find it, or YouTube offers to create a channel, stop and ask me. Never create a channel. Work through the tasks below in order.

Ground rules:
- Do NOT upload, publish, edit or delete any video, Short or post, and don't comment, subscribe or reply to anyone.
- Do NOT upload files. If something needs an image, skip it and list it in your report.
- Do NOT change the channel name, the handle or the handle's capitalization: YouTube only allows two changes in 14 days. If the name isn't exactly "Principe AI", just note it in the report.
- Don't change my account's email, password, phone or security settings, don't start any verification, and don't buy or start a trial of anything.
- Before changing anything, look at what's there now. If it already matches the target, leave it and mark it "already done". Before you replace any text (channel description, keywords, upload-defaults description, a playlist description), copy the old text word for word into your report, because YouTube keeps no history. Apart from the keywords, which TASK 3 replaces, don't remove anything that isn't listed here; list it in the report instead.
- Paste text exactly as written between the ===== lines, keeping its line breaks. Don't rewrite or shorten it.
- Click "Publish" (top right of Customization) or "Save" after each section, or the changes are lost.
- If a page looks different from what I describe, find the closest equivalent; don't guess at anything risky.

TASK 1. Description (Studio → Customization → Profile, or "Basic info" → Description). First ask me which last line I want before saving:
  A) "Hosted by Ryan Principe of Principe Consults. Principe AI is independent and not affiliated with Anthropic, OpenAI or Google."
  B) "Principe AI is run by Principe Consults. Principe AI is independent and not affiliated with Anthropic, OpenAI or Google."
Then set the description to the text below, with the chosen line in place of [LINE]:
=====
Principe AI teaches practical AI in plain English, for your life and for your business. Learn AI. Implement AI. Grow with AI.

Here you'll find short tips and full free lessons: how to write prompts that get useful answers, how to use AI assistants like Claude, ChatGPT and Gemini for messages, planning and everyday admin, and how a small business can put AI to work safely, from the first prompt to simple automations. No tech background needed, and no hype.

Start here:
• The free AI Starter Kit: 50 copy-paste prompts + a 7-day plan to make AI genuinely useful in your life and work.
• The free AI Readiness Assessment: about 3 minutes, with a readiness score out of 100 and a personalized AI action plan.
Both are in the links at the top of this page.

[LINE]
Business inquiries: principeconsults@gmail.com
=====

TASK 2. Links (same Profile / Basic info page → Links). Make these the first links, in this order (link 1 shows next to Subscribe). Keep any other existing links after them.
  1. Title "Start here: free AI resources": https://principeai.com/links?utm_source=youtube&utm_medium=bio&utm_campaign=evergreen&utm_content=bio
  2. Title "Free AI Starter Kit": https://principeai.com/free-guide?utm_source=youtube&utm_medium=bio&utm_campaign=evergreen&utm_content=bio-kit
  3. Title "Free AI Readiness Assessment": https://principeai.com/assessment?utm_source=youtube&utm_medium=bio&utm_campaign=evergreen&utm_content=bio-assessment
  4. Title "Free lesson: The 5-Part Prompt": https://principeai.com/courses/ai-essentials/preview/the-five-part-prompt?utm_source=youtube&utm_medium=bio&utm_campaign=evergreen&utm_content=bio-free-lesson
  5. Title "Courses + free lessons": https://principeai.com/courses?utm_source=youtube&utm_medium=bio&utm_campaign=evergreen&utm_content=bio-courses
  6. Title "Free AI Strategy Call": https://principeai.com/book/ai-strategy-call?utm_source=youtube&utm_medium=bio&utm_campaign=evergreen&utm_content=bio-call
  7. Title "Instagram": https://www.instagram.com/principe.ai/
  8. Title "TikTok": https://www.tiktok.com/@principeai
(No LinkedIn link yet: the Principe AI Company Page doesn't exist. Don't add one and don't open LinkedIn.)
Contact info → Email: principeconsults@gmail.com

TASK 3. Studio → Settings → Channel → Basic info:
- Country of residence: United States
- Keywords (replace whatever is there, after copying the old ones into your report):
=====
AI for beginners, AI prompts, prompt writing, AI tutorial, AI for small business, AI for business owners, AI automation, AI workflows, AI course, Principe AI
=====

TASK 4. Studio → Settings → Channel → Advanced settings → Audience: "No, set this channel as not made for kids". Change nothing else on this page, and don't open "Manage YouTube account", "Remove YouTube content" or the Google Ads linking. Save.

TASK 5. Studio → Settings → Upload defaults:
- General → Description:
=====
{One or two plain sentences with the main search phrase.}

→ {Primary link title}: {UTM link}
→ {Second link title}: {UTM link}
→ {Third link title}: {UTM link}

Chapters
00:00 {Chapter 1}
{…at least three chapters, each at least 10 seconds}

The prompt from this video (copy and paste):
{Prompt quoted from the lesson}

{Which lesson and course this is, with the lesson count and price}

Principe AI is independent and not affiliated with Anthropic, OpenAI or Google. Product names are trademarks of their respective owners.

About Principe AI: practical AI education and implementation for business owners, professionals and everyday people. Courses, coaching and done-with-you AI systems. Learn AI. Implement AI. Grow with AI.

{2–3 hashtags}
=====
- Advanced settings → Category: Education.
- If there's an "Altered or synthetic content" default (it may be labelled "AI use" under Attributes), set it to No. If there isn't one, say so in the report.
- Leave visibility and everything else as it is. Save.

TASK 6. Comment filters: Studio → Settings → Community (it may be called "Community moderation") → "Content controls" tab (older layout: the "Automated filters" and "Defaults" tabs). Change only these:
- Blocked words: add each of these (keep any already there): crypto, forex, bitcoin, investment opportunity, telegram, whatsapp me, earn $, promote it on, followers
- Links: turn ON the option that holds comments with links (URLs and hashtags) for review (older label: "Block links").
- Comment moderation for new videos: "Basic" (older label: "Hold potentially inappropriate comments for review"). If it's already Basic or Strict, leave it. Don't choose "Hold all", and don't turn comments off or pause them.
Save.

TASK 7. Playlists (Studio → Content → Playlists → New playlist). Create these three, Visibility "Public", unless a playlist with the same title already exists (then just check its description). They stay empty for now; that's expected.
  Playlist 1. Title:
=====
Start Here: AI for Beginners (Free Lessons)
=====
  Description:
=====
New to AI? Start here. Plain-English lessons on what AI assistants like Claude, ChatGPT and Gemini actually are, how to write prompts that get useful answers, and how to use AI for messages, planning and learning. No tech background needed. Each video is a free lesson, and the prompts are in every description.

Free AI Starter Kit (50 copy-paste prompts + a 7-day plan): https://principeai.com/free-guide?utm_source=youtube&utm_medium=social&utm_campaign=evergreen&utm_content=lc-05
=====
  Playlist 2. Title:
=====
AI for Small Business Owners: Where It Pays Off and How to Start
=====
  Description:
=====
Practical AI for owners, operators and managers of small businesses: where AI actually pays off, how to brief it so its drafts are usable, and how to keep customer data safe. Everything is built around one rule: AI drafts, people decide. No coding required.

Free AI Readiness Assessment (about 3 minutes, with a personalized AI action plan): https://principeai.com/assessment?utm_source=youtube&utm_medium=social&utm_campaign=evergreen&utm_content=lc-06
=====
  Playlist 3. Title:
=====
AI Automations and Agents, Without the Hype
=====
  Description:
=====
How to design AI automations that run reliably in production, not demos that break in week two: the five parts of every AI workflow, checks and human review, and step-by-step blueprints you can build with no-code platforms such as Zapier, Make or n8n.

Free lesson, no signup: Anatomy of an AI Workflow: https://principeai.com/courses/ai-automation-accelerator/preview/anatomy-of-an-ai-workflow?utm_source=youtube&utm_medium=social&utm_campaign=evergreen&utm_content=lc-07
=====

TASK 8. Report back with a checklist: each task marked done / already done / skipped (with why). Also give the channel name and handle exactly as Studio shows them (the target is name "Principe AI", handle @principeai; don't change either), every old text you copied before replacing it, any existing links or blocked words you left in place, whether the banner, avatar and watermark are uploaded, and what Studio → Settings → Channel → Feature eligibility says for phone verification and advanced features.
```
