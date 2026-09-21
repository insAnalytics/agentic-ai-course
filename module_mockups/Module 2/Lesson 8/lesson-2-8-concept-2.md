# Module 2, Lesson 8 — Concept 2: Plan representations — linear, tree, and dependency graph

---

## Linear: the shape already used in Concept 1

[Concept 1's `PlanBlock`](→ this lesson, goal decomposition concept) was already a **linear** plan — a flat, ordered list, each step happening strictly after the one before it. This is the simplest representation, and fits any task whose steps genuinely have to happen in a fixed sequence.

---

## Tree: sub-goals with their own sub-steps

A **tree** representation lets a sub-goal itself decompose further — a
recursive, branching structure rather than a flat list:

```python
plan_tree = {
    "task": "Set up the support team",
    "sub_tasks": [
        {"task": "Create research_agent", "sub_tasks": []},
        {"task": "Create support_agent", "sub_tasks": []},
    ],
}
```

Each node is the same shape — a `task` and its own `sub_tasks` — which
is what makes it genuinely tree-shaped rather than just a nested list:
any sub-task could itself have further sub-tasks, at any depth.

---

## Dependency graph: prerequisites, not strict sequence

Neither a strict linear order nor a strict hierarchy captures every
real planning situation. A **dependency graph** represents each task's
actual *prerequisites* — tasks that genuinely have no ordering
constraint relative to each other can run in either order, or even
concurrently, while a task depending on several others waits for all of
them:

```python
dependency_graph = {
    "create_research_agent": [],
    "create_support_agent": [],
    "verify_team_setup": ["create_research_agent", "create_support_agent"],
}

def compute_execution_order(dependency_graph: dict) -> list:
    order = []
    remaining = dict(dependency_graph)
    while remaining:
        ready = [task for task, deps in remaining.items() if all(dep in order for dep in deps)]
        if not ready:
            raise ValueError("circular dependency detected -- no task is ready to run")
        for task in ready:
            order.append(task)
            del remaining[task]
    return order

print(compute_execution_order(dependency_graph))
```
```
['create_research_agent', 'create_support_agent', 'verify_team_setup']
```
*(runs live, shows output — read-only demo snippet, not graded)*

`create_research_agent` and `create_support_agent` have no dependency
on each other at all — genuinely, they could run in either order,
`ready` correctly identifies both as available on the very first pass.
`verify_team_setup` only becomes ready once *both* have actually
completed — `all(dep in order for dep in deps)` is what enforces that.
This is the real payoff a dependency graph offers that neither a
strict linear list nor a strict tree provides directly: independent
work is genuinely identified as independent, opening the door to
running it concurrently — [the exact same opportunity Module 1's async concepts were built around](→ Module 1, the training pipeline lesson) — rather than being forced into an arbitrary fixed order that was never actually required.

---

## Quiz cards

> **Q1.** What makes a plan representation genuinely "tree-shaped,"
> rather than just a flat list?
> - A) It uses a Python `list` instead of a `dict`
> - B) Any sub-task can itself have its own further sub-tasks, at any depth, following the same recursive shape ✅
> - C) It always has exactly two branches
> - D) Tree representations can never be converted to any other format

> **Q2.** What does `dependency_graph["verify_team_setup"] =
> ["create_research_agent", "create_support_agent"]` actually express?
> - A) That `verify_team_setup` must run before either of the other two tasks
> - B) That `verify_team_setup` can only run once both `create_research_agent` and `create_support_agent` have already completed ✅
> - C) That all three tasks must run in strict alphabetical order
> - D) That the three tasks are entirely unrelated to each other

> **Q3.** In `compute_execution_order`, what does
> `all(dep in order for dep in deps)` actually check?
> - A) Whether the task itself has already been added to the order
> - B) Whether every one of a task's prerequisites has already been added to `order`, meaning that task is now genuinely ready to run ✅
> - C) Whether the dependency graph contains any circular dependencies
> - D) Whether `deps` is an empty list

> **Q4.** What real capability does a dependency graph unlock, that a
> strict linear plan doesn't?
> - A) Nothing — both representations are functionally identical
> - B) Genuinely independent tasks can be identified as such, opening the door to running them concurrently rather than an arbitrary fixed sequence ✅
> - C) Dependency graphs can never actually be executed
> - D) A dependency graph always executes faster regardless of the actual task structure

---

## Applied sandbox exercise 1

*(implementing dependency-graph execution ordering — genuinely graded
against a different graph, checking relative ordering constraints
rather than one exact sequence, since multiple valid orderings can
exist)*

*Task shown to learner:* Given this dependency graph for a document
publishing task:
```python
publish_graph = {
    "write_draft": [],
    "review_draft": ["write_draft"],
    "add_images": ["write_draft"],
    "publish": ["review_draft", "add_images"],
}
```
implement `compute_execution_order(dependency_graph)`, returning a
valid execution order respecting every dependency.

*Hidden test cases:*
```python
order = compute_execution_order(publish_graph)

assert order.index("write_draft") < order.index("review_draft")
assert order.index("write_draft") < order.index("add_images")
assert order.index("review_draft") < order.index("publish")
assert order.index("add_images") < order.index("publish")
assert len(order) == 4
```

*Hint (shown on request):* This is genuinely this concept's exact
function — a `while remaining:` loop, finding every task whose
dependencies are already satisfied via
`all(dep in order for dep in deps)`, adding all such ready tasks each
pass. `review_draft` and `add_images` have no dependency on each other,
so either could legitimately come first — the test checks relative
ordering against dependencies, not one single expected sequence.

*Correct answer + explanation (shown on failure, if requested):*
```python
def compute_execution_order(dependency_graph: dict) -> list:
    order = []
    remaining = dict(dependency_graph)
    while remaining:
        ready = [task for task, deps in remaining.items() if all(dep in order for dep in deps)]
        if not ready:
            raise ValueError("circular dependency detected -- no task is ready to run")
        for task in ready:
            order.append(task)
            del remaining[task]
    return order
```
`write_draft` has no dependencies, so it's always first. `review_draft`
and `add_images` both depend only on `write_draft`, so they become
ready together — in either relative order — and `publish` only becomes
ready once both have completed. The test checks exactly the
constraints that actually matter, not an arbitrary single "correct"
sequence.

---

*(End of Concept 2. This lesson continues with Concept 3 — Tree of
Thought as a plan-search variant — drafted separately.)*
