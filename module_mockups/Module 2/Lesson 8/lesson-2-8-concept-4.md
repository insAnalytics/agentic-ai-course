# Module 2, Lesson 8 — Concept 4: Plan-and-execute vs. purely reactive

---

## Naming a choice this module has already been making

Every loop built in [Lessons 4–7](→ this module, writing the loop by hand lesson) has actually been making a specific architectural choice, without it ever being named directly: deciding *one step at a time*, based only on current state, with no advance structure — **purely reactive**. This lesson's earlier concepts opened up the alternative: decompose the goal into a plan *before* any execution begins, then actually execute that predetermined structure — **plan-and-execute**.

---

## Plan-and-execute, concretely

```python
planning_client = FakeLLMClient(scripted_responses=[
    [PlanBlock(sub_tasks=["Create research_agent", "Create support_agent"])],
])

execution_client = FakeLLMClient(scripted_responses=[
    [TextBlock(text="research_agent created.")],
    [TextBlock(text="support_agent created.")],
])

def run_plan_and_execute(planning_client, execution_client, goal: str) -> list:
    plan_response = planning_client.create(messages=[{"role": "user", "content": goal}])
    plan = plan_response.content[0]
    print(f"plan has {len(plan.sub_tasks)} known steps -- bounded and predictable before execution starts")

    results = []
    for sub_task in plan.sub_tasks:
        response = execution_client.create(messages=[{"role": "user", "content": sub_task}])
        results.append(response.content[0].text)
    return results

results = run_plan_and_execute(planning_client, execution_client, "Set up research_agent and support_agent")
print(results)
```
```
plan has 2 known steps -- bounded and predictable before execution starts
['research_agent created.', 'support_agent created.']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Before executing a single sub-task, the exact number of execution steps
is already known — `2`, not "however many turn out to be needed, found
out only by actually running the loop."

---

## The real tradeoff

Plan-and-execute buys genuine **predictability and foresight**: you
know the shape of the whole task before spending anything on execution
— useful for estimating cost upfront, catching an obviously flawed plan
before wasting real execution effort, or letting a human review a plan
before it runs at all. What it trades away is **adaptiveness**: if
something genuinely unexpected happens mid-execution — something the
plan never accounted for — a plan-and-execute agent following a fixed,
predetermined structure isn't naturally built to notice and adjust.

A purely reactive loop is the mirror image: maximum adaptiveness,
deciding fresh at every step based on whatever's actually happening —
but genuinely no foreknowledge of how many steps it'll take, or what it
will actually do, until it's already doing it. This is exactly [the unpredictable cost and latency risk from Lesson 1's honest case against always using an agent](→ this module, agents workflows and the loop lesson, the honest case for not using an agent concept), and exactly why [Lesson 6 needed real guards — `max_steps`, repeated-action detection](→ this module, termination failure and control lesson) — as a defensive backstop, precisely *because* a reactive loop has no upfront bound on its own step count the way plan-and-execute naturally does.

---

## Quiz cards

> **Q1.** What architectural choice have every one of the loops built in
> Lessons 4–7 actually been making, without it ever being named
> directly?
> - A) Plan-and-execute — deciding the full sequence before starting
> - B) Purely reactive — deciding one step at a time, based only on current state, with no advance structure ✅
> - C) Neither approach — those loops use a completely different strategy
> - D) A hybrid of both, decided randomly

> **Q2.** In the plan-and-execute demo, what's known *before* a single
> execution step actually runs?
> - A) Nothing — the number of steps is still unknown at that point
> - B) The exact number of execution steps required — genuine foresight, derived directly from the upfront plan ✅
> - C) The exact final answer, before any execution happens at all
> - D) Only the first step; the rest remain unknown

> **Q3.** What does plan-and-execute trade away in exchange for
> predictability and foresight?
> - A) Nothing — it's a strictly better approach with no real tradeoff
> - B) Adaptiveness — a fixed, predetermined plan isn't naturally built to notice and adjust to something genuinely unexpected during execution ✅
> - C) The ability to use any tools at all
> - D) The ability to ever produce a final answer

> **Q4.** Why did Lesson 6 need real guards like `max_steps` as a
> defensive backstop, specifically for reactive loops?
> - A) Reactive loops never actually need any guards
> - B) A reactive loop has no upfront bound on its own step count, unlike plan-and-execute, which knows its step count in advance from the plan itself ✅
> - C) Plan-and-execute loops need exactly the same guards for the same reason
> - D) `max_steps` was only ever relevant to Lesson 6's specific examples, not a general principle

---

*(End of Concept 4. This lesson continues with Concept 5 — replanning
when a step fails — drafted separately.)*
