"""
Build the trace viewer's data, public/data/eval/pilot/traces/<setup>.json, by running the course's own tracing
code on every pilot trial: Lesson 2's TRACER and TRACE_FROM_RECORDING, read from src/lib/evalData.ts exactly as
the pages load them, with capture_content=True.

    python scripts/eval/build_pilot_traces.py            # writes the three files
    python scripts/eval/build_pilot_traces.py --check    # fails if a written file differs from a fresh build

The page code draws span and trace ids from secrets.token_hex, so each build would differ. Here `secrets` is
replaced, in the namespace the code runs in, by a counter that gives the same ids every time; nothing else in
the code changes.
"""

import argparse
import dataclasses
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
from build_course_libs import raw_string  # noqa: E402

EVAL_TS = ROOT / "src" / "lib" / "evalData.ts"
PILOT = ROOT / "public" / "data" / "eval" / "pilot"
OUT = PILOT / "traces"
SETUPS = ("4b-think", "4b-nothink", "9b-think")


class CountingSecrets:
    """Stands in for the secrets module: token_hex gives 1, 2, 3... as hex of the requested length."""

    def __init__(self):
        self.n = 0

    def token_hex(self, nbytes: int) -> str:
        self.n += 1
        return f"{self.n:0{nbytes * 2}x}"


def build() -> dict[str, str]:
    namespace: dict = {}
    exec(raw_string(EVAL_TS, "TRACER") + "\n\n" + raw_string(EVAL_TS, "TRACE_FROM_RECORDING"), namespace)
    files = {}
    for setup in SETUPS:
        namespace["secrets"] = CountingSecrets()
        run = json.loads((PILOT / f"{setup}.json").read_text(encoding="utf-8"))
        trials = []
        for trial in run["trials"]:
            spans = namespace["trace_from_recording"](run, trial, capture_content=True)
            trials.append({"trial_id": trial["trial_id"], "task_id": trial["task_id"],
                           "request": trial["messages"][0]["content"],
                           "answer": trial["answers"][-1] if trial["answers"] else None,
                           "spans": [dataclasses.asdict(span) for span in spans]})
        data = {"setup": setup, "model": run["model"], "thinking": run["thinking"],
                "built_by": "scripts/eval/build_pilot_traces.py, from the pilot's recordings (no timings), content captured",
                "trials": trials}
        files[f"{setup}.json"] = json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"
    return files


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    files = build()
    if args.check:
        stale = [name for name, text in files.items()
                 if not (OUT / name).exists() or (OUT / name).read_text(encoding="utf-8") != text]
        if stale:
            sys.exit(f"out of date with the lesson code: {', '.join(stale)}")
        print("pilot traces match the lesson code")
        return
    OUT.mkdir(exist_ok=True)
    for name, text in files.items():
        with open(OUT / name, "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
    print(f"wrote {', '.join(files)} to {OUT} ({sum(len(t.encode()) for t in files.values()) / 1000:.0f} KB)")


if __name__ == "__main__":
    main()
