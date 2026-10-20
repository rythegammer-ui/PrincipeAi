# Lesson 1: Anatomy of an AI Workflow

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 1 · Automation Foundations |
| **Length** | 5–7 min (~890 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Name the five parts of every reliable AI workflow and write a one-page spec, with a fallback and an owner, before you build anything.

## Before you record

- A blank document or note, ready to paste the spec template from the written lesson
- Your automation platform (Zapier, Make or n8n) open on an empty workflow, for cutaway shots
- The worked example from the written lesson (the website enquiry workflow) open for reference
- One repetitive, text-heavy task from your own week in mind, in case you want to fill in a line of the spec live

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

Most AI automations that disappoint fail for the same reason. Someone dropped an AI step between two apps and hoped for the best. It looks great in a demo, and then one odd input slips through and nobody notices.

The automations that run quietly for months aren't magic. They share a simple anatomy. Once you can see it, you can design, debug and explain any AI workflow, whether it lives in Zapier, Make, n8n or a few lines of code.

**[ON SCREEN TEXT: "Anatomy of an AI Workflow"]**

### 2. The five parts · 0:35

**[ON SCREEN TEXT: "Trigger → Context → Model → Action → Check"]**

Here are the five parts. First, the trigger: the event that starts a run, like a form being submitted, an email arriving or Monday at 7am. Second, context: everything the model needs to do this particular job well.

That's the incoming data, plus reference material such as your services, your tone of voice or your policies. Third, the model step, where clear instructions and context go in and one specific, well-defined output comes out. Fourth, the action: a CRM record gets updated, a draft gets saved or a message is posted to your team.

And fifth, the check. How do you know it worked, and what happens when it didn't? Read the whole thing as a chain: trigger, context, model, action, check.

### 3. Checks wrap around the action · 1:25

**[ON CAMERA]**

Here's the subtle bit. The check doesn't just sit at the end; it wraps around the action. Before you act, you check the model's output: is it valid, and is it sensible?

After you act, you check the result. Did the CRM really accept the record? Because a workflow without checks doesn't fail less often.

It fails silently.

**[B-ROLL: an automation canvas with a short chain of steps]**

Let's make it concrete with the example from the written lesson. A website enquiry form is submitted. The context is the name, company and message from the form, plus a short description of your services and your ideal client.

The model classifies the enquiry as hot, warm, cold or spam, gives a one-sentence reason and drafts a two-sentence reply, all returned as JSON. The action creates or updates the contact in your CRM, tags it with the category and saves the reply as an email draft. The check asks two things: is the output valid JSON with an allowed category, and did the CRM accept the record?

Without that check, one malformed AI response quietly creates a junk CRM record. With it, you get a review item and an alert. Same failure, very different outcome.

### 4. The AI sandwich · 2:50

**[ON SCREEN TEXT: "Deterministic step → one AI step → deterministic step"]**

So where does AI actually belong? Only in the model step. Triggers, lookups, arithmetic, date handling, routing on known values and the actions themselves should be plain, deterministic steps that behave the same way every time.

AI shines at language and judgment: reading messy text, classifying, extracting details, summarizing and drafting. It's the wrong tool for anything a filter or formula can do exactly. If a clear number decides the route, use a filter, not a model.

A helpful picture is the AI sandwich: deterministic steps on both sides, one focused AI step in the middle. Bigger workflows can stack several sandwiches. But each AI step should have exactly one job.

**[ON SCREEN TEXT: "One AI step, one job"]**

### 5. The most common mistake · 3:35

**[ON CAMERA]**

The most common mistake is asking a single prompt to classify, extract, decide and write all at once. Quality drops, and when something goes wrong, debugging becomes guesswork. Give each AI step one job instead.

The anatomy also tells you where to look when a workflow misbehaves. Generic or off-brand output usually means weak context. Output that varies wildly between runs points to the model step, and runs that fire twice point to the trigger.

Junk records downstream mean you need to validate before acting. And if failures go unnoticed, strengthen the check after: log every run and alert a named owner.

### 6. Write the spec first · 4:20

**[ON CAMERA]**

Which brings us to the habit that saves the most pain. Before you open any automation tool, write a one-page spec. It takes ten minutes and saves hours of rework.

**[SCREEN RECORDING]** Paste this template:

~~~
WORKFLOW:   New enquiry triage
GOAL:       Every enquiry is categorized and has a draft reply within 5 minutes
TRIGGER:    Website enquiry form submitted
CONTEXT:    Form fields + "our services" summary + ideal client profile
MODEL STEP: Classify (hot / warm / cold / spam), give a reason, draft a reply.
            Output: JSON
ACTIONS:    Create or update CRM contact, tag with category, save reply as draft
CHECKS:     Before: JSON valid and category allowed
            After: CRM confirms the record was saved
FALLBACK:   Anything that fails a check goes to the "Needs review" list
OWNER:      Sales lead, alerted by email on any failure
~~~

Read it top to bottom and you'll find all five parts. Notice the model step names its output format, and the checks cover both before and after the action.

**[ON SCREEN TEXT: "What happens when this breaks? Who finds out?"]**

Now look at the last two lines, fallback and owner. Every workflow has to answer two questions up front: what happens when this breaks, and who finds out? If you can't answer them, you're not ready to build.

### 7. Build it · 5:15

**[ON CAMERA]**

Now it's your turn, with the Build it exercise in the written lesson. Pick one repetitive task from your week that involves reading or writing text. Copy the spec template and fill in every line for that task.

Then go through the five parts one by one. A blank or vague line is exactly where your build will hurt. Look hard at the model step, and if you can't describe its job in one sentence with a clearly defined output, split it into two AI steps.

Save the spec when you're done. You'll keep building on it.

### 8. Recap and what's next · 6:00

**[ON SCREEN TEXT: "Trigger · Context · Model · Action · Check"]**

Let's recap. Every AI workflow has five parts: trigger, context, model, action and check. Checks wrap around the action, so you validate the output before acting and confirm success afterwards.

Use AI for the language and judgment step only, and keep everything else deterministic. And write a one-page spec, including a fallback and an owner, before you build anything.

**[ON CAMERA]**

In the next lesson, Map a Process into Steps, you'll take the process behind your spec and turn it into step cards you can actually build from. See you there.

## On-screen text

- Anatomy of an AI Workflow
- Trigger → Context → Model → Action → Check
- Deterministic step → one AI step → deterministic step
- One AI step, one job
- What happens when this breaks? Who finds out?
- Trigger · Context · Model · Action · Check

## Lesson page description

Every reliable AI automation has the same five parts: trigger, context, model, action and check. In this video you'll see how checks wrap around the action, why AI belongs in one focused step, and how to write a one-page spec with a fallback and an owner before you build.
