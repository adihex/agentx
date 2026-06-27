<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# pi-extension

## Purpose

A pi TUI frontend that turns [pi](https://github.com/badlogic/pi-mono) into a control-plane client for any agent built on the agentx SDK. Loaded as a pi extension (`pi -e ./src/extension.ts`), it connects to a live agent's ADP (Agent Debugger Protocol) WebSocket via `@agentx/adp`'s `AdpClient`, then exposes the full out-of-band command surface through pi's slash-command system: connect/disconnect, status, halt inference, pause/resume metacognition, inspect the call frame, compact memory, inject thoughts, send prompts, and shutdown. It also registers two LLM-callable tools (toolchain list, memory query), streams server-push ADP events into the TUI as custom messages, and shows live agent status (iteration, context length, paused/running) in the pi footer. Because ADP is out-of-band, commands take effect even while the agent is mid-inference.

## Key Files

| File                 | Description                                                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/extension.ts`   | Main (and only) extension entry point. Default-exports the pi `ExtensionAPI` registration function; defines module-level `state`, the `--agentx-url` flag, `session_start`/`session_shutdown` hooks, the 2s status-widget interval, the `agentx-event` message renderer, all `/agentx *` slash commands, and the `agentx_toolchain_list` / `agentx_memory_query` tools. |
| `src/test-prompt.ts` | Standalone manual smoke script (not wired to pi). Opens an `AdpClient` to `ws://localhost:9222`, sends `Session.prompt`, `Toolchain.list`, `Memory.queryNodes`, logs results, and exits. Run with a TS runner against a live agent.                                                                                                                                     |
| `package.json`       | Manifest `pi-extension`; all scripts are no-op echoes (no build/test). Declares the `@agentx/adp` workspace dep, pi runtime deps, and `typebox`.                                                                                                                                                                                                                        |
| `tsconfig.json`      | Extends the root config; `rootDir: src`, `outDir: dist`. No emit happens in practice — pi runs the TS directly.                                                                                                                                                                                                                                                         |
| `README.md`          | Feature list, usage walkthrough, and architecture diagram (pi ↔ WebSocket/JSON-RPC ↔ AgentEventLoop).                                                                                                                                                                                                                                                                   |

## For AI Agents

### Working In This Directory

HOW TO RUN: There is no build or start script — `package.json` scripts are placeholder echoes. Launch via pi, which executes the TypeScript on the fly (jiti), from the workspace root:

- `pi -e ./apps/pi-extension/src/extension.ts` (uses default `ws://localhost:9222`)
- `pi -e ./apps/pi-extension/src/extension.ts --agentx-url ws://localhost:9222` (override target)

A live agentx agent must be running first and exposing its ADP server on the target URL (e.g. `cd apps/demo && pnpm start`, or `apps/music-scanner-service`, which both listen on `:9222`).

HOW IT CONTROLS AGENTX: On `session_start` it auto-connects by constructing `new AdpClient(url)` and calling `client.connect()`, then registers `onEvent` (server-push events → `pi.sendMessage` custom `agentx-event` messages) and `onClose` (marks disconnected, notifies). Every command guards on `state.client?.isOpen` and issues a request via `client.send(method, params?)` — JSON-RPC 2.0 over WebSocket. Methods are referenced symbolically through `AdpDomains` (never hand-written strings).

COMMANDS IT ISSUES (slash command → ADP method):

- `/agentx connect [url]` / `/agentx disconnect` — client lifecycle (no ADP call on connect beyond WS open).
- `/agentx halt` → `Inference.halt`
- `/agentx pause` → `Metacognition.pause`; `/agentx resume` → `Metacognition.resume`
- `/agentx inspect` → `Metacognition.getCallFrame` (caches result in `state.callFrame`, drives the footer widget)
- `/agentx compact` → `Memory.compact`
- `/agentx inject <msg>` → `Inference.evaluate` with `{ expression }` (defaults to "Re-evaluate your approach.")
- `/agentx send <msg>` → `Session.prompt` with `{ prompt }` (reports returned `queueLength`)
- `/agentx shutdown` → `Session.shutdown`
- Tool `agentx_toolchain_list` → `Toolchain.list`; tool `agentx_memory_query` → `Memory.queryNodes` with `{ query }`
- `/agentx status` is local-only (renders `state` + last cached call frame, issues no request).

### Testing Requirements

No automated tests. `package.json` `test` is `echo 'No tests'`, and the repo's root vitest config does not cover this app. Verification is manual: run a live agent, launch pi with the extension, and exercise the `/agentx *` commands (or run `src/test-prompt.ts` as a headless smoke check). There is nothing to lint/build here.

### Common Patterns

- Single module-level mutable `state` object (`client`, `url`, `connected`, `lastEvent`, `callFrame`) shared across all handlers; module-level `pi` holds the `ExtensionAPI`.
- Every command first checks `state.client?.isOpen` and bails with a "Run `/agentx connect` first." error notification if not connected.
- Uniform try/catch around each `client.send(...)`, surfacing results/errors through `ctx.ui.notify(..., "info"|"error"|"warning")`.
- ADP methods are always named via `AdpDomains.<Domain>.<method>` constants, not raw strings.
- `safeDisconnect()` is idempotent (swallows close errors, nulls the client) and is called before reconnecting and on `session_shutdown`.
- Server-push events are rendered through a registered custom message type (`agentx-event`) with an expand-to-show-params renderer; the footer status widget polls cached `state.callFrame` every 2s rather than fetching.
- Tool parameters are declared with `typebox` (`Type.Object`, `Type.Optional(Type.String(...))`).

## Dependencies

### Internal

- `@agentx/adp` (`workspace:*`) — `AdpClient` (WS JSON-RPC client) and `AdpDomains` (method-name constants). The only agentx package consumed; it talks to the `AdpServer` running inside the target agent.

### External

- `@earendil-works/pi-coding-agent` (`^0.79.9`) — pi extension host; provides the `ExtensionAPI` type and `registerFlag` / `registerCommand` / `registerTool` / `registerMessageRenderer` / `on` / `sendMessage` / `getFlag` surface.
- `@earendil-works/pi-tui` (`^0.79.9`) — pi TUI primitives; `Text` is used by the custom message renderer.
- `typebox` (`^1.3.0`) — runtime schema (`Type`) for tool parameter definitions.
- (transitively, via `@agentx/adp`) `ws` — the underlying WebSocket implementation.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
