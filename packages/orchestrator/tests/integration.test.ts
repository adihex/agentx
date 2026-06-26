/**
 * Integration Test: Orchestrator end-to-end workflow
 * Tests PlanDispatcher + DependencyGraph + OrchestrationBus + RetryLedger
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrchestrationBus } from "../src/OrchestrationBus";
import { PlanDispatcher } from "../src/PlanDispatcher";
import { DependencyGraph } from "../src/DependencyGraph";
import { RetryLedger } from "../src/RetryLedger";
import { ExecutionPlan } from "../src/types";

function makePlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  return {
    planId: "integ-1",
    goal: "Integration test plan",
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: "step-1",
        description: "First step — no deps",
        dependencies: [],
        acceptanceCriteria: [],
        assignedExecutorRole: "default",
        maxRetries: 2,
      },
      {
        id: "step-2",
        description: "Second step — depends on step-1",
        dependencies: ["step-1"],
        acceptanceCriteria: [],
        assignedExecutorRole: "default",
        maxRetries: 2,
      },
      {
        id: "step-3",
        description: "Third step — depends on step-1 and step-2",
        dependencies: ["step-1", "step-2"],
        acceptanceCriteria: [],
        assignedExecutorRole: "default",
        maxRetries: 1,
      },
    ],
    milestones: [],
    successCriteria: [],
    reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
    ...overrides,
  };
}

describe("Orchestrator Integration — Full Workflow", () => {
  let bus: OrchestrationBus;

  beforeEach(() => {
    bus = new OrchestrationBus();
  });

  it("should complete a plan with no reviews end-to-end", () => {
    const events: any[] = [];
    bus.onAny((e) => events.push(e));

    const plan = makePlan();
    new PlanDispatcher(bus);

    // Start the plan
    bus.dispatch({ type: "plan.created", plan });

    // Step-1 should be assigned (no deps)
    expect(events.some((e) => e.type === "plan.step.assigned" && e.stepId === "step-1")).toBe(true);

    // Complete step-1
    bus.dispatch({
      type: "plan.step.completed",
      planId: plan.planId,
      stepId: "step-1",
      result: "ok",
    });

    // Step-2 should be assigned (dep on step-1 met)
    expect(events.some((e) => e.type === "plan.step.assigned" && e.stepId === "step-2")).toBe(true);

    // Complete step-2
    bus.dispatch({
      type: "plan.step.completed",
      planId: plan.planId,
      stepId: "step-2",
      result: "ok",
    });

    // Step-3 should be assigned (deps on step-1 AND step-2 met)
    expect(events.some((e) => e.type === "plan.step.assigned" && e.stepId === "step-3")).toBe(true);

    // Complete step-3
    bus.dispatch({
      type: "plan.step.completed",
      planId: plan.planId,
      stepId: "step-3",
      result: "ok",
    });

    // Session should be complete
    expect(events.some((e) => e.type === "session.complete")).toBe(true);
  });

  it("should handle step failure with retry then success", () => {
    const events: any[] = [];
    bus.onAny((e) => events.push(e));

    const plan = makePlan();
    new PlanDispatcher(bus);

    bus.dispatch({ type: "plan.created", plan });

    // Fail step-1 (attempt 1)
    bus.dispatch({
      type: "plan.step.failed",
      planId: plan.planId,
      stepId: "step-1",
      error: "Boom",
      attempt: 1,
    });

    // Should have scheduled retry
    const retryAssignment = events.find(
      (e) =>
        e.type === "plan.step.assigned" &&
        e.stepId === "step-1" &&
        (e as any).executorId === "auto-retry",
    );
    expect(retryAssignment).toBeDefined();

    // Now succeed step-1
    bus.dispatch({
      type: "plan.step.completed",
      planId: plan.planId,
      stepId: "step-1",
      result: "ok after retry",
    });

    expect(events.some((e) => e.type === "plan.step.assigned" && e.stepId === "step-2")).toBe(true);
  });

  it("should fail session when max retries exhausted", () => {
    const events: any[] = [];
    bus.onAny((e) => events.push(e));

    const plan = makePlan();
    new PlanDispatcher(bus);

    bus.dispatch({ type: "plan.created", plan });

    // Exhaust maxRetries=2 for step-1 (need 3 failures: 0→1→2→fail)
    bus.dispatch({
      type: "plan.step.failed",
      planId: plan.planId,
      stepId: "step-1",
      error: "Boom",
      attempt: 1,
    });
    bus.dispatch({
      type: "plan.step.failed",
      planId: plan.planId,
      stepId: "step-1",
      error: "Boom again",
      attempt: 2,
    });
    bus.dispatch({
      type: "plan.step.failed",
      planId: plan.planId,
      stepId: "step-1",
      error: "Boom final",
      attempt: 3,
    });

    expect(events.some((e) => e.type === "session.failed")).toBe(true);
  });

  it("should track retry counts correctly in ledger", () => {
    const ledger = new RetryLedger();

    expect(ledger.incrementExecutorRetry("step-1")).toBe(1);
    expect(ledger.incrementExecutorRetry("step-1")).toBe(2);
    expect(ledger.incrementReviewRound("step-1")).toBe(1);
    expect(ledger.incrementClarification("step-1")).toBe(1);

    const stats = ledger.getStats("step-1");
    expect(stats.executorRetries).toBe(2);
    expect(stats.reviewRounds).toBe(1);
    expect(stats.clarificationRounds).toBe(1);

    // Independent step tracking
    expect(ledger.getStats("step-2").executorRetries).toBe(0);
  });

  it("should detect circular dependencies at graph construction", () => {
    const cyclicPlan: ExecutionPlan = {
      planId: "cyclic",
      goal: "Cyclic",
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: "A",
          description: "A",
          dependencies: ["B"],
          acceptanceCriteria: [],
          assignedExecutorRole: "x",
          maxRetries: 1,
        },
        {
          id: "B",
          description: "B",
          dependencies: ["A"],
          acceptanceCriteria: [],
          assignedExecutorRole: "x",
          maxRetries: 1,
        },
      ],
      milestones: [],
      successCriteria: [],
      reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
    };

    expect(() => new DependencyGraph(cyclicPlan)).toThrow("Circular dependency");
  });

  it("should support '*' wildcard and 'event' catch-all listeners", () => {
    const wildcardEvents: any[] = [];
    const anyEvents: any[] = [];

    bus.onWildcard((e) => wildcardEvents.push(e));
    bus.onAny((e) => anyEvents.push(e));

    bus.dispatch({
      type: "clarification.needed",
      planId: "p1",
      stepId: "s1",
      question: "?",
      context: null,
    });

    expect(wildcardEvents).toHaveLength(1);
    expect(anyEvents).toHaveLength(1);
  });
});
