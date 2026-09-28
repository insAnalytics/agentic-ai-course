# Module 5, Lesson 5 — Concept 1: What a PDF actually contains

> **Note for the site build:**
> - **Lesson 5's shared setup,** for every demo and exercise in the lesson: the
>   Lesson 4 comprehensive sandbox's `lib.py`, unchanged, then `PDF_DATA`,
>   `load_pdf_extraction` and `load_pdf_corpus`, exactly as in the first code
>   block below. numpy must be loaded.
> - **Data for this lesson:** everything Lesson 4 used, plus
>   `pdf/extracted.json`, `pdf/corpus.json`,
>   `embeddings/bge-small-en-v1.5/pdf-chunks.json` and `pdf-queries.json`.
>   The four PDFs and two images under `pdf/files/` should be linked from the
>   page, so learners can open them.
> - pypdf and pdfplumber are **not** loaded in the browser; every demo reads
>   their stored output.
> - The links to the PDFs below are written as `/data/rag/pdf/files/...`; add
>   the site's base path so they resolve on the deployed site.
> - This file replaces the earlier `lesson-5-5-concept-1.md`, which was
>   hybrid search's first concept and is now in the repo as Lesson 6.

---

## Four new documents

Every document so far has been Markdown: text with its structure written
into it, `##` for a heading, `|` for a table. Real document collections are
full of PDFs, and a PDF records something else entirely. This lesson adds four
small PDFs to the company's documents, each written to contain something
retrieval finds hard:

- **[A quarterly operations review](/data/rag/pdf/files/P01-ops-review-q3.pdf):**
  two pages of text, two tables, and a chart of rate-limited requests.
- **[Support tiers and response targets](/data/rag/pdf/files/P02-support-tiers.pdf):**
  two tables.
- **[The Q4 on-call rota](/data/rag/pdf/files/P03-oncall-rota-q4.pdf):** a
  thirteen-week table.
- **[A service dependency diagram](/data/rag/pdf/files/P04-architecture-diagram.pdf):**
  a picture of which service calls which, with a short text.

Every page carries a running header and a page number, as company documents
usually do.

Getting text out of a PDF needs a library, and two free ones were run over
these files offline: **pypdf**, which returns each page's text, and
**pdfplumber**, which returns each word with its position and font, plus the
tables and images it finds. Their output is stored, and every demo in this
lesson works on it:

```python
from collections import Counter

PDF_DATA = Path("/data/rag/pdf")

def load_pdf_extraction() -> dict:
    """What two free extractors returned for each of the lesson's PDFs, run offline and stored."""
    return json.loads((PDF_DATA / "extracted.json").read_text())

def load_pdf_corpus() -> dict:
    """The PDFs' metadata, the model-written table summaries and image descriptions, and the labelled questions."""
    return json.loads((PDF_DATA / "corpus.json").read_text())
```
*(defined once here and already loaded for every demo and exercise in this lesson)*

---

## What a plain extractor returns

Here's the start of the operations review's first page, as pypdf extracted
it:

```python
review = load_pdf_extraction()["P01"]
for line in review["pages"][0]["plain_text"].splitlines()[:22]:
    print(line)
```
```
Registry platform — Quarterly operations review, Q3 2026 — INTERNAL
Page 1
 Quarterly operations review, Q3 2026
Availability
The registry met its availability target in July and September, and missed it in August because of
INC-2093, the 42-minute outage during a database failover. The target is 99.9% for every month.
Month
Availability
Target
Incidents
July
99.97%
99.9%
0
August
99.84%
99.9%
1 (INC-2093)
September
99.95%
99.9%
0
```
*(runs live on the stored extraction, shows output — read-only demo snippet, not graded)*

The words are all there, and almost nothing else is:

- **Page furniture comes first.** The running header and the page number,
  which is printed at the *bottom* of the page, open the text, because the
  extractor follows the order things were drawn, not where they sit. Both
  will repeat on every page.
- **Headings look like sentences.** "Availability" is a heading in the PDF,
  but in the text it's a line like any other, so Lesson 3's chunker, which
  splits at `##`, has nothing to split on.
- **Lines are broken where the page ran out of width,** in the middle of a
  sentence.
- **The table is gone.** Each cell is its own line, read row by row. The
  values are all present, but "99.84%" is no longer next to anything that
  says it's August's availability.

---

## What's actually stored in a PDF

A PDF doesn't store paragraphs, headings or tables. It stores instructions to
draw: this piece of text, in this font, at this size, at this position. Here's
what pdfplumber recovers from the same page, one example word for each font
and size it found:

```python
page = load_pdf_extraction()["P01"]["pages"][0]
print(f"page size {page['width']} x {page['height']} points; {len(page['words'])} words")
examples = {}
for word in page["words"]:
    examples.setdefault((word["size"], word["font"]), word)
for (size, font), word in sorted(examples.items(), reverse=True):
    print(f"  size {size:>4}  {font:<16} first word: {word['text']!r:<14} at x={word['x0']}, top={word['top']}")
```
```
page size 595.3 x 841.9 points; 241 words
  size 18.0  Helvetica-Bold   first word: 'Quarterly'    at x=139.1, top=72.1
  size 14.0  Helvetica-Bold   first word: 'Availability' at x=78.0, top=105.3
  size 10.0  Helvetica-Bold   first word: 'Month'        at x=184.6, top=165.4
  size 10.0  Helvetica        first word: 'The'          at x=78.0, top=128.4
  size  8.0  Helvetica        first word: 'Registry'     at x=56.7, top=27.7
```
*(runs live on the stored extraction, shows output — read-only demo snippet, not graded)*

That's enough to rebuild the structure, with rules. The 18-point bold line is
the title and the 14-point bold one a heading. The 8-point words at the very
top and bottom of the page are the header and footer. The body is 10-point,
and bold 10-point text sits in the table's header row. None of this is stated
in the PDF; it's inferred from how the page looks, and it holds only as long
as the document follows its own conventions.

---

## Tables and images are separate objects

pdfplumber also looks for tables, mostly by finding the lines drawn around
cells, and reports every image with the box it occupies:

```python
extraction = load_pdf_extraction()
for doc_id, document in extraction.items():
    for page in document["pages"]:
        for table in page["tables"]:
            print(f"{doc_id} page {page['number']}: table, {len(table['rows'])} rows, header {table['rows'][0]}")
        for image in page["images"]:
            x0, top, x1, bottom = image["bbox"]
            words = [w for w in page["words"] if x0 <= w["x0"] <= x1 and top <= w["top"] <= bottom]
            print(f"{doc_id} page {page['number']}: image, {x1 - x0:.0f} x {bottom - top:.0f} points, "
                  f"{len(words)} words of text inside it")

words = {w["text"] for p in extraction["P04"]["pages"] for w in p["words"]}
print("\nin the diagram document's text:", {name: name in words for name in ("notification-service", "registry-db", "kb-search")})
```
```
P01 page 1: table, 4 rows, header ['Month', 'Availability', 'Target', 'Incidents']
P01 page 1: table, 5 rows, header ['Agent', 'p50', 'p95', 'Change from Q2']
P01 page 2: image, 454 x 207 points, 0 words of text inside it
P02 page 1: table, 3 rows, header ['Tier', 'First response', 'Resolution target', 'Availability commitment']
P02 page 1: table, 4 rows, header ['Severity', 'Meaning', 'Example']
P03 page 1: table, 14 rows, header ['Week starting', 'Primary', 'Secondary', 'Escalation manager', 'Notes']
P04 page 1: image, 454 x 232 points, 0 words of text inside it

in the diagram document's text: {'notification-service': True, 'registry-db': False, 'kb-search': False}
```
*(runs live on the stored extraction, shows output — read-only demo snippet, not graded)*

It found all five tables, because these are drawn with lines around every
cell. A table drawn without them, just columns of aligned text, can come back
as no table at all: an earlier test in preparing this lesson did exactly that.

The images are the starker case. The chart and the diagram occupy large
boxes with no text inside them, because they're pictures: their labels and
numbers are pixels, not text. The diagram document's text mentions
notification-service, in the paragraph beneath the diagram, but registry-db
and kb-search appear only in the picture. As far as any text search is
concerned, which service calls which doesn't exist.

So a PDF arrives with four problems, and the rest of this lesson takes them
in turn: furniture and lost structure in the text, tables that lose their
meaning, images that are invisible, and, for scanned pages, no text at all.

---

## Quiz cards

> **Q1.** Why does the page number appear at the start of pypdf's text for
> page 1, though it's printed at the bottom?
> - The extractor follows the order things were drawn, not where they sit on the page ✅
> - Page numbers are always stored as the first word of a page
> - pypdf sorts text alphabetically
> - The footer is repeated at the top by the PDF's author
>
> *Explanation: a PDF is a list of drawing instructions. A plain
> extractor reads them in order, so page furniture drawn first comes out
> first, wherever it appears on the page.*

> **Q2.** How can the title and headings be recognised, when the PDF
> doesn't mark them?
> - By their font size and weight, which differ from the body text ✅
> - By the `##` markers pypdf adds to them
> - By their position at the left margin
> - They can't; headings are lost for good
>
> *Explanation: pdfplumber reports each word's size and font. The title is
> 18-point bold and headings 14-point bold, against 10-point body text.
> That's an inference from how the page looks, not something the PDF
> states.*

> **Q3.** In the plain extraction, "99.84%" is on a line of its own. What's
> been lost?
> - Its link to "August" and "Availability", which a table conveys by position ✅
> - The number itself, which is rounded
> - The page it came from
> - Nothing; the value is still in the text
>
> *Explanation: in a table, meaning comes from a value's row and column.
> Flattened to one cell per line, the values survive, but which month and
> which measure each belongs to has to be reconstructed.*

> **Q4.** Why can't any text search find that notification-service calls
> auth-service?
> - That's shown only in the diagram, which is an image with no text inside it ✅
> - The diagram document is restricted
> - pdfplumber skips the last page of every document
> - The service names are stopwords
>
> *Explanation: the diagram's boxes and arrows are pixels. The extractors
> report the image's position, but nothing it shows. Until something
> describes it in words, it's invisible to text search.*
