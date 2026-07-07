/**
 * Orchestrator Coverage — BaseAgent, OrchestrationBus edge paths
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OrchestrationBus } from "../src/OrchestrationBus";
import { DependencyGraph } from "../src/DependencyGraph";
import { ExecutionPlan, OrchestrationEvent } from "../src/types";

describe("OrchestrationBus — edge coverage", () => {
  let bus: OrchestrationBus;

  beforeEach(() => {
    bus = new OrchestrationBus();
  });

  it("should dispatch events with '*' and 'event' channels", () => {
    const wildcardFn = vi.fn();
    const anyFn = vi.fn();

    bus.onWildcard(wildcardFn);
    bus.onAny(anyFn);

    bus.dispatch({
      type: "clarification.needed",
      planId: "plan-1",
      stepId: "step-1",
      question: "What?",
      context: null,
    });

    expect(wildcardFn).toHaveBeenCalled();
    expect(anyFn).toHaveBeenCalled();
  });

  it("should dispatch events to typed listeners", () => {
    const fn = vi.fn();
    bus.onEvent("session.complete", fn);

    bus.dispatch({
      type: "session.complete",
      planId: "plan-1",
      summary: "All done",
    });

    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "session.complete",
        planId: "plan-1",
      }),
    );
  });

  it("should dispatch events with planId context", () => {
    const fn = vi.fn();
    bus.onEvent("plan.step.started", fn);

    bus.dispatch({
      type: "plan.step.started",
      planId: "plan-1",
      stepId: "step-1",
      executorId: "agent-1",
    });

    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "plan.step.started",
        planId: "plan-1",
        stepId: "step-1",
        executorId: "agent-1",
      }),
    );
  });
});

describe("DependencyGraph — edge coverage", () => {
  const minimalPlan: ExecutionPlan = {
    planId: "test",
    goal: "Test goal",
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: "step-1",
        description: "Step 1",
        dependencies: [],
        acceptanceCriteria: [],
        assignedExecutorRole: "default",
        maxRetries: 3,
      },
      {
        id: "step-2",
        description: "Step 2",
        dependencies: ["step-1"],
        acceptanceCriteria: [],
        assignedExecutorRole: "default",
        maxRetries: 3,
      },
    ],
    milestones: [],
    successCriteria: [],
    reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
  };

  it("should detect circular dependencies and throw", () => {
    const cyclicPlan: ExecutionPlan = {
      ...minimalPlan,
      steps: [
        {
          id: "step-1",
          description: "Step 1",
          dependencies: ["step-2"],
          acceptanceCriteria: [],
          assignedExecutorRole: "default",
          maxRetries: 3,
        },
        {
          id: "step-2",
          description: "Step 2",
          dependencies: ["step-1"],
          acceptanceCriteria: [],
          assignedExecutorRole: "default",
          maxRetries: 3,
        },
      ],
    };

    expect(() => new DependencyGraph(cyclicPlan)).toThrow("Circular dependency");
  });

  it("should detect self-referencing circular dependencies", () => {
    const selfCyclicPlan: ExecutionPlan = {
      ...minimalPlan,
      steps: [
        {
          id: "step-1",
          description: "Step 1",
          dependencies: ["step-1"],
          acceptanceCriteria: [],
          assignedExecutorRole: "default",
          maxRetries: 3,
        },
      ],
    };

    expect(() => new DependencyGraph(selfCyclicPlan)).toThrow("Circular dependency");
  });

  it("should track pending review passes and mark them completed", () => {
    const graph = new DependencyGraph(minimalPlan);
    graph.markStarted("step-1");
    graph.setPendingReviews("step-1", ["pass-A", "pass-B"]);

    expect(graph.isReviewing("step-1")).toBe(true);

    // Mark pass-A — should not complete step yet
    expect(graph.markReviewPassed("step-1", "pass-A")).toBe(false);
    expect(graph.isReviewing("step-1")).toBe(true);

    // Mark pass-B — should complete the step
    expect(graph.markReviewPassed("step-1", "pass-B")).toBe(true);
    expect(graph.isReviewing("step-1")).toBe(false);
  });

  it("should return false for markReviewPassed on non-reviewing step", () => {
    const graph = new DependencyGraph(minimalPlan);
    expect(graph.markReviewPassed("step-1", "pass-X")).toBe(false);
  });

  it("should detect plan completion", () => {
    const graph = new DependencyGraph(minimalPlan);
    expect(graph.isPlanComplete()).toBe(false);

    graph.markStarted("step-1");
    graph.markCompleted("step-1");

    expect(graph.isPlanComplete()).toBe(false);

    graph.markStarted("step-2");
    graph.markCompleted("step-2");

    expect(graph.isPlanComplete()).toBe(true);
  });

  it("should detect blocking failures", () => {
    const graph = new DependencyGraph(minimalPlan);
    expect(graph.hasBlockingFailures()).toBe(false);

    graph.markFailed("step-1");
    expect(graph.hasBlockingFailures()).toBe(true);
  });

  it("getReadySteps should exclude completed, in-progress, and failed steps", () => {
    const graph = new DependencyGraph(minimalPlan);

    const ready = graph.getReadySteps();
    expect(ready).toHaveLength(1);
    expect(ready[0].id).toBe("step-1");

    graph.markStarted("step-1");
    expect(graph.getReadySteps()).toHaveLength(0);

    graph.markCompleted("step-1");
    const ready2 = graph.getReadySteps();
    expect(ready2).toHaveLength(1);
    expect(ready2[0].id).toBe("step-2");
  });
});
