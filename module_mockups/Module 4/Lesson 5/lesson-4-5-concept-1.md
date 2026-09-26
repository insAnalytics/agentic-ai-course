# Module 4, Lesson 5 — Concept 1: What clearing can't do

> **Note for the site build:** this lesson's shared setup is Lesson 4's final setup: the fake client with `ThinkingBlock`, `COUNT_TOKENS`, `WINDOWED_CLIENT` and `CHECK_PAIRING`, plus `check_open_round`, `split_rounds`, `trim_to_fit`, `clear_old_results`, `fit`, `strip_old_thinking` and `fit_history` from Lesson 4, and Lesson 3's `serialize`, `first_divergence` and `cost_of_run`. Nothing new is added in this concept.

---

## Where the last lesson left off

[Lesson 4](→ this module, when the history wont fit lesson) gave the context step a fixed order for making a history fit: strip reasoning from finished steps, then clear old tool results, then drop whole rounds, and never touch the task or the step in progress. Each stage gives up more than the one before.

This lesson adds one more stage, at the end of that order: **compaction**, replacing a span of old rounds with a written summary of them. Before building it, it's worth being precise about what the existing stages can't do, because that's the only job compaction should be given.

## Clearing slows growth; it doesn't stop it

[Clearing](→ this module, when the history wont fit lesson, clear before you cut and cut in batches concept) removes the bulk of each old round, but not the round itself. The call, the placeholder and any text the model wrote all stay, so every round still leaves something behind. Here's a watch that runs for 200 rounds, measured raw and with every result but the last three cleared:

```python
def logs(agent, n):
    return f"{agent} check {n}\n" + f"{agent} INFO request handled in 412ms status=200\n" * 45

history = [{"role": "user", "content": "Watch every agent through the migration and report anything unusual."}]
agents = ["research_agent", "support_agent", "billing_agent", "triage_agent"]
print(f"{'rounds':>6}  {'raw':>8}  {'cleared':>8}  {'cleared per round':>17}")
previous = None
for n in range(1, 201):
    call = ToolUseBlock(name="get_logs", input={"agent_name": agents[n % 4]})
    history = history + [{"role": "assistant", "content": [TextBlock(text=f"Checking {agents[n % 4]}."), call]},
                         {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": logs(agents[n % 4], n)}]}]
    if n in (25, 50, 100, 200):
        cleared = count_tokens(clear_old_results(history, keep_last=3))
        per_round = "" if previous is None else f"{(cleared - previous[1]) / (n - previous[0]):.0f}"
        print(f"{n:>6}  {count_tokens(history):>8,}  {cleared:>8,}  {per_round:>17}")
        previous = (n, cleared)
```
```
rounds       raw   cleared  cleared per round
    25    17,792     4,336                   
    50    35,561     6,822                 99
   100    71,099    11,762                 99
   200   142,249    21,712                100
```
*(runs live, shows output — read-only demo snippet, not graded)*

Clearing cuts the growth per round from about 710 tokens to about 100, roughly sevenfold, and the saving grows with the run: by round 200 the cleared history is under a sixth of the raw one. But it still grows by about 100 tokens a round, with no end. A long enough run fills any window, and then the only remaining stage is dropping rounds.

## What a dropped round takes with it

Growth is the cost problem. The quality problem is what gets lost on the way. Here's a short investigation where the key finding arrives early: `billing_agent`'s 4.8-second lookup, called once per ticket, explains the slow queue. The rest of the run rules other agents out. The same history is sent at three budgets, the way `fit_history` would squeeze it:

```python
def step(thought, name, agent, result):
    call = ToolUseBlock(name=name, input={"agent_name": agent})
    return [{"role": "assistant", "content": [ThinkingBlock(thinking=thought), call]},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": call.id, "content": result}]}]

def filler(agent):
    return f"{agent} INFO request handled in 412ms status=200\n" * 30

history = [{"role": "user", "content": "Find out why the support queue is slow, then propose a fix."}]
history += step("Start with the metrics for the agents on the ticket path.", "get_metrics", "support_agent",
                "support_agent: p99 0.9s, queue depth 340")
history += step("support_agent itself looks fine; its dependencies next.", "get_metrics", "billing_agent",
                "billing_agent: p99 4.8s on /lookup, called once per ticket")
history += step("billing_agent's 4.8s lookup, once per ticket, explains the queue. Confirm the others are fine.",
                "get_logs", "search_agent", filler("search_agent"))
for agent in ["triage_agent", "report_agent", "auth_agent", "research_agent", "search_agent", "triage_agent"]:
    history += step(f"Ruling out {agent}.", "get_logs", agent, filler(agent))

def mentions(messages, text):
    # search everything that would be sent, as text
    return text in json.dumps(_plain(messages))

print(f"full history: {count_tokens(history):,} tokens")
print(f"{'budget':>7}  {'sent':>6}  {'the 4.8s figure':>15}  {'the billing call':>16}")
for budget in [10_000, 2_500, 1_200]:
    sent = fit_history(history, budget, keep_last=2)
    print(f"{budget:>7,}  {count_tokens(sent):>6,}  {str(mentions(sent, '4.8s')):>15}  {str(mentions(sent, 'billing_agent')):>16}")
```
```
full history: 3,662 tokens
 budget    sent  the 4.8s figure  the billing call
 10,000   3,662             True              True
  2,500   1,590            False              True
  1,200   1,157            False             False
```
*(runs live, shows output — read-only demo snippet, not graded; the history is made up, and the demo shows what was sent, not what a model would do with it)*

The finding disappears in two steps:

- **Squeezed moderately, the value goes but the call stays.** Stripping old reasoning removed the model's own conclusion, and clearing removed the result with the number in it. The model can still see it checked `billing_agent`'s metrics, so it could fetch them again, if it realizes they matter.
- **Squeezed hard, the round goes entirely.** Nothing says `billing_agent` was ever looked at. The model has lost the answer to the task and doesn't know it.

That second case is what compaction is for. Clearing and dropping both work at the level of messages: they can remove text, but they can't pull out the one conclusion worth keeping. A summary can. It condenses a stretch of work into what was learned, so that "billing_agent's lookup is 4.8s per ticket, the likely cause" survives after the rounds that established it are gone.

## What the evidence says about summarizing

It's tempting to go further and make summarization the main technique, since it seems to keep more. The best direct comparison so far says otherwise.

JetBrains Research compared the two approaches on coding agents solving real software-engineering tasks, across five model configurations, in ["The Complexity Trap"](https://arxiv.org/abs/2508.21433) (a NeurIPS 2025 workshop paper). One approach replaced old tool outputs with placeholders, which is this module's clearing. The other had a model summarize older turns. They found:

- **Clearing was as good, for less.** Replacing old tool outputs roughly halved the cost of an unmanaged agent, and matched the summarizing agent's success rate, sometimes slightly exceeding it.
- **Summaries cost twice.** The summarization calls themselves came to as much as about 7% of a run's cost. Agents that were summarizing also ran 13–15% more turns. The authors suggest the summaries hid failure signals that would otherwise have made the agent stop sooner, which echoes [Lesson 2's point](→ this module, context that fits but still hurts lesson, what goes stale in a scratchpad concept) about keeping failures visible.
- **The best result combined them.** Clearing first, with summarization held back as a last resort, cost 7% less than clearing alone and 11% less than summarizing alone.

One limit matters: the study covers coding agents, whose tool outputs are long and noisy, and the authors say the result may not hold where tool outputs are short.

Anthropic's [guide to context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) points the same way. It calls clearing old tool results one of the safest, lightest forms of compaction. And it warns that the hard part of summarizing is choosing what to keep: compress too aggressively and you can lose details whose importance only becomes clear later.

## Where compaction fits

So compaction goes at the end of the order, not the start:

- **Strip old reasoning, then clear old results.** These are cheap and lose nothing that can't be fetched again.
- **Compact** only when those aren't enough, and replace a span of old rounds with a summary of what they established.
- **Drop rounds without a summary** only as a last resort, if even that won't fit.

Compaction is also the most expensive edit in this module. It rewrites the history near its start, so, as [Lesson 3 warned](→ this module, prompt caching lesson, where lessons 2s techniques stand and the fights ahead concept), the cached prefix is lost from that point. It needs an extra model call, and the summary it produces can be wrong. The rest of this lesson builds it with those three costs in view: how to compact (next concept), how to catch a summary that lost something, and when compaction is worth doing at all.

---

## Quiz cards

> **Q1.** In the 200-round demo, what does clearing old results do to the history's growth?
> - A) It stops the growth once the window is half full
> - B) It slows the growth by about seven times, but the history still grows every round ✅
> - C) It makes the history shrink as old results are cleared
> - D) It has no effect once the run passes 100 rounds
>
> *Explanation:* Each round still leaves its call, its placeholder and any text behind, about 100 tokens here. Clearing changes the slope, not the shape, so a long enough run still fills any window.

> **Q2.** At the middle budget, the 4.8-second figure was gone but the `billing_agent` call was still visible. What does that leave the model able to do?
> - A) Nothing, because a cleared call can't be repeated
> - B) Read the figure from the placeholder
> - C) See that it checked those metrics, and fetch them again if it realizes they matter ✅
> - D) Recover the figure from its old reasoning, which clearing keeps
>
> *Explanation:* Clearing keeps the record of the step, not its content, and the old reasoning was stripped first. Re-fetching works when the data is still available and the model knows to look.

> **Q3.** What can a summary do that clearing and dropping can't?
> - A) Keep the cached prefix intact
> - B) Pull out the conclusion a stretch of work established and keep it after the rounds are gone ✅
> - C) Keep every tool result in full at a lower token cost
> - D) Avoid any extra model call
>
> *Explanation:* Clearing and dropping remove whole pieces of the history. Only a summary can condense what was learned into something small enough to keep.

> **Q4.** In the JetBrains comparison, why did summarizing agents end up costing more than clearing ones, despite keeping their context bounded?
> - A) The summaries were longer than the original history
> - B) Summaries broke tool pairing and forced retries
> - C) Clearing used a cheaper model
> - D) The summarization calls cost extra, and summarizing agents also ran more turns, possibly because summaries hid failure signals ✅
>
> *Explanation:* The summary calls came to as much as about 7% of a run's cost, and trajectories were 13–15% longer. The authors' explanation for the extra turns is a hypothesis: failures a model would have seen in full are smoothed over in a summary.

> **Q5.** Where does compaction belong in the context step's order?
> - A) After stripping old reasoning and clearing old results, and before dropping rounds without a trace ✅
> - B) First, since it keeps the most information
> - C) After dropping rounds, to summarize what's left
> - D) On every turn, so the summary stays current
>
> *Explanation:* The cheap stages lose nothing that can't be fetched again, so they go first. Compaction replaces a span that would otherwise have been dropped with nothing. And since it rewrites the start of the history, doing it every turn would lose the cache every turn.

---

*(End of Concept 1. No graded exercise here: the lesson's exercises start with building compaction, in Concept 2.)*
