# Lesson 18: Document, Maintain and Your 30-Day Build Plan

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 5 · Ship It |
| **Length** | 5–7 min (~770 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Write a one-page runbook, change prompts safely, set a light maintenance rhythm and leave the course with a dated 30-day plan to ship your first production automation.

## Before you record

- A blank document for the runbook template, and your calendar open if you'd like to show scheduling the reviews
- The runbook template and the ready-to-launch checklist from the written lesson, ready to paste
- The 30-day build plan from the written lesson, ready to show on screen

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

The automations that last are the ones somebody understands. When the builder is on vacation and something breaks, a one-page runbook is the difference between a five-minute fix and a lost week.

In this final lesson, you'll document what you've built and set up a light maintenance rhythm. And you'll leave with a 30-day plan to put everything from this course into production.

### 2. The one-page runbook · 0:25

**[SCREEN RECORDING]** Paste this template:

~~~
AUTOMATION:      Inbox triage (v1.3)
OWNER:           [name]   BACKUP: [name]
PURPOSE:         Categorize support email; draft replies for 4 categories
WHERE IT LIVES:  [link to the workflow]
TRIGGER:         New email in the support inbox (excludes auto-replies)
STEPS:           Pre-filter > classify > route > draft > save draft + note
PROMPTS:         [link to prompt document], current version 1.3
MODEL + EFFORT:  [model]; low effort to classify, medium to draft
CONNECTIONS:     Email (read, create drafts); CRM (read only)
DATA HANDLED:    Customer name, email address, message. No payment data.
CHECKS:          JSON validation, category allowlist, review queue rules
ON FAILURE:      Retries 3 times, then alerts [channel]
HOW TO PAUSE:    Turn off the workflow at [link]; emails stay untouched
GOLDEN SET:      [link]; last run [date]; score [x%]
KNOWN LIMITS:    Doesn't handle emails that are only an attachment
REVIEW RHYTHM:   Weekly log review; monthly golden set rerun
~~~

Write one of these for every automation that runs in production. On one page, it says who owns it, what it does, where it lives, what it connects to, what data it handles and what happens when it fails. It also records the prompt version, the golden set score and the known limits.

The "how to pause" line matters more than it looks. Anyone on the team should be able to stop an automation safely in under a minute.

### 3. Change prompts safely · 1:15

**[ON SCREEN TEXT: "Versioned · Tested · Reversible"]**

Treat prompts like code: versioned, tested and reversible. Write down the change and why you're making it, then save it as a new version and keep the old one.

Run the golden set and compare against the previous score. Ship only if it meets your thresholds and every "must not" rule passes, then watch the run log closely for a week.

If anything looks worse, roll back to the previous version first and investigate second.

### 4. A simple maintenance rhythm · 1:50

**[ON SCREEN TEXT: "Weekly 15 min · Monthly 45 min · Quarterly 1–2 hours"]**

Maintenance doesn't need to be heavy. Weekly, spend about 15 minutes on the run log, failures, the review queue and five random runs. Monthly, take about 45 minutes to rerun the golden set, add new cases and check costs and connections.

Quarterly, set aside an hour or two for bigger questions. Is it still needed, has the process changed and are newer models or features worth testing? And whenever an app or process changes, check every automation that touches it.

Also decide when to retire an automation: when volume has dropped, the process has changed or a better tool now does the job. Switch it off, archive the runbook and remove its keys and connections.

### 5. Your 30-day build plan · 2:35

**[ON SCREEN TEXT: "Week 1 Choose and design · Week 2 Build · Week 3 Harden and launch · Week 4 Measure and extend"]**

Now let's put it all together. In week one, choose and design. Score ten candidate tasks and pick one, map the process into step cards, write the workflow spec with a fallback and an owner and collect 20 real examples with their expected results.

In week two, build version one. Build the flow in test mode against test data, add structured output and validation and add retries, a duplicate guard and a review queue. Then run the golden set and improve the prompt until you hit your thresholds.

In week three, harden it and launch in review mode. Work through the security checklist, add the run log and alerts, write the runbook and go live at the draft or review level, reviewing every output.

In week four, measure and extend. Hold your first weekly reviews, compare edit rate and time spent with your baseline and promote the automation one autonomy level only if the evidence supports it. Then start your second automation from one of the blueprints, or fill in an Agent Design Canvas for a small agent pilot.

### 6. Ready to launch · 3:55

**[SCREEN RECORDING]** Paste this checklist:

~~~
[ ] Spec, step cards and runbook written; owner and backup named
[ ] Golden set passes thresholds; all "must not" rules pass
[ ] Raw input saved before the AI step; duplicate guard in place
[ ] Validation, retries, fallbacks and review queue tested by breaking them
[ ] Run log and alerts working; first weekly review scheduled
[ ] Security checklist complete; keys stored safely with spending limits
[ ] Everyone affected knows what the automation does and how to pause it
~~~

Before you go live, this checklist is your final gate. Notice that validation, retries, fallbacks and the review queue are tested by breaking them on purpose. And look at the last line: everyone affected knows what the automation does and how to pause it.

### 7. Build it · 4:30

**[ON CAMERA]**

Your last Build it, from the written lesson, has three steps. Write a runbook for the automation you've been building through this course, and put the weekly, monthly and quarterly reviews in your calendar now.

Then copy the 30-day plan, put real dates against each week and start Week 1 today.

### 8. You made it · 4:50

**[ON CAMERA]**

Congratulations, you've finished the course. You started with the anatomy of a single AI workflow, learned to map a process and choose what's worth automating, then connected your apps with structured outputs, error handling and human review.

You built blueprints for leads, content, support and reporting. You learned what an agent really is and how to give it good tools, the right memory and firm guardrails, then how to ship safely with golden tests, monitoring, security and a runbook.

From here, keep a running backlog of automation ideas, scored with the table from the lesson on choosing what to automate, and work through it one at a time. Share what you build with your team, including what went wrong, because that builds the trust bigger projects need. Ship one automation well in 30 days, then repeat, because momentum beats ambition.

**[PAUSE]**

Thank you for building along with me through this course. Put your dates on that plan, and good luck with Week 1.

**[ON SCREEN TEXT: "Ship one well. Then repeat."]**

## On-screen text

- Versioned · Tested · Reversible
- Weekly 15 min · Monthly 45 min · Quarterly 1–2 hours
- Week 1 Choose and design · Week 2 Build · Week 3 Harden and launch · Week 4 Measure and extend
- Ship one well. Then repeat.

## Lesson page description

The automations that last are the ones somebody understands. In this final lesson, you'll write a one-page runbook, learn a safe way to change prompts, set a light weekly, monthly and quarterly maintenance rhythm and leave with a week-by-week plan to ship your first production automation in 30 days.
