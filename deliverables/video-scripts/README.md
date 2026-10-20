# Lesson video scripts

One script per lesson, plus a welcome video per course, written to be recorded and added to each lesson's video slot.

```
video-scripts/
  ai-essentials/00-welcome.md, 01-what-ai-really-is.md … 18-your-30-day-ai-habit-plan.md
  ai-for-business/00-welcome.md, 01-where-ai-pays-off.md … 20-thirty-day-rollout.md
  ai-automation-accelerator/00-welcome.md, 01-anatomy-of-an-ai-workflow.md … 18-document-maintain-and-30-day-plan.md
```

`deliverables/dist/` also has each course's scripts as one PDF, which is easier to read from a tablet or teleprompter app.

## How to record

1. **Read the script once out loud** before recording. Change any phrase that doesn't sound like you. The scripts are a
   starting point, not a contract.
2. **Fill in the placeholders.** `[YOUR NAME]` appears in the welcome videos. `[OPTIONAL PERSONAL EXAMPLE: …]` marks
   the one spot per video where a short story of your own would help. Skip it if you don't have one. Never invent one.
3. **Follow the cues.** Lines in bold brackets are directions, not words to say:
   - **[ON CAMERA]**: you, talking to the camera.
   - **[SCREEN RECORDING]**: record your screen in an AI assistant (Claude, ChatGPT, Gemini or Copilot). The prompt
     to paste is in the grey block that follows, copied word for word from the written lesson.
   - **[ON SCREEN TEXT: "…"]**: a title or caption to add in editing.
   - **[B-ROLL: …]**: optional cutaway footage. Fine to skip.
   - **[CUT TO …]** and **[PAUSE]**: editing and pacing notes.
4. **Timestamps are estimates** at a relaxed 140 words per minute. Live demos usually run a little longer.
5. **Record in short takes**, one section at a time, and stitch them together.
6. **Upload and add the link:** upload to YouTube (as *Unlisted*), Vimeo or Loom. In the site, go to
   **Admin → Courses → (course) → lesson → Video URL**. For the downloadable course apps, add the link to
   `deliverables/videos.json` and rebuild (see `deliverables/README.md`).

The welcome videos have no slot on the site. Send the link in your delivery email, put it at the start of Lesson 1's
video, or use it on social media.

## Script format (for anyone editing or adding scripts)

Every lesson script follows this structure so the scripts read consistently and build cleanly into PDFs:

```markdown
# Lesson 4: The Five-Part Prompt

| | |
|---|---|
| **Course** | AI Essentials: Use AI in Everyday Life |
| **Module** | 2 · Prompting That Works |
| **Length** | 4–5 min (~620 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** one sentence on what the viewer can do after watching.

## Before you record

- What to have open and ready (assistant in a new chat, example text, etc.)

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

Spoken lines, in short paragraphs of at most three sentences.

### 2. A beat title · 0:25

**[ON SCREEN TEXT: "Role · Task · Context · Format · Limits"]**

More spoken lines.

**[SCREEN RECORDING]** Paste this prompt:

~~~
A prompt copied word for word from the written lesson.
~~~

Narration while the answer appears.

### 5. Try it now · 3:40
### 6. Recap and what's next · 4:15

## On-screen text

- Every caption and title, in order, for the editor.

## Lesson page description

Two or three sentences for the video description or the lesson page.
```

Rules the scripts follow:

- **Faithful to the written lesson.** Same ideas, terms and examples. No new facts, statistics, product features or
  prices, and no invented stories, client results, credentials or testimonials.
- **Teaches, doesn't read.** Each video covers the core idea, shows it live, flags the most common mistake, points to
  the exercise and recaps. The full prompt lists, templates and tables stay in "the written lesson", a phrase that works
  on the site and in the course book.
- **Tool-agnostic.** Works with any major AI assistant, and doesn't describe buttons or menus that may change.
- **Voice:** confident, warm, plain English, no hype, American spelling, talking to "you".
- **Length:** 4–5 minutes for AI Essentials, 5–6 for AI for Business, 5–7 for AI Automation Accelerator, 2–3 for the
  welcome videos.
