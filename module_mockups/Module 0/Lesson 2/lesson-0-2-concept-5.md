# Module 0, Lesson 2 — Concept 5: Comprehensions

---

## The problem comprehensions solve

You've now written this shape of code several times in this module — build
an empty collection, loop, and add to it:

```python
tools = ["calculator", "search", "memory", "planner"]

upper_tools = []
for tool in tools:
    upper_tools.append(tool.upper())

print(upper_tools)
```
```
['CALCULATOR', 'SEARCH', 'MEMORY', 'PLANNER']
```
*(runs live, shows output — read-only demo snippet, not graded)*

This pattern — transform every item in a collection into a new collection —
is extremely common, common enough that Python has dedicated syntax for it.
A **list comprehension** does the same thing in one line:

```python
upper_tools = [tool.upper() for tool in tools]
print(upper_tools)
```
```
['CALCULATOR', 'SEARCH', 'MEMORY', 'PLANNER']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Read it as: "`tool.upper()`, for every `tool` in `tools`." The expression on
the left is what goes *into* the new list; the `for` on the right is where
each item comes from. This is genuinely different from anything in Java or
C++ — the closest analog most people know is JavaScript's `.map()`, but
comprehensions are built into the language's syntax rather than being a
method call.

---

## Adding a filter

You can also filter which items get included, with an `if` at the end:

```python
long_tools = [tool.upper() for tool in tools if len(tool) > 6]
print(long_tools)
```
```
['CALCULATOR']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Read it as: "`tool.upper()`, for every `tool` in `tools`, *if*
`len(tool) > 6`." The loop-and-append equivalent makes clear what's being
compressed:

```python
long_tools = []
for tool in tools:
    if len(tool) > 6:
        long_tools.append(tool.upper())

print(long_tools)
```
```
['CALCULATOR']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Same result, four lines compressed to one. This filtering `if` is different
from a ternary-style if/else inside the expression, which is covered next.

---

## Conditional expression inside a comprehension

A different use of `if` can sit in the *expression* part instead, to choose
between two values — this always needs `else` too, unlike the filter
version above:

```python
labels = ["long" if len(tool) > 6 else "short" for tool in tools]
print(labels)
```
```
['long', 'short', 'short', 'long']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Every item is kept here (this isn't filtering), just labeled differently.
The position of `if` is the tell: `if` *before* `for` picks between two
expressions per item; `if` *after* `for` filters which items are included
at all.

---

## Dict comprehensions

Same idea, building a dict instead of a list — the syntax swaps `[]` for
`{}` and needs a `key: value` pair:

```python
tool_lengths = {tool: len(tool) for tool in tools}
print(tool_lengths)
```
```
{'calculator': 10, 'search': 6, 'memory': 6, 'planner': 7}
```
*(runs live, shows output — read-only demo snippet, not graded)*

This replaces the manual tally-building pattern from Concept 3 in cases
where you're computing one value per item, rather than accumulating a
running count. (The tally-counter pattern itself still needs the manual
loop, since each iteration depends on the *previous* count — a
comprehension builds each entry independently.)

---

## Set comprehensions

Same again, with `{}` but no `:` — just an expression, like a list
comprehension but deduplicated automatically:

```python
tool_first_letters = {tool[0] for tool in tools}
print(tool_first_letters)
```
```
{'c', 's', 'm', 'p'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## When not to use a comprehension

Comprehensions are for *building a new collection from a transformation* —
not for side effects like printing, and not when the logic is complex
enough that cramming it into one line hurts readability more than it helps:

```python
# Fine — simple transformation
squares = [n ** 2 for n in range(5)]

# Bad practice — comprehension used for a side effect, not to build anything
[print(tool) for tool in tools]     # works, but the resulting list is thrown away and unused

# Better as a plain loop — nothing is being built into a new collection
for tool in tools:
    print(tool)
```
*(not run live — illustrating good vs. poor usage, not output-focused)*

---

## Quiz cards

> **Q1.** What does `[tool.upper() for tool in tools]` produce?
> - A) `None`
> - B) A new list with `.upper()` applied to every item in `tools` ✅
> - C) It modifies `tools` in place
> - D) A single uppercased string
>
> *Explanation: a list comprehension builds a brand-new list from the
> transformation; it doesn't mutate the original.*

> **Q2.** In `[x for x in nums if x > 0]`, what does the `if` do?
> - A) Chooses between two expressions per item
> - B) Filters — only items where the condition is true are included in the result ✅
> - C) Nothing, it's ignored
> - D) Raises an error if any item fails the condition
>
> *Explanation: an `if` after the `for` clause filters which source items
> make it into the result at all.*

> **Q3.** In `["big" if x > 10 else "small" for x in nums]`, is any item
> excluded from the result?
> - A) Yes, items where `x <= 10` are dropped
> - B) No — every item is kept, just labeled "big" or "small" ✅
> - C) Only even numbers are kept
> - D) This is invalid syntax
>
> *Explanation: `if`/`else` before the `for` is a conditional expression
> choosing a value per item, not a filter — every item still appears in
> the result.*

> **Q4.** What syntax distinguishes a dict comprehension from a set
> comprehension?
> - A) Dict comprehensions use `[]`, set comprehensions use `{}`
> - B) Dict comprehensions have a `key: value` pair; set comprehensions have a single expression, both inside `{}` ✅
> - C) There's no difference
> - D) Set comprehensions require an `if` clause
>
> *Explanation: both use curly braces, but a dict comprehension needs the
> `key: value` pairing to know what to store against each key.*

> **Q5.** Why is `[print(tool) for tool in tools]` considered poor style,
> even though it runs?
> - A) It's a syntax error
> - B) It uses a comprehension for a side effect (printing) rather than to build a used collection — the resulting list is thrown away ✅
> - C) `print` can't be used inside comprehensions
> - D) It only prints the first item
>
> *Explanation: comprehensions are meant to build a new collection you
> actually use — a plain `for` loop is the right tool when the goal is a
> side effect like printing, not construction.*

---

## Applied sandbox exercise 4

*Starter code shown to learner:*
```python
def available_tool_names(tool_configs):
    """
    tool_configs: a list of dicts, each with at least a "name" key and
    an "enabled" key, e.g. [{"name": "search", "enabled": True}, ...]

    Return a list of the "name" values, but only for entries where
    "enabled" is True.
    """
    # TODO: implement using a single list comprehension
    pass
```

*Task shown to learner:* Use a list comprehension with a filter `if` to
pull out just the names of enabled tools.

*Hidden test cases:*
```python
configs = [
    {"name": "search", "enabled": True},
    {"name": "calculator", "enabled": False},
    {"name": "memory", "enabled": True},
]
assert available_tool_names(configs) == ["search", "memory"]
assert available_tool_names([]) == []
assert available_tool_names([{"name": "x", "enabled": False}]) == []
```

*Hint (shown on request):* The expression is `config["name"]`, the source
is `for config in tool_configs`, and the filter is `if config["enabled"]` —
put them together in that order inside `[ ]`.

*Correct answer + explanation (shown on failure, if requested):*
```python
def available_tool_names(tool_configs):
    return [config["name"] for config in tool_configs if config["enabled"]]
```
This combines dict key access from Concept 3 with the list comprehension
filter pattern from this concept — one line replacing what would otherwise
be a 4-line loop-and-append.

---

*(End of Concept 5 — final concept section of Lesson 0.2. This lesson
continues with the outcomes callout, comprehensive quiz, and comprehensive
sandbox, drafted separately.)*
