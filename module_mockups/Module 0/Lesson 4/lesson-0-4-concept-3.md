# Module 0, Lesson 4 — Concept 3: Decorators, `@staticmethod` and `@classmethod`

---

## What a decorator actually is — a function wrapping a function

Before the `@` syntax, it helps to see what's actually happening
underneath it. A decorator is just a function that takes another function
as input and returns a new function — nothing more exotic than that:

```python
def shout(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return result.upper()
    return wrapper

def greet(name):
    return f"hello, {name}"

greet = shout(greet)   # reassign greet to the wrapped version
print(greet("ava"))
```
```
HELLO, AVA
```
*(runs live, shows output — read-only demo snippet, not graded)*

`shout` takes `greet` in, defines a new function `wrapper` that calls the
original and modifies its result, and returns `wrapper`. Reassigning
`greet = shout(greet)` replaces the original with the wrapped version —
every future call to `greet(...)` actually runs `wrapper(...)`.

The `@` syntax is exactly this pattern, just without writing the
reassignment yourself:

```python
def shout(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return result.upper()
    return wrapper

@shout
def greet(name):
    return f"hello, {name}"

print(greet("ava"))
```
```
HELLO, AVA
```
*(runs live, shows output — read-only demo snippet, not graded)*

`@shout` directly above `def greet(...)` is exactly equivalent to
`greet = shout(greet)` — Python does that reassignment automatically, the
moment `greet` is defined. Nothing about decorators requires the `@`
syntax; it's sugar over a pattern you could write by hand.

---

## Writing a decorator that preserves arbitrary arguments

`wrapper(*args, **kwargs)` above isn't incidental — it's what makes a
decorator reusable across *any* function, regardless of its signature,
using exactly the [forwarding pattern from earlier in the course](→ Module 0, the functions lesson, *args/**kwargs concept, the logged_call example): collect whatever was passed in, forward it through to the wrapped function untouched.

```python
def log_call(func):
    def wrapper(*args, **kwargs):
        print(f"calling {func.__name__} with args={args}, kwargs={kwargs}")
        result = func(*args, **kwargs)
        print(f"{func.__name__} returned {result}")
        return result
    return wrapper

@log_call
def add(a, b):
    return a + b

@log_call
def create_agent(name, model="claude-sonnet"):
    return f"{name} running {model}"

print(add(3, 4))
print(create_agent("research_agent", model="claude-haiku"))
```
```
calling add with args=(3, 4), kwargs={}
add returned 7
7
calling create_agent with args=('research_agent',), kwargs={'model': 'claude-haiku'}
create_agent returned research_agent running claude-haiku
research_agent running claude-haiku
```
*(runs live, shows output — read-only demo snippet, not graded)*

One `@log_call` decorator works transparently on both a two-positional-arg
function and a function with a keyword argument, without being rewritten
for either — this is the same generality `*args`/`**kwargs` gave
`logged_call` as a plain wrapper function; a decorator is that same idea,
just applied via `@` instead of a manual reassignment.

---

## `@staticmethod` — a method that needs neither `self` nor the class

Every method you've written so far takes `self`. Sometimes a function
genuinely belongs inside a class — conceptually grouped with it — but
doesn't need to read or modify any instance or class state at all. That's
what `@staticmethod` is for: it strips `self` out of the method entirely.

```python
class Agent:
    @staticmethod
    def is_valid_name(name: str) -> bool:
        return len(name) > 0 and name.replace("_", "").isalnum()

print(Agent.is_valid_name("research_agent"))
print(Agent.is_valid_name(""))
```
```
True
False
```
*(runs live, shows output — read-only demo snippet, not graded)*

`is_valid_name` doesn't touch `self` anywhere — it's just a validation
function that makes sense grouped with `Agent` rather than floating
free at module level. Note it's called as `Agent.is_valid_name(...)`, with
no instance required at all. Without `@staticmethod`, this breaks:

```python
class Agent:
    def is_valid_name(name: str) -> bool:   # missing @staticmethod
        return len(name) > 0 and name.replace("_", "").isalnum()

print(Agent.is_valid_name("research_agent"))
```
```
Traceback (most recent call last):
  File "script.py", line 5, in <module>
    print(Agent.is_valid_name("research_agent"))
TypeError: Agent.is_valid_name() missing 1 required positional argument: 'name'
```
*(runs live, shows output — read-only demo snippet, not graded)*

Without `@staticmethod`, Python still treats this as a normal instance
method expecting `self` as its first parameter. Called directly on the
class (no instance), there's nothing to fill `self` with — so the single
string you passed gets bound to `self`, leaving `name` with no value at
all. `@staticmethod` is what tells Python "don't do the automatic `self`
binding for this one."

---

## `@classmethod` — a method that needs the class, not an instance

A `classmethod` takes `cls` instead of `self` — it receives the class
itself, not a specific instance. The most common real use: an **alternate
constructor**, building an instance a different way than `__init__`
expects.

```python
class Agent:
    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model

    @classmethod
    def from_config(cls, config: dict):
        return cls(config["name"], config["model"])

agent = Agent.from_config({"name": "research_agent", "model": "claude-sonnet"})
print(agent.name, agent.model)
```
```
research_agent claude-sonnet
```
*(runs live, shows output — read-only demo snippet, not graded)*

`from_config` takes a dict shaped differently than `__init__`'s two
separate arguments, and still produces a normal `Agent` — `cls(...)`
inside a classmethod calls the class's own `__init__`, exactly like
writing `Agent(...)` would, except it works even if this code were
inherited by a subclass (covered later this lesson), where `cls` would
correctly refer to the subclass instead of being hardcoded to `Agent`.

`@classmethod` is also the cleaner, more explicit place to manipulate
class-level state, compared to reaching for `ClassName.variable` inside a
regular instance method — recall
[`Agent.total_created` from earlier in this lesson](→ this lesson, instance vs. class variables concept, the total_created counter example):

```python
class Agent:
    total_created = 0

    def __init__(self, name: str):
        self.name = name
        Agent.total_created += 1

    @classmethod
    def reset_count(cls):
        cls.total_created = 0

Agent("research_agent")
Agent("support_agent")
print(Agent.total_created)

Agent.reset_count()
print(Agent.total_created)
```
```
2
0
```
*(runs live, shows output — read-only demo snippet, not graded)*

`reset_count` needs the class (to reset its shared counter) but no
particular instance — exactly the situation `@classmethod` is for. Inside
it, `cls.total_created` and `Agent.total_created` do the same thing here,
but `cls` is the better habit: it stays correct even if a subclass calls
`reset_count()` on itself later.

---

## Choosing between the three

One class, side by side, makes the decision rule concrete:

```python
class ToolCall:
    total_calls = 0

    def __init__(self, tool_name: str, result: str):
        self.tool_name = tool_name       # needs self — per-instance data
        self.result = result
        ToolCall.total_calls += 1

    def summary(self) -> str:            # needs self — reads instance data
        return f"{self.tool_name} -> {self.result}"

    @classmethod
    def from_raw_response(cls, response: dict):   # needs the class, not an instance
        return cls(response["tool"], response["output"])

    @staticmethod
    def is_valid_tool_name(name: str) -> bool:    # needs neither
        return len(name) > 0
```
*(not run live — illustrating the pattern side by side, not a new output)*

The rule: does it need to read or modify *this specific instance's* data
(`self.name`, `self.result`)? Regular instance method. Does it need the
*class* — building an instance a different way, or touching shared class
state — but not any one instance? `@classmethod`. Does it need neither, and
is just grouped with the class for organization? `@staticmethod`.

---

## Quiz cards

> **Q1.** What is `@my_decorator` above a function definition actually
> equivalent to?
> - A) It has no equivalent, it's special Python-only syntax
> - B) `func = my_decorator(func)` — reassigning the function to the result of the decorator called on it ✅
> - C) Calling `my_decorator()` once at import time and discarding the result
> - D) Wrapping the function in a `try`/`except` automatically
>
> *Explanation: `@` is sugar over `func = decorator(func)` — the decorator
> is just a function that takes a function and returns one.*

> **Q2.** Why does a general-purpose decorator's inner `wrapper` typically
> take `*args, **kwargs` rather than named parameters?
> - A) It's required syntax for all decorators
> - B) So the decorator works on any wrapped function regardless of its specific signature, forwarding whatever was actually passed in ✅
> - C) `*args`/`**kwargs` makes the decorator run faster
> - D) Without it, Python raises a `SyntaxError` on `@`
>
> *Explanation: this is the same forwarding pattern used for wrapping any
> function without knowing its signature in advance — `wrapper` needs to
> accept and pass through anything the real function accepts.*

> **Q3.** Why does calling a plain instance method (no `@staticmethod`)
> directly on the class, like `Agent.is_valid_name("x")`, raise a
> `TypeError` about a missing argument?
> - A) Static-style calls are never allowed on any method
> - B) Python still expects the first parameter to receive an instance (`self`) automatically; with no instance to bind, the argument you passed fills that slot instead, leaving the real parameter empty ✅
> - C) `is_valid_name` isn't a valid method name
> - D) Classes can't have methods that take a single string argument
>
> *Explanation: without `@staticmethod`, the method still expects `self`
> first — calling it with no instance leaves the parameter list short by
> one, absorbing your actual argument into the `self` slot.*

> **Q4.** What does `@staticmethod` remove from a method, compared to a
> normal instance method?
> - A) The method's return value
> - B) The automatic `self` (or `cls`) parameter — the method receives exactly the arguments it's called with, nothing implicit ✅
> - C) The method's docstring
> - D) Access to the class name entirely
>
> *Explanation: `@staticmethod` is specifically what tells Python to skip
> the automatic instance/class binding other methods get.*

> **Q5.** In `Agent.from_config({...})` implemented as a `@classmethod`,
> what does `cls` refer to inside the method?
> - A) The specific dict passed in
> - B) The class itself (`Agent`) — not any particular instance ✅
> - C) `self`, just renamed
> - D) `None`, until an instance is created
>
> *Explanation: `@classmethod` binds the class itself to `cls`, the same
> way an instance method binds an instance to `self`.*

> **Q6.** Why is `cls.total_created = 0` inside a `@classmethod` considered
> better practice than hardcoding `Agent.total_created = 0`?
> - A) There's no real difference, both are equally fine
> - B) `cls` stays correct even if a subclass inherits and calls the method on itself, whereas a hardcoded class name always points at the original class ✅
> - C) `cls` is required syntax and `Agent` would cause a `SyntaxError`
> - D) `cls.total_created` is faster to execute
>
> *Explanation: `cls` refers to whichever class the method was actually
> called on, which matters once inheritance is involved — a hardcoded
> class name doesn't adapt the same way.*

> **Q7.** A method needs to read `self.name` from the current instance.
> Which of the three method types is correct?
> - A) `@staticmethod`
> - B) `@classmethod`
> - C) A regular instance method (`self`, no decorator) ✅
> - D) Any of the three work identically here
>
> *Explanation: needing a specific instance's own data is exactly what a
> regular instance method — taking `self` — is for; `@staticmethod` and
> `@classmethod` don't have access to any particular instance.*

---

## Applied sandbox exercise 2

*(a general-purpose decorator, using `*args`/`**kwargs` forwarding)*

*Starter code shown to learner:*
```python
def count_calls(func):
    """
    Return a decorator that wraps func so that each call increments
    a counter stored as an attribute on the wrapper function itself:
    wrapper.calls (starting at 0, before any calls happen).

    The wrapped function should still work normally otherwise — same
    arguments in, same return value out.
    """
    # TODO: implement using a closure and *args/**kwargs forwarding
    pass
```

*Task shown to learner:* Write `count_calls` as a decorator. Its inner
`wrapper` should forward any arguments to `func` with `*args`/`**kwargs`,
increment a `wrapper.calls` counter each time it's called, and return
`func`'s actual result unchanged.

*Hidden test cases:*
```python
@count_calls
def add(a, b):
    return a + b

assert add(2, 3) == 5
assert add(10, 20) == 30
assert add.calls == 2

@count_calls
def greet(name, greeting="Hi"):
    return f"{greeting}, {name}"

assert greet("Ava") == "Hi, Ava"
assert greet("Sam", greeting="Hello") == "Hello, Sam"
assert greet.calls == 2
assert add.calls == 2   # unaffected by greet's calls — separate wrapper, separate counter
```

*Hint (shown on request):* Start `wrapper.calls = 0` right after defining
`wrapper`, before `return wrapper`. Inside `wrapper`, increment with
`wrapper.calls += 1`, then `return func(*args, **kwargs)` — a plain
function can have attributes set on it just like any other object, so
`wrapper.calls` persists across calls the same way a closure variable
would.

*Correct answer + explanation (shown on failure, if requested):*
```python
def count_calls(func):
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper
```
This combines the general decorator shape from this section with
`*args`/`**kwargs` forwarding — the twist is that `wrapper.calls` is an
attribute on the function object itself rather than a `nonlocal` closure
variable, which works because functions in Python are objects that can
have their own attributes set directly.

---

## Applied sandbox exercise 3

*(staticmethod + classmethod together, composing with class variables from earlier in this lesson)*

*Starter code shown to learner:*
```python
class ToolCall:
    """
    TODO: implement using a class variable, a classmethod, and a
    staticmethod together.

    Class variable:
      total_calls: starts at 0.

    __init__(self, tool_name: str, result: str):
      - store both as instance attributes
      - increment ToolCall.total_calls

    @classmethod from_raw_response(cls, response: dict):
      - response is shaped like {"tool": "search", "output": "3 results"}
      - build and return a ToolCall from it (via cls(...), not ToolCall(...))

    @staticmethod is_valid_tool_name(name) -> bool:
      - return True if name is a non-empty string, False otherwise
      - (a non-string input should return False, not crash)
    """
    # TODO: implement
    pass
```

*Task shown to learner:* Implement `__init__` and the class variable as in
the previous exercise, then add `from_raw_response` as a `@classmethod`
that builds an instance from a differently-shaped dict using `cls(...)`,
and `is_valid_tool_name` as a `@staticmethod` that validates a name without
needing any instance or class state.

*Hidden test cases:*
```python
call = ToolCall.from_raw_response({"tool": "search", "output": "3 results"})
assert call.tool_name == "search"
assert call.result == "3 results"
assert ToolCall.total_calls == 1

call2 = ToolCall.from_raw_response({"tool": "calculator", "output": "4"})
assert ToolCall.total_calls == 2

assert ToolCall.is_valid_tool_name("search") == True
assert ToolCall.is_valid_tool_name("") == False
assert ToolCall.is_valid_tool_name(42) == False
```

*Hint (shown on request):* `from_raw_response` should be a one-liner:
`return cls(response["tool"], response["output"])` — this routes through
the normal `__init__`, so `total_calls` still increments correctly.
`is_valid_tool_name` needs to check the type first — `isinstance(name, str)
and len(name) > 0` handles both the empty-string and non-string cases in
one expression.

*Correct answer + explanation (shown on failure, if requested):*
```python
class ToolCall:
    total_calls = 0

    def __init__(self, tool_name: str, result: str):
        self.tool_name = tool_name
        self.result = result
        ToolCall.total_calls += 1

    @classmethod
    def from_raw_response(cls, response: dict):
        return cls(response["tool"], response["output"])

    @staticmethod
    def is_valid_tool_name(name) -> bool:
        return isinstance(name, str) and len(name) > 0
```
`from_raw_response` demonstrates why `cls(...)` is preferred over hardcoding
`ToolCall(...)` — it still routes through `__init__` normally, so
`total_calls` increments exactly as it would through a direct constructor
call, while `is_valid_tool_name` shows a staticmethod doing pure validation
with no access to (or need for) any instance or class data at all.

---

*(End of Concept 3. This lesson continues with Concept 4 — dunder methods —
drafted separately.)*
