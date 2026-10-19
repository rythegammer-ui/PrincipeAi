import type { SeedCourse, SeedLesson } from "./courses";

/**
 * AI Essentials: Use AI in Everyday Life — the beginner course.
 * OWNER: content (AI Essentials) feature.
 *
 * Lesson bodies are Markdown (rendered with <Markdown>, GFM enabled). The lesson title and summary are rendered
 * by the page, so bodies start with a hook paragraph and use "##" section headings.
 * Code fences use ~~~ (not backticks) so nothing needs escaping inside these template literals.
 * Never put "${" inside a lesson body.
 */
const md = (strings: TemplateStringsArray, ...values: unknown[]): string =>
  strings.reduce((out, chunk, i) => out + chunk + (i < values.length ? String(values[i]) : ""), "").trim();

/* ------------------------------------------------------------------ */
/* Module 1 — Getting Started                                          */
/* ------------------------------------------------------------------ */

const whatAiReallyIs: SeedLesson = {
  slug: "what-ai-really-is",
  title: "What AI Really Is (and Isn't)",
  summary: "A plain-English mental model for AI assistants: what they're brilliant at, where they fall short, and how to think about them.",
  durationMin: 9,
  isPreview: true,
  content: md`
If you've ever felt that everyone else "gets" AI and you somehow missed the memo, you're in good company. The good news: you don't need to understand the math to use AI well. You need one accurate mental model, and by the end of this lesson you'll have it.

## The short version

The AI assistants you've heard of (Claude, ChatGPT, Gemini, Microsoft Copilot and others) are built on something called a **large language model**, or LLM. An LLM has been trained on an enormous amount of text: books, articles, websites, code and conversations. From all that reading it learned the patterns of language so well that it can write, explain, summarize, translate and reason through problems in plain English.

Then it was trained further to be a helpful assistant: to follow instructions, answer questions and hold a conversation.

That's it. No magic, no consciousness, no little person inside. But don't let "it's just patterns" fool you either. Those patterns capture a remarkable amount of human knowledge and skill.

## A mental model that actually helps

Think of your AI assistant as **a brilliant, extremely well-read new assistant on their first day**:

- They've read more than any human ever could, across almost every subject.
- They work in seconds, never get tired, and never mind redoing something ten times.
- They've never met you, so they don't know your job, family, preferences or goals unless you tell them.
- They sometimes state things confidently that are simply wrong, and they won't always warn you.

Every good habit in this course flows from that picture. Because they've never met you, you'll learn to give context. Because they're fast and tireless, you'll learn to ask for changes instead of settling for the first answer. Because they can be confidently wrong, you'll learn when and how to check.

## What AI is great at

| Great at | For example |
|---|---|
| Drafting | Emails, messages, outlines, first drafts |
| Rewriting | Shorter, friendlier, clearer or more formal |
| Explaining | Complex topics in simple words, at your level |
| Organizing | Messy notes into lists, plans and checklists |
| Brainstorming | Ideas, names and angles you hadn't considered |
| Summarizing | Long documents, articles and transcripts |

Notice the pattern: these are all **language** tasks. If a job involves reading, writing, explaining or organizing words, AI can probably help.

## What AI is not

- **Not a search engine.** Unless your assistant searches the web for you (many can), it answers from what it learned in training, which stops at a certain date.
- **Not a database of facts.** It doesn't look answers up in a verified source. It generates the most plausible response, which is usually right but not always.
- **Not a mind reader.** Vague requests get generic answers. What you get depends heavily on what you give.
- **Not a professional.** It can help you understand a medical, legal or financial topic, but it can't examine you, see your full situation or take responsibility for advice.
- **Not your memory.** Most assistants start each new conversation fresh, unless you've turned on a memory feature.

## A quick example

Here's a typical first attempt:

~~~
Give me dinner ideas.
~~~

You'll get a reasonable but generic list. Now compare:

~~~
I'm cooking for two adults and a 6-year-old who hates anything spicy.
We have about 30 minutes on weeknights and we're watching our budget.
Suggest 5 dinner ideas. No pasta, we already eat it a lot.
For each one, give a one-line description and the main ingredients.
~~~

Same assistant, a far better answer, because you treated it like a capable new assistant who needs a briefing. You'll master that skill in Module 2.

## Try it now

1. Open any AI assistant you can access. (Don't have one yet? Lesson 3 walks you through setup. Come back to this exercise afterwards.)
2. Paste this prompt and read the answer:

~~~
I'm completely new to AI assistants. In plain English, explain what you
are, what you're good at, and what you're not good at. Then ask me three
questions about my daily life so you can suggest how you might help me.
~~~

3. Answer its three questions honestly. Notice how its suggestions improve once it knows a little about you.

## Common mistakes

- **Treating it like a search box.** Typing three keywords gets you three keywords' worth of help. Write the way you'd talk to a person.
- **Trusting it blindly, or dismissing it entirely.** Both are mistakes. It's a powerful tool that needs a human in charge.
- **Giving up after one answer.** The first reply is a starting point, not the finished product.

## Key takeaways

- AI assistants are large language models, trained on vast amounts of text to understand and generate language.
- Picture a brilliant, tireless new assistant who has never met you and is sometimes confidently wrong.
- They're strongest at language tasks: drafting, rewriting, explaining, organizing, brainstorming and summarizing.
- Better context in means better answers out, and important facts always deserve a check.
`,
};

const whyAiMakesThingsUp: SeedLesson = {
  slug: "why-ai-makes-things-up",
  title: "How AI Assistants Work, and Why They Make Things Up",
  summary: "Training cutoffs, context windows and hallucinations explained simply, so you know exactly when to trust an answer.",
  durationMin: 10,
  content: md`
Ask an AI assistant for a book recommendation and it might suggest a title that sounds perfect, by a real author, that was never written. That isn't a glitch or a lie. It's a direct result of how these tools work. Once you understand why it happens, you'll know when to trust an answer and when to double-check.

## How an answer gets made

When you send a message, the assistant doesn't look up a stored answer. It writes its reply **one small piece at a time**, each time predicting what should come next based on your message, the conversation so far, and everything it learned in training. Those small pieces are called **tokens**, roughly a word or part of a word.

Because it learned from so much human writing, its predictions are often excellent: well structured, accurate and genuinely insightful. But the core process is "produce the most plausible continuation," not "retrieve the verified truth." Usually those are the same thing. Sometimes they aren't.

## Four things worth knowing

**1. Training has a cutoff date.** The model learned from text up to a certain point. Ask about something newer and it may not know, or may guess. Many assistants can search the web to fill the gap, but they don't always do it automatically. If timing matters, ask: "Did you search for this, or is it from your training?"

**2. It only sees what's in the conversation.** Everything you've typed or attached in the current chat is the assistant's working memory, called the **context window**. It's large but not unlimited, and in a very long conversation early details can get missed. New topic? Start a fresh chat.

**3. It doesn't remember you between chats by default.** Some assistants offer memory features that carry details forward. If yours does, you can usually view and delete what it remembers.

**4. It's built to be agreeable.** Assistants are trained to be helpful, which can tip into telling you what you want to hear. "Isn't this a great plan?" gets a different answer than "What are the weaknesses in this plan?"

## Why AI "hallucinates"

A **hallucination** is when AI states something false with complete confidence. It happens because:

- **It fills gaps with patterns.** If it doesn't know a specific fact, the most plausible-sounding text can still be wrong.
- **Specifics are fragile.** Names, dates, statistics, quotes, web links, page numbers and legal citations are where errors cluster.
- **Confidence isn't a signal.** A made-up answer sounds exactly as sure of itself as a correct one.
- **Leading questions invite agreement.** If your question assumes something false, the assistant may play along.

Modern assistants hallucinate far less than early versions, and many will now say "I'm not sure." But it still happens, so your job is to know where the risk is.

## The risk ladder

| Lower risk | Higher risk |
|---|---|
| Brainstorming, rewording, drafting | Specific facts, numbers and dates |
| Explaining well-established ideas | Recent events and current prices |
| Summarizing text you provided | Quotes, citations, links and sources |
| Organizing your own notes | Medical, legal and financial specifics |

The left column is where AI shines with little checking. The right column is where you verify before you rely on it. Module 5 gives you a simple three-minute fact-check routine.

## Worked example: catching a hallucination

Suppose you ask:

~~~
What are the best books about building better habits?
Include the author and year for each.
~~~

You get a tidy list. Most items are probably real, but one could be a plausible blend of a real author and a title they never wrote. This follow-up makes problems much easier to spot:

~~~
For each book you listed, rate how confident you are that the title,
author and year are exactly right (high, medium or low). Flag anything
I should double-check before I buy it.
~~~

Self-ratings aren't perfect, but they reliably surface the shakiest items. Then a ten-second search for each flagged title settles it.

## Try it now

1. Ask your assistant a question about something you know really well: your hometown, your job or a hobby.
2. Read the answer like an expert would. What did it get right? Is anything slightly off, outdated or invented?
3. Then paste this:

~~~
Which parts of your last answer are most likely to be wrong or out of
date? Be specific, and tell me how I could verify them.
~~~

Seeing AI's mistakes on a topic you know builds the instincts you'll need on topics you don't.

## Common mistakes

- **Asking for sources and never opening them.** AI can produce realistic-looking citations that don't exist or don't say what it claims. Click through.
- **Asking leading questions.** "Why is X true?" invites a defense of X. Try "Is X true? What's the evidence on each side?"
- **Keeping one chat going forever.** Long, wandering conversations get muddled. New topic, new chat.

## Key takeaways

- AI writes answers by predicting the most plausible next words, not by retrieving verified facts.
- It has a training cutoff, a limited working memory per chat, and usually no memory of you between chats.
- Hallucinations cluster around specifics: names, numbers, dates, quotes, links and citations.
- Use AI freely for drafting and thinking, and verify specifics before you rely on them.
`,
};

const setUpYourAssistant: SeedLesson = {
  slug: "set-up-your-ai-assistant",
  title: "Set Up Your AI Assistant (and Protect Your Privacy)",
  summary: "Choose an assistant, set it up safely in about ten minutes, and learn the privacy settings and sharing rules that matter.",
  durationMin: 10,
  content: md`
Choosing an AI assistant can feel like choosing a phone plan: lots of options, lots of opinions. Here's the reassuring truth. For everyday use the major assistants are all capable, and every skill in this course works with any of them. The best assistant is the one you'll actually open. Let's get you set up properly in about ten minutes.

## Step 1: Pick one assistant to start

The most widely used general-purpose assistants include **Claude** (made by Anthropic), **ChatGPT** (OpenAI), **Gemini** (Google) and **Microsoft Copilot**. Most offer a free version that's plenty for this course, plus paid plans with higher limits and extra features.

A few simple ways to choose:

- **Already live in Google or Microsoft tools?** Their assistants may fit neatly into what you use every day.
- **Want a second opinion later?** Pick one now and add another anytime. Comparing two answers is a great habit.
- **Using it for work?** Check whether your employer provides or approves a specific tool, and use that one for work tasks.

Features and plans change often, so don't overthink it. Pick one and spend this course learning the skills that carry across all of them.

## Step 2: Set it up safely

1. **Use the official website or official app.** Search for the company's name, or use your phone's app store and check the developer name carefully. Copycat apps exist, and some charge for things that are free.
2. **Use a strong, unique password**, and turn on two-step verification if it's offered.
3. **Install the app on your phone too.** Many of the most useful moments happen away from your desk: a quick message, a photo of a confusing form, a question while you're cooking.

## Step 3: Check four privacy settings

Open your assistant's settings and look for these. Names vary by product, but the ideas are the same:

- **Model training or data controls.** Many assistants let you choose whether your conversations can be used to improve their models. Decide what you're comfortable with and set it on purpose.
- **Chat history.** Know where your past conversations live and how to delete one.
- **Memory or personalization.** If your assistant can remember details across chats, find where to view, edit or switch that off.
- **Temporary or private chats.** Some assistants offer a mode that doesn't save the conversation to your history. Handy for one-off sensitive questions.

Policies differ between companies, and between free, paid and business plans, and they change over time. Five minutes on your assistant's privacy page is time well spent.

## The postcard rule

Here's a simple rule for what to share: **write as if your message could be read by someone else.** Not because anyone is likely to read it, but because it keeps you careful by default.

Never paste:

- Passwords, PINs or security codes
- Full card numbers, bank account numbers or government ID numbers
- Other people's private information without a good reason
- Confidential work information your employer hasn't approved for AI tools

You can still get help with sensitive topics. Just remove or swap the identifying details. "My client, a small-business owner in Ohio" works just as well as their name and address.

## Your first real conversation

~~~
Hi! I'm setting you up as my everyday AI assistant. A little about me:
- I'm a [YOUR ROLE OR SITUATION, E.G. "TEACHER AND PARENT OF TWO"]
- I'd love help with [2-3 THINGS, E.G. "EMAILS, MEAL PLANNING, SPANISH"]
- I prefer answers that are [E.G. "SHORT AND PRACTICAL, WITH BULLETS"]

Based on this, suggest five specific ways you could help me this week.
Keep each suggestion to one sentence.
~~~

Replace everything in [BRACKETS] with your own details, send it, and pick one suggestion to try today.

## Try it now

1. Create your account, or log in, using the official site or app.
2. Find the four privacy settings above and set each one deliberately.
3. Send the first-conversation prompt and try one of its suggestions.
4. Bonus: install the mobile app and ask one question from your phone.

## Common mistakes

- **Downloading the first app with "AI" in its name.** Check the developer. Stick to official apps.
- **Skipping the settings.** Five minutes now saves you wondering later where your data went.
- **Pasting first, thinking second.** Before you paste a document, skim it for personal or confidential details.
- **Trying five tools at once.** Get comfortable with one first. The skills transfer.

## Key takeaways

- The major assistants are all capable for everyday tasks. Pick one and start.
- Use the official app or website, a strong password and two-step verification.
- Review training, history, memory and temporary-chat settings on day one.
- Follow the postcard rule: never share passwords, financial or ID numbers, or confidential data.
`,
};

/* ------------------------------------------------------------------ */
/* Module 2 — Prompting That Works                                     */
/* ------------------------------------------------------------------ */

const fivePartPrompt: SeedLesson = {
  slug: "the-five-part-prompt",
  title: "The 5-Part Prompt: Role, Context, Task, Format, Examples",
  summary: "The simple framework behind almost every great AI answer, with before-and-after examples you can copy.",
  durationMin: 12,
  isPreview: true,
  content: md`
Two people ask the same AI assistant for help with the same problem. One gets a bland, generic answer and decides AI is overhyped. The other gets something so useful they use it almost word for word. The difference isn't luck or a paid plan. It's the prompt.

A **prompt** is simply what you type to the AI. Nearly every great prompt contains some mix of five parts.

## The five parts

| Part | What it tells the AI |
|---|---|
| **Role** | Who to act as: *"a friendly personal trainer"* |
| **Context** | Your situation: *"I'm 52, haven't exercised in years, and have a bad knee"* |
| **Task** | Exactly what you want: *"Create a 4-week walking plan"* |
| **Format** | What the answer should look like: *"A simple table, one row per week"* |
| **Examples** | What good looks like: *"Here's a plan layout I liked..."* |

You don't need all five every time. A quick question might only need a task. But when an answer disappoints, the fix is almost always one of these five.

### 1. Role

A role sets the expertise, vocabulary and point of view. "Act as an experienced kindergarten teacher" gets you different advice from "act as a pediatric sleep consultant." Both are useful, for different problems.

### 2. Context

This is the most important part, and the one most people skip. Remember, your assistant has never met you. Who's involved? What have you already tried? What constraints matter: budget, time, skill level, tone? Context turns a generic answer into *your* answer.

### 3. Task

Be specific about the action: write, summarize, compare, list, plan, rewrite or explain. "Help me with my resume" is vague. "Rewrite the summary section of my resume to highlight my leadership experience" is a task.

### 4. Format

Say what shape you want: bullet points, a table, a numbered checklist, a short email, three options, under 150 words. This one part saves more editing time than any other.

### 5. Examples

If you have an example of what good looks like (a past email you liked, a writing sample, a layout you prefer), include it. Examples communicate style faster than any description.

## Before and after

**Before:**

~~~
Write a message to my neighbor about their dog barking.
~~~

**After:**

~~~
Act as a tactful communicator who helps neighbors stay on good terms.

Context: My next-door neighbor's dog barks most weekdays from about 8am
to noon while they're at work. I work from home, so it's hard to take
calls. We get along well and I don't want to sound like I'm complaining.

Task: Write a short, friendly text message that raises the issue and
suggests we figure out a solution together.

Format: Under 80 words. Warm and casual. No passive-aggressive phrasing.

Example of my usual tone: "Hey! Hope your weekend was good. Quick
question for you when you get a sec..."
~~~

The first prompt gets a generic, slightly stiff note. The second gets a message you could send as is, in your own voice, that protects the relationship.

## Your reusable template

Copy this into your notes app. You'll use it constantly:

~~~
Act as [ROLE].

Context: [WHO YOU ARE, THE SITUATION, WHAT YOU'VE TRIED, CONSTRAINTS]

Task: [EXACTLY WHAT YOU WANT IT TO DO]

Format: [LENGTH, STRUCTURE, TONE]

Here's an example of what I like: [OPTIONAL EXAMPLE]
~~~

You don't need the labels. Writing naturally works just as well, as long as the information is there. The labels simply stop you forgetting a part.

## The shortcut when you're not sure what to include

When you don't know which context matters, let the AI ask:

~~~
I want help with [GOAL]. Before you answer, ask me up to five questions
that would help you give me a much better, more specific answer.
Ask them all at once.
~~~

This is one of the most useful prompts you'll ever learn. It turns the AI into an interviewer, so you end up with a great prompt without having to plan one.

## Try it now

1. Think of a real task you need to do this week: a message, a plan or a decision.
2. Write it as a one-line prompt, send it, and save the answer.
3. Rewrite it using all five parts and send it in a **new chat**.
4. Compare the two answers side by side. Which part made the biggest difference?

## Common mistakes

- **Skipping context.** The AI can't read your mind. Two extra sentences of background usually transform the answer.
- **Asking for everything at once.** "Plan my wedding" is too big. Break large jobs into steps.
- **Forgetting the format.** If you don't say, you get the AI's default, which is often longer than you want.
- **Being polite at the expense of clear.** Courtesy is fine, but clarity matters more. Say exactly what you want.

## Key takeaways

- Great prompts combine Role, Context, Task, Format and Examples, whenever the result matters.
- Context is the most powerful part, and the one most often skipped.
- Specifying the format saves more editing time than anything else.
- When you're unsure what to include, ask the AI to interview you first.
`,
};

const iterateAndFollowUp: SeedLesson = {
  slug: "iterate-and-follow-up",
  title: "Iterate Like a Pro: Follow-Ups That Fix Any Answer",
  summary: "Why the first answer is only a draft, and the follow-up phrases that turn a so-so reply into exactly what you need.",
  durationMin: 10,
  content: md`
Here's something experienced AI users know: they rarely get a perfect answer on the first try either. What they do differently is what happens next. Instead of starting over or giving up, they **steer**. A good follow-up takes ten seconds and often does more than a perfect first prompt.

## Think conversation, not vending machine

A vending machine gives you one thing per button press. A conversation builds. Your assistant can see everything earlier in the chat, so you never need to repeat yourself. Just react to what you got, the way you'd give feedback to a colleague.

The simplest follow-ups are often the most effective:

- **"Shorter."** or **"Cut this in half."**
- **"More casual."** or **"More professional."**
- **"Give me three different versions."**
- **"Keep the first paragraph and rewrite the rest."**
- **"Explain that like I'm new to this."**
- **"Make it more specific to my situation."**

## Five follow-ups that do the heavy lifting

**1. Say what's wrong, and what's right.**

~~~
This is close. Keep the friendly opening and the bullet list, but the
ending sounds too salesy. Rewrite just the last paragraph so it sounds
like a genuine thank-you.
~~~

Specific feedback ("the ending sounds salesy") beats vague feedback ("make it better").

**2. Ask for options.**

~~~
Give me 3 alternative versions: one very short, one warm and personal,
and one formal. Label each one.
~~~

Choosing from options is faster than describing what you want.

**3. Ask it to critique itself.**

~~~
Review your last answer the way a tough editor would. What's weak,
missing or unclear? Then write an improved version that fixes those
problems.
~~~

This works surprisingly well for writing, plans and arguments.

**4. Add the context you forgot.**

~~~
I should have mentioned: this is for my team of 4 volunteers, and none
of them have used this software before. Please adjust the instructions.
~~~

**5. Ask what it needs.**

~~~
What information would help you make this much better? Ask me.
~~~

## Follow up, edit, or start fresh?

Most assistants give you three ways forward:

- **Follow up** (most of the time) when the answer is on the right track and just needs adjusting.
- **Edit your original message, or regenerate,** when the answer went in the wrong direction from the start. Fixing the prompt is cleaner than arguing with a bad answer.
- **Start a new chat** when you're switching topics, or the conversation has become long and muddled. A fresh chat with a better prompt often beats ten corrections.

A handy trick before you start fresh is to ask the old chat to summarize itself:

~~~
Summarize what we've worked out in this conversation, including my
preferences and the decisions we made, so I can paste it into a new chat.
~~~

## Worked example: a birthday party plan

**First prompt:** "Help me plan my daughter's 8th birthday party."

The answer is a generic checklist. Here's how three follow-ups transform it:

1. **"Budget is about $200, 12 kids, at our house, and she loves science."** The plan becomes a science-themed party at home.
2. **"Turn this into a timeline for a 2-hour party, in 15-minute blocks."** Now you have a running order.
3. **"Give me a shopping list grouped by store section, with rough costs."** Now you can actually go shopping.

Three short follow-ups, one genuinely useful plan, and each step built on the last.

## Try it now

1. Take an answer from an earlier lesson, or ask for something new, like a packing list or this week's to-do list.
2. Improve it with at least **three** follow-ups: one about length or tone, one asking for options, and one asking the AI to critique itself.
3. Notice which follow-up helped most. That one goes in your toolkit.

## Common mistakes

- **Starting over every time.** You throw away all the context you built. Follow up first.
- **Vague feedback.** "That's not right" gives the AI nothing to work with. Say what's off and what you want instead.
- **Arguing with a broken answer.** If it's way off, edit your original prompt or start fresh rather than patching.
- **Accepting the first draft.** Two quick follow-ups usually lift an answer from okay to excellent.

## Key takeaways

- The first answer is a draft. The real value is in the follow-up.
- Be specific about what to keep and what to change.
- Ask for options, ask for a self-critique, and ask what information is missing.
- Follow up when you're close; edit your prompt or start fresh when you're way off.
`,
};

const giveAiYourContext: SeedLesson = {
  slug: "give-ai-your-context",
  title: "Give AI Your Context: Custom Instructions, Projects & Templates",
  summary: "Stop re-explaining yourself. Set up personal instructions, workspaces and reusable templates so every answer starts closer to right.",
  durationMin: 11,
  content: md`
If you've used AI for a week, you've probably typed the same background again and again: who you are, what you do, how you like your answers. There's a better way. In this lesson you'll set things up once, so your assistant starts every conversation already knowing the basics.

## Three layers of context

Think of context in three layers, from broadest to most specific:

1. **Personal instructions:** facts and preferences that apply to almost every chat.
2. **Workspaces:** background for one ongoing area of your life, like a job search, a renovation or a course you're studying.
3. **Templates:** saved prompts for tasks you repeat.

Assistants name these features differently ("custom instructions," "personal preferences," "projects" and so on), and features change over time. If yours doesn't have one of them, the note-based approach below works everywhere.

## Layer 1: Personal instructions

Most assistants have a settings area where you can describe yourself and how you'd like it to respond. Whatever you write there is quietly included in your conversations.

Here's a template to adapt:

~~~
About me:
- I'm [ROLE OR LIFE SITUATION], based in [CITY OR COUNTRY].
- I mostly use AI for [YOUR TOP 3 USES].
- I'm [A BEGINNER / COMFORTABLE / AN EXPERT] with [RELEVANT TOPICS].

How I like answers:
- Get to the point: lead with the answer, then the detail.
- Use plain English and explain any jargon.
- Use bullet points for steps and lists.
- If my request is unclear, ask me a question before answering.
- If you're unsure about a fact, say so.
~~~

Keep it short and general, and follow the postcard rule from Module 1: **no sensitive details** like account numbers, health specifics or anything you wouldn't want stored.

No settings for this? Save the text in a note and paste it at the start of important conversations.

## Layer 2: Workspaces for ongoing areas

Some assistants let you group related chats into a project or workspace with its own instructions and files. That's perfect for anything that lasts weeks or months.

**Example: a job search workspace.** Add your resume, a list of target roles and an instruction like this:

~~~
This workspace is for my job search. I'm moving from retail management
into operations or project coordination roles. Always tailor advice to
that transition, highlight transferable skills, and keep cover letters
under 250 words. My resume is attached for reference.
~~~

Now every chat inside it, whether it's a cover letter, interview practice or a follow-up email, starts with the full picture.

Good candidates for a workspace: a home renovation, a wedding, a course you're studying, a side business, or caring for an aging parent. No workspace feature? Keep a short "briefing note" for each area and paste it in when you start a related chat.

## Layer 3: Reusable templates

Any prompt you use more than twice deserves to be saved. Create a note called **"My AI Prompts"** in the notes app you already use, and store your best prompts with blanks to fill in:

~~~
WEEKLY PLAN
Here's my week: [PASTE CALENDAR OR LIST]. My top priorities are
[PRIORITIES]. Build a realistic day-by-day plan, flag anything that
won't fit, and suggest what to drop or delegate.
~~~

~~~
REPLY HELPER
Here's a message I received: [PASTE MESSAGE]. I want to reply
[YES / NO / NOT YET] and my main point is [POINT]. Draft a reply
under 100 words in a [TONE] tone.
~~~

The free AI Starter Kit's prompt library is a great place to start your collection.

## Worked example: same question, different context

Ask a fresh assistant "How should I prepare for my meeting tomorrow?" and you'll get general tips. Ask one that knows you're a new team lead, prefer short bullet points and get nervous presenting, and you'll get a focused prep checklist that includes a few ways to calm your nerves. Same question, completely different usefulness.

## Try it now

1. Write your personal instructions using the template above. Aim for 5 to 10 lines.
2. Add them to your assistant's settings, or save them in a note if that feature isn't available.
3. Start a new chat and ask: "Based on what you know about me, what are three ways you could save me time this week?" Check that the answer reflects your instructions.
4. Create your "My AI Prompts" note and save two templates.

## Common mistakes

- **Writing an essay.** Long instructions get diluted. Keep only what applies to most chats.
- **Setting and forgetting.** Review your instructions every couple of months as your needs change.
- **Storing sensitive details.** Save preferences, not private data.
- **Never checking memory.** If your assistant remembers things, look at what it saved now and then, and delete anything outdated.

## Key takeaways

- Layer your context: personal instructions, workspaces for ongoing areas, and saved templates.
- Personal instructions should be short, general and free of sensitive details.
- Workspaces keep long-running topics organized with their own background and files.
- Save any prompt you use more than twice. Your template library is your superpower.
`,
};

/* ------------------------------------------------------------------ */
/* Module 3 — AI for Everyday Life                                     */
/* ------------------------------------------------------------------ */

const emailsAndMessages: SeedLesson = {
  slug: "emails-and-messages",
  title: "Emails, Texts & Tricky Messages",
  summary: "Draft replies in seconds, get the tone right on difficult messages, and say no gracefully, while still sounding like you.",
  durationMin: 10,
  isPreview: true,
  content: md`
How much of your week goes into writing messages? Not just emails, but texts to family, notes to your kid's school, a reply to a client, and that awkward message you've been avoiding for three days. This is where AI pays off fastest for most people, because writing messages is pure language work, and you're the expert on whether the result sounds right.

## The golden rule: you bring the substance, AI handles the wording

AI is excellent at *how* to say something. Only you know *what* to say. The best results come from giving it your key points, even in messy shorthand, and letting it shape them:

~~~
Turn these notes into a clear, friendly email to my team:
- meeting moved from Tuesday to Thursday, same time
- bring your Q3 numbers
- Sam is presenting the new schedule
- lunch provided
Keep it under 100 words.
~~~

Thirty seconds of notes, a few seconds of AI, one clear email.

## Four everyday situations

### 1. Replying when you don't know what to say

~~~
Here's an email I received: [PASTE EMAIL]

I want to reply that [YOUR MAIN POINT]. Draft a response that is
[POLITE BUT FIRM / WARM / BRIEF], under [NUMBER] words.
~~~

Before pasting someone else's message, remove details they wouldn't want shared, like phone numbers or addresses. The AI doesn't need them.

### 2. Saying no without burning a bridge

~~~
I've been asked to [REQUEST]. I need to say no because [REASON].
Write a short, kind reply that declines clearly, doesn't over-apologize,
and [SUGGESTS AN ALTERNATIVE / LEAVES THE DOOR OPEN FOR NEXT TIME].
~~~

### 3. The emotionally tricky message

When you're angry, hurt or anxious, AI makes an excellent calm second pair of eyes:

~~~
I'm upset and I want to respond without making things worse.
Here's what they said: [PASTE MESSAGE]
Here's my draft reply: [PASTE YOUR DRAFT]

1. How is my draft likely to come across?
2. Rewrite it so it's honest about how I feel, but calm and constructive.
~~~

The question "How is this likely to come across?" is worth using before you send anything important.

### 4. Complaints that get results

~~~
Help me write a complaint to [COMPANY]. What happened: [FACTS, DATES,
ORDER NUMBER IF RELEVANT]. What I want: [REFUND / REPLACEMENT / FIX].
Make it firm, factual and polite, with a clear request and a reasonable
deadline. Under 200 words.
~~~

Clear facts plus a specific request are much harder to ignore than an emotional rant.

## Keeping your own voice

Messages that sound like a corporate brochure don't feel like you, and people notice. Three fixes:

- **Give it a sample.** Paste two or three messages you've written and say, "Match this tone and style."
- **Ban the clichés.** Add: "Avoid phrases like 'I hope this email finds you well' and 'Don't hesitate to reach out.'"
- **Do the final edit yourself.** Change a word or two and add a personal detail. That last 10 percent makes it yours.

## Worked example

You need to tell a friend you can't make their weekend get-together after you'd said yes. Your notes: "Can't come Sat. Work deadline moved. Really sorry. Want to see them soon, maybe dinner next week."

Your prompt: *"Turn this into a warm text to a close friend. Casual and genuine, not over-the-top apologetic. Suggest a specific evening for dinner next week."* The result is a short, kind message with a real plan in it. You tweak one word and send it: two minutes instead of twenty minutes of overthinking.

## Try it now

1. Find a message you've been putting off answering. There's always one.
2. Write your key points in rough shorthand.
3. Use the reply prompt above to draft a response, then ask: "How is this likely to come across to the person reading it?"
4. Make it yours with a personal touch, check the details, and send it.

## Common mistakes

- **Sending without reading.** Always check names, dates, numbers and promises. AI can add details that sound right but aren't.
- **Letting AI decide what you say.** You decide the message; AI helps with the wording.
- **Over-polishing messages to people who know you.** A text to your sister shouldn't read like a press release. Ask for "casual."
- **Pasting private details you don't need to.** Strip out phone numbers, addresses and account details first.

## Key takeaways

- Give AI your key points and let it handle the wording.
- Ask "How will this come across?" before sending anything important or emotional.
- Protect your voice with writing samples, banned clichés and a quick personal edit.
- Always check names, dates and commitments before you hit send.
`,
};

const planAnything: SeedLesson = {
  slug: "plan-anything",
  title: "Plan Anything: Meals, Travel, Budgets & Your Week",
  summary: "Turn AI into a personal planner for meals, trips, budgets and busy weeks, using constraints to get plans that fit your real life.",
  durationMin: 12,
  content: md`
Planning is a hidden time sink. Deciding what's for dinner, mapping out a trip, working out where the money goes, squeezing a too-full week into seven days: none of it is hard, exactly, but it drains your energy. AI is a remarkably good planning partner, as long as you give it the one thing it can't guess: **your constraints**.

## The planning formula: goal + constraints + format

A plan is only useful if it fits your real life, so every planning prompt should include:

- **Goal:** what you want to end up with.
- **Constraints:** budget, time, people, preferences, restrictions, and what you already have.
- **Format:** how you'll use the plan, such as a shopping list, a day-by-day itinerary or a table.

The more constraints you share, the less you'll have to fix later.

## Meals

~~~
Plan 5 weeknight dinners for [NUMBER] people.
Constraints: [DIETARY NEEDS AND DISLIKES], no more than [MINUTES]
minutes of hands-on cooking, budget-friendly, and use up what I already
have: [INGREDIENTS]. Reuse ingredients across meals to reduce waste.
Then give me one combined grocery list grouped by store section.
~~~

Follow-ups that help: "Swap Wednesday for something vegetarian," "Make Thursday a leftovers night," or "Which of these can I prep on Sunday?"

A note on allergies: AI can suggest recipes that avoid an allergen, but always read the labels yourself. It can't see what's actually in the product you buy.

## Travel

AI is great at turning a vague idea into a structured itinerary:

~~~
I'm planning [NUMBER] days in [DESTINATION] in [MONTH] with [WHO'S
COMING]. We enjoy [INTERESTS] and prefer a [RELAXED / PACKED] pace.
Our budget is [LEVEL]. Create a day-by-day itinerary that groups nearby
sights together, includes a rainy-day backup, and notes anything that
usually needs booking in advance.
~~~

**Verify before you book.** Opening hours, prices, seasonal closures, transport timetables and entry or visa requirements change. Treat the itinerary as a smart first draft and confirm details on official websites. If your assistant can search the web, ask it to include links, then open them.

## Budgets

AI can help you see patterns and build a simple plan without a spreadsheet:

~~~
Here are my approximate monthly expenses: [CATEGORIES AND ROUGH
AMOUNTS]. My take-home pay is about [AMOUNT]. I want to save [GOAL]
by [DATE].

1. Organize these into needs, wants and savings.
2. Suggest 3 realistic places to cut, with estimated monthly savings.
3. Build a simple monthly budget table and show your math.
~~~

Use **rounded figures and categories**, never account numbers, logins or full statements. And double-check the totals with a calculator. AI is usually right, but it takes ten seconds to be sure.

## Your week

~~~
Here's everything on my plate this week: [TASKS, APPOINTMENTS AND
DEADLINES]. Fixed commitments: [MEETINGS, SCHOOL RUNS, ETC.]. I have
the most energy in the [MORNING / AFTERNOON].

Build a realistic day-by-day plan. Put demanding work in my high-energy
time, batch small tasks, leave buffer time, and tell me honestly what
won't fit, with suggestions for what to drop, delay or delegate.
~~~

That last line matters. A plan that pretends everything fits isn't a plan. Asking AI to be honest about capacity gives you permission to let something go.

## Worked example: the Sunday reset

Here's a 15-minute weekly routine that combines everything above:

1. Brain-dump your week into the weekly planning prompt.
2. Ask for a dinner plan that fits the busy evenings it found: "Quick meals on Tuesday and Thursday, I get home late."
3. Ask for one grocery list for the whole week.
4. Ask: "What's one thing I could prepare tonight to make this week easier?"

Four prompts, one calmer week.

## Try it now

1. Pick one area: meals, a trip, your budget or your week.
2. Write down at least **four constraints** before you write the prompt.
3. Use the matching prompt above, then improve the plan with two follow-ups.
4. Save your final prompt to your "My AI Prompts" note so you can reuse it.

## Common mistakes

- **No constraints.** "Plan a trip to Italy" gets a generic tourist list. Who, when, budget and pace change everything.
- **Trusting time-sensitive details.** Prices, hours and rules change. Confirm anything you'll pay for or travel for.
- **Over-packed plans.** Ask for buffer time and honest trade-offs.
- **Sharing sensitive financial details.** Categories and rounded numbers are all AI needs.

## Key takeaways

- Every good planning prompt includes a goal, your constraints and a useful format.
- AI drafts the plan; you confirm prices, hours, rules and anything you'll pay for.
- Ask AI to tell you honestly what won't fit.
- A 15-minute weekly planning session with AI can make the whole week calmer.
`,
};

const learnAnythingFaster: SeedLesson = {
  slug: "learn-anything-faster",
  title: "Learn Anything Faster with an AI Tutor",
  summary: "Use AI as a patient personal tutor: explanations at your level, practice questions and feedback that make new knowledge stick.",
  durationMin: 11,
  content: md`
Imagine a tutor who knows something about almost every subject, never gets impatient, is available at 2am, and will happily explain the same idea five different ways until it clicks. That's what an AI assistant can be for you, but only if you use it to *learn*, not just to get answers.

## Answers versus understanding

There are two ways to use AI for learning:

- **Shortcut mode:** "What's the answer?" Fast, but very little sticks.
- **Tutor mode:** "Help me understand this." A little slower, and you actually learn.

Tutor mode works because learning takes effort: explaining, recalling, making mistakes and correcting them. A good AI tutor makes you do that work, with support.

## Five tutor techniques

### 1. Explain it at my level

~~~
Explain [TOPIC] to me. I'm a complete beginner. Start with the big
picture in 3-4 sentences, use an everyday analogy, then give me the
3 most important ideas I need to understand first.
~~~

Not clicking yet? Follow up with "Explain it a different way," "Give me a real-world example" or "What's a common misconception about this?"

### 2. Quiz me

Testing yourself is one of the most effective ways to remember things. Learning researchers call it retrieval practice.

~~~
Quiz me on [TOPIC] with 5 questions, one at a time. Wait for my answer
before moving on. If I get one wrong, give me a hint before the answer.
At the end, tell me which areas I should review.
~~~

### 3. Teach it back

If you can explain something simply, you understand it. Use the AI to check:

~~~
I'm going to explain [TOPIC] in my own words. Tell me what I got right,
what I got wrong or left out, and ask me one question that would test
whether I really understand it. My explanation: [YOUR EXPLANATION]
~~~

### 4. The Socratic tutor

~~~
Act as a Socratic tutor. I want to understand [TOPIC]. Don't give me
the answers. Ask me guiding questions, one at a time, that help me work
it out myself. If I'm stuck twice in a row, give me a small hint.
~~~

It's slower, and it's also how the deepest learning happens.

### 5. Build a learning plan

~~~
I want to learn [SKILL] well enough to [SPECIFIC GOAL] in [TIMEFRAME].
I can spend [TIME] per week. Create a week-by-week plan with what to
learn, how to practice and a simple way to check my progress each week.
~~~

## Practicing a language

AI makes a patient conversation partner:

~~~
Let's practice [LANGUAGE] at a [BEGINNER / INTERMEDIATE] level. Chat
with me casually about [TOPIC], using short messages. After each of my
replies, gently correct my mistakes, then continue the conversation.
~~~

If your assistant has a voice mode, try this out loud. There's more on voice features in Module 4.

## A note for students and parents

Using AI to understand material, practice and get feedback is powerful. Using it to write your assignments usually breaks the rules, and it skips the learning you're there for. Schools and courses set different policies, so check yours. A good rule of thumb: **use AI the way you'd use a great tutor, not a ghostwriter.**

## Worked example: understanding your electricity bill

Say your electricity bill jumped and you want to know why. Shortcut mode gets you a list of generic causes. Tutor mode goes further: you ask for a plain-English explanation of what a kilowatt-hour is, let the AI quiz you with two quick questions, then type in your monthly usage figures (no account details) and work out together which appliances and habits matter most. Fifteen minutes later you understand your bill, and you'll still understand it next month.

## Watch for accuracy

AI is very reliable on well-established topics, such as basic science, history overviews, grammar and how everyday things work. It's less reliable on niche, fast-changing or highly technical specifics. If details matter, as with a certification exam, a medical topic or a legal requirement, confirm key facts with your textbook, official guidance or another trusted source.

## Try it now

1. Pick something you've always wanted to understand better, anything from how interest rates work to how to prune roses.
2. Use the "explain it at my level" prompt.
3. Then use the quiz prompt and answer all five questions honestly.
4. Finally, explain the topic back in your own words and ask for feedback.

## Common mistakes

- **Only asking for answers.** You'll feel productive but remember little. Get the AI to quiz you.
- **Not saying your level.** Tell it what you already know, or the explanation may be pitched too high or too low.
- **Trusting niche details.** For specialized or high-stakes topics, cross-check the key facts.
- **Reading passively.** Stop and explain things back. That's where the learning happens.

## Key takeaways

- Use AI in tutor mode, focused on understanding, rather than shortcut mode.
- Ask for explanations at your level, then quiz yourself and teach it back.
- A Socratic tutor makes you think, and thinking is what makes learning stick.
- Verify key facts when you're learning niche or high-stakes topics.
`,
};

const healthLegalMoney: SeedLesson = {
  slug: "health-legal-and-money-questions",
  title: "Health, Legal & Money Questions: Using AI Safely",
  summary: "Use AI to understand serious topics and prepare better questions, with clear rules for when to verify and when to see a professional.",
  durationMin: 12,
  content: md`
Sooner or later you'll want to ask AI about something serious: a symptom, a confusing clause in a lease, whether to pay off debt or save. AI can be genuinely helpful here. It can explain jargon, help you organize your thoughts and prepare you for a much better conversation with a professional. It can also be confidently wrong in ways that matter. This lesson gives you a simple system for getting the benefits safely.

**Emergencies first:** if you or someone else might be in danger, or there are symptoms like chest pain, difficulty breathing or signs of a stroke, contact emergency services right away. Don't ask an AI.

## Why these topics are different

With everyday tasks, a mistake costs you a rewrite. Here, a mistake can cost your health, your money or your legal rights. Three reasons to be extra careful:

- **AI can't see your full situation.** A doctor examines you, a lawyer reads your documents, and a financial advisor knows your whole picture. AI only knows what you typed.
- **Rules depend on where you live.** Laws, taxes, benefits and medical guidelines vary by country, state and even city, and AI may blend them together.
- **It tends to reassure.** Assistants are built to be helpful and agreeable, so they can lean toward telling you what you hope to hear.

## The traffic-light system

| Light | What AI helps with | Your move |
|---|---|---|
| 🟢 Green | Explaining terms, summarizing documents, preparing questions | Go ahead |
| 🟡 Yellow | General guidance, typical options, how a process usually works | Verify with an official source |
| 🔴 Red | Diagnosis, medication changes, legal strategy, big money decisions | Prepare with AI, decide with a professional |

The safest and most valuable use of AI on serious topics is green: **understanding and preparing.**

## Health: prepare for your appointment

~~~
I have a doctor's appointment about [SYMPTOM OR CONDITION]. Help me
prepare. Don't diagnose me.
1. Organize my notes into a clear summary I can share: [WHEN IT STARTED,
   HOW OFTEN IT HAPPENS, WHAT HELPS OR MAKES IT WORSE, CURRENT MEDICATIONS]
2. Suggest questions I should ask.
3. Explain any terms I might hear, in plain English.
~~~

You walk in organized and walk out with your questions answered. It's also useful afterwards: paste your visit notes and ask, "Explain this in plain English. What should I ask at my follow-up?"

## Legal: understand before you sign

~~~
Here's a clause from my [LEASE / CONTRACT / TERMS], with names and
addresses removed: [PASTE CLAUSE]. I'm in [STATE OR COUNTRY].
1. Explain what it means in plain English.
2. What could it mean for me in practice? Give one example.
3. What questions should I ask the other party, or a lawyer, about it?
~~~

AI can help you spot what to ask. It can't confirm that a contract is fair or enforceable where you live. For anything with real stakes, like a dispute, a large contract or an immigration matter, talk to a qualified lawyer. Many areas have free or low-cost legal aid services.

## Money: think it through, then check

~~~
Help me think through a money decision. Don't tell me what to do.
My situation: [E.G. "I HAVE SOME SAVINGS AND A CREDIT CARD BALANCE
WITH A HIGH INTEREST RATE"]. Options I'm considering: [OPTIONS].
Explain the trade-offs of each in plain English, the questions I should
ask myself, and what I should confirm with my bank or a professional.
~~~

Asking for trade-offs instead of a verdict keeps you in charge. Check any numbers with a calculator, and confirm current rates, fees and tax rules with official sources.

## Protect your privacy

Strip out names, dates of birth, addresses, account numbers, policy numbers and medical record numbers before you paste anything. "A 45-year-old with type 2 diabetes" is all the AI needs, not your patient ID.

## Try it now

1. Find a document with confusing language: an insurance policy, a bill, a lease or a benefits letter.
2. Remove personal details, then paste a short section and ask: "Explain this in plain English, and list three questions I should ask about it."
3. Decide which traffic light each of your follow-up questions falls under, and where you'd verify the yellow ones.

## Common mistakes

- **Asking for a verdict instead of understanding.** "Should I sign this?" is red. "What does this clause mean, and what should I ask?" is green.
- **Leaving out your location.** Rules vary widely. Always say where you are.
- **Sharing identifying details.** Anonymize first.
- **Treating reassurance as the all-clear.** If something feels wrong with your health, money or legal situation, a professional opinion beats a reassuring paragraph.

## Key takeaways

- Use AI to understand, organize and prepare. That's its safest and most valuable role here.
- Follow the traffic lights: green means go, yellow means verify, red means see a professional.
- Always include your location, and always remove identifying details.
- In an emergency, contact emergency services, never an AI.
`,
};

/* ------------------------------------------------------------------ */
/* Module 4 — AI for Work & Productivity                               */
/* ------------------------------------------------------------------ */

const writingAndEditing: SeedLesson = {
  slug: "writing-and-editing",
  title: "Write and Edit Better (Without Sounding Like a Robot)",
  summary: "Use AI as an editor and writing partner for reports, posts and documents, while keeping your own voice and judgment.",
  durationMin: 11,
  content: md`
You've probably read text that was obviously written by AI: smooth, vague, oddly enthusiastic, and full of words like "delve" and "elevate." That's what happens when people hand AI the whole job. In this lesson you'll learn the opposite approach: using AI as a sharp editor and writing partner, so your writing gets clearer and faster while still sounding like you.

## Editor, not ghostwriter

There are two ways to write with AI:

- **Ghostwriter:** "Write a report about X." You get generic text that needs heavy rewriting and doesn't sound like you.
- **Editor and partner:** you bring the ideas and a rough draft, and AI helps you structure, tighten and polish.

The second approach is faster overall and produces better writing, because the substance, the specifics and the voice all come from you.

## Start with structure

Staring at a blank page? Don't ask for the finished piece. Ask for an outline built from your own thoughts:

~~~
I need to write a [TYPE OF DOCUMENT] for [AUDIENCE] about [TOPIC].
My main point is [MAIN POINT]. Here are my rough thoughts: [NOTES].
Suggest a clear outline with section headings and one line on what each
section should cover. Don't write the full piece yet.
~~~

Adjust the outline until it's right. Then write each section yourself, or draft it together one section at a time.

## Edit with specific instructions

"Improve this" gets random changes. Specific instructions get useful edits:

~~~
Edit the text below for clarity and flow. Keep my voice and all of my
key points. Don't add new ideas or facts. Then list the 5 most
important changes you made and why, so I can learn from them.

[PASTE YOUR DRAFT]
~~~

Asking for the reasons behind each change makes you a better writer over time, and makes it easy to reject edits you disagree with.

Other focused edits that work well:

- **"Cut this by 30 percent without losing any key points."**
- **"Give me 3 stronger options for the opening sentence."**
- **"Find anything vague or unsupported, and ask me for the specifics."**
- **"Rewrite this for a reader with no background in the topic."**
- **"Check spelling, grammar and consistency only. Don't change my style."**

## Keep your voice

AI has a default style. To override it, show it yours:

~~~
Here are two samples of my writing: [SAMPLE 1] [SAMPLE 2]
Describe my writing style in 5 bullet points: tone, sentence length,
vocabulary and structure. Then edit the draft below to match it.

[YOUR DRAFT]
~~~

Save the style description it gives you. You can paste it into future prompts or your personal instructions.

It also helps to ban the giveaways:

~~~
Avoid buzzwords and filler such as "delve," "elevate," "unlock,"
"in today's fast-paced world" and "it's important to note."
Use short, concrete sentences.
~~~

## Worked example: a neighborhood newsletter

Say you volunteer for your neighborhood association and write a monthly update. Your notes: road repairs start on the 14th, the park cleanup needs ten more volunteers, dues are due by the end of the month, and thank you to everyone who came to the picnic.

1. Ask for an outline in a warm, neighborly tone.
2. Paste last month's newsletter so it can match the style.
3. Draft it, then ask: "What would a busy neighbor skim past? Make the volunteer request impossible to miss."
4. Read it aloud, fix anything that doesn't sound like you, and check every date.

## Be honest about AI help

Norms are still settling. Plenty of people use AI to help edit without mentioning it, much like spellcheck. But some workplaces, schools and publications have specific rules about AI-assisted writing, so know what's expected. When words are presented as personally yours, like a heartfelt letter, a personal statement or a reference, write the heart of it yourself.

## Try it now

1. Take something you've written recently: an email, a post or a section of a report.
2. Run the "edit for clarity, then list your changes" prompt.
3. Accept the edits you agree with, reject the rest, and note one writing habit you learned.

## Common mistakes

- **Letting AI invent facts.** Tell it "Don't add facts I didn't give you," then check anyway.
- **Accepting every edit.** You're the author. Push back on changes that lose your meaning.
- **Publishing the first draft.** AI drafts need a human pass for accuracy, voice and specifics.
- **Generic instructions.** "Make it better" leads to bland. Say exactly what better means.

## Key takeaways

- Use AI as an editor and partner, not a ghostwriter. You bring the ideas and the draft.
- Start with an outline built from your own thoughts.
- Give specific editing instructions and ask AI to explain its changes.
- Protect your voice with samples, a style description and a list of banned phrases.
`,
};

const researchAndSummaries: SeedLesson = {
  slug: "research-and-summaries",
  title: "Research and Summarize Documents You Can Trust",
  summary: "Get accurate summaries of long documents, pull out what matters, and research questions without falling for made-up sources.",
  durationMin: 12,
  content: md`
The 40-page report you're meant to read before Thursday. The meeting transcript nobody wants to go through. Three insurance quotes that use different words for the same thing. Summarizing and comparing documents is one of AI's most practical superpowers and, with the right technique, one of its most reliable.

## Why documents are a sweet spot

Remember the risk ladder from Module 1: AI is most reliable when it works from **text you provide**, and least reliable when it relies on memory. When you paste or upload a document, the source is right in front of it. That doesn't make it perfect, but it makes it far more trustworthy, especially if you ask it to show its work.

## Summaries that actually help

"Summarize this" gets you a generic summary. A summary with a **purpose** gets you what you need:

~~~
Summarize the document below for [WHO, E.G. "ME, A BUSY PARENT"].
I need to know [YOUR PURPOSE, E.G. "WHAT CHANGES FOR OUR FAMILY AND
WHAT WE NEED TO DO"].

Give me:
1. The 3-5 key points, in plain English
2. Anything I need to do, with deadlines
3. Anything surprising, unusual or easy to miss

[PASTE OR ATTACH THE DOCUMENT]
~~~

## Ask it to show its evidence

This is the single best habit for trustworthy summaries. Add it to any summary prompt:

~~~
For each key point, include a short direct quote from the document that
supports it. If something isn't in the document, say "not in the
document" rather than guessing.
~~~

Quotes let you check any point in seconds by searching for them in the original. If a quote isn't there, you've caught a problem.

## Questions to ask any document

- **"What does this say about [TOPIC]? Quote the relevant parts."**
- **"What questions does this document leave unanswered?"**
- **"Explain the section on [TOPIC] as if I'm new to the subject."**
- **"List every date, deadline and dollar amount mentioned."**

## Comparing documents

~~~
Compare these [QUOTES / OFFERS / POLICIES] in a table with these rows:
[PRICE, WHAT'S INCLUDED, EXCLUSIONS, CANCELLATION TERMS, ANYTHING
UNUSUAL]. Use only information in the documents and mark anything not
mentioned as "not stated." Then list questions I should ask each provider.
~~~

"Not stated" is important. It stops the AI filling gaps with assumptions, and it shows you exactly what to ask about.

## Meeting notes and transcripts

~~~
Here are notes from a meeting: [PASTE NOTES OR TRANSCRIPT]
Pull out the decisions made, the action items (who, what and by when),
open questions, and anything discussed but not resolved.
~~~

## Researching questions, not just documents

When there's no document and you're asking AI to find information, the risk goes up. Three habits help:

1. **Use web search when it matters.** If your assistant can search the web, ask it to for anything recent or specific, and to include links.
2. **Open the sources.** Check that each link works and actually says what the AI claims. Prefer original sources, like official sites or the original study, over someone else's summary.
3. **Ask for disagreement.** "What do critics or experts who disagree say?" helps you avoid a one-sided picture.

## Know the limits

- **Length.** Very long documents can exceed what your assistant reads at once. If it seems to miss later sections, split the document and summarize it in parts.
- **Scans and photos** may be read imperfectly. Spot-check the numbers.
- **Confidentiality.** Don't upload confidential work documents, or files full of personal data, unless your assistant's settings and your organization's policies allow it.

## Try it now

1. Pick a real document: some terms and conditions, a school newsletter, an article you've been meaning to read, or a work report you're allowed to share.
2. Use the purpose-driven summary prompt, plus the "include a supporting quote" instruction.
3. Spot-check two of the quotes against the original. Did they match?
4. Ask: "What questions does this document leave unanswered?"

## Common mistakes

- **Summaries without a purpose.** Say who the summary is for and what you need to decide or do.
- **Never checking.** Spot-checking two or three quotes takes a minute and catches most problems.
- **Treating cited sources as verified.** Open them, every time it matters.
- **Uploading what you shouldn't.** When in doubt, remove sensitive details first.

## Key takeaways

- AI is most reliable when it works from text you provide.
- Give every summary a purpose and a structure.
- Ask for supporting quotes and "not stated" markers so you can verify quickly.
- For open-ended research, use web search, open the sources and look for disagreement.
`,
};

const decisionsAndBrainstorming: SeedLesson = {
  slug: "decisions-and-brainstorming",
  title: "Better Decisions and Brainstorming",
  summary: "Use AI to generate more ideas, see your blind spots and weigh options clearly, while keeping the final call firmly yours.",
  durationMin: 11,
  content: md`
Some of the best uses of AI don't produce anything you'd send or publish. They produce better *thinking*. Stuck for ideas? AI can give you twenty in a minute. Torn between two options? It can help you see trade-offs you've been too close to notice. In this lesson you'll learn to use AI as a thinking partner: creative, honest, and never the one making the decision.

## Brainstorming: go wide, then narrow

Good brainstorming has two phases: **diverge** (lots of ideas, no judging) and **converge** (pick the best). AI is brilliant at the first and helpful with the second.

~~~
I need ideas for [GOAL]. Context: [WHO IT'S FOR, CONSTRAINTS, BUDGET,
AND WHAT I'VE ALREADY TRIED OR RULED OUT].
Give me 20 ideas: some safe, some unusual, and a few that seem almost
too bold. One line each.
~~~

Then narrow it down:

~~~
From that list, pick the 5 that best fit my constraints. For each one,
give the biggest advantage, the biggest risk and a cheap way to test it.
~~~

Tips for better brainstorms:

- **Ask for quantity.** The first few ideas are usually the obvious ones. The interesting ones come later in the list.
- **Push the edges.** "What would a [DIFFERENT PROFESSION] suggest?" or "What would this look like with half the budget?"
- **Combine.** "Merge ideas 3 and 11 into something new."

## Decisions: structure beats agonizing

When you're stuck on a decision, it's often because the options are tangled up in your head. AI helps you untangle them.

### The weighted comparison

~~~
Help me decide between [OPTION A] and [OPTION B].
What matters most to me, in order: [CRITERIA, E.G. COST, COMMUTE,
GROWTH, FAMILY TIME].
Create a table scoring each option 1-5 on each criterion, with a
one-line reason for each score. Then tell me which option comes out
ahead, and what would have to be true for the other one to be better.
~~~

The last question is the powerful part. It shows you which assumptions the decision really hinges on.

### The pre-mortem

~~~
I'm planning to [DECISION]. Imagine it's one year from now and this
turned out to be a mistake. Give me the 5 most likely reasons it went
wrong, and for each, one thing I could do now to prevent it.
~~~

Pre-mortems surface risks that optimism hides, without talking you out of a good idea.

### The honest challenger

Remember that assistants tend to agree with you. Counter that on purpose:

~~~
Here's what I'm leaning toward and why: [YOUR REASONING].
Play devil's advocate and give me the strongest honest case against it.
Don't soften it. Then tell me which of my reasons hold up best.
~~~

## Worked example: should I take the new job?

You've been offered a role with higher pay and a longer commute. You list your criteria: income, time with family, growth and stress. The weighted comparison shows the options are closer than you thought. The new job wins on income and growth, and your current job wins on family time. Then the "what would have to be true" question reveals that the decision hinges on whether you could work from home two days a week.

That's not a question for AI. It's a question for the hiring manager, and now you know exactly what to ask. That's the ideal outcome: AI doesn't decide; it shows you **what the decision really depends on.**

## Know when to stop

AI can generate pros and cons forever. If you've done a comparison and a pre-mortem and still can't decide, the options may be genuinely close, and either could work out well. At that point, gather one more piece of real-world information, sleep on it, or talk it through with someone who knows you.

## Try it now

1. Pick a real decision you're weighing, big or small.
2. Run the weighted comparison prompt with your real criteria.
3. Run the pre-mortem on your leading option.
4. Write down the one question or fact the decision hinges on, and go and find the answer.

## Common mistakes

- **Asking "What should I do?"** You'll get a generic answer. Ask for structure, trade-offs and blind spots instead.
- **Leading the witness.** "Isn't option A better?" invites agreement. Ask neutrally, or ask for the counter-argument.
- **Stopping at the first five ideas.** Quantity first, judgment second.
- **Outsourcing the decision.** AI only knows what you value if you tell it, and it doesn't live with the consequences. You do.

## Key takeaways

- Brainstorm in two phases: go wide with lots of ideas, then narrow with clear criteria.
- A weighted comparison untangles options and shows what the decision hinges on.
- Run a pre-mortem, and ask for the strongest case against your favorite option.
- AI structures the thinking; you make the call.
`,
};

const voiceAndImages: SeedLesson = {
  slug: "voice-and-images",
  title: "Talk, Snap & Show: Voice and Image Features",
  summary: "Go beyond typing: talk through ideas hands-free, get help with photos and screenshots, and create images from a description.",
  durationMin: 10,
  content: md`
Typing isn't the only way to use AI anymore. Many assistants can listen and talk back, look at a photo you've taken, and even create images from a description. That turns AI into something you can use while cooking, walking, or standing in front of a confusing parking sign. Features vary between assistants and plans, and they change quickly, so check what yours offers. The techniques below work wherever the features are available.

## Voice: think out loud

There are usually two kinds of voice feature:

- **Dictation:** you speak and it types your words into the message box. Great for long, rambling context that would be tedious to type.
- **Voice conversation:** a spoken back-and-forth, a bit like a phone call with your assistant.

Voice shines when your hands are busy or your thoughts are messy:

- **Brain dumps.** Talk for two minutes about everything on your mind, then say, "Turn that into an organized to-do list, grouped by priority."
- **Rehearsals.** Practice a salary conversation, a difficult talk or a presentation out loud.
- **Language practice.** Speaking practice with instant, patient feedback.
- **Hands-free help.** "How do I scale this recipe up for six people?" while your hands are covered in flour.

Try this as a spoken prompt:

~~~
I want to practice asking my manager for [REQUEST]. You play my
manager. Be realistic and push back a little, the way a busy manager
might. When we finish, tell me what I did well and what to improve.
~~~

## Images in: AI that can see

Many assistants let you upload or snap a photo and ask about it. It's surprisingly useful:

- **Your fridge or pantry:** "What can I make for dinner with this in 30 minutes?"
- **A confusing form:** "What is this asking for, and what do I need to fill in?"
- **A screenshot of an error message:** "What does this mean, and how do I fix it? I'm not technical."
- **A chart:** "What's the main takeaway here?"
- **Handwritten notes or a whiteboard:** "Type this up and organize it into action items."

A good image prompt still uses the five parts. Add context and a clear task:

~~~
[ATTACH PHOTO] This is a letter I received about [TOPIC]. In plain
English: what is it about, do I need to do anything, and by when?
Flag anything that looks unusual or like a possible scam.
~~~

**Accuracy note:** AI can misread blurry text, small numbers and handwriting. For anything important, like a medication label, a bill amount or a deadline, check against the original. Identifying plants, mushrooms, insects or skin conditions from a photo is a starting point only. **Never eat a wild plant or mushroom based on an AI identification.**

## Images out: creating pictures

Some assistants can generate images from a description: a party invitation, an illustration for a presentation, a visual idea for your garden. Describe four things:

1. **Subject:** what's in the image.
2. **Style:** photo, watercolor, flat illustration or cartoon.
3. **Composition and mood:** close-up or wide, bright or moody, colors.
4. **Use:** for example, "for a square social media post" or "for a printed flyer."

~~~
Create an image for a kids' science birthday party invitation: a
friendly cartoon rocket and planets, bright colors, playful style,
with empty space at the top for text. Square format.
~~~

Image generators can still struggle with exact wording, so add any text yourself in a design or document app.

## Privacy and respect

- **Photos can show more than you meant to share:** faces, addresses, license plates and paperwork in the background. Crop first.
- **Don't create images of real people** in ways that could mislead or embarrass them. Many tools restrict this anyway, and it's a bad idea regardless.
- **Ask before uploading other people's photos.** Your friend's face isn't yours to share.

## Try it now

1. Take a photo of something real: your fridge, a sign, or a confusing piece of mail with personal details covered.
2. Ask a specific question about it, with context and a clear task.
3. If your assistant has voice, try a two-minute spoken brain dump and ask it to organize your thoughts.

## Common mistakes

- **Assuming it read everything correctly.** Check numbers, dates and small print against the original.
- **Uploading photos with sensitive details.** Crop or cover them first.
- **Forgetting the question.** A photo with no prompt gets a generic description. Say what you want to know.

## Key takeaways

- Voice is perfect for brain dumps, rehearsals and hands-free help.
- A photo plus a clear question makes forms, letters, labels and screenshots easy to understand.
- Check anything important against the original, and never rely on AI to tell you what's safe to eat.
- Crop out sensitive details, and never create misleading images of real people.
`,
};

/* ------------------------------------------------------------------ */
/* Module 5 — Make It a Habit                                          */
/* ------------------------------------------------------------------ */

const factCheck: SeedLesson = {
  slug: "fact-check-in-three-minutes",
  title: "Fact-Check AI in Three Minutes",
  summary: "A simple, repeatable routine to catch AI mistakes before they cost you, without spending all day double-checking.",
  durationMin: 10,
  content: md`
You know AI can be confidently wrong. But you can't verify every sentence, or AI would stop saving you time. The answer is a fast, focused routine: check **the right things**, in **the right way**, in about three minutes. Use it whenever an answer will inform a decision, go out under your name, or cost money.

## Step 1: Decide whether it needs checking (10 seconds)

Ask yourself one question: **"What happens if this is wrong?"**

- **Low stakes** (a brainstorm, a draft you'll edit, a recipe idea): a quick read-through is enough.
- **Medium stakes** (an email with facts in it, a plan you'll follow, something you'll share): check the key claims.
- **High stakes** (health, legal, money, safety, anything published): check every specific claim, and consider a professional.

## Step 2: Spot the checkable claims (30 seconds)

Errors hide in specifics. Scan for:

- Names, job titles and quotes
- Numbers, statistics, prices and dates
- Laws, rules, policies and deadlines
- Links, citations, and book or article titles
- Anything that surprised you

Or let the AI do the scanning:

~~~
List every specific factual claim in your last answer: names, numbers,
dates, quotes, sources and rules. For each one, tell me how confident
you are (high, medium or low) and the best type of source to verify it.
~~~

## Step 3: Verify the important ones (2 minutes)

For each claim that matters:

- **Go to the source.** Official websites (government, the company, the organization itself) beat blogs and forums. For research, the original study beats news coverage of it.
- **Open every link.** Does the page exist? Does it actually say what the AI claimed?
- **Search for the exact quote or title.** If you can't find it anywhere, treat it as invented.
- **Redo important math.** A calculator takes seconds.
- **Check the date.** Is this still current? Prices, rules and anything described as "the latest" change fast.

A useful technique here is **lateral reading**: instead of studying one source closely, open a few others in new tabs and see what they say about the same claim. If reliable sources agree, you're in good shape.

## Step 4: Let AI help check itself, carefully

These prompts help surface problems. They supplement real sources; they don't replace them.

~~~
Which parts of your answer might be outdated, oversimplified or wrong?
What would change your answer?
~~~

~~~
Argue against your own answer. What would a skeptical expert say?
~~~

You can also get a **second opinion**: paste the claim into a different assistant, or a fresh chat, and ask, "Is this accurate? What's the evidence?" If the answers disagree, you know exactly where to dig.

## Red flags

Slow down when you see:

- **Very precise statistics with no source**
- **Quotes that are a little too perfect**
- **Citations you can't find**
- **Information that only confirms what you hoped**
- **Confident answers about very recent events**

## Worked example

You ask about the rules for bringing food through customs on an upcoming trip, and get a clear, detailed answer. Run the routine:

1. **Stakes:** medium to high. Getting it wrong could mean a fine or confiscated items.
2. **Claims:** which items are allowed or banned, and whether you need to declare anything.
3. **Verify:** find the destination country's official customs or border agency website and compare.
4. **Result:** most of the answer matches, but one detail is out of date. You follow the official guidance.

Three minutes, one avoided headache.

## Try it now

1. Ask your assistant a factual question you're genuinely curious about, such as a historical event, a health guideline or how a rule works where you live.
2. Use the "list every specific factual claim" prompt.
3. Verify the two most important claims using official or original sources.
4. Note what you found: all correct, partly outdated, or wrong?

## Common mistakes

- **Checking everything, or nothing.** Match your effort to the stakes.
- **Asking "Are you sure?" and stopping there.** The AI might double down on a mistake, or back down when it was right. Check a real source.
- **Trusting a source because it looks official.** Make sure the page exists and says what's claimed.
- **Forgetting dates.** Correct last year can be wrong today.

## Key takeaways

- Match your checking effort to the stakes: what happens if this is wrong?
- Errors hide in specifics: names, numbers, dates, quotes, links and rules.
- Verify with official and original sources, open every link, and redo important math.
- AI self-checks and second opinions help you find problems; real sources settle them.
`,
};

const safetyAndEthics: SeedLesson = {
  slug: "safety-ethics-and-what-never-to-share",
  title: "Safety, Ethics & What Never to Share",
  summary: "Protect your privacy, spot AI-powered scams, and use AI honestly and fairly at home, at school and at work.",
  durationMin: 11,
  content: md`
AI is a powerful tool, and like any powerful tool it comes with a few rules worth knowing by heart. This lesson covers three things: protecting your information, protecting yourself from people who use AI against you, and using AI in a way you'd be comfortable explaining to anyone.

## What never to share

You learned the postcard rule in Module 1. Here's the complete list to keep handy. **Never paste into an AI assistant:**

- Passwords, PINs, security codes or recovery codes
- Full card numbers, bank details or government ID numbers
- Medical record numbers, insurance policy numbers or detailed health records tied to your name
- Other people's private information, like their address, health details or messages they shared in confidence
- Confidential work material, such as client data, financials or unreleased plans, unless your employer has approved the tool for it

Before you paste anything, pause and ask:

1. Would I be comfortable if a stranger read this?
2. Does it identify me or someone else?
3. Could I describe it instead of pasting it?

You can almost always get the same help by swapping specifics for descriptions: "my client" instead of a name, "a mid-sized city" instead of an address, rounded numbers instead of exact balances.

## Scams just got smarter

Scammers use AI too, and their messages are now well written, personalized and convincing. Three threats to know:

- **Voice cloning.** Scammers can imitate someone's voice from a short recording. A panicked call from a "grandchild" or "boss" asking for urgent money or gift cards could be fake. **Agree on a family code word**, and if a call feels urgent and unusual, hang up and call back on a number you already know.
- **Deepfake images and video.** Realistic fakes are easy to make. Be skeptical of shocking content, especially when it pushes you to act or share right away.
- **Polished phishing.** Bad spelling used to be a giveaway. Not anymore. Judge a message by what it asks for: urgency, secrecy, payment by gift card, wire transfer or crypto, or a link to "verify your account" are red flags however professional it looks.

AI can help you spot scams, too:

~~~
I received this message and I'm not sure it's legitimate. I haven't
clicked anything. [PASTE THE TEXT, WITHOUT PERSONAL DETAILS]
What are the warning signs, if any? How can I verify it safely without
using any of the contact details in the message?
~~~

Then verify through official contact details you look up yourself.

## Using AI ethically

A few principles keep you on solid ground:

- **Be honest about AI help when it matters.** If your school, employer, clients or publisher have rules about AI, follow them. When people reasonably expect the work to be personally yours, tell them, or do it yourself.
- **Stay accountable.** If you send it, you own it. "The AI wrote that" doesn't excuse a mistake or an unkind message.
- **Watch for bias.** AI learned from human writing, including its stereotypes and blind spots. Take extra care when AI output affects people, like hiring, reviews or descriptions of others.
- **Respect creators.** Don't pass off someone else's work as your own, or use AI to copy content you don't have the rights to.
- **Don't deceive.** Never use AI to impersonate a real person or to create fake reviews, fake documents or misleading images.

## Healthy habits

- **Keep your own skills sharp.** Use AI to support your thinking, not replace it. Now and then, write, plan or work something out without it.
- **AI isn't a therapist or a friend.** It can be a helpful sounding board on a hard day, but it's no substitute for real people or professional support. If you're struggling, reach out to someone you trust or a mental health professional. In a crisis, contact your local emergency number or a crisis line.
- **Kids and AI.** If children in your life use AI, explore it together at first, talk about what it gets wrong, and agree on rules for privacy and schoolwork.

## Try it now

1. Revisit your assistant's training, memory and history settings. Has anything changed since you set them?
2. Agree on a code word with your family or closest people for any urgent call asking for money.
3. Write your own three-line AI rules: what you'll never share, when you'll mention AI help, and what you'll always verify.

## Common mistakes

- **Assuming deleted means gone everywhere.** Deleting a chat removes it from your history, but retention policies vary. Don't share what you'd regret.
- **Trusting a message because it's well written.** Polish is no longer proof of legitimacy.
- **Forgetting other people's privacy.** Their information isn't yours to share.

## Key takeaways

- Never share passwords, financial or ID numbers, health records or confidential data. Describe instead of pasting.
- Scams now use cloned voices, deepfakes and polished messages. Verify through channels you already trust.
- Be honest about AI help when it matters, and stay accountable for anything you send.
- Use AI to support your thinking and your relationships, not to replace them.
`,
};

const personalToolkit: SeedLesson = {
  slug: "your-personal-ai-toolkit",
  title: "Build Your Personal AI Toolkit",
  summary: "Pull everything together into a simple personal system: your assistant, your instructions, your go-to prompts and your checking routine.",
  durationMin: 12,
  content: md`
You've learned a lot of techniques. The risk now is the same as with any course: you finish, feel inspired for a week, then slowly drift back to old habits. The fix is to turn what you've learned into a small personal **toolkit**, a few things set up and saved so that using AI well becomes the easy default.

## The five parts of your toolkit

1. **Your assistant.** One main assistant you know well, plus a second for second opinions if you like.
2. **Your personal instructions.** The short "about me and how I like answers" text from Module 2.
3. **Your prompt library.** Eight to twelve saved prompts for the things you do most.
4. **Your workspaces.** One for each ongoing area of life or work, if your assistant supports them.
5. **Your safety routine.** What you never share, and your three-minute fact-check.

## Find your highest-value uses

Not everything needs AI. The best candidates pass three tests:

- **Is it language-heavy?** Writing, reading, explaining, planning or organizing.
- **Would a good first draft help?** If you'd otherwise start from a blank page, yes.
- **Can I check the result?** You should be able to tell whether the output is good.

Let AI help you find them:

~~~
Help me find my best uses for AI. Here's a typical week for me:
[WORK, HOME, ROUTINES, RECURRING TASKS AND THINGS I DREAD].
Identify the 5 tasks where AI could save me the most time or stress.
For each, explain how, and give me a ready-to-use prompt template with
[BRACKETS] for the details that change each time.
~~~

## Build your prompt library

Create or update your **"My AI Prompts"** note. A good library entry has:

- **A clear name** so you can find it fast, like "Weekly plan," "Reply helper" or "Explain this document."
- **The prompt itself**, with [BRACKETS] for anything that changes.
- **A note** on any follow-up that usually helps.

Here's a starter library drawn from this course. Pick the ones that fit your life:

| Area | Prompts to save |
|---|---|
| Messages | Reply helper; "How will this come across?" |
| Planning | Weekly plan; meal plan and grocery list |
| Learning | Explain it at my level; quiz me |
| Serious topics | Appointment prep; plain-English clause explainer |
| Writing | Edit for clarity and list the changes |
| Documents | Summary with a purpose and supporting quotes |
| Decisions | Weighted comparison; pre-mortem |
| Checking | List every factual claim |

Add the prompts from the free AI Starter Kit that suit you, and you'll have a library most people never get around to building.

## Make your templates better over time

Once a prompt works, improve it with AI:

~~~
Here's a prompt I use regularly: [PASTE PROMPT]. Here's what I usually
have to fix in the answers: [ISSUES]. Improve the prompt so I get better
results the first time. Keep it short and keep the [BRACKETS].
~~~

## Remove the friction

Small setup choices decide whether you actually use AI day to day:

- **Pin your assistant** to your phone's home screen and your browser's bookmarks bar.
- **Keep your prompt library one tap away** in the notes app you already open every day.
- **Use dictation** when typing out context feels like a chore.
- **Set up one workspace** for your biggest current project.

## Worked example: a toolkit on one page

Picture a freelance designer with two kids. Their toolkit: one main assistant on phone and laptop. Personal instructions that say "freelance designer, two kids, prefers short bullet-point answers, based in the US." A library of nine prompts covering client emails, quote follow-ups, the weekly plan, the meal plan, a homework explainer, invoice reminders, social captions, a decision helper and a fact-check. One workspace for their biggest client project. And a sticky note on the monitor: "Context in. Check specifics. Never paste passwords."

That's it. Simple enough to use daily, and powerful enough to save real time every week.

## Try it now

1. Run the "find my best uses" prompt and pick your top three.
2. Create or update your "My AI Prompts" note with at least **eight** prompts.
3. Review and refresh your personal instructions.
4. Write a one-line rule for safe use, and put it somewhere you'll see it.

## Common mistakes

- **Collecting prompts you never use.** A short library you use beats a huge one you don't.
- **Never updating.** When you notice you're fixing the same thing every time, improve the prompt.
- **Chasing every new tool.** New features are fun, but mastering one assistant beats dabbling in five.

## Key takeaways

- Your toolkit has five parts: assistant, personal instructions, prompt library, workspaces and safety routine.
- Focus AI on tasks that are language-heavy, benefit from a draft, and that you can check.
- Save prompts with [BRACKETS] and keep improving them.
- Remove friction so using AI well becomes your default.
`,
};

const thirtyDayPlan: SeedLesson = {
  slug: "your-30-day-ai-habit-plan",
  title: "Your 30-Day AI Habit Plan",
  summary: "A simple four-week plan, about ten minutes a day, to turn everything you've learned into a lasting habit.",
  durationMin: 10,
  content: md`
Knowing how to use AI and actually using it are two different things. The people who get the most from AI aren't necessarily the most technical. They're the ones who made it a habit. This final lesson gives you a 30-day plan to do exactly that, in about ten minutes a day.

## How to make it stick

Three simple principles make this plan work:

- **Attach it to something you already do.** "After my morning coffee, I'll use AI for one task." An existing routine is the best trigger for a new one.
- **Start small.** Ten minutes and one task. Small wins build momentum, and momentum builds the habit.
- **Make progress visible.** Keep a simple log: the date, the task, a rough guess at the time saved, and one thing you learned.

## Week 1: Daily wins (days 1-7)

**Goal:** use AI once a day for something real.

- **Day 1:** Draft a message you've been putting off.
- **Day 2:** Plan tomorrow from a brain dump of everything on your mind.
- **Day 3:** Get an explanation of something you've always wondered about, then have the AI quiz you.
- **Day 4:** Plan this week's dinners and grocery list.
- **Day 5:** Edit something you wrote for clarity, and ask what changed and why.
- **Day 6:** Summarize a long article or document with a clear purpose.
- **Day 7:** Review your log. Which task saved you the most time?

## Week 2: Build your system (days 8-14)

**Goal:** set up your toolkit so good habits take no effort.

- **Days 8-9:** Write or refine your personal instructions.
- **Days 10-11:** Save your five most useful prompts as templates.
- **Day 12:** Set up a workspace, or a briefing note, for one ongoing project.
- **Day 13:** Try voice or images for one real task.
- **Day 14:** Run the three-minute fact-check on an answer you're relying on.

## Week 3: Go deeper (days 15-21)

**Goal:** use AI for something bigger than a single task.

Pick **one meaningful project** to move forward with AI this week: planning a trip, preparing for an important conversation, learning a new skill or organizing a home project. Each day:

1. Spend ten minutes moving it forward with AI.
2. Try a technique you haven't used yet: the Socratic tutor, a pre-mortem, a weighted comparison or a self-critique.
3. Note what worked.

## Week 4: Refine and expand (days 22-30)

**Goal:** make AI a natural part of how you work and live.

- **Days 22-24:** Improve your three most-used templates with the "improve my prompt" technique.
- **Days 25-26:** Try AI in an area of your life you haven't used it for yet.
- **Days 27-28:** Teach someone else one thing you've learned. Teaching locks in your own skills.
- **Day 29:** Review your privacy settings and your never-share rules.
- **Day 30:** Reflect with the prompt below, and plan your next month.

~~~
Here's my log from 30 days of using AI: [PASTE YOUR LOG]
Help me reflect: which uses saved me the most time or stress, which
didn't help, and what patterns do you notice? Then suggest 3 new ways
to use AI next month, based on what has worked for me, each with a
prompt template.
~~~

## When you miss a day

You will, and that's fine. Don't restart the plan; pick up where you left off. Missing a day doesn't break a habit, but quitting does. If ten minutes feels like too much on a busy day, do a two-minute version: one message, or one quick question.

## Staying current without the overwhelm

AI tools change fast, with new features, new names and new models. You don't need to chase every announcement. The skills you've built in this course last: giving context, iterating, verifying and protecting your privacy work with any assistant, today and in the years ahead. When a new feature appears, ask your assistant to explain it, then try it on one real task. That's all it takes to keep up.

## Try it now

1. Choose your trigger: "After I [EXISTING HABIT], I'll use AI for one task."
2. Create your log in your notes app with four columns: date, task, time saved and lesson learned.
3. Put a reminder in your calendar for Day 30.
4. Do Day 1 today.

## Common mistakes

- **Waiting for the perfect use case.** Small everyday tasks build the habit. Start with a message.
- **All-or-nothing thinking.** A missed day is a pause, not a failure.
- **Only doing what's comfortable.** Each week, try one technique you haven't used yet.

## Key takeaways

- Tie AI to an existing routine, start with ten minutes a day, and log your wins.
- Week 1 builds the habit, Week 2 builds the system, Week 3 goes deeper and Week 4 refines.
- Missed days don't matter much. Consistency over time does.
- Your core skills (context, iteration, verification and privacy) work with any AI tool, now and in the future.

## You did it

Congratulations on finishing **AI Essentials**. You now have the skills, the toolkit and a plan to make AI genuinely useful in your everyday life. Mark this lesson complete to unlock your certificate of completion, and keep your toolkit close. Ready for the next step, whether that's AI for your business or hands-on help? [Explore our other courses](/courses).
`,
};

/* ------------------------------------------------------------------ */
/* Course                                                              */
/* ------------------------------------------------------------------ */

export const aiEssentials: SeedCourse = {
  slug: "ai-essentials",
  title: "AI Essentials: Use AI in Everyday Life",
  subtitle: "Go from curious to confident with AI assistants. 18 short, plain-English lessons, no tech background needed.",
  description: md`
AI assistants like Claude, ChatGPT and Gemini can draft your emails, plan your week, explain almost anything at your level and help you make better decisions. But only if you know how to talk to them, and when not to trust them.

**AI Essentials** is a friendly, practical course for complete beginners. In 18 short lessons you'll learn how AI actually works, the simple 5-part prompt behind great answers, and dozens of real uses for everyday life and work, from tricky messages and meal plans to learning, research and big decisions. You'll also build the safety habits that matter: what never to share, how to fact-check an answer in three minutes, and how to spot AI-powered scams.

Every lesson includes copy-paste prompts, a hands-on "Try it now" exercise and an AI tutor you can ask questions, so you're practicing from day one. Everything works with the free versions of the major AI assistants, and the skills carry over to whichever tool you use next.
`,
  audience: "life",
  level: "Beginner",
  priceCents: 4700,
  coverEmoji: "🌱",
  outcomes: [
    "Understand what AI is, how it works and why it sometimes makes things up",
    "Write prompts that get great answers the first time, and fix the ones that don't",
    "Use AI to write messages, plan, learn, research and make decisions",
    "Handle health, legal and money questions safely, and know when to see a professional",
    "Protect your privacy, fact-check answers and spot AI-powered scams",
    "Build a personal AI toolkit and a daily habit that lasts",
  ],
  includes: [
    "18 bite-size lessons (about 3 hours in total)",
    "60+ copy-paste prompts and templates",
    "Hands-on exercise in every lesson",
    "The 30-day AI habit plan",
    "AI tutor inside every lesson",
    "Lifetime access",
    "Certificate of completion",
  ],
  faqs: [
    {
      q: "Do I need any technical skills?",
      a: "None at all. If you can send an email or a text message, you can take this course. Everything is explained in plain English, step by step.",
    },
    {
      q: "Which AI assistant do I need?",
      a: "Any of the major assistants works, including Claude, ChatGPT, Gemini and Microsoft Copilot. The free versions are enough for every lesson, and lesson 3 walks you through choosing one and setting it up safely.",
    },
    {
      q: "Will this still be useful as AI tools change?",
      a: "Yes. Tools and features change quickly, so the course focuses on the skills that carry across all of them: giving good context, refining answers, verifying facts and protecting your privacy. Those work with any assistant, today and in the future.",
    },
    {
      q: "How long does it take?",
      a: "About three hours in total, in lessons of roughly ten minutes each. It's self-paced with lifetime access, so you can take a lesson a day or finish it over a weekend.",
    },
    {
      q: "Is it safe to use AI with my personal information?",
      a: "It can be, with the right habits, and the course teaches them. You'll learn which privacy settings to check, what never to share, and how to describe a situation so you get great help without oversharing.",
    },
    {
      q: "I run a business. Is this the right course for me?",
      a: "It's a great foundation for anyone, because it covers the core skills you'll use everywhere. If you want to put AI to work across your business, our AI for Business Owners course goes much deeper into marketing, sales, operations and customer service.",
    },
  ],
  modules: [
    { title: "Getting Started", lessons: [whatAiReallyIs, whyAiMakesThingsUp, setUpYourAssistant] },
    { title: "Prompting That Works", lessons: [fivePartPrompt, iterateAndFollowUp, giveAiYourContext] },
    { title: "AI for Everyday Life", lessons: [emailsAndMessages, planAnything, learnAnythingFaster, healthLegalMoney] },
    { title: "AI for Work & Productivity", lessons: [writingAndEditing, researchAndSummaries, decisionsAndBrainstorming, voiceAndImages] },
    { title: "Make It a Habit", lessons: [factCheck, safetyAndEthics, personalToolkit, thirtyDayPlan] },
  ],
};
