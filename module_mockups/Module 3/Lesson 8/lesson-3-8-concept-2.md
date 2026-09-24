# Module 3, Lesson 8 — Concept 2: Why "restricted" execution isn't a sandbox

---

## The tempting shortcut

The obvious way to run model-written code is Python's built-in `exec()`, which runs a string of code. Running it raw is plainly unsafe: the code can `import os` and do anything you can. So the natural next thought is to *restrict* it, by handing it an environment with the dangerous names removed.

`exec(code, globals)` takes a globals dictionary, and Python looks up names there. Pass one with an emptied `__builtins__`, and the usual functions seem to disappear:

```python
# a model-written tool call: "compute the mean of these numbers"
safe_looking_code = "print(sum([4, 8, 15, 16, 23, 42]) / 6)"

# the tool runs it with an empty builtins, which looks like it removes everything dangerous
namespace = {"__builtins__": {}}
try:
    exec(safe_looking_code, namespace)
except NameError as e:
    print("even sum() is gone:", e)
```
```
even sum() is gone: name 'print' is not defined
```
*(runs live, shows output — read-only demo snippet, not graded)*

`print`, `open`, `sum`, `__import__`: all gone. It looks locked down. A model can't call `open` if `open` doesn't exist.

## Why it isn't safe

The trouble is that the code is still running *in your process*, with your interpreter, and Python objects carry references to their own machinery. Even with no builtins at all, the code can start from a plain value and walk through Python's own class structure to reach classes it was never handed:

```python
# with __builtins__ emptied, this expression still reaches a class the host can use to run commands.
# it walks from a literal to its base object to every subclass Python has loaded.
probe = "().__class__.__base__.__subclasses__()"
subclasses = eval(probe, {"__builtins__": {}})
dangerous = [c.__name__ for c in subclasses if c.__name__ in ("Popen", "_wrap_close")]
print(f"reachable classes: {len(subclasses)}")
print(f"among them, ones that can start processes or run shell commands: {dangerous}")
```
```
reachable classes: 162
among them, ones that can start processes or run shell commands: ['_wrap_close']
```
*(runs live, shows output — read-only demo snippet, not graded; the demo stops at showing such a class is reachable, and never uses it)*

From an empty environment, the code reached a list of every class the interpreter has loaded, some of which can run shell commands. This is a single, well-known example, and the point isn't the specific trick. It's the general fact underneath it: **hiding names is not the same as removing capability.** The code runs with all the power of the process it runs in, and no amount of cleaning the namespace changes that. Libraries exist that harden this approach much further, but the security community's consistent verdict is that in-process restriction of a full language is the wrong foundation to bet safety on.

There's a plainer way to see it: the interpreter running the untrusted code is the same interpreter running your agent. They share one process, one filesystem handle table, one set of loaded modules, one memory space. A boundary you can reason about has to be *outside* that shared process, which is the next concept.

## The one legitimate use of restriction

Removing builtins and passing in a small set of allowed names is still worth doing, not as your security boundary, but as a first, convenient filter on top of a real one. It stops the model's honest mistakes early (a stray `open()` fails immediately with a clear error the model can react to), and it makes the intended surface explicit. The rule is only that it must never be the *only* thing between untrusted code and your system.

---

## Quiz cards

> **Q1.** After `exec(code, {"__builtins__": {}})`, why can the code still reach dangerous classes?
> - A) `exec` ignores the globals argument
> - B) The code runs in your process, and Python objects carry references through which other classes can be reached ✅
> - C) `__builtins__` can't actually be emptied
> - D) The dangerous classes were left in the globals by mistake
>
> *Explanation:* Emptying the namespace hides names. The code still executes with the full power of the interpreter it runs in, and can navigate to capabilities from any object.

> **Q2.** What's the general lesson the subclasses example illustrates?
> - A) One specific expression needs to be blocked
> - B) `eval` is safe but `exec` is not
> - C) Hiding names is not the same as removing capability ✅
> - D) Restriction works if you also ban underscores
>
> *Explanation:* Blocking that one expression wouldn't make in-process execution safe. The problem is structural: shared process, shared power.

> **Q3.** Is stripping builtins and allowing a small name set ever worth doing?
> - A) No, it provides nothing and should be skipped
> - B) Yes, but only as a convenience filter on top of a real boundary, never as the only protection ✅
> - C) Yes, it's a complete sandbox on its own
> - D) Only for trusted code
>
> *Explanation:* It catches honest mistakes early and makes the intended surface clear. It just can't be the thing you rely on to contain untrusted code.

---

*(End of Concept 2. This lesson continues with Concept 3 — real isolation.)*
