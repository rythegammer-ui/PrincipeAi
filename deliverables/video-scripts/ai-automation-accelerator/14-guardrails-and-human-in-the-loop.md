# Lesson 14: Guardrails, Permissions and Human-in-the-Loop

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 4 · AI Agents |
| **Length** | 5–7 min (~820 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Place every agent tool on the permission ladder, layer guardrails from input to oversight, write approval requests people can act on in seconds and red-team your design before launch.

## Before you record

- Your Agent Design Canvas, with the limits and approval boxes still empty
- A list of an example agent's tools, ready to place on the permission ladder
- The approval request template from the written lesson, ready to paste
- The red-team checklist from the written lesson, for reference while you talk through it

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

Giving an agent tools is giving it power. Guardrails decide how much power it has, in which situations and who signs off.

Good guardrails make an agent safe. Great guardrails make it safe and still useful, because an agent that needs approval for everything just becomes a slower way to do the work yourself.

### 2. The permission ladder · 0:25

**[ON SCREEN TEXT: "0 Read · 1 Draft · 2 Reversible · 3 External · 4 Humans only"]**

Start by classifying every tool by what it can affect. Level zero is reading internal data, like searching the CRM or checking a calendar, and the default is to allow it. Level one is drafting, like creating an email draft or proposing meeting times: allowed, but a human sends.

Level two is a reversible internal change, such as adding a tag, creating a task or updating a note. You allow it, log it and spot-check it. Level three is anything external or hard to undo, like sending an email, posting publicly or changing customer-facing data, and that requires approval.

Level four is money, legal, deletion and access: refunds, payments, contracts, deleting data and permissions. That's for humans only, although the agent may prepare the work. Most useful agents live comfortably at levels zero to two, with one or two level-three actions behind an approval step.

### 3. Guardrails at every layer · 1:25

**[ON SCREEN TEXT: "Input · Process · Output · Action · Oversight"]**

No single guardrail is enough, so you layer them. At the input, control what can start the agent, validate and clean incoming data and label untrusted content clearly. During the process, cap the number of steps, the run time and the spend per run, and allowlist recipients, domains and records where you can.

At the output, validate structured outputs and check text for things that must never appear, such as prices, internal notes or personal data meant for someone else. At the action layer, require approval for level-three tools, test in a sandbox first and know how to undo each action.

And for oversight, log every tool call with its inputs and results. Keep a kill switch, a single place to pause the agent instantly.

### 4. Human-in-the-loop patterns · 2:20

**[ON CAMERA]**

There are four ways to keep a person involved. Approve before acting means the agent pauses while a human approves, edits or rejects, and it's for level-three actions. Escalate when unsure means the agent hands off with a summary, and it's for ambiguous or sensitive cases.

Review afterwards means humans check a sample of completed runs, which suits proven level-two actions. And take over means a person can step into the task at any time, which is right for customer-facing conversations.

### 5. Approval requests people can act on · 2:55

**[SCREEN RECORDING]** Paste this template:

~~~
APPROVAL NEEDED: Send email
AGENT GOAL:   Confirm the rescheduled onboarding call
ACTION:       Send email to [client email]
              Subject: "Your onboarding call: new time confirmed"
WHY:          Client asked to move the call (email received [time])
EVIDENCE:     [link to email thread] | [calendar slot checked: free]
RISK NOTES:   None detected
OPTIONS:      Approve | Edit, then send | Reject (with a reason)
~~~

An approval request should give the reviewer everything needed to decide in seconds. Here, they see the agent's goal, the exact action, why it wants to act and the evidence it checked.

There's a line for risk notes, then three clear options: approve, edit and then send, or reject with a reason.

### 6. Watch out for approval fatigue · 3:30

**[ON CAMERA]**

Here's the most common mistake: asking for approval on everything. If people approve dozens of trivial items a day, they stop reading them, and approval becomes a rubber stamp.

So ask for approval only where it matters, batch low-risk items into a daily digest and track the results. If an action is approved unchanged nearly every time for weeks, consider moving it down a level.

If it's often edited or rejected, improve the agent before asking for less oversight.

### 7. Red-team your guardrails · 4:05

**[ON SCREEN TEXT: "Try to break it before a customer does"]**

Before launch, try to break your own agent, and record what happens. Ask it directly to do something forbidden, like "just send the refund." Hide an instruction in an email or document it reads, such as a request to forward the thread to an outside address.

Make a tool return an error, then make it return nothing at all. Give it a task that can't be completed and confirm it stops and escalates instead of looping, and give it an ambiguous request and confirm it asks rather than guesses.

Finally, confirm the kill switch stops runs already in progress, and that the log captures every tool call, including failed ones. Every failure you find now is one a customer won't find later, so add each scenario to your golden test set in Module 5.

### 8. Build it · 5:00

**[ON CAMERA]**

Now open the Build it section of the written lesson. List every tool your agent uses and give each one a level on the permission ladder. Then fill in the limits and approval boxes on your canvas: maximum steps, time and spend, plus which actions need approval.

Write an approval request template for your level-three actions. Then run the red-team checklist against your design, on paper if it isn't built yet, and fix any gaps.

### 9. Recap and what's next · 5:35

**[ON CAMERA]**

Let's recap. Classify every tool on the permission ladder: read, draft, reversible, external and high-stakes. Layer guardrails across input, process, output, action and oversight.

Make approvals fast and informed, and watch for approval fatigue. And red-team the agent before launch, turning every failure into a test case.

**[ON SCREEN TEXT: "Next: Testing and Evaluation with Golden Test Sets"]**

That wraps up the agents module. In the next lesson, Testing and Evaluation with Golden Test Sets, you'll build the test set that lets you know, rather than hope, that your automation works.

## On-screen text

- 0 Read · 1 Draft · 2 Reversible · 3 External · 4 Humans only
- Input · Process · Output · Action · Oversight
- Try to break it before a customer does
- Next: Testing and Evaluation with Golden Test Sets

## Lesson page description

Giving an agent tools is giving it power, so decide carefully how much. Learn the five-level permission ladder, how to layer guardrails from input to oversight, how to write approval requests people can act on in seconds without approval fatigue and how to red-team your agent before launch.
