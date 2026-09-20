# Module 2, Lesson 4 — Concept 1: The fake LLM client — what it is and how to use it

> **A genuine shift from Lessons 1-3:** since there's no real network
> call involved, this fake client — and everything built on top of it
> for the rest of this module — genuinely runs live in this course's
> sandbox, unlike the illustrative-only examples in earlier lessons.

---

## Why a fake client, and what it actually needs to do

Every exercise from here forward in this module needs a way to run a
real agent loop's *code* against something that behaves exactly like
[a real LLM API's response shapes, from Module 1](→ Module 1, calling llm apis and processing responses lesson, the response shape concept) — without making a real, non-deterministic network call. A **fake LLM client** does exactly this: it mirrors a real client's call pattern and response structure, but returns a pre-configured, scripted sequence of responses instead of anything actually generated.

---

## A minimal working version

```python
class ToolUseBlock:
    def __init__(self, name: str, input: dict):
        self.type = "tool_use"
        self.name = name
        self.input = input

class TextBlock:
    def __init__(self, text: str):
        self.type = "text"
        self.text = text

class FakeResponse:
    def __init__(self, content: list):
        self.content = content

class FakeLLMClient:
    def __init__(self, scripted_responses: list):
        self.scripted_responses = scripted_responses
        self.call_count = 0

    def create(self, messages: list) -> FakeResponse:
        response_block = self.scripted_responses[self.call_count]
        self.call_count += 1
        return FakeResponse(content=[response_block])
```

`ToolUseBlock` and `TextBlock` mirror [the exact content-block shapes from Module 1's tool-calling coverage](→ Module 1, structured output and tool calling lesson, tool calling structured output applied to a specific use case concept) — `.type`, and either `.name`/`.input` or `.text`. `FakeLLMClient.create()` mirrors a real client's call signature, but instead of generating anything, it simply returns the *next* item from a scripted list, advancing one position per call.

---

## Using it

```python
client = FakeLLMClient(scripted_responses=[
    ToolUseBlock(name="get_weather", input={"location": "Paris"}),
    TextBlock(text="It's sunny in Paris today!"),
])

response_1 = client.create(messages=[{"role": "user", "content": "What's the weather in Paris?"}])
print(response_1.content[0].type)
print(response_1.content[0].name, response_1.content[0].input)

response_2 = client.create(messages=[])
print(response_2.content[0].type)
print(response_2.content[0].text)
```
```
tool_use
get_weather {'location': 'Paris'}
text
It's sunny in Paris today!
```
*(runs live, shows output — read-only demo snippet, not graded)*

The first call returns the scripted tool-use response; the second call
returns the scripted text response — exactly the two-step shape [from Module 1's full round trip](→ Module 1, structured output and tool calling lesson, the full round trip concept), fully deterministic, known completely in advance.

---

## Why this makes grading possible at all

Because the exact sequence of responses is scripted by whoever wrote
the exercise, the loop's *correct* behavior at each step is fully known
in advance — did the code correctly recognize a `tool_use` response and
execute the right tool? Did it correctly append the result and
continue? Did it correctly recognize the `text` response and stop? This
is exactly the right scope for grading in this module: the loop's
*structural correctness*, never whether a model's underlying decision
was a good one — that judgment question belongs to a later module
entirely, [not this one](→ this module, agents workflows and the loop lesson).

---

## Quiz cards

> **Q1.** What does `FakeLLMClient` actually do differently from a real
> LLM client?
> - A) It makes a real network call, just to a different server
> - B) It returns a pre-configured, scripted sequence of responses, advancing one item per call, instead of generating anything from a real model ✅
> - C) It only works with text responses, never tool calls
> - D) It requires a real API key to function

> **Q2.** Why do `ToolUseBlock` and `TextBlock` matter, specifically in
> how they're shaped?
> - A) Their shape is arbitrary and unrelated to anything covered previously
> - B) They mirror the exact content-block shapes from Module 1's tool-calling coverage, so code written against the fake client transfers directly to a real client later ✅
> - C) They only exist for this one specific demo, with no broader purpose
> - D) They replace the need for any actual loop logic

> **Q3.** Why does using a scripted, fully-known response sequence make
> grading a learner's loop code possible?
> - A) It doesn't actually help with grading in any way
> - B) Since the exact sequence is known in advance, the loop's correct behavior at each step is fully determined, letting an exercise check structural correctness reliably ✅
> - C) Scripted responses make grading impossible, since nothing changes between runs
> - D) Grading only becomes possible once a real API key is provided

> **Q4.** What does this module's grading deliberately stay scoped to,
> and what does it deliberately leave out?
> - A) It grades whether the model's underlying decisions were good ones, not the loop's code
> - B) It grades the loop's structural correctness — parsing, execution, continuation — deliberately leaving out any judgment about whether a model's decision was actually good ✅
> - C) It grades response style and tone exclusively
> - D) Grading in this module is identical to what a later Evaluation module will cover

---

*(End of Concept 1. This lesson continues with Concept 2 — from round
trip to loop, the minimal viable transformation — drafted separately.)*
