# Module 3, Lesson 3 — Concept 1: Why a huge tool result hurts

---

## A tool result is just more input tokens

```python
def list_all_agents(registry: dict) -> str:
    return "\n".join(f"{name}: {info}" for name, info in registry.items())

huge_registry = {f"agent_{i}": {"model": "claude-sonnet"} for i in range(5000)}
result = list_all_agents(huge_registry)
print(f"result length: {len(result)} characters, roughly {len(result) // 4} tokens")
```
```
result length: 210000 characters, roughly 52500 tokens
```
*(runs live, shows output — read-only demo snippet, not graded)*

A tool's result isn't special — it's [the exact same input-token accounting from Module 1](→ Module 1, calling llm apis and processing responses lesson, the response shape concept), consuming [the same shared context-window budget](→ Module 1, context windows and kv cache lesson, what a context window actually is and what happens past it concept) and costing [the same per-token rate](→ Module 1, quantization cost and operational concerns lesson) as anything else sent to the model. A single unbounded result here is over 50,000 tokens — a real, expensive, budget-consuming cost, for a question that very likely only needed a handful of those 5,000 entries.

---

## Quiz cards

> **Q1.** Why does a tool's result count against the context window the
> same way any other message does?
> - A) It doesn't — tool results are handled separately from the rest of the conversation
> - B) A tool result is ordinary input content, following the exact same token accounting as every other part of the conversation ✅
> - C) Only the first 100 characters of a tool result are ever counted
> - D) Tool results are compressed automatically before being sent

> **Q2.** In the demo, what's the real cost of returning all 5,000
> registry entries for a question that likely needed only a few?
> - A) No real cost — extra tokens are free
> - B) Roughly 52,500 tokens of real, billed input, consuming a large share of the shared context budget for information likely mostly unused ✅
> - C) The result is automatically truncated by the API
> - D) This only affects response speed, never cost

---

*(End of Concept 1. This lesson continues with Concept 2 — truncation
and pagination — drafted separately.)*
