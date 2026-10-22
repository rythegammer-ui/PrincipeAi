# Claude in Chrome prompt: LinkedIn Company Page (L-18)

> **What this is:** a prompt to paste into Claude in Chrome while you're signed in to LinkedIn. It creates the "Principe AI" Company Page from [profile setup](../01-profile-setup.md), section 4.5, then links your Experience role to it (tracker, Step 10). It asks you before the two choices only you can make, and before every upload.
>
> **Before you run it:** LinkedIn only lets you create a Page once your personal account has **at least 2 connections** and is **more than about a day old**. Have the logo (`images/profile-picture-1080.png`) and cover (`images/linkedin-page-cover-4200x700.png`) from `deliverables/social-launch/` on your computer. Afterwards, connect the Page in Postiz yourself: **Add Channel → LinkedIn Page**.

```text
You're helping me (Ryan Principe) create the LinkedIn Company Page for my business, Principe AI. I'm signed in to linkedin.com. Work through the tasks below in order.

Ground rules:
- Do NOT post, repost, comment, react, send messages or invitations (including "invite connections to follow"), follow anyone, or change my password, email, phone or security settings.
- Do NOT edit or delete any post, and don't change my personal profile except the one Experience edit in TASK 6.
- Do NOT upload files yourself. When a step needs the logo or cover, stop and ask me to upload it, then continue once I say it's done.
- Paste text exactly as written between the ===== lines, keeping its line breaks. Don't rewrite or shorten it.
- If LinkedIn opens a post draft or any box with a "Post", "Share" or "Invite" button, close it with "Skip", "Not now" or the X. I'll post and invite myself.
- STOP and ask me before: choosing the company size, choosing the organization type, and ticking the box confirming I'm an authorized representative and agree to LinkedIn's Pages terms. Tell me exactly what the options are.
- If LinkedIn refuses to create the Page (for example: not enough connections, or the account is too new), stop and tell me the exact message. Don't try workarounds.
- If a page looks different from what I describe, find the closest equivalent; don't guess at anything risky.

TASK 1. Check first. Look for an existing Principe AI Page I already admin: open the "For Business" menu (top right) or my profile's "Pages" section. If one exists, skip TASK 2 and use that Page for the rest.

TASK 2. Create the Page: For Business → "Create a Company Page" → Company.
- Name: Principe AI
- linkedin.com/company/ URL: principeai. If it's taken, try getprincipeai. If both are taken, stop and ask me.
- Website: https://principeai.com/links?utm_source=linkedin&utm_medium=bio&utm_campaign=evergreen&utm_content=bio
- Industry: "E-Learning Providers". If it isn't offered, use "Professional Training and Coaching".
- Organization size and organization type: STOP and ask me (see the ground rules). For reference, the likely answers are size "0-1 employees", and type "Self-employed" if it's a sole proprietorship or "Privately held" if it's an LLC or corporation, but I'll confirm.
- Logo: STOP and ask me to upload it.
- Tagline:
=====
Learn AI. Implement AI. Grow with AI. Practical AI courses, coaching and done-with-you AI systems.
=====
- Authorized-representative checkbox: STOP and ask me before ticking it.
Then create the Page.

TASK 3. Edit page → Details (or "Page info" / "Overview"):
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
After saving, open the Page as a visitor ("View as member") and check that the button and the website both open principeai.com pages.

TASK 5. Settings: turn on Page messaging (the "Message" button) if it's offered. Check that I'm listed as Super admin under Admin tools → Manage admins. Don't add anyone else.

TASK 6. Link my Experience to the Page. On my personal profile, edit my current role (title "Founder", company "Principe AI" as plain text):
- In the Company field, clear it and type "Principe AI", then pick the Page we just created from the dropdown. Before you click it, confirm it's mine: it should show the logo I uploaded, or its URL should be linkedin.com/company/principeai (or getprincipeai). If you can't tell which entry is mine, don't pick any; tell me.
- Leave every other field as it is, including the "Profile headline" field. If LinkedIn offers to update my headline, say no.
- If the form has a "Notify network" toggle, leave it OFF for this edit (the role itself isn't new).
- Save, and close any share box without posting.

TASK 7. Report back with a checklist: each task marked done / already done / skipped (with why), the Page's URL, the size and type I chose, whether the logo and cover are uploaded, and whether my Experience entry now shows the Page's logo.
```
