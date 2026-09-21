# ReAct and Reasoning in the Loop

> **You'll be able to**
> - Extend the agent loop to handle multi-block responses, including an
>   explicit `"thinking"` block before an action
> - Explain, mechanically, why reasoning before acting can improve tool
>   selection — and where that claim's actual evidence comes from
> - Explain why native tool calling replaced the original text-parsed
>   ReAct format, with a real demonstration of the fragility it fixed

**Why it matters**
This lesson closes the loop — literally — on two threads this course
has been building since Module 1: chain-of-thought's scaffolding effect
now applies inside the agent's own decision-making, not just to a
standalone question, and constrained decoding's reliability guarantee
is what makes acting on that reasoning something you can actually build
production code around, rather than something needing defensive string
parsing at every step.

---

## Comprehensive quiz

*(end of lesson, conceptual — spans all three concepts, mixed order)*

> **Q1.** What does a `"thinking"` block add to the loop that Lesson 4's
> version didn't have?
> - A) A new way to execute a tool
> - B) An explicit, visible reasoning step before an action, rather than jumping directly from state to decision ✅
> - C) A replacement for the `text` block entirely
> - D) A mechanism for stopping the loop early

> **Q2.** Why does a single response now potentially contain more than
> one block?
> - A) This is arbitrary and unrelated to how real APIs work
> - B) It matches the actual multi-block response shape from Module 1's reasoning-output coverage ✅
> - C) Multiple blocks only happen when an error occurs
> - D) The fake client requires exactly two blocks always

> **Q3.** What mechanism does reasoning-before-tool-selection apply, that
> was originally demonstrated in a different context?
> - A) Constrained decoding
> - B) Chain-of-thought's scaffolding effect from Lesson 2 — written-out reasoning becomes part of what the next prediction conditions on ✅
> - C) The KV cache mechanism
> - D) Presence penalty

> **Q4.** Why can't the fake client's demo fully prove reasoning improves
> tool choice?
> - A) The claim is actually false
> - B) The fake client is fully scripted in advance, so showing reasoning alongside a correct choice doesn't demonstrate the reasoning caused it — the real evidence is Lesson 2's mechanism ✅
> - C) Tool selection can never be improved by any technique
> - D) This concept secretly disagrees with Lesson 2

> **Q5.** In the original text-parsed ReAct format, what did the
> surrounding code have to do to extract a tool call?
> - A) Nothing — the format was always automatically structured
> - B) Parse plain text with string splitting or pattern matching, since nothing guaranteed the exact expected format ✅
> - C) Call a separate parsing API
> - D) The original format never included action information

> **Q6.** What actually changed between the original text-parsed format
> and native tool calling?
> - A) Reasoning became unnecessary once native tool calling existed
> - B) Reasoning still happens via thinking blocks; the action itself became structured and guaranteed via constrained decoding, instead of requiring fragile text parsing ✅
> - C) Native tool calling removed the need for any action
> - D) The two formats are functionally identical

---

## Comprehensive sandbox

*(end of lesson, applied, multi-file — upgrading Lesson 4's registry
agent loop to the ReAct-extended, multi-block version; `tools.py` stays
unchanged, proving the modularity of the dispatch design)*

*Context provided:* the exact `tools.py` from [Lesson 4's comprehensive sandbox](→ this module, writing the loop by hand lesson) — `check_agent_exists`, `create_agent_entry`, and `TOOL_REGISTRY`, unchanged.

*Starter code shown to learner — one file tab:*

**Tab: `agent_loop.py`**
```python
from tools import TOOL_REGISTRY

def run_agent_loop(client, messages):
    """
    TODO: the ReAct-extended version — iterate every block in each
    response, printing any "thinking" block's content as
    f"[reasoning]: {block.thinking}", dispatching a "tool_use" block via
    TOOL_REGISTRY and appending the full response.content (not just the
    action block) plus the tool result, or returning on a "text" block.
    """
    pass
```

*Task shown to learner:* Upgrade `run_agent_loop` to the ReAct-extended
version from this lesson, without touching `tools.py` at all — proving
the same registry tools work correctly under the new, reasoning-aware
loop.

*Hidden test cases:*
```python
import tools
from agent_loop import run_agent_loop

client = FakeLLMClient(scripted_responses=[
    [ThinkingBlock(thinking="I should check whether research_agent already exists before creating it."),
     ToolUseBlock(name="check_agent_exists", input={"name": "research_agent"})],
    [ThinkingBlock(thinking="It doesn't exist yet, so I can safely create it."),
     ToolUseBlock(name="create_agent_entry", input={"name": "research_agent", "model": "claude-sonnet"})],
    [ThinkingBlock(thinking="The agent has been created successfully."),
     TextBlock(text="research_agent has been created with claude-sonnet.")],
])

final_answer = run_agent_loop(client, [{"role": "user", "content": "..."}])

assert final_answer == "research_agent has been created with claude-sonnet."
assert client.call_count == 3
assert tools._registry["research_agent"] == {"model": "claude-sonnet"}
```

*Hint (shown on request):* This is [Concept 1's exercise answer, exactly](→ this lesson, the react pattern interleaving thought before action concept) — the only thing that's changed is which tools live in `TOOL_REGISTRY`, imported from `tools.py` unchanged. The loop's own logic needs no modification for the new tools to work correctly.

*Correct answer + explanation (shown on failure, if requested):*
```python
from tools import TOOL_REGISTRY

def run_agent_loop(client, messages):
    while True:
        response = client.create(messages=messages)
        for block in response.content:
            if block.type == "thinking":
                print(f"[reasoning]: {block.thinking}")
            elif block.type == "tool_use":
                tool_function = TOOL_REGISTRY[block.name]
                result = tool_function(**block.input)
                messages.append({"role": "assistant", "content": response.content})
                messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
                break
            elif block.type == "text":
                return block.text
```
This is the real payoff of the registry-based dispatch design from
Lesson 4: upgrading the loop's own capabilities — adding reasoning
awareness — required zero changes to `tools.py`, since the dispatch
mechanism only ever depended on `block.name` matching a registry key,
never on the loop's internal structure. The three-step scripted
sequence now shows the model explicitly reasoning through the exact
check-before-create logic [from Lesson 3's system prompt design](→ this module, the system prompt as agent design lesson) — no longer just an instruction hoped to be followed, but visible, logged reasoning genuinely present at each step of a real, running loop.
