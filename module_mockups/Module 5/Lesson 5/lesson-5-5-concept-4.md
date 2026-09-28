# Module 5, Lesson 5 — Concept 4: Images for retrieval

> **Note for the site build:**
> - No new shared code.
> - **The first code block is illustrative only:** pypdf isn't loaded in the
>   browser, so render it as a static code block with its output and no Run
>   button. It was run locally with pypdf 5.9.0 on the committed PDF.
> - The last two demos build indexes over the whole corpus; allow several
>   seconds each.

---

## Getting the pictures out

The first concept found two images with no text inside them: a chart in the
operations review and a diagram of service dependencies. Everything they show
is invisible to search. Before anything can describe them, they have to be
pulled out of the PDF, which the same libraries do:

```python
import pypdf

reader = pypdf.PdfReader("P01-ops-review-q3.pdf")
for number, page in enumerate(reader.pages, 1):
    for image in page.images:
        print(f"page {number}: {image.name}, {image.image.size[0]} x {image.image.size[1]} pixels, {len(image.data):,} bytes")
```
```
page 2: FormXob.1ecadb9d0d6752645ba5671bf2cf483b.png, 1050 x 480 pixels, 47,781 bytes
```
*(illustrative — pypdf doesn't run in this page's sandbox. This was run locally with pypdf 5.9.0 on the committed PDF, and the output is real.)*

The chart comes out as an ordinary PNG file, at the resolution it was drawn.
Nothing about it is text yet.

---

## Describing images in words

The common fix is to have a vision-capable model look at each image and
describe it, then index the description as a chunk, next to the document's
text. Sending an image to a model is the request shape from
[Module 1's lesson on non-text inputs](→ Module 1, calling LLM APIs and processing responses lesson, sending non-text inputs concept).
Here are the prompt and the two descriptions this lesson uses:

```python
corpus = load_pdf_corpus()
print(f"prompt: {corpus['description_prompt']}\n")
for doc_id, label, text in corpus["descriptions"]:
    print(f"{doc_id} | {label}\n{text}\n")
```
```
prompt: Describe this image for a search index in two or three sentences: what kind of image it is, what it shows, and the key values or relationships it contains.

P01 | Image 1 (description)
Bar chart of rate-limited registry requests (REG-1009) per week in Q3 2026. Weekly counts rise from about 2,900 in the week of Jul 6 to a peak of about 4,200 in the week of Aug 3, then fall sharply after a dashed line between Aug 17 and Aug 24 labelled 'Dashboards moved to their own keys', to about 300 by the week of Sep 28.

P04 | Image 1 (description)
Service dependency diagram with arrows from each service to the services it calls. notification-service calls registry-api and auth-service; monitoring calls registry-api; registry-api calls auth-service and registry-db. kb-search is shown on its own, with no arrows.

```
*(runs live, shows output — read-only demo snippet, not graded. The descriptions were written for the course by Claude, looking at the rendered images, and are replayed as stored text.)*

Each description is added to its document with `added_chunks`, labelled
"Image 1 (description)", so a citation can say it came from a description of
an image, not from the document's own words.

---

## Measured

Here are the three questions whose answers are only in the images, with the
PDFs' tables written as rows, without and with the descriptions:

```python
corpus = load_pdf_corpus()
queries = [q for q in corpus["queries"] if q["type"] == "pdf_image"]
vectors = pdf_query_vectors()
for name, chunks in [("without descriptions", pdf_chunks(render_table=table_as_rows)),
                     ("with descriptions", pdf_chunks(render_table=table_as_rows, added=corpus["descriptions"]))]:
    index = index_with_pdfs(chunks)
    ranks = {q["id"]: next((r for r, c in enumerate(index.search(vectors[q["id"]], 20), 1) if contains_facts(c, q)), "-")
             for q in queries}
    print(f"{name:<22}{ranks}")
print()
for q in queries:
    print(f"{q['id']}: {q['query']}  facts {q['facts']}")
```
```
without descriptions  {'p04': '-', 'p05': '-', 'p09': '-'}
with descriptions     {'p04': 1, 'p05': '-', 'p09': 1}

p04: In which week of Q3 did rate-limited registry requests peak?  facts ['Aug 3', '4,200']
p05: How many rate-limited requests were there in the last week of September?  facts ['Sep 28', '310']
p09: Which services does notification-service call?  facts ['notification-service', 'registry-api', 'auth-service']
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two of the three go from unanswerable to rank 1. The third stays
unanswerable, and the reason is worth remembering. The chart's last bar is
310, and the description says "about 300". A description is a summary: it
captures the shape of a chart, its peak and its trend, and rounds or drops the
rest. For questions that need an exact value from a chart, a description is
the wrong tool. Better options are indexing the data the chart was drawn from,
if it exists, or sending the image itself to the answering model, so it reads
the value directly.

That second option connects to a rule Lesson 9 makes explicit: the answering
model should see source text, not text generated during indexing. A description is generated
text, and for an image it's the only text there is. It's good for *finding*
the image. For *answering*, the image is the source, and a model that can read
images can be given it.

---

## One index for everything

Text chunks, table rows and image descriptions now sit in one index,
competing for the same top five places. Adding documents never only adds
answers; it can move others. Here are the module's original 43 questions,
before and after the PDFs joined the index:

```python
corpus = load_pdf_corpus()
labelled = [q for q in load_queries()["main"] if q["evidence"]]
vectors = query_vectors()
documents = [c for d in load_documents() for c in structured_chunks(d, 200)]
before = VectorIndex()
before.add(documents, vectors_for(documents))
after = index_with_pdfs(pdf_chunks(render_table=table_as_rows, added=corpus["descriptions"]))

answered = {name: {q["id"] for q in labelled if answerable(index.search(vectors[q["id"]], 5), q)}
            for name, index in [("before", before), ("after", after)]}
print(f"the module's 43 questions answered in the top 5: {len(answered['before'])} before the PDFs, "
      f"{len(answered['after'])} after")
print(f"lost {sorted(answered['before'] - answered['after'])}, gained {sorted(answered['after'] - answered['before'])}")
query = next(q for q in labelled if q["id"] == "q11")
print(f"\n{query['query']}")
for chunk in after.search(vectors["q11"], 5):
    print(f"  {chunk['doc_id']} | {chunk['section'].split(' > ')[-1]}")
```
```
the module's 43 questions answered in the top 5: 28 before the PDFs, 27 after
lost ['q11'], gained []

What happened in INC-2093?
  P01 | Incidents
  P01 | Availability
  D15 | Registry key errors
  D10 | Summary
  D08 | Alerts
```
*(runs live, shows output — read-only demo snippet, not graded)*

One question lost, and it's an instructive one. The operations review's
incidents section also describes INC-2093, in one sentence, and it now
outranks the incident report. Whether that's a loss depends on what you
count: the review does say what happened, briefly, but the labels were written
before the PDFs existed, so they can't know it's an answer. That's
[Lesson 2's point about incomplete labels](→ this module, Lesson 2, when the labels are wrong concept)
in a new form: when the corpus grows, the labels have to be reviewed with it,
or the measurements quietly go stale.

---

## Searching page images directly

There's a different approach that skips extraction and description
altogether. ColPali (Faysse and colleagues, ICLR 2025) embeds an *image of
each page* with a vision-language model and matches questions against those
page images directly. Its authors argue that text-based pipelines depend on
lengthy, brittle extraction and struggle to use visual cues, and on their
benchmark of visually rich documents, ViDoRe, ColPali outperformed the other
retrieval systems they tested. They note that some of ViDoRe's queries were
written by a commercial language model, which may bias it.

The trade is familiar from this module. It needs a GPU-scale vision model at
indexing time and a different kind of index. It returns pages, not chunks,
and a page is a large unit to send to the answering model. And the answering
model then has to read an image, not text. It isn't something this page can
run, but it's a real alternative when documents are mostly charts, forms or
scans, where extraction has little to work with.

---

## Quiz cards

> **Q1.** Why can't search find which service notification-service calls,
> before descriptions are added?
> - The answer is only in the diagram, and an image contains no text to search ✅
> - The diagram document is too short to be chunked
> - Service names are removed as stopwords
> - The diagram is on a restricted page
>
> *Explanation: extraction reports where the image is, not what it shows.
> Until a description puts it into words, the relationships in the diagram
> don't exist for text search.*

> **Q2.** The description says the last week had "about 300" rate-limited
> requests; the chart shows 310. What does that show about descriptions?
> - They summarise, keeping the shape of a chart and rounding or dropping exact values ✅
> - The vision model misread the chart
> - Descriptions can't include numbers
> - The chart's data is stored somewhere else in the PDF
>
> *Explanation: a description is written to capture what an image is
> about. For exact values, index the underlying data, or give the image
> itself to the answering model.*

> **Q3.** After the PDFs were added, "What happened in INC-2093?" lost its
> labelled answer. What should that prompt?
> - Reviewing the labels, since a new document may also answer it ✅
> - Removing the new documents from the index
> - Raising k until the incident report returns
> - Deleting the question from the labelled set
>
> *Explanation: the operations review describes INC-2093 too. Labels
> written before a document existed can't count it. When the corpus grows,
> the labels need reviewing with it.*

> **Q4.** What does ColPali do differently from extracting and describing?
> - It embeds images of whole pages and matches questions against them directly ✅
> - It extracts text more accurately than pypdf
> - It writes better image descriptions
> - It converts tables into rows automatically
>
> *Explanation: it skips extraction entirely, using a vision-language
> model on page images. It needs GPU-scale models, returns whole pages, and
> leaves the answering model to read an image.*
