# Code Execution as a Tool

## Intro

> **You'll be able to**
> - Explain why a code-execution tool is the most capable tool an agent can have, and why the code it runs must be treated as untrusted
> - Explain why hiding names from `exec()` is not a sandbox, using the one well-known example
> - Compare the real isolation boundaries (a separate process, a container, a micro-VM, WebAssembly) by strength and cost
> - Explain how WebAssembly, and Pyodide in particular, contains code by starting from no capability at all
> - Build the tool around a sandbox: output capture, errors as observations, output limits, a time limit, and wiring it into the agent loop

**Why it matters**

Every other tool in this module does one fixed thing, so its worst case is known in advance. A code-execution tool's worst case is whatever the model writes, and the model can be wrong, or steered by text it has read. That makes this the tool where getting isolation right matters most, and where the most tempting shortcut, restricting `exec()` in your own process, is quietly unsafe.

The good news is that the safe version is routine. Real isolation is a solved, well-understood problem, and you've been using one form of it throughout this course without noticing: every exercise has run your code inside Pyodide's WebAssembly sandbox. This lesson makes that boundary visible, and shows that the tool you write around it is the same small, careful wrapper whatever sits underneath.

---

## Recap & Practice

### Comprehensive quiz

*(spans all four concepts, mixed order)*

> **Q1.** Why is model-written code treated as untrusted, even from a model that isn't malicious?
> - A) Models always write lower-quality code than people
> - B) The model can make mistakes, and instruction-like text it has read can steer the code it writes ✅
> - C) Only code that imports `os` is untrusted
> - D) It's untrusted until a linter has checked it
>
> *Explanation:* Neither failure needs bad intent. An honest mistake and a manipulated model both produce code you didn't expect.

> **Q2.** A tool runs model code with `exec(code, {"__builtins__": {}})`. Is that a sandbox?
> - A) Yes, since no dangerous names are available
> - B) Yes, as long as underscores are also blocked
> - C) No, because the code still runs in your process with its full power, and can reach capability through Python's own objects ✅
> - D) No, because `exec` ignores its globals argument
>
> *Explanation:* Hiding names isn't removing capability. The code shares your interpreter, so the boundary has to be outside it.

> **Q3.** Moving from a separate process to a container to a micro-VM, what generally increases?
> - A) Only startup time
> - B) Only boundary strength
> - C) Neither; they're equivalent
> - D) Both boundary strength and per-run overhead ✅
>
> *Explanation:* Stronger isolation costs more per run. The right choice depends on how hostile the code might be and how fast each run must start.

> **Q4.** What makes WebAssembly a strong boundary for running untrusted code?
> - A) Wasm code starts with no access to the host's files, network or processes, and gets only what the host explicitly grants ✅
> - B) Wasm scans code for dangerous patterns before running it
> - C) Wasm only runs code written in WebAssembly
> - D) Wasm runs code faster than native
>
> *Explanation:* Starting from zero capability and granting narrowly is far easier to get right than trying to take capability away.

> **Q5.** Why does this course's in-browser Python let exercises write files, safely?
> - A) The files are written to a temporary folder on your disk and deleted afterward
> - B) Pyodide's filesystem lives in memory inside the sandbox and never touches your real disk ✅
> - C) File writes are faked and nothing is actually stored
> - D) Only reads are allowed
>
> *Explanation:* The files are real to the code and isolated from your machine, which is exactly the property a code-execution tool needs.

> **Q6.** Model-written code computes a value but never prints it. What should the tool return?
> - A) An empty string
> - B) An error, since nothing happened
> - C) A note that the code ran but printed nothing, so the model knows to print its result ✅
> - D) The value of the last variable assigned
>
> *Explanation:* The model only sees what the tool returns. A blank result is a confusing non-answer; a note tells it what to change.

> **Q7.** Model-written code contains an infinite loop. Which protection handles it?
> - A) Emptying `__builtins__`
> - B) Truncating the output
> - C) The allowlist of available names
> - D) A time limit on the run, which stops the code and reports it to the model ✅
>
> *Explanation:* A loop needs no dangerous names at all, so no namespace restriction stops it. Only a limit on how long it runs does.

> **Q8.** Why is it worth keeping an allowlist of names, if it isn't the real protection?
> - A) It catches honest mistakes early with a clear error, and makes the intended surface explicit ✅
> - B) It's what actually keeps the code from reaching your files
> - C) The model API requires it
> - D) It makes the code run faster
>
> *Explanation:* A stray `open()` fails immediately with a `NameError` the model can read and fix. The safety still comes from the sandbox underneath.

---

### Comprehensive sandbox

*(applied, multi-file — a code-execution agent with a time limit)*

> **Note for the site build:** `sandbox.py` enforces its time limit with `sys.settrace`, counting executed lines. Please confirm `sys.settrace` behaves the same under Pyodide as under CPython before publishing; the hidden tests were verified on CPython 3.12.

**Task shown to learner:** The agent can run Python through one tool, `run_python`. `sandbox.py`, which is read-only, provides `run_in_sandbox(code, sandbox_globals, max_steps)`. It runs the code, returns what it printed, and raises `SandboxTimeout` if the code executes more than `max_steps` lines: a deterministic stand-in for a wall-clock limit, which is what stops an infinite loop. Complete `agent.py`:

- **`code_execution_tool(code, max_steps)`:** run the code with globals of `{"__builtins__": {}, **ALLOWED_NAMES}` and return `{"content": ..., "is_error": ...}`:
  - `SandboxTimeout`: an error saying the code took too long and was stopped
  - any other exception: `"Error: <ExceptionType>: <message>"`, as an error
  - no output: a note telling the model to `print()` its result, not an error
  - output over `MAX_OUTPUT_CHARS`: cut to that length, with a truncation marker
  - otherwise: the output with its trailing newline stripped
- **`run_agent(llm, user_message, max_steps, code_step_budget)`:** the collect-every-call loop:
  - offer `[RUN_PYTHON_TOOL]` on every request
  - answer each `run_python` call with `code_execution_tool(call.input["code"], code_step_budget)`, adding `"is_error": True` only on failure
  - answer any other tool name locally as an error
  - return the text once a response has no calls, or a step-limit message if `max_steps` runs out

**Tab: `sandbox.py`** (read-only)
```python
# the sandbox boundary -- read-only. In this course the real boundary is Pyodide;
# this module adds the one thing Pyodide alone doesn't: a limit on how long code runs.
import contextlib
import io
import sys

class SandboxTimeout(Exception):
    """The code ran for more than its step budget."""

def run_in_sandbox(code: str, sandbox_globals: dict, max_steps: int = 100_000) -> str:
    captured = io.StringIO()
    steps = 0

    # counts every line the code executes, and stops it once the budget is spent
    def budget(frame, event, arg):
        nonlocal steps
        if event == "line":
            steps += 1
            if steps > max_steps:
                raise SandboxTimeout(f"stopped after {max_steps:,} steps")
        return budget

    sys.settrace(budget)
    try:
        with contextlib.redirect_stdout(captured):
            exec(code, sandbox_globals)
    finally:
        sys.settrace(None)
    return captured.getvalue()
```

**Tab: `agent.py`** (starter, entry file)
```python
import math
from sandbox import run_in_sandbox, SandboxTimeout

MAX_OUTPUT_CHARS = 2000
ALLOWED_NAMES = {"print": print, "sum": sum, "range": range, "len": len, "min": min, "max": max,
                 "sorted": sorted, "round": round, "abs": abs, "math": math}

RUN_PYTHON_TOOL = {
    "name": "run_python",
    "description": "Run Python code and return what it prints. Use it for calculations and data reshaping. "
                   "Only print, sum, range, len, min, max, sorted, round, abs and the math module are available. "
                   "Always print() the result you want back.",
    "input_schema": {"type": "object", "properties": {"code": {"type": "string"}}, "required": ["code"]},
}

def code_execution_tool(code: str, max_steps: int = 100_000) -> dict:
    # TODO: run the code in the sandbox with only ALLOWED_NAMES available, and turn
    # the outcome into {"content": ..., "is_error": ...}: a step-budget timeout,
    # any other error, no output, too much output, or a normal result
    ...

def run_agent(llm, user_message: str, max_steps: int = 10, code_step_budget: int = 100_000) -> str:
    # TODO: the collect-every-call loop, offering [RUN_PYTHON_TOOL] on every request
    # and answering each run_python call with code_execution_tool
    ...
```

**Hidden tests:**
```python
from fake import *
import time
from agent import code_execution_tool, run_agent, RUN_PYTHON_TOOL

# 1. a result is computed and returned
assert code_execution_tool("print(round(sum(range(1, 11)) / 10, 1))") == {"content": "5.5", "is_error": False}

# 2. an infinite loop is stopped by the step budget and reported, quickly
start = time.perf_counter()
r = code_execution_tool("while True:\n    x = 1", max_steps=20_000)
assert r["is_error"] is True and "too long" in r["content"], r
assert time.perf_counter() - start < 5

# 3. a name outside the allowlist fails cleanly
r = code_execution_tool("print(open('/etc/hosts').read())")
assert r["is_error"] is True and "NameError" in r["content"]

# 4. empty output and huge output are both handled
assert "nothing" in code_execution_tool("y = 3")["content"]
r = code_execution_tool("for i in range(5000): print(i)")
assert "truncated" in r["content"] and len(r["content"]) < 2200

# 5. in the loop: a text block, then two code calls in one response; both run, results pair by id
a = ToolUseBlock(name="run_python", input={"code": "print(max([3, 9, 4]))"})
b = ToolUseBlock(name="run_python", input={"code": "print(1 / 0)"})
llm = ToolAwareClient([[TextBlock(text="Computing."), a, b], [TextBlock(text="The max is 9; the division failed.")]])
assert run_agent(llm, "go") == "The max is 9; the division failed."
results = llm.seen[1][-1]["content"]
assert [x["tool_use_id"] for x in results] == [a.id, b.id]
assert results[0]["content"] == "9" and "is_error" not in results[0]
assert results[1]["is_error"] is True and "ZeroDivisionError" in results[1]["content"]
assert llm.tools_seen[0] == [RUN_PYTHON_TOOL]

# 6. a runaway loop inside the agent doesn't hang the agent; the model sees the error and recovers
llm = ToolAwareClient([
    [ToolUseBlock(name="run_python", input={"code": "n = 0\nwhile n >= 0:\n    n += 1"})],
    [ToolUseBlock(name="run_python", input={"code": "print(sum(range(100)))"})],
    [TextBlock(text="4950")],
])
assert run_agent(llm, "sum 0..99", code_step_budget=20_000) == "4950"
assert "too long" in llm.seen[1][-1]["content"][0]["content"]

# 7. an unknown tool name is answered locally
llm = ToolAwareClient([[ToolUseBlock(name="run_shell", input={"cmd": "ls"})], [TextBlock(text="ok")]])
run_agent(llm, "x")
assert llm.seen[1][-1]["content"][0]["is_error"] is True
```

**Hint (shown on request):** `code_execution_tool` is Concept 4's exercise with one more `except` clause, for `SandboxTimeout`, placed *before* the general `except Exception` so a timeout gets its own message. `run_agent` is the loop from the previous lessons with a single tool; for each call, check its name, then turn `code_execution_tool`'s dict into a `tool_result`.

**Reference solution — `agent.py`:**
```python
import math
from sandbox import run_in_sandbox, SandboxTimeout

MAX_OUTPUT_CHARS = 2000
ALLOWED_NAMES = {"print": print, "sum": sum, "range": range, "len": len, "min": min, "max": max,
                 "sorted": sorted, "round": round, "abs": abs, "math": math}

RUN_PYTHON_TOOL = {
    "name": "run_python",
    "description": "Run Python code and return what it prints. Use it for calculations and data reshaping. "
                   "Only print, sum, range, len, min, max, sorted, round, abs and the math module are available. "
                   "Always print() the result you want back.",
    "input_schema": {"type": "object", "properties": {"code": {"type": "string"}}, "required": ["code"]},
}

def code_execution_tool(code: str, max_steps: int = 100_000) -> dict:
    try:
        output = run_in_sandbox(code, {"__builtins__": {}, **ALLOWED_NAMES}, max_steps)
    except SandboxTimeout as e:
        return {"content": f"Error: the code took too long and was stopped ({e}). Check for an infinite loop.", "is_error": True}
    except Exception as e:
        return {"content": f"Error: {type(e).__name__}: {e}", "is_error": True}
    if output == "":
        return {"content": "(the code ran but printed nothing; use print() to return a result)", "is_error": False}
    if len(output) > MAX_OUTPUT_CHARS:
        output = output[:MAX_OUTPUT_CHARS] + f"\n... (output truncated at {MAX_OUTPUT_CHARS} characters)"
    return {"content": output.rstrip("\n"), "is_error": False}

def run_agent(llm, user_message: str, max_steps: int = 10, code_step_budget: int = 100_000) -> str:
    messages = [{"role": "user", "content": user_message}]
    for step in range(max_steps):
        response = llm.create(messages=messages, tools=[RUN_PYTHON_TOOL])
        messages.append({"role": "assistant", "content": response.content})
        tool_calls = [block for block in response.content if block.type == "tool_use"]
        if not tool_calls:
            return "".join(block.text for block in response.content if block.type == "text")
        results = []
        for call in tool_calls:
            if call.name != "run_python":
                results.append({"type": "tool_result", "tool_use_id": call.id,
                                "content": f"Error: there is no tool called {call.name}", "is_error": True})
                continue
            outcome = code_execution_tool(call.input["code"], code_step_budget)
            result = {"type": "tool_result", "tool_use_id": call.id, "content": outcome["content"]}
            if outcome["is_error"]:
                result["is_error"] = True
            results.append(result)
        messages.append({"role": "user", "content": results})
    return f"stopped after {max_steps} steps without a final answer"
```

**Explanation:** Each test targets one thing a code-execution tool has to survive:

- **Runaway code:** an infinite loop is stopped and reported in well under five seconds (test 2), and inside the agent the model sees "took too long", writes better code, and still finishes the task (test 6). No namespace restriction could have caught that loop; only a limit on running time does.
- **The allowlist as a filter:** `open` isn't available, so the attempt fails with a clear `NameError` (test 3). The real protection is the sandbox boundary underneath, which in this course is Pyodide.
- **Tool-shaping from Lesson 3:** empty output gets a note, and runaway output is truncated (test 4).
- **The loop's edge cases:** a text block before two calls in one response, one succeeding and one raising, both paired to their calls (test 5), and an unknown tool answered locally (test 7).

The `run_python` description matters too. It lists exactly which names exist and tells the model to print its result, [Lesson 1's description-as-prompt rule](→ this module, designing tools a model can use well lesson, names and descriptions as prompts concept) applied to the one tool where a vague description costs the most retries.
