# Module 0, Lesson 1 — Concept 2: Control flow and syntax, compared to what you know

---

## Block structure: indentation, not braces

Most languages mark a block with braces:

```c
if (isReady) {
    printf("this is inside the block\n");
    printf("so is this\n");
}
printf("this is not\n");
```

Python uses indentation instead — no `{ }`, and the colon (`:`) opens the
block:

```python
if True:
    print("this is inside the block")
    print("so is this")
print("this is not")
```
```
this is inside the block
so is this
this is not
```
*(runs live, shows output — read-only demo snippet, not graded)*

Indentation isn't a style choice here — it's part of the syntax. Mixing
levels inconsistently fails to parse:

```python
if True:
    print("this line is fine")
      print("this line is over-indented")
```
```
  File "script.py", line 3
    print("this line is over-indented")
IndentationError: unexpected indent
```
*(runs live, shows output — read-only demo snippet, not graded)*

There's also no explicit type declaration on variables — Python is
dynamically typed, so `x = 5` and `x = "five"` are both just valid
assignments, no `int x` or `var x: string` required. (We'll come back to
when you'd *want* type hints later in the module.)

---

## `if` / `elif` / `else`

Same logical structure as most languages, different keyword for "else if":

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

print(route_request("calculate 2+2"))
print(route_request("search for cats"))
print(route_request("hello"))
```
```
calculator_tool
search_tool
no_tool
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## `for` loops — iterate over values, not a counter

If you're coming from a C-style `for (int i = 0; i < n; i++)`, Python's `for`
works differently: it iterates directly over an **iterable** — anything that
can hand out its items one at a time (a list, a string, a range of numbers).
There's no index variable unless you explicitly ask for one.

```python
tools = ["calculator", "search", "memory"]

for tool in tools:
    print(f"available: {tool}")
```
```
available: calculator
available: search
available: memory
```
*(runs live, shows output — read-only demo snippet, not graded)*

`tool` is each *value* from the list in turn, not a position. The
`f"..."` string is an **f-string**: prefixing a string with `f` lets you
embed expressions directly inside `{ }`, evaluated and inserted at runtime —
Python's equivalent of JS template literals or C#'s interpolated strings,
and more concise than `"available: " + tool` or `.format()`.

When you specifically need a counter instead of (or alongside) values,
`range()` generates one — it's an iterable of numbers, not a special loop
syntax:

```python
for i in range(3):
    print(i)
```
```
0
1
2
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## `while` loops and no `++`

`while` works like you'd expect — condition checked, loop runs while true.
One difference: Python has no `++`/`--` increment operators.

```python
attempts = 0
while attempts < 3:
    print(f"attempt {attempts}")
    attempts += 1     # not attempts++
```
```
attempt 0
attempt 1
attempt 2
```
*(runs live, shows output — read-only demo snippet, not graded)*

`attempts++` isn't invalid-but-different — it's a straight `SyntaxError`,
since `++` isn't an operator Python defines at all.

---

## Quiz cards

> **Q1.** What happens if you mix inconsistent indentation levels in the
> same block, like the example above?
> - A) Python auto-corrects it
> - B) `IndentationError` — it fails to parse, before the program even runs ✅
> - C) It's ignored at runtime
> - D) Only a linter warning, code still runs
>
> *Explanation: indentation is part of Python's syntax, not a formatting
> convention — inconsistent indentation fails to parse.*

> **Q2.** What is an "iterable" in the context of Python's `for` loop?
> - A) A variable that increments automatically
> - B) Anything that can produce its items one at a time — a list, a string, a range ✅
> - C) Only lists specifically
> - D) A synonym for a loop counter
>
> *Explanation: `for` in Python is built around iterables generally — lists,
> strings, `range()`, and more all work the same way with `for x in ...`.*

> **Q3.** What does `f"available: {tool}"` do differently from
> `"available: " + tool`?
> - A) Nothing, they're identical
> - B) The `f` prefix lets `{tool}` be evaluated and inserted inline, without manual concatenation ✅
> - C) `f"..."` is faster but does the same thing as regular strings with no special behavior
> - D) `f"..."` only works with numbers, not strings
>
> *Explanation: an f-string embeds and evaluates expressions directly inside
> `{ }` at runtime — Python's equivalent of JS template literals or C#
> interpolated strings.*

> **Q4.** In `for tool in tools:`, what does `tool` represent on each
> iteration?
> - A) The index of the current item
> - B) The actual item's value from `tools` ✅
> - C) A reference to the whole list
> - D) The length of `tools`
>
> *Explanation: Python's `for` iterates directly over values, not
> positions.*

> **Q5.** What does `range(3)` produce when looped over?
> - A) `1, 2, 3`
> - B) `0, 1, 2` ✅
> - C) `0, 1, 2, 3`
> - D) `3, 2, 1`
>
> *Explanation: `range(n)` produces `0` up to (not including) `n`.*

> **Q6.** What happens if you write `attempts++` in Python?
> - A) It increments `attempts` by 1
> - B) `SyntaxError` — `++` isn't a defined operator ✅
> - C) It's valid but does nothing
> - D) It doubles `attempts`
>
> *Explanation: Python has no increment/decrement operators. Use
> `attempts += 1` instead.*

---

## Applied sandbox exercise 1

*Starter code shown to learner:*
```python
def first_available_tool(requested_tools, available_tools):
    """
    requested_tools: list of tool names, in priority order
    available_tools: list of tool names that are actually available
    Return the first name in requested_tools that also appears in
    available_tools. Return "none" if there's no match.
    """
    # TODO: implement using a for loop and if
    pass
```

*Task shown to learner:* Loop through `requested_tools` in order, and return
the first one that's also present in `available_tools`. If none match,
return `"none"`.

*Hidden test cases:*
```python
assert first_available_tool(["search", "calculator"], ["calculator", "memory"]) == "calculator"
assert first_available_tool(["calculator", "search"], ["calculator", "memory"]) == "calculator"
assert first_available_tool(["search"], ["calculator", "memory"]) == "none"
assert first_available_tool([], ["calculator"]) == "none"
```

*Hint (shown on request):* You need to check membership (`in`) inside the
loop, and return as soon as you find a match — don't wait until the loop
ends.

*Correct answer + explanation (shown on failure, if requested):*
```python
def first_available_tool(requested_tools, available_tools):
    for tool in requested_tools:
        if tool in available_tools:
            return tool
    return "none"
```
Returning inside the loop the moment a match is found is what makes this
"first available" rather than "any available" — an early `return` exits the
function immediately, skipping the rest of the loop entirely.

---

*(End of Concept 2. This lesson continues with Concept 3 — error handling
with try/except — drafted separately.)*
