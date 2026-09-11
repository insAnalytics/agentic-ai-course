# Module 0, Lesson 8 — Concept 2: Images vs. containers

---

## The analogy: a class, and its instances

An **image** is a fixed, built definition — a filesystem snapshot plus
instructions for what to run — the same way [a class is a fixed definition of attributes and behavior](→ Module 0, the OOP lesson, class fundamentals concept, the __init__ explanation), not a specific object yet. A **container** is a running instance of that image — the same way `Agent("research_agent", "claude-sonnet")` produces one specific object *from* the `Agent` class. Exactly like a class, one image can produce many containers, each one an independent running instance, the same way `agent_a` and `agent_b` were separate instances of the same `Agent` class with their own separate state.

```python
class Agent:
    def __init__(self, name: str):
        self.name = name

agent_a = Agent("research_agent")
agent_b = Agent("support_agent")
```
*(the exact analogy, shown as Python — not part of this lesson's code,
just the comparison point)*

```bash
docker build -t my-app .         # defines the "class" — the image
docker run --name run_a my-app   # one "instance" — a container
docker run --name run_b my-app   # a second, independent "instance"
```
*(the Docker equivalent of the same shape)*

---

## Proving the isolation, live

**Interactive terminal demo:** two panes, both started from containers
of the *same* image (a small app with a `counter.txt` file inside it). In
pane A, the learner runs a command that increments a number inside
`counter.txt` and writes it back. In pane B, running a *separate*
container from the same image, `cat counter.txt` still shows the
original starting value — pane A's change never touched pane B's
container, or the image itself. Starting a brand-new container from the
same image, in a third pane, confirms it starts fresh at the original
value too — proving the change lived only inside that one specific
container instance, not the image it came from.

This is the direct payoff of the analogy: modifying one `Agent`
instance's `self.name` never touches another instance, or the `Agent`
class itself — modifying one running container never touches another
container, or the image it was built from.

---

## Quiz cards

> **Q1.** What's the relationship between a Docker image and a Docker
> container, using the class/instance analogy?
> - A) They're the same thing, just different names
> - B) An image is the fixed definition, like a class; a container is one running instance of it, like an object created from that class ✅
> - C) A container is the definition, an image is the running instance
> - D) One image can only ever produce one container

> **Q2.** In the isolation demo, why does pane B's container still show
> the original `counter.txt` value after pane A's container modified its
> own copy?
> - A) The demo has a bug — this shouldn't happen
> - B) Each container is an independent instance with its own isolated filesystem — changes inside one container don't affect another container or the underlying image ✅
> - C) `counter.txt` is a special read-only file
> - D) Containers automatically sync their filesystems with each other

> **Q3.** If you start a brand-new container from the same image after
> pane A already modified its own container's `counter.txt`, what value
> does the new container start with?
> - A) Whatever pane A's container currently has
> - B) The original value baked into the image — a new container is a fresh instance, unaffected by changes made inside any other container ✅
> - C) An error, since the image has already been "used"
> - D) The average of every container's current value

---

*(End of Concept 2. This lesson continues with Concept 3 — writing a
Dockerfile — drafted separately.)*
