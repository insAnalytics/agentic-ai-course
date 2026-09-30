# Module 6, Lesson 4 — Concept 6: Claims with no source to check

---

## When there's nothing to check against

Every check in this lesson so far compared a claim with something outside
the model: a cited chunk, another source, a tool result. Sometimes there's
nothing to compare with. The model answers from what it learned in
training, or adds a detail no source mentions. For those claims, the only
thing left to ask is the model itself.

Asking it to "check your answer" is the self-correction that
[Lesson 2](→ this module, accuracy latency cost and false refusals lesson, what reliability costs on things already built concept, the "reflection: the calls are certain, the benefit isn't" section)
described: Huang et al. found models often failed to fix their own
reasoning that way, and sometimes made it worse. Chain-of-Verification
changes how the question is asked, and that turns out to matter.

---

## Chain-of-Verification

Dhuliawala et al.'s
[Chain-of-Verification](https://arxiv.org/abs/2309.11495) (ACL Findings
2024), CoVe for short, runs in four steps:

1. **Draft** an answer.
2. **Plan** verification questions, one per fact the draft states: "which
   model does `research_agent` run on?" for a draft that lists it as still on
   `claude-legacy`.
3. **Answer** each verification question.
4. **Revise** the draft in light of those answers.

The idea behind it is that a model answers a short, specific question more
accurately than it produces a long answer containing the same fact. The
paper measured exactly that. On list questions built from Wikidata, only
about 17% of the entities in Llama 65B's few-shot answers were correct, but
when each entity was checked with its own verification question, about 70%
of those questions were answered correctly. Applying CoVe more than doubled
the precision of the lists, from 0.17 to 0.36.

The paper's most useful finding for anyone building this is about step 3.
It compared ways of answering the verification questions:

- **Joint:** planning and answering in one prompt that still contains the
  draft.
- **Two-step:** planning in one prompt, then answering all the questions in a
  second prompt that doesn't contain the draft.
- **Factored:** answering each question in its own prompt, seeing nothing
  but that question.

The factored version beat the joint one on every task, and the two-step
version beat it on the tasks it was tested on. The authors' explanation is that a verification step that can see the draft
tends to repeat it, so the draft's mistakes pass straight through. Here's
the structural difference, and what it costs:

```python
draft = "The agents still on claude-legacy are research_agent, notes_agent and billing_agent."
questions = ["Which model does research_agent run on?", "Which model does notes_agent run on?",
             "Which model does billing_agent run on?"]


def joint_verification(draft: str, questions: list[str]) -> list[str]:
    """One call plans and answers every question, with the draft in front of it."""
    return [f"Draft answer:\n{draft}\n\nCheck the draft by answering:\n" + "\n".join(questions)]


def factored_verification(questions: list[str]) -> list[str]:
    """One call per question, each seeing only its own question."""
    return [f"Answer this question on its own:\n{question}" for question in questions]


for name, prompts in [("joint", joint_verification(draft, questions)), ("factored", factored_verification(questions))]:
    sees_draft = sum(draft in prompt for prompt in prompts)
    print(f"{name}: {len(prompts)} verification call(s), {sees_draft} of them see the draft")
    print(f"  first prompt: {prompts[0]!r}")
print()
for n in (3, 10):
    # joint: draft, plan-and-answer, final answer. factored: draft, plan, one call per question, final answer
    print(f"{n:>2} verification questions: joint 3 calls, factored {n + 3} calls")
```
```
joint: 1 verification call(s), 1 of them see the draft
  first prompt: 'Draft answer:\nThe agents still on claude-legacy are research_agent, notes_agent and billing_agent.\n\nCheck the draft by answering:\nWhich model does research_agent run on?\nWhich model does notes_agent run on?\nWhich model does billing_agent run on?'
factored: 3 verification call(s), 0 of them see the draft
  first prompt: 'Answer this question on its own:\nWhich model does research_agent run on?'

 3 verification questions: joint 3 calls, factored 6 calls
10 verification questions: joint 3 calls, factored 13 calls
```
*(runs live, shows output — read-only demo snippet, not graded. These are
the prompts only; no model is called.)*

The factored version makes one call per question, so its cost grows with
the number of facts checked, where the joint version's doesn't. That's the
price of keeping each check away from the draft, and the paper found it
worth paying.

---

## What CoVe can and can't do

CoVe stops the draft's mistakes being copied into the check. It doesn't
bring in any new knowledge. The model answering the verification questions
is the same model, with the same training, as the one that wrote the draft.
If it believes something false, it believes it when asked directly too, and
the check confirms the mistake. That's
[the shared blind spot Module 2 described](→ Module 2, reflection and self-critique lesson, the limits: shared blind spots concept),
and no rearrangement of prompts removes it.

It's also worth being precise about where the evidence comes from. The
paper's experiments were closed-book: questions answered from what the
model had learned, with no documents or tools. It measured facts about
the world, like people and places, not about a user's own systems, which a
model can't have learned at all.

For an agent, that points to a clear order of preference:

- **If a claim can be checked against a source, check it against the
  source.** Look it up with a tool, retrieve for it, then use the support
  check or the grounding check from earlier in this lesson. For the draft in
  the demo, calling `get_agent` for each agent answers the verification
  questions with facts instead of recall.
- **If there's no source, CoVe is better than asking the model to check its
  own draft.** Keep the draft out of the verification step, and ask narrow
  questions, one fact each.
- **Either way, treat an unverified claim as unverified.** A claim that has
  passed CoVe has passed a consistency check, not a fact check, and an
  answer that acts on it should say so or ask a person.

---

## Quiz cards

> **Q1.** Why did CoVe's factored and two-step variants beat the joint one?
> - A) Because they used a larger model for the verification step
> - B) Keeping the draft out stops the check repeating its errors ✅
> - C) Because they asked many more verification questions
> - D) Because they skipped the final revision step entirely
>
> *Explanation: a verification step that can see the draft tends to agree
> with it. Answering the questions without the draft in view means each
> answer has to come from the model's knowledge, not from the draft's text.*

> **Q2.** Only about 17% of the entities in Llama 65B's list answers were
> correct, but about 70% of individual verification questions were answered
> correctly. What does that suggest?
> - A) A model gets narrow questions right more than long lists ✅
> - B) Verification questions contain their own answers
> - C) The model knew nothing about the entities at all
> - D) The lists were graded more strictly than the questions
>
> *Explanation: the same model gets far more right when asked about one fact
> at a time. That gap is what CoVe exploits: it breaks a long answer into
> narrow questions and uses the answers to revise it.*

> **Q3.** A model believes, wrongly, that `notes_agent` runs on
> `claude-opus`. Will factored verification catch it?
> - A) Yes, because each question is answered independently
> - B) Probably not: the same model likely repeats its belief ✅
> - C) Yes, because verification questions use a different model
> - D) Only if the draft is shown to it during verification
>
> *Explanation: CoVe stops errors being copied from the draft, but a belief
> the model holds shows up again when it's asked directly. Only an outside
> source, such as `get_agent`, can correct it.*

> **Q4.** An agent can look up any agent's model with a tool. Should it use
> CoVe to verify "`research_agent` runs on `claude-legacy`"?
> - A) Yes, because CoVe is the standard way to verify any claim
> - B) No: it should call the tool and check against the result ✅
> - C) Yes, but only the joint variant, to save model calls
> - D) No, because a claim like this can't be verified at all
>
> *Explanation: a tool result is evidence; the model's answer to a
> verification question is recall. When a source exists, checking against it
> is both more reliable and cheaper to trust.*

---

*(End of this concept, and the last in this lesson. The recap page brings
the lesson together.)*
