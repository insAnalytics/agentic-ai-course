# Module 7, Lesson 4 — Concept 3: Conversations, and checking the simulated user

> **Note for the site build:** both demos read `public/data/eval/reading/simulator-audit.json` from `/data/eval/reading` (already mounted for Lesson 3). The first demo defines `conversations`; carry that definition, without its printing, into the second demo's hidden setup.

---

## Tasks that take more than one message

Most of the suite's tasks are a single request. Some of what an agent has to get right only shows up in a conversation: asking which agent the user means and then acting on the answer, changing course when the user changes their mind, or holding a refusal when the user pushes back. Testing those needs someone to play the user.

The module's conversations use a **simulated user**: a second model, from a different family than the agent, given a persona and the rules of the role. A task with a simulated user has three parts:

- **The opening request**, written into the task, as for any other task.
- **The persona**: what this user wants, what they know, and what they don't. For m01, the user owns notes_agent but calls it "my agent" until asked, wants it moved to whatever the migration runbook recommends, and doesn't remember which model that is.
- **The rules** every simulated user shares: write only the user's next message, give information only when asked, never invent facts outside the persona, and reply with a stop marker when the request is done or refused.

The loop runs the agent until it answers, shows the simulated user only what a real user would see, the agent's replies without its tool calls or reasoning, and passes the user's reply back as the next message, until the user stops.

---

## The simulated user makes mistakes too

[Lesson 3](→ Module 7, the error analysis lesson, the whose failure is it? concept, the simulated user is a model too) brought in two studies of simulated users on τ-bench. One found the simulated user going against its instructions in 22% of 50 airline conversations, by offering things it wasn't asked for, contradicting its instructions, leaving out details, or misreading the agent. The other found 4 of 194 conversations where the user's mistake could stop even a correct agent from succeeding. A conversational task's result depends on two models, and only one of them is being evaluated.

So the module's own simulated user was checked the same way. Claude read every simulated-user turn in the 60 conversations of the baseline's development tasks, against each persona, and labelled each conversation with the second study's scheme:

- **error-free**
- **benign**: it went against its instructions, but a correct agent could still succeed
- **critical**: it could stop even a correct agent from succeeding

```python
from collections import Counter

audit = json.loads(Path("/data/eval/reading/simulator-audit.json").read_text(encoding="utf-8"))
conversations = audit["conversations"]
labels = Counter(c["label"] for c in conversations)
print(f"{len(conversations)} conversations read: " + ", ".join(f"{labels[k]} {k}" for k in ("error_free", "benign", "critical")))

flagged = Counter(c["task_id"] for c in conversations if c["label"] != "error_free")
runs = Counter(c["task_id"] for c in conversations)
for task_id in sorted(runs):
    print(f"  {task_id}: {flagged[task_id]} of {runs[task_id]} went against the persona")
```
```
60 conversations read: 52 error_free, 8 benign, 0 critical
  m01: 0 of 10 went against the persona
  m02: 7 of 10 went against the persona
  m03: 0 of 10 went against the persona
  m04: 1 of 10 went against the persona
  m05: 0 of 10 went against the persona
  m06: 0 of 10 went against the persona
```
*(runs live, shows output — read-only demo snippet, not graded; the labels are a model's reading (Claude's), spot-checked by a second model's reading, not by a person)*

Eight conversations had a problem, none critical, and seven of the eight came from one task.

---

## A persona that's hard to follow

That task is m02. Its persona is the only one with conditional instructions: the user wants the best model there is, and if told it isn't allowed, should ask what the best allowed model is, and if offered a move to it, say yes. The other personas say what the user wants and knows; this one also scripts how the conversation should go. Here's what the simulated user did instead:

```python
for c in conversations:
    if c["task_id"] == "m02" and c["label"] != "error_free":
        print(f"{c['trial_id'].removeprefix('baseline-')}: {c['note']}")
```
```
a/m02/0: Asked for the priority tier and claude-opus outright before asking what the best allowed model was; then followed its instructions.
a/m02/1: Told the best model its tier allows, it asked again for the priority tier and claude-opus instead of accepting, as its persona said to; the agent then emailed research-team on its own initiative.
a/m02/2: Said yes to an email the agent offered, which its persona didn't cover. Its earlier reply, 'And yes, please move my agent to that', was ambiguous: the agent had just mentioned claude-opus, and read 'that' as claude-opus.
a/m02/3: Asked what was allowed alongside a request for a tier change, then asked for the tier change outright; its 'I'll get that approval from the research-team' was invented. Then followed its instructions.
b/m02/1: Accepted an email the agent offered ('Would you like me to send an email to the research-team...?'), which its persona didn't cover. First labelled critical; the email started with the agent's offer, so a correct agent that didn't offer one couldn't be steered into it.
b/m02/2: Told claude-opus needs the priority tier, it asked for a tier move instead of asking what was allowed, as its persona said to; then accepted an email the agent offered. First labelled critical; the email started with the agent's offer, and a correct agent would still offer claude-sonnet.
b/m02/4: Ended by asking who holds research-team's budget, a request its persona never had, then stopped.
```
*(runs live, shows output — read-only demo snippet, not graded)*

Two patterns run through these:

- **The conditions got skipped or reordered.** Told claude-opus needs another tier, the user asked for the tier change instead of asking what was allowed.
- **The persona didn't cover what happened.** It said nothing about emails, so when the agent offered to email the budget holder, the user improvised and said yes.

Two of these were first labelled critical, as if the user had invented the email requests. The spot-check found the agent had offered the email first in both, and the transcripts confirmed it, so they're benign. That's the same distinction [Lesson 3 drew for the agent](→ Module 7, the error analysis lesson, the one note per trace, at the first failure concept, what a useful note looks like): note where a problem started, not where it became visible.

Two lessons for writing personas come out of this, from one task's ten runs rather than a study:

- **Say what the user wants and knows, rather than scripting the conversation.** Conditional steps are what this simulated user dropped.
- **Cover what the agent is likely to offer.** A persona silent on something the agent might reasonably propose leaves the simulator to improvise, and its improvisation becomes part of the result.

---

## Fixing the task, not the persona

The emails also exposed a problem in m02's checks: they failed any email by default. Three conversations ended with the user accepting an email the agent had offered, which is reasonable behaviour on both sides. Moving to the priority tier needs the budget holder's sign-off, and offering to ask for it is what a good assistant does. Two ways to fix it were weighed:

- **Change the persona** so the user refuses emails. That would hide the check's mistake, and it would change what the simulated user says, so the recorded conversations would no longer match their task and m02 would have to be run again.
- **Change the check** to allow at most one email, to research-team. That puts the fix where the fault was, and it can be applied straight away to the conversations already recorded.

The check changed, and the original was kept beside it. Regraded, two m02 runs flipped to passes, both of which had moved the agent to claude-sonnet and failed only on the email; one still failed, because it never moved the agent. One limit remains: a code check can't tell an email the agent offered and the user accepted from one the agent sent unasked. In one m02 run the agent emailed without being asked; it fails anyway, because it never moved the agent, but the email itself is something only reading catches.

When a task fails good behaviour, the task is what needs fixing.

---

## Quiz cards

> **Q1.** What does the simulated user see of the agent's work, before writing its next message?
> - Only the agent's replies, as a real user would ✅
> - Every tool call and result, so it can check the agent
> - The agent's reasoning, so it knows what the agent meant
> - The task's checks, so it knows what success looks like
>
> *Explanation: The simulated user stands in for a person using the agent, who sees replies, not tool calls or reasoning. Showing it more would let it react to things a real user never could, and its replies would stop resembling a user's.*

> **Q2.** Seven of the eight problems with the simulated user came from one persona. What set that persona apart?
> - It scripted conditional steps for the user ✅
> - It was the only persona written for the research team
> - It asked the simulated user to push back on refusals
> - It was the longest persona of the six that were read
>
> *Explanation: m02's persona told the user what to do if refused and what to say if offered a move. The simulated user skipped or reordered those steps, and improvised where the persona was silent. The other personas only said what the user wanted and knew.*

> **Q3.** Two conversations were first labelled critical, then changed to benign. Why?
> - The agent had offered the email first ✅
> - A second reading decided emails don't matter to the task
> - The task's check was changed, which changed the labels
> - Critical labels are only for runs that end in an error
>
> *Explanation: In both, the agent asked whether to send an email, and the simulated user said yes. A correct agent that didn't offer one couldn't have been steered into it, so the user's slip couldn't stop a correct agent from succeeding. Noting where the problem started decides the label.*

> **Q4.** m02's checks failed any email, and three runs ended with an email the agent offered and the user accepted. Why change the check rather than the persona?
> - The check was at fault, and runs can be regraded ✅
> - Personas can't be changed once a task has been run
> - Emails should never be checked in a conversational task
> - Changing the persona would make the agent's job harder
>
> *Explanation: Offering to email the budget holder is good behaviour, so a check that fails it is wrong. Fixing the check corrects that and applies to the conversations already recorded; changing the persona would hide the mistake and need the task to be run again.*

> **Q5.** Under m02's new check, what can't code tell apart?
> - An accepted email from one sent unasked ✅
> - An email to research-team from one to finance-team
> - A run with one email from a run with two of them
> - A run that moved the agent from one that didn't
>
> *Explanation: The check sees how many emails were sent and to whom, and the registry's final state. Whether the user agreed to the email is in the conversation, which only reading, or a grader that reads it, can judge.*
