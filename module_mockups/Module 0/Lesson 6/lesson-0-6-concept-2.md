# Module 0, Lesson 6 — Concept 2: Working with JSON

---

## JSON is just text — and it maps directly onto dicts and lists

JSON (JavaScript Object Notation) is a plain-text format for structured
data — and not coincidentally, it's shaped almost exactly like Python's
own dicts and lists, which is a large part of why it's the default format
for API requests/responses, config files, and tool-call arguments alike:

```json
{
    "name": "research_agent",
    "model": "claude-sonnet",
    "temperature": 0.7,
    "tags": ["search", "reasoning"]
}
```
*(a plain JSON file, shown for reference — not Python code, not run live)*

Read that side by side with a Python dict literal and the resemblance is
immediate — JSON objects become dicts, JSON arrays become lists, JSON
strings/numbers/booleans/`null` become `str`/`int` or `float`/`bool`/
`None`. The `json` module (part of the standard library — no install
needed) converts between the two directly.

---

## Reading JSON from a file: `json.load`

```python
import json

with open("config.json", "r") as f:
    config = json.load(f)

print(config)
print(type(config))
print(config["temperature"])
```
```
{'name': 'research_agent', 'model': 'claude-sonnet', 'temperature': 0.7, 'tags': ['search', 'reasoning']}
<class 'dict'>
0.7
```
*(runs live, shows output — read-only demo snippet, not graded)*

`json.load(f)` takes an already-open file object (note: not a filename —
you still need [`with open(...)` from the previous section](→ this lesson, file I/O and context managers concept, the with statement explanation) to get one) and parses its entire contents into ordinary Python data — here, a `dict`, since the file's top level is a JSON object. Once parsed, it's just a regular dict — every dict operation from [the data structures lesson](→ Module 0, the data structures lesson, dicts concept) applies normally.

---

## Writing JSON to a file: `json.dump`

The reverse direction — converting Python data into JSON text and writing
it to a file — uses `json.dump`:

```python
import json

config = {
    "name": "research_agent",
    "model": "claude-sonnet",
    "temperature": 0.7,
    "tags": ["search", "reasoning"],
}

with open("config.json", "w") as f:
    json.dump(config, f, indent=2)
```
*(writes a file — not run live in this format, but produces the exact
file shown at the top of this section, reformatted with indent=2)*

`indent=2` is optional but worth using by default for anything a human
might read later — without it, `json.dump` writes the most compact form
possible, all on one line, which is valid JSON but painful to read.

---

## `json.loads` / `json.dumps` — the string versions

Sometimes JSON arrives as a string you already have in memory — an API
response body, for instance — rather than something sitting in a file.
`json.loads` (load **s**tring) and `json.dumps` (dump to a **s**tring) do
the same conversions, without any file involved:

```python
import json

json_text = '{"tool": "search", "arguments": {"query": "weather"}}'
parsed = json.loads(json_text)

print(parsed)
print(parsed["arguments"]["query"])

back_to_text = json.dumps(parsed)
print(back_to_text)
```
```
{'tool': 'search', 'arguments': {'query': 'weather'}}
weather
searching for weather
{"tool": "search", "arguments": {"query": "weather"}}
```
*(runs live, shows output — read-only demo snippet, not graded)*

The naming is consistent across all four: `load`/`dump` work with an
already-open file object; `loads`/`dumps` work with a plain string — the
`s` suffix specifically flags "string," not "load safely" or anything
else. It's easy to reach for the wrong one out of habit, so it's worth
checking which you actually have (a file object, or a string) before
picking which function to call.

---

## When the JSON itself is malformed: `JSONDecodeError`

Parsing can fail — the text might not actually be valid JSON at all
(a trailing comma, a missing quote, truncated data from a network error):

```python
import json

broken_json = '{"name": "research_agent", "model": }'
config = json.loads(broken_json)
```
```
Traceback (most recent call last):
  File "script.py", line 4, in <module>
    config = json.loads(broken_json)
json.decoder.JSONDecodeError: Expecting value: line 1 column 39 (char 38)
```
*(runs live, shows output — read-only demo snippet, not graded)*

`JSONDecodeError` is a normal exception, catchable exactly like any other
[from the Python setup lesson's error handling concept](→ Module 0, the Python setup lesson, error handling concept, the except explanation):

```python
import json

broken_json = '{"name": "research_agent", "model": }'

try:
    config = json.loads(broken_json)
except json.JSONDecodeError:
    print("couldn't parse that as JSON")
    config = {}

print(config)
```
```
couldn't parse that as JSON
{}
```
*(runs live, shows output — read-only demo snippet, not graded)*

This matters specifically because JSON so often arrives from somewhere
you don't control — a file someone else edited by hand, a flaky network
response — so treating parsing as something that *can* fail, rather than
assuming it always succeeds, is the realistic default here.

---

## Quiz cards

> **Q1.** What Python type does a top-level JSON object (`{...}`) become
> once parsed?
> - A) A list
> - B) A dict ✅
> - C) A string
> - D) A tuple
>
> *Explanation: JSON objects map directly onto Python dicts — key-value
> pairs, looked up by key.*

> **Q2.** What's the difference between `json.load` and `json.loads`?
> - A) No difference, they're aliases
> - B) `json.load` reads from an already-open file object; `json.loads` parses an in-memory string ✅
> - C) `json.loads` is only for lists, not dicts
> - D) `json.load` is deprecated in favor of `json.loads`
>
> *Explanation: the `s` suffix specifically means "string" — `load`/`dump`
> expect a file object, `loads`/`dumps` expect/produce a plain string.*

> **Q3.** Why call `with open("config.json", "r") as f:` before
> `json.load(f)`, rather than passing the filename directly to
> `json.load`?
> - A) `json.load` doesn't accept file objects at all
> - B) `json.load` expects an already-open file object, not a filename — you still need `with open(...)` to produce one ✅
> - C) `json.load` only works with `.txt` files
> - D) There's no real reason, either would work identically
>
> *Explanation: `json.load` parses from a file object's contents — getting
> that file object still requires opening the file yourself first.*

> **Q4.** What does `indent=2` in `json.dump(config, f, indent=2)`
> actually change?
> - A) It changes which keys get included in the output
> - B) It formats the written JSON with 2-space indentation for readability — without it, the output is a single compact line ✅
> - C) It limits the file to 2 levels of nesting
> - D) It's required for `json.dump` to work at all
>
> *Explanation: `indent` is purely a formatting option — both forms
> produce valid, equivalent JSON, just easier or harder for a human to
> read.*

> **Q5.** What does `JSONDecodeError` represent, and when does it occur?
> - A) A network connectivity problem
> - B) The text being parsed isn't actually valid JSON — a syntax problem in the JSON text itself, raised by `json.load`/`json.loads` ✅
> - C) A missing file
> - D) A Python version incompatibility

---

*(End of Concept 2. This lesson continues with Concept 3 — working with
CSV — drafted separately.)*
