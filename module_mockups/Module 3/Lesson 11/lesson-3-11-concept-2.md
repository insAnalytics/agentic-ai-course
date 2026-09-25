# Module 3, Lesson 11 — Concept 2: Separate reads from writes, and gate the writes

---

## Not all tools carry the same risk

[Narrow tools](→ this lesson, narrow tools shrink the blast radius concept) shrink what each tool can do. This concept shrinks *where the dangerous tools are exposed*. The key observation: reading and writing carry very different risk. A read tool that's tricked leaks information, which is bad; a write tool that's tricked changes or destroys it, which is often worse and can't always be undone.

Yet tools are frequently built to do both, an `update_agent` that reads the current config and writes a new one, a file tool that can read or overwrite. When one tool both reads and writes, every place the read is used also exposes the write. Splitting them lets each carry only the power it needs.

## The split

```python
REGISTRY = {"research_agent": "claude-opus", "support_agent": "claude-haiku"}

# read tools: safe to expose widely, since the worst they do is reveal a model name
def get_agent_model(agent_name: str) -> str:
    return REGISTRY.get(agent_name, f"(no agent named {agent_name})")

def list_agents() -> str:
    return ", ".join(REGISTRY)

# write tools: the same data, but now able to change it -- a separate, smaller surface
def set_agent_model(agent_name: str, model: str) -> str:
    REGISTRY[agent_name] = model
    return f"{agent_name} now runs on {model}"

def delete_agent(agent_name: str) -> str:
    REGISTRY.pop(agent_name, None)
    return f"deleted {agent_name}"

READ_TOOLS = {"get_agent_model": get_agent_model, "list_agents": list_agents}
WRITE_TOOLS = {"set_agent_model": set_agent_model, "delete_agent": delete_agent}

print("read tools (broad exposure ok):", list(READ_TOOLS))
print("write tools (the surface to guard):", list(WRITE_TOOLS))
```
```
read tools (broad exposure ok): ['get_agent_model', 'list_agents']
write tools (the surface to guard): ['set_agent_model', 'delete_agent']
```
*(runs live, shows output — read-only demo snippet, not graded)*

The read tools can be handed out freely: the worst an injection does through them is read a model name, which isn't sensitive here. The write tools are a separate, smaller set, and they're the ones to guard. An agent whose *job* is read-only, answering questions about the registry, can be given only the read tools and none of the write ones, and then no injection can change anything at all, because the capability isn't present. This is [narrow tools](→ this lesson, narrow tools shrink the blast radius concept) again, applied to the read/write line: the most useful cut you can make in most agents.

## Gating the writes that remain

Some agents genuinely need to write. For the destructive or outbound ones among those, the next protection is an **approval gate**: before the action runs, a human is asked to confirm it. The agent proposes; a person disposes.

```python
from fake import *

REGISTRY = {"research_agent": "claude-opus"}
DESTRUCTIVE = {"delete_agent"}
pending = {}   # tool calls waiting for a human decision, by tool_use_id

def delete_agent(agent_name: str) -> str:
    REGISTRY.pop(agent_name, None)
    return f"deleted {agent_name}"

TOOLS = {"delete_agent": delete_agent}

def run_step(response, approvals: dict) -> list:
    results = []
    for call in [b for b in response.content if b.type == "tool_use"]:
        if call.name in DESTRUCTIVE and not approvals.get(call.id):
            # don't run it; ask for a decision and record what's waiting
            pending[call.id] = (call.name, call.input)
            results.append({"type": "tool_result", "tool_use_id": call.id,
                            "content": f"Awaiting human approval to run {call.name}({call.input}).", "is_error": False})
        else:
            results.append({"type": "tool_result", "tool_use_id": call.id,
                            "content": TOOLS[call.name](**call.input)})
    return results

# the model asks to delete an agent
call = ToolUseBlock(name="delete_agent", input={"agent_name": "research_agent"})
resp = FakeResponse([call])

print("before approval:", run_step(resp, approvals={})[0]["content"])
print("registry unchanged:", REGISTRY)

# a human reviews `pending` and approves this specific call id
print("after approval: ", run_step(resp, approvals={call.id: True})[0]["content"])
print("registry now:   ", REGISTRY)
```
```
before approval: Awaiting human approval to run delete_agent({'agent_name': 'research_agent'}).
registry unchanged: {'research_agent': 'claude-opus'}
after approval:  deleted research_agent
registry now:    {}
```
*(runs live, shows output — read-only demo snippet, not graded)*

When the model calls a gated tool, the code doesn't run it. It records what's waiting and returns an observation saying so, [an error-as-observation exactly like the ones from Module 2](→ Module 2, termination failure and control lesson, tool errors as observations not exceptions concept). The action runs only once a human has approved that specific call. This is the same pause-and-resume shape as [Module 2's checkpointing](→ Module 2, agent state and the scratchpad lesson): the loop's state is held while control passes to a person, then continues.

Two design points make the gate real rather than decorative:

- **The gate is in your code, not the prompt.** "Ask before deleting" in a system prompt is a request the model can be talked out of. A gate that refuses to execute without an approval flag is a limit that holds no matter what the model was persuaded to do. This is the [structural-versus-mitigation line](→ this module, the tool threat model lesson, why the model cant be the security boundary concept) once more.
- **Approval is per call, not per tool.** Approving one `delete_agent` call must not stand in for the next one. The human is confirming *this deletion of this agent*, so approval is keyed to the specific call, so an injection can't get one innocuous deletion approved and reuse that blessing for a different one.

Gates cost something too: they put a human back in the loop, which is slower and doesn't scale to thousands of actions. So you gate the actions whose cost of being wrong is high, deletion, sending money, emailing outsiders, and let the cheap, reversible ones run freely. Deciding which is which is the design judgment [last lesson's blast-radius thinking](→ this module, the tool threat model lesson, thinking in terms of the blast radius concept) is meant to inform.

---

## Quiz cards

> **Q1.** Why split a tool that both reads and writes into separate read and write tools?
> - A) Two tools run faster than one
> - B) So each carries only the power it needs, and the widely-exposed read path doesn't also expose the write ✅
> - C) The model can't call a tool that does two things
> - D) Read and write tools use different schemas
>
> *Explanation:* When one tool does both, every use of the read exposes the write. Splitting lets a read-only agent hold no write power at all.

> **Q2.** In the approval-gate demo, what happens the first time the model calls the gated `delete_agent`?
> - A) It runs, and the deletion is logged for review
> - B) It's rejected permanently
> - C) It doesn't run; the code records the pending call and returns an observation that approval is needed ✅
> - D) The loop stops with an error
>
> *Explanation:* The gate holds the action and hands control to a human, the same pause-and-resume shape as checkpointing. Nothing is deleted until approval arrives.

> **Q3.** Why must the approval gate live in code rather than in the system prompt?
> - A) System prompts can't mention tools
> - B) A prompt instruction is a request the model can be talked out of; a code gate refuses to execute without approval no matter what the model was persuaded to do ✅
> - C) Code runs faster than prompt instructions
> - D) It doesn't matter where it lives
>
> *Explanation:* It's the structural-versus-mitigation distinction. Only the code gate is a real boundary.

> **Q4.** Why is approval keyed to the specific call rather than granted per tool?
> - A) To save memory
> - B) So that approving one deletion can't be reused to bless a different deletion an injection slips in ✅
> - C) Because tools can only be approved once ever
> - D) So the model can approve its own calls
>
> *Explanation:* The human is confirming one particular action. A per-tool blessing would let an attacker ride an earlier approval into a new, unwanted call.

> **Q5.** Why not put an approval gate on every tool?
> - A) Gates don't work on read tools
> - B) It would make the agent more secure than necessary
> - C) Gates put a human back in the loop, which is slow and doesn't scale, so they're reserved for high-cost actions ✅
> - D) The model would ignore them
>
> *Explanation:* Gating cheap, reversible reads would stall the agent for no benefit. You spend the human's attention where being wrong is expensive.

---

## Applied sandbox exercise

*(graded — an approval gate for destructive tools)*

**Task shown to learner:** Implement `execute_tool(call, tools, requires_approval, approvals)`, which runs one tool call through an approval gate. `approvals` maps a call's `id` to `True` when a human has approved that specific call.

- If `call.name` is in `requires_approval` and `approvals` doesn't have `True` for this call's `id`, **don't run it**: return a `tool_result` whose content says approval is awaited (naming the tool and its input), with `"needs_approval": True`.
- Otherwise run it: an unknown tool name is a normal error `tool_result`; a tool that raises is caught and returned as an error; success returns its output.

**Starter code:**
```python
def execute_tool(call, tools: dict, requires_approval: set, approvals: dict) -> dict:
    # TODO: hold gated calls that aren't approved; otherwise run the tool and return a tool_result
    ...
```

**Hidden tests:**
```python
class Call:
    def __init__(self, name, input, id): self.name, self.input, self.id = name, input, id

REGISTRY = {"research_agent": "claude-opus", "support_agent": "claude-haiku"}
def get_agent_model(agent_name): return REGISTRY.get(agent_name, "unknown")
def delete_agent(agent_name): REGISTRY.pop(agent_name, None); return f"deleted {agent_name}"
TOOLS = {"get_agent_model": get_agent_model, "delete_agent": delete_agent}
GATED = {"delete_agent"}

# 1. a read tool runs immediately, no approval involved
r = execute_tool(Call("get_agent_model", {"agent_name": "research_agent"}, "c1"), TOOLS, GATED, {})
assert r["content"] == "claude-opus" and not r.get("needs_approval")

# 2. a gated tool with no approval does NOT run, and says it's waiting
r = execute_tool(Call("delete_agent", {"agent_name": "research_agent"}, "c2"), TOOLS, GATED, {})
assert r["needs_approval"] is True and "research_agent" in REGISTRY

# 3. the same call, approved by its id, runs
r = execute_tool(Call("delete_agent", {"agent_name": "research_agent"}, "c2"), TOOLS, GATED, {"c2": True})
assert r["content"] == "deleted research_agent" and "research_agent" not in REGISTRY

# 4. approval is per call id: approving one id doesn't approve a different call
r = execute_tool(Call("delete_agent", {"agent_name": "support_agent"}, "c3"), TOOLS, GATED, {"c2": True})
assert r.get("needs_approval") is True and "support_agent" in REGISTRY

# 5. an approved but unknown tool is still a normal error, not a crash
r = execute_tool(Call("drop_table", {}, "c4"), TOOLS, GATED, {"c4": True})
assert r["is_error"] is True and "no tool" in r["content"]
```

**Hint (shown on request):** Check the gate first: `call.name in requires_approval and not approvals.get(call.id)` means hold it. Only after that do the normal run: `call.name not in tools` is an error, a `try/except` around `tools[call.name](**call.input)` catches a raising tool, and otherwise return the output.

**Reference solution:**
```python
def execute_tool(call, tools: dict, requires_approval: set, approvals: dict) -> dict:
    if call.name in requires_approval and not approvals.get(call.id):
        return {"type": "tool_result", "tool_use_id": call.id,
                "content": f"Awaiting approval to run {call.name}({call.input}).", "is_error": False,
                "needs_approval": True}
    if call.name not in tools:
        return {"type": "tool_result", "tool_use_id": call.id,
                "content": f"Error: there is no tool called {call.name}", "is_error": True}
    try:
        output = tools[call.name](**call.input)
    except Exception as e:
        return {"type": "tool_result", "tool_use_id": call.id, "content": f"Error: {e}", "is_error": True}
    return {"type": "tool_result", "tool_use_id": call.id, "content": output}
```

**Explanation:** The gate check comes *before* the tool is looked up or run, which is what makes it a real boundary: a held call never reaches the tool. Test 2 confirms the registry is unchanged while a deletion waits, and test 4 is the important one: an approval for call `c2` does nothing for call `c3`, so a blessing can't be reused. Test 5 shows the gate doesn't swallow ordinary error handling for the calls that do run.

---

*(End of Concept 2. This lesson continues with Concept 3 — allowlists and per-tool credentials.)*
