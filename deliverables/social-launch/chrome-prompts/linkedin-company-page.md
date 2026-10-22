# Claude in Chrome prompt: LinkedIn Company Page (L-18)

> **What this is:** a prompt to paste into Claude in Chrome while you're signed in to LinkedIn. It creates the "Principe AI" Company Page from [profile setup](../01-profile-setup.md), section 4.5, then links your Experience role to it (tracker, Step 10). It stops and asks you before the choices only you can make and before every upload. It doesn't post, invite or buy anything.
>
> **Before you run it:** LinkedIn only lets you create a Page once your personal account has **at least 2 connections** and is **more than about a day old**. Have the logo (`images/profile-picture-1080.png`) and cover (`images/linkedin-page-cover-4200x700.png`) from `deliverables/social-launch/` on your computer. Afterwards, connect the Page in Postiz yourself (**Add Channel → LinkedIn Page**) and tell Claude Code the Page URL, so it can go on the website and the YouTube channel.

```text
You're helping me (Ryan Principe) create the LinkedIn Company Page for my business, Principe AI. I'm signed in to linkedin.com. Work through the tasks below in order.

Ground rules:
- Do NOT post, repost, comment, react, send messages or invitations (including "invite connections to follow"), follow anyone, or change my password, email, phone or security settings.
- Do NOT edit or delete any post, and don't change my personal profile except the one Experience edit in TASK 6.
- Do NOT start a free trial or buy anything (Premium Company Page, Premium, ads, "Boost", Sales Navigator). If a step only works with a paid feature, skip it and tell me in the report.
- Do NOT upload files yourself. When a step needs the logo or cover, stop and ask me to upload it, then continue once I say it's done.
- Paste text exactly as written between the ===== lines, keeping its line breaks. Don't rewrite or shorten it.
- If LinkedIn opens a post draft or any box with a "Post", "Share" or "Invite" button, close it with "Skip", "Not now" or the X. I'll post and invite myself.
- STOP and ask me before: choosing the company size, choosing the organization type, and ticking the box confirming I'm an authorized representative and agree to LinkedIn's Pages terms. Tell me exactly what the options are.
- If LinkedIn refuses to create the Page (for example: not enough connections, or the account is too new), stop and tell me the exact message. Don't try workarounds.
- If a page looks different from what I describe, find the closest equivalent; don't guess at anything risky.

TASK 1. Check first. Open the "Me" menu (top right, under my photo) and look under "Manage", then check "My pages" in the left column of the home feed. Only a Page listed in those places is one I admin. Ignore any "Principe AI" Page you find through search or under Interests: it belongs to someone else.
If I already admin a Principe AI Page, don't create another one: open its admin view → Edit page, check each TASK 2 item there (name, URL, website, industry, tagline, logo, size, type), change only what's missing or different, stop wherever TASK 2 says to stop, then continue with TASK 3.

TASK 2. Create the Page: "For Business" (top right) → "Create a Company Page" → Company.
- Name: Principe AI
- linkedin.com/company/ URL: LinkedIn fills this in from the name (for example "principe-ai"). Clear it completely and type principeai. If it's taken, try getprincipeai. Don't accept any other URL LinkedIn suggests. If both are taken, stop and ask me.
- Website: https://principeai.com/links?utm_source=linkedin&utm_medium=bio&utm_campaign=evergreen&utm_content=bio
- Industry: "E-Learning Providers". If it isn't offered, use "Professional Training and Coaching".
- Organization size and organization type: STOP and ask me (see the ground rules). For reference, the likely answers are size "0-1 employees", and type "Sole proprietorship" (or "Self-employed" if that option isn't listed) if Principe Consults is a sole proprietorship, or "Privately held" if it's an LLC or corporation, but I'll confirm.
- Logo: STOP and ask me to upload it.
- Tagline:
=====
Learn AI. Implement AI. Grow with AI. Practical AI courses, coaching and done-with-you AI systems.
=====
- Authorized-representative checkbox: STOP and ask me before ticking it.
Then create the Page.

TASK 3. In the Page admin view → Edit page → Details (or "Page info" / "Overview"):
- Description / About:
=====
Principe AI offers practical AI education and implementation for business owners, professionals and everyday people: self-paced courses, 1:1 AI coaching and done-with-you AI systems, all in plain English.

Two paths: for your life and for your business. One method: Assess → Learn → Implement.
• Assess: the free AI Readiness Assessment takes about 3 minutes and gives you a readiness score and a personalized AI action plan.
• Learn: self-paced courses, from everyday AI to business implementation and automation, with free preview lessons.
• Implement: 1:1 AI coaching, or done-with-you AI systems scoped and quoted in writing before any work begins.

Start free with the AI Starter Kit: 50 copy-paste prompts + a 7-day plan to make AI genuinely useful in your life and work. Everything works with AI assistants like Claude, ChatGPT and Gemini.

Principe AI is run by Principe Consults. Principe AI is independent and not affiliated with Anthropic, OpenAI or Google.
=====
- Specialties (add each one separately): AI training, AI coaching, AI implementation, AI automation, prompt writing, AI for small business
- Location: leave it empty unless LinkedIn requires one. If it does, ask me.
- Cover image: STOP and ask me to upload it.

TASK 4. Custom button (Edit page → Buttons, or "Add button"): turn it on, choose "Sign up", and set the URL to:
https://principeai.com/free-guide?utm_source=linkedin&utm_medium=bio&utm_campaign=evergreen&utm_content=button
After saving, open the Page as a visitor ("View as member"), click the button and the website link, and check that each opens the exact URL given here and in TASK 2, including every utm_ part (utm_content=button for the button, utm_content=bio for the website). Put both URLs, as they open, into your report.

TASK 5. Page messaging: in the Page admin view, open Inbox → the "..." menu → Inbox settings (or the closest equivalent) and turn on the Message button if it's offered. If it asks you to choose conversation topics, list the options and ask me. Then open Settings (bottom of the admin view's left menu) → Manage admins and check that I'm listed as Super admin. Don't add or remove anyone.

TASK 6. Link my Experience to the Page. On my personal profile, open the pencil on my existing current role (title "Founder", company "Principe AI" as plain text; if it still says "Owner" at "PrincipeAi", it's the same role). Don't use "Add position" or create a second role.
- In the Company field, clear it and type "Principe AI". Don't press Enter in this field: Enter picks whichever suggestion is highlighted, and other people's "Principe AI" and "PrincipeAi" Pages exist. Only click a suggestion that shows the logo I uploaded and the industry chosen in TASK 2. If none matches, or you can't tell, click an empty part of the form to close the list, close the form without saving, and tell me (a new Page can take a while to appear).
- Leave every other field as it is, including the "Profile headline" field. If LinkedIn offers to update my headline, say no.
- Notify network: switch it OFF before you click Save. It may start ON because profile-update sharing is on, and the role itself isn't new. If the form has no such toggle, save anyway, don't change any setting, and say so in the report.
- After saving, close any share box without posting. Then click the company name in my Experience entry: it must open linkedin.com/company/principeai (or getprincipeai). If it opens any other Page, edit the role again, set the company back to plain text "Principe AI" without picking a suggestion, save, and tell me.

TASK 7. Report back with a checklist: each task marked done / already done / skipped (with why), the Page's URL, the size and type I chose, the button and website URLs as they open, whether the logo and cover are uploaded, and whether my Experience entry now shows the Page's logo and opens the right Page.
```
