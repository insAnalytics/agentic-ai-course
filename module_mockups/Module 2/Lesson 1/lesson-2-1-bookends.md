# Agents, Workflows, and the Loop

> **You'll be able to**
> - Explain what an agent is structurally — the tool-call round trip
>   from Module 1, wrapped in a loop the model itself controls
> - Distinguish a chatbot, a workflow, and an agent by who or what
>   actually controls the sequence of steps, not by sophistication
> - Apply a real decision test for whether a task's control flow
>   actually needs an agent's dynamism, or whether a fixed workflow
>   reaches the same outcome more cheaply and predictably

**Why it matters**
Every lesson after this one in this module is about building and
controlling agent loops — this lesson is what makes sure that content
lands as a deliberate engineering choice for a specific kind of problem,
not a default reached for out of habit. Knowing precisely what
structurally makes something an agent, and precisely when that
structure is actually worth its real costs, is the judgment this whole
module is built to develop.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all three concepts, mixed order)*

> **Q1.** What is an agent, structurally, in terms of what Module 1
> already covered?
> - A) A completely new mechanism, unrelated to the tool-call round trip
> - B) The exact same tool-call round trip from Module 1, wrapped in a loop where the model itself decides whether another cycle is needed ✅
> - C) A single API call that never involves any tools
> - D) A specific commercial product or framework

> **Q2.** What determines how many cycles an agent's loop actually runs?
> - A) A fixed number, set in advance regardless of the task
> - B) The model's own decisions at each step — the loop continues exactly as long as the model keeps requesting further tool calls ✅
> - C) The number of tools available, regardless of whether they're used
> - D) The length of the original user message

> **Q3.** What's the precise structural question that distinguishes a
> chatbot, a workflow, and an agent?
> - A) How many LLM calls each one makes
> - B) Who or what controls the sequence of steps — a human, fixed code, or the model itself, dynamically ✅
> - C) How intelligent the underlying model is
> - D) Whether the system uses tools at all

> **Q4.** Could a system making a two-step, always-summarize-then-translate
> sequence of LLM calls be structurally an agent?
> - A) Yes, since it makes more than one LLM call
> - B) No — if the sequence is fixed in the code regardless of either call's output, it's structurally a workflow, not an agent ✅
> - C) Yes, any system calling an LLM more than once is automatically an agent
> - D) This can never be determined either way

> **Q5.** Why does this lesson describe sophistication and structure as
> independent axes?
> - A) They're the same thing, described differently
> - B) A workflow can be highly sophisticated while remaining structurally a workflow; an agent can be structurally simple while still being a genuine agent ✅
> - C) Only agents can be sophisticated
> - D) Sophistication only applies to chatbots

> **Q6.** What does an agent's dynamic control flow trade away, compared
> to a fixed workflow?
> - A) Nothing — an agent is strictly better in every respect
> - B) Predictability — cost, latency, and behavior all become harder to know in advance, and harder to test and debug as a result ✅
> - C) The ability to use tools at all
> - D) The ability to produce a final answer

> **Q7.** What's the actual decision test this lesson proposes for
> choosing between an agent and a workflow?
> - A) Always choose whichever uses more LLM calls
> - B) Whether the task's control flow genuinely depends on information only available at runtime, which a fixed sequence structurally can't accommodate ✅
> - C) Always choose an agent by default
> - D) Choose based on team familiarity alone

---

## Closing synthesis — classify, then apply the decision test

*(end of lesson, reflective rather than graded — three new scenarios,
not already covered in this lesson)*

For each scenario, decide: chatbot, workflow, or agent — and for
whichever one you call a workflow, apply [the decision test from Concept 3](→ this lesson, the honest case for not using an agent concept) to check whether it actually could, or should, be built as one.

1. A system that always: classifies an incoming support ticket's topic
   (using an LLM), then routes it to a canned response template based on
   that classification.
2. A system that searches for information, evaluates whether the results
   are actually sufficient to answer the question, and either searches
   again with a refined query or writes a final summary — repeating an
   unknown number of times until the results are good enough.
3. A simple interface where a person types a question, reads the answer,
   and decides themselves what to ask next.

*Reasoning to check against:* (1) is a **workflow** — classify, then
route is a fixed two-step sequence; even though classification uses an
LLM, the *order* never changes based on what either step actually
produces. Applying the decision test: this task's steps are fully
knowable in advance (always classify, always route), so a workflow is
the right call here — no runtime-only information is actually driving
the control flow. (2) is a genuine **agent** — whether to search again
is a decision only the model can make, based on results it can't know
in advance, [exactly the runtime-dependent case the decision test identifies as earning an agent's cost](→ this lesson, the honest case for not using an agent concept). (3) is a **chatbot** — a human, not the system, decides the sequence of the interaction at every turn.

The pattern worth taking away: these three scenarios *sound* similarly
sophisticated on the surface, but only one of them actually needs
everything the rest of this module is about to build.
