# Module 0, Lesson 6 — Concept 5: Re-raising and exception chaining

---

## Re-raising: handle something, but let the failure continue

Sometimes you want to *react* to an exception — log it, clean something
up — without actually treating it as handled. A bare `raise`, with no
argument, inside an `except` block re-raises the exact exception that was
just caught, continuing on exactly as if that `except` block wasn't there
at all:

```python
def run_tool(name: str):
    if name != "search":
        raise ValueError(f"unknown tool: {name}")
    return "ok"

def run_with_logging(name: str):
    try:
        return run_tool(name)
    except ValueError:
        print(f"[log] a tool call failed for: {name}")
        raise   # re-raise the same exception — don't swallow it

run_with_logging("unknown_tool")
```
```
[log] a tool call failed for: unknown_tool
Traceback (most recent call last):
  File "script.py", line 11, in <module>
    run_with_logging("unknown_tool")
  File "script.py", line 8, in run_with_logging
    return run_tool(name)
  File "script.py", line 3, in run_tool
    raise ValueError(f"unknown tool: {name}")
ValueError: unknown tool: unknown_tool
```
*(runs live, shows output — read-only demo snippet, not graded)*

The log line prints, and the original `ValueError` still propagates
afterward, uncaught, exactly as it would have without the `try` block at
all — `run_with_logging` observed the failure without hiding it from
whatever called it.

---

## Wrapping in a new exception: the implicit chain

Instead of re-raising the same exception, you can raise a *different*
one — commonly, [a custom exception from the previous section](→ this lesson, custom exceptions and exception hierarchies concept, the defining your own exception explanation), to translate a low-level failure into something more meaningful for whoever's calling your code:

```python
class ConfigError(Exception):
    pass

def load_temperature(raw: dict):
    try:
        return float(raw["temperature"])
    except ValueError:
        raise ConfigError("temperature must be a valid number")

load_temperature({"temperature": "hot"})
```
```
Traceback (most recent call last):
  File "script.py", line 5, in load_temperature
    return float(raw["temperature"])
ValueError: could not convert string to float: 'hot'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "script.py", line 9, in <module>
    load_temperature({"temperature": "hot"})
  File "script.py", line 7, in load_temperature
    raise ConfigError("temperature must be a valid number")
ConfigError: temperature must be a valid number
```
*(runs live, shows output — read-only demo snippet, not graded)*

Notice Python shows *both* tracebacks — the original `ValueError` and the
new `ConfigError` — connected by "During handling of the above exception,
another exception occurred." This happens automatically any time you
raise a new exception from inside an `except` block; Python remembers
what was being handled and shows it for context, even though you never
asked it to.

---

## Making the connection explicit: `raise ... from`

The automatic chaining above is useful, but it can also happen by
accident — any exception raised inside an `except` block gets chained
this way, whether or not the two are actually related. `raise NewError(...)
from original` makes the relationship deliberate and explicit instead,
and produces a clearer message specifically framing it as a cause:

```python
class ConfigError(Exception):
    pass

def load_temperature(raw: dict):
    try:
        return float(raw["temperature"])
    except ValueError as e:
        raise ConfigError("temperature must be a valid number") from e

load_temperature({"temperature": "hot"})
```
```
Traceback (most recent call last):
  File "script.py", line 5, in load_temperature
    return float(raw["temperature"])
ValueError: could not convert string to float: 'hot'

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "script.py", line 9, in <module>
    load_temperature({"temperature": "hot"})
  File "script.py", line 7, in load_temperature
    raise ConfigError("temperature must be a valid number") from e
ConfigError: temperature must be a valid number
```
*(runs live, shows output — read-only demo snippet, not graded)*

"The above exception was the direct cause of the following exception" —
compare that to the plain "During handling of..." from before: `from e`
tells both Python and, more importantly, the next person reading this
traceback that the `ConfigError` isn't incidental, it's a deliberate
translation of that specific `ValueError`. The debugging value is real:
the original low-level cause (a bad string) is preserved right alongside
the higher-level, more meaningful error your code actually raised.

---

## Catching more than one exception type at once

Sometimes several different exception types should be handled the same
way — you've already seen every type get its own separate `except`
clause; a tuple lets one clause catch several types identically:

```python
import json

def load_config_text(text: str):
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return {}

print(load_config_text('{"name": "research_agent"}'))
print(load_config_text("not valid json"))
print(load_config_text(None))
```
```
{'name': 'research_agent'}
{}
{}
```
*(runs live, shows output — read-only demo snippet, not graded)*

`except (json.JSONDecodeError, TypeError):` catches either type with one
block — `json.loads(None)` raises `TypeError` rather than
`JSONDecodeError`, but here both are treated identically, so listing them
in one tuple avoids writing the same `return {}` twice under two separate
`except` clauses.

---

## Quiz cards

> **Q1.** What does a bare `raise`, with no arguments, do inside an
> `except` block?
> - A) It raises a new, generic `Exception`
> - B) It re-raises the exact exception that was just caught, continuing propagation as if the `except` block weren't there ✅
> - C) It silently suppresses the exception
> - D) It's a syntax error — `raise` always requires an argument
>
> *Explanation: a bare `raise` is specifically for "observe this failure,
> then let it continue" — logging or cleanup without actually handling
> the error.*

> **Q2.** If you raise a *different* exception from inside an `except`
> block without using `from`, what does Python do automatically?
> - A) It discards all information about the original exception
> - B) It shows both tracebacks, connected by "During handling of the above exception, another exception occurred" ✅
> - C) It raises a `SyntaxError` instead
> - D) It merges both exceptions into one traceback with no distinction

> **Q3.** What does `raise ConfigError("...") from e` add, compared to
> just `raise ConfigError("...")` with no `from`?
> - A) Nothing functionally different — it's purely a style preference
> - B) It makes the relationship between the two exceptions explicit, producing a clearer "was the direct cause of" message instead of the generic implicit chaining message ✅
> - C) It suppresses the original exception's traceback entirely
> - D) It converts `ConfigError` into a warning

> **Q4.** Given `except (json.JSONDecodeError, TypeError):`, what does
> this catch?
> - A) Only `json.JSONDecodeError`
> - B) Either `json.JSONDecodeError` or `TypeError` — a tuple after `except` catches any of the listed types with one shared block ✅
> - C) Both must occur simultaneously for this to match
> - D) This is invalid syntax

> **Q5.** Why might you deliberately re-raise (or wrap and re-raise) an
> exception rather than just catching it and moving on silently?
> - A) You should always catch and silence every exception you can
> - B) The failure is still real and the caller needs to know about it — logging or translating it doesn't mean it should be hidden from code further up the call stack ✅
> - C) Python requires every `except` block to end in `raise`
> - D) Re-raising is only valid inside a `finally` block

---

## Applied sandbox exercise 2

*(custom exceptions + re-raising with chaining + catching multiple types
together)*

*Starter code shown to learner:*
```python
import json

class AgentError(Exception):
    pass

class ConfigError(AgentError):
    pass

def load_agent_config(path: str) -> dict:
    """
    Read and parse a JSON config file at `path`, returning the parsed dict.

    - If the file doesn't exist (FileNotFoundError), raise ConfigError
      with the message f"config file not found: {path}", chained from
      the original exception using 'from'.
    - If the file exists but isn't valid JSON (json.JSONDecodeError),
      raise ConfigError with the message f"invalid JSON in {path}",
      also chained from the original exception.
    - If parsing succeeds, just return the parsed dict normally.
    """
    # TODO: implement using try/except, custom exceptions, and 'from'
    pass
```

*Task shown to learner:* Open and parse the file at `path`. Catch
`FileNotFoundError` and `json.JSONDecodeError` **separately** (not in one
tuple, since each needs its own message), and in each case raise
`ConfigError` with the specified message, chained with `from` to the
original exception.

*Hidden test cases:*
```python
# setup: "good_config.json" contains valid JSON: {"name": "research_agent"}
# setup: "broken_config.json" contains invalid JSON: {"name": }
# "missing_config.json" does not exist

result = load_agent_config("good_config.json")
assert result == {"name": "research_agent"}

try:
    load_agent_config("missing_config.json")
    assert False, "should have raised"
except ConfigError as e:
    assert "missing_config.json" in str(e)
    assert isinstance(e.__cause__, FileNotFoundError)

try:
    load_agent_config("broken_config.json")
    assert False, "should have raised"
except ConfigError as e:
    assert "broken_config.json" in str(e)
    assert isinstance(e.__cause__, json.JSONDecodeError)

# ConfigError is also catchable as the broader AgentError
try:
    load_agent_config("missing_config.json")
    assert False, "should have raised"
except AgentError:
    pass
```

*Hint (shown on request):* Two separate `try`/`except` concerns can share
one `try` block with two `except` clauses:
```python
try:
    with open(path, "r") as f:
        return json.load(f)
except FileNotFoundError as e:
    raise ConfigError(f"config file not found: {path}") from e
except json.JSONDecodeError as e:
    raise ConfigError(f"invalid JSON in {path}") from e
```
`e.__cause__` (checked in the tests) is exactly what `from e` sets — it's
how code (or a debugger) can reach the original exception object even
after catching only the `ConfigError`.

*Correct answer + explanation (shown on failure, if requested):*
```python
import json

class AgentError(Exception):
    pass

class ConfigError(AgentError):
    pass

def load_agent_config(path: str) -> dict:
    try:
        with open(path, "r") as f:
            return json.load(f)
    except FileNotFoundError as e:
        raise ConfigError(f"config file not found: {path}") from e
    except json.JSONDecodeError as e:
        raise ConfigError(f"invalid JSON in {path}") from e
```
This combines the exception hierarchy from the previous section
(`ConfigError` is-an `AgentError`, so it's catchable either specifically or
broadly) with `from e` chaining that preserves exactly which underlying
problem occurred — a missing file versus malformed JSON — even though
both surface to the caller as the same `ConfigError` type with a
purpose-written message.

---

*(End of Concept 5. This lesson continues with Concept 6 — logging —
drafted separately.)*
