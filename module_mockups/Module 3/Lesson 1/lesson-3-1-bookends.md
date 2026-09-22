# Designing Tools a Model Can Use Well

> **You'll be able to**
> - Write tool names and descriptions as prompts the model reasons
>   over, not documentation for a human
> - Design clear, well-typed parameters a schema alone can't guarantee
>   are sensible
> - Choose between a narrow and a broad tool as a real usability
>   tradeoff, distinct from the security dimension covered later

**Why it matters**
Every tool built in Module 2 worked because the exercises' scripted
responses already knew what to call — a real agent has to *choose*
correctly, from whatever the tool's own name, description, and
parameters actually communicate. This lesson is where tool design
stops being incidental to getting an exercise to pass and becomes the
actual skill.

---

## Comprehensive quiz

> **Q1.** Who is a tool's name and description actually written for?
> - A) A future human developer
> - B) The model itself — text it directly reasons over ✅
> - C) No one — no functional effect
> - D) Only the tool's original author

> **Q2.** Why does `get_data(id)`'s vague description create a real
> problem?
> - A) It doesn't
> - B) No real basis for the model to choose it correctly over an alternative ✅
> - C) Python requires descriptive names to run
> - D) Only matters with multiple parameters

> **Q3.** Why doesn't a valid schema guarantee well-designed parameters?
> - A) It does guarantee this
> - B) The schema only constrains shape; choosing clear names and the right types is a separate decision ✅
> - C) Schemas can't be generated for tool parameters
> - D) Contradicts Module 1's coverage

> **Q4.** What makes a tool "narrow"?
> - A) A shorter name
> - B) It does exactly one thing, leaving little room to call it wrong ✅
> - C) It never returns data
> - D) More parameters than a broad tool

> **Q5.** What does broad-tool flexibility trade away?
> - A) Nothing — strictly better
> - B) More room for the model to get a more complex call wrong ✅
> - C) Execution speed
> - D) The possibility of misuse

---

## Comprehensive sandbox

*(applied — redesign a poorly-designed registry tool, graded on the
submitted code)*

*Task shown to learner:* Given this tool from the agent registry app —
```python
def q(s: str) -> str:
    """Query."""
    ...
```
— redesign it as a well-designed, narrow tool for looking up a single
registered agent's configuration by name. Your version must have: a
descriptive function name, a docstring specifying exactly what's
returned and what the parameter means, a well-typed parameter, and (in
a comment) a one-line justification for why this stays narrow rather
than becoming a broader `run_query`-style tool.

*Grading:* checks for a renamed function, a docstring longer than the
original with a return-value description and a parameter description,
a type-hinted parameter, and a comment addressing granularity.

*Correct answer:*
```python
def get_agent_config(agent_name: str) -> dict:
    """
    Retrieve one agent's configuration (model, creation date) by its
    exact registered name. Use this for a specific, already-known
    agent name -- not for searching or listing multiple agents.
    """
    ...
    # kept narrow: a single, unambiguous lookup is far less error-prone
    # for the model to call correctly than a general query tool would be
```
