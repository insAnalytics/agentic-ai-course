# Module 3, Lesson 8 — Concept 4: WebAssembly and Pyodide

---

## You've been using a code sandbox this whole course

Every runnable demo and graded exercise in this course executes Python in your browser, with no server running your code. That's **Pyodide**: the CPython interpreter compiled to **WebAssembly** (Wasm), a low-level instruction format that browsers run in a tightly sandboxed environment. It's the [WebAssembly isolation from the previous concept](→ this lesson, real isolation and the tool around it concept), and it's a real, production-grade example of the approach.

The reason this course can hand you a code editor that runs arbitrary Python, safely, on a static site with no backend, is exactly the property a code-execution tool needs: **Wasm code can reach nothing outside its runtime unless the host explicitly hands it in.**

## What the Wasm boundary gives you

A Wasm runtime starts with no ambient access at all:

- **No filesystem.** Pyodide has an in-memory filesystem that exists only inside the sandbox. Code can write to it, and it vanishes when the sandbox is torn down. It never touches your real disk. That's why [the multi-file exercises in this course](→ Module 2, writing the loop by hand lesson) can have code read and write files: those files live entirely in the sandbox.
- **No network.** Wasm has no built-in way to open a socket. Any network access has to be deliberately provided by the host, and this course provides none, which is why exercises simulate external services rather than call them.
- **No host process.** The code runs on a Wasm virtual machine, not as a process on your computer. The subclasses walk from [Concept 2](→ this lesson, why restricted execution isnt a sandbox concept) can still *run* inside Pyodide, and it reaches nothing that matters, because there's no host filesystem or network on the other side to reach.

That last point is the whole idea. In-process restriction tried to take capability *away* from code running in a powerful place. Wasm starts from *no* capability and adds back only what the host chooses. Starting from nothing is a far easier thing to get right than trying to subtract every possible path to something.

## The tradeoffs

Wasm isolation is strong, portable and quick to start, but it isn't free:

- **Not everything runs.** A Wasm build of a language supports most, not all, of its libraries. Pyodide ports a large scientific stack, but a package relying on unsupported system calls may not work.
- **Some overhead.** Code runs somewhat slower than native, and there's memory cost to the runtime.
- **Provisioning what's needed is on you.** A task that legitimately needs a file or a network result requires the host to hand it in deliberately, which is more work than just letting code do anything, and is exactly the point.

For an agent's code-execution tool, this is often the sweet spot: a strong boundary, fast enough to start on every call, with the host in full control of what crosses it. It's not the only good answer, containers and micro-VMs are widely used, but it's a real one, and it's the one you've been running on all along.

---

## Quiz cards

> **Q1.** What runs this course's in-browser Python exercises?
> - A) A Python process on a course server
> - B) Pyodide: CPython compiled to WebAssembly, sandboxed in your browser ✅
> - C) A restricted `exec` with builtins removed
> - D) A container started per exercise
>
> *Explanation:* It's the Wasm approach, running client-side. No server executes your code, which is only safe because the Wasm boundary contains it.

> **Q2.** Why can a Pyodide sandbox let code read and write files safely?
> - A) It scans the code for dangerous file operations first
> - B) Its filesystem is in-memory inside the sandbox and never touches your real disk ✅
> - C) It only allows reading, never writing
> - D) File access is disabled entirely
>
> *Explanation:* The files are real to the code and isolated from your machine. They exist only inside the sandbox and disappear with it.

> **Q3.** How is the Wasm approach fundamentally different from in-process restriction?
> - A) It hides more builtins
> - B) It starts from no capability and adds back only what the host grants, rather than trying to subtract capability from a powerful environment ✅
> - C) It runs the code faster
> - D) It uses `eval` instead of `exec`
>
> *Explanation:* Subtracting every path to danger is error-prone, as Concept 2 showed. Starting from nothing and granting narrowly is far easier to get right.

> **Q4.** The subclasses walk from Concept 2 runs fine inside Pyodide. Why isn't that a problem?
> - A) Pyodide blocks that specific expression
> - B) There's no host filesystem, network or process on the other side for it to reach ✅
> - C) Pyodide detects and stops the walk at runtime
> - D) It only works outside a browser
>
> *Explanation:* The expression reaching a class matters only if that class can touch something real. In a sandbox with nothing behind it, reaching it accomplishes nothing.

---

## Applied sandbox exercise

*(graded — a complete code-execution tool wrapper)*

**Task shown to learner:** Implement `code_execution_tool(code, allowed_names)`, the wrapper around a sandbox. `run_in_sandbox(code, sandbox_globals)` is provided; it runs the code and returns its printed output. (In this course that's Pyodide; the wrapper is identical whatever the boundary.) Return a dict with `content` and `is_error`:

- Run the code with globals of `{"__builtins__": {}, **allowed_names}`, so only the names in `allowed_names` are available.
- If it raises, return `is_error` `True` and `content` of `"Error: <ExceptionType>: <message>"`.
- If it produces no output, return `is_error` `False` and a note telling the model to `print()` its result.
- If the output is longer than `MAX_OUTPUT_CHARS`, keep that many characters and append a truncation marker.
- Otherwise return the output with any trailing newline stripped, `is_error` `False`.

**Provided code:**
```python
import io
import contextlib

MAX_OUTPUT_CHARS = 2000

def run_in_sandbox(code: str, sandbox_globals: dict) -> str:
    captured = io.StringIO()
    with contextlib.redirect_stdout(captured):
        exec(code, sandbox_globals)
    return captured.getvalue()
```

**Starter code:**
```python
def code_execution_tool(code: str, allowed_names: dict) -> dict:
    # TODO: run the code with only allowed_names available, and turn the
    # outcome (output, nothing, error, or too much output) into an observation
    ...
```

**Hidden tests:**
```python
import math
tools = {"print": print, "sum": sum, "range": range, "len": len, "math": math}

# 1. a computed result is captured and returned
r = code_execution_tool("print(sum(range(101)))", tools)
assert r == {"content": "5050", "is_error": False}, r

# 2. an allowed module works; a name not in allowed_names is unavailable
assert code_execution_tool("print(math.sqrt(144))", tools)["content"] == "12.0"
r = code_execution_tool("print(open('/etc/passwd'))", tools)
assert r["is_error"] is True and "NameError" in r["content"]

# 3. code that prints nothing gets a helpful note, not an empty string
r = code_execution_tool("x = 5 * 5", tools)
assert r["is_error"] is False and "nothing" in r["content"]

# 4. an exception comes back as an observation naming the error type
r = code_execution_tool("print(1/0)", tools)
assert r["is_error"] is True and "ZeroDivisionError" in r["content"]

# 5. runaway output is truncated with a marker, not sent whole
r = code_execution_tool("for i in range(10000): print(i)", tools)
assert r["is_error"] is False and "truncated" in r["content"] and len(r["content"]) < 2200

# 6. trailing newline from print() is stripped
assert code_execution_tool("print('done')", tools)["content"] == "done"
```

**Hint (shown on request):** Wrap the `run_in_sandbox` call in `try`/`except Exception as e`, and build the globals with `{"__builtins__": {}, **allowed_names}` so the allowlist is the only surface. Check the empty-output case before the length case, and strip the trailing newline last.

**Reference solution:**
```python
def code_execution_tool(code: str, allowed_names: dict) -> dict:
    try:
        output = run_in_sandbox(code, {"__builtins__": {}, **allowed_names})
    except Exception as e:
        return {"content": f"Error: {type(e).__name__}: {e}", "is_error": True}
    if output == "":
        return {"content": "(the code ran but printed nothing; use print() to return a result)", "is_error": False}
    if len(output) > MAX_OUTPUT_CHARS:
        output = output[:MAX_OUTPUT_CHARS] + f"\n... (output truncated at {MAX_OUTPUT_CHARS} characters)"
    return {"content": output.rstrip("\n"), "is_error": False}
```

**Explanation:** This is every tool-shaping idea in the module applied to the riskiest tool. The allowlist (test 2) is the convenience filter from [Concept 2](→ this lesson, why restricted execution isnt a sandbox concept): a stray `open()` fails cleanly with a `NameError` the model can read, though the real safety is the sandbox `run_in_sandbox` stands for, not this dict. Errors come back as observations (test 4), empty output gets a useful note instead of a blank (test 3), and runaway output is truncated (test 5) so a model that prints a million lines can't bury the conversation. The wrapper is the same whether the boundary underneath is a subprocess, a container or Pyodide.

---

*(End of Concept 4 — final concept of Lesson 8. The lesson continues with the recap and comprehensive sandbox.)*
