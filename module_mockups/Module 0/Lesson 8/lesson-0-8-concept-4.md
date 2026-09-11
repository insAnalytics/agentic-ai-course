# Module 0, Lesson 8 — Concept 4: Building, running, and the container lifecycle

---

## From Dockerfile to running container

```bash
docker build -t my-app .
docker run my-app
```

`docker build -t my-app .` reads the `Dockerfile` in the current
directory, producing an image tagged `my-app`. `docker run my-app`
starts a container from that image — [an instance from that class](→ this lesson, images vs. containers concept, the analogy explanation), in the terms of the earlier concept.

---

## Reaching a container from outside: port mapping

A process running *inside* a container is, by default, only reachable
from inside that container. `-p` maps a port on your machine to a port
inside the container:

```bash
docker run -p 8000:5000 my-app
```

`8000:5000` reads as "your machine's port 8000 forwards to the
container's port 5000." From outside, you'd reach the app at
`localhost:8000`, even though the app itself, inside the container,
might be listening on 5000. Recall [`EXPOSE` alone doesn't do this](→ this lesson, writing a Dockerfile concept, the EXPOSE explanation) — `-p` is what actually publishes the port.

---

## Overriding configuration at run time

[`ENV` sets a default baked into the image](→ this lesson, writing a Dockerfile concept, the ENV vs ARG explanation); `-e` at `docker run` time overrides it for a specific container, without needing to rebuild the image:

```bash
docker run -p 8000:5000 -e LOG_LEVEL=debug my-app
```

---

## Running in the background: `-d`

Every example so far ties up the terminal — the container runs in the
foreground, printing its output directly, until you stop it or it exits.
`-d` ("detached") starts it in the background instead, immediately
returning control of the terminal and printing the new container's ID:

```bash
docker run -d -p 8000:5000 my-app
```
```
a1b2c3d4e5f67890abcdef1234567890fedcba0987654321abcdef012345678
```

This is the normal way to run something you intend to keep running while
you do other things — including, as covered next, actually inspecting
and managing it.

---

## The lifecycle: seeing, reading, entering, and stopping a container

**`docker ps`** lists currently running containers:

```bash
docker ps
```
```
CONTAINER ID   IMAGE     COMMAND            PORTS                    NAMES
a1b2c3d4e5f6   my-app    "python3 app.py"   0.0.0.0:8000->5000/tcp   happy_turing
```

**`docker logs`** shows a container's output — everything it's printed,
even though it's running detached and nothing is streaming to your
terminal directly:

```bash
docker logs a1b2c3d4e5f6
```
```
Starting app on port 5000...
Connected successfully
```

**`docker exec`** runs a command *inside* an already-running container —
useful for inspecting or debugging something live, without stopping it:

```bash
docker exec a1b2c3d4e5f6 cat /app/requirements.txt
```
```
flask==3.0.0
```

**`docker stop`** and **`docker rm`** end a container's life: `stop`
sends a shutdown signal and waits for it to exit gracefully; `rm`
actually removes the stopped container (its filesystem, its logs,
everything) — a stopped container still exists until it's explicitly
removed:

```bash
docker stop a1b2c3d4e5f6
docker rm a1b2c3d4e5f6
```

You can refer to a container by its full ID, a shortened prefix (as
shown above), or the auto-generated name `docker ps` displays (like
`happy_turing`) — all three work interchangeably with every command in
this section.

---

## Quiz cards

> **Q1.** In `docker run -p 8000:5000 my-app`, what does `8000:5000`
> mean?
> - A) The container will run for 8000 to 5000 seconds
> - B) Your machine's port 8000 forwards to port 5000 inside the container ✅
> - C) The image must be a specific size
> - D) It sets two separate environment variables

> **Q2.** What's the effect of `-e LOG_LEVEL=debug` at `docker run` time,
> given the image already sets `ENV LOG_LEVEL=info`?
> - A) It has no effect — `ENV` values in the image can never be overridden
> - B) It overrides the image's default for this specific container, without needing to rebuild the image ✅
> - C) It causes the container to fail to start
> - D) It permanently changes the image's baked-in default

> **Q3.** What does `-d` change about how a container runs?
> - A) It makes the container run faster
> - B) It runs the container in the background ("detached"), immediately returning control of the terminal instead of streaming output directly to it ✅
> - C) It deletes the container immediately after it finishes
> - D) It disables networking for the container

> **Q4.** What does `docker logs` show for a container running detached?
> - A) Nothing — detached containers don't produce any output
> - B) Everything the container has printed, even though it isn't streaming to your terminal directly ✅
> - C) Only error messages, never normal output
> - D) The container's Dockerfile

> **Q5.** What's `docker exec` used for?
> - A) Building a new image from a running container
> - B) Running a command inside an already-running container, useful for inspecting or debugging it live ✅
> - C) Stopping a container immediately
> - D) Listing every image on the machine

> **Q6.** What's the difference between `docker stop` and `docker rm`?
> - A) They're interchangeable
> - B) `stop` gracefully shuts down a running container; `rm` actually removes a stopped container's filesystem and logs — a stopped container still exists until it's removed ✅
> - C) `rm` stops a container; `stop` removes it
> - D) `stop` only works on images, `rm` only works on containers

---

## Applied sandbox exercise 1

*(the full lifecycle — build, run detached with port mapping and an
environment variable override, inspect, exec, then clean up)*

*Task shown to learner:* Given a provided Flask app (`app.py`,
`requirements.txt`) and its Dockerfile from the previous concept's
material:
1. Build the image, tagged `my-app`.
2. Run it detached, mapping the container's port `5000` to your
   machine's port `8000`, overriding `LOG_LEVEL` to `debug` via `-e`.
3. Confirm it's running with `docker ps`.
4. Check its startup output with `docker logs`.
5. Use `docker exec` to print the contents of `/app/requirements.txt`
   from inside the running container.
6. Stop and remove the container.

*Grading (against the real container runtime, not simulated output):*
checks that an image named `my-app` exists after step 1; that a running
container is mapped to host port 8000 after step 2; that its logs
contain evidence `LOG_LEVEL=debug` actually took effect; that the
`docker exec` command's output matches the real file contents inside the
container; and that no container from this image is still running after
the final step.

---

*(End of Concept 4. This lesson continues with Concept 5 — persisting
data with volumes — drafted separately.)*
