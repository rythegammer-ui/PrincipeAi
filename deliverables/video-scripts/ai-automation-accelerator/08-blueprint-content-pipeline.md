# Lesson 8: Blueprint: A Content Pipeline from Idea to Published

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 3 · Real Automations to Build |
| **Length** | 5–7 min (~800 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Build a status-driven content pipeline where AI writes briefs, drafts, self-checks and repurposes, while humans own the ideas, the facts and the final voice.

## Before you record

- A test content tracker (a spreadsheet, database or project board) with a status column
- Your automation platform open in test mode, connected to the test tracker
- A blank note, ready to paste the drafting prompt and the self-check prompt from the written lesson
- A sample approved brief and a one-page style guide to use as example inputs, with nothing confidential in them

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

AI can make content production dramatically faster. And if it publishes unchecked, it can make it dramatically worse. The answer isn't to avoid AI, and it isn't to hand it the keys.

It's a pipeline that puts humans where they matter most: ideas, facts, judgment and final voice. AI handles the heavy lifting in between.

**[ON SCREEN TEXT: "Blueprint: A Content Pipeline from Idea to Published"]**

### 2. A tracker drives everything · 0:25

**[B-ROLL: a content tracker with a status column]**

Build the pipeline around one content tracker, like a spreadsheet, a database or a project board, with a status column. Each status change triggers the next automated step. You get full visibility, an obvious place to pause and a history of every piece.

**[ON SCREEN TEXT: "Idea → Brief → Approved → Draft → Self-check → Edit → Repurpose → Scheduled"]**

You add an idea. AI writes a brief with an angle, audience, outline and key points, and a human approves it or says no. AI drafts from the brief, a second AI step checks the draft, a human edits it, AI repurposes it, and the automation schedules it and logs the link.

**[ON CAMERA]**

Notice that a human touches the work twice: approving the brief and editing the draft. That's the minimum. Never let AI-written content publish without a human edit.

### 3. Give the AI a style guide · 1:15

**[ON CAMERA]**

Generic AI writing sounds generic because it gets generic context. A one-page style guide fixes most of that: your voice, your audience, the words you use and the words you avoid, and your format.

In the written lesson's example, the voice is plain English, warm and confident, with short sentences and no hype. The audience is owners of small service businesses: busy, practical and skeptical of jargon. And the words to avoid include "revolutionary", "game-changer" and "unlock".

And then examples. Two or three paragraphs of your real writing teach tone better than a page of adjectives. The written lesson has a template for the whole thing.

### 4. The drafting prompt · 2:00

**[ON CAMERA]**

Here's the drafting prompt. It pulls in the style guide, the approved brief and your own notes.

**[SCREEN RECORDING]** Paste this prompt:

~~~
Write a first draft of a blog post from the approved brief below.

<style_guide>
{{style_guide}}
</style_guide>

<brief>
{{approved_brief}}
</brief>

<author_notes>
{{notes_and_experiences}}
</author_notes>

Rules:
- Follow the brief's outline and cover every key point.
- Use the author's notes and experiences wherever they fit; they are what
  make this post worth reading.
- Do not invent statistics, quotes, studies, clients or case studies.
  Wherever a fact or number would help, write [SOURCE NEEDED: what to find].
- Length: {{target_words}} words.
~~~

The key rule is the third one. The AI may not invent statistics, quotes, studies, clients or case studies. Wherever a fact or number would help, it leaves a "source needed" marker instead.

And look at the author notes. The prompt tells the AI to use your notes and experiences wherever they fit, because they're what make the post worth reading.

**[ON SCREEN TEXT: "No invented facts. Mark them: source needed."]**

### 5. The self-check step · 2:50

**[ON CAMERA]**

Next, a second, separate AI step reviews the draft. Asking for a review rather than a rewrite keeps it focused, and the JSON output lets you route automatically.

**[SCREEN RECORDING]** Paste this prompt:

~~~
Review the draft below against the checklist. Do not rewrite it.

<style_guide>{{style_guide}}</style_guide>
<brief>{{approved_brief}}</brief>
<draft>{{draft}}</draft>

Return only JSON with these fields:
- "unsupported_claims": every statistic, date, quote or factual claim that
  needs a source, quoted exactly
- "style_issues": phrases that break the style guide, quoted exactly
- "missing_points": key points from the brief that the draft skips
- "ready_for_edit": true only if missing_points is empty
~~~

It lists unsupported claims and style issues, quoted exactly, plus any key points from the brief that the draft skips. It only marks the draft ready for edit when no key points are missing.

The flagged claims become the editor's fact-checking list. They don't block the draft. They make sure no claim slips through unchecked.

### 6. The human edit · 3:40

**[ON CAMERA]**

This is where the content becomes yours. The editor resolves every source-needed marker and flagged claim, either by finding a real source or by deleting the claim. Then they add first-hand experience, opinions and examples, the part AI can't supply and the part readers value.

Finally, read it aloud once. Anything that doesn't sound like you gets rewritten.

**[OPTIONAL PERSONAL EXAMPLE: a time reading a draft aloud showed you a line that didn't sound like you]**

### 7. Repurpose, publish and test · 4:05

**[ON CAMERA]**

Once the edited piece is marked final, one AI step can create a short newsletter blurb and a few social posts, each in the right format and length for its channel. Treat those as drafts for quick review too. Then the automation sends everything to your publishing or scheduling tools and writes the live links back to the tracker.

Before you trust it, test it. A status change should trigger exactly one run, a brief with a missing field should produce a helpful error, and drafts should contain source-needed markers rather than invented numbers. Plant a fake statistic and make sure the self-check catches it, and confirm nothing reaches the scheduler without a human marking it final.

**[ON SCREEN TEXT: "AI-assisted is fine. Misleading is not."]**

And a note on honesty. AI-assisted content is fine; misleading content is not. Don't publish invented facts, testimonials or credentials, check you have the rights to any images, and follow your platforms' disclosure rules and your audience's expectations about AI involvement.

### 8. Build it · 5:15

**[ON CAMERA]**

For the Build it exercise in the written lesson, create a content tracker with the status column, and write your style guide, including two or three real writing samples. Automate the brief and drafting steps first, then add self-check and repurposing.

Then run one real piece through the full pipeline and time each stage.

### 9. Recap and what's next · 5:35

**[ON SCREEN TEXT: "Tracker · Style guide · No invented facts · Humans approve and edit"]**

Let's recap. A status-driven tracker gives you visibility, control and a natural place to pause. A style guide with real writing samples is the single biggest quality lever.

Never let the AI invent facts; have it mark them and resolve them in the edit. And humans approve the brief and edit the draft, every time.

**[ON CAMERA]**

In the next lesson, Blueprint: Inbox and Support Triage, you'll get every incoming message to the right place with a grounded draft reply, without ever auto-sending something risky. See you there.

## On-screen text

- Blueprint: A Content Pipeline from Idea to Published
- Idea → Brief → Approved → Draft → Self-check → Edit → Repurpose → Scheduled
- No invented facts. Mark them: source needed.
- AI-assisted is fine. Misleading is not.
- Tracker · Style guide · No invented facts · Humans approve and edit

## Lesson page description

AI can make content faster, or much worse if it publishes unchecked. This blueprint shows you a status-driven pipeline where AI writes briefs, drafts, self-checks and repurposes, while you approve the brief, resolve every flagged claim and set the final voice before anything is published.
