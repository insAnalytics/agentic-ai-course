# Module 1, Lesson 11 — Concept 4: Provider-side rate limits

---

## The reverse direction from Module 0's rate limiting

[Rate limiting, covered in Module 0's FastAPI lesson](→ Module 0, the FastAPI lesson, building a real app concept), was about *your* API limiting how often *clients* could call *your* endpoints — protecting your own backend from overload or misuse. This concept is the exact reverse direction: the **LLM provider** limiting how often *you*, as a client, can call *their* API — commonly expressed as a cap on requests per minute (RPM) and/or tokens per minute (TPM).

---

## Why the limit exists, and how it shows up

Providers manage genuinely shared infrastructure capacity across every
customer — without limits, one client sending an unrestrained volume of
requests could degrade service for everyone else sharing that capacity.
Exceeding your own rate limit typically produces a `429` status code —
[Too Many Requests, the exact HTTP status semantics already covered back in Module 0](→ Module 0, the FastAPI lesson, response models and exception handling concept) — signaling the request was rejected specifically because you're calling too frequently, not because anything was actually wrong with the request itself.

---

## The real handling pattern: exponential backoff, not "just send less"

"Send fewer requests" isn't a real strategy on its own — the actual
standard pattern is **exponential backoff**: on hitting a `429`, wait a
short time and retry; if that retry *also* fails, wait meaningfully
longer before trying again, growing the wait time with each consecutive
failure rather than retrying immediately or at some fixed interval.
Retrying immediately would likely hit the exact same limit again right
away; a fixed, non-growing wait doesn't adapt if the provider is under
genuinely sustained pressure.

```python
def call_api_with_backoff(max_retries: int) -> str:
    for attempt in range(max_retries):
        wait_time = 2 ** attempt   # 1, 2, 4, 8 seconds, doubling each attempt
        success = attempt == max_retries - 1   # simulating eventual success, for this demo
        if success:
            return "success"
        print(f"attempt {attempt + 1} failed with 429, waiting {wait_time}s before retrying")
    return "failed after all retries"

result = call_api_with_backoff(max_retries=4)
print(result)
```
```
attempt 1 failed with 429, waiting 1s before retrying
attempt 2 failed with 429, waiting 2s before retrying
attempt 3 failed with 429, waiting 4s before retrying
success
```
*(runs live, shows output — read-only demo snippet, not graded; `time.sleep()` calls are omitted here to keep the demo fast, but a real implementation would actually wait between attempts)*

`wait_time = 2 ** attempt` is the actual exponential shape: `1`, `2`,
`4`, `8` seconds — each failure roughly doubling the wait before the
next attempt, giving the provider's shared capacity genuine room to
recover rather than hammering it with immediate, repeated retries.

---

## Quiz cards

> **Q1.** How does provider-side rate limiting differ from the rate
> limiting covered in Module 0's FastAPI lesson?
> - A) They're the exact same concept, just described twice
> - B) Module 0's version protects your own API from client misuse; this concept is the reverse — the provider limiting how often you can call their API ✅
> - C) Provider-side rate limiting only applies to free-tier accounts
> - D) There's no real difference in how either is actually implemented

> **Q2.** What HTTP status code typically indicates a rate-limited
> request?
> - A) `200 OK`
> - B) `429 Too Many Requests` ✅
> - C) `404 Not Found`
> - D) `500 Internal Server Error`

> **Q3.** Why is exponential backoff preferred over retrying immediately
> after hitting a rate limit?
> - A) Immediate retries always succeed, so backoff is unnecessary
> - B) Retrying immediately would likely hit the exact same limit again right away, while a growing wait time gives the provider's shared capacity genuine room to recover ✅
> - C) Exponential backoff is required by law for all APIs
> - D) There's no real difference between immediate retries and backoff

> **Q4.** In the demo, why does `wait_time` grow from `1` to `2` to `4`
> seconds across successive failed attempts?
> - A) This is arbitrary and unrelated to the retry logic
> - B) `2 ** attempt` doubles the wait time with each consecutive attempt, the actual exponential shape backoff is named for ✅
> - C) The wait time is fixed and never actually changes
> - D) The wait time decreases with each attempt, not increases

---

*(End of Concept 4 — final concept section of Lesson 11, and the final
concept of Module 1. This lesson continues with the outcomes callout,
comprehensive quiz, and closing synthesis — drafted separately.)*
