"""Fetch one real record per training stage from public datasets and write
src/data/training-examples.json (used by TrainingExampleCard.tsx, Lesson 1.7).

Rows come from the Hugging Face datasets-server (no auth). The pretraining
excerpt is tokenized with GPT-2's tokenizer so the card can show real token
boundaries. Run with Python <= 3.12 and `transformers` installed:

    python scripts/generate-training-examples.py
"""
import json
import urllib.parse
import urllib.request
from pathlib import Path

from transformers import AutoTokenizer

SERVER = "https://datasets-server.huggingface.co/rows"
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "training-examples.json"

# (dataset, config, split, row index) -- chosen by hand from the first few
# hundred rows for being short, benign, and representative.
C4 = ("allenai/c4", "en", "train", 0)
DOLLY = ("databricks/databricks-dolly-15k", "default", "train", 1)
HH = ("Anthropic/hh-rlhf", "default", "train", 304)
GSM8K = ("openai/gsm8k", "main", "train", 0)

EXCERPT_TOKENS = 24  # tokens of the C4 document shown; the last is the target


def fetch_row(dataset, config, split, index):
    query = urllib.parse.urlencode(
        {"dataset": dataset, "config": config, "split": split, "offset": index, "length": 1}
    )
    with urllib.request.urlopen(f"{SERVER}?{query}", timeout=60) as response:
        payload = json.load(response)
    row = payload["rows"][0]
    assert row["row_idx"] == index
    return row["row"]


def main():
    c4 = fetch_row(*C4)
    dolly = fetch_row(*DOLLY)
    hh = fetch_row(*HH)
    gsm = fetch_row(*GSM8K)

    tokenizer = AutoTokenizer.from_pretrained("gpt2")
    ids = tokenizer(c4["text"])["input_ids"][:EXCERPT_TOKENS]
    tokens = [tokenizer.decode([i]) for i in ids]

    def split_hh(text):
        # "\n\nHuman: ...\n\nAssistant: ..." -> (prompt, reply)
        prompt, reply = text.rsplit("\n\nAssistant: ", 1)
        return prompt.removeprefix("\n\nHuman: "), reply

    chosen_prompt, chosen_reply = split_hh(hh["chosen"])
    rejected_prompt, rejected_reply = split_hh(hh["rejected"])
    assert chosen_prompt == rejected_prompt

    final = gsm["answer"].split("#### ")[-1].strip()

    data = {
        "pretraining": {
            "dataset": "C4 (allenai/c4, English)",
            "license": "ODC-BY",
            "row": C4[3],
            "source_url": c4["url"],
            "tokens": tokens,
        },
        "sft": {
            "dataset": "databricks-dolly-15k",
            "license": "CC BY-SA 3.0",
            "row": DOLLY[3],
            "category": dolly["category"],
            "instruction": dolly["instruction"],
            "response": dolly["response"],
        },
        "preference": {
            "dataset": "Anthropic HH-RLHF",
            "license": "MIT",
            "row": HH[3],
            "prompt": chosen_prompt,
            "chosen": chosen_reply,
            "rejected": rejected_reply,
        },
        "rl": {
            "dataset": "GSM8K (openai/gsm8k, main)",
            "license": "MIT",
            "row": GSM8K[3],
            "question": gsm["question"],
            "reference_solution": gsm["answer"].split("\n#### ")[0],
            "final_answer": final,
        },
    }
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
