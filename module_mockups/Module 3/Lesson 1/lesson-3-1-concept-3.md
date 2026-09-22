# Module 3, Lesson 1 — Concept 3: Granularity — narrow vs. broad tools

---

## A real usability tradeoff, not a purely technical one

```python
def get_user_profile(user_id: str) -> dict:
    """Retrieve one user's profile by their user ID."""
    ...

def run_sql(query: str) -> list:
    """Run an arbitrary SQL query against the database."""
    ...
```

`get_user_profile` is **narrow**: it does exactly one thing, and the
model has very little room to call it wrong — a `user_id` is either
right or it isn't. `run_sql` is **broad**: genuinely more flexible (it
can answer questions no narrow tool anticipated), but that flexibility
means the model has to correctly construct an entire query itself,
leaving far more room for a subtly wrong — or badly-scoped — call than
a narrow tool ever could.

---

## The real tradeoff, stated plainly

Narrow tools are easier for a model to use *correctly*, at the cost of
covering only what was anticipated in advance. Broad tools cover far
more ground, at the cost of asking the model to get something more
complex right on every single call. This concept is scoped strictly to
that usability question — the same tradeoff has a real *security*
dimension too (what a broad tool like `run_sql` could do if misused),
[covered properly in Lesson 11](→ this module, designing for least privilege lesson).

---

## Quiz cards

> **Q1.** What makes `get_user_profile(user_id)` a "narrow" tool?
> - A) It has a shorter name than `run_sql`
> - B) It does exactly one thing, leaving the model very little room to call it incorrectly ✅
> - C) It never returns any data
> - D) It requires more parameters than a broad tool

> **Q2.** What's the real tradeoff broad tools like `run_sql` offer,
> compared to narrow ones?
> - A) No real tradeoff — broad tools are strictly better
> - B) More flexibility to handle unanticipated needs, at the cost of asking the model to correctly construct something more complex, with more room for error ✅
> - C) Broad tools are always faster to execute
> - D) Broad tools can never actually be misused

> **Q3.** What aspect of the narrow-vs-broad tradeoff does this concept
> explicitly leave for a later lesson?
> - A) Nothing — this concept covers the tradeoff completely
> - B) The security dimension — what a broad tool could do if misused, covered in Lesson 11 ✅
> - C) Whether tools can have more than one parameter
> - D) The Pydantic schema generation mechanism

---

*(End of Concept 3 — final concept of Lesson 1. Continues with
bookends — drafted separately.)*
