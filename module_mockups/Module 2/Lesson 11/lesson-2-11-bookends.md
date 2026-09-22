# From Hand-Rolled to a Runtime

> **You'll be able to**
> - Name the four things a framework provides, and trace each back to
>   something already built by hand in this module
> - Read real LangChain agent code, and recognize its terminology
>   (`agent_scratchpad`) as the exact vocabulary this course already
>   established
> - Explain what control is genuinely given up when adopting a
>   framework, and why understanding the hand-rolled mechanics makes
>   that trade an informed choice

**Why it matters**
This lesson — and this module — closes with the same honest register it opened with in [Lesson 1](→ this module, agents workflows and the loop lesson): a framework isn't magic, and it isn't strictly better than hand-rolled code either. It's the exact same loop, dispatch, state, and guards this module built concept by concept, now packaged for reuse at the cost of direct visibility. Having built every one of those pieces yourself is what makes that trade a real decision, not a leap of faith.

---

## Comprehensive quiz

> **Q1.** Which two things a framework provides has this module already
> built by hand?
> - A) Tracing hooks and a deployment path
> - B) The loop and state handling ✅
> - C) Nothing new
> - D) Only the loop

> **Q2.** Why does a LangChain tool's docstring matter specifically?
> - A) It's ignored entirely
> - B) It becomes part of the tool's schema, directly shown to the model ✅
> - C) Docstrings are never used by `@tool`
> - D) Only matters with no type hints

> **Q3.** What does `"{agent_scratchpad}"` confirm about this course's
> terminology?
> - A) Nothing — coincidental
> - B) "Scratchpad" is genuine, standard framework terminology, not invented for this course ✅
> - C) LangChain uses an unrelated concept
> - D) Scratchpads don't exist in real frameworks

> **Q4.** What does `AgentExecutor(..., max_iterations=10)` correspond
> to?
> - A) Nothing new
> - B) Lesson 4's loop, with `max_iterations` as Lesson 6's `max_steps` ✅
> - C) Only tool dispatch
> - D) The evaluator-optimizer pattern

> **Q5.** Why does this lesson treat understanding hand-rolled mechanics
> as valuable even once a framework is adopted?
> - A) It isn't valuable
> - B) It's what makes adopting a framework an informed choice, not a leap of faith ✅
> - C) Frameworks require rewriting the hand-rolled version every time
> - D) This isn't actually argued

---

## Closing synthesis — the full arc

*(reflective — naming the module's whole trajectory)*

From [Lesson 1's bare structural definition of an agent](→ this module, agents workflows and the loop lesson) through [Lesson 4's hand-written loop](→ this module, writing the loop by hand lesson), [Lesson 6's guards](→ this module, termination failure and control lesson), [Lesson 7's scratchpad](→ this module, agent state and the scratchpad lesson), [Lesson 8's planning](→ this module, planning and decomposition lesson), and [Lesson 9's reflection](→ this module, reflection and self critique lesson) — every mechanism a real framework like LangChain packages was built here first, by hand, understood at the level of every line. That's the actual point of this module: not that hand-rolling is always the right choice, but that choosing a framework afterward is a genuine, informed decision — never a black box accepted on faith.
