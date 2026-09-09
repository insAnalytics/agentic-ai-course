# Module 0, Lesson 4 — Concept 2: Instance vs. class variables

---

## Class variables — defined once, shared by everyone

An instance attribute (`self.x = ...` inside `__init__`) belongs to one
object. A **class variable** is different: it's defined directly in the
class body, not inside `__init__`, and every instance shares the *same*
one — closer to a `static` field in Java/C#, except there's no `static`
keyword. The variable just lives in the class body instead of a method:

```python
class Agent:
    default_model = "claude-sonnet"   # class variable — one copy, shared

    def __init__(self, name: str):
        self.name = name              # instance attribute — one per object

agent_a = Agent("research_agent")
agent_b = Agent("support_agent")

print(agent_a.default_model)
print(agent_b.default_model)
```
```
claude-sonnet
claude-sonnet
```
*(runs live, shows output — read-only demo snippet, not graded)*

Both instances read the exact same `default_model` — there's only one copy
in memory, not one per instance. You can access it through the class name
directly too, which makes clear it doesn't belong to any particular
instance:

```python
print(Agent.default_model)
```
```
claude-sonnet
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Reading vs. reassigning — the shadowing trap

Reading a class variable through `self` works fine, since Python looks it
up on the instance first, then falls back to the class if it's not found
there. But *assigning* to `self.x` doesn't modify the class variable — it
creates a brand-new instance attribute that shadows it, for that instance
only:

```python
class Agent:
    default_model = "claude-sonnet"

    def __init__(self, name: str):
        self.name = name

agent_a = Agent("research_agent")
agent_b = Agent("support_agent")

agent_a.default_model = "claude-haiku"   # looks like it should change it for everyone...

print(agent_a.default_model)
print(agent_b.default_model)
print(Agent.default_model)
```
```
claude-haiku
claude-sonnet
claude-sonnet
```
*(runs live, shows output — read-only demo snippet, not graded)*

`agent_a.default_model = "claude-haiku"` doesn't touch the shared class
variable at all — it creates a new instance attribute on `agent_a` that
happens to have the same name, which now shadows the class variable
whenever you look it up through `agent_a` specifically. `agent_b` and
`Agent` itself are completely unaffected. This is the same shadowing logic
as [reassigning a variable inside a function creating a new local instead of touching the outer one](→ Module 0, the functions lesson, scope concept, the local-variable shadowing example) — just one level up, instance vs. class instead of local vs. global.

---

## The mutable class variable trap

This shadowing behavior is mostly harmless for immutable values like
strings or numbers — you get a separate copy, no real damage done. It gets
genuinely dangerous when the class variable is a mutable type, like a list,
and you *mutate it in place* instead of reassigning it. Mutating in place
(`.append()`, not `=`) never triggers the shadowing above — every instance
is still pointing at the exact same shared list:

```python
class Agent:
    available_tools = []   # DANGER: one shared list, not one per instance

    def __init__(self, name: str):
        self.name = name

    def add_tool(self, tool: str):
        self.available_tools.append(tool)   # mutates the SHARED list

agent_a = Agent("research_agent")
agent_b = Agent("support_agent")

agent_a.add_tool("search")

print(agent_a.available_tools)
print(agent_b.available_tools)
```
```
['search']
['search']
```
*(runs live, shows output — read-only demo snippet, not graded)*

`agent_b` never called `add_tool`, but it sees `"search"` anyway — both
instances share the exact same list object, so mutating it through one
instance is visible through every other one too. This is the same failure
shape as [the mutable default argument trap](→ Module 0, the functions lesson, scope concept, the mutable default argument trap): a single mutable object created once and silently shared everywhere that doesn't explicitly get its own copy.

The fix is the same instinct as that trap's fix — give each instance its
own copy, created fresh in `__init__`, not shared at the class level:

```python
class Agent:
    def __init__(self, name: str):
        self.name = name
        self.available_tools = []   # fresh list per instance

    def add_tool(self, tool: str):
        self.available_tools.append(tool)

agent_a = Agent("research_agent")
agent_b = Agent("support_agent")

agent_a.add_tool("search")

print(agent_a.available_tools)
print(agent_b.available_tools)
```
```
['search']
[]
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## When a class variable is actually the right call

None of this means class variables are a mistake to avoid — they're the
right tool in two specific cases:

**A genuine constant**, the same for every instance and never meant to
change per-object:

```python
class Agent:
    DEFAULT_TEMPERATURE = 0.7   # ALL_CAPS is the usual convention for a constant

    def __init__(self, name: str, temperature: float = None):
        self.name = name
        self.temperature = temperature if temperature is not None else Agent.DEFAULT_TEMPERATURE
```
*(not run live — illustrating the pattern, not a new output)*

**A value genuinely meant to be shared and tracked across every instance**
— like a running count of how many agents have been created. The key
detail: modify it through the class name, not `self`, or you'll hit the
exact shadowing trap from above:

```python
class Agent:
    total_created = 0

    def __init__(self, name: str):
        self.name = name
        Agent.total_created += 1   # modify via the class name, not self

Agent("research_agent")
Agent("support_agent")
Agent("planner_agent")

print(Agent.total_created)
```
```
3
```
*(runs live, shows output — read-only demo snippet, not graded)*

`Agent.total_created += 1` explicitly targets the class variable — writing
`self.total_created += 1` instead would silently create a separate,
shadowed instance attribute on each agent, starting over at a wrong value
every time, instead of actually incrementing a shared count.

---

## Quiz cards

> **Q1.** What's the key difference between a class variable and an
> instance attribute?
> - A) There's no real difference, just where they're written
> - B) A class variable is one shared copy across every instance; an instance attribute is a separate copy per object ✅
> - C) Instance attributes are shared, class variables are per-object
> - D) Class variables can only hold numbers
>
> *Explanation: a class variable lives in the class body and has exactly
> one copy in memory; each `self.x = ...` in `__init__` creates a distinct
> copy per instance.*

> **Q2.** Given a class variable `default_model` on `Agent`, what happens
> when you run `agent_a.default_model = "claude-haiku"`?
> - A) It updates the shared class variable for every instance
> - B) It creates a new instance attribute on `agent_a` that shadows the class variable, leaving other instances and the class itself unaffected ✅
> - C) It raises an `AttributeError`
> - D) It updates `Agent.default_model` and `agent_a`'s value simultaneously
>
> *Explanation: assigning through `self` (or a specific instance) never
> modifies the class variable — it creates a same-named instance attribute
> that shadows it for that instance only.*

> **Q3.** Why does `self.available_tools.append(tool)` behave completely
> differently from `self.available_tools = self.available_tools + [tool]`,
> when `available_tools` starts as a class variable?
> - A) They're identical, both create a new instance attribute
> - B) `.append()` mutates the shared list in place, visible to every instance; `=` reassigns and creates a new shadowing instance attribute instead ✅
> - C) `.append()` always raises an error on a class variable
> - D) `+` isn't valid on lists
>
> *Explanation: mutating in place (`.append()`) never triggers shadowing —
> every instance is still looking at the same shared list object.
> Reassigning with `=` is what creates the shadowed instance copy.*

> **Q4.** What's the standard fix for a mutable class variable that's
> supposed to be per-instance data, not shared state?
> - A) Use a tuple instead of a list
> - B) Create it fresh inside `__init__` as an instance attribute (`self.x = []`), instead of defining it in the class body ✅
> - C) Add `global` before it
> - D) There's no fix — mutable class variables should never be used
>
> *Explanation: this mirrors the fix for the mutable default argument trap
> — create a fresh object per instance in `__init__` rather than sharing
> one object defined once at the class level.*

> **Q5.** When incrementing a genuinely shared counter like
> `Agent.total_created`, why does the code use `Agent.total_created += 1`
> instead of `self.total_created += 1`?
> - A) `self.total_created += 1` would raise a `SyntaxError`
> - B) `self.total_created += 1` would create a shadowed instance attribute starting fresh on each instance, instead of incrementing the one shared count ✅
> - C) There's no difference between the two
> - D) `Agent.total_created` is faster to type-check
>
> *Explanation: writing through `self` triggers the same shadowing seen
> earlier — to actually update shared class-level state, you have to name
> the class explicitly.*

---

## Applied sandbox exercise 2

*(class variables + instance attributes together — first checkpoint
involving class-level state)*

*Starter code shown to learner:*
```python
class ToolCall:
    """
    TODO: implement using both a class variable and instance attributes.

    Class variable:
      total_calls: starts at 0, shared across all instances.

    __init__(self, tool_name: str):
      - store tool_name as an instance attribute
      - increment ToolCall.total_calls by 1 (via the class name, not self)

    Method call_number(self) -> int:
      - returns the value ToolCall.total_calls had immediately after
        THIS instance was created (store it as an instance attribute
        in __init__, don't recompute it later)
    """
    # TODO: implement
    pass
```

*Task shown to learner:* Add a class variable `total_calls` starting at
`0`. In `__init__`, store `tool_name`, increment `ToolCall.total_calls`,
and save the resulting count as an instance attribute so `call_number()`
can return it later. Each new `ToolCall` should see the running total from
every `ToolCall` created before it, including ones from previous test
cases.

*Hidden test cases:*
```python
call1 = ToolCall("search")
assert call1.call_number() == 1

call2 = ToolCall("calculator")
assert call2.call_number() == 2

call3 = ToolCall("memory")
assert call3.call_number() == 3

assert ToolCall.total_calls == 3
assert call1.call_number() == 1   # unchanged — recorded at creation time, not recomputed
```

*Hint (shown on request):* In `__init__`: `ToolCall.total_calls += 1`
first, then `self.my_number = ToolCall.total_calls` to freeze that
instance's number at creation time. `call_number()` just returns
`self.my_number` — it shouldn't reference `ToolCall.total_calls` directly,
or every instance would report the current (wrong) total instead of its
own.

*Correct answer + explanation (shown on failure, if requested):*
```python
class ToolCall:
    total_calls = 0

    def __init__(self, tool_name: str):
        self.tool_name = tool_name
        ToolCall.total_calls += 1
        self.my_number = ToolCall.total_calls

    def call_number(self) -> int:
        return self.my_number
```
This is the exact distinction the lesson builds toward: `total_calls` is
genuinely shared state, updated through the class name so every instance
sees the same running total — but `my_number` is deliberately captured as
an instance attribute at creation time, so each call's number stays fixed
even as `total_calls` keeps climbing for calls created afterward.

---

*(End of Concept 2. This lesson continues with Concept 3 — decorators,
`@staticmethod`/`@classmethod` — drafted separately.)*
