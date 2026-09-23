# Module 3, Lesson 3 — Concept 2: Truncation and pagination

---

## The fix for a result that could be huge: cap it, and say so

[Concept 1 showed the real cost of an unbounded result](→ this lesson, why a huge tool result hurts concept) — the fix isn't complicated, but it has to be done carefully: cap the result size, and make it *obvious* to the model that truncation happened, rather than silently dropping data and letting the model reason from an incomplete picture as if it were complete.

```python
def list_all_agents(registry: dict, limit: int = 20) -> str:
    entries = list(registry.items())
    shown = entries[:limit]
    lines = [f"{name}: {info}" for name, info in shown]
    result = "\n".join(lines)
    if len(entries) > limit:
        result += f"\n\n... showing {limit} of {len(entries)} total agents. Use offset to see more."
    return result

huge_registry = {f"agent_{i}": {"model": "claude-sonnet"} for i in range(5000)}
print(list_all_agents(huge_registry, limit=3))
```
```
agent_0: {'model': 'claude-sonnet'}
agent_1: {'model': 'claude-sonnet'}
agent_2: {'model': 'claude-sonnet'}

... showing 3 of 5000 total agents. Use offset to see more.
```
*(runs live, shows output — read-only demo snippet, not graded)*

The explicit `"showing 3 of 5000"` line is the crucial part — without
it, the model has no way to know this isn't the complete list, and
might confidently answer a question ("how many agents are there?") with
a badly wrong number, [exactly the kind of confident-but-wrong output Module 1's hallucination coverage warned about](→ Module 1, how llms generate text lesson, hallucination as a direct consequence concept) — except here the wrongness would come from an incomplete tool result, not the model's own knowledge gap.

---

## Pagination: letting the model ask for more, only if it needs to

```python
def list_all_agents_paginated(registry: dict, offset: int = 0, limit: int = 20) -> str:
    entries = list(registry.items())
    page = entries[offset:offset + limit]
    lines = [f"{name}: {info}" for name, info in page]
    result = "\n".join(lines)
    total = len(entries)
    if offset + limit < total:
        result += f"\n\n... showing {offset}-{offset + len(page)} of {total}. Call again with offset={offset + limit} for more."
    return result

print(list_all_agents_paginated(huge_registry, offset=0, limit=3))
```
```
agent_0: {'model': 'claude-sonnet'}
agent_1: {'model': 'claude-sonnet'}
agent_2: {'model': 'claude-sonnet'}

... showing 0-3 of 5000. Call again with offset=3 for more.
```
*(runs live, shows output — read-only demo snippet, not graded)*

`offset` and `limit` — an ordinary parameter pair, [designed with the same clarity discipline as Lesson 1](→ this module, designing tools a model can use well lesson, parameter design concept) — let the model request additional pages only when a task genuinely needs them, rather than paying the full cost of every result on every call regardless of actual need.

---

## Quiz cards

> **Q1.** Why is the `"showing 3 of 5000"` line essential, not just a
> nice-to-have?
> - A) It isn't essential — the truncated data alone is sufficient
> - B) Without it, the model has no way to know the result is incomplete, risking a confidently wrong answer based on partial data treated as complete ✅
> - C) It's only needed when `limit` is set below 10
> - D) It replaces the need to actually cap the result at all

> **Q2.** What does the pagination version let the model do that plain
> truncation alone doesn't?
> - A) Nothing — the two approaches are functionally identical
> - B) Request additional pages only when a task genuinely needs them, rather than being permanently limited to the first slice ✅
> - C) Bypass the token cost from Concept 1 entirely
> - D) Automatically retrieve every entry in a single call regardless of size

---

## Applied sandbox exercise 1

*(implementing truncation and pagination together, graded)*

*Task shown to learner:* Implement `list_all_agents_paginated(registry,
offset, limit)` exactly as shown, including the continuation message
only when there's genuinely more data beyond the current page.

*Hidden test cases:*
```python
registry = {f"agent_{i}": {} for i in range(10)}

page_1 = list_all_agents_paginated(registry, offset=0, limit=5)
assert "agent_0" in page_1 and "agent_4" in page_1
assert "agent_5" not in page_1
assert "offset=5" in page_1

last_page = list_all_agents_paginated(registry, offset=5, limit=5)
assert "agent_9" in last_page
assert "Call again" not in last_page   # no continuation message -- this is genuinely the last page
```

*Hint (shown on request):* The continuation condition is `offset +
limit < total` — when the *next* page's starting point would still be
within range, there's more data; when it wouldn't be, this is the last
page and no continuation message should appear.

*Correct answer:* the function shown in this concept's demo, unchanged.

---

*(End of Concept 2. This lesson continues with Concept 3 — structured
results and useful error messages — drafted separately.)*
