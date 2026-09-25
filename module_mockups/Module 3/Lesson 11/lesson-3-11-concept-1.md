# Module 3, Lesson 11 — Concept 1: Narrow tools shrink the blast radius

---

## The same choice, now for a different reason

[Lesson 1](→ this module, designing tools a model can use well lesson, granularity narrow vs broad tools concept) weighed narrow tools against broad ones as a usability question: a narrow tool like `get_agent_model(name)` is easier for a model to call correctly than a broad one like `run_query(sql)`. [Last lesson](→ this module, the tool threat model lesson, thinking in terms of the blast radius concept) added the second reason, and it's the one this lesson builds on. A broad tool is a bigger **blast radius**: more that a compromised agent can do through it.

This is the first and often most effective least-privilege technique, because it works at the point where capability enters the agent. A tool the agent doesn't have is a thing no injected instruction can make it do.

## The pain: one broad tool, asked the wrong way

Here's a registry that holds more than just models: it also has each agent's owner and monthly cost, which shouldn't leave the system. The agent has one broad tool, `run_query`:

```python
REGISTRY = {
    "research_agent": {"model": "claude-opus", "owner": "alice", "monthly_cost": 4200},
    "support_agent": {"model": "claude-haiku", "owner": "bob", "monthly_cost": 900},
}

# one broad tool: the agent can ask anything of the database
def run_query(sql: str) -> str:
    # a real tool runs the SQL; the point here is what the tool CAN be asked to return
    if "*" in sql or "monthly_cost" in sql:
        return str(REGISTRY)                     # the whole table: costs, owners, everything
    return "claude-opus"                          # a normal single-field answer

# the intended use, from a normal request
print("normal request -> ", run_query("SELECT model FROM agents WHERE name = 'research_agent'"))

# what an injected instruction can ask the very same tool for
print("injected request ->", run_query("SELECT * FROM agents"))
```
```
normal request ->  claude-opus
injected request -> {'research_agent': {'model': 'claude-opus', 'owner': 'alice', 'monthly_cost': 4200}, 'support_agent': {'model': 'claude-haiku', 'owner': 'bob', 'monthly_cost': 900}}
```
*(runs live, shows output — read-only demo snippet, not graded)*

The tool was added so the agent could look up a model. It can do that. It can also be asked for the entire table, costs and owners included, and the tool has no reason to refuse: returning whatever the query asks for is its whole job. An injected `SELECT *` turns the model-lookup tool into a data dump. The blast radius of `run_query` is "anything in the database".

## The fix: purpose-built tools

Replace the one broad tool with a few narrow ones, each returning exactly what a real task needs and nothing more:

```python
REGISTRY = {
    "research_agent": {"model": "claude-opus", "owner": "alice", "monthly_cost": 4200},
    "support_agent": {"model": "claude-haiku", "owner": "bob", "monthly_cost": 900},
}

# the same capability, as narrow purpose-built tools
def get_agent_model(agent_name: str) -> str:
    if agent_name not in REGISTRY:
        return f"Error: no agent named '{agent_name}'."
    return REGISTRY[agent_name]["model"]

def list_agent_names() -> str:
    return ", ".join(REGISTRY)

# the normal request still works
print("normal:", get_agent_model("research_agent"))

# there is simply no tool that returns costs or owners; the injected 'SELECT *' has nowhere to go
print("injected 'dump everything': no tool exposes monthly_cost or owner, so it can't be read")
```
```
normal: claude-opus
injected 'dump everything': no tool exposes monthly_cost or owner, so it can't be read
```
*(runs live, shows output — read-only demo snippet, not graded)*

`get_agent_model` returns one field of one agent. `list_agent_names` returns names. Neither can return a cost or an owner, because neither was written to, and there is no `run_query` any more. The sensitive columns aren't guarded by a rule the model has to follow: they're simply not reachable through any tool the agent has. That's the difference between a mitigation and a structural limit, [the distinction from the last lesson](→ this module, the tool threat model lesson, why the model cant be the security boundary concept).

The cost is real and worth naming: narrow tools are less flexible. A question nobody anticipated ("which owner has the highest total cost?") now has no single tool that answers it, where `run_query` could. That's the trade at the center of least privilege. You give up open-ended flexibility to gain a blast radius you can actually reason about, and for an agent exposed to untrusted content, that's almost always the right trade. An agent exposed only to trusted input can afford broader tools, exactly as [last lesson's "match the radius to the trust"](→ this module, the tool threat model lesson, thinking in terms of the blast radius concept) put it.

---

## Quiz cards

> **Q1.** Why is replacing `run_query(sql)` with `get_agent_model(name)` a security improvement, not just a usability one?
> - A) The narrow tool runs faster
> - B) The narrow tool can only return one agent's model, so a compromised agent can't use it to read the whole database ✅
> - C) The narrow tool validates SQL syntax
> - D) It isn't; both have the same blast radius
>
> *Explanation:* Blast radius is set by what a tool can do. `run_query` can return anything in the database; `get_agent_model` can return one field of one row.

> **Q2.** In the demo, why does the broad `run_query` tool return the whole table for `SELECT *`?
> - A) A bug in the tool
> - B) The model chose to leak data
> - C) Returning whatever the query asks for is the tool's entire purpose, so it has no reason to refuse ✅
> - D) The injection disabled the tool's checks
>
> *Explanation:* The tool is working exactly as written. Its broad design is the vulnerability, not any error in it.

> **Q3.** After the fix, why can't an injected "dump everything" instruction read agent costs?
> - A) The model refuses because the system prompt forbids it
> - B) A filter removes cost data from tool results
> - C) No tool the agent has returns cost data, so there's no path to it regardless of what the model is told to do ✅
> - D) The cost column is encrypted
>
> *Explanation:* It's a structural limit, not a rule the model must choose to follow. The capability simply isn't present.

> **Q4.** What is the real cost of narrow tools?
> - A) They're slower to run
> - B) They use more of the context window
> - C) Less flexibility: a question nobody built a tool for has no tool to answer it ✅
> - D) They can't be used by an agent at all
>
> *Explanation:* That's the least-privilege trade: give up open-ended flexibility for a blast radius you can reason about. It's the right trade when the agent sees untrusted content.

---

## Applied sandbox exercise

*(graded — replacing a broad tool with narrow ones)*

**Task shown to learner:** An agent has a `run_query(sql)` tool over a registry whose rows contain `model`, `owner` and `monthly_cost`. Only `model` and the list of names should ever be reachable. Replace the broad tool with two narrow ones, so cost and owner can't be read through any tool:

- **`get_agent_model(agent_name, registry)`:** return the agent's `model`, or an `"Error: ..."` string if there's no such agent.
- **`list_agent_names(registry)`:** return the agent names as a comma-separated string.

Neither may return, or accept a way to ask for, `owner` or `monthly_cost`.

**Starter code:**
```python
def get_agent_model(agent_name: str, registry: dict) -> str:
    # TODO: return only this agent's model, or an error if it doesn't exist
    ...

def list_agent_names(registry: dict) -> str:
    # TODO: return the agent names, comma-separated
    ...
```

**Hidden tests:**
```python
import inspect
REGISTRY = {
    "research_agent": {"model": "claude-opus", "owner": "alice", "monthly_cost": 4200},
    "support_agent": {"model": "claude-haiku", "owner": "bob", "monthly_cost": 900},
}

# 1. the narrow tools do their job
assert get_agent_model("research_agent", REGISTRY) == "claude-opus"
assert list_agent_names(REGISTRY) == "research_agent, support_agent"

# 2. a missing agent is a clean error, not a crash
assert get_agent_model("ghost", REGISTRY).startswith("Error:")

# 3. no tool returns owner or cost, for ANY input: the sensitive fields are unreachable
for agent in REGISTRY:
    assert "alice" not in get_agent_model(agent, REGISTRY) and "4200" not in get_agent_model(agent, REGISTRY)
assert "alice" not in list_agent_names(REGISTRY) and "900" not in list_agent_names(REGISTRY)

# 4. neither tool's signature offers a field/column parameter an injection could aim at owner or cost
assert set(inspect.signature(get_agent_model).parameters) == {"agent_name", "registry"}
assert set(inspect.signature(list_agent_names).parameters) == {"registry"}
```

**Hint (shown on request):** `get_agent_model` reads `registry[agent_name]["model"]` after checking the name exists; it never touches the other fields. `", ".join(registry)` gives the names.

**Reference solution:**
```python
def get_agent_model(agent_name: str, registry: dict) -> str:
    if agent_name not in registry:
        return f"Error: no agent named '{agent_name}'."
    return registry[agent_name]["model"]

def list_agent_names(registry: dict) -> str:
    return ", ".join(registry)
```

**Explanation:** The security property here is what the tools *don't* do. There's no parameter on either tool that could be steered toward `owner` or `monthly_cost`, so those fields are unreachable no matter what an injected instruction asks for. The test that matters is the one checking a "dump everything" style request can't retrieve a cost: it can't, because nothing in the toolset exposes it.

---

*(End of Concept 1. This lesson continues with Concept 2 — separate reads from writes, and gate the writes.)*
