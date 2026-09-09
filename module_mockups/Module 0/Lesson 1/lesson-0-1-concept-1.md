# Module 0, Lesson 1 — Concept 1: Set up Python

> Audience note: this section assumes the learner already knows how to code.
> It covers what's specific to Python's tooling and execution model — not
> general programming concepts.

> **Callout:** none of this is required for the sandbox exercises in this
> course — those run entirely in your browser. You'll need this setup only
> when you get to the downloadable local projects later in the course.

---

## Installing Python

Go to [python.org/downloads](https://python.org/downloads) and install the
latest Python 3.x. On macOS/Linux, Python 3 may already be present but often
outdated — install a current version rather than relying on the system one,
since some tools (and most current libraries) expect recent language
features.

Verify from a terminal:
```bash
python3 --version
# Python 3.12.4
```
On Windows, the command is usually `python` rather than `python3` — check
with `python --version` if `python3` isn't found.

---

## VS Code setup

If you're not already set up: install the **Python extension** (Microsoft's
official one) from the Extensions panel. Two things it gets you that matter
immediately:

- **Interpreter selection** — VS Code needs to know *which* Python it's
  running (system install, or a venv — see below). `Ctrl/Cmd+Shift+P` →
  "Python: Select Interpreter". Get this wrong and imports that work in your
  terminal will show false errors in the editor.
- **IntelliSense + inline debugging** — autocomplete against installed
  packages, and breakpoints without dropping into `pdb`.

---

## Virtual environments — and why they're not optional

Coming from languages with project-scoped dependencies by default (Node's
`node_modules`, Go modules), Python's default is the opposite: `pip install`
without a venv installs *globally*, shared across every project on your
machine. Two projects needing different versions of the same package will
silently conflict.

A virtual environment is an isolated, project-local copy of the Python
interpreter + its own package set.

```bash
python3 -m venv .venv          # create it, once per project
source .venv/bin/activate      # activate it (macOS/Linux)
.venv\Scripts\activate         # activate it (Windows)
```
Your terminal prompt changes to show `(.venv)` once active — that's your
signal that `pip install` now stays local to this project. `deactivate`
exits it.

---

## Package management

Python's built-in tool for installing packages is `pip` (Package Installer
for Python) — it downloads packages from PyPI (the Python Package Index)
and installs them into your active environment.

```bash
pip install requests
```
installs into the active venv. To make dependencies reproducible for anyone
else (or your future self):
```bash
pip freeze > requirements.txt
```
which produces a file like this:
```
requests==2.31.0
python-dotenv==1.0.1
pydantic==2.7.1
```
Just package names pinned to exact versions, one per line. Anyone can then
reinstall the same set with:
```bash
pip install -r requirements.txt
```
No lockfile resolution, no build metadata — this is the baseline standard.
More structured alternatives (`pyproject.toml`-based tools) exist and we may
introduce one later for the downloadable projects, but `requirements.txt` is
what you'll see in the majority of existing Python codebases.

---

## Execution model, compared to what you already know

If you're coming from Java, C++, or Go: there's no separate compile step
producing a binary. Python is interpreted — `python3 script.py` reads and
executes the file directly, top to bottom, line by line.

```python
print("this runs immediately, no build step")
```
```
this runs immediately, no build step
```
*(runs live, shows output — read-only demo snippet, not graded)*

The line-by-line part has a sharp consequence: Python doesn't scan the whole
file for problems before running anything. It executes until it hits an
error, then stops — code *after* that point never runs, even if it also
contains an obvious mistake.

```python
print("step 1: starting")
print(1 + "2")          # TypeError — crashes here
print("step 2: this line has undefined_variable_xyz too, but you'll never see that error")
```
```
step 1: starting
Traceback (most recent call last):
  File "script.py", line 2, in <module>
    print(1 + "2")
TypeError: unsupported operand type(s) for +: 'int' and 'str'
```
*(runs live, shows output — read-only demo snippet, not graded)*

Notice the third `print` line has its own bug (an undefined variable), but
Python never even reaches it. In a compiled language, a type mismatch like
`1 + "2"` might be caught before the program runs at all; here, it's only
found when execution actually reaches that line.

This is part of why the try/except patterns later in this lesson matter more
in Python than they might in a language where the compiler already ruled out
entire error classes.

---

## Quiz cards

> **Q1.** You run `pip install requests` and it works, but a teammate cloning
> your repo gets `ModuleNotFoundError: No module named 'requests'` when they
> run your script. Most likely cause?
> - A) They have a different OS
> - B) You installed it without an active venv, or forgot to share `requirements.txt` ✅
> - C) `requests` is a Python 2 package
> - D) They need to reinstall Python
>
> *Explanation: without a shared `requirements.txt` (or a venv commit
> convention), installed packages don't travel with the code — only the
> `.py` files do.*

> **Q2.** Why does VS Code sometimes show a false "import not found" error
> even though `python3 script.py` runs fine in your terminal?
> - A) VS Code doesn't support Python well
> - B) The wrong interpreter is selected — VS Code is pointing at a different Python/venv than your terminal uses ✅
> - C) The extension needs to be reinstalled
> - D) The file needs to be saved first
>
> *Explanation: VS Code and your terminal can each resolve to a different
> Python install if the interpreter isn't explicitly selected to match the
> venv you're actually using.*

> **Q3.** What does `pip` actually do?
> - A) It's Python's built-in testing framework
> - B) It downloads and installs packages from PyPI into your environment ✅
> - C) It compiles Python code
> - D) It's a virtual environment manager
>
> *Explanation: `pip` (Package Installer for Python) is the standard tool for
> fetching packages from PyPI and installing them.*

> **Q4.** A script has a bug on line 2 and another unrelated bug on line 10.
> You run it. What happens?
> - A) Both errors are reported together
> - B) It crashes at line 2; line 10's bug is never reached or reported ✅
> - C) It skips line 2 and runs line 10 first
> - D) Neither error shows since Python auto-corrects
>
> *Explanation: Python executes top to bottom and stops at the first
> unhandled error — later bugs in the file are simply never run, not fixed
> or ignored intentionally.*

---

*(End of Concept 1. This lesson continues with Concept 2 — control flow and
syntax comparison — and Concept 3 — error handling with try/except — drafted
separately.)*
