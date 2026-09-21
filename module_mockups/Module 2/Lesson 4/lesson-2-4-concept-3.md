# Module 2, Lesson 4 — Concept 3: Handling multiple tools — a dispatch mechanism

---

## The pain: hardcoding doesn't survive a second tool

[Concept 2's loop](→ this lesson, from round trip to loop the minimal viable transformation concept) hardcoded exactly one tool. Add a second — `check_price`, alongside `get_weather` — and that structure breaks immediately:

```python
def get_weather(location: str) -> str:
    return f"It's sunny in {location}."

def check_price(item: str) -> str:
    return "$4.50" if item == "notebook" else "unknown"

# the Concept 2 loop, awkwardly extended for a second tool
if block.type == "tool_use":
    if block.name == "get_weather":
        result = get_weather(**block.input)
    elif block.name == "check_price":
        result = check_price(**block.input)
    # every new tool needs yet another elif branch here...
```

This is exactly [the same "show the pain, then the fix" shape this course has hit before](→ Module 0, the Python setup lesson, error handling concept) — a chain of `elif` branches that grows every single time a new tool gets added, each one hardcoding a specific tool name directly into the loop's own control flow.

---

## The fix: a dict mapping names to actual callables

Python functions are ordinary objects — they can be stored as dict
values, exactly like any other value. That's the entire fix: a dict
mapping each tool's *name* (a string) directly to the actual, callable
*function* itself:

```python
TOOL_REGISTRY = {
    "get_weather": get_weather,
    "check_price": check_price,
}

client = FakeLLMClient(scripted_responses=[
    ToolUseBlock(name="get_weather", input={"location": "Paris"}),
    ToolUseBlock(name="check_price", input={"item": "notebook"}),
    TextBlock(text="It's sunny in Paris, and the notebook costs $4.50."),
])

messages = [{"role": "user", "content": "What's the weather in Paris, and how much is a notebook?"}]

while True:
    response = client.create(messages=messages)
    block = response.content[0]

    if block.type == "tool_use":
        tool_function = TOOL_REGISTRY[block.name]
        result = tool_function(**block.input)
        print(f"called {block.name}({block.input}) -> {result}")
        messages.append({"role": "assistant", "content": [block]})
        messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
    elif block.type == "text":
        print(f"final answer: {block.text}")
        break
```
```
called get_weather({'location': 'Paris'}) -> It's sunny in Paris.
called check_price({'item': 'notebook'}) -> $4.50
final answer: It's sunny in Paris, and the notebook costs $4.50.
```
*(runs live, shows output — read-only demo snippet, not graded)*

`tool_function = TOOL_REGISTRY[block.name]` is the entire dispatch
mechanism — one line, correctly selecting `get_weather` on the first
tool-use response and `check_price` on the second, purely by looking up
`block.name` in the registry. Adding a third tool means adding one
entry to `TOOL_REGISTRY`; the loop's own logic never needs to change at
all, no matter how many tools exist.

---

## Quiz cards

> **Q1.** What breaks about Concept 2's hardcoded loop the moment a
> second tool is added?
> - A) Nothing breaks — the original loop already handles any number of tools
> - B) The loop only knows how to call one specific, hardcoded function — a second tool has nowhere to actually be dispatched to without further hardcoded branches ✅
> - C) The fake client stops working entirely
> - D) `block.type` no longer works correctly with two tools

> **Q2.** Why does `TOOL_REGISTRY[block.name]` work as a dispatch
> mechanism at all?
> - A) It doesn't actually work — this is just illustrative pseudocode
> - B) Python functions are ordinary objects that can be stored as dict values, so looking up a tool's name retrieves the actual callable function to invoke ✅
> - C) `block.name` is automatically converted into a function by Python
> - D) `TOOL_REGISTRY` only works with exactly two tools, never more or fewer

> **Q3.** What has to change in the loop's own code when a third tool
> gets added, using the registry approach?
> - A) The entire `while` loop needs to be rewritten
> - B) Nothing in the loop's logic changes at all — only one new entry needs to be added to `TOOL_REGISTRY` ✅
> - C) A new `elif` branch must be added, exactly like the hardcoded version
> - D) The fake client needs to be reconfigured entirely

> **Q4.** In the live demo, how does the loop correctly call two
> different functions across two separate tool-use responses?
> - A) It doesn't — both responses actually call the same function
> - B) Each response's `block.name` is looked up in `TOOL_REGISTRY` independently, correctly retrieving `get_weather` for the first and `check_price` for the second ✅
> - C) The loop guesses which function to call based on the input's shape
> - D) `TOOL_REGISTRY` only supports one lookup per entire loop run

---

## Applied sandbox exercise 2

*(dispatch across multiple tools — genuinely graded against a fake
client scripted with more than one tool call)*

*Task shown to learner:* Given `get_weather(location: str) -> str` and
`check_price(item: str) -> str` (both provided), build a `TOOL_REGISTRY`
mapping both tool names to their functions, and write `run_agent_loop`
using registry-based dispatch instead of hardcoded branches — handling
any number of scripted tool-use responses before a final `text` block.

*Hidden test cases:*
```python
client = FakeLLMClient(scripted_responses=[
    ToolUseBlock(name="check_price", input={"item": "notebook"}),
    ToolUseBlock(name="get_weather", input={"location": "Berlin"}),
    TextBlock(text="The notebook is $4.50 and Berlin is sunny."),
])

final_answer = run_agent_loop(client, [{"role": "user", "content": "..."}])
assert final_answer == "The notebook is $4.50 and Berlin is sunny."
assert client.call_count == 3
```

*Hint (shown on request):* Build `TOOL_REGISTRY = {"get_weather": get_weather, "check_price": check_price}`
once, outside the loop. Inside the tool-use branch, replace any
hardcoded function call with
`tool_function = TOOL_REGISTRY[block.name]` followed by
`tool_function(**block.input)` — this one change is what lets the
function correctly handle a scripted sequence involving either tool, in
any order.

*Correct answer + explanation (shown on failure, if requested):*
```python
TOOL_REGISTRY = {
    "get_weather": get_weather,
    "check_price": check_price,
}

def run_agent_loop(client, messages):
    while True:
        response = client.create(messages=messages)
        block = response.content[0]

        if block.type == "tool_use":
            tool_function = TOOL_REGISTRY[block.name]
            result = tool_function(**block.input)
            messages.append({"role": "assistant", "content": [block]})
            messages.append({"role": "user", "content": [{"type": "tool_result", "content": result}]})
        elif block.type == "text":
            return block.text
```
This is the complete, generalizable version of the loop — the dispatch
line is the only real change from Concept 2's minimal version, and it's
what lets this exact same function correctly handle `check_price`
first, `get_weather` second, in this test's scripted sequence, without
ever needing to know in advance which tools would actually be
requested or in what order.

---

*(End of Concept 3 — final concept section of Lesson 4. This lesson
continues with the outcomes callout, comprehensive quiz, and
comprehensive sandbox — drafted separately.)*
