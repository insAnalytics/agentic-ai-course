# Module 0, Lesson 8 — Concept 1: Why containers — the environment problem, compared to venv

> **Note: this draft assumes an ideal, infra-unconstrained sandbox** (a
> real backend container runtime per learner session) — it exists to show
> the target experience before deciding what's actually buildable within
> the $0 / Pyodide-based constraints in `architecture.md`. Interactive
> elements are described, not literally runnable in the current site.

---

## What a venv actually manages — and what it doesn't

[A virtual environment, from the Python setup lesson](→ Module 0, the Python setup lesson, set up Python concept, the virtual environments explanation), isolates *Python packages* — one project's `pip install`s don't leak into another's. That's real, and it solves a real problem. But a venv sits entirely *inside* one Python installation, on one operating system — it has no ability to change or isolate anything below that: not the Python version itself, not OS-level system libraries, not the OS itself.

**Ideal interactive demo — split terminal:** two panes, labeled "your
machine" (Ubuntu 22.04, Python 3.11, `libpq` — a Postgres client library —
already installed at the OS level) and "a teammate's machine" (Ubuntu
20.04, Python 3.11, no `libpq`). Both panes start with an identical
`requirements.txt` and an identical venv setup script. The learner runs:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

On "your machine," it runs cleanly. On "the teammate's machine," `pip
install` succeeds — the Python *package* installs fine — but running
`app.py` crashes:

```
ImportError: libpq.so.5: cannot open shared object file: No such file or directory
```

Same `requirements.txt`, same venv commands, same Python version — and it
still fails, because the missing piece isn't a Python package at all,
it's a system library the venv was never able to touch in the first
place.

---

## The actual gap

This is the concrete version of a problem you've likely heard described
vaguely as "works on my machine" — and it's worth being precise about
*why* a venv, on its own, structurally cannot fix it: a venv's isolation
boundary stops at the Python interpreter. Everything below that —
the OS, its installed system libraries, even which Python *version* is
available to create the venv from in the first place — is shared with,
and entirely dependent on, whatever happens to already be on that
specific machine.

---

## The fix, previewed

**Ideal interactive demo, continued:** now both panes run the exact same
three commands instead:

```bash
docker build -t my-app .
docker run my-app
```

Both panes print identical output. The `ImportError` is gone — not
because the teammate's machine was fixed, but because neither machine's
own OS is what's actually running the code anymore. This lesson is about
what's inside that `Dockerfile`, and what `docker build`/`docker run`
are actually doing to make that true — starting with the next section's
vocabulary, and built up piece by piece from there.

---

## Quiz cards

> **Q1.** What does a virtual environment's isolation boundary actually
> cover?
> - A) The entire operating system, including system libraries
> - B) Only Python packages within one Python installation — it has no ability to isolate or change the OS or system libraries beneath it ✅
> - C) Only the specific Python version being used
> - D) Nothing — venvs don't actually isolate anything

> **Q2.** In the split-terminal demo, why does `pip install -r
> requirements.txt` succeed on both machines, while running the app only
> succeeds on one?
> - A) `pip install` silently fails on the second machine without showing an error
> - B) The failure is a missing *system-level* library, not a missing Python package — something `pip`/a venv was never able to install or manage in the first place ✅
> - C) The two machines have different `requirements.txt` files
> - D) `pip install` behaves differently depending on the OS

> **Q3.** Why does running the same commands inside a container fix the
> "works on my machine" problem shown in the demo, when the venv-only
> approach couldn't?
> - A) Containers automatically detect and install any missing system libraries
> - B) The container brings its own consistent OS-level environment with it, so neither machine's own underlying OS or system libraries are what's actually running the code anymore ✅
> - C) `docker run` is just a faster version of `pip install`
> - D) Containers don't actually run on the host machine at all

---

*(End of Concept 1. This lesson continues with Concept 2 — images vs.
containers — drafted separately.)*
