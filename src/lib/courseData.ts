import type { PyodideInterface } from "./pyodide";

/**
 * Static course datasets under `public/data/` (architecture.md §3.1), made
 * available to Pyodide at the same relative path under `/data/`: the demo
 * prop `dataFiles={["rag/documents.json"]}` makes
 * `Path("/data/rag/documents.json")` readable from Python.
 *
 * Fetched lazily — only when a learner first clicks Run, never on page load —
 * and once per page (the promise is memoized); across pages the browser's
 * HTTP cache serves it. Never import these files into page or component code:
 * they're megabytes, and would be inlined into the JS bundle.
 */
const fetches = new Map<string, Promise<string>>();

function fetchCourseData(path: string): Promise<string> {
  let pending = fetches.get(path);
  if (!pending) {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    pending = fetch(`${base}/data/${path}`).then((res) => {
      if (!res.ok) throw new Error(`Couldn't load course data ${path} (HTTP ${res.status})`);
      return res.text();
    });
    // a failed fetch (e.g. offline) shouldn't stick: the next Run retries
    pending.catch(() => fetches.delete(path));
    fetches.set(path, pending);
  }
  return pending;
}

/**
 * Writes each file into Pyodide's virtual FS at `/data/<path>`. Rewritten on
 * every call (cheap once fetched), so a demo that edits or deletes a data file
 * can't break the next demo on the page.
 */
export async function writeCourseData(pyodide: PyodideInterface, paths: string[]): Promise<void> {
  const texts = await Promise.all(paths.map(fetchCourseData));
  paths.forEach((path, i) => {
    const target = `/data/${path}`;
    pyodide.runPython(`import os; os.makedirs(${JSON.stringify(target.slice(0, target.lastIndexOf("/")))}, exist_ok=True)`);
    pyodide.FS.writeFile(target, texts[i]);
  });
}
