# Module 0, Lesson 2 — Concept 4: Sets

---

## If you're coming from another language

A Python `set` is the equivalent of Java's `HashSet` or C#'s `HashSet<T>` —
an unordered collection with no duplicates. Literal syntax uses curly
braces, like a dict, but with just values instead of key-value pairs:

```python
seen_tools = {"calculator", "search", "calculator", "memory"}
print(seen_tools)
```
```
{'calculator', 'search', 'memory'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

The duplicate `"calculator"` collapses automatically; a set can never
contain the same value twice. Note also there's no guaranteed order — don't
rely on a set printing or iterating in the order you added items.

---

## Why use a set: fast membership checks and deduplication

Two things a set is genuinely good for:

```python
available_tools = {"calculator", "search", "memory", "planner"}

print("search" in available_tools)      # membership check
print("weather" in available_tools)
```
```
True
False
```
*(runs live, shows output — read-only demo snippet, not graded)*

This `in` check works on a list too (as you saw back in Lesson 0.1), but on
a set it's effectively instant regardless of size, where a list has to
check items one by one. If you're just checking "does this exist," a set is
the right tool once the collection gets large.

```python
requested = ["search", "calculator", "search", "memory", "calculator"]
unique_requested = set(requested)
print(unique_requested)
```
```
{'search', 'calculator', 'memory'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

Converting a list to a `set()` is the standard way to deduplicate it.

---

## Basic set operations

```python
available = {"calculator", "search", "memory"}
requested = {"search", "planner"}

print(available & requested)     # intersection — in both
print(available | requested)     # union — in either
print(available - requested)     # difference — in available, not requested
```
```
{'search'}
{'calculator', 'search', 'memory', 'planner'}
{'calculator', 'memory'}
```
*(runs live, shows output — read-only demo snippet, not graded)*

A common use in agent code: `requested & available` tells you exactly which
requested tools actually exist.

---

## Quiz cards

> **Q1.** What happens to duplicate values in a set literal like
> `{"a", "b", "a"}`?
> - A) An error is raised
> - B) Duplicates are silently collapsed — the set only keeps one of each value ✅
> - C) They're kept, sets allow duplicates
> - D) Only the last duplicate is kept, others are dropped with a warning
>
> *Explanation: a set's defining property is no duplicates — adding an
> existing value has no effect.*

> **Q2.** Why prefer a set over a list for a large collection you only need
> to check membership in?
> - A) Sets use less memory in all cases
> - B) `in` on a set is effectively instant regardless of size, while a list checks items one by one ✅
> - C) Lists don't support the `in` operator at all
> - D) There's no real difference
>
> *Explanation: set membership checks don't scale with size the way a
> list's linear scan does — this matters once collections get large.*

> **Q3.** What does `available & requested` compute?
> - A) Everything in either set
> - B) Everything in both sets — the intersection ✅
> - C) Everything in `available` only
> - D) A syntax error
>
> *Explanation: `&` is set intersection — only values present in both sets.*

---

*(No applied sandbox exercise for this concept — kept intentionally light,
since sets are lower-value for this course's agent-building focus than
lists/dicts/tuples. The comprehensive exercise at the end of the lesson can
still draw on sets if relevant.)*

*(End of Concept 4. This lesson continues with Concept 5 — comprehensions —
drafted separately.)*
