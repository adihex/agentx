<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-06-23 | Updated: 2026-06-23 -->

# orchestrator

## Purpose

`@agentx/orchestrator` is the multi-agent coordination layer that drives a DAG-based execution plan to completion. A plan is a set of steps with dependencies, acceptance criteria, retry budgets, and review passes. The package turns that plan into a running session: an event bus broadcasts orchestration events, a dependency graph tracks which steps are ready to run, a plan dispatcher reacts to events to assign work and trigger reviews, a retry ledger enforces per-step retry/review budgets to prevent infinite loops, and base agents wrap `@agentx/core` event loops to execute assigned steps. All coordination is event-driven and in-process; the design is explicitly meant to be swappable for a distributed bus (NATS/Redis) later.

## Key Files

| File                         | Description                                                                                                                                                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types.ts`               | Zod schemas (`PlanStepSchema`, `ReviewPassSchema`, `ExecutionPlanSchema`, `RemediationGuidanceSchema`) and inferred types, plus the `OrchestrationEvent` discriminated union that every component speaks.                                                                           |
| `src/OrchestrationBus.ts`    | `OrchestrationBus extends EventEmitter`; `dispatch()` emits per-type, `"event"`, and `"*"` channels; `onEvent`/`onAny`/`onWildcard` subscribe. The shared transport for all components.                                                                                             |
| `src/DependencyGraph.ts`     | Tracks per-step state (completed/failed/in-progress/pending-reviews). Validates the DAG has no cycles on construction, computes `getReadySteps()`, and gates step completion behind pending review passes.                                                                          |
| `src/RetryLedger.ts`         | Per-step budget tracker (`executorRetries`, `reviewRounds`, `clarificationRounds`) with lazy-initialized `getStats()` and `increment*` methods. Prevents runaway retry/review loops.                                                                                                |
| `src/PlanDispatcher.ts`      | The control brain. Subscribes to bus events; on `plan.created` builds the graph and assigns ready steps, on step completion triggers review passes (or auto-accepts when none), handles `review.pass`/`review.fail` remediation, and retries or fails steps against ledger budgets. |
| `src/OrchestratedSession.ts` | Thin entry point: owns a private `OrchestrationBus` + `PlanDispatcher`, validates a plan with `ExecutionPlanSchema.parse`, and dispatches `plan.created` to kick off the session. `getBus()` exposes the bus for wiring agents/listeners.                                           |
| `src/BaseAgent.ts`           | Wraps a `@agentx/core` `AgentEventLoop`; on a matching `plan.step.assigned` it runs the loop for that step and dispatches `plan.step.started`/`completed`/`failed` back to the bus. Bridges internal loop events to bus events.                                                     |
| `src/index.ts`               | Barrel re-export of all of the above.                                                                                                                                                                                                                                               |

## For AI Agents

### Working In This Directory

Data flows entirely through the `OrchestrationBus`. `OrchestratedSession.start(plan)` validates the plan and emits `plan.created`. The `PlanDispatcher` (constructed with the bus) catches it, builds a `DependencyGraph`, and emits `plan.step.assigned` (executorId `"pool-default"`) for every step whose dependencies are already completed. A `BaseAgent` whose id matches the assignment (or the `"pool-default"` → `"default-executor"` special case) runs its `AgentEventLoop` and emits `plan.step.completed`. The dispatcher then either auto-accepts the step (no review passes) or registers pending reviews and emits `review.started` per pass. External reviewers respond with `review.pass`/`review.fail`; once all passes clear, the step is marked complete and the next wave of ready steps is dispatched. When the graph reports `isPlanComplete()`, the dispatcher emits `session.complete`.

- To add an agent: construct `new BaseAgent(id, loop, bus)` against the session's bus (`session.getBus()`). It self-wires to assignment events in its constructor. Match its `id` to the `executorId` the dispatcher uses, or rely on the `pool-default`/`default-executor` fallback. Note: the dispatcher currently always assigns to `"pool-default"`, `"auto-retry"`, or `"remediation-executor"` rather than `step.assignedExecutorRole`, so executor-role routing is not yet wired through.
- To add a plan step: append a `PlanStep` to `plan.steps` with a unique `id`, its `dependencies` (step ids that must complete first), optional `acceptanceCriteria`, `assignedExecutorRole`, and `maxRetries`. The graph rejects any plan containing a dependency cycle at construction time.
- Concurrency/dependency semantics: `getReadySteps()` returns every step whose dependencies are all completed and that is not itself completed/in-progress/failed, so independent steps fan out and are dispatched together. A step is only "completed" once all its review passes have passed (`markReviewPassed` returns true on the last one). Retry budgets are per-step: executor failures retry up to `step.maxRetries` (then `session.failed`); review failures re-execute via `"remediation-executor"` up to `reviewConfig.maxTotalReviewRounds` (then `session.failed`). On a review failure the step is marked failed then immediately re-started in the graph so it can be remediated.

### Testing Requirements

Tests run from the repo root via Vitest (`vitest run`, also the package's `test` script). The `tests/` directory has a unit suite per component — `OrchestrationBus`, `DependencyGraph`, `RetryLedger`, `PlanDispatcher`, `OrchestratedSession`, and `BaseAgent` — covering dispatch/subscription, ready-step computation, cycle detection, pending-review gating, retry/review budget exhaustion, remediation paths, and the agent's assignment/execution/failure handling (with a mocked loop). Add a matching test alongside any new component or event-handling branch.

### Common Patterns

- Every cross-component message is an `OrchestrationEvent` from the discriminated union in `types.ts`; components never call each other directly, they dispatch and subscribe on the bus.
- Plans are validated with Zod at the boundary (`ExecutionPlanSchema.parse` in `OrchestratedSession.start`); schema defaults (e.g. `dependencies: []`, `maxRetries: 3`) mean partial plans fill in.
- State is held in `Set`/`Map` structures inside `DependencyGraph` and `RetryLedger`; budgets are checked before incrementing.
- Console logging with emoji prefixes (`[Bus] 📢`, `[Dispatcher] 📋`, `[Agent] 🚀`) is the current observability mechanism.
- Several handlers (`clarification.needed`/`resolved`, tool event hooks in `BaseAgent`) are intentional stubs marked for a "real implementation" — extend rather than replace them.

## Dependencies

### Internal

- `@agentx/core` — provides `AgentEventLoop`, the per-agent runtime that `BaseAgent` wraps and runs.
- `@agentx/adp` — declared dependency (Agent Debug Protocol layer); not directly imported by `src/` yet.

### External

- `zod` — schema definitions and runtime plan validation.
- `node:events` — `EventEmitter` base class for `OrchestrationBus`.
- `vitest` (dev), `typescript` (dev), `@types/node` (dev), `typedoc` (docs generation).

## Subdirectories

| Directory | Purpose                                            |
| --------- | -------------------------------------------------- |
| `docs/`   | Generated TypeDoc API reference (do not hand-edit) |

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
