---
name: agentx-testing-and-toolchain
description: Operational guide for testing, building, and port allocation in the agentx pnpm/vite-plus monorepo.
---

# agentx testing & toolchain

## Toolchain

- Everything runs through mise: `mise exec -- pnpm <cmd>` from the repo root.
  `mise exec -- vp` cannot exec vp directly — use `pnpm exec vp`.
- Tests: `pnpm exec vitest run [path]` from the ROOT (per-package `test` scripts
  are often `echo 'No tests'` stubs). `pnpm lint` = `vp lint --type-aware
  --type-check`.
- `pnpm build` / `vp run -r build` caches per-task outputs. Every package's
  vite.config build task must list `"src/**"` in `input` — `{auto:true}` alone
  does not fingerprint sources, so vp replays stale `dist/` (verified bug).
  New packages must keep `"src/**"` in their build task input.

## dist/ is shipped, not built-on-the-fly

`@agentx/adp`, `@agentx/core`, `@agentx/orchestrator` resolve `main`/`types` to
`dist/*`. After editing `src/` in one of them, rebuild (`pnpm --filter
<name> build`) before type-checking or running consumers — otherwise they see
stale `.d.ts`/`js` (this once showed a missing `waitForCompletion` in mcp).

## Test port allocation (parallel vitest workers — never reuse)

adp protocol 9224 · core injection 9225/9226 · adp integration 9750 ·
server-coverage-edge 9250/9260 · server-sessions 9280 · client 9400 ·
client-coverage 9500 · client-coverage-edge 9600 · client-hardening 9700 ·
security 9800-9821 · debugger-alias 9830 · core e2e-lifecycle 9850 ·
core integration 9900 · orchestrator dispatcher 50500+ · zettel uses port 0.
Pick a fresh 4-digit port for any new test file and list it here.

## House conventions

- ESM `.js`-suffixed intra-package imports; `AdpDomains.*` constants instead of
  raw method strings; emoji-prefixed logs (`[Loop]`, `[ADP]`, `[Bus] 📢`).
- ast-grep `no-as-any` forbids `as any` in `src/` — tests may use it.
- `AgentSession.compact()` REASSIGNS `this.context` — tests/code holding a
  reference to the old array go stale; always re-read.
- Entry-point side effects: guard CLI/REPL `start()` behind an
  `argv[1] === fileURLToPath(import.meta.url)` check so test files can import
  helpers without spawning sockets.
- Watch for `pnpm exec vitest` runs where a file's test count differs from the
  suite total — overwriting an existing test file silently drops its coverage.
- SQLite/notes ids embed a timestamp + zero-padded suffix — keep the padding or
  `ORDER BY id` ordering breaks past `-9` → `-10`.
- Recurring lint flake: mass `TS2307 Cannot find module 'vitest'` bursts in
  `vp lint --type-aware` are transient — rerun before debugging.
