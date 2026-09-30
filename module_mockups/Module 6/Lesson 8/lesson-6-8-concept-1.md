# Module 6, Lesson 8 — Concept 1: Falling back to another model

---

## When retrying isn't enough

[Module 2](→ Module 2, termination, failure and control lesson, timeouts, retry with backoff, and graceful give-up concept)
taught the loop to retry a failing call with backoff and then give up with
a defined result, and
[Module 3](→ Module 3, tools that call the outside world lesson, which failures to retry and how concept)
taught which failures are worth retrying at all. Both assume the problem is
brief. Sometimes it isn't: a provider has an outage, or a model's rate limit
is exhausted for the hour.

```python
class Unavailable(Exception):
    pass


def primary_model(prompt: str) -> str:
    # a provider having a bad hour: every call fails
    raise Unavailable("503 from provider-a")


def with_retries(call, prompt: str, attempts: int = 3) -> str:
    """Module 2's retry, without the waits: try a few times, then give up with a defined result."""
    for attempt in range(1, attempts + 1):
        try:
            return call(prompt)
        except Unavailable as error:
            print(f"  attempt {attempt}: {error}")
    return "Sorry, I can't answer right now."


print(with_retries(primary_model, "Which agents still run on claude-legacy?"))
```
```
  attempt 1: 503 from provider-a
  attempt 2: 503 from provider-a
  attempt 3: 503 from provider-a
Sorry, I can't answer right now.
```
*(runs live, shows output — read-only demo snippet, not graded. The
provider's outage is scripted.)*

Giving up cleanly is better than crashing, but the user still gets nothing.
If another model could have answered, the agent gave up too early.

---

## A fallback chain

A **fallback** is a second choice: when the primary model can't answer,
try the next one on a list, in priority order. It might be the same model
from another provider, a different model from the same provider, or a smaller
model that's always available. LLM gateways build this in. The open-source
gateway LiteLLM, for example,
[configures fallbacks](https://docs.litellm.ai/docs/proxy/reliability) as
a priority-ordered list of models per primary, and keeps separate lists for
particular kinds of error, such as a prompt too long for the model's context
window, since the right backup depends on what went wrong.

That last point is the one to design around. Whether falling back can help
depends on the error:

- **The provider is down or rate-limited:** another provider, or another
  model, may well be up. Fall back.
- **The prompt is too long for this model:** a model with a larger context
  window may take it. Fall back, to a model that can.
- **The request itself is wrong,** such as a malformed tool schema or an
  invalid parameter: every model would refuse it. Falling back only hides a
  bug and wastes calls. Raise it.

This is the same split as Module 3's retry rules, one level up: retry what
might succeed on a second try, fall back on what might succeed somewhere else,
and fix what would fail everywhere.

---

## A fallback is a different model

Falling back keeps the agent answering, but not in the same way. A backup
model may be weaker, format its output differently, or follow instructions
less closely. Two habits follow:

- **Its answers pass the same checks.** The result checks from
  [Lesson 3](→ this module, checks in the loop lesson, checking a tool result before the model reads it concept)
  and the support checks from
  [Lesson 4](→ this module, verifying an answer against its sources lesson, checking each claim against the source it cites concept)
  apply to a backup's answer exactly as to the primary's. If anything, a
  weaker model's answers are the ones that most need them.
- **The record says which model answered.** When answers go wrong later,
  whether they came from the backup is the first thing to find out, and it's
  impossible to find out if nothing recorded it. Recording and tracing runs is
  Module 7's subject; recording which model answered is the minimum.

---

## Applied sandbox exercise
*(graded — a call with an ordered list of fallbacks)*

**Task shown to learner:** Write `call_with_fallbacks(models, call)`. `models`
is a list of model names in priority order, and `call(model)` returns an
answer or raises one of the errors defined in the starter. Try each model in
order:

- If it answers, return `{"answer": ..., "model": ..., "attempts": [...]}`,
  where `attempts` lists `(model, error class name)` for every model that
  failed before it.
- If it raises `Unavailable`, `RateLimited` or `ContextTooLong`, record the
  attempt and try the next model.
- If it raises `BadRequest`, let it propagate at once, without trying any
  other model.
- If every model fails, raise `AllFailed(attempts)`.

**Starter code:**
```python
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


def call_with_fallbacks(models: list[str], call) -> dict:
    """Try each model in order until one answers. Move on only for errors another model might not hit;
    a bad request is raised at once, since every model would refuse it."""
    ...



def call(model: str) -> str:
    if model == "provider-a/large":
        raise Unavailable("503 from provider-a")
    return f"{model}: research_agent and notes_agent still run on claude-legacy."


print(call_with_fallbacks(["provider-a/large", "provider-b/large"], call))
```

**Hidden tests:**
```python
def scripted(outcomes: dict):
    """A stand-in call: each model either returns its answer or raises its error."""
    calls = []

    def call(model):
        calls.append(model)
        result = outcomes[model]
        if isinstance(result, Exception):
            raise result
        return result
    return call, calls


call, calls = scripted({"primary": "answer from primary", "backup": "answer from backup"})
r = call_with_fallbacks(["primary", "backup"], call)
assert r == {"answer": "answer from primary", "model": "primary", "attempts": []}, (
    f"got {r}: the primary answered, so use it and record that it did")
assert calls == ["primary"], f"called {calls}: don't call the backup when the primary answers"

call, calls = scripted({"primary": Unavailable("down"), "backup": RateLimited("busy"), "third": "answer from third"})
r = call_with_fallbacks(["primary", "backup", "third"], call)
assert r["model"] == "third" and r["answer"] == "answer from third", f"got {r}: fall back past both failures"
assert r["attempts"] == [("primary", "Unavailable"), ("backup", "RateLimited")], (
    f"attempts {r['attempts']}: record each failed model and the kind of error, in order")

call, calls = scripted({"small": ContextTooLong("too long"), "large": "answer from large"})
try:
    result = call_with_fallbacks(["small", "large"], call)
except ContextTooLong:
    raise AssertionError("ContextTooLong escaped: a model with a larger window may take the prompt, so fall back") from None
assert result["model"] == "large", (
    "a context-window error is worth falling back on: a model with a larger window may take the prompt")

call, calls = scripted({"primary": BadRequest("malformed tool schema"), "backup": "answer from backup"})
try:
    call_with_fallbacks(["primary", "backup"], call)
    raised = None
except Exception as error:
    raised = error
assert isinstance(raised, BadRequest), (
    f"got {raised!r}: a bad request would fail on every model; raise it at once instead of falling back")
assert calls == ["primary"], f"called {calls}: don't try the backup with a request that's wrong"

call, calls = scripted({"primary": Unavailable("down"), "backup": Unavailable("down")})
try:
    call_with_fallbacks(["primary", "backup"], call)
    raised = None
except Exception as error:
    raised = error
assert isinstance(raised, AllFailed) and raised.attempts == [("primary", "Unavailable"), ("backup", "Unavailable")], (
    f"got {raised!r}: when every model fails, raise AllFailed with the attempts")
```

**Hint (shown on request):** Put the three errors worth falling back on in a
tuple, and catch only that tuple: `except (A, B, C) as error:`. Anything else,
including `BadRequest`, then propagates by itself. `type(error).__name__`
gives the class name to record.

**Reference solution:**
```python
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
```
```
{'answer': 'provider-b/large: research_agent and notes_agent still run on claude-legacy.', 'model': 'provider-b/large', 'attempts': [('provider-a/large', 'Unavailable')]}
```
*(the starter's printout, with the reference in place)*

**Explanation:** Catching only the errors another model might not hit is the
whole design. A bare `except Exception` would try every backup on a request
that can't succeed anywhere, turning one clear error into several confusing
ones. The attempts list is the record the previous section asked for: which
models failed and how, and which one finally answered.

---

## Quiz cards

> **Q1.** Retries with backoff have been exhausted, and the provider is
> still returning 503. What does a fallback add?
> - A) More retries of exactly the same call
> - B) Another model that may be up when this one isn't ✅
> - C) A cached answer from an earlier run
> - D) A smaller prompt for the same model
>
> *Explanation: retries assume the problem is brief. A fallback assumes it
> might not be, and tries somewhere else.*

> **Q2.** A request fails because its tool schema is malformed. Should the
> agent fall back to another model?
> - A) Yes, since another model might accept it
> - B) No: every model would refuse it ✅
> - C) Yes, but only to a larger model
> - D) Only after retrying it three times first
>
> *Explanation: some errors come from the request, not the model. Those
> should fail loudly, once, so the bug gets fixed.*

> **Q3.** Why record which model answered?
> - A) For billing purposes, and nothing else
> - B) So bad answers can be traced to the backup ✅
> - C) Because a backup's answers can't be checked otherwise
> - D) Because every provider requires it
>
> *Explanation: a backup may be weaker or behave differently. Without a
> record, a pattern of bad answers from the fallback is invisible.*

> **Q4.** A backup model answers during an outage. Which checks apply to its
> answer?
> - A) None, since it's only a temporary backup
> - B) The same checks as the primary's answers ✅
> - C) Only the check on the answer's format
> - D) Only if it comes from a different provider
>
> *Explanation: falling back changes who answers, not what the answer has to
> pass. A weaker model's answers need the checks at least as much.*

---

*(End of this concept. The next concept is about answering with what's
available when one part is missing, and saying so.)*
