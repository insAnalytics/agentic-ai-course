# Module 0, Lesson 5 — Concept 4: Pydantic fundamentals

---

## What Pydantic actually adds

Everything in this lesson has been building toward one specific gap:
type hints describe what a field *should* be, but nothing enforces it —
not a plain class, not `@dataclass`, only a hand-written `__post_init__`
that has to restate every field's type as a separate manual check.
**Pydantic** is a library that closes that gap directly: it reads the same
type hints you're already writing and turns them into real, automatic
validation, with no `__post_init__` needed at all.

```python
from pydantic import BaseModel

class AgentConfig(BaseModel):
    name: str
    model: str
    temperature: float = 0.7

config = AgentConfig(name="research_agent", model="claude-sonnet")
print(config)
```
```
name='research_agent' model='claude-sonnet' temperature=0.7
```
*(runs live, shows output — read-only demo snippet, not graded)*

The syntax is deliberately close to `@dataclass` — type-hinted fields,
optional defaults with `=` — but instead of a decorator on a plain class,
you inherit from `BaseModel`. That inheritance is what wires in the
validation behavior; everything else about declaring fields looks almost
identical to what you already know.

---

## Validation actually happens now

Pass something that doesn't match a field's declared type, and Pydantic
refuses to construct the object at all — no `__post_init__`, no manual
`isinstance` checks, none of it written by hand:

```python
from pydantic import BaseModel

class AgentConfig(BaseModel):
    name: str
    model: str
    temperature: float = 0.7

broken = AgentConfig(name="research_agent", model="claude-sonnet", temperature="hot")
```
```
Traceback (most recent call last):
  File "script.py", line 8, in <module>
    broken = AgentConfig(name="research_agent", model="claude-sonnet", temperature="hot")
pydantic_core._pydantic_core.ValidationError: 1 validation error for AgentConfig
temperature
  Input should be a valid number, unable to parse string as a number [type=float_parsing, input_value='hot', input_type=str]
```
*(runs live, shows output — read-only demo snippet, not graded)*

Compare this directly to [the manual `__post_init__` version from the previous section](→ this lesson, the validation gap concept, the __post_init__ validation example): same failure, same field, same moment of failure — construction time, at the actual mistake — but here it came from `temperature: float` alone. The type hint *is* the validation; there's nothing else to write.

---

## One thing catching everything — not just the first thing

Recall that the hand-rolled `__post_init__` version stopped at whichever
`if` check happened to run first, reporting only one problem even if
several fields were wrong. Pydantic checks every field and reports every
failure at once, in a single error:

```python
from pydantic import BaseModel

class AgentConfig(BaseModel):
    name: str
    model: str
    temperature: float = 0.7

broken = AgentConfig(name=123, model=None, temperature="hot")
```
```
Traceback (most recent call last):
  File "script.py", line 8, in <module>
    broken = AgentConfig(name=123, model=None, temperature="hot")
pydantic_core._pydantic_core.ValidationError: 3 validation errors for AgentConfig
name
  Input should be a valid string [type=string_type, input_value=123, input_type=int]
model
  Input should be a valid string [type=string_type, input_value=None, input_type=NoneType]
temperature
  Input should be a valid number, unable to parse string as a number [type=float_parsing, input_value='hot', input_type=str]
```
*(runs live, shows output — read-only demo snippet, not graded)*

All three problems, in one error, on the first attempt — instead of
fixing one field, re-running, hitting the next `if` check, and repeating.
This matters in practice for exactly the situation [the previous section](→ this lesson, the validation gap concept, the silent-bad-data explanation) opened with: data coming from somewhere you don't fully control (an API response, a config file) is far more likely to have several things wrong with it at once, not just one.

---

## Type coercion — Pydantic tries to be helpful, within reason

One behavior worth knowing up front, since it can be surprising: Pydantic
doesn't only *reject* mismatched types — for some conversions it
considers safe and unambiguous, it will actually convert the value for
you, rather than failing:

```python
from pydantic import BaseModel

class AgentConfig(BaseModel):
    name: str
    model: str
    temperature: float = 0.7

config = AgentConfig(name="research_agent", model="claude-sonnet", temperature="0.9")
print(config.temperature)
print(type(config.temperature))
```
```
0.9
<class 'float'>
```
*(runs live, shows output — read-only demo snippet, not graded)*

`"0.9"` — a string — was accepted for a `float` field, and silently
converted to the actual float `0.9`. This is deliberate: a numeric-looking
string is a common, unambiguous case (think: a value that arrived as text
from a form or query parameter), so Pydantic coerces it rather than
rejecting it outright. It's not unlimited, though — `"hot"` still fails,
as shown earlier, because there's no reasonable number hiding inside it.
The practical takeaway: Pydantic validates *and* normalizes reasonable
input — it isn't purely a strict type-equality check the way `isinstance`
is.

---

## Getting the data back out: `.model_dump()`

Just like the hand-written `as_dict()` method from earlier exercises this
lesson, a Pydantic model can convert itself back into a plain dict — this
comes built in, no method needs to be written:

```python
from pydantic import BaseModel

class AgentConfig(BaseModel):
    name: str
    model: str
    temperature: float = 0.7

config = AgentConfig(name="research_agent", model="claude-sonnet")
print(config.model_dump())
```
```
{'name': 'research_agent', 'model': 'claude-sonnet', 'temperature': 0.7}
```
*(runs live, shows output — read-only demo snippet, not graded)*

This closes the loop this lesson opened with — a Pydantic model gives you
the class side's benefits (fixed, typed fields, autocomplete, methods) and
the dict side's convenience (a plain dict on demand, exactly like the
`@kwargs`-collected dicts from earlier in the course), plus the real
validation neither one had on its own.

---

## Quiz cards

> **Q1.** What does inheriting from `BaseModel` actually add, compared to
> a plain class with the same type-hinted fields?
> - A) Nothing — `BaseModel` is purely cosmetic
> - B) Real runtime validation — Pydantic reads the type hints and enforces them automatically when the object is constructed ✅
> - C) It removes the need for type hints entirely
> - D) It only affects how the object prints, nothing else
>
> *Explanation: `BaseModel` is what wires the type hints into actual
> validation logic — this is the entire gap the rest of the lesson was
> building toward closing.*

> **Q2.** Given `AgentConfig(name=123, model=None, temperature="hot")` on
> a `BaseModel`, why does the resulting error mention all three fields at
> once, rather than stopping at the first one?
> - A) It doesn't — Pydantic only ever reports the first failure
> - B) Pydantic validates every field and collects every failure into one error, unlike a hand-rolled `__post_init__` that stops at whichever `if` check runs first ✅
> - C) Reporting all three requires a special configuration flag
> - D) This behavior only happens with more than three fields
>
> *Explanation: aggregating every validation failure into one error is a
> concrete practical advantage over manual `if`/`raise` checks, especially
> for data that might have multiple things wrong with it at once.*

> **Q3.** Why does `AgentConfig(temperature="0.9")` succeed, with
> `config.temperature` ending up as the float `0.9`, rather than raising a
> `ValidationError` the way `temperature="hot"` does?
> - A) Pydantic ignores type hints for string inputs
> - B) Pydantic coerces some unambiguous, safe conversions — like a numeric-looking string into the declared numeric type — rather than only strictly rejecting mismatches ✅
> - C) This is actually a bug and shouldn't happen
> - D) `"0.9"` and `0.9` are treated as identical by Python itself
>
> *Explanation: Pydantic validates and normalizes reasonable input — it
> isn't a pure `isinstance`-style strict-equality check, which is why a
> parseable numeric string is accepted and converted rather than
> rejected.*

> **Q4.** What does `.model_dump()` do on a Pydantic model instance?
> - A) It deletes the instance's data
> - B) It returns the model's fields as a plain dict, the built-in equivalent of the hand-written `as_dict()` methods from earlier in this lesson ✅
> - C) It validates the model a second time
> - D) It only works if the model has no default values
>
> *Explanation: `.model_dump()` is Pydantic's built-in dict-conversion
> method — no method needs to be written by hand the way `as_dict()` did
> for a plain class or `@dataclass`.*

> **Q5.** Compared to the hand-rolled `__post_init__` validation from the
> previous section, what has to be written by hand to get the same
> validation behavior in a Pydantic model?
> - A) The exact same `__post_init__` code, just inside a `BaseModel` subclass
> - B) Nothing extra — the type-hinted field declarations alone are enough; there's no `__post_init__` or manual check needed at all ✅
> - C) A separate `validate()` method must be called manually after construction
> - D) Pydantic requires more code than the manual version, not less
>
> *Explanation: this is the core payoff of the whole lesson — the same
> type hints you'd write anyway become the validation, with the manual
> `isinstance`/`raise` checks eliminated entirely.*

---

## Applied sandbox exercise 4

*(rewriting the previous section's hand-validated ToolCall as a Pydantic
model — the direct before/after comparison)*

*Starter code shown to learner:*
```python
from pydantic import BaseModel

class ToolCall(BaseModel):
    """
    TODO: declare three type-hinted fields (no __init__, no
    __post_init__ — Pydantic generates validation from the type hints
    alone):
      tool_name: str
      timeout: float
      arguments: dict
    """
    # TODO: implement
    pass
```

*Task shown to learner:* Declare the same three fields as the previous
section's `ToolCall`, but as a `BaseModel` subclass instead — no
`__post_init__`, no manual checks. The type hints alone should produce the
same validation behavior.

*Hidden test cases:*
```python
from pydantic import ValidationError

call = ToolCall(tool_name="search", timeout=5.0, arguments={"query": "weather"})
assert call.tool_name == "search"
assert call.model_dump() == {"tool_name": "search", "timeout": 5.0, "arguments": {"query": "weather"}}

try:
    ToolCall(tool_name=123, timeout=5.0, arguments={})
    assert False, "should have raised"
except ValidationError:
    pass

try:
    ToolCall(tool_name="search", timeout="not a number", arguments={})
    assert False, "should have raised"
except ValidationError:
    pass

try:
    ToolCall(tool_name="search", timeout=5.0, arguments="not a dict")
    assert False, "should have raised"
except ValidationError:
    pass

# type coercion: an int is accepted for a float field
call2 = ToolCall(tool_name="search", timeout=5, arguments={})
assert call2.timeout == 5.0
```

*Hint (shown on request):* This is just three lines —
`tool_name: str`, `timeout: float`, `arguments: dict` — inside a class
that inherits from `BaseModel` instead of a plain class or
`@dataclass`-decorated one. No `__post_init__`, no `raise`, no
`isinstance` — the validation from the previous section's much longer
version is now entirely automatic.

*Correct answer + explanation (shown on failure, if requested):*
```python
from pydantic import BaseModel

class ToolCall(BaseModel):
    tool_name: str
    timeout: float
    arguments: dict
```
Three lines, replacing the previous section's full class plus a
five-check `__post_init__` — this is the entire point of the lesson made
concrete: the exact same type hints you'd write on any class become real,
automatic, aggregated validation the moment the class inherits from
`BaseModel`, with the repetitive manual checking gone completely.

---

*(End of Concept 4 — final concept section of Lesson 5. This lesson
continues with the outcomes callout, comprehensive quiz, and comprehensive
sandbox, drafted separately.)*
