# Module 6, Lesson 8 — Concept 4: Pinning model and prompt versions

> **Note for the site build:** the first demo reads `/data/reliability/runs/plain.json`, a file
> already served for Lessons 1 and 5.

---

## The same name, a different model

Everything this module has measured, the pass^k figures, the checks' catch
rates, the voting results, describes one model on one prompt. Change either,
and the numbers may no longer hold. A change can happen without anyone on the
team touching the code.

Chen, Zaharia and Zou,
[*How Is ChatGPT's Behavior Changing over Time?*](https://arxiv.org/abs/2307.09009)
(Harvard Data Science Review, 2024), compared the March and June 2023 versions
of GPT-4, both served under the same product name. On a task of telling prime
numbers from composite ones, accuracy fell from 84% to 51%. Some tasks got
better, others worse, and the authors found evidence that GPT-4's ability to
follow user instructions had declined, one common thread behind the shifts.
Their conclusion was that the same model service can change substantially in
a short time, and needs monitoring.

For an agent, the lesson is to know exactly which model and which prompt
produced each result, and to change them only on purpose.

---

## What a model name actually pins

Model names don't all behave the same way, and the only reliable source is
the provider's own documentation:

- **Some names are fixed.** Anthropic's
  [models documentation](https://platform.claude.com/docs/en/about-claude/models/overview)
  says every Claude model ID is a pinned snapshot: an ID doesn't change what
  it points to, and an updated model ships under a new ID. For older
  generations, it also lists short aliases that are convenience pointers,
  resolving to a dated model ID.
- **Some names float on purpose.** OpenRouter's
  [`~author/family-latest` names](https://openrouter.ai/docs/guides/routing/routers/latest-resolution)
  move to each new release in a family automatically, and its documentation
  warns that the version can change at any time.
- **Open-weight models are pinned by commit.** A model loaded from a
  repository by name alone gets whatever the repository holds that day.
  Loading libraries and serving engines take a revision, a specific commit,
  to fix it.

Floating names have their uses: a prototype that should always get the newest
model. For an agent whose reliability has been measured, the name in the
configuration should be one that can't change underneath it.

---

## Record what actually answered

Pinning in the configuration isn't the whole job; the record of each run
should say what was used. Here's what this module's own runs stored:

```python
import hashlib
import json
from pathlib import Path

run = json.loads(Path("/data/reliability/runs/plain.json").read_text(encoding="utf-8"))
prompt = json.dumps({"system": run["system"], "instructions": run["instructions"]}, sort_keys=True)
print("model:          ", run["model"])
print("revision asked: ", run["revision"])
print("commit used:    ", run["setup"]["model_commit"])
print("engine:         ", run["setup"]["engine"], run["setup"]["engine_version"], "|", run["setup"]["dtype"])
print("sampling:       ", run["sampling"])
print("question set:    set E version", run["set_e_version"])
print("prompt hash:    ", hashlib.sha256(prompt.encode()).hexdigest()[:12])
```
```
model:           Qwen/Qwen3.5-4B
revision asked:  None
commit used:     851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a
engine:          vllm 0.30.0 | bfloat16
sampling:        {'temperature': 0.7, 'top_p': 0.8, 'top_k': 20, 'min_p': 0.0, 'presence_penalty': 1.5}
question set:    set E version 2
prompt hash:     c1a5578f570f
```
*(runs live, shows output — read-only demo snippet, not graded. Read from
the committed run file for Qwen3.5-4B.)*

These runs didn't ask for a particular revision, which is the gap the
previous section warns about: rerun later, the same repository name could
load different weights. But the generation script recorded the commit that
was actually loaded, so the results can still be tied to exact weights, and a
rerun can ask for that commit. Alongside it: the serving engine and its
version, the numeric precision, the sampling settings, the version of the
question set, and a hash of the prompt.

The prompt deserves the same care as the model.
[Lesson 1](→ this module, why agents fail lesson, reliable across wordings concept)
showed a single rewording changing a model's answers, and a system prompt or
tool description edited in passing is the same kind of change. Keeping
prompts and tool definitions in version control, and storing a hash of them
with every run, makes "what did the model see?" answerable later.

The same applies at run time with a hosted model: the response names the
model that answered. Anthropic's Messages API returns it in the response's
`model` field, and OpenRouter returns the model a floating name resolved to.
Storing that next to the name that was asked for shows immediately when the
two differ.

Using these records to catch a regression when a version does change, by
rerunning the evaluations and comparing, is Module 7's subject.

---

## Applied sandbox exercise
*(graded — a record of which model and configuration produced a run)*

**Task shown to learner:** Write `record_run(requested, answered,
system_prompt, tools)`. Return `{"requested", "answered", "config_hash",
"model_changed"}`:

- `"config_hash"`: the first 12 hex characters of the SHA-256 of
  `json.dumps({"system": system_prompt, "tools": tools}, sort_keys=True,
  separators=(",", ":"))`, encoded as UTF-8
- `"model_changed"`: whether the model that answered differs from the one
  requested

**Starter code:**
```python
import hashlib
import json


def record_run(requested: str, answered: str, system_prompt: str, tools: list[dict]) -> dict:
    """What to store with every run: the model asked for, the model that answered, and a short hash of
    the prompt and tool definitions, the same whatever order a dict's keys were written in."""
    ...



tools = [{"name": "get_agent", "description": "Look up an agent", "input_schema": {"type": "object"}}]
print(record_run("~provider/model-latest", "provider/model-2026-09-15", "You manage the registry.", tools))
```

**Hidden tests:**
```python
tools = [{"name": "get_agent", "description": "Look up an agent", "input_schema": {"type": "object"}}]
same_tools_reordered = [{"input_schema": {"type": "object"}, "description": "Look up an agent", "name": "get_agent"}]

r = record_run("model-a-2026-06-01", "model-a-2026-06-01", "You manage the registry.", tools)
assert isinstance(r, dict) and set(r) == {"requested", "answered", "config_hash", "model_changed"}, (
    "return requested, answered, config_hash and model_changed")
assert r["model_changed"] is False, "the model that answered is the one asked for"
assert isinstance(r["config_hash"], str) and len(r["config_hash"]) == 12, "config_hash: the first 12 hex characters"

assert record_run("m", "m", "You manage the registry.", same_tools_reordered)["config_hash"] == r["config_hash"], (
    "the same tool definitions with their keys in another order are the same config: hash them with sorted keys")
assert record_run("m", "m", "You manage the registry!", tools)["config_hash"] != r["config_hash"], (
    "any change to the system prompt, even one character, must change the hash")
assert record_run("m", "m", "You manage the registry.", tools + [{"name": "notify"}])["config_hash"] != r["config_hash"], (
    "adding a tool changes the config, so it must change the hash")

swapped = [{"name": "notify"}, tools[0]]
assert record_run("m", "m", "x", swapped)["config_hash"] != record_run("m", "m", "x", [tools[0], {"name": "notify"}])["config_hash"], (
    "the order of the tools list is part of what the model sees; don't sort the list itself")

r = record_run("model-a-latest", "model-a-2026-09-15", "You manage the registry.", tools)
assert r["model_changed"] is True and r["answered"] == "model-a-2026-09-15", (
    f"got {r}: a floating name resolved to a specific model; record both, and flag that they differ")

import hashlib, json
expected = hashlib.sha256(json.dumps({"system": "p", "tools": []}, sort_keys=True, separators=(",", ":")).encode()).hexdigest()[:12]
assert record_run("m", "m", "p", [])["config_hash"] == expected, (
    "hash json.dumps({'system': ..., 'tools': ...}, sort_keys=True, separators=(',', ':')) with SHA-256")
```

**Hint (shown on request):** `sort_keys=True` makes the hash the same however
a dict's keys were written, and `hashlib.sha256(text.encode("utf-8")).hexdigest()`
gives the hash. The tools list keeps its order: that's part of what the model
sees.

**Reference solution:**
```python
import hashlib
import json


def record_run(requested: str, answered: str, system_prompt: str, tools: list[dict]) -> dict:
    """What to store with every run: the model asked for, the model that answered, and a short hash of
    the prompt and tool definitions, the same whatever order a dict's keys were written in."""
    config = json.dumps({"system": system_prompt, "tools": tools}, sort_keys=True, separators=(",", ":"))
    return {"requested": requested, "answered": answered,
            "config_hash": hashlib.sha256(config.encode("utf-8")).hexdigest()[:12],
            "model_changed": requested != answered}
```
```
{'requested': '~provider/model-latest', 'answered': 'provider/model-2026-09-15', 'config_hash': '976b40ae6a24', 'model_changed': True}
```
*(the starter's printout, with the reference in place)*

**Explanation:** Serializing with sorted keys and fixed separators makes the
hash depend only on content: two tool definitions with the same fields in a
different order are the same configuration, and any real change, one
character in the prompt or one added tool, gives a different hash. Python's
built-in `hash()` would not do, since it's randomized for strings between
runs. The list of tools isn't sorted, because the order the model sees them
in can change its behaviour. And recording both model names turns a floating
name that resolved to something new into a visible flag instead of a
mystery.

---

## Quiz cards

> **Q1.** What did Chen, Zaharia and Zou find when they compared the March
> and June 2023 versions of GPT-4?
> - A) The two versions behaved almost identically
> - B) Behaviour shifted a lot: one task fell from 84% to 51% ✅
> - C) Every task they measured got better in June
> - D) The June version refused to answer any questions
>
> *Explanation: the same product name served models that behaved quite
> differently a few months apart. Some tasks improved, others got worse.*

> **Q2.** An agent's configuration names a model with a floating "latest"
> alias. What's the risk?
> - A) A floating alias always costs more per token
> - B) The model can change with no change to the agent ✅
> - C) Floating aliases are slower to respond
> - D) There's no risk, since newer models are better
>
> *Explanation: the reliability figures describe one model. A name that moves
> to a new release changes the model without anyone deciding to.*

> **Q3.** This module's runs asked for no particular model revision. Why can
> their results still be tied to exact weights?
> - A) Because an open model's weights never change
> - B) The run recorded the commit that was loaded ✅
> - C) Because the prompt hash identifies the model too
> - D) Because vLLM always loads the same weights
>
> *Explanation: recording what was used makes a run reproducible even when
> the request wasn't pinned. A rerun can ask for that commit.*

> **Q4.** Why hash the prompt and tool definitions with sorted keys?
> - A) Because sorting makes the hash shorter
> - B) So the same content always gives the same hash ✅
> - C) Because JSON requires its keys to be sorted
> - D) So the tools are shown to the model in order
>
> *Explanation: key order in a dict is incidental; content isn't. A hash that
> changes with key order would flag changes that aren't changes.*

---

*(End of this concept, and the last in this lesson. The recap page brings
the lesson together.)*
