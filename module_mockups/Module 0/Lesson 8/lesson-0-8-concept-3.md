# Module 0, Lesson 8 — Concept 3: Writing a Dockerfile

---

## The core instructions

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

- **`FROM python:3.12-slim`** — start from an existing base image
  (here, a small, official image that already has Python 3.12 installed)
  rather than building an OS up from nothing. Every Dockerfile starts
  with `FROM`.
- **`WORKDIR /app`** — set the working directory inside the image;
  every instruction after this runs relative to `/app`.
- **`COPY requirements.txt .`** — copy a file from your own machine
  (the "build context") into the image.
- **`RUN pip install -r requirements.txt`** — execute a command
  *during the build*, baking its result into the image itself.
- **`COPY . .`** — copy the rest of the project's files in.
- **`CMD ["python3", "app.py"]`** — the command that runs when a
  container is actually *started* from this image, not during the build.

**Interactive terminal demo:** an editable Dockerfile pane with a
"Build" button and a live build-log pane, streaming real output — one
`Step N/6` per instruction. Editing the base image tag, or adding a
package to `requirements.txt`, and rebuilding visibly changes the
corresponding step, making the line-to-step correspondence directly
observable rather than described.

---

## Three pairs worth knowing apart

A few instructions come in look-alike pairs, where the difference
matters and is easy to get wrong.

**`COPY` vs. `ADD`.** `ADD` does everything `COPY` does, plus two extra
behaviors: it auto-extracts a local `.tar`/`.tar.gz` archive into the
destination, and it can fetch a URL directly. Those extras sound
convenient, but they're also surprising if you didn't want them:

```dockerfile
ADD backup.tar.gz /app/
```

This doesn't copy `backup.tar.gz` as a file — it silently extracts its
*contents* into `/app/`, which is rarely what someone reaching for `ADD`
out of habit actually expects. The standard guidance: default to `COPY`
for plain files, and reach for `ADD` only when you specifically want one
of those two extra behaviors, deliberately.

**`CMD` vs. `ENTRYPOINT`.** Both specify what runs when a container
starts — the difference is what happens when `docker run` includes extra
arguments. `CMD` is fully replaced by anything passed at `docker run`
time; `ENTRYPOINT`'s arguments are appended to, not replaced by, whatever
follows it:

```dockerfile
CMD ["python3", "app.py"]
```
```bash
docker run my-app echo hello
# runs: echo hello  — CMD was entirely replaced
```

```dockerfile
ENTRYPOINT ["python3", "app.py"]
```
```bash
docker run my-app --verbose
# runs: python3 app.py --verbose  — ENTRYPOINT stayed fixed, --verbose was appended
```

Use `CMD` for a default that a user might reasonably want to override
entirely; use `ENTRYPOINT` when the container should always run one
specific program, with any extra arguments just tacked onto it.

**`ENV` vs. `ARG`.** Both define a named value, but at different times
and with different lifetimes. `ARG` only exists *during the build* —
it's gone by the time a container actually runs. `ENV` persists into the
running container, readable by the app itself:

```dockerfile
ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim

ENV LOG_LEVEL=info
```

`PYTHON_VERSION` is only usable to parameterize the build itself (here,
picking which base image to use) — trying to read it from inside the
running app would find nothing, since `ARG` values never make it into
the container's actual runtime environment. `LOG_LEVEL`, defined with
`ENV`, is available to the running app via a normal environment variable
lookup, exactly the way [`os.environ`-style reads work anywhere else](→ this lesson, why containers concept, the security and isolation explanation).

---

## `USER` — not running as root by default

Without a `USER` instruction, a container runs as `root` by default —
worth pausing on, given [the isolation motivation from earlier in this lesson](→ this lesson, why containers concept, a second different reason explanation): even inside a restricted container, running as `root` gives whatever's running full permissions *within* that container's boundary, which is more access than most apps actually need. Adding a non-root user is straightforward:

```dockerfile
FROM python:3.12-slim
RUN useradd --create-home appuser
USER appuser
WORKDIR /home/appuser/app
COPY --chown=appuser:appuser . .
CMD ["python3", "app.py"]
```

`USER appuser` switches every instruction after it — and the container's
actual runtime process — to that user instead of `root`. This is a small
addition with a real payoff: it limits what a compromised or
misbehaving process running inside the container could actually do,
even within the container's own filesystem.

---

## `EXPOSE` — documentation, not a port mapping

`EXPOSE` is worth naming specifically because it's commonly
misunderstood:

```dockerfile
EXPOSE 5000
```

This does **not** actually make port 5000 reachable from outside the
container — it's purely documentation, a note to anyone reading the
Dockerfile (or using tooling that reads it) about which port the app
inside is expected to listen on. Actually publishing a port to the host
machine is [`-p`'s job, covered next in this lesson](→ this lesson, building and running a container concept, the port mapping explanation) — `EXPOSE` alone, with no `-p` at run time, leaves the container just as unreachable from outside as if it weren't there at all.

---

## Quiz cards

> **Q1.** What does `FROM python:3.12-slim` do?
> - A) It installs Python 3.12 on your own machine
> - B) It starts the image build from an existing base image that already has Python 3.12 installed, rather than starting from nothing ✅
> - C) It's optional — every Dockerfile works without a `FROM` line
> - D) It only affects how the container runs, not how it's built

> **Q2.** What's the difference between `RUN` and `CMD`?
> - A) They're interchangeable
> - B) `RUN` executes a command during the build, baking its result into the image; `CMD` specifies the command that runs later, when a container starts ✅
> - C) `CMD` runs during the build; `RUN` runs when the container starts
> - D) `RUN` can only be used once per Dockerfile, `CMD` can be used many times

> **Q3.** Why does `ADD backup.tar.gz /app/` behave differently from
> `COPY backup.tar.gz /app/`?
> - A) They behave identically — `ADD` is just an older name for `COPY`
> - B) `ADD` automatically extracts a local `.tar`/`.tar.gz` archive's contents into the destination, rather than copying the archive file itself ✅
> - C) `COPY` doesn't work with compressed files at all
> - D) `ADD` requires the file to already exist inside the container

> **Q4.** Given `CMD ["python3", "app.py"]`, what happens if you run
> `docker run my-app echo hello`?
> - A) `python3 app.py` runs, then `echo hello` runs after it
> - B) `CMD` is entirely replaced — the container runs `echo hello` instead ✅
> - C) It raises an error, since `CMD` can't be overridden
> - D) Both commands run at the same time, concurrently

> **Q5.** Given `ENTRYPOINT ["python3", "app.py"]`, what happens if you
> run `docker run my-app --verbose`?
> - A) `--verbose` replaces the entire entrypoint
> - B) `--verbose` is appended as an argument, running `python3 app.py --verbose` ✅
> - C) It raises an error — `ENTRYPOINT` doesn't accept extra arguments
> - D) `ENTRYPOINT` is ignored whenever extra arguments are passed

> **Q6.** Why can't a running container read an `ARG` value from its own
> environment at runtime?
> - A) This is a bug — `ARG` values should be readable
> - B) `ARG` only exists during the build itself; it's gone by the time a container actually runs, unlike `ENV` ✅
> - C) `ARG` values are encrypted and require a special command to read
> - D) `ARG` and `ENV` are actually identical in every way

> **Q7.** What does adding a `USER` instruction to a Dockerfile change,
> and why does it matter?
> - A) It has no real effect — containers are equally safe either way
> - B) Without it, a container runs as `root` by default; setting a non-root `USER` limits what the running process can actually do, even within the container's own boundary ✅
> - C) `USER` only affects which user can build the image, not run it
> - D) `USER` is required for every Dockerfile to build successfully

> **Q8.** What does `EXPOSE 5000` actually do?
> - A) It makes port 5000 immediately reachable from outside the container
> - B) Nothing functional by itself — it's documentation noting which port the app expects to use; actually publishing the port still requires `-p` at run time ✅
> - C) It's required for the container to run at all
> - D) It's identical in effect to `-p 5000:5000`

---

*(End of Concept 3. This lesson continues with Concept 4 — building,
running, and the container lifecycle — drafted separately.)*
