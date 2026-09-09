# Process and Manipulate Data with Python Structures

> **You'll be able to**
> - Store, index, and modify data using Python's core structures — lists,
>   tuples, dicts, and sets — and know which one fits a given situation
> - Read and write the key-value and membership patterns (`.get()` with
>   defaults, the tally pattern, set intersection) that show up constantly
>   in agent state and API payloads
> - Use comprehensions to build lists, dicts, and sets in a single
>   expression instead of a manual loop-and-append

**Why it matters**
Agent state, tool call arguments, and API responses are almost entirely
built from these four structures nested inside each other — a list of
dicts, a dict of tuples, tags stored as a set. Knowing exactly which
structure fits which situation, and being fluent in comprehensions rather
than always reaching for a manual loop, is what makes reading and writing
agent code fast instead of laborious.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** You need a collection that holds exactly three fixed values that
> will never change or grow. Which structure fits best?
> - A) A list
> - B) A tuple ✅
> - C) A dict
> - D) A set

> **Q2.** What does `config.get("timeout", 30)` do if `"timeout"` isn't a
> key in `config`?
> - A) Raises `KeyError`
> - B) Returns `30` ✅
> - C) Returns `None`
> - D) Adds `"timeout": 30` to `config`

> **Q3.** Given `numbers = [10, 20, 30, 40]`, what does `numbers[-2:]`
> return?
> - A) `[30, 40]` ✅
> - B) `[10, 20]`
> - C) `[40]`
> - D) `[20, 30]`

> **Q4.** What does `return x, y` actually return under the hood?
> - A) Two completely separate return values with no shared type
> - B) A single tuple containing both values ✅
> - C) Only `x` — `y` is discarded
> - D) A list

> **Q5.** Why does `{"a", "b", "a"}` only contain two elements?
> - A) It's a syntax error, actually
> - B) Sets automatically discard duplicate values ✅
> - C) Python only keeps the first two items in any set
> - D) `"a"` and `"b"` are being compared alphabetically and one is dropped

> **Q6.** In `[x * 2 for x in nums if x > 0]`, what role does `if x > 0`
> play?
> - A) It picks between two possible expressions for each item
> - B) It filters out items where the condition is false before they're transformed ✅
> - C) It has no effect on the result
> - D) It raises an error for negative numbers

> **Q7.** What's the difference between `[x for x in items]` and
> `{x for x in items}` if `items` contains duplicates?
> - A) No difference
> - B) The list keeps duplicates; the set collapses them to unique values ✅
> - C) The set raises an error on duplicates
> - D) The list also removes duplicates automatically

> **Q8.** Why would `tally[key] = tally.get(key, 0) + 1` fail if written as
> `tally[key] = tally[key] + 1` instead, on a key's first appearance?
> - A) It wouldn't fail, they're identical
> - B) `tally[key]` raises `KeyError` on a key that isn't in the dict yet, before it can be incremented ✅
> - C) `+= 1` is required instead of `+ 1`
> - D) Dicts don't support this pattern at all

---

## Comprehensive sandbox

*(end of lesson, applied — combines all five concepts. Uses only set
union/`set()` rather than a nested comprehension or `.add()`, since neither
has been taught.)*

*Starter code shown to learner:*
```python
def summarize_tools(tool_configs):
    """
    tool_configs: a list of dicts, each shaped like:
        {"name": "search", "tags": ["web", "info"], "enabled": True}

    Return a tuple of exactly three things, in this order:
      1. a sorted list of the names of every enabled tool
      2. a set of every unique tag across ALL tools, enabled or not
      3. a dict mapping each enabled tool's name to how many tags it has

    E.g. for a single enabled tool {"name": "search", "tags": ["web", "info"], "enabled": True}:
      -> (["search"], {"web", "info"}, {"search": 2})
    """
    # TODO: implement using comprehensions, sets, and a tuple return
    pass
```

*Task shown to learner:* Build the three pieces separately — a filtered,
sorted list comprehension for the enabled names; a set built by unioning
each tool's tags together (regardless of `enabled`); and a filtered dict
comprehension counting tags per enabled tool. Return all three as a tuple.

*Hidden test cases:*
```python
configs = [
    {"name": "search", "tags": ["web", "info"], "enabled": True},
    {"name": "calculator", "tags": ["math"], "enabled": False},
    {"name": "memory", "tags": ["state", "info"], "enabled": True},
]
result = summarize_tools(configs)
assert result == (
    ["memory", "search"],
    {"web", "info", "math", "state"},
    {"search": 2, "memory": 2},
)

assert summarize_tools([]) == ([], set(), {})
```

*Hint (shown on request):* Build each piece on its own line before
returning them together. For the tag set, start with `all_tags = set()`
and union in each tool's tags with `all_tags = all_tags | set(config["tags"])`
as you loop — this avoids needing a nested comprehension, which hasn't been
covered.

*Correct answer + explanation (shown on failure, if requested):*
```python
def summarize_tools(tool_configs):
    enabled_names = sorted(
        [config["name"] for config in tool_configs if config["enabled"]]
    )

    all_tags = set()
    for config in tool_configs:
        all_tags = all_tags | set(config["tags"])

    tag_counts = {
        config["name"]: len(config["tags"])
        for config in tool_configs
        if config["enabled"]
    }

    return enabled_names, all_tags, tag_counts
```
This composes every concept in the lesson: a filtered list comprehension +
`sorted()` (Concepts 1 and 5), set union with the `set()` constructor
(Concept 4), a filtered dict comprehension (Concepts 3 and 5), and a tuple
return (Concept 2) — nothing here is new syntax, it's every piece from this
lesson combined.
