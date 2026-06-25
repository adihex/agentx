<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# agx-herdr

## Purpose

`@agentx/agx-herdr` is a CLI launcher that builds the AGX Orchestrator TUI on top of [herdr](https://herdr.dev/) ("tmux for agents") instead of the OpenTUI-based `agx-cli`. On `agx-herdr` (or `pnpm --filter @agentx/agx-herdr start`), it connects to a running herdr server over its Unix-domain-socket JSON API, creates a workspace, and splits it into three panes: a DAG agent-status overview (top), an ADP debugger REPL (bottom-left), and a live execution-log stream (bottom-right). Each pane runs a small standalone `tsx` script that connects to the AgentX runtime's Agent Debugger Protocol (ADP) WebSocket at `ws://localhost:9222` to render real-time agent status, accept debugger commands, and tail log/tool events. The herdr backing gives the layout persistence (detach/reattach via `Ctrl+B Q` / `herdr`), native agent-status reporting in herdr's sidebar, and remote access over SSH. All the orchestration domain logic (`AdpClient`, node state, REPL command parsing) is imported from `@agentx/agx-core`; this package only supplies the herdr wiring and the per-pane renderers.

## Key Files

| File                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`        | Package manifest. Name `@agentx/agx-herdr`, `private`, ESM. Declares the `agx-herdr` bin, scripts (`start`/`dev`/`start:repl`/`build`/`test`), and its lone runtime dep `@agentx/agx-core`.                                                                                                                                                                                                                                                                                                                                                                                                       |
| `bin/agx-herdr.js`    | Executable shim. Registers the `tsx` ESM loader at runtime, then imports `../src/index.ts` so the TypeScript entry can run without a build step.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/index.ts`        | CLI entry point. Parses `--session`, `--cwd`, and `--help`/`-h` args, prints help/layout banner, instantiates `AgxHerdrOrchestrator`, wires SIGINT/SIGTERM to `shutdown()`, and calls `start()`.                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/orchestrator.ts` | `AgxHerdrOrchestrator` class. Connects to herdr, pings for version, creates the workspace, performs the down/right pane splits, reports a per-pane agent identity via `pane.report_agent`, launches the three pane scripts with `npx tsx <script>`, subscribes to herdr lifecycle events, and tears down agent authority on shutdown. Contains the ANSI color helpers used for its own stdout messages.                                                                                                                                                                                           |
| `src/herdr-client.ts` | `HerdrClient` (extends `EventEmitter`) — a typed Node.js client for herdr's newline-delimited-JSON Unix socket API. Resolves the socket path (`HERDR_SOCKET_PATH` > session-scoped > default under `$XDG_CONFIG_HOME/herdr`), does request/response with a 10s timeout, and exposes workspace/tab/pane CRUD, pane I/O (`paneRun`, `paneSendText`, `paneSendKeys`, `paneRead`), `paneReportAgent`, `waitForOutput`, and a long-lived `subscribe()` over a second socket. Also declares the `WorkspaceInfo`/`TabInfo`/`PaneInfo`/`PaneRead`/`HerdrRequest`/`HerdrResponse`/`HerdrEvent` interfaces. |
| `src/dag-watcher.ts`  | Top-pane script. Seeds state from `DEFAULT_NODES`, connects an `AdpClient` to `ws://localhost:9222`, and on every `Agent.StatusUpdate` event feeds `nodeReducer` and re-renders a full-screen progress dashboard (per-node status tag + progress bar, running/done/error counts, clock). Refreshes every 2s for the clock.                                                                                                                                                                                                                                                                        |
| `src/adp-repl.ts`     | Bottom-left-pane script. Interactive `readline` debugger prompt. Connects an `AdpClient`, handles `/help` (via `REPL_HELP_LINES`) and `/exit`/`/quit` locally, parses other input with `parseReplCommand` and sends it as an ADP message, prints `Debugger.Response` and `Agent.StatusUpdate` events, and appends an audit trail to `../orchestrator.log`.                                                                                                                                                                                                                                        |
| `src/log-watcher.ts`  | Bottom-right-pane script. Connects an `AdpClient` and prints a live, color-coded tail of ADP events: `Log.Entry`, `Agent.StatusUpdate`, `Debugger.Response`, and `Tool.Started`/`Tool.Completed`/`Tool.Failed`.                                                                                                                                                                                                                                                                                                                                                                                   |
| `README.md`           | User-facing docs: prerequisites (install/run herdr), usage, the three-pane layout diagram, a comparison table vs `agx-cli`, an architecture summary, detach/reattach instructions, and the ADP REPL command reference.                                                                                                                                                                                                                                                                                                                                                                            |
| `tsconfig.json`       | Extends the repo root `../../tsconfig.json`; sets `outDir` `./dist`, `rootDir` `./src`, includes `src/**/*`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## For AI Agents

### Working In This Directory

- This package is a thin herdr-integration layer; the actual agent/ADP domain logic lives in `@agentx/agx-core`. When changing status semantics, node defaults, REPL commands, or the ADP client, edit agx-core, not here.
- There is no build step in the normal run path: `bin/agx-herdr.js` registers `tsx` and runs `src/index.ts` directly. The four `src/*.ts` files are also each runnable standalone via `tsx`.
- The three pane scripts (`dag-watcher.ts`, `adp-repl.ts`, `log-watcher.ts`) are launched as separate processes by `orchestrator.ts` using `npx tsx <absolute-path>`. They do not import the orchestrator; they only import from `@agentx/agx-core`. Keep them self-contained.
- Two hard external assumptions: (1) a herdr server is reachable at the resolved Unix socket path, and (2) the AgentX runtime exposes ADP over WebSocket at `ws://localhost:9222`. Both the socket path and (currently hardcoded) the WS URL are not configurable via CLI flags today; the WS URL appears as a literal string in all three pane scripts.
- `adp-repl.ts` writes to `../orchestrator.log` (i.e. `packages/agx-herdr/orchestrator.log`); be aware this file is created at runtime.
- herdr method names use dotted strings (e.g. `workspace.create`, `pane.split`, `pane.report_agent`, `events.subscribe`); pane splits accept only `"right"` or `"down"`.

### Testing Requirements

There are no tests. `package.json`'s `test` script is `echo 'No tests yet'`. Verification today is manual: start herdr, start the AgentX runtime (ADP server on `:9222`), run `agx-herdr`, and confirm the three panes populate.

### Common Patterns

- ANSI escape codes are written directly to stdout for all rendering; there is no UI framework (a deliberate "zero UI deps" choice vs `agx-cli`'s OpenTUI).
- Each script owns its own `AdpClient` connection and registers SIGINT/SIGTERM handlers that call `client.destroy()` / `orchestrator.shutdown()` before exiting.
- `HerdrClient` separates request/response (one socket) from event subscriptions (a second socket), both parsing newline-delimited JSON with a retained partial-line buffer.
- Errors in nice-to-have paths (event subscription, shutdown cleanup) are swallowed with empty `catch` blocks so they don't crash the launcher.

## Dependencies

### Internal

- `@agentx/agx-core` (`workspace:*`) — the only runtime dependency. Provides `AdpClient`, `DEFAULT_NODES`, `STATUS_TERM_COLOR`, `nodeReducer`, `nowHHMMSS`, `parseReplCommand`, `REPL_HELP_LINES`, and the `AgentNode`/`AgentStatus`/`LogLevel` types.

### External

- Runtime: none beyond the Node.js standard library (`node:net`, `node:events`, `node:os`, `node:path`, `node:readline`, `node:fs`, `node:url`).
- Dev: `tsx` (loader + standalone runner), `tsdown` (`^0.22.3`, used only by the `build` script), `typescript` (`6.0.3`), `@types/node` (catalog).
- External services (not npm deps): a running **herdr** server (Unix socket API) and the **AgentX runtime**'s ADP WebSocket at `ws://localhost:9222`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
