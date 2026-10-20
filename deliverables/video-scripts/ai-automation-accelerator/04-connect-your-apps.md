# Lesson 4: Connecting Your Apps: Triggers, Actions and Data

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 2 · No-Code AI Workflows |
| **Length** | 5–7 min (~890 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Recognize the building blocks shared by Zapier, Make and n8n, choose a way to add the AI step, and read the model's response safely before acting on it.

## Before you record

- Your automation platform open with a new, empty automation in test mode
- A manual trigger or a test form you can submit, plus an email inbox or chat channel to receive results
- An AI step available in your platform (built-in, an official integration or an HTTP request step), with any API key already saved in the platform's credential store, never on screen
- A blank note, ready to paste the HTTP request template from the written lesson
- Three sample inputs: a typical one, a messy one and a nearly empty one

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

Zapier, Make and n8n look different, but underneath they share the same small set of building blocks. Learn the blocks and you can build in any of them, and move between them later without starting over.

So this lesson is about concepts rather than buttons. Menus change often. The ideas don't.

**[ON SCREEN TEXT: "Connecting Your Apps: Triggers, Actions and Data"]**

### 2. Three platforms, one set of ideas · 0:20

**[B-ROLL: an automation canvas in your platform of choice]**

Zapier has a very large catalog of app integrations and a straightforward, step-by-step builder, so it's often the quickest way to connect popular apps. Make uses a visual canvas where you can see branches and data flowing between modules, which makes it strong for lots of branching and reshaping data. And n8n is node-based and can be self-hosted as well as used in the cloud, so it suits teams that want code steps or more control over where data lives.

**[ON SCREEN TEXT: "Zap = scenario = workflow"]**

A Zapier Zap, a Make scenario and an n8n workflow are all the same idea. Each platform meters usage differently, by step, operation or run depending on the plan, so check current pricing before you design anything high-volume. Then choose the platform with solid integrations for the apps you rely on, and one your team will actually maintain.

### 3. The building blocks · 1:20

**[ON SCREEN TEXT: "Triggers · Actions · Searches · Mapping · Filters · Formatters · Loops · HTTP · Code"]**

Triggers start a run. Instant triggers fire the moment something happens, usually through a webhook; polling triggers check for new data on a schedule, which can add a delay; and scheduled triggers run at set times. Actions do something, like create a record, send a message or update a row.

Search steps find existing records, such as finding a contact by email. Use them for a find-or-create pattern, so you don't create duplicates. Data mapping passes fields from earlier steps into later ones.

**[ON CAMERA]**

Mapping is where most beginner bugs live, so always check what each step actually outputs. Then you've got filters and branches to decide whether to continue and which path to take, formatters to clean up text, dates and numbers, and loops for lists, like every line item on an order. Webhooks and HTTP requests connect to any app with an API, and code steps handle the occasional transformation the built-in steps can't.

### 4. Three ways to add the AI step · 2:25

**[ON SCREEN TEXT: "Built-in AI step · Official integration · HTTP request"]**

There are three ways to add AI. Your platform's built-in AI step is the fastest way to get started, with less control over the model and settings. An official AI app integration suits most production work, though its settings can lag behind the latest API.

And a direct HTTP request to the AI provider's API gives you full control, as long as you read the API docs. The written lesson shows what that looks like for one provider, Claude. I'll paste it into a note so we can read it together.

**[SCREEN RECORDING]** Paste this template:

~~~
POST https://api.anthropic.com/v1/messages

Headers
  x-api-key:          (stored in your platform's credential store, never typed into a step)
  anthropic-version:  2023-06-01
  content-type:       application/json

Body
{
  "model": "claude-opus-5-5",
  "max_tokens": 16000,
  "output_config": { "effort": "low" },
  "system": "You classify enquiries for a small consultancy. Reply with one word: hot, warm, cold or spam.",
  "messages": [
    { "role": "user", "content": "Enquiry from {{name}} at {{company}}: {{message}}" }
  ]
}
~~~

Look at the API key line first. It lives in your platform's credential store and is never typed into a step. The double curly braces are where your platform maps in data from earlier steps.

Two practical tips. Prefer your platform's structured body editor, with key and value fields, over typing raw JSON, so quotes and line breaks in customer text don't break the request. And set effort to match the job: low for simple classification and extraction, higher for complex reasoning or long-form writing.

### 5. Read the response properly · 4:00

**[ON CAMERA]**

Here's an easy mistake to make. The reply comes back as a list of content blocks, and the answer you want is in the block whose type is "text". It isn't always the first block, because the model can return a thinking block before its answer.

So map the text block, not "the first item." Then check the stop reason before you trust the answer.

**[ON SCREEN TEXT: "end_turn → continue · max_tokens → don't act · refusal → human review"]**

If it says end_turn, the model finished normally, so continue. If it says max_tokens, the answer was cut off at the length limit, so raise the limit or shorten the input, and don't act on partial output. If it says refusal, the model declined, so send the item to human review.

### 6. Test like a builder · 4:50

**[ON CAMERA]**

Every platform lets you run a step with sample data, so use it constantly. Run each step on its own and inspect its raw output before you map it onward. Test with at least three inputs: a typical one, a messy one and a nearly empty one.

Rename your steps descriptively, like "Classify enquiry" instead of "Step 4". And build in a copy or test mode first, pointing at a test spreadsheet or sandbox CRM, never at live customer records.

### 7. Build it · 5:20

**[ON CAMERA]**

For the Build it exercise in the written lesson, choose one platform and create a new automation with a manual trigger or a test form. Add an AI step that classifies the input into three or four categories of your choice.

Send the result to yourself by email or chat, including the category and the original input. Then run it with a typical, a messy and a nearly empty input, and inspect every step's raw output.

### 8. Recap and what's next · 5:55

**[ON SCREEN TEXT: "Same blocks, any platform"]**

Let's recap. Zapier, Make and n8n share the same building blocks: triggers, actions, searches, mapping, filters, formatters, loops, HTTP and code. You can add AI through a built-in step, an official integration or a direct HTTP request.

Read the text block of the response, and check the stop reason before acting on it. And test every step with real, messy inputs in a safe copy before touching live data.

**[ON CAMERA]**

In the next lesson, Structured Outputs: JSON You Can Trust, you'll get the AI step to return answers in a predictable shape your filters and CRM can rely on. See you there.

## On-screen text

- Connecting Your Apps: Triggers, Actions and Data
- Zap = scenario = workflow
- Triggers · Actions · Searches · Mapping · Filters · Formatters · Loops · HTTP · Code
- Built-in AI step · Official integration · HTTP request
- end_turn → continue · max_tokens → don't act · refusal → human review
- Same blocks, any platform

## Lesson page description

Zapier, Make and n8n look different but share the same building blocks. This video walks through triggers, actions, searches, mapping, filters and more, the three ways to add an AI step, and how to read the model's response and stop reason before your workflow acts on it.
