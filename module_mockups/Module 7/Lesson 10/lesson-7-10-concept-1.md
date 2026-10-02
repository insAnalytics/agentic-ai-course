# Module 7, Lesson 10 — Concept 1: What changed, and the last known-good run

> **Note for the site build:**
> - New script `scripts/eval/run_settings.py` (in the zip with this file) writes `public/data/eval/main/settings.json`: every main run's recorded settings, without its trials. Run it, check the output matches the copy in the zip, and commit both. It already includes phase 6's three runs.
> - Add the setup block to `evalData.ts` as `LOAD_SETTINGS`, byte-identical; this lesson's demos start from it. The second demo needs the exercise's reference `what_changed` loaded without showing it.

---

## Why a suite gets run again

[Module 6 pinned the agent's model and prompt versions](→ Module 6, the fallbacks and graceful degradation lesson, the pinning model and prompt versions concept, what a model name actually pins), and was clear about the limit: a fixed model ID pins the weights, not everything around them. Anthropic's own postmortem of September 2025 described infrastructure bugs that degraded some responses while the model IDs stayed the same. Pinning tells you what you asked for; only re-running an evaluation tells you what you got. That's a **regression test**: run the suite again whenever something the agent depends on changes, and compare with the last run you trusted.

Things that should trigger a rerun, all of them changes this module could make:

- **The prompt:** any edit to the system prompt or a tool description.
- **The model:** a new pinned version, or the same version served differently, such as quantized or on a new inference engine.
- **The tools:** a new tool, a changed argument, a different error message.
- **Retrieval:** the corpus, the chunking, the search settings.
- **The checks around the agent:** like Module 6's layers.
- **The suite itself:** new tasks, changed checks, a revised judge rubric.

The comparison needs a **last known-good run**: a run whose results someone has read and accepted, recorded with every setting that produced it. A new run is compared against that one, not against memory or a number in a slide.

---

## A fingerprint that misses things

Every run in this module records a config hash: [Module 6's fingerprint](→ Module 6, the fallbacks and graceful degradation lesson, the pinning model and prompt versions concept, record what actually answered) of the system prompt and the tool definitions. Here it is for every main run so far:

```python
import json
from pathlib import Path

settings = json.loads(Path("/data/eval/main/settings.json").read_text(encoding="utf-8"))["runs"]
```
*(defined once here and already loaded for every demo in this lesson)*

```python
for name, run in settings.items():
    print(f"{name:<19} config hash {run['config_hash']}   variant {run['variant']:<11} tasks {run['tasks_file']['path']}")
```
```
baseline-a          config hash e174d8c051e2   variant none        tasks scripts/eval/tasks/main.json
baseline-b          config hash e174d8c051e2   variant none        tasks scripts/eval/tasks/main.json
compaction-a        config hash e174d8c051e2   variant compaction  tasks scripts/eval/tasks/main.json
compaction-suite-a  config hash e174d8c051e2   variant compaction  tasks scripts/eval/tasks/suite-2a.json
fp8-a               config hash e174d8c051e2   variant none        tasks scripts/eval/tasks/main.json
fp8-suite-a         config hash e174d8c051e2   variant none        tasks scripts/eval/tasks/suite-2a.json
layers-a            config hash e174d8c051e2   variant layers      tasks scripts/eval/tasks/main.json
layers-suite-a      config hash e174d8c051e2   variant layers      tasks scripts/eval/tasks/suite-2a.json
layers-v2-a         config hash e174d8c051e2   variant layers-v2   tasks scripts/eval/tasks/main.json
layers-v2-suite-a   config hash e174d8c051e2   variant layers-v2   tasks scripts/eval/tasks/suite-2a.json
no-labels-a         config hash e174d8c051e2   variant no-labels   tasks scripts/eval/tasks/main.json
no-labels-suite-a   config hash e174d8c051e2   variant no-labels   tasks scripts/eval/tasks/suite-2a.json
prompt-v2-a         config hash 62debdb77f78   variant none        tasks scripts/eval/tasks/main.json
prompt-v2-suite-a   config hash 62debdb77f78   variant none        tasks scripts/eval/tasks/suite-2a.json
suite-2a-a          config hash e174d8c051e2   variant none        tasks scripts/eval/tasks/suite-2a.json
```
*(runs live, shows output — read-only demo snippet, not graded)*

Every run but one has the same hash, including the ones where Module 6's layers withheld six answers in ten and the one served in FP8. Only the prompt change moved it. The hash covers what it was built to cover, the prompt and the tools, and nothing else: not the checks around the loop, not how the model is served, not which task file graded it. A regression test needs the full list of settings, compared one by one.

---

## Applied sandbox exercise
*(graded — every setting that differs between two runs)*

**Task shown to learner:**

Write `what_changed(a, b, ignore=(), prefix="")`. `a` and `b` are two runs' recorded settings, as nested dicts. Return `{"dotted.key": (a's value, b's value)}` for every setting that differs, in sorted key order:

- **When both values are dicts,** compare them key by key, naming nested keys with dots (`"serving.quantization"`).
- **A key only one side has** counts as `None` on the other.
- **Keys in `ignore`,** written dotted, are skipped.

**Starter code:**
```python
def what_changed(a: dict, b: dict, ignore: tuple = (), prefix: str = "") -> dict:
    """Every setting that differs between two runs' recorded settings, as {dotted.key: (a's value, b's value)}.
    Nested settings are compared key by key; a key one side lacks counts as None there. Keys in `ignore` (dotted)
    are skipped."""
    # your code here


print(what_changed({"model": "m", "sampling": {"temperature": 0.7, "top_p": 0.8}},
                   {"model": "m", "sampling": {"temperature": 0.6, "top_p": 0.8}, "variant": "layers"}))
```

**Hidden tests:**
```python
a = {"model": "q", "revision": "r1", "sampling": {"temperature": 0.7, "top_p": 0.8}, "serving": {"quantization": None},
     "tasks_file": {"path": "tasks/main.json", "version": 2}, "gpus": ["A"]}
b = {"model": "q", "revision": "r1", "sampling": {"temperature": 0.7, "top_p": 0.8}, "serving": {"quantization": "fp8"},
     "tasks_file": {"path": "tasks/main.json", "version": 3}, "gpus": ["B"], "variant": "layers"}
got = what_changed(a, b)
assert got is not None, "what_changed should return a dict"
assert got == {"serving.quantization": (None, "fp8"), "tasks_file.version": (2, 3), "gpus": (["A"], ["B"]),
               "variant": (None, "layers")}, f"nested keys are dotted, missing keys are None on that side: got {got}"
assert what_changed(a, a) == {}, "a run compared with itself has no changes"
assert what_changed(a, b, ignore=("gpus", "tasks_file.version")) == {"serving.quantization": (None, "fp8"),
                                                                       "variant": (None, "layers")}, \
    "ignored keys, top-level or dotted, are skipped"
deep = what_changed({"x": {"y": {"z": 1}}}, {"x": {"y": {"z": 2}}})
assert deep == {"x.y.z": (1, 2)}, f"nesting goes all the way down: got {deep}"
mixed = what_changed({"s": {"t": 1}}, {"s": "off"})
assert mixed == {"s": ({"t": 1}, "off")}, f"a dict on one side and a value on the other is one change: got {mixed}"
assert list(what_changed({"b": 1, "a": 1}, {"b": 2, "a": 2})) == ["a", "b"], "changes come in sorted key order"
```

**Hint (shown on request):** Recurse with the dotted prefix so far. `a.keys() | b.keys()` covers keys from either side, and `dict.get` gives `None` for a missing one.

**Reference solution:**
```python
def what_changed(a: dict, b: dict, ignore: tuple = (), prefix: str = "") -> dict:
    """Every setting that differs between two runs' recorded settings, as {dotted.key: (a's value, b's value)}.
    Nested settings are compared key by key; a key one side lacks counts as None there. Keys in `ignore` (dotted)
    are skipped."""
    changes = {}
    for key in sorted(a.keys() | b.keys()):
        name = f"{prefix}{key}"
        if name in ignore:
            continue
        left, right = a.get(key), b.get(key)
        if isinstance(left, dict) and isinstance(right, dict):
            changes.update(what_changed(left, right, ignore, f"{name}."))
        elif left != right:
            changes[name] = (left, right)
    return changes


print(what_changed({"model": "m", "sampling": {"temperature": 0.7, "top_p": 0.8}},
                   {"model": "m", "sampling": {"temperature": 0.6, "top_p": 0.8}, "variant": "layers"}))
```
```
{'sampling.temperature': (0.7, 0.6), 'variant': (None, 'layers')}
```

**Explanation:** Comparing nested settings key by key is what makes the result readable: "sampling.temperature changed from 0.7 to 0.6" says exactly what moved, where comparing whole dicts would only say "sampling changed". Treating a missing key as `None` matters because runs recorded at different times have different fields; this module's own runs gained a variant, a system version and a serving record as the lessons needed them. `ignore` is for settings that can't affect results, such as which GPU a run used, and should be used sparingly: anything left out of the comparison is something a regression could hide behind.

---

## What changed between this module's runs

```python
for a, b in (("baseline-a", "baseline-b"), ("baseline-a", "layers-a"), ("baseline-a", "suite-2a-a")):
    print(f"{a} -> {b}:")
    for key, (before, after) in what_changed(settings[a], settings[b]).items():
        print(f"  {key}: {before!r} -> {after!r}")
```
```
baseline-a -> baseline-b:
baseline-a -> layers-a:
  tasks_file.version: 1 -> 3
  variant: 'none' -> 'layers'
baseline-a -> suite-2a-a:
  tasks_file.path: 'scripts/eval/tasks/main.json' -> 'scripts/eval/tasks/suite-2a.json'
```
*(runs live, shows output — read-only demo snippet, not graded; `what_changed` is the exercise's reference version)*

- **Batches a and b differ in nothing.** That's what made them the noise floor in Lesson 9.
- **The baseline and the suite** differ only in their task file.
- **Between the baseline and the layers run, two things changed, not one.** The variant, which was the point, and the task file's version, from 1 to 3: checks were fixed and references rewritten between phase 1 and phase 5. A comparison that graded each run with the checks of its own day would mix the two changes.

Lesson 9's comparisons were fair because every run, old and new, was graded again with the current checks and judges before comparing. That's a rule for every regression test: **grade the known-good run and the new run with the same graders**, re-grading the old one if the graders have changed. This module can do that cheaply because every run is recorded in full and [replays exactly](→ Module 7, the tracing an agent run lesson, the replaying a recorded run concept): the agent's turns come from the recording, so re-grading costs no model calls.

---

## Quiz cards

> **Q1.** Every run but the prompt change shares one config hash, including the FP8 run. What does that show?
> - It covers only prompt and tools ✅
> - None of the runs changed anything
> - The hash is computed incorrectly
> - The runs all used the same task file
>
> *Explanation: The hash fingerprints the system prompt and tool definitions, so only the prompt change moved it. The layers, the serving setup and the task file all sit outside it, so runs that behaved very differently share one hash.*

> **Q2.** What makes a run a "last known-good run"?
> - Its results were read and accepted ✅
> - It's the most recent run on record
> - It has the highest pass rate so far
> - Its config hash matches the new run's
>
> *Explanation: The reference for a regression test is a run someone has read and trusted, recorded with every setting that produced it, so a new run can be compared setting by setting.*

> **Q3.** Why does what_changed treat a key one run lacks as None, rather than skipping it?
> - Newer runs record fields older ones didn't ✅
> - Missing keys always mean the setting was off
> - Skipping would make the result unsorted
> - None is the default value of every setting
>
> *Explanation: Runs recorded at different times have different fields. Showing a missing key as a change keeps a new setting from being silently left out of the comparison.*

> **Q4.** Between the baseline and the layers run, the task file's version also changed. Why didn't that spoil Lesson 9's comparison?
> - Both were regraded the same way ✅
> - The task file change made no difference
> - The layers run used the old task file
> - Version numbers aren't part of the settings
>
> *Explanation: Grading each run with the checks of its own day would mix the two changes. Regrading the known-good run with the current graders leaves the variant as the only difference.*

> **Q5.** The agent's server starts quantizing the same pinned model. Why should that trigger a rerun?
> - An ID pins weights, not serving ✅
> - Quantization always lowers the pass rate
> - A new model ID is issued for quantized models
> - The config hash changes when serving changes
>
> *Explanation: Module 6 noted responses can change while model IDs stay the same. Only re-running the suite shows whether a serving change moved the results; this module's hash wouldn't even notice it.*
