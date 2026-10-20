# Lesson 2: Map a Process into Steps

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 1 · Automation Foundations |
| **Length** | 5–7 min (~870 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Turn a fuzzy, in-your-head process into labeled step cards, with exceptions and a definition of good, that you can build an automation from.

## Before you record

- A blank document or note, ready to paste the step card template from the written lesson
- The workflow spec from Lesson 1 open, as an example of what you're mapping from
- The overdue invoice example table from the written lesson open for reference
- Optional: a short screen recording of yourself or a colleague doing a routine task, to show as an example of capturing the real process

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

You can't automate a process you can't describe. And most business processes live in someone's head, full of unwritten shortcuts and exceptions. You only find out about them when something breaks.

In this lesson you'll turn that fog into a clear, step-by-step map you can build from with confidence.

**[ON SCREEN TEXT: "Map a Process into Steps"]**

### 2. Capture how it really works · 0:20

**[ON CAMERA]**

Don't start from the official procedure. Start from what actually happens. The best source is the person who does the work today, even if that's you.

Ask them to do the task once while narrating out loud, or record a quick screen walkthrough. Then ask six questions.

**[ON SCREEN TEXT: "Trigger · Sources · Decisions · Outputs · Exceptions · Quality"]**

Ask what starts it, because that becomes your trigger. Ask where the information comes from, which gives you your data sources and context. Ask what decisions they make, and based on what, because those are your rules and judgment calls.

Then ask what they produce and where it goes: those are your outputs and actions. Ask what goes wrong and what they do then: those are your exceptions. And ask how they know it was done well, which becomes your quality bar and, later, your tests.

Write the answers in plain language, and resist the urge to design the automation yet.

**[ON SCREEN TEXT: "Be a reporter, not an architect"]**

### 3. Write step cards · 1:25

**[ON CAMERA]**

Next, break the process into steps of one action or decision each, and give every step a card. Here's what a card looks like.

**[SCREEN RECORDING]** Paste this template:

~~~
STEP 3:     Decide how urgent the request is
INPUT:      Email subject and body + customer's plan from the CRM
DONE BY:    Support lead (today)
TYPE:       Judgement
CRITERIA:   "Urgent" = service is down, a payment failed,
            or a repeat customer is clearly upset
OUTPUT:     Urgency: urgent / normal / low
GOES TO:    Step 4 (assign to the right person)
EXCEPTIONS: VIP accounts are always urgent
~~~

Each card says what goes in, who does it today, what type of step it is and the criteria behind the decision. Then the output, where it goes next and the exceptions. That's everything you'll need when you build.

Most processes come out at five to twelve cards. If you have thirty, you're mapping several processes at once, so split them. If you have two, you've probably skipped the decisions.

### 4. Label every step by type · 2:20

**[ON SCREEN TEXT: "Move · Rule · Calculate · Read · Write · Judge"]**

Now label each card with its type, because the type tells you how to automate it. Move steps copy data between apps or notify someone, so plain automation handles them. Rules are if-then decisions on clear values, so a filter or router does the job.

Calculate steps, like totals and dates, go to a formula or code step. Read steps, like extracting details from messy text or classifying, are where an AI step fits. Write steps, like drafting a reply or summary, are AI too, with human review at first.

And Judge steps, like refunds, pricing or sensitive calls, stay with a human. AI can prepare the information, but a person decides.

### 5. The most useful discovery · 3:10

**[ON CAMERA]**

Here's the most useful thing mapping reveals. Many "judgment" steps are really rules nobody has written down. Once you ask, "how exactly do you decide?", the answer is often surprisingly precise.

Something like: if it's more than thirty days overdue and we've already sent two reminders, I use the firm template. That's a rule. And rules beat AI on cost, speed and reliability.

### 6. Hunt down the exceptions · 3:35

**[ON CAMERA]**

Exceptions are where automations break, so go looking for them on purpose. For every step, ask, "what's the weird case?"

Maybe the email has no body, just an attachment. Maybe the form was filled in a different language, or the same person submitted twice in a minute.

**[ON SCREEN TEXT: "Handle it · Route it to a human · Ignore it deliberately (and log it)"]**

For each exception, decide one of three things. Handle it with a rule or an AI instruction, route it to a human, or ignore it deliberately and log it.

The common mistake is pretending the exception doesn't exist. Writing "route to human" is a perfectly good answer. Leaving it blank is not.

### 7. Define what good looks like · 4:15

**[ON CAMERA]**

Last, for each output, write two or three concrete statements of quality. For a support reply, that might be: the category matches what our support lead would choose. The reply addresses the customer's actual question in the first two sentences, and it makes no promises about refunds, credits or deadlines.

These statements become your review checklist in Module 2 and your test cases in Module 5. If you can't say what good looks like, neither you nor the AI can hit it.

**[B-ROLL: the overdue invoice example table from the written lesson]**

The written lesson walks through a full example, an overdue invoice chase. Out of six steps, only one needs AI: writing the reminder. That's typical, and it's good news, because a mostly deterministic workflow is cheaper, faster and easier to trust.

### 8. Build it · 5:10

**[ON CAMERA]**

For the Build it exercise in the written lesson, take the spec you wrote last time. Walk through the real process, or watch someone do it, and write a step card for every step.

Label each card with its type, and challenge every Judge label: could it be written as a rule? Then list at least three exceptions, decide how each will be handled, and write two or three statements of what good looks like for the final output.

### 9. Recap and what's next · 5:45

**[ON SCREEN TEXT: "Map it as it really happens"]**

Let's recap. Map how the work really happens, not how the manual says it happens. Write one step card per action or decision, with inputs, outputs and exceptions.

Label every step by type, and remember AI is for read and write. Many judgment calls turn out to be unwritten rules, so write them down and skip the AI. And define what good looks like now, because it becomes your checklist and your tests later.

**[ON CAMERA]**

In the next lesson, Choose What to Automate (and What Not To), you'll learn how to score your candidates and pick the right first automation. See you there.

## On-screen text

- Map a Process into Steps
- Trigger · Sources · Decisions · Outputs · Exceptions · Quality
- Be a reporter, not an architect
- Move · Rule · Calculate · Read · Write · Judge
- Handle it · Route it to a human · Ignore it deliberately (and log it)
- Map it as it really happens

## Lesson page description

Most processes live in someone's head, along with the shortcuts and exceptions that break automations. This video shows you how to capture the real process, write a step card for every action or decision, label each step by type, hunt down exceptions and define what good looks like before you build.
