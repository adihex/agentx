# agentx

> An event-driven TypeScript runtime for controllable, tool-using AI agents.

AgentX separates an agent's conversation engine from an out-of-band control plane. The runtime
streams one model step at a time, preserves native tool-call history, dispatches registered tools
through worker threads, and accepts live operator commands over the Agent Debugger Protocol (ADP),
a JSON-RPC 2.0 WebSocket protocol inspired by Chrome DevTools.

AgentX is an active project, not yet a production-ready agent platform. Its strongest implemented
idea is remote control of a running agent; durable sessions, authenticated remote ADP access, and
fully owned orchestration lifecycles remain roadmap work.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│ AgentSession                                                    │
│                                                                 │
│  I/O callbacks         Inference               Check            │
│  ingest tool results ─▶ one streamed LLM step ─▶ queued guards  │
│          ▲                       │                               │
│          │                       ▼                               │
│          └──────── AgenticThreadPool (worker_threads)            │
└──────────────────────────────┬──────────────────────────────────┘
                               │ injected LLM, tools, notifier
                    ┌──────────┴──────────┐
                    │                     │
            AgentEventLoop       AgentSessionHost
            one session/server   shared infrastructure,
                                 isolated client sessions
                    │                     │
                    └──────────┬──────────┘
                               │ WebSocket / JSON-RPC 2.0
                    ┌──────────▼──────────┐
                    │ ADP control plane   │
                    │ halt, pause, prompt,│
                    │ inspect, tools      │
                    └─────────────────────┘
```

The source labels each tick as four phases (Timers → I/O → Inference → Check), but the Timers
phase is currently a placeholder. Treat the implementation as a turn scheduler, not as a complete
reimplementation of the Node.js event loop.

### Package map

| Area | Packages and apps |
| --- | --- |
| Runtime | `@agentx/core`, `@agentx/adp` |
| Coordination | `@agentx/orchestrator`, `@agentx/mcp` |
| Operator clients | `@agentx/agx-core`, `@agentx/agx-cli`, `@agentx/agx-herdr`, `apps/agx-web`, `apps/pi-extension` |
| Examples | `apps/demo`, `apps/orchestrator-demo` |
| Product experiments | music scanner apps, Simon CLI, Zettel |

The dependency direction for the runtime is `adp ← core ← orchestrator`. `AgentSessionHost` shares
an LLM and worker pool while keeping conversation state and outbound notifications scoped to each
ADP connection.

## Five-minute start

### Prerequisites

- [mise](https://mise.jdx.dev/) (recommended), which installs the exact Node, pnpm, Bun, and Turso
  versions declared in `mise.toml`; or Node 24.14.0 and pnpm 11.8.0 installed manually.
- Linux, macOS, or another environment supported by Node worker threads.

```bash
mise install
mise exec -- pnpm install --frozen-lockfile
```

### Fast, credential-free example

The orchestrator demo uses local mock executors and reviewers. It requires no model account or
cloud service and completes in a few seconds:

```bash
mise exec -- pnpm exec vp run @agentx/orchestrator#build
mise exec -- pnpm --filter orchestrator-demo start
```

It demonstrates dependency ordering and review remediation. It is a coordination simulation—not
proof that the orchestrator owns remote executors or waits durably for work.

### Live runtime and ADP

To exercise model inference and out-of-band control:

```bash
cp apps/demo/.env.example apps/demo/.env
# Set OPENAI_API_KEY, OPENAI_BASE_URL, and AGENT_MODEL.

# Build the demo and its workspace dependencies.
mise exec -- pnpm exec vp run demo#build

# Terminal 1: start the runtime and ADP server.
mise exec -- pnpm --filter demo start

# Terminal 2: send a prompt, inspect state, then shut down.
mise exec -- pnpm --filter demo admin prompt "Explain the AgentX control plane in one paragraph"
mise exec -- pnpm --filter demo admin inspect
mise exec -- pnpm --filter demo admin shutdown
```

The demo ADP endpoint is intended for a trusted local development machine. ADP currently has no
built-in authentication or method authorization; do not expose port 9222 to an untrusted network.
Worker threads keep expensive tools off the main event loop but are **not** a security sandbox.

## Develop and validate

Run workspace commands from the repository root so the root Vite+ and Vitest configuration is
used. The checks currently run by PR CI are:

```bash
mise exec -- pnpm build
mise exec -- pnpm test
mise exec -- pnpm ast-grep:test
```

Two stricter checks are configured but currently report known repository debt rather than passing:

```bash
mise exec -- pnpm test:coverage # current totals are below the configured global thresholds
mise exec -- pnpm lint          # current type-aware lint reports pre-existing errors
```

They remain visible rather than being weakened; closing those gaps and promoting both to required
CI checks is tracked in the roadmap.

Build one Vite+ task and its dependencies with, for example:

```bash
mise exec -- pnpm exec vp run @agentx/core#build
```

Tests use deterministic fake model boundaries by default; ordinary CI does not spend provider
credits. Real-provider compatibility and model output quality require separate opt-in evaluation.

## Design strengths and boundaries

**Implemented strengths**

- A small embeddable `AgentSession` with injected model, tools, worker pool, and notifier.
- Native provider response messages and tool-call IDs are retained across tool rounds.
- Inference cancellation propagates through an `AbortSignal`.
- ADP supports broadcasts and session-targeted notifications for multi-client hosts.
- DAG, retry, and review primitives have focused unit and integration tests.

**Important current boundaries**

- ADP is unauthenticated and should remain loopback/trusted-network only.
- Session context is in memory; `Memory.compact` is fixed-window truncation, not durable memory.
- Tool workers have no complete timeout/cancellation/backpressure policy.
- Orchestration is event-driven scaffolding; executor ownership and completion semantics need
  hardening before production use.
- The Timers phase is not implemented.
- `@agentx/core` and `@agentx/adp` have package entry points, but the repository does not yet have
  a public release/versioning workflow.

See [the roadmap](docs/roadmap.md) for prioritized work and explicit anti-goals.

## Documentation

- [Roadmap and readiness](docs/roadmap.md)
- [Vite+ task graph and caching](docs/vite-plus-caching.md)
- [Pi extension](apps/pi-extension/README.md)
- [AGX Herdr](packages/agx-herdr/README.md)
- [Zettel CI/CD](docs/zettel-cicd.md)
- [GCP setup for Zettel](docs/gcp-setup.md)

## License

[MIT](LICENSE)
