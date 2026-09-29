"""
Module 5 (RAG Systems), Lesson 12: the graph extraction data.

Writes public/data/rag/graph.json from scripts/rag_corpus/graph_src.py: the extraction prompt, the
model-written [subject, relation, object] triples for each chunk of the architecture overview (D04),
the monitoring guide (D08) and the incident and security reports (D09 to D12), the community-summary
prompt, and the model-written community summaries. No model runs here; the extraction and summaries
were written for the course and are served as scripted model replies.

Run: `python scripts/generate-rag-graph.py`.
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE / "rag_corpus"))
import graph_src as source  # noqa: E402

OUT = HERE.parent / "public" / "data" / "rag" / "graph.json"


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "written_by": "Claude, for the course: triples extracted chunk by chunk with the prompt below, and "
                      "community summaries; served as scripted model replies",
        "documents": ["D04", "D08", "D09", "D10", "D11", "D12"],
        "extraction_prompt": source.EXTRACTION_PROMPT,
        "triples": source.TRIPLES,
        "community_prompt": source.COMMUNITY_PROMPT,
        "community_summaries": source.COMMUNITY_SUMMARIES,
    }, indent=1, ensure_ascii=False), encoding="utf-8")
    count = sum(len(t) for t in source.TRIPLES.values())
    print(f"{len(source.TRIPLES)} chunks, {count} triples, {len(source.COMMUNITY_SUMMARIES)} community summaries")


if __name__ == "__main__":
    main()
