<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# mcp

## Purpose

`@agentx/mcp` is a **Model Context Protocol (MCP) server** that exposes the `@agentx/orchestrator` DAG-execution engine to MCP-capable agents (e.g. Codex, Claude) so they can hand off a generated plan for execution. It is a thin bridge: it runs a stdio-based MCP server built on `@modelcontextprotocol/sdk`, advertises a single tool (`execute_plan`), validates the caller-supplied plan against the orchestrator's Zod `ExecutionPlanSchema`, then constructs an `OrchestratedSession`, runs it, and returns a JSON summary (status, planId, event count). The agent is expected to author the plan (steps, dependencies, acceptance criteria); this package only validates and executes it. It does not depend on `@agentx/core` / the ADP runtime directly — that relationship is transitive through `@agentx/orchestrator`.

## Key Files

| File            | Description                                                                                                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`  | The entire implementation. Defines `class AgxMcpServer`, registers the `ListTools` + `CallTool` handlers, wires the `OrchestratedSession`, and boots the server on stdio at module load.                                                        |
| `package.json`  | Package manifest. `private`, ESM (`type: module`), `bin.agentx-mcp` → `./dist/index.js`. Deps: `@agentx/orchestrator` (workspace), `@modelcontextprotocol/sdk` ^1.29.0. Scripts: `build` (tsc), `start` (node dist/index.js), `docs` (typedoc). |
| `tsconfig.json` | Extends root config; `outDir ./dist`, `rootDir ./src`, `types: ["node"]`.                                                                                                                                                                       |
| `typedoc.json`  | TypeDoc config; entry point `src/index.ts`, output `docs`.                                                                                                                                                                                      |

## For AI Agents

### Working In This Directory

- **Server, not client.** This builds an MCP server (`Server` from `@modelcontextprotocol/sdk/server/index.js`) that other agents connect to. It is launched as a subprocess via the `agentx-mcp` bin and speaks over **stdio** (`StdioServerTransport`). There is no HTTP/SSE transport.
- **Capabilities:** declares `capabilities: { tools: {} }` only — no resources, no prompts. Server identity is `name: "agentx-orchestrator", version: "1.0.0"`.
- **Single tool — `execute_plan`:** input schema is `{ plan: object }` (required). In the handler the `plan` argument is parsed with `ExecutionPlanSchema.parse(...)` (Zod) from `@agentx/orchestrator`; an unparseable/missing plan throws `McpError(InvalidParams)` or is returned as `isError: true`. Any tool name other than `execute_plan` throws `McpError(MethodNotFound)`.
- **Execution path:** valid plans create a `new OrchestratedSession()`, subscribe to the orchestration bus via `bus.onAny(...)` to collect `OrchestrationEvent`s into an array, then `await session.start(plan)`. The result text is `JSON.stringify({ status: "completed", planId, summary, eventCount })`. Note: `session.start` dispatches `plan.created` and returns once the synchronous dispatch chain settles — it is fire-and-forward over an in-process event bus, so "completed" reflects that dispatch finished, not durable async work.
- **Logging:** all diagnostics go to `console.error` (stderr) to keep stdout clean for the MCP JSON-RPC stream. Do not add `console.log` to stdout here.
- **Boot side-effect:** the module instantiates `AgxMcpServer` and calls `.run()` at import time, so importing `index.ts` starts the server. Keep it as an executable entry, not a reusable library import.

### Testing Requirements

No tests exist in this package (no `*.test.ts`/`*.spec.ts`, no `test` script). The repo runs Vitest from the root; if adding coverage, place tests so the root `vitest.config.ts` globs pick them up and mock/spawn the stdio transport rather than relying on a live agent. Orchestrator behavior itself is covered in `packages/orchestrator`.

### Common Patterns

- Standard MCP SDK request-handler registration: `server.setRequestHandler(ListToolsRequestSchema, ...)` and `setRequestHandler(CallToolRequestSchema, ...)`.
- Schema-validate-then-execute: untrusted tool input is run through the orchestrator's exported Zod schema before any work happens.
- Errors are surfaced two ways — protocol-level via `McpError` (unknown tool / missing arg) and execution-level via a `{ content, isError: true }` tool result for thrown exceptions during orchestration.

## Dependencies

### Internal

- `@agentx/orchestrator` (`workspace:*`) — provides `OrchestratedSession`, the Zod `ExecutionPlanSchema`, and the `OrchestrationEvent` type. This is the only internal dependency; `@agentx/core` (the ADP runtime) is reached only transitively through the orchestrator.

### External

- `@modelcontextprotocol/sdk` ^1.29.0 — MCP server runtime: `Server`, `StdioServerTransport`, and the `CallToolRequestSchema` / `ListToolsRequestSchema` / `ErrorCode` / `McpError` types.
- `typescript` (`catalog:`, dev) — build via `tsc`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
