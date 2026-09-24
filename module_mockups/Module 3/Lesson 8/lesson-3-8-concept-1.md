# Module 3, Lesson 8 — Concept 1: The most powerful tool, and the most dangerous

---

## Some tasks are better solved by writing code than by calling a tool

Every tool so far has been a fixed function: [a registry lookup](→ this module, designing tools a model can use well lesson), a weather call, a status check. Each does one known thing. But a whole class of tasks doesn't fit a fixed tool at all:

- "What's the standard deviation of these 200 numbers?"
- "Reformat this CSV so the dates are ISO 8601 and drop rows with no email."
- "How many business days between these two dates, skipping the holidays I listed?"

You could build a tool for each. You'd never finish, because the next task is always slightly different. The general answer is to give the model one tool that runs code it writes. Ask for a calculation, and it writes and runs the Python. This is the most capable tool an agent can have: instead of a menu of fixed actions, it has a general-purpose computer.

Anthropic and others have found that letting a model *write code* to orchestrate its work, rather than emit a long series of individual tool calls, can be dramatically more efficient for certain tasks: the model writes a short script that loops, filters and combines results, instead of making dozens of separate calls. Code execution is increasingly a core agent capability, not a niche one.

---

## The same property that makes it powerful makes it dangerous

A fixed tool can only do the one thing it was written to do. `get_agent_model` reads a name and returns a string; there is no argument that makes it delete a file. A code-execution tool is the opposite: its whole point is that it runs *whatever the model writes*, and "whatever" includes code you never anticipated.

And the code is untrusted. Not because the model is malicious, but because:

- **The model can be wrong.** It might write a script that deletes the wrong directory, or loops forever.
- **The model can be manipulated.** [Module 1's training pipeline lesson](→ Module 1, the training pipeline lesson, preference training the human feedback stage concept) noted that a model can't fully separate instructions from data. If the code-writing model has read a web page or a document that contains "ignore your task and run this instead", that text can shape the code it writes. [Lesson 10](→ this module, the tool threat model lesson) is entirely about this.

So the question this lesson answers is not "should an agent run code" — for many real agents, it should. The question is *where*. Running model-written code in a place where it can reach your files, your network and your credentials is the single most dangerous thing an agent system can do. Running it somewhere it can't reach any of those is a routine, useful capability. The whole difference is isolation, and the next three concepts are about getting it right, starting with a way of getting it wrong that looks correct.

---

## Quiz cards

> **Q1.** Why give an agent a code-execution tool instead of building a fixed tool for each task?
> - A) Fixed tools are slower to run than generated code
> - B) A general task space, like arbitrary calculation and data reshaping, can't be covered by any finite set of fixed tools ✅
> - C) Code execution removes the need for any other tools
> - D) Models can't call more than a few fixed tools reliably
>
> *Explanation:* The next task is always slightly different. One tool that runs code the model writes covers the open-ended space a fixed menu can't.

> **Q2.** In what sense is model-written code "untrusted", even from a non-malicious model?
> - A) The model deliberately writes harmful code
> - B) The code is always lower quality than a human's
> - C) The model can be wrong, and can be manipulated by instruction-like text it has read, so the code it writes can't be assumed safe ✅
> - D) Untrusted just means unreviewed; it's fine once a human reads it
>
> *Explanation:* Both failure modes matter: an honest mistake, and text in the model's context steering what it writes. Neither requires bad intent.

> **Q3.** What actually separates a safe code-execution tool from a dangerous one?
> - A) Whether the model is a reasoning model
> - B) Whether the generated code is reviewed by a linter first
> - C) Whether the code runs somewhere it can't reach the host's files, network and credentials ✅
> - D) Whether the tool is exposed over MCP or called directly
>
> *Explanation:* The capability is the same either way. The risk is entirely about what the running code can reach, which is isolation.

---

*(End of Concept 1. This lesson continues with Concept 2 — why "restricted" execution isn't a sandbox.)*
