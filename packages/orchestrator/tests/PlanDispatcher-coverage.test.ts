/**
 * PlanDispatcher — edge path coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrchestrationBus } from "../src/OrchestrationBus";
import { PlanDispatcher } from "../src/PlanDispatcher";
import { ExecutionPlan } from "../src/types";

describe("PlanDispatcher — session.complete and edge coverage", () => {
  let bus: OrchestrationBus;

  beforeEach(() => {
    bus = new OrchestrationBus();
    new PlanDispatcher(bus);
  });

  it("should dispatch session.complete when all steps done", () => {
    const completeSpy = vi.fn();
    bus.onEvent("session.complete", completeSpy);

    const plan: ExecutionPlan = {
      planId: "complete-1",
      goal: "Test complete flow",
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
      planId: "complete-1",
      stepId: "step-1",
      result: "ok",
    });

    expect(completeSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "session.complete" }));
  });

  it("should dispatch session.failed on unrecoverable review fail", () => {
    const failSpy = vi.fn();
    bus.onEvent("session.failed", failSpy);

    const plan: ExecutionPlan = {
      planId: "stuck-1",
      goal: "Unrecoverable",
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
        passes: [{ id: "pass-1", checklist: ["criterion"] }],
        maxTotalReviewRounds: 0, // No rounds — immediate failure
      },
    };

    bus.dispatch({ type: "plan.created", plan });
    bus.dispatch({
      type: "plan.step.completed",
      planId: "stuck-1",
      stepId: "step-1",
      result: "ok",
    });
    bus.dispatch({
      type: "review.fail",
      planId: "stuck-1",
      stepId: "step-1",
      passId: "pass-1",
      guidance: {
        reviewPassId: "pass-1",
        failedCriteria: ["needs fixing"],
        remediation: [{ stepId: "step-1", specificFix: "fix", severity: "blocker" }],
        roundNumber: 1,
        maxRounds: 0,
      },
    });

    expect(failSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "session.failed" }));
  });

  it("should dispatch session.failed on max executor retries", () => {
    const failSpy = vi.fn();
    bus.onEvent("session.failed", failSpy);

    const plan: ExecutionPlan = {
      planId: "retry-fail-1",
      goal: "Retry exhausted",
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
    // Fail twice to exhaust maxRetries (1)
    bus.dispatch({
      type: "plan.step.failed",
      planId: "retry-fail-1",
      stepId: "step-1",
      error: "Error",
      attempt: 1,
    });
    bus.dispatch({
      type: "plan.step.failed",
      planId: "retry-fail-1",
      stepId: "step-1",
      error: "Error again",
      attempt: 2,
    });

    expect(failSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "session.failed" }));
  });

  it("should dispatch review.started when step has review passes", () => {
    const reviewSpy = vi.fn();
    bus.onEvent("review.started", reviewSpy);

    const plan: ExecutionPlan = {
      planId: "review-1",
      goal: "Review flow",
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
        passes: [
          { id: "pass-1", checklist: ["criterion"] },
          { id: "pass-2", checklist: ["criterion"] },
        ],
        maxTotalReviewRounds: 2,
      },
    };

    bus.dispatch({ type: "plan.created", plan });
    bus.dispatch({
      type: "plan.step.completed",
      planId: "review-1",
      stepId: "step-1",
      result: "ok",
    });

    expect(reviewSpy).toHaveBeenCalledTimes(2);
  });

  it("should handle clarification.needed and clarification.resolved", () => {
    bus.dispatch({
      type: "clarification.needed",
      planId: "clarify-1",
      stepId: "step-1",
      question: "Need input",
      context: { hint: "details" },
    });
    bus.dispatch({
      type: "clarification.resolved",
      planId: "clarify-1",
      stepId: "step-1",
      resolution: "Go ahead",
    });
    // Should not throw
  });
});
