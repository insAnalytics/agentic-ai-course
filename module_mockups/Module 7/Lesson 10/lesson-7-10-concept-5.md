# Module 7, Lesson 10 — Concept 5: Keeping it affordable, and running it with every change

> **Note for the site build:**
> - `scripts/eval/run_settings.py` (updated, in the zip with this file) adds two sections to `settings.json`, kept apart from the settings so concept 1's comparisons are unchanged: `costs` (each run's wall time, trials and tokens) and `judge_costs` (each revised-judge pass). Run it, check the output matches the copy in the zip, and commit both; concepts 1 and 4 give the same output with the new file.
> - Both demos start from the setup block below, which reads `/data/eval/main/settings.json` and `/data/eval/ablations/results.json`; add it to `evalData.ts` as `LOAD_COSTS`.

---

## Like tests, but not quite

[Module 0's tests](→ Module 0, the testing fastapi applications lesson) run on every change, in seconds, and either pass or fail. An agent's regression suite wants the same habit and can't have the same properties: it costs model calls, takes minutes, and its results vary from run to run. Anthropic's guide to agent evals frames the two jobs a suite does. **Capability evals** ask what the agent can do, and are expected to fail often while it improves. **Regression evals** ask whether it still does what it used to, and should almost always pass; as a capability becomes reliable, its tasks move from the first kind to the second. The guide also notes what comes free once a static set of tasks exists: latency, token usage, cost per task and error rates can all be tracked on it.

This module's runs record exactly those, so the cost of running the suite can be read off them rather than guessed:

```python
import json
from pathlib import Path

recorded = json.loads(Path("/data/eval/main/settings.json").read_text(encoding="utf-8"))
results = json.loads(Path("/data/eval/ablations/results.json").read_text(encoding="utf-8"))
```
*(defined once here and already loaded for both demos on this page)*

```python
print("agent runs: trials, wall time, tokens per trial")
for name in ("baseline-a", "suite-2a-a", "layers-a", "compaction-a", "fp8-a"):
    c = recorded["costs"][name]
    print(f"  {name:<13} {c['trials']:>4} trials in {c['wall_seconds']:>5.0f}s   "
          f"{c['prompt_tokens'] / c['trials']:>6.0f} prompt + {c['generated_tokens'] / c['trials']:>4.0f} generated tokens")
print("judge passes: items, wall time, tokens per item")
for name, c in recorded["judge_costs"].items():
    print(f"  {c['items']:>5} items in {c['wall_seconds']:>4.0f}s   "
          f"{c['prompt_tokens'] / c['items']:>4.0f} prompt + {c['completion_tokens'] / c['items']:>3.0f} generated tokens")
```
```
agent runs: trials, wall time, tokens per trial
  baseline-a     480 trials in   161s     8545 prompt +  708 generated tokens
  suite-2a-a     145 trials in    52s     8738 prompt +  642 generated tokens
  layers-a       480 trials in   172s     9423 prompt +  763 generated tokens
  compaction-a   480 trials in   248s     9856 prompt + 1051 generated tokens
  fp8-a          480 trials in   130s     8529 prompt +  681 generated tokens
judge passes: items, wall time, tokens per item
   2025 items in  122s    362 prompt +  32 generated tokens
   2025 items in  127s    372 prompt +  33 generated tokens
   3092 items in  215s    651 prompt +  32 generated tokens
```
*(runs live, shows output — read-only demo snippet, not graded; agent runs on one NVIDIA RTX PRO 6000 Blackwell GPU with 48 trials in parallel; judge passes with Gemma 4 31B on the same GPU)*

The whole suite, 625 trials, takes under four minutes of GPU time, and a judging pass about two more. That's cheap because the agent is a 4B model on a local GPU. The tokens are the portable measure: about 9,000 prompt tokens and 700 generated per trial, so a full run is around six million tokens, which on a paid API is the number that sets the bill. The table also shows that cost is itself something a change can move: forced compaction made each trial longer and more expensive, and FP8 serving made the run faster.

---

## Tiers

The answer to "run it on every change" is not to run everything on every change. A common arrangement, and the one this module's data supports:

```python
main, suite = recorded["costs"]["baseline-a"], recorded["costs"]["suite-2a-a"]
seconds_per_trial = (main["wall_seconds"] + suite["wall_seconds"]) / (main["trials"] + suite["trials"])
judge = recorded["judge_costs"]["gemma-v2-prompt-v2-a+prompt-v2-suite-a+layers-v2-a+layers-v2-suite-a+fp8-a+fp8-suite-a"]
judge_per_item = judge["wall_seconds"] / judge["items"]
code_only = [t for t, info in results["tasks"].items() if info["group"] != "question"]
tiers = {
    "every change: registry and suite tasks, 5 trials, no judges": (len(code_only) * 5, 0),
    "before a release: every task, 5 trials, every judge": (len(results["tasks"]) * 5, judge["items"] / 6 * 2),
    "a flagged task confirmed: 3 tasks, 20 trials each": (3 * 20, 0),
}
for tier, (trials, judge_items) in tiers.items():
    minutes = (trials * seconds_per_trial + judge_items * judge_per_item) / 60
    print(f"{tier:<58} {trials:>4} trials, {judge_items:>4.0f} judge items: about {minutes:.1f} GPU minutes")
```
```
every change: registry and suite tasks, 5 trials, no judges  335 trials,    0 judge items: about 1.9 GPU minutes
before a release: every task, 5 trials, every judge         625 trials,  675 judge items: about 4.3 GPU minutes
a flagged task confirmed: 3 tasks, 20 trials each            60 trials,    0 judge items: about 0.3 GPU minutes
```
*(runs live, shows output — illustrative: the minutes scale each tier's trials by the measured time per trial of the baseline's runs, which assumes the GPU stays as busy for a small tier as for the full suite; small tiers run less efficiently than this)*

- **On every change: the tasks code can grade.** The 67 registry and suite tasks, all but one of which have code checks, at five trials, with no judges. It catches broken tools, lost writes, wrong emails and step-limit blowups in a couple of minutes, which is the kind of failure most changes cause.
- **Before a release: everything.** Every task, five trials, every judge, and the gate from concept 2 on the result.
- **When a task is flagged: confirm it.** Rerun only the flagged tasks with many more trials, as concept 3 found five trials can't settle a single task.
- **When only the graders change: don't rerun the agent at all.** A new check or a revised rubric needs the recorded runs graded again, not new runs. Because every run here replays exactly, regrading every trial of every condition in this lesson took about two seconds on one CPU core. Only a judge rubric change costs model calls, and those are the judge's, not the agent's.

Two more habits keep the suite worth its cost:

- **Retire what never fails, carefully.** Tasks that pass every trial of every run cost the same as the rest and tell you only that nothing broke. They belong in the regression tier, not removed: a task that always passes is exactly the one that notices when something breaks it.
- **Keep the held-out tasks held out.** Tuning a change until the gate passes is tuning to the suite, as [Lesson 4](→ Module 7, the building a task suite lesson, the holding tasks out, and tuning to the suite concept) warned. The held-out tasks are for the last check before a release, not for every iteration.

---

## Quiz cards

> **Q1.** How do regression evals differ from capability evals?
> - They check nothing broke ✅
> - They measure what the agent can newly do
> - They are always graded by a model
> - They only run before a release
>
> *Explanation: Capability evals measure what the agent can do and are expected to fail often while it improves. Regression evals check it still does what it used to, and should almost always pass.*

> **Q2.** Why are tokens a better measure of a suite's cost than this module's GPU minutes?
> - They carry over to a paid API ✅
> - GPU minutes can't be measured exactly
> - Tokens don't change between runs
> - Judges don't use any tokens
>
> *Explanation: A 4B model on a local GPU makes the suite look cheap in minutes. Tokens per trial, about 9,000 in and 700 out here, are what a paid API charges for, so they say what the same suite would cost elsewhere.*

> **Q3.** A judge's rubric is revised. What has to be rerun?
> - Only the judge, on the recorded runs ✅
> - The whole suite, agent and judges
> - The agent's runs, but not the judge
> - Nothing, since the agent didn't change
>
> *Explanation: The agent's behaviour didn't change, so its recorded runs still stand. Only the new rubric has to be applied, which costs judge calls but no agent calls.*

> **Q4.** Why does the every-change tier use only the tasks code can grade?
> - It's fast and needs no judge ✅
> - Code checks are always more accurate
> - Question tasks never regress
> - Judges can't run on every change
>
> *Explanation: Code checks cost nothing to run and catch the most common breakages from a change. Judges add model calls and minutes, which belong to the release tier.*

> **Q5.** A task has passed every trial of every run so far. What should happen to it?
> - Keep it in the regression tier ✅
> - Remove it, since it adds nothing
> - Move it to the held-out set
> - Run it with more trials instead
>
> *Explanation: A task that always passes is exactly the one that will notice when a change breaks it. It stops measuring improvement, but it keeps guarding against regression.*
