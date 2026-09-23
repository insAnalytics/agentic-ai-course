# Module 3, Lesson 3 — Concept 3: Structured results and useful error messages

---

## Two more ways a result can be the wrong shape

[Concept 2](→ this lesson, truncation and pagination concept) dealt with a result being too *big*. This concept covers two quieter problems: a result that's the right size but awkward for the model to actually *use*, and an error message that technically reports a failure but gives the model nothing to act on.

---

## Prose results make the model re-extract what you already had

```python
def get_agent_config_prose(agent_name: str, registry: dict) -> str:
    info = registry[agent_name]
    return (
        f"The agent called {agent_name} is currently configured to run on "
        f"{info['model']}, and it was originally set up on {info['created']}. "
        f"Its current status is {info['status']}."
    )

registry = {
    "research_agent": {"model": "claude-sonnet", "created": "2026-03-14", "status": "active"},
}
print(get_agent_config_prose("research_agent", registry))
```
```
The agent called research_agent is currently configured to run on claude-sonnet, and it was originally set up on 2026-03-14. Its current status is active.
```
*(runs live, shows output — read-only demo snippet, not graded)*

The tool *had* clean, separate fields — `model`, `created`, `status` —
and then deliberately blended them into a sentence. If the model's next
step needs just the `model` value (to pass into another tool call, say),
it now has to pull it back out of the prose itself. Usually that works;
but it's an unnecessary, avoidable extraction step, and one more place
for a subtle misreading to creep in.

---

## The fix: return structured data, as JSON text

A `tool_result`'s content is text — [the same message format covered in Module 2's loop](→ Module 2, writing the loop by hand lesson, from round trip to loop the minimal viable transformation concept) — so "structured" here means structured *text*: JSON, produced with [`json.dumps`, from Module 0](→ Module 0, the I/O and error handling lesson, working with json concept).

```python
import json

def get_agent_config(agent_name: str, registry: dict) -> str:
    info = registry[agent_name]
    return json.dumps({"agent_name": agent_name, **info})

print(get_agent_config("research_agent", registry))
```
```
{"agent_name": "research_agent", "model": "claude-sonnet", "created": "2026-03-14", "status": "active"}
```
*(runs live, shows output — read-only demo snippet, not graded)*

Every field is labeled and separated — the model reads `"model":
"claude-sonnet"` directly, with no sentence to parse around it.
`{"agent_name": agent_name, **info}` is one new piece of syntax. [Module 0's `**kwargs` coverage](→ Module 0, the functions lesson, args and kwargs concept) used `**` to spread a dict out into keyword arguments at a *call site*; the same `**` also works inside a dict literal, spreading one dict's key-value pairs into a new dict:

```python
info = {"model": "claude-sonnet", "status": "active"}
merged = {"agent_name": "research_agent", **info}
print(merged)
```
```
{'agent_name': 'research_agent', 'model': 'claude-sonnet', 'status': 'active'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

Same idea as the call-site version — "spread this dict's contents out here" — just in a new place. It's the Python equivalent of JavaScript's object spread, `{agentName, ...info}`.

**When prose is actually fine:** a result the model will mostly just
*relay* to a user — a short summary, a confirmation message — doesn't
need JSON. Structure earns its place when the model needs to *act on*
specific fields, not just read them out.

---

## Useful error messages: say what failed, and what to do next

[Lesson 2](→ this module, tool schemas and argument validation lesson, validate and return failures as observations concept) established *that* failures should come back as observations. This is about the *quality* of that observation. Compare two ways of reporting the same failure:

```python
def get_agent_config_bad_error(agent_name: str, registry: dict) -> str:
    if agent_name not in registry:
        return "Error: failed"
    return json.dumps({"agent_name": agent_name, **registry[agent_name]})

def get_agent_config_good_error(agent_name: str, registry: dict) -> str:
    if agent_name not in registry:
        available = list(registry.keys())[:5]
        return (
            f"Error: no agent named '{agent_name}'. "
            f"Available agents include: {', '.join(available)}. "
            f"Agent names are case-sensitive."
        )
    return json.dumps({"agent_name": agent_name, **registry[agent_name]})

registry["support_agent"] = {"model": "claude-haiku", "created": "2026-05-02", "status": "active"}

print(get_agent_config_bad_error("Research_Agent", registry))
print(get_agent_config_good_error("Research_Agent", registry))
```
```
Error: failed
Error: no agent named 'Research_Agent'. Available agents include: research_agent, support_agent. Agent names are case-sensitive.
```
*(runs live, shows output — read-only demo snippet, not graded)*

`"Error: failed"` tells the model *that* something went wrong and
nothing else — its most likely next move is to retry the exact same
call, which [Module 2's repeated-action detection](→ Module 2, termination failure and control lesson, repeated action detection concept) would then have to catch. The better message names what failed, shows real valid options, and points at the likely cause (casing) — giving the model an obvious, correct next call to make. `[:5]` caps the list of names, [the same result-size discipline from Concept 2](→ this lesson, truncation and pagination concept), applied to an error message: a helpful error for a 5,000-agent registry shouldn't itself become a 50,000-token result.

---

## Quiz cards

> **Q1.** Why is `get_agent_config_prose` a worse design than returning
> structured JSON, when the model needs the `model` field for a follow-up
> call?
> - A) Prose is always invalid as a tool result
> - B) The tool already had separate fields, then blended them into a sentence the model must parse back apart — an unnecessary extraction step with room for misreading ✅
> - C) JSON results cost fewer tokens in every case
> - D) The model can't read prose results at all

> **Q2.** Why is "structured" tool output produced as JSON *text*, rather
> than a Python dict passed directly?
> - A) Python dicts are always slower
> - B) A `tool_result`'s content is text, so structure has to be encoded into that text — JSON via `json.dumps` is the natural way ✅
> - C) The model can only read JSON, never plain text
> - D) There's no real reason — dicts work just as well

> **Q3.** When is a prose result genuinely fine?
> - A) Never — structured output is always required
> - B) When the model will mostly relay it to a user rather than act on specific fields within it ✅
> - C) Only for error messages
> - D) Only when the result is longer than 1,000 tokens

> **Q4.** Why is `"Error: failed"` a genuinely poor error message, not
> just a terse one?
> - A) It doesn't follow Python's exception format
> - B) It gives the model no information about what went wrong or what to try instead, making a blind retry of the same failing call its most likely next move ✅
> - C) Error messages are never actually read by the model
> - D) It's too long

> **Q5.** Why does the good error message cap its list of available
> names with `[:5]`?
> - A) Python lists can't hold more than five items in a string
> - B) The same result-size discipline from truncation applies to error messages — a helpful error shouldn't itself become an enormous result ✅
> - C) The model can only process five options at once
> - D) It's purely cosmetic

---

## Applied sandbox exercise 2

*(structured results plus an actionable error — graded on the actual
returned strings)*

*Task shown to learner:* Implement `get_agent_status(agent_name:
str, registry: dict) -> str`. On success, return JSON text containing
exactly `agent_name` and `status`. On failure, return an error string
that starts with `"Error:"`, names the agent that wasn't found, and
lists up to 3 available agent names.

*Hidden test cases:*
```python
import json

registry = {
    "research_agent": {"model": "claude-sonnet", "created": "2026-03-14", "status": "active"},
    "support_agent": {"model": "claude-haiku", "created": "2026-05-02", "status": "paused"},
    "billing_agent": {"model": "claude-haiku", "created": "2026-06-10", "status": "active"},
    "legacy_agent": {"model": "claude-haiku", "created": "2025-11-01", "status": "retired"},
}

# success: genuinely structured, parseable, only the requested fields
parsed = json.loads(get_agent_status("support_agent", registry))
assert parsed == {"agent_name": "support_agent", "status": "paused"}

# failure: actionable, names the missing agent, bounded list of options
error = get_agent_status("ghost_agent", registry)
assert error.startswith("Error:")
assert "ghost_agent" in error
assert "research_agent" in error
assert "legacy_agent" not in error   # only the first 3 names, not all 4
```

*Hint (shown on request):* For success, build a new dict with just the
two requested keys and pass it to `json.dumps` — don't dump the whole
`info` dict, since the test checks for exactly two fields. For failure,
`list(registry.keys())[:3]` gives a bounded list, joined with `", "`.

*Correct answer + explanation (shown on failure, if requested):*
```python
import json

def get_agent_status(agent_name: str, registry: dict) -> str:
    if agent_name not in registry:
        available = list(registry.keys())[:3]
        return (
            f"Error: no agent named '{agent_name}'. "
            f"Available agents include: {', '.join(available)}."
        )
    return json.dumps({"agent_name": agent_name, "status": registry[agent_name]["status"]})
```
The success path returns genuinely parseable JSON with only the fields
asked for — `json.loads` in the test proves it's real structure, not
prose that happens to contain the right words. The failure path gives
the model something concrete to act on, and the `legacy_agent`
assertion confirms the list is actually bounded, not just shortened by
coincidence of registry size.

---

*(End of Concept 3 — final concept of Lesson 3. Continues with
bookends — drafted separately.)*
