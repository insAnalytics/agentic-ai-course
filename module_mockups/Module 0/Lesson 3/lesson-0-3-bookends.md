# Build Reusable Functions and Modular Code

> **You'll be able to**
> - Write functions with type hints and docstrings that later tool-calling
>   frameworks can generate schemas and descriptions from
> - Use `*args`/`**kwargs` to build wrappers that forward calls without
>   needing to know a function's exact signature
> - Reason correctly about local, global, and closure scope — including the
>   mutable default argument trap — and know when a closure is a lighter
>   alternative to a class
> - Use `lambda`, `map`, `filter`, and `sorted(..., key=...)` where they
>   genuinely fit, and comprehensions where idiomatic Python actually
>   prefers them
> - Split code across multiple files with imports, and control what runs on
>   direct execution vs. import with `if __name__ == "__main__":`

**Why it matters**
Agent code is built almost entirely out of functions being passed around,
wrapped, and forwarded — a tool is a function, a callback is a function, a
factory that configures a tool is a closure returning a function. Getting
comfortable with how Python passes, scopes, and organizes functions across
files is what makes the framework-specific code later in this course
readable instead of mysterious.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

> **Q1.** Why does a function's docstring matter more in this course than
> it might elsewhere?
> - A) It doesn't — it's just a style convention here too
> - B) Tool-calling frameworks later in the course often use a function's docstring as the description an LLM sees ✅
> - C) Python requires a docstring for every function to run
> - D) It's only used by `help()` and nothing else

> **Q2.** What does `*args` collect into, inside a function definition?
> - A) A dict
> - B) A tuple ✅
> - C) A list
> - D) A set

> **Q3.** A function reassigns a variable that also exists outside it,
> without using `global`. What happens?
> - A) The outer variable is updated
> - B) A new local variable is created instead — the outer one is untouched ✅
> - C) `SyntaxError`
> - D) Both variables merge into one

> **Q4.** Why is `def add_tool(tool, tools=[]):` considered dangerous?
> - A) Lists can't be function parameters
> - B) The default list is created once at definition time and silently shared across every call that doesn't pass its own ✅
> - C) `tools` will always be empty
> - D) It raises a `TypeError` immediately

> **Q5.** What does a closure "close over"?
> - A) Global variables only
> - B) Variables from its enclosing function's scope, remembered even after that outer function has returned ✅
> - C) Only its own parameters
> - D) Nothing — this isn't a real Python feature

> **Q6.** In `sorted(items, key=lambda x: x[1])`, what determines the sort
> order?
> - A) The items themselves, compared directly
> - B) Whatever `x[1]` evaluates to for each item — that's what's actually compared ✅
> - C) Alphabetical order of variable names
> - D) The order items appear in `items`

> **Q7.** Between a comprehension and `map()`/`filter()` with a `lambda`,
> which does idiomatic Python generally favor?
> - A) `map()`/`filter()`, always
> - B) A comprehension, in most cases ✅
> - C) Neither — a plain loop is always preferred
> - D) There's no real convention

> **Q8.** What determines whether `__name__` equals `"__main__"` in a given
> file?
> - A) The filename itself
> - B) Whether that file was run directly, versus imported by another file ✅
> - C) Whether the file contains a `class`
> - D) It's always `"__main__"` regardless of context

---

## Comprehensive sandbox

*(end of lesson, applied — combines all five concepts across two files:
type hints/docstrings, closures with `nonlocal`, `*args`/`**kwargs` with
`func.__name__`, `lambda`+`sorted`, dict tallying, list slicing, and the
module split itself.)*

*Starter code shown to learner — two file tabs:*

**Tab: `tool_stats.py`**
```python
def make_stats_tracker():
    """
    Return a function `track(name)` that, each time it's called:
      - increments a running count for `name` in an internal dict
      - returns the current usage dict (name -> count) after recording it
    Use a closure with `nonlocal` to keep the dict between calls.
    """
    # TODO: implement using a closure
    pass


def top_tools(usage: dict, n: int = 1) -> list:
    """
    usage: dict mapping tool name -> call count.
    Return the top `n` tool names by call count, descending.
    """
    # TODO: implement using sorted() with a lambda key
    pass


def call_tracked(track, func, *args, **kwargs):
    """
    Record a call to func (by name) using track, then call func with
    the given args/kwargs and return its result.
    """
    # TODO: implement using *args/**kwargs forwarding and func.__name__
    pass
```

**Tab: `main.py`** *(a working demo you can run — not separately graded)*
```python
from tool_stats import make_stats_tracker, top_tools, call_tracked

def search(query):
    return f"results for {query}"

def calculate(expr):
    return eval(expr)

track = make_stats_tracker()

print(call_tracked(track, search, "python"))
print(call_tracked(track, search, "agents"))
usage = call_tracked(track, calculate, "2 + 2")

final_usage = track("__snapshot__")
print(final_usage)
print(top_tools(final_usage, 2))
```

*Task shown to learner:* Implement all three functions in `tool_stats.py`.
`main.py` is provided as a working example you can run to see them
operate together once implemented.

*Hidden test cases (imported directly from the learner's `tool_stats.py`):*
```python
from tool_stats import make_stats_tracker, top_tools, call_tracked

# make_stats_tracker
track = make_stats_tracker()
assert track("search") == {"search": 1}
assert track("search") == {"search": 2}
assert track("calculate") == {"search": 2, "calculate": 1}

# top_tools
usage = {"search": 5, "calculator": 2, "memory": 8}
assert top_tools(usage, 2) == ["memory", "search"]
assert top_tools(usage, 1) == ["memory"]

# call_tracked
track2 = make_stats_tracker()
def add(a, b):
    return a + b
result = call_tracked(track2, add, 3, 4)
assert result == 7
assert track2("check") == {"add": 1, "check": 1}
```

*Hint (shown on request):* For `make_stats_tracker`, keep a dict in the
enclosing scope and use `nonlocal` inside `track` to update it, same
pattern as the counter example earlier in this lesson. For `top_tools`,
`sorted(usage, key=lambda name: usage[name], reverse=True)` sorts the
dict's keys by their values, then slice `[:n]`. For `call_tracked`, call
`track(func.__name__)` first, then `return func(*args, **kwargs)`.

*Correct answer + explanation (shown on failure, if requested):*

**`tool_stats.py`**
```python
def make_stats_tracker():
    """Return a closure that tracks call counts per tool name."""
    usage = {}
    def track(name):
        nonlocal usage
        usage[name] = usage.get(name, 0) + 1
        return usage
    return track


def top_tools(usage: dict, n: int = 1) -> list:
    """Return the top n tool names from usage, by count descending."""
    return sorted(usage, key=lambda name: usage[name], reverse=True)[:n]


def call_tracked(track, func, *args, **kwargs):
    """Record a call to func via track, then call and return its result."""
    track(func.__name__)
    return func(*args, **kwargs)
```

This composes every concept from the lesson: `nonlocal` and closures for
`make_stats_tracker`, the dict tally pattern (`.get(key, 0) + 1`) from
earlier in the module, `lambda` + `sorted(..., key=...)` + list slicing for
`top_tools`, and `*args`/`**kwargs` forwarding with `func.__name__` for
`call_tracked` — all split across two files and connected by an `import`,
exactly like a real small project.
