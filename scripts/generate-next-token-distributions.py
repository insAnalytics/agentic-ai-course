"""
Generates the real next-token probability distributions behind the
next-token explorer demo in Lesson 1.4, Concept 1, and its Recap &
Practice closing synthesis (src/data/next-token-distributions.json).

Real logits from GPT-2 (124M, `gpt2` via `transformers`) -- a genuine
causal/autoregressive language model, unlike the BERT-style encoder
(`all-MiniLM-L6-v2`) used elsewhere in this course for embeddings and
attention, since only an actual language-modeling head produces a real
next-token distribution at all. Softmax applied to the raw logits at the
final token position, top 8 candidates kept per prompt.

Same curated-bank approach as the sentence-embedding and attention-weight
demos in Lessons 1.2 and 1.3, for the same reason: a "type any sentence"
box can't be precomputed. Unlike the attention-weight case, GPT-2's
next-token prediction quality didn't need heavy filtering -- next-token
prediction is literally its training objective (not an emergent,
sometimes-noisy property like raw attention), so candidate prompts were
spot-checked for a sensible, well-distributed top-8 rather than
individually hand-verified one by one.

Run once offline; only the small resulting JSON ships to the browser,
never this script's downloaded model.

To add more prompts: add them to PROMPTS below and re-run
(`python scripts/generate-next-token-distributions.py` -- needs
`transformers`, e.g. `pip install transformers torch`).
"""

import json

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_NAME = "gpt2"
TOP_K = 8

PROMPTS = [
    "The cat sat on the",
    "I went to the store to buy some",
    "The capital of France is",
    "Once upon a time, there was a",
    "The weather today is",
    "She opened the door and saw a",
    # appended for the Recap & Practice closing synthesis -- appended, not
    # inserted, so the six indices above stay valid for Concept 1's own page
    "The opposite of hot is very",
    "The best programming language for beginners is",
    "The winner of next year's Nobel Prize in Physics will be Dr.",
    "The current CEO of Twitter is",
]


def main():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
    model.eval()

    result = []
    for prompt in PROMPTS:
        inputs = tokenizer(prompt, return_tensors="pt")
        with torch.no_grad():
            out = model(**inputs)
        logits = out.logits[0, -1]
        probs = torch.softmax(logits, dim=-1)
        top = torch.topk(probs, TOP_K)

        candidates = [
            {"token": tokenizer.decode([idx]), "probability": round(float(p), 4)}
            for p, idx in zip(top.values.tolist(), top.indices.tolist())
        ]
        result.append({"prompt": prompt, "candidates": candidates})

        print(f"\n{prompt!r}")
        for c in candidates:
            print(f"  {c['token']!r:15s} {c['probability']:.4f}")

    out_path = "src/data/next-token-distributions.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {len(result)} prompts to {out_path}")


if __name__ == "__main__":
    main()
