# Module 0, Lesson 6 — Concept 7: Putting it together — loading and validating external data

---

## The realistic shape of the problem

Every piece of this lesson has been building toward one specific,
extremely common task: taking data that arrived from *outside* your
program — a file someone else wrote or generated — and turning it into
something your code can actually trust. That single task touches
everything covered so far:

- Open the file safely, with `with` — it might not even exist.
- Parse it as JSON — the text itself might be malformed.
- Validate the parsed data against [a Pydantic `BaseModel` from the previous lesson](→ Module 0, the Pydantic lesson, Pydantic fundamentals concept) — the JSON might be well-formed but still not match what your code expects.
- Turn whatever went wrong into a clear, specific, [custom exception](→ this lesson, custom exceptions and exception hierarchies concept) — so calling code can handle "the config was bad" as one coherent kind of failure, regardless of which of the three steps actually failed.
- Log what happened before it propagates further.

This section builds exactly that pipeline, end to end.

---

## The pieces, assembled

```python
import json
import logging
from pydantic import BaseModel, ValidationError

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


class AgentError(Exception):
    pass


class ConfigError(AgentError):
    pass


class AgentConfig(BaseModel):
    name: str
    model: str
    temperature: float = 0.7


def load_agent_config(path: str) -> AgentConfig:
    try:
        with open(path, "r") as f:
            raw = json.load(f)
        return AgentConfig(**raw)
    except FileNotFoundError as e:
        logger.exception(f"config file not found: {path}")
        raise ConfigError(f"config file not found: {path}") from e
    except json.JSONDecodeError as e:
        logger.exception(f"invalid JSON in {path}")
        raise ConfigError(f"invalid JSON in {path}") from e
    except ValidationError as e:
        logger.exception(f"config data doesn't match expected shape: {path}")
        raise ConfigError(f"invalid config data in {path}: {e}") from e


config = load_agent_config("agent_config.json")
print(config.name, config.model, config.temperature)
```
```
research_agent claude-sonnet 0.7
```
*(runs live against a valid agent_config.json, shows output — read-only
demo snippet, not graded)*

Every piece here is something you've already built separately:
`with open(...)` and `json.load` from earlier this lesson,
`AgentConfig(BaseModel)` from the previous lesson,
`AgentError`/`ConfigError` from this lesson's custom exceptions section,
`raise ... from e` chaining, and `logger.exception()` — this function is
genuinely nothing new, just every earlier piece composed into one
realistic flow.

---

## Watching each failure mode independently

The value of this structure is that each of the three failure modes —
missing file, broken JSON, wrong shape — surfaces as the exact same
`ConfigError` type to whatever calls `load_agent_config`, while still
preserving exactly what actually went wrong underneath, via chaining:

```python
try:
    load_agent_config("missing.json")
except ConfigError as e:
    print(f"failed: {e}")
    print(f"caused by: {type(e.__cause__).__name__}")
```
```
ERROR: config file not found: missing.json
failed: config file not found: missing.json
caused by: FileNotFoundError
```
*(runs live, shows output — read-only demo snippet, not graded)*

```python
try:
    load_agent_config("bad_shape.json")   # valid JSON: {"name": "research_agent"} — missing "model"
except ConfigError as e:
    print(f"failed: {e}")
    print(f"caused by: {type(e.__cause__).__name__}")
```
```
ERROR: config data doesn't match expected shape: bad_shape.json
failed: invalid config data in bad_shape.json: 1 validation error for AgentConfig
model
  Field required [type=missing, input_value={'name': 'research_agent'}, input_type=str]
caused by: ValidationError
```
*(runs live, shows output — read-only demo snippet, not graded)*

Calling code that only cares about "config loading failed, do something
about it" can catch `ConfigError` alone and never worry about the three
different underlying exception types — but code that specifically needs
to know *why* (to show a different message, or retry only for certain
failures) can still inspect `e.__cause__` to find out.

---

## Quiz cards

> **Q1.** In `load_agent_config`, why does the function catch three
> different exception types (`FileNotFoundError`, `json.JSONDecodeError`,
> `ValidationError`) but raise the same `ConfigError` type in every case?
> - A) This is a mistake — each should raise a different exception type
> - B) So calling code can handle "config loading failed" as one coherent case, regardless of which underlying step actually failed — while `from e` still preserves exactly what went wrong ✅
> - C) `ConfigError` is required to be raised by every `except` block in Python
> - D) The three exception types are actually identical

> **Q2.** What does `AgentConfig(**raw)` do, where `raw` is a dict just
> parsed from JSON?
> - A) It's invalid syntax — `**` only works in function definitions
> - B) It unpacks `raw`'s key-value pairs as keyword arguments to `AgentConfig`, which validates them against the model's type hints during construction ✅
> - C) It converts `AgentConfig` into a dict
> - D) It only works if `raw` has exactly the fields `AgentConfig` expects, in the same order

> **Q3.** If `agent_config.json` is well-formed JSON but is missing a
> required field like `"model"`, which exception does `load_agent_config`
> actually catch?
> - A) `json.JSONDecodeError` — the file parses fine as JSON, so this isn't it
> - B) `ValidationError` — parsing succeeds, but the parsed dict doesn't match what `AgentConfig`'s fields require ✅
> - C) `FileNotFoundError`
> - D) No exception is raised in this case

> **Q4.** In the caught `ConfigError`, what does `e.__cause__` let calling
> code do?
> - A) Nothing — `__cause__` is only used internally by Python's traceback printer
> - B) Inspect exactly which underlying exception type caused the `ConfigError`, without needing to catch that original type directly ✅
> - C) Re-raise the exception a second time automatically
> - D) Access the original file's raw text

> **Q5.** Why does `logger.exception(...)` get called *before* each
> `raise ConfigError(...) from e`, rather than after?
> - A) It wouldn't matter either way — order is irrelevant here
> - B) `raise` immediately transfers control out of the function, so any code after it (including a log call) would never run ✅
> - C) `logger.exception()` can only be called before a `raise`, never after, as a language rule
> - D) Logging after `raise` would log the wrong exception

---

## Applied sandbox exercise 3

*(the full composed pipeline — file I/O, JSON, Pydantic validation,
custom exceptions with chaining, and logging, all in one function)*

*Starter code shown to learner:*
```python
import json
import logging
from pydantic import BaseModel, ValidationError

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


class AgentError(Exception):
    pass


class ConfigError(AgentError):
    pass


class ToolConfig(BaseModel):
    """
    Fields: tool_name: str, timeout: float, max_retries: int = 3
    """
    tool_name: str
    timeout: float
    max_retries: int = 3


def load_tool_config(path: str) -> ToolConfig:
    """
    Read and parse a JSON file at `path`, then validate it against
    ToolConfig.

    - FileNotFoundError -> log with logger.exception(), then raise
      ConfigError(f"config file not found: {path}") from the original
    - json.JSONDecodeError -> log with logger.exception(), then raise
      ConfigError(f"invalid JSON in {path}") from the original
    - pydantic.ValidationError -> log with logger.exception(), then
      raise ConfigError(f"invalid tool config in {path}: {e}") from
      the original

    On success, return the validated ToolConfig instance.
    """
    # TODO: implement the full pipeline
    pass
```

*Task shown to learner:* Implement `load_tool_config` following the exact
structure demonstrated in this section — open and parse the file, validate
against `ToolConfig`, and catch all three failure modes, each logging via
`logger.exception()` and re-raising as a chained `ConfigError` with the
specified message.

*Hidden test cases:*
```python
# setup:
# "good_tool.json": {"tool_name": "search", "timeout": 5.0}
# "missing_field.json": {"timeout": 5.0}
# "broken.json": {"tool_name": }
# "not_a_file.json" does not exist

config = load_tool_config("good_tool.json")
assert config.tool_name == "search"
assert config.max_retries == 3   # default applied

for path, expected_cause in [
    ("not_a_file.json", FileNotFoundError),
    ("broken.json", json.JSONDecodeError),
    ("missing_field.json", ValidationError),
]:
    try:
        load_tool_config(path)
        assert False, f"should have raised for {path}"
    except ConfigError as e:
        assert isinstance(e, AgentError)
        assert isinstance(e.__cause__, expected_cause)
```

*Hint (shown on request):* This follows the exact same shape as
`load_agent_config` from the walkthrough above — one `try` block wrapping
both the file-opening/parsing and the `ToolConfig(**raw)` construction,
with three `except` clauses below it. Each `except` should call
`logger.exception(...)` first, then `raise ConfigError(...) from e` —
order matters, since `raise` ends the block immediately.

*Correct answer + explanation (shown on failure, if requested):*
```python
def load_tool_config(path: str) -> ToolConfig:
    try:
        with open(path, "r") as f:
            raw = json.load(f)
        return ToolConfig(**raw)
    except FileNotFoundError as e:
        logger.exception(f"config file not found: {path}")
        raise ConfigError(f"config file not found: {path}") from e
    except json.JSONDecodeError as e:
        logger.exception(f"invalid JSON in {path}")
        raise ConfigError(f"invalid JSON in {path}") from e
    except ValidationError as e:
        logger.exception(f"invalid tool config in {path}")
        raise ConfigError(f"invalid tool config in {path}: {e}") from e
```
This is the lesson's complete arc in a single function: `with` guarantees
the file closes regardless of outcome, `json.load` parses the raw text,
`ToolConfig(**raw)` both constructs and validates in one step using
Pydantic's automatic checking from the previous lesson, three distinct
low-level failure modes all get translated into one coherent
`ConfigError` for callers to handle simply — while `from e` chaining and
`logger.exception()` mean nothing about the original, specific cause is
ever actually lost.

---

*(End of Concept 7 — final concept section of Lesson 6. This lesson
continues with the outcomes callout, comprehensive quiz, and comprehensive
sandbox, drafted separately.)*
