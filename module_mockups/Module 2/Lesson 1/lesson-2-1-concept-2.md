# Module 2, Lesson 1 — Concept 2: Agent vs. workflow vs. chatbot

---

## The distinguishing question: who decides what happens next?

These three terms get conflated constantly, but there's a precise
structural line separating them — not "how smart" the system is, or
how many LLM calls are involved, but specifically **who or what
controls the sequence of steps**:

- **Chatbot** — a human decides what happens next, at every turn. The
  system responds to whatever the human asks; it has no say over the
  sequence of the interaction itself.
- **Workflow** — the *code* decides the sequence, fixed in advance by
  whoever wrote it — even if individual steps call an LLM, the *order*
  and *number* of those steps is predetermined, not decided dynamically
  at runtime.
- **Agent** — the *model itself* decides the sequence and number of
  steps, dynamically, based on what happens along the way — [exactly the loop from the previous concept](→ this lesson, what an agent is structurally the perceive reason act observe cycle concept).

---

## A workflow, concretely — code decides the sequence

```python
def summarize(text: str) -> str:
    ...   # an LLM call, illustrative

def translate(text: str, target_language: str) -> str:
    ...   # another LLM call, illustrative

def run_workflow(document: str) -> str:
    summary = summarize(document)                  # step 1, always runs first
    translated = translate(summary, "French")       # step 2, always runs second
    return translated
```

Two LLM calls happen here — genuinely sophisticated work — but the
*sequence* is fixed directly in the code: `summarize` always runs
before `translate`, every single time, regardless of what either call
actually produces. Nothing about this structure changes based on the
LLM's output — the function's control flow was decided entirely when it
was written, not while it runs.

---

## The same task, as an agent instead — the model decides the sequence

Compare this to [Concept 1's loop](→ this lesson, what an agent is structurally the perceive reason act observe cycle concept): there, the *model's own output* at each step determined whether another cycle happened at all, and which tool got called next. Nobody wrote `get_weather("Paris")` followed by `get_weather("London")` as a fixed sequence in the code — the code only wrote the *loop*; the model decided, dynamically, that two calls were actually needed, and which two.

---

## The line, restated plainly

A workflow can call an LLM at every single step and still be
structurally a workflow, as long as the *sequence itself* is fixed by
the code. An agent can make a single, trivial tool call and still be
structurally an agent, as long as *whether* to make that call, and
*what* to do next, was the model's own decision at runtime — not
something predetermined. Sophistication and structure are genuinely
independent axes; this concept is only about the second one.

---

## Quiz cards

> **Q1.** What's the precise structural question that distinguishes a
> chatbot, a workflow, and an agent?
> - A) How many LLM calls each one makes
> - B) Who or what controls the sequence of steps — a human, fixed code, or the model itself, dynamically ✅
> - C) How intelligent or capable the underlying model is
> - D) Whether the system uses tools at all

> **Q2.** In `run_workflow`, why is this considered a workflow rather
> than an agent, even though it makes two LLM calls?
> - A) Two LLM calls is always too few to count as an agent
> - B) The sequence — `summarize` always before `translate` — is fixed directly in the code, not decided dynamically based on either call's output ✅
> - C) `run_workflow` doesn't actually use any LLM calls
> - D) Workflows can never call an LLM more than once

> **Q3.** Could a system making only a single, trivial tool call still be
> structurally an agent?
> - A) No — an agent must always make at least two tool calls
> - B) Yes — as long as whether to make that call, and what to do next, was the model's own runtime decision rather than something predetermined by the code ✅
> - C) No — a single tool call is always a chatbot, never an agent
> - D) This is impossible; agents and workflows are mutually exclusive by call count

> **Q4.** Why does this concept describe sophistication and structure as
> "genuinely independent axes"?
> - A) They're actually the same thing, described with different words
> - B) A workflow can be highly sophisticated (many LLM calls) while remaining structurally a workflow; an agent can be structurally simple while still being a genuine agent — the two properties don't determine each other ✅
> - C) Only agents can ever be sophisticated; workflows are always simple
> - D) Sophistication only applies to chatbots, never workflows or agents

---

*(End of Concept 2. This lesson continues with Concept 3 — the honest
case for not using an agent — drafted separately.)*
