# Module 4, Lesson 12 — Concept 2: Measuring the before and after

> **Note for the site build:** add `run_report` to this lesson's setup. The first demo defines `WindowedScripted`, `Naive`, `fresh` and `attempt`, which the second demo also uses: load them for both. `ContextManager` changed while this concept was written (it gained `fold` and a final fitting guarantee); use the version in the updated Concept 1 file.

---

## What "before" and "after" mean here

The handover for this module asked for a measurable before and after: tokens per turn, and an agent completing a long task it previously failed. With a fake model, both have to be measured on what the model is sent, since it can't succeed or fail at the task itself:

- **Failing** means a request that won't fit the window, which the client here refuses as a real provider would, or losing something the task depends on.
- **Completing** means reaching the final step with every request within the window, and the task, the user's rule and the early finding still available.

What a real model does better with a smaller, cleaner context is the evidence from [Lesson 2](→ this module, context that fits but still hurts lesson) and [Lesson 11](→ this module, forgetting aging and retrieval quality lesson), not something this demo can show.

To measure it, a report over the requests a run sent:

```python
def run_report(sent: list, checks: dict) -> dict:
    """What a run's requests cost, and on which turns each thing that matters was missing from them."""
    sizes = [count_tokens(r["system"]) + count_tokens(r["tools"]) + count_tokens(r["messages"]) for r in sent]
    breaks = 0
    for i in range(1, len(sent)):
        if first_divergence(sent[i - 1], sent[i])["diverges_at"] in ("tools", "system"):
            breaks += 1
    missing = {}
    for name, text in checks.items():
        missing[name] = [turn + 1 for turn in range(len(sent)) if text not in json.dumps(_plain(sent[turn]))]
    return {"turns": len(sent), "largest": max(sizes) if sizes else 0, "total": sum(sizes),
            "cost": cost_of_run(sent, 0.1, 1.25), "prefix_breaks": breaks, "missing": missing}
```

## One task, three runs

[The previous concept's](→ this lesson, one context step in order concept) session, run three ways. A naive loop sends the whole history every turn, at the same 3,500-token window as the managed one, and again with no limit at all, to see what the whole task would cost that way:

```python
class WindowedScripted(WindowedClient):
    """The scripted agent, behind a real window: a request that doesn't fit is refused. Every call is logged."""
    def create(self, messages, tools=None, system=""):
        self.log = getattr(self, "log", [])
        self.log.append({"tools": tools or [], "system": system, "messages": messages})
        last = messages[-1]["content"]
        if isinstance(last, list) and _plain(last[-1]).get("text") == SUMMARY_INSTRUCTIONS:
            return FakeResponse(content=[TextBlock(text="Rule and plan set; billing_agent's per-ticket lookup (p99 4.8s) is the likely cause; "
                                                        "several agents' logs looked normal.")])
        if isinstance(last, str) and last.endswith(FOLD_INSTRUCTIONS):
            return FakeResponse(content=[TextBlock(text="Rule and plan set; billing_agent's per-ticket lookup (p99 4.8s) is the likely cause; "
                                                        "many agents' logs looked normal.")])
        return super().create(messages, tools=tools, system=system)

class Naive:
    """No context step: the whole history, every turn."""
    def __init__(self, system):
        self.system = system
    def build(self, history):
        return {"tools": TOOLS, "system": self.system, "messages": list(history)}

TASK = "support_agent is slow. Find the cause and fix it."
CHECKS = {"task": "Find the cause and fix it", "rule": "never restart production agents", "finding": "4.8s"}

def fresh():
    memory = ArchiveStore()
    memory.save("u_simar", ArchivableMemory(content="Write summaries as bullet points.", type="procedural", source="user",
                                            created="2026-09-14T10:00:00", importance=9))
    return memory, Notes(), ResultStore(), CoreBlock("User: Simar, operations lead.")

def attempt(label, window, managed):
    memory, notes, results, block = fresh()
    llm = WindowedScripted(script(), window=window)
    if managed:
        context = ContextManager(llm, BASE, TOOLS, window=window, max_tokens=1_000, memory=memory, user_id="u_simar", task=TASK,
                                 now="2026-09-28T09:00:00", block=block, notes=notes, results=results, write_tools=["set_cache"])
    else:
        context = Naive(BASE)
    sent = []
    class Recording:
        def build(self, history):
            request = context.build(history)
            sent.append(request)
            return request
    try:
        answer, history, _ = run(Recording(), llm, TASK, make_impls(notes, results, block))
        outcome = "completed"
    except ContextWindowExceeded as error:
        outcome = f"failed on turn {len(sent)}: {error}"
    report = run_report(sent, CHECKS)
    calls = run_report(llm.log, {})
    print(f"{label}\n   {outcome}")
    print(f"   {report['turns']} turns, largest request {report['largest']:,} tokens, prefix breaks {report['prefix_breaks']}")
    print(f"   all {calls['turns']} model calls, summaries included: {calls['total']:,} tokens sent, cost {calls['cost']:,}")
    print(f"   turns missing the task: {report['missing']['task']}, the rule: {report['missing']['rule']}, "
          f"the finding: {report['missing']['finding']}")
    return report

attempt("naive, 3,500-token window", 3_500, managed=False)
attempt("naive, unlimited window", 1_000_000, managed=False)
attempt("managed, 3,500-token window", 3_500, managed=True)
```
```
naive, 3,500-token window
   failed on turn 13: prompt is too long: 3,517 tokens > 3,500 maximum
   13 turns, largest request 3,517 tokens, prefix breaks 0
   all 13 model calls, summaries included: 21,021 tokens sent, cost 6,179
   turns missing the task: [], the rule: [1], the finding: [1, 2, 3]
naive, unlimited window
   completed
   17 turns, largest request 4,315 tokens, prefix breaks 0
   all 17 model calls, summaries included: 37,437 tokens sent, cost 8,766
   turns missing the task: [], the rule: [1], the finding: [1, 2, 3]
managed, 3,500-token window
   completed
   17 turns, largest request 2,260 tokens, prefix breaks 0
   all 18 model calls, summaries included: 25,177 tokens sent, cost 13,103
   turns missing the task: [], the rule: [1], the finding: [1, 2, 3]
```
*(runs live, shows output — read-only demo snippet, not graded; the agent's calls and summaries are scripted, and costs are in Lesson 3's token-units with its example multipliers)*

- **The naive loop fails** at the same window, on turn 13. The request no longer fits, and the provider refuses it.
- **The managed loop completes** at that window. Its largest request is about half the size of the naive loop's largest, and its prefix never breaks.
- **Nothing that matters went missing.** The checks show the same turns for every run: the rule and the finding are absent only before they exist. Fitting, compaction included, lost none of them.
- **On this task, managed cost more.** 13,103 token-units against 8,766 for the naive loop with unlimited room. That's the next section's subject.

## At what length does it pay?

The naive loop's cost on this 17-turn task is low because its history only ever grows at the end, so almost all of it is read from the cache. The context step pays for things the naive loop doesn't:

- **Its rewrites.** Each compaction and clearing breaks the cache from where it edits.
- **Its anchor,** restated on every turn and never cached.
- **Its summary calls.**

Those costs are roughly the same per turn, while the naive loop's grows with its history. So here's the same task at increasing lengths, counting every model call, summaries included:

```python
def long_script(checks):
    """The same task, with `checks` agents to rule out in the middle."""
    steps = script()
    middle = [[ThinkingBlock(thinking=f"Rule out agent {n}. " + "Weighing what the evidence so far shows. " * 5),
               ToolUseBlock(name="get_status", input={"agent_name": f"agent_{n}", "detail": True})] for n in range(checks)]
    return steps[:6] + middle + steps[-4:]

def cost_at(checks, managed, fold_share=0.3):
    memory, notes, results, block = fresh()
    window = 3_500 if managed else 10_000_000
    llm = WindowedScripted(long_script(checks), window=window)
    context = (ContextManager(llm, BASE, TOOLS, window=window, max_tokens=1_000, memory=memory, user_id="u_simar", task=TASK,
                              now="2026-09-28T09:00:00", block=block, notes=notes, results=results, write_tools=["set_cache"],
                              fold_share=fold_share) if managed else Naive(BASE))
    sent = []
    class Recording:
        def build(self, history):
            request = context.build(history)
            sent.append(request)
            return request
    try:
        run(Recording(), llm, TASK, make_impls(notes, results, block), max_steps=500)
    except ContextWindowExceeded:
        return None
    # every model call counts, including the ones that write summaries
    return cost_of_run(llm.log, 0.1, 1.25)

print(f"{'checks':>6} {'naive, unlimited':>17} {'managed, 3,500':>15} {'ratio':>6}")
for checks in [7, 20, 40, 80, 160]:
    naive, managed = cost_at(checks, False), cost_at(checks, True)
    print(f"{checks:>6} {naive:>17,} {managed:>15,} {managed / naive:>6.2f}")
print()
# the same 160-check task, with and without folding the summaries
for fold_share in [0.3, None]:
    memory, notes, results, block = fresh()
    llm = WindowedScripted(long_script(160), window=3_500)
    context = ContextManager(llm, BASE, TOOLS, window=3_500, max_tokens=1_000, memory=memory, user_id="u_simar", task=TASK,
                             now="2026-09-28T09:00:00", block=block, notes=notes, results=results, write_tools=["set_cache"],
                             fold_share=fold_share)
    run(context, llm, TASK, make_impls(notes, results, block), max_steps=500)
    label = "folding at 30% of the budget" if fold_share else "never folding"
    print(f"{label:29} summaries at the end: {count_tokens(context.view[0]):>5,} tokens   "
          f"rounds dropped without a trace on {context.steps.count('trim')} turns")
```
```
checks  naive, unlimited  managed, 3,500  ratio
     7             8,676          13,006   1.50
    20            24,034          28,508   1.19
    40            59,649          56,181   0.94
    80           173,851         106,746   0.61
   160           576,810         208,186   0.36

folding at 30% of the budget  summaries at the end:   151 tokens   rounds dropped without a trace on 0 turns
never folding                 summaries at the end: 1,584 tokens   rounds dropped without a trace on 106 turns
```
*(runs live, shows output — read-only demo snippet, not graded; the same scripted agent with more agents to check; costs include every model call, summary requests included)*

- **Short tasks cost more with the context step,** by half at 7 checks. For those, the naive loop is the better choice, provided it fits.
- **The two break even between 20 and 40 checks.**
- **At 160 checks, managed costs about a third** of what the naive loop would, and the naive loop's last request is over 60,000 tokens, so it needs a window that large to get there at all.

The last two lines show a problem the measurement found in the context step itself. It isn't shown in the table, because it's fixed there. Without folding, the summaries pile up: by the end they took about 1,600 tokens of a 3,500-token window, and whole rounds had to be dropped without a trace on over a hundred turns just to fit. [Lesson 5](→ this module, compaction and summarization lesson, when a summary loses something concept, summaries of summaries) predicted that rewriting old summaries would eventually become necessary, and a long enough run is where it did. It's why `fold` is in [the previous concept's](→ this lesson, one context step in order concept, the integration rules) context step.

---

## Quiz cards

> **Q1.** With a fake model, how is "completing a task it previously failed" measured?
> - A) By asking the fake model whether it succeeded
> - B) By the length of the final answer
> - C) By every request fitting the window to the end, with the task, the rules and the key finding still available ✅
> - D) By the number of tool calls
>
> *Explanation:* The fake client can't be better or worse at the task. What it's sent can be measured exactly, and the research covers what a real model does with it.

> **Q2.** On the 17-turn task, why did the managed loop cost more than the naive loop with unlimited room?
> - A) The naive history only grew at the end, so it was almost all cached, while the managed loop paid for rewrites, a restated anchor, and summary calls ✅
> - B) The managed loop sent more tokens
> - C) The context step has a bug
> - D) Caching was switched off for the managed loop
>
> *Explanation:* The managed loop sent fewer tokens, but more of them were new. Its costs stay roughly flat per turn, while the naive loop's grow with its history.

> **Q3.** At what task length did the managed loop start to cost less?
> - A) Always
> - B) Never
> - C) Only above 160 checks
> - D) Between 20 and 40 checks, falling to about a third of the naive cost at 160 ✅
>
> *Explanation:* The context step's costs are roughly the same per turn, while resending a growing history keeps getting more expensive.

> **Q4.** What did the measurement find in the context step itself?
> - A) Anchors were lost after compaction
> - B) Appended summaries piled up until they crowded the window, forcing rounds to be dropped without a trace, until folding was added ✅
> - C) The prefix broke on every turn
> - D) The store ran out of space
>
> *Explanation:* Lesson 5 appends summaries so old ones never drift, and said rewriting them would eventually be needed. Over a long run, it was.

> **Q5.** Why does the cost comparison count every model call, not just the agent's turns?
> - A) The agent's turns can't be counted
> - B) The summary calls are part of what the context step costs, and leaving them out would understate it ✅
> - C) The naive loop makes summary calls too
> - D) Cost only depends on the number of calls
>
> *Explanation:* A measurement that leaves out one side's costs flatters it. Counting summaries moved the break-even point, from about 20 checks to between 20 and 40.

---

## Applied sandbox exercise

*(graded — a run report)*

**Task shown to learner:** The module's code is provided, including `count_tokens`, `first_divergence`, `cost_of_run`, `_plain` and `json`. Implement **`run_report(sent, checks)`**, where `sent` is a list of requests and `checks` maps a name to a piece of text. Return a dict with:

- `"turns"`: the number of requests.
- `"largest"` and `"total"`: the largest and total request size, where each request's size is `count_tokens` of its system prompt, plus its tools, plus its messages. Both are 0 for no requests.
- `"cost"`: `cost_of_run(sent, 0.1, 1.25)`.
- `"prefix_breaks"`: how many requests first differ from the one before in `"tools"` or `"system"`.
- `"missing"`: for each check, the list of turns, counting from 1, whose request (all of it, system prompt included) doesn't contain its text, checked against `json.dumps(_plain(request))`.

**Provided code:** the module's code, as loaded in this lesson's setup.

**Starter code:**
```python
def run_report(sent: list, checks: dict) -> dict:
    # TODO: turns, largest and total size (system + tools + messages), cost (0.1, 1.25),
    #       prefix breaks (first difference in the tools or system), and for each check
    #       the turns, counting from 1, whose request didn't contain its text
    ...
```

**Hidden tests:**
```python
TOOLS_A = [{"name": "a", "description": "a", "input_schema": {"type": "object", "properties": {}}}]
def req(system, messages, tools=TOOLS_A):
    return {"tools": tools, "system": system, "messages": messages}

sent = [req("S", [{"role": "user", "content": "Fix it. Rule: no restarts."}]),
        req("S", [{"role": "user", "content": "Fix it. Rule: no restarts."}, {"role": "assistant", "content": "Found 4.8s."}]),
        req("S2", [{"role": "user", "content": "Fix it."}]),
        req("S2", [{"role": "user", "content": "Fix it. Found 4.8s."}])]
report = run_report(sent, {"task": "Fix it", "rule": "no restarts", "finding": "4.8s"})

# 1. sizes: the largest request and the total, counting system, tools and messages
sizes = [count_tokens(r["system"]) + count_tokens(r["tools"]) + count_tokens(r["messages"]) for r in sent]
assert report["turns"] == 4 and report["largest"] == max(sizes) and report["total"] == sum(sizes)

# 2. cost, with Lesson 3's example multipliers
assert report["cost"] == cost_of_run(sent, 0.1, 1.25)

# 3. prefix breaks: turns whose request first differs from the previous one in the tools or the system prompt
assert report["prefix_breaks"] == 1
assert run_report([req("S", []), req("S", [], tools=[])], {})["prefix_breaks"] == 1

# 4. for each check, the turns (counting from 1) whose request didn't contain it anywhere
assert report["missing"] == {"task": [], "rule": [3, 4], "finding": [1, 3]}

# 5. the system prompt counts as part of the request when checking
assert run_report([req("Rule: no restarts.", [{"role": "user", "content": "x"}])], {"rule": "no restarts"})["missing"] == {"rule": []}

# 6. no requests gives an empty report
empty = run_report([], {"task": "Fix it"})
assert empty == {"turns": 0, "largest": 0, "total": 0, "cost": 0, "prefix_breaks": 0, "missing": {"task": []}}
```

**Hint (shown on request):** `first_divergence(previous, current)["diverges_at"]` names where two requests first differ: `"tools"`, `"system"`, a message such as `"messages[3]"`, or `None`. Only the first two break the prefix. `max` of an empty list raises an error, so check for no requests first.

**Reference solution:**
```python
def run_report(sent: list, checks: dict) -> dict:
    """What a run's requests cost, and on which turns each thing that matters was missing from them."""
    sizes = [count_tokens(r["system"]) + count_tokens(r["tools"]) + count_tokens(r["messages"]) for r in sent]
    breaks = 0
    for i in range(1, len(sent)):
        if first_divergence(sent[i - 1], sent[i])["diverges_at"] in ("tools", "system"):
            breaks += 1
    missing = {}
    for name, text in checks.items():
        missing[name] = [turn + 1 for turn in range(len(sent)) if text not in json.dumps(_plain(sent[turn]))]
    return {"turns": len(sent), "largest": max(sizes) if sizes else 0, "total": sum(sizes),
            "cost": cost_of_run(sent, 0.1, 1.25), "prefix_breaks": breaks, "missing": missing}
```

**Explanation:** Test 3 checks that only differences in the tools or the system prompt count as prefix breaks. A version that counts any difference counts every normal turn, since each one adds messages. Test 4 checks the per-turn checks, counting turns from 1 as the report reads. Test 5 checks that the whole request is searched, since a rule restated in the system prompt counts. Test 1 checks that sizes include the system prompt and tools, not just the messages.

---

*(End of Concept 2.)*
