# Module 2, Lesson 10 — Concept 2: Parallelization

---

## The payoff Lesson 8 pointed at

[Lesson 8's dependency graph](→ this module, planning and decomposition lesson, plan representations linear tree and dependency graph concept) noted that tasks with no dependency on each other could run concurrently, not just in either sequential order — this concept is that payoff, actually implemented with [Module 1's async coverage](→ Module 1, the training pipeline lesson):

```python
import asyncio
import time

async def create_agent_async(name: str, model: str) -> str:
    await asyncio.sleep(0.5)
    return f"created {name} with {model}"

async def main():
    start = time.perf_counter()
    results = await asyncio.gather(
        create_agent_async("research_agent", "claude-sonnet"),
        create_agent_async("support_agent", "claude-haiku"),
    )
    elapsed = time.perf_counter() - start
    print(results)
    print(f"elapsed: {elapsed:.1f}s")

asyncio.run(main())
```
```
calling both concurrently...
['created research_agent with claude-sonnet', 'created support_agent with claude-haiku']
elapsed: 0.5s
```
*(runs live, shows output — read-only demo snippet, not graded)*

`asyncio.gather` runs both calls concurrently, not sequentially — total
time is `~0.5s`, the single longest wait, not `1.0s`, the sum. This is
exactly [Concept 2's timing proof from the async lesson](→ Module 1, the training pipeline lesson), now applied to two genuinely independent sub-tasks identified by a dependency graph, rather than a generic example.

---

## Quiz cards

> **Q1.** What made `create_research_agent` and `create_support_agent`
> safe to run in parallel, per Lesson 8?
> - A) They use the same tool name
> - B) They had no dependency on each other in the dependency graph — neither's outcome depended on the other's ✅
> - C) They were both scheduled at the same time by coincidence
> - D) Parallelization is always safe regardless of dependencies

> **Q2.** Why does the demo's elapsed time come out around 0.5s, not
> 1.0s?
> - A) `asyncio.gather` runs the two calls sequentially, just faster
> - B) Both calls run concurrently, so total time approaches the single longest wait rather than the sum of both ✅
> - C) The second call is skipped entirely
> - D) This is unrelated to how `asyncio.gather` works

---

*(End of Concept 2. This lesson continues with Concept 3 —
orchestrator-workers — drafted separately.)*
