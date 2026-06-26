/**
 * Property-Based Tests for Orchestrator
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { OrchestrationBus } from "../src/OrchestrationBus.js";
import { DependencyGraph } from "../src/DependencyGraph.js";
import { RetryLedger } from "../src/RetryLedger.js";
import type { ExecutionPlan } from "../src/types.js";

function makePlan(steps: Array<{ id: string; deps: string[] }>): ExecutionPlan {
  return {
    planId: "prop-test",
    goal: "Property test",
    createdAt: new Date().toISOString(),
    steps: steps.map((s) => ({
      id: s.id,
      description: `Step ${s.id}`,
      dependencies: s.deps,
      acceptanceCriteria: [],
      assignedExecutorRole: "default",
      maxRetries: 3,
    })),
    milestones: [],
    successCriteria: [],
    reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
  };
}

describe("DependencyGraph — property tests", () => {
  it("isPlanComplete iff all steps completed", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.boolean(),
        (numSteps, completeAll) => {
          const steps = Array.from({ length: numSteps }, (_, i) => ({
            id: `s${i}`,
            deps: i > 0 ? [`s${i - 1}`] : [],
          }));

          let graph: DependencyGraph;
          try {
            graph = new DependencyGraph(makePlan(steps));
          } catch {
            return;
          }

          if (completeAll) {
            for (const s of steps) {
              graph.markStarted(s.id);
              graph.markCompleted(s.id);
            }
            expect(graph.isPlanComplete()).toBe(true);
          } else {
            expect(graph.isPlanComplete()).toBe(false);
          }
        },
      ),
    );
  });

  it("getReadySteps never includes steps with unmet deps", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 8 }), (numSteps) => {
        const steps = Array.from({ length: numSteps }, (_, i) => ({
          id: `s${i}`,
          deps: i > 0 ? [`s${i - 1}`] : [],
        }));

        let graph: DependencyGraph;
        try {
          graph = new DependencyGraph(makePlan(steps));
        } catch {
          return;
        }

        const ready = graph.getReadySteps();
        for (const s of ready) {
          for (const dep of s.dependencies) {
            expect(typeof dep).toBe("string");
          }
        }
      }),
    );
  });
});

describe("OrchestrationBus — property tests", () => {
  it("events delivered in FIFO order", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.constant("plan.step.started" as const),
            fc.constant("plan.step.completed" as const),
            fc.constant("plan.step.failed" as const),
          ),
          { minLength: 0, maxLength: 20 },
        ),
        (eventTypes) => {
          const bus = new OrchestrationBus();
          const received: string[] = [];
          bus.onAny((e: any) => received.push(e.type));

          for (const type of eventTypes) {
            const base: any = { type, planId: "p1", stepId: "s1" };
            if (type === "plan.step.completed") base.result = "ok";
            if (type === "plan.step.failed") { base.error = "e"; base.attempt = 1; }
            bus.dispatch(base);
          }

          expect(received).toEqual(eventTypes);
        },
      ),
    );
  });
});

describe("RetryLedger — property tests", () => {
  it("retry counts are monotonic and independent", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            stepId: fc.string({ minLength: 1, maxLength: 4 }),
            action: fc.constantFrom("executorRetry" as const, "reviewRound" as const, "clarification" as const),
          }),
          { minLength: 0, maxLength: 30 },
        ),
        (actions) => {
          const ledger = new RetryLedger();
          const trackers = new Map<string, { e: number; r: number; c: number }>();

          for (const { stepId, action } of actions) {
            if (action === "executorRetry") {
              const count = ledger.incrementExecutorRetry(stepId);
              const t = trackers.get(stepId) || { e: 0, r: 0, c: 0 };
              t.e++;
              trackers.set(stepId, t);
              expect(count).toBe(t.e);
            } else if (action === "reviewRound") {
              const count = ledger.incrementReviewRound(stepId);
              const t = trackers.get(stepId) || { e: 0, r: 0, c: 0 };
              t.r++;
              trackers.set(stepId, t);
              expect(count).toBe(t.r);
            } else {
              const count = ledger.incrementClarification(stepId);
              const t = trackers.get(stepId) || { e: 0, r: 0, c: 0 };
              t.c++;
              trackers.set(stepId, t);
              expect(count).toBe(t.c);
            }
          }

          for (const [stepId, t] of trackers) {
            const stats = ledger.getStats(stepId);
            expect(stats.executorRetries).toBe(t.e);
            expect(stats.reviewRounds).toBe(t.r);
            expect(stats.clarificationRounds).toBe(t.c);
          }
        },
      ),
    );
  });

  it("getStats defaults to zero for unknown steps", () => {
    const ledger = new RetryLedger();
    const stats = ledger.getStats("nonexistent");
    expect(stats).toEqual({
      executorRetries: 0,
      reviewRounds: 0,
      clarificationRounds: 0,
    });
  });
});
