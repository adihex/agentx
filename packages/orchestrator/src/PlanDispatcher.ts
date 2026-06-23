import { OrchestrationBus } from "./OrchestrationBus";
import { DependencyGraph } from "./DependencyGraph";
import { RetryLedger } from "./RetryLedger";
import { ExecutionPlan } from "./types";

/**
 * PlanDispatcher
 *
 * The brain of the orchestration. Listens for events and decides what to do next.
 */
export class PlanDispatcher {
  private graph: DependencyGraph | null = null;
  private ledger = new RetryLedger();
  private activePlan: ExecutionPlan | null = null;

  constructor(private bus: OrchestrationBus) {
    this.wireEvents();
  }

  private wireEvents() {
    this.bus.onEvent("plan.created", (e) => {
      this.activePlan = e.plan;
      this.graph = new DependencyGraph(e.plan);
      this.dispatchReadySteps();
    });

    this.bus.onEvent("plan.step.completed", (e) => {
      console.log(`[Dispatcher] 📋 Step ${e.stepId} completed. Triggering reviews...`);
      const plan = this.activePlan;
      if (!plan) return;

      if (plan.reviewConfig.passes.length === 0) {
        console.log(`[Dispatcher] ⏩ No reviews configured for step ${e.stepId}. Mark accepted.`);
        this.graph?.markCompleted(e.stepId);
        this.dispatchReadySteps();
        return;
      }

      this.graph?.setPendingReviews(
        e.stepId,
        plan.reviewConfig.passes.map((p) => p.id),
      );
      for (const pass of plan.reviewConfig.passes) {
        this.bus.dispatch({
          type: "review.started",
          planId: e.planId,
          passId: pass.id,
          stepId: e.stepId,
          round: this.ledger.getStats(e.stepId).reviewRounds,
        });
      }
    });

    this.bus.onEvent("review.pass", (e) => {
      console.log(`[Dispatcher] ✅ Review pass ${e.passId} passed for step ${e.stepId}`);
      if (this.graph?.markReviewPassed(e.stepId, e.passId)) {
        console.log(`[Dispatcher] 🎉 All reviews passed for step ${e.stepId}`);
        this.dispatchReadySteps();
      }
    });

    this.bus.onEvent("review.fail", (e) => {
      const stats = this.ledger.getStats(e.stepId);
      const plan = this.activePlan;

      if (plan && stats.reviewRounds < plan.reviewConfig.maxTotalReviewRounds) {
        this.ledger.incrementReviewRound(e.stepId);
        console.log(
          `[Dispatcher] ❌ Review ${e.passId} failed for step ${e.stepId}. Remediation required.`,
        );

        // Reset the step in the graph so it can be re-executed
        this.graph?.markFailed(e.stepId);
        this.graph?.markStarted(e.stepId); // Instantly set back to in-progress for remediation

        this.bus.dispatch({
          type: "plan.amended",
          planId: e.planId,
          reason: `Review failure: ${e.guidance.failedCriteria.join(", ")}`,
          changedSteps: [e.stepId],
        });

        this.bus.dispatch({
          type: "plan.step.assigned",
          planId: e.planId,
          stepId: e.stepId,
          executorId: "remediation-executor",
        });
      } else {
        this.bus.dispatch({
          type: "session.failed",
          planId: e.planId,
          reason: `Review round limit reached for step ${e.stepId}`,
        });
      }
    });

    this.bus.onEvent("clarification.needed", (e) => {
      console.log(`[Dispatcher] ❓ Clarification needed for step ${e.stepId}: ${e.question}`);
      // In a real system, this would be routed to the Planner
      // For now, we just log it and assume some process will resolve it
    });

    this.bus.onEvent("clarification.resolved", (e) => {
      console.log(`[Dispatcher] ✅ Clarification resolved for step ${e.stepId}`);
      // In a real system, this would notify the executor to resume
    });

    this.bus.onEvent("plan.step.failed", (e) => {
      const stats = this.ledger.getStats(e.stepId);
      const step = this.activePlan?.steps.find((s) => s.id === e.stepId);

      if (step && stats.executorRetries < step.maxRetries) {
        this.ledger.incrementExecutorRetry(e.stepId);
        console.log(`[Dispatcher] 🔄 Retrying step ${e.stepId} (attempt ${stats.executorRetries})`);
        this.bus.dispatch({
          type: "plan.step.assigned",
          planId: e.planId,
          stepId: e.stepId,
          executorId: "auto-retry",
        });
      } else {
        this.graph?.markFailed(e.stepId);
        this.bus.dispatch({
          type: "session.failed",
          planId: e.planId,
          reason: `Step ${e.stepId} failed after max retries: ${e.error}`,
        });
      }
    });
  }

  private dispatchReadySteps() {
    if (!this.graph || !this.activePlan) return;

    const readySteps = this.graph.getReadySteps();
    for (const step of readySteps) {
      this.graph.markStarted(step.id);
      this.bus.dispatch({
        type: "plan.step.assigned",
        planId: this.activePlan.planId,
        stepId: step.id,
        executorId: "pool-default",
      });
    }

    if (this.graph.isPlanComplete()) {
      this.bus.dispatch({
        type: "session.complete",
        planId: this.activePlan.planId,
        summary: "All steps completed successfully.",
      });
    }
  }
}
