import { describe, it, expect, vi } from "vitest";
import { OrchestrationBus } from "../src/OrchestrationBus";
import { OrchestrationEvent, ExecutionPlan } from "../src/types";

describe("OrchestrationBus", () => {
  const mockPlan: ExecutionPlan = {
    planId: "123",
    goal: "test",
    createdAt: new Date().toISOString(),
    steps: [],
    milestones: [],
    successCriteria: [],
    reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
  };

  it("should dispatch events and call handlers", () => {
    const bus = new OrchestrationBus();
    const handler = vi.fn();

    bus.onEvent("plan.created", handler);

    const event: OrchestrationEvent = {
      type: "plan.created",
      plan: mockPlan,
    };

    bus.dispatch(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it("should support wildcard listeners", () => {
    const bus = new OrchestrationBus();
    const handler = vi.fn();

    bus.onWildcard(handler);

    const event: OrchestrationEvent = {
      type: "plan.step.completed",
      planId: "123",
      stepId: "step-1",
      result: "ok",
    };

    bus.dispatch(event);
    expect(handler).toHaveBeenCalledWith(event);
  });
});
