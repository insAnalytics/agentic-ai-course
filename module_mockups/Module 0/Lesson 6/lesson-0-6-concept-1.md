# Module 0, Lesson 6 — Concept 1: File I/O and context managers

---

## Opening a file, and the cleanup problem

`open()` gives you a **file object** — a handle to the actual file on
disk, not the file's contents directly:

```python
f = open("notes.txt", "r")
contents = f.read()
f.close()

print(contents)
```
```
first line
second line
```
*(runs live, shows output — read-only demo snippet, not graded)*

`"r"` is the **mode** — `"r"` for reading (the default if omitted),
`"w"` for writing (creates the file if it doesn't exist, and **overwrites**
it completely if it does), `"a"` for appending (writes get added to the
end, the existing content is left alone). `f.close()` releases the
underlying operating system resource — skipping it isn't just untidy,
it can leave a file locked or its contents not fully flushed to disk.

The problem: `f.close()` only runs if execution actually reaches that
line. If something raises an exception in between `open()` and `close()`,
the file never gets closed — the same [line-by-line execution model from the Python setup lesson](→ Module 0, the Python setup lesson, execution model concept, the line-by-line crash example) means Python just stops wherever the error happened:

```python
f = open("notes.txt", "r")
contents = f.read()
result = 1 / 0   # crashes here — f.close() below never runs
f.close()
```
```
Traceback (most recent call last):
  File "script.py", line 3, in <module>
    result = 1 / 0
ZeroDivisionError: division by zero
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## `with` — guaranteed cleanup, even on exception

You've already seen the fix for "cleanup that must happen no matter what"
— [`finally`, from the error handling concept back in the Python setup lesson](→ Module 0, the Python setup lesson, error handling concept, the finally explanation). File handling has dedicated syntax for exactly this pattern, since it's common enough to deserve its own shorthand: `with`.

```python
with open("notes.txt", "r") as f:
    contents = f.read()
    result = 1 / 0   # still crashes — but f is already closed by the time this runs

print(contents)
```
```
Traceback (most recent call last):
  File "script.py", line 3, in <module>
    result = 1 / 0
ZeroDivisionError: division by zero
```
*(runs live, shows output — read-only demo snippet, not graded)*

The `ZeroDivisionError` still happens and still propagates — `with`
doesn't swallow exceptions — but the file is guaranteed to be closed
before that traceback ever reaches you, whether the block finishes
normally or crashes partway through. `f` is only valid inside the
indented block; there's no `f.close()` to remember or forget. This is
Python's version of Java's try-with-resources — a dedicated syntax for
"acquire something, guarantee its cleanup," rather than relying on a
programmer to remember a matching `finally`.

`open()` returning something usable with `with` is what makes it a
**context manager** — an object that defines what should happen on entry
(here, nothing extra — the file's already open) and on exit (closing the
file), regardless of how the block ends. You won't write your own context
manager in this course, but recognizing the pattern matters: any object
usable after `with ... as ...:` is promising the same guarantee `with
open(...)` gives you.

---

## Reading a file: four ways, and when each fits

```python
with open("notes.txt", "r") as f:
    contents = f.read()   # everything, as one string
print(repr(contents))
```
```
'first line\nsecond line\n'
```
*(runs live, shows output — read-only demo snippet, not graded)*

`.read()` loads the entire file into memory as a single string, newlines
and all — fine for small files, wasteful for anything large.

```python
with open("notes.txt", "r") as f:
    line = f.readline()
    print(repr(line))
    line = f.readline()
    print(repr(line))
```
```
'first line\n'
'second line\n'
```
*(runs live, shows output — read-only demo snippet, not graded)*

`.readline()` reads exactly one line at a time, remembering where it left
off between calls — useful when you need fine control over reading one
line, checking it, and deciding whether to read further.

```python
with open("notes.txt", "r") as f:
    lines = f.readlines()
print(lines)
```
```
['first line\n', 'second line\n']
```
*(runs live, shows output — read-only demo snippet, not graded)*

`.readlines()` reads the whole file at once, same as `.read()`, but
returns a list of lines instead of one string — still loads everything
into memory up front.

```python
with open("notes.txt", "r") as f:
    for line in f:
        print(line.strip())   # .strip() removes the trailing newline
```
```
first line
second line
```
*(runs live, shows output — read-only demo snippet, not graded)*

Directly iterating the file object with `for line in f:` is the most
idiomatic option for processing a file line by line — a file object is
itself an [iterable, in exactly the sense covered back in the control flow concept](→ Module 0, the Python setup lesson, control flow concept, the for-loop iterable explanation), handing out one line at a time without ever loading the whole file into memory at once. For a genuinely large file, this matters: `.read()`/`.readlines()` on a multi-gigabyte file can exhaust memory; the `for` version never holds more than one line at a time.

Since a file object is an iterator, `next()` works on it directly too,
pulling one line at a time by hand — the same mechanism the `for` loop
uses internally, just invoked one step at a time yourself:

```python
with open("notes.txt", "r") as f:
    print(next(f))
    print(next(f))
```
```
first line

second line

```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Writing to a file

Writing uses `"w"` or `"a"` mode and `.write()`, which — unlike `print()`
— doesn't add a newline automatically:

```python
with open("output.txt", "w") as f:
    f.write("first line\n")
    f.write("second line\n")

with open("output.txt", "r") as f:
    print(f.read())
```
```
first line
second line

```
*(runs live, shows output — read-only demo snippet, not graded)*

Opening the same file again with `"w"` overwrites it completely — worth
being careful about, since there's no confirmation or undo:

```python
with open("output.txt", "w") as f:
    f.write("only this line now\n")

with open("output.txt", "r") as f:
    print(f.read())
```
```
only this line now

```
*(runs live, shows output — read-only demo snippet, not graded)*

`"a"` mode instead adds to the end without touching what's already there:

```python
with open("output.txt", "a") as f:
    f.write("appended line\n")

with open("output.txt", "r") as f:
    print(f.read())
```
```
only this line now
appended line

```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## `.seek()` and `.tell()` — moving around inside a file

A file object tracks its current read/write position internally — every
`.read()`, `.readline()`, or `next()` call advances it. `.tell()` reports
the current position (in bytes); `.seek()` jumps to a specific position
directly:

```python
with open("notes.txt", "r") as f:
    print(f.tell())          # 0 — just opened, at the very start
    first_line = f.readline()
    print(f.tell())          # advanced past the first line

    f.seek(0)                 # jump back to the beginning
    print(f.readline())       # reads the first line again
```
```
0
11
first line

```
*(runs live, shows output — read-only demo snippet, not graded)*

`f.seek(0)` is the common case — rewinding to re-read a file from the
start within the same `with` block, without closing and reopening it.

---

## Quiz cards

> **Q1.** What does `open("file.txt", "w")` do if `file.txt` already
> exists and already has content?
> - A) It raises an error, refusing to overwrite
> - B) It overwrites the file completely — the existing content is gone the moment the file is opened in this mode ✅
> - C) It appends to the existing content
> - D) It merges the new and old content automatically
>
> *Explanation: `"w"` mode truncates the file immediately on open — `"a"`
> is the mode that preserves existing content and adds to the end.*

> **Q2.** Why can a plain `open()`/`.close()` pair leave a file open even
> when you wrote the `.close()` line?
> - A) `.close()` never actually works
> - B) If an exception occurs between `open()` and `.close()`, execution stops at that point and never reaches the `.close()` line ✅
> - C) Files close themselves automatically after a fixed timeout
> - D) `.close()` only works inside a function

> **Q3.** What guarantee does `with open(...) as f:` provide that a plain
> `open()`/`.close()` pair doesn't?
> - A) It prevents any exception from occurring inside the block
> - B) The file is guaranteed to be closed when the block ends, whether it finishes normally or raises an exception ✅
> - C) It automatically retries on failure
> - D) It reads the file faster
>
> *Explanation: this is the same "cleanup that must happen regardless"
> guarantee `finally` provides, applied via dedicated syntax for the
> specific, very common case of resource cleanup.*

> **Q4.** Why is `for line in f:` generally preferred over `f.readlines()`
> for processing a large file line by line?
> - A) `for line in f:` is only valid syntax for small files
> - B) `.readlines()` loads the entire file into memory at once; iterating the file object directly hands out one line at a time without ever holding the whole file in memory ✅
> - C) `.readlines()` doesn't actually work on text files
> - D) There's no real difference between the two

> **Q5.** What's the practical difference between `.read()` and
> `.readlines()`?
> - A) `.read()` only reads one line; `.readlines()` reads the whole file
> - B) Both load the entire file into memory, but `.read()` returns one string while `.readlines()` returns a list of individual lines ✅
> - C) `.readlines()` is faster in every case
> - D) `.read()` doesn't include newline characters, `.readlines()` does

> **Q6.** After reading part of a file, what does `f.seek(0)` do?
> - A) Closes the file
> - B) Moves the file's read position back to the very beginning, so the next read starts over from there ✅
> - C) Deletes everything read so far
> - D) Skips to the end of the file

---

*(End of Concept 1. This lesson continues with Concept 2 — working with
JSON — drafted separately.)*
