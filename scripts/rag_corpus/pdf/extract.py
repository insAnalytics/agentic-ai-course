"""Runs two free PDF extractors over Lesson 5's PDFs and stores what they return, so the lesson can
work on real extractor output in the browser, where the extractors themselves may not run."""
import json
from pathlib import Path

import pdfplumber
import pypdf

HERE = Path(__file__).parent
PDFS = HERE / "pdfs"

def extract(path: Path) -> dict:
    pages = []
    reader = pypdf.PdfReader(path)
    with pdfplumber.open(path) as pdf:
        for number, (plumbed, plain) in enumerate(zip(pdf.pages, reader.pages), 1):
            words = [{"text": w["text"], "x0": round(w["x0"], 1), "top": round(w["top"], 1),
                      "size": round(w["size"], 1), "font": w["fontname"]}
                     for w in plumbed.extract_words(extra_attrs=["size", "fontname"])]
            tables = [{"bbox": [round(v, 1) for v in t.bbox], "rows": t.extract()} for t in plumbed.find_tables()]
            images = [{"bbox": [round(i["x0"], 1), round(i["top"], 1), round(i["x1"], 1), round(i["bottom"], 1)]}
                      for i in plumbed.images]
            pages.append({"number": number, "width": round(plumbed.width, 1), "height": round(plumbed.height, 1),
                          "plain_text": plain.extract_text(), "words": words, "tables": tables, "images": images})
    return {"file": path.name, "pages": pages}

if __name__ == "__main__":
    out = {p.stem.split("-")[0]: extract(p) for p in sorted(PDFS.glob("*.pdf"))}
    (HERE / "extracted.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    for doc_id, doc in out.items():
        print(doc_id, [(len(p["words"]), len(p["tables"]), len(p["images"])) for p in doc["pages"]])
