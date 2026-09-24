# Module 3, Lesson 8 — Concept 3: Real isolation, and the tool around it

---

## Move the code out of your process

[The previous concept](→ this lesson, why restricted execution isnt a sandbox concept) ended on the reason in-process restriction fails: the untrusted code shares your interpreter, your memory and your filesystem access. Real isolation removes that sharing. The code runs somewhere it genuinely cannot reach the host, and you decide exactly what, if anything, crosses the boundary. There are several such boundaries, stronger and heavier as you go down:

- **A separate process.** Run the code as its own operating-system process, ideally under a locked-down user account with no access to sensitive files. Better than in-process, because the OS enforces the separation rather than the Python interpreter, but a plain subprocess still shares the machine's filesystem and network, so it needs real OS-level restriction to be safe.
- **A container.** Run the code inside a container, [the isolation Module 0's Docker lesson built](→ Module 0, the Docker lesson). The code sees only the container's own filesystem, and its network and resource access are yours to grant or deny. This is the common production choice: a fresh container per execution, thrown away after, with no network unless the task needs it.
- **A lightweight VM.** A micro-VM (such as the Firecracker VMs behind some cloud sandboxes) gives each execution its own kernel, a stronger boundary than a container's shared one, while still starting in a fraction of a second.
- **WebAssembly.** Compile the language to WebAssembly and run it in a Wasm runtime, which is sandboxed by design: the code can touch nothing outside the runtime unless the host explicitly hands it in. [The next concept](→ this lesson, webassembly and pyodide concept) covers this, because it's what runs this very page.

The trade across the list is boundary strength against startup time and overhead. A subprocess is cheap and weakly separated; a container is a little heavier and much stronger; a micro-VM is heavier still and stronger again. Which you pick depends on how hostile you assume the code is and how fast you need each run.

Two protections apply at every level, from [Lesson 4](→ this module, tools that call the outside world lesson, timeouts a tool that never answers concept):

- **A timeout,** because model-written code can loop forever, and no namespace trick prevents that.
- **Resource limits,** on memory and CPU, so a run can't exhaust the host even without escaping.

## The part you actually write: the wrapper

Whatever the boundary, your code-execution *tool* is the wrapper around it, and that wrapper is the same regardless of which isolation you chose. It has a familiar job by now: run the code, capture what it produced, and turn that into an observation the model can read, [exactly the errors-as-observations shape from Module 2](→ Module 2, termination failure and control lesson, tool errors as observations not exceptions concept).

```python
import io
import contextlib

# a stand-in for a real sandbox: in this course, Pyodide runs the code in a
# WebAssembly boundary. Here a plain exec() plays that role so the demo runs;
# the wrapper around it is the part a builder actually writes, and is the same
# either way.
def run_in_sandbox(code: str) -> str:
    captured = io.StringIO()
    with contextlib.redirect_stdout(captured):
        exec(code, {})
    return captured.getvalue()

def code_execution_tool(code: str) -> dict:
    """Run model-written Python and return its printed output as an observation."""
    try:
        output = run_in_sandbox(code)
    except Exception as e:
        # the code raised: hand the error back to the model as an observation, not a crash
        return {"content": f"Error: {type(e).__name__}: {e}", "is_error": True}
    if output == "":
        return {"content": "(the code ran but printed nothing; use print() to return a result)", "is_error": False}
    return {"content": output.rstrip("\n"), "is_error": False}

for code in [
    "print(sum([4, 8, 15, 16, 23, 42]) / 6)",
    "result = 2 ** 10",                       # computes something but prints nothing
    "print(1 / 0)",                           # raises
]:
    print(code_execution_tool(code))
```
```
{{'content': '18.0', 'is_error': False}}
{{'content': '(the code ran but printed nothing; use print() to return a result)', 'is_error': False}}
{{'content': 'Error: ZeroDivisionError: division by zero', 'is_error': True}}
```
*(runs live, shows output — read-only demo snippet, not graded; here `run_in_sandbox` is a plain `exec`, standing in for a real boundary so the demo runs. In production it would be a call into the container, VM or Wasm runtime.)*

Three things the wrapper handles, none of them about isolation and all of them about being a good tool:

- **Capturing output.** The model can only see what the tool returns, so the wrapper captures the code's printed output with `redirect_stdout`. Code that computes a value but never prints it produces nothing, so the wrapper says so, rather than returning a confusing empty string.
- **Errors as observations.** Model-written code raises often, and a raised exception should come back as a `tool_result` the model can fix, not crash the agent, the same pattern as every other failing tool in this module.
- **The boundary is swappable.** Because the wrapper only talks to `run_in_sandbox`, moving from a subprocess to a container to Wasm changes that one function, not the tool.

The full version adds a timeout and truncates runaway output, [the same result-size discipline from Lesson 3](→ this module, shaping what tools return lesson, why a huge tool result hurts concept), and that's this lesson's exercise.

---

## Quiz cards

> **Q1.** Why is running untrusted code in a separate OS process stronger than an in-process restricted `exec`?
> - A) A separate process runs faster
> - B) The operating system enforces the separation, rather than the same interpreter that runs the untrusted code ✅
> - C) Subprocesses can't run dangerous code at all
> - D) It removes the need for a timeout
>
> *Explanation:* The boundary moves from inside one shared interpreter to the OS. A bare subprocess still needs real OS-level restriction, but the enforcement is no longer the very thing being escaped.

> **Q2.** What's the general trade as you move from a subprocess to a container to a micro-VM?
> - A) Each is cheaper and weaker than the last
> - B) Boundary strength goes up, and so do startup time and overhead ✅
> - C) They're equivalent; the choice is style
> - D) Only the micro-VM needs a timeout
>
> *Explanation:* Stronger isolation costs more per run. The right point on the scale depends on how hostile the code might be and how fast runs must be.

> **Q3.** Why does the wrapper report "the code ran but printed nothing" instead of returning an empty string?
> - A) Empty strings crash the model API
> - B) The model only sees what the tool returns, so an empty result is a confusing non-answer; the note tells it to print its result ✅
> - C) The code didn't actually run
> - D) It's required by MCP
>
> *Explanation:* Computing a value isn't the same as returning it. The note steers the model toward `print`, the only way its result reaches the tool's output.

> **Q4.** Why does moving from a container to WebAssembly change so little of the tool's code?
> - A) They use the same isolation mechanism
> - B) The wrapper only calls `run_in_sandbox`, so swapping the boundary changes that one function, not the tool around it ✅
> - C) The tool doesn't actually depend on isolation
> - D) WebAssembly and containers have identical performance
>
> *Explanation:* Keeping the boundary behind one function is what makes it swappable. Output capture, error handling and timeouts are the same whatever runs the code.

---

*(End of Concept 3. This lesson continues with Concept 4 — WebAssembly and Pyodide.)*
