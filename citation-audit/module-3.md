# Citation audit: Module 3 (Tool Design for Agents)

Audited 2026-09-30, on branch `citation-audit/module-3`, as a light pass:
verify what's named, and anchor the practice a learner would question. Two
read-only subagents did the inventory and verification. Their full reports
follow. The lead re-read the primary text for every new quote and figure
before applying it.

Every edited text is prose, a quiz explanation, or a link's wording. No
demo, exercise or test string changed, so nothing needed re-running in
Pyodide. `npm run build` passes (523 pages). The three changed internal links
(existing links reworded to drop "Concept N") resolve in the built HTML.

## What happened to each proposed edit

- **Report A (L1–L6):** E1–E11 and E13–E34 applied, plus E35 (the
  `resultType` rule, N2). E12, marked optional, was skipped.
- **Report B (L7–L11):** E1–E19 applied.

## Totals across the module

- **Verified:** 63. The MCP facts match the current spec (2026-07-28), and
  the SDK facts match `mcp` 2.2.0.
- **Contradicted:** 4.
  - Anthropic's parallel tool use docs no longer say dependent calls come
    in a later turn. They say the API "doesn't prescribe an execution
    order".
  - A `tool_result` can hold more than text.
  - Playwright MCP's click and type tools now take `target`, not `ref`.
  - Not every fetch tool refuses private addresses: the reference MCP
    fetch server can reach them.
- **Not reachable:** 0.
- **Re-labelled or corrected:** 10.
  - Pydantic's `allOf` wrapper is 2.7 only.
  - The Anthropic SDK also retries 409.
  - A server crash is now classified consistently across L5 and L6.
  - "MUST NOT" becomes the spec's "SHOULD NOT".
  - Anthropic's MCP adoption figures are labelled as Anthropic's.
  - Microsoft's spotlighting paper is labelled a preprint.
- **Replaced:** 3, including Saltzer and Schroeder's real 1975 wording, and
  Python's own docs on `__builtins__` in place of "the security community's
  consistent verdict".
- **Sources added:** about 37.
  - Anthropic's tool, rate-limit, error, code-execution,
    browser-use and prompt-injection docs, and its "Writing effective tools
    for agents" post.
  - The Amazon Builders' Library, Stripe and GitHub.
  - The MCP spec's tool safety section and Invariant Labs.
  - Greshake et al.
  - OWASP LLM01, LLM06 and the SSRF cheat sheet.
  - RestrictedPython and Python's docs.

## Applied, but worth a look

- **Parallel tool calls (L4 C4, N1):** only the sourcing and wording
  changed ("usually independent", quoting the current docs). The concept,
  its exercise and the recap still run every batch concurrently. The docs
  add that tools with side effects "might be better run sequentially". An
  optional sentence saying so was not added.
- **`resultType` (L5 C2, N2):** one prose sentence now gives the spec's
  rule that a client treats a missing `resultType` as `"complete"`. The
  exercise and its tests still don't handle it, on purpose.

## Not done (content, not sourcing)

- A robots.txt sentence for the web lesson (RFC 9309), and MCP
  authorization in L7. Neither is claimed anywhere, so both are left to the
  content owner.
- L3's "later context and memory module" could now link to Module 4.

---

## Report: Module 3 citation audit, Lessons 1-6 (light touch)

Scope: `src/content/modules/03-tool-design-for-agents/`, lessons 01-06, every `.mdx`.
Sources were fetched on 2026-09-30. Downloads are in `audit/m3A/`.

**Headline.** L1-L4 have almost no named sources. Their practice claims are sound and easy to anchor. Anthropic's tool-use docs and its "Writing effective tools for agents" post cover L1 and L3. The AWS Builders' Library, Stripe, GitHub and Anthropic's rate-limit docs cover L4. L5 and L6 were checked line by line against the **current MCP spec, 2026-07-28**. `modelcontextprotocol.io/specification/latest` redirects there, and the versioning page says "The current protocol version is 2026-07-28". They were also checked against the **current `mcp` Python SDK, 2.2.0**, which PyPI shows as the latest release (2026-09-07). Nearly every MCP and SDK fact matches. The only mismatches are:
- One Anthropic docs paraphrase in L4 is out of date (parallel tool use).
- "A `tool_result`'s content is text" is too narrow.
- Pydantic's `allOf` output note is specific to Pydantic 2.7.
- L5 and L6 disagree on how a crash is classified.
- L5 leaves out one spec MUST (a missing `resultType` means `"complete"`). The mockup author dropped it on purpose, so it's listed under Needs a decision.

None of the proposed edits touch code that runs in a demo, exercise or hidden test. Three edits change quiz-explanation strings, which never run, so nothing needs re-checking in Pyodide.

### 1. Claims table

Paths are relative to `03-tool-design-for-agents/`. Abbreviations: L*n*C*k* = lesson *n*, concept *k*.

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence (primary source) | recommendation |
|---|---|---|---|---|---|---|---|
| C1 | 01-.../01-names-and-descriptions-as-prompts.mdx:155-193 | Description checklist: what it does, when to use, when not to, what it returns, units/formats | none | practice | UNSOURCED | Anthropic, *Define tools* (platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools): "**Provide extremely detailed descriptions.** This is by far the most important factor in tool performance. Your descriptions should explain every detail about the tool, including: What the tool does; When it should be used (and when it shouldn't); What each parameter means…" | lead with industry source (E1) |
| C2 | 01-.../02-parameter-design.mdx:129-131 | Put units in parameter names (`timeout_seconds`) | none | practice | UNSOURCED (supported) | Anthropic, *Writing effective tools for agents* (Sep 11, 2025): "input parameters should be unambiguously named: instead of a parameter named `user`, try a parameter named `user_id`." | keep (optional anchor; not proposed, to keep additions proportionate) |
| C3 | 01-.../02-parameter-design.mdx:14-16; 02-.../02-the-gap-constrained-decoding-doesnt-close.mdx:13-15 | With strict mode, constrained decoding guarantees schema-valid arguments; without it, "usually but not always well-formed" | Module 1 callback | fact | VERIFIED | Anthropic, *Strict tool use*: "Setting `strict: true` on a tool definition guarantees Claude's tool inputs match your JSON Schema…"; "Without strict mode, Claude might return incompatible types (`"2"` instead of `2`) or omit required fields" | keep |
| C4 | 01-.../03-granularity-narrow-vs-broad-tools.mdx:143-164 | Composite tools for common sequences; too many or overlapping tools make selection harder | none | practice | UNSOURCED | *Writing effective tools for agents*: "tools can … handle frequently chained, multi-step tasks in a single tool call"; "Too many tools or overlapping tools can also distract agents from pursuing efficient strategies." Also *Define tools*: "Fewer, more capable tools reduce selection ambiguity" | lead with industry source (E2) |
| C5 | 02-.../01-the-schema-generated-the-payoff-completed.mdx:62-64 | A nested model's `$ref` is "wrapped here in an `allOf` list" | none (live demo, Pydantic 2.7) | fact (version-specific) | VERIFIED for 2.7; out of date for ≥2.9 | Pydantic HISTORY.md, v2.9.0 (2024-09-05): "Remove `'allOf'` JSON schema workarounds (#10029)". A local run on Pydantic 2.12.5 gives `{"owner": {"$ref": "#/$defs/Owner", "description": "Who owns this agent."}}`, with no `allOf` | re-label with version note (E3) |
| C6 | 02-.../03-validate-and-return-failures-as-observations.mdx (throughout) | `field_validator`, `model_validator(mode="after")`, `e.errors()` "loc" is empty for a model-level error, and the error text ends with a docs link | own live demos | fact | VERIFIED (the page's own Pyodide/Pydantic 2.7 demos print this) | page output | keep |
| C7 | 03-.../01-why-a-huge-tool-result-hurts.mdx:19-27, 47-50 | A tool result costs the same as any input; lost-in-the-middle | Module 1 callbacks | fact / effectiveness | callbacks only | Module 1 owns this sourcing. Note for the lead: `01-llm-foundations` has no `2307.03172` / "Lost in the Middle" link anywhere, so the Module 1 audit should confirm Liu et al. is linked there | keep here |
| C8 | 03-.../02-truncation-and-pagination.mdx:12-61 | Cap results and say so; offset/limit pagination | none | practice | UNSOURCED | *Writing effective tools for agents*: "We suggest implementing some combination of pagination, range selection, filtering, and/or truncation with sensible default parameter values…"; "For Claude Code, we restrict tool responses to 25,000 tokens by default."; "If you choose to truncate responses, be sure to steer agents with helpful instructions." | lead with industry source (E4) |
| C9 | 03-.../03-structured-results-and-useful-error-messages.mdx:57 | "A `tool_result`'s content is text" | Module 2 callback | fact | CONTRADICTED (too narrow) | Anthropic, *Handle tool calls*: "`content` (optional): The result of the tool, as a string …, a list of nested content blocks …, or a list of document blocks … These content blocks can use the `text`, `image`, `document`, or `search_result` types." | soften (E5) |
| C10 | 03-.../03-structured-results-and-useful-error-messages.mdx:61-92 | Return JSON when the model acts on fields; prose is fine for relaying | none | practice | UNSOURCED, partly in tension | *Writing effective tools for agents*: "Even your tool response structure—for example XML, JSON, or Markdown—can have an impact on evaluation performance: there is no one-size-fits-all solution… We encourage you to select the best response structure based on your own evaluation." | add attributed caveat (E6) |
| C11 | 03-.../03-structured-results-and-useful-error-messages.mdx:128-134 | Useful errors say what failed, list valid options, point at the cause | none | practice | UNSOURCED | *Writing effective tools for agents*: "you can prompt-engineer your error responses to clearly communicate specific and actionable improvements, rather than opaque error codes or tracebacks." | lead with industry source (E7) |
| C12 | 04-.../01-timeouts-a-tool-that-never-answers.mdx:87-89 | `asyncio.wait_for` raises `TimeoutError` | none | fact | VERIFIED | Python docs, asyncio-task: "Changed in version 3.11: Raises TimeoutError instead of asyncio.TimeoutError." | keep |
| C13 | 04-.../01-timeouts-a-tool-that-never-answers.mdx:221-222 | Timeout = "a few times its usual latency" | none | practice | UNSOURCED; industry practice is stated differently | AWS Builders' Library, *Timeouts, retries, and backoff with jitter* (now at builder.aws.com): "we choose an acceptable rate of false timeouts (such as 0.1%). Then, we look at the corresponding latency percentile on the downstream service (p99.9 in this example)." | lead with industry source and align wording (E8) |
| C14 | 04-.../01-timeouts-a-tool-that-never-answers.mdx:250-258 | httpx has a 5 s default, set per stage (connect, read…), not one overall deadline | "the httpx documentation" (unlinked) | fact | VERIFIED | python-httpx.org/advanced/timeouts: "The default behavior is to raise a TimeoutException after 5 seconds of network inactivity."; "The read timeout specifies the maximum duration to wait for a chunk of data to be received" | add link (E9) |
| C15 | 04-.../02-which-failures-to-retry-and-how.mdx:117-132 | Retry 408, 429 and 5xx; don't retry other 4xx | none | practice | UNSOURCED | AWS Builders' Library (same article): "HTTP provides a clear distinction between client and server errors. It indicates that client errors should not be retried with the same request because they aren't going to succeed later, while server errors may succeed on subsequent tries." | lead with industry source (E10) |
| C16 | 04-.../02-which-failures-to-retry-and-how.mdx:210-213 | Anthropic's Python SDK retries connection errors, 408, 429 and 5xx twice by default, with backoff, and honors Retry-After | named, unlinked | fact | VERIFIED, but leaves out 409 | platform.claude.com/docs/en/api/sdks/python, "Retries": "Certain errors are automatically retried 2 times by default, with a short exponential backoff. Connection errors …, 408 Request Timeout, 409 Conflict, 429 Rate Limit, and >=500 Internal errors are all retried by default." `_base_client.py` reads `retry-after-ms` / `retry-after` ("If the API asks us to wait a certain amount of time, just do what it says.") | correct + link (E11) |
| C17 | 04-.../02-which-failures-to-retry-and-how.mdx:221-222 | A 429 from a monthly spend cap won't clear for days | none | fact | UNSOURCED (true) | Anthropic, *Errors*: "429 - `rate_limit_error`: Your organization has hit a rate limit, reached its usage tier's monthly spend cap… A tier spend-cap 429 has no `retry-after` header and keeps failing until access resumes" | add example (E12, optional) |
| C18 | 04-.../02-which-failures-to-retry-and-how.mdx:287-296 | Idempotency keys; "Many payment and messaging APIs accept one, usually as a request header" | none | practice | UNSOURCED | Stripe, *Idempotent requests*: "Stripe's idempotency works by saving the resulting status code and body of the first request made for any given idempotency key… Subsequent requests with the same key return the same result"; "we suggest using V4 UUIDs"; example header `Idempotency-Key: …`. AWS Builders' Library: "APIs with side effects aren't safe to retry unless they provide idempotency." | lead with industry source (E13) |
| C19 | 04-.../02-which-failures-to-retry-and-how.mdx:162-165 | Jitter spreads out retries from clients that failed together | none | practice | VERIFIED (via the E10 anchor) | AWS Builders' Library: "retries can be ineffective if all clients retry at the same time. To avoid this problem, we employ jitter." | keep (E10's link covers it) |
| C20 | 04-.../03-staying-under-the-limit-client-side-throttling.mdx:45-46 | Services may slow or block clients that keep hitting the limit | none | practice | UNSOURCED | GitHub REST docs, *Rate limits*: "Continuing to make requests while you are rate limited may result in the banning of your integration." | add anchor (E14) |
| C21 | 04-.../03-staying-under-the-limit-client-side-throttling.mdx:66-68 | Many services have a concurrency limit alongside a per-minute limit | none | practice | UNSOURCED | GitHub REST docs: "Make too many concurrent requests. No more than 100 concurrent requests are allowed." | add anchor (E15) |
| C22 | 04-.../03-staying-under-the-limit-client-side-throttling.mdx:202-204 | The token bucket is the standard technique | none | practice | UNSOURCED | Anthropic, *Rate limits*: "The API uses the token bucket algorithm to do rate limiting. This means that your capacity is continuously replenished up to your maximum limit, rather than being reset at fixed intervals." | add anchor (E16) |
| C23 | 04-.../03-staying-under-the-limit-client-side-throttling.mdx (several agents, one quota) | Limits apply per key/account | none | fact | VERIFIED | Anthropic, *Rate limits*: "Limits are set at the organization level." | keep |
| C24 | 04-.../04-running-independent-tool-calls-concurrently.mdx:97-102 | "Anthropic's tool-use documentation spells it out: … when one call needs another's result, Claude asks for it in a later turn instead. Calls in the same response are meant to be independent." | Anthropic docs (unlinked) | fact (vendor doc) | CONTRADICTED (outdated) | Anthropic, *Parallel tool use* (current): "The API doesn't prescribe an execution order: you can run the calls concurrently (`Promise.all`, `asyncio.gather`), sequentially in the order they appear, or in any combination…"; "Independent, read-only operations are usually safe to run in parallel for lower latency. Tools with side effects, shared state, or ordering requirements might be better run sequentially." The page doesn't say that Claude puts dependent calls in a later turn. It lists "Calls in a batch appear to depend on each other" as a known case | replace (E17); see Needs a decision N1 |
| C25 | 04-.../04-running-independent-tool-calls-concurrently.mdx:331, :411; 04-.../05-recap-practice.mdx:357 | "Calls in one response/turn are meant to be independent" | none | fact | overstated (see C24) | Same page suggests adding "Only batch tool calls that are independent of each other." to the system prompt, which implies they sometimes aren't | soften (E18, E21, E22) |
| C26 | 04-.../04-running-independent-tool-calls-concurrently.mdx:336-344 | Anthropic's guidance: return the natural error with `is_error: true`, and Claude reissues it next turn. `disable_parallel_tool_use` goes in `tool_choice` | Anthropic (unlinked) | fact | VERIFIED | *Parallel tool use*: "If you run in parallel and a call fails because its prerequisite hadn't completed, return `is_error: true` with the natural error message. Claude will reissue the call on the next turn."; "set `disable_parallel_tool_use: true` inside the `tool_choice` object… Claude calls at most one tool per response." | add link (E19) + system-prompt tip (E20) |
| C27 | 04-.../04-running-independent-tool-calls-concurrently.mdx (gather) | `gather` returns results in the order they were passed in; by default the first exception propagates | Module 0 callback | fact | VERIFIED | Python docs: "The order of result values corresponds to the order of awaitables in aws. If return_exceptions is False (default), the first raised exception is immediately propagated…" | keep |
| C28 | 04-.../04-running-independent-tool-calls-concurrently.mdx (is_error) | `is_error: true` marks a failed `tool_result` | none | fact | VERIFIED | *Handle tool calls*: "`is_error` (optional): Set to `true` if the tool execution resulted in an error." | keep |
| C29 | 05-.../00-intro.mdx:23-24 | "most agent platforms and a large and growing number of services now support it" | none | fact (adoption) | UNSOURCED | Anthropic, *Donating the Model Context Protocol and establishing the Agentic AI Foundation* (Dec 9, 2025): "There are now more than 10,000 active public MCP servers…"; "MCP has been adopted by ChatGPT, Cursor, Gemini, Microsoft Copilot, Visual Studio Code, and other popular AI products" | add, labelled as Anthropic's figure (E23) |
| C30 | 05-.../01-the-integration-problem-and-mcps-three-roles.mdx:55-56 | "The spec says it takes inspiration from the Language Server Protocol" | "the spec" (unlinked) | fact | VERIFIED | MCP spec 2026-07-28, index: "MCP takes some inspiration from the Language Server Protocol, which standardizes how to add support for programming languages across a whole ecosystem of development tools." | add link (E24) |
| C31 | 05-.../01-...three-roles.mdx:67-78 | Host / client (one per server) / server; local or remote | none | fact | VERIFIED | spec, architecture: "Each client is created by the host and communicates with exactly one server"; servers "Can be local processes or remote services" | keep |
| C32 | 05-.../01-...three-roles.mdx:154-158 | Design principle: servers shouldn't see the whole conversation or into other servers | "stated design principles" (unlinked) | fact | VERIFIED | spec, architecture: "Servers should not be able to read the whole conversation, nor "see into" other servers … Full conversation history stays with the host … Cross-server interactions are controlled by the host" | add link (E25) |
| C33 | 05-.../02-json-rpc-as-the-message-format.mdx:56-57 | JSON-RPC 2.0, "a short specification from 2010" | none | fact | VERIFIED | jsonrpc.org/specification: "Origin Date: 2010-03-26 (based on the 2009-05-24 version) Updated: 2013-01-04" | add link + update year (E26) |
| C34 | 05-.../02-json-rpc-as-the-message-format.mdx:111-131 | ids are string or integer, never null, never reused while pending; notifications have no id; every result must have `resultType` (`complete` / `input_required`) | "MCP requires" | fact | VERIFIED (leaves out the back-compat rule) | spec, basic: "Unlike base JSON-RPC, the ID **MUST NOT** be `null`"; "The `result` **MUST** include a `resultType` field"; "Notifications **MUST NOT** include an ID." Also: "For backward compatibility with servers implementing earlier protocol versions, which do not include `resultType`, clients **MUST** treat an absent `resultType` as `"complete"`." | keep; see N2 |
| C35 | 05-.../02-json-rpc-as-the-message-format.mdx:176-183 | Protocol error = unknown tool, malformed request, "a server crash"; tool error = API failure, invalid argument, business rule | none | fact | VERIFIED, but "a server crash" conflicts with L6 | spec, server/tools, "Error Handling": Protocol Errors: "Unknown tool; Malformed requests…; Server errors". Tool Execution Errors: "API failures; Input validation errors…; Business logic errors". L6 C2 reports a crash inside a tool as a *tool* error, which is what the SDK does | soften wording (E27); add link (E28) |
| C36 | 05-.../02-json-rpc-as-the-message-format.mdx:200-220 | Clients SHOULD pass tool errors to the model and MAY pass protocol errors. Error-code table; -32020..-32099 reserved; -32020/21/22 meanings; -32602 for unknown tool / missing `_meta` | "the spec" | fact | VERIFIED | spec, tools: "Clients **MAY** provide protocol errors…"; "Clients **SHOULD** provide tool execution errors…"; spec, basic: "`-32020` to `-32099` — reserved for the MCP specification"; table `-32020 HeaderMismatch`, `-32021 MissingRequiredClientCapability`, `-32022 UnsupportedProtocolVersion`; "the server **MUST** reject it with JSON-RPC error code `-32602`" | keep |
| C37 | 05-.../03-stateless-by-design.mdx:93-95 | "all the information needed to process a request is contained in the request itself" | "the spec" | fact | VERIFIED | spec, basic, "Statelessness": "all the information needed to process a request is contained in the request itself." | add link (E29) |
| C38 | 05-.../03-stateless-by-design.mdx:124-143 | `_meta` protocolVersion and clientCapabilities are required, clientInfo is recommended, reverse-domain keys, -32602 / -32022 with a supported list | "the spec" | fact | VERIFIED | spec, basic: table with `io.modelcontextprotocol/protocolVersion` required Yes, `clientInfo` No, `clientCapabilities` Yes; "Clients **SHOULD** include `io.modelcontextprotocol/clientInfo`"; versioning: `"supported": ["2026-07-28", "2025-11-25"], "requested": "1900-01-01"` | keep |
| C39 | 05-.../03-stateless-by-design.mdx:132-134; 06-recap-practice.mdx:227 | clientInfo "should never be used for security decisions" (the recap says "must never") | "the spec" | fact | VERIFIED as SHOULD NOT; the recap overstates | spec, basic: "Implementations **SHOULD NOT** … rely on them for security decisions." | keep in concept; re-label recap (E32) |
| C40 | 05-.../03-stateless-by-design.mdx (server/discover) | Every server must implement `server/discover`; it returns supportedVersions, capabilities, serverInfo, instructions, ttlMs | "the spec" | fact | VERIFIED | spec, server/discover: "Servers **MUST** implement it."; example includes `supportedVersions`, `capabilities`, `_meta` serverInfo, `instructions`, `"ttlMs": 3600000` | keep |
| C41 | 05-.../03-stateless-by-design.mdx (legacy / dual-era) | Legacy = 2025-11-25 and earlier; per-transport detection; cache the era; servers may be dual-era | "the spec" | fact | VERIFIED | spec, versioning: "**Legacy**: protocol versions that establish a session with an `initialize` handshake (`2025-11-25` and earlier)"; "stdio: probe with `server/discover` and fall back on any error that is not a recognized modern error"; "Clients **SHOULD** cache the result"; "A dual-era server **MAY** serve both eras concurrently on the same endpoint" | keep |
| C42 | 05-.../03-stateless-by-design.mdx (handles) | The four handle-design rules | "The spec's advice" | fact | VERIFIED | spec, server/tools: "**Authorization.** … a handle is a name, not a capability"; "**Opacity.**"; "**Lifetime.** … (e.g., "baskets expire after 24 hours of inactivity")"; "**Expiry errors.**" | keep |
| C43 | 05-.../04-what-a-server-offers-tools-resources-and-prompts.mdx:78-104 | Primitives by who decides: tools/model, resources/application, prompts/user | "the spec calls" | fact | VERIFIED | spec, server overview: "Prompts \| User-controlled"; "Resources \| Application-controlled"; "Tools \| Model-controlled" | add link (E30) |
| C44 | 05-.../04-...prompts.mdx:~181 | MCP `inputSchema` vs Claude API `input_schema` | none | fact | VERIFIED | spec tools examples use `inputSchema`; *Define tools* uses `input_schema` | keep |
| C45 | 05-.../05-transports-how-the-messages-travel.mdx:113-152 | stdio: subprocess, one JSON message per line, no embedded newlines, logs on stderr, nothing but MCP on stdout; `logging` writes to stderr by default | "the spec" | fact | VERIFIED | spec, stdio: "Messages are delimited by newlines, and **MUST NOT** contain embedded newlines."; "The server **MAY** write UTF-8 strings to `stderr`"; "The server **MUST NOT** write anything to its `stdout` that is not a valid MCP…". Python docs: `StreamHandler(stream=None)` "otherwise, sys.stderr will be used" | keep |
| C46 | 05-.../05-transports-how-the-messages-travel.mdx:154-190 | One POST per message to one endpoint; `MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name` mirror the body; a mismatch gives 400 + -32020 | "the spec requires" | fact | VERIFIED | spec, streamable-http: table `Mcp-Method` / `Mcp-Name` "`tools/call`, `resources/read`, `prompts/get` requests"; "`400 Bad Request` HTTP status and JSON-RPC error code `-32020`" | add link (E31) |
| C47 | 05-.../05-transports-how-the-messages-travel.mdx:192-217 | The reply is JSON or an SSE stream; the client must accept both; each stream belongs to one request | none | fact | VERIFIED | spec, transports overview: "replies arrive as a JSON object or a request-scoped SSE stream" | keep |
| C48 | 05-.../05-transports-how-the-messages-travel.mdx:219-237 | Validate Origin (403), bind to localhost, authenticate | "the spec's transport rules" | fact | VERIFIED | spec, streamable-http: "Servers **MUST** validate the `Origin` header…"; "servers **MUST** respond with HTTP 403 Forbidden"; "servers **SHOULD** bind only to localhost (127.0.0.1)"; "Servers **SHOULD** implement proper authentication" | keep |
| C49 | 06-.../02-answering-tools-call-by-hand.mdx:187-206 | "The spec says which to use when". Five-row table, with a crash as a tool error | spec | fact | VERIFIED except the crash row, which is SDK practice, not spec | spec, tools: input validation errors are Tool Execution Errors. "Server errors" are Protocol Errors. SDK `ToolError` docstring: "Any other exception bar `MCPError` … is treated as a crash: the model sees only `Error executing tool <name>`" | add clarifying note (E33) |
| C50 | 06-.../03-the-same-server-with-the-official-sdk.mdx (whole page) | `mcp` 2.2.0; `MCPServer`, `mcp.server.mcpserver.exceptions.ToolError`, `mcp.Client`, `version=`/`instructions=`; an unknown tool comes back as a tool error | own local run | fact | VERIFIED | PyPI `mcp` latest = 2.2.0 (2026-09-07). Wheel: `mcp/server/__init__.py` exports `MCPServer`; `class ToolError(MCPServerError)`; `mcp/__init__.py` exports `Client`, `MCPError`; ToolError docstring: "The SDK raises it too, for an unknown tool name and for arguments that fail the input schema" | keep |
| C51 | 06-.../04-errors-running-and-testing-with-the-sdk.mdx:111-113 | "The SDK's own docs put the choice … *could a smarter model have avoided this?*" | SDK docs (unlinked) | fact | VERIFIED | mcp 2.2.0 `docs/servers/handling-errors.md`: "One question decides it: **could a smarter model have avoided this?** Yes -> `ToolError`. No -> `MCPError`." | add link (E34) |
| C52 | 06-.../04-errors-running-and-testing-with-the-sdk.mdx (annotations) | Annotation meanings; "hints, not security" | none | fact | VERIFIED | spec schema, ToolAnnotations: "all properties in `ToolAnnotations` are **hints**… Clients should never make tool use decisions based on `ToolAnnotations` received from untrusted servers."; `idempotentHint`: "calling the tool repeatedly with the same arguments will have no additional effect". SDK docs: "They are hints, not security." | keep |
| C53 | 06-.../04-errors-running-and-testing-with-the-sdk.mdx (running) | `mcp.run()` defaults to stdio; `transport="streamable-http"`, host/port, endpoint `/mcp`; `mcp dev server.py` with `mcp[cli]` | own run | fact | VERIFIED | `server.py`: `transport: Literal["stdio", "sse", "streamable-http"] = "stdio"`, `streamable_http_path: str = "/mcp"`. SDK docs: "`mcp[cli]` adds … the `mcp` command-line tool (`mcp dev`, `mcp run`, `mcp install`)" | keep |
| C54 | 06-.../04-errors-running-and-testing-with-the-sdk.mdx (logging on stdio) | The SDK diverts most stray `print()` output to stderr | course's own local run (mcp 2.2.0) | our data | labelled as own run in syllabus; page says it was run | n/a | keep |

### 2. Proposed edits

Every edit is prose, a link or a quiz-explanation string. None is inside a demo, exercise or hidden-test code string, so none needs re-checking in Pyodide. Before quoting a figure, I grepped the whole `src/content/modules` tree for other places it appears. Figures that appear more than once are listed under their edit. Every external URL below returned HTTP 200 on 2026-09-30.

**E1. `01-designing-tools-a-model-can-use-well/01-names-and-descriptions-as-prompts.mdx`**
Current:
```
A checklist for every tool description:
```
Proposed:
```
A checklist for every tool description. It follows
[Anthropic's guidance on defining tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools),
which calls detailed descriptions "by far the most important factor in
tool performance":
```

**E2. `01-designing-tools-a-model-can-use-well/03-granularity-narrow-vs-broad-tools.mdx`**
Current:
```
choose between on every call. A model with forty tiny, overlapping tools
has a harder selection problem than one with eight well-bounded ones, no
matter how good each description is. How many tools is too many, and
```
Proposed:
```
choose between on every call. A model with forty tiny, overlapping tools
has a harder selection problem than one with eight well-bounded ones, no
matter how good each description is.
[Anthropic's guide to writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
makes both points of this concept: "Too many tools or overlapping tools
can also distract agents", and a good tool can "handle frequently
chained, multi-step tasks in a single tool call", as `clone_agent` does.
How many tools is too many, and
```

**E3. `02-tool-schemas-and-argument-validation/01-the-schema-generated-the-payoff-completed.mdx`**
Current:
```
  to it with a `"$ref"` to `#/$defs/Owner` (wrapped here in an `"allOf"`
  list, which just means "must match this"). The model sees `team` and
```
Proposed:
```
  to it with a `"$ref"` to `#/$defs/Owner` (wrapped here in an `"allOf"`
  list, which just means "must match this"; Pydantic 2.9 and later drop
  the wrapper and put the `"$ref"` right next to the description). The model sees `team` and
```

**E4. `03-shaping-what-tools-return/02-truncation-and-pagination.mdx`**
Current:
```
— let the model request additional pages only when a task genuinely needs
them, rather than paying the full cost of every result on every call
regardless of actual need.
```
Proposed:
```
— let the model request additional pages only when a task genuinely needs
them, rather than paying the full cost of every result on every call
regardless of actual need.

This is standard advice for agent tools.
[Anthropic's guide to writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
suggests "some combination of pagination, range selection, filtering,
and/or truncation with sensible default parameter values", and adds: "If
you choose to truncate responses, be sure to steer agents with helpful
instructions." Anthropic's own coding agent, Claude Code, caps tool
responses at 25,000 tokens by default.
```
("25,000" appears nowhere else in the tree.)

**E5. `03-shaping-what-tools-return/03-structured-results-and-useful-error-messages.mdx`**
Current:
```
A `tool_result`'s content is text —
[the same message format from Module 2's hand-written loop](/02-the-agent-loop/04-writing-the-loop-by-hand/02-from-round-trip-to-loop/#the-actual-loop-written-and-running-for-real)
— so "structured" here means structured *text*: JSON, produced with
```
Proposed:
```
A `tool_result`'s content is text —
[the same message format from Module 2's hand-written loop](/02-the-agent-loop/04-writing-the-loop-by-hand/02-from-round-trip-to-loop/#the-actual-loop-written-and-running-for-real)
(the Claude API also accepts images and documents there, but data comes
back as text) — so "structured" here means structured *text*: JSON, produced with
```

**E6. `03-shaping-what-tools-return/03-structured-results-and-useful-error-messages.mdx`**
Current:
```
**When prose is actually fine:** a result the model will mostly just
*relay* to a user — a short summary, a confirmation message — doesn't
need JSON. Structure earns its place when the model needs to *act on*
specific fields, not just read them out.
```
Proposed:
```
**When prose is actually fine:** a result the model will mostly just
*relay* to a user — a short summary, a confirmation message — doesn't
need JSON. Structure earns its place when the model needs to *act on*
specific fields, not just read them out.

JSON isn't the only way to label fields.
[Anthropic reports](https://www.anthropic.com/engineering/writing-tools-for-agents)
that even a tool response's format, "XML, JSON, or Markdown", can change
how well an agent does, and that "there is no one-size-fits-all
solution." Labeled fields are the point. Which format carries them best
is worth testing on your own agent.
```

**E7. `03-shaping-what-tools-return/03-structured-results-and-useful-error-messages.mdx`**
Current:
```
real valid options, and points at the likely cause (casing) — giving the
model an obvious, correct next call to make. `[:5]` caps the list of
```
Proposed:
```
real valid options, and points at the likely cause (casing) — giving the
model an obvious, correct next call to make. It's the same advice as
[Anthropic's guide to writing tools](https://www.anthropic.com/engineering/writing-tools-for-agents):
error responses should "clearly communicate specific and actionable
improvements, rather than opaque error codes or tracebacks." `[:5]` caps the list of
```

**E8. `04-tools-that-call-the-outside-world/01-timeouts-a-tool-that-never-answers.mdx`**
Current:
```
- **Start from how long the call normally takes.** A few times its usual
  latency catches real hangs without cutting off ordinary slow moments.
```
Proposed:
```
- **Start from how long the call normally takes.** Set the limit just
  above the tool's slowest normal responses, so it catches real hangs
  without cutting off ordinary slow moments.
  [Amazon's Builders' Library](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter)
  describes its version: pick an acceptable rate of false timeouts, such
  as 0.1%, and use the matching latency percentile of the service being
  called (p99.9).
```
(The old `aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/` URL now 301-redirects to this builder.aws.com page. Both work. The quiz at line 304 ("each a few times that tool's usual latency") is compatible and can stay, but the lead may want it to say "just above that tool's slowest normal latency" for consistency. Quiz option lengths weren't touched.)

**E9. `04-tools-that-call-the-outside-world/01-timeouts-a-tool-that-never-answers.mdx`**
Current:
```
*Illustrative: checked against the httpx documentation, not run in this
```
Proposed:
```
*Illustrative: checked against
[the httpx documentation](https://www.python-httpx.org/advanced/timeouts/), not run in this
```

**E10. `04-tools-that-call-the-outside-world/02-which-failures-to-retry-and-how.mdx`**
Current:
```
way every time**, with two exceptions, 408 and 429, which are about
timing rather than content. A timeout on your own side (the previous
```
Proposed:
```
way every time**, with two exceptions, 408 and 429, which are about
timing rather than content. That's how
[Amazon's Builders' Library](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter)
puts it too: client errors "should not be retried with the same request
because they aren't going to succeed later, while server errors may
succeed on subsequent tries." A timeout on your own side (the previous
```

**E11. `04-tools-that-call-the-outside-world/02-which-failures-to-retry-and-how.mdx`**
Current:
```
the model calls themselves. Anthropic's Python SDK, for example,
automatically retries connection errors, 408, 429 and 5xx responses twice
by default, with exponential backoff, and honors `Retry-After`. You get
```
Proposed:
```
the model calls themselves.
[Anthropic's Python SDK](https://platform.claude.com/docs/en/api/sdks/python),
for example, automatically retries connection errors, 408, 409, 429 and
5xx responses twice by default, with exponential backoff, and honors
`Retry-After`. You get
```
(The recap quiz at `05-recap-practice.mdx:336` says the SDK "already retries 429s and 5xx errors". That's still true, so no change.)

**E12. `04-tools-that-call-the-outside-world/02-which-failures-to-retry-and-how.mdx`** (optional)
Current:
```
One caution about 429s specifically. Most are short-lived, but not all: a
429 caused by a monthly spending cap won't clear for days. That's another
```
Proposed:
```
One caution about 429s specifically. Most are short-lived, but not all: a
429 caused by a monthly spending cap won't clear for days.
[Anthropic's API](https://platform.claude.com/docs/en/api/errors), for
example, sends that 429 with no `Retry-After` header, and it "keeps
failing until access resumes". That's another
```

**E13. `04-tools-that-call-the-outside-world/02-which-failures-to-retry-and-how.mdx`**
Current:
```
  original result instead of doing the work again. Many payment and
  messaging APIs accept one, usually as a request header.
```
Proposed:
```
  original result instead of doing the work again. Many payment and
  messaging APIs accept one, usually as a request header.
  [Stripe's](https://docs.stripe.com/api/idempotent_requests), for
  example, is an `Idempotency-Key` header. A repeat with the same key
  gets the first request's saved result, and Stripe suggests "using V4
  UUIDs" as keys.
```

**E14. `04-tools-that-call-the-outside-world/03-staying-under-the-limit-client-side-throttling.mdx`**
Current:
```
with the service. Some services respond to clients that keep hitting the
limit by slowing them down further or blocking them for a while.
```
Proposed:
```
with the service. Some services respond to clients that keep hitting the
limit by slowing them down further or blocking them.
[GitHub's API documentation](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api),
for example, warns that "continuing to make requests while you are rate
limited may result in the banning of your integration."
```

**E15. `04-tools-that-call-the-outside-world/03-staying-under-the-limit-client-side-throttling.mdx`**
Current:
```
limit**; many real services have one, alongside a limit on requests per
minute. It's defined once here and already loaded for every demo below:
```
Proposed:
```
limit**; many real services have one, alongside a limit on requests per
minute. GitHub's API, for example, says: "No more than 100 concurrent
requests are allowed." The stand-in is defined once here and already
loaded for every demo below:
```

**E16. `04-tools-that-call-the-outside-world/03-staying-under-the-limit-client-side-throttling.mdx`**
Current:
```
budget of requests that refills at a steady rate, where each request
spends one token and waits when the bucket is empty. Rate-limiter
```
Proposed:
```
budget of requests that refills at a steady rate, where each request
spends one token and waits when the bucket is empty. Providers use the
same idea on their side:
[Anthropic's API](https://platform.claude.com/docs/en/api/rate-limits)
"uses the token bucket algorithm", so capacity "is continuously
replenished up to your maximum limit, rather than being reset at fixed
intervals." Rate-limiter
```

**E17. `04-tools-that-call-the-outside-world/04-running-independent-tool-calls-concurrently.mdx`** (replace; see N1)
Current:
```
The model is telling you something useful when it puts several calls in
one response. Anthropic's tool-use documentation spells it out: tool
calls in a single turn are unordered, you can run them concurrently,
sequentially or in any order, and when one call needs another's result,
Claude asks for it in a later turn instead. Calls in the same response
are meant to be independent.
```
Proposed:
```
The model is telling you something useful when it puts several calls in
one response: they're usually independent.
[Anthropic's parallel tool use documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use)
says the API "doesn't prescribe an execution order". You can run the
calls concurrently, one after another, or a mix. Its advice is to choose
by what the tools do: "Independent, read-only operations are usually
safe to run in parallel for lower latency", while tools with side
effects or ordering needs "might be better run sequentially."
```

**E18. `04-tools-that-call-the-outside-world/04-running-independent-tool-calls-concurrently.mdx`**
Current:
```
Calls in one response are meant to be independent, but a model can
```
Proposed:
```
Calls in one response are usually independent, but a model can
```

**E19. `04-tools-that-call-the-outside-world/04-running-independent-tool-calls-concurrently.mdx`**
Current:
```
You don't need to detect this ahead of time. Anthropic's guidance is to
dispatch the whole batch and return the failed call's natural error with
`is_error: true`. The model sees that the update failed because its
```
Proposed:
```
You don't need to detect this ahead of time. For a batch run in
parallel,
[Anthropic's guidance](https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use)
is to return the failed call's natural error with
`is_error: true`. The model sees that the update failed because its
```

**E20. `04-tools-that-call-the-outside-world/04-running-independent-tool-calls-concurrently.mdx`**
Current:
```
`tool_choice`, at the cost of one tool call per turn.
```
Proposed:
```
`tool_choice`, at the cost of one tool call per turn. The same page
suggests a lighter fix first: add "Only batch tool calls that are
independent of each other." to the system prompt.
```

**E21. `04-tools-that-call-the-outside-world/04-running-independent-tool-calls-concurrently.mdx`** (quiz explanation string; not executed)
Current:
```
        "Calls in one turn are meant to be independent, and when they occasionally aren't, the error observation is enough for the model to recover. Turning parallelism off entirely is possible, but costs a turn per call.",
```
Proposed:
```
        "Calls in one turn are usually independent, and when they occasionally aren't, the error observation is enough for the model to recover. Turning parallelism off entirely is possible, but costs a turn per call.",
```

**E22. `04-tools-that-call-the-outside-world/05-recap-practice.mdx`** (quiz explanation string; not executed)
Current:
```
        "Calls in one turn are meant to be independent. When they occasionally aren't, the error observation is enough for the model to recover in its next turn.",
```
Proposed:
```
        "Calls in one turn are usually independent. When they occasionally aren't, the error observation is enough for the model to recover in its next turn.",
```

**E23. `05-the-model-context-protocol/00-intro.mdx`**
Current:
```
  format. MCP is the shared standard that fixes this, and most agent
  platforms and a large and growing number of services now support it.
```
Proposed:
```
  format. MCP is the shared standard that fixes this, and it's widely
  adopted.
  [Anthropic reported in December 2025](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
  "more than 10,000 active public MCP servers", with ChatGPT, Cursor,
  Gemini, Microsoft Copilot and VS Code among the products supporting it.
```

**E24. `05-the-model-context-protocol/01-the-integration-problem-and-mcps-three-roles.mdx`**
Current:
```
This is the problem the **Model Context Protocol (MCP)** solves. The spec
says it takes inspiration from the Language Server Protocol, which solved
```
Proposed:
```
This is the problem the **Model Context Protocol (MCP)** solves.
[The spec](https://modelcontextprotocol.io/specification/2026-07-28)
says it takes inspiration from the Language Server Protocol, which solved
```

**E25. `05-the-model-context-protocol/01-the-integration-problem-and-mcps-three-roles.mdx`**
Current:
```
arguments. That's deliberate. One of MCP's stated design principles is
that servers should not be able to read the whole conversation or "see
```
Proposed:
```
arguments. That's deliberate. One of
[MCP's stated design principles](https://modelcontextprotocol.io/specification/2026-07-28/architecture)
is that servers should not be able to read the whole conversation or "see
```

**E26. `05-the-model-context-protocol/02-json-rpc-as-the-message-format.mdx`**
Current:
```
Every message between an MCP client and server follows **JSON-RPC 2.0**,
a short specification from 2010 for making remote calls with JSON. It
```
Proposed:
```
Every message between an MCP client and server follows
[**JSON-RPC 2.0**](https://www.jsonrpc.org/specification),
a short specification from 2010 (last updated in 2013) for making remote calls with JSON. It
```

**E27. `05-the-model-context-protocol/02-json-rpc-as-the-message-format.mdx`**
Current:
```
- **A protocol error** means the request itself couldn't be handled: an
  unknown tool name, a malformed request, a server crash. It comes back
```
Proposed:
```
- **A protocol error** means the request itself couldn't be handled: an
  unknown tool name, a malformed request, an error in the server itself.
  (A bug inside one tool is different: the next lesson reports that as a
  tool error.) It comes back
```

**E28. `05-the-model-context-protocol/02-json-rpc-as-the-message-format.mdx`**
Current:
```
The spec's reasoning is about who can fix the problem. A tool execution
```
Proposed:
```
[The spec's](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
reasoning is about who can fix the problem. A tool execution
```

**E29. `05-the-model-context-protocol/03-stateless-by-design.mdx`**
Current:
```
As of its 2026-07-28 revision, MCP follows the same design. The spec is
blunt about it: all the information needed to process a request is
```
Proposed:
```
As of its 2026-07-28 revision, MCP follows the same design.
[The spec](https://modelcontextprotocol.io/specification/2026-07-28/basic)
is blunt about it: all the information needed to process a request is
```

**E30. `05-the-model-context-protocol/04-what-a-server-offers-tools-resources-and-prompts.mdx`**
Current:
```
of thing, which the spec calls **primitives**:
```
Proposed:
```
of thing, which [the spec](https://modelcontextprotocol.io/specification/2026-07-28/server) calls **primitives**:
```

**E31. `05-the-model-context-protocol/05-transports-how-the-messages-travel.mdx`**
Current:
```
`tools/call` request, with the headers the spec requires:
```
Proposed:
```
`tools/call` request, with the headers
[the spec](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
requires:
```

**E32. `05-the-model-context-protocol/06-recap-practice.mdx`** (quiz explanation string; not executed)
Current:
```
        "MCP is stateless, like the REST and LLM APIs earlier in the course. JSON-RPC itself doesn't define _meta, and clientInfo must never be used for security decisions.",
```
Proposed:
```
        "MCP is stateless, like the REST and LLM APIs earlier in the course. JSON-RPC itself doesn't define _meta, and the spec says clientInfo should never be used for security decisions.",
```

**E33. `06-building-an-mcp-server/02-answering-tools-call-by-hand.mdx`**
Current:
```
table: the model wrote those arguments, and a clear message like
"agent_name: Field required" lets it fix them on the next call.
```
Proposed:
```
table: the model wrote those arguments, and a clear message like
"agent_name: Field required" lets it fix them on the next call.

The crash row is a judgment call. The spec lists "server errors" as
protocol errors, but doesn't single out a bug inside one tool. The
official Python SDK reports that case as a tool error with a generic
message, and this server does the same.
```

**E34. `06-building-an-mcp-server/04-errors-running-and-testing-with-the-sdk.mdx`**
Current:
```
such as database addresses. The SDK's own docs put the choice between
```
Proposed:
```
such as database addresses.
[The SDK's own docs](https://py.sdk.modelcontextprotocol.io/servers/handling-errors/)
put the choice between
```

### 3. Needs a decision

**N1. Parallel tool calls: the current Anthropic docs no longer back "concurrent by default".** (L4 Concept 4.) The page's opening paraphrase is out of date: dependent calls *can* arrive in one turn, and sequential execution is described as equally valid. The docs recommend running independent, read-only calls in parallel. They say tools "with side effects, shared state, or ordering requirements might be better run sequentially." The concept, its exercise and the recap sandbox run every batch through `gather`.
*Recommendation:* apply E17-E22 (sourcing and wording only) and keep the concurrent loop as the taught technique. The page's own "When calls in one batch aren't really independent" section already matches the docs' handling for the parallel case. Optionally, add one sentence to E17 saying that tools with side effects can run in order instead. Don't change the exercise.

**N2. The `resultType` back-compat rule is missing.** (L5 Concept 2, and the recap sandbox's `to_tool_output`.) The spec says: "For backward compatibility with servers implementing earlier protocol versions, which do not include `resultType`, clients **MUST** treat an absent `resultType` as `"complete"`." The syllabus says a later mockup revision dropped this on purpose. The reference reads `result["resultType"]` and would raise `KeyError` on a legacy server's result. That only matters for a dual-era client, which this lesson doesn't build.
*Recommendation:* leave the exercise, tests and reference as they are. Add one prose sentence so the page doesn't imply the rule doesn't exist:

**E35. `05-the-model-context-protocol/02-json-rpc-as-the-message-format.mdx`** (conditional on N2)
Current:
```
it can finish, such as a confirmation from the user. That's an advanced
pattern this lesson won't build, but a client has to recognize it.
```
Proposed:
```
it can finish, such as a confirmation from the user. That's an advanced
pattern this lesson won't build, but a client has to recognize it. (A
client that also talks to older servers treats a missing `resultType`
as `"complete"`, since revisions before 2026-07-28 didn't have it.)
```

Not a decision, just for the lead's information:
- The L3 intro and L3 Concept 1 point to "the later context and memory module" as plain text. `04-context-and-memory` now exists, so it could be linked. That's a separate pass from the citation audit.
- The Module 1 lost-in-the-middle page (the target of L3 C1's callback) has no Liu et al. / arXiv 2307.03172 link. That's for the Module 1 audit.

### 4. Counts

- **Claims inventoried:** 54 (C1-C54).
- **Verified:** 36. These are C3, C5 (for 2.7), C6, C12, C14, C16 (with the 409 omission), C19, C23, C26-C28, C30-C53 (C34 and C35 partly: one omission and one wording clash each), and C54, which is our own run, labelled.
- **Contradicted:** 2. C24 (the Anthropic parallel tool-use paraphrase is out of date) and C9 ("`tool_result` content is text" is too narrow).
- **Unreachable:** 0. (The aws.amazon.com Builders' Library URL now redirects to a builder.aws.com page. The article was read through Wayback and through the new URL.)
- **Unsourced practice claims found:** 13. They are C1, C2, C4, C8, C10, C11, C13, C15, C17, C18, C20, C21, C22, plus the adoption claim C29. Anchors are proposed for all except C2, which is kept on purpose.
- **Re-labelled / corrected / softened:** 9. E3, E5, E11, E18, E21, E22, E27, E32 and E33.
- **Replaced:** 1 (E17).
- **Added (new anchors or links to named sources):** 24. E1, E2, E4, E6, E7, E8, E9, E10, E12, E13, E14, E15, E16, E19, E20, E23, E24, E25, E26, E28, E29, E30, E31 and E34. E35 is conditional on N2.

---

## Report: Module 3, Lessons 7–11: citation audit (light touch)

Scope: every `.mdx` in `src/content/modules/03-tool-design-for-agents/` lessons
`07-connecting-an-agent-to-mcp-servers` through `11-designing-for-least-privilege`
(27 files). All paths below are relative to `src/content/modules/03-tool-design-for-agents/`.
Sources checked 2026-09-30. Downloads are in `audit/m3B/`.

**On links:** these five lessons have exactly **one** real external link, in L8 concept 1
(Anthropic's code-execution-with-MCP post, verified). The 12 or so URLs in Lesson 9
(web interaction) are all `*.example.com` / `attacker.example` fixtures inside demo and
exercise strings (canned search index, canned pages, allowlist tests). They are not
citations, and they resolve to nothing on purpose. No action needed.

**Current MCP spec:** `modelcontextprotocol.io/specification/latest` redirects to
`/specification/2026-07-28`. The in-process stand-ins in L7 use
`io.modelcontextprotocol/protocolVersion: "2026-07-28"`, `resultType: "complete"`,
`ttlMs`, error code `-32602` for an unknown tool, and `isError` on tool-execution errors.
All of these match that version exactly.

### 1. Claims table

| ID | file:line | claim (trimmed) | source given | kind | verdict | evidence (primary source) | recommendation |
|---|---|---|---|---|---|---|---|
| C1 | 07/01:208-213 | MCP spec: a host combining several servers' tools **should** prefix them; the `serverInfo` name isn't guaranteed unique and shouldn't be relied on | "The MCP spec" (no link) | fact | VERIFIED | MCP spec 2026-07-28, Server › Tools › Tool Names: "Clients or proxies that aggregate tools from multiple servers MAY encounter naming collisions (for example, two servers each exposing a search tool) and SHOULD implement a disambiguation strategy such as prefixing tool names with a server identifier. The server name (from serverInfo ) is not guaranteed to be unique across servers and SHOULD NOT be relied upon for disambiguation." | keep; add link (E1) |
| C2 | 07/01:219-225 | MCP allows names up to 128 chars incl. dots; Claude's API: letters, digits, `_`, `-`, up to 128; OpenAI function names stop at 64 | none | fact | VERIFIED | MCP spec, Tool Names: "Tool names SHOULD be between 1 and 128 characters in length (inclusive)… uppercase and lowercase ASCII letters (A-Z, a-z), digits (0-9), underscore (_), hyphen (-), and dot (.)". Claude docs (define-tools): "Must match the regex `^[a-zA-Z0-9_-]{1,128}$`." openai-python `FunctionDefinition.name`: "Must be a-z, A-Z, 0-9, or contain underscores and dashes, with a maximum length of 64." | keep |
| C3 | 07/01:309-315 | A server can put instructions in a tool description, and can change a description after you've decided to trust it | none | practice | UNSOURCED (true; named attacks exist) | MCP spec 2026-07-28, overview › Tool Safety: "descriptions of tool behavior such as annotations should be considered untrusted, unless obtained from a trusted server." Invariant Labs, "MCP Security Notification: Tool Poisoning Attacks" (2025-04-01, Beurer-Kellner & Fischer): "Rug pull: a malicious server can change the tool description after the client has already approved it." | add stronger backing (E2) |
| C4 | 07/02:261-262 | The SDK's `call_tool` is `async` | none | fact | VERIFIED | `modelcontextprotocol/python-sdk` `src/mcp/client/session.py`: `async def call_tool(` and `async def list_tools(` | keep |
| C5 | 07/03:154-157 | Anthropic's docs: five servers (GitHub, Slack, Sentry, Grafana, Splunk) use ~55,000 tokens of tool definitions before any work | "Anthropic's documentation" (no link) | effectiveness/fact (vendor figure, attributed) | VERIFIED | Claude docs, Tool search tool: "A typical multiserver setup (GitHub, Slack, Sentry, Grafana, and Splunk) can consume \~55k tokens in definitions before Claude does any work." (Advanced-tool-use post itemises it: "58 tools consuming approximately 55K tokens".) | keep; add link (E3). Same figure also in Module 4 `01-the-context-budget/02-measuring-one-request-part-by-part.mdx:194`, which matches. |
| C6 | 07/03:164-166 (+ quiz 03:262-271, recap 04:311-320) | Anthropic's docs: Claude's tool choice degrades beyond ~30–50 tools | "Anthropic's documentation" | effectiveness (vendor, attributed) | VERIFIED | Tool search docs: "Claude's ability to pick the right tool degrades once you exceed 30–50 available tools." | keep; link (E3) |
| C7 | 07/03:166-168 | Anthropic's engineering team: most common failures are wrong tool and incorrect parameters, especially with similar names | "Anthropic's engineering team" | effectiveness (vendor, attributed) | VERIFIED | anthropic.com/engineering/advanced-tool-use: "The most common failures are wrong tool selection and incorrect parameters, especially when tools have similar names like notification-send-user vs. notification-send-channel." | keep; link (E3) |
| C8 | 07/03:236-238 | Anthropic's API has tool search built in | none | fact | VERIFIED | Claude docs page "Tool search tool" exists (GA): "Because tool search loads only a focused set of relevant tools on demand…" | keep (covered by E3 link) |
| C9 | 07/01:138, 04:44 (stand-in code) | Protocol version `2026-07-28`, `resultType`, `-32602` "Unknown tool", `isError` | none (code) | fact | VERIFIED | Spec 2026-07-28 Tools page: `"resultType" : "complete"`; `"error" : { "code" : -32602 , "message" : "Unknown tool: invalid_tool_name" }`; "reported in tool results with isError: true" | keep |
| C10 | 08/01:54-60 | Anthropic and others found that letting a model write code to orchestrate tools can be dramatically more efficient for some tasks | [Anthropic](https://www.anthropic.com/engineering/code-execution-with-mcp) | effectiveness (vendor) | VERIFIED | Post: "This reduces the token usage from 150,000 tokens to 2,000 tokens—a time and cost saving of 98.7%. Cloudflare published similar findings, referring to code execution with MCP as 'Code Mode.'" Also: "Running agent-generated code requires a secure execution environment with appropriate sandboxing, resource limits, and monitoring." | keep (wording is suitably hedged; "others" = Cloudflare) |
| C11 | 08/02:67-70 | "the security community's consistent verdict is that in-process restriction of a full language is the wrong foundation" | none | practice | UNSOURCED (true; Python's own docs say it) | Python 3 docs, built-in `eval()`: "Overriding `__builtins__` can be used to restrict or change the available names, but this is not a security mechanism: the executed code can still access all builtins." `exec()`: "This function executes arbitrary code. Calling it with untrusted user-supplied input will lead to security vulnerabilities." RestrictedPython docs: "RestrictedPython is not a sandbox system or a secured environment, but it helps to define a trusted environment and execute untrusted code inside of it." | replace vague "community verdict" with these two anchors (E4) |
| C12 | 08/03:120-122 | Common production choice: a fresh container per execution, thrown away after, no network unless needed | none | practice | UNSOURCED (true) | Claude docs, Code execution tool: "All operations run in a secure, sandboxed container. The container has no internet access…"; "Each request runs in a new container unless you pass an earlier response's container ID back". | lead with an industry source (E5) |
| C13 | 08/03:123-126 (+ recap quiz) | A micro-VM (Firecracker) gives each execution its own kernel and still starts in a fraction of a second | none | fact | VERIFIED | firecracker-microvm.github.io: "Firecracker runs in user space and uses the Linux Kernel-based Virtual Machine (KVM) to create microVMs… a streamlined kernel loading process enables a < 125 ms startup time and a < 5 MiB memory footprint." | keep; add link (E5) |
| C14 | 08/03:126-130, 04:27-30 | This course's Docker exercises run in disposable Firecracker micro-VMs in the cloud | none | fact (course infra, E2B) | VERIFIED | `e2b-dev/runtime` README: "Firecracker microVMs that resume from a snapshot, run untrusted agent code, and pause when the agent stops"; "One Firecracker microVM per sandbox, in its own cgroup and network namespace". | keep |
| C15 | 08/04:20-23, 96-98 | Pyodide is CPython compiled to Wasm; it ports a large scientific stack | none | fact | VERIFIED | pyodide.org: "Pyodide is a port of CPython to WebAssembly/Emscripten… scientific Python packages including NumPy, pandas, SciPy, Matplotlib, and scikit-learn." | keep |
| C16 | 08/04:41-50 | A Wasm runtime starts with no ambient access; no sockets unless the host provides them | none | fact | VERIFIED | webassembly.org/docs/security: "Each WebAssembly module executes within a sandboxed environment separated from the host runtime using fault isolation techniques… can't escape the sandbox without going through appropriate APIs." Pyodide wasm-constraints: "can be imported, but are not functional due to the limitations of the WebAssembly VM: multiprocessing threading sockets". (Newer Pyodide adds host-provided sockets under Node, which is consistent with "deliberately provided by the host".) | keep |
| C17 | 09/01:190-195 (+ quiz) | Anthropic's API offers `web_search` and `web_fetch` as server tools; the API runs them; your code never returns a `tool_result` for them | none | fact | VERIFIED | Claude docs, Server tools: "The API executes the tool internally. You see the call and its result in the response, but you don't handle execution. Unlike client `tool_use` blocks, you don't need to respond with a `tool_result`." | keep |
| C18 | 09/01:169-170 | "Models otherwise tend to re-search for pages they've already found." | none | effectiveness | UNSOURCED | No source found; plausible but a behaviour claim stated as fact. | soften (E6) |
| C19 | 09/02:244-246 | Many real fetch tools return Markdown | none | practice | VERIFIED | MCP reference fetch server README: "converting HTML to markdown for easier consumption"; "`fetch` - Fetches a URL from the internet and extracts its contents as markdown." | keep (optional link; not proposed) |
| C20 | 09/03:20-21 | Provider fetch tools such as Anthropic's don't render JavaScript-heavy pages | none | fact | VERIFIED | Claude docs, Web fetch tool: "The web fetch tool currently does not support websites dynamically rendered with JavaScript." | keep |
| C21 | 09/03:42-47 | Accessibility snapshot is the default in Microsoft's Playwright MCP server | none | fact | VERIFIED | microsoft/playwright-mcp README: "This server enables LLMs to interact with web pages through structured accessibility snapshots, bypassing the need for screenshots or visually-tuned models." "Uses Playwright's accessibility tree, not pixel-based input." | keep; add link, and note Anthropic's browser use tool (E7) |
| C22 | 09/03:59-61 | Model calls "something like" `browser_type(ref="e7", text=...)` / `browser_click(ref="e8")` | none | fact (API shape) | CONTRADICTED (minor) | Playwright MCP README, `browser_click` / `browser_type` parameters: "`target` (string): Exact target element reference from the page snapshot, or a unique element selector". There is no `ref` parameter now. Hedged with "something like", but cheap to fix. | replace `ref=` with `target=` (E8). Prose only, not in an exercise string. The recap test at 09/05:241 uses `ToolUseBlock(name="browser_click", input={"ref": "e1"})` only as an *unknown-tool* case. It needs no change. |
| C23 | 09/03:75 | Anthropic's API has a computer use tool | none | fact | VERIFIED | Claude docs, Computer use tool: "Give Claude screenshot, mouse, and keyboard control of a desktop environment with the computer use tool, the computer_toolset_20260801 client toolset." (GA) | keep |
| C24 | 09/04:156-161 (+ recap quiz 09/05:340) | Anthropic's web fetch docs warn of data-leak risk with untrusted input plus sensitive data; Claude may fetch only URLs already in the conversation | "Anthropic's own documentation" | fact | VERIFIED | Web fetch docs: "Enabling the web fetch tool in environments where Claude processes untrusted input alongside sensitive data poses data exfiltration risks." "Claude cannot fetch URLs that appear only in its own output. Claude can only fetch URLs that have previously appeared in the conversation". | keep |
| C25 | 09/04:175-183 | SSRF: "Real fetch tools refuse private and internal addresses, check every redirect target… Provider-run fetch tools do this on the provider's side" | none | practice | Mostly VERIFIED, but partly CONTRADICTED: the generalisation is too broad | OWASP SSRF Prevention Cheat Sheet: validate that the target IP "is not part of the official private networks ranges including also localhost and IPv4/v6 Link-Local addresses"; "Disable the support for the following of the redirection in your web client in order to prevent the bypass of the input validation". Anthropic web fetch docs (error codes): "`url_not_allowed`: URL blocked … by Anthropic-side restrictions, such as private addresses, `robots.txt`, and URLs that appear to contain a credential you did not provide". **Counter-example:** the MCP reference fetch server README says "This server can access local/internal IP addresses and may represent a security risk." So not all "real fetch tools" do this. | soften + lead with OWASP; name Anthropic as the provider example (E9) |
| C26 | 09/04:210-213 | Labeling untrusted content helps but does not stop prompt injection | none | effectiveness | VERIFIED (consistent with evidence) | Hines et al. (Microsoft), "Defending Against Indirect Prompt Injection Attacks With Spotlighting", arXiv:2403.14720 v1 (20 Mar 2024, preprint), §5.1: "including also special delimiters can reduce ASR by about half… this kind of defense could be easily subverted by an attacker who gains knowledge of our system prompt and inserts their own delimiting." §5.3: "we do not recommend using delimiting in practice" | add stronger backing (E10). It also justifies the closing-tag exercise. |
| C27 | 10/01:65-67 | "The term was coined by Simon Willison, who named it after SQL injection on purpose" | "Simon Willison" (no link) | fact | VERIFIED | Willison, "The lethal trifecta for AI agents" (2025-06-16): "I coined the term prompt injection a few years ago, to describe this key issue of mixing together trusted and untrusted content in the same context. I named it after SQL injection, which has the same underlying problem." The original post (2022-09-12, "Prompt injection attacks against GPT-3") responds to Riley Goodside's demo of the attack. | keep; add link (E12) |
| C28 | 10/01:69-82 | Direct vs **indirect** prompt injection; indirect is the one that matters for agents | none | practice / named concept | UNSOURCED (named research exists) | Greshake, Abdelnabi, Mishra, Endres, Holz, Fritz, "Not What You've Signed Up For: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection", AISec '23 (16th ACM Workshop on AI and Security, 2023), arXiv:2302.12173 v2: "We reveal new attack vectors, using Indirect Prompt Injection, that enable adversaries to remotely (without a direct interface) exploit LLM-integrated applications by strategically injecting prompts into data likely to be retrieved." OWASP LLM01:2025: "Indirect prompt injections occur when an LLM accepts input from external sources, such as websites or files." | add stronger backing (E13) |
| C29 | 10/02:96-98 | Model providers now train specifically against injection, and current models resist far more attempts than earlier ones | none | effectiveness | UNSOURCED | Anthropic, "Mitigating the risk of prompt injections in browser use" (2025-11-24): "We use reinforcement learning to build prompt injection robustness directly into Claude's capabilities." "We scan all untrusted content that enters the model's context window, and flag potential prompt injections with classifiers." "prompt injection is far from a solved problem". | attribute to a vendor (E14) |
| C30 | 10/02:112-113 (+ recap 05:128) | Willison: "in application security, 99% is a failing grade" | "Simon Willison" (no link) | practice (quote-like paraphrase) | VERIFIED | Willison, "Prompt injection explained, with video, slides, and a transcript" (2023-05-02): "in security, 99% filtering is a failing grade." (2025 trifecta post: "in web application security 95% is very much a failing grade".) | keep; add link (E15). Not in quote marks, so the paraphrase is fine. |
| C31 | 10/02:53-55, 114 | Parameterized queries are a complete fix for SQL injection | none | fact | VERIFIED | Willison 2022-09-17: "There is a known, guaranteed to work mitigation against SQL injection attacks"; OWASP LLM01 says of prompt injection by contrast: "it is unclear if there are fool-proof methods of prevention". | keep |
| C32 | 10/03:112-122 (+ quiz, exercise) | Willison's **lethal trifecta**: private data + untrusted content + external communication | "Simon Willison" (no link) | practice | VERIFIED | Willison 2025-06-16: "The lethal trifecta of capabilities is: Access to your private data… Exposure to untrusted content… The ability to externally communicate in a way that could be used to steal your data". He also notes a tool that can "make an HTTP request… to load an image" can exfiltrate, which matches the lesson's URL point. | keep; add link (E16) |
| C33 | 10/05:128 | 1 − 0.99²⁰⁰ ≈ 0.87 | our arithmetic | fact | VERIFIED | Recomputed: 0.99²⁰⁰ = e^(200·ln 0.99) = e^(−2.0101) = 0.1340, so 1 − 0.1340 = 0.866, about 0.87. | keep |
| C34 | 11/03:165-167 | Least privilege "stated in its original form: every component should have the minimum access it needs to do its job, and no more" | none | fact (attribution) | VERIFIED in substance. The wording is a paraphrase, not "the original form". | Saltzer & Schroeder, "The Protection of Information in Computer Systems", *Proc. IEEE* 63(9), 1975, §I.A.3(f): "Least privilege: Every program and every user of the system should operate using the least set of privileges necessary to complete the job." | replace with the real quote + cite (E19) |
| C35 | 11/00:26-28, 11/01:111-113, 11/02 (gates), 11/03 (allowlists, scoped creds) | Narrow tools, split reads/writes, human approval for high-impact actions, scoped credentials = standard practice | none | practice | UNSOURCED (strong industry anchor exists) | OWASP LLM06:2025 Excessive Agency, mitigations: "3. Avoid open-ended extensions… (e.g., run a shell command, fetch a URL, etc.) and use extensions with more granular functionality." "4. Minimize extension permissions… might only need read access to a 'products' table… enforced by applying appropriate database permissions for the identity that the LLM extension uses". "6. Require user approval: Utilise human-in-the-loop control to require a human to approve high-impact actions before they are taken." | lead with an industry source (E18) |
| C36 | 11/02:44-46 (+ recap quiz, exercise explanation) | Every `tool_use` gets exactly one `tool_result`, in the very next message | none | fact | VERIFIED | Claude docs, Handle tool calls: "Tool result blocks must immediately follow their corresponding tool use blocks in the message history. You cannot include any messages between the assistant's tool use message and the user's tool result message." | keep |
| C37 | 09/04:122; 10/03:106; 10/04:58 | Learner-facing "Concept 2" / "Concept 1" link text | n/a | style | n/a | Brief: no "Concept N" in learner-facing text. | re-word (E11, E16, E17) |

### 2. Proposed edits

Nothing below touches an exercise/demo string (no Pyodide re-verification needed).
External links follow the existing style in `08.../01-...mdx:54`.

**E1. `07-connecting-an-agent-to-mcp-servers/01-discovering-tools-from-several-servers.mdx`**
Current:
```
The MCP spec anticipates it: a host combining tools from several servers
**should** give each tool a server prefix. It adds that the server's own
```
Proposed:
```
[The MCP spec](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#tool-names)
anticipates it: a host combining tools from several servers
**should** give each tool a server prefix. It adds that the server's own
```

**E2. `07-connecting-an-agent-to-mcp-servers/01-discovering-tools-from-several-servers.mdx`**
Current:
```
So treat a third-party server's tool list like any other outside input.
Connect servers you have a reason to trust, read what their tools say,
and notice when a description changes. The deeper version of this,
```
Proposed:
```
Neither risk is hypothetical.
[Invariant Labs](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)
demonstrated both: instructions hidden in a tool's description, which
they call *tool poisoning*, and a server swapping in a new description
after it was approved, a *rug pull*. The
[MCP spec](https://modelcontextprotocol.io/specification/2026-07-28)
itself says tool descriptions should be treated as untrusted unless they
come from a trusted server.

So treat a third-party server's tool list like any other outside input.
Connect servers you have a reason to trust, read what their tools say,
and notice when a description changes. The deeper version of this,
```

**E3. `07-connecting-an-agent-to-mcp-servers/03-when-there-are-too-many-tools.mdx`**
Current:
```
schemas. Anthropic's documentation gives a real example: a typical setup
of five servers, such as GitHub, Slack, Sentry, Grafana and Splunk, uses
```
Proposed:
```
schemas. [Anthropic's documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)
gives a real example: a typical setup
of five servers, such as GitHub, Slack, Sentry, Grafana and Splunk, uses
```
And, same file:
Current:
```
more than about 30 to 50 tools available. Anthropic's engineering team
reports that the most common failures are choosing the wrong tool and
```
Proposed:
```
more than about 30 to 50 tools available.
[Anthropic's engineering team](https://www.anthropic.com/engineering/advanced-tool-use)
reports that the most common failures are choosing the wrong tool and
```
(Quiz 03:262-271 and recap 04:311-320 say "According to Anthropic's documentation…". Both are already attributed and correct. No change.)

**E4. `08-code-execution-as-a-tool/02-why-restricted-execution-isnt-a-sandbox.mdx`**
Current:
```
runs in, and no amount of cleaning the namespace changes that. Libraries
exist that harden this approach much further, but the security
community's consistent verdict is that in-process restriction of a full
language is the wrong foundation to bet safety on.
```
Proposed:
```
runs in, and no amount of cleaning the namespace changes that. Python's
own documentation says so:
[overriding `__builtins__`](https://docs.python.org/3/library/functions.html#eval)
"is not a security mechanism: the executed code can still access all
builtins." Libraries exist that harden this approach much further, but
even the best known,
[RestrictedPython](https://restrictedpython.readthedocs.io/en/latest/),
describes itself as "not a sandbox system or a secured environment".
In-process restriction of a full language is the wrong foundation to bet
safety on.
```

**E5. `08-code-execution-as-a-tool/03-real-isolation-and-the-tool-around-it.mdx`**
Current:
```
  resource access are yours to grant or deny. This is the common
  production choice: a fresh container per execution, thrown away after,
  with no network unless the task needs it.
- **A lightweight VM.** A micro-VM (such as the Firecracker VMs behind
  some cloud sandboxes) gives each execution its own kernel, a stronger
  boundary than a container's shared one, while still starting in a
  fraction of a second. This course's
```
Proposed:
```
  resource access are yours to grant or deny. This is the common
  production choice: a fresh container per execution, thrown away after,
  with no network unless the task needs it.
  [Anthropic's own code execution tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool)
  works this way: each request gets a new sandboxed container with no
  internet access.
- **A lightweight VM.** A micro-VM (such as the
  [Firecracker](https://firecracker-microvm.github.io/) VMs behind
  some cloud sandboxes) gives each execution its own kernel, a stronger
  boundary than a container's shared one, while still starting in a
  fraction of a second (Firecracker's own figure is under 125 ms). This course's
```

**E6. `09-web-interaction/01-search-and-fetch-two-tools-two-jobs.mdx`**
Current:
```
  the URL." Models otherwise tend to re-search for pages they've already
  found.
```
Proposed:
```
  the URL." Without that, a model may search again for a page it has
  already found.
```

**E7. `09-web-interaction/03-when-fetching-isnt-enough-browsers-and-computer-use.mdx`**
Current:
```
The interesting design question is what the model gets back after each
action, because a rendered page is not text. The widely used approach,
and the default in Microsoft's Playwright MCP server, is an
```
Proposed:
```
The interesting design question is what the model gets back after each
action, because a rendered page is not text. The widely used approach,
and the default in Microsoft's
[Playwright MCP server](https://github.com/microsoft/playwright-mcp), is an
```
And, same file, after the paragraph ending "its actions are precise." (lines 62-66). This keeps the lesson current, since Anthropic's API now has a GA browser use tool:
Current:
```
be clicked or typed into, and what they're called. And because the model
refers to elements by reference rather than by position, its actions are
precise.
```
Proposed:
```
be clicked or typed into, and what they're called. And because the model
refers to elements by reference rather than by position, its actions are
precise. Anthropic's API offers a
[browser use tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/browser-use-tool)
built the same way: your application runs the browser, and Claude reads
the page's accessibility tree and acts on its element references, with
screenshots as a fallback.
```
(Docs: "Claude works with the page both through its structure (the accessibility tree, elements, forms, and tabs) and through screenshots and viewport coordinates." Example output: `link "Documentation" [ref_1]`.)

**E8. `09-web-interaction/03-when-fetching-isnt-enough-browsers-and-computer-use.mdx`**
Current:
```
`browser_type(ref="e7", text="triage_agent")` and then
`browser_click(ref="e8")`, and gets a fresh snapshot showing the result.
```
Proposed:
```
`browser_type(target="e7", text="triage_agent")` and then
`browser_click(target="e8")`, and gets a fresh snapshot showing the result.
```
(The illustrative snapshot's `[ref=e7]` labels can stay, since it's marked as simplified.)

**E9. `09-web-interaction/04-everything-from-the-web-is-untrusted-input.mdx`**
Current:
```
problem known as **server-side request forgery** (SSRF). Real fetch
tools refuse private and internal addresses, check every redirect
target the same way (a public URL can redirect to an internal one), and
limit what they'll download. Provider-run fetch tools do this on the
provider's side; your own need it built in.
```
Proposed:
```
problem known as **server-side request forgery** (SSRF). A safe fetch
tool refuses private and internal addresses, checks every redirect
target the same way (a public URL can redirect to an internal one), and
limits what it will download.
[OWASP's SSRF guide](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
covers the details. Anthropic's web fetch tool blocks private addresses
on its side. Not every fetch tool does, though: the reference MCP fetch
server warns that it can reach local and internal addresses. Your own
tool needs the check built in.
```

**E10. `09-web-interaction/04-everything-from-the-web-is-untrusted-input.mdx`**
Current:
```
To be clear about its limits: labeling helps the model keep track of what's
data, and it makes the boundary visible to anyone reading the logs. It
does not *stop* prompt injection. A model can still follow instructions
inside a clearly labeled block. The defenses that actually limit the
```
Proposed:
```
To be clear about its limits: labeling helps the model keep track of what's
data, and it makes the boundary visible to anyone reading the logs. It
does not *stop* prompt injection. A model can still follow instructions
inside a clearly labeled block. Microsoft researchers who tested this
technique, which they call
[spotlighting](https://arxiv.org/abs/2403.14720) (a 2024 preprint), found
that delimiters alone cut attacks on GPT-3.5 by about half. They also
warned that an attacker who knows the delimiter can write it into the
page, which is why the wrapper neutralizes its closing tag. The defenses that actually limit the
```

**E11. `09-web-interaction/04-everything-from-the-web-is-untrusted-input.mdx`** (style only)
Current:
```
[the text extractor from Concept 2](/03-tool-design-for-agents/09-web-interaction/02-getting-the-useful-part-out-of-a-page/):
```
Proposed:
```
[the text extractor from earlier in this lesson](/03-tool-design-for-agents/09-web-interaction/02-getting-the-useful-part-out-of-a-page/):
```

**E12. `10-the-tool-threat-model/01-prompt-injection-through-tool-results.mdx`**
Current:
```
what the model does. The term was coined by Simon Willison, who named it
after SQL injection on purpose: the underlying flaw is the same, mixing
trusted instructions and untrusted content in one place.
```
Proposed:
```
what the model does. The term was
[coined by Simon Willison](https://simonwillison.net/2022/Sep/12/prompt-injection/)
in 2022, who named it after SQL injection on purpose: the underlying
flaw is the same, mixing trusted instructions and untrusted content in
one place.
```

**E13. `10-the-tool-threat-model/01-prompt-injection-through-tool-results.mdx`**
Current:
```
Indirect injection is the one that matters for agents, because agents read
things constantly, and every tool that brings in outside text is a way for
a stranger's words to reach the model.
```
Proposed:
```
Indirect injection is the one that matters for agents, because agents read
things constantly, and every tool that brings in outside text is a way for
a stranger's words to reach the model.
[Greshake et al.](https://arxiv.org/abs/2302.12173) (AISec 2023) showed
indirect injection working against real LLM-integrated apps, and prompt
injection is the first risk on the
[OWASP Top 10 for LLM applications](https://genai.owasp.org/llmrisk/llm01-prompt-injection/).
```

**E14. `10-the-tool-threat-model/02-why-the-model-cant-be-the-security-boundary.mdx`**
Current:
```
- **Models trained to resist injection.** Model providers now train
  specifically against it, and current models resist far more attempts
  than earlier ones.
```
Proposed:
```
- **Models trained to resist injection.** Model providers now train
  specifically against it.
  [Anthropic, for example](https://www.anthropic.com/research/prompt-injection-defenses),
  reports training Claude with reinforcement learning on injected web
  content, and scanning untrusted content with classifiers, while calling
  prompt injection "far from a solved problem".
```
(This drops the unsourced "far more attempts than earlier ones". Anthropic's post does claim Claude Opus 4.5 is "a major improvement over previous ones", but that's one vendor's claim about its own model. Keep it out of the general statement.)

**E15. `10-the-tool-threat-model/02-why-the-model-cant-be-the-security-boundary.mdx`**
Current:
```
attacker who keeps trying, it's a matter of time. Simon Willison puts it
bluntly: in application security, 99% is a failing grade. In most of
```
Proposed:
```
attacker who keeps trying, it's a matter of time.
[Simon Willison puts it bluntly](https://simonwillison.net/2023/May/2/prompt-injection-explained/):
in security, 99% is a failing grade. In most of
```

**E16. `10-the-tool-threat-model/03-the-dangerous-combination.mdx`** (style + link)
Current:
```
[Concept 1's injection](/03-tool-design-for-agents/10-the-tool-threat-model/01-prompt-injection-through-tool-results/#one-injected-instruction-one-real-action)
changed a value in a registry. Bad, but contained: the damage stayed
inside the system, and an admin could undo it. The worst outcome, private
data leaving to a stranger, needs the agent to be able to *send*
something out. Line up the pieces and a shape appears.

Simon Willison named it the **lethal trifecta**: an agent is exposed to
```
Proposed:
```
[The ticket injection earlier in this lesson](/03-tool-design-for-agents/10-the-tool-threat-model/01-prompt-injection-through-tool-results/#one-injected-instruction-one-real-action)
changed a value in a registry. Bad, but contained: the damage stayed
inside the system, and an admin could undo it. The worst outcome, private
data leaving to a stranger, needs the agent to be able to *send*
something out. Line up the pieces and a shape appears.

Simon Willison named it the
[**lethal trifecta**](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/):
an agent is exposed to
```

**E17. `10-the-tool-threat-model/04-thinking-in-terms-of-the-blast-radius.mdx`** (style only)
Current:
```
[Concept 2](/03-tool-design-for-agents/10-the-tool-threat-model/02-why-the-model-cant-be-the-security-boundary/#the-shift-in-thinking)
landed on a change of question. Since injection can't be reliably
```
Proposed:
```
[Earlier in this lesson](/03-tool-design-for-agents/10-the-tool-threat-model/02-why-the-model-cant-be-the-security-boundary/#the-shift-in-thinking)
we landed on a change of question. Since injection can't be reliably
```

**E18. `11-designing-for-least-privilege/01-narrow-tools-shrink-the-blast-radius.mdx`**
Current:
```
This is the first and often most effective least-privilege technique,
because it works at the point where capability enters the agent. A tool
the agent doesn't have is a thing no injected instruction can make it do.
```
Proposed:
```
This is the first and often most effective least-privilege technique,
because it works at the point where capability enters the agent. A tool
the agent doesn't have is a thing no injected instruction can make it do.
It's also the industry's standard advice.
[OWASP's guidance on "excessive agency"](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/)
in LLM applications says to avoid open-ended tools, like running a shell
command or fetching any URL, in favor of ones with narrower functions.
Its other advice matches the rest of this lesson: give each tool the
minimum permissions it needs, and have a human approve high-impact
actions.
```

**E19. `11-designing-for-least-privilege/03-allowlists-and-per-tool-credentials.mdx`**
Current:
```
This is **the principle of least privilege**, the idea underneath this
whole lesson, stated in its original form: every component should have the
minimum access it needs to do its job, and no more. It matters because
```
Proposed:
```
This is **the principle of least privilege**, the idea underneath this
whole lesson. Its classic statement comes from
[Saltzer and Schroeder in 1975](https://web.mit.edu/Saltzer/www/publications/protection/Basic.html):
"Every program and every user of the system should operate using the
least set of privileges necessary to complete the job." In short: the
minimum access the job needs, and no more. It matters because
```
(The recap quiz at `11.../03...:131-139` defines it as "Every component gets the minimum access its job needs, no more". That's a fair paraphrase. No change.)

### 3. Needs a decision

1. **robots.txt (optional content addition).** Lesson 9 never mentions robots.txt. Anthropic's web fetch honours it on its side (docs: "`url_not_allowed`… Anthropic-side restrictions, such as private addresses, `robots.txt`…"). The MCP reference fetch server obeys it by default for model-initiated requests (README: "the server will obey a websites robots.txt file if the request came from the model (via a tool)"). The protocol is standardised as RFC 9309 (Robots Exclusion Protocol, IETF, Sept 2022). My recommendation is to add **one** sentence to the SSRF paragraph (after E9): "Well-behaved fetch tools also respect a site's [robots.txt](https://www.rfc-editor.org/rfc/rfc9309), its published rules for automated clients. Anthropic's and the reference MCP fetch server both do." This adds a new idea, not just a source, so it's the owner's call. Low priority.
2. **MCP authorization / OAuth: not covered, no action proposed.** Lesson 7 connects to "servers it didn't write and doesn't control" but never mentions how a host authenticates to a remote server (the spec's OAuth-based authorization). Nothing is wrong, since no claim is made. Flagging only in case the owner expects it here rather than in a later deployment/security lesson.
3. **No contradicted item changes what a concept teaches.** C22 (`ref` became `target`) is a parameter-name refresh. C25 (not every "real" fetch tool blocks private addresses) makes the lesson's point *stronger*: you must build the check yourself.

### 4. Counts

- Claims inventoried: 37 (C1–C37; C37 is a style flag, not a sourcing claim)
- **Verified:** 27 (C1, C2, C4–C10, C13–C17, C19–C21, C23, C24, C26, C27, C30–C34, C36; C25 is counted under contradicted)
- **Contradicted:** 2, both minor. C22: the Playwright MCP parameter is now `target`, not `ref`. C25: "Real fetch tools refuse private addresses" is too broad, since the reference MCP fetch server doesn't.
- **Not reachable:** 0
- **Unsourced (need a source or softening):** 7 (C3, C11, C12, C18, C28, C29, C35)
- **Re-labelled / attributed:** 1 (C29 → Anthropic, vendor claim)
- **Replaced:** 2 (C11 "security community's verdict" → Python docs + RestrictedPython; C34 paraphrase-as-"original form" → the real Saltzer & Schroeder quote)
- **Softened:** 2 (C18, C25)
- **Links added to already-named sources:** 7 (C1 spec, C5–C7 Anthropic docs/post, C13 Firecracker, C21 Playwright MCP, C27/C30/C32 Willison)
- **New sources added:** 7 (Invariant Labs + MCP spec Tool Safety; Python docs + RestrictedPython; Anthropic code execution tool; OWASP SSRF; Hines et al. spotlighting, labelled preprint; Greshake et al. AISec'23 + OWASP LLM01; OWASP LLM06; Saltzer & Schroeder 1975. Anthropic browser use tool is added as an API-currency fact.)
- Style fixes ("Concept N" in learner text): 3 (E11, E16, E17)
