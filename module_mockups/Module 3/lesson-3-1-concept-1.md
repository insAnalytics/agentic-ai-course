# Module 3, Lesson 1 — Concept 1: Names and descriptions as prompts

---

## A tool's name and description are input the model reasons over

Not documentation for a future developer reading the code — [the exact text the model sees when deciding whether and how to call a tool](→ Module 1, structured output and tool calling lesson, tool calling structured output applied to a specific use case concept). Writing a vague name or description isn't a stylistic shortcut; it's the same category of mistake as [a vague prompt from Module 2](→ Module 2, prompting fundamentals lesson, specificity and clear instructions concept), just now shaping a tool-selection decision instead of a written response.

---

## The pain: a name and description that don't actually distinguish intent

```python
def get_data(id: str) -> dict:
    """Gets data."""
    ...
```

Nothing here tells the model *what kind* of data, *what* `id` actually
identifies, or when this tool is even the right one among several
similarly-vague options. A model choosing between this and a
similarly-underspecified second tool has no real basis to pick
correctly — not because it reasoned poorly, but because the tool never
gave it enough to reason *with*.

---

## The fix: specific enough to actually disambiguate

```python
def get_user_profile(user_id: str) -> dict:
    """
    Retrieve a user's profile (name, email, account status) by their
    unique user ID. Use this when you need account details for a
    specific, already-identified user — not for searching by name.
    """
    ...
```

The description now does real work: it states exactly what's returned,
what `user_id` means, and — importantly — an explicit boundary
("not for searching by name") ruling out a plausible misuse before it
happens. This is [the same always/never constraint pattern from Module 2's system-prompt design](→ Module 2, the system prompt as agent design lesson, role persona and behavioral constraints concept), applied at the individual-tool level rather than the whole agent's behavior.

---

## Quiz cards

> **Q1.** Who is a tool's name and description actually written for?
> - A) A future human developer reading the source code
> - B) The model itself — this is text it directly reasons over when deciding whether and how to call the tool ✅
> - C) No one — names and descriptions have no functional effect
> - D) Only the person who originally wrote the tool

> **Q2.** Why does `get_data(id)`'s vague name and description create a
> real problem, not just a style issue?
> - A) It doesn't — vague names have no actual consequence
> - B) It gives the model no real basis to correctly choose this tool over a similarly-vague alternative, or to know what `id` should actually be ✅
> - C) Python requires descriptive names for functions to run at all
> - D) Vague names only matter for tools with more than one parameter

> **Q3.** What does `"not for searching by name"` accomplish in the
> `get_user_profile` description?
> - A) Nothing — it's redundant with the rest of the description
> - B) It's an explicit constraint ruling out a plausible misuse before it happens, the same always/never pattern from Module 2's system-prompt design ✅
> - C) It prevents the tool from ever being called incorrectly, with certainty
> - D) It only applies if the tool has more than one parameter

---

*(End of Concept 1. This lesson continues with Concept 2 — parameter
design — drafted separately.)*
