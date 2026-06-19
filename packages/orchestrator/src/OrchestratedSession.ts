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
}
