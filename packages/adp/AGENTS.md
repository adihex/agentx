<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# adp

## Purpose

`@agentx/adp` implements the **Agent Debugger Protocol** — an out-of-band control plane that lets external frontends pause, halt, inspect, and prompt a live agent. It speaks **JSON-RPC 2.0** over a dedicated **WebSocket** (the runtime host opens it on port **9222** by default) and is modeled on the Chrome DevTools Protocol: domain-namespaced methods (`Inference.halt`, `Metacognition.pause`, …), client→server requests with responses, and server→client event pushes. The package ships an `AdpServer` (handler registration + event broadcast), an `AdpClient` (request/response + event subscription), the `AdpDomains` method registry, and zod schemas validating the wire format.

## Key Files

| File                            | Description                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/server.ts`                 | `AdpServer` — `EventEmitter` subclass that opens a `WebSocketServer` on a given port, validates inbound frames with `JsonRpcRequestSchema`, dispatches commands to `.on()` listeners (and a legacy `.handle()` map), and pushes events via `.notify()` / `.broadcast()`. Replies with JSON-RPC errors `-32600` (invalid request), `-32601` (method not found), `-32700` (parse error). |
| `src/client.ts`                 | `AdpClient` — wraps a `ws` socket; `send(method, params)` returns a Promise correlated by a random id, `onEvent()` subscribes to server pushes, `onClose()` to disconnects, plus `connect()`/`waitForOpen()`/`isOpen`/`close()`.                                                                                                                                                       |
| `src/schemas.ts`                | zod schemas (`JsonRpcRequestSchema`, `JsonRpcResponseSchema`) + inferred types, the `AdpDomains` const registry, the `AdpEvent` interface, and the `AdpCommandHandler` / `AdpCommandCallback` handler types.                                                                                                                                                                           |
| `src/index.ts`                  | Barrel — re-exports `./schemas`, `./server`, `./client`. The package entry.                                                                                                                                                                                                                                                                                                            |
| `tests/protocol.test.ts`        | Server tests: `.on()` dispatch, legacy `.handle()`, unknown-method/parse/invalid-request errors, `.notify()`/`.broadcast()`, shutdown error path.                                                                                                                                                                                                                                      |
| `tests/client.test.ts`          | Client↔server round-trip: connect, send/receive, event delivery, malformed-frame tolerance, close listeners.                                                                                                                                                                                                                                                                           |
| `tests/client-coverage.test.ts` | Supplemental client coverage for event and close-listener paths.                                                                                                                                                                                                                                                                                                                       |
| `package.json`                  | `@agentx/adp` manifest; `build`/`dev` via tsdown, `test` via vitest.                                                                                                                                                                                                                                                                                                                   |

## For AI Agents

### Working In This Directory

- **This package builds to `dist/` and is consumed by its built output — not its source.** `package.json` points `main`/`module`/`types` at `dist/index.{cjs,mjs,d.cts}`, so other packages import the compiled artifacts. **After changing anything in `src/`, run `pnpm --filter @agentx/adp build`** (or `pnpm build` in this dir) or downstream consumers will see stale code. Use `pnpm dev` (tsdown `--watch`) while iterating.
- Build is **tsdown**: `tsdown src/index.ts --format cjs,esm --dts` emits CJS + ESM + `.d.ts` in one pass.
- **Register a command handler** with `server.on(method, (params, callback) => callback(result))`. The listener signature is `(params, callback)`; call `callback(result)` to send the JSON-RPC response. `.handle(method, handler)` is the deprecated legacy equivalent (same signature) and is checked as a fallback after `.on()` listeners.
- **Push an event** to all connected clients with `server.notify(method, params)` (deprecated low-level form: `server.broadcast({ jsonrpc: "2.0", method, params })`).
- Wire shapes:
  - Request (client→server): `{ "jsonrpc": "2.0", "id": <string|number>, "method": "Domain.action", "params": {…} }`. Omitting `id` makes it a notification (no response sent).
  - Response (server→client): `{ "jsonrpc": "2.0", "id": <same>, "result": … }` or `{ …, "error": { "code", "message", "data"? } }`.
  - Event (server→client push): `{ "jsonrpc": "2.0", "method": "Domain.action", "params": {…} }` (no `id`).
- **`AdpDomains`** is the canonical method registry — prefer its constants over raw strings:
  - `Inference`: `halt`, `switchModel`, `evaluate`
  - `Metacognition`: `pause`, `resume`, `getCallFrame`
  - `Toolchain`: `intercept`, `list`
  - `Memory`: `compact`, `queryNodes`
  - `Session`: `prompt`, `shutdown`
- ESM source: intra-package imports use `.js` extensions on `.ts` files (e.g. `from "./schemas.js"`).

### Testing Requirements

- Tests are **root-relative vitest** — run from the repo root, not this package: `pnpm test` or `pnpm exec vitest run packages/adp/tests`. The root `vitest.config.ts` include globs (`packages/*/tests/**`, `packages/*/src/**/*.test.*`) mean `pnpm --filter @agentx/adp test` finds nothing.
- `adp/src/**/*.ts` is in the root coverage `include` set (thresholds: 85% statements/functions/lines, 65% branches), so keep new code covered.
- Protocol and client tests spin up a real `AdpServer` on a unique port (9224, 9400+, 9500+) per file and connect a real `ws` socket — assertions run over the actual WebSocket round-trip.

## Common Patterns

- **zod validation at the boundary**: every inbound frame is `JsonRpcRequestSchema.safeParse`'d in `AdpServer`; a failed parse returns error `-32600` and the frame is dropped. Extend the protocol by adding schemas/types in `schemas.ts`.
- **EventEmitter-based dispatch**: `AdpServer extends EventEmitter`; commands are routed by emitting the method name as the event and passing `(params, callback)` to listeners, so registration is just `.on()`. Always invoke the callback to resolve the client's pending request.
- **Promise-correlated client requests**: `AdpClient.send()` assigns a random id, stores `{resolve, reject}` in a pending-requests map, and settles it when the matching response arrives (rejecting on socket error/close).

## Dependencies

### Internal

- None — this package has **no `@agentx/*` dependencies**. It is a leaf library that `@agentx/core`, the runtime hosts, and the CLI/web frontends depend on.

### External

- `ws` — WebSocket server (`AdpServer`) and client (`AdpClient`) transport.
- `zod` — JSON-RPC 2.0 request/response schema validation.
- `tsdown` (dev) — bundler emitting CJS + ESM + `.d.ts` to `dist/`.
- `@types/ws`, `typescript` (dev).

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
