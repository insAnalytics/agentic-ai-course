# Module 7, Lesson 11 — Concept 6: Releasing a change: shadow runs and canaries

> **Note for the site build:** no new data files. This page reads `trafficData("baseline-a", "baseline-b", "compaction-a")` and `question-mix.json`. Its setup is `LOAD_TRAFFIC` + the setup block shown below (`ended_without_answer`, `live`, `candidate`, `worse`); add it to `evalData.ts` as `CANARY`, byte-identical to the page. The two demos run independently on that setup, each in about a second in CPython.

---

## The step between the gate and everyone

[Lesson 10's gate](→ Module 7, the regression testing lesson, the a gate that doesn't flake concept) decides whether a change may ship, on the suite. But the suite isn't the traffic: [the previous concepts](→ this lesson, the when what people ask changes concept) showed real requests drifting away from any fixed set of tasks. Google's SRE Workbook puts it plainly in [its chapter on canarying](https://sre.google/workbook/canarying-releases/): test environments aren't identical to production and tests don't cover every case, so some defects will reach production, and if a release goes everywhere at once, so do its defects.

The industry's answer is to expose a change to real traffic in steps, each of which limits the damage while gathering evidence. This concept covers the two most useful for agents: a shadow run, where the new version sees real requests but no user sees its answers, and a canary, where a small share of users get the new version and are compared with everyone else.

---

## Shadow runs: real requests, no consequences

The workbook calls this **traffic teeing**: copy the live traffic to the new version, let the live version answer users as usual, and discard the new version's responses, or compare them with the live ones. Its strength is representative traffic. Its weakness, the workbook warns, is shared state: two systems that look independent can affect each other through anything they share, such as a cache.

For an agent, shared state is the whole problem. The registry agent's tools change things: they move an agent's model and send email. A shadow copy that calls the real `set_model` isn't a shadow; it's a second agent acting on the same registry. So a shadow agent needs tools that can't change the real world:

- **Read-only tools pass through.** Lookups, searches and health checks can hit the real systems, as long as the load is acceptable.
- **Writing tools are replaced** with ones that record what would have been done, the same idea as [Module 6's dry run](→ Module 6, the actions that mustn't go wrong lesson, the a dry run before the action concept), or that write to a sandboxed copy of the system.

That has a cost in accuracy. After the shadow's first write, its world and the live one diverge: a later read-back sees the sandbox, not the registry. The comparison is exact up to the first write and an approximation after it.

What a shadow run can compare is everything that needs no user, on the same requests the live agent got:

- **The trace metrics** from [the first concept](→ this lesson, the what to watch on every run concept): cost, latency, runs without an answer, checks firing.
- **The reference-free judges** from [the sampled-judge concept](→ this lesson, the judges on a sample concept), on both answers.
- **A judge comparing the two answers directly,** [shown in both orders](→ Module 7, the model graders lesson, the pass/fail, scores and pairs concept, a pair, shown in both orders) to cancel position bias.

Because both versions answer the same requests, the comparison is paired, which [Lesson 9 showed](→ Module 7, the does this piece help? ablations lesson, the one piece on and off concept, why pairing matters) needs far fewer runs to settle than comparing two different sets. What a shadow can't measure is anything that depends on a user seeing the answer: whether they accepted it, asked again, or gave up. And every shadowed request is paid for twice, so teams usually shadow a sample. It's close to [Lesson 2's replay](→ Module 7, the tracing an agent run lesson, the replaying a recorded run concept), with live requests in place of recorded ones.

---

## Canaries: a small share of real users

The workbook defines **canarying** as a partial, time-limited deployment of a change, and its evaluation. The share of the service that gets the change is the **canary**; the rest is the **control**. Comparing the two answers whether the change is safe to roll out further, and the canary's small size limits the harm if it isn't. The workbook's arithmetic: a release that fails 20% of requests, sent to 5% of traffic, costs a 1% error rate overall, a twentieth of the error budget a full release would burn.

Here's that trade on the registry agent. The candidate is the compacting agent from [the alerting concept](→ this lesson, the is this a real change? concept), which ends about 6 points more of its runs without an answer: 9.6% against 3.8%. Each simulated canary lasts 2,000 runs, with a share of them sent to the candidate, and is evaluated once, at the end, with a one-sided test of whether the canary fails more often than the control. A harmless change, the live agent itself, shows how often the test cries wolf:

```python
import random
from math import sqrt


def ended_without_answer(spans: list[Span]) -> bool:
    chats = [span for span in spans if span.attributes.get("gen_ai.operation.name") == "chat"]
    return bool(chats[-1].attributes.get("registry_agent.tool_calls"))


live = [ended_without_answer(spans) for spans in load_traffic("baseline-a") + load_traffic("baseline-b")]
candidate = [ended_without_answer(spans) for spans in load_traffic("compaction-a")]


def worse(canary: list[bool], control: list[bool], z: float = 1.645) -> bool:
    """A one-sided two-proportion z-test: does the canary fail clearly more often than the control?"""
    pooled = (sum(canary) + sum(control)) / (len(canary) + len(control))
    spread = sqrt(pooled * (1 - pooled) * (1 / len(canary) + 1 / len(control)))
    return spread > 0 and (sum(canary) / len(canary) - sum(control) / len(control)) / spread > z
```
*(defined once here and already loaded for both demos in this concept, with this lesson's `load_traffic`)*

```python
rng = random.Random(0)
runs = 2_000
excess = sum(candidate) / len(candidate) - sum(live) / len(live)
print(f"the candidate ends {excess:.1%} more runs without an answer than the live agent\n")
print(f"{'change':<10} {'canary share':>12}  {'canary runs':>11}  {'judged worse':>12}  {'expected extra failures':>23}")
for change, pool, share in (("harmless", live, 0.10), ("candidate", candidate, 0.05),
                            ("candidate", candidate, 0.10), ("candidate", candidate, 0.25)):
    flagged = 0
    for _ in range(300):
        on_canary = [rng.random() < share for _ in range(runs)]
        canary = [rng.choice(pool) for flag in on_canary if flag]
        control = [rng.choice(live) for flag in on_canary if not flag]
        flagged += worse(canary, control)
    extra = round(share * runs * excess) if pool is candidate else 0
    print(f"{change:<10} {share:>12.0%}  {round(share * runs):>11}  {flagged / 300:>12.0%}  {extra:>23}")
print(f"{'candidate':<10} {'everyone':>12}  {runs:>11}  {'no control':>12}  {round(runs * excess):>23}")
```
```
the candidate ends 5.8% more runs without an answer than the live agent

change     canary share  canary runs  judged worse  expected extra failures
harmless            10%          200            5%                        0
candidate            5%          100           80%                        6
candidate           10%          200           96%                       12
candidate           25%          500          100%                       29
candidate      everyone         2000    no control                      117
```
*(runs live, shows output — read-only demo snippet, not graded; simulated: canary runs drawn from the compacting agent's recorded runs, control runs from the baseline's, 300 canaries per row; "expected extra failures" is the canary's runs times the candidate's excess failure rate)*

- **A small canary catches a clear regression.** With 10% of traffic, 200 canary runs judged the candidate worse 96% of the time, at a cost of about 12 extra failed runs. Shipping to everyone would have cost about 117 over the same 2,000 runs.
- **The size is a trade.** At 5%, the canary is cheaper but missed the regression one time in five; at 25%, it never missed but cost 29 failures. The workbook makes the same point: big enough to be representative, small enough to limit the damage.
- **The test's false alarms are set by its level.** The harmless change was judged worse 5% of the time, as a one-sided test at this level allows. That's per evaluation: checking the test after every run and stopping at the first "worse" raises it a great deal, which is part of the next concept.

The workbook adds three practical rules that carry over directly:

- **Choose few metrics, starting from what users feel.** Its advice is to start from the SLIs, rank metrics by how well they indicate a problem users would notice, and use a handful, perhaps up to a dozen. Every extra metric adds false alarms, and a canary process that cries wolf gets ignored.
- **Break every metric down by version.** Overall, a 10% canary's harm is diluted to a tenth. Comparing canary with control needs each run tagged with the version that served it, which is what [the configuration hash on every root span](→ Module 7, the tracing an agent run lesson, the what this course adds to a trace concept) is for.
- **Go in stages.** Start small, judged on the clearest symptoms, such as runs without an answer; widen in steps, adding metrics that need more runs to read, such as judged quality and cost.

One more rule matters more for agents than for most services: a conversation must stay on one version. The workbook notes that two requests from one client can land on different sides, with the first changing what the second does. For an agent, a conversation that starts on the canary and continues on the control mixes the two versions in one run. The split has to be by conversation or by user, not by request, which is the next concept's starting point.

---

## Why not just compare before and after?

The simplest evaluation is to ship to everyone and compare this week with last week. The workbook warns against it: time is one of the biggest sources of change in any metric, so a before/after comparison can't tell the change apart from everything else that changed with the calendar. [The alerting concept](→ this lesson, the is this a real change? concept) got away with a before/after stream only because it held the mix of requests fixed. Here's what happens when the mix moves in the same week, using [the email shift from the previous concept](→ this lesson, the when what people ask changes concept, a shift arrives) and a change that does nothing at all: the baseline's second batch, the same agent with the same settings, standing in for the "new version":

```python
mix_runs = json.loads((MONITORING / "question-mix.json").read_text(encoding="utf-8"))["runs"]
pools = {"a": {}, "b": {}}
for run in mix_runs:
    batch = run["trial_id"].split("/")[0][-1]
    pools[batch].setdefault(run["category"], []).append(not run["passed"])
before_mix = {name: sum(run["category"] == name for run in mix_runs) / len(mix_runs) for name in pools["a"]}
after_mix = dict(before_mix, email=before_mix["email"] * 4)
after_mix = {name: share / sum(after_mix.values()) for name, share in after_mix.items()}


def draw(mix: dict[str, float], batch: str, n: int, rng: random.Random) -> list[bool]:
    """n simulated runs' failures: a category from the mix, then a recorded run of that category from one batch."""
    names = list(mix)
    return [rng.choice(pools[batch][name]) for name in rng.choices(names, weights=[mix[x] for x in names], k=n)]


rng = random.Random(0)
before_after = canary_control = 0
for _ in range(300):
    # before/after: last week's runs against this week's, with the new version everywhere
    before = draw(before_mix, "a", 2_000, rng)
    after = draw(after_mix, "b", 2_000, rng)
    before_after += worse(after, before)
    # canary/control: this week only, 10% of runs on the new version
    canary_control += worse(draw(after_mix, "b", 200, rng), draw(after_mix, "a", 1_800, rng))
print("a change that does nothing ships in the same week emails become four times as common")
print(f"  before/after judged it worse in   {before_after / 300:.0%} of 300 simulated weeks")
print(f"  canary/control judged it worse in {canary_control / 300:.0%}")
```
```
a change that does nothing ships in the same week emails become four times as common
  before/after judged it worse in   74% of 300 simulated weeks
  canary/control judged it worse in 2%
```
*(runs live, shows output — read-only demo snippet, not graded; simulated: runs drawn by category from the baseline's two recorded batches, using their offline grades as the failure measure)*

The before/after comparison blamed a change that does nothing in about three weeks out of four, because emails, the agent's weakest category, became more common in the same week. The canary and its control saw the same week's traffic, so the shift fell on both sides equally, and the comparison stayed quiet. Comparing at the same time is what makes the difference attributable to the change.

---

## Getting back

A canary is only as safe as the way back from it. Two things make rolling back quick:

- **Knowing exactly what the last good version was.** [Pinning the model and prompt versions](→ Module 6, the fallbacks and graceful degradation lesson, the pinning model and prompt versions concept) and recording them on every run make "go back to what worked" a specific configuration, the same one [Lesson 10's last known-good run](→ Module 7, the regression testing lesson, the what changed, and the last known-good run concept) is measured against.
- **Switching a change off without a new release.** The workbook recommends feature flags, so that each change can be enabled or disabled on its own. For an agent, the prompt version, the model, each check and each new tool can sit behind its own flag, and a bad canary can be turned off in seconds.

Rolling back the agent doesn't roll back what the agent did. Changes the canary made in the world, moved models and sent emails, stay made. Undoing them is [compensation, as Module 6 built it](→ Module 6, the actions that mustn't go wrong lesson, the compensating when a later step fails concept), which is one more reason to start a canary small.

---

## Quiz cards

> **Q1.** A shadow copy of the registry agent is set up to answer live requests alongside the real agent. What has to change about its tools?
> - Writing tools are swapped for recording or sandboxed ones ✅
> - Nothing, since the shadow's answers are never shown to any user
> - Every tool is removed, so the shadow can only answer from memory
> - Read-only tools are swapped for ones that return recorded results
>
> *Explanation: Hiding the shadow's answers doesn't stop its actions: a shadow calling the real set_model is a second agent changing the registry. Reads can go through to the real systems; writes must be recorded or sandboxed. Removing tools or faking reads would make the shadow a different agent from the one being tested.*

> **Q2.** What can a shadow run measure that a canary can't?
> - Both versions' behaviour on exactly the same requests ✅
> - Whether users accept the new version's answers more often
> - How much the change costs users when the new version fails
> - Whether the change is safe to send to all of the traffic
>
> *Explanation: A shadow answers the same requests as the live agent, so every comparison is paired. A canary splits users, so its two sides see different requests. User acceptance and real harm need users to see the answers, which only a canary gives, and neither alone proves a change is safe for everyone.*

> **Q3.** A 10% canary of a version that fails 6 points more of its runs lasts 2,000 runs. Roughly how many extra failures do users see?
> - About 12, against about 117 if everyone got the change ✅
> - About 117, since the canary still runs for all 2,000 runs
> - None, since the canary is stopped as soon as it's judged worse
> - About 6, since only half of the canary's users would notice
>
> *Explanation: Only the canary's 200 runs get the new version, and 6% of those is about 12. A full rollout exposes all 2,000. This canary is evaluated at the end, so it runs its course; and every extra failure is a run that ended without an answer, noticed or not.*

> **Q4.** A harmless change was judged worse in 5% of simulated canaries. What's the explanation?
> - The test's level allows that many false alarms per evaluation ✅
> - The harmless change was in fact slightly worse than the live agent
> - The canary of 200 runs was too small to give any verdict at all
> - The control's runs were drawn from a different mix of requests
>
> *Explanation: A one-sided test at this level judges a change that does nothing "worse" about one time in twenty, by design. In the simulation the harmless change is the live agent itself, drawn from the same runs, so it can't be worse. Checking repeatedly during the canary would raise the rate further.*

> **Q5.** A change ships to everyone the same week emails become four times as common, and the pass rate falls. Why is the comparison with last week unreliable?
> - The traffic changed too; before/after can't separate them ✅
> - Last week's runs are too old to be compared with this week's
> - A week holds too few runs for the pass rate to be measured
> - Pass rates only fall when a change makes the agent worse
>
> *Explanation: In the simulation, a change that does nothing was blamed in about three weeks out of four, because the agent's weakest category grew in the same week. A canary and its control share the same week's traffic, so a shift lands on both, which is why the canary stayed quiet.*

> **Q6.** A bad canary moved three agents to the wrong model before it was rolled back. What does rolling back fix?
> - Only the agent: the moved models stay moved until undone ✅
> - Everything, since rollback restores the system as it was
> - Nothing, since the canary's changes were already made
> - Only the models, since a rollback replays the agent's log
>
> *Explanation: Rollback returns the agent to its last good version; it doesn't reach into the registry. The canary's actions need compensating, as Module 6 built: a step that undoes each one. Rolling back still matters, since it stops more wrong actions.*
