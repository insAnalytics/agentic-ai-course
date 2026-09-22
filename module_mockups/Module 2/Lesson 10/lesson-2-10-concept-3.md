# Module 2, Lesson 10 — Concept 3: Orchestrator-workers

---

## Decompose, dispatch to many, aggregate

Genuinely distinct from both prior patterns: routing picks *one* fixed
path; orchestrator-workers decomposes a task into several sub-tasks —
[the same shape as Lesson 8's `PlanBlock`](→ this module, planning and decomposition lesson, goal decomposition concept) — dispatches *all* of them to workers, and aggregates the results into one output.

```python
import asyncio

async def worker(sub_task: str) -> str:
    await asyncio.sleep(0.3)
    return f"completed: {sub_task}"

async def run_orchestrator(sub_tasks: list) -> str:
    worker_results = await asyncio.gather(*(worker(task) for task in sub_tasks))
    return "\n".join(worker_results)

sub_tasks = ["Create research_agent", "Create support_agent", "Create billing_agent"]
summary = asyncio.run(run_orchestrator(sub_tasks))
print(summary)
```
```
completed: Create research_agent
completed: Create support_agent
completed: Create billing_agent
```
*(runs live, shows output — read-only demo snippet, not graded)*

Each worker has a fixed job — run its one sub-task, report back —
never deciding what to do next dynamically the way [a full agent loop from Lessons 4–9](→ this module, writing the loop by hand lesson) would. This is genuinely different from a full agent loop, not a smaller version of one: the sub-tasks are already known upfront, [Concept 2's parallel dispatch](→ this lesson, parallelization concept) runs them together, and aggregation is a final, fixed join step — no open-ended decision-making anywhere in the structure.

---

## Quiz cards

> **Q1.** How does orchestrator-workers differ from routing?
> - A) They're the same pattern, just named differently
> - B) Routing picks one fixed path; orchestrator-workers dispatches to *multiple* workers and aggregates their results ✅
> - C) Orchestrator-workers never uses an LLM call at all
> - D) Routing always runs more workers than orchestrator-workers

> **Q2.** Why is orchestrator-workers genuinely different from a smaller
> agent loop, not just a simplified version of one?
> - A) There's no real difference between the two
> - B) Each worker has a fixed job with no open-ended decision-making; the full agent loop's defining trait — the model deciding what to do next dynamically — is entirely absent ✅
> - C) Orchestrator-workers always uses more tool calls than an agent loop
> - D) Workers are always run sequentially, never in parallel

---

## Applied sandbox exercise 1

*(implementing orchestrator-workers — genuinely graded)*

*Task shown to learner:* Implement `run_orchestrator(sub_tasks)` as
shown, dispatching all sub-tasks concurrently via `asyncio.gather` and
joining results with `"\n"`.

*Hidden test cases:*
```python
result = asyncio.run(run_orchestrator(["Task A", "Task B"]))
assert result == "completed: Task A\ncompleted: Task B"
```

*Hint (shown on request):* `asyncio.gather(*(worker(task) for task in
sub_tasks))` unpacks a generator of coroutines directly into `gather`'s
arguments.

*Correct answer:*
```python
async def run_orchestrator(sub_tasks: list) -> str:
    worker_results = await asyncio.gather(*(worker(task) for task in sub_tasks))
    return "\n".join(worker_results)
```

---

*(End of Concept 3 — final concept of Lesson 10. Continues with
bookends — drafted separately.)*
