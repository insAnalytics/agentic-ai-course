# Module 0, Lesson 8 — Concept 6: Layer caching and `.dockerignore`

---

## Each instruction is a cached layer

Every instruction in a Dockerfile produces a **layer** — [visible directly in the build log from earlier in this lesson](→ this lesson, writing a Dockerfile concept, the core instructions explanation), one `Step N/6` per instruction. Docker caches each layer, and re-uses it on the next build *if that instruction, and everything before it, hasn't changed* — skipping the actual work entirely when the cache applies.

---

## The naive order — show the pain

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python3", "app.py"]
```

`COPY . .` copies *every* file in the project, including application
code that changes constantly. Docker's cache invalidation cascades
forward — if `COPY . .` sees any file has changed, that layer's cache is
invalidated, and so is *every layer after it*, including `RUN pip
install`.

**Interactive terminal demo:** build once (a full install, ~40 seconds
in the log). Change one line of `app.py` — unrelated to
`requirements.txt` entirely — and rebuild:

```
Step 3/5 : COPY . .
 ---> a1b2c3d4e5f6
Step 4/5 : RUN pip install -r requirements.txt
 ---> Running in 7g8h9i0j1k2l
Collecting requests==2.31.0
... (full reinstall, ~40 seconds again)
```

Every dependency reinstalls from scratch, purely because `COPY . .` came
before `RUN pip install`.

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

**Interactive terminal demo, continued:** rebuild after the same
one-line `app.py` change, against the reordered Dockerfile:

```
Step 4/6 : RUN pip install -r requirements.txt
 ---> Using cache
```

The install step is skipped entirely — the rebuild finishes in under a
second instead of ~40.

---

## `.dockerignore` — the other half of the caching problem

`COPY . .` doesn't just risk invalidating the cache — it copies
*everything* in your project directory into the build context, whether
you actually want it in the image or not: `.git/` (your entire version
history), `__pycache__/`, a local `.venv/`, and — worth connecting
directly back to [the secrets warning from earlier in this lesson](→ this lesson, why containers concept, a trap the isolation motivation makes worse explanation) — potentially a `.env` file sitting right there in the project root.

`.dockerignore` works exactly like `.gitignore` — a plain list of
patterns to exclude, this time from what gets sent into the build
context at all, before any `COPY` instruction even runs:

```
.git
__pycache__/
*.pyc
.venv/
.env
```

With this file present, `COPY . .` never even sees `.env` or `.git` — they're excluded before the build context is assembled, not filtered out afterward. This closes the specific gap from earlier: a `.dockerignore` entry for `.env` means there's no `COPY` instruction to accidentally sweep it in, in the first place, regardless of how the rest of the Dockerfile is written.

It also has a real caching benefit of its own: `__pycache__/` and other
frequently-changing, irrelevant files no longer count as "the project
changed" from Docker's perspective, since they're never part of the
build context to begin with — one less thing that can spuriously
invalidate a layer's cache.

---

## Quiz cards

> **Q1.** What does Docker's layer cache let a rebuild skip?
> - A) Nothing — every `docker build` always redoes every instruction from scratch
> - B) Any instruction whose layer (and everything before it) hasn't changed since the last build ✅
> - C) Only the very first instruction, `FROM`, can ever be cached
> - D) Caching only applies to `CMD`

> **Q2.** Why does changing one unrelated line in `app.py` trigger a full
> reinstall in the naive Dockerfile ordering?
> - A) It shouldn't, and doesn't — this is a misunderstanding
> - B) `COPY . .` (which comes before the install step) sees the changed file, invalidating its own cache, which cascades forward and invalidates the install layer too ✅
> - C) `pip install` always reinstalls everything regardless of caching
> - D) Editing `app.py` automatically edits `requirements.txt` too

> **Q3.** What does a `.dockerignore` file do?
> - A) It prevents Docker from ever building an image
> - B) It excludes listed files and patterns from the build context entirely, before any `COPY` instruction runs, the same way `.gitignore` excludes files from version control ✅
> - C) It only affects `RUN` instructions, not `COPY`
> - D) It's required for every Dockerfile to be valid

> **Q4.** How does a `.dockerignore` entry for `.env` help prevent the
> secrets-in-images problem from earlier in this lesson?
> - A) It doesn't — `.dockerignore` has nothing to do with secrets
> - B) `.env` is excluded from the build context before any `COPY` instruction even runs, so there's no way for it to accidentally end up copied into the image regardless of how the Dockerfile is written ✅
> - C) It encrypts `.env` automatically
> - D) It only works if `.env` is also listed in the Dockerfile itself

---

## Applied sandbox exercise 2

*(layer-caching order plus a `.dockerignore`, verified against real
build behavior)*

*Task shown to learner:* Given a project with a naive Dockerfile
(`COPY . .` before `RUN pip install`), a `.git/` directory, a
`__pycache__/` directory, and a `.env` file containing a fake API key:
1. Reorder the Dockerfile so the install layer's cache survives
   unrelated code changes.
2. Add a `.dockerignore` excluding `.git`, `__pycache__/`, `*.pyc`, and
   `.env`.
3. Build the image, then change one line in `app.py` and rebuild,
   confirming the install step shows a cache hit.

*Grading (against the real build, not just file text):* the second
build's log is checked for `Using cache` on the install step; the
resulting image is inspected directly to confirm neither `.env` nor
`.git` exist anywhere inside it.

---

*(End of Concept 6 — final concept section before the look-ahead to
`docker-compose`. This lesson continues with Concept 7 — a brief look
ahead: `docker-compose` — drafted separately.)*
