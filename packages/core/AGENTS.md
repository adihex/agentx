<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# core

## Purpose

`@agentx/core` is the agentx runtime. It implements `AgentEventLoop`, a single-agent execution engine that maps the four Node.js event-loop phases (Timers → I/O Callbacks → Inference → Check) onto agent semantics: drain tool results, stream one LLM turn, then run guardrails. Tool calls execute off the main loop in a fixed-size `worker_threads` pool (`AgenticThreadPool`); LLM inference is streamed token-by-token through `LLMOrchestrator` with a first-class `AbortSignal`. The ADP control plane (`@agentx/adp`) is wired in at construction so an external operator can halt inference, inject context, pause/resume, compact memory, enqueue prompts, intercept tools, and introspect live state over a WebSocket while the agent runs.

## Key Files

| File                              | Description                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/AgentEventLoop.ts`           | The runtime core. `EventEmitter` subclass owning context (`ModelMessage[]`), the micro/macrotask queues, the active `AbortController`, and the prompt queue. `run()` pushes a user message and runs one `tick()` (the 4-phase loop). `dispatchTool()` fires tools into the pool fire-and-forget. `wireAdp()` registers every ADP command handler. Emits `tick.*`, `inference.*`, `tool.*`, `session.input` events. |
| `src/AgenticThreadPool.ts`        | Fixed-size `worker_threads` pool. Round-robins `ToolRequest`s across N workers, matches `ToolResult`s back by `id` via `pendingRequests`. Worker script is generated as an eval string (`generateWorkerScript`) with the tool map inlined as JSON; each tool body is `eval`'d to a function inside the worker.                                                                                                     |
| `src/LLMOrchestrator.ts`          | Streaming inference wrapper over the Vercel AI SDK. Builds an `@ai-sdk/openai-compatible` provider (`createOpenAICompatible`) and `generateStream()` yields text chunks from `streamText({ ..., abortSignal })`. Aborting the signal kills the in-flight HTTP request — the mechanism behind `Inference.halt`.                                                                                                     |
| `src/index.ts`                    | Public barrel. Re-exports everything from `AgentEventLoop`, `AgenticThreadPool`, and `LLMOrchestrator`.                                                                                                                                                                                                                                                                                                            |
| `tests/AgentEventLoop.test.ts`    | Loop behavior with `@agentx/adp`, `LLMOrchestrator`, and `AgenticThreadPool` all mocked; drives ADP handlers by pulling them out of the `adp.handle` mock calls.                                                                                                                                                                                                                                                   |
| `tests/AgenticThreadPool.test.ts` | Real workers (no mocks) exercising custom string tools, unknown-tool / error paths, empty pool, and round-robin.                                                                                                                                                                                                                                                                                                   |
| `tests/LLMOrchestrator.test.ts`   | Mocks `ai` and `@ai-sdk/openai-compatible`; asserts `streamText` is called with the messages + `abortSignal` and that chunks stream through.                                                                                                                                                                                                                                                                       |
| `tests/injection.test.ts`         | End-to-end tool injection via the `tools` option (serialized fn → worker) and `registerAdpHandler` custom-handler wiring.                                                                                                                                                                                                                                                                                          |
| `package.json`                    | `@agentx/core`; built with `tsdown` (cjs+esm+dts), tested with `vitest run`.                                                                                                                                                                                                                                                                                                                                       |
| `tsconfig.json`                   | Extends root config; `rootDir: src`, `outDir: dist`, `types: ["node"]`.                                                                                                                                                                                                                                                                                                                                            |

## For AI Agents

### Working In This Directory

- **ESM with `.js` import extensions.** Cross-module imports inside `src/` use explicit `.js` suffixes (`./AgenticThreadPool.js`, `./LLMOrchestrator.js`) even though the sources are `.ts` — this is required for the ESM build. `index.ts` is the exception (extensionless re-exports). Keep new internal imports `.js`-suffixed.
- **The 4-phase tick (`tick()` in `AgentEventLoop.ts`).** One `run(prompt)` = one iteration: **Phase 1 Timers** (placeholder — no logic yet), **Phase 2 I/O Callbacks** drains `macrotaskQueue` (tool results) and appends each as a `user` message, **Phase 3 Inference** streams one LLM turn into the context as an `assistant` message, **Phase 4 Check** drains `microtaskQueue` (guardrails/validators) in order. After Phase 4 the loop blocks on a pause gate if `Metacognition.pause` set `paused`. Preserve this ordering; new per-turn work belongs in the matching phase.
- **Adding a tool.** Tools are passed in `AgentEventLoopOptions.tools` as a `Record<name, string>` where the value is the tool function **serialized to source** (e.g. `myFn.toString()` or a string literal). The string is inlined into the generated worker and `eval`'d there, so a tool body must be self-contained — no closures over outer scope, no imports the worker lacks. Dispatch with `loop.dispatchTool(name, args)`; the result lands on the macrotask queue and is ingested on the next `tick()`.
- **AbortSignal / halt semantics.** Each inference creates a fresh `inferenceAbort = new AbortController()` passed into `generateStream`. `Inference.halt` (and `Session.shutdown`/`shutdown()`) call `.abort()`, which throws inside the stream loop; the `catch` distinguishes `AbortError`/"aborted" (→ `"[inference halted by operator]"`) from real errors (→ `"[inference error: …]"`). Always null `inferenceAbort` in `finally`. Do not swallow the abort path.
- **Adding an ADP command.** Register handlers inside `wireAdp()` via `this.adp.handle(AdpDomains.<Domain>.<method>, (params, cb) => { …; cb(result); })`. The `cb` is the JSON-RPC reply — always call it exactly once. Use `AdpDomains.*` constants (never raw strings) so the ADP schema stays the source of truth. `emitAdpEvent` / `this.adp.notify` push out-of-band events to observers.

### Testing Requirements

- Tests run **from the repo root**, not per-package: `pnpm test` (alias for the root `vp`/vitest run) collects `packages/*/tests/**/*.test.ts` per the root `vitest.config.ts`. `packages/core/src/**` is in the v8 coverage `include` set (root thresholds: 85% statements/functions/lines, 65% branches).
- **Mocking patterns mirror the existing tests.** `AgentEventLoop.test.ts` `vi.mock`s `@agentx/adp` (returning a fake `AdpServer` with `on`/`handle`/`notify`/`close` plus a literal `AdpDomains` map), `../src/LLMOrchestrator` (async-generator `generateStream`), and `../src/AgenticThreadPool` — then drives behavior by finding handlers in `adp.handle.mock.calls`. `LLMOrchestrator.test.ts` mocks `ai` (`streamText`) and `@ai-sdk/openai-compatible` (`createOpenAICompatible`).
- **`AgenticThreadPool` is tested with real workers** — no mocks. Tools are passed as source strings; always `await pool.terminateAll()` in `afterAll`/`afterEach` and `await loop.shutdown()` after constructing a real `AgentEventLoop`, or worker threads leak and the run hangs.
- Internal state is poked via `(loop as any).context` / `.macrotaskQueue` / `.paused` etc. — these fields are private, so renaming them breaks the tests intentionally.

### Common Patterns

- **Fire-and-forget tool dispatch:** `void this.threadPool.execute(...).then(...)` pushes onto `macrotaskQueue` and emits `tool.complete` + `adp.notify("Toolchain.responseReceived", …)`; the loop never `await`s a tool inline.
- **Request/response correlation by `id`:** the pool generates a short id (`uid()`), stores the resolver in `pendingRequests`, and the worker echoes the `id` back on its message.
- **Context is a flat `ModelMessage[]`** with roles `system` | `user` | `assistant`; tool results and ADP injections are appended as synthetic `user` messages (`[Tool Result from "…"]`, `[ADP Injected]: …`). `Memory.compact` keeps system messages + the last 4.
- **Heavy console logging** with phase/emoji prefixes (`[Loop]`, `[Phase n/4]`, `[ADP]`) is the house style for the runtime — keep new log lines consistent.
- **Constructor defaults:** `adpPort` 9222, `threadPoolSize` 4, model/key/baseURL fall back to env (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AGENT_MODEL`).

## Dependencies

### Internal

- `@agentx/adp` (`workspace:*`) — the control plane. `AgentEventLoop` instantiates `new AdpServer(port)`, registers handlers with `adp.handle(AdpDomains.…, cb)`, and pushes events with `adp.notify(...)`. Imports `AdpServer`, `AdpDomains`, and the `AdpCommandHandler` type.

### External

- `ai` (`catalog:`) — Vercel AI SDK; `streamText` + the `ModelMessage` type power streaming inference and the context shape.
- `@ai-sdk/openai-compatible` (`catalog:`) — `createOpenAICompatible` provider used by `LLMOrchestrator`. Targets the Chat Completions endpoint of any OpenAI-compatible gateway (OpenCode Zen, Ollama, Azure, vLLM). NOT `@ai-sdk/openai`.
- `zod` (`catalog:`) — declared dependency; runtime validation surface (schemas live in `@agentx/adp`).
- `node:worker_threads`, `node:events`, `node:url` — built-ins backing the thread pool, `EventEmitter` base class, and worker plumbing.
- Dev: `tsdown` (build → cjs/esm/dts), `typescript` 6.0.3, `vitest`, `@types/node`.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
