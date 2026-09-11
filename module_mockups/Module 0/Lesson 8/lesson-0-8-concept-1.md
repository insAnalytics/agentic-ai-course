# Module 0, Lesson 8 — Concept 1: Why containers

---

## The environment problem: what a venv can't reach

[A virtual environment, from the Python setup lesson](→ Module 0, the Python setup lesson, set up Python concept, the virtual environments explanation), isolates *Python packages* — one project's `pip install`s don't leak into another's. But a venv sits entirely *inside* one Python installation, on one operating system — it has no ability to change or isolate anything below that: not the Python version itself, not OS-level system libraries, not the OS itself.

**Interactive terminal demo:** two panes, labeled "your machine" (Ubuntu
22.04, `libpq` — a Postgres client library — already installed at the OS
level) and "a teammate's machine" (Ubuntu 20.04, no `libpq`). Both panes
start with an identical `requirements.txt` and venv setup. The learner
runs:

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

Same `requirements.txt`, same venv commands — it still fails, because the
missing piece is a *system* library, something a venv was never able to
touch in the first place. Now both panes run `docker build -t my-app .`
and `docker run my-app` instead — identical output on both, since neither
machine's own OS is what's actually running the code anymore.

---

## A second, different reason: restricting what code can touch

There's a motivation for containers that matters specifically for the
kind of code this course is building toward, separate from "it runs the
same everywhere": **isolation as a security boundary**, not just a
consistency guarantee. An agent that executes tool calls, or runs code an
LLM generated, is running code whose exact behavior you don't fully
control in advance — restricting what that code can actually *reach* (the
filesystem, the network, environment variables holding credentials)
matters in a way it doesn't for code you wrote yourself and trust
completely.

**Interactive terminal demo:** a small script standing in for an
"agent's generated code" — it lists the contents of `/`, reads an
environment variable named `AWS_SECRET_KEY`, and attempts to make an
outbound network request. Run directly on the host:

```bash
python3 agent_generated_code.py
```
```
/: bin  boot  dev  etc  home  lib  proc  root  srv  usr  var
AWS_SECRET_KEY: sk-live-a1b2c3d4e5f6...
outbound request to evil.example.com: succeeded
```

The exact same script, run inside a minimal container with no
environment variables passed in, a network mode set to `none`, and only
its own project directory mounted:

```bash
docker run --rm --network none -v $(pwd)/project:/app my-agent-sandbox
```
```
/: app
AWS_SECRET_KEY: (not set)
outbound request to evil.example.com: failed — network is unreachable
```

Same code, dramatically different capabilities — not because the code
changed, but because the boundary around it did. This is the shape of
the actual problem: you don't need to fully trust code to safely run it,
if the container around it only exposes exactly what that code is
supposed to need.

---

## A trap the isolation motivation makes worse, not better: secrets in images

Isolation only helps if you don't undermine it yourself — and there's a
specific, easy mistake worth naming here: baking a secret (an API key, a
`.env` file, a database password) directly into an image, rather than
passing it in at `docker run` time [the way `-e` does, covered later in this lesson](→ this lesson, building and running a container concept, the environment variables explanation). A `COPY .env .` instruction, or a hardcoded key in a `RUN` command, means that secret is now baked permanently into the image itself — present in every layer, every container built from it, and anywhere that image ever gets pushed or shared, even if the file is later deleted in a subsequent instruction. Deleting a file in a later layer doesn't remove it from the earlier layer where it was actually added — [the same layer-caching mechanics from later in this lesson](→ this lesson, layer caching concept) mean the earlier layer, secret included, is still sitting there in the image's history. The fix, previewed here and covered properly later: pass secrets in at run time, never bake them into the build.

---

## Quiz cards

> **Q1.** What does a virtual environment's isolation boundary actually
> cover?
> - A) The entire operating system, including system libraries
> - B) Only Python packages within one Python installation — it can't isolate or change the OS or system libraries beneath it ✅
> - C) Only the specific Python version being used
> - D) Nothing — venvs don't actually isolate anything

> **Q2.** Beyond making code run consistently across machines, what's the
> second motivation for containers this section introduces?
> - A) Containers make code run faster
> - B) Restricting what running code can actually access — filesystem, network, credentials — as a genuine security boundary, not just a consistency guarantee ✅
> - C) Containers eliminate the need for testing
> - D) Containers automatically fix bugs in the code they run

> **Q3.** In the isolation demo, why does the containerized version fail
> to read `AWS_SECRET_KEY` or reach `evil.example.com`, when the exact
> same script succeeds at both when run directly on the host?
> - A) The script itself is different in the container
> - B) The container simply doesn't have that environment variable passed in, and its network access is explicitly disabled — the code's capabilities are limited by what the container exposes, not by the code itself ✅
> - C) Containers can't make network requests at all, ever
> - D) `AWS_SECRET_KEY` is a reserved name Docker always blocks

> **Q4.** Why does deleting a secret file in a later Dockerfile
> instruction (e.g., `RUN rm .env`) fail to actually remove it from the
> resulting image?
> - A) `rm` doesn't work inside Docker builds
> - B) The file was already baked into an earlier layer when it was copied in — a later layer deleting it doesn't erase it from that earlier layer, which is still part of the image ✅
> - C) This actually does fully remove it — there's no real risk here
> - D) Only `COPY` instructions can be deleted, not `RUN` instructions

---

*(End of Concept 1. This lesson continues with Concept 2 — images vs.
containers — drafted separately.)*
