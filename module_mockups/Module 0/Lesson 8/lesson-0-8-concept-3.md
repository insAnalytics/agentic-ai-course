# Module 0, Lesson 8 — Concept 3: Writing a Dockerfile

> **Note: this draft assumes an ideal, infra-unconstrained sandbox** — see
> the note at the top of Concept 1. Interactive elements describe the
> target experience, not something runnable in the current site today.

---

## The instructions, one at a time

A `Dockerfile` is a plain text file — a recipe describing how to build
an image, read and executed top to bottom, similar in spirit to
[Python's own top-to-bottom execution model](→ Module 0, the Python setup lesson, execution model concept). A minimal one for a small Python script:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python3", "app.py"]
```

- **`FROM python:3.12-slim`** — start from an existing base image (here,
  a small, official image that already has Python 3.12 installed) rather
  than building an OS up from nothing. Every Dockerfile starts with
  `FROM`.
- **`WORKDIR /app`** — set the working directory inside the image;
  every instruction after this runs relative to `/app`, similar to
  `cd`-ing into a folder before running further commands.
- **`COPY requirements.txt .`** — copy a file from your own machine
  (the "build context") into the image.
- **`RUN pip install -r requirements.txt`** — execute a command *during
  the build*, baking its result into the image itself.
- **`COPY . .`** — copy the rest of the project's files in.
- **`CMD ["python3", "app.py"]`** — the command that runs when a
  container is actually started from this image (not during the build
  itself) — this is what makes `docker run` do something specific.

---

## Watching the build happen

**Ideal interactive demo:** an editable Dockerfile pane on the left, a
"Build" button, and a live build-log pane on the right. Clicking Build
streams real output, one instruction at a time:

```
Step 1/6 : FROM python:3.12-slim
 ---> a1b2c3d4e5f6
Step 2/6 : WORKDIR /app
 ---> Running in 7g8h9i0j1k2l
 ---> 3m4n5o6p7q8r
Step 3/6 : COPY requirements.txt .
 ---> 9s0t1u2v3w4x
Step 4/6 : RUN pip install -r requirements.txt
 ---> Running in 5y6z7a8b9c0d
Collecting requests==2.31.0
Successfully installed requests-2.31.0
 ---> 1e2f3g4h5i6j
Step 5/6 : COPY . .
 ---> 7k8l9m0n1o2p
Step 6/6 : CMD ["python3", "app.py"]
 ---> Running in 3q4r5s6t7u8v
 ---> 9w0x1y2z3a4b
Successfully built 9w0x1y2z3a4b
Successfully tagged my-app:latest
```

Each `Step N/6` line corresponds directly, one for one, to a line in the
Dockerfile the learner is editing — changing `python:3.12-slim` to
`python:3.11-slim` and rebuilding shows Step 1 pull a different base
image; adding a package to `requirements.txt` and rebuilding shows Step 4
install something new. The connection between "line in the file" and
"step in the build" is made directly visible, not just described.

---

## Applied sandbox exercise 1

*(ideal version — writing a Dockerfile from a description, graded against
the resulting build log and/or a run of the resulting image)*

*Task shown to learner:* Given a small Flask app (`app.py`, already
provided) and a `requirements.txt` listing `flask`, write a `Dockerfile`
that: uses a `python:3.12-slim` base, sets the working directory to
`/app`, installs the requirements, copies in the rest of the project, and
runs `app.py` as its `CMD`. The build should succeed, and running the
resulting image should start the Flask app without error.

*Grading (ideal):* the learner's Dockerfile is actually built and run
against the real backend runtime; success is "the build completes and
the container starts without crashing," checked directly rather than by
comparing file text.

---

## Quiz cards

> **Q1.** What does `FROM python:3.12-slim` do?
> - A) It installs Python 3.12 on your own machine
> - B) It starts the image build from an existing base image that already has Python 3.12 installed, rather than starting from nothing ✅
> - C) It's optional — every Dockerfile works without a `FROM` line
> - D) It only affects how the container runs, not how it's built

> **Q2.** What's the difference between `RUN` and `CMD`?
> - A) They're interchangeable
> - B) `RUN` executes a command during the build, baking its result into the image; `CMD` specifies the command that runs later, when a container actually starts ✅
> - C) `CMD` runs during the build; `RUN` runs when the container starts
> - D) `RUN` can only be used once per Dockerfile, `CMD` can be used many times

> **Q3.** What does `WORKDIR /app` set up for the instructions that
> follow it?
> - A) It has no effect on later instructions
> - B) A working directory inside the image that later instructions (like `COPY` and `RUN`) execute relative to ✅
> - C) It only affects the final `CMD` instruction
> - D) It sets an environment variable named `WORKDIR`

---

*(End of Concept 3. This lesson continues with Concept 4 — building and
running a container — drafted separately.)*
