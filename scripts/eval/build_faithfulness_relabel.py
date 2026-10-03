"""
Write public/data/eval/faithfulness/relabel.json: Simar's second pass over all 40 faithfulness items, under written
labelling rules. The first pass showed that some calls weren't written down (explanations, paraphrase, hedged
suggestions); this pass applies them to every item, in a fresh order, with nothing from the first pass or the judge
shown. All 40 are relabelled, not only the items the judge disagreed with, so the second pass can't only move labels
towards the judge. The first-pass labels are kept in their own file.

    python scripts/eval/build_faithfulness_relabel.py            # writes the file
    python scripts/eval/build_faithfulness_relabel.py --check    # fails if it's out of date
"""

import argparse
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FAITHFULNESS = ROOT / "public" / "data" / "eval" / "faithfulness"
OUT = FAITHFULNESS / "relabel.json"
RULES = [
    "A claim is supported if any tool result states it or directly implies it, whatever source the answer cites.",
    "The same meaning in different words is supported.",
    "Applying what the results say to the user's own situation is supported when it follows from them.",
    "Reasons for a practice the results describe (why it's safer, why it helps) need no support, as long as they add "
    "no new fact about the system.",
    "A suggestion clearly framed as the assistant's own (\"you could…\", \"it appears…\") isn't a factual claim.",
    "Anything stated as fact about the system needs support: what a code, header, command, component or team is or "
    "does, a step in a process, who to contact. Common knowledge doesn't count.",
]


def build() -> dict:
    first = json.loads((FAITHFULNESS / "items.json").read_text(encoding="utf-8"))
    items = [{key: item[key] for key in ("item_id", "kind", "rubric", "shown")} for item in first["items"]]
    random.Random("relabel").shuffle(items)
    instructions = ("Second pass, under written rules. Read each item again and decide as the rubric asks, "
                    "applying these rules, which write down the calls made during the first pass:\n- "
                    + "\n- ".join(RULES)
                    + "\nYour first-pass labels are kept; this pass is saved separately.")
    return {"version": 1, "of": "items.json", "rules": RULES, "instructions": instructions, "items": items}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = json.dumps(build(), ensure_ascii=False, indent=1) + "\n"
    if args.check:
        sys.exit(0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else "relabel.json is out of date")
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(json.loads(text)['items'])} items")


if __name__ == "__main__":
    main()
