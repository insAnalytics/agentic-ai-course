# Module 0, Lesson 2 — Concept 3: Dicts

---

## If you're coming from another language

A Python `dict` is the equivalent of Java's `HashMap`, JS's plain object (or
`Map`), or C#'s `Dictionary` — a collection of key-value pairs, looked up by
key instead of position.

```python
agent_config = {
    "name": "research_agent",
    "temperature": 0.7,
    "max_tokens": 1000,
}
print(agent_config["name"])
```
```
research_agent
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Key access, and the difference between `[]` and `.get()`

Direct bracket access raises an error if the key doesn't exist:

```python
print(agent_config["model"])
```
```
Traceback (most recent call last):
  File "script.py", line 1, in <module>
    print(agent_config["model"])
KeyError: 'model'
```
*(runs live, shows output — read-only demo snippet, not graded)*

`.get()` returns `None` instead of crashing, and optionally lets you
specify a fallback value:

```python
print(agent_config.get("model"))              # None — key doesn't exist
print(agent_config.get("model", "claude"))     # "claude" — explicit fallback
print(agent_config.get("name", "unknown"))     # "research_agent" — key exists, fallback ignored
```
```
None
claude
research_agent
```
*(runs live, shows output — read-only demo snippet, not graded)*

Use `.get()` whenever a missing key is a normal possibility rather than a
bug; use `[]` when a missing key should be treated as an error worth
crashing on (or catch it explicitly with `try`/`except KeyError`, from
Lesson 0.1).

---

## Modifying a dict, and iterating over it

```python
agent_config["model"] = "claude-sonnet"   # add or overwrite a key
del agent_config["max_tokens"]            # remove a key

print(agent_config)
```
```
{'name': 'research_agent', 'temperature': 0.7, 'model': 'claude-sonnet'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

Three ways to loop over a dict, depending on what you need:

```python
for key in agent_config:                    # keys only (default)
    print(key)

for key, value in agent_config.items():      # both, unpacked as a tuple pair
    print(key, "->", value)

for value in agent_config.values():          # values only
    print(value)
```
```
name
temperature
model
name -> research_agent
temperature -> 0.7
model -> claude-sonnet
research_agent
0.7
claude-sonnet
```
*(runs live, shows output — read-only demo snippet, not graded)*

`.items()` returns each pair as a `(key, value)` tuple, which is why
`for key, value in ...` works: it's unpacking, exactly like Concept 2's
tuple unpacking, just happening automatically once per loop iteration.

---

## The tally pattern

A very common use of dicts: counting occurrences of something, building the
dict up as you go.

```python
messages = ["search", "calculate", "search", "remember", "search"]

tally = {}
for msg in messages:
    tally[msg] = tally.get(msg, 0) + 1

print(tally)
```
```
{'search': 3, 'calculate': 1, 'remember': 1}
```
*(runs live, shows output — read-only demo snippet, not graded)*

`.get(msg, 0)` is what makes this work without pre-declaring every possible
key: the first time `msg` appears, `.get()` returns `0` (the fallback)
since the key isn't there yet, and `+ 1` makes it `1`. Every time after
that, `.get()` returns the running count, and `+ 1` increments it.

---

## Quiz cards

> **Q1.** What's the practical difference between `config["model"]` and
> `config.get("model")` when `"model"` isn't a key in `config`?
> - A) No difference, both raise an error
> - B) `[]` raises `KeyError`; `.get()` returns `None` (or an explicit fallback) instead ✅
> - C) `.get()` raises an error, `[]` returns `None`
> - D) Both silently return an empty string
>
> *Explanation: `[]` treats a missing key as an error; `.get()` treats it
> as a normal case with a safe default.*

> **Q2.** What does `.items()` return on each loop iteration?
> - A) Just the key
> - B) Just the value
> - C) A `(key, value)` tuple, which is why it can be unpacked as `for key, value in ...` ✅
> - D) A new dict
>
> *Explanation: `.items()` yields tuple pairs — the same unpacking
> mechanism from Concept 2 applies here automatically.*

> **Q3.** In `tally[msg] = tally.get(msg, 0) + 1`, why is the `0` fallback
> necessary?
> - A) It isn't — `tally[msg]` alone would work the same
> - B) Without it, the first occurrence of a new key would raise `KeyError` before it could be incremented ✅
> - C) It sets every count to start at 0 permanently
> - D) It's only needed for string keys
>
> *Explanation: on a key's first appearance it isn't in the dict yet —
> `tally[msg] + 1` would raise `KeyError`, but `.get(msg, 0) + 1` safely
> falls back to `0` first.*

---

## Applied sandbox exercise 3

*(the tally pattern, standalone)*

*Starter code shown to learner:*
```python
def count_votes(votes):
    """
    votes: a list of strings, e.g. ["cat", "dog", "cat", "cat", "dog"]
    Return a dict counting how many times each value appears.
    E.g. ["cat", "dog", "cat"] -> {"cat": 2, "dog": 1}
    """
    # TODO: implement using the tally pattern
    pass
```

*Task shown to learner:* Build a dict from scratch, incrementing a count
for each vote as you loop through the list.

*Hidden test cases:*
```python
assert count_votes(["cat", "dog", "cat", "cat", "dog"]) == {"cat": 3, "dog": 2}
assert count_votes([]) == {}
assert count_votes(["a"]) == {"a": 1}
```

*Hint (shown on request):* Start with an empty dict `{}`. For each vote,
use `.get(vote, 0) + 1` to safely increment its count, whether or not it's
been seen before.

*Correct answer + explanation (shown on failure, if requested):*
```python
def count_votes(votes):
    tally = {}
    for vote in votes:
        tally[vote] = tally.get(vote, 0) + 1
    return tally
```

---

*(End of Concept 3. This lesson continues with Concept 4 — sets — drafted
separately.)*
