# Module 2, Lesson 10 — Concept 1: Prompt chaining and routing

---

## Chaining: naming a pattern already built

[Lesson 2's `run_workflow`](→ this module, prompting fundamentals lesson) — `summarize` always before `translate` — is **prompt chaining**: a fixed sequence where each step's output feeds the next. Nothing new mechanically; this concept just gives it a name worth recognizing as a deliberate pattern, not an ad hoc example.

---

## Routing: classify, then dispatch to a fixed path

**Routing** adds a classification step choosing between *fixed*
downstream paths:

```python
def handle_billing(request: str) -> str:
    return f"Routed to billing: {request}"

def handle_technical(request: str) -> str:
    return f"Routed to technical support: {request}"

ROUTES = {"billing": handle_billing, "technical": handle_technical}

def run_router(request: str, category: str) -> str:
    handler = ROUTES[category]
    return handler(request)

print(run_router("My invoice is wrong", category="billing"))
```
```
Routed to billing: My invoice is wrong
```
*(runs live, shows output — read-only demo snippet, not graded)*

`ROUTES[category]` — [the exact dispatch-dict mechanism from Lesson 4's `TOOL_REGISTRY`](→ this module, writing the loop by hand lesson, handling multiple tools a dispatch mechanism concept) — dispatches to a handler based on a classification. `category` would typically come from an LLM call classifying the request; the *paths themselves* (`handle_billing`, `handle_technical`) are fixed in code, never freely chosen the way [an agent picks its own next tool](→ this module, agents workflows and the loop lesson, agent vs workflow vs chatbot concept). This is exactly the workflow side of that earlier distinction: an LLM call happens, but the *sequence of possible outcomes* was decided when the code was written, not at runtime.

---

## Quiz cards

> **Q1.** What does prompt chaining actually name?
> - A) A brand-new mechanism not covered elsewhere in this course
> - B) A fixed sequence where each step's output feeds the next — exactly what Lesson 2's `run_workflow` already was ✅
> - C) A technique only usable with exactly two steps
> - D) The agent's own dynamic tool selection

> **Q2.** Why is routing still structurally a workflow, not an agent,
> even though it uses an LLM call to classify?
> - A) It isn't — routing is actually a form of agent behavior
> - B) The set of possible downstream paths is fixed in code; only which *one* fixed path gets chosen is decided at runtime, unlike an agent's open-ended tool selection ✅
> - C) Routing never actually involves an LLM call
> - D) `ROUTES` is rebuilt fresh on every single request

> **Q3.** What mechanism does `ROUTES[category]` directly reuse from
> earlier in this module?
> - A) The exponential backoff pattern from Lesson 6
> - B) The dispatch-dict pattern from Lesson 4's `TOOL_REGISTRY` ✅
> - C) The replanning logic from Lesson 8
> - D) Nothing — this is a genuinely new mechanism

---

*(End of Concept 1. This lesson continues with Concept 2 —
parallelization — drafted separately.)*
