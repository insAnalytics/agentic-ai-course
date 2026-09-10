# Module 0, Lesson 6 — Concept 3: Working with CSV

---

## CSV: rows of values, no built-in type information

CSV (Comma-Separated Values) is the other data format you'll run into
constantly — batch inputs, exported spreadsheets, eval datasets. Unlike
JSON, it has no real structure beyond rows and columns — every value is
just text, and there's no built-in concept of numbers, booleans, or
nesting:

```
name,model,temperature
research_agent,claude-sonnet,0.7
support_agent,claude-haiku,0.3
```
*(a plain CSV file, shown for reference — not Python code, not run live)*

The first row is conventionally a header naming each column, but nothing
in the CSV format itself enforces that — it's just a convention every
tool agrees to follow. Python's `csv` module (standard library, like
`json`) handles the parsing, but it's worth knowing upfront: CSV is a
plainer format than JSON, and that shows up directly in how you work with
it.

---

## `csv.reader` — rows as lists

```python
import csv

with open("agents.csv", "r") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)
```
```
['name', 'model', 'temperature']
['research_agent', 'claude-sonnet', '0.7']
['support_agent', 'claude-haiku', '0.3']
```
*(runs live, shows output — read-only demo snippet, not graded)*

`csv.reader(f)` wraps an already-open file object — same pattern as
`json.load(f)` — and gives you something iterable, one list per row,
including the header row itself as an ordinary row. Note every value is a
string, including `'0.7'` — CSV has no concept of numeric types, so
`temperature` comes back as text and needs manual conversion
(`float(row[2])`) if you actually need it as a number.

---

## `csv.writer` — the reverse direction

```python
import csv

rows = [
    ["name", "model", "temperature"],
    ["research_agent", "claude-sonnet", "0.7"],
    ["support_agent", "claude-haiku", "0.3"],
]

with open("agents.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(rows)
```
*(writes a file — not run live in this format, but produces the exact
file shown at the top of this section)*

`writer.writerows(rows)` writes every row in one call; `writer.writerow(row)`
(singular) writes just one, useful inside a loop where rows are being
built up one at a time. `newline=""` in the `open()` call is CSV-specific
boilerplate worth just knowing to include — without it, some platforms
write an extra blank line between rows due to how the underlying file
mode handles line endings.

---

## `csv.DictReader` and `csv.DictWriter` — rows as dicts

Working with each row as a plain list means remembering that
`row[2]` is the temperature, `row[0]` is the name — the same
position-dependent fragility [lists have compared to dicts](→ Module 0, the data structures lesson, dicts concept). `csv.DictReader` fixes this by using the header row to key each row by column name instead of position:

```python
import csv

with open("agents.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row)
        print(row["temperature"])
```
```
{'name': 'research_agent', 'model': 'claude-sonnet', 'temperature': '0.7'}
0.7
{'name': 'support_agent', 'model': 'claude-haiku', 'temperature': '0.3'}
0.3
```
*(runs live, shows output — read-only demo snippet, not graded)*

`DictReader` automatically treats the first row as headers — it's no
longer included as a data row the way it was with plain `csv.reader`. Each
row comes back as a dict keyed by column name, and `row["temperature"]`
is far more robust to a column getting reordered in the source file than
`row[2]` ever was. Values are still all strings, same caveat as before.

`csv.DictWriter` is the matching write side — it needs to know the column
names upfront (`fieldnames`), and can write a header row for you:

```python
import csv

rows = [
    {"name": "research_agent", "model": "claude-sonnet", "temperature": "0.7"},
    {"name": "support_agent", "model": "claude-haiku", "temperature": "0.3"},
]

with open("agents.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "model", "temperature"])
    writer.writeheader()
    writer.writerows(rows)
```
*(writes a file — not run live in this format, but produces the exact
file shown at the top of this section)*

`fieldnames` also determines column order in the output, and
`writer.writeheader()` writes that header row explicitly — `DictWriter`
doesn't infer it automatically from the dicts, since a dict's own keys
[aren't guaranteed to print in a specific order you should rely on](→ Module 0, the data structures lesson, dicts concept, the iteration example) the way `fieldnames` being stated upfront is.

---

## Quiz cards

> **Q1.** What type is every value read from a CSV file, before any
> manual conversion?
> - A) Whatever type the value looks like (numbers stay numbers, etc.)
> - B) A string, always — CSV has no built-in concept of numeric or boolean types ✅
> - C) `None` for anything that isn't text
> - D) It depends on the column's position

> **Q2.** What does `csv.reader(f)` return each row as?
> - A) A dict, keyed by column name
> - B) A list of string values, including the header row as an ordinary row ✅
> - C) A single combined string per row
> - D) A tuple of typed values

> **Q3.** How does `csv.DictReader` decide what key to use for each value
> in a row?
> - A) It uses the column's numeric position, same as a list
> - B) It uses the first row's values as column names, then keys every subsequent row's dict by those names ✅
> - C) It requires the keys to be passed in manually
> - D) It generates generic keys like "col1", "col2"

> **Q4.** Why is `row["temperature"]` from a `DictReader` generally more
> robust than `row[2]` from a plain `csv.reader`?
> - A) `DictReader` automatically converts strings to numbers
> - B) Looking up by column name doesn't break if a column gets reordered in the source file, unlike a fixed numeric position ✅
> - C) There's no real difference between the two
> - D) `csv.reader` doesn't support numeric indexing at all

> **Q5.** Why does `csv.DictWriter` need `writer.writeheader()` called
> explicitly, rather than inferring the header row automatically from the
> dicts being written?
> - A) `DictWriter` never writes a header, `writeheader()` doesn't exist
> - B) A dict's keys aren't guaranteed to appear in a specific reliable order — stating `fieldnames` explicitly fixes both the header and the column order ✅
> - C) `writeheader()` is only needed for JSON, not CSV
> - D) Headers are optional and rarely used in practice

---

## Applied sandbox exercise 1

*(file I/O + CSV + JSON together — read a CSV, transform it, write the
result as JSON)*

*Starter code shown to learner:*
```python
import csv
import json

def csv_to_json_summary(csv_path: str, json_path: str) -> None:
    """
    csv_path: path to a CSV file with columns "name", "model", "temperature"
    json_path: path to write the output JSON file to

    Read every row from csv_path using DictReader, and build a list of
    dicts shaped like:
      {"name": ..., "model": ..., "temperature": <float, converted from the CSV string>}

    Write that list to json_path as JSON, using indent=2.
    This function doesn't return anything — it only writes the file.
    """
    # TODO: implement using csv.DictReader, float(), and json.dump
    pass
```

*Task shown to learner:* Read `csv_path` with `csv.DictReader`, convert
each row's `"temperature"` from a string to a `float`, collect the
results into a list of dicts, and write that list to `json_path` as
JSON with `indent=2`.

*Hidden test cases:*
```python
# setup: a temp CSV file is created before this runs, containing:
# name,model,temperature
# research_agent,claude-sonnet,0.7
# support_agent,claude-haiku,0.3

csv_to_json_summary("agents.csv", "agents.json")

with open("agents.json", "r") as f:
    result = json.load(f)

assert result == [
    {"name": "research_agent", "model": "claude-sonnet", "temperature": 0.7},
    {"name": "support_agent", "model": "claude-haiku", "temperature": 0.3},
]
assert isinstance(result[0]["temperature"], float)
```

*Hint (shown on request):* Open the CSV with `with open(csv_path, "r") as f:`,
wrap it in `csv.DictReader(f)`, and loop through it building a new dict per
row — `{"name": row["name"], "model": row["model"], "temperature": float(row["temperature"])}`
— appending each to a list. Then `with open(json_path, "w") as out:` and
`json.dump(the_list, out, indent=2)`.

*Correct answer + explanation (shown on failure, if requested):*
```python
import csv
import json

def csv_to_json_summary(csv_path: str, json_path: str) -> None:
    results = []
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            results.append({
                "name": row["name"],
                "model": row["model"],
                "temperature": float(row["temperature"]),
            })

    with open(json_path, "w") as out:
        json.dump(results, out, indent=2)
```
This is the first real pipeline in this lesson: `with` guarantees both
files close properly even if something goes wrong mid-conversion,
`DictReader` gives each row readable-by-name access, `float()` handles the
string-to-number conversion CSV never does automatically, and `json.dump`
writes the transformed result back out in a completely different format —
composing every piece from the first three concepts of this lesson.

---

*(End of Concept 3. This lesson continues with Concept 4 — custom
exceptions and exception hierarchies — drafted separately.)*
