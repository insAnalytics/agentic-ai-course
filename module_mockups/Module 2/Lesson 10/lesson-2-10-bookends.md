# Workflow Patterns Beyond a Single Loop

> **You'll be able to**
> - Name prompt chaining and routing as workflow patterns already built
>   in this course, and explain why routing stays a workflow, not an
>   agent
> - Implement genuine parallelization for independent sub-tasks
> - Implement orchestrator-workers, and explain how it differs from
>   both routing and a full agent loop
> - Match a problem's actual shape to the right pattern, rather than
>   defaulting to the most sophisticated option available

**Why it matters**
This lesson is a deliberate step back: not every problem needs [the full agent loop built across Lessons 4–9](→ this module, writing the loop by hand lesson) — sometimes a fixed chain, a router, or parallel dispatch is genuinely the better fit, cheaper and more predictable for exactly the reason [Lesson 1's honest case against agents argued](→ this module, agents workflows and the loop lesson, the honest case for not using an agent concept). Recognizing which shape a problem actually has is the same judgment this whole module has been building toward.

---

## Comprehensive quiz

> **Q1.** What does prompt chaining actually name?
> - A) A brand-new mechanism
> - B) A fixed sequence where each step's output feeds the next ✅
> - C) A technique only usable with two steps
> - D) The agent's own dynamic tool selection

> **Q2.** Why is routing still structurally a workflow, not an agent?
> - A) It isn't
> - B) The set of possible downstream paths is fixed in code; only which one gets chosen is decided at runtime ✅
> - C) Routing never involves an LLM call
> - D) Routes are rebuilt fresh each request

> **Q3.** What made two sub-tasks safe to parallelize, per Lesson 8?
> - A) Same tool name
> - B) No dependency on each other in the dependency graph ✅
> - C) Coincidental scheduling
> - D) Parallelization is always safe

> **Q4.** How does orchestrator-workers differ from routing?
> - A) Same pattern, different name
> - B) Routing picks one path; orchestrator-workers dispatches to multiple workers and aggregates ✅
> - C) Never uses an LLM call
> - D) Always runs more workers than routing

> **Q5.** Why is orchestrator-workers genuinely different from a smaller
> agent loop?
> - A) No real difference
> - B) Each worker has a fixed job with no open-ended decision-making — the agent loop's defining trait is absent ✅
> - C) Always uses more tool calls
> - D) Workers always run sequentially

---

## Closing synthesis — match the pattern to the problem

*(reflective — apply this module's full range: chaining, routing,
parallelization, orchestrator-workers, or the full agent loop)*

1. Summarize a document, then translate the summary — always in that
   order.
2. Classify a support ticket, then send it to exactly one of three
   fixed handlers.
3. Fetch weather for five independent cities at once.
4. Decompose "audit these ten files" into ten sub-checks, run them all,
   compile one report.
5. Investigate a bug where the right next step genuinely depends on
   what's found at each stage, unknowable in advance.

*Answers:* (1) chaining — fixed sequence. (2) routing — one path, chosen
from fixed options. (3) parallelization — independent, no aggregation
needed beyond collecting results. (4) orchestrator-workers — decompose,
dispatch many, aggregate. (5) the full agent loop — genuinely unknown
step count, [exactly what Lessons 4–9 were built for](→ this module, writing the loop by hand lesson).

The pattern: match structure to the problem's actual shape, not habit.
