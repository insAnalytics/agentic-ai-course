/**
 * Module 6 (Reliability) shared setup. Demos that read the committed model
 * runs pass `dataFiles={reliabilityData("plain", ...)}` (fetched on first
 * Run, see courseData.ts) and start their setup code with LOAD_RUNS. Each
 * run file is 1-2.5 MB, so a demo lists only the runs it reads.
 */
export function reliabilityData(...runs: string[]): string[] {
  return ["reliability/set-e.json", ...runs.map((run) => `reliability/runs/${run}.json`)];
}

/** Introduced in Module 6 Lesson 1 concept 2; shown there verbatim (keep the two byte-identical). */
export const LOAD_RUNS = String.raw`
import json
from pathlib import Path

DATA = Path("/data/reliability")


def load_run(name: str) -> dict:
    """One committed run file, such as "plain" (Qwen3.5-4B) or "plain.smaller" (Qwen3.5-2B)."""
    return json.loads((DATA / "runs" / f"{name}.json").read_text(encoding="utf-8"))


def load_questions() -> dict[str, dict]:
    """Set E's questions by id: wordings, answer, and the fixed context each one is asked with."""
    data = json.loads((DATA / "set-e.json").read_text(encoding="utf-8"))
    return {q["id"]: q for q in data["questions"]}
`;

/**
 * Module 6 Lesson 1 concept 4's by_wording and rate, verbatim from its first
 * demo; later demos that use them without defining them append this. Needs
 * the "plain" and "wordings" runs (plus ".smaller" ones for the 2B).
 */
export const BY_WORDING = String.raw`
def by_wording(name: str) -> dict[str, list[list[bool]]]:
    """Each question's outcomes, one list per wording: the original first, then the three others."""
    results = {}
    for part in (f"plain{name}", f"wordings{name}"):
        for r in load_run(part)["results"]:
            results.setdefault(r["id"], [None] * 4)[r["wording"]] = [reply["correct"] for reply in r["samples"]]
    return results


def rate(outcomes: list[bool]) -> float:
    return sum(outcomes) / len(outcomes)
`;

/** Module 6 Lesson 1 concept 2's successes, verbatim; later demos that use it without defining it append it. */
export const SUCCESSES = String.raw`
def successes(run: dict) -> dict[str, int]:
    """How many of each question's runs were right."""
    return {r["id"]: sum(reply["correct"] for reply in r["samples"]) for r in run["results"]}
`;

/**
 * Module 6 Lesson 2's shared setup, after REACT_FAKE_CLIENT + RECORDING_CLIENT
 * + COUNT_TOKENS (fakeClient.ts): Module 2's evaluator-optimizer loop and a
 * usage counter over recording clients, then a load_run-only loader. Both are
 * shown verbatim in Lesson 2 concept 2 (keep them byte-identical).
 */
export const EVALUATOR_LOOP_COST = String.raw`
class EvaluationBlock:
    def __init__(self, passed: bool, critique: str = ""):
        self.type = "evaluation"
        self.passed = passed
        self.critique = critique


def run_evaluator_optimizer(generator, evaluator, prompt: str, max_attempts: int = 3) -> str:
    """Module 2's evaluator-optimizer loop: generate, have a model judge it, revise with the critique."""
    current_prompt = prompt
    for attempt in range(max_attempts):
        candidate = generator.create(messages=[{"role": "user", "content": current_prompt}]).content[0].text
        verdict = evaluator.create(messages=[{"role": "user", "content": f"Evaluate this: {candidate}"}]).content[0]
        if verdict.passed:
            return candidate
        current_prompt = f"{prompt}\n\nPrevious attempt: {candidate}\nCritique: {verdict.critique}\nPlease revise."
    return f"Error: no passing candidate produced after {max_attempts} attempts"


def usage(*clients) -> dict:
    """Calls made, and tokens sent and received, across recording clients (the course's ~4 characters per token estimate)."""
    return {
        "calls": sum(len(c.seen) for c in clients),
        "sent": sum(count_tokens(messages) for c in clients for messages in c.seen),
        "received": sum(count_tokens(c.scripted_responses[i]) for c in clients for i in range(c.call_count)),
    }
`;

export const LOAD_RUN_ONLY = String.raw`
import json
from pathlib import Path

DATA = Path("/data/reliability")


def load_run(name: str) -> dict:
    """One committed run file, such as "plain" (Qwen3.5-4B) or "plain.smaller" (Qwen3.5-2B)."""
    return json.loads((DATA / "runs" / f"{name}.json").read_text(encoding="utf-8"))
`;
