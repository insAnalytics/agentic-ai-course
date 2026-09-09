# Build Object-Oriented Python

> **You'll be able to**
> - Write classes with `__init__`, instance attributes, and methods, and
>   know when a class variable is the right call instead — including
>   avoiding the mutable class variable trap
> - Write and apply decorators, and choose correctly between an instance
>   method, `@staticmethod`, and `@classmethod`
> - Implement `__str__`, `__repr__`, and `__eq__` so your own objects print
>   and compare the way you actually want, not Python's default
> - Build class hierarchies with inheritance — `super()`, method
>   overriding, and `isinstance()` — and recognize when inheritance is the
>   right fit versus a closure or plain composition

**Why it matters**
A tool, an agent, a memory store — almost everything you'll build later in
this course ends up as a class: state that persists across calls, bundled
with the operations that act on it. Tool-calling frameworks specifically
lean on the OOP patterns from this lesson — `@classmethod` alternate
constructors for building tools from config, `__repr__` for readable
debug logs, inheritance for a shared `Tool` base class multiple concrete
tools subclass from. Getting comfortable organizing state and behavior
into classes now is what makes those frameworks read as familiar
structure instead of unfamiliar magic.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all five concepts, mixed order)*

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

> **Q2.** Why is `available_tools = []` defined directly in a class body
> (not in `__init__`) dangerous if a method does
> `self.available_tools.append(...)`?
> - A) It isn't dangerous, this is a normal safe pattern
> - B) Every instance shares the exact same list, so mutating it through one instance is visible through every other instance too ✅
> - C) `.append()` raises an error on class variables
> - D) It only affects the instance that called it
>
> *Explanation: mutating in place never triggers instance shadowing — every
> instance still points at the same shared list object underneath.*

> **Q3.** What is `@my_decorator` above a function definition actually
> equivalent to?
> - A) It has no equivalent, it's special Python-only syntax
> - B) `func = my_decorator(func)` — reassigning the function to the result of the decorator called on it ✅
> - C) Calling `my_decorator()` once and discarding the result
> - D) Wrapping the function in a `try`/`except` automatically
>
> *Explanation: `@` is sugar over `func = decorator(func)` — a decorator is
> just a function that takes a function and returns one.*

> **Q4.** A method needs to build an instance a different way than
> `__init__` expects (e.g. from a config dict), without needing any
> particular existing instance. Which is the right choice?
> - A) A regular instance method
> - B) `@staticmethod`
> - C) `@classmethod` ✅
> - D) Any of the three work identically
>
> *Explanation: this is the classic alternate-constructor use case —
> needing the class itself (to call `cls(...)`), but no specific instance.*

> **Q5.** Without `__eq__` defined, what does `==` check between two
> separately-created instances holding identical data?
> - A) Whether all their attributes match
> - B) Whether they're the exact same object in memory, not whether their data matches ✅
> - C) It always returns `True` for same-class instances
> - D) It raises a `TypeError`
>
> *Explanation: default equality is identity-based, the same as Java's
> default `.equals()` before overriding — not a value comparison.*

> **Q6.** If a class defines `__repr__` but not `__str__`, what does
> `print()` show?
> - A) The default `<...object at 0x...>` representation
> - B) `__repr__`'s output — it's the fallback Python uses when `__str__` is missing ✅
> - C) An error, since `__str__` is required
> - D) An empty string
>
> *Explanation: Python falls back to `__repr__` when `__str__` is absent,
> which is why defining `__repr__` alone still improves `print()` output.*

> **Q7.** In `class SearchTool(Tool):`, why call `super().__init__(name)`
> inside `SearchTool.__init__` instead of rewriting `self.name = name`
> directly?
> - A) `self.name = name` would raise an error in a subclass
> - B) It reuses the parent's existing setup logic instead of duplicating it ✅
> - C) `super()` is required syntax for every subclass regardless of need
> - D) It converts `name` into a class variable
>
> *Explanation: `super().__init__(...)` calls the parent's constructor on
> the current instance, avoiding repeated logic between parent and child.*

> **Q8.** A list holds a mix of subclass instances, all sharing one parent
> class. Calling `tool.run(...)` in a loop runs the correct version for
> each one without checking types first. What makes this work?
> - A) Coincidence
> - B) Polymorphism — Python looks up the method on each object's actual class at call time, not the loop variable's declared type ✅
> - C) It only works if every subclass has an identical `run()`
> - D) `isinstance()` must be called manually inside the loop first
>
> *Explanation: because every item is-a the shared parent class, calling a
> method uniformly across all of them dispatches to each one's own
> overridden version automatically.*

---

## Comprehensive sandbox

*(end of lesson, applied — combines all five concepts: class + instance
variables, a classmethod alternate constructor, a staticmethod validator,
`__repr__`/`__eq__`, and an inheriting subclass that overrides one method
and extends another with `super()`.)*

*Starter code shown to learner:*
```python
class ToolCall:
    """
    Base class representing a single tool call.

    Class variable:
      total_calls: starts at 0, shared across ToolCall and any subclass.

    __init__(self, tool_name: str, arguments: dict):
      - store both as instance attributes
      - increment ToolCall.total_calls

    __repr__(self):
      - return f"ToolCall({tool_name!r}, {arguments!r})" (use !r on both)

    __eq__(self, other):
      - two calls are equal if tool_name AND arguments both match

    @classmethod
    from_raw(cls, raw: dict):
      - raw is shaped like {"tool": "search", "args": {"query": "weather"}}
      - build and return an instance via cls(...), not ToolCall(...)

    @staticmethod
    is_valid_arguments(arguments) -> bool:
      - return True if arguments is a non-empty dict, False otherwise
      - (a non-dict input should return False, not crash)
    """
    # TODO: implement ToolCall fully
    pass


class LoggedToolCall(ToolCall):
    """
    Subclass that adds a formatted log line on top of ToolCall.

    __init__(self, tool_name: str, arguments: dict, duration_ms: int):
      - call the parent's __init__ using super()
      - store duration_ms as its own instance attribute

    __repr__(self):
      - extend (don't fully replace) the parent's __repr__:
        return super().__repr__() + f" [{self.duration_ms}ms]"
    """
    # TODO: implement LoggedToolCall fully
    pass
```

*Task shown to learner:* Implement `ToolCall` with everything described —
the class variable, `__init__`, `__repr__`, `__eq__`, the `from_raw`
classmethod, and the `is_valid_arguments` staticmethod. Then implement
`LoggedToolCall`, inheriting from `ToolCall`, adding `duration_ms` via
`super().__init__()`, and extending (not replacing) `__repr__` with
`super().__repr__()`.

*Hidden test cases:*
```python
call = ToolCall.from_raw({"tool": "search", "args": {"query": "weather"}})
assert call.tool_name == "search"
assert call.arguments == {"query": "weather"}
assert ToolCall.total_calls == 1
assert repr(call) == "ToolCall('search', {'query': 'weather'})"

call2 = ToolCall("search", {"query": "weather"})
assert call == call2   # equal by value, not identity
assert ToolCall.total_calls == 2

assert ToolCall.is_valid_arguments({"query": "weather"}) == True
assert ToolCall.is_valid_arguments({}) == False
assert ToolCall.is_valid_arguments("not a dict") == False

logged = LoggedToolCall("calculator", {"expr": "2+2"}, duration_ms=120)
assert logged.tool_name == "calculator"
assert logged.duration_ms == 120
assert repr(logged) == "ToolCall('calculator', {'expr': '2+2'}) [120ms]"
assert isinstance(logged, ToolCall)
assert ToolCall.total_calls == 3   # LoggedToolCall's super().__init__() still increments it
```

*Hint (shown on request):* `from_raw` is
`return cls(raw["tool"], raw["args"])` — routing through `__init__` keeps
`total_calls` correct. `is_valid_arguments` needs
`isinstance(arguments, dict) and len(arguments) > 0`. In `LoggedToolCall`,
`__init__` starts with `super().__init__(tool_name, arguments)`, then
`self.duration_ms = duration_ms`. `__repr__` is one line:
`return super().__repr__() + f" [{self.duration_ms}ms]"` — this calls
`ToolCall.__repr__` first, then appends to it, rather than rewriting the
whole string from scratch.

*Correct answer + explanation (shown on failure, if requested):*
```python
class ToolCall:
    total_calls = 0

    def __init__(self, tool_name: str, arguments: dict):
        self.tool_name = tool_name
        self.arguments = arguments
        ToolCall.total_calls += 1

    def __repr__(self):
        return f"ToolCall({self.tool_name!r}, {self.arguments!r})"

    def __eq__(self, other):
        return self.tool_name == other.tool_name and self.arguments == other.arguments

    @classmethod
    def from_raw(cls, raw: dict):
        return cls(raw["tool"], raw["args"])

    @staticmethod
    def is_valid_arguments(arguments) -> bool:
        return isinstance(arguments, dict) and len(arguments) > 0


class LoggedToolCall(ToolCall):
    def __init__(self, tool_name: str, arguments: dict, duration_ms: int):
        super().__init__(tool_name, arguments)
        self.duration_ms = duration_ms

    def __repr__(self):
        return super().__repr__() + f" [{self.duration_ms}ms]"
```
This composes every concept from the lesson: a class variable
(`total_calls`) correctly updated via the class name even when created
through a subclass, a `@classmethod` alternate constructor, a
`@staticmethod` validator needing neither instance nor class state,
value-based `__eq__` instead of default identity comparison, and
`LoggedToolCall` both extending `__init__` and extending (rather than
replacing) `__repr__` via `super()` — the exact "is-a, builds on the
parent" relationship the inheritance section was built around.
