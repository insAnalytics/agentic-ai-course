# Module 0, Lesson 2 — Concept 2: Tuples

---

## Literal syntax, and how it differs from a list

A tuple looks almost like a list, but uses parentheses instead of brackets
— and, crucially, it's immutable:

```python
point = (3, 5)
print(point[0])   # indexing works the same as lists
```
```
3
```
*(runs live, shows output — read-only demo snippet, not graded)*

```python
point[0] = 10
```
```
Traceback (most recent call last):
  File "script.py", line 1, in <module>
    point[0] = 10
TypeError: 'tuple' object does not support item assignment
```
*(runs live, shows output — read-only demo snippet, not graded)*

This is the whole point of a tuple: once created, it can't be changed. If
you're coming from Java, there's no exact built-in equivalent pre-records
(Java 16+); it's closer to a fixed, unmodifiable array. C#'s tuple type is a
much closer match syntactically.

---

## Why use a tuple instead of a list

Immutability is a signal, not just a restriction — a tuple says "this is a
fixed, small collection of related values that won't change," while a list
says "this is a growable collection." A coordinate pair, an RGB color, a
(name, age) record — these are naturally tuples, because there's no reason
to append a fourth value to a coordinate.

```python
rgb = (255, 0, 0)     # a color has exactly 3 parts, always
tools = ["calculator", "search"]   # a list of tools can grow
```
*(no output — illustrating intent through the two types, not running code)*

---

## Unpacking

You can assign a tuple's values directly to multiple variables in one line:

```python
point = (3, 5)
x, y = point

print(x)
print(y)
```
```
3
5
```
*(runs live, shows output — read-only demo snippet, not graded)*

This also explains something you may not have thought twice about: when a
Python function "returns multiple values" with `return a, b, c`, it's
actually returning a single tuple — the comma-separated values on the right
of `return` get packed into one automatically, and `a, b, c = some_function()`
unpacks them back out on the receiving end.

```python
def min_max(numbers):
    return min(numbers), max(numbers)

lowest, highest = min_max([4, 1, 9, 2])
print(lowest, highest)
```
```
1 9
```
*(runs live, shows output — read-only demo snippet, not graded)*

---

## Quiz cards

> **Q1.** What happens when you try to run `point[0] = 10` on a tuple?
> - A) It works, tuples are just lists with different brackets
> - B) `TypeError` — tuples don't support item assignment ✅
> - C) It silently does nothing
> - D) `IndexError`
>
> *Explanation: tuples are immutable — once created, their contents can't
> be reassigned.*

> **Q2.** When would a tuple be the better choice over a list?
> - A) When you need to add and remove items frequently
> - B) When the collection has a fixed, known size and shouldn't change, like a coordinate pair ✅
> - C) Tuples are always better than lists
> - D) When you need to sort the values
>
> *Explanation: a tuple communicates "fixed structure, won't grow or
> shrink" — a list communicates the opposite.*

> **Q3.** What's actually happening when a function does `return a, b, c`?
> - A) Python returns three separate values simultaneously, unrelated to tuples
> - B) The three values are packed into a single tuple, which is what's actually returned ✅
> - C) This is invalid syntax outside of a list
> - D) Only the last value (`c`) is returned
>
> *Explanation: `return a, b, c` packs the values into one tuple object.
> `x, y, z = some_function()` then unpacks that tuple back into separate
> variables on the receiving end.*

---

## Applied sandbox exercise 2

*(composes tuple unpacking with a running comparison, no sorting needed)*

*Starter code shown to learner:*
```python
def closest_pair(points, target_x):
    """
    points: a list of (x, y) tuples.
    target_x: a number.
    Return the single (x, y) tuple whose x-value is closest to target_x.
    E.g. closest_pair([(1, 5), (8, 2), (4, 9)], 5) -> (4, 9)
    """
    # TODO: implement using tuple unpacking and a running comparison
    pass
```

*Task shown to learner:* For each point, unpack it into `x, y`, and
calculate its distance from `target_x` as `abs(x - target_x)`. Keep track
of the point with the smallest distance seen so far as you loop through the
list, and return it at the end.

*Hidden test cases:*
```python
assert closest_pair([(1, 5), (8, 2), (4, 9)], 5) == (4, 9)
assert closest_pair([(0, 0), (10, 0)], 9) == (10, 0)
assert closest_pair([(3, 1)], 100) == (3, 1)
```

*Hint (shown on request):* Start by assuming the first point is closest,
and track its distance. Loop through the rest, unpack each into `x, y`,
compute `abs(x - target_x)`, and update your "closest so far" whenever you
find a smaller distance.

*Correct answer + explanation (shown on failure, if requested):*
```python
def closest_pair(points, target_x):
    closest = points[0]
    smallest_distance = abs(closest[0] - target_x)

    for point in points:
        x, y = point
        distance = abs(x - target_x)
        if distance < smallest_distance:
            smallest_distance = distance
            closest = point

    return closest
```
This loops through the points, unpacking each `(x, y)` tuple to check its
distance from `target_x`, and keeps track of the closest one seen so far —
combining tuple unpacking with the loop/comparison pattern from earlier in
the module.

---

*(End of Concept 2. This lesson continues with Concept 3 — dicts — drafted
separately.)*
