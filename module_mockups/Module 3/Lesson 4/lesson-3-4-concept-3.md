# Module 3, Lesson 4 — Concept 3: Staying under the limit — client-side throttling

---

## Backoff reacts; throttling prevents

[The previous concept](→ this lesson, which failures to retry and how concept) handled a 429 *after* it happened: wait, then try again. That works, but every 429 is a wasted request, a delay, and a small strike against you with the service. Some services respond to clients that keep hitting the limit by slowing them down further or blocking them for a while.

**Client-side throttling** is the other half: limiting your own traffic so you stay under the service's limit in the first place. The two work together. Throttling keeps you under the limit in normal operation; backoff catches the cases throttling didn't prevent.

---

## Why agents hit limits faster than ordinary code

A normal program calls an API in a predictable pattern that you wrote. An agent's traffic is shaped by the model. [One response can contain several tool calls](→ Module 2, react and reasoning in the loop lesson, the react pattern concept), and a model asked to "check the status of all ten models" may well request all ten at once. The [next concept](→ this lesson, running independent tool calls concurrently concept) runs those calls concurrently, which is faster, and also sends ten requests at the same instant to one service.

The stand-in service below allows at most three requests in flight at a time and answers anything beyond that with a 429. That's a **concurrency limit**; many real services have one, alongside a limit on requests per minute:

```python
import asyncio

class ServiceError(Exception):
    def __init__(self, status_code: int, retry_after: float | None = None):
        super().__init__(f"service returned status {status_code}")
        self.status_code = status_code
        self.retry_after = retry_after

class LimitedService:
    def __init__(self, max_concurrent: int):
        self.max_concurrent = max_concurrent
        self.in_flight = 0
        self.peak_in_flight = 0
        self.rejected = 0

    async def check_model_status(self, model: str) -> str:
        # the service refuses any request beyond its concurrency limit
        if self.in_flight >= self.max_concurrent:
            self.rejected += 1
            raise ServiceError(429, retry_after=1.0)
        self.in_flight += 1
        self.peak_in_flight = max(self.peak_in_flight, self.in_flight)
        try:
            await asyncio.sleep(0.1)
            return f"{model}: available"
        finally:
            self.in_flight -= 1
```
*(defined once here and already loaded for every demo below)*

---

## The pain: ten calls at once, seven rejected

```python
MODELS = [f"model-{i}" for i in range(10)]

async def main():
    service = LimitedService(max_concurrent=3)
    results = await asyncio.gather(
        *(service.check_model_status(model=m) for m in MODELS),
        return_exceptions=True,
    )
    succeeded = sum(1 for r in results if isinstance(r, str))
    print(f"{succeeded} succeeded, {service.rejected} rejected with 429")

asyncio.run(main())
```
```
3 succeeded, 7 rejected with 429
```
*(runs live, shows output — read-only demo snippet, not graded)*

`asyncio.gather` with `return_exceptions=True`, [from Module 0's async error handling](→ Module 0, the async lesson, error handling in async code concept), lets all ten run and collects the seven exceptions alongside the three results instead of stopping at the first. The service took the first three and refused the rest. With the previous concept's retries, those seven would each wait and try again, and some might collide again on the next round.

---

## The fix: a semaphore, one per service

An `asyncio.Semaphore(3)` is a counter of three slots: `async with` takes a slot, waiting if none are free, and gives it back when the block ends. Put every call to the service inside it, and no more than three can ever be in flight:

```python
import time

MODELS = [f"model-{i}" for i in range(10)]

async def main():
    service = LimitedService(max_concurrent=3)
    # at most 3 calls to this service may be in flight at once
    status_service_slots = asyncio.Semaphore(3)

    async def throttled_check(model: str) -> str:
        async with status_service_slots:
            return await service.check_model_status(model=model)

    start = time.perf_counter()
    results = await asyncio.gather(*(throttled_check(m) for m in MODELS), return_exceptions=True)
    elapsed = time.perf_counter() - start
    succeeded = sum(1 for r in results if isinstance(r, str))
    print(f"{succeeded} succeeded, {service.rejected} rejected with 429")
    print(f"most requests in flight at once: {service.peak_in_flight}")
    print(f"total time: {elapsed:.1f}s")

asyncio.run(main())
```
```
10 succeeded, 0 rejected with 429
most requests in flight at once: 3
total time: 0.4s
```
*(runs live, shows output — read-only demo snippet, not graded)*

All ten succeed, and the peak never goes above three. Calls four to ten simply wait their turn for a free slot instead of being sent and refused. The total time, about four rounds of 0.1 seconds, is the honest cost of the limit: with three slots, ten calls take four rounds.

---

## The most common mistake: a semaphore per call

The semaphore only works if every call shares *the same* one. Creating it inside the function looks almost identical and does nothing at all:

```python
MODELS = [f"model-{i}" for i in range(10)]

async def main():
    service = LimitedService(max_concurrent=3)

    async def throttled_check(model: str) -> str:
        # bug: a brand-new semaphore for every call, so nothing is ever shared
        slots = asyncio.Semaphore(3)
        async with slots:
            return await service.check_model_status(model=model)

    results = await asyncio.gather(*(throttled_check(m) for m in MODELS), return_exceptions=True)
    succeeded = sum(1 for r in results if isinstance(r, str))
    print(f"{succeeded} succeeded, {service.rejected} rejected with 429")

asyncio.run(main())
```
```
3 succeeded, 7 rejected with 429
```
*(runs live, shows output — read-only demo snippet, not graded)*

Each call gets its own fresh semaphore with three free slots, so nothing ever waits. The rule: create one semaphore per external service, once, outside any single call, and have every tool that calls that service use it. Two tools that both call the status service share one semaphore; a tool calling a different service gets its own.

---

## Concurrency limits vs. rate limits

A semaphore caps how many requests are *in flight at once*. Many APIs instead, or also, cap how many requests you send *per second or per minute*. The two aren't the same: three slots with 0.1-second calls could still send 30 requests a second.

For a per-minute limit you need to space requests out over time, not just cap how many overlap. The standard technique is a token bucket: a budget of requests that refills at a steady rate, where each request spends one token and waits when the bucket is empty. Rate-limiter libraries provide this for asyncio, and the semaphore pattern above still applies for the concurrency side. Either way the principle is the same: know the service's published limits, and set your own ceiling a little below them.

Two things make this matter more as a system grows:

- **Several agents, one quota.** Limits usually apply to your API key or account, not to one process. Ten copies of an agent each "staying under the limit" can exceed it together. Sharing a limit across processes needs something outside any one process, and belongs with running agents in production, much later in this course.
- **Throttling doesn't replace backoff.** Your own count can drift from the server's, other clients may share the quota, and limits change. Keep the previous concept's `Retry-After` handling as the safety net.

---

## Quiz cards

> **Q1.** What does client-side throttling do that backoff doesn't?
> - A) It retries failed requests faster
> - B) It keeps your traffic under the service's limit so the 429s don't happen in the first place ✅
> - C) It replaces the need to handle 429 responses at all
> - D) It makes each individual request complete sooner
>
> *Explanation:* Backoff recovers after a limit is hit; throttling avoids hitting it. They're complementary, and a robust tool keeps both.

> **Q2.** Why are agents especially prone to hitting rate limits?
> - A) Agent frameworks disable the SDK's built-in retries
> - B) Models always call tools more slowly than ordinary code
> - C) The model shapes the traffic, and one response can request many calls to the same service at once ✅
> - D) Rate limits are stricter for AI-generated requests
>
> *Explanation:* A single model turn can fan out into many tool calls, and running them concurrently sends them all at the same moment, a burst the code's author never explicitly wrote.

> **Q3.** In the semaphore demo, why does the total time come out around 0.4 seconds for ten 0.1-second calls?
> - A) With three slots, ten calls run in four rounds, since the rest wait for a free slot ✅
> - B) The semaphore adds a 0.1-second delay to every call
> - C) Seven calls were retried after being rejected
> - D) The service slows down when more than three calls arrive
>
> *Explanation:* Nothing was rejected; calls four to ten waited their turn. Three at a time means rounds of 3, 3, 3 and 1, about four times the single-call duration.

> **Q4.** A developer writes `slots = asyncio.Semaphore(3)` as the first line inside `throttled_check`. What happens?
> - A) Calls are limited to three at a time, as intended
> - B) The first call blocks every later call forever
> - C) Python raises an error about creating a semaphore in an async function
> - D) Nothing is limited, because every call gets its own semaphore with three free slots ✅
>
> *Explanation:* A semaphore limits only the calls that share it. Creating one per call means each call waits on its own private counter, which is never full.

> **Q5.** A service allows 60 requests per minute. Is `asyncio.Semaphore(5)` enough to respect that?
> - A) Yes, because five slots is well under 60
> - B) Not necessarily: it caps how many run at once, not how many start per minute, so fast calls could still exceed 60 a minute ✅
> - C) Yes, as long as each call takes at least one second
> - D) No, because semaphores can't be used with per-minute limits at all
>
> *Explanation:* A concurrency cap and a rate cap measure different things. Five slots with 0.1-second calls could start 50 requests a second. A per-minute limit needs requests spaced over time, for example with a token bucket.

---

*(End of Concept 3. This lesson continues with Concept 4 — running independent tool calls concurrently.)*
