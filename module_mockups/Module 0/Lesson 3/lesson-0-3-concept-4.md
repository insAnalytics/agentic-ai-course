# Module 0, Lesson 3 — Concept 4: lambda, map, and filter

---

## `lambda` — a small, anonymous function

A `lambda` is a function with no name, written as a single expression —
useful when you need a quick function to pass somewhere else, and defining
it with a full `def` would be overkill for something used once:

```python
square = lambda x: x ** 2
print(square(5))
```
```
25
```
*(runs live, shows output — read-only demo snippet, not graded)*

`lambda x: x ** 2` is equivalent to:

```python
def square(x):
    return x ** 2
```

A `lambda` can take multiple arguments, but its body is restricted to a
single expression — no statements, no multiple lines, no `if`/`for` blocks
(though a conditional *expression*, from Lesson 2, is allowed since that's
still one expression):

```python
classify = lambda n: "even" if n % 2 == 0 else "odd"
print(classify(4))
print(classify(7))
```
```
even
odd
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Closing the loop: `sorted(..., key=...)`

Back in Lesson 2, sorting a list of tuples by something other than the
tuple's natural order was deliberately left out because it needed a
concept not yet covered. Now it can be shown properly: `sorted()` accepts a
`key` argument — a function that's applied to each item to decide sort
order, and a `lambda` is almost always what gets passed there:

```python
points = [(1, 5), (8, 2), (4, 9)]

by_x = sorted(points, key=lambda point: point[0])
print(by_x)
```
```
[(1, 5), (4, 9), (8, 2)]
```
*(runs live, shows output — read-only demo snippet, not graded)*

`key=lambda point: point[0]` tells `sorted()` to compare points by their
first element rather than comparing the tuples directly. Without `key`,
`sorted()` would compare whole tuples element-by-element, which isn't what
you want here.

---

## `map()` — apply a function across an iterable

`map(func, iterable)` applies `func` to every item, lazily — it returns a
`map` object, not a list, so you typically wrap it in `list()` to see or
use the results:

```python
prices = [10, 25, 40]
with_tax = list(map(lambda p: p * 1.08, prices))
print(with_tax)
```
```
[10.8, 27.0, 43.2]
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## `filter()` — keep only items where a function returns `True`

Same idea, but for filtering instead of transforming:

```python
scores = [45, 92, 78, 30, 88]
passing = list(filter(lambda s: s >= 60, scores))
print(passing)
```
```
[92, 78, 88]
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## The comprehension equivalent — and which one Python code actually favors

Both of the above can be written as comprehensions, from Lesson 2:

```python
with_tax = [p * 1.08 for p in prices]
passing = [s for s in scores if s >= 60]
```
*(not run live — direct rewrite of the two examples above, same results)*

**In practice, idiomatic Python leans toward comprehensions over
`map`/`filter` in most cases** — they're generally considered more
readable, especially once a `lambda` gets even slightly more complex than a
one-liner. `map`/`filter` still show up in real code in two situations
worth knowing:
- **Passing an existing named function directly**, with no `lambda`
  needed: `map(str.upper, tools)` is arguably cleaner than
  `[tool.upper() for tool in tools]` when the function already exists and
  needs no wrapping.
- **`key=` arguments specifically** (`sorted`, `max`, `min`) — this isn't a
  `map`/`filter` situation at all, but it's the most common place a
  `lambda` earns its keep, as shown above.

```python
tools = ["calculator", "search", "memory"]
print(list(map(str.upper, tools)))
```
```
['CALCULATOR', 'SEARCH', 'MEMORY']
```
*(runs live, shows output — read-only demo snippet, not graded)*

`str.upper` is passed as a reference to the function itself (no
parentheses, no call), which `map` then calls once per item.

---

## Quiz cards

> **Q1.** What's the equivalent `def` form of `lambda x: x ** 2`?
> - A) `def x(): return x ** 2`
> - B) `def square(x): return x ** 2` ✅
> - C) `def square(x): x ** 2`
> - D) There's no equivalent
>
> *Explanation: a `lambda`'s expression is implicitly returned — the `def`
> equivalent needs an explicit `return`.*

> **Q2.** Why can't a `lambda` body contain a `for` loop or an `if`
> statement (not a conditional expression)?
> - A) It can, this is a common misconception
> - B) A `lambda`'s body is restricted to a single expression — statements like loops and `if` blocks aren't expressions ✅
> - C) `lambda` only works with numbers
> - D) `for` and `if` are reserved words that can't appear near `lambda`
>
> *Explanation: a `lambda` can only contain one expression — a conditional
> *expression* (`a if cond else b`) is fine since it's still one
> expression, but statements are not.*

> **Q3.** In `sorted(points, key=lambda point: point[0])`, what does `key`
> control?
> - A) Which items are included in the result
> - B) What value each item is compared by, when deciding sort order ✅
> - C) Whether the sort is ascending or descending
> - D) The data type of the result
>
> *Explanation: `key` maps each item to the value used for comparison,
> without changing the items themselves in the result.*

> **Q4.** What does `map(func, items)` return directly, before wrapping it
> in `list()`?
> - A) A list
> - B) A `map` object — lazy, not yet a list ✅
> - C) A tuple
> - D) `None`
>
> *Explanation: `map()` returns a lazy iterator; `list()` is what actually
> produces a concrete list from it.*

> **Q5.** Given the choice, which does idiomatic Python code more often
> favor: a comprehension, or `map()`/`filter()` with a `lambda`?
> - A) `map()`/`filter()`, always
> - B) A comprehension, in most cases — `map`/`filter` are more common when passing an existing named function with no wrapping needed ✅
> - C) There's no real convention either way
> - D) Comprehensions are being phased out in favor of `map`/`filter`
>
> *Explanation: comprehensions are generally considered more readable in
> Python; `map`/`filter` remain useful mainly for passing an existing
> function directly.*

> **Q6.** In `map(str.upper, tools)`, why is there no `()` after
> `str.upper`?
> - A) It's a typo — this should raise an error
> - B) `str.upper` is being passed as a reference to the function itself, which `map` calls once per item ✅
> - C) `str.upper` is a variable, not a function
> - D) `map` only works with lambdas, never named functions
>
> *Explanation: passing `str.upper` without `()` hands `map` the function
> itself to call later, rather than calling it immediately and passing its
> result.*

---

## Applied sandbox exercise 5

*Starter code shown to learner:*
```python
def sort_tools_by_priority(tools, priority):
    """
    tools: a list of tool name strings, e.g. ["search", "calculator", "memory"]
    priority: a dict mapping tool name -> priority number (lower = higher priority)
              e.g. {"search": 2, "calculator": 1, "memory": 3}

    Return the tools sorted by their priority number, ascending.
    Tools not present in priority should be treated as priority 99.
    """
    # TODO: implement using sorted() with a key
    pass
```

*Task shown to learner:* Use `sorted()` with a `key` lambda that looks up
each tool's priority from the dict, defaulting to `99` for tools not found.

*Hidden test cases:*
```python
priority = {"search": 2, "calculator": 1, "memory": 3}
assert sort_tools_by_priority(["search", "calculator", "memory"], priority) == ["calculator", "search", "memory"]
assert sort_tools_by_priority(["memory", "planner", "search"], priority) == ["search", "memory", "planner"]
assert sort_tools_by_priority([], priority) == []
```

*Hint (shown on request):* The `key` function for each tool should be
`priority.get(tool, 99)` — this combines `.get()` with a default from the
dicts section with a `lambda` here.

*Correct answer + explanation (shown on failure, if requested):*
```python
def sort_tools_by_priority(tools, priority):
    return sorted(tools, key=lambda tool: priority.get(tool, 99))
```
This combines `sorted(..., key=...)` from this section with
`.get(key, default)` from the dicts section — a very common real pattern
for ordering items by an external ranking that might not cover every case.

---

*(End of Concept 4. This lesson continues with Concept 5 — modules and
imports — drafted separately.)*
