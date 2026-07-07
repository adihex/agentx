/**
 * Orchestrator BaseAgent — coverage for wireEvents and executeStep
 */
import { describe, it, expect, vi } from "vitest";
import { BaseAgent } from "../src/BaseAgent";
import { OrchestrationBus } from "../src/OrchestrationBus";

vi.mock("@agentx/core", () => {
  const EventEmitter = require("node:events").EventEmitter;
  return {
    AgentEventLoop: vi.fn().mockImplementation(function () {
      const emitter = new EventEmitter();
      return {
        ...emitter,
        run: vi.fn().mockResolvedValue("Step result"),
        on: emitter.on.bind(emitter),
        emit: emitter.emit.bind(emitter),
      };
    }),
  };
});

describe("BaseAgent coverage", () => {
  it("should wire events and dispatch step results", async () => {
    const bus = new OrchestrationBus();
    const { AgentEventLoop } = await import("@agentx/core");
    const loop = new (AgentEventLoop as any)();
    const agent = new BaseAgent("agent-1", loop as any, bus);

    const startedSpy = vi.fn();
    const completedSpy = vi.fn();

    bus.onEvent("plan.step.started", startedSpy);
    bus.onEvent("plan.step.completed", completedSpy);

    // Emit plan.created to set currentPlanId
    bus.dispatch({
      type: "plan.created",
      plan: {
        planId: "plan-1",
        goal: "Test",
        createdAt: new Date().toISOString(),
        steps: [],
        milestones: [],
        successCriteria: [],
        reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
      },
    });

    // Emit plan.step.assigned to trigger executeStep
    bus.dispatch({
      type: "plan.step.assigned",
      planId: "plan-1",
      stepId: "step-1",
      executorId: "agent-1",
    });

    // Wait for the async executeStep
    await new Promise((r) => setTimeout(r, 50));

    expect(startedSpy).toHaveBeenCalled();
    expect(completedSpy).toHaveBeenCalled();

    agent.loop.emit("tool.dispatch", {});
    agent.loop.emit("tool.complete", {});
    agent.loop.emit("tick.start", {});
  });

  it("should handle step failure and dispatch failed event", async () => {
    const bus = new OrchestrationBus();
    const { AgentEventLoop } = await import("@agentx/core");
    const loop = new (AgentEventLoop as any)();

    // Mock run to throw
    loop.run = vi.fn().mockRejectedValue(new Error("Tool crash"));

    const agent = new BaseAgent("agent-2", loop as any, bus);

    const failedSpy = vi.fn();
    bus.onEvent("plan.step.failed", failedSpy);

    // Set up the plan
    bus.dispatch({
      type: "plan.created",
      plan: {
        planId: "plan-2",
        goal: "Test",
        createdAt: new Date().toISOString(),
        steps: [],
        milestones: [],
        successCriteria: [],
        reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
      },
    });

    // Trigger step execution
    bus.dispatch({
      type: "plan.step.assigned",
      planId: "plan-2",
      stepId: "step-1",
      executorId: "agent-2",
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(failedSpy).toHaveBeenCalled();
  });

  it("should handle plan.step.assigned with pool-default executor", async () => {
    const bus = new OrchestrationBus();
    const { AgentEventLoop } = await import("@agentx/core");
    const loop = new (AgentEventLoop as any)();
    const agent = new BaseAgent("default-executor", loop as any, bus);

    const startedSpy = vi.fn();
    bus.onEvent("plan.step.started", startedSpy);

    bus.dispatch({
      type: "plan.created",
      plan: {
        planId: "plan-3",
        goal: "Test",
        createdAt: new Date().toISOString(),
        steps: [],
        milestones: [],
        successCriteria: [],
        reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
      },
    });

    bus.dispatch({
      type: "plan.step.assigned",
      planId: "plan-3",
      stepId: "step-1",
      executorId: "pool-default",
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(startedSpy).toHaveBeenCalled();
  });

  it("should not execute step when currentPlanId is null", async () => {
    const bus = new OrchestrationBus();
    const { AgentEventLoop } = await import("@agentx/core");
    const loop = new (AgentEventLoop as any)();
    const agent = new BaseAgent("agent-3", loop as any, bus);

    const startedSpy = vi.fn();
    bus.onEvent("plan.step.started", startedSpy);

    // Emit step.assigned without plan.created first
    bus.dispatch({
      type: "plan.step.assigned",
      planId: "plan-4",
      stepId: "step-1",
      executorId: "agent-3",
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(startedSpy).not.toHaveBeenCalled();
  });
});
