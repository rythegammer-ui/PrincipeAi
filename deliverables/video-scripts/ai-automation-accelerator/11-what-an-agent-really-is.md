# Lesson 11: What an AI Agent Really Is (and When Not to Use One)

| | |
|---|---|
| **Course** | AI Automation Accelerator: Build Workflows & Agents |
| **Module** | 4 · AI Agents |
| **Length** | 5–7 min (~920 spoken words) |
| **Format** | Talking head + screen recording |

**Goal of this video:** Explain what an agent really is (a goal, tools and a loop), how it differs from a workflow and how to use the four-question test to decide whether you need one at all.

## Before you record

- The workflow-versus-agent table and the four questions from the written lesson, ready to show
- The "for the curious" agent loop code from the written lesson, open in a code editor or document so you can scroll through it
- A short list of one or two tasks from your own business that people often call "agent" ideas, to use as talking points

## Script

### 1. Hook · 0:00

**[ON CAMERA]**

"Agent" is the most overused word in AI right now. Strip away the hype, and the idea is simple: an agent is a model that's given a goal and a set of tools, and works in a loop until the goal is met or it needs help. That's it.

The power, and the risk, both come from one thing: the model chooses its own steps. In this lesson, you'll learn what that means, and how to tell when an agent is the right tool and when a workflow will serve you better.

### 2. Goal, tools and a loop · 0:40

**[ON SCREEN TEXT: "Goal · Tools · Loop"]**

Start with the goal. That's what "done" looks like, such as "prepare a brief for tomorrow's call with this lead," or "resolve this order question or hand it off."

Then the tools. These are the actions the agent can take, like searching the CRM, reading an order, checking a calendar or creating a draft. Each tool is a capability you deliberately grant.

And then the loop, which is what turns a model into an agent. The agent receives its goal, instructions and starting context, then decides on the next step or decides it's finished. It calls a tool, reads the result and goes back to deciding, until the goal is met, it gets stuck or it hits a limit you set.

### 3. Workflows versus agents · 1:30

**[ON SCREEN TEXT: "Workflow: you choose the steps · Agent: the model chooses"]**

Here's the key difference. In a workflow, you decide the steps in advance. In an agent, the model decides them at run time.

That choice has consequences. Workflows are more predictable, cheaper, faster and easier to debug, but they only handle the cases you designed for. Agents can adapt to new cases, but they're less predictable, slower and more expensive because of all those model calls, and you need a log of every step to debug them.

It's a spectrum, not a switch. It runs from a single prompt, to a fixed workflow, to a workflow with AI routing, to an agent with a few narrow tools, to an agent with broad tools, and the rule is simple: move right only when you have to.

### 4. Where agents shine · 2:25

**[B-ROLL: a CRM record, an order page and a calendar side by side]**

Agents earn their keep on tasks with variable paths that require looking things up. Think of pre-call research, where the agent checks the CRM history, past emails and notes, then writes a one-page brief. Or support resolution, where it looks up the order, checks shipping, reads the return policy and drafts a reply, asking for clarification when a customer has several orders.

Operations investigations fit too, like "Why doesn't this invoice match the order?" That means checking two or three systems, in an order that depends on what each one shows.

### 5. The four-question test · 3:05

**[ON SCREEN TEXT: "Complexity · Value · Capability · Recoverable mistakes"]**

The most common mistake is building an agent when a workflow would do, so ask four questions before you build one.

First, is the task genuinely multi-step and hard to spell out in advance? If you can draw the flowchart, build the workflow.

Second, is the outcome valuable enough to justify more cost, time and oversight? Third, can AI do this kind of task well? Test it by hand in a chat assistant first.

Fourth, can mistakes be caught and fixed before they cause harm? A "no" to any of these means a workflow or a single AI step is the better choice.

Watch for other red flags as well. Think of strict compliance rules that demand identical handling every time, tasks that must respond in a second or two, very low volumes where doing it by hand is cheaper and any situation where you can't log what the agent did.

**[OPTIONAL PERSONAL EXAMPLE: a time you were tempted to build an agent and a simpler workflow turned out to be the better choice.]**

### 6. Where agents live · 4:10

**[ON CAMERA]**

You don't need to write code to build an agent. Automation platforms increasingly offer agent steps, where you write instructions and attach other actions as tools. AI assistants with connectors can act as agents over your apps, and many support the Model Context Protocol, or MCP, an open standard for connecting AI applications to tools and data.

Code gives you full control with a short loop around an AI API. For the curious, here's the minimal example from the written lesson.

**[SCREEN RECORDING]** Scroll through this code:

~~~ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

const tools: Anthropic.Tool[] = [
  {
    name: "lookup_order",
    description: "Look up an order by ID. Returns status, items and tracking. Read-only.",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string", description: "Order ID, e.g. A-1029" } },
      required: ["order_id"],
    },
  },
];

async function runTool(name: string, input: unknown): Promise<string> {
  if (name === "lookup_order") {
    const { order_id } = input as { order_id: string };
    return JSON.stringify(await getOrder(order_id)); // your own function
  }
  return "Unknown tool: " + name;
}

const messages: Anthropic.MessageParam[] = [{ role: "user", content: "Where is order A-1029?" }];

for (let step = 0; step < 10; step++) { // hard cap on steps
  const msg = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    system: "You answer order questions. Always use tools to look things up. Never guess.",
    output_config: { effort: "low" },
    tools,
    messages,
  });
  if (msg.stop_reason === "refusal") break; // declined: hand off to a human
  messages.push({ role: "assistant", content: msg.content });
  if (msg.stop_reason !== "tool_use") {
    for (const block of msg.content) if (block.type === "text") console.log(block.text);
    break;
  }
  const results: Anthropic.ToolResultBlockParam[] = [];
  for (const block of msg.content) {
    if (block.type === "tool_use") {
      results.push({ type: "tool_result", tool_use_id: block.id, content: await runTool(block.name, block.input) });
    }
  }
  messages.push({ role: "user", content: results });
}
~~~

You don't need to follow every line. Near the top, there's one tool, lookup_order, with a description that says what it returns and that it's read-only. Below that is the loop: the model asks for a tool, the code runs it and sends back the result, and the loop repeats until the model stops asking.

Now look for the hard cap of ten steps, and the line that hands a declined request to a human. Even this tiny agent has guardrails, and you'll add many more over the next three lessons.

### 7. Build it · 5:35

**[ON CAMERA]**

Your exercise is in the Build it section of the written lesson. Pick a task you think needs an agent, and answer the four questions honestly, in writing.

If it passes, write its goal in one sentence, list the tools it needs, marking each one read or write, and define when it should stop. If it fails, redesign it as a workflow. That's a win, not a compromise.

### 8. Recap and what's next · 6:05

**[ON CAMERA]**

So, an agent is a model with a goal, tools and a loop, and the model chooses its own steps. Workflows are more predictable, cheaper and easier to debug, so move to agents only when you need to.

Use the four-question test: complexity, value, capability and recoverable mistakes. And remember that even the simplest agent needs limits, starting with a cap on steps.

**[ON SCREEN TEXT: "Next: Designing Tools and Instructions for Agents"]**

In the next lesson, Designing Tools and Instructions for Agents, you'll write tools an agent can't misuse and a brief it can't misread, and capture the whole design on a one-page canvas.

## On-screen text

- Goal · Tools · Loop
- Workflow: you choose the steps · Agent: the model chooses
- Complexity · Value · Capability · Recoverable mistakes
- Next: Designing Tools and Instructions for Agents

## Lesson page description

Cut through the hype: an agent is a model with a goal, tools and a loop that chooses its own steps. Learn how agents differ from workflows, where they genuinely shine and the four-question test that tells you when a simpler workflow is the better build.
