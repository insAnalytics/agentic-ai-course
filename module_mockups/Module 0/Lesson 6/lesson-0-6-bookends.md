# Perform I/O, Error Handling and Validation

> **You'll be able to**
> - Read and write files safely with `with`, choosing the right method
>   (`.read()`, `.readline()`, direct iteration, `.seek()`) for a given
>   situation
> - Parse and write both JSON and CSV data, and handle the specific ways
>   each format can fail to parse
> - Define your own exception hierarchy, and use `raise`/`raise ... from`
>   to re-raise or translate a low-level failure into a clearer one
>   without losing the original cause
> - Replace `print()`-based debugging with the `logging` module — levels,
>   formatted output, file-based logs, and `logger.exception()` for
>   errors specifically
> - Combine all of the above into one realistic pipeline: reading external
>   data, validating it against a Pydantic model, and handling every way
>   that can go wrong as one coherent, well-logged failure

**Why it matters**
An agent's entire relationship with the outside world runs through I/O —
reading a config, loading eval data, writing results, calling a tool that
might fail. None of that data arrives guaranteed to be well-formed, and
none of those operations are guaranteed to succeed. This lesson is about
building the habit of treating "the file might not exist," "the data
might be malformed," and "something needs to log this before it fails"
as the normal case to design for, not an edge case to bolt on afterward —
exactly the posture real agent code running against real, messy external
data actually needs.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all seven concepts, mixed order)*

> **Q1.** Why is `for line in f:` generally preferred over
> `f.readlines()` for processing a large file line by line?
> - A) `for line in f:` is only valid syntax for small files
> - B) `.readlines()` loads the entire file into memory at once; iterating the file object directly hands out one line at a time without ever holding the whole file in memory ✅
> - C) `.readlines()` doesn't actually work on text files
> - D) There's no real difference between the two

> **Q2.** What guarantee does `with open(...) as f:` provide that a plain
> `open()`/`.close()` pair doesn't?
> - A) It prevents any exception from occurring inside the block
> - B) The file is guaranteed to be closed when the block ends, whether it finishes normally or raises an exception ✅
> - C) It automatically retries on failure
> - D) It reads the file faster

> **Q3.** What's the difference between `json.load` and `json.loads`?
> - A) No difference, they're aliases
> - B) `json.load` reads from an already-open file object; `json.loads` parses an in-memory string ✅
> - C) `json.loads` is only for lists, not dicts
> - D) `json.load` is deprecated in favor of `json.loads`

> **Q4.** Why is `row["temperature"]` from a `csv.DictReader` generally
> more robust than `row[2]` from a plain `csv.reader`?
> - A) `DictReader` automatically converts strings to numbers
> - B) Looking up by column name doesn't break if a column gets reordered in the source file, unlike a fixed numeric position ✅
> - C) There's no real difference between the two
> - D) `csv.reader` doesn't support numeric indexing at all

> **Q5.** Given `class ToolError(AgentError): pass`, what does
> `except AgentError:` do when a `ToolError` is raised?
> - A) It doesn't catch it — only the exact type matches
> - B) It catches it — a `ToolError` is-an `AgentError` through inheritance ✅
> - C) It raises a second, unrelated exception
> - D) It only works if `ToolError` has no `__init__` of its own

> **Q6.** What does `raise ConfigError("...") from e` add, compared to
> just `raise ConfigError("...")` with no `from`?
> - A) Nothing functionally different — it's purely a style preference
> - B) It makes the relationship between the two exceptions explicit, producing a clearer "was the direct cause of" message and setting `__cause__` ✅
> - C) It suppresses the original exception's traceback entirely
> - D) It converts `ConfigError` into a warning

> **Q7.** What does `logger.exception("tool call failed")` do that
> `logger.error("tool call failed")` doesn't?
> - A) Nothing — they're identical
> - B) `logger.exception()` automatically attaches the traceback of the exception currently being handled ✅
> - C) `logger.exception()` suppresses the exception instead of letting it propagate
> - D) `logger.exception()` can only be called outside of `try`/`except`

> **Q8.** In `logger.debug("calling %s with %s", tool_name, arguments)`,
> when `DEBUG` is filtered out by the configured level, what happens to
> the substitution of `tool_name` and `arguments` into the message?
> - A) It still happens every time, exactly like an f-string would
> - B) It's skipped entirely — `logging` only performs the substitution if the message is actually going to be emitted ✅
> - C) It happens once, then gets cached
> - D) `%s` placeholders always raise an error when filtered

> **Q9.** In a function that catches `FileNotFoundError`,
> `json.JSONDecodeError`, and `pydantic.ValidationError`, then raises the
> same `ConfigError` in every case, what's the benefit of that shared
> exception type?
> - A) It's a mistake — each should raise something different
> - B) Calling code can handle "config loading failed" as one coherent case, while `from e` still preserves exactly which underlying failure occurred ✅
> - C) `ConfigError` is required syntax for every `except` block
> - D) The three underlying exception types are actually identical

---

## Comprehensive sandbox

*(end of lesson, applied — combines all seven concepts in a new scenario:
batch-loading agent configs from a CSV instead of a single JSON file,
validating each row individually with Pydantic, collecting the valid
ones while logging and skipping invalid ones, and raising a custom,
chained exception only if the file itself can't be read or nothing valid
comes out of it at all.)*

*Starter code shown to learner:*
```python
import csv
import logging
from pydantic import BaseModel, ValidationError

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


class AgentError(Exception):
    pass


class ConfigError(AgentError):
    pass


class AgentConfig(BaseModel):
    """Fields: name: str, model: str, temperature: float"""
    name: str
    model: str
    temperature: float


def load_agent_configs_from_csv(path: str) -> list:
    """
    Read a CSV file at `path` with columns: name, model, temperature.

    For each row:
      - try to build an AgentConfig from it directly (AgentConfig(**row))
        — Pydantic will coerce the CSV string values on its own
      - if a row fails validation (ValidationError), log it with
        logger.exception() and skip that row — do NOT let one bad row
        stop the others from being processed

    If the file itself doesn't exist (FileNotFoundError), log it and
    raise ConfigError(f"config file not found: {path}") from the
    original exception.

    After processing every row, if the resulting list of valid configs
    is empty, raise ConfigError(f"no valid agent configs found in {path}")
    (no chaining needed here — there's no single underlying exception to
    point to).

    Otherwise, return the list of valid AgentConfig instances.
    """
    # TODO: implement
    pass
```

*Task shown to learner:* Implement `load_agent_configs_from_csv` exactly
as described — read the CSV with `csv.DictReader`, validate each row
individually (skipping and logging failures rather than aborting the
whole function), handle a missing file with chaining, and raise a final
`ConfigError` if nothing valid was found.

*Hidden test cases:*
```python
# setup: "agents.csv" contains:
# name,model,temperature
# research_agent,claude-sonnet,0.7
# support_agent,claude-haiku,0.3
# broken_agent,claude-sonnet,hot
#
# setup: "all_broken.csv" contains:
# name,model,temperature
# broken_agent,claude-sonnet,hot
#
# "missing.csv" does not exist

configs = load_agent_configs_from_csv("agents.csv")
assert len(configs) == 2   # the "hot" row is skipped, not fatal
names = {c.name for c in configs}
assert names == {"research_agent", "support_agent"}
assert all(isinstance(c.temperature, float) for c in configs)

try:
    load_agent_configs_from_csv("missing.csv")
    assert False, "should have raised"
except ConfigError as e:
    assert isinstance(e, AgentError)
    assert isinstance(e.__cause__, FileNotFoundError)

try:
    load_agent_configs_from_csv("all_broken.csv")
    assert False, "should have raised"
except ConfigError as e:
    assert "no valid agent configs found" in str(e)
    assert e.__cause__ is None   # not chained — no single exception caused this
```

*Hint (shown on request):* Structure: one `try` around
`with open(path, "r") as f:` / `csv.DictReader(f)`, catching
`FileNotFoundError` around the whole read. Inside the loop over rows, a
*separate*, inner `try`/`except ValidationError` around
`AgentConfig(**row)` — that's what lets one bad row get logged and
skipped without stopping the loop, which is different from Concept 7's
version, where any validation failure stopped the whole function. After
the loop, a plain `if not results: raise ConfigError(...)` — with no
`from`, since there's no single exception to chain from at that point.

*Correct answer + explanation (shown on failure, if requested):*
```python
def load_agent_configs_from_csv(path: str) -> list:
    results = []
    try:
        with open(path, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    results.append(AgentConfig(**row))
                except ValidationError:
                    logger.exception(f"skipping invalid row: {row}")
    except FileNotFoundError as e:
        logger.exception(f"config file not found: {path}")
        raise ConfigError(f"config file not found: {path}") from e

    if not results:
        raise ConfigError(f"no valid agent configs found in {path}")

    return results
```
This is a deliberately different composition than Concept 7's pipeline,
not a repeat of it: validation failures here are *recoverable*, handled
per-row with their own inner `try`/`except` so one bad row doesn't sink
the whole batch — while a missing file is still fatal, chained with `from
e` exactly as before. The final `if not results:` check shows that not
every `raise` needs a `from` — chaining only makes sense when there's an
actual underlying exception causing the new one, which isn't the case
when the failure is "nothing succeeded" rather than "this one specific
thing broke." Every piece from this lesson — `with`, CSV, Pydantic
validation and its automatic coercion, a custom exception hierarchy,
selective chaining, and logging — is doing real, distinct work in one
realistic function.
