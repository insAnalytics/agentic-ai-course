# Module 0, Lesson 3 — Concept 3: Scope

---

## Local scope: variables inside a function stay inside it

A variable created inside a function doesn't exist outside it:

```python
def set_temperature():
    temperature = 0.7
    print(temperature)

set_temperature()
print(temperature)
```
```
0.7
Traceback (most recent call last):
  File "script.py", line 5, in <module>
    print(temperature)
NameError: name 'temperature' is not defined
```
*(runs live, shows output — read-only demo snippet, not graded)*

`temperature` only exists while `set_temperature()` is running, in its own
local scope. This is true even if a variable with the same name exists
outside the function — they're unrelated:

```python
temperature = 0.5

def set_temperature():
    temperature = 0.7   # creates a NEW local variable, doesn't touch the outer one
    print("inside:", temperature)

set_temperature()
print("outside:", temperature)
```
```
inside: 0.7
outside: 0.5
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Reading an outer variable works — reassigning it doesn't, without `global`

A function *can* read a variable from outside it, as long as it doesn't try
to assign to it:

```python
model_name = "claude-sonnet"

def describe():
    print(f"using {model_name}")   # reading — this works fine

describe()
```
```
using claude-sonnet
```
*(runs live, shows output — read-only demo snippet, not graded)*

But trying to reassign it inside the function, without saying so
explicitly, doesn't do what you'd expect:

```python
call_count = 0

def track_call():
    call_count = call_count + 1   # this looks like it should increment the outer one
    print(call_count)

track_call()
```
```
Traceback (most recent call last):
  File "script.py", line 4, in <module>
    track_call()
  File "script.py", line 3, in track_call
    call_count = call_count + 1
UnboundLocalError: cannot access local variable 'call_count' where it is not associated with a value
```
*(runs live, shows output — read-only demo snippet, not graded)*

The moment Python sees an assignment to `call_count` *anywhere* in the
function, it treats `call_count` as local to that function for its entire
body — including the read on the right-hand side, before the local one has
been created. The `global` keyword tells Python explicitly which one you
mean:

```python
call_count = 0

def track_call():
    global call_count
    call_count = call_count + 1
    print(call_count)

track_call()
track_call()
```
```
1
2
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Why relying on `global` is usually a bad idea in agent code specifically

`global` works, but it makes a function's behavior depend on state the
function's signature doesn't reveal — you can't tell what `track_call()`
actually depends on just by looking at how it's called. In agent code, this
gets worse fast: if multiple parts of an agent loop mutate the same global
variable (say, a shared conversation history or token count), it becomes
very hard to reason about what state looks like at any given point,
especially once things run concurrently. The far more common and safer
pattern is to pass state in and return it out explicitly:

```python
def track_call(call_count):
    return call_count + 1

call_count = 0
call_count = track_call(call_count)
call_count = track_call(call_count)
print(call_count)
```
```
2
```
*(runs live, shows output — read-only demo snippet, not graded)*

Same result, but `track_call`'s dependency on `call_count` is now visible
in its signature, not hidden behind a `global` statement elsewhere.

---

## The mutable default argument trap

One specific scope-related gotcha worth knowing before it bites you: a
default argument is evaluated *once*, when the function is defined — not
once per call. This is harmless for immutable defaults like `0` or
`"hello"`, but dangerous for mutable ones like a list:

```python
def add_tool(tool, tools=[]):   # DANGER: the same list is reused across every call
    tools.append(tool)
    return tools

print(add_tool("search"))
print(add_tool("calculator"))
```
```
['search']
['search', 'calculator']
```
*(runs live, shows output — read-only demo snippet, not graded)*

The second call's output likely surprises you: `tools=[]` isn't a fresh
empty list each time, it's the *same* list object, created once when the
function was defined, silently accumulating across every call that doesn't
pass its own. The standard fix is to default to `None` and create the list
inside the function body instead:

```python
def add_tool(tool, tools=None):
    if tools is None:
        tools = []
    tools.append(tool)
    return tools

print(add_tool("search"))
print(add_tool("calculator"))
```
```
['search']
['calculator']
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## A third scope: closures

A function defined inside another function can "remember" variables from
the outer function, even after the outer function has finished running:

```python
def make_multiplier(factor):
    def multiply(n):
        return n * factor   # factor comes from the enclosing function, not global or local to multiply
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)

print(double(5))
print(triple(5))
```
```
10
15
```
*(runs live, shows output — read-only demo snippet, not graded)*

`multiply` is a **closure**: it "closes over" `factor` from
`make_multiplier`'s scope. Each call to `make_multiplier` creates a
separate `factor`, which is why `double` and `triple` don't interfere with
each other, even though both came from the same function.

This is exactly the shape of a **tool factory** — a function that returns a
configured tool function without needing a class:

```python
def make_search_tool(api_key):
    def search(query):
        return f"searching '{query}' using key ending in ...{api_key[-4:]}"
    return search

search_prod = make_search_tool("sk-prod-88291")
print(search_prod("weather today"))
```
```
searching 'weather today' using key ending in ...8291
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## `nonlocal` — the closure equivalent of `global`

Same problem as before: reading an enclosing variable works, but
reassigning it needs an explicit keyword — `nonlocal` instead of `global`,
since this is the enclosing function's scope, not the module-level global
scope. Two separate counters, run a different number of times, make it
clear each one keeps its own independent state:

```python
def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter_a = make_counter()
counter_b = make_counter()

for _ in range(3):
    print("A:", counter_a())

for _ in range(5):
    print("B:", counter_b())
```
```
A: 1
A: 2
A: 3
B: 1
B: 2
B: 3
B: 4
B: 5
```
*(runs live, shows output — read-only demo snippet, not graded)*

`counter_a` and `counter_b` each came from their own call to
`make_counter()`, so each has its own separate `count` — running one three
times and the other five times doesn't affect the other's total at all.
Without `nonlocal`, `count += 1` would raise the same `UnboundLocalError`
you saw earlier with `global`, for the same reason: Python would treat
`count` as a new local variable the moment it sees an assignment to it.

---

## How this relates to object-oriented code

If you're used to reaching for a class whenever you need a "thing" that
remembers state between method calls, a closure is doing the same job in
miniature. Here's `make_counter` rewritten as a class, for comparison:

```python
class Counter:
    def __init__(self):
        self.count = 0

    def increment(self):
        self.count += 1
        return self.count

counter = Counter()
print(counter.increment())
print(counter.increment())
print(counter.increment())
```
```
1
2
3
```
*(runs live, shows output — read-only demo snippet, not graded)*

Line up the two versions: `self.count` in the class plays the same role as
`count` remembered by the closure — both are state that persists across
calls, private to one instance. `increment(self)` plays the same role as
the inner `increment()` function — both are the one operation you can
perform on that state. A closure is essentially **a lightweight object with
exactly one method and no name for its state** — useful when you need
"some remembered state plus one operation" and a full class would be more
ceremony than the problem needs. Once you need *multiple* related
operations sharing that state, a class (covered next lesson) is the better
fit.

---

## Quiz cards

> **Q1.** After a function that creates a local variable finishes running,
> can that variable be accessed outside the function?
> - A) Yes, it becomes a global variable automatically
> - B) No — it only exists within the function's local scope while it runs ✅
> - C) Only if the function returns a value
> - D) Only if the variable name starts with an underscore
>
> *Explanation: local variables are scoped to the function's execution and
> cease to exist once it returns.*

> **Q2.** Why does `call_count = call_count + 1` inside a function raise
> `UnboundLocalError`, if `call_count` already exists outside the function?
> - A) It's a syntax error
> - B) Any assignment to a name inside a function makes Python treat it as local for the whole function body, including reads before the local value is set ✅
> - C) `+` can't be used on variables from outside a function
> - D) `call_count` needs to be a global constant
>
> *Explanation: Python decides a name is local to a function based on
> whether it's assigned anywhere in that function's body, which applies
> retroactively to every line, including reads before the assignment.*

> **Q3.** What does the `global` keyword do inside a function?
> - A) Creates a brand-new global variable automatically
> - B) Tells Python that an assignment to that name should modify the outer/global variable, not create a local one ✅
> - C) Makes a local variable accessible everywhere after the function returns
> - D) Deletes the local version of the variable
>
> *Explanation: `global` redirects an assignment to the module-level
> variable instead of creating a shadowing local one.*

> **Q4.** Why is passing state in and returning it out generally preferred
> over `global` in agent code?
> - A) `global` is slower to execute
> - B) Passing state explicitly makes a function's dependencies visible in its signature, which matters especially once multiple parts of a system might mutate shared state ✅
> - C) `global` doesn't work inside functions with parameters
> - D) There's no real difference, it's just a style preference
>
> *Explanation: explicit parameters and return values make a function's
> behavior predictable from its signature alone — global state hides that
> dependency.*

> **Q5.** Given `def add_tool(tool, tools=[]):`, why does calling
> `add_tool("x")` twice not give you two separate one-item lists?
> - A) Python has a bug
> - B) The default `[]` is created once, when the function is defined, and reused across every call that doesn't supply its own list ✅
> - C) `tools=[]` means "create a new list each call" — this shouldn't happen and indicates a different bug
> - D) `.append()` resets the list after each call
>
> *Explanation: default argument values are evaluated once at definition
> time, not fresh on every call — this is only a problem for mutable
> defaults like lists or dicts.*

> **Q6.** In the two-counter example, why don't `counter_a` and `counter_b`
> affect each other's totals?
> - A) They don't actually work independently — this is a bug
> - B) Each call to `make_counter()` creates its own separate `count`, which each returned closure remembers independently ✅
> - C) `counter_a` and `counter_b` share the same `count` behind the scenes
> - D) Closures can only be created once per program
>
> *Explanation: every call to `make_counter()` creates a fresh enclosing
> scope with its own `count` — the two closures never share that state.*

> **Q7.** What would happen in `make_counter`'s `increment` function if
> `nonlocal count` were removed?
> - A) Nothing changes, it would work identically
> - B) `UnboundLocalError` — the same issue as reassigning a global without `global`, just one scope level up ✅
> - C) `count` would become a global variable automatically
> - D) It would raise a `SyntaxError` at definition time
>
> *Explanation: without `nonlocal`, `count += 1` would make Python treat
> `count` as a new local variable in `increment`, causing the same
> unbound-local error seen earlier with `global`.*

> **Q8.** What does the state a closure remembers (like `count` in
> `make_counter`) most resemble in object-oriented terms?
> - A) A class name
> - B) An instance attribute (like `self.count`), with the inner function acting like a single method ✅
> - C) A static/class-level variable shared across all instances
> - D) A local variable that's deleted after each call
>
> *Explanation: each call to `make_counter()` creates its own `count`, just
> like each instantiated object gets its own attributes — a closure is
> essentially a minimal object with one method.*

---

## Applied sandbox exercise 3

*Starter code shown to learner:*
```python
def register_tool(name, registry=None):
    """
    name: str — the tool name to add.
    registry: a list of already-registered tool names, or None.

    Add name to the registry (avoiding the mutable default argument
    trap), and return the updated registry. Don't add a duplicate if
    name is already present.
    """
    # TODO: implement, avoiding the mutable default argument trap
    pass
```

*Task shown to learner:* Handle the case where `registry` is `None` by
creating a fresh list inside the function, then add `name` only if it isn't
already present, and return the registry.

*Hidden test cases:*
```python
result1 = register_tool("search")
result2 = register_tool("calculator")
assert result1 == ["search"]
assert result2 == ["calculator"]   # NOT ["search", "calculator"] — proves no shared default list

existing = ["search"]
assert register_tool("search", existing) == ["search"]   # no duplicate
assert register_tool("memory", existing) == ["search", "memory"]
```

*Hint (shown on request):* Default `registry` to `None` in the signature,
then check `if registry is None: registry = []` as the first line inside
the function — this is the exact fix shown in the walkthrough for the
mutable default argument trap.

*Correct answer + explanation (shown on failure, if requested):*
```python
def register_tool(name, registry=None):
    if registry is None:
        registry = []
    if name not in registry:
        registry.append(name)
    return registry
```
The `registry is None` check is what prevents the mutable-default bug — a
fresh list is created per call when no registry is passed in, rather than
one list silently shared and accumulated across every call.

---

## Applied sandbox exercise 4

*(closures, composing with type hints)*

*Starter code shown to learner:*
```python
def make_validator(min_value: int, max_value: int):
    """
    Return a function that takes a single number and returns True if
    it's within [min_value, max_value] inclusive, False otherwise.
    """
    # TODO: implement using a closure
    pass
```

*Task shown to learner:* Define an inner function that takes a number and
checks it against `min_value`/`max_value` from the enclosing scope, then
return that inner function.

*Hidden test cases:*
```python
validate_score = make_validator(0, 100)
assert validate_score(50) == True
assert validate_score(150) == False
assert validate_score(0) == True
assert validate_score(100) == True

strict = make_validator(10, 10)
assert strict(10) == True
assert strict(11) == False
```

*Hint (shown on request):* The inner function only needs one parameter
(the number to check) — `min_value` and `max_value` are already available
to it as closed-over variables from `make_validator`'s scope, no need to
pass them in again.

*Correct answer + explanation (shown on failure, if requested):*
```python
def make_validator(min_value: int, max_value: int):
    def check(number: int) -> bool:
        return min_value <= number <= max_value
    return check
```
`check` closes over `min_value` and `max_value` from `make_validator`'s
scope — combining closures with the type hints from earlier in this lesson.
A validator factory like this is a common pattern for parameter-checking
logic attached to tools in agent code.

---

*(End of Concept 3. This lesson continues with Concept 4 — lambda, map, and
filter — drafted separately.)*
