# Module 0, Lesson 1 — Concept 3: Error handling with try/except

---

## The basic shape — and how it compares

Most languages you've likely used have some form of this same pattern —
Java/C# call it `try`/`catch`, JS is nearly identical to Python's spelling:

```java
try {
    result = 10 / 0;
} catch (ArithmeticException e) {
    result = -1;
}
```

Python's version:

```python
try:
    result = 10 / 0
except ZeroDivisionError:
    result = -1

print(result)
```
```
-1
```
*(runs live, shows output — read-only demo snippet, not graded)*

Same idea, different keyword (`except` instead of `catch`), and Python names
the exception *type* directly after `except` rather than in parentheses.

---

## Seeing the crash first

Without a `try`, an error stops the program entirely — you've already seen
this in Concept 1's execution-model example. Here's the same idea,
specifically for division:

```python
def divide(a, b):
    return a / b

print(divide(10, 0))
```
```
Traceback (most recent call last):
  File "script.py", line 4, in <module>
    print(divide(10, 0))
  File "script.py", line 2, in divide
    return a / b
ZeroDivisionError: division by zero
```
*(runs live, shows output — read-only demo snippet, not graded)*

Wrapping the risky line in `try`/`except` lets you handle it instead of
crashing:

```python
def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "undefined"

print(divide(10, 0))   # "undefined"
print(divide(10, 2))   # 5.0
```
*(runs live, shows output — read-only demo snippet, not graded)*

The `try` block runs normally. If the specific error named in `except`
occurs anywhere inside it, execution jumps straight to that `except` block —
everything else remaining in `try` is skipped.

---

## Catching specific errors vs. catching everything

You can name the exact error type you expect (recommended), or catch
everything with a bare `except:`:

```python
def divide(a, b):
    try:
        return a / b
    except:                     # catches ANY error, not just division by zero
        return "something went wrong"

print(divide(10, "two"))
```
```
something went wrong
```
*(runs live, shows output — read-only demo snippet, not graded)*

This runs — but it's hiding the actual problem: `divide(10, "two")` fails
because you can't divide by a string (`TypeError`), not because of division
by zero. A bare `except:` swallows that distinction, which makes bugs harder
to find later. Naming the specific type keeps you honest about what you're
actually expecting to go wrong:

```python
def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "undefined"
    except TypeError:
        return "invalid input type"

print(divide(10, 0))       # "undefined"
print(divide(10, "two"))   # "invalid input type"
```
```
undefined
invalid input type
```
*(runs live, shows output — read-only demo snippet, not graded)*

Multiple `except` clauses can follow one `try`, each catching a different
error type.

---

## Order matters with multiple `except` clauses

Python checks `except` clauses top to bottom and uses the *first* one that
matches — same as `elif`. This matters when exception types overlap:
`ZeroDivisionError` is actually a subclass of `ArithmeticError`, so if you
catch the broader type first, the more specific one never gets a chance to
run.

```python
def divide(a, b):
    try:
        return a / b
    except ArithmeticError:      # broader — catches this first
        return "arithmetic problem"
    except ZeroDivisionError:    # never reached for a 0 division — already caught above
        return "specifically zero division"

print(divide(10, 0))
```
```
arithmetic problem
```
*(runs live, shows output — read-only demo snippet, not graded)*

The second `except` isn't wrong, it's just unreachable for this case. The
fix is ordering specific exceptions before general ones:

```python
def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:    # more specific — checked first
        return "specifically zero division"
    except ArithmeticError:
        return "arithmetic problem"

print(divide(10, 0))
```
```
specifically zero division
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## `finally` — runs no matter what

A `finally` block runs whether the `try` succeeded, failed, or was caught —
useful for cleanup that must happen regardless (closing a file, releasing a
connection):

```python
def divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "undefined"
    finally:
        print("divide attempt finished")

print(divide(10, 0))
print(divide(10, 2))
```
```
divide attempt finished
undefined
divide attempt finished
5.0
```
*(runs live, shows output — read-only demo snippet, not graded)*

Notice `"divide attempt finished"` prints before the return value in each
case: `finally` runs after the `try`/`except` resolves, but before the
function actually returns to the caller.

---

## Reading a traceback

You've seen a few tracebacks already in this lesson without a formal
breakdown — here's what's actually in one:

```
Traceback (most recent call last):
  File "script.py", line 4, in <module>
    print(divide(10, 0))
  File "script.py", line 2, in divide
    return a / b
ZeroDivisionError: division by zero
```

Read it as a call stack, top to bottom: line 4 called `divide`, which failed
on line 2. The **last line is the one that matters most day-to-day** — it
names the exception type and the specific message. When something breaks,
start there, then use the lines above it to trace *where* the call came from
if the error itself isn't enough context.

---

## Quiz cards

> **Q1.** What's the main syntax difference between Python's `try`/`except`
> and Java/C#'s `try`/`catch`?
> - A) Python has no equivalent
> - B) `except` names the exception type directly, without parentheses around it ✅
> - C) Python requires a `finally` block always
> - D) They work identically with no differences
>
> *Explanation: the structure is the same concept, just
> `except ExceptionType:` instead of `catch (ExceptionType e)`.*

> **Q2.** Why is a bare `except:` (catching everything) generally worse than
> naming a specific exception type?
> - A) It's slower
> - B) It hides which error actually occurred, making real bugs harder to diagnose ✅
> - C) It's a syntax error
> - D) There's no real downside
>
> *Explanation: a bare `except:` catches every error type indiscriminately —
> including ones you didn't anticipate — masking what actually went wrong.*

> **Q3.** In a Python traceback, which line tells you the actual error type
> and message?
> - A) The first line
> - B) The last line ✅
> - C) It's not included, you have to infer it
> - D) The middle line always
>
> *Explanation: tracebacks read top-to-bottom as a call stack, but the
> exception type and message are always on the final line.*

> **Q4.** Can one `try` block have more than one `except` clause?
> - A) No, only one per `try`
> - B) Yes — each can catch a different exception type ✅
> - C) Only if they're identical
> - D) Only in a `while` loop
>
> *Explanation: Python allows multiple `except` clauses after a single
> `try`, each matched to a different exception type, checked in order.*

> **Q5.** If `except ArithmeticError:` is listed before
> `except ZeroDivisionError:`, and a `ZeroDivisionError` occurs, which block
> runs?
> - A) The `ZeroDivisionError` block, since it's more specific
> - B) The `ArithmeticError` block, since `except` clauses are checked in order and it matches first ✅
> - C) Both run
> - D) Neither runs, it crashes
>
> *Explanation: `ZeroDivisionError` is a subclass of `ArithmeticError`, so a
> broader `except` listed first will catch it before a more specific one
> below ever gets checked.*

> **Q6.** When does a `finally` block run?
> - A) Only if an exception was caught
> - B) Only if no exception occurred
> - C) Always — whether the `try` succeeded, failed, or was caught ✅
> - D) Only if you explicitly call it
>
> *Explanation: `finally` is guaranteed to run regardless of what happened
> in `try`/`except`, making it the right place for cleanup that must always
> happen.*

---

## Applied sandbox exercise 2

*(composes Concept 2's control flow with Concept 3's try/except)*

*Starter code shown to learner:*
```python
def route_request(message):
    if "calculate" in message:
        return "calculator_tool"
    elif "search" in message:
        return "search_tool"
    elif "remember" in message:
        return "memory_tool"
    else:
        return "no_tool"

# TODO: handle the case where message isn't a string at all (e.g. a number or None)
# It should return "invalid input" instead of crashing
```

*Task shown to learner:* If `message` isn't a string, checking
`"calculate" in message` raises a `TypeError`. Wrap the function so that
case returns `"invalid input"` instead of crashing, while valid strings
still route normally through the existing `if`/`elif` chain.

*Hidden test cases:*
```python
assert route_request("calculate 2+2") == "calculator_tool"
assert route_request("search for cats") == "search_tool"
assert route_request("hello") == "no_tool"
assert route_request(42) == "invalid input"
assert route_request(None) == "invalid input"
```

*Hint (shown on request):* Wrap the whole `if`/`elif` chain in one `try`,
and catch `TypeError` around it — you don't need a separate `try` per
branch.

*Correct answer + explanation (shown on failure, if requested):*
```python
def route_request(message):
    try:
        if "calculate" in message:
            return "calculator_tool"
        elif "search" in message:
            return "search_tool"
        elif "remember" in message:
            return "memory_tool"
        else:
            return "no_tool"
    except TypeError:
        return "invalid input"
```
Checking `"calculate" in message` on a non-string raises `TypeError` the
moment that first comparison runs — wrapping the whole chain in one `try`
catches it regardless of which branch would've failed.

---

*(End of Concept 3 — final concept section of Lesson 0.1. This lesson
continues with the comprehensive quiz and comprehensive sandbox exercise,
drafted separately.)*
