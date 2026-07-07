<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# orchestrator-demo

## Purpose

A standalone, runnable smoke-test driver for `@agentx/orchestrator`. `src/index.ts` builds a hardcoded two-step `ExecutionPlan` (`step-1` → `step-2`, the second depending on the first) with two review passes (`code-review`, `security-review`), starts an `OrchestratedSession`, and attaches mock listeners on the session bus that play the roles of executor and reviewer. The mock executor completes each assigned step after a 500ms timer; the mock reviewer fails `step-2`'s first review exactly once to exercise the dispatcher's remediation/retry path, then passes everything. The process logs each orchestration event with emoji-prefixed `console.log` lines and exits on `session.complete` (0) or `session.failed` (1), demonstrating end-to-end the event-driven dispatch → execute → review → remediate → complete lifecycle.

## Key Files

| File           | Description                                                                                                                                                                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts` | The entire demo. Constructs `OrchestratedSession`, grabs the bus via `getBus()`, defines an inline `ExecutionPlan`, registers `plan.step.assigned` (mock executor), `review.started` (mock reviewer that fails step-2 once then passes), `session.complete`, and `session.failed` handlers, then calls `session.start(plan)`. |

## For AI Agents

### Working In This Directory

- HOW TO RUN: `pnpm start` (or `pnpm dev`) — both alias `tsx src/index.ts`, so it runs straight from TypeScript with no build step. `pnpm build` (`tsc`) emits to `dist/`; `pnpm test` is a no-op (`echo 'No tests'`).
- WHAT IT PRINTS/DOES: emits a sequence of emoji-tagged log lines — `[Session] 🚀 Starting…`, `[Executor] 🤖 Received step…` / `✅ Completed…`, `[Reviewer] 🧐 Starting review…` with a one-time `❌ Review failed for step-2` then `✅ Review passed…`, ending in `[Demo] 🎉 Session complete…` and `process.exit(0)`. The two 500ms `setTimeout` delays simulate async executor/reviewer work.
- HOW IT USES `@agentx/orchestrator`: imports `OrchestratedSession` and the `ExecutionPlan` type. It does NOT use `BaseAgent`; instead it hand-wires raw listeners onto `session.getBus()` and manually `bus.dispatch()`es `plan.step.completed`, `review.pass`, and `review.fail` (with a `RemediationGuidance` payload) to stand in for real agents/reviewers. The `PlanDispatcher` inside the session drives all assignment, review-gating, and completion logic.

### Testing Requirements

No unit tests (the `test` script just echoes). Validate changes by running it: `pnpm start` and confirm it reaches `🎉 Session complete` and exits 0. If a change breaks dispatch wiring, the process will hang (no terminal event) or exit 1 via `session.failed`.

### Common Patterns

- Listeners are registered with `bus.onEvent(type, handler)` before `session.start(plan)` is called.
- The demo plays both executor and reviewer roles purely by reacting to orchestrator events and dispatching response events back onto the same bus — no `BaseAgent` instances.
- Async work is faked with `setTimeout(…, 500)`.
- A module-scoped `reviewFailsCount` flag makes the step-2 review fail exactly once, deterministically exercising the remediation path before passing.
- `main().catch(console.error)` is the top-level entry; success/failure terminate via `process.exit`.

## Dependencies

### Internal

- `@agentx/orchestrator` (`workspace:*`) — provides `OrchestratedSession` and the `ExecutionPlan` type; its internal `PlanDispatcher`/`DependencyGraph` run the plan.

### External

- `tsx` (`catalog:`) — runs `src/index.ts` directly as TypeScript for `start`/`dev`.
- `typescript` (via root `tsc`) — used only by the `build` script.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
