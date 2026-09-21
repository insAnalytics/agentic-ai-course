# Module 2, Lesson 5 — Concept 1: The ReAct pattern — interleaving thought before action

---

## Jumping straight from state to action

[Lesson 4's loop](→ this module, writing the loop by hand lesson, from round trip to loop the minimal viable transformation concept) goes directly from receiving a response to acting on it — a `tool_use` block means "execute this," with no explicit reasoning step captured anywhere in between. **ReAct** (Reasoning + Acting) adds that missing step back in: an explicit `"thinking"` block, alongside `tool_use` and `text`, where the model's reasoning about *why* it's about to act becomes its own visible, distinguishable part of the response — [exactly chain-of-thought from Lesson 2](→ this module, prompting fundamentals lesson, chain of thought prompting concept), now applied specifically to *choosing an action* inside the loop, not just reasoning toward a standalone final answer.

---

## Extending the fake client: multiple blocks, one response

This requires a real evolution of [the fake client from Lesson 4](→ this module, writing the loop by hand lesson, the fake llm client what it is and how to use it concept): a single response can now contain *more than one* content block together — a `thinking` block followed by the actual action — [matching the exact multi-block response shape from Module 1's reasoning-output coverage](→ Module 1, calling llm apis and processing responses lesson, reasoning output in responses concept), rather than one block per response as before.

```python
class ThinkingBlock:
    def __init__(self, thinking: str):
        self.type = "thinking"
        self.thinking = thinking

class FakeLLMClient:
    def __init__(self, scripted_responses: list):
        self.scripted_responses = scripted_responses   # now: a list of block-lists
        self.call_count = 0

    def create(self, messages: list) -> FakeResponse:
        content_blocks = self.scripted_responses[self.call_count]
        self.call_count += 1
        return FakeResponse(content=content_blocks)
```

`scripted_responses` now holds a *list of lists* — each inner list is
one full response's content, potentially containing several blocks
together.

---

## The loop, updated to process every block in a response

```python
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

The loop now iterates every block in a response — logging any
`"thinking"` block along the way, then acting on whichever block
actually represents the decision (`tool_use` or `text`). Appending
`response.content` back into `messages` (rather than just the action
block alone) preserves the model's own reasoning as part of the
conversation history, exactly as it was actually generated.

---

## A complete run

```python
def get_weather(location: str) -> str:
    return f"It's sunny in {location}."

TOOL_REGISTRY = {"get_weather": get_weather}

client = FakeLLMClient(scripted_responses=[
    [ThinkingBlock(thinking="The user wants the weather in Paris. I should call get_weather."), ToolUseBlock(name="get_weather", input={"location": "Paris"})],
    [ThinkingBlock(thinking="I now have what I need to answer."), TextBlock(text="It's sunny in Paris today!")],
])

messages = [{"role": "user", "content": "What's the weather in Paris?"}]
final = run_agent_loop(client, messages)
print(f"final answer: {final}")
```
```
[reasoning]: The user wants the weather in Paris. I should call get_weather.
[reasoning]: I now have what I need to answer.
final answer: It's sunny in Paris today!
```
*(runs live, shows output — read-only demo snippet, not graded)*

Every action — the tool call *and* the eventual final answer — is now
preceded by its own explicit reasoning, visible and inspectable, rather
than happening silently.

---

## Quiz cards

> **Q1.** What does a `"thinking"` block add to the loop that Lesson 4's
> version didn't have?
> - A) A new way to execute a tool
> - B) An explicit, visible reasoning step before an action, rather than jumping directly from state to decision with no captured reasoning ✅
> - C) A replacement for the `text` block entirely
> - D) A mechanism for stopping the loop early

> **Q2.** Why does a single response now potentially contain more than
> one block, unlike Lesson 4's version?
> - A) This is arbitrary and has no real basis in how real APIs work
> - B) It matches the actual multi-block response shape from Module 1's reasoning-output coverage — a thinking block and an action block genuinely arrive together in one response ✅
> - C) Multiple blocks per response only happen when an error occurs
> - D) `FakeLLMClient` requires exactly two blocks per response, always

> **Q3.** Why does the loop append `response.content` (the full list of
> blocks) rather than just the single action block back into `messages`?
> - A) It doesn't matter which is appended — the two are equivalent
> - B) It preserves the model's own reasoning as part of the conversation history, exactly as it was actually generated, not just the resulting action ✅
> - C) `response.content` is required to always be appended in full for the fake client to function
> - D) Appending only the action block would cause a runtime error

---

## Applied sandbox exercise 1

*(implementing the ReAct-extended loop — genuinely graded against a
fake client scripted with interleaved thinking and action blocks)*

*Task shown to learner:* Given `check_price(item: str) -> str`
(provided) and a `TOOL_REGISTRY` mapping it, update `run_agent_loop` to
iterate every block in a response — logging any `"thinking"` block's
content with `print(f"[reasoning]: {block.thinking}")`, executing and
continuing on a `"tool_use"` block, and returning on a `"text"` block.

*Hidden test cases:*
```python
client = FakeLLMClient(scripted_responses=[
    [ThinkingBlock(thinking="I should check the price of the notebook."), ToolUseBlock(name="check_price", input={"item": "notebook"})],
    [ThinkingBlock(thinking="I have the price now."), TextBlock(text="The notebook costs $4.50.")],
])

final_answer = run_agent_loop(client, [{"role": "user", "content": "..."}])
assert final_answer == "The notebook costs $4.50."
assert client.call_count == 2
```

*Hint (shown on request):* This is nearly identical to this concept's
demo — a `for block in response.content:` loop inside the `while`,
handling all three block types, appending `response.content` (not just
the action block) alongside the tool result, and `break`-ing the inner
loop after handling a tool call so the outer `while` makes its next
call.

*Correct answer + explanation (shown on failure, if requested):*
```python
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
This is the exact ReAct-extended loop from this concept — genuinely
tested against a scripted sequence where each response includes both
reasoning and an action, confirming the loop correctly logs the
reasoning, dispatches the tool call, and returns the final answer once
it actually arrives.

---

*(End of Concept 1. This lesson continues with Concept 2 — why
reasoning before acting improves tool choice — drafted separately.)*
