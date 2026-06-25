<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# agx-cli

## Purpose

`@agentx/agx-cli` is the terminal UI for the AgentX runtime. It ships the `agx` binary, which renders an OpenTUI + React dashboard (DAG orchestrator view, ADP REPL pane, and execution log pane) directly in the terminal. The TUI connects to the AgentX runtime over the Agent Debugger Protocol (ADP) — a JSON-message WebSocket channel — to stream live agent status updates and logs, and to send debugger/REPL commands back. All shared protocol logic (the `AdpClient`, command parsing, default state, reducers) lives in `@agentx/agx-core`; this package is the presentation and entrypoint layer. It runs on Bun, with a lighter standalone `readline`-based ADP REPL available for low-level debugging without the full UI.

## Key Files

| File                       | Description                                                                                                                                                                                                                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.tsx`            | Entrypoint. Creates the OpenTUI CLI renderer (`createCliRenderer`), mounts the React root, and renders `AgxOrchestratorCLI`, wiring `onExit` to `renderer.destroy()`.                                                                                                                                                                          |
| `src/AgxOrchestrator.tsx`  | Main dashboard component. Manages ADP connection state, agent-node DAG (via `nodeReducer`), log list, and REPL line buffer. Subscribes to `Agent.StatusUpdate`, `Log.Entry`, and `Debugger.Response` ADP events; handles keyboard input and dispatches parsed REPL commands over the `AdpClient`. Defines local `Box`/`Text` OpenTUI wrappers. |
| `src/AgxAgentZoom.tsx`     | Standalone "agent detail" zoom view (thought stream, tool execution history, memory context sidebar). Currently static/mock layout, not wired into the main entrypoint.                                                                                                                                                                        |
| `src/adp-repl.ts`          | Standalone, UI-less ADP REPL. Uses Node `readline` to read `/method args` commands, sends them via `AdpClient` (`ws://localhost:9222`), prints `Debugger.Response` results, and appends activity to `orchestrator.log`. Run via `start:repl`.                                                                                                  |
| `src/jsx.d.ts`             | Global JSX ambient types declaring the `box` and `text` OpenTUI intrinsic elements so TSX compiles.                                                                                                                                                                                                                                            |
| `bin/agx.js`               | The `agx` executable (`#!/usr/bin/env node`). Boots a 3-pane `tmux` session (`agx_orchestrator`): `pnpm start` (dashboard), `pnpm start:repl` (REPL), and `tail -f orchestrator.log`; attaches if the session already exists.                                                                                                                  |
| `scripts/loader-hooks.mjs` | Node ESM loader hooks. Resolves/loads `.scm` (tree-sitter) files as empty modules and intercepts `with { type: "file" }` asset imports (e.g. `@opentui/core` `.wasm`/`.scm`), returning the resolved filesystem path as the default export to bypass Node's import-attribute validation.                                                       |
| `scripts/loader.mjs`       | Earlier/simpler loader: resolves and stubs `.scm` tree-sitter highlight imports as empty-string modules.                                                                                                                                                                                                                                       |
| `scripts/register.mjs`     | Registers `loader-hooks.mjs` with `node:module`'s `register()` so the hooks apply at process start.                                                                                                                                                                                                                                            |

## For AI Agents

### Working In This Directory

- **Runtime is Bun, not Node.** `pnpm start` and `pnpm dev` both run `bun src/index.tsx`. Do not assume a build step is needed for local runs — `bun` executes the TSX directly. `pnpm build` (`tsc`) and `pnpm docs` (`typedoc`) exist but are secondary.
- **Rendering is OpenTUI + React.** UI is composed from `box`/`text` intrinsic elements (flexbox-style layout via Yoga). The renderer is created with `createCliRenderer()` from `@opentui/core` and mounted with `createRoot().render()` from `@opentui/react`. Use `useKeyboard` for input and `useRenderer` to access the renderer (e.g. for exit/destroy).
- **The `agx` bin orchestrates tmux, it does not render directly.** `bin/agx.js` spawns the dashboard, the REPL, and a log tail in separate panes. Editing the run topology means editing the chained tmux command there.
- **Two ways to talk to the runtime.** The full TUI (`AgxOrchestratorCLI`) and the headless `adp-repl.ts`. The REPL connects explicitly to `ws://localhost:9222`; the runtime must be listening on the ADP WebSocket for either to connect (status flips to `CONNECTED`).
- **`.scm`/`.wasm` asset imports need the loader hooks.** `@opentui/core` pulls in tree-sitter assets that Node's stock ESM loader rejects; if you switch the runner or add asset-importing deps, preserve `scripts/loader-hooks.mjs` + `register.mjs`.

### Testing Requirements

- The package `test` script is a no-op: `echo 'No tests'`. There is no unit test suite here.
- Verify changes by **running the TUI**: `pnpm start` (or `pnpm dev`) and confirm the dashboard renders, the ADP status indicator reflects connection, agent nodes update, and REPL commands send. Use `pnpm start:repl` to validate raw ADP command flow without the UI. The full `agx` tmux layout exercises all three panes together.

### Common Patterns

- **OpenTUI component conventions.** Wrap intrinsic `box`/`text` in typed `Box`/`Text` helpers (see `AgxOrchestrator.tsx`); custom intrinsics are declared in `jsx.d.ts` and inline `declare global { namespace JSX { ... } }` blocks. Layout uses `flexDirection`, `flexGrow`, `justifyContent`, `gap`, `paddingX/Y`, `borderStyle`/`borderColor`. Color is conveyed via named colors mapped from domain state (e.g. `STATUS_TERM_COLOR`, `levelColor`).
- **ADP client usage.** Instantiate `new AdpClient()` (TUI) or `new AdpClient(url)` (REPL) inside an effect; subscribe with `onStatus(cb)` and `onEvent(cb)` (both return unsubscribe fns), call `connect()`, and clean up with `destroy()` on unmount. Send commands with `client.send({ method, params: { args } })`, where `method`/`args` come from `parseReplCommand(...)`; `send` returns `false` when disconnected. Dispatch incoming `Agent.StatusUpdate` events through `nodeReducer`, and append `Log.Entry` / `Debugger.Response` payloads to local buffers (capped via `slice(-N)`).

## Dependencies

### Internal

- `@agentx/agx-core` (`workspace:*`) — provides `AdpClient`, `parseReplCommand`, `nodeReducer`, `DEFAULT_NODES`, `DEFAULT_LOGS`, `REPL_HELP_LINES`, `STATUS_TERM_COLOR`, `nowHHMMSS`, and shared types (`AgentNode`, `LogEntry`, `LogLevel`). All ADP/protocol and state logic lives here; agx-cli only renders and dispatches.

### External

- `@opentui/core` — CLI renderer and terminal primitives (`createCliRenderer`).
- `@opentui/react` — React reconciler for OpenTUI (`createRoot`, `useRenderer`, `useKeyboard`).
- `react` — component model.
- `ws` — WebSocket transport for the ADP connection (used by `@agentx/agx-core`'s `AdpClient`).
- Dev/support: `tsx` (runs `adp-repl.ts`), `typescript`, `yoga-layout` (flexbox engine), `@types/react`, `@types/ws`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
