# Module 2, Lesson 6 — Concept 6: Timeouts, retry with backoff, and graceful give-up

---

## A different kind of failure than Concept 5's

[Concept 5 handled a tool failing *definitively*](→ this lesson, tool errors as observations not exceptions concept) — a clear, permanent error like "already exists," where trying again with the same input would just fail again. This concept covers two different, related risks: a tool that *hangs* — takes too long, never actually returns — needs a **timeout** bounding how long the loop will wait on any single call; and a tool that fails *transiently* — something that might genuinely succeed if simply tried again — calls for a **retry**, not an immediate give-up.

A timeout is worth understanding conceptually here even without a full
implementation: without one, a single hung tool call could block the
entire loop indefinitely, regardless of every other guard already
covered in this lesson — none of `max_steps`, repeated-action detection,
or goal-state checks can help if the loop never even gets past one
stuck call in the first place.

---

## Retry with exponential backoff — the same pattern, a new context

This is [the exact same exponential backoff pattern from Module 1's rate-limit handling](→ Module 1, quantization cost and operational concerns lesson, provider side rate limits concept), now applied to a transiently-failing tool call instead of a rate-limited API call:

```python
class UnreliableTool:
    def __init__(self, fail_times: int):
        self.fail_times = fail_times
        self.attempt_count = 0

    def __call__(self, value: str) -> str:
        self.attempt_count += 1
        if self.attempt_count <= self.fail_times:
            raise ConnectionError(f"temporary connection issue (attempt {self.attempt_count})")
        return f"processed: {value}"

def call_with_retry(tool_function, max_retries: int = 4, **kwargs):
    for attempt in range(max_retries):
        wait_time = 2 ** attempt
        try:
            return tool_function(**kwargs)
        except ConnectionError as e:
            print(f"attempt {attempt + 1} failed ({e}), waiting {wait_time}s before retrying")
    return f"Error: tool failed after {max_retries} attempts, giving up"

tool = UnreliableTool(fail_times=2)
result = call_with_retry(tool, max_retries=4, value="some data")
print(result)
```
```
attempt 1 failed (temporary connection issue (attempt 1)), waiting 1s before retrying
attempt 2 failed (temporary connection issue (attempt 2)), waiting 2s before retrying
processed: some data
```
*(runs live, shows output — read-only demo snippet, not graded)*

`UnreliableTool` deterministically fails its first `fail_times` calls,
then succeeds — a reproducible stand-in for a genuinely transient
failure, without relying on actual randomness. `wait_time = 2 **
attempt` is the identical doubling pattern from Module 1: 1s, 2s, 4s,
8s. Here, the tool succeeds on its third attempt, well within the
`max_retries=4` budget.

---

## Graceful give-up: a defined result, not a crash or an infinite retry

Retries can't continue forever, though — if a tool genuinely, persistently fails:

```python
persistent_failure_tool = UnreliableTool(fail_times=10)
result = call_with_retry(persistent_failure_tool, max_retries=4, value="some data")
print(result)
```
```
attempt 1 failed (temporary connection issue (attempt 1)), waiting 1s before retrying
attempt 2 failed (temporary connection issue (attempt 2)), waiting 2s before retrying
attempt 3 failed (temporary connection issue (attempt 3)), waiting 4s before retrying
attempt 4 failed (temporary connection issue (attempt 4)), waiting 8s before retrying
Error: tool failed after 4 attempts, giving up
```
*(runs live, shows output — read-only demo snippet, not graded)*

Once `max_retries` is exhausted, `call_with_retry` returns a clear,
defined error string — never a crash, and never an unbounded retry
loop. [Feeding this back as a `tool_result`, exactly as Concept 5 covered](→ this lesson, tool errors as observations not exceptions concept), lets the model see clearly that this specific approach genuinely didn't work after real effort, giving it a chance to try something else entirely, rather than either crashing the whole interaction or blindly hammering the same failing call forever.

---

## Quiz cards

> **Q1.** Why does a hung tool call pose a risk that none of this
> lesson's other guards — max steps, repeated-action detection, goal-state
> checks — can help with?
> - A) It doesn't pose any real risk beyond what the other guards already cover
> - B) A single hung call could block the loop indefinitely before the loop ever gets to check any of those other conditions at all ✅
> - C) Hung tool calls are automatically detected by `max_steps`
> - D) This risk only applies to tools that don't use the `TOOL_REGISTRY` pattern

> **Q2.** What's the actual difference between the transient failure this
> concept addresses and the failure covered in Concept 5?
> - A) There's no real difference between the two
> - B) Concept 5 covered a definitive failure unlikely to change on retry; this concept covers a failure that might genuinely succeed if simply tried again ✅
> - C) Concept 5's failures are always more severe than this concept's
> - D) This concept only applies to tools that never actually succeed

> **Q3.** What does `call_with_retry` return once `max_retries` is
> genuinely exhausted?
> - A) It raises the original exception, crashing the caller
> - B) A clear, defined error string — never a crash, and never an unbounded retry loop ✅
> - C) It retries forever until the tool eventually succeeds
> - D) It silently returns `None` with no indication anything went wrong

> **Q4.** Why does feeding a graceful give-up message back as a
> `tool_result`, rather than crashing, matter for the model's next
> decision?
> - A) It doesn't matter — the model has no way to use this information either way
> - B) It gives the model clear information that this specific approach genuinely didn't work after real effort, letting it choose to try something different rather than repeat the same failing call blindly ✅
> - C) This information is only useful to a human developer, never to the model itself
> - D) A give-up message always causes the loop to terminate immediately

---

## Applied sandbox exercise 2

*(implementing retry with backoff and graceful give-up — genuinely
graded against two distinct deterministic scenarios)*

*Task shown to learner:* Implement `call_with_retry(tool_function,
max_retries, **kwargs)`: retry on `ConnectionError`, doubling the wait
time each attempt (`2 ** attempt`, though the actual waiting itself
isn't required to run in this exercise — just compute and print it),
and return a clear `"Error: tool failed after {max_retries} attempts,
giving up"` message if every attempt fails.

*Hidden test cases:*
```python
succeeds_eventually = UnreliableTool(fail_times=2)
result_1 = call_with_retry(succeeds_eventually, max_retries=4, value="data")
assert result_1 == "processed: data"
assert succeeds_eventually.attempt_count == 3

never_succeeds = UnreliableTool(fail_times=10)
result_2 = call_with_retry(never_succeeds, max_retries=4, value="data")
assert result_2 == "Error: tool failed after 4 attempts, giving up"
assert never_succeeds.attempt_count == 4
```

*Hint (shown on request):* This concept's demo *is* the answer — a
`for attempt in range(max_retries):` loop, a `try`/`except
ConnectionError` around calling `tool_function(**kwargs)`, returning
immediately on success, and falling through to the give-up message only
if the loop finishes without ever returning.

*Correct answer + explanation (shown on failure, if requested):*
```python
def call_with_retry(tool_function, max_retries: int = 4, **kwargs):
    for attempt in range(max_retries):
        wait_time = 2 ** attempt
        try:
            return tool_function(**kwargs)
        except ConnectionError as e:
            print(f"attempt {attempt + 1} failed ({e}), waiting {wait_time}s before retrying")
    return f"Error: tool failed after {max_retries} attempts, giving up"
```
The first scenario confirms a genuinely transient failure recovers
correctly, on exactly the expected attempt. The second confirms the
give-up path activates cleanly once retries are truly exhausted —
returning a defined result, never crashing, and never attempting a
fifth call beyond the stated budget.

---

*(End of Concept 6 — final concept section of Lesson 6. This lesson
continues with the outcomes callout, comprehensive quiz, and
comprehensive sandbox — drafted separately.)*
