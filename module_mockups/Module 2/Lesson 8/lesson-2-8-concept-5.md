# Module 2, Lesson 8 — Concept 5: Replanning when a step fails

---

## More than just retrying the failed step

[Lesson 6 covered a single step failing in isolation](→ this module, termination failure and control lesson, tool errors as observations not exceptions concept) — retry with backoff, or a graceful give-up. In a plan-and-execute agent, a step failing has an *additional* consequence a reactive loop never had to worry about: the plan's *remaining* steps might have been built on an assumption that just turned out to be wrong, making them invalid too — not just the one step that failed.

---

## The scenario: a plan built on a false assumption

A plan assumes `"Create research_agent"` will succeed, and its second
step, `"Configure research_agent's model"`, was written expecting that
first step to have actually happened. But execution reveals
`research_agent` already exists — a definitive conflict, [exactly like Lesson 6's failure case](→ this module, termination failure and control lesson, tool errors as observations not exceptions concept), not something retrying would fix. Simply skipping the failed step and continuing to step two isn't safe either — step two's own assumptions may no longer hold.

---

## The fix: call the planner again, with what was actually learned

```python
class FailureBlock:
    def __init__(self, reason: str):
        self.type = "failure"
        self.reason = reason

def run_plan_execute_replan(planning_client, execution_client, goal: str) -> list:
    plan_response = planning_client.create(messages=[{"role": "user", "content": goal}])
    plan = plan_response.content[0]
    results = []

    remaining_tasks = list(plan.sub_tasks)
    while remaining_tasks:
        sub_task = remaining_tasks.pop(0)
        response = execution_client.create(messages=[{"role": "user", "content": sub_task}])
        result_block = response.content[0]

        if result_block.type == "failure":
            print(f"step failed: {result_block.reason} -- replanning remaining work")
            replan_response = planning_client.create(messages=[
                {"role": "user", "content": f"Original goal: {goal}. This happened: {result_block.reason}. What should the remaining steps be?"}
            ])
            new_plan = replan_response.content[0]
            remaining_tasks = list(new_plan.sub_tasks)
            print(f"revised plan now has {len(remaining_tasks)} remaining steps")
        else:
            results.append(result_block.text)
    return results

planning_client = FakeLLMClient(scripted_responses=[
    [PlanBlock(sub_tasks=["Create research_agent", "Configure research_agent's model to claude-sonnet"])],
    [PlanBlock(sub_tasks=["Update research_agent's model to claude-sonnet"])],
])

execution_client = FakeLLMClient(scripted_responses=[
    [FailureBlock(reason="research_agent already exists")],
    [TextBlock(text="research_agent's model updated to claude-sonnet.")],
])

results = run_plan_execute_replan(planning_client, execution_client, "Set up research_agent with claude-sonnet")
print(results)
```
```
step failed: research_agent already exists -- replanning remaining work
revised plan now has 1 remaining steps
["research_agent's model updated to claude-sonnet."]
```
*(runs live, shows output — read-only demo snippet, not graded)*

`remaining_tasks = list(new_plan.sub_tasks)` — this is the actual
replanning: the *entire remaining plan* gets replaced with a fresh one,
built with the failure's actual reason included as new context, rather
than either retrying the same doomed step or blindly executing a
second step written for a world that turned out not to be true. The
revised plan correctly drops "create" (already unnecessary) in favor of
"update" — genuinely different from the original, because it now
reflects what was actually learned.

---

## Quiz cards

> **Q1.** Why can a step failing in a plan-and-execute agent invalidate
> more than just that one step?
> - A) It never does — only the failed step itself is ever affected
> - B) Later steps in the plan may have been written assuming the failed step's outcome, so they can become invalid too once that assumption turns out to be wrong ✅
> - C) A single failure always invalidates the entire original goal, not just the plan
> - D) This only happens if the plan has more than five steps

> **Q2.** What does replanning actually do, that simply retrying the
> failed step wouldn't?
> - A) Nothing different — replanning and retrying are the same operation
> - B) It calls the planner again, with the failure's actual reason as new context, producing a genuinely revised plan for the remaining work, rather than repeating a step that would just fail again ✅
> - C) Replanning always produces the exact same plan as before
> - D) Replanning skips the remainder of the task entirely

> **Q3.** In the demo, why does the revised plan contain `"Update
> research_agent's model"` instead of the original's `"Create
> research_agent"` followed by `"Configure..."`?
> - A) This is arbitrary and unrelated to the actual failure
> - B) The revised plan was generated with the actual failure reason — the agent already exists — as context, producing steps genuinely appropriate to that new information ✅
> - C) The execution client randomly decided to change the wording
> - D) `"Update"` and `"Create"` are functionally identical in this system

---

## Applied sandbox exercise 2

*(implementing replanning — genuinely graded against a scripted
failure-then-replan sequence)*

*Task shown to learner:* Implement `run_plan_execute_replan` exactly as
shown in this concept — executing a plan's sub-tasks in order, and on
encountering a `"failure"` block, calling `planning_client` again with
the failure reason included, replacing the remaining plan with the
result.

*Hidden test cases:*
```python
planning_client = FakeLLMClient(scripted_responses=[
    [PlanBlock(sub_tasks=["Create support_agent", "Send welcome notification"])],
    [PlanBlock(sub_tasks=["Send update notification instead"])],
])

execution_client = FakeLLMClient(scripted_responses=[
    [FailureBlock(reason="support_agent already exists")],
    [TextBlock(text="Update notification sent.")],
])

results = run_plan_execute_replan(planning_client, execution_client, "Set up support_agent")
assert results == ["Update notification sent."]
assert planning_client.call_count == 2   # the original plan, plus one genuine replan
assert execution_client.call_count == 2   # the failed step, plus the single revised step
```

*Hint (shown on request):* This is this concept's exact function,
unchanged — the failure detection and replanning call happen inside the
`while remaining_tasks:` loop, checking `result_block.type ==
"failure"` before deciding whether to append a result or replace
`remaining_tasks` with a freshly-planned list.

*Correct answer + explanation (shown on failure, if requested):*
```python
def run_plan_execute_replan(planning_client, execution_client, goal: str) -> list:
    plan_response = planning_client.create(messages=[{"role": "user", "content": goal}])
    plan = plan_response.content[0]
    results = []

    remaining_tasks = list(plan.sub_tasks)
    while remaining_tasks:
        sub_task = remaining_tasks.pop(0)
        response = execution_client.create(messages=[{"role": "user", "content": sub_task}])
        result_block = response.content[0]

        if result_block.type == "failure":
            replan_response = planning_client.create(messages=[
                {"role": "user", "content": f"Original goal: {goal}. This happened: {result_block.reason}. What should the remaining steps be?"}
            ])
            new_plan = replan_response.content[0]
            remaining_tasks = list(new_plan.sub_tasks)
        else:
            results.append(result_block.text)
    return results
```
`planning_client.call_count == 2` confirms replanning genuinely
happened — one call for the original plan, one for the revision — and
the final result reflects the *revised* plan's single remaining step,
not the original, now-invalid one.

---

*(End of Concept 5 — final concept section of Lesson 8. This lesson
continues with the outcomes callout, comprehensive quiz, and
comprehensive sandbox — drafted separately.)*
