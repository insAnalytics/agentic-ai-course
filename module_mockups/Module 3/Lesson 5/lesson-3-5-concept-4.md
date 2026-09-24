# Module 3, Lesson 5 — Concept 4: What a server offers — tools, resources and prompts

---

## Three kinds of thing, sorted by who decides

So far this lesson has talked about MCP servers as if they only offer tools. Tools are the most used part, but a server can offer three kinds of thing, which the spec calls **primitives**:

| Primitive | Who decides to use it | What it is | Example |
|---|---|---|---|
| **Tools** | the model | functions the model can call to act or look something up | "get this agent's model", "create an agent" |
| **Resources** | the application (host) | data the host can read and put in front of the model | a policy document, a config file, a database record |
| **Prompts** | the user | ready-made message templates a person picks to start a task | a "review this agent's config" menu item or slash command |

The column that matters is the middle one. All three end up as text the model reads, but they differ in *who pulls the trigger*:

- **A tool** is chosen by the model, mid-loop, exactly like every tool since [Module 2](→ Module 2, writing the loop by hand lesson). The host offers the model the tool's name, description and schema, and the model decides whether and when to call it.
- **A resource** is chosen by the host application. The model never asks for it directly. The host reads it, perhaps because the user attached it in the interface, or because the application always includes it, and then places its contents into the conversation.
- **A prompt** is chosen by a person. The application shows the server's prompts as menu options or commands, and when someone picks one, its messages start the conversation.

---

## What a server lists

Each primitive has a `list` method that returns what the server offers, plus a method to use one. A server says which primitives it supports in the `capabilities` it returns from [`server/discover`](→ this lesson, stateless by design concept), and a client only asks for the ones that are there. Here's what a small registry server might return from each list:

```python
# what a small registry server might return from each of its three list methods
tools_list = {
    "resultType": "complete",
    "tools": [{
        "name": "get_agent_model",
        "title": "Look up an agent's model",
        "description": "Return the model one registered agent runs on, by its exact name.",
        "inputSchema": {
            "type": "object",
            "properties": {"agent_name": {"type": "string", "description": "Exact registered name of the agent."}},
            "required": ["agent_name"],
        },
    }],
}

resources_list = {
    "resultType": "complete",
    "resources": [{
        "uri": "registry://policies/naming",
        "name": "naming-policy",
        "title": "Agent naming policy",
        "mimeType": "text/markdown",
    }],
}

prompts_list = {
    "resultType": "complete",
    "prompts": [{
        "name": "review_agent_config",
        "title": "Review an agent's configuration",
        "arguments": [{"name": "agent_name", "description": "The agent to review", "required": True}],
    }],
}

print("tools     ->", [t["name"] for t in tools_list["tools"]])
print("resources ->", [r["uri"] for r in resources_list["resources"]])
print("prompts   ->", [p["name"] for p in prompts_list["prompts"]])
```
```
tools     -> ['get_agent_model']
resources -> ['registry://policies/naming']
prompts   -> ['review_agent_config']
```
*(runs live, shows output — read-only demo snippet, not graded; these are example results in the shapes the spec defines)*

The methods, as a quick reference:

- **Tools:** `tools/list` returns each tool's `name`, `description` and `inputSchema`; `tools/call` runs one, with a `name` and `arguments`.
- **Resources:** `resources/list` returns what's available, each identified by a **URI** such as `registry://policies/naming`; `resources/read` fetches one by its URI and returns its `contents`.
- **Prompts:** `prompts/list` returns each prompt's `name` and the `arguments` it takes; `prompts/get` fills one in with those arguments and returns ready-to-use `messages`.

A tool's `inputSchema` is plain JSON Schema, the same kind of schema [Lesson 2 generated from a Pydantic model](→ this module, tool schemas and argument validation lesson, the schema generated the payoff completed concept). Everything from [Lesson 1 about names and descriptions](→ this module, designing tools a model can use well lesson, names and descriptions as prompts concept) applies unchanged: a server's tool descriptions are prompts the model reads, and a vague one causes the same wrong calls it always did.

---

## How a host uses each one

Here's the difference in practice: the same host, handling one of each:

```python
# how a host uses each primitive -- the difference is who decides

# 1. tools: offered to the model, which decides whether to call them
tool = {
    "name": "get_agent_model",
    "description": "Return the model one registered agent runs on, by its exact name.",
    "inputSchema": {"type": "object", "properties": {"agent_name": {"type": "string"}}, "required": ["agent_name"]},
}
offered_to_model = [{"name": tool["name"], "description": tool["description"], "input_schema": tool["inputSchema"]}]
print("tool offered to the model:", offered_to_model[0]["name"])

# 2. resources: read by the host, which decides to put them in front of the model
read_result = {
    "resultType": "complete",
    "contents": [{"uri": "registry://policies/naming", "mimeType": "text/markdown",
                  "text": "Agent names are lowercase, end in _agent, and use underscores."}],
}
policy_text = read_result["contents"][0]["text"]
user_message = f"Suggest a name for an agent that triages bug reports.\n\n<policy>\n{policy_text}\n</policy>"
print("resource attached by the host:\n" + user_message)

# 3. prompts: chosen by the user, and their messages start the conversation
prompt_result = {
    "resultType": "complete",
    "description": "Review an agent's configuration",
    "messages": [{"role": "user", "content": {"type": "text",
                  "text": "Review research_agent's configuration. Check its model is current and its name follows policy."}}],
}
messages = [{"role": m["role"], "content": m["content"]["text"]} for m in prompt_result["messages"]]
print("conversation started from the user's chosen prompt:", messages)
```
```
tool offered to the model: get_agent_model
resource attached by the host:
Suggest a name for an agent that triages bug reports.

<policy>
Agent names are lowercase, end in _agent, and use underscores.
</policy>
conversation started from the user's chosen prompt: [{'role': 'user', 'content': "Review research_agent's configuration. Check its model is current and its name follows policy."}]
```
*(runs live, shows output — read-only demo snippet, not graded)*

- **The tool** is reshaped into the model's tool format and offered. Note that MCP spells the schema key `inputSchema` while Claude's API expects `input_schema`. The host translates between them, which [Lesson 7](→ this module, connecting an agent to mcp servers lesson) does for every tool a server lists.
- **The resource** is read by the host and pasted into the user's message, wrapped in a tag so the model can tell the policy apart from the request. That's the [delimiter technique from Module 2's prompting lesson](→ Module 2, prompting fundamentals lesson, output format and delimiters concept), used for its original purpose: marking where supplied data begins and ends.
- **The prompt** becomes the conversation's opening messages. MCP's prompt messages carry `content` as an object with a `type`, so the host converts them into whatever message format its model API expects.

---

## Why agents mostly use tools

In agent systems, tools do most of the work, because they're the only primitive the model can reach for on its own in the middle of a task. That's what an agent is: [the model deciding what to do next](→ Module 2, agents workflows and the loop lesson, agent vs workflow vs chatbot concept).

Resources and prompts matter more in applications with a person in the loop, such as a chat app where the user attaches files or picks a task from a menu. When an agent does need data that lives in a resource, a common pattern is a small tool that reads it, so the model can fetch it when it decides it needs it. The rest of this module, like most real agent code, focuses on tools.

---

## Quiz cards

> **Q1.** Which primitive does the model itself decide to use, in the middle of a task?
> - A) Resources
> - B) Prompts
> - C) All three, equally
> - D) Tools ✅
>
> *Explanation:* Tools are model-controlled. Resources are chosen by the host application and prompts by a person, so the model never requests either directly.

> **Q2.** A chat app lets the user attach the registry's naming policy to their message before sending it. Which primitive is that?
> - A) A resource, read by the host and placed in front of the model ✅
> - B) A tool, since the policy comes from a server
> - C) A prompt, since the user chose it
> - D) A notification from the server
>
> *Explanation:* It's data the application reads and includes in the conversation. The user choosing to attach it doesn't make it a prompt; prompts are message templates that start a task.

> **Q3.** How is a resource identified when a client reads it?
> - A) By its position in the `resources/list` result
> - B) By its URI, such as `registry://policies/naming` ✅
> - C) By the tool that created it
> - D) By a handle returned from `server/discover`
>
> *Explanation:* `resources/read` takes a `uri`. Positions in a list can change between calls; the URI is the resource's stable name.

> **Q4.** What does `prompts/get` return?
> - A) A tool the model can call to run the prompt
> - B) The prompt's JSON Schema
> - C) Filled-in messages, ready to start a conversation ✅
> - D) A resource URI to read next
>
> *Explanation:* A prompt is a template. Getting it with arguments returns concrete messages, which the host converts into its model API's format.

> **Q5.** An agent sometimes needs a large reference document that a server exposes as a resource. What's a common way to let the agent use it when it decides to?
> - A) Paste every resource into every request
> - B) Turn it into a prompt the user must pick
> - C) Ask the server to send it as a notification
> - D) Wrap reading it in a small tool, so the model can fetch it when it needs it ✅
>
> *Explanation:* Only tools are model-controlled. A reading tool puts the decision with the model, instead of paying the context cost on every request.

---

## Applied sandbox exercise

*(graded — turning a resource into context for the model)*

**Task shown to learner:** A host has read a resource with `resources/read` and wants to place it in front of the model. Implement `resource_to_context(read_result)`, which turns the result's `contents` into one string:

- Each content item that has a `"text"` field becomes:
  ```
  <resource uri="THE_URI">
  THE_TEXT
  </resource>
  ```
- Each item without `"text"` is binary (it has a `"blob"` instead). Don't include the binary data. Put a short placeholder inside the tag that mentions its `mimeType`, all on one line: `<resource uri="THE_URI">[binary content (image/png) not shown]</resource>`.
- Join the blocks with a newline, in the order they appear. An empty `contents` list gives an empty string.

**Starter code:**
```python
def resource_to_context(read_result: dict) -> str:
    # TODO: wrap each content item in a <resource> tag, following the rules above
    ...
```

**Hidden tests:**
```python
one = {"resultType": "complete", "contents": [
    {"uri": "registry://policies/naming", "mimeType": "text/markdown", "text": "Names end in _agent."}]}
assert resource_to_context(one) == '<resource uri="registry://policies/naming">\nNames end in _agent.\n</resource>'

two = {"resultType": "complete", "contents": [
    {"uri": "registry://agents/research_agent", "text": "model: claude-sonnet"},
    {"uri": "registry://agents/support_agent", "text": "model: claude-haiku"}]}
out = resource_to_context(two)
assert out.count("<resource ") == 2 and out.index("research_agent") < out.index("support_agent")
assert "model: claude-haiku" in out

binary = {"resultType": "complete", "contents": [
    {"uri": "registry://diagrams/topology.png", "mimeType": "image/png", "blob": "iVBORw0KGgoAAAANSUhEUg=="}]}
out = resource_to_context(binary)
assert "iVBORw0" not in out and "image/png" in out and 'uri="registry://diagrams/topology.png"' in out

assert resource_to_context({"resultType": "complete", "contents": []}) == ""
```

**Hint (shown on request):** Loop over `read_result.get("contents", [])`, build one string per item into a list, and finish with `"\n".join(blocks)`. `"text" in item` tells you which kind of item you have. For the binary case, `item.get("mimeType", "unknown type")` handles a missing type.

**Reference solution:**
```python
def resource_to_context(read_result: dict) -> str:
    blocks = []
    for item in read_result.get("contents", []):
        if "text" in item:
            blocks.append(f'<resource uri="{item["uri"]}">\n{item["text"]}\n</resource>')
        else:
            mime_type = item.get("mimeType", "unknown type")
            blocks.append(f'<resource uri="{item["uri"]}">[binary content ({mime_type}) not shown]</resource>')
    return "\n".join(blocks)
```

**Explanation:** The tags do two jobs. They mark exactly where the resource's text starts and ends, so the model can't confuse it with the user's own words, and they keep each item's URI next to its content, so the model can refer to which document said what. Leaving binary data out matters too: base64 image data is thousands of tokens of meaningless characters to the model, [the same cost problem as Lesson 3's oversized tool results](→ this module, shaping what tools return lesson, why a huge tool result hurts concept).

---

*(End of Concept 4. This lesson continues with Concept 5 — transports.)*
