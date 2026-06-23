import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/DependencyGraph";
import { ExecutionPlan } from "../src/types";

describe("DependencyGraph", () => {
  const mockPlan: ExecutionPlan = {
    planId: "plan-1",
    goal: "Test plan",
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: "1",
        description: "desc1",
        dependencies: [],
        assignedExecutorRole: "default",
        maxRetries: 3,
        acceptanceCriteria: [],
      },
      {
        id: "2",
        description: "desc2",
        dependencies: ["1"],
        assignedExecutorRole: "default",
        maxRetries: 3,
        acceptanceCriteria: [],
      },
      {
        id: "3",
        description: "desc3",
        dependencies: ["1"],
        assignedExecutorRole: "default",
        maxRetries: 3,
        acceptanceCriteria: [],
      },
      {
        id: "4",
        description: "desc4",
        dependencies: ["2", "3"],
        assignedExecutorRole: "default",
        maxRetries: 3,
        acceptanceCriteria: [],
      },
    ],
    milestones: [],
    successCriteria: [],
    reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
  };

  it("should identify ready steps", () => {
    const graph = new DependencyGraph(mockPlan as any);
    expect(graph.getReadySteps()).toHaveLength(1);
    expect(graph.getReadySteps()[0].id).toBe("1");
  });

  it("should update ready steps after completion", () => {
    const graph = new DependencyGraph(mockPlan as any);
    graph.markStarted("1");
    expect(graph.getReadySteps()).toHaveLength(0);

    graph.markCompleted("1");
    const ready = graph.getReadySteps();
    expect(ready).toHaveLength(2);
    expect(ready.map((s) => s.id)).toContain("2");
    expect(ready.map((s) => s.id)).toContain("3");
  });

  it("should handle complex dependencies", () => {
    const graph = new DependencyGraph(mockPlan as any);
    graph.markCompleted("1");
    graph.markCompleted("2");
    expect(graph.getReadySteps().map((s) => s.id)).toEqual(["3"]);

    graph.markCompleted("3");
    expect(graph.getReadySteps().map((s) => s.id)).toEqual(["4"]);
  });

  it("should track plan completion", () => {
    const graph = new DependencyGraph(mockPlan as any);
    expect(graph.isPlanComplete()).toBe(false);

    mockPlan.steps.forEach((s) => graph.markCompleted(s.id));
    expect(graph.isPlanComplete()).toBe(true);
  });

  it("should detect circular dependencies", () => {
    const circularPlan = {
      planId: "circular",
      goal: "fail",
      steps: [
        { id: "1", dependencies: ["2"] },
        { id: "2", dependencies: ["1"] },
      ],
    };
    expect(() => new DependencyGraph(circularPlan as any)).toThrow("Circular dependency");
  });

  it("should handle blocking failures", () => {
    const graph = new DependencyGraph(mockPlan as any);
    expect(graph.hasBlockingFailures()).toBe(false);
    graph.markFailed("1");
    expect(graph.hasBlockingFailures()).toBe(true);
  });

  it("should manage pending reviews", () => {
    const graph = new DependencyGraph(mockPlan as any);
    graph.markStarted("1");
    graph.setPendingReviews("1", ["review-1", "review-2"]);

    expect(graph.isReviewing("1")).toBe(true);

    const finished1 = graph.markReviewPassed("1", "review-1");
    expect(finished1).toBe(false);
    expect(graph.isReviewing("1")).toBe(true);

    const finished2 = graph.markReviewPassed("1", "review-2");
    expect(finished2).toBe(true);
    expect(graph.isReviewing("1")).toBe(false);
    expect(graph.isPlanComplete()).toBe(false); // only step 1 done
  });
});
