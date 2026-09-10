# Module 0, Lesson 6 — Concept 4: Custom exceptions and exception hierarchies

---

## What a generic exception loses

Every exception you've raised so far has been a built-in type —
`ValueError`, `TypeError`. That works, but it loses information the
moment more than one thing in your own code can go wrong for different
reasons:

```python
def load_tool_config(raw: dict):
    if "name" not in raw:
        raise ValueError("missing name")
    if "timeout" in raw and raw["timeout"] <= 0:
        raise ValueError("timeout must be positive")
    return raw

try:
    load_tool_config({"timeout": -1})
except ValueError:
    # ...but which problem was it? a missing field, or a bad value?
    # catching ValueError alone can't tell the two apart without
    # inspecting the message string itself
    print("something was wrong with the config")
```
*(not run live — illustrating the problem, not a working demo)*

Both failures raise the exact same exception type — the only way to tell
them apart from the `except` side is parsing the error message's text,
which is fragile and not really what exception types are for.

---

## Defining your own exception

An exception is just a class — specifically, one that inherits from
`Exception` (or one of its subclasses), [the exact inheritance mechanism from the OOP lesson](→ Module 0, the OOP lesson, inheritance concept, the basic syntax explanation). Defining a new one can be as short as one line:

```python
class ToolError(Exception):
    pass

def run_tool(name: str):
    if name != "search":
        raise ToolError(f"unknown tool: {name}")
    return "3 results found"

try:
    run_tool("unknown_tool")
except ToolError as e:
    print(f"tool failed: {e}")
```
```
tool failed: unknown tool: unknown_tool
```
*(runs live, shows output — read-only demo snippet, not graded)*

`class ToolError(Exception): pass` inherits everything `Exception`
already does — including accepting a message and making it available via
`str(e)` — so `ToolError("...")` behaves exactly like `ValueError("...")`
did, just as its own distinct, specifically-named type. Now
`except ToolError:` catches *only* tool-related failures, not any other
`ValueError` that might be raised elsewhere in the same `try` block for a
completely unrelated reason.

---

## Adding your own data to an exception

Since a custom exception is a normal class, it can have its own
`__init__` and carry structured data beyond just a message string — the
same [`super().__init__()` pattern from the OOP lesson](→ Module 0, the OOP lesson, inheritance concept, the super explanation) applies here too:

```python
class ToolError(Exception):
    def __init__(self, tool_name: str, reason: str):
        self.tool_name = tool_name
        self.reason = reason
        super().__init__(f"{tool_name} failed: {reason}")

def run_tool(name: str):
    if name != "search":
        raise ToolError(name, "not a recognized tool")
    return "3 results found"

try:
    run_tool("unknown_tool")
except ToolError as e:
    print(f"failed tool: {e.tool_name}")
    print(f"reason: {e.reason}")
    print(f"full message: {e}")
```
```
failed tool: unknown_tool
reason: not a recognized tool
full message: unknown_tool failed: not a recognized tool
```
*(runs live, shows output — read-only demo snippet, not graded)*

`super().__init__(f"...")` still sets up the message `str(e)` shows, but
`self.tool_name` and `self.reason` are also directly available on the
caught exception — code handling the error can react to `e.tool_name`
programmatically, not just display a string.

---

## Building a small hierarchy

Real code usually has more than one kind of error worth distinguishing —
and those errors are often naturally related, which is exactly what
inheritance is for. A shared base class lets you catch broadly *or*
narrowly, depending on what the calling code actually needs to do:

```python
class AgentError(Exception):
    pass

class ToolError(AgentError):
    pass

class ConfigError(AgentError):
    pass

def run_tool(name: str):
    if name != "search":
        raise ToolError(f"unknown tool: {name}")
    return "3 results found"

def load_config(raw: dict):
    if "model" not in raw:
        raise ConfigError("missing required field: model")
    return raw

try:
    run_tool("unknown_tool")
except AgentError as e:
    print(f"an agent error occurred: {e}")
```
```
an agent error occurred: unknown tool: unknown_tool
```
*(runs live, shows output — read-only demo snippet, not graded)*

`except AgentError:` catches the `ToolError` here, because a `ToolError`
*is an* `AgentError` — the same `isinstance` relationship [covered for your own classes back in the OOP lesson's inheritance concept](→ Module 0, the OOP lesson, inheritance concept, the isinstance explanation), which applies identically to exception classes, since exceptions are just classes like any other. This means calling code has a real choice: catch `ToolError` specifically to handle tool failures one way, catch `ConfigError` specifically for config problems, or catch `AgentError` broadly to handle "anything that went wrong in my own agent code" in one place — all without changing how the exceptions are raised.

This is also exactly [the ordering trap from the Python setup lesson's `ArithmeticError`/`ZeroDivisionError` example](→ Module 0, the Python setup lesson, error handling concept, the except ordering explanation), now with your own classes: an `except AgentError:` listed *before* `except ToolError:` on the same `try` would catch every `ToolError` first, making the more specific clause below it unreachable — the fix is identical too, list the more specific exception type first.

---

## Quiz cards

> **Q1.** What does a custom exception class actually need, at minimum,
> to work as a raisable, catchable exception?
> - A) A fully custom `__init__` — the default is never enough
> - B) Just inheriting from `Exception` (or a subclass of it) — even `class ToolError(Exception): pass` is a complete, working exception type ✅
> - C) A `raise` statement built into the class itself
> - D) It must be defined inside a `try` block
>
> *Explanation: exceptions are ordinary classes — inheriting from
> `Exception` alone gives a class everything needed to be raised and
> caught, with no method overrides required.*

> **Q2.** Why does catching two different failure types with the same
> generic `except ValueError:` make it hard to tell them apart?
> - A) It doesn't — `ValueError` always includes enough detail automatically
> - B) Both failures produce the exact same exception type, so distinguishing them requires parsing the error message text rather than checking the type ✅
> - C) Python doesn't allow catching `ValueError` more than once
> - D) `ValueError` can only be raised once per program
>
> *Explanation: this is the core motivation for custom exception types —
> giving different failure reasons genuinely different, catchable types
> instead of relying on message text.*

> **Q3.** In a custom exception's own `__init__`, why call
> `super().__init__(message)`?
> - A) It's required syntax with no functional effect
> - B) It sets up the exception's base behavior — including what `str(e)` shows — the same way `super().__init__()` sets up inherited behavior on any other class ✅
> - C) It prevents the exception from being caught
> - D) It converts the exception into a warning instead

> **Q4.** Given `class ToolError(AgentError): pass`, what does
> `except AgentError:` do when a `ToolError` is raised?
> - A) It doesn't catch it — only the exact type matches
> - B) It catches it — a `ToolError` is-an `AgentError` through inheritance, the same `isinstance` relationship that applies to any subclass ✅
> - C) It raises a second, unrelated exception
> - D) It only works if `ToolError` has no `__init__` of its own

> **Q5.** If `except AgentError:` is listed before
> `except ToolError:` on the same `try` block, and a `ToolError` is
> raised, which block runs?
> - A) `ToolError`'s block, since it's more specific
> - B) `AgentError`'s block — `except` clauses are checked top to bottom, and the broader type matches first ✅
> - C) Both blocks run
> - D) Neither — it crashes instead
>
> *Explanation: this is the exact same ordering trap from the Python setup
> lesson's `ArithmeticError`/`ZeroDivisionError` example, now applied to a
> custom exception hierarchy — the fix is identical: list specific
> exceptions before general ones.*

> **Q6.** What's the benefit of giving related custom exceptions (like
> `ToolError` and `ConfigError`) a shared base class (`AgentError`)?
> - A) There's no real benefit, it's purely stylistic
> - B) Calling code can choose to catch narrowly (a specific error type) or broadly (the shared base, catching everything related) without changing how the exceptions are raised ✅
> - C) It makes the exceptions raise faster
> - D) It's required — Python doesn't allow unrelated custom exception classes

---

*(End of Concept 4. This lesson continues with Concept 5 — re-raising and
exception chaining — drafted separately.)*
