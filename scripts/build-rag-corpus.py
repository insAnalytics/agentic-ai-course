"""
Builds the Module 5 (RAG Systems) document corpus: public/data/rag/documents.json.

Two parts, one list of documents:

- The internal documents (scripts/rag_corpus/internal/D01..D15.md), written for
  the course: the agent registry's API reference, runbooks, changelog, incident
  notes, a restricted security postmortem, a restricted finance page and an
  editable wiki page. Each has YAML front matter with its metadata.
- Real public documentation, fetched from GitHub at pinned commits and used as
  published (formatting cleaned, nothing reworded):
    prometheus/docs        docs/ (without docs/specs/)          Apache 2.0
    prometheus/prometheus  docs/ (without configuration/configuration.md
                           and querying/api.md)                  Apache 2.0
    prometheus/alertmanager docs/                                Apache 2.0
    postgres/postgres      doc/src/sgml/high-availability.sgml,
                           doc/src/sgml/wal.sgml (DocBook -> Markdown via pandoc)
                                                                 PostgreSQL Licence
  The licence obligations (NOTICE, copyright paragraph, attribution page) are
  listed in the Module 5 corpus notes.

Each output document: doc_id, title, date, access (reader groups), source_type
(official | wiki | vendor), source (repo@commit/path for public docs) and text
(Markdown, headings kept, so chunkers can split on structure).

Chunking and embedding are separate scripts, written with the lessons that
teach them, so this file only changes if the documents change.

Regenerate: `python scripts/build-rag-corpus.py` -- needs git and
`pip install pypandoc_binary pyyaml`. Runs in about a minute.
"""

import json
import re
import subprocess
import tempfile
from pathlib import Path

import pypandoc
import yaml

HERE = Path(__file__).parent
OUT = HERE.parent / "public" / "data" / "rag" / "documents.json"

SOURCES = [
    # (label, repo, full commit hash, paths to fetch)
    ("prometheus-docs", "prometheus/docs", "3713ac2990dbecb30392623b9ff083c77ca45d4d", ["docs"]),
    ("prometheus-server", "prometheus/prometheus", "ea954809ceafceb53ecfa295ab0947753929de9e", ["docs"]),
    ("alertmanager", "prometheus/alertmanager", "c2b235d8b40ef1756d8e68ccd770629cb9232f22", ["docs"]),
    ("postgresql", "postgres/postgres", "2d36d97c91bd43a3ac57513ed786c9e02a6532fa",
     ["doc/src/sgml/high-availability.sgml", "doc/src/sgml/wal.sgml"]),
]
LEFT_OUT = {
    "prometheus-docs": ["docs/specs/"],
    "prometheus-server": ["docs/configuration/configuration.md", "docs/querying/api.md"],
}
ENTITIES = {"mdash": "—", "ndash": "–", "hellip": "…", "nbsp": " ", "amp": "&",
            "lt": "<", "gt": ">", "quot": '"', "apos": "'"}


def fetch(repo: str, commit: str, paths: list, into: Path) -> tuple:
    """Sparse, shallow checkout of just these paths at this commit. Returns (root, commit date)."""
    root = into / repo.replace("/", "_")
    run = lambda *args: subprocess.run(args, cwd=root, check=True, capture_output=True, text=True).stdout
    root.mkdir(parents=True)
    run("git", "init", "-q")
    run("git", "remote", "add", "origin", f"https://github.com/{repo}")
    run("git", "sparse-checkout", "set", "--no-cone", *paths)
    run("git", "fetch", "-q", "--depth", "1", "--filter=blob:none", "origin", commit)
    run("git", "checkout", "-q", "FETCH_HEAD")
    date = run("git", "log", "-1", "--format=%cs")
    return root, date.strip()


def split_front_matter(text: str) -> tuple:
    if text.startswith("---"):
        _, meta, body = text.split("---", 2)
        return yaml.safe_load(meta) or {}, body.strip()
    return {}, text.strip()


def clean_markdown(text: str) -> str:
    # images carry no text; links keep their words and lose their targets
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def docbook_to_markdown(sgml: str) -> str:
    sgml = re.sub(r"&([a-zA-Z]+);", lambda m: ENTITIES.get(m.group(1), m.group(1)), sgml)
    sgml = re.sub(r"<!--.*?-->", "", sgml, flags=re.S)
    sgml = re.sub(r"<indexterm.*?</indexterm>", "", sgml, flags=re.S)
    markdown = pypandoc.convert_text(f'<?xml version="1.0"?><book>{sgml}</book>', "gfm",
                                     format="docbook", extra_args=["--wrap=none"])
    # cross-references to chapters outside these two files come out as [???](#id)
    markdown = re.sub(r"\[\?\?\?\]\(#([^)]+)\)", r"section \1", markdown)
    return markdown


def internal_documents() -> list:
    documents = []
    for path in sorted((HERE / "rag_corpus" / "internal").glob("D*.md")):
        meta, body = split_front_matter(path.read_text(encoding="utf-8"))
        documents.append({"doc_id": meta["doc_id"], "title": meta["title"], "date": str(meta["date"]),
                          "access": meta["access"], "source_type": meta["source_type"],
                          "source": "course", "text": body})
    return documents


def public_documents(workdir: Path) -> list:
    documents = []
    for label, repo, commit, paths in SOURCES:
        root, date = fetch(repo, commit, paths, workdir)
        files = sorted(f for rel in paths for f in [root / rel, *(root / rel).rglob("*")] if f.is_file())
        for path in files:
            rel = path.relative_to(root).as_posix()
            if any(rel.startswith(skip) for skip in LEFT_OUT.get(label, [])):
                continue
            if label == "postgresql":
                body = docbook_to_markdown(path.read_text(encoding="utf-8"))
                title = body.splitlines()[0].lstrip("# ").strip()
                doc_id = f"{label}/{path.stem}.md"
            elif path.suffix == ".md":
                meta, body = split_front_matter(path.read_text(encoding="utf-8"))
                title = meta.get("title") or path.stem
                doc_id = f"{label}/{rel.removeprefix('docs/')}"
            else:
                continue
            documents.append({"doc_id": doc_id, "title": title, "date": date, "access": ["all-staff"],
                              "source_type": "vendor", "source": f"{repo}@{commit[:7]}/{rel}",
                              "text": clean_markdown(body)})
    return documents


def main():
    with tempfile.TemporaryDirectory() as tmp:
        documents = internal_documents() + public_documents(Path(tmp))
    ids = [d["doc_id"] for d in documents]
    assert len(ids) == len(set(ids)), "duplicate doc_id"
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(documents, ensure_ascii=False, indent=1), encoding="utf-8")

    # the course's token estimate: characters / 4
    tokens = lambda docs: sum(len(d["text"]) for d in docs) // 4
    internal = [d for d in documents if d["source"] == "course"]
    print(f"{len(documents)} documents, ~{tokens(documents):,} tokens "
          f"({len(internal)} internal, ~{tokens(internal):,} tokens)")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
