"""
Generates the pairwise attention-weight matrices behind the attention
explorer demo in Lesson 1.3, Concept 2 (src/data/attention-sentences.json).

Real self-attention weights extracted from a real small transformer
(sentence-transformers/all-MiniLM-L6-v2's underlying BERT-style encoder,
via `transformers` with output_attentions=True), averaged across every
layer and attention head to produce one clean per-token attention
distribution -- the same aggregate a learner's mental model of "attention"
expects, rather than 6 layers x 12 heads of separate, harder-to-read
patterns.

[CLS] and [SEP] are excluded from both the displayed tokens and the
weight normalization -- they are well-documented "attention sink" tokens
that absorb a disproportionate share of raw attention regardless of
content (verified directly: [CLS] captured ~60% of attention mass in an
early check here), which would dominate the visualization and hide the
actual content-word signal the concept is trying to show. Excluding them
and renormalizing among content tokens only is standard practice for
attention visualizations (e.g. BertViz).

IMPORTANT -- this is a CURATED bank, not a "type any sentence" tool.
Testing ~25 candidate word-sense-ambiguous sentences found that only
some show a clean, strongly dominant real attention pattern; many showed
weak/diffuse attention with no single word clearly dominating (a
well-documented real limitation -- see Jain & Wallace 2019, "Attention is
not Explanation" -- especially pronounced in small distilled models like
this one). Asked the user rather than shipping either an unreliable
"any sentence" tool or a misleadingly-cherry-picked one framed as
general; the sentences below are the ones that verified cleanly, kept
deliberately small rather than padded with weaker examples.

To add more sentence pairs: verify a candidate's attention pattern is
genuinely clean first (a scratch script computing the same
average-all-layers-heads, CLS/SEP-excluded weights and checking the top
attended token is a meaningful content word with a real margin over the
next-highest) before adding it here -- don't assume a plausible-sounding
sentence will show a clean result without checking.
"""

import json

import torch
from transformers import AutoModel, AutoTokenizer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# each pair: same ambiguous word, disambiguated oppositely by context.
# every sentence here was verified offline to produce a real, clearly
# dominant attention pattern toward a meaningful disambiguating word.
SENTENCES = [
    "I sat by the river bank.",
    "I deposited money at the bank.",
    "They played tennis on the court after school.",
    "The judge asked the court to remain silent.",
    "The TV pilot episode aired last night.",
    "The airline pilot completed his final training flight.",
]


def main():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModel.from_pretrained(MODEL_NAME, output_attentions=True, attn_implementation="eager")
    model.eval()

    result = []
    for sentence in SENTENCES:
        inputs = tokenizer(sentence, return_tensors="pt")
        raw_tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
        with torch.no_grad():
            out = model(**inputs)
        # [layers, heads, seq, seq] -> average over layers and heads -> [seq, seq]
        avg = torch.stack(out.attentions).mean(dim=(0, 2))[0]

        content_idx = [i for i, t in enumerate(raw_tokens) if t not in ("[CLS]", "[SEP]")]
        tokens = [raw_tokens[i] for i in content_idx]

        # slice to content x content, then renormalize each row to sum to 1
        sub = avg[content_idx][:, content_idx]
        sub = sub / sub.sum(dim=1, keepdim=True)

        matrix = [[round(float(v), 4) for v in row] for row in sub]
        result.append({"sentence": sentence, "tokens": tokens, "matrix": matrix})

        # print the top attended token (excluding self) per token, for a quick spot check
        print(f"\n{sentence}")
        for i, tok in enumerate(tokens):
            others = [(t, w) for j, (t, w) in enumerate(zip(tokens, matrix[i])) if j != i]
            top = max(others, key=lambda x: x[1])
            print(f"  {tok:10s} attends most to: {top[0]} ({top[1]:.3f})")

    out_path = "src/data/attention-sentences.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {len(result)} sentences to {out_path}")


if __name__ == "__main__":
    main()
