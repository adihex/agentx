import { describe, it, expect, beforeEach, vi } from "vitest";
import { OrchestrationBus } from "../src/OrchestrationBus";
import { PlanDispatcher } from "../src/PlanDispatcher";
import { ExecutionPlan, ExecutionPlanSchema } from "../src/types";

describe("PlanDispatcher", () => {
  let bus: OrchestrationBus;
  let dispatcher: PlanDispatcher;

  beforeEach(() => {
    bus = new OrchestrationBus();
    dispatcher = new PlanDispatcher(bus);
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
      steps: [{ id: "step-1", description: "Step 1", dependencies: [] }],
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
      steps: [{ id: "step-1", description: "Step 1", dependencies: [] }],
      milestones: [],
      successCriteria: [],
      reviewConfig: {
        passes: [{ id: "pass-1", criteria: "test" }],
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
    });
  });

  it("should handle review fail with remediation", () => {
    const plan: ExecutionPlan = {
      planId: "test-4",
      goal: "Test goal",
      createdAt: new Date().toISOString(),
      steps: [{ id: "step-1", description: "Step 1", dependencies: [] }],
      milestones: [],
      successCriteria: [],
      reviewConfig: {
        passes: [{ id: "pass-1", criteria: "test" }],
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
      guidance: { failedCriteria: ["criteria"], suggestion: "fix" },
    });
  });

  it("should handle review fail with max rounds", () => {
    const plan: ExecutionPlan = {
      planId: "test-5",
      goal: "Test goal",
      createdAt: new Date().toISOString(),
      steps: [{ id: "step-1", description: "Step 1", dependencies: [] }],
      milestones: [],
      successCriteria: [],
      reviewConfig: {
        passes: [{ id: "pass-1", criteria: "test" }],
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
      guidance: { failedCriteria: ["criteria"], suggestion: "fix" },
    });
  });

  it("should handle clarification.needed", () => {
    bus.dispatch({
      type: "clarification.needed",
      planId: "test-6",
      stepId: "step-1",
      question: "What should I do?",
    });
  });

  it("should handle clarification.resolved", () => {
    bus.dispatch({
      type: "clarification.resolved",
      planId: "test-7",
      stepId: "step-1",
    });
  });

  it("should handle step failure with retry", () => {
    const plan: ExecutionPlan = {
      planId: "test-8",
      goal: "Test goal",
      createdAt: new Date().toISOString(),
      steps: [{ id: "step-1", description: "Step 1", dependencies: [], maxRetries: 2 }],
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
    });
  });

  it("should handle step failure with max retries", () => {
    const plan: ExecutionPlan = {
      planId: "test-9",
      goal: "Test goal",
      createdAt: new Date().toISOString(),
      steps: [{ id: "step-1", description: "Step 1", dependencies: [], maxRetries: 1 }],
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
    });
    bus.dispatch({
      type: "plan.step.failed",
      planId: "test-9",
      stepId: "step-1",
      error: "Error",
    });
  });
});