# Module 0, Lesson 8 — Concept 5: Layer caching — why instruction order matters

> **Note: this draft assumes an ideal, infra-unconstrained sandbox** — see
> the note at the top of Concept 1. Interactive elements describe the
> target experience, not something runnable in the current site today.

---

## Each instruction is a cached layer

Every instruction in a Dockerfile produces a **layer** — [visible directly in the build log from the previous concept](→ this lesson, writing a Dockerfile concept, the watching the build happen explanation), one `Step N/6` per instruction. Docker caches each layer, and re-uses a cached layer on the next build *if that instruction, and everything before it, hasn't changed* — skipping the actual work entirely when the cache applies.

---

## The naive order — show the pain

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python3", "app.py"]
```

This looks reasonable — copy everything in, then install. The problem:
`COPY . .` copies *every* file in the project, including application
code that changes constantly. Docker's cache invalidation is
all-or-nothing per layer and cascades forward — if `COPY . .` sees any
file has changed (even a single line in `app.py`, nothing to do with
dependencies at all), that layer's cache is invalidated, and so is
*every layer after it*, including `RUN pip install`.

**Ideal interactive demo:** build once (full install, ~40 seconds in the
log). Change one line of `app.py` — unrelated to `requirements.txt`
entirely — and rebuild:

```
Step 3/5 : COPY . .
 ---> a1b2c3d4e5f6
Step 4/5 : RUN pip install -r requirements.txt
 ---> Running in 7g8h9i0j1k2l
Collecting requests==2.31.0
... (full reinstall, ~40 seconds again)
```

Every single dependency reinstalls from scratch, even though
`requirements.txt` itself never changed — purely because `COPY . .`
came before `RUN pip install`, and that `COPY` layer's cache broke the
moment any file changed.

---

## The fix: copy dependencies first, separately

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python3", "app.py"]
```

Copying just `requirements.txt` first, installing from it, and only
*then* copying the rest of the project means the install layer's cache
only breaks when `requirements.txt` itself actually changes — not on
every unrelated code edit.

**Ideal interactive demo, continued:** rebuild after the same one-line
`app.py` change, this time against the reordered Dockerfile:

```
Step 3/6 : COPY requirements.txt .
 ---> a1b2c3d4e5f6
Step 4/6 : RUN pip install -r requirements.txt
 ---> Using cache
 ---> 9s0t1u2v3w4x
Step 5/6 : COPY . .
 ---> 3m4n5o6p7q8r
```

`Using cache` — the install step is skipped entirely, and the whole
rebuild finishes in under a second instead of ~40. The learner sees the
exact same one-line code change produce a dramatically different build
time, purely from reordering two instructions — a concrete, measured
before/after, not just an assertion that order matters.

---

## Quiz cards

> **Q1.** What does Docker's layer cache let a rebuild skip?
> - A) Nothing — every `docker build` always redoes every instruction from scratch
> - B) Any instruction whose layer (and everything before it) hasn't changed since the last build — that layer's work is reused instead of redone ✅
> - C) Only the very first instruction, `FROM`, can ever be cached
> - D) Caching only applies to `CMD`

> **Q2.** In the naive Dockerfile (`COPY . .` before `RUN pip install`),
> why does changing one line in `app.py` — unrelated to dependencies —
> still trigger a full reinstall of every package?
> - A) It shouldn't, and doesn't — this is a misunderstanding
> - B) `COPY . .` copies the changed file, invalidating that layer's cache, which cascades forward and invalidates every layer after it, including the install step ✅
> - C) `pip install` always reinstalls everything regardless of caching
> - D) Editing `app.py` automatically edits `requirements.txt` too

> **Q3.** Why does copying just `requirements.txt` and installing from it
> *before* copying the rest of the project fix the caching problem?
> - A) It doesn't actually fix anything, it just reorders the build log
> - B) The install layer's cache now only depends on `requirements.txt`, which changes far less often than the rest of the project's code — an unrelated code edit no longer invalidates it ✅
> - C) Docker caches `RUN` instructions differently from `COPY` instructions by default
> - D) This only works if `requirements.txt` is renamed

---

## Applied sandbox exercise 3

*(ideal version — measuring the actual timing difference between the two
orderings)*

*Task shown to learner:* Given the naive Dockerfile (dependencies copied
and installed after the rest of the project), rewrite it so the install
layer's cache survives unrelated code changes. Build twice — once
unmodified, once after changing an unrelated line in `app.py` — and
confirm the second build shows `Using cache` for the install step.

*Grading (ideal):* the learner's reordered Dockerfile is actually built
twice against the real backend runtime, checking the second build's log
for a cache hit on the install layer, rather than just checking file
text for the right instruction order.

---

*(End of Concept 5. This lesson continues with Concept 6 — a brief look
ahead: docker-compose — drafted separately.)*
