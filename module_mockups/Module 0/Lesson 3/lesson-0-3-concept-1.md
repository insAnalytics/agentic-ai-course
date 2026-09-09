# Module 0, Lesson 3 — Concept 1: Function fundamentals

---

## Basic syntax, compared to what you know

Function definitions look similar across most languages you've likely used
— Python's version:

```python
def greet(name):
    return f"Hello, {name}!"

print(greet("Ava"))
```
```
Hello, Ava!
```
*(runs live, shows output — read-only demo snippet, not graded)*

No return type declaration, no parameter types by default — consistent
with Python's dynamic typing from Lesson 0.1. `return` works like you'd
expect; a function with no `return` statement implicitly returns `None`.

---

## Default arguments

A parameter can have a default value, making it optional to pass:

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Ava"))
print(greet("Ava", "Hi"))
```
```
Hello, Ava!
Hi, Ava!
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Keyword arguments

Arguments can be passed by name instead of position — useful once a
function has several parameters, since it removes any ambiguity about
which value goes where:

```python
def create_agent(name, model, temperature=0.7):
    return f"{name} running {model} at temp={temperature}"

print(create_agent("research_agent", model="claude-sonnet", temperature=0.2))
print(create_agent(name="research_agent", model="claude-sonnet"))
```
```
research_agent running claude-sonnet at temp=0.2
research_agent running claude-sonnet at temp=0.7
```
*(runs live, shows output — read-only demo snippet, not graded)*

Positional and keyword arguments can be mixed, but once you use a keyword
argument, everything after it must also be a keyword argument.

---

## Type hints

Python lets you annotate parameter and return types — these aren't
enforced at runtime (nothing crashes if you ignore them), but they matter
more than optional style here: **later in this course, tool-calling
frameworks generate the schema an LLM sees directly from these type
hints.** Getting used to writing them now pays off directly.

```python
def create_agent(name: str, model: str, temperature: float = 0.7) -> str:
    return f"{name} running {model} at temp={temperature}"

print(create_agent("research_agent", "claude-sonnet"))
```
```
research_agent running claude-sonnet at temp=0.7
```
*(runs live, shows output — read-only demo snippet, not graded)*

`name: str` means "name is expected to be a string," `-> str` means "this
function returns a string." Nothing stops you from calling
`create_agent(123, "x")` and Python won't complain until something inside
the function breaks on the wrong type — the type hint is documentation and
tooling support, not a compiler guarantee. (Pydantic, in Lesson 0.4, is
what actually *enforces* types at runtime.)

---

## Docstrings

A string literal as the first line inside a function becomes its
docstring — accessible via `help()` or `.__doc__`, and shown by tools
(including IDEs and, later in this course, LLM tool-calling frameworks) as
the function's description:

```python
def create_agent(name: str, model: str, temperature: float = 0.7) -> str:
    """Create a configured agent identity string.

    Args:
        name: the agent's identifier.
        model: which model the agent runs on.
        temperature: sampling temperature, 0 to 1.
    """
    return f"{name} running {model} at temp={temperature}"

print(create_agent.__doc__)
```
```
Create a configured agent identity string.

    Args:
        name: the agent's identifier.
        model: which model the agent runs on.
        temperature: sampling temperature, 0 to 1.
    
```
*(runs live, shows output — read-only demo snippet, not graded)*

This specific `Args:` format is a common convention (Google-style
docstrings), not required syntax; a plain one-line docstring is equally
valid for simple functions. What matters for later in this course is that
**this text is often what an LLM actually reads to decide when and how to
call a tool** — a vague docstring means a worse-informed model.

---

## Quiz cards

> **Q1.** What does a function return if it has no explicit `return`
> statement?
> - A) `0`
> - B) `None` ✅
> - C) An empty string
> - D) `SyntaxError` — every function must return something
>
> *Explanation: a function without a `return` statement implicitly returns
> `None`.*

> **Q2.** In `def greet(name, greeting="Hello"):`, what happens if you call
> `greet("Ava")` with no second argument?
> - A) `TypeError` — a value is required
> - B) `greeting` uses its default value, `"Hello"` ✅
> - C) `greeting` becomes `None`
> - D) The function doesn't run
>
> *Explanation: a default argument makes that parameter optional — if
> omitted, the default value is used.*

> **Q3.** Given `create_agent(name, model, temperature=0.7)`, why might
> calling it as `create_agent(model="claude-sonnet", name="research_agent")`
> (arguments swapped in order) still work correctly?
> - A) It wouldn't work — order always matters
> - B) Keyword arguments are matched by name, not position, so order doesn't matter ✅
> - C) Python guesses based on type
> - D) Only works if there's exactly one parameter
>
> *Explanation: keyword arguments bind to a parameter by name — their order
> in the call is irrelevant.*

> **Q4.** Does `def process(data: str) -> int:` stop you from calling
> `process(42)` with an integer instead of a string?
> - A) Yes, it raises a `TypeError` immediately
> - B) No — type hints aren't enforced at runtime by default; the function will run and may fail later depending on what it does with `data` ✅
> - C) Yes, but only a warning is printed
> - D) It silently converts `42` to `"42"`
>
> *Explanation: type hints are documentation and tooling support, not
> runtime enforcement — Pydantic (Lesson 0.4) is what actually enforces
> types.*

> **Q5.** Why do type hints and docstrings matter more in this course
> specifically than they might in a general Python course?
> - A) They don't — they're just style preferences here too
> - B) Later, tool-calling frameworks generate the schema an LLM sees directly from a function's type hints and docstring ✅
> - C) Python requires them for any function used in an `if` statement
> - D) They're required for `try`/`except` to work
>
> *Explanation: this course specifically builds toward tool-calling agents,
> where a function's type hints and docstring become the schema and
> description an LLM actually reads.*

---

## Applied sandbox exercise 1

*Starter code shown to learner:*
```python
def format_tool_result(tool_name, result, success=True):
    """
    TODO: add type hints to all parameters and the return type.
    tool_name: str, result: str, success: bool (defaults to True), returns str.

    Return a formatted string:
      - if success is True: "[tool_name] succeeded: result"
      - if success is False: "[tool_name] failed: result"
    """
    # TODO: implement the formatting logic, and add a one-line docstring
    pass
```

*Task shown to learner:* Add type hints to every parameter and the return
type, write a one-line docstring describing what the function does, and
implement the formatting logic described in the comment.

*Hidden test cases:*
```python
assert format_tool_result("search", "3 results found") == "[search] succeeded: 3 results found"
assert format_tool_result("calculator", "division by zero", success=False) == "[calculator] failed: division by zero"
assert format_tool_result.__doc__ is not None
```

*Hint (shown on request):* Type hints go directly in the signature:
`def format_tool_result(tool_name: str, result: str, success: bool = True) -> str:`.
The docstring is just a string literal as the very first line inside the
function body.

*Correct answer + explanation (shown on failure, if requested):*
```python
def format_tool_result(tool_name: str, result: str, success: bool = True) -> str:
    """Format a tool's result as a status string for display."""
    status = "succeeded" if success else "failed"
    return f"[{tool_name}] {status}: {result}"
```
This combines everything in this section: type-hinted parameters, a
default argument (`success: bool = True`), a docstring, and an f-string
from Lesson 0.1 — plus the conditional expression from Lesson 0.2's
comprehension work, reused here as a plain expression outside a
comprehension.

---

*(End of Concept 1. This lesson continues with Concept 2 — *args and
**kwargs — drafted separately.)*
