"""
Sample a real model on Module 6's set E, once, and save every reply for the lessons.

    python scripts/generate-reliability-samples.py --condition plain
    python scripts/generate-reliability-samples.py --condition wordings
    python scripts/generate-reliability-samples.py --condition thinking
    python scripts/generate-reliability-samples.py --condition stronger
    python scripts/generate-reliability-samples.py --condition plain --dry-run   # stand-in model, no GPU

Run the conditions in that order: `thinking` sets its budgets from the reply lengths `plain` saved.
See README-reliability.md for running it on Kaggle.

Conditions (what each lesson draws from):
- plain     Qwen3.5-4B, thinking off, original wording, 20 samples per question, top-5 logprobs on
            the answer line. Lessons 1, 2, 5 and 6.
- wordings  Qwen3.5-4B, thinking off, the three other wordings, 10 samples each. Lesson 1.
- thinking  Qwen3.5-4B, thinking on, original wording, 10 samples, each graded at several thinking
            budgets. Lesson 5.
- stronger  Qwen3.5-9B, thinking off, original wording, 5 samples. Lesson 5.

How thinking budgets work. Each sample thinks once, up to the largest budget. For each smaller
budget B the script keeps the first B thinking tokens, closes the thinking block and lets the model
answer. Sampling is one token at a time, so the first B tokens of a long thought are exactly what
a run capped at B would have produced; only the answer step is rerun. A thought that ended by
itself before B is answered once and shared by every budget at or above its length. Every graded
answer records whether its thinking was cut off.

Everything needed to reproduce a run is saved with it: model repository and revision, dtype,
engine and version, GPU, sampling settings, the seed of every request, and the prompt template.
Seeds are derived from the question id, wording and condition, so a rerun asks for the same seeds.
"""

import argparse
import hashlib
import json
import math
import platform
import random
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "reliability"))

from grading import MARKER, extract_answer, is_correct

SET_E = ROOT / "public" / "data" / "reliability" / "set-e.json"
RUNS = ROOT / "public" / "data" / "reliability" / "runs"

MODELS = {
    "small": "Qwen/Qwen3.5-4B",
    "large": "Qwen/Qwen3.5-9B",
}

# Qwen's recommended settings for each mode. CHECK THESE against the Qwen3.5 model card's
# "Best Practices" section on the day of the run, and edit them here if they differ: the values
# used are saved with every run, so the pages will report whatever was actually used.
SAMPLING = {
    "off": dict(temperature=0.7, top_p=0.8, top_k=20, min_p=0.0, presence_penalty=0.0),
    "on": dict(temperature=1.0, top_p=0.95, top_k=20, min_p=0.0, presence_penalty=1.5),
}

SYSTEM = (
    "You answer questions about a company's internal documentation and the public documentation "
    "it uses. Use only the numbered sources you are given."
)
INSTRUCTIONS = (
    "Answer the question using only these sources. If it needs a count or a calculation, work it "
    "out in a few short lines first. Then give the final answer on its own last line, as:\n"
    f"{MARKER} <answer>\n"
    "Give a number as digits only, in the unit the question asks for, with no unit after it. "
    f"If the sources don't contain the answer, write {MARKER} unknown"
)
ANSWER_TOKENS = 400
CLOSE_THINKING = "\n</think>\n\n"

CONDITIONS = {
    "plain": dict(model="small", thinking=False, wordings=[0], samples=20, logprobs=5),
    "wordings": dict(model="small", thinking=False, wordings=[1, 2, 3], samples=10, logprobs=0),
    "thinking": dict(model="small", thinking=True, wordings=[0], samples=10, logprobs=0),
    "stronger": dict(model="large", thinking=False, wordings=[0], samples=5, logprobs=5),
}
# thinking budgets, as multiples of the mean length of a plain reply, so a budget of 5x costs about
# what a five-sample vote costs; plus a ceiling well above them, to show what the model does when it
# thinks as long as it likes (a reference point, at a much higher cost)
BUDGET_MULTIPLES = [1, 3, 5, 9]
THINKING_CEILING = 4096
# requests timed one at a time, after the main run, for Lesson 2's latency comparison
PROBE_QUESTIONS = 10


def user_message(question: dict, wording: int) -> str:
    sources = "\n\n".join(f"[{i}]\n{chunk['text']}" for i, chunk in enumerate(question["context"], start=1))
    return f"Sources:\n\n{sources}\n\n{INSTRUCTIONS}\n\nQuestion: {question['wordings'][wording]}"


def seed_for(*parts) -> int:
    return int.from_bytes(hashlib.sha256(":".join(map(str, parts)).encode()).digest()[:4], "big")


@dataclass
class Generated:
    text: str
    tokens: int
    finished: bool
    logprobs: list = field(default_factory=list)


class VLLMBackend:
    def __init__(self, model: str, dtype: str, max_model_len: int, engine_args: dict):
        import torch
        import vllm
        from vllm import LLM

        self.llm = LLM(model=model, dtype=dtype, max_model_len=max_model_len, **engine_args)
        try:
            from huggingface_hub import model_info
            resolved = model_info(model, revision=engine_args.get("revision")).sha
        except Exception as error:
            resolved = f"unknown ({error})"
        self.tokenizer = self.llm.get_tokenizer()
        self.vllm = vllm
        gpus = [torch.cuda.get_device_name(i) for i in range(torch.cuda.device_count())]
        self.info = {"engine": "vllm", "engine_version": vllm.__version__, "torch": torch.__version__,
                     "gpus": gpus, "gpus_used": engine_args.get("tensor_parallel_size", 1),
                     "dtype": dtype, "max_model_len": max_model_len, "engine_args": engine_args,
                     "model_commit": resolved}

    def render(self, messages: list[dict], thinking: bool) -> str:
        return self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True,
                                                  enable_thinking=thinking)

    def count(self, text: str) -> int:
        return len(self.tokenizer.encode(text, add_special_tokens=False))

    def generate(self, requests: list[dict]) -> list[list[Generated]]:
        from vllm import SamplingParams

        params = [SamplingParams(n=r["n"], max_tokens=r["max_tokens"], seed=r["seed"], stop=r.get("stop"),
                                 logprobs=r.get("logprobs") or None, **r["sampling"]) for r in requests]
        outputs = self.llm.generate([r["prompt"] for r in requests], params, use_tqdm=True)
        results = []
        for output in outputs:
            samples = []
            for completion in output.outputs:
                steps = []
                if completion.logprobs:
                    for token_id, options in zip(completion.token_ids, completion.logprobs):
                        chosen = options[token_id]
                        top = sorted(options.values(), key=lambda lp: lp.rank or 0)
                        steps.append({"token": chosen.decoded_token, "logprob": chosen.logprob,
                                      "top": [[o.decoded_token, o.logprob] for o in top]})
                samples.append(Generated(text=completion.text, tokens=len(completion.token_ids),
                                         finished=completion.finish_reason == "stop", logprobs=steps))
            results.append(samples)
        return results


class StandInBackend:
    """For --dry-run: checks the plumbing with no model. Replies are random and meaningless: each
    question gets a made-up chance of being answered right, and 'thinking' is filler text."""

    def __init__(self, questions: list[dict]):
        self.answers = {q["wordings"][w]: q for q in questions for w in range(4)}
        self.info = {"engine": "stand-in (dry run)", "engine_version": "-", "gpus": [], "gpus_used": 0,
                     "dtype": "-", "max_model_len": 0, "engine_args": {}}

    def render(self, messages: list[dict], thinking: bool) -> str:
        opening = "<think>\n" if thinking else "<think>\n\n</think>\n\n"
        return "".join(f"<|im_start|>{m['role']}\n{m['content']}<|im_end|>\n" for m in messages) + \
            f"<|im_start|>assistant\n{opening}"

    def count(self, text: str) -> int:
        return math.ceil(len(text) / 4)

    def _question(self, prompt: str) -> dict:
        wording = prompt.split("Question: ")[-1].split("<|im_end|>")[0]
        return self.answers[wording]

    def generate(self, requests: list[dict]) -> list[list[Generated]]:
        results = []
        for r in requests:
            q = self._question(r["prompt"])
            rng = random.Random(r["seed"])
            skill = random.Random(q["id"]).random()
            samples = []
            for _ in range(r["n"]):
                if r.get("stop"):
                    length = rng.randint(20, r["max_tokens"] * 2)
                    text = " ".join(["hmm"] * min(length, r["max_tokens"]))
                    samples.append(Generated(text=text, tokens=min(length, r["max_tokens"]),
                                             finished=length <= r["max_tokens"]))
                    continue
                answer = q["answer"] if rng.random() < skill else "unknown"
                text = f"Looking at the sources.\n{MARKER} {answer}"
                steps = [{"token": piece, "logprob": -rng.random(), "top": [[piece, -0.1]]}
                         for piece in [MARKER, f" {answer}"]] if r.get("logprobs") else []
                samples.append(Generated(text=text, tokens=self.count(text), finished=True, logprobs=steps))
            results.append(samples)
        return results


def answer_logprobs(steps: list[dict]) -> list[dict]:
    """The logprob steps from the ANSWER marker onwards: the part Lesson 6 reads."""
    text = ""
    for i, step in enumerate(steps):
        text += step["token"] or ""
        if MARKER in text:
            return steps[i + 1:]
    return []


def sample_record(question: dict, g: Generated) -> dict:
    record = {"text": g.text, "answer": extract_answer(g.text), "correct": is_correct(question, g.text),
              "tokens": g.tokens, "finished": g.finished}
    if g.logprobs:
        record["answer_logprobs"] = answer_logprobs(g.logprobs)
    return record


def run_plain_like(backend, questions, condition, spec, sampling, only) -> tuple[list[dict], dict]:
    requests, keys = [], []
    for q in questions:
        for w in spec["wordings"]:
            messages = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user_message(q, w)}]
            requests.append(dict(prompt=backend.render(messages, False), n=spec["samples"], max_tokens=ANSWER_TOKENS,
                                 seed=seed_for(q["id"], w, condition), logprobs=spec["logprobs"], sampling=sampling))
            keys.append((q, w))
    start = time.monotonic()
    outputs = backend.generate(requests)
    wall = time.monotonic() - start
    records = [{"id": q["id"], "wording": w, "seed": r["seed"], "prompt_tokens": backend.count(r["prompt"]),
                "samples": [sample_record(q, g) for g in out]}
               for (q, w), r, out in zip(keys, requests, outputs)]
    generated = sum(g.tokens for out in outputs for g in out)
    return records, {"wall_seconds": wall, "requests": len(requests), "generated_tokens": generated}


def run_thinking(backend, questions, condition, spec, sampling, budgets) -> tuple[list[dict], dict]:
    top = max(budgets)
    firsts, keys = [], []
    for q in questions:
        messages = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user_message(q, 0)}]
        prompt = backend.render(messages, True)
        if not prompt.endswith("<think>\n"):
            sys.exit("The thinking-on prompt doesn't end with '<think>\\n'. Check the chat template before running.")
        firsts.append(dict(prompt=prompt, n=spec["samples"], max_tokens=top, seed=seed_for(q["id"], 0, condition),
                           stop=["</think>"], sampling=sampling))
        keys.append(q)
    start = time.monotonic()
    thoughts = backend.generate(firsts)
    think_wall = time.monotonic() - start

    # one answer step per distinct place the thinking stops
    answers, plan = [], []
    for q, first, samples in zip(keys, firsts, thoughts):
        for s_index, thought in enumerate(samples):
            words = thought.text
            cut_points = {}
            for budget in budgets:
                ended = thought.finished and thought.tokens <= budget
                cut = thought.tokens if ended else min(budget, thought.tokens)
                cut_points.setdefault(cut, []).append((budget, not ended))
            for cut, uses in cut_points.items():
                kept = words if cut >= thought.tokens else truncate_tokens(backend, words, cut)
                answers.append(dict(prompt=first["prompt"] + kept + CLOSE_THINKING, n=1, max_tokens=ANSWER_TOKENS,
                                    seed=seed_for(q["id"], s_index, cut, condition), sampling=sampling))
                plan.append((q, s_index, cut, uses))
    start = time.monotonic()
    replies = backend.generate(answers)
    answer_wall = time.monotonic() - start

    by_question = {q["id"]: {"id": q["id"], "wording": 0, "seed": f["seed"], "prompt_tokens": backend.count(f["prompt"]),
                             "samples": [{"thinking_tokens": t.tokens, "thinking_finished": t.finished, "by_budget": {}}
                                         for t in thoughts[i]]}
                   for i, (q, f) in enumerate(zip(keys, firsts))}
    for (q, s_index, cut, uses), reply in zip(plan, replies):
        g = reply[0]
        for budget, forced in uses:
            by_question[q["id"]]["samples"][s_index]["by_budget"][str(budget)] = {
                **sample_record(q, g), "thinking_used": cut, "forced": forced}
    generated = sum(t.tokens for out in thoughts for t in out) + sum(r[0].tokens for r in replies)
    timing = {"wall_seconds": think_wall + answer_wall, "thinking_wall_seconds": think_wall,
              "answer_wall_seconds": answer_wall, "requests": len(firsts) + len(answers), "generated_tokens": generated}
    return list(by_question.values()), timing


def latency_probe(backend, questions, condition, spec, sampling, budgets) -> dict:
    """Time requests one at a time, as a user would wait for them. The main run batches everything,
    which is right for throughput but says nothing about how long one answer takes.
    Without thinking: one sample, and five samples in one request (a vote, sampled in parallel).
    With thinking: one sample thinking up to the largest budget, then answering."""
    probe = {}
    for q in questions:
        messages = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user_message(q, 0)}]
        if spec["thinking"]:
            prompt = backend.render(messages, True)
            start = time.monotonic()
            thought = backend.generate([dict(prompt=prompt, n=1, max_tokens=max(budgets), stop=["</think>"],
                                             seed=seed_for(q["id"], "probe", condition), sampling=sampling)])[0][0]
            reply = backend.generate([dict(prompt=prompt + thought.text + CLOSE_THINKING, n=1, max_tokens=ANSWER_TOKENS,
                                           seed=seed_for(q["id"], "probe-answer", condition), sampling=sampling)])[0][0]
            probe.setdefault("thinking_then_answer", []).append(
                {"id": q["id"], "seconds": time.monotonic() - start, "tokens": thought.tokens + reply.tokens})
        else:
            prompt = backend.render(messages, False)
            for n in (1, 5):
                start = time.monotonic()
                out = backend.generate([dict(prompt=prompt, n=n, max_tokens=ANSWER_TOKENS,
                                             seed=seed_for(q["id"], "probe", n, condition), sampling=sampling)])[0]
                probe.setdefault(f"samples_{n}", []).append(
                    {"id": q["id"], "seconds": time.monotonic() - start, "tokens": sum(g.tokens for g in out)})
    return probe


def truncate_tokens(backend, text: str, n: int) -> str:
    if isinstance(backend, StandInBackend):
        return " ".join(text.split()[:n])
    ids = backend.tokenizer.encode(text, add_special_tokens=False)[:n]
    return backend.tokenizer.decode(ids)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--condition", choices=CONDITIONS, required=True)
    parser.add_argument("--dry-run", action="store_true", help="use a stand-in model: no GPU, meaningless replies")
    parser.add_argument("--limit", type=int, help="only the first N questions (a smoke test)")
    parser.add_argument("--revision", default=None, help="model revision (commit) to pin; recorded either way")
    parser.add_argument("--dtype", default="float16", help="T4 and P100 GPUs have no bfloat16")
    parser.add_argument("--max-model-len", type=int, default=8192)
    parser.add_argument("--engine-args", default="{}", help='extra vLLM LLM(...) arguments as JSON, e.g. \'{"tensor_parallel_size": 2}\'')
    args = parser.parse_args()

    spec = CONDITIONS[args.condition]
    data = json.loads(SET_E.read_text(encoding="utf-8"))
    questions = data["questions"][: args.limit] if args.limit else data["questions"]
    model = MODELS[spec["model"]]
    sampling = SAMPLING["on" if spec["thinking"] else "off"]
    engine_args = json.loads(args.engine_args)
    if args.revision:
        engine_args["revision"] = args.revision

    backend = StandInBackend(data["questions"]) if args.dry_run else \
        VLLMBackend(model, args.dtype, args.max_model_len, engine_args)

    budgets = None
    if spec["thinking"]:
        plain = RUNS / ("plain.dry-run.json" if args.dry_run else "plain.json")
        if not plain.exists():
            sys.exit(f"Run --condition plain first: thinking budgets are set from its reply lengths ({plain}).")
        lengths = [s["tokens"] for r in json.loads(plain.read_text(encoding="utf-8"))["results"] for s in r["samples"]]
        mean = sum(lengths) / len(lengths)
        budgets = [round(m * mean) for m in BUDGET_MULTIPLES] + [THINKING_CEILING]
        records, timing = run_thinking(backend, questions, args.condition, spec, sampling, budgets)
    else:
        records, timing = run_plain_like(backend, questions, args.condition, spec, sampling, args.limit)

    generated = timing["generated_tokens"]
    timing.update(gpu_seconds=timing["wall_seconds"] * backend.info["gpus_used"],
                  tokens_per_second=generated / timing["wall_seconds"] if timing["wall_seconds"] else None)
    timing["latency_probe"] = latency_probe(backend, questions[:PROBE_QUESTIONS], args.condition, spec, sampling, budgets)
    payload = {
        "condition": args.condition,
        "dry_run": args.dry_run,
        "model": model,
        "revision": args.revision,
        "thinking": spec["thinking"],
        "samples_per_wording": spec["samples"],
        "wordings": spec["wordings"],
        "budgets": budgets,
        "budget_multiples": BUDGET_MULTIPLES if budgets else None,
        "thinking_ceiling": THINKING_CEILING if budgets else None,
        "sampling": sampling,
        "system": SYSTEM,
        "instructions": INSTRUCTIONS,
        "answer_max_tokens": ANSWER_TOKENS,
        "set_e_version": data["version"],
        "setup": {**backend.info, "python": platform.python_version()},
        "timing": timing,
        "results": records,
    }
    RUNS.mkdir(parents=True, exist_ok=True)
    out = RUNS / f"{args.condition}{'.dry-run' if args.dry_run else ''}{f'.limit{args.limit}' if args.limit else ''}.json"
    out.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    graded = [s for r in records for s in r["samples"]]
    if spec["thinking"]:
        for budget in budgets:
            marks = [s["by_budget"][str(budget)] for s in graded]
            print(f"budget {budget:>5} tokens: {sum(m['correct'] for m in marks)}/{len(marks)} correct, "
                  f"{sum(m['forced'] for m in marks)} cut off")
    else:
        print(f"{sum(s['correct'] for s in graded)}/{len(graded)} correct, "
              f"{sum(s['answer'] is None for s in graded)} with no ANSWER line")
    print(f"{args.condition}: {len(records)} prompts, {generated:,} generated tokens in {timing['wall_seconds']:.0f}s "
          f"-> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
