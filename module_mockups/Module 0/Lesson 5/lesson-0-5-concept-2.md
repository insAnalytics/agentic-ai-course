# Module 0, Lesson 5 — Concept 2: `@dataclass`

---

## The boilerplate a data-holding class always seems to need

`AgentConfig` from the previous section is a completely ordinary
data-holding class — and it already shows a pattern that gets repetitive
fast. Every parameter gets typed once in `__init__`'s signature, then
typed *again* as `self.x = x` on the next line, for every single field:

```python
class AgentConfig:
    def __init__(self, name: str, model: str, temperature: float = 0.7):
        self.name = name
        self.model = model
        self.temperature = temperature
```
*(not run live — this is the exact class from the previous section, shown
again to set up the comparison below)*

Three fields, five lines just to store them. And if you want printing or
equality to behave sensibly, you're adding `__repr__` and `__eq__` by hand
too, [as covered in the previous lesson](→ Module 0, the OOP lesson, dunder methods concept):

```python
class AgentConfig:
    def __init__(self, name: str, model: str, temperature: float = 0.7):
        self.name = name
        self.model = model
        self.temperature = temperature

    def __repr__(self):
        return f"AgentConfig(name={self.name!r}, model={self.model!r}, temperature={self.temperature!r})"

    def __eq__(self, other):
        return (
            self.name == other.name
            and self.model == other.model
            and self.temperature == other.temperature
        )
```
*(not run live — illustrating how much boilerplate a fully-featured
data-holding class actually needs)*

None of this is *wrong* — it's exactly what the previous lesson taught —
but for a class that's purely "store some typed fields, nothing more,"
writing `self.x = x` and a matching line in `__eq__` for every single field
is pure repetition with no real decisions being made.

---

## `@dataclass` — the same class, generated for you

The `dataclasses` module's `@dataclass` decorator takes type-hinted class
attributes and generates `__init__`, `__repr__`, and `__eq__`
automatically, based on nothing more than the fields you declare:

```python
from dataclasses import dataclass

@dataclass
class AgentConfig:
    name: str
    model: str
    temperature: float = 0.7

config = AgentConfig("research_agent", "claude-sonnet")
print(config)
print(config == AgentConfig("research_agent", "claude-sonnet"))
```
```
AgentConfig(name='research_agent', model='claude-sonnet', temperature=0.7)
True
```
*(runs live, shows output — read-only demo snippet, not graded)*

Three lines of field declarations replaced everything from the previous
section — no `__init__`, no `__repr__`, no `__eq__` written by hand, and
all three behave exactly like the versions you'd have written yourself:
`config.name`, `config.model`, and `config.temperature` all work as plain
instance attributes, `print(config)` shows a readable representation, and
`==` compares by value instead of identity.

This is [the same decorator mechanism from the previous lesson](→ Module 0, the OOP lesson, decorators concept, the manual reassignment example) — `@dataclass` just happens to be one specifically designed to read a class's type-hinted attributes and build methods from them, rather than wrapping a function's *behavior* the way `@log_call` did.

`= 0.7` on `temperature` works exactly like [a default argument in a regular function](→ Module 0, the functions lesson, function fundamentals concept, the default arguments explanation) — optional to pass, same rules apply: any field with a default must come after every field without one, in declaration order.

---

## Adding your own methods

A `@dataclass` isn't limited to auto-generated behavior — it's still a
normal class underneath, so you can add methods exactly as before. The
decorator only generates `__init__`/`__repr__`/`__eq__`; anything else you
write yourself, the same way:

```python
from dataclasses import dataclass

@dataclass
class AgentConfig:
    name: str
    model: str
    temperature: float = 0.7

    def summary(self) -> str:
        return f"{self.name} on {self.model} (temp={self.temperature})"

config = AgentConfig("research_agent", "claude-sonnet")
print(config.summary())
```
```
research_agent on claude-sonnet (temp=0.7)
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Overriding a generated method

If you need one of the three generated methods to behave differently than
the default, defining it yourself in the class body simply takes priority
— `@dataclass` only fills in what you haven't already written:

```python
from dataclasses import dataclass

@dataclass
class AgentConfig:
    name: str
    model: str
    temperature: float = 0.7

    def __repr__(self):
        return f"AgentConfig({self.name})"   # a shorter custom version

config = AgentConfig("research_agent", "claude-sonnet")
print(config)
```
```
AgentConfig(research_agent)
```
*(runs live, shows output — read-only demo snippet, not graded)*

`__init__` and `__eq__` are still auto-generated as usual here — only
`__repr__` was overridden, since that's the only one defined by hand.

---

## What `@dataclass` doesn't do

It's worth being precise about what this decorator actually saves you
from: boilerplate, not correctness. A `@dataclass` still has exactly the
same gap [from the end of the previous section](→ this lesson, classes vs. dicts concept, the type-hints-not-enforced explanation) — nothing about `@dataclass` validates that the values passed in actually match their declared types:

```python
broken_config = AgentConfig(name=123, model=None, temperature="hot")
print(broken_config)
```
```
AgentConfig(name=123, model=None, temperature='hot')
```
*(runs live, shows output — read-only demo snippet, not graded)*

This still runs. `@dataclass` reads the type hints to know *which fields
exist* and in what order to generate `__init__`'s parameters — it never
checks that what's actually passed in matches those hints. That's still
the gap ahead: Pydantic, covered later in this lesson, is what actually
turns type hints into enforcement.

---

## Quiz cards

> **Q1.** What three methods does `@dataclass` generate automatically from
> a class's type-hinted fields?
> - A) `__init__`, `__str__`, and `__len__`
> - B) `__init__`, `__repr__`, and `__eq__` ✅
> - C) `__init__` only
> - D) `__repr__` and `__eq__`, but not `__init__`
>
> *Explanation: these are exactly the three methods the previous lesson
> taught you to write by hand — `@dataclass` generates all three from the
> field declarations alone.*

> **Q2.** In a `@dataclass`, what plays the same role as a regular
> function's default argument?
> - A) Nothing — `@dataclass` fields can never have defaults
> - B) `field_name: type = value` — a field with `= value` becomes optional to pass, following the same after-required-fields ordering rule ✅
> - C) Every field is automatically optional
> - D) Defaults require a separate decorator
>
> *Explanation: `@dataclass` field defaults work exactly like default
> arguments elsewhere in Python — including the same ordering constraint
> that defaulted fields must come after non-defaulted ones.*

> **Q3.** Can a `@dataclass` have its own methods beyond the
> auto-generated three?
> - A) No, `@dataclass` classes can only hold data, no behavior
> - B) Yes — it's still a normal class underneath; `@dataclass` only generates `__init__`/`__repr__`/`__eq__`, anything else is written as usual ✅
> - C) Only if `@dataclass` is removed first
> - D) Only static methods are allowed
>
> *Explanation: `@dataclass` adds generated methods to an otherwise normal
> class — it doesn't restrict what else the class can contain.*

> **Q4.** If you define your own `__repr__` inside a `@dataclass` class
> body, what happens to `@dataclass`'s auto-generated version?
> - A) Both versions run, in sequence
> - B) Your own definition takes priority — `@dataclass` only fills in methods you haven't already written yourself ✅
> - C) It raises an error for redefining a generated method
> - D) `@dataclass` silently ignores your custom version and uses its own
>
> *Explanation: `@dataclass` only generates a method if the class doesn't
> already define one — an explicit definition always wins.*

> **Q5.** Given `AgentConfig(name=123, model=None, temperature="hot")` on
> a `@dataclass`-decorated `AgentConfig`, why does this run without error?
> - A) `@dataclass` automatically converts each value to its declared type
> - B) `@dataclass` only uses type hints to know which fields exist and generate `__init__`'s parameters — it never validates that passed-in values actually match those types ✅
> - C) This actually does raise a `TypeError`
> - D) `@dataclass` disables type checking entirely, unlike a plain class
>
> *Explanation: `@dataclass` removes boilerplate, not validation — the
> same type-hints-aren't-enforced gap from a plain class is still present.*

---

## Applied sandbox exercise 2

*(rewriting the previous exercise's class as a dataclass, plus one new method)*

*Starter code shown to learner:*
```python
from dataclasses import dataclass

@dataclass
class ToolResult:
    """
    TODO: declare three type-hinted fields (no __init__ needed — @dataclass
    generates it):
      tool_name: str
      output: str
      success: bool, defaulting to True

    TODO: implement a method as_dict(self) -> dict returning the same
    three values as a plain dict, shaped exactly like:
      {"tool_name": ..., "output": ..., "success": ...}
    """
    # TODO: implement
    pass
```

*Task shown to learner:* Declare the three fields as type-hinted class
attributes (letting `@dataclass` generate `__init__`), then implement
`as_dict()` as a regular method, same as before.

*Hidden test cases:*
```python
result = ToolResult("search", "3 results found")
assert result.tool_name == "search"
assert result.success == True
assert result.as_dict() == {"tool_name": "search", "output": "3 results found", "success": True}

result2 = ToolResult("calculator", "division by zero", success=False)
assert result2.as_dict() == {"tool_name": "calculator", "output": "division by zero", "success": False}

assert ToolResult("search", "x") == ToolResult("search", "x")   # generated __eq__ compares by value
assert repr(ToolResult("search", "x")) == "ToolResult(tool_name='search', output='x', success=True)"
```

*Hint (shown on request):* Remove `pass` and the `__init__`-shaped
docstring entirely — a `@dataclass` body is just the field declarations
(`tool_name: str`, `output: str`, `success: bool = True`), one per line,
no `self`, no `__init__` written by hand. `as_dict()` is identical to the
previous exercise's version.

*Correct answer + explanation (shown on failure, if requested):*
```python
from dataclasses import dataclass

@dataclass
class ToolResult:
    tool_name: str
    output: str
    success: bool = True

    def as_dict(self) -> dict:
        return {
            "tool_name": self.tool_name,
            "output": self.output,
            "success": self.success,
        }
```
Compare this directly to the previous exercise's version: identical
behavior, `__init__`/`__repr__`/`__eq__` all generated instead of written
by hand, with `as_dict()` added exactly the same way a method gets added
to any other class — proving `@dataclass` classes aren't a different kind
of thing, just a shortcut for the most repetitive part of a
data-holding class.

---

*(End of Concept 2. This lesson continues with Concept 3 — the validation
gap — drafted separately.)*
