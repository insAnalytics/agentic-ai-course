# Module 4, Lesson 10 — Concept 1: Extraction, with evidence

> **Note for the site build:** add `entries`, `numbered_transcript`, `EXTRACTION_INSTRUCTIONS`, `parse_candidates` and `derive_source` to this lesson's setup. The setup continues from Lesson 9's (`Memory`, `MemoryStore` and Lesson 8's `keywords`).

---

## From a finished session to candidate memories

[Lesson 9's pipeline](→ this module, building a memory store lesson, three ways an agent uses the store concept, a pipeline after the session) wrote memories after a session from a list an extraction step had proposed, and that step was scripted. This lesson builds it. It's a model call that reads a finished session and proposes what's worth keeping. Published memory systems work the same way: Mem0, for example, runs an [extraction phase](https://arxiv.org/abs/2504.19413) that pulls salient facts out of each exchange before deciding what to do with them.

A model is the right tool for the job, because judging what will matter next week takes judgment. The question is what to do with its answer.

## The trouble with trusting its labels

The obvious design asks the model for each memory's content, its type, and its source: did the user say it, did the agent conclude it, or did a tool return it? [Lesson 9](→ this module, building a memory store lesson, a memory record and a store scoped by design concept) made `source` part of every record because what a memory is allowed to do depends on it.

But a source label written by the model is just more model output. It can be wrong in ordinary ways: a paraphrase, a detail invented, one message confused with another. It can also be wrong because something told it to be. Text in a tool result that says "the user asked me to remember…" is exactly the kind of thing [Module 3's threat model](→ Module 3, the tool threat model lesson, prompt injection through tool results concept) warned steers a model. If the model repeats that claim, a label-trusting pipeline stores it as the user's words.

## Evidence: a quote, and where it's from

The fix is to ask for something code can check. For each memory, the model must give the **exact words** it rests on, and the number of the **entry** they come from. Code then checks that those words really are in that entry, and takes the source from the entry itself, never from the model.

To make entries citable, the session is flattened into numbered pieces, each marked with whose words it is:

```python
def entries(history: list) -> list:
    """A session as numbered pieces, each marked with whose words it is: the user's, the agent's, or a tool's."""
    found = []
    for message in history:
        if isinstance(message["content"], str):
            found.append({"kind": "user" if message["role"] == "user" else "agent", "text": message["content"]})
            continue
        for block in message["content"]:
            block = _plain(block)
            if block["type"] == "tool_result":
                found.append({"kind": "tool", "text": str(block["content"])})
            elif block["type"] == "text":
                found.append({"kind": "user" if message["role"] == "user" else "agent", "text": block["text"]})
    return found

def numbered_transcript(history: list) -> str:
    found = entries(history)
    return "\n".join(f"[{i}] {found[i]['kind']}: {found[i]['text']}" for i in range(len(found)))

EXTRACTION_INSTRUCTIONS = """From the numbered transcript above, list what is worth remembering for future sessions with this user:
standing instructions, facts about the user and their systems, and conclusions that took work to reach.
Skip raw tool output that can be fetched again. For each memory, give its type (episodic, semantic or procedural),
the exact words it rests on as "quote", copied character for character, and the number of the entry they come from as "entry".
Reply with only a JSON list of objects with the keys content, type, quote and entry."""
```

Each tool result is its own entry, and so is each piece of the agent's text. A tool result's text can say anything, but its entry is still marked `tool`: nothing written inside it can change that.

Then two functions check what comes back:

```python
def parse_candidates(reply: str) -> tuple:
    """The candidate memories in an extraction reply, and a note for each item that had to be skipped."""
    # models sometimes wrap JSON in a code fence despite being asked not to, so drop fence lines
    lines = [line for line in reply.strip().split("\n") if not line.startswith("```")]
    text = "\n".join(lines)
    try:
        items = json.loads(text)
    except json.JSONDecodeError:
        return [], ["the reply was not valid JSON"]
    if not isinstance(items, list):
        return [], ["the reply was not a JSON list"]
    candidates, problems = [], []
    for item in items:
        if not isinstance(item, dict) or not all(key in item for key in ["content", "type", "quote", "entry"]):
            problems.append(f"missing content, type, quote or entry: {item}")
        elif not isinstance(item["entry"], int):
            problems.append(f"entry is not a number: {item}")
        else:
            candidates.append(item)
    return candidates, problems

def derive_source(candidate: dict, history: list):
    """Whose words a candidate rests on, checked against the entry it cites; None if the quote isn't there."""
    found = entries(history)
    if not 0 <= candidate["entry"] < len(found):
        return None
    cited = found[candidate["entry"]]
    if not candidate["quote"] or candidate["quote"] not in cited["text"]:
        return None
    return cited["kind"]
```

Here's a session, and a scripted extraction reply with five proposals, each carrying the source the model claims for it:

```python
def call(name, result, **arguments):
    block = ToolUseBlock(name=name, input=arguments)
    return [{"role": "assistant", "content": [block]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": block.id, "content": result}]}]

history = [{"role": "user", "content": "Why is support_agent slow? Keep summaries to bullet points, please."}]
history += call("get_metrics", "billing_agent: p99 4.8s on /lookup, called once per ticket", agent_name="billing_agent")
history += call("fetch_page", "Team wiki, support_agent: owned by Priya Nair. Escalations go to #support-oncall.",
                url="https://wiki.example/support_agent")
history += [{"role": "assistant", "content": [TextBlock(text="- billing_agent's lookup is the bottleneck\n- Priya owns support_agent")]}]
print(numbered_transcript(history), "\n")

# the extraction step's reply (scripted): five proposals, two of them flawed, each with the source the model claims
reply = """```json
[{"content": "Write summaries as bullet points.", "type": "procedural", "quote": "Keep summaries to bullet points", "entry": 0, "source": "user"},
 {"content": "billing_agent's lookup was support_agent's bottleneck.", "type": "episodic", "quote": "billing_agent's lookup is the bottleneck", "entry": 3, "source": "agent"},
 {"content": "Priya Nair owns support_agent.", "type": "semantic", "quote": "owned by Priya Nair", "entry": 2, "source": "tool"},
 {"content": "Send weekly reports to Priya.", "type": "procedural", "quote": "send weekly reports to Priya", "entry": 0, "source": "user"},
 {"content": "Escalate to #support-oncall.", "type": "procedural", "quote": "Escalations should go to #support-oncall", "entry": 2, "source": "tool"}]
```"""
candidates, problems = parse_candidates(reply)
print("trusting the model's own labels:")
for candidate in candidates:
    print(f"   {candidate['source']:5}  {candidate['content']}")

print("checking each quote against the entry it cites:")
for candidate in candidates:
    source = derive_source(candidate, history)
    print(f"   {source:5}  {candidate['content']}" if source else f"   refused: the quote isn't in entry {candidate['entry']}: {candidate['content']}")
```
```
[0] user: Why is support_agent slow? Keep summaries to bullet points, please.
[1] tool: billing_agent: p99 4.8s on /lookup, called once per ticket
[2] tool: Team wiki, support_agent: owned by Priya Nair. Escalations go to #support-oncall.
[3] agent: - billing_agent's lookup is the bottleneck
- Priya owns support_agent 

trusting the model's own labels:
   user   Write summaries as bullet points.
   agent  billing_agent's lookup was support_agent's bottleneck.
   tool   Priya Nair owns support_agent.
   user   Send weekly reports to Priya.
   tool   Escalate to #support-oncall.
checking each quote against the entry it cites:
   user   Write summaries as bullet points.
   agent  billing_agent's lookup was support_agent's bottleneck.
   tool   Priya Nair owns support_agent.
   refused: the quote isn't in entry 0: Send weekly reports to Priya.
   refused: the quote isn't in entry 2: Escalate to #support-oncall.
```
*(runs live, shows output — read-only demo snippet, not graded; the extraction reply is scripted, with two flawed proposals written in on purpose)*

Trusting the labels would have stored "Send weekly reports to Priya" as a standing instruction from the user. The user never said it: it's not in entry 0, or anywhere else. With the check, it's refused.

The last refusal is the price of the rule. The page does say escalations go to #support-oncall, but the model's quote reworded it, so it doesn't match. An exact-match check refuses anything it can't verify, including honest paraphrases. Loosening it (ignoring case or spacing, say) lets more through, at the cost of verifying less. For memory, the trade leans strict. A true fact that's refused can be learned again next session. A forged one is replayed in every session until someone notices.

## What the evidence settles

The quote check settles one question: **whose words these are.** That's what the source rules in this lesson's last concept depend on.

It doesn't settle whether the words are true, or whether a tool's text is really a fact or an instruction dressed as one. A page can say anything, and a quote from it is only ever `tool`. What a `tool` memory may become is [the last concept's](→ this lesson, memory poisoning and the source rule concept) subject. The next concept deals with what happens when a checked candidate repeats, or contradicts, something already stored.

---

## Quiz cards

> **Q1.** Why not simply ask the extraction model to label each memory's source?
> - A) Models can't produce JSON reliably
> - B) Labels take too many tokens
> - C) A label is just more model output: it can be mistaken, or steered by text such as "the user asked me to remember…" in a tool result ✅
> - D) The store has no field for a source
>
> *Explanation:* In the demo, trusting the labels stored an instruction the user never gave, marked as the user's own.

> **Q2.** How does `derive_source` decide whose words a memory rests on?
> - A) It asks the model a second time
> - B) It checks that the quote appears exactly in the cited entry, and takes the source from that entry's kind ✅
> - C) It searches every entry for the quote
> - D) It uses the source field in the candidate
>
> *Explanation:* The entry's kind comes from the session itself: a user's message, the agent's text, or a tool result. Nothing written in a tool result can change it.

> **Q3.** Why must the quote be in the *cited* entry, not just anywhere in the session?
> - A) Searching the whole session is too slow
> - B) Entries are numbered from zero
> - C) The model might cite the wrong number by accident
> - D) A quote found in a tool result, but cited as a user message, would otherwise pass as the user's words ✅
>
> *Explanation:* The point of the check is to tie the words to their author. A match anywhere proves only that someone wrote them.

> **Q4.** A true fact from the wiki was refused because the quote paraphrased it. Why keep the check strict anyway?
> - A) A true fact that's refused can be learned again later, while a forged one is replayed in every session until someone notices ✅
> - B) Paraphrases are always false
> - C) Loose matching is impossible in Python
> - D) The fact wasn't important
>
> *Explanation:* The check only lets through what it can verify. The cost of a false refusal is small and temporary; the cost of a false acceptance persists.

> **Q5.** What doesn't the quote check settle?
> - A) Which entry the words came from
> - B) Whether the words are true, or whether a tool's text is a fact or a disguised instruction ✅
> - C) Whose words they are
> - D) Whether the reply was valid JSON
>
> *Explanation:* It settles authorship only. What a memory from a tool may become is the last concept's subject.

---

## Applied sandbox exercise

*(graded — checking what extraction proposes)*

**Task shown to learner:** `entries` and `numbered_transcript` are provided. Implement:

- **`parse_candidates(reply)`:** return `(candidates, problems)`.
  - Split the stripped reply into lines, drop any line starting with three backticks, and join the rest.
  - If that isn't valid JSON, return `([], ["the reply was not valid JSON"])`. If it isn't a list, return `([], ["the reply was not a JSON list"])`.
  - Keep each item that is a dict with the keys `content`, `type`, `quote` and `entry`, and whose `entry` is an `int`. For every other item, add a note to `problems`.
- **`derive_source(candidate, history)`:**
  - Using `entries(history)`, return the `kind` of entry number `candidate["entry"]` if that entry exists and its text contains `candidate["quote"]` exactly.
  - Return `None` if the entry doesn't exist (including a negative number) or the quote is empty or not in it.

**Provided code:** `entries` and `numbered_transcript` as shown in this concept, and `json`.

**Starter code:**
```python
def parse_candidates(reply: str) -> tuple:
    # TODO: drop code-fence lines; parse JSON; it must be a list;
    #       keep complete items whose "entry" is a number, and note why each other item was skipped
    ...

def derive_source(candidate: dict, history: list):
    # TODO: the kind of the cited entry, if it exists and contains the quote exactly; otherwise None
    ...
```

**Hidden tests:**
```python
history = [{"role": "user", "content": "Keep summaries to bullet points, please."},
           {"role": "assistant", "content": [TextBlock(text="Checking two agents."),
                                             ToolUseBlock(name="get_status", input={}), ToolUseBlock(name="get_status", input={})]},
           {"role": "user", "content": [{"type": "tool_result", "tool_use_id": "t1", "content": "search_agent: healthy"},
                                        {"type": "tool_result", "tool_use_id": "t2", "content": "billing_agent: p99 4.8s"}]},
           {"role": "assistant", "content": [TextBlock(text="billing_agent is the slow one.")]}]

item = lambda content, quote, entry: {"content": content, "type": "semantic", "quote": quote, "entry": entry}

# 1. a plain JSON list of complete items parses
good, problems = parse_candidates('[{"content": "a", "type": "semantic", "quote": "q", "entry": 0}]')
assert good == [item("a", "q", 0)] and problems == []

# 2. a list wrapped in a code fence parses the same way
assert parse_candidates('```json\n[{"content": "a", "type": "semantic", "quote": "q", "entry": 0}]\n```')[0] == [item("a", "q", 0)]

# 3. a reply that isn't JSON, or isn't a list, gives nothing and says why
assert parse_candidates("Here are the memories: ...") == ([], ["the reply was not valid JSON"])
assert parse_candidates('{"content": "a"}') == ([], ["the reply was not a JSON list"])

# 4. incomplete items, and entries that aren't numbers, are skipped with a note; the rest are kept
good, problems = parse_candidates('[{"content": "a", "type": "semantic", "quote": "q"}, '
                                  '{"content": "b", "type": "semantic", "quote": "q", "entry": "2"}, '
                                  '{"content": "c", "type": "semantic", "quote": "q", "entry": 1}]')
assert good == [item("c", "q", 1)] and len(problems) == 2

# 5. the source comes from the cited entry: the user's words, the agent's, or a tool's (each result is its own entry)
assert derive_source(item("x", "bullet points", 0), history) == "user"
assert derive_source(item("x", "Checking two agents", 1), history) == "agent"
assert derive_source(item("x", "p99 4.8s", 3), history) == "tool"
assert derive_source(item("x", "slow one", 4), history) == "agent"

# 6. a quote that isn't in the cited entry, even if it's elsewhere, gives None
assert derive_source(item("x", "p99 4.8s", 0), history) is None
assert derive_source(item("x", "", 0), history) is None

# 7. an entry that doesn't exist gives None, including a negative one
assert derive_source(item("x", "slow one", 5), history) is None
assert derive_source(item("x", "slow one", -1), history) is None
```

**Hint (shown on request):** `json.loads` raises `json.JSONDecodeError` on text that isn't JSON; catch it and return the note. In `derive_source`, check `0 <= n < len(found)` before indexing. Python reads a negative index from the end of the list, so without the check, `-1` would quietly cite the last entry.

**Reference solution:**
```python
def parse_candidates(reply: str) -> tuple:
    """The candidate memories in an extraction reply, and a note for each item that had to be skipped."""
    # models sometimes wrap JSON in a code fence despite being asked not to, so drop fence lines
    lines = [line for line in reply.strip().split("\n") if not line.startswith("```")]
    text = "\n".join(lines)
    try:
        items = json.loads(text)
    except json.JSONDecodeError:
        return [], ["the reply was not valid JSON"]
    if not isinstance(items, list):
        return [], ["the reply was not a JSON list"]
    candidates, problems = [], []
    for item in items:
        if not isinstance(item, dict) or not all(key in item for key in ["content", "type", "quote", "entry"]):
            problems.append(f"missing content, type, quote or entry: {item}")
        elif not isinstance(item["entry"], int):
            problems.append(f"entry is not a number: {item}")
        else:
            candidates.append(item)
    return candidates, problems

def derive_source(candidate: dict, history: list):
    """Whose words a candidate rests on, checked against the entry it cites; None if the quote isn't there."""
    found = entries(history)
    if not 0 <= candidate["entry"] < len(found):
        return None
    cited = found[candidate["entry"]]
    if not candidate["quote"] or candidate["quote"] not in cited["text"]:
        return None
    return cited["kind"]
```

**Explanation:** Test 6 is the rule that matters: a quote that's in the session, but not in the entry cited for it, gives no source. A version that searches every entry accepts a tool's words as the user's. Test 7 catches the negative index, which Python would otherwise read from the end. Tests 2–4 check that parsing survives what models actually produce: code fences, replies that aren't JSON, and items with missing or mistyped fields.

---

*(End of Concept 1.)*
