# Module 0, Lesson 4 — Concept 5: Inheritance

---

## Basic syntax, compared to what you know

Inheritance lets one class build on another — same core idea as Java's
`extends`, C++'s `: public Base`, or JS's `extends`, with Python's own
spelling:

```python
class Tool:
    def __init__(self, name: str):
        self.name = name

    def run(self, input_text: str) -> str:
        return f"{self.name} has no behavior defined"

class SearchTool(Tool):
    pass

search = SearchTool("search")
print(search.name)
print(search.run("weather"))
```
```
search
search has no behavior defined
```
*(runs live, shows output — read-only demo snippet, not graded)*

`SearchTool(Tool)` — the parent class goes in parentheses after the class
name. `SearchTool` doesn't define anything of its own yet, so it inherits
`__init__` and `run` from `Tool` entirely unchanged; `pass` is just a
placeholder body since a class can't be empty. `Tool` is the **base class**
(or **superclass**/**parent class**); `SearchTool` is the **subclass** (or
**derived class**/**child class**).

---

## `super().__init__()` — extending the parent constructor, not replacing it

A subclass usually needs its own extra data on top of what the parent
already sets up. Redefining `__init__` from scratch would mean duplicating
everything the parent already does:

```python
class SearchTool(Tool):
    def __init__(self, name: str, max_results: int):
        self.name = name              # duplicating what Tool.__init__ already does
        self.max_results = max_results
```
*(not run live — illustrating the problem, not a working example)*

`super()` gives you a reference to the parent class, so you can call its
`__init__` directly instead of repeating its logic:

```python
class Tool:
    def __init__(self, name: str):
        self.name = name

class SearchTool(Tool):
    def __init__(self, name: str, max_results: int):
        super().__init__(name)        # runs Tool's __init__ for the shared part
        self.max_results = max_results

search = SearchTool("search", max_results=5)
print(search.name)
print(search.max_results)
```
```
search
5
```
*(runs live, shows output — read-only demo snippet, not graded)*

`super().__init__(name)` calls `Tool.__init__` on the current instance,
handling `self.name = name` exactly as it did before. `SearchTool.__init__`
then only has to deal with what's actually new — `max_results` — instead
of re-implementing what the parent already handles.

---

## Overriding methods — and extending vs. replacing

A subclass can redefine a method it inherited, replacing the parent's
version entirely for that subclass:

```python
class Tool:
    def __init__(self, name: str):
        self.name = name

    def run(self, input_text: str) -> str:
        return f"{self.name} has no behavior defined"

class SearchTool(Tool):
    def __init__(self, name: str, max_results: int):
        super().__init__(name)
        self.max_results = max_results

    def run(self, input_text: str) -> str:
        return f"searching '{input_text}', top {self.max_results} results"

class CalculatorTool(Tool):
    def run(self, input_text: str) -> str:
        return f"calculating: {input_text}"

tools = [SearchTool("search", max_results=3), CalculatorTool("calculator")]

for tool in tools:
    print(tool.run("2 + 2"))
```
```
searching '2 + 2', top 3 results
calculating: 2 + 2
```
*(runs live, shows output — read-only demo snippet, not graded)*

Each subclass's own `run` is what actually executes, even though the loop
just calls `tool.run(...)` the same way for every item — Python looks up
the method on the *specific* object's actual class first, not the
variable's declared type (there isn't one, per Lesson 1's dynamic typing).
`CalculatorTool` didn't override `__init__` at all, so it still uses
`Tool`'s directly — overriding is per-method, not all-or-nothing for the
whole class.

Sometimes you want to *extend* a parent method rather than fully replace
it — run the parent's version, then add more on top. `super()` works for
any method, not just `__init__`:

```python
class SearchTool(Tool):
    def run(self, input_text: str) -> str:
        base_result = super().run(input_text)   # parent's version first
        return f"[SEARCH] {base_result}"

search = SearchTool("search")
print(search.run("weather"))
```
```
[SEARCH] search has no behavior defined
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## `isinstance()` and the "is-a" relationship

Inheritance means a `SearchTool` genuinely *is a* `Tool`, not just a class
that happens to share some methods — `isinstance()` checks this
relationship directly, and it recognizes the whole hierarchy, not just the
exact class:

```python
search = SearchTool("search", max_results=3)

print(isinstance(search, SearchTool))
print(isinstance(search, Tool))         # True — a SearchTool is-a Tool
print(type(search) == Tool)             # False — type() only matches exactly
```
```
True
True
False
```
*(runs live, shows output — read-only demo snippet, not graded)*

This distinction matters in practice: code that expects "any `Tool`"
should check with `isinstance(x, Tool)`, which correctly accepts
`SearchTool`, `CalculatorTool`, or any other subclass — `type(x) == Tool`
would incorrectly reject all of them, since none of them are *exactly*
`Tool`. This is also exactly why the loop two sections back worked without
checking each item's specific class first: every item in `tools` is-a
`Tool`, so treating them uniformly and letting each one's own `run`
execute is safe by design — this is called **polymorphism**, and it's the
same mechanism [tool-calling frameworks](→ Module 0, the functions lesson, function fundamentals concept, the type hints and docstrings explanation) rely on to dispatch a call to whichever specific tool matches, without needing a different code path per tool type.

---

## When inheritance is the right call — and when it isn't

Inheritance fits when the relationship is genuinely "is-a": a
`SearchTool` is-a `Tool`, a `SavingsAccount` is-an `Account`. It's the
wrong tool when the relationship is really "has-a" or "uses-a" — forcing
that into inheritance tends to produce a subclass that only wants one or
two of its parent's methods and awkwardly ignores or breaks the rest.

Recall [the closure-vs-class comparison from earlier](→ Module 0, the functions lesson, scope concept, the closure-as-lightweight-object comparison): a closure was a lightweight alternative to a class, for a single piece of remembered state and one operation. Inheritance sits at the opposite end of that same spectrum — reach for it specifically when you have a real hierarchy of related types that should share behavior and be substitutable for each other (like the `tools` list above), not merely because two classes happen to have a few similarly-named methods.

---

## Quiz cards

> **Q1.** In `class SearchTool(Tool):`, what does putting `Tool` in
> parentheses do?
> - A) Nothing, it's just documentation
> - B) Makes `SearchTool` inherit from `Tool` — `Tool` becomes its parent class ✅
> - C) Calls `Tool`'s constructor immediately
> - D) Makes `Tool` a class variable on `SearchTool`
>
> *Explanation: this is Python's inheritance syntax — the parent class
> goes in parentheses after the subclass name, same role as Java's
> `extends`.*

> **Q2.** Why use `super().__init__(name)` instead of rewriting
> `self.name = name` directly in the subclass's `__init__`?
> - A) `self.name = name` would raise an error in a subclass
> - B) It reuses the parent's existing setup logic instead of duplicating it — the subclass only needs to handle what's actually new ✅
> - C) `super()` is required syntax for every subclass, regardless of need
> - D) It makes `self.name` a class variable instead of an instance attribute
>
> *Explanation: `super().__init__(...)` calls the parent's constructor on
> the current instance, avoiding repeated logic between parent and child.*

> **Q3.** Given `CalculatorTool(Tool)` defines its own `run()` but no
> `__init__`, what happens when you create `CalculatorTool("calculator")`?
> - A) It fails, since `__init__` must always be redefined
> - B) It uses `Tool`'s `__init__` unchanged — overriding is per-method, not all-or-nothing ✅
> - C) It uses a blank `__init__` that sets nothing
> - D) Python auto-generates a new `__init__` based on `run`'s parameters
>
> *Explanation: a subclass only overrides the specific methods it
> redefines — anything it doesn't redefine, like `__init__` here, is
> inherited from the parent as-is.*

> **Q4.** In `super().run(input_text)` called from inside an overriding
> `run()` method, what's happening?
> - A) Infinite recursion, since `run` calls itself
> - B) The parent class's version of `run` executes, letting the subclass extend it rather than fully replace it ✅
> - C) `SyntaxError` — `super()` only works inside `__init__`
> - D) It calls the subclass's own `run` a second time
>
> *Explanation: `super()` works for any method, not just `__init__` — it
> lets a subclass build on the parent's version instead of only being able
> to replace it outright.*

> **Q5.** Given `search = SearchTool("search", 3)` where `SearchTool`
> inherits from `Tool`, what does `isinstance(search, Tool)` return, and
> why?
> - A) `False` — `search` isn't literally a `Tool` instance
> - B) `True` — inheritance means a `SearchTool` genuinely is-a `Tool`, and `isinstance()` recognizes the whole hierarchy ✅
> - C) `True`, but only if `Tool.__init__` was called
> - D) It raises a `TypeError` since `Tool` is never instantiated directly
>
> *Explanation: `isinstance()` checks the full inheritance chain, not just
> the exact class — this is what makes it the right choice over
> `type(x) == Tool`, which would incorrectly reject every subclass.*

> **Q6.** A list contains a mix of `SearchTool` and `CalculatorTool`
> instances. Calling `tool.run(...)` in a loop, without checking each
> item's specific type first, still runs the correct version for each one.
> What's this mechanism called, and why does it work?
> - A) Coincidence — Python just picks a version at random
> - B) Polymorphism — Python looks up the method on each object's actual class at call time, not the loop variable's declared type ✅
> - C) It only works because both classes happen to have identical method names
> - D) It requires manually checking `isinstance()` inside the loop first
>
> *Explanation: because every item is-a `Tool` and each overrides `run` in
> its own way, calling `tool.run(...)` uniformly dispatches to the correct
> subclass's version automatically — no per-type branching needed.*

> **Q7.** When is inheritance the wrong tool, according to the is-a vs.
> has-a distinction?
> - A) Whenever two classes share any method name at all
> - B) When the relationship is really "has-a" or "uses-a" rather than a genuine "is-a" — forcing it into inheritance tends to produce an awkward subclass ✅
> - C) Inheritance is always preferable to any alternative
> - D) Only when the parent class has more than one method
>
> *Explanation: inheritance fits a real type hierarchy where subclasses
> should be substitutable for the parent — forcing a "has-a" relationship
> into it usually produces a subclass that ignores or breaks most of what
> it inherited.*

---

## Applied sandbox exercise 5

*(inheritance composing with dunders and class variables from earlier in this lesson)*

*Starter code shown to learner:*
```python
class Tool:
    """
    Base class.
    __init__(self, name: str): store name as an instance attribute.
    run(self, input_text: str) -> str: return f"{self.name}: not implemented"
    __repr__(self): return f"Tool({self.name!r})"
    """
    # TODO: implement Tool fully
    pass


class SearchTool(Tool):
    """
    __init__(self, name: str, max_results: int):
      - call the parent's __init__ using super()
      - store max_results as its own instance attribute

    run(self, input_text: str) -> str:
      - override to return: f"searching '{input_text}', top {self.max_results} results"

    (no need to override __repr__ — it should inherit Tool's version unchanged)
    """
    # TODO: implement SearchTool fully
    pass
```

*Task shown to learner:* Implement `Tool` with `__init__`, `run`, and
`__repr__` as described. Then implement `SearchTool` inheriting from
`Tool`, calling `super().__init__()` to handle `name`, adding its own
`max_results`, and overriding `run()` — but leaving `__repr__` inherited,
unchanged, from `Tool`.

*Hidden test cases:*
```python
base = Tool("generic")
assert base.run("anything") == "generic: not implemented"
assert repr(base) == "Tool('generic')"

search = SearchTool("search", max_results=5)
assert search.name == "search"
assert search.max_results == 5
assert search.run("weather") == "searching 'weather', top 5 results"
assert repr(search) == "Tool('search')"   # inherited __repr__, unchanged

assert isinstance(search, Tool)
assert isinstance(search, SearchTool)
assert not isinstance(base, SearchTool)
```

*Hint (shown on request):* `SearchTool.__init__` should start with
`super().__init__(name)` to reuse `Tool`'s setup, then add
`self.max_results = max_results` on its own line. Don't define `__repr__`
in `SearchTool` at all — leaving it undefined is exactly what makes it
inherit `Tool`'s version, which is what the last repr test checks for.

*Correct answer + explanation (shown on failure, if requested):*
```python
class Tool:
    def __init__(self, name: str):
        self.name = name

    def run(self, input_text: str) -> str:
        return f"{self.name}: not implemented"

    def __repr__(self):
        return f"Tool({self.name!r})"


class SearchTool(Tool):
    def __init__(self, name: str, max_results: int):
        super().__init__(name)
        self.max_results = max_results

    def run(self, input_text: str) -> str:
        return f"searching '{input_text}', top {self.max_results} results"
```
This is the natural closing exercise for the lesson: `super().__init__()`
reuses the parent's setup, `run()` is overridden to specialize behavior,
and `__repr__` is deliberately *not* overridden — proving that inheritance
gives you the parent's dunder methods for free unless you explicitly
choose to replace them, tying together class fundamentals, dunders, and
inheritance from across this entire lesson.

---

*(End of Concept 5 — final concept section of Lesson 4. This lesson
continues with the outcomes callout, comprehensive quiz, and comprehensive
sandbox, drafted separately.)*
