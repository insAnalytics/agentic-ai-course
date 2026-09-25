# Module 4, Lesson 1 — Concept 1: What fills the window

> **Note for the site build:** this concept introduces a `count_tokens` helper that every lesson in this module relies on. Please add it to the fake client module (it's independent of the client classes, so nothing earlier changes):
> ```python
> import json
> import math
>
> def _plain(x):
>     # turn content-block objects into plain dicts, so everything can be written as JSON
>     if isinstance(x, (str, int, float, bool)) or x is None:
>         return x
>     if isinstance(x, dict):
>         return {key: _plain(value) for key, value in x.items()}
>     if isinstance(x, (list, tuple)):
>         return [_plain(value) for value in x]
>     return _plain(vars(x))
>
> def count_tokens(x) -> int:
>     """Approximate token count: about 4 characters per token. Deterministic, not a real tokenizer."""
>     if isinstance(x, str):
>         return math.ceil(len(x) / 4)
>     return math.ceil(len(json.dumps(_plain(x))) / 4)
> ```

---

## A request is more than the conversation

When people picture what a model "sees", they picture the conversation: the user's messages and the model's replies. For an agent, that's the smallest part of the story. Every request [the loop from Module 2](→ Module 2, react and reasoning in the loop lesson, the react pattern concept) sends is assembled from several pieces, and all of them occupy the same context window:

- **The system prompt.** The agent's standing instructions, [its identity and rules](→ Module 2, the system prompt as agent design lesson). Sent in full on every request.
- **The tool definitions.** Every tool's name, description and schema. Also sent in full on every request, because [the model API is stateless](→ Module 1, calling llm apis and processing responses lesson, multi turn conversations and why the client resends everything concept), and [Module 3 showed how large these get](→ Module 3, connecting an agent to mcp servers lesson, when there are too many tools concept) once several servers are connected.
- **The scratchpad.** [Everything the loop has accumulated](→ Module 2, agent state and the scratchpad lesson): the user's messages, each assistant turn with its text, `tool_use` and thinking blocks, and every `tool_result`. This is the part that grows.
- **Room for the reply.** The space reserved for the model's answer, set by `max_tokens`.

This lesson measures each of these, because the rest of the module is about managing them, and you can't manage what you haven't measured.

## Counting tokens

Everything in this module is measured in tokens, [the unit models actually read](→ Module 1, the tokenization lesson). A real count needs the model's own tokenizer, and different models' tokenizers give slightly different numbers for the same text. This course uses one simple helper instead, the same "about four characters per token" estimate [Module 3's result-size lesson](→ Module 3, shaping what tools return lesson, why a huge tool result hurts concept) used:

```python
import json
import math

def _plain(x):
    # turn content-block objects into plain dicts, so everything can be written as JSON
    if isinstance(x, (str, int, float, bool)) or x is None:
        return x
    if isinstance(x, dict):
        return {key: _plain(value) for key, value in x.items()}
    if isinstance(x, (list, tuple)):
        return [_plain(value) for value in x]
    return _plain(vars(x))

def count_tokens(x) -> int:
    """Approximate token count: about 4 characters per token. Deterministic, not a real tokenizer."""
    if isinstance(x, str):
        return math.ceil(len(x) / 4)
    return math.ceil(len(json.dumps(_plain(x))) / 4)
```
*(already loaded for every demo and exercise in this module)*

It's an approximation, deliberately. What it gives you is consistency: every budget number in this module comes from this one function, so the arithmetic always agrees with itself. `math.ceil` rounds up, so even a single character counts as one token. Anything that isn't a plain string, a tool definition, a content block, a whole list of messages, is counted by its JSON form, which is roughly how it's sent to a real API.

Here it is applied to the pieces of a real registry-agent request:

```python
SYSTEM_PROMPT = (
    "You are the registry assistant. You answer questions about registered agents "
    "and, when asked, change which model an agent runs on. Always check an agent "
    "exists before changing it. Never delete agents."
)

TOOLS = [
    {"name": "get_agent_model", "description": "Return the model one registered agent runs on, by its exact name.",
     "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string", "description": "Exact registered name."}}, "required": ["agent_name"]}},
    {"name": "list_agents", "description": "List every registered agent's name. Use before get_agent_model if unsure of a name.",
     "input_schema": {"type": "object", "properties": {}}},
    {"name": "set_agent_model", "description": "Switch a registered agent to a different model. Check it exists first.",
     "input_schema": {"type": "object", "properties": {"agent_name": {"type": "string"}, "model": {"type": "string", "enum": ["claude-opus", "claude-sonnet", "claude-haiku"]}}, "required": ["agent_name", "model"]}},
]

call = ToolUseBlock(name="list_agents", input={})
messages = [
    {"role": "user", "content": "Which of our agents are on claude-haiku?"},
    {"role": "assistant", "content": [TextBlock(text="Let me list them first."), call]},
    {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id,
                                  "content": "research_agent, support_agent, billing_agent, triage_agent"}]},
]

print("a short string:     ", count_tokens("Which of our agents are on claude-haiku?"))
print("the system prompt:  ", count_tokens(SYSTEM_PROMPT))
print("one tool definition:", count_tokens(TOOLS[2]))
print("all three tools:    ", count_tokens(TOOLS))
print("one tool_use block: ", count_tokens(call))
print("the scratchpad:     ", count_tokens(messages))
```
```
a short string:      10
the system prompt:   50
one tool definition: 82
all three tools:     195
one tool_use block:  20
the scratchpad:      101
```
*(runs live, shows output — read-only demo snippet, not graded; the fake client's classes are already defined)*

Even this small agent shows the pattern the next concept measures properly: three short tool definitions cost more than the whole conversation so far, and they're paid for again on every request.

## The reply comes out of the same window

The last piece is the one most often forgotten. [Module 1's context-window lesson](→ Module 1, context windows and kv cache lesson, max output length vs context window concept) made the point: the context window isn't a limit on the input with the output on top. It's one budget, shared. Whatever you reserve for the reply with `max_tokens` has to fit alongside everything you send:

```python
CONTEXT_WINDOW = 200_000

def fits(input_tokens: int, max_tokens: int, window: int = CONTEXT_WINDOW) -> bool:
    # the reply's reserved room comes out of the same window as the input
    return input_tokens + max_tokens <= window

for input_tokens, max_tokens in [(150_000, 8_000), (195_000, 8_000), (195_000, 4_000)]:
    verdict = "fits" if fits(input_tokens, max_tokens) else "too big"
    print(f"input {input_tokens:>7,} + reply room {max_tokens:>5,} = {input_tokens + max_tokens:>7,} -> {verdict}")
```
```
input 150,000 + reply room 8,000 = 158,000 -> fits
input 195,000 + reply room 8,000 = 203,000 -> too big
input 195,000 + reply room 4,000 = 199,000 -> fits
```
*(runs live, shows output — read-only demo snippet, not graded; 200,000 tokens is a common window size, used here as an example)*

The same input fits or doesn't depending on how much room is reserved for the reply. That's why "how much context do I have left?" always means *window minus input minus reply room*, never window minus input alone. And an agent is the worst case for this: its input grows every turn, while the reply room it needs stays about the same.

---

## Quiz cards

> **Q1.** Which parts of an agent's request are sent in full on every single request?
> - A) Only the newest user message
> - B) The system prompt, the tool definitions and the whole scratchpad ✅
> - C) Only the scratchpad; the system prompt is sent once
> - D) Only the tool definitions the model used last time
>
> *Explanation:* The model API is stateless, so every request carries everything. Only the scratchpad grows; the rest is a fixed cost paid every time.

> **Q2.** Why does this course use a simple `count_tokens` helper instead of a real tokenizer?
> - A) Real tokenizers can't count tool definitions
> - B) Token counts don't matter in practice
> - C) It's a deterministic approximation that keeps every budget number in the module consistent, without depending on any one model's tokenizer ✅
> - D) The helper is more accurate than any real tokenizer
>
> *Explanation:* Different models tokenize differently. One consistent approximation keeps the arithmetic comparable across lessons, and it's labeled as an approximation.

> **Q3.** A request has 196,000 input tokens and reserves 8,000 for the reply, in a 200,000-token window. What happens?
> - A) It fits, since the input alone is under 200,000
> - B) It fits, since the reply is usually shorter than reserved
> - C) It's too big: input plus reserved reply room is 204,000 ✅
> - D) The model silently drops the oldest messages
>
> *Explanation:* The reply's room comes out of the same window. Headroom is window minus input minus reply room.

> **Q4.** In the demo, three short tool definitions cost more tokens than the conversation so far. Why does that matter more than it looks?
> - A) Tool definitions are charged at a higher rate
> - B) The model reads tool definitions first
> - C) It doesn't matter, since tools are small
> - D) They're sent again on every request, so their cost repeats every turn of the loop ✅
>
> *Explanation:* A fixed cost paid once is minor. A fixed cost paid on every one of dozens of turns adds up, which is why Module 3 kept tool lists short.

---

*(End of Concept 1. This lesson continues with Concept 2 — measuring one request, part by part.)*
