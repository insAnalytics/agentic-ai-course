# Module 3, Lesson 10 — Concept 4: Thinking in terms of the blast radius

---

## The question that has good answers

[Concept 2](→ this lesson, why the model cant be the security boundary concept) landed on a change of question. Since injection can't be reliably prevented, stop asking "how do I keep the model from being fooled?" and start asking "if it's fooled, how bad is it?" That second question has a name worth using: an agent's **blast radius** is the full set of things a fully compromised agent could do, the worst case if every injected instruction succeeded.

Blast radius depends on exactly two things, and neither is the model:

- **The tools the agent has.** An injected instruction can only ask for actions the agent has tools for. No `delete_agent` tool, no deletion, no matter how the instruction is phrased.
- **The reach of each tool.** A tool that reads one record by ID is a smaller radius than one that runs arbitrary SQL. A tool that emails your own team is a smaller radius than one that emails anyone.

Both are ordinary code you write and control, which is the whole appeal: they hold whatever the model is talked into trying.

## The same attack, two agents

Here's one injected instruction, "delete every agent in the registry", meeting two agents that differ only in their tools:

```python
# the same injected instruction, "delete every agent in the registry", meets two agents
# with different blast radii. Only the tools differ.

def read_only_agent_tools():
    return {"get_agent_model", "list_agents"}

def admin_agent_tools():
    return {"get_agent_model", "list_agents", "set_agent_model", "delete_agent"}

INJECTED_INTENT = "delete_agent"   # what the attacker's text tries to make the agent do

for name, tools in [("read-only agent", read_only_agent_tools()), ("admin agent", admin_agent_tools())]:
    reachable = INJECTED_INTENT in tools
    print(f"{name}: injected 'delete every agent' -> {'CARRIED OUT: registry wiped' if reachable else 'no such tool; nothing happens'}")
```
```
read-only agent: injected 'delete every agent' -> no such tool; nothing happens
admin agent: injected 'delete every agent' -> CARRIED OUT: registry wiped
```
*(runs live, shows output — read-only demo snippet, not graded)*

Same model, same attacker, same words. The read-only agent can be fooled into *wanting* to delete everything, and it has no tool to do it, so the attack ends there. The admin agent carries it out. The difference is entirely in the toolset, decided before the agent ever ran.

This reframes tool design as a security decision, not just a usability one. [Lesson 1's narrow-versus-broad choice](→ this module, designing tools a model can use well lesson, granularity narrow vs broad tools concept) was about a model choosing correctly; it's *also* about blast radius. `run_sql(query)` isn't just harder for the model to use well than `get_agent_model(name)`, it's a vastly larger blast radius: one injected instruction through `run_sql` can read or wreck the whole database, where `get_agent_model` can read one model name.

## Match the radius to the trust

The goal isn't the smallest possible blast radius, which would be an agent that can do nothing. It's a radius matched to how much untrusted content the agent is exposed to and how sensitive its reach is:

- An agent that only ever reads *your own* trusted notes and answers questions can hold broad tools safely: there's no untrusted-content leg for an attacker to use.
- An agent that reads public web pages, or a shared inbox, or customer tickets, is exposed to strangers constantly, so its tools should be as narrow as the job allows, and anything destructive or outbound should be gated.

Everything in [the next lesson](→ this module, designing for least privilege lesson) is techniques for shrinking blast radius deliberately: narrow tools over broad ones, separate read and write tools, approval gates before destructive or outbound actions, allowlists, and per-tool credentials. This concept is the mindset they serve. Before adding a tool to an agent, the question to ask is not only "does this help the agent do its job?" but "if a stranger's text got the agent to use this tool in the worst way, what happens?"

---

## Quiz cards

> **Q1.** What is an agent's "blast radius"?
> - A) How many tokens it uses per task
> - B) The full set of things a fully compromised agent could do, its worst case ✅
> - C) How many tools it has
> - D) How often it's targeted by injection
>
> *Explanation:* It's the worst-case damage if every injected instruction succeeded, which is what you can actually design around.

> **Q2.** What determines an agent's blast radius?
> - A) The model's size and training
> - B) The quality of its system prompt
> - C) The tools it has and the reach of each one ✅
> - D) How many injection filters are in place
>
> *Explanation:* Both are code you control, so they bound the damage regardless of what the model is persuaded to try. The model itself isn't part of it.

> **Q3.** The same "delete everything" instruction hits a read-only agent and an admin agent. Why does only the admin agent carry it out?
> - A) The admin agent uses a weaker model
> - B) The read-only agent has no tool that can delete, so the instruction has nothing to act through ✅
> - C) The read-only agent detected the injection
> - D) The admin agent has a worse system prompt
>
> *Explanation:* An injected instruction can only reach for tools the agent actually has. The read-only agent's toolset simply contains no path to deletion.

> **Q4.** How does blast radius reframe Lesson 1's narrow-versus-broad tool choice?
> - A) It doesn't; that was purely about usability
> - B) A broad tool like `run_sql` isn't only harder for the model to use well, it's also a far larger blast radius when injection strikes ✅
> - C) It means broad tools should always be preferred
> - D) It means narrow tools are only about performance
>
> *Explanation:* The same choice serves both goals: narrow tools are easier to use correctly and give an attacker less to work with.

> **Q5.** Should every agent be given the smallest possible blast radius?
> - A) Yes, always minimize it regardless of the task
> - B) No: match the radius to how much untrusted content the agent sees and how sensitive its reach is ✅
> - C) No: blast radius doesn't matter if the model is good
> - D) Yes, which in practice means agents should have no tools
>
> *Explanation:* An agent exposed only to trusted content can safely hold broad tools; one exposed to strangers should be kept narrow. The smallest radius does nothing, which isn't the goal.

---

*(End of Concept 4 — final concept of Lesson 10. The lesson continues with the recap and comprehensive sandbox.)*
