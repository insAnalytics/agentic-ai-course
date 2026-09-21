# Module 2, Lesson 8 — Concept 1: Goal decomposition

---

## Every loop so far has been purely reactive

[Every loop built since Lesson 4](→ this module, writing the loop by hand lesson) works the same way: at each step, decide what to do *next*, based on the current state — with no advance structure for the whole task laid out ahead of time. This works fine for simple tasks, but for a genuinely multi-step goal, deciding everything one step at a time, with no sense of the overall shape of what needs to happen, can mean real inefficiency, or losing track of the bigger picture entirely.

---

## Decomposing before executing anything

**Goal decomposition** is the alternative: before any execution begins,
break a high-level goal into a set of concrete sub-tasks — a genuine
upfront plan, distinct from reactive step-by-step decision-making.

```python
class PlanBlock:
    def __init__(self, sub_tasks: list):
        self.type = "plan"
        self.sub_tasks = sub_tasks

decomposition_client = FakeLLMClient(scripted_responses=[
    [PlanBlock(sub_tasks=[
        "Check if 'research_agent' exists; create it with model 'claude-sonnet' if not.",
        "Check if 'support_agent' exists; create it with model 'claude-haiku' if not.",
    ])],
])

response = decomposition_client.create(messages=[{"role": "user", "content": "Register research_agent (claude-sonnet) and support_agent (claude-haiku) if they don't already exist."}])
plan = response.content[0]
print(f"decomposed into {len(plan.sub_tasks)} sub-tasks:")
for i, task in enumerate(plan.sub_tasks, start=1):
    print(f"  {i}. {task}")
```
```
decomposed into 2 sub-tasks:
  1. Check if 'research_agent' exists; create it with model 'claude-sonnet' if not.
  2. Check if 'support_agent' exists; create it with model 'claude-haiku' if not.
```
*(runs live, shows output — read-only demo snippet, not graded)*

A new block type, `PlanBlock`, represents a structured decomposition —
[the same "give the model's output a real, checkable structure" instinct from constrained decoding, back in Module 1](→ Module 1, structured output and tool calling lesson, constrained decoding the actual enforcement mechanism concept), just applied to planning output rather than a tool call. Crucially, this entire response happens *before* any tool has been called at all — nothing about it is a reaction to a prior result, unlike every loop step covered in Lessons 4–7.

---

## The real contrast

`for i, task in enumerate(plan.sub_tasks, start=1):` — [`enumerate`, from Module 0](→ Module 0, the data structures lesson) — is simply printing the plan, but the point worth sitting with is what's *not* happening here: no tool has run yet, no result has come back, and the agent already knows the shape of the whole task ahead of it. A reactive loop, by contrast, would have had no visibility into "there are two sub-tasks" until it had already executed the first one and seen what happened — decomposition trades that in-the-moment reactivity for upfront structure.

---

## Quiz cards

> **Q1.** How does every loop built in Lessons 4–7 decide what to do at
> each step?
> - A) By consulting a plan produced before execution began
> - B) Reactively — deciding only the *next* step, based on the current state, with no advance structure for the whole task ✅
> - C) By randomly selecting from all available tools
> - D) By asking the user to specify every step manually

> **Q2.** What does goal decomposition actually produce, and when?
> - A) A single tool call, exactly like a reactive loop's first step
> - B) A set of concrete sub-tasks, produced entirely before any execution begins ✅
> - C) The final answer to the user's original question, immediately
> - D) A decomposition only ever happens after the task is already complete

> **Q3.** What's the real, structural difference between a reactive loop
> and a decomposition-first approach, illustrated by the demo?
> - A) There's no real difference — both approaches behave identically
> - B) A reactive loop only learns the task's shape one step at a time, as results come back; decomposition reveals the whole plan's shape upfront, before any tool has been called at all ✅
> - C) Decomposition never actually produces more than one sub-task
> - D) Reactive loops always require more total API calls than decomposition

---

*(End of Concept 1. This lesson continues with Concept 2 — plan
representations, linear, tree, and dependency graph — drafted
separately.)*
