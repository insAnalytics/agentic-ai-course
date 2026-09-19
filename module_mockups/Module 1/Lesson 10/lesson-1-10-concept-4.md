# Module 1, Lesson 10 — Concept 4: Tool calling — structured output applied to a specific use case

---

## The model doesn't call anything — it produces structured data

**Tool calling** is worth understanding as exactly one specific
application of [the same constrained-decoding mechanism from Concept 2](→ this lesson, constrained decoding the actual enforcement mechanism concept), not some separate, new capability where the model somehow executes code. A model never literally "calls a function" — it produces structured output, guaranteed to match a schema (typically a tool name plus a set of arguments), using the exact same token-masking mechanism as any other structured output. Your own code is what actually reads that structured output and decides whether and how to execute anything real.

---

## The full shape, concretely

```python
from pydantic import BaseModel

class GetWeatherArguments(BaseModel):
    location: str

def get_weather(location: str) -> str:
    # a real, callable Python function -- what your own code actually executes
    return f"It's sunny in {location}."

# an illustrative model response, requesting this specific tool call
tool_call_response = {
    "name": "get_weather",
    "arguments": {"location": "Paris"},
}

# your code parses the structured arguments, then decides to actually run it
args = GetWeatherArguments.model_validate(tool_call_response["arguments"])
result = get_weather(args.location)
print(result)
```
```
It's sunny in Paris.
```
*(the Pydantic parsing and function call genuinely run live; the
model's tool-call response itself is illustrative, not fetched live)*

`GetWeatherArguments` — [an ordinary Pydantic model, exactly like `AgentConfig` from the previous concept](→ this lesson, from a pydantic model to an enforceable schema concept) — defines what a valid `get_weather` call's arguments look like; that schema is what gets sent to the API so constrained decoding can guarantee the model's `"arguments"` output actually matches it. `get_weather` itself is a completely ordinary Python function, with no special relationship to the model at all — the model never touches it, never runs it, and has no way to execute anything on its own.

---

## Why this separation matters

This is worth being explicit about as a real design point, not just a
technical detail: the model's job is *deciding which tool to use and
what arguments to pass*, expressed reliably as structured data thanks
to constrained decoding. Actually *executing* that tool call is
entirely your code's decision and responsibility — nothing forces your
code to actually run whatever the model requested; a well-built system
can validate, log, rate-limit, or outright refuse a requested tool call
before ever executing anything real, exactly because the model's output
is just data your code chooses what to do with, not a command that
executes itself.

---

## Quiz cards

> **Q1.** Does a model literally execute code when it "calls a tool"?
> - A) Yes, the model directly runs the corresponding function itself
> - B) No — the model produces structured output describing which tool and what arguments; your own code is what actually decides to execute anything ✅
> - C) Tool calling doesn't actually involve any code execution at all, ever
> - D) Only reasoning models are capable of actually executing tools directly

> **Q2.** What mechanism guarantees a model's tool-call output actually
> matches the expected arguments schema?
> - A) Nothing guarantees this — it's purely a hope based on the prompt's wording
> - B) The exact same constrained-decoding mechanism covered earlier in this lesson, applied to the tool's specific arguments schema ✅
> - C) A completely separate, unrelated mechanism specific to tool calling
> - D) The model is specially retrained for every individual tool

> **Q3.** In the demo, what's the relationship between `get_weather` (the
> Python function) and the model itself?
> - A) The model directly calls `get_weather` when it decides to use the tool
> - B) None, directly — `get_weather` is an ordinary Python function your own code chooses to call, based on the model's structured output ✅
> - C) `get_weather` runs inside the model's own generation process
> - D) The model rewrites `get_weather`'s implementation dynamically

> **Q4.** Why does this separation between "the model requests a tool
> call" and "your code decides whether to execute it" matter as a real
> design point?
> - A) It doesn't matter — the two are functionally the same thing
> - B) It means your code retains full control to validate, log, rate-limit, or refuse a requested tool call before anything real actually happens ✅
> - C) This separation only exists for tools that don't modify any data
> - D) Models are always trusted to execute their own requested tool calls automatically

---

*(End of Concept 4. This lesson continues with Concept 5 — the full
round trip — drafted separately.)*
