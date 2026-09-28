# Module 5 Lesson 5's PDF corpus: notes for the site build

## Run once

    pip install pypdf pdfplumber reportlab matplotlib sentence-transformers numpy
    python scripts/generate-rag-pdf.py

It builds four small PDFs, runs pypdf and pdfplumber over them, and embeds about 30 chunk texts
and 10 questions with bge-small (a CPU is fine). Commit everything it writes:

- `public/data/rag/pdf/extracted.json` (the stored extractor output), `corpus.json` (document
  metadata, model-written table summaries and image descriptions, and the 10 labelled questions)
- `public/data/rag/pdf/files/`: the four PDFs and the two images, so a page can link to them
- `public/data/rag/embeddings/bge-small-en-v1.5/pdf-chunks.json` and `pdf-queries.json`
- `scripts/rag_corpus/pdf/extracted.json` and `scripts/rag_corpus/pdf/pdfs/` (generated inputs)

Paste the final summary line back to the content chat.

`scripts/rag_pdf.py` must stay identical to the lesson's PDF-processing code: chunk vectors are
found by hashing the chunk text. The PDFs' contents live in `scripts/rag_corpus/pdf/make_pdfs.py`, and
summaries, descriptions and questions in `scripts/rag_corpus/pdf_corpus_src.py`; edit those, then rerun.

## Loading in the browser

Same rule as the rest of Module 5's data: fetched on the first Run that needs a file, cached, written to
the same relative path under `/data/rag/`, never bundled. pypdf and pdfplumber are not needed in the
browser; the lesson reads the stored extraction.
