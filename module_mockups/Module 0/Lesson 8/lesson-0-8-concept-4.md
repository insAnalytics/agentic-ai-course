# Module 0, Lesson 8 — Concept 4: Building and running a container

> **Note: this draft assumes an ideal, infra-unconstrained sandbox** — see
> the note at the top of Concept 1. Interactive elements describe the
> target experience, not something runnable in the current site today.

---

## From Dockerfile to running container

Two commands take you from a Dockerfile to something actually running:

```bash
docker build -t my-app .
docker run my-app
```

`docker build -t my-app .` reads the `Dockerfile` in the current
directory (`.`), and produces an image tagged `my-app` — a name you can
refer back to later, rather than a long generated ID. `docker run
my-app` then starts a container from that image — [an instance from that class](→ this lesson, images vs. containers concept, the analogy explanation), in the terms of the previous section.

---

## Reaching a container from outside: port mapping

A web app running *inside* a container is, by default, only reachable
from inside that container — nothing on your own machine can connect to
it. `-p` maps a port on your machine to a port inside the container:

```bash
docker run -p 8000:5000 my-app
```

`8000:5000` reads as "your machine's port 8000 forwards to the
container's port 5000" — the app itself, inside the container, might be
listening on port 5000 (a Flask default), but from outside, you'd reach
it at `localhost:8000`.

**Ideal interactive demo:** running that command in the terminal pane,
followed by a live embedded browser preview pointed at `localhost:8000`,
actually showing the running app's response — directly connecting the
abstract "port mapping" concept to something tangibly reachable.

---

## Passing configuration in: environment variables

Real apps usually need configuration that shouldn't be baked into the
image itself — an API key, a mode flag. `-e` passes an environment
variable into a running container:

```bash
docker run -p 8000:5000 -e DEBUG_MODE=true my-app
```

The same thing can be set as a default *inside* the Dockerfile with
`ENV`, overridable at `docker run` time:

```dockerfile
ENV DEBUG_MODE=false
```

**Ideal interactive demo:** the same app, run twice with different `-e`
values, the live browser preview showing visibly different behavior
(e.g., a debug banner appearing or not) — making the effect of the flag
directly observable, not just asserted in prose.

---

## Quiz cards

> **Q1.** What does `docker build -t my-app .` actually do?
> - A) It starts a container running immediately
> - B) It builds an image from the Dockerfile in the current directory, tagging it `my-app` for later reference ✅
> - C) It only validates the Dockerfile's syntax without building anything
> - D) It requires a container to already be running

> **Q2.** In `docker run -p 8000:5000 my-app`, what does `8000:5000`
> mean?
> - A) The container will run for exactly 8000 to 5000 seconds
> - B) Your machine's port 8000 forwards to port 5000 inside the container — reaching `localhost:8000` externally connects to whatever's listening on 5000 inside ✅
> - C) The image must be exactly 8000MB, truncated to 5000MB
> - D) It sets two separate environment variables

> **Q3.** Why is port mapping needed at all — why isn't a container's
> internal port automatically reachable from outside?
> - A) It actually is automatically reachable; `-p` is optional
> - B) A container's network is isolated by default — nothing outside it can connect in unless a port is explicitly mapped ✅
> - C) `-p` is only needed for HTTPS traffic
> - D) Containers don't have their own network at all

> **Q4.** What's the difference between setting `ENV` in a Dockerfile
> versus passing `-e` at `docker run` time?
> - A) They're unrelated — `ENV` sets Python variables, `-e` sets OS variables
> - B) `ENV` sets a default baked into the image itself; `-e` at run time can override that default for a specific container ✅
> - C) `-e` only works if `ENV` isn't set in the Dockerfile at all
> - D) `ENV` only takes effect after the container has already started

---

## Applied sandbox exercise 2

*(ideal version — build, run with port mapping and an environment
variable, verify via the live preview)*

*Task shown to learner:* Using the Dockerfile from the previous exercise,
run the resulting image mapping the container's port 5000 to your
machine's port 8000, and pass `DEBUG_MODE=true` as an environment
variable. Confirm, via the live preview, that the app is reachable and
shows debug mode enabled.

*Grading (ideal):* checked against the actual running container's
response — a real HTTP request made to the mapped port, checking both
that it responds and that the debug-mode-specific content is present.

---

*(End of Concept 4. This lesson continues with Concept 5 — layer caching
— drafted separately.)*
