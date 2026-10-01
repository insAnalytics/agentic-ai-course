"""
Module 7's phase 3: run one judge over every item judges.py defines, and save its replies and decisions.

    python scripts/eval/run_judges.py --judge gemma --dry-run      # stand-in replies, no GPU
    python scripts/eval/run_judges.py --judge gemma                 # on Colab, with the judge's server on :8002
    python scripts/eval/run_judges.py --judge qwen9b

Writes public/data/eval/judges/<judge>.json (or .dry-run.json). The items are rebuilt from judges.py and the
committed runs, so each result stores a hash of its prompt rather than the prompt itself; `--check-items` confirms
the rebuilt prompts still match a run file's hashes.
"""

import argparse
import hashlib
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(HERE / "course")]

from backends import VLLMChatBackend  # noqa: E402
from eval_client import seed_for  # noqa: E402
from judges import all_items, parse  # noqa: E402
from run_pilot import gpu_names  # noqa: E402

ROOT = HERE.parents[1]
OUT = ROOT / "public" / "data" / "eval" / "judges"
# CHECK the exact repo id and pin the revision on the day; record both in the run file
JUDGES = {"gemma": "google/gemma-4-31B-it", "qwen9b": "Qwen/Qwen3.5-9B"}
SAMPLING = {"temperature": 0.0}
TEMPLATE_KWARGS = {"enable_thinking": False}
MAX_TOKENS = 400


def prompt_hash(messages: list) -> str:
    return hashlib.sha256(json.dumps(messages, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()[:16]


class StandInJudge:
    """Not a model: a fixed, parseable reply for each kind, for dry runs."""
    model_id = "stand-in"

    def chat(self, messages, sampling, seed, max_tokens):
        text = messages[-1]["content"]
        last = ("Winner: TIE" if "Winner:" in text[-200:] else "Score: 3" if "Score:" in text[-200:] else "Verdict: UNCLEAR")
        reply = f"Reasoning: the stand-in doesn't read.\n{last}"
        return {"text": reply, "prompt_tokens": len(text) // 4, "completion_tokens": 12, "finish_reason": "stop"}

    def server_info(self):
        return {"version": "stand-in", "models": ["stand-in"]}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--judge", required=True, choices=JUDGES)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--url", default="http://localhost:8002")
    parser.add_argument("--workers", type=int, default=64)
    parser.add_argument("--kinds", help="comma-separated item kinds, for a quick check")
    parser.add_argument("--check-items", help="a run file whose prompt hashes the rebuilt items must match")
    args = parser.parse_args()
    items = all_items()
    if args.check_items:
        run = json.loads(Path(args.check_items).read_text(encoding="utf-8"))
        hashes = {item["item_id"]: prompt_hash(item["messages"]) for item in items}
        stale = [r["item_id"] for r in run["results"] if hashes.get(r["item_id"]) != r["prompt_hash"]]
        sys.exit(f"{len(stale)} items no longer match, e.g. {stale[:3]}" if stale else print("every item matches") or 0)
    if args.kinds:
        items = [item for item in items if item["kind"] in args.kinds.split(",")]
    backend = StandInJudge() if args.dry_run else VLLMChatBackend(args.url, JUDGES[args.judge], TEMPLATE_KWARGS)

    def one(item):
        seed = seed_for("judge", args.judge, item["item_id"])
        reply = backend.chat(item["messages"], SAMPLING, seed, MAX_TOKENS)
        meta = {k: v for k, v in item.items() if k != "messages"}
        return {**meta, "prompt_hash": prompt_hash(item["messages"]), "seed": seed, "reply": reply["text"],
                "decision": parse(item["kind"], reply["text"]), "finish_reason": reply["finish_reason"],
                "prompt_tokens": reply["prompt_tokens"], "completion_tokens": reply["completion_tokens"]}

    started = time.monotonic()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(one, items))
    wall = time.monotonic() - started
    run = {"judge": args.judge, "model": backend.model_id if args.dry_run else JUDGES[args.judge], "dry_run": args.dry_run,
           "sampling": SAMPLING, "template_kwargs": TEMPLATE_KWARGS, "max_tokens": MAX_TOKENS,
           "setup": {"server": backend.server_info(), "gpus": gpu_names()},
           "timing": {"wall_seconds": round(wall, 3), "prompt_tokens": sum(r["prompt_tokens"] for r in results),
                      "completion_tokens": sum(r["completion_tokens"] for r in results)},
           "results": results}
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{args.judge}{'.dry-run' if args.dry_run else ''}.json"
    path.write_text(json.dumps(run, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    unparsed = sum(r["decision"] is None for r in results)
    cut = sum(r["finish_reason"] == "length" for r in results)
    print(f"{args.judge}: {len(results)} items in {wall:.0f}s, {unparsed} without a decision, {cut} cut off -> {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
