import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseAgent } from "../src/BaseAgent";
import { OrchestrationBus } from "../src/OrchestrationBus";
describe("BaseAgent", () => {
  let bus: OrchestrationBus;
  let loop: any;
  let _agent: BaseAgent;

  beforeEach(() => {
    bus = new OrchestrationBus();
    loop = {
      on: vi.fn(),
      run: vi.fn().mockResolvedValue("Execution success"),
    };
    _agent = new BaseAgent("test-agent", loop as any, bus);
  });

  it("should respond to plan assignment", async () => {
    const dispatchSpy = vi.spyOn(bus, "dispatch");

    // First set current plan
    bus.dispatch({
      type: "plan.created",
      plan: {
        planId: "plan-1",
        goal: "test",
        steps: [],
        createdAt: new Date().toISOString(),
        milestones: [],
        successCriteria: [],
        reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
      },
    });

    // Assign step
    bus.dispatch({
      type: "plan.step.assigned",
      planId: "plan-1",
      stepId: "step-1",
      executorId: "test-agent",
    });

    // Wait for async execution
    await new Promise((r) => setTimeout(r, 10));

    expect(loop.run).toHaveBeenCalledWith("Execute step: step-1");
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "plan.step.started",
        stepId: "step-1",
      }),
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "plan.step.completed",
        stepId: "step-1",
        result: { text: "Execution success" },
      }),
    );
  });

  it("should handle execution failure", async () => {
    const dispatchSpy = vi.spyOn(bus, "dispatch");
    loop.run.mockRejectedValue(new Error("Test failure"));

    bus.dispatch({
      type: "plan.created",
      plan: { planId: "p1", steps: [] } as any,
    });

    bus.dispatch({
      type: "plan.step.assigned",
      planId: "p1",
      stepId: "s1",
      executorId: "test-agent",
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "plan.step.failed",
        error: "Test failure",
      }),
    );
  });

  it("should ignore steps assigned to other agents", async () => {
    bus.dispatch({
      type: "plan.created",
      plan: { planId: "p1", steps: [] } as any,
    });

    bus.dispatch({
      type: "plan.step.assigned",
      planId: "p1",
      stepId: "s1",
      executorId: "other-agent",
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(loop.run).not.toHaveBeenCalled();
  });
});
