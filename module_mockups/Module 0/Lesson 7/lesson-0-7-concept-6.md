# Module 0, Lesson 7 — Concept 6: When async isn't the right tool

---

## Async solves *waiting*, not *computing*

Every problem this lesson has solved so far has the same shape:
something waiting on the outside world — a network response, a timer —
while the CPU sits idle and could be doing something else in the
meantime. That's **I/O-bound** work, [as named back in Concept 1](→ this lesson, why concurrency matters concept, the I/O-bound explanation). `async`/`await` is specifically a solution for overlapping *waiting*, not for making the CPU itself compute anything faster.

**CPU-bound** work is the opposite case: a tight loop doing heavy
computation, with no waiting involved at all — hashing a large amount of
data, running a numeric simulation, some parsing job that's genuinely
compute-intensive rather than mostly idle. Wrapping that kind of code in
`async def` doesn't speed it up:

```python
import asyncio
import time

async def compute_something_heavy(n: int) -> int:
    total = 0
    for i in range(n):
        total += i * i
    return total

async def main():
    return await asyncio.gather(
        compute_something_heavy(5_000_000),
        compute_something_heavy(5_000_000),
    )

start = time.perf_counter()
asyncio.run(main())
elapsed = time.perf_counter() - start
print(f"total time: {elapsed:.2f}s")
```
*(illustrating expected behavior — actual numbers depend heavily on the
machine running this, not shown as a specific value here)*

Even wrapped in `gather()`, both calls to `compute_something_heavy`
still take roughly as long *combined* as they would running one after
another — there's no `await` anywhere inside the loop, so there's no
point where either coroutine ever actually pauses to let the other one
run. `async`/`await` only creates opportunities for other code to run at
points where something explicitly says "I'm waiting, go ahead" — a tight
computational loop with no `await` inside it never says that, so from the
event loop's perspective, it behaves exactly like [the blocking `time.sleep()` case from earlier in this lesson](→ this lesson, asyncio.sleep vs time.sleep concept, the blocking explanation): nothing else gets a chance to run until it's done.

---

## Why: the GIL

The underlying reason Python doesn't get free CPU parallelism from
`async`, or even from regular threads, is the **GIL** — the Global
Interpreter Lock. CPython (the standard Python implementation this
entire course has been using) only ever executes one thread's Python
bytecode at a time, no matter how many threads exist. This is a
deliberate, long-standing design choice in CPython specifically, not a
property of the Python language itself — it exists to keep CPython's
internal memory management simple and safe, at the cost of true
CPU-level parallelism for pure Python code within a single process.

This is exactly why `asyncio` works the way it does: it doesn't need
multiple OS threads running Python code truly simultaneously — it gets
concurrency by *cooperatively* pausing and resuming coroutines within a
single thread, at `await` points, which is a completely different
mechanism than actually running multiple pieces of Python code on
different CPU cores at once.

---

## What actually exists for CPU-bound work

This course doesn't teach either of these in depth — they're genuinely
separate topics — but it's worth knowing they exist, and roughly why:

- **`threading`** — Python's standard threading module. Because of the
  GIL, threads don't help with pure CPU-bound Python code the way you
  might expect from other languages; two threads doing heavy computation
  still take turns on the same single core. Threading remains useful for
  I/O-bound work in codebases that predate `asyncio` or need to call
  blocking libraries, but for new I/O-bound code, `asyncio` is generally
  the more modern, more efficient choice.
- **`multiprocessing`** — sidesteps the GIL entirely by running separate
  *processes*, each with its own Python interpreter and its own GIL.
  This gives genuine parallel execution across CPU cores for CPU-bound
  work, at the cost of more overhead (starting a process is heavier than
  starting a thread or a coroutine) and no automatically shared memory
  between processes the way threads share memory within one process.

---

## The decision rule

Before reaching for `async`/`await`, the question worth asking is simply:
is this code mostly *waiting*, or mostly *computing*? Waiting on a
network call, a file, another service — `asyncio` is the right tool,
exactly as the rest of this lesson has shown. Genuinely heavy computation
with no waiting involved — hashing, numeric processing, parsing a huge
amount of data — needs `multiprocessing` (or, often just as reasonably,
no concurrency at all, if the computation is a one-off and fast enough
that the added complexity isn't worth it). Reaching for `async`/`await`
on CPU-bound code doesn't just fail to help — it adds real complexity
(coroutines, `await`, an event loop) for exactly zero benefit.

---

## Quiz cards

> **Q1.** What kind of problem does `async`/`await` actually solve?
> - A) Making CPU-heavy computation run faster
> - B) Overlapping time spent *waiting* on external things — network calls, timers — so the total wait approaches the longest single wait rather than the sum ✅
> - C) Reducing the total amount of code needed for any task
> - D) Automatically parallelizing any loop

> **Q2.** Why doesn't wrapping a CPU-heavy loop (no `await` inside it) in
> `async def` and running it through `gather()` speed it up?
> - A) `gather()` doesn't accept CPU-bound coroutines at all
> - B) Without any `await` point inside the loop, the coroutine never actually pauses to let anything else run — it behaves like a single blocking call, same as `time.sleep()` used incorrectly ✅
> - C) `async def` functions can't contain loops
> - D) This actually does speed it up significantly

> **Q3.** What does the GIL (Global Interpreter Lock) mean for Python
> threads running CPU-bound code?
> - A) Threads freely run Python bytecode on separate CPU cores simultaneously
> - B) Only one thread executes Python bytecode at a time in CPython, regardless of how many threads exist — so threads don't provide true parallelism for CPU-bound Python code ✅
> - C) The GIL only affects `asyncio`, not regular threads
> - D) The GIL prevents any Python program from using more than one thread at all

> **Q4.** Why does `asyncio` still achieve real concurrency for I/O-bound
> work despite the GIL?
> - A) `asyncio` disables the GIL entirely
> - B) It gets concurrency by cooperatively pausing and resuming coroutines within a single thread at `await` points — a different mechanism than running multiple threads of Python code truly simultaneously ✅
> - C) `asyncio` secretly uses `multiprocessing` under the hood
> - D) It doesn't — `asyncio` has the exact same limitation as CPU-bound threading

> **Q5.** What does `multiprocessing` offer that `threading` doesn't, for
> genuinely CPU-bound work?
> - A) Lower overhead per unit of work
> - B) Real parallel execution across CPU cores, since each process has its own interpreter and its own GIL — at the cost of more overhead and no automatically shared memory ✅
> - C) Automatic conversion of blocking code into async code
> - D) `multiprocessing` and `threading` are functionally identical

> **Q6.** What's the practical question worth asking before reaching for
> `async`/`await` on a piece of code?
> - A) How many lines of code does it have?
> - B) Is this code mostly waiting on something external, or mostly computing? — `asyncio` fits waiting; heavy computation needs a different tool entirely ✅
> - C) Does it use any built-in functions?
> - D) Was it originally written as a regular function?

---

*(End of Concept 6 — final concept section of Lesson 7. This lesson
continues with the outcomes callout, comprehensive quiz, and comprehensive
sandbox, drafted separately.)*
