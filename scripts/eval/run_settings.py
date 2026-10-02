"""
Write public/data/eval/main/settings.json for Lesson 10: every main run's recorded settings, without its trials, so a
page can compare two runs' settings without loading either run. Runs from before a field existed get the value the
code used then: variant "none", system version "v1", no serving change.

    python scripts/eval/run_settings.py            # writes the file
    python scripts/eval/run_settings.py --check    # fails if it's out of date
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAIN = ROOT / "public" / "data" / "eval" / "main"
OUT = MAIN / "settings.json"


def settings(run: dict) -> dict:
    return {"model": run["model"], "revision": run["revision"], "thinking": run["thinking"], "sampling": run["sampling"],
            "max_tokens": run["max_tokens"], "trials_per_task": run["trials_per_task"],
            "system_version": run.get("system_version", "v1"), "config_hash": run["config_hash"],
            "template_sha": run["template_sha"], "variant": run.get("variant", "none"),
            "serving": run.get("serving", {"quantization": None}),
            "tasks_file": run["tasks_file"], "vllm": run["setup"]["agent_server"]["version"],
            "gpus": run["setup"]["gpus"], "user_model": (run.get("user") or {}).get("model")}


def build() -> dict:
    runs = {}
    for path in sorted(MAIN.glob("*.json")):
        if path.name == OUT.name or path.name.endswith(".dry-run.json"):
            continue
        run = json.loads(path.read_text(encoding="utf-8"))
        if "trials" in run and "config_hash" in run:
            runs[path.stem] = settings(run)
    return {"version": 1, "runs": runs}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "settings.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {', '.join(json.loads(text)['runs'])}")


if __name__ == "__main__":
    main()
