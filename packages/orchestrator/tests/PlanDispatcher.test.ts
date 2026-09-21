import { describe, it, expect, beforeEach } from "vitest";
import { OrchestrationBus } from "../src/OrchestrationBus";
import { PlanDispatcher } from "../src/PlanDispatcher";
import { ExecutionPlan } from "../src/types";

describe("PlanDispatcher", () => {
  let bus: OrchestrationBus;

  beforeEach(() => {
    bus = new OrchestrationBus();
    new PlanDispatcher(bus);
  });

  it("should handle plan.created event", () => {
    const plan: ExecutionPlan = {
      planId: "test-1",
      goal: "Test goal",
      createdAt: new Date().toISOString(),
      steps: [],
      milestones: [],
      successCriteria: [],
      reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
    };

    bus.dispatch({ type: "plan.created", plan });
  });

  it("should handle step completion with no reviews", () => {
    const plan: ExecutionPlan = {
      planId: "test-2",
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
      ],
      milestones: [],
      successCriteria: [],
      reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
    };

    bus.dispatch({ type: "plan.created", plan });
    bus.dispatch({
      type: "plan.step.completed",
      planId: "test-2",
      stepId: "step-1",
      result: "ok",
    });
  });

  it("should handle step completion with reviews", () => {
    const plan: ExecutionPlan = {
      planId: "test-3",
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
      ],
      milestones: [],
      successCriteria: [],
      reviewConfig: {
        passes: [{ id: "pass-1", checklist: ["test"] }],
        maxTotalReviewRounds: 1,
      },
    };

    bus.dispatch({ type: "plan.created", plan });
    bus.dispatch({
      type: "plan.step.completed",
      planId: "test-3",
      stepId: "step-1",
      result: "ok",
    });

    bus.dispatch({
      type: "review.pass",
      planId: "test-3",
      stepId: "step-1",
      passId: "pass-1",
      round: 1,
    });
  });

  it("should handle review fail with remediation", () => {
    const plan: ExecutionPlan = {
      planId: "test-4",
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
      ],
      milestones: [],
      successCriteria: [],
      reviewConfig: {
        passes: [{ id: "pass-1", checklist: ["test"] }],
        maxTotalReviewRounds: 2,
      },
    };

    bus.dispatch({ type: "plan.created", plan });
    bus.dispatch({
      type: "plan.step.completed",
      planId: "test-4",
      stepId: "step-1",
      result: "ok",
    });

    bus.dispatch({
      type: "review.fail",
      planId: "test-4",
      stepId: "step-1",
      passId: "pass-1",
      guidance: {
        reviewPassId: "pass-1",
        failedCriteria: ["criteria"],
        remediation: [
          {
            stepId: "step-1",
            specificFix: "fix",
            severity: "blocker",
          },
        ],
        roundNumber: 1,
        maxRounds: 2,
      },
    });
  });

  it("should handle review fail with max rounds", () => {
    const plan: ExecutionPlan = {
      planId: "test-5",
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
      ],
      milestones: [],
      successCriteria: [],
      reviewConfig: {
        passes: [{ id: "pass-1", checklist: ["test"] }],
        maxTotalReviewRounds: 0,
      },
    };

    bus.dispatch({ type: "plan.created", plan });
    bus.dispatch({
      type: "plan.step.completed",
      planId: "test-5",
      stepId: "step-1",
      result: "ok",
    });

    bus.dispatch({
      type: "review.fail",
      planId: "test-5",
      stepId: "step-1",
      passId: "pass-1",
      guidance: {
        reviewPassId: "pass-1",
        failedCriteria: ["criteria"],
        remediation: [
          {
            stepId: "step-1",
            specificFix: "fix",
            severity: "blocker",
          },
        ],
        roundNumber: 1,
        maxRounds: 0,
      },
    });
  });

  it("should handle clarification.needed", () => {
    bus.dispatch({
      type: "clarification.needed",
      planId: "test-6",
      stepId: "step-1",
      question: "What should I do?",
      context: null,
    });
  });

  it("should handle clarification.resolved", () => {
    bus.dispatch({
      type: "clarification.resolved",
      planId: "test-7",
      stepId: "step-1",
      resolution: "resolved",
    });
  });

  it("should handle step failure with retry", () => {
    const plan: ExecutionPlan = {
      planId: "test-8",
      goal: "Test goal",
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: "step-1",
          description: "Step 1",
          dependencies: [],
          acceptanceCriteria: [],
          assignedExecutorRole: "default",
          maxRetries: 2,
        },
      ],
      milestones: [],
      successCriteria: [],
      reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
    };

    bus.dispatch({ type: "plan.created", plan });
    bus.dispatch({
      type: "plan.step.failed",
      planId: "test-8",
      stepId: "step-1",
      error: "Error",
      attempt: 1,
    });
  });

  it("should handle step failure with max retries", () => {
    const plan: ExecutionPlan = {
      planId: "test-9",
      goal: "Test goal",
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: "step-1",
          description: "Step 1",
          dependencies: [],
          acceptanceCriteria: [],
          assignedExecutorRole: "default",
          maxRetries: 1,
        },
      ],
      milestones: [],
      successCriteria: [],
      reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
    };

    bus.dispatch({ type: "plan.created", plan });
    bus.dispatch({
      type: "plan.step.failed",
      planId: "test-9",
      stepId: "step-1",
      error: "Error",
      attempt: 1,
    });
    bus.dispatch({
      type: "plan.step.failed",
      planId: "test-9",
      stepId: "step-1",
      error: "Error",
      attempt: 2,
    });
  });

  describe("plan.created while a plan is active", () => {
    const step = (id: string, deps: string[] = [], maxRetries = 3) => ({
      id,
      description: `step ${id}`,
      dependencies: deps,
      acceptanceCriteria: [],
      assignedExecutorRole: "default",
      maxRetries,
    });
    const plan = (planId: string, steps: ReturnType<typeof step>[]): ExecutionPlan => ({
      planId,
      goal: "g",
      createdAt: new Date().toISOString(),
      steps,
      milestones: [],
      successCriteria: [],
      reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
    });

    it("supersedes the running plan on a second plan.created", () => {
      const assigned: string[] = [];
      bus.onEvent("plan.step.assigned", (e) => assigned.push(e.stepId));

      bus.dispatch({ type: "plan.created", plan: plan("p1", [step("a"), step("b", ["a"])]) });
      expect(assigned).toEqual(["a"]);

      bus.dispatch({ type: "plan.created", plan: plan("p2", [step("x")]) });
      expect(assigned).toEqual(["a", "x"]);

      // Events for the superseded plan are now stale and ignored.
      bus.dispatch({ type: "plan.step.completed", planId: "p1", stepId: "a", result: "ok" });
      expect(assigned).toEqual(["a", "x"]);
    });

    it("keeps the running plan intact when the superseding plan is invalid", () => {
      const assigned: string[] = [];
      bus.onEvent("plan.step.assigned", (e) => assigned.push(e.stepId));

      bus.dispatch({ type: "plan.created", plan: plan("p1", [step("a"), step("b", ["a"])]) });
      expect(() =>
        bus.dispatch({
          type: "plan.created",
          plan: plan("bad", [step("x", ["y"]), step("y", ["x"])]),
        }),
      ).toThrow(/circular/i);

      bus.dispatch({ type: "plan.step.completed", planId: "p1", stepId: "a", result: "ok" });
      expect(assigned).toEqual(["a", "b"]);
    });

    it("accepts a new plan once the previous plan has completed", () => {
      const assigned: string[] = [];
      bus.onEvent("plan.step.assigned", (e) => assigned.push(e.stepId));

      bus.dispatch({ type: "plan.created", plan: plan("p1", [step("a")]) });
      bus.dispatch({ type: "plan.step.completed", planId: "p1", stepId: "a", result: "ok" });

      bus.dispatch({ type: "plan.created", plan: plan("p2", [step("x")]) });
      expect(assigned).toEqual(["a", "x"]);
    });

    it("accepts a new plan after the previous one failed terminally", () => {
      const assigned: string[] = [];
      bus.onEvent("plan.step.assigned", (e) => assigned.push(e.stepId));

      bus.dispatch({
        type: "plan.created",
        plan: plan("p1", [step("a", [], 0), step("b")]),
      });
      // "a" has no retry budget, so one failure marks it failed for good.
      bus.dispatch({
        type: "plan.step.failed",
        planId: "p1",
        stepId: "a",
        error: "boom",
        attempt: 1,
      });

      bus.dispatch({ type: "plan.created", plan: plan("p2", [step("x")]) });
      expect(assigned).toEqual(["a", "b", "x"]);
    });

    it("rejects an invalid plan when idle without corrupting state", () => {
      const assigned: string[] = [];
      bus.onEvent("plan.step.assigned", (e) => assigned.push(e.stepId));

      bus.dispatch({ type: "plan.created", plan: plan("p1", [step("a")]) });
      bus.dispatch({ type: "plan.step.completed", planId: "p1", stepId: "a", result: "ok" });

      expect(() =>
        bus.dispatch({
          type: "plan.created",
          plan: plan("bad", [step("x", ["y"]), step("y", ["x"])]),
        }),
      ).toThrow(/circular/i);

      // The failed replacement leaves no residue: a valid plan still runs.
      bus.dispatch({ type: "plan.created", plan: plan("p2", [step("z")]) });
      expect(assigned).toEqual(["a", "z"]);
    });
  });
});
