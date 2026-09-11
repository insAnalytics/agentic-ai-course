# Module 0, Lesson 8 — Concept 5: Persisting data with volumes

---

## The problem: a container's filesystem doesn't survive the container

[Recall from the images-vs-containers concept](→ this lesson, images vs. containers concept, the proving the isolation live explanation) that each container has its own isolated filesystem, separate from the image and from other containers. What wasn't shown there: that filesystem is also **ephemeral** — removing a container removes everything written inside it, including data you actually wanted to keep.

**Interactive terminal demo:** start a container running a small
script that appends a line to `/data/log.txt` each time it's called,
call it a few times, then stop and remove the container:

```bash
docker run --name logger my-app --once
docker run --name logger2 my-app --once
docker exec logger cat /data/log.txt   # shows both entries, as expected
docker rm -f logger logger2
docker run --rm my-app --read-log
```
```
cat: /data/log.txt: No such file or directory
```

A brand-new container, from the exact same image, has no memory of the
previous containers' writes — `/data/log.txt` never existed as far as
this new container is concerned, because it was never part of the
image, only ever written into now-deleted containers' own throwaway
filesystems.

---

## Volumes: storage that outlives a container

A **volume** is storage that exists independently of any one container —
you attach it to a container with `-v`, and it survives that container
being stopped and removed, ready to be attached to a *different*
container later:

```bash
docker volume create my-data
docker run --name logger -v my-data:/data my-app --once
docker rm -f logger
docker run --rm -v my-data:/data my-app --read-log
```
```
entry from logger
```

`my-data:/data` means "mount the volume named `my-data` at `/data`
inside the container." The first container wrote to `/data/log.txt`
inside that volume; the second container — a completely fresh one, with
no relationship to the first beyond sharing the same volume — reads it
back successfully, because the volume itself was never deleted along
with the first container.

---

## Named volumes vs. bind mounts

`docker volume create my-data` above makes a **named volume** — storage
Docker manages for you, in a location you don't need to know or care
about. The alternative is a **bind mount**: pointing directly at a real
path on your own machine instead:

```bash
docker run -v $(pwd)/local-data:/data my-app --once
```

Here, `/data` inside the container is literally `local-data` in your
current directory on the host — editable directly from outside the
container too, which is convenient for development (editing code live
without rebuilding) but less appropriate for something like a
database's actual data files, where a named volume, managed entirely by
Docker, is the more standard choice.

---

## Quiz cards

> **Q1.** Why does data written inside a container disappear once that
> container is removed, even though the image it came from still exists?
> - A) This shouldn't happen — it's a bug if it does
> - B) A container's filesystem is its own, separate from the image and other containers — removing the container removes that filesystem and everything written into it ✅
> - C) Images automatically absorb any changes made inside their containers
> - D) Data is only lost if `docker stop` is used, not `docker rm`

> **Q2.** What does a Docker volume actually solve?
> - A) It makes a container start faster
> - B) It provides storage that exists independently of any one container, so data survives that container being stopped and removed ✅
> - C) It automatically backs up an entire image
> - D) It prevents a container from ever being removed

> **Q3.** In `docker run -v my-data:/data my-app`, what does
> `my-data:/data` specify?
> - A) Two separate, unrelated environment variables
> - B) Mount the volume named `my-data` at the path `/data` inside the container ✅
> - C) Rename the container to `my-data`
> - D) Limit the container to `/data` amount of disk space

> **Q4.** What's the difference between a named volume and a bind mount?
> - A) They're identical in every way
> - B) A named volume is storage Docker manages for you; a bind mount points directly at a real path on your own machine, editable from outside the container too ✅
> - C) Bind mounts can only be used for read-only data
> - D) Named volumes require a running container to already exist first

---

*(End of Concept 5. This lesson continues with Concept 6 — layer caching
and `.dockerignore` — drafted separately.)*
