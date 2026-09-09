# Module 0, Lesson 4 — Concept 4: Dunder methods

---

## What "dunder" means, and why `print()` doesn't already work

You've been writing `__init__` since the start of this lesson without a
formal explanation of the naming — **dunder** is short for "double
underscore," and Python reserves this naming pattern (`__name__`) for a
set of special methods it calls automatically in specific situations,
rather than ones you call directly by name. `__init__` is one dunder
method among many; this section covers the ones that matter most day to
day.

A fresh class, with no dunders defined beyond `__init__`, prints something
not very useful:

```python
class Agent:
    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model

agent = Agent("research_agent", "claude-sonnet")
print(agent)
```
```
<__main__.Agent object at 0x7f8a2c1b3d90>
```
*(runs live, shows output — read-only demo snippet, not graded)*

That's Python's default object representation — the class name and a
memory address, not remotely useful for debugging or logging. Dunder
methods are how you tell Python what your own objects should do in
situations like this one.

---

## `__str__` — what `print()` and `str()` show

Defining `__str__` controls what `print(agent)` and `str(agent)` display,
replacing that default representation with something meaningful:

```python
class Agent:
    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model

    def __str__(self):
        return f"Agent({self.name}, running {self.model})"

agent = Agent("research_agent", "claude-sonnet")
print(agent)
print(str(agent))
```
```
Agent(research_agent, running claude-sonnet)
Agent(research_agent, running claude-sonnet)
```
*(runs live, shows output — read-only demo snippet, not graded)*

You never call `agent.__str__()` directly — `print()` and `str()` call it
for you, automatically, the moment they receive an object of this class.
This is the core pattern behind every dunder method: you define the
method, but something *else* in Python triggers it, at the right moment,
without you invoking it by name.

---

## `__repr__` — the developer-facing version

`__repr__` is a second, related method with a different audience:
`__str__` is meant for a human reading output (like a `print()` in a UI or
a log line), while `__repr__` is meant for a developer debugging — ideally
unambiguous enough that, in principle, `eval(repr(obj))` could recreate an
equal object. It's what shows up in a REPL when you type a variable name
with no `print()`, and it's what you get when `__str__` isn't defined:

```python
class Agent:
    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model

    def __repr__(self):
        return f"Agent(name={self.name!r}, model={self.model!r})"

agent = Agent("research_agent", "claude-sonnet")
print(repr(agent))
print([agent])   # a list's own repr calls repr() on each item inside it, not str()
```
```
Agent(name='research_agent', model='claude-sonnet')
[Agent(name='research_agent', model='claude-sonnet')]
```
*(runs live, shows output — read-only demo snippet, not graded)*

`!r` inside the f-string forces `repr()` on that specific value rather
than `str()` — worth using here since it makes `self.name` show as
`'research_agent'` with quotes, matching how you'd actually type a string
literal in code, which is the whole point of `__repr__`'s "could recreate
this" spirit.

If you define only one of the two, define `__repr__` — it's the fallback
Python reaches for automatically if `__str__` is missing (as the earlier
default `<__main__.Agent object at 0x...>` output actually *was* — that's
`object`'s own default `__repr__`, which every class inherits unless
overridden). Defining `__str__` alone leaves debugging contexts
(a REPL, a list of objects, a debugger) stuck with the unhelpful default.

---

## `__eq__` — what `==` means for your objects

By default, `==` between two instances checks whether they're the *same
object in memory* — identical to Java's default `.equals()` behavior
before it's overridden, or JS's `===` on objects:

```python
class Agent:
    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model

agent_a = Agent("research_agent", "claude-sonnet")
agent_b = Agent("research_agent", "claude-sonnet")

print(agent_a == agent_b)   # same data, but different objects
print(agent_a == agent_a)
```
```
False
True
```
*(runs live, shows output — read-only demo snippet, not graded)*

Even though `agent_a` and `agent_b` hold identical data, `==` says they're
unequal — by default it's really asking "are these the exact same object,"
not "do these hold the same values." Defining `__eq__` lets you specify
what equality should actually mean for this class:

```python
class Agent:
    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model

    def __eq__(self, other):
        return self.name == other.name and self.model == other.model

agent_a = Agent("research_agent", "claude-sonnet")
agent_b = Agent("research_agent", "claude-sonnet")

print(agent_a == agent_b)
```
```
True
```
*(runs live, shows output — read-only demo snippet, not graded)*

`__eq__` takes `self` and `other` — `other` is whatever's on the right
side of `==`, and you decide what makes the two equal. `agent_a == agent_b`
is really Python calling `agent_a.__eq__(agent_b)` behind the scenes,
following the same automatic-trigger pattern as `__str__` and `__repr__`.

---

## Operators are just dunder methods in disguise

`__eq__` generalizes to something worth naming explicitly: most Python
operators you already use every day — `==`, `+`, `<`, `in`, and more — are
themselves just dunder method calls, dispatched automatically based on the
operator used. `a + b` is `a.__add__(b)`; `a < b` is `a.__lt__(b)`. This
lesson only covers `__eq__` in depth (the one that matters most for
everyday agent code — comparing two tool calls, two config objects), but
the pattern is general: any operator's behavior on your own class can be
customized by defining the matching dunder.

```python
class Agent:
    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model

    def __eq__(self, other):
        return self.name == other.name and self.model == other.model

agent_a = Agent("research_agent", "claude-sonnet")
agent_b = Agent("research_agent", "claude-sonnet")

print(agent_a.__eq__(agent_b))   # what == actually calls, under the hood
print(agent_a == agent_b)        # identical result, normal usage
```
```
True
True
```
*(runs live, shows output — read-only demo snippet, not graded)*

You'd never actually write `.__eq__(...)` directly in real code — this is
only to make the underlying mechanism visible once, the same way
`greet = shout(greet)` made the decorator mechanism visible in [the decorator concept earlier in this lesson](→ this lesson, decorators concept, the manual reassignment example) before switching to the `@` syntax you'd actually use.

---

## Quiz cards

> **Q1.** What does Python print for an object with no `__str__` or
> `__repr__` defined?
> - A) An empty string
> - B) A default representation showing the class name and a memory address ✅
> - C) `None`
> - D) `SyntaxError` — every class must define `__str__`
>
> *Explanation: this default comes from `object`, the base every class
> inherits from, and it's what defining `__str__`/`__repr__` replaces.*

> **Q2.** What actually calls `__str__` — do you invoke it directly?
> - A) Yes, you must call `agent.__str__()` yourself
> - B) No — `print()` and `str()` call it automatically when given an instance of your class ✅
> - C) `__str__` runs once automatically when the object is created
> - D) It's called every time any attribute is accessed
>
> *Explanation: like every dunder method, `__str__` is triggered
> automatically by something else (here, `print()`/`str()`) — you define
> it, but don't call it by name in normal usage.*

> **Q3.** What's the main audience difference between `__str__` and
> `__repr__`?
> - A) There's no real difference, they're interchangeable
> - B) `__str__` is for human-readable output; `__repr__` is meant to be unambiguous enough for debugging, ideally close to something that could recreate the object ✅
> - C) `__repr__` is only used internally by Python and never customizable
> - D) `__str__` is required, `__repr__` is optional
>
> *Explanation: `__str__` targets a reader (like a log line); `__repr__`
> targets a developer debugging, which is also why it's the fallback used
> when `__str__` is missing.*

> **Q4.** If a class defines `__repr__` but not `__str__`, what does
> `print()` show?
> - A) The default `<...object at 0x...>` representation
> - B) `__repr__`'s output — it's the fallback Python uses when `__str__` isn't defined ✅
> - C) An error, since `__str__` is required
> - D) An empty string
>
> *Explanation: Python falls back to `__repr__` when `__str__` is absent,
> which is why defining `__repr__` alone still improves `print()` output.*

> **Q5.** Without `__eq__` defined, what does `agent_a == agent_b` actually
> check, given two separately-created instances with identical data?
> - A) Whether all attributes match
> - B) Whether they're the exact same object in memory — not whether their data matches ✅
> - C) It always returns `True` for instances of the same class
> - D) It raises a `TypeError`
>
> *Explanation: default equality is identity-based (same object in
> memory), the same as Java's default `.equals()` before overriding — not
> a value comparison, even if the data inside looks identical.*

> **Q6.** What is `agent_a == agent_b` actually doing under the hood, once
> `__eq__` is defined on the class?
> - A) Comparing memory addresses regardless of `__eq__`
> - B) Calling `agent_a.__eq__(agent_b)` and using its return value ✅
> - C) Calling `__eq__` on both sides and requiring both to return `True`
> - D) `==` never uses `__eq__` for custom classes
>
> *Explanation: `==` dispatches to `__eq__` automatically — this is the
> same "operator calls a dunder method" pattern that also applies to `+`,
> `<`, and others.*

---

## Applied sandbox exercise 4

*(composing __init__, __eq__, and __repr__ on one class)*

*Starter code shown to learner:*
```python
class ToolCall:
    """
    TODO: implement using __init__, __eq__, and __repr__.

    __init__(self, tool_name: str, arguments: dict):
      - store both as instance attributes

    __eq__(self, other):
      - two ToolCalls are equal if tool_name AND arguments both match

    __repr__(self):
      - return exactly: "ToolCall(tool_name, arguments)"
        e.g. ToolCall("search", {"query": "weather"}) -> repr is:
        "ToolCall('search', {'query': 'weather'})"
        (use !r on both values inside the f-string)
    """
    # TODO: implement
    pass
```

*Task shown to learner:* Implement `__init__` to store `tool_name` and
`arguments`, `__eq__` to compare both fields between two `ToolCall`
instances, and `__repr__` to return a string in the exact format shown,
using `!r` so both values are formatted the way they'd appear as Python
literals.

*Hidden test cases:*
```python
call_a = ToolCall("search", {"query": "weather"})
call_b = ToolCall("search", {"query": "weather"})
call_c = ToolCall("search", {"query": "news"})

assert call_a == call_b
assert not (call_a == call_c)
assert repr(call_a) == "ToolCall('search', {'query': 'weather'})"
```

*Hint (shown on request):* `__eq__` should return
`self.tool_name == other.tool_name and self.arguments == other.arguments`
— dict equality (`==` on two dicts) already checks all keys/values match,
no manual loop needed. `__repr__`'s f-string is
`f"ToolCall({self.tool_name!r}, {self.arguments!r})"`.

*Correct answer + explanation (shown on failure, if requested):*
```python
class ToolCall:
    def __init__(self, tool_name: str, arguments: dict):
        self.tool_name = tool_name
        self.arguments = arguments

    def __eq__(self, other):
        return self.tool_name == other.tool_name and self.arguments == other.arguments

    def __repr__(self):
        return f"ToolCall({self.tool_name!r}, {self.arguments!r})"
```
This is the first exercise combining three dunder-adjacent pieces on one
class: instance attributes from `__init__`, value-based equality via
`__eq__` (instead of the default identity check), and a debug-friendly
string via `__repr__` — exactly the trio you'd want on any small data-
holding class in agent code, like a logged tool call you need to compare
or print during debugging.

---

*(End of Concept 4. This lesson continues with Concept 5 — inheritance —
drafted separately.)*
