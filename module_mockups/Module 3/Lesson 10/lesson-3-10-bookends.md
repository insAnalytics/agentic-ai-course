# The Tool Threat Model

## Intro

> **You'll be able to**
> - Explain prompt injection, and why indirect injection through tool results is the one that matters for agents
> - Explain why a model can't be relied on as a security boundary, and why mitigations lower the odds without setting a limit
> - Identify the lethal trifecta in an agent's toolset, and explain why cutting one leg is the structural fix
> - Reason about an agent's blast radius, and treat tool design as a security decision, not only a usability one

**Why it matters**

Every tool in this module gave an agent a new capability. This lesson is the other side of that: every capability an agent has is also a capability an attacker can try to borrow, using nothing but text the agent reads. That's not a rare edge case. Any agent that reads a web page, an email, a ticket or a document is exposed to it, which is nearly every useful agent.

The uncomfortable core of the lesson is that this can't be fully prevented at the model. A well-built agent assumes the model can be fooled and is built so that it stays safe anyway. That mindset, thinking about what a compromised agent could do and limiting it in advance, is what the whole next lesson turns into concrete technique.

---

## Recap & Practice

### Comprehensive quiz

*(spans all four concepts, mixed order)*

> **Q1.** What is indirect prompt injection?
> - A) The user typing an instruction to override the system prompt
> - B) Instruction-like text inside something a tool brought in, such as a page, email or ticket, written by someone other than the user ✅
> - C) An attack on the model's training data
> - D) A bug in the agent loop
>
> *Explanation:* Direct injection comes from the user. Indirect injection rides in on tool results, which is why every content-fetching tool is a way in.

> **Q2.** Why can't a system prompt reliably stop injection?
> - A) System prompts are ignored by tool results
> - B) The instruction and the rule against it reach the model as one sequence of tokens, and the roles that separate them are learned tendencies, not enforced boundaries ✅
> - C) System prompts are too short
> - D) It can, as long as it's detailed enough
>
> *Explanation:* Unlike a parameterized SQL query, nothing structurally separates data from instructions in the model's input.

> **Q3.** Why is a filter that blocks 95% of injections weak protection?
> - A) 95% is below the legal minimum
> - B) Filters make the agent too slow
> - C) An attacker can retry, and the chance one attempt gets through climbs toward certainty ✅
> - D) Filters only work on emails
>
> *Explanation:* Security is judged by the worst case. Against repeated attempts, "usually blocked" becomes "eventually through".

> **Q4.** What three capabilities make up the lethal trifecta?
> - A) A big model, many tools, a long context
> - B) Reading files, running code, browsing the web
> - C) Access to private data, exposure to untrusted content, and the ability to communicate externally ✅
> - D) Search, fetch, extraction
>
> *Explanation:* Combined in one agent, they let an attacker's text reach the model, pick up a secret, and send it out.

> **Q5.** An agent reads a private database and browses untrusted pages, but can only reply to its own user. Is it exposed to the trifecta?
> - A) Yes, two legs is enough
> - B) No: with no external-communication leg, an injected instruction has nowhere to send data ✅
> - C) Yes, browsing counts as external communication
> - D) Can't tell
>
> *Explanation:* All three legs are required. Cutting any one breaks the chain.

> **Q6.** Why can one tool count toward two legs of the trifecta?
> - A) It can't; each tool is exactly one leg
> - B) The legs are capabilities, not tools, so a tool like `read_email` can supply both private data and untrusted content ✅
> - C) Only broad tools count for two legs
> - D) Only if the tool is destructive
>
> *Explanation:* An audit counts capabilities present anywhere in the toolset, so a single tool can contribute to more than one leg.

> **Q7.** What is an agent's blast radius?
> - A) How many injection attempts it faces
> - B) The worst-case set of things a fully compromised agent could do, set by its tools and their reach ✅
> - C) The size of its context window
> - D) How many tools it has, exactly
>
> *Explanation:* It's the damage ceiling if every injection succeeded, which is what you can design around because it's fixed in code.

> **Q8.** The same "delete everything" instruction hits a read-only agent and an admin agent. Why does only one carry it out?
> - A) The admin agent uses a weaker model
> - B) The read-only agent detected the attack
> - C) The read-only agent has no destructive tool, so the instruction has nothing to act through ✅
> - D) The admin agent has a worse system prompt
>
> *Explanation:* An injected instruction can only reach for tools the agent actually has. Blast radius is set by the toolset.

---

### Comprehensive sandbox

*(applied — a pre-ship security review of an agent's toolset)*

**Task shown to learner:** A proposed inbox-triage toolset is up for review in `catalog.py`, which is read-only. Each tool declares which trifecta legs it provides (`reads_private_data`, `reads_untrusted_content`, `sends_externally`) and whether it's `destructive`. Complete `audit.py`:

- **`audit_toolset(toolset)`** returns:
  - `legs`: a dict with keys `private_data`, `untrusted_content`, `external_communication`, each mapping to the list of tool names that provide that leg, in `toolset` order.
  - `vulnerable_to_trifecta`: `True` only when all three legs have at least one tool.
  - `destructive_tools`: the names of the destructive tools.
- **`cut_external_leg(toolset)`** returns a new toolset with the tools that send externally removed, the structural fix from this lesson.

**Tab: `catalog.py`** (read-only)
```python
# a proposed toolset for an inbox-triage agent, up for security review -- read-only.
# each tool declares which trifecta legs it provides and whether it acts destructively.
TOOLSET = [
    {"name": "list_emails",   "reads_private_data": True,  "reads_untrusted_content": False, "sends_externally": False, "destructive": False},
    {"name": "read_email",    "reads_private_data": True,  "reads_untrusted_content": True,  "sends_externally": False, "destructive": False},
    {"name": "search_web",    "reads_private_data": False, "reads_untrusted_content": True,  "sends_externally": False, "destructive": False},
    {"name": "send_email",    "reads_private_data": False, "reads_untrusted_content": False, "sends_externally": True,  "destructive": False},
    {"name": "delete_email",  "reads_private_data": False, "reads_untrusted_content": False, "sends_externally": False, "destructive": True},
]
```

**Tab: `audit.py`** (starter, entry file)
```python
LEG_KEYS = {
    "private_data": "reads_private_data",
    "untrusted_content": "reads_untrusted_content",
    "external_communication": "sends_externally",
}

def audit_toolset(toolset: list) -> dict:
    # TODO: list the tools that provide each leg, flag the trifecta, and list destructive tools
    ...

def cut_external_leg(toolset: list) -> list:
    # TODO: return the toolset without the tools that send externally
    ...
```

**Hidden tests:**
```python
from catalog import TOOLSET
from audit import audit_toolset, cut_external_leg

# 1. the proposed toolset has all three legs, and names which tools form each
report = audit_toolset(TOOLSET)
assert report["vulnerable_to_trifecta"] is True
assert report["legs"]["private_data"] == ["list_emails", "read_email"]
assert report["legs"]["untrusted_content"] == ["read_email", "search_web"]
assert report["legs"]["external_communication"] == ["send_email"]
assert report["destructive_tools"] == ["delete_email"]

# 2. cutting the external leg clears the trifecta, while private and untrusted remain
safer = cut_external_leg(TOOLSET)
after = audit_toolset(safer)
assert after["vulnerable_to_trifecta"] is False
assert after["legs"]["external_communication"] == []
assert after["legs"]["private_data"] and after["legs"]["untrusted_content"]

# 3. destructive tools are still flagged after the cut (they're a separate concern from the trifecta)
assert after["destructive_tools"] == ["delete_email"]

# 4. a read-only research agent (trusted notes only) trips no legs and is not vulnerable
notes_agent = [
    {"name": "search_notes", "reads_private_data": True, "reads_untrusted_content": False, "sends_externally": False, "destructive": False},
    {"name": "get_note",     "reads_private_data": True, "reads_untrusted_content": False, "sends_externally": False, "destructive": False},
]
r = audit_toolset(notes_agent)
assert r["vulnerable_to_trifecta"] is False and r["legs"]["untrusted_content"] == [] and r["destructive_tools"] == []

# 5. one tool supplying two legs still counts toward both
combo = [
    {"name": "browse_and_post", "reads_private_data": False, "reads_untrusted_content": True, "sends_externally": True, "destructive": False},
    {"name": "read_crm",        "reads_private_data": True,  "reads_untrusted_content": False, "sends_externally": False, "destructive": False},
]
r = audit_toolset(combo)
assert r["vulnerable_to_trifecta"] is True
assert r["legs"]["untrusted_content"] == ["browse_and_post"] and r["legs"]["external_communication"] == ["browse_and_post"]
```

**Hint (shown on request):** For `legs`, a dict comprehension over `LEG_KEYS` pairs each leg name with `[t["name"] for t in toolset if t[key]]`. `vulnerable_to_trifecta` is `all(legs.values())`, since an empty list is falsy. `cut_external_leg` is a list comprehension keeping tools where `not t["sends_externally"]`.

**Reference solution:**
```python
LEG_KEYS = {"private_data": "reads_private_data",
    "untrusted_content": "reads_untrusted_content",
    "external_communication": "sends_externally",
}

def audit_toolset(toolset: list) -> dict:
    legs = {leg: [t["name"] for t in toolset if t[key]] for leg, key in LEG_KEYS.items()}
    vulnerable = all(legs.values())
    destructive = [t["name"] for t in toolset if t["destructive"]]
    return {"legs": legs, "vulnerable_to_trifecta": vulnerable, "destructive_tools": destructive}

def cut_external_leg(toolset: list) -> list:
    # the design fix from this lesson: remove the tools that form the external-communication leg
    return [t for t in toolset if not t["sends_externally"]]
```

**Explanation:** This is the whole lesson as a tool a team would actually run before shipping. The audit names *which* tools form each leg (test 1), not just whether the trifecta is present, so a reviewer knows what to change. Test 2 applies the structural fix: cut the external leg and the trifecta clears, while the agent keeps reading private and untrusted content, exactly the kind of tradeoff [the next lesson](→ this module, designing for least privilege lesson) makes deliberately. Test 3 is a reminder that destructive tools are a separate worry from the trifecta: `delete_email` sends nothing outward, but a compromised agent using it still does real damage, which is why the audit flags it on its own. Tests 4 and 5 cover the two ends: an agent exposed to no untrusted content is safe with broad tools, and one tool can supply two legs at once.
