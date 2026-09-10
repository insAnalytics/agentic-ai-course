# Module 0, Lesson 6 — Concept 6: Logging

---

## Why `print()` stops being enough

`print()` has been a fine debugging tool for this entire course so far —
but it has real limits the moment code is actually running somewhere
other than your own terminal while you watch it. A few concrete gaps:

- **No severity** — a genuine error and a routine status update look
  identical.
- **No way to turn it off** without deleting or commenting out the line.
- **No built-in way to route it elsewhere** — a file, a monitoring
  system — without rewriting every call site by hand.

The `logging` module (standard library, no install needed) solves all
three.

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("agent started")
logger.warning("config file missing, using defaults")
```
```
INFO:__main__:agent started
WARNING:__main__:config file missing, using defaults
```
*(runs live, shows output — read-only demo snippet, not graded)*

`logging.basicConfig(level=logging.INFO)` sets up basic output once, at
the start of a program. `logging.getLogger(__name__)` is the standard
pattern for getting a logger — [`__name__` is the same built-in variable from the modules and imports concept](→ Module 0, the functions lesson, modules and imports concept, the __name__ explanation), which here identifies *which module* a log message came from, useful the moment a program has more than one file logging things.

---

## Levels — severity, not just on/off

Every log call has a **level**, in increasing order of severity:
`DEBUG` < `INFO` < `WARNING` < `ERROR` < `CRITICAL`. Setting a level in
`basicConfig` filters out anything *below* it — this is the mechanism
that replaces "comment out the print statement":

```python
import logging

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

logger.debug("checking config values")      # filtered out — below WARNING
logger.info("agent started")                # filtered out — below WARNING
logger.warning("config file missing")       # shown
logger.error("failed to connect to tool")   # shown
```
```
WARNING:__main__:config file missing
ERROR:__main__:failed to connect to tool
```
*(runs live, shows output — read-only demo snippet, not graded)*

Setting `level=logging.WARNING` means only `WARNING` and above actually
print — `DEBUG` and `INFO` calls stay in the code, ready to turn back on
by changing one line (`level=logging.DEBUG`), rather than needing to be
found and uncommented one by one. This is the core practical advantage
over `print()`: the same code can be verbose during development and quiet
in production, controlled by a single setting.

---

## `logger.exception()` — the bridge back to error handling

Recall [the re-raising pattern from the previous section](→ this lesson, re-raising and exception chaining concept, the re-raising explanation): observe a failure, then let it continue. `logger.exception()` is the real version of the `print()` placeholder used there — call it from inside an `except` block, and it automatically includes the full traceback in the log output, not just whatever message you write:

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_tool(name: str):
    if name != "search":
        raise ValueError(f"unknown tool: {name}")
    return "ok"

def run_with_logging(name: str):
    try:
        return run_tool(name)
    except ValueError:
        logger.exception("tool call failed")
        raise

run_with_logging("unknown_tool")
```
```
ERROR:__main__:tool call failed
Traceback (most recent call last):
  File "script.py", line 12, in run_with_logging
    return run_tool(name)
  File "script.py", line 8, in run_tool
    raise ValueError(f"unknown tool: {name}")
ValueError: unknown tool: unknown_tool
Traceback (most recent call last):
  File "script.py", line 16, in <module>
    run_with_logging("unknown_tool")
  File "script.py", line 12, in run_with_logging
    return run_tool(name)
  File "script.py", line 8, in run_tool
    raise ValueError(f"unknown tool: {name}")
ValueError: unknown tool: unknown_tool
```
*(runs live, shows output — read-only demo snippet, not graded)*

`logger.exception("tool call failed")` is specifically meant to be called
from inside an `except` block — it logs at `ERROR` level and
automatically attaches the traceback of whatever's currently being
handled, without you having to format or extract it yourself. The bare
`raise` immediately after still re-raises the original exception, exactly
as before — logging it doesn't change or suppress it. The message you
pass (`"tool call failed"`) is your own context describing *what
operation* was happening; the automatically-attached traceback supplies
*what actually broke*.

---

## Formatting output, and logging to a file

The default output so far — `WARNING:__main__:config file missing` — is
missing something every real log line needs: a timestamp. `basicConfig`
accepts a `format` string to control exactly what each log line includes:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

logger.info("agent started")
logger.warning("config file missing, using defaults")
```
```
2026-03-14 09:41:02,118 [INFO] __main__: agent started
2026-03-14 09:41:02,118 [WARNING] __main__: config file missing, using defaults
```
*(runs live, shows output — read-only demo snippet, not graded)*

`%(asctime)s`, `%(levelname)s`, `%(name)s`, and `%(message)s` are
placeholders `logging` fills in for you — the timestamp, the level, the
logger's name (from `__name__`), and the message you passed. This
particular `%(...)`s syntax is specific to `logging`'s format strings, not
the same thing as an f-string or the `%s`-style formatting covered next.

`basicConfig` also accepts `filename`, which routes every log call to a
file instead of the terminal — directly relevant for exactly the kind of
pipeline this lesson has been building, where nobody's necessarily
watching a terminal when it runs:

```python
import logging

logging.basicConfig(
    filename="agent.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

logger.info("agent started")
```
*(writes to agent.log instead of printing — not shown as terminal output,
since nothing prints to the terminal in this mode)*

Reading `agent.log` back afterward with
[the plain file-reading techniques from earlier in this lesson](→ this lesson, file I/O and context managers concept, the reading a file explanation) shows exactly the same formatted lines that would otherwise have gone to the terminal.

---

## Lazy message formatting

There's a subtle cost worth knowing about how a log message gets built.
Compare these two calls:

```python
import logging

logging.basicConfig(level=logging.WARNING)   # DEBUG is filtered out
logger = logging.getLogger(__name__)

tool_name = "search"
arguments = {"query": "a very long value that's expensive to format into a string"}

logger.debug(f"calling {tool_name} with {arguments}")        # the f-string still runs
logger.debug("calling %s with %s", tool_name, arguments)     # the formatting is skipped entirely
```
*(not run live — both produce no visible output, since DEBUG is filtered;
the difference is in what work happens behind the scenes, not what's
printed)*

The first call's f-string is built *immediately*, the moment that line
executes — Python has to construct the full message string before it can
even hand it to `logger.debug()`, regardless of whether `DEBUG` is
actually going to be shown. The second call passes `tool_name` and
`arguments` separately, and `%s` is `logging`'s own placeholder syntax
(distinct from an f-string) — `logging` only substitutes them into the
message *if* the log call is actually going to be emitted, skipping the
formatting work entirely when the level filters it out. This rarely
matters for a short string, but matters a great deal for something
expensive to format — a large object, a big dict — inside a `DEBUG` call
that's disabled in normal operation, called frequently in a hot loop.

---

## Quiz cards

> **Q1.** What's a concrete limitation `print()` has that the `logging`
> module addresses?
> - A) `print()` can't output text at all in some environments
> - B) `print()` has no severity levels, no built-in way to disable output without editing code, and no built-in way to route output elsewhere ✅
> - C) `print()` is slower than `logging` in every case
> - D) `print()` doesn't work inside functions

> **Q2.** What does setting `logging.basicConfig(level=logging.WARNING)`
> actually do?
> - A) It deletes every `logger.debug()` and `logger.info()` call
> - B) It filters output so only messages at `WARNING` severity or higher are actually shown — lower-severity calls stay in the code but produce no output ✅
> - C) It converts all log calls into `print()` calls
> - D) It only affects the very next log call

> **Q3.** What are the five standard logging levels, in increasing order
> of severity?
> - A) `INFO`, `DEBUG`, `WARNING`, `ERROR`, `CRITICAL`
> - B) `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL` ✅
> - C) `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `FATAL`
> - D) There's only one level; `logging` doesn't support severity

> **Q4.** What does `logger.exception("tool call failed")` do that
> `logger.error("tool call failed")` doesn't?
> - A) Nothing — they're identical
> - B) `logger.exception()` automatically attaches the traceback of the exception currently being handled; `logger.error()` only logs the message you give it ✅
> - C) `logger.exception()` suppresses the exception instead of letting it propagate
> - D) `logger.exception()` can only be called outside of a `try`/`except` block

> **Q5.** Why is `logging.getLogger(__name__)` the standard pattern,
> rather than a single global logger shared with a fixed name?
> - A) `__name__` is required syntax and has no other purpose
> - B) It identifies which module a log message actually came from, which becomes useful the moment a program spans more than one file ✅
> - C) `getLogger()` doesn't accept any other kind of argument
> - D) It's purely a style convention with no functional difference

> **Q6.** What does passing `filename="agent.log"` to `basicConfig` do?
> - A) It has no effect unless `level` is also set
> - B) It routes every log call to that file instead of printing to the terminal ✅
> - C) It only affects `logger.exception()` calls
> - D) It creates a new logger object, separate from `getLogger()`

> **Q7.** Given `logger.debug("calling %s with %s", tool_name, arguments)`
> where `DEBUG` is filtered out by the configured level, what happens to
> the formatting work of substituting `tool_name` and `arguments` into
> the message?
> - A) It still happens every time, exactly like an f-string would
> - B) It's skipped entirely — `logging` only performs the substitution if the message is actually going to be emitted ✅
> - C) It happens once, then gets cached for future calls
> - D) `%s` placeholders always raise an error when the level filters the message

---

*(End of Concept 6. This lesson continues with Concept 7 — putting it
together: loading and validating external data — drafted separately.)*
