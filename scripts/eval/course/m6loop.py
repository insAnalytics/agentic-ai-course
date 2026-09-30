
from dataclasses import dataclass
from typing import Callable


def no_problem(*_) -> None:
    return None


@dataclass
class Checks:
    """Four places a check can sit. Each returns None if all is well, or a short reason if not."""
    before_model: Callable = no_problem
    before_tool: Callable = no_problem
    after_tool: Callable = no_problem
    before_answer: Callable = no_problem


def run_checked_agent(client, messages: list, tools: dict, checks: Checks, max_steps: int = 8) -> str:
    """Module 2's loop, with a check at each of the four points. A failed tool check becomes an
    error observation the model can react to; a failed check on the input or the answer stops the run."""
    for _ in range(max_steps):
        if reason := checks.before_model(messages):
            return f"stopped before calling the model: {reason}"
        response = client.create(messages=messages)
        messages.append({"role": "assistant", "content": response.content})
        calls = [block for block in response.content if block.type == "tool_use"]
        if not calls:
            answer = "".join(block.text for block in response.content if block.type == "text")
            if reason := checks.before_answer(answer):
                return f"answer withheld: {reason}"
            return answer
        results = []
        for call in calls:
            if reason := checks.before_tool(call, messages):
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": reason, "is_error": True})
                continue
            output = tools[call.name](**call.input)
            if reason := checks.after_tool(call, output):
                results.append({"type": "tool_result", "tool_use_id": call.id, "content": reason, "is_error": True})
                continue
            results.append({"type": "tool_result", "tool_use_id": call.id, "content": output})
        messages.append({"role": "user", "content": results})
    return f"stopped after {max_steps} steps without an answer"
