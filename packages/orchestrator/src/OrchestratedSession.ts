import { OrchestrationBus } from "./OrchestrationBus";
import { PlanDispatcher } from "./PlanDispatcher";
import { ExecutionPlan, ExecutionPlanSchema } from "./types";

/**
 * OrchestratedSession
 *
 * Orchestrates a group of agents to fulfill a plan.
 */
export class OrchestratedSession {
  private bus = new OrchestrationBus();
  private dispatcher: PlanDispatcher;

  constructor() {
    this.dispatcher = new PlanDispatcher(this.bus);
  }

  public getBus(): OrchestrationBus {
    return this.bus;
  }

  public async start(plan: ExecutionPlan): Promise<void> {
    // Validate the plan against the schema
    const validatedPlan = ExecutionPlanSchema.parse(plan);

    console.log(`[Session] 🚀 Starting session for plan: ${validatedPlan.planId}`);
    this.bus.dispatch({ type: "plan.created", plan: validatedPlan });
  }

  /**
   * Resolves when the plan's terminal event arrives: `session.complete`
   * resolves with its summary, `session.failed` rejects with the reason.
   * Subscribe before `start()` — a fully synchronous plan may complete
   * during the `plan.created` dispatch itself.
   */
  public waitForCompletion(
    timeoutMs = 5 * 60 * 1000,
  ): Promise<{ planId: string; summary: string }> {
    return new Promise((resolve, reject) => {
      const onComplete = (e: { planId: string; summary: string }) => {
        cleanup();
        resolve(e);
      };
      const onFailed = (e: { planId: string; reason: string }) => {
        cleanup();
        reject(new Error(e.reason));
      };
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Orchestration timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      if (typeof timer === "object") timer.unref();
      const cleanup = () => {
        clearTimeout(timer);
        this.bus.off("session.complete", onComplete);
        this.bus.off("session.failed", onFailed);
      };
      this.bus.once("session.complete", onComplete);
      this.bus.once("session.failed", onFailed);
    });
  }
}
