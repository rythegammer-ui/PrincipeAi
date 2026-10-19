import type { SequenceTrigger } from "../schema";

/**
 * Default email automations, editable at /admin/sequences. Bodies are Markdown and support
 * placeholders: {{firstName}}, {{name}}, {{siteUrl}}, {{bookUrl}}, {{coursesUrl}},
 * {{assessmentUrl}}, {{guideUrl}}, {{loginUrl}}, {{businessName}}.
 *
 * `delayHours` is the wait after the previous email (or after enrollment for the first one).
 * Every example below is clearly hypothetical — never present invented clients or results.
 */
export type SeedSequence = {
  name: string;
  description: string;
  trigger: SequenceTrigger;
  steps: { delayHours: number; subject: string; body: string }[];
};

const SIGN_OFF = "Talk soon,\nThe {{businessName}} team";

export const seedSequences: SeedSequence[] = [
  /* ---------------------------------------------------------------- */
  /* Lead magnet: 6 emails over ~12 days                               */
  /* ---------------------------------------------------------------- */
  {
    name: "Free Guide Nurture",
    description: "Six emails over 12 days for everyone who downloads the AI Starter Kit: quick wins first, then the assessment, then a gentle offer.",
    trigger: "lead_magnet",
    steps: [
      {
        delayHours: 0,
        subject: "Your AI Starter Kit is here, {{firstName}}",
        body: `Hi {{firstName}},

Thanks for grabbing the AI Starter Kit. Here it is:

**[Open your AI Starter Kit]({{guideUrl}})**

Inside you'll find a 7-day quick-start plan and a library of copy-paste prompts for everyday life and work.

My one piece of advice: **don't read it all at once.** Open Day 1, follow the steps, and stop there. It takes about ten minutes, and you'll finish with something genuinely useful.

Over the next couple of weeks I'll send a few short emails with the ideas that make the biggest difference for beginners. Each one takes under three minutes to read.

If you have a question at any point, just hit reply. A real person reads every message.

${SIGN_OFF}`,
      },
      {
        delayHours: 24,
        subject: "Your first 10-minute AI win",
        body: `Hi {{firstName}},

Let's get you a quick win today. Open ChatGPT, Claude or Gemini (any of them works) and paste this:

> I'm going to paste my to-do list for this week. Group it into "must do", "should do" and "could drop". For each must-do, suggest the first small step. Ask me any questions you need first.
>
> [paste your list here]

Notice the last line: *ask me any questions you need first.* That one sentence turns AI from a guessing machine into a thinking partner. It will ask about deadlines and priorities, then give you a plan that actually fits your week.

Try it now. It takes two minutes.

Tomorrow's plan in your [Starter Kit]({{guideUrl}}) builds on exactly this.

${SIGN_OFF}`,
      },
      {
        delayHours: 48,
        subject: "The 3 prompting mistakes almost everyone makes",
        body: `Hi {{firstName}},

When people tell me AI "didn't work" for them, it's almost always one of these three things.

**1. Asking without context.**
"Write a marketing email" gets you something generic. "Write a friendly email to past customers of my bakery announcing our new Saturday hours" gets you something you can send. Tell AI who you are, who it's for and what good looks like.

**2. Taking the first answer.**
The first reply is a draft, not a verdict. Say "make it shorter", "more casual", or "give me three options". The magic is in the back-and-forth.

**3. Not checking the facts.**
AI writes confidently even when it's wrong. Use it freely for drafting, brainstorming and summarising, and double-check names, numbers and anything that matters.

Fix those three and you'll get better results than most people using AI today.

**Try it now:** pick any prompt from your [Starter Kit]({{guideUrl}}) and run it twice: once as written, once with two extra sentences about you and your goal. Compare the answers.

${SIGN_OFF}`,
      },
      {
        delayHours: 72,
        subject: "What AI looks like in a normal week",
        body: `Hi {{firstName}},

AI isn't one big thing you "adopt". It's dozens of small moments where it saves you ten minutes. Here's what that can look like in an ordinary week. These are illustrative examples, not anyone's real schedule.

**In your life**
- **Monday:** turn a fridge photo into three dinner ideas and a shopping list.
- **Wednesday:** draft a polite but firm email to your landlord about a repair.
- **Saturday:** plan a weekend trip with a budget, a rough schedule and a packing list.

**In your work or business**
- **Tuesday:** summarise a long email thread into decisions and next steps.
- **Thursday:** turn rough meeting notes into a clean follow-up email.
- **Friday:** draft a week of social posts from one idea you already had.

None of these need technical skills. They just need the habit of asking: *could AI do the first draft of this?*

This week, try one from each list. The [prompt library in your Starter Kit]({{guideUrl}}) has ready-to-use wording for most of them.

${SIGN_OFF}`,
      },
      {
        delayHours: 72,
        subject: "How ready are you for AI? (3-minute check)",
        body: `Hi {{firstName}},

You've had the Starter Kit for about a week. Want to know where you actually stand, and what to focus on next?

Our free **AI Readiness Assessment** takes about three minutes. You'll get:

- A readiness score and the tier you're in, from Explorer to Scaler
- Your strengths and the gaps holding you back
- A personalised action plan for the next 30 days

**[Take the free assessment]({{assessmentUrl}})**

It's the quickest way to stop wondering what to learn next and start on the thing that will help you most.

${SIGN_OFF}`,
      },
      {
        delayHours: 72,
        subject: "Your next step with AI",
        body: `Hi {{firstName}},

This is the last email in this series, so let me be direct about how we can help, if and when you want it.

**If you'd like to learn at your own pace**, our [courses]({{coursesUrl}}) take you from the basics to building real workflows, with an AI tutor inside every lesson to answer your questions as you go.

**If you'd rather talk it through**, book a [free 30-minute strategy call]({{bookUrl}}). We'll look at where your time goes, pick the two or three places AI will help most, and map out how to get there. No pressure and no hard sell.

And if neither is right for you yet, that's completely fine. Keep working through the Starter Kit. A little practice each week compounds quickly.

Thanks for reading. I hope these emails have been useful.

${SIGN_OFF}`,
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Assessment: 4 emails                                              */
  /* ---------------------------------------------------------------- */
  {
    name: "Assessment Follow-up",
    description: "Four emails after the AI readiness assessment: make sense of the results, build the habit, weigh DIY vs help, then invite a call.",
    trigger: "quiz_completed",
    steps: [
      {
        delayHours: 20,
        subject: "What your AI readiness tier really means",
        body: `Hi {{firstName}},

Yesterday you got your AI readiness score and a personal plan. Here's how to read it, and how to actually use it.

**The four tiers, in plain English**
- **Explorer:** you're at the start. Your goal is a few reliable everyday uses, not mastery.
- **Experimenter:** you've tried AI but it isn't a habit yet. Your goal is consistency.
- **Implementer:** AI is part of your routine. Your goal is repeatable workflows.
- **Scaler:** you're confident. Your goal is systems and automations that run without you.

There's no "bad" tier. Each one simply points to a different next step.

**How to use your plan**
1. Open the results email we sent and re-read the first action in your plan.
2. Put 20 minutes on your calendar this week to do just that one thing.
3. Ignore the rest until it's done.

One finished action beats five good intentions.

Can't find your results email? [Retake the assessment]({{assessmentUrl}}) any time. It takes three minutes and gives you a fresh plan.

${SIGN_OFF}`,
      },
      {
        delayHours: 48,
        subject: "The one AI habit that compounds",
        body: `Hi {{firstName}},

If I could give you just one habit, it would be this: **start every task with "could AI do the first draft?"**

Emails, reports, proposals, lesson plans, meal plans, job applications. Ask the question first, every time.

Here's why it compounds. Each time you ask, you learn what AI is good at and where it needs your judgement. After a few weeks, you've built an instinct most people don't have. After a few months, you're working at a different speed.

Try a simple experiment this week: keep a tally of every time you ask the question. Aim for three a day. On Friday, look back at what it saved you.

Not sure what to ask? The free [AI Starter Kit]({{siteUrl}}free-guide) has copy-paste prompts for the most common tasks.

${SIGN_OFF}`,
      },
      {
        delayHours: 72,
        subject: "DIY or get help? An honest look",
        body: `Hi {{firstName}},

A fair question I hear a lot: "Can't I just figure all this out myself?"

Honestly? Often, yes. Here's how I'd think about it.

**Doing it yourself makes sense when…**
- you enjoy tinkering and have a few spare hours each week
- your goals are personal productivity and everyday tasks
- you're happy to learn by trial and error

**Getting help makes sense when…**
- your time is worth more than the cost of a shortcut
- you want AI working across a business or team, not just for you
- you've started before and stalled

There's also a middle path: a structured course you work through at your own pace, with an AI tutor on hand when you get stuck. [See how our courses work]({{coursesUrl}}).

Whichever you choose, the important part is choosing, and then giving it a few focused weeks.

${SIGN_OFF}`,
      },
      {
        delayHours: 72,
        subject: "Let's turn your AI plan into results",
        body: `Hi {{firstName}},

You've had your AI plan for about a week. If you'd like help putting it into action, I'd love to talk.

**[Book a free 30-minute strategy call]({{bookUrl}})**

On the call we'll:
- look at your assessment results together
- pick the two or three changes that will save you the most time
- map out exactly how to make them, with or without us

Prefer to learn on your own? Our [courses]({{coursesUrl}}) follow the same step-by-step path, with an AI tutor in every lesson.

${SIGN_OFF}`,
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Call booked: 2 emails                                             */
  /* ---------------------------------------------------------------- */
  {
    name: "Call Prep",
    description: "Two short emails after someone books a call, so they arrive prepared and you both get more from the time.",
    trigger: "call_booked",
    steps: [
      {
        delayHours: 1,
        subject: "How to get the most out of our call",
        body: `Hi {{firstName}},

Thanks for booking a call. Your confirmation email has the time and the link to join. This one is about making the time count.

**A quick prep checklist (5 minutes)**
- [ ] Jot down the one task that eats the most of your week
- [ ] Note what you've already tried with AI, even if the answer is "nothing yet"
- [ ] Decide what a great outcome from this call would be for you
- [ ] Test your camera and microphone, or plan to join a few minutes early

That's it. No slides, no homework, and no technical knowledge needed.

**Want a head start?** If you haven't already, take the free [3-minute AI assessment]({{assessmentUrl}}). Your results give us a useful starting point for the conversation.

Need to change the time? Use the link in your confirmation email. It only takes a moment.

${SIGN_OFF}`,
      },
      {
        delayHours: 24,
        subject: "Bring these 3 things to our call",
        body: `Hi {{firstName}},

Looking forward to speaking with you. To make the conversation as practical as possible, please bring:

1. **One real example.** An email, document or task you'd love to hand off to AI. Real beats hypothetical every time.
2. **A list of the tools you use daily.** Email, calendar, spreadsheets, CRM, anything. It helps us spot what AI can connect to.
3. **Your biggest question about AI.** However basic it feels, it's probably the most useful thing we'll cover.

**Want to share your example ahead of time?** Just reply to this email and attach it. We'll take a look before we talk.

If our call has already happened, thank you for your time. Reply with any follow-up questions.

${SIGN_OFF}`,
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Purchase: 3 emails                                                */
  /* ---------------------------------------------------------------- */
  {
    name: "New Student Onboarding",
    description: "Three emails after a purchase: how to log in and use the AI tutor, a day-3 check-in with a tip, and a day-7 feedback request.",
    trigger: "purchase",
    steps: [
      {
        delayHours: 1,
        subject: "Welcome! Here's how to get started",
        body: `Hi {{firstName}},

Welcome, and thank you for joining us. Here's everything you need to get going.

**1. Log in (no password needed)**
Go to the [student login]({{loginUrl}}) and enter the email you used at checkout. We'll email you a secure sign-in link. Click it and you're in.

**2. Start with lesson one**
Lessons are short and practical. Each one ends with something to try straight away.

**3. Use your AI tutor**
Every lesson has a built-in AI tutor. Ask it to explain something another way, give you an example for your own situation, or check your work. It's there 24/7, so use it as often as you like.

If anything isn't working, just reply to this email and we'll sort it out.

${SIGN_OFF}`,
      },
      {
        delayHours: 71,
        subject: "Day 3 check-in (plus a tip that saves hours)",
        body: `Hi {{firstName}},

Quick check-in: have you had a chance to start your first lessons?

Here's the tip that helps students more than any other: **save your best prompts.**

Every time a prompt gives you a great result, copy it into a note called "My prompts" with a one-line description. Within a few weeks you'll have a personal library you can reuse in seconds, and that's where the real time savings come from.

Ready to continue? [Pick up where you left off]({{loginUrl}}).

${SIGN_OFF}`,
      },
      {
        delayHours: 96,
        subject: "One week in: how's it going?",
        body: `Hi {{firstName}},

You've been with us for a week. I'd genuinely love to know how it's going.

**Just hit reply and tell me:**
- What's been the most useful thing so far?
- What's still confusing or missing?

I read every reply, and your answers directly shape how we improve the course.

**Your next step:** finish the next module, then pick one workflow from it to use every day this week. If you'd like hands-on help applying what you're learning to your own work, you can always [book a call]({{bookUrl}}).

${SIGN_OFF}`,
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* Contact form: auto-reply                                          */
  /* ---------------------------------------------------------------- */
  {
    name: "Contact Auto-reply",
    description: "Instant confirmation for contact-form messages, with helpful links while they wait for a personal reply.",
    trigger: "contact_form",
    steps: [
      {
        delayHours: 0,
        subject: "We got your message, {{firstName}}",
        body: `Hi {{firstName}},

Thanks for getting in touch. This is a quick note to confirm your message arrived safely. We'll reply personally **within one business day**.

In the meantime, these might help:

- **[Take the free AI assessment]({{assessmentUrl}})**: three minutes to a personal AI action plan.
- **[Get the free AI Starter Kit]({{siteUrl}}free-guide)**: copy-paste prompts and a 7-day plan.
- **[Browse our courses]({{coursesUrl}})**: learn at your own pace.

If it's urgent, you can also [book a time to talk]({{bookUrl}}).

${SIGN_OFF}`,
      },
    ],
  },
];
