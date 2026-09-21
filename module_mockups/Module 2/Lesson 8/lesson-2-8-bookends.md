# Planning and Decomposition

> **You'll be able to**
> - Explain goal decomposition, and how it structurally differs from
>   every reactive loop built earlier in this module
> - Represent a plan as a linear sequence, a tree, or a dependency
>   graph, and compute a valid execution order from a dependency graph
> - Explain Tree of Thought as a search over multiple candidate plans,
>   contrasted directly with single-chain chain-of-thought
> - Name plan-and-execute vs. purely reactive as a deliberate
>   architectural choice, and explain its real predictability/adaptiveness
>   tradeoff
> - Implement replanning — revising the remaining plan, not just
>   retrying a failed step, once new information invalidates an
>   assumption

**Why it matters**
Every loop this module has built so far decides its next move reactively,
one step at a time — this lesson is where the alternative gets built with
the same rigor: real upfront structure, a real way to represent
dependencies rather than forcing an arbitrary order, and a real way to
recover when a plan's own assumptions turn out to be wrong. Knowing when
each approach actually fits — not defaulting to either out of habit — is
the same kind of judgment this course built in Lesson 1 for agents versus
workflows, now one level deeper.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** How does every loop built in Lessons 4–7 decide what to do at
> each step?
> - A) By consulting a plan produced before execution began
> - B) Reactively — deciding only the next step, based on current state, with no advance structure ✅
> - C) By randomly selecting from all available tools
> - D) By asking the user to specify every step manually

> **Q2.** What does `dependency_graph["verify_team_setup"] =
> ["create_research_agent", "create_support_agent"]` actually express?
> - A) That `verify_team_setup` must run before the other two tasks
> - B) That `verify_team_setup` can only run once both other tasks have already completed ✅
> - C) That all three tasks must run in strict alphabetical order
> - D) That the three tasks are entirely unrelated

> **Q3.** What real capability does a dependency graph unlock that a
> strict linear plan doesn't?
> - A) Nothing — both representations are functionally identical
> - B) Genuinely independent tasks can be identified as such, opening the door to running them concurrently ✅
> - C) Dependency graphs can never actually be executed
> - D) A dependency graph always executes faster regardless of structure

> **Q4.** What's the key structural difference between Tree of Thought
> and plain chain-of-thought?
> - A) ToT is just a longer version of the same single reasoning chain
> - B) ToT generates multiple candidates at a decision point, evaluates them, and can abandon unpromising ones, rather than committing to one linear chain ✅
> - C) Plain CoT can already backtrack from a bad early step
> - D) ToT and CoT are unrelated techniques

> **Q5.** When does ToT's extra cost actually earn its keep?
> - A) For every task, regardless of difficulty
> - B) Specifically for problems where an early misstep is hard to recover from in a purely linear chain — overkill for anything plain CoT already handles fine ✅
> - C) Only for tasks involving exactly three candidates
> - D) ToT never provides any real benefit over CoT

> **Q6.** What does plan-and-execute trade away in exchange for
> predictability and foresight?
> - A) Nothing — it's strictly better with no tradeoff
> - B) Adaptiveness — a fixed plan isn't naturally built to notice and adjust to something genuinely unexpected during execution ✅
> - C) The ability to use any tools at all
> - D) The ability to ever produce a final answer

> **Q7.** Why can a step failing in a plan-and-execute agent invalidate
> more than just that one step?
> - A) It never does — only the failed step is ever affected
> - B) Later steps may have been written assuming the failed step's outcome, so they can become invalid too once that assumption turns out wrong ✅
> - C) A single failure always invalidates the entire original goal
> - D) This only happens with plans longer than five steps

> **Q8.** What does replanning actually do that simply retrying the
> failed step wouldn't?
> - A) Nothing different — the two are the same operation
> - B) It calls the planner again with the failure's actual reason as context, producing a genuinely revised plan, rather than repeating a step that would just fail again ✅
> - C) Replanning always produces the exact same plan as before
> - D) Replanning skips the remainder of the task entirely

---

## Comprehensive sandbox

*(end of lesson, applied — a full plan-execute-replan cycle against the
real registry app, combining structured planning, genuine tool
dispatch, and replanning triggered by a real, discovered conflict)*

*Context provided:* `tools.py` unchanged.

*Starter code shown to learner — one file tab:*

**Tab: `plan_execute.py`**
```python
from tools import TOOL_REGISTRY
import tools

def run_plan_execute_replan(planning_client, execution_client, goal: str) -> list:
    """
    TODO: decompose goal via planning_client (a PlanBlock). For each
    sub-task, call execution_client and handle three possible response
    types: "failure" (replan the remainder via planning_client, using
    the failure reason as context), "tool_use" (dispatch via
    TOOL_REGISTRY, append the real tool result), or "text" (append
    directly). Return the list of accumulated results.
    """
    pass
```

*Task shown to learner:* Implement the full cycle, then verify it
against a scenario where the first planned step conflicts with
existing registry state, triggering a genuine replan that succeeds.

*Hidden test cases:*
```python
tools._registry.clear()
tools._registry["research_agent"] = {"model": "claude-sonnet"}

planning_client = FakeLLMClient(scripted_responses=[
    [PlanBlock(sub_tasks=["Create research_agent with claude-sonnet"])],
    [PlanBlock(sub_tasks=["Create research_agent_backup with claude-sonnet"])],
])

execution_client = FakeLLMClient(scripted_responses=[
    [FailureBlock(reason="research_agent already exists")],
    [ToolUseBlock(name="create_agent_entry", input={"name": "research_agent_backup", "model": "claude-sonnet"})],
])

results = run_plan_execute_replan(planning_client, execution_client, "Set up a research agent with claude-sonnet")

assert planning_client.call_count == 2
assert tools._registry["research_agent_backup"] == {"model": "claude-sonnet"}
assert results == ["created agent 'research_agent_backup' with model 'claude-sonnet'"]
```

*Hint (shown on request):* This combines [Concept 5's failure/replan handling](→ this lesson, replanning when a step fails concept) with [Lesson 4's `TOOL_REGISTRY[block.name]` dispatch](→ this module, writing the loop by hand lesson, handling multiple tools a dispatch mechanism concept) — the same `while remaining_tasks:` structure, now with a third branch (`"tool_use"`) that actually calls a real registry tool instead of just recording scripted text.

*Correct answer + explanation (shown on failure, if requested):*
```python
from tools import TOOL_REGISTRY
import tools

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
        elif result_block.type == "tool_use":
            tool_function = TOOL_REGISTRY[result_block.name]
            tool_result = tool_function(**result_block.input)
            results.append(tool_result)
        elif result_block.type == "text":
            results.append(result_block.text)
    return results
```
Every piece of this lesson does real work here: the original plan
assumed `research_agent` didn't exist; execution genuinely discovers it
does; a real replan happens (`planning_client.call_count == 2`
confirms it); and the revised plan's tool call genuinely executes
against `tools.py`, actually creating `research_agent_backup` in the
real registry — not an illustrative result, a real, verified
consequence of the entire plan-execute-replan cycle working correctly
end to end.
