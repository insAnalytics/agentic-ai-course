# Set Up Python and Write Fundamental Programs

> **You'll be able to**
> - Get a local Python environment fully working — install, VS Code, virtual
>   environments, and package management with pip
> - Read and write Python control flow (`if`/`elif`/`else`, `for`, `while`)
>   and translate what you already know from another language into Python's
>   syntax
> - Handle errors with `try`/`except`/`finally`, order multiple `except`
>   clauses correctly, and read a traceback to find what actually broke

**Why it matters**
Every agent you'll build later — a LangChain chain, a LangGraph state
machine — is still just Python underneath. If environment setup, control
flow, and error handling aren't automatic, debugging an agent's logic later
means debugging Python *and* the framework at once. This lesson makes sure
Python itself is never the bottleneck.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all three concepts, mixed order)*

> **Q1.** A teammate clones your repo and immediately gets
> `ModuleNotFoundError` when running your script, even though it works fine
> for you. What two things from this lesson are the most likely fix?
> - A) Reinstall Python entirely
> - B) Share a `requirements.txt` and make sure they're running inside their own activated venv ✅
> - C) Send them your `.venv` folder directly
> - D) Switch them to a different OS
>
> *Explanation: installed packages live in the venv, not the code — a
> `requirements.txt` plus an activated venv on their end is what makes the
> environment reproducible.*

> **Q2.** You write `if temp == 20 print("warm")` (no colon). What happens?
> - A) It runs fine, colons are optional
> - B) `SyntaxError` — the colon that opens the block is required ✅
> - C) It runs but never prints
> - D) `IndentationError`
>
> *Explanation: the colon is what tells Python a block is starting — leaving
> it out is a syntax error, not a style issue.*

> **Q3.** In `for tool in tools:`, what would you call `tools` itself?
> - A) A counter
> - B) An iterable — something that can hand out its items one at a time ✅
> - C) A function
> - D) An exception type

> **Q4.** Why might a bare `except:` clause hide a real bug rather than
> handle it safely?
> - A) It doesn't compile
> - B) It catches every error type indiscriminately, including ones you didn't anticipate or intend to handle ✅
> - C) It only works with `ZeroDivisionError`
> - D) It's identical to not using try/except at all

> **Q5.** You have `except ArithmeticError:` listed before
> `except ZeroDivisionError:` in the same `try`. A division by zero happens.
> Which block actually runs, and why?
> - A) `ZeroDivisionError`'s block, since it's more specific
> - B) `ArithmeticError`'s block — `except` clauses are checked top to bottom, and it matches first since `ZeroDivisionError` is a subclass of it ✅
> - C) Both blocks run
> - D) Neither — it crashes instead

> **Q6.** What's the practical difference between reading a traceback in
> Python versus getting a compiler error in a language like Java?
> - A) There is no difference
> - B) A compiler error can be caught before the program runs at all; a Python traceback only appears once execution actually reaches the failing line ✅
> - C) Python tracebacks never show the actual error type
> - D) Java doesn't have error messages

> **Q7.** Where should a `finally` block be used?
> - A) Only when you expect an exception
> - B) For cleanup that must happen whether or not an exception occurred (e.g. closing a file) ✅
> - C) As a replacement for `except`
> - D) Only inside loops

---

## Comprehensive sandbox

*(end of lesson, applied — combines control flow and error handling from
this lesson; setup isn't testable in-browser, so this exercise focuses on
Concepts 2 and 3. Uses only counters and comma-separated returns — no
dicts, since those aren't taught until the next lesson.)*

*Starter code shown to learner:*
```python
def summarize_requests(messages):
    """
    messages: a list that may contain strings and invalid entries
    (e.g. numbers, None).

    For each item:
      - if it's a valid string, route it using the same rules as
        route_request() earlier in this lesson: "calculate" -> calculator_tool,
        "search" -> search_tool, "remember" -> memory_tool, else -> no_tool
      - if it's not a string at all, count it as invalid instead

    Count how many messages fell into each of the five categories, and
    return the five counts in this order:
    (calculator_count, search_count, memory_count, no_tool_count, invalid_count)
    """
    # TODO: implement using the control flow and error handling from this lesson
    pass
```

*Task shown to learner:* Combine the routing logic from Concept 2 with the
error handling from Concept 3 — loop through `messages`, classify each one
(or catch the case where it isn't a string), keep a running count for each
category, and return all five counts. `return a, b, c` is valid Python —
it returns multiple values at once, separated by commas.

*Hidden test cases:*
```python
result = summarize_requests([
    "calculate 2+2",
    "search for cats",
    "remember my name",
    "hello",
    42,
    None,
])
assert result == (1, 1, 1, 1, 2)   # calculator, search, memory, no_tool, invalid

assert summarize_requests([]) == (0, 0, 0, 0, 0)
assert summarize_requests(["hello", "hi"]) == (0, 0, 0, 2, 0)
```

*Hint (shown on request):* Start all five counters at `0`. Reuse the
`route_request`-style `if`/`elif` chain inside the loop, wrap it in
`try`/`except TypeError`, and increment the matching counter with `+= 1` —
the same pattern used for `attempts` in the `while` loop example earlier in
this lesson.

*Correct answer + explanation (shown on failure, if requested):*
```python
def summarize_requests(messages):
    calculator_count = 0
    search_count = 0
    memory_count = 0
    no_tool_count = 0
    invalid_count = 0

    for message in messages:
        try:
            if "calculate" in message:
                calculator_count += 1
            elif "search" in message:
                search_count += 1
            elif "remember" in message:
                memory_count += 1
            else:
                no_tool_count += 1
        except TypeError:
            invalid_count += 1

    return calculator_count, search_count, memory_count, no_tool_count, invalid_count
```
This combines every concept in the lesson: the `for` loop and `elif` chain
from Concept 2, `try`/`except` from Concept 3, and `+=` counting — all
already-taught pieces, just composed together, which is why this is the
comprehensive exercise rather than an earlier applied one.
