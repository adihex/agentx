<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# cli

## Purpose

The terminal (TUI) client for AgentX, built with OpenTUI + React and run on Bun. It is a thin ADP (Agent Debugger Protocol) client: it boots an OpenTUI renderer, renders an interactive full-screen interface, and connects over a WebSocket to the ADP runtime host at `ws://localhost:9222`. The default surface is the Music Scanner, which lets a user type a song name and fire a `Music.StartExtraction` JSON-RPC request, then visualizes pipeline progress (search → download → extract) driven by events streamed back from the runtime. This app owns no business logic of its own; it renders state and relays commands to the runtime.

## Key Files

| File                      | Description                                                                                                                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.tsx`           | Entry point. Creates the OpenTUI CLI renderer (`createCliRenderer`), mounts the React root (`createRoot(...).render`), and renders `MusicScannerCLI`, wiring `onExit` to `renderer.destroy()`.                                                                                         |
| `src/MusicScannerCLI.tsx` | Primary view. Opens the `ws://localhost:9222` WebSocket (held in a `useRef`), auto-reconnects every 3s on close, handles `Music.Status` and `Toolchain.responseReceived` events to advance the progress bar, and sends the `Music.StartExtraction` JSON-RPC request on Enter.          |
| `src/AgxOrchestrator.tsx` | Alternative full-screen orchestrator/debugger view (DAG of agent nodes, execution log pane, ADP REPL pane). Connects to the same `ws://localhost:9222`, consumes `Agent.StatusUpdate` / `Log.Entry` / `Debugger.Response`, and sends `Debugger.*` JSON-RPC commands typed in the REPL. |
| `src/AgxAgentZoom.tsx`    | Static "agent detail" mockup view (thought stream, tool execution history, memory context sidebar). Presentational only — no WebSocket wiring.                                                                                                                                         |
| `src/adp-repl.ts`         | Standalone line-based REPL (Node `readline`, not OpenTUI). Uses `AdpClient` from `@agentx/adp` to connect to the runtime and supports `/pause`, `/inspect`, `/help`, `/exit`; appends activity to `orchestrator.log`.                                                                  |
| `bin/agx.js`              | Node launcher that spins up a 3-pane `tmux` session (`agx_orchestrator`): dashboard (`APP_MODE=agx pnpm start`), REPL (`pnpm start:repl`), and a `tail -f orchestrator.log` pane; attaches to an existing session if present.                                                          |
| `package.json`            | Package `cli`. Scripts: `start`/`dev` = `bun src/index.tsx`, `build` = `tsc`. Declares internal and OpenTUI/React/ws dependencies.                                                                                                                                                     |

## For AI Agents

### Working In This Directory

- HOW TO RUN: `pnpm start` (equivalently `pnpm dev`), which executes `bun src/index.tsx`. This is a Bun-run app — do not assume Node for the TUI entry point.
- REQUIRES the runtime host to be up FIRST: start the ADP runtime (`apps/music-scanner-service`) so it is listening on `ws://localhost:9222` before launching the CLI. With no host up, the header shows `DISCONNECTED` (red).
- CONNECTION STATE: the header status flips to `CONNECTED` (green) once the socket opens. On socket close the client sets `DISCONNECTED` and auto-reconnects every 3 seconds (`setTimeout(connectADP, 3000)`).
- ADP METHODS — sends: `Music.StartExtraction` (JSON-RPC `{ jsonrpc: "2.0", id, method, params: { songName } }`). Receives: `Music.Status` (appends `params.message` to the log) and `Toolchain.responseReceived` (`params.toolName` of `searchMusic` → download @25%, `downloadAndUpload` → extract @50%, `triggerCloudRun` → done @100%; `result.success === false` surfaces an error and stops scanning).
- The `AgxOrchestrator` view speaks a different slice of ADP (sends `Debugger.*`, receives `Agent.StatusUpdate` / `Log.Entry` / `Debugger.Response`); `bin/agx.js` selects it via `APP_MODE=agx`, but note `index.tsx` currently always renders `MusicScannerCLI` and `package.json` does not define the `start:repl` script that `bin/agx.js` invokes — treat the tmux launcher as aspirational wiring.
- RENDERING: OpenTUI drives the terminal via React (`@opentui/react`). Components use lowercase intrinsic elements (`<box>`, `<text>`) wrapped as `Box`/`Text`; `tsconfig.json` sets `jsxImportSource: "@opentui/react"`.

### Testing Requirements

- No unit tests (`package.json` `test` is a no-op `echo`). Verify changes visually.
- Smoke test: start the runtime on :9222, run `pnpm start`, confirm the header turns green `CONNECTED`, type a song name and press Enter to fire `Music.StartExtraction`, and watch the progress bar advance through SEARCH → DOWNLOAD → EXTRACT → 100%. Press Esc or Ctrl+C to exit.

### Common Patterns

- WebSocket client held in a `useRef` (`ws.current`), opened in `useEffect` on mount and closed on unmount; reconnect via `setTimeout`. Guard sends with `ws.current?.readyState === WebSocket.OPEN`.
- ADP message handling: parse each frame with `JSON.parse` inside a try/catch (silently drop malformed frames), then branch on `msg.method`. Outbound requests are JSON-RPC 2.0 with a `Date.now()` id.
- Keyboard input via OpenTUI's `useKeyboard` — manual key handling builds the input string (single-char append, `backspace` slice, `return`/`enter` to submit, `escape`/`Ctrl+C` to exit).
- OpenTUI layout components use flexbox-style props (`flexDirection`, `borderStyle`, `borderColor`, `paddingX`); progress bars are rendered with repeated `█`/`░` characters.

## Dependencies

### Internal

- `@agentx/adp` — ADP client (`AdpClient`) and protocol types; used directly by `src/adp-repl.ts`.
- `@agentx/agx-cli` — shared CLI building blocks for the AgentX toolchain.
- `@agentx/agx-core` — core AgentX runtime/orchestration types and logic.

### External

- `@opentui/core` — terminal renderer (`createCliRenderer`).
- `@opentui/react` — React reconciler/host for OpenTUI (`createRoot`, `useRenderer`, `useKeyboard`).
- `react` — component model.
- `ws` — WebSocket client for the ADP connection.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
