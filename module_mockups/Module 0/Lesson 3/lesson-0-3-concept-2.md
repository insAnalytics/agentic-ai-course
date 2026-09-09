# Module 0, Lesson 3 — Concept 2: *args and **kwargs

---

## The problem: a function with an unknown number of arguments

Everything so far assumes you know the parameters in advance. But
sometimes you don't — especially when writing code that *forwards* calls to
something else, which comes up constantly in agent code (a wrapper that
logs a tool call, then passes it through unchanged).

```python
def add(a, b):
    return a + b

# What if you wanted a version that works with any number of arguments?
# add(1, 2, 3, 4) — this signature can't support that
```
*(not run live — illustrating the problem, not a working example)*

---

## `*args` — variable positional arguments

`*args` collects any number of positional arguments into a tuple:

```python
def add_all(*args):
    print(args)
    total = 0
    for num in args:
        total += num
    return total

print(add_all(1, 2, 3))
print(add_all(10, 20))
```
```
(1, 2, 3)
10
(10, 20)
30
```
*(runs live, shows output — read-only demo snippet, not graded)*

`args` is just a name by convention, not a keyword; `*numbers` would work
identically. The `*` is what matters — it tells Python "collect any extra
positional arguments here."

---

## `**kwargs` — variable keyword arguments

`**kwargs` does the same thing for keyword arguments, collecting them into
a dict:

```python
def describe_agent(**kwargs):
    print(kwargs)
    for key, value in kwargs.items():
        print(f"{key}: {value}")

describe_agent(name="research_agent", model="claude-sonnet", temperature=0.7)
```
```
{'name': 'research_agent', 'model': 'claude-sonnet', 'temperature': 0.7}
name: research_agent
model: claude-sonnet
temperature: 0.7
```
*(runs live, shows output — read-only demo snippet, not graded)*

This is exactly the dict iteration pattern you saw when working with
dicts — `.items()` unpacked as `key, value` — applied here to arguments the
function didn't know in advance it would receive.

---

## Combining regular parameters with both

The order is fixed: regular parameters, then `*args`, then `**kwargs`:

```python
def create_tool(name, *args, **kwargs):
    print(f"name: {name}")
    print(f"extra positional: {args}")
    print(f"extra keyword: {kwargs}")

create_tool("search", "web", "cached", timeout=30, retries=2)
```
```
name: search
extra positional: ('web', 'cached')
extra keyword: {'timeout': 30, 'retries': 2}
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Why this matters for agent code: forwarding calls

The most common real use isn't "accept unlimited arguments" for its own
sake — it's writing a wrapper that doesn't need to know a function's exact
signature to pass a call through it:

```python
def logged_call(func, *args, **kwargs):
    print(f"calling {func.__name__} with args={args}, kwargs={kwargs}")
    result = func(*args, **kwargs)
    print(f"result: {result}")
    return result

def multiply(a, b):
    return a * b

logged_call(multiply, 3, 4)
```
```
calling multiply with args=(3, 4), kwargs={}
result: 12
```
*(runs live, shows output — read-only demo snippet, not graded)*

`*args` and `**kwargs` also work in reverse, at the *call* site:
`func(*args, **kwargs)` unpacks the tuple and dict back out into individual
arguments, rather than passing them as one tuple and one dict. This pattern
— wrap any function, forward its call, add behavior around it — is exactly
the shape of tool-calling middleware you'll build later in this course.

---

## Quiz cards

> **Q1.** What data type does `*args` collect its values into?
> - A) A list
> - B) A tuple ✅
> - C) A dict
> - D) A set
>
> *Explanation: `*args` gathers extra positional arguments into a tuple.*

> **Q2.** What data type does `**kwargs` collect its values into?
> - A) A tuple
> - B) A dict ✅
> - C) A list
> - D) A set
>
> *Explanation: `**kwargs` gathers extra keyword arguments into a dict,
> keyed by argument name.*

> **Q3.** In `def create_tool(name, *args, **kwargs):`, what's the
> required order of these three?
> - A) Any order works
> - B) Regular parameters first, then `*args`, then `**kwargs` ✅
> - C) `**kwargs` must always come first
> - D) `*args` and `**kwargs` can't be used together
>
> *Explanation: Python requires this specific order in a function
> signature.*

> **Q4.** In `func(*args, **kwargs)` at a *call* site (not a function
> definition), what does the `*`/`**` do?
> - A) The same thing as in a definition — collects arguments
> - B) The opposite — unpacks a tuple/dict back into individual arguments ✅
> - C) Nothing, it's ignored at call sites
> - D) Raises a `SyntaxError`
>
> *Explanation: at a call site, `*`/`**` spread a tuple/dict back out into
> separate arguments — the reverse of what they do in a definition.*

> **Q5.** Why is `*args`/`**kwargs` particularly useful for a function like
> `logged_call` that wraps another function?
> - A) It makes the code run faster
> - B) It lets the wrapper forward any call through to the wrapped function without needing to know its exact parameters in advance ✅
> - C) It's required syntax for calling any function
> - D) It only works with functions that take no arguments
>
> *Explanation: this is the core pattern behind tool-calling middleware —
> wrapping any function without needing to know its signature ahead of
> time.*

---

## Applied sandbox exercise 2

*Starter code shown to learner:*
```python
def call_with_defaults(func, default_kwargs, *args, **kwargs):
    """
    func: a function to call.
    default_kwargs: a dict of default keyword arguments.
    *args: positional arguments to forward to func.
    **kwargs: keyword arguments to forward to func — these should
              override any matching key in default_kwargs.

    Call func with args, and with default_kwargs merged with kwargs
    (kwargs taking priority on overlapping keys). Return the result.
    """
    # TODO: implement using dict merging and argument unpacking
    pass
```

*Task shown to learner:* Merge `default_kwargs` and `kwargs` into one dict
(with `kwargs` values winning on any shared key), then call `func` with
`*args` and the merged dict unpacked as `**`.

*Hidden test cases:*
```python
def greet(name, greeting="Hello", punctuation="!"):
    return f"{greeting}, {name}{punctuation}"

assert call_with_defaults(greet, {"greeting": "Hi"}, "Ava") == "Hi, Ava!"
assert call_with_defaults(greet, {"greeting": "Hi"}, "Ava", greeting="Hey") == "Hey, Ava!"
assert call_with_defaults(greet, {}, "Ava", punctuation="?") == "Hello, Ava?"
```

*Hint (shown on request):* `{**default_kwargs, **kwargs}` merges two dicts
into a new one — this is dict unpacking, similar in spirit to `*args`
unpacking a tuple, but for dicts inside a `{}` literal. Later dicts in
`{**a, **b}` override earlier ones on matching keys. Then call
`func(*args, **merged)`.

*Correct answer + explanation (shown on failure, if requested):*
```python
def call_with_defaults(func, default_kwargs, *args, **kwargs):
    merged = {**default_kwargs, **kwargs}
    return func(*args, **merged)
```
`{**a, **b}` is dict unpacking used to merge two dicts — the same
underlying `**` idea as in a function signature, just used inside a dict
literal here to "spread out" key-value pairs. Combined with
`func(*args, **merged)` forwarding the call, this is the exact pattern
behind middleware that adds default configuration to a tool call.

---

*(End of Concept 2. This lesson continues with Concept 3 — scope — drafted
separately.)*
