/**
 * Python source for the in-process MCP server/client stand-ins used by every
 * demo and graded exercise in Module 3 Lesson 7 (connecting an agent to MCP
 * servers). Kept in one place so each demo's `setupCode` and each exercise's
 * hidden tests run against exactly the classes the lesson shows the learner.
 * Concept 1 also shows this source as a static code block, which must stay
 * byte-identical to this constant. See architecture.md §4.1.
 */
export const MCP_STANDINS = String.raw`# in-process stand-ins for MCP servers and clients, shared by every demo in this lesson
class InProcessServer:
    def __init__(self, tools: dict):
        # tools maps a tool name to (function, description, input_schema)
        self.tools = tools

    def handle(self, request: dict) -> dict:
        request_id = request["id"]
        if request["method"] == "tools/list":
            listed = [{"name": name, "description": description, "inputSchema": schema}
                      for name, (function, description, schema) in self.tools.items()]
            return {"jsonrpc": "2.0", "id": request_id, "result": {"resultType": "complete", "tools": listed}}
        if request["method"] == "tools/call":
            name = request["params"]["name"]
            if name not in self.tools:
                return {"jsonrpc": "2.0", "id": request_id, "error": {"code": -32602, "message": f"Unknown tool: {name}"}}
            function = self.tools[name][0]
            try:
                text, is_error = function(**request["params"].get("arguments", {})), False
            except ValueError as e:
                text, is_error = str(e), True
            return {"jsonrpc": "2.0", "id": request_id,
                    "result": {"resultType": "complete", "content": [{"type": "text", "text": text}], "isError": is_error}}
        return {"jsonrpc": "2.0", "id": request_id, "error": {"code": -32601, "message": "Method not found"}}

class InProcessClient:
    """One client per server, as in Lesson 5. Builds requests and returns raw responses."""
    def __init__(self, server: InProcessServer):
        self.server = server
        self.next_id = 1
        self.calls = []   # every tools/call this client sent, for inspection

    def _send(self, method: str, params: dict) -> dict:
        meta = {"io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}}
        request = {"jsonrpc": "2.0", "id": self.next_id, "method": method, "params": {**params, "_meta": meta}}
        self.next_id += 1
        return self.server.handle(request)

    def list_tools(self) -> list:
        return self._send("tools/list", {})["result"]["tools"]

    def call_tool(self, name: str, arguments: dict) -> dict:
        self.calls.append((name, arguments))
        return self._send("tools/call", {"name": name, "arguments": arguments})

AGENT_NAME_SCHEMA = {"type": "object", "properties": {"agent_name": {"type": "string"}}, "required": ["agent_name"]}
MODELS = {"research_agent": "claude-sonnet", "support_agent": "claude-haiku"}

def registry_get_status(agent_name: str) -> str:
    if agent_name not in MODELS:
        raise ValueError(f"No agent named '{agent_name}'.")
    return f"{agent_name} is registered and active"

def get_agent_model(agent_name: str) -> str:
    if agent_name not in MODELS:
        raise ValueError(f"No agent named '{agent_name}'.")
    return MODELS[agent_name]

def monitoring_get_status(agent_name: str) -> str:
    return f"{agent_name}: 99.9% uptime over the last 24 hours"

def list_alerts(agent_name: str) -> str:
    return f"no open alerts for {agent_name}"

registry_server = InProcessServer({
    "get_status": (registry_get_status, "Whether an agent is registered, and its registry status.", AGENT_NAME_SCHEMA),
    "get_agent_model": (get_agent_model, "The model a registered agent runs on.", AGENT_NAME_SCHEMA),
})
monitoring_server = InProcessServer({
    "get_status": (monitoring_get_status, "An agent's uptime and health over the last 24 hours.", AGENT_NAME_SCHEMA),
    "alerts.list": (list_alerts, "Open alerts for an agent.", AGENT_NAME_SCHEMA),
})
`;

/**
 * The host-side helpers Lesson 7 builds on from Concept 2 onward:
 * model_tool_name and build_tool_catalog (Concept 1's solution) and
 * to_tool_output (Lesson 5's JSON-RPC exercise, without the input_required
 * branch). Concept 2 shows this exact source as a static block, so keep them
 * byte-identical.
 */
export const MCP_HOST_HELPERS = String.raw`import re

def model_tool_name(label: str, tool_name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", f"{label}__{tool_name}")

def build_tool_catalog(servers: dict) -> tuple:
    tools_for_model, routes = [], {}
    for label, client in servers.items():
        for tool in client.list_tools():
            name = model_tool_name(label, tool["name"])
            if len(name) > 64:
                continue
            tools_for_model.append({"name": name, "description": tool["description"], "input_schema": tool["inputSchema"]})
            routes[name] = (label, tool["name"])
    return tools_for_model, routes

def to_tool_output(response: dict) -> tuple:
    if "error" in response:
        error = response["error"]
        return (f"Error: MCP error {error['code']}: {error['message']}", True)
    result = response["result"]
    if result["resultType"] == "complete":
        text = "\n".join(item["text"] for item in result.get("content", []) if item["type"] == "text")
        return (text, result.get("isError", False))
    return (f"Error: unsupported resultType '{result['resultType']}'", True)
`;
