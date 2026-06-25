<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# demo

## Purpose

`@agentx/demo` is the original prototype agent for the agentx runtime. It launches a long-lived, event-driven agent (`AgentEventLoop` from `@agentx/core`) that starts up, opens an ADP (Agent Debug Protocol) control-plane WebSocket on port 9222, and then blocks waiting for prompts delivered out-of-band over that socket rather than from stdin. It demonstrates two ideas: (1) non-blocking tool execution — tools are dispatched into core's Agentic Thread Pool so they do not block LLM inference; and (2) out-of-band metacognitive control — an external client can halt inference, pause/resume the loop, inspect live state, inject thoughts, compact memory, send prompts, and shut the agent down while it runs. The `admin.ts` CLI is a thin companion client that connects to the same port and fires individual ADP commands for demonstration. The code matches the README's description ("Prototype agent demonstrating non-blocking tools + ADP control").

## Key Files

| File           | Description                                                                                                                                                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts` | Entry point for `pnpm start` / `pnpm dev`. Loads `dotenv/config`, prints a banner, constructs an `AgentEventLoop` (adpPort 9222, custom systemPrompt), wires SIGINT/SIGTERM graceful shutdown, then runs a `while(true)` loop calling `agent.waitForPrompt()` and `agent.run(prompt)` until shutdown returns `null`. |
| `src/admin.ts` | Entry point for `pnpm admin`. Metacognitive admin CLI that opens an `AdpClient` to `ws://localhost:9222` and sends one ADP command chosen by the first CLI arg, mapping it through `AdpDomains`. Supports `halt` (default), `pause`, `resume`, `compact`, `inspect`, `inject "msg"`, `prompt "msg"`, `shutdown`.     |

## For AI Agents

### Working In This Directory

Run from this directory (or via the workspace) using the `package.json` scripts:

- `pnpm start` — start the interactive agent (alias of `tsx src/index.ts`).
- `pnpm dev` — identical to `start`.
- `pnpm admin [command] ["message"]` — connect to a running agent and send one ADP command. This command DOES still exist and matches the README. Examples: `pnpm admin` (Inference.halt), `pnpm admin pause`, `pnpm admin resume`, `pnpm admin inspect` (Metacognition.getCallFrame), `pnpm admin compact` (Memory.compact), `pnpm admin prompt "Hello"` (Session.prompt), `pnpm admin inject "Re-evaluate"` (Inference.evaluate), `pnpm admin shutdown` (Session.shutdown).
- `pnpm build` — `tsc` compile to `dist/`.

ADP usage: the agent always listens on `ws://localhost:9222`. Any WebSocket client speaking the ADP protocol can control it — `admin.ts`, the `apps/pi-extension` integration, another terminal, or a custom client. Command method strings live in `AdpDomains` (`@agentx/adp`): `Inference.{halt,switchModel,evaluate}`, `Metacognition.{pause,resume,getCallFrame}`, `Memory.{compact,queryNodes}`, `Session.{prompt,shutdown}`.

Configuration: `index.ts` constructs the loop without passing LLM credentials, so `@agentx/core`'s `LLMOrchestrator` falls back to environment variables. Copy `.env.example` to `.env` first. NOTE / DISCREPANCY: `.env.example` only documents `OPENAI_API_KEY` and `OPENAI_BASE_URL`, but the orchestrator also reads `AGENT_MODEL` (defaulting to `gpt-4o`) — that variable is undocumented in the example file. The variable names are `OPENAI_*`/`AGENT_MODEL`, not the `LLM_*` option names exposed on `AgentEventLoopOptions`.

### Testing Requirements

There are NO unit tests. The `test` script is a stub: `echo 'No tests'`. Verify changes manually by running `pnpm start` and driving the agent with `pnpm admin` commands (e.g. `pnpm admin prompt "..."` then `pnpm admin inspect`), and confirm graceful shutdown via Ctrl-C or `pnpm admin shutdown`.

### Common Patterns

- Two separate executables in one package: a long-lived server-style agent (`index.ts`) and a short-lived one-shot control client (`admin.ts`).
- All real agent logic lives in `@agentx/core`; this app is a thin harness/demonstration shell that only configures and drives the loop.
- Event-driven main loop: `await waitForPrompt()` blocks until a prompt arrives over ADP (or `null` on shutdown), then `await run(prompt)`.
- Graceful shutdown wired on both SIGINT and SIGTERM, each calling `agent.shutdown()` then `process.exit(0)`.
- ESM project (`"type": "module"`); run directly with `tsx`, no build step needed for `start`/`admin`.

## Dependencies

### Internal

- `@agentx/core` (`workspace:*`) — provides `AgentEventLoop`, the thread pool, and the LLM orchestrator. Core of the runtime.
- `@agentx/adp` (`workspace:*`) — provides `AdpClient` and `AdpDomains` used by `admin.ts` (the agent's ADP server is started internally by core).

### External

- `dotenv` (`^17.4.2`) — loads `.env` into `process.env` at startup (`import "dotenv/config"`).
- `tsx` (`catalog:`) — TypeScript execution runtime used by the `start`, `dev`, and `admin` scripts.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
