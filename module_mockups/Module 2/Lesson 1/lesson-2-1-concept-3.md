# Module 2, Lesson 1 — Concept 3: The honest case for not using an agent

---

## What an agent's dynamism actually costs

[An agent's defining trait](→ this lesson, agent vs workflow vs chatbot concept) — the model deciding the sequence of steps dynamically — is a genuine trade, not a strict upgrade over a fixed workflow. Three real costs come with that flexibility:

- **Unpredictable cost and latency.** Since the number of loop cycles
  isn't fixed, [actual cost and response time — everything Module 1's pricing concepts covered](→ Module 1, quantization cost and operational concerns lesson) — can vary widely for what looks like the same kind of request. A task might resolve in one cycle, or genuinely need eight, depending entirely on how the model reasons through it that particular time.
- **Harder to test.** A fixed workflow's behavior is deterministic —
  given input X, you can assert exactly which steps run, in what order.
  An agent's actual sequence of steps can vary run to run, [a real complication for the testing discipline covered in Module 0](→ Module 0, the testing lesson, testing error paths and status codes systematically concept) — you can't simply assert "exactly these three tool calls happen in this exact order" the way a workflow's test suite could.
- **Harder to debug.** When something goes wrong, tracing through *why*
  the model made a particular sequence of decisions is a fundamentally
  harder problem than debugging a fixed, linear workflow, where the
  entire control flow is already fully visible directly in the code.

---

## When a fixed workflow is clearly the better choice

If a task's actual steps are fully knowable in advance — "always
summarize, then always translate," with no case where the order should
differ, a step should be skipped, or something should repeat based on
an intermediate result — [a workflow](→ this lesson, agent vs workflow vs chatbot concept) gets the exact same outcome more cheaply, more predictably, and more testably, with no real loss of capability. The dynamic decision-making an agent provides simply isn't being *used* for a task like that — you'd be paying its real costs for a flexibility the task never actually needed.

---

## The actual decision test

The honest question worth asking before reaching for an agent: does
this task's control flow genuinely depend on information only available
at *runtime* — a tool's actual result, something the model needs to
figure out along the way, a number of steps that can't be known ahead
of time — that a fixed sequence structurally can't accommodate? If yes,
an agent's dynamism is earning its real cost. If the steps and their
order are actually fully determinable in advance, a workflow reaches
the same outcome for less.

---

## Why this framing matters for the rest of this module

Everything from here forward in this module is about building and
controlling agent loops — worth reading that content with this
concept's honest framing in mind, not as "agents are the correct
default for every problem," but as "here's how to build the specific
tool that fits when a task's control flow genuinely can't be known in
advance." That's a real, common, and important category of problem —
it just isn't every problem.

---

## Quiz cards

> **Q1.** What does an agent's dynamic control flow trade away, compared
> to a fixed workflow?
> - A) Nothing — an agent is strictly better in every respect
> - B) Predictability — cost, latency, and behavior all become harder to know in advance, and harder to test and debug as a direct consequence ✅
> - C) The ability to use tools at all
> - D) The ability to produce a final text answer

> **Q2.** Why is an agent's behavior genuinely harder to test than a
> fixed workflow's?
> - A) Agents can never be tested at all, under any circumstances
> - B) A workflow's fixed sequence can be asserted directly; an agent's actual sequence of steps can vary run to run, making a simple "exactly these calls, in this order" assertion unreliable ✅
> - C) Testing frameworks don't support LLM-based systems
> - D) There's no real testing difference between the two

> **Q3.** What's the actual decision test this concept proposes for
> choosing between an agent and a workflow?
> - A) Always choose whichever approach uses more LLM calls
> - B) Whether the task's control flow genuinely depends on information only available at runtime, which a fixed sequence structurally can't accommodate ✅
> - C) Always choose an agent, since it's more capable by definition
> - D) Choose based purely on which approach a team has more experience with

> **Q4.** How should the rest of this module's content on building agent
> loops be read, given this concept's framing?
> - A) As proof that agents should always be the default choice for any task
> - B) As instruction for the specific category of problem where a task's control flow genuinely can't be known in advance — not a universal default ✅
> - C) As irrelevant, since workflows are always the better choice
> - D) As a complete replacement for everything covered about workflows

---

*(End of Concept 3 — final concept section of Lesson 1. This lesson
continues with the outcomes callout, comprehensive quiz, and closing
synthesis — drafted separately.)*
