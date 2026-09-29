# Module 5 Lesson 12's graph data: notes for the site build

    python scripts/generate-rag-graph.py

No model or GPU; it writes `public/data/rag/graph.json` from `scripts/rag_corpus/graph_src.py`. Commit
both. Loaded like the rest of Module 5's data: fetched on the first Run that needs it, cached, never
bundled.

Lesson 12 also needs **networkx** in the browser sandbox (it's pure Python and in Pyodide's package
list: `pyodide.loadPackage("networkx")`). Please confirm that it loads and that
`networkx.community.louvain_communities(graph, seed=0)` runs, and report the networkx version Pyodide
provides; the lesson's outputs were produced with networkx 3.6.1.
