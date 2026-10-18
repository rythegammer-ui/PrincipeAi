/**
 * The free lead magnet: "The AI Starter Kit". Rendered at /guide after opt-in (and teased on /free-guide).
 * OWNER: content (AI Essentials) feature.
 *
 * Rendering notes: `intro` is Markdown. Day steps, prompts and tips are plain text (prompts keep their line
 * breaks). Prompt titles must be unique within a category and category names unique overall (used as React keys
 * and anchors). The first prompt of the first category is shown as the public "Try one now" sample on /free-guide.
 */
export type StarterKit = {
  title: string;
  subtitle: string;
  intro: string;
  /** 7-day quick-start plan. */
  days: { day: number; title: string; goal: string; steps: string[]; prompt: string }[];
  /** Copy-paste prompt library grouped by category. */
  promptCategories: { category: string; description: string; prompts: { title: string; prompt: string }[] }[];
  /** Short safety / best-practice tips. */
  tips: string[];
};

/** Joins prompt lines with real line breaks, so copied prompts paste cleanly with no stray indentation. */
const lines = (...parts: string[]): string => parts.join("\n");

export const starterKit: StarterKit = {
  title: "The AI Starter Kit",
  subtitle: "50 copy-paste prompts + a 7-day plan to make AI genuinely useful in your life and work.",
  intro: [
    "Welcome! This kit is the quickest way to make AI genuinely useful in your everyday life, with no tech skills, jargon or paid tools required. Everything here works with the free versions of popular AI assistants like Claude, ChatGPT and Gemini.",
    "**How to use it:**",
    [
      "- **Start with the 7-day plan.** One small, practical win a day, about 10 minutes each. Each day builds on the last, so go in order.",
      "- **Dip into the prompt library whenever you need help.** Copy a prompt, replace everything in [BRACKETS] with your own details, and paste it into your AI assistant.",
      "- **Treat the first answer as a draft.** Follow up with \"shorter,\" \"friendlier,\" \"give me 3 options\" or \"what's missing?\" until it's right.",
      "- **Read the safety tips before you share anything personal.** They take two minutes and keep you, and your information, safe.",
    ].join("\n"),
    "Ready? Open your AI assistant and start with Day 1.",
  ].join("\n\n"),

  days: [
    {
      day: 1,
      title: "Meet your AI assistant",
      goal: "Set up a free AI assistant safely and have your first genuinely useful conversation.",
      steps: [
        "Go to the official website or app for an AI assistant such as Claude, ChatGPT or Gemini, and create a free account. Check the developer name if you download an app.",
        "Open the settings and find the privacy and data controls. Choose what you're comfortable with, including whether your chats can be used for training.",
        "Copy today's prompt, replace the part in [BRACKETS], and answer the questions it asks you.",
        "Pick one of its suggestions and try it before the day is over.",
      ],
      prompt: lines(
        "I'm new to AI assistants and I'd like you to help make my everyday life easier.",
        "A little about me: [YOUR ROLE OR SITUATION, E.G. \"NURSE AND PARENT OF TWO\"].",
        "Ask me 5 short questions about my routine, work and goals, one at a time.",
        "Then suggest 5 specific ways you could help me this week, one sentence each.",
      ),
    },
    {
      day: 2,
      title: "Learn the 5-part prompt",
      goal: "Turn vague requests into great answers with role, context, task, format and examples.",
      steps: [
        "Think of something you need help with this week: a message, a plan or a question.",
        "Ask for it in one short sentence and save the answer.",
        "Open a new chat and ask again using today's 5-part prompt.",
        "Compare the two answers side by side and notice which details made the biggest difference.",
      ],
      prompt: lines(
        "Act as [ROLE, E.G. \"AN EXPERIENCED PERSONAL ASSISTANT\"].",
        "Context: [WHO YOU ARE, THE SITUATION, AND LIMITS LIKE TIME OR BUDGET]",
        "Task: [EXACTLY WHAT YOU WANT DONE]",
        "Format: [E.G. \"A SHORT BULLET LIST\" OR \"AN EMAIL UNDER 120 WORDS\"]",
        "Here's an example of the style I like: [OPTIONAL EXAMPLE]",
        "If anything is unclear, ask me questions before you answer.",
      ),
    },
    {
      day: 3,
      title: "Clear a message you've been avoiding",
      goal: "Draft the reply you've been putting off, in your own voice, in minutes.",
      steps: [
        "Find a message you've been putting off answering. There's usually at least one.",
        "Jot down your main points in rough shorthand. Don't worry about the wording.",
        "Use today's prompt, then ask: \"How is this likely to come across?\"",
        "Edit the draft so it sounds like you, double-check names, dates and promises, and send it.",
      ],
      prompt: lines(
        "Here's a message I need to reply to: [PASTE THE MESSAGE, MINUS ANY PRIVATE DETAILS]",
        "My main points are: [YOUR POINTS, IN SHORTHAND]",
        "Draft a reply that is [WARM / POLITE BUT FIRM / BRIEF], under [NUMBER] words.",
        "Make it sound like a real person, not a template.",
      ),
    },
    {
      day: 4,
      title: "Plan something real",
      goal: "Let AI do the heavy lifting on your meals, your week or an upcoming trip.",
      steps: [
        "Choose one thing to plan: this week's meals, your schedule, or an upcoming trip or event.",
        "Write down at least four constraints first, such as budget, time, who's involved and preferences.",
        "Use today's prompt, then improve the plan with two follow-ups.",
        "Confirm prices, opening hours and bookings on official websites before you rely on them.",
      ],
      prompt: lines(
        "Help me plan [MEALS FOR THE WEEK / MY WEEK / A TRIP TO PLACE].",
        "My goal: [WHAT A GREAT RESULT LOOKS LIKE]",
        "Constraints: [BUDGET, TIME AVAILABLE, WHO'S INVOLVED, PREFERENCES, THINGS TO AVOID]",
        "Give me a clear day-by-day plan, then a checklist of everything I need to buy, book or prepare.",
        "If something won't realistically fit, tell me.",
      ),
    },
    {
      day: 5,
      title: "Learn something faster",
      goal: "Use AI as a patient tutor to finally understand a topic you've wondered about.",
      steps: [
        "Pick a topic you'd like to understand better, for work, home or pure curiosity.",
        "Use today's prompt and answer the quiz questions honestly, without looking anything up.",
        "Explain the topic back in your own words and ask the AI what you missed.",
      ],
      prompt: lines(
        "Teach me about [TOPIC]. My level: [COMPLETE BEGINNER / KNOW A LITTLE].",
        "Start with a simple explanation using an everyday analogy, then give me the 3 most important ideas.",
        "Then quiz me with 3 questions, one at a time. Wait for my answer each time, and give me a hint if I get it wrong.",
      ),
    },
    {
      day: 6,
      title: "Make a clearer decision",
      goal: "Weigh your options, spot blind spots and check the facts that matter.",
      steps: [
        "Pick a decision you're weighing, big or small.",
        "List what matters most to you, in order of importance.",
        "Use today's prompt, then ask for the strongest honest case against the option you prefer.",
        "Verify any important facts, prices or rules it mentions using official sources.",
      ],
      prompt: lines(
        "Help me decide between [OPTION A] and [OPTION B].",
        "What matters most to me, in order: [YOUR PRIORITIES]",
        "Compare the options in a simple table, scoring each 1-5 on my priorities with a one-line reason.",
        "Then tell me what the decision really hinges on, and what would have to be true for the other option to win.",
        "Be honest rather than agreeable.",
      ),
    },
    {
      day: 7,
      title: "Build your AI toolkit",
      goal: "Save your best prompts and teach your assistant about you, so the habit sticks.",
      steps: [
        "Create a note called \"My AI Prompts\" and save the prompts from this week that worked best for you.",
        "Use today's prompt to write short personal instructions, then add them to your assistant's settings, or save them to paste in when needed.",
        "Choose a daily trigger, such as \"after my morning coffee,\" for one small AI task a day.",
        "Pick a category from the prompt library below to explore next week.",
      ],
      prompt: lines(
        "Help me write short personal instructions for my AI assistant, under 120 words.",
        "About me: [ROLE, LIFE SITUATION, WHAT I USE AI FOR MOST]",
        "How I like answers: [E.G. \"SHORT, PLAIN ENGLISH, BULLET POINTS, ASK ME IF ANYTHING IS UNCLEAR\"]",
        "Leave out anything sensitive. Write it in the first person so I can paste it straight into my settings.",
      ),
    },
  ],

  promptCategories: [
    {
      category: "Writing & email",
      description: "Clear, kind, professional messages in a fraction of the time.",
      prompts: [
        {
          title: "Turn rough notes into a clear email",
          prompt: lines(
            "Turn these rough notes into a clear, friendly email to [RECIPIENT]:",
            "[YOUR NOTES OR BULLET POINTS]",
            "Keep it under [NUMBER] words, put the most important point first, and end with a clear next step.",
          ),
        },
        {
          title: "Reply to a tricky email",
          prompt: lines(
            "Here's an email I received: [PASTE EMAIL]",
            "I want to reply that [YOUR MAIN POINT].",
            "Draft a response that is [POLITE BUT FIRM / WARM / BRIEF], under [NUMBER] words. Don't overpromise or over-apologize.",
          ),
        },
        {
          title: "Say no gracefully",
          prompt: lines(
            "[WHO, E.G. A COLLEAGUE / A FRIEND] asked me to [REQUEST]. I need to say no because [REASON].",
            "Write a short, kind reply that declines clearly, doesn't over-apologize, and [OFFERS AN ALTERNATIVE / LEAVES THE DOOR OPEN].",
          ),
        },
        {
          title: "Check how a message will land",
          prompt: lines(
            "Here's a message I'm about to send to [WHO]: [PASTE DRAFT]",
            "How is it likely to come across? Point out anything that could sound rude, passive-aggressive, unclear or too casual.",
            "Then suggest a revised version that keeps my meaning.",
          ),
        },
        {
          title: "Write a complaint that gets results",
          prompt: lines(
            "Help me write a complaint to [COMPANY].",
            "What happened: [FACTS, DATES, ORDER OR REFERENCE NUMBER]",
            "What I want: [REFUND / REPLACEMENT / REPAIR / APOLOGY]",
            "Make it firm, factual and polite, with a clear request and a reasonable deadline. Under 200 words.",
          ),
        },
        {
          title: "A thank-you that feels personal",
          prompt: lines(
            "Write a thank-you message to [NAME OR RELATIONSHIP] for [WHAT THEY DID].",
            "Mention this specific detail: [DETAIL].",
            "Tone: [WARM / PLAYFUL / FORMAL]. Length: [TEXT MESSAGE / SHORT CARD / EMAIL]. Avoid clichés.",
          ),
        },
        {
          title: "Follow up without being pushy",
          prompt: lines(
            "I sent [WHAT, E.G. A PROPOSAL / AN INVOICE / A JOB APPLICATION] to [WHO] on [DATE] and haven't heard back.",
            "Write a short, friendly follow-up that gently reminds them, makes it easy to reply, and doesn't sound impatient. Under 80 words.",
          ),
        },
      ],
    },
    {
      category: "Planning & organizing",
      description: "Meals, weeks, trips and to-do lists that fit your real life.",
      prompts: [
        {
          title: "Plan my week",
          prompt: lines(
            "Here's everything on my plate this week: [TASKS, APPOINTMENTS, DEADLINES]",
            "Fixed commitments: [MEETINGS, SCHOOL RUNS, ETC.]. I have the most energy in the [MORNING / AFTERNOON / EVENING].",
            "Build a realistic day-by-day plan with buffer time. Tell me honestly what won't fit, and what I could drop, delay or delegate.",
          ),
        },
        {
          title: "Weekly meal plan and grocery list",
          prompt: lines(
            "Plan [NUMBER] dinners for [NUMBER] people.",
            "Dietary needs and dislikes: [DETAILS]. No more than [MINUTES] minutes of hands-on cooking each. Budget: [LOW / MEDIUM].",
            "Use up what I already have: [INGREDIENTS].",
            "Then give me one grocery list grouped by store section.",
          ),
        },
        {
          title: "Trip itinerary",
          prompt: lines(
            "Create a [NUMBER]-day itinerary for [DESTINATION] in [MONTH] for [WHO'S GOING].",
            "We enjoy [INTERESTS] and prefer a [RELAXED / BALANCED / PACKED] pace. Budget: [LEVEL].",
            "Group nearby sights together, include a rainy-day option each day, and flag anything that usually needs booking ahead.",
            "I'll confirm opening hours and prices myself.",
          ),
        },
        {
          title: "Turn chaos into a to-do list",
          prompt: lines(
            "Here's a brain dump of everything on my mind: [EVERYTHING, IN ANY ORDER]",
            "Organize it into a to-do list grouped by [WORK / HOME / ERRANDS]. Mark the 3 most important items, and point out anything I can do in under 5 minutes.",
          ),
        },
        {
          title: "Plan an event",
          prompt: lines(
            "Help me plan [EVENT, E.G. A 40TH BIRTHDAY DINNER] for [NUMBER] guests on [DATE].",
            "Budget: [AMOUNT]. Location: [HOME / TYPE OF VENUE]. The guest of honor loves [INTERESTS].",
            "Give me a timeline of what to do and when, from now until the day, a budget breakdown, and 5 theme or activity ideas.",
          ),
        },
        {
          title: "Simple monthly budget",
          prompt: lines(
            "Here are my approximate monthly costs: [CATEGORIES AND ROUNDED AMOUNTS]",
            "My take-home pay is about [AMOUNT], and I want to save [AMOUNT] a month for [GOAL].",
            "Sort these into needs, wants and savings, suggest 3 realistic places to cut, and show a simple budget table. Show your math.",
          ),
        },
      ],
    },
    {
      category: "Learning & skills",
      description: "A patient tutor for any subject, at exactly your level.",
      prompts: [
        {
          title: "Explain it simply",
          prompt: lines(
            "Explain [TOPIC] to me like I'm a smart beginner.",
            "Start with the big picture in 3 sentences, use an everyday analogy, then cover the 3 key ideas I need to understand first.",
            "Avoid jargon, or explain it when you use it.",
          ),
        },
        {
          title: "Quiz me",
          prompt: lines(
            "Quiz me on [TOPIC] at a [BEGINNER / INTERMEDIATE] level.",
            "Ask 5 questions, one at a time, and wait for my answer each time.",
            "If I'm wrong, give me a hint before the answer. At the end, tell me what to review.",
          ),
        },
        {
          title: "Check my understanding",
          prompt: lines(
            "I'm going to explain [TOPIC] in my own words: [YOUR EXPLANATION]",
            "Tell me what I got right, what I got wrong or left out, and ask me one question that tests whether I truly understand it.",
          ),
        },
        {
          title: "Build a learning plan",
          prompt: lines(
            "I want to learn [SKILL] well enough to [SPECIFIC GOAL] within [TIMEFRAME].",
            "I can practice for [TIME] a week, and I already know [WHAT YOU KNOW].",
            "Create a week-by-week plan with what to learn, how to practice and a simple way to measure my progress.",
          ),
        },
        {
          title: "Practice a new language",
          prompt: lines(
            "Let's practice [LANGUAGE]. My level: [BEGINNER / INTERMEDIATE].",
            "Chat with me casually about [TOPIC], using short messages.",
            "After each of my replies, briefly correct my mistakes and show the corrected sentence, then continue the conversation.",
          ),
        },
        {
          title: "Socratic tutor",
          prompt: lines(
            "Act as a Socratic tutor helping me understand [TOPIC OR PROBLEM].",
            "Don't give me the answer. Ask me guiding questions, one at a time, that help me work it out myself.",
            "If I'm stuck twice in a row, give me a small hint.",
          ),
        },
      ],
    },
    {
      category: "Research & decisions",
      description: "Summarize, compare and think clearly before you commit.",
      prompts: [
        {
          title: "Summarize with a purpose",
          prompt: lines(
            "Summarize the text below for [WHO IT'S FOR]. I need to know [YOUR PURPOSE].",
            "Give me the 3-5 key points in plain English, any actions or deadlines, and anything easy to miss.",
            "Include a short supporting quote from the text for each key point.",
            "[PASTE TEXT]",
          ),
        },
        {
          title: "Compare options side by side",
          prompt: lines(
            "Compare [OPTIONS, E.G. THESE 3 QUOTES / PLANS / PRODUCTS] in a table.",
            "Rows: [CRITERIA, E.G. PRICE, WHAT'S INCLUDED, CONTRACT LENGTH, CANCELLATION TERMS]",
            "Use only the information I've provided, and mark anything missing as \"not stated.\" Then list the questions I should ask each provider.",
            "[PASTE DETAILS]",
          ),
        },
        {
          title: "Weighted decision",
          prompt: lines(
            "Help me decide between [OPTION A] and [OPTION B].",
            "What matters most to me, in order: [PRIORITIES]",
            "Score each option 1-5 on each priority with a one-line reason, then tell me what the decision really hinges on.",
            "Be honest, not just agreeable.",
          ),
        },
        {
          title: "Pre-mortem",
          prompt: lines(
            "I'm planning to [DECISION OR PLAN].",
            "Imagine it's a year from now and it went badly. Give me the 5 most likely reasons why, and one thing I could do now to prevent each one.",
          ),
        },
        {
          title: "Devil's advocate",
          prompt: lines(
            "Here's what I'm leaning toward and why: [YOUR REASONING]",
            "Give me the strongest honest case against it. Don't soften it.",
            "Then tell me which of my reasons hold up best.",
          ),
        },
        {
          title: "Fact-check an answer",
          prompt: lines(
            "Here's an answer I got about [TOPIC]: [PASTE THE ANSWER]",
            "List every specific factual claim in it: names, numbers, dates, quotes, sources and rules.",
            "For each one, say how likely it is to be wrong or out of date (high / medium / low), and the best kind of source to verify it.",
          ),
        },
        {
          title: "Make sense of jargon",
          prompt: lines(
            "Here's a [CONTRACT CLAUSE / POLICY / LETTER] I don't fully understand, with personal details removed: [PASTE TEXT]",
            "I'm in [COUNTRY OR STATE]. Explain it in plain English, give one real-life example of what it could mean for me, and list the questions I should ask before agreeing to anything.",
          ),
        },
      ],
    },
    {
      category: "Work & career",
      description: "Meetings, job searches and everyday work tasks, handled faster.",
      prompts: [
        {
          title: "Meeting notes to action items",
          prompt: lines(
            "Here are notes from a meeting: [PASTE NOTES OR TRANSCRIPT]",
            "Pull out the decisions made, action items (who, what, by when), open questions, and anything discussed but not resolved.",
            "Keep it easy to skim.",
          ),
        },
        {
          title: "Tailor my resume to a job",
          prompt: lines(
            "Here's a job description: [PASTE JOB POST]",
            "Here's my resume summary and key experience, without contact details: [PASTE]",
            "Suggest how to tailor my resume for this role: which experience to highlight, which keywords to include, and 3 rewritten bullet points.",
            "Don't invent experience I don't have.",
          ),
        },
        {
          title: "Interview practice",
          prompt: lines(
            "Act as an interviewer for a [JOB TITLE] role at a [TYPE OF COMPANY].",
            "Ask me [NUMBER] realistic interview questions, one at a time.",
            "After each answer, give me brief feedback on what was strong and how to improve it.",
          ),
        },
        {
          title: "Prepare for a difficult conversation",
          prompt: lines(
            "I need to talk to [WHO, E.G. MY MANAGER / A COLLEAGUE] about [ISSUE].",
            "My goal is [OUTCOME], and my worry is [WHAT MIGHT GO WRONG].",
            "Help me plan a clear opening line, my 3 key points, how they might respond, and calm ways to handle each response.",
          ),
        },
        {
          title: "Write a clear status update",
          prompt: lines(
            "Turn these notes into a short status update for [AUDIENCE]: [NOTES]",
            "Structure it as what's done, what's next, and any blockers or decisions I need from them.",
            "Under 150 words, plain language, no buzzwords.",
          ),
        },
        {
          title: "Explain what I do",
          prompt: lines(
            "I work as [JOB OR ROLE], and day to day I [WHAT YOU DO, IN YOUR OWN WORDS].",
            "Write 3 ways I could describe my work: a one-liner for networking events, a two-sentence version for a bio, and a version a 10-year-old would understand.",
          ),
        },
      ],
    },
    {
      category: "Business & marketing",
      description: "Practical help for owners, freelancers and side hustles.",
      prompts: [
        {
          title: "Social media post ideas",
          prompt: lines(
            "I run [TYPE OF BUSINESS] for [TARGET CUSTOMERS].",
            "Give me 10 post ideas for [PLATFORM] that are genuinely helpful, not salesy, based on questions my customers often ask, such as: [EXAMPLE QUESTIONS]",
            "For each one, include an attention-grabbing first line.",
          ),
        },
        {
          title: "Product or service description",
          prompt: lines(
            "Write a description of [PRODUCT OR SERVICE] for [IDEAL CUSTOMER].",
            "Key features: [FEATURES]. The main problem it solves: [PROBLEM]. What makes it different: [DIFFERENCE].",
            "Give me a 2-sentence version and a 100-word version. Clear and benefit-focused, with no hype or exaggerated claims.",
          ),
        },
        {
          title: "Reply to a customer review",
          prompt: lines(
            "Here's a customer review of my business: [PASTE REVIEW]",
            "Write a warm, professional reply that thanks them, honestly addresses any specific concerns, and [INVITES THEM BACK / OFFERS TO RESOLVE IT PRIVATELY].",
            "Under 80 words, and not defensive.",
          ),
        },
        {
          title: "FAQ from customer questions",
          prompt: lines(
            "Here are questions customers often ask me: [LIST OF QUESTIONS]",
            "My business: [SHORT DESCRIPTION]. Key policies: [PRICING, HOURS, REFUNDS, ETC.]",
            "Write a clear, friendly FAQ with short answers. Flag any question where you'd need more information from me, rather than guessing.",
          ),
        },
        {
          title: "Understand my ideal customer",
          prompt: lines(
            "My business is [DESCRIPTION], and my best customers tend to be [WHAT YOU KNOW ABOUT THEM].",
            "Describe my ideal customer: their goals, frustrations, the questions they ask before buying, and what would make them trust me.",
            "Then suggest 3 ways to reach more people like them.",
          ),
        },
        {
          title: "Email newsletter draft",
          prompt: lines(
            "Draft a short email newsletter for customers of my [TYPE OF BUSINESS].",
            "This month's news: [UPDATES, OFFERS, TIPS]",
            "Tone: [FRIENDLY / PROFESSIONAL]. Include 3 subject line options, one useful tip and one clear call to action. Under 250 words.",
          ),
        },
      ],
    },
    {
      category: "Personal & home",
      description: "Everyday life admin, appointments, home projects and family routines.",
      prompts: [
        {
          title: "Prepare for a doctor's appointment",
          prompt: lines(
            "I have a doctor's appointment about [SYMPTOM OR CONDITION]. Help me prepare, but don't diagnose me.",
            "Organize my notes into a clear summary: [WHEN IT STARTED, HOW OFTEN, WHAT HELPS OR MAKES IT WORSE, CURRENT MEDICATIONS]",
            "Then suggest questions to ask, and explain any terms I might hear in plain English.",
          ),
        },
        {
          title: "Decode a confusing bill or letter",
          prompt: lines(
            "Here's a [BILL / LETTER / NOTICE] I received, with personal details removed: [PASTE TEXT]",
            "Explain in plain English what it's about, whether I need to do anything and by when, and anything that looks unusual.",
            "If it could be a scam, tell me how to check safely.",
          ),
        },
        {
          title: "Home project plan",
          prompt: lines(
            "I want to [HOME PROJECT, E.G. REPAINT THE BEDROOM / BUILD A RAISED GARDEN BED].",
            "My skill level: [BEGINNER / SOME DIY EXPERIENCE]. Budget: [AMOUNT]. Timing: [WHEN].",
            "Give me a step-by-step plan, a tools and materials list, safety tips, and signs that I should call a professional instead.",
          ),
        },
        {
          title: "Declutter plan",
          prompt: lines(
            "Help me declutter [ROOM OR AREA] in short sessions.",
            "The main problems are [E.G. TOO MANY CLOTHES / PAPER PILES / TOYS EVERYWHERE], and I can spend [MINUTES] a day.",
            "Give me a 7-day plan with one small task per day, and a simple rule for deciding what to keep, donate or toss.",
          ),
        },
        {
          title: "Thoughtful gift ideas",
          prompt: lines(
            "Suggest 10 gift ideas for [PERSON OR RELATIONSHIP], who is [AGE] and loves [INTERESTS].",
            "Budget: [AMOUNT]. Avoid: [THINGS THEY ALREADY HAVE OR DISLIKE].",
            "Mix practical, experience-based and sentimental ideas, with a one-line reason for each.",
          ),
        },
        {
          title: "Family routine or chore chart",
          prompt: lines(
            "Our household: [WHO LIVES HERE, INCLUDING KIDS' AGES]. Our biggest pain point: [E.G. CHAOTIC MORNINGS / CHORE ARGUMENTS].",
            "Design a simple [MORNING ROUTINE / WEEKLY CHORE CHART] that's fair, age-appropriate and realistic.",
            "Present it as a table we can print and stick on the fridge.",
          ),
        },
      ],
    },
    {
      category: "Creativity & fun",
      description: "Stories, speeches, names and new hobbies to play with.",
      prompts: [
        {
          title: "Personalized bedtime story",
          prompt: lines(
            "Write a [NUMBER]-minute bedtime story for a [AGE]-year-old who loves [INTERESTS].",
            "The main character is [NAME OR DESCRIPTION]. Weave in a gentle lesson about [THEME, E.G. KINDNESS / BRAVERY].",
            "Use simple words and end on a calm, cozy note.",
          ),
        },
        {
          title: "Brainstorm names",
          prompt: lines(
            "Brainstorm 20 name ideas for [WHAT YOU'RE NAMING: A PET / BUSINESS / PROJECT / TEAM].",
            "The vibe I want: [E.G. PLAYFUL / ELEGANT / BOLD]. It should suggest [IDEAS OR QUALITIES]. Avoid: [ANYTHING TO AVOID].",
            "Group them by style and mark your top 3.",
          ),
        },
        {
          title: "Write a toast or speech",
          prompt: lines(
            "Help me write a [NUMBER]-minute [TOAST / SPEECH] for [OCCASION].",
            "Key details, stories and qualities to include: [DETAILS]",
            "Tone: [HEARTFELT / FUNNY / BOTH]. Give me an outline first, then the full draft.",
            "It should sound natural spoken aloud, like me, not like a greeting card.",
          ),
        },
        {
          title: "Party games and activities",
          prompt: lines(
            "Suggest [NUMBER] games or activities for [EVENT] with [NUMBER] people aged [AGES].",
            "Setting: [INDOORS / OUTDOORS], with [TIME AVAILABLE]. Budget: [AMOUNT].",
            "For each one: how to play in 2-3 sentences, what's needed and how long it takes.",
          ),
        },
        {
          title: "Start a creative hobby",
          prompt: lines(
            "I want to try [HOBBY, E.G. WATERCOLOR / POETRY / WOODWORKING] as a complete beginner.",
            "Suggest 5 small starter projects that build skills step by step, what I need to get started on a [LOW / MEDIUM] budget, and common beginner mistakes to avoid.",
          ),
        },
        {
          title: "Poem or card message",
          prompt: lines(
            "Write a short [POEM / CARD MESSAGE] for [PERSON] for [OCCASION].",
            "Include these personal details: [2-3 DETAILS, MEMORIES OR INSIDE JOKES]",
            "Style: [RHYMING / FREE VERSE / SIMPLE AND SWEET]. No more than [NUMBER] lines.",
          ),
        },
      ],
    },
  ],

  tips: [
    "Give context, not just commands. Who it's for, what you're trying to achieve and any limits (time, budget, tone) turn a generic answer into a genuinely useful one.",
    "Treat the first answer as a draft. Follow up with \"shorter,\" \"more casual,\" \"give me 3 options\" or \"what's missing?\" until it's right.",
    "Never share passwords, full card or bank numbers, government ID numbers or detailed health records. Remove names and personal details before you paste anything.",
    "Check your assistant's privacy settings once: whether your chats can be used to train its models, what it remembers about you, and how to delete conversations.",
    "AI can sound confident and still be wrong. Double-check names, numbers, dates, quotes, links and anything you'll act on, using official or original sources.",
    "Use AI to understand health, legal and money topics and to prepare good questions, then make big decisions with a qualified professional. In an emergency, contact emergency services, not an AI.",
    "AI tends to agree with you. When you want a real second opinion, ask \"What are the weaknesses?\" or \"Make the strongest case against this.\"",
    "You're the author. Read everything before you send or publish it, keep it in your own voice, and follow any AI rules at your school or workplace.",
  ],
};
