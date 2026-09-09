# Module 0, Lesson 5 — Concept 1: Classes vs. dicts

---

## The same data, two different shapes

Every dict you've built so far — an agent config, a tool call, a response
payload — could just as easily be represented as a class instance instead.
Same data, two different containers:

```python
agent_config = {
    "name": "research_agent",
    "model": "claude-sonnet",
    "temperature": 0.7,
}

print(agent_config["name"])
```
```
research_agent
```
*(runs live, shows output — read-only demo snippet, not graded)*

```python
class AgentConfig:
    def __init__(self, name: str, model: str, temperature: float = 0.7):
        self.name = name
        self.model = model
        self.temperature = temperature

agent_config = AgentConfig("research_agent", "claude-sonnet")
print(agent_config.name)
```
```
research_agent
```
*(runs live, shows output — read-only demo snippet, not graded)*

Both work. Both hold the same three values. The question this section
answers isn't "which one is correct" — it's which one fits a given
situation better, and why.

---

## Where a dict wins

A dict is the right shape when the set of keys is genuinely dynamic —
unknown ahead of time, varying between instances, or coming directly from
somewhere you don't control the shape of (a parsed JSON API response, for
instance). You've already used this constantly: `**kwargs` collects into a
dict specifically because the caller's keyword arguments aren't knowable
in advance.

```python
def build_request(**kwargs):
    return kwargs   # arbitrary keys, decided entirely by the caller

print(build_request(query="weather", location="NYC"))
print(build_request(expression="2+2"))
```
```
{'query': 'weather', 'location': 'NYC'}
{'expression': '2+2'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

A dict also wins for genuinely dynamic access — looking up a value by a
key you only have as a variable, not as a name you'd type into code:

```python
field_to_check = "temperature"
print(agent_config.get(field_to_check))
```
```
No such attribute lookup is this convenient on a class — you'd need
getattr(agent_config, field_to_check) instead, which exists but is
noticeably less idiomatic for this specific case.
```
*(not run live — illustrating the tradeoff, not a working demo)*

---

## Where a class wins

A class is the right shape once the fields are known and fixed —
`AgentConfig` always has exactly `name`, `model`, and `temperature`, never
some other set. That fixed shape buys you three concrete things a dict
can't offer:

**Typos become real errors instead of silent bugs.** A wrong dict key just
returns `None` (or raises `KeyError`, if you're not using `.get()`) with no
indication of what went wrong; a wrong attribute name is closer to a
`TypeError` immediately, and — as covered next — a good editor will often
flag it before you even run the code.

```python
agent_config_dict = {"name": "research_agent", "model": "claude-sonnet"}
print(agent_config_dict.get("tempurature"))   # typo — silently returns None

agent_config_obj = AgentConfig("research_agent", "claude-sonnet")
print(agent_config_obj.tempurature)           # typo — actually fails
```
```
None
Traceback (most recent call last):
  File "script.py", line 5, in <module>
    print(agent_config_obj.tempurature)
AttributeError: 'AgentConfig' object has no attribute 'tempurature'
```
*(runs live, shows output — read-only demo snippet, not graded)*

The dict version's typo produces `None` — plausible-looking output that's
actually silently wrong, the kind of bug that surfaces three functions
later with no clear trail back to its cause. The class version fails
immediately, at the exact line the mistake was made.

**Autocomplete and inline documentation work.** Because `AgentConfig` has
[type-hinted parameters](→ Module 0, the functions lesson, function fundamentals concept, the type hints explanation), an editor like VS Code knows `agent_config.` has exactly `name`, `model`, and `temperature` available, and can show that list as you type — a dict's keys are just strings, invisible to the editor until runtime.

**Behavior lives with the data.** A class can bundle methods alongside its
fields — a dict is data only, so any related logic has to live in a
separate free-floating function that takes the dict as an argument:

```python
class AgentConfig:
    def __init__(self, name: str, model: str, temperature: float = 0.7):
        self.name = name
        self.model = model
        self.temperature = temperature

    def summary(self) -> str:
        return f"{self.name} on {self.model} (temp={self.temperature})"

agent_config = AgentConfig("research_agent", "claude-sonnet")
print(agent_config.summary())
```
```
research_agent on claude-sonnet (temp=0.7)
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## The gap neither one closes yet

Notice what `AgentConfig` does *not* do: it doesn't check that `name` is
actually a string, or that `temperature` is actually a number. Nothing
stops this:

```python
broken_config = AgentConfig(name=123, model=None, temperature="hot")
print(broken_config.summary())
```
```
123 on None (temp=hot)
```
*(runs live, shows output — read-only demo snippet, not graded)*

This runs without complaint — [type hints aren't enforced at runtime](→ Module 0, the functions lesson, function fundamentals concept, the type hints explanation), and a plain class's `__init__` is really just a set of assignments with no validation logic of its own. A dict has exactly the same gap; neither container, on its own, actually *checks* that the data it's holding is correct. Closing that gap — getting type hints to become real runtime validation — is where the rest of this lesson is headed.

---

## Quiz cards

> **Q1.** Why is a dict the better fit for `**kwargs`-style data, like
> arbitrary keyword arguments collected in a function?
> - A) Dicts are always faster than classes
> - B) The set of keys isn't known in advance — a dict handles genuinely dynamic, caller-determined keys naturally, while a class needs its fields fixed ahead of time ✅
> - C) Classes can't hold string values
> - D) There's no real difference between the two here
>
> *Explanation: a class's fields are fixed at definition time; a dict's
> keys can be anything, decided entirely at runtime — which is exactly
> what `**kwargs` needs.*

> **Q2.** What actually happens when you look up a typo'd key with
> `.get()` on a dict, versus a typo'd attribute on a class instance?
> - A) Both raise the same error immediately
> - B) `.get()` on a missing key silently returns `None`; a missing attribute on a class instance raises `AttributeError` right away ✅
> - C) Both silently return `None`
> - D) Both raise `AttributeError`
>
> *Explanation: this is the core practical argument for a class with fixed
> fields — a typo becomes an immediate, loud failure instead of a silent
> wrong value discovered much later.*

> **Q3.** Why does an editor's autocomplete work for `agent_config.` on a
> class instance, but not for `agent_config_dict[` on a dict?
> - A) Editors don't actually support autocomplete for either
> - B) A class's fields are declared in code (with type hints) the editor can see; a dict's keys are just runtime string values with no static declaration ✅
> - C) Dicts are a newer Python feature editors haven't caught up to
> - D) Autocomplete only works inside `__init__`
>
> *Explanation: type-hinted class attributes are visible to tooling before
> the code even runs; dict keys only exist as data at runtime, invisible
> to static analysis.*

> **Q4.** Given `AgentConfig(name=123, model=None, temperature="hot")`,
> why does this run without any error?
> - A) Python automatically converts the values to the correct types
> - B) Type hints aren't enforced at runtime — `__init__` is just assignment statements, with no validation logic of its own ✅
> - C) `AgentConfig` secretly validates types behind the scenes
> - D) This actually does raise an error
>
> *Explanation: neither a plain class nor a dict validates the data it
> holds by default — type hints are documentation for humans and tooling,
> not a runtime check, which is the gap the rest of this lesson closes.*

---

## Applied sandbox exercise 1

*Starter code shown to learner:*
```python
class ToolResult:
    """
    TODO: implement __init__ with type-hinted parameters:
      tool_name: str, output: str, success: bool = True

    TODO: implement a method as_dict(self) -> dict that returns the
    same data as a plain dict, shaped exactly like:
      {"tool_name": ..., "output": ..., "success": ...}

    This exercise is deliberately about converting between the two
    shapes covered in this section — a class instance that can also
    produce the dict-shaped version of the same data on request.
    """
    # TODO: implement
    pass
```

*Task shown to learner:* Implement `__init__` storing all three
parameters as instance attributes, then implement `as_dict()` to return
them as a plain dict with the exact keys shown.

*Hidden test cases:*
```python
result = ToolResult("search", "3 results found")
assert result.tool_name == "search"
assert result.success == True
assert result.as_dict() == {"tool_name": "search", "output": "3 results found", "success": True}

result2 = ToolResult("calculator", "division by zero", success=False)
assert result2.as_dict() == {"tool_name": "calculator", "output": "division by zero", "success": False}
```

*Hint (shown on request):* `as_dict()` just needs to build and return a
dict literal referencing `self.tool_name`, `self.output`, and
`self.success` — the same three values `__init__` already stored, just
reshaped into the other container.

*Correct answer + explanation (shown on failure, if requested):*
```python
class ToolResult:
    def __init__(self, tool_name: str, output: str, success: bool = True):
        self.tool_name = tool_name
        self.output = output
        self.success = success

    def as_dict(self) -> dict:
        return {
            "tool_name": self.tool_name,
            "output": self.output,
            "success": self.success,
        }
```
This makes the class-vs-dict relationship concrete: the same data can move
between both shapes freely, and `as_dict()` is a genuinely common real
pattern — a class holds the data with all the benefits from this section
during normal use, but can still produce a plain dict on request for
situations that specifically need one (e.g. JSON-serializing a response).

---

*(End of Concept 1. This lesson continues with Concept 2 — `@dataclass` —
drafted separately.)*
