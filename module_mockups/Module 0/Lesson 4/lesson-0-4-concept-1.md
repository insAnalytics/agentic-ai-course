# Module 0, Lesson 4 — Concept 1: Class fundamentals

---

## Basic syntax, compared to what you know

Python's class syntax will look familiar, with a couple of specifics worth
calling out:

```python
class Agent:
    def __init__(self, name, model):
        self.name = name
        self.model = model

    def describe(self):
        return f"{self.name} running on {self.model}"

agent = Agent("research_agent", "claude-sonnet")
print(agent.describe())
```
```
research_agent running on claude-sonnet
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two things that differ from Java/C++/C#:

- **`self` is an explicit first parameter on every instance method** — not
  an implicit keyword like `this`. You write it yourself in every method
  signature, and Python passes the instance into it automatically when you
  call `agent.describe()`.
- **No access modifiers by default** — no `public`/`private`/`protected`.
  Every attribute and method is accessible from outside the class unless
  you follow a convention (a leading underscore, `self._internal`) to
  *signal* "don't touch this," which Python trusts you to respect rather
  than enforcing.

---

## `__init__` and instance attributes

`__init__` runs automatically when a class is instantiated — it's
Python's constructor, though the name itself is just a convention Python
recognizes, not a keyword:

```python
class Agent:
    def __init__(self, name, model, temperature=0.7):
        self.name = name
        self.model = model
        self.temperature = temperature

agent = Agent("research_agent", "claude-sonnet")
print(agent.temperature)
```
```
0.7
```
*(runs live, shows output — read-only demo snippet, not graded)*

`__init__`'s parameters work exactly like
[regular function default arguments](→ Module 0, the functions lesson, function fundamentals concept),
including keyword arguments and type hints:

```python
class Agent:
    def __init__(self, name: str, model: str, temperature: float = 0.7):
        self.name = name
        self.model = model
        self.temperature = temperature
```
*(not run live — same behavior as above, just annotated)*

Each `self.xxx = ...` line creates an **instance attribute** — data that
belongs to that specific object, not shared with other instances of the
same class:

```python
agent_a = Agent("research_agent", "claude-sonnet")
agent_b = Agent("support_agent", "claude-haiku")

print(agent_a.name)
print(agent_b.name)
```
```
research_agent
support_agent
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Methods

A method is just a function defined inside a class, always taking `self`
as its first parameter so it can read and modify that instance's
attributes:

```python
class Agent:
    def __init__(self, name: str, temperature: float = 0.7):
        self.name = name
        self.temperature = temperature

    def increase_temperature(self, amount: float):
        self.temperature += amount

    def describe(self) -> str:
        return f"{self.name} at temperature {self.temperature}"

agent = Agent("research_agent")
agent.increase_temperature(0.2)
print(agent.describe())
```
```
research_agent at temperature 0.9
```
*(runs live, shows output — read-only demo snippet, not graded)*

`agent.increase_temperature(0.2)` — you don't pass `self` yourself; Python
fills it in automatically as `agent` because you called the method *on*
`agent`.

---

## Quiz cards

> **Q1.** Why does every instance method in Python explicitly take `self`
> as its first parameter, unlike Java's implicit `this`?
> - A) It's a Python bug that's never been fixed
> - B) Python doesn't have implicit parameters — `self` has to be declared like any other parameter, even though Python passes it in automatically at call time ✅
> - C) `self` is only needed for `__init__`
> - D) `self` is optional and can be omitted
>
> *Explanation: Python has no hidden implicit parameters — `self` must be
> written explicitly in every method signature, and Python fills it in
> automatically when the method is called on an instance.*

> **Q2.** What does Python do to enforce that `agent._internal_state`
> shouldn't be accessed from outside the class?
> - A) It raises an `AttributeError` if you try
> - B) Nothing — the leading underscore is a convention signaling intent, not an enforced restriction ✅
> - C) It requires a special decorator to access it
> - D) It hides the attribute from `dir()`
>
> *Explanation: Python has no true access modifiers — a leading underscore
> is a widely respected convention, not an enforced language rule.*

> **Q3.** In `agent_a = Agent(...)` and `agent_b = Agent(...)`, why does
> changing `agent_a.name` not affect `agent_b.name`?
> - A) It does affect it, this is a common Python bug
> - B) Instance attributes belong to each specific object separately, not shared across instances ✅
> - C) `name` is a special protected keyword
> - D) Only true if `__init__` uses `global`
>
> *Explanation: each `self.xxx = ...` in `__init__` creates a separate
> attribute per instance — this is what "instance attribute" means.*

> **Q4.** When calling `agent.increase_temperature(0.2)`, why doesn't the
> caller need to pass `self` explicitly?
> - A) `self` isn't actually used by this method
> - B) Python automatically passes the instance (`agent`) as `self` when a method is called on it ✅
> - C) `self` defaults to `None` if omitted
> - D) This is a syntax error — `self` must always be passed explicitly
>
> *Explanation: calling a method on an instance (`agent.method(...)`)
> automatically supplies that instance as the method's `self` argument.*

---

## Applied sandbox exercise 1

*Starter code shown to learner:*
```python
class ToolCall:
    """
    TODO: implement __init__ with type-hinted parameters:
      tool_name: str, arguments: dict, result: str = None

    TODO: implement a method `summary(self) -> str` that returns:
      "{tool_name}({arguments}) -> {result}"
      e.g. "search({'query': 'weather'}) -> 3 results found"
    """
    pass
```

*Task shown to learner:* Implement `__init__` with type-hinted parameters
(`result` defaulting to `None`), storing each as an instance attribute, and
implement `summary()` to format the call as described.

*Hidden test cases:*
```python
call = ToolCall("search", {"query": "weather"}, "3 results found")
assert call.summary() == "search({'query': 'weather'}) -> 3 results found"

call2 = ToolCall("calculator", {"expr": "2+2"})
assert call2.result is None
assert call2.summary() == "calculator({'expr': '2+2'}) -> None"
```

*Hint (shown on request):* `__init__(self, tool_name: str, arguments: dict, result: str = None):`
— store each parameter as `self.xxx`. `summary()` just needs an
[f-string](→ Lesson 0.1, control flow and syntax concept, the f-string explanation)
referencing `self.tool_name`, `self.arguments`, and `self.result`.

*Correct answer + explanation (shown on failure, if requested):*
```python
class ToolCall:
    def __init__(self, tool_name: str, arguments: dict, result: str = None):
        self.tool_name = tool_name
        self.arguments = arguments
        self.result = result

    def summary(self) -> str:
        return f"{self.tool_name}({self.arguments}) -> {self.result}"
```
This combines instance attributes, a default argument, type hints, and an
f-string — all from earlier material, just organized inside a class for
the first time.

---

*(End of Concept 1. This lesson continues with Concept 2 — instance vs.
class variables — drafted separately.)*
