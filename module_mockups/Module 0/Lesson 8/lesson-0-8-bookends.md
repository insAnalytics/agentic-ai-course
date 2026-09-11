# Containerize Applications with Docker

> **You'll be able to**
> - Explain why containers solve two separate problems a venv can't —
>   environment consistency, and restricting what running code can
>   actually access — and avoid baking secrets into an image
> - Write a Dockerfile using the core instructions plus the three
>   look-alike pairs (`COPY`/`ADD`, `CMD`/`ENTRYPOINT`, `ENV`/`ARG`),
>   along with `USER` and `EXPOSE`
> - Build and run a container, manage its full lifecycle
>   (`ps`/`logs`/`exec`/`stop`/`rm`), and persist data across container
>   restarts with volumes
> - Order Dockerfile instructions and write a `.dockerignore` to keep
>   builds fast and images free of unnecessary or sensitive files
> - Read a `docker-compose.yml` describing more than one related
>   container, and explain how services reach each other by name

**Why it matters**
Once an agent is more than a script on your own machine — something
deployed, something that runs someone else's generated code, something
with a database behind it — containers are how it actually gets shipped
and how its access to the outside world gets deliberately limited. The
isolation problem this lesson opened with isn't incidental to agentic
work: an agent executing tool calls or running LLM-generated code is
exactly the situation where restricting filesystem, network, and
credential access matters most, and everything from `USER` to volumes to
`docker-compose` in this lesson is building toward being able to define
that boundary deliberately, not accept whatever a process would otherwise
have access to by default.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all seven concepts, mixed order)*

> **Q1.** Beyond making code run consistently across machines, what's the
> second motivation for containers this lesson introduces?
> - A) Containers make code run faster
> - B) Restricting what running code can actually access — filesystem, network, credentials — as a genuine security boundary ✅
> - C) Containers eliminate the need for testing
> - D) Containers automatically fix bugs in the code they run

> **Q2.** What's the relationship between a Docker image and a Docker
> container?
> - A) They're the same thing, just different names
> - B) An image is the fixed definition, like a class; a container is one running instance of it, like an object created from that class ✅
> - C) A container is the definition, an image is the running instance
> - D) One image can only ever produce one container

> **Q3.** Why does `ADD backup.tar.gz /app/` behave differently from
> `COPY backup.tar.gz /app/`?
> - A) They behave identically
> - B) `ADD` automatically extracts a local archive's contents into the destination, rather than copying the archive file itself ✅
> - C) `COPY` doesn't work with compressed files
> - D) `ADD` requires the file to already exist inside the container

> **Q4.** Given `CMD ["python3", "app.py"]`, what happens if you run
> `docker run my-app echo hello`?
> - A) `python3 app.py` runs, then `echo hello` runs after it
> - B) `CMD` is entirely replaced — the container runs `echo hello` instead ✅
> - C) It raises an error, since `CMD` can't be overridden
> - D) Both commands run concurrently

> **Q5.** Why can't a running container read an `ARG` value from its own
> environment at runtime?
> - A) This is a bug
> - B) `ARG` only exists during the build itself; it's gone by the time a container actually runs, unlike `ENV` ✅
> - C) `ARG` values are encrypted
> - D) `ARG` and `ENV` are identical in every way

> **Q6.** What does adding a non-root `USER` instruction to a Dockerfile
> actually accomplish?
> - A) Nothing — containers are equally safe either way
> - B) It limits what the running process can do even within the container's own boundary, instead of running with full root permissions by default ✅
> - C) It only affects who can build the image
> - D) It's required for every Dockerfile to build

> **Q7.** What does `docker exec` do?
> - A) Builds a new image from a running container
> - B) Runs a command inside an already-running container, useful for inspecting or debugging it live ✅
> - C) Stops a container immediately
> - D) Lists every image on the machine

> **Q8.** Why does data written inside a container disappear once that
> container is removed, even though the image it came from still exists?
> - A) This shouldn't happen
> - B) A container's filesystem is its own, separate from the image and other containers — removing the container removes everything written into it ✅
> - C) Images automatically absorb changes made inside their containers
> - D) Only `docker stop` causes data loss, not `docker rm`

> **Q9.** Why does changing one unrelated line in `app.py` trigger a full
> `pip install` reinstall, if `COPY . .` comes before it in the
> Dockerfile?
> - A) It shouldn't happen
> - B) `COPY . .` sees the changed file, invalidating its own cache, which cascades forward and invalidates the install layer too ✅
> - C) `pip install` always reinstalls everything regardless of caching
> - D) Editing `app.py` automatically edits `requirements.txt`

> **Q10.** How does a `.dockerignore` entry for `.env` help prevent
> secrets from ending up in an image?
> - A) It doesn't — unrelated to secrets
> - B) `.env` is excluded from the build context before any `COPY` instruction runs, so it can't end up in the image regardless of how the Dockerfile is written ✅
> - C) It encrypts `.env` automatically
> - D) It only works if `.env` is also listed in the Dockerfile

---

## Comprehensive project — downloadable

*(this lesson's one intentional downloadable — a complete small app plus
a full `Dockerfile` and `docker-compose.yml`, meant to be pulled down
once and run locally to see build, lifecycle, volumes, caching, and
compose working together, rather than fragmented across separate
in-browser exercises)*

**What's provided:** a small Flask API (`agent_registry`) that stores
agent configs in Postgres — `app.py`, `requirements.txt`, a starter
(intentionally naive) `Dockerfile`, and a `docker-compose.yml` missing
its volume. The project download includes a `README.md` with the full
walkthrough below.

> Before starting, make sure Docker is actually installed and running —
> see [the Docker setup guide](→ Help tab, Docker setup) if you haven't
> installed it yet. This lesson covers what Docker *is* and how to use
> it; getting it installed on your own machine is a separate step,
> covered there instead of here.

**The walkthrough:**

1. **Fix the Dockerfile's instruction order** so the dependency-install
   layer survives unrelated code changes — [the pattern from this lesson's layer-caching concept](→ this lesson, layer caching and dockerignore concept).
2. **Add a `.dockerignore`** excluding `.git`, `__pycache__/`, `*.pyc`,
   and `.env` (a `.env` file with a fake `SECRET_KEY` is included
   specifically to be excluded, not copied in).
3. **Add a non-root `USER`** to the Dockerfile, rather than running as
   root by default.
4. **Build the image**, confirm the fix worked by editing `app.py` and
   rebuilding — the install step should show `Using cache`.
5. **Add the missing volume** to `docker-compose.yml`'s `db` service, so
   Postgres's data survives a container restart — the exact gap [flagged in this lesson's docker-compose concept](→ this lesson, a brief look ahead docker-compose concept, the docker-compose.yml explanation).
6. **Run everything with `docker-compose up`**, confirm both services
   start and `app` successfully connects to `db` by hostname.
7. **Register an agent config** by hitting the API (`curl` command
   provided in the README), then **restart just the `db` container**
   (`docker-compose restart db`) and confirm, via the API again, that
   the config is still there — proving the volume actually worked.
8. **Practice the lifecycle**: use `docker ps` to find the running
   containers, `docker logs` to check `app`'s startup output,
   `docker exec` into the `app` container to confirm the `.env` file
   genuinely isn't present inside it, then `docker-compose down` to
   tear everything down cleanly.

**Why this is the one downloadable, not several small ones:** every
piece of this lesson only really makes sense together — a Dockerfile
without the lifecycle commands to actually operate it, or a volume
without a real restart to prove it worked, teaches the syntax without
the payoff. Pulling this down once and working through the full
walkthrough is meant to be the moment where every separate concept from
this lesson visibly clicks into one real, working thing — the same role
[the comprehensive sandbox plays in every other lesson](→ Module 0, the OOP lesson, the bookends comprehensive sandbox explanation), just shaped as something run locally instead of graded in-browser, since this is the one lesson in this course where that's genuinely the right fit.

---

> **For Claude Code:** Simar is planning a new top-level **Help tab** for
> the site — a collection of local setup guides for the various tools
> this course ends up requiring (Docker being the first: installing
> Docker Desktop / Engine, confirming it's running, first-run
> troubleshooting), separate from lesson content itself. The distinction
> being drawn: lessons teach *concepts* (what Docker is, how to use it);
> the Help tab teaches *environment setup* (getting the tool installed
> and working on a learner's own machine) — a gap noticed specifically
> because this lesson's comprehensive project assumes a working local
> Docker install with nothing in the lesson itself covering how to get
> there. Expect more lessons to reference a Help tab entry the same way
> this one does, as more tools requiring local setup come up later in
> the course (a local LLM runtime, `ngrok`, a database client, etc.) —
> this is a pattern to build support for, not a one-off for Docker.
>
> **Deliberately deferred, not a near-term task:** Simar is the only
> consumer of the site right now, so there's no point building out the
> actual Help tab content until the course itself is complete — this
> note (and the in-lesson pointers like the one above) are placeholders
> marking where a Help tab entry will eventually need to exist, not a
> request to build the Help tab now. Revisit once the course is done.
