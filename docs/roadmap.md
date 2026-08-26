# AgentX roadmap and readiness

This roadmap reflects the repository as of August 2026. It is intentionally ordered around
correctness, security, and developer trust rather than feature count. Comparative research against
larger coding-agent projects informed the priorities, but every current-state claim below was
checked against AgentX source and configuration.

## Positioning

AgentX should remain a compact, embeddable runtime with a debugger-like remote control plane. Its
distinctive pieces are ADP, session-routed live control, injected runtime dependencies, and native
tool-call history. It should learn from mature agent products' lifecycle, policy, persistence, and
release contracts without copying their full coding TUI, provider catalog, daemon, plugin system,
or trusted-code execution environments.

## Current readiness

| Area | Verified state | Readiness implication |
| --- | --- | --- |
| Runtime | `AgentSession` runs one streamed inference step, ingests paired tool results, and supports cancellation. The Timers phase is a placeholder. | Promising kernel; scheduler claims must remain narrow. |
| Control plane | ADP validates JSON-RPC envelopes and routes notifications per client. It has no built-in authentication, authorization, origin policy, or request limits. | Trusted local use only. Network exposure is a release blocker. |
| Tools | Registered module-backed tools can run in worker threads. Rejection, timeout, cancellation, worker-exit, and queue-bound semantics are incomplete. | Worker isolation is responsiveness, not sandboxing or complete reliability. |
| State | Conversation context is in memory. Compaction retains a small recent window. | No restart recovery, resume/fork, or durable memory contract. |
| Orchestration | Typed plans, DAG scheduling, retry ledgers, and review events exist. Executor routing and terminal completion ownership are incomplete. | Useful prototype and simulation; not yet a durable orchestration service. |
| Tests | Focused Vitest suites, property tests, coverage thresholds, and some real WebSocket tests exist. | Good local foundation; CI must execute it consistently. |
| Delivery | Zettel has deployment automation. SDK packages lack a changelog/version policy, pack-consumer smoke test, and publish workflow. | Do not infer public SDK stability from the current `1.0.0` package versions. |

## Now — correctness and safety foundation

1. **Secure and version ADP.** Default standalone servers to loopback; add authenticated handshake,
   capabilities/protocol version, method scopes, payload limits, and audit events. Preserve an
   explicit insecure-local development mode.
2. **Make run completion deterministic.** Define run IDs and one terminal
   `completed | halted | failed` outcome; serialize overlapping runs; ensure tool-bearing turns
   settle without caller timing assumptions; make pause and shutdown race-safe.
3. **Bound tool execution.** Validate arguments before dispatch, add fail-closed policy hooks,
   queue bounds, per-tool timeout, cancellation, worker replacement, output limits, and typed
   failures. Never describe worker threads as a sandbox.
4. **Harden ADP transport.** Ensure one handler produces at most one response; distinguish parse,
   invalid-request, and handler errors; reject pending client requests on close/error/timeout.
5. **Make orchestration status truthful.** Route by declared executor role, reject invalid
   dependency references and duplicate IDs, ignore stale/foreign events, and define whether
   `start()` means accepted or terminal completion.
6. **Establish required PR quality gates.** Build, lint/typecheck, test with coverage, ast-grep rule
   tests, a process smoke, and packed-package consumer checks without paid-provider calls.

## Next — durable, usable contracts

1. Add an injectable, versioned append-only session store with crash recovery, owner-only file
   permissions, redaction/retention policy, and reload tests.
2. Add token-aware compaction with complete tool-turn boundaries and an optional failure-safe
   summarizer. Raw durable events remain the source of truth.
3. Replace untyped lifecycle-event consumption with a discriminated event union, stable IDs,
   timestamps, documented ordering, and separate observer versus veto-hook semantics.
4. Introduce an executor registry that owns assignment promises, retries, clarification,
   cancellation, reviews, and cleanup.
5. Introduce a small injectable provider registry while retaining the current gateway-friendly
   routing as a compatibility resolver.
6. Stabilize `@agentx/core` and `@agentx/adp`: package metadata, package READMEs, changelog and
   semver policy, tarball import/require smoke tests, provenance, and explicit release approval.
7. Polish the operator path around secure connection profiles, session selection, run state,
   tool policy, and confirmation for privileged commands.

## Later — only after measured demand

- Multi-process daemon recovery and leases.
- Durable subagent trees and distributed orchestration transports.
- Optional encrypted or remote persistence.
- Broader OAuth/provider-catalog UX for a first-party product.
- Opt-in behavioral evaluations with replay corpora and explicit cost/latency/quality budgets.
- A constrained, versioned extension SDK for trusted host-packaged extensions.

## Anti-goals

- Do not recreate a full coding-agent product inside the runtime kernel.
- Do not add Python/IPython or model-generated code execution as the default orchestration model.
- Do not expose ADP remotely before authentication and authorization exist.
- Do not call truncation “durable memory” or make generated summaries the only source of truth.
- Do not retry side-effecting tools without idempotency and visible attempt state.
- Do not run paid-provider tests in ordinary CI.
- Do not add remote telemetry without a product need, consent, redaction, and disable semantics.

## Release criteria for a flagship SDK

A public stable release should require all of the following:

- clean-clone setup succeeds on the pinned toolchain;
- required PR checks pass for build, type-aware lint, unit/integration tests, and coverage;
- ADP remote exposure has an authenticated, scoped protocol and security documentation;
- run/tool/session terminal semantics are deterministic under race and failure tests;
- packed ESM and CommonJS consumers pass in a temporary project;
- package metadata, API docs, changelog, compatibility policy, and release provenance exist;
- examples distinguish deterministic mocks from real-provider tests and document expected output;
- no roadmap-only capability is presented as implemented.
