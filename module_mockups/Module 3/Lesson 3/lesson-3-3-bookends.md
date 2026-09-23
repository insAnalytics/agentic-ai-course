# Shaping What Tools Return

> **You'll be able to**
> - Explain why a tool result costs exactly what any other input costs —
>   context budget and money — and estimate that cost for a real result
> - Cap a tool's result size with an explicit truncation signal, so the
>   model never mistakes partial data for the complete picture
> - Implement offset/limit pagination that lets the model request more
>   only when a task actually needs it
> - Return structured JSON when the model needs to act on specific
>   fields, and know when plain prose is fine
> - Write error messages that tell the model what failed and what to do
>   next, instead of inviting a blind retry

**Why it matters**
[Lesson 1](→ this module, designing tools a model can use well lesson) and [Lesson 2](→ this module, tool schemas and argument validation lesson) were about what goes *into* a tool call. This lesson is about what comes *out* — and the output side is where a lot of real agent failures actually start. An oversized result quietly burns context and money; a silently truncated one leads the model to confidently answer from half the data; a vague error sends it into a retry loop that [Module 2's guards](→ Module 2, termination failure and control lesson) then have to catch. Each of those is a tool-design decision, made once, that shapes every call the agent ever makes to that tool.

This lesson is deliberately light on strategy. Deciding what belongs in the context window at all — summarizing old results, offloading them, loading tools on demand — is a much bigger topic, and it's [Module 4's job](→ this course, the context and memory module). Here the scope is just making each individual tool's output well-behaved.

---

## Comprehensive quiz

*(spans all three concepts, mixed order)*

> **Q1.** Why does a tool result count against the context window the
> same way any other message does?
> - A) It doesn't — tool results are handled separately
> - B) A tool result is ordinary input content, following the exact same token accounting as everything else in the conversation ✅
> - C) Only the first 100 characters are counted
> - D) Tool results are compressed automatically

> **Q2.** Why is the `"showing 3 of 5000"` line essential rather than
> cosmetic?
> - A) It isn't — the truncated data alone is enough
> - B) Without it, the model can't tell the result is incomplete, and may confidently answer from partial data as if it were complete ✅
> - C) It's only needed when `limit` is below 10
> - D) It replaces the need to cap the result

> **Q3.** Why is `"Error: failed"` a poor error message rather than just
> a terse one?
> - A) It doesn't follow Python's exception format
> - B) It gives the model nothing to act on, making a blind retry of the same failing call its most likely next move ✅
> - C) The model never reads error messages
> - D) It's too long

> **Q4.** What does pagination let the model do that plain truncation
> doesn't?
> - A) Nothing — they're identical
> - B) Request more pages only when a task genuinely needs them, instead of being permanently limited to the first slice ✅
> - C) Avoid all token cost
> - D) Retrieve everything in one call regardless of size

> **Q5.** Why is structured tool output produced as JSON *text*?
> - A) Dicts are always slower
> - B) A `tool_result`'s content is text, so structure has to be encoded into that text ✅
> - C) The model can only read JSON
> - D) No real reason

> **Q6.** When is a prose result genuinely fine?
> - A) Never
> - B) When the model will mostly relay it to a user rather than act on specific fields within it ✅
> - C) Only for error messages
> - D) Only for results over 1,000 tokens

> **Q7.** Why does a helpful error message still cap its list of
> available options?
> - A) Python limits lists in strings to five items
> - B) The same result-size discipline applies to errors — a helpful error shouldn't itself become an enormous result ✅
> - C) The model can only handle five options
> - D) Purely cosmetic

> **Q8.** In the paginated tool, why does the last page *not* include a
> continuation message?
> - A) It's a bug
> - B) There's genuinely no more data — a continuation message there would be false, and could send the model looking for pages that don't exist ✅
> - C) Continuation messages are only allowed on the first page
> - D) The model can't read the last page

---

## Comprehensive sandbox

*(applied — one registry search tool that combines all three concepts:
bounded results, pagination, structured output, and an actionable
error)*

*Task shown to learner:* Implement `search_agents_by_model(model: str,
registry: dict, offset: int = 0, limit: int = 2) -> str`. It returns
JSON text with this exact shape:

```json
{"model": "...", "agents": ["...", "..."], "total": 5, "next_offset": 2}
```

- `agents` is the page of matching agent names (in registry order),
  from `offset`, at most `limit` long
- `total` is the total number of matches across all pages
- `next_offset` is the offset for the next page, or `null` (Python
  `None`) if this is the last page
- If *no* agents match at all, return an error string starting with
  `"Error:"` that names the model searched for and lists the distinct
  models that *do* exist in the registry

*Hidden test cases:*
```python
import json

registry = {
    "a1": {"model": "claude-haiku"},
    "a2": {"model": "claude-sonnet"},
    "a3": {"model": "claude-haiku"},
    "a4": {"model": "claude-haiku"},
    "a5": {"model": "claude-opus"},
}

page_1 = json.loads(search_agents_by_model("claude-haiku", registry, offset=0, limit=2))
assert page_1 == {"model": "claude-haiku", "agents": ["a1", "a3"], "total": 3, "next_offset": 2}

page_2 = json.loads(search_agents_by_model("claude-haiku", registry, offset=2, limit=2))
assert page_2 == {"model": "claude-haiku", "agents": ["a4"], "total": 3, "next_offset": None}

error = search_agents_by_model("gpt-5", registry)
assert error.startswith("Error:")
assert "gpt-5" in error
assert "claude-sonnet" in error and "claude-opus" in error
```

*Hint (shown on request):* Build the full list of matches first with a
list comprehension over `registry.items()`, then slice it
`[offset:offset + limit]` for the page — [the same slicing from Concept 2's pagination](→ this lesson, truncation and pagination concept). `next_offset` is `offset + limit` when that's still less than `total`, otherwise `None` — `json.dumps` turns `None` into JSON `null` automatically. For the error, a set comprehension over the registry's `model` values gives the distinct models.

*Correct answer + explanation (shown on failure, if requested):*
```python
import json

def search_agents_by_model(model: str, registry: dict, offset: int = 0, limit: int = 2) -> str:
    matches = [name for name, info in registry.items() if info["model"] == model]

    if not matches:
        existing_models = sorted({info["model"] for info in registry.values()})
        return (
            f"Error: no agents use model '{model}'. "
            f"Models in use: {', '.join(existing_models)}."
        )

    total = len(matches)
    page = matches[offset:offset + limit]
    next_offset = offset + limit if offset + limit < total else None

    return json.dumps({"model": model, "agents": page, "total": total, "next_offset": next_offset})
```
Every piece of this lesson is doing real work: the page is bounded by
`limit` (Concept 1's cost concern); `total` and `next_offset` tell the
model exactly how much exists and how to get more, so partial data is
never mistaken for complete (Concept 2); the whole result is parseable
JSON with labeled fields the model can act on directly, including a
`next_offset` it can pass straight back into its next call (Concept 3);
and the error names the failed search and shows what *would* work.
`sorted(...)` on the set of models just makes the error's output order
stable — sets have no guaranteed order, and a stable message is easier
to test and to read.
