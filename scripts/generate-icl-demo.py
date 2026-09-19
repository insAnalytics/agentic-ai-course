"""Run the lesson's in-context-learning example on a real open model family
(Pythia, 70M -> 1B parameters) and write src/data/icl-demo.json
(used by InContextLearningDemo.tsx, Lesson 1.8).

The task: reformat "First Last, age" as "Last, F. (age)", learned only from three
in-prompt examples. Model parameters are never updated; each model just sees the
same prompt and completes it greedily. Score = exact match over held-out names.

Run with Python <= 3.12, `torch` + `transformers` installed. CPU is fine.

    python scripts/generate-icl-demo.py
"""
import json
import random
import time
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "icl-demo.json"

MODELS = [
    ("EleutherAI/pythia-70m", "70M"),
    ("EleutherAI/pythia-160m", "160M"),
    ("EleutherAI/pythia-410m", "410M"),
    ("EleutherAI/pythia-1b", "1B"),
]

SHOTS = [("John Smith", 34), ("Mary Jones", 28), ("Susan Clark", 51)]
FIRST = ["Robert", "Linda", "David", "Karen", "James", "Nancy", "Peter", "Laura", "Daniel", "Emma",
         "Frank", "Grace", "Henry", "Irene", "Oscar", "Paula", "Victor", "Wendy", "Alan", "Beth"]
LAST = ["Lee", "Brown", "Wilson", "Taylor", "Moore", "Young", "Allen", "Scott", "Baker", "Adams",
        "Hill", "Green", "Wright", "King", "Turner", "Parker", "Reed", "Cook", "Bell", "Ross"]
N_TEST = 40
SEED = 0


def fmt(name, age):
    first, last = name.split()
    return f"{last}, {first[0]}. ({age})"


def make_tests():
    rng = random.Random(SEED)
    seen = {n for n, _ in SHOTS}
    tests = []
    while len(tests) < N_TEST:
        name = f"{rng.choice(FIRST)} {rng.choice(LAST)}"
        if name in seen:
            continue
        seen.add(name)
        tests.append((name, rng.randint(18, 79)))
    return tests


PREFIX = "".join(f'"{n}, {a}" -> "{fmt(n, a)}"\n' for n, a in SHOTS)


def main():
    tests = make_tests()
    results = []
    examples = []
    for hf_name, label in MODELS:
        t0 = time.time()
        tok = AutoTokenizer.from_pretrained(hf_name)
        model = AutoModelForCausalLM.from_pretrained(hf_name, torch_dtype=torch.float32).eval()
        correct = 0
        sample = None
        for name, age in tests:
            prompt = PREFIX + f'"{name}, {age}" -> "'
            ids = tok(prompt, return_tensors="pt")
            with torch.no_grad():
                out = model.generate(**ids, max_new_tokens=14, do_sample=False, pad_token_id=tok.eos_token_id)
            text = tok.decode(out[0][ids.input_ids.shape[1]:], skip_special_tokens=True)
            completion = text.split('"')[0]
            ok = completion == fmt(name, age)
            correct += ok
            if sample is None:
                sample = {"input": f"{name}, {age}", "completion": completion, "expected": fmt(name, age)}
        results.append({"model": label, "hf_name": hf_name, "exact_match": correct / len(tests), "example": sample})
        print(f"{label:>5}: {correct}/{len(tests)}  ({time.time() - t0:.0f}s)  e.g. {sample}", flush=True)
        del model
    data = {
        "task": 'reformat "First Last, age" as "Last, F. (age)" from three in-prompt examples',
        "shots": [{"input": f"{n}, {a}", "output": fmt(n, a)} for n, a in SHOTS],
        "test_problems": len(tests),
        "seed": SEED,
        "family": "Pythia (EleutherAI), fp32, greedy decoding, no parameter updates",
        "results": results,
    }
    OUT.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
