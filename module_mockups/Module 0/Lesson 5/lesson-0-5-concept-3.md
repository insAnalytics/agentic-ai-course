# Module 0, Lesson 5 — Concept 3: The validation gap

---

## Recap: the gap, briefly

The previous section ended on this, and it's worth restating as the
starting point here: a `@dataclass` reads type hints to know which fields
exist — it never checks that what's actually passed in matches them.

```python
from dataclasses import dataclass

@dataclass
class AgentConfig:
    name: str
    model: str
    temperature: float = 0.7

broken = AgentConfig(name=123, model=None, temperature="hot")
print(broken)
```
```
AgentConfig(name=123, model=None, temperature='hot')
```
*(runs live, shows output — read-only demo snippet, not graded)*

This section makes the actual cost of that gap concrete, then shows the
manual fix — before the next section replaces the manual fix with
something better.

---

## Why silent bad data is worse than it looks

The real danger isn't that `broken` above prints strangely — it's that
nothing stops `broken` from being passed around and used *elsewhere*,
somewhere the bad data finally causes a crash that has nothing obviously
to do with where it actually went wrong:

```python
@dataclass
class AgentConfig:
    name: str
    model: str
    temperature: float = 0.7

def describe_temperature(config: AgentConfig) -> str:
    return f"running at {config.temperature * 100:.0f}% intensity"

config = AgentConfig("research_agent", "claude-sonnet", temperature="hot")
# ... maybe dozens of lines, or several function calls, later ...
print(describe_temperature(config))
```
```
Traceback (most recent call last):
  File "script.py", line 10, in <module>
    print(describe_temperature(config))
  File "script.py", line 7, in describe_temperature
    return f"running at {config.temperature * 100:.0f}% intensity"
TypeError: can't multiply sequence by non-int of type 'float'
```
*(runs live, shows output — read-only demo snippet, not graded)*

This is the same shape of problem [covered all the way back in the Python setup lesson](→ Module 0, the Python setup lesson, execution model concept, the line-by-line crash example): the crash happens where execution actually reaches the bad value, not where the mistake was actually made. There, it was two lines in the same file; here, it can easily be a config object created far away from — and long before — wherever it finally breaks something. The farther the gap between creation and crash, the harder the bug is to trace back.

---

## The manual fix: validating in `__post_init__`

`@dataclass` gives you a hook specifically for logic that should run right
after the generated `__init__` finishes: a method named `__post_init__`,
called automatically with no arguments beyond `self` once every field has
already been assigned.

```python
from dataclasses import dataclass

@dataclass
class AgentConfig:
    name: str
    model: str
    temperature: float = 0.7

    def __post_init__(self):
        if not isinstance(self.name, str):
            raise ValueError(f"name must be a str, got {type(self.name).__name__}")
        if not isinstance(self.temperature, (int, float)):
            raise ValueError(f"temperature must be a number, got {type(self.temperature).__name__}")

config = AgentConfig("research_agent", "claude-sonnet", temperature="hot")
```
```
Traceback (most recent call last):
  File "script.py", line 12, in <module>
    config = AgentConfig("research_agent", "claude-sonnet", temperature="hot")
  File "<string>", line 6, in __init__
  File "script.py", line 10, in __post_init__
    raise ValueError(f"temperature must be a number, got {type(self.temperature).__name__}")
ValueError: temperature must be a number, got str
```
*(runs live, shows output — read-only demo snippet, not graded)*

`raise` is new syntax here: it's how you trigger an exception yourself,
rather than one occurring naturally from something like division by zero.
`raise ValueError("message")` immediately stops execution at that line and
produces a traceback, exactly like any other uncaught exception — the
difference is you're deciding exactly when and why it happens, based on
whatever condition you check. This is the direct inverse of
[`try`/`except` from earlier in the course](→ Module 0, the Python setup lesson, error handling concept): `except` catches an exception someone else raised; `raise` is how you create one in the first place.

This version fails immediately, at construction time, at the exact line
where the actual mistake happened — instead of failing later, somewhere
unrelated, the way the previous example did.

---

## Why the manual version doesn't scale

`__post_init__` genuinely works — but look at what it cost for a class
with only two fields worth checking. Every field needs its own
`isinstance` check, its own error message, written by hand:

```python
@dataclass
class AgentConfig:
    name: str
    model: str
    temperature: float = 0.7
    max_tokens: int = 1000
    enabled: bool = True

    def __post_init__(self):
        if not isinstance(self.name, str):
            raise ValueError(f"name must be a str, got {type(self.name).__name__}")
        if not isinstance(self.model, str):
            raise ValueError(f"model must be a str, got {type(self.model).__name__}")
        if not isinstance(self.temperature, (int, float)):
            raise ValueError(f"temperature must be a number, got {type(self.temperature).__name__}")
        if not isinstance(self.max_tokens, int):
            raise ValueError(f"max_tokens must be an int, got {type(self.max_tokens).__name__}")
        if not isinstance(self.enabled, bool):
            raise ValueError(f"enabled must be a bool, got {type(self.enabled).__name__}")
```
*(not run live — illustrating how the check count scales with field
count, not a new behavior)*

Five fields, five nearly-identical checks — and this is still only
checking *type*, not anything more specific (a `temperature` of `-5.0` is
a `float`, so it passes every check above, despite being nonsensical for
an actual sampling temperature). Every new field means writing another
check by hand, and every check is exactly the kind of repetitive,
easy-to-typo, easy-to-forget code this course has been steering away from
since [comprehensions replaced manual loop-and-append](→ Module 0, the data structures lesson, comprehensions concept) and [`@dataclass` itself replaced manually-written `__init__`/`__repr__`/`__eq__`](→ this lesson, the dataclass concept).

The type hints (`name: str`, `temperature: float`) are already sitting
right there in the class, fully describing what each field should be —
`__post_init__` just isn't reading them; you're re-stating the same
information a second time, by hand, as a separate check. That redundancy
is exactly the opening the next section closes: Pydantic reads those same
type hints directly and turns them into this validation automatically,
with no `__post_init__` written by hand at all.

---

## Quiz cards

> **Q1.** Why is bad data silently accepted by a `@dataclass` often worse
> than an immediate crash?
> - A) It isn't worse — an immediate crash is always more disruptive
> - B) The eventual crash happens wherever the bad value is finally used, which can be far from and much later than where the mistake was actually made ✅
> - C) Silent bad data never actually causes a crash
> - D) `@dataclass` always prints a warning, so it's not really silent
>
> *Explanation: this is the same "the crash happens where execution
> reaches the bad line, not where the mistake was made" problem from the
> Python setup lesson — except the gap between the two spots can now be
> much larger.*

> **Q2.** What does `__post_init__` do, and when does it run?
> - A) It replaces `__init__` entirely
> - B) It runs automatically right after the generated `__init__` finishes assigning every field ✅
> - C) It runs before any fields are assigned
> - D) It must be called manually after creating the instance
>
> *Explanation: `@dataclass` calls `__post_init__` for you, once
> construction is otherwise complete — the standard hook for validation or
> other post-construction logic.*

> **Q3.** What does `raise ValueError("message")` actually do?
> - A) It's a no-op unless wrapped in `try`/`except`
> - B) It immediately stops execution at that line and produces an uncaught exception, the same as any naturally-occurring error, unless something catches it ✅
> - C) It only logs a warning and continues running
> - D) It's the same as `return None`
>
> *Explanation: `raise` triggers an exception deliberately, based on
> whatever condition you check — the direct inverse of `except`, which
> catches an exception rather than creating one.*

> **Q4.** Why does manually checking every field's type in
> `__post_init__` fail to scale well as a class grows?
> - A) `__post_init__` can only check a maximum of three fields
> - B) Every new field needs its own separate, nearly-identical check written by hand — repetitive, easy to forget, and it only checks what you remembered to write ✅
> - C) `isinstance` doesn't work inside `__post_init__`
> - D) `@dataclass` classes can't have more than five fields
>
> *Explanation: the check count scales directly with the field count, and
> each one has to be written and maintained separately — the same kind of
> repetition comprehensions and `@dataclass` itself were introduced to
> eliminate elsewhere in the course.*

> **Q5.** What information is already sitting in a `@dataclass`'s field
> declarations that `__post_init__`'s manual checks end up restating?
> - A) The default values only
> - B) The type hints — `__post_init__` re-describes, by hand, exactly what each field's type annotation already says ✅
> - C) Nothing, they're entirely unrelated
> - D) The field names only, not their types
>
> *Explanation: `name: str` already declares the expected type — a manual
> `isinstance(self.name, str)` check is restating that same fact a second
> time, which is exactly the redundancy Pydantic removes.*

---

## Applied sandbox exercise 3

*(hand-rolled validation with `__post_init__` and `raise` — the exercise
is deliberately about feeling the repetition, right before Pydantic
removes it)*

*Starter code shown to learner:*
```python
from dataclasses import dataclass

@dataclass
class ToolCall:
    """
    Fields:
      tool_name: str
      timeout: float
      arguments: dict

    TODO: implement __post_init__ to validate, raising ValueError with
    any message if a check fails:
      - tool_name must be a non-empty str
      - timeout must be a number (int or float) greater than 0
      - arguments must be a dict
    """
    tool_name: str
    timeout: float
    arguments: dict
    # TODO: implement __post_init__
```

*Task shown to learner:* Implement `__post_init__` with three checks —
`tool_name` is a non-empty string, `timeout` is a positive number,
`arguments` is a dict — raising `ValueError` the moment any one of them
fails.

*Hidden test cases:*
```python
call = ToolCall("search", 5.0, {"query": "weather"})
assert call.tool_name == "search"

try:
    ToolCall("", 5.0, {})
    assert False, "should have raised"
except ValueError:
    pass

try:
    ToolCall("search", -1.0, {})
    assert False, "should have raised"
except ValueError:
    pass

try:
    ToolCall("search", 5.0, "not a dict")
    assert False, "should have raised"
except ValueError:
    pass

try:
    ToolCall("search", "not a number", {})
    assert False, "should have raised"
except ValueError:
    pass
```

*Hint (shown on request):* Three separate `if` checks, each ending in its
own `raise ValueError("...")`:
`isinstance(self.tool_name, str) and len(self.tool_name) > 0` for the
name, `isinstance(self.timeout, (int, float)) and self.timeout > 0` for
the timeout, and `isinstance(self.arguments, dict)` for the arguments.

*Correct answer + explanation (shown on failure, if requested):*
```python
from dataclasses import dataclass

@dataclass
class ToolCall:
    tool_name: str
    timeout: float
    arguments: dict

    def __post_init__(self):
        if not (isinstance(self.tool_name, str) and len(self.tool_name) > 0):
            raise ValueError("tool_name must be a non-empty string")
        if not (isinstance(self.timeout, (int, float)) and self.timeout > 0):
            raise ValueError("timeout must be a positive number")
        if not isinstance(self.arguments, dict):
            raise ValueError("arguments must be a dict")
```
Notice how much code three fields already needed, and that this still
only checks *type and basic shape* — nothing here would catch a
`timeout` of `999999` or an `arguments` dict with the wrong keys inside
it. That's the exact gap and the exact repetition the next section
replaces with Pydantic reading the same type hints directly.

---

*(End of Concept 3. This lesson continues with Concept 4 — Pydantic
fundamentals — drafted separately.)*
