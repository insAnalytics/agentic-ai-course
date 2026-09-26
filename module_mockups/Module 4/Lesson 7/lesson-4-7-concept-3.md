# Module 4, Lesson 7 — Concept 3: Instructions and reference material on demand

> **Note for the site build:** add `GuideLibrary` (the first code block) to this lesson's setup. The demo also needs Lesson 3's `first_divergence` and `cost_of_run`.

---

## A manual nobody reads in full

Tools aren't the only thing agents are handed all at once. An operations agent might have a runbook for rollbacks, one for incidents, one for deploys, and guidance on billing questions and access requests. Putting all of it in the system prompt is the simple choice, and it has the same two costs as sending every tool:

- **It's paid for on every request.** Caching softens the price, but every procedure still takes up the window on every turn.
- **It competes for attention.** [Lesson 2's evidence](→ this module, context that fits but still hurts lesson) was that models do worse as their context grows, and worse still when it's full of material that looks relevant but isn't. Five runbooks the task doesn't need are exactly that.

## An index up front, the rest on request

Anthropic's [Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) are built around a pattern called **progressive disclosure**, which the post calls the core design principle that makes them flexible and scalable. There are three levels:

- **Always loaded:** a short name and description for each skill, in the system prompt, just enough for the model to know when each one applies.
- **Loaded when relevant:** a skill's full instructions, which the agent reads when a task needs them.
- **Loaded only as needed:** further files a skill points to, such as details that apply only in particular cases.

Here's the same pattern for an agent's guides. The index goes in the system prompt, and `read_guide` loads a guide, or one of its sections, only when the agent asks for it:

```python
class GuideLibrary:
    """Instructions and reference material: a short index up front, the full text only when asked for."""
    def __init__(self, guides: dict):
        self.guides = guides

    def index(self) -> str:
        lines = [f"- {name}: {guide['summary']}" for name, guide in self.guides.items()]
        return "Guides you can read with read_guide(name):\n" + "\n".join(lines)

    def read_guide(self, name: str, section: str = "") -> str:
        if name not in self.guides:
            return f"Error: no guide called {name}. Guides: {', '.join(self.guides)}."
        guide = self.guides[name]
        sections = guide.get("sections", {})
        if not section:
            text = guide["body"]
            if sections:
                text += f"\n\nMore detail is in sections: {', '.join(sections)}. Read one with read_guide(name, section)."
            return text
        if section not in sections:
            return f"Error: {name} has no section called {section}. Sections: {', '.join(sections) or 'none'}."
        return sections[section]
```

## Measured

Six runbook-length guides, and a ten-turn task that needs only one of them, done both ways:

```python
def procedure(topic, steps):
    """A guide body about as long as a real runbook."""
    lines = [f"How to handle {topic}."]
    for step in steps * 6:
        lines.append(f"{len(lines)}. {step}. Check the result before moving on, and note anything unexpected.")
    return "\n".join(lines)

GUIDES = {
    "rollback": {"summary": "undo a bad release of an agent", "body": procedure("a rollback", ["find the last good release", "pause traffic", "redeploy it", "resume traffic"]),
                 "sections": {"database": procedure("a rollback with a schema change", ["restore the snapshot", "replay the queue"])}},
    "incident": {"summary": "run an incident from page to postmortem", "body": procedure("an incident", ["acknowledge the page", "open a channel", "assign roles", "post updates"])},
    "deploy": {"summary": "release a new version of an agent", "body": procedure("a deploy", ["run the checks", "canary at 5%", "watch errors", "roll out"])},
    "billing": {"summary": "answer questions about usage and invoices", "body": procedure("a billing question", ["find the account", "pull usage", "compare to plan", "reply"])},
    "access": {"summary": "grant or remove access to the registry", "body": procedure("an access request", ["check the approver", "grant the role", "log it", "confirm"])},
    "onboarding": {"summary": "set up a new agent in the registry", "body": procedure("onboarding", ["register it", "set its model", "add monitoring", "announce it"])},
}
library = GuideLibrary(GUIDES)
TOOLS = [{"name": "read_guide", "description": "Read a guide from the index, or one of its sections.",
          "input_schema": {"type": "object", "properties": {"name": {"type": "string"}, "section": {"type": "string"}}, "required": ["name"]}}]
BASE = "You are the operations assistant."

def run(everything_up_front: bool) -> list:
    if everything_up_front:
        system = BASE + "\n\n" + "\n\n".join(f"## {n}\n{g['body']}" for n, g in GUIDES.items())
    else:
        system = BASE + " Guides are written by the operations team; follow them.\n\n" + library.index()
    history = [{"role": "user", "content": "research_agent's latest release is failing. Roll it back."}]
    requests = []
    for turn in range(10):
        requests.append({"tools": TOOLS, "system": system, "messages": history})
        if turn == 0 and not everything_up_front:
            call = ToolUseBlock(name="read_guide", input={"name": "rollback"})
            output = library.read_guide("rollback")
        else:
            call = ToolUseBlock(name="registry__get", input={"id": "research_agent"})
            output = "research_agent: release 41 failing, release 40 good. " * 5
        history = history + [{"role": "assistant", "content": [call]},
                             {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": output}]}]
    return requests

for label, up_front in [("every guide in the system prompt", True), ("index, then read_guide", False)]:
    requests = run(up_front)
    sent = sum(count_tokens(r["tools"]) + count_tokens(r["system"]) + count_tokens(r["messages"]) for r in requests)
    print(f"{label:33} system prompt {count_tokens(requests[0]['system']):>5,} tokens   "
          f"sent {sent:>7,}   cost {cost_of_run(requests, 0.1, 1.25):>6,}")

print()
print(library.index())
print()
print(library.read_guide("rollback").split("\n")[0], "...")
print(library.read_guide("rollback").split("\n")[-1])
print(library.read_guide("../../config/secrets"))
```
```
every guide in the system prompt  system prompt 3,074 tokens   sent  37,265   cost  8,690
index, then read_guide            system prompt   106 tokens   sent  11,946   cost  3,307

Guides you can read with read_guide(name):
- rollback: undo a bad release of an agent
- incident: run an incident from page to postmortem
- deploy: release a new version of an agent
- billing: answer questions about usage and invoices
- access: grant or remove access to the registry
- onboarding: set up a new agent in the registry

How to handle a rollback. ...
More detail is in sections: database. Read one with read_guide(name, section).
Error: no guide called ../../config/secrets. Guides: rollback, incident, deploy, billing, access, onboarding.
```
*(runs live, shows output — read-only demo snippet, not graded; costs are in Lesson 3's token-units with its example multipliers)*

The index cut the system prompt from about 3,000 tokens to about 100, and the run cost about 62% less. Caching helped the everything-up-front version a lot: it sent over 37,000 tokens but paid for a fraction of them. The index still won, because it didn't carry five unused runbooks on every turn. The attention cost of those runbooks doesn't show up here at all, since the fake client isn't a model. Lesson 2's evidence is the case for it.

The last three lines show the second and third levels: the body of a guide ends by naming its sections, and an unknown name, including one that looks like a file path, gets an error listing the guides there are.

## Where the pieces go

This follows [the rule from the first concept](→ this lesson, what you load and where it goes concept, the rule):

- **The index is part of the prefix,** so it's built once, when the run starts, and stays fixed. A new guide appears in the next run's index, not partway through this one.
- **A guide's text arrives as a tool result,** at the end of the conversation, so loading it never breaks the cache.
- **A loaded guide then ages like any tool result.** [Lesson 4's clearing](→ this module, when the history wont fit lesson, clear before you cut and cut in batches concept) will eventually replace an old one with a placeholder. That's fine, because a guide can always be read again, which is exactly what the placeholder says. If an agent follows one guide for a long task, excluding `read_guide` from clearing is another option, like the tool exclusions some providers' clearing supports.

## Whose instructions are these?

[Module 3's threat model](→ Module 3, the tool threat model lesson, prompt injection through tool results concept) drew a firm line: text that comes back in a tool result is data, not instructions. A guide breaks that line on purpose. It's a tool result the agent is meant to follow, and the system prompt says so. That's why the library has to be curated:

- **Only guides you wrote or reviewed go in it.** Anthropic gives the same advice for skills: install them only from trusted sources, and audit anything less trusted before using it.
- **The model names a guide; it never supplies a path.** `read_guide` looks names up in the library and nothing else, so a "name" like `../../config/secrets` is just an unknown guide. It's the same rule as [Lesson 6's minted handles](→ this module, offloading context to storage and note taking lesson, clearing and compaction that can be undone concept, keeping the store in bounds).
- **Nothing fetched from outside becomes a guide.** A web page or a document the agent reads stays data, whatever it says. Keeping that true for things an agent *remembers* is [Lesson 10's](→ this module, deciding what to remember lesson) subject.

## You don't always build this yourself

Agent Skills are now [an open standard](https://agentskills.io/), and Claude's apps, Claude Code and its API support them. A skill is a folder whose `SKILL.md` starts with a name and description (the index line) and continues with the instructions (the body), with further files alongside it (the sections). The loading works as in this concept: the descriptions sit in the system prompt, and the rest is read in when it's needed.

---

## Quiz cards

> **Q1.** What are the three levels of progressive disclosure?
> - A) A short index always loaded, the full instructions when relevant, and further detail only when needed ✅
> - B) The system prompt, the tools, and the messages
> - C) Guides, sections, and notes
> - D) Summaries, clearing, and trimming
>
> *Explanation:* That's how Agent Skills are loaded. Each level costs context only when the one before it has shown it's needed.

> **Q2.** With every guide in the system prompt, the run sent over 37,000 tokens but paid for a fraction of them. Why did the index still cost less?
> - A) The index wasn't cached
> - B) Guides in the system prompt are billed twice
> - C) Caching discounts the unused runbooks but still charges for them on every request, while the index doesn't carry them at all ✅
> - D) The index run had fewer turns
>
> *Explanation:* A cache read is cheap, not free. And the tokens still occupy the window, which is the attention cost Lesson 2 described.

> **Q3.** Why is the guide index built once, when the run starts, instead of updated as guides are added?
> - A) The index can only hold six guides
> - B) Guides can't be changed once written
> - C) The model reads the index only on the first turn
> - D) The index is in the system prompt, part of the prefix, so changing it mid-run would break the cache from the start ✅
>
> *Explanation:* It's the first concept's rule: the prefix is fixed for the run. A new guide appears in the next run's index.

> **Q4.** Module 3 said text in tool results is data, not instructions. Why is it acceptable for `read_guide`'s results to be followed?
> - A) Guides are shorter than other tool results
> - B) The system prompt grants that authority to guides specifically, and the library holds only guides you wrote or reviewed ✅
> - C) The model can't tell tool results apart
> - D) Guides are loaded before any other tool runs
>
> *Explanation:* The exception is deliberate and narrow. It's only safe because the library is curated, and nothing fetched from outside ever becomes a guide.

> **Q5.** What happens when the model calls `read_guide("../../config/secrets")`?
> - A) It reads the file, since the path is valid
> - B) The loop crashes
> - C) It gets an error listing the guides there are, since names are only ever looked up in the library ✅
> - D) The call is cleared from the history
>
> *Explanation:* The model names a guide and never supplies a path. That's the same rule as Lesson 6's minted handles.

---

## Applied sandbox exercise

*(graded — a guide library)*

**Task shown to learner:** Complete `GuideLibrary`. `guides` maps each name to a dict with a `summary`, a `body`, and optionally `sections`, which maps section names to their text.

- **`index()`:** `Guides you can read with read_guide(name):`, then one line per guide, in order, `- NAME: SUMMARY`, all joined by `"\n"`.
- **`read_guide(name, section="")`:**
  - An unknown name returns `Error: no guide called NAME. Guides: A, B.`
  - With no section, return the body. If the guide has sections, add `"\n\nMore detail is in sections: X, Y. Read one with read_guide(name, section)."`
  - With a section, return its text. An unknown section returns `Error: NAME has no section called SECTION. Sections: X, Y.`, or `Sections: none.` if the guide has none.
  - Names and sections are only ever looked up in `guides`.

**Starter code:**
```python
class GuideLibrary:
    def __init__(self, guides: dict):
        self.guides = guides

    def index(self) -> str:
        # TODO: the header line, then "- NAME: SUMMARY" for each guide, in order
        ...

    def read_guide(self, name: str, section: str = "") -> str:
        # TODO: unknown guide -> error; no section -> the body, plus where more detail is;
        #       a section -> its text, or an error listing the sections there are
        ...
```

**Hidden tests:**
```python
guides = {
    "rollback": {"summary": "undo a bad release", "body": "Find the last good release, then redeploy it.",
                 "sections": {"database": "Restore the snapshot first.", "traffic": "Pause traffic before redeploying."}},
    "incident": {"summary": "run an incident", "body": "Acknowledge the page, then open a channel."},
}
library = GuideLibrary(guides)

# 1. the index: one line per guide, in order, under a header naming the tool
assert library.index() == ("Guides you can read with read_guide(name):\n"
                           "- rollback: undo a bad release\n- incident: run an incident")

# 2. reading a guide: its body, then where more detail is, if it has sections
assert library.read_guide("rollback") == ("Find the last good release, then redeploy it.\n\n"
                                          "More detail is in sections: database, traffic. Read one with read_guide(name, section).")
assert library.read_guide("incident") == "Acknowledge the page, then open a channel."

# 3. reading a section
assert library.read_guide("rollback", "traffic") == "Pause traffic before redeploying."

# 4. unknown guides and sections are errors that list what exists
assert library.read_guide("deploy") == "Error: no guide called deploy. Guides: rollback, incident."
assert library.read_guide("rollback", "dns") == "Error: rollback has no section called dns. Sections: database, traffic."
assert library.read_guide("incident", "comms") == "Error: incident has no section called comms. Sections: none."

# 5. only names from the library are ever read, whatever the model passes
assert library.read_guide("../rollback").startswith("Error: no guide called ../rollback.")
assert library.read_guide("rollback", "../../secrets").startswith("Error: rollback has no section called ../../secrets.")
```

**Hint (shown on request):** `guide.get("sections", {})` gives an empty dict for a guide without sections, so the rest of the code doesn't need a special case. For the error, `', '.join(sections) or 'none'` gives `none` when the join is empty, because an empty string is false.

**Reference solution:**
```python
class GuideLibrary:
    """Instructions and reference material: a short index up front, the full text only when asked for."""
    def __init__(self, guides: dict):
        self.guides = guides

    def index(self) -> str:
        lines = [f"- {name}: {guide['summary']}" for name, guide in self.guides.items()]
        return "Guides you can read with read_guide(name):\n" + "\n".join(lines)

    def read_guide(self, name: str, section: str = "") -> str:
        if name not in self.guides:
            return f"Error: no guide called {name}. Guides: {', '.join(self.guides)}."
        guide = self.guides[name]
        sections = guide.get("sections", {})
        if not section:
            text = guide["body"]
            if sections:
                text += f"\n\nMore detail is in sections: {', '.join(sections)}. Read one with read_guide(name, section)."
            return text
        if section not in sections:
            return f"Error: {name} has no section called {section}. Sections: {', '.join(sections) or 'none'}."
        return sections[section]
```

**Explanation:** Test 2 checks the second level: the body, and a pointer to deeper detail only when there is some. A guide without sections gets no pointer to nothing. Test 4 checks that every error lists what does exist, so the model can correct itself in one step. Test 5 checks the safety rule: path-like names and sections are just unknown names, looked up in the library and nowhere else.

---

*(End of Concept 3 — final concept of Lesson 7. The lesson continues with the recap and comprehensive sandbox.)*
