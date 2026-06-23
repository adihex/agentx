import { AgentEventLoop } from "@agentx/core";
import { OrchestrationBus } from "./OrchestrationBus";

/**
 * BaseAgent
 *
 * Wraps an AgentEventLoop and connects it to the OrchestrationBus.
 * It translates internal agent events into bus events and vice-versa.
 */
export class BaseAgent {
  private currentPlanId: string | null = null;
  private currentStepId: string | null = null;

  constructor(
    public readonly id: string,
    public readonly loop: AgentEventLoop,
    private bus: OrchestrationBus,
  ) {
    this.wireEvents();
  }

  private wireEvents() {
    // 1. Listen to internal loop events and broadcast to bus
    this.loop.on("tool.dispatch", (_data) => {
      // In a real implementation, we would check if this tool call deviates from the plan
    });

    this.loop.on("tool.complete", (_data) => {
      // Optional: broadcast tool completion to the bus for observability
    });

    // 2. Listen to bus events and control the loop
    this.bus.onEvent("plan.created", (e) => {
      this.currentPlanId = e.plan.planId;
    });

    this.bus.onEvent("plan.step.assigned", (e) => {
      if (
        e.executorId === this.id ||
        (e.executorId === "pool-default" && this.id === "default-executor")
      ) {
        void this.executeStep(e.stepId);
      }
    });

    // 3. Handle pause/resume and broadcast clarification needed
    this.loop.on("tick.start", (_data) => {
      // If we are in a phase where we need external input, we could pause here
    });
  }

  private async executeStep(stepId: string) {
    if (!this.currentPlanId) return;

    this.currentStepId = stepId;
    console.log(`[Agent ${this.id}] 🚀 Starting step: ${stepId}`);

    this.bus.dispatch({
      type: "plan.step.started",
      planId: this.currentPlanId,
      stepId,
      executorId: this.id,
    });

    try {
      // In a real implementation, we'd get the step description from the plan
      // For now we simulate execution by running the loop with the stepId
      const result = await this.loop.run(`Execute step: ${stepId}`);

      this.bus.dispatch({
        type: "plan.step.completed",
        planId: this.currentPlanId,
        stepId,
        result: { text: result },
      });
    } catch (err: any) {
      this.bus.dispatch({
        type: "plan.step.failed",
        planId: this.currentPlanId,
        stepId,
        error: err.message,
        attempt: 1, // Ledger tracks actual attempts
      });
    } finally {
      this.currentStepId = null;
    }
  }
}
