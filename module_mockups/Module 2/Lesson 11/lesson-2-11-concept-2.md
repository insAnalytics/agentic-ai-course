# Module 2, Lesson 11 — Concept 2: Rebuilding the Lesson 4–6 agent in LangChain

> **Illustrative:** genuine LangChain API syntax, not executed live in
> this sandbox (no package/network access) — but the shape and
> terminology below are real, not a made-up stand-in.

---

## The same agent, in LangChain

```python
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain.tools import tool
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate

@tool
def check_agent_exists(name: str) -> bool:
    """Check whether an agent with this name already exists in the registry."""
    return name in registry

@tool
def create_agent_entry(name: str, model: str) -> str:
    """Create a new agent entry in the registry."""
    registry[name] = {"model": model}
    return f"created agent '{name}' with model '{model}'"

llm = ChatAnthropic(model="claude-sonnet-5")
tools = [check_agent_exists, create_agent_entry]

prompt = ChatPromptTemplate.from_messages([
    ("system", "Always check_agent_exists before create_agent_entry."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, max_iterations=10)

result = executor.invoke({"input": "Register research_agent with claude-sonnet."})
print(result["output"])
```
*(illustrative — real LangChain API shape, not executed here)*

---

## How this maps onto everything already built

- **`@tool`** replaces [Lesson 4's `TOOL_REGISTRY`](→ this module, writing the loop by hand lesson, handling multiple tools a dispatch mechanism concept) — it builds a schema from the function's type hints and *docstring* directly ([the same Pydantic-to-JSON-Schema idea from Module 1](→ Module 1, structured output and tool calling lesson, from a pydantic model to an enforceable schema concept)), so the docstring here isn't just documentation — it's load-bearing, part of what the model actually sees.
- **`"{agent_scratchpad}"`** is LangChain's *own* literal name for the accumulating state — [Lesson 7's scratchpad](→ this module, agent state and the scratchpad lesson, what the loop accumulates the scratchpad and why it has to exist concept), confirmed as real, standard terminology, not a name this course invented.
- **`create_tool_calling_agent`** builds the decision logic — [Lesson 4–5's dispatch and reasoning](→ this module, writing the loop by hand lesson) — separately from the loop itself.
- **`AgentExecutor`** *is* [Lesson 4's `while` loop](→ this module, writing the loop by hand lesson, from round trip to loop the minimal viable transformation concept), and `max_iterations=10` *is* [Lesson 6's `max_steps`](→ this module, termination failure and control lesson, max steps the first simplest fix concept) — same guard, now a constructor argument instead of a loop condition you wrote.
- **`executor.invoke(...)`** runs the whole loop to completion — the same role `run_agent_loop(...)` has played throughout this module.

---

## Quiz cards

> **Q1.** Why does a tool function's docstring matter in LangChain's
> `@tool` decorator, specifically?
> - A) It's purely for human readers; LangChain ignores it entirely
> - B) It becomes part of the tool's schema, directly shown to the model — genuinely load-bearing, the same way Pydantic field descriptions became part of an enforceable schema in Module 1 ✅
> - C) Docstrings are optional and never actually used by `@tool`
> - D) The docstring only matters if the function has no type hints

> **Q2.** What does LangChain's `"{agent_scratchpad}"` placeholder
> confirm about this course's own terminology?
> - A) Nothing — it's an unrelated, coincidental naming choice
> - B) "Scratchpad," as used since Lesson 7, is genuine, standard terminology in a real framework, not something invented for this course ✅
> - C) LangChain uses a completely different concept with a similar name
> - D) The scratchpad concept doesn't actually exist in real frameworks

> **Q3.** What does `AgentExecutor(agent=agent, tools=tools,
> max_iterations=10)` actually correspond to, from earlier in this
> module?
> - A) Nothing — `AgentExecutor` is an entirely new concept
> - B) The `while` loop from Lesson 4, with `max_iterations` as the exact same guard as Lesson 6's `max_steps` ✅
> - C) Only the tool dispatch mechanism, not the loop itself
> - D) The evaluator-optimizer pattern from Lesson 9

---

*(End of Concept 2. This lesson continues with Concept 3 — what control
was given up — drafted separately.)*
