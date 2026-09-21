import { describe, it, expect, beforeEach, vi } from "vitest";
import { OrchestrationBus } from "../src/OrchestrationBus";
import { PlanDispatcher } from "../src/PlanDispatcher";
import { OrchestratedSession } from "../src/OrchestratedSession";
import { ExecutionPlan, PlanStep } from "../src/types";

function makeStep(id: string, overrides: Partial<PlanStep> = {}): PlanStep {
  return {
    id,
    description: `Step ${id}`,
    dependencies: [],
    acceptanceCriteria: [],
    assignedExecutorRole: "default",
    maxRetries: 3,
    ...overrides,
  };
}

function makePlan(planId: string, steps: PlanStep[], reviewPasses = 0): ExecutionPlan {
  return {
    planId,
    goal: "Test goal",
    createdAt: new Date().toISOString(),
    steps,
    milestones: [],
    successCriteria: [],
    reviewConfig: {
      passes: Array.from({ length: reviewPasses }, (_, i) => ({
        id: `pass-${i}`,
        checklist: ["check"],
      })),
      maxTotalReviewRounds: 1,
    },
  };
}

describe("truthful orchestration status", () => {
  let bus: OrchestrationBus;

  beforeEach(() => {
    bus = new OrchestrationBus();
    new PlanDispatcher(bus);
  });

  describe("plan validation", () => {
    it("rejects duplicate step ids", async () => {
      const session = new OrchestratedSession();
      const plan = makePlan("dup", [makeStep("a"), makeStep("a")]);
      await expect(session.start(plan)).rejects.toThrow(/duplicate/i);
    });

    it("rejects dependencies on unknown steps", async () => {
      const session = new OrchestratedSession();
      const plan = makePlan("dangling", [makeStep("a", { dependencies: ["ghost"] })]);
      await expect(session.start(plan)).rejects.toThrow(/ghost/);
    });

    it("rejects self-dependencies", async () => {
      const session = new OrchestratedSession();
      const plan = makePlan("selfdep", [makeStep("a", { dependencies: ["a"] })]);
      await expect(session.start(plan)).rejects.toThrow();
    });
  });

  describe("executor-role routing", () => {
    it("assigns steps to their declared executor role", () => {
      const spy = vi.fn();
      bus.onEvent("plan.step.assigned", spy);

      bus.dispatch({
        type: "plan.created",
        plan: makePlan("role-plan", [
          makeStep("code-step", { assignedExecutorRole: "coder" }),
          makeStep("docs-step", { assignedExecutorRole: "docs" }),
        ]),
      });

      const assigned = new Map(
        spy.mock.calls.map(([e]) => [e.stepId, e.executorId] as const),
      );
      expect(assigned.get("code-step")).toBe("coder");
      expect(assigned.get("docs-step")).toBe("docs");
    });

    it("falls back to pool-default for the default role", () => {
      const spy = vi.fn();
      bus.onEvent("plan.step.assigned", spy);

      bus.dispatch({
        type: "plan.created",
        plan: makePlan("default-plan", [makeStep("s")]),
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ stepId: "s", executorId: "pool-default" }),
      );
    });
  });

  describe("stale events", () => {
    it("ignores step completions from a superseded plan", () => {
      const reviewSpy = vi.fn();
      const failSpy = vi.fn();
      bus.onEvent("review.started", reviewSpy);
      bus.onEvent("session.failed", failSpy);

      bus.dispatch({ type: "plan.created", plan: makePlan("plan-A", [makeStep("a")], 1) });
      // Plan B supersedes plan A.
      bus.dispatch({ type: "plan.created", plan: makePlan("plan-B", [makeStep("b")], 1) });

      // A stale completion for plan A must not trigger reviews against plan B.
      bus.dispatch({ type: "plan.step.completed", planId: "plan-A", stepId: "a", result: null });
      expect(reviewSpy).not.toHaveBeenCalled();

      // The active plan's completion does trigger reviews.
      bus.dispatch({ type: "plan.step.completed", planId: "plan-B", stepId: "b", result: null });
      expect(reviewSpy).toHaveBeenCalledWith(
        expect.objectContaining({ stepId: "b", planId: "plan-B" }),
      );
      expect(failSpy).not.toHaveBeenCalled();
    });

    it("ignores events for unknown step ids in the active plan", () => {
      const reviewSpy = vi.fn();
      const failedSpy = vi.fn();
      bus.onEvent("review.started", reviewSpy);
      bus.onEvent("session.failed", failedSpy);

      bus.dispatch({ type: "plan.created", plan: makePlan("plan-C", [makeStep("a")], 1) });

      bus.dispatch({
        type: "plan.step.completed",
        planId: "plan-C",
        stepId: "does-not-exist",
        result: null,
      });
      bus.dispatch({
        type: "plan.step.failed",
        planId: "plan-C",
        stepId: "does-not-exist",
        error: "boom",
        attempt: 1,
      });

      expect(reviewSpy).not.toHaveBeenCalled();
      expect(failedSpy).not.toHaveBeenCalled();
    });

    it("ignores review results for steps not under review", () => {
      const assignedSpy = vi.fn();
      bus.onEvent("plan.step.assigned", assignedSpy);

      bus.dispatch({ type: "plan.created", plan: makePlan("plan-D", [makeStep("a")], 1) });
      assignedSpy.mockClear();

      // Review pass for a step that never started review → ignored.
      bus.dispatch({
        type: "review.fail",
        planId: "plan-D",
        passId: "pass-0",
        stepId: "a",
        guidance: {
          reviewPassId: "pass-0",
          failedCriteria: ["x"],
          remediation: [],
          roundNumber: 1,
          maxRounds: 1,
        },
      });
      expect(assignedSpy).not.toHaveBeenCalled();
    });
  });
});
