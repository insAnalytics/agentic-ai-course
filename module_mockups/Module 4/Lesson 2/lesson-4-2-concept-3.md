# Module 4, Lesson 2 — Concept 3: Instructions that pile up and contradict

---

## The pain: every instruction is still in context

Users change their minds, and long sessions give them plenty of time to. Here's the registry agent over one afternoon:

- Early on: *"Use claude-haiku for every new agent, to keep costs down."*
- An hour later: *"Leave billing_agent alone; finance owns it."*
- Later still: *"Actually, new research agents need claude-opus."*

All three messages are still in the scratchpad, word for word. The first and third disagree about research agents. A person reading the transcript knows the later one wins, and that it only overrides the first *for research agents*. The model has to work that out again on every single turn, from instructions scattered through a growing context. The first one is phrased as an absolute ("every new agent"), and by now it's buried in the middle, among tool results, [where models use information least reliably](→ this lesson, agents get worse before the window is full concept). Sometimes the model will reconcile them correctly. Sometimes it won't, and nothing about the scratchpad tells you which.

Instructions don't only come from users. [A system prompt](→ Module 2, the system prompt as agent design lesson) can say one thing while a later message says another, and a long task accumulates small working decisions ("use the staging registry for this") that later ones quietly contradict.

## Why code can't just detect the contradictions

The natural fix, scanning the conversation for conflicting instructions, doesn't work well in code. "Use haiku for every new agent" and "research agents need opus" share almost no words, and deciding that one partly overrides the other takes understanding, which is exactly the model's job, not a keyword matcher's.

So the fix is to let the model do the reconciling **once, when the instruction arrives**, and to record the result in a form code *can* manage.

## The fix: one current set of rules

Give the agent a tool, `set_rule(name, value)`, and tell it in the tool's description: *record the complete current rule, replacing any earlier value for this name.* When a new instruction arrives, the model reads the old rule, which is right in front of it at that moment, works out the combined result, and records that. Every rule then has a history, and the latest value is the whole truth:

```python
def rule_history(messages: list) -> dict:
    """Every value each rule has been set to, in order, from the agent's set_rule calls."""
    history = {}
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if block.type == "tool_use" and block.name == "set_rule":
                    history.setdefault(block.input["name"], []).append(block.input["value"])
    return history

def current_rules_block(messages: list) -> str:
    history = rule_history(messages)
    if not history:
        return ""
    lines = [f"- {name}: {values[-1]}" for name, values in history.items()]
    return "<current_rules>\n" + "\n".join(lines) + "\n</current_rules>"
```

`history.setdefault(name, [])` returns the list for `name`, creating an empty one first if it isn't there yet, so each value can be appended in one line.

```python
def set_rule(name, value):
    call = ToolUseBlock(name="set_rule", input={"name": name, "value": value})
    return [{"role": "assistant", "content": [call]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": f"rule '{name}' set"}]}]

# three instructions from the user, spread across a long session;
# each time, the agent recorded what it understood as a rule
messages = [{"role": "user", "content": "Use claude-haiku for every new agent, to keep costs down."}]
messages += set_rule("default_model", "claude-haiku for all new agents")
messages += [{"role": "user", "content": "Leave billing_agent alone; finance owns it."}]
messages += set_rule("billing_agent", "never modify")
messages += [{"role": "user", "content": "Actually, new research agents need claude-opus."}]
messages += set_rule("default_model", "claude-opus for research agents, claude-haiku for all others")

for name, values in rule_history(messages).items():
    marker = "  <- changed" if len(values) > 1 else ""
    print(f"{name}: {values}{marker}")
print()
print(current_rules_block(messages))
```
```
default_model: ['claude-haiku for all new agents', 'claude-opus for research agents, claude-haiku for all others']  <- changed
billing_agent: ['never modify']

<current_rules>
- default_model: claude-opus for research agents, claude-haiku for all others
- billing_agent: never modify
</current_rules>
```
*(runs live, shows output — read-only demo snippet, not graded; the `set_rule` calls stand in for what a model would record as each instruction arrived)*

Notice the second value of `default_model`. When "research agents need opus" arrived, the model didn't record just the new sentence; it recorded the reconciled rule, *opus for research agents, haiku for all others*. The contradiction was resolved at the one moment it was easy, with both instructions side by side, and from then on there's a single answer.

The `<current_rules>` block is what the model should rely on: one entry per rule, latest value only, in one place. The original messages can stay in the scratchpad, since [removing messages has its own rules](→ this module, when the history wont fit lesson), but they're no longer what the agent has to piece together every turn. [The next concept](→ this lesson, re anchoring the goal concept) puts this block where the model reliably sees it.

The rule history is useful in its own right. `changed_rules` below lists every rule that has changed, which is exactly the list a person would want to review when an agent's behavior shifts during a session.

---

## Quiz cards

> **Q1.** Why are contradictory instructions spread through the scratchpad a problem, even when the latest one is right there?
> - A) The API only reads the first instruction
> - B) The model has to reconcile them again every turn from scattered text, and may not do it the same way each time ✅
> - C) Instructions are removed after each turn
> - D) Newer instructions are always ignored
>
> *Explanation:* Nothing forces a consistent reading. Old absolute-sounding instructions sit in the context alongside newer, partial overrides, on every turn.

> **Q2.** Why not write code that detects conflicting instructions by comparing their text?
> - A) Code can't read messages
> - B) Conflicting instructions often share few words, and deciding how one overrides another takes understanding, which is the model's job ✅
> - C) It would use too many tokens
> - D) Conflicts are always obvious
>
> *Explanation:* "Haiku for every new agent" and "research agents need opus" barely overlap in wording. The model reconciles; code manages the recorded result.

> **Q3.** When the user says "research agents need opus", what should the model record with `set_rule`?
> - A) Only the new sentence, so the history is accurate
> - B) Nothing, since a rule already exists
> - C) The complete reconciled rule: opus for research agents, haiku for all others ✅
> - D) A second, separate rule that the model must combine later
>
> *Explanation:* The model resolves the conflict once, while both versions are in front of it. The latest value is then the whole truth.

> **Q4.** What does the `<current_rules>` block contain?
> - A) Every value each rule has ever had
> - B) Only the rules that changed
> - C) The original user messages, quoted
> - D) One line per rule, with its latest value ✅
>
> *Explanation:* The history exists for review; the block shows only what's true now, so there's nothing left to reconcile.

---

## Applied sandbox exercise

*(graded — one current set of rules)*

**Task shown to learner:** The agent records instructions with a `set_rule` tool, whose input has a `name` and a `value`. Implement three functions over the scratchpad:

- **`rule_history(messages)`:** a dict mapping each rule name to the list of every value it was set to, in order. Only `tool_use` blocks named `set_rule`, in assistant messages, count. An assistant message may contain text and several tool calls.
- **`changed_rules(messages)`:** the names of rules that were set to more than one value.
- **`current_rules_block(messages)`:** `""` if there are no rules; otherwise `<current_rules>` on its own line, then one line per rule, `- name: latest value`, in the order rules were first set, then `</current_rules>`.

**Starter code:**
```python
def rule_history(messages: list) -> dict:
    # TODO
    ...

def changed_rules(messages: list) -> list:
    # TODO
    ...

def current_rules_block(messages: list) -> str:
    # TODO
    ...
```

**Hidden tests:**
```python
def rule_call(name, value):
    return ToolUseBlock(name="set_rule", input={"name": name, "value": value})

a = rule_call("default_model", "claude-haiku")
b = rule_call("billing_agent", "never modify")
c = rule_call("default_model", "claude-opus for research, haiku otherwise")
other = ToolUseBlock(name="get_agent_model", input={"agent_name": "x"})
messages = [
    {"role": "user", "content": "use haiku"},
    {"role": "assistant", "content": [TextBlock(text="Noted."), a, other]},
    {"role": "user", "content": [{"type": "tool_result", "tool_use_id": a.id, "content": "ok"},
                                 {"type": "tool_result", "tool_use_id": other.id, "content": "claude-haiku"}]},
    {"role": "assistant", "content": [b, c]},
    {"role": "user", "content": [{"type": "tool_result", "tool_use_id": b.id, "content": "ok"},
                                 {"type": "tool_result", "tool_use_id": c.id, "content": "ok"}]},
]

# 1. history keeps every value, in the order set; other tools and text blocks are ignored
assert rule_history(messages) == {"default_model": ["claude-haiku", "claude-opus for research, haiku otherwise"],
                                  "billing_agent": ["never modify"]}

# 2. only rules set to more than one value are reported as changed
assert changed_rules(messages) == ["default_model"]

# 3. the block shows only the latest value of each rule, in the order rules were first set
assert current_rules_block(messages) == (
    "<current_rules>\n"
    "- default_model: claude-opus for research, haiku otherwise\n"
    "- billing_agent: never modify\n"
    "</current_rules>")
assert "claude-haiku\n" not in current_rules_block(messages)

# 4. no rules at all: empty history, nothing changed, empty block
plain = [{"role": "user", "content": "hi"}, {"role": "assistant", "content": [TextBlock(text="hello")]}]
assert rule_history(plain) == {} and changed_rules(plain) == [] and current_rules_block(plain) == ""
```

**Hint (shown on request):** Build `rule_history` first, and the other two follow from it. A dict remembers the order its keys were first added, so looping over `history.items()` already gives rules in the order they were first set. `values[-1]` is the latest value.

**Reference solution:**
```python
def rule_history(messages: list) -> dict:
    history = {}
    for message in messages:
        if message["role"] == "assistant" and isinstance(message["content"], list):
            for block in message["content"]:
                if block.type == "tool_use" and block.name == "set_rule":
                    history.setdefault(block.input["name"], []).append(block.input["value"])
    return history

def changed_rules(messages: list) -> list:
    return [name for name, values in rule_history(messages).items() if len(values) > 1]

def current_rules_block(messages: list) -> str:
    history = rule_history(messages)
    if not history:
        return ""
    lines = [f"- {name}: {values[-1]}" for name, values in history.items()]
    return "<current_rules>\n" + "\n".join(lines) + "\n</current_rules>"
```

**Explanation:** The design separates the part only the model can do, reconciling instructions into one rule, from the part code does reliably: keeping the latest value, listing what changed, and producing a single block to show the model. The tests check that other tools and text blocks are ignored, that several calls in one message are all read (test 1), and that the block shows only the latest value of each rule (test 3), so the old, contradicted version can't reach the model through it.

---

*(End of Concept 3. This lesson continues with Concept 4 — re-anchoring the goal.)*
