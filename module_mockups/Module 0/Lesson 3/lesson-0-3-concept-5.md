# Module 0, Lesson 3 — Concept 5: Modules and imports

---

## If you're coming from another language

Every language has some way to pull in code from elsewhere — Java's
`import`, C/C++'s `#include`, JS's `import`/`export`. Python's version: any
`.py` file is automatically a **module**, importable by its filename
(without the `.py`), no explicit "export" keyword needed — everything at
the top level of a file is available to whatever imports it.

> **Note:** this course's sandbox supports multiple files, so the examples
> below run for real, across separate file tabs — showing exactly how
> you'd structure a small multi-file project, the same way you will in the
> downloadable local projects later in the course.

---

## Importing built-in modules

Python ships with a large standard library — modules you can import
without installing anything:

```python
import math

print(math.sqrt(16))
print(math.pi)
```
```
4.0
3.141592653589793
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two other import styles you'll see constantly:

```python
from math import sqrt, pi   # import specific names directly, no math. prefix needed

print(sqrt(25))
print(pi)
```
```
5.0
3.141592653589793
```
*(runs live, shows output — read-only demo snippet, not graded)*

```python
import math as m   # alias, useful for long or commonly-abbreviated module names

print(m.sqrt(9))
```
```
3.0
```
*(runs live, shows output — read-only demo snippet, not graded)*

You've likely already seen this aliasing convention elsewhere
(`import numpy as np`, `import pandas as pd`); it's the same mechanism.

---

## Creating and importing your own module

Two files, shown as separate tabs in the sandbox — this actually runs:

**Tab: `tools.py`**
```python
def search(query):
    return f"searching for {query}"

def calculate(expression):
    return eval(expression)
```

**Tab: `main.py`**
```python
from tools import search, calculate

print(search("weather"))
print(calculate("2 + 2"))
```
```
searching for weather
4
```
*(runs live across both tabs, shows output — read-only demo, not graded)*

No explicit "export" step — `search` and `calculate` are importable simply
because they're defined at the top level of `tools.py`. This is a real
difference from JS, where you need explicit `export` statements, or Java,
where visibility modifiers (`public`, `private`) control what's accessible.

---

## `if __name__ == "__main__":`

Every Python file has a built-in variable `__name__`. When a file is run
directly (`python3 main.py`), `__name__` is set to `"__main__"`. When that
same file is *imported* by another file instead, `__name__` is set to the
module's own name (e.g. `"tools"`) — not `"__main__"`.

This lets you write code that only runs when the file is executed
directly, not when it's imported. Extending the same two files:

**Tab: `tools.py`**
```python
def search(query):
    return f"searching for {query}"

if __name__ == "__main__":
    print(search("test run"))   # only runs if tools.py is executed directly
```

**Tab: `main.py`**
```python
from tools import search

print(search("weather"))
```
```
weather
```
*(runs live across both tabs, shows output — read-only demo, not graded)*

Running `main.py` directly does **not** trigger `tools.py`'s
`if __name__ == "__main__":` block — only the `search` function definition
gets imported, not that guarded `print` line. If you switched which file
you *ran* directly (running `tools.py` instead of `main.py`), the guarded
line would fire, printing `"searching for test run"`. This is Python's
rough equivalent of Java's `public static void main` or C's `int main()` —
a designated entry point — except every file can have one, and it's
conditional rather than a fixed required function name.

---

## Quiz cards

> **Q1.** What makes a function in a `.py` file importable elsewhere in
> Python?
> - A) An explicit `export` keyword, like in JavaScript
> - B) Nothing extra needed — anything defined at the top level of a file is importable by default ✅
> - C) A `public` visibility modifier
> - D) The function must be named `main`
>
> *Explanation: Python has no export step — top-level definitions in any
> `.py` file are importable by default.*

> **Q2.** What's the difference between `import math` and
> `from math import sqrt`?
> - A) No difference
> - B) The first requires `math.sqrt(...)`; the second imports `sqrt` directly, usable as just `sqrt(...)` ✅
> - C) `from ... import` doesn't work with built-in modules
> - D) `import math` is faster
>
> *Explanation: `from module import name` brings a specific name directly
> into scope, without needing the module prefix.*

> **Q3.** What does `__name__` equal when a file is run directly
> (e.g. `python3 script.py`)?
> - A) The filename without `.py`
> - B) `"__main__"` ✅
> - C) `None`
> - D) `"script"`
>
> *Explanation: Python sets `__name__` to `"__main__"` specifically for
> the file that was run directly, regardless of its actual filename.*

> **Q4.** In the two-file example, if `tools.py` has a top-level
> `print()` call outside the `if __name__ == "__main__":` guard, what
> happens when `main.py` does `from tools import search`?
> - A) Nothing extra happens, only `search` is imported
> - B) The unguarded `print()` call runs too, as a side effect of importing the file ✅
> - C) It raises an ImportError
> - D) The print statement is automatically skipped
>
> *Explanation: importing a module executes its top-level code once — only
> code inside the `if __name__ == "__main__":` guard is skipped when
> imported rather than run directly.*

> **Q5.** What's the closest equivalent to `if __name__ == "__main__":` in
> a language like Java?
> - A) A `try`/`catch` block
> - B) The `public static void main` entry point — except in Python, every file can have one, and it's conditional rather than a required fixed method ✅
> - C) A class constructor
> - D) There's no reasonable comparison
>
> *Explanation: both mark "run this when the file is the program's entry
> point" — Python's version is just per-file and conditional rather than a
> single required method.*

---

## Applied sandbox exercise 6

*Starter code shown to learner:*
```python
import math

def euclidean_distance(point_a, point_b):
    """
    point_a, point_b: (x, y) tuples.
    Return the straight-line distance between them, using math.sqrt.
    Formula: sqrt((x2-x1)^2 + (y2-y1)^2)
    """
    # TODO: implement using math.sqrt and tuple unpacking
    pass
```

*Task shown to learner:* Unpack both points into `x, y` pairs, and use
`math.sqrt` to compute the distance between them.

*Hidden test cases:*
```python
assert euclidean_distance((0, 0), (3, 4)) == 5.0
assert euclidean_distance((0, 0), (0, 0)) == 0.0
assert round(euclidean_distance((1, 1), (4, 5)), 2) == 5.0
```

*Hint (shown on request):* Unpack each tuple with `x1, y1 = point_a` and
`x2, y2 = point_b`, then `math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)`.

*Correct answer + explanation (shown on failure, if requested):*
```python
import math

def euclidean_distance(point_a, point_b):
    x1, y1 = point_a
    x2, y2 = point_b
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
```
This combines the imported `math.sqrt` from this section with tuple
unpacking from earlier in the module — a genuinely common calculation in
agent code that reasons about embeddings or coordinates.

---

## Applied sandbox exercise 7

*(multi-file, exercising the module/import mechanics directly)*

*Starter code shown to learner — two file tabs:*

**Tab: `tool_registry.py`**
```python
# TODO: define a function register(name, registry) that:
#   - adds name to registry if it isn't already present
#   - returns the updated registry
# (this is the same logic as an earlier exercise — the new part here is
# putting it in its own file and importing it correctly)
```

**Tab: `main.py`**
```python
# TODO: import register from tool_registry, then use it to build up
# a registry from the list ["search", "calculator", "search", "memory"]
# and print the final registry

tools_to_add = ["search", "calculator", "search", "memory"]
```

*Task shown to learner:* Implement `register` in `tool_registry.py`, then
import it into `main.py` and use it to build the registry, printing the
final result.

*Hidden test cases:*
```python
# checked by importing register from the learner's tool_registry.py directly
from tool_registry import register

result = []
for tool in ["search", "calculator", "search", "memory"]:
    result = register(tool, result)

assert result == ["search", "calculator", "memory"]
assert register("x", None) == ["x"]
```

*Hint (shown on request):* `tool_registry.py` only needs the function
definition — no `print` calls there. In `main.py`, the import line is
`from tool_registry import register`, then loop over `tools_to_add`,
calling `register` and updating your running registry each time.

*Correct answer + explanation (shown on failure, if requested):*

**`tool_registry.py`**
```python
def register(name, registry=None):
    if registry is None:
        registry = []
    if name not in registry:
        registry.append(name)
    return registry
```

**`main.py`**
```python
from tool_registry import register

tools_to_add = ["search", "calculator", "search", "memory"]

registry = []
for tool in tools_to_add:
    registry = register(tool, registry)

print(registry)
```
```
['search', 'calculator', 'memory']
```
This is the first exercise in the course where the split across files is
itself part of what's being tested — the registration logic is identical
to a pattern from earlier in this lesson, but now lives in its own module
and gets imported rather than defined inline, exactly like real project
structure.

---

*(End of Concept 5 — final concept section of Lesson 3. This lesson
continues with the outcomes callout, comprehensive quiz, and comprehensive
sandbox, drafted separately.)*
