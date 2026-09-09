# Structured Data Validation with Pydantic

> **You'll be able to**
> - Decide between a plain dict and a class for a given piece of data, and
>   explain concretely what a class buys you that a dict doesn't
> - Use `@dataclass` to eliminate the boilerplate of a hand-written
>   `__init__`/`__repr__`/`__eq__` on a data-holding class
> - Explain why type hints alone — on a plain class or a `@dataclass` —
>   don't enforce anything at runtime, and write manual validation with
>   `__post_init__` and `raise` to close that gap by hand
> - Define a Pydantic `BaseModel` and explain what it adds over
>   `@dataclass`: the same type hints becoming real, aggregated, automatic
>   validation, with built-in dict conversion via `.model_dump()`

**Why it matters**
Nearly everything that flows through an agent from the outside world — an
LLM's tool-call arguments, a config file, an API response — arrives as
loosely-structured data that might not actually match what your code
expects. This lesson's whole arc, from a plain dict through `@dataclass`
to Pydantic, is about closing that gap: by the time you reach
tool-calling and FastAPI later in this course, `BaseModel` classes are
what actually define a tool's expected arguments and validate them before
your code ever runs on them — this lesson is where that pattern is built
from the ground up, one layer at a time.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** What does a class offer over a dict that matters most once a
> typo is involved?
> - A) Classes are always faster to create
> - B) A wrong attribute name fails immediately with `AttributeError`; a wrong dict key with `.get()` just silently returns `None` ✅
> - C) Dicts can't hold string values
> - D) There's no real difference

> **Q2.** What three methods does `@dataclass` generate automatically from
> a class's type-hinted fields?
> - A) `__init__`, `__str__`, `__len__`
> - B) `__init__`, `__repr__`, `__eq__` ✅
> - C) Only `__init__`
> - D) `__repr__` and `__eq__`, but not `__init__`

> **Q3.** Why does `AgentConfig(name=123, model=None, temperature="hot")`
> run without error on a plain `@dataclass`, with no validation applied?
> - A) `@dataclass` automatically converts each value to the right type
> - B) `@dataclass` only uses type hints to know which fields exist and generate `__init__`'s parameters — it never checks that passed-in values actually match ✅
> - C) This actually raises a `TypeError`
> - D) `@dataclass` disables type checking entirely

> **Q4.** What does `__post_init__` do, and when does it run?
> - A) It replaces `__init__` entirely
> - B) It runs automatically right after the generated `__init__` finishes assigning every field ✅
> - C) It runs before any fields are assigned
> - D) It must be called manually after construction

> **Q5.** What does `raise ValueError("message")` do?
> - A) Logs a warning and continues running
> - B) Immediately stops execution at that line and produces an uncaught exception, unless something catches it ✅
> - C) Is a no-op outside of `try`/`except`
> - D) Is equivalent to `return None`

> **Q6.** Why does manually checking every field's type in
> `__post_init__` fail to scale well as a class grows?
> - A) `__post_init__` can only check a maximum of three fields
> - B) Every new field needs its own separate, nearly-identical check written by hand — repetitive and easy to forget ✅
> - C) `isinstance` doesn't work inside `__post_init__`
> - D) `@dataclass` classes can't have more than five fields

> **Q7.** What does inheriting from Pydantic's `BaseModel` add, compared
> to a plain class or `@dataclass` with the same type-hinted fields?
> - A) Nothing — `BaseModel` is purely cosmetic
> - B) Real runtime validation — the type hints are read and enforced automatically at construction, with no `__post_init__` needed ✅
> - C) It removes the need for type hints entirely
> - D) It only changes how the object prints

> **Q8.** Given a `BaseModel` with three mismatched fields passed in at
> once, why does the resulting `ValidationError` mention all three,
> instead of stopping at the first?
> - A) It doesn't — Pydantic only ever reports the first failure
> - B) Pydantic validates every field and aggregates every failure into one error, unlike hand-rolled `if`/`raise` checks that stop at whichever runs first ✅
> - C) This only happens with more than three fields
> - D) A special configuration flag is required for this behavior

---

## Comprehensive sandbox

*(end of lesson, applied — combines all four concepts: a Pydantic
`BaseModel` as the final evolution of the plain class from Concept 1, with
its own method the way [behavior lives with the data](→ this lesson, classes vs. dicts concept, the behavior-lives-with-the-data explanation) argued for, built from a raw dict the way external data actually arrives, and validated automatically the way `@dataclass` + `__post_init__` never quite achieved.)*

*Starter code shown to learner:*
```python
from pydantic import BaseModel

class AgentProfile(BaseModel):
    """
    TODO: declare four type-hinted fields:
      name: str
      model: str
      temperature: float, defaulting to 0.7
      metadata: dict

    TODO: implement a method summary(self) -> str returning exactly:
      f"{name} ({model}) at temp={temperature}"
    """
    # TODO: implement
    pass


def build_profile_from_raw(raw: dict) -> AgentProfile:
    """
    raw: a dict shaped like {"name": ..., "model": ..., "metadata": {...}},
    optionally including "temperature".

    TODO: build and return an AgentProfile from raw, using ** to unpack
    the dict directly into keyword arguments — the same unpacking
    mechanism from the functions lesson's *args/**kwargs concept, just
    used here as a bridge from "data arrived as a dict" to "data is now a
    validated model."
    """
    # TODO: implement
    pass
```

*Task shown to learner:* Implement `AgentProfile` as a `BaseModel` with
the four fields described, plus a `summary()` method. Then implement
`build_profile_from_raw` to construct an `AgentProfile` from a raw dict
by unpacking it with `**`.

*Hidden test cases:*
```python
from pydantic import ValidationError

raw = {"name": "research_agent", "model": "claude-sonnet", "metadata": {"team": "search"}}
profile = build_profile_from_raw(raw)

assert profile.name == "research_agent"
assert profile.temperature == 0.7   # default applied, not present in raw
assert profile.summary() == "research_agent (claude-sonnet) at temp=0.7"
assert profile.model_dump() == {
    "name": "research_agent",
    "model": "claude-sonnet",
    "temperature": 0.7,
    "metadata": {"team": "search"},
}

raw_with_temp = {**raw, "temperature": 0.2}
profile2 = build_profile_from_raw(raw_with_temp)
assert profile2.temperature == 0.2

# aggregated validation: two bad fields reported together
try:
    build_profile_from_raw({"name": 123, "model": "claude-sonnet", "metadata": "not a dict"})
    assert False, "should have raised"
except ValidationError as e:
    assert len(e.errors()) == 2

# type coercion still applies, same as any BaseModel field
profile3 = build_profile_from_raw({**raw, "temperature": "0.5"})
assert profile3.temperature == 0.5
```

*Hint (shown on request):* `AgentProfile`'s body is four field
declarations plus one method — `summary()` is a normal method using an
f-string over `self.name`, `self.model`, `self.temperature`, no different
from a method on any other class. `build_profile_from_raw` is one line:
`return AgentProfile(**raw)` — `**raw` spreads the dict's key-value pairs
out as keyword arguments, exactly like
[`func(*args, **merged)` from the *args/**kwargs concept](→ Module 0, the functions lesson, *args/**kwargs concept, the call_with_defaults exercise), just constructing a model instead of calling a plain function.

*Correct answer + explanation (shown on failure, if requested):*
```python
from pydantic import BaseModel

class AgentProfile(BaseModel):
    name: str
    model: str
    temperature: float = 0.7
    metadata: dict

    def summary(self) -> str:
        return f"{self.name} ({self.model}) at temp={self.temperature}"


def build_profile_from_raw(raw: dict) -> AgentProfile:
    return AgentProfile(**raw)
```
This is the lesson's full arc in one exercise: `AgentProfile` is a class
(not a bare dict) specifically so `summary()` can live alongside the
data it describes, its fields are declared exactly like a `@dataclass`
would declare them, and inheriting from `BaseModel` is what makes those
same declarations into real validation — catching every bad field at
once, coercing what it reasonably can — without a single manual
`isinstance` check or `__post_init__` anywhere in sight. `build_profile_from_raw`
is the realistic entry point this all exists for: data that arrives as a
plain dict, from somewhere you don't control, turned into something
trustworthy with one line.
