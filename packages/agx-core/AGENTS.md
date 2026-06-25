<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# agx-core

## Purpose

`@agentx/agx-core` is the shared, platform-agnostic state model and display layer for the agentx CLI TUIs. It defines the core domain types (`AgentNode`, `LogEntry`, `AgentStatus`, `LogLevel`, and the ADP wire types `AdpEvent`/`AdpCommand`), a pure `nodeReducer` for evolving agent-node state, seed/default data (`DEFAULT_NODES`, `DEFAULT_LOGS`, `REPL_HELP_LINES`), color/status display maps (`STATUS_TERM_COLOR`, `STATUS_HEX`, `LOG_HEX`), and small platform-neutral utilities — a reconnecting `AdpClient` WebSocket wrapper, the `parseReplCommand` REPL parser, and the `nowHHMMSS` timestamp helper. It is a library (`main: src/index.ts`) consumed by the CLI front-ends; it owns no rendering and performs no terminal or filesystem I/O of its own.

## Key Files

| File                 | Description                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`       | Public entry point. Re-exports `./types` and `./nodeReducer`, then defines defaults (`DEFAULT_NODES`, `DEFAULT_LOGS`, `REPL_HELP_LINES`), display maps (`STATUS_TERM_COLOR`, `STATUS_HEX`, `LOG_HEX`), the `nowHHMMSS` helper, the `AdpClient` reconnecting WebSocket client (with `AdpListener`/`AdpStatusListener` types), and the `parseReplCommand` slash-command parser. |
| `src/nodeReducer.ts` | Pure reducer over `AgentNode[]`. Defines the `NodeAction` union (`STATUS_UPDATE` to patch one node's `status`/`progress`/`detail` by `id`; `RESET` to swap the whole array) and `nodeReducer(state, action)`, which returns a new array without mutating the input.                                                                                                           |
| `src/types.ts`       | Shared type definitions: `AgentStatus` (`running`/`queued`/`success`/`error`/`paused`), `LogLevel` (`INFO`/`WARN`/`ERROR`/`DEBUG`/`CMD`), `AgentNode`, `LogEntry`, and the ADP JSON-RPC 2.0 wire types `AdpEvent` and `AdpCommand`.                                                                                                                                           |

## For AI Agents

### Working In This Directory

- This is a **pure state/display library**. It defines data shapes and pure functions; it does not render UI and does no terminal or filesystem I/O. The only side-effecting surface is `AdpClient`, which wraps the platform-global `WebSocket` (it is dependency-injected/mockable — tests stub `global.WebSocket`).
- **The reducer is pure and immutable.** `nodeReducer` maps over `state` and returns a fresh array; never mutate `state` in place. Note the documented behavior that `STATUS_UPDATE` _replaces_ the whole node record, so omitting `detail` clears any previous `detail` (covered by a dedicated test) — keep that contract if you touch it.
- **Consumers:** the CLI front-ends import these primitives — `@agentx/agx-cli` and `apps/cli` (the Ink/TUI MusicScanner CLI) — for their node state, REPL command parsing, and color theming. Treat exported types, the `NodeAction` shape, the display-map keys, and the `parseReplCommand` output (`Debugger.<Capitalized>` method names) as a public API contract; changing them ripples into every consuming TUI.
- Keep additions platform-agnostic: no Node-only or browser-only APIs in the library surface beyond the already-global `WebSocket` used by `AdpClient`.
- `STATUS_HEX` and `LOG_HEX` are keyed by the full `AgentStatus`/`LogLevel` unions — adding a new status or level requires updating every map (`STATUS_TERM_COLOR`, `STATUS_HEX`, `LOG_HEX`) or TypeScript's `Record<...>` typing will fail the build.

### Testing Requirements

- Tests live in `tests/` (`index.test.ts`, `nodeReducer.test.ts`) and run under the **root Vitest config** (`../../vitest.config.ts`). Run them from the repo root with `npm test` (`vitest run`), `npm run test:coverage`, or `npm run test:ui`.
- The package's own `package.json` `test` script is a no-op (`echo 'No tests'`) — do not rely on it; the real suite is driven from the workspace root.
- `index.test.ts` covers `nowHHMMSS`, `parseReplCommand`, the color/hex maps, and the full `AdpClient` lifecycle (connect/status, message dispatch, malformed-message tolerance, reconnect-after-3s, send gating on `readyState`, `destroy`, listener unregister) by stubbing `global.WebSocket` and using fake timers. Mirror this mocking approach for any new side-effecting code.

### Common Patterns

- **Observer/unsubscribe:** `AdpClient.onEvent`/`onStatus` register a listener in a `Set` and return an unsubscribe closure; preserve this pattern for new subscriptions.
- **Resilient WebSocket:** `connect()` auto-reconnects 3s after close unless `destroy()` set the `destroyed` flag; `send()` returns a boolean and is a no-op unless the socket is `OPEN`; outgoing commands are auto-wrapped with `jsonrpc: "2.0"` and an `id` of `Date.now()`.
- **Discriminated-union reducer:** state transitions go through a typed `NodeAction` union with an exhaustive `switch` on `type` — extend the union rather than adding ad-hoc mutators.
- **Centralized theming:** terminal color names and hex codes are defined once as typed `Record` maps and imported by consumers; never hardcode colors in the CLIs.

## Dependencies

### Internal

- None. `agx-core` is a leaf library and imports no other workspace packages. (It is itself consumed by `@agentx/agx-cli` and `apps/cli`.)

### External

- **Dev only:** `typescript` (via the workspace `catalog:` reference). The package ships no runtime dependencies; `WebSocket` is consumed from the host platform global rather than bundled.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
