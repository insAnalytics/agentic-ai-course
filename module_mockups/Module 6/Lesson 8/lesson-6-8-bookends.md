# Module 6, Lesson 8 — Bookends: Fallbacks and graceful degradation

---

## Intro

> **You'll be able to**
> - Fall back to another model when the primary can't answer, on the errors where that can help, and record which model did
> - Give a partial answer that says what's missing, and stop calling a failing dependency with a circuit breaker
> - Pin model and prompt versions, and record what actually produced each run

**Why it matters**
Every agent depends on things it doesn't control: model providers, tool
services, the model a name points to. Retries handle the brief failures. This
lesson is about the longer ones: an outage that outlasts the retries, a
service that's down for the afternoon, a model that changes under the same
name. An agent that degrades well keeps answering, with less, and says so. One
that doesn't either stops entirely or quietly gets worse.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all four concepts, mixed order)*

> **Q1.** The primary model fails with a context-window error. What should
> the agent do?
> - A) Raise the error, since the request must be wrong
> - B) Fall back to a model with a larger context window ✅
> - C) Retry the same model three more times
> - D) Ask the model for a shorter answer instead
>
> *Explanation: the request is valid; this model just can't take it. A model
> with a larger window may, which is why gateways keep separate fallbacks for
> this error.*

> **Q2.** Which failure should never trigger a fallback?
> - A) A 503 from the provider
> - B) A rate limit that retries didn't clear
> - C) A malformed tool schema in the request ✅
> - D) A timeout
>
> *Explanation: every model would refuse a malformed request. Falling back
> hides the bug; raising it gets it fixed.*

> **Q3.** The health service is down and nothing is cached. What should an
> answer about an agent's status include?
> - A) Only the parts that worked, with no mention of the rest
> - B) What worked, and that the health figures are missing ✅
> - C) An estimate of the health figures from earlier runs
> - D) Nothing at all, until every part is available
>
> *Explanation: a partial answer that doesn't say it's partial reads as
> complete. Saying what's missing is what makes it graceful degradation.*

> **Q4.** What does a circuit breaker do once it has tripped?
> - A) Calls the dependency with a longer timeout
> - B) Fails calls at once until a trial succeeds ✅
> - C) Queues calls until the dependency has recovered
> - D) Switches to a different dependency automatically
>
> *Explanation: the breaker saves every caller the timeout, and gives the
> struggling service room. What to do instead is the caller's decision.*

> **Q5.** A value from the cache is an hour old. How should the answer show
> it?
> - A) As the current value, without any comment
> - B) Labelled as the last known value, with its time ✅
> - C) Not at all, since stale values are useless
> - D) Averaged with a guess at the current value
>
> *Explanation: with its time, a reader can judge a stale value. Without it,
> it's a wrong answer that was once right.*

> **Q6.** What did Chen, Zaharia and Zou show about GPT-4 between March and
> June 2023?
> - A) Nothing measurable changed between the two
> - B) It changed a lot under the same name ✅
> - C) Every task they measured improved in June
> - D) Only the price per token changed
>
> *Explanation: the drift is why agents pin exact model versions and record
> which one answered each run.*

> **Q7.** Why hash the prompt and tool definitions with sorted keys?
> - A) Because sorting makes the hash shorter
> - B) So identical content gives an identical hash ✅
> - C) Because models read the keys alphabetically
> - D) To encrypt the prompt before storing it
>
> *Explanation: key order is incidental; content isn't. The hash should
> change only when what the model sees changes.*

---

## Comprehensive sandbox
*(graded — an agent that degrades well, multi-file)*

**Task shown to learner:** `lib.py` holds this lesson's pieces, read-only:
the error classes and `call_with_fallbacks`, `compose_partial`,
`CircuitBreaker`, and `record_run`. In `agent.py` (the entry file), write
`handle(agent, fetchers, breakers, cache, models, call_model, system_prompt)`,
which answers "how is this agent doing?":

1. **For each part** in `fetchers` (a dict of label to a function that fetches
   it), call the fetcher through `breakers[label]`. If it returns, the part is
   ok. If it raises `CircuitOpen` or `ConnectionError`, use the cached
   `(value, as_of)` from `cache` as a stale part if there is one, or else a
   failed part. Any other exception is a bug, and propagates.
2. **Compose** the parts with `compose_partial`, and have the models write the
   answer with `call_with_fallbacks(models, ...)`, calling
   `call_model(model, prompt)` with a prompt of the agent's name, a colon, a
   newline, and the composed text.
3. **Return** `{"answer", "parts", "record"}`, where the record is
   `record_run(models[0], <the model that answered>, system_prompt, [])`.

When you click Run, the code at the bottom handles four requests, one second
apart, while the health service is down and the primary model is unavailable.

**Tab: `lib.py`** (read-only)
```python
"""This lesson's pieces, read-only: fallbacks, partial answers, the circuit breaker and run records."""
import hashlib
import json


class Unavailable(Exception):
    """The provider is down or timed out, after retries."""


class RateLimited(Exception):
    """The provider refused the request for now, after retries."""


class ContextTooLong(Exception):
    """This model can't take a prompt this long; one with a larger window might."""


class BadRequest(Exception):
    """The request itself is wrong; any model would refuse it."""


class AllFailed(Exception):
    def __init__(self, attempts: list):
        super().__init__(f"every model failed: {attempts}")
        self.attempts = attempts


FALL_BACK_ON = (Unavailable, RateLimited, ContextTooLong)


def call_with_fallbacks(models: list[str], call) -> dict:
    """Try each model in order until one answers. Move on only for errors another model might not hit;
    a bad request is raised at once, since every model would refuse it."""
    attempts = []
    for model in models:
        try:
            answer = call(model)
        except FALL_BACK_ON as error:
            attempts.append((model, type(error).__name__))
            continue
        return {"answer": answer, "model": model, "attempts": attempts}
    raise AllFailed(attempts)


def compose_partial(parts: list[dict]) -> str:
    """A status answer from parts that may have failed. Each part has a "label", a "status" ("ok",
    "stale" or "failed"), and for ok and stale parts a "value"; stale parts also have "as_of"."""
    lines, missing = [], []
    for part in parts:
        if part["status"] == "ok":
            lines.append(f"{part['label']}: {part['value']}")
        elif part["status"] == "stale":
            lines.append(f"{part['label']}: {part['value']} (last known, as of {part['as_of']})")
        else:
            missing.append(part["label"])
    if missing and not lines:
        return f"I couldn't get any of this right now: {', '.join(missing)}."
    if missing:
        lines.append(f"Not available right now: {', '.join(missing)}.")
    return "\n".join(lines)


class CircuitOpen(Exception):
    """Raised instead of calling a dependency the breaker has stopped calling."""


class CircuitBreaker:
    """Stop calling a failing dependency for a while. clock() returns the current time in seconds."""

    def __init__(self, threshold: int, reset_after: float, clock, trips_on: tuple = (Exception,)):
        self.threshold, self.reset_after, self.clock, self.trips_on = threshold, reset_after, clock, trips_on
        self.failures = 0
        self.opened_at = None

    @property
    def state(self) -> str:
        if self.opened_at is None:
            return "closed"
        return "half_open" if self.clock() - self.opened_at >= self.reset_after else "open"

    def call(self, fn):
        if self.state == "open":
            raise CircuitOpen(f"not calling: {self.failures} failures, retrying after {self.reset_after} s")
        try:
            result = fn()
        except self.trips_on:
            self.failures += 1
            if self.failures >= self.threshold:
                self.opened_at = self.clock()
            raise
        self.failures = 0
        self.opened_at = None
        return result


def record_run(requested: str, answered: str, system_prompt: str, tools: list[dict]) -> dict:
    """What to store with every run: the model asked for, the model that answered, and a short hash of
    the prompt and tool definitions, the same whatever order a dict's keys were written in."""
    config = json.dumps({"system": system_prompt, "tools": tools}, sort_keys=True, separators=(",", ":"))
    return {"requested": requested, "answered": answered,
            "config_hash": hashlib.sha256(config.encode("utf-8")).hexdigest()[:12],
            "model_changed": requested != answered}
```

**Tab: `agent.py`** (starter, entry file)
```python
from lib import CircuitOpen, call_with_fallbacks, compose_partial, record_run


def handle(agent: str, fetchers: dict, breakers: dict, cache: dict, models: list[str], call_model,
           system_prompt: str) -> dict:
    """Answer "how is <agent> doing?": fetch each part through its breaker, fall back to cached values
    or say what's missing, have the first available model write the answer, and record what was used."""
    ...



if __name__ == "__main__":
    from lib import CircuitBreaker, Unavailable

    now = [0.0]
    health_calls = []

    def registry():
        return "active on claude-sonnet"

    def health():
        health_calls.append(now[0])
        raise ConnectionError("health-service unavailable")

    def call_model(model, prompt):
        if model == "provider-a/large":
            raise Unavailable("503 from provider-a")
        # a stand-in model that restates the facts it was given
        return f"[{model}] " + prompt.replace("\n", " | ")

    breakers = {label: CircuitBreaker(2, 30, lambda: now[0], trips_on=(ConnectionError,)) for label in ("status", "error rate")}
    cache = {"error rate": ("2.3%", "09:40")}
    for second in (0, 1, 2, 3):
        now[0] = second
        out = handle("research_agent", {"status": registry, "error rate": health}, breakers, cache,
                     ["provider-a/large", "provider-b/large"], call_model, "You report agent status.")
        print(f"t={second}s  health breaker: {breakers['error rate'].state:<6}  health calls so far: {len(health_calls)}")
        print(f"   {out['answer']}")
    print("record:", out["record"])
```

**Hidden tests:**
```python
from lib import BadRequest, CircuitBreaker, Unavailable
from agent import handle

now = [0.0]
calls = {"status": 0, "error rate": 0}


def ok(label, value):
    def fetch():
        calls[label] += 1
        return value
    return fetch


def down(label):
    def fetch():
        calls[label] += 1
        raise ConnectionError(f"{label} service unavailable")
    return fetch


prompts = []


def model(fail=()):
    def call_model(name, prompt):
        if name in fail:
            raise Unavailable(f"{name} is down")
        prompts.append(prompt)
        return f"{name} says: {prompt}"
    return call_model


def breakers():
    return {label: CircuitBreaker(2, 30, lambda: now[0], trips_on=(ConnectionError,)) for label in calls}


MODELS = ["primary", "backup"]

out = handle("research_agent", {"status": ok("status", "active"), "error rate": ok("error rate", "1.1%")}, breakers(),
             {}, MODELS, model(), "p")
assert isinstance(out, dict) and set(out) >= {"answer", "parts", "record"}, "return answer, parts and record"
assert [p["status"] for p in out["parts"]] == ["ok", "ok"], f"parts {out['parts']}: both fetches worked"
assert out["answer"].startswith("primary says:") and out["record"]["model_changed"] is False, (
    f"got {out}: the primary model answered, so nothing changed")

prompts.clear()
out = handle("research_agent", {"status": ok("status", "active"), "error rate": down("error rate")}, breakers(),
             {}, MODELS, model(), "p")
assert len(out["parts"]) == 2, (
    f"parts {out['parts']}: every part appears, including the one that failed, so the answer can say it's missing")
assert out["parts"][1] == {"label": "error rate", "status": "failed"}, (
    f"parts {out['parts']}: a failed fetch with nothing cached is a failed part")
assert "Not available right now: error rate." in prompts[-1], (
    f"the model must be told what's missing; it got {prompts[-1]!r}. Pass compose_partial's text to the model")

out = handle("research_agent", {"status": ok("status", "active"), "error rate": down("error rate")}, breakers(),
             {"error rate": ("2.3%", "09:40")}, MODELS, model(), "p")
assert out["parts"][1] == {"label": "error rate", "status": "stale", "value": "2.3%", "as_of": "09:40"}, (
    f"parts {out['parts']}: when the fetch fails and a value is cached, use it as a stale part with its time")

shared = breakers()
calls["error rate"] = 0
for second in range(5):
    now[0] = second
    handle("research_agent", {"status": ok("status", "active"), "error rate": down("error rate")}, shared,
           {"error rate": ("2.3%", "09:40")}, MODELS, model(), "p")
assert calls["error rate"] == 2, (
    f"the health service was called {calls['error rate']} times in 5 requests: fetch through each part's breaker, "
    "so once it trips after 2 failures, the service isn't called again until the breaker's wait is over")

try:
    out = handle("research_agent", {"status": ok("status", "active")}, breakers(), {}, MODELS, model(fail={"primary"}), "p")
except Exception as error:
    raise AssertionError(f"{type(error).__name__}: {error}. Try every model in order with call_with_fallbacks, "
                         "not just the first") from None
assert out["answer"].startswith("backup says:"), f"answer {out['answer']!r}: fall back when the primary is down"
assert out["record"]["requested"] == "primary" and out["record"]["answered"] == "backup" and out["record"]["model_changed"], (
    f"record {out['record']}: record the model asked for and the one that answered")


def bad_model(name, prompt):
    raise BadRequest("malformed request")


try:
    handle("research_agent", {"status": ok("status", "active")}, breakers(), {}, MODELS, bad_model, "p")
    raised = None
except Exception as error:
    raised = error
assert isinstance(raised, BadRequest), f"got {raised!r}: a bad request isn't something to hide or fall back on"


def buggy():
    raise KeyError("status")


try:
    handle("research_agent", {"status": buggy}, breakers(), {}, MODELS, model(), "p")
    raised = None
except Exception as error:
    raised = error
assert isinstance(raised, KeyError), (
    f"got {raised!r}: only a dependency being down (CircuitOpen, ConnectionError) is a missing part; a bug in "
    "a fetcher should surface, not be reported as 'not available'")
```

**Hint (shown on request):** Build `parts` in one loop, with a `try` around
`breakers[label].call(fetch)` and an `except (CircuitOpen, ConnectionError)`.
Then one call each to `compose_partial`, `call_with_fallbacks` and
`record_run`.

**Reference solution:**

**Tab: `agent.py`**
```python
from lib import CircuitOpen, call_with_fallbacks, compose_partial, record_run


def handle(agent: str, fetchers: dict, breakers: dict, cache: dict, models: list[str], call_model,
           system_prompt: str) -> dict:
    """Answer "how is <agent> doing?": fetch each part through its breaker, fall back to cached values
    or say what's missing, have the first available model write the answer, and record what was used."""
    parts = []
    for label, fetch in fetchers.items():
        try:
            parts.append({"label": label, "status": "ok", "value": breakers[label].call(fetch)})
        except (CircuitOpen, ConnectionError):
            if label in cache:
                value, as_of = cache[label]
                parts.append({"label": label, "status": "stale", "value": value, "as_of": as_of})
            else:
                parts.append({"label": label, "status": "failed"})
    facts = compose_partial(parts)
    result = call_with_fallbacks(models, lambda model: call_model(model, f"{agent}:\n{facts}"))
    record = record_run(models[0], result["model"], system_prompt, [])
    return {"answer": result["answer"], "parts": parts, "record": record}


if __name__ == "__main__":
    from lib import CircuitBreaker, Unavailable

    now = [0.0]
    health_calls = []

    def registry():
        return "active on claude-sonnet"

    def health():
        health_calls.append(now[0])
        raise ConnectionError("health-service unavailable")

    def call_model(model, prompt):
        if model == "provider-a/large":
            raise Unavailable("503 from provider-a")
        # a stand-in model that restates the facts it was given
        return f"[{model}] " + prompt.replace("\n", " | ")

    breakers = {label: CircuitBreaker(2, 30, lambda: now[0], trips_on=(ConnectionError,)) for label in ("status", "error rate")}
    cache = {"error rate": ("2.3%", "09:40")}
    for second in (0, 1, 2, 3):
        now[0] = second
        out = handle("research_agent", {"status": registry, "error rate": health}, breakers, cache,
                     ["provider-a/large", "provider-b/large"], call_model, "You report agent status.")
        print(f"t={second}s  health breaker: {breakers['error rate'].state:<6}  health calls so far: {len(health_calls)}")
        print(f"   {out['answer']}")
    print("record:", out["record"])
```
```
t=0s  health breaker: closed  health calls so far: 1
   [provider-b/large] research_agent: | status: active on claude-sonnet | error rate: 2.3% (last known, as of 09:40)
t=1s  health breaker: open    health calls so far: 2
   [provider-b/large] research_agent: | status: active on claude-sonnet | error rate: 2.3% (last known, as of 09:40)
t=2s  health breaker: open    health calls so far: 2
   [provider-b/large] research_agent: | status: active on claude-sonnet | error rate: 2.3% (last known, as of 09:40)
t=3s  health breaker: open    health calls so far: 2
   [provider-b/large] research_agent: | status: active on claude-sonnet | error rate: 2.3% (last known, as of 09:40)
record: {'requested': 'provider-a/large', 'answered': 'provider-b/large', 'config_hash': '14d29b7d0a9d', 'model_changed': True}
```
*(the Run output; the models are stand-ins that restate what they're given)*

**Explanation:** The Run output shows each piece doing its job. The health
service is called twice, trips its breaker, and isn't called again; every
later request gets its answer at once. The answer always has the status from
the registry and the last known error rate, labelled with its time. The
primary model is down throughout, so the backup writes every answer, and the
record says so. Catching only `CircuitOpen` and `ConnectionError` matters as
much as catching them: a bug in a fetcher is reported as a bug, not disguised
as a service being unavailable.
