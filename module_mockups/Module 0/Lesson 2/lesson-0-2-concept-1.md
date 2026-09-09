# Module 0, Lesson 2 — Concept 1: Lists

---

## If you're coming from another language

Python's `list` is closer to Java's `ArrayList` or JavaScript's `Array` than
to a C-style fixed array — it resizes automatically and isn't restricted to
one type:

```python
mixed = [1, "two", 3.0, True]   # perfectly valid — no single type required
print(mixed)
```
```
[1, 'two', 3.0, True]
```
*(runs live, shows output — read-only demo snippet, not graded)*

This flexibility is convenient, but it also means Python won't catch a type
mistake in a list at compile time the way a strictly-typed array would —
worth keeping in mind given what we covered about runtime vs. compile-time
errors in Lesson 0.1.

---

## Literal syntax and indexing

A list is an ordered, mutable collection — you've already seen the syntax
used without explanation back in Lesson 0.1:

```python
tools = ["calculator", "search", "memory"]

print(tools[0])      # first item
print(tools[-1])      # last item — negative indices count from the end
```
```
calculator
memory
```
*(runs live, shows output — read-only demo snippet, not graded)*

Negative indexing is Python-specific — if you're coming from Java/C++,
there's no `tools[tools.length - 1]` needed; `-1` just means "last."

---

## Slicing

`list[start:stop]` pulls a sub-list — `start` is inclusive, `stop` is
exclusive:

```python
numbers = [10, 20, 30, 40, 50]

print(numbers[1:3])     # index 1 up to (not including) 3
print(numbers[:2])      # from the start
print(numbers[2:])      # to the end
print(numbers[-2:])     # last two, using negative indices
```
```
[20, 30]
[10, 20]
[30, 40, 50]
[40, 50]
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Mutability and common methods

Lists can be changed in place after creation — this is different from
strings, which are immutable in Python (an operation like `.upper()`
returns a *new* string rather than modifying the original):

```python
tools = ["calculator", "search"]

tools.append("memory")           # add to the end
tools.insert(0, "planner")       # insert at a specific index
tools.remove("search")           # remove by value
last = tools.pop()                # remove and return the last item

print(tools)
print(last)
```
```
['planner', 'calculator']
'memory'
```
*(runs live, shows output — read-only demo snippet, not graded)*

```python
numbers = [3, 1, 4, 1, 5]
numbers.sort()
print(numbers)
```
```
[1, 1, 3, 4, 5]
```
*(runs live, shows output — read-only demo snippet, not graded)*

`.sort()` modifies the list in place and returns `None`; it doesn't return
the sorted list. If you want a sorted copy without touching the original,
use `sorted(numbers)` instead, which returns a new list.

---

## Quiz cards

> **Q1.** Which existing data structure is Python's `list` closest to?
> - A) A fixed-size C-style array
> - B) Java's `ArrayList` or JS's `Array` — resizable, no single required type ✅
> - C) A Java primitive array
> - D) There's no reasonable comparison
>
> *Explanation: a Python list resizes automatically and can hold mixed
> types, unlike a fixed, single-type C-style array.*

> **Q2.** What does `tools[-1]` return?
> - A) An error — negative indices aren't valid
> - B) The last item in the list ✅
> - C) The first item, counted backwards
> - D) `None`
>
> *Explanation: negative indices count from the end — `-1` is the last
> item, `-2` the second-to-last, and so on.*

> **Q3.** What does `numbers[1:3]` include, given
> `numbers = [10, 20, 30, 40, 50]`?
> - A) `[20, 30]` ✅
> - B) `[20, 30, 40]`
> - C) `[10, 20, 30]`
> - D) `[30]`
>
> *Explanation: slicing is inclusive of `start` and exclusive of `stop` —
> index 1 and 2, not 3.*

> **Q4.** After `numbers.sort()`, what does the expression itself return?
> - A) The sorted list
> - B) `None` — `.sort()` mutates in place and returns nothing ✅
> - C) A boolean indicating success
> - D) The number of items sorted
>
> *Explanation: methods that mutate a list in place (like `.sort()`,
> `.append()`) typically return `None`. Use `sorted(numbers)` if you want a
> new sorted list back as a value.*

---

## Applied sandbox exercise 1

*Starter code shown to learner:*
```python
def top_two_scores(scores):
    """
    scores: a list of integers.
    Return the two highest scores, as a list, in descending order.
    E.g. [5, 1, 9, 3] -> [9, 5]
    """
    # TODO: implement using sorting and slicing
    pass
```

*Task shown to learner:* Sort the scores in descending order, then slice
out the top two.

*Hidden test cases:*
```python
assert top_two_scores([5, 1, 9, 3]) == [9, 5]
assert top_two_scores([1, 2]) == [2, 1]
assert top_two_scores([7, 7, 7]) == [7, 7]
```

*Hint (shown on request):* `sorted(scores, reverse=True)` gives you a new
list sorted highest-first, without mutating the original — then slice the
first two with `[:2]`.

*Correct answer + explanation (shown on failure, if requested):*
```python
def top_two_scores(scores):
    return sorted(scores, reverse=True)[:2]
```
`sorted(..., reverse=True)` returns a new descending-order list in one
step, and `[:2]` slices the first two items from it — combining sorting and
slicing from this section.

---

*(End of Concept 1. This lesson continues with Concept 2 — tuples — drafted
separately.)*
