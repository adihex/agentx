<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# agentx

## Purpose

Event-driven AI agent runtime SDK, modeled on the Node.js event loop and the Chrome DevTools Protocol. The runtime (`@agentx/core`) runs a 4-phase event loop (Timers → I/O Callbacks → Inference → Check) and exposes an out-of-band control plane (ADP, `@agentx/adp`) over a WebSocket speaking JSON-RPC 2.0 — letting external frontends pause, halt, inspect, and prompt a live agent. A pnpm + `vite-plus` monorepo of runtime packages, an orchestration layer, TUI/web frontends, and demo service hosts.

## Key Files

| File                               | Description                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `package.json`                     | Workspace root; scripts use `vp` (vite-plus): `build`, `test` (vitest), `dev`, `lint`, `check` |
| `pnpm-workspace.yaml`              | Workspace globs + dependency `catalog:` (pinned shared versions) + `allowBuilds`               |
| `vitest.config.ts`                 | Test include globs (run from repo root, not per-package)                                       |
| `vite.config.ts`                   | Root vite config                                                                               |
| `tsconfig.json`                    | Root TS config; project references per package/app                                             |
| `sgconfig.yml`                     | ast-grep rule config (`rules/`, `rule-tests/`)                                                 |
| `mise.toml`                        | Toolchain pins (node 24, bun, pnpm 11.8.0)                                                     |
| `docker-compose.yml`, `Dockerfile` | Containerized run                                                                              |
| `README.md`                        | Architecture diagram + quick start (note: quick-start commands are partially stale)            |

## Subdirectories

| Directory                     | Purpose                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `packages/core/`              | The runtime: AgentEventLoop, AgenticThreadPool, LLMOrchestrator (see `packages/core/AGENTS.md`)                          |
| `packages/adp/`               | Agent Debugger Protocol — JSON-RPC schemas, WS server & client (see `packages/adp/AGENTS.md`)                            |
| `packages/orchestrator/`      | Multi-agent orchestration layer (see `packages/orchestrator/AGENTS.md`)                                                  |
| `packages/agx-core/`          | CLI state model — reducer, types, display helpers for the TUI (see `packages/agx-core/AGENTS.md`)                        |
| `packages/agx-cli/`           | OpenTUI React CLI + `agx` bin + ADP REPL (see `packages/agx-cli/AGENTS.md`)                                              |
| `packages/agx-herdr/`         | CLI launching a persistent three-pane "herdr" TUI that orchestrates agents over ADP (see `packages/agx-herdr/AGENTS.md`) |
| `packages/mcp/`               | Model Context Protocol integration for the runtime (see `packages/mcp/AGENTS.md`)                                        |
| `apps/music-scanner-service/` | Runtime host — consumes `@agentx/core`, injects tools, listens ADP :9222 (see `apps/music-scanner-service/AGENTS.md`)    |
| `apps/music-scanner-cli/`     | OpenTUI music-scanner CLI client — connects ADP :9222 (see `apps/music-scanner-cli/AGENTS.md`)                           |
| `apps/orchestrator-demo/`     | Demo driver for `@agentx/orchestrator` (see `apps/orchestrator-demo/AGENTS.md`)                                          |
| `apps/demo/`                  | Prototype agent (non-blocking tools + ADP) (see `apps/demo/AGENTS.md`)                                                   |
| `apps/pi-extension/`          | Pi TUI frontend controlling agentx (see `apps/pi-extension/AGENTS.md`)                                                   |
| `apps/agx-web/`               | Web frontend (Vite + React) (see `apps/agx-web/AGENTS.md`)                                                               |
| `apps/music-scanner-web/`     | TanStack Start web app (see `apps/music-scanner-web/AGENTS.md`)                                                          |
| `docs/`                       | Project docs and plans                                                                                                   |
| `rules/`, `rule-tests/`       | ast-grep lint rules and their fixtures                                                                                   |
| `skills/`                     | Repo-local skills                                                                                                        |

## For AI Agents

### Working In This Directory

- Package manager is **pnpm via mise** — the bare `pnpm` shim may not be on PATH. Use `mise exec -- pnpm <cmd>`.
- Shared dependency versions are pinned in `pnpm-workspace.yaml` under `catalog:`. Add a dep there and reference it as `"catalog:"` in the package — do not hardcode versions in package manifests.
- Two runtime classes of package: **library packages** (`core`, `adp`, `orchestrator`, `agx-core`) consumed via `workspace:*`, and **app hosts/clients** (`apps/*`) that wire them together.
- The runtime + CLI are two processes: start `apps/music-scanner-service` (opens ADP WebSocket on **port 9222**), then `apps/music-scanner-cli` connects to `ws://localhost:9222`.

### Testing Requirements

- Run tests from the **repo root**: `mise exec -- pnpm test` (or `pnpm exec vitest run <path>`). The vitest include globs are root-relative, so `pnpm --filter <pkg> test` finds no files.
- Coverage: `pnpm test:coverage`. UI: `pnpm test:ui`.

### Common Patterns

- ESM throughout (`"type": "module"`); intra-monorepo imports use `.js` extensions on `.ts` sources.
- LLM access goes through `@ai-sdk/openai-compatible` (Chat Completions endpoint) — point `OPENAI_BASE_URL` at an API root (e.g. `https://opencode.ai/zen/go/v1`), not at `/chat/completions`.

## Dependencies

### External

- `ai` (Vercel AI SDK) + `@ai-sdk/openai-compatible` — streaming inference with AbortSignal
- `ws` — WebSocket transport for ADP
- `zod` — JSON-RPC schema validation
- `@opentui/core` + `@opentui/react` — terminal UI rendering
- `react` — used by TUIs and web apps
- `vitest`, `vite-plus`, `@ast-grep/cli`, `typescript`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
