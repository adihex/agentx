import { ExecutionPlan, PlanStep } from "./types";

/**
 * DependencyGraph
 *
 * Manages the execution state of steps and identifies ready steps.
 */
export class DependencyGraph {
  private completedSteps = new Set<string>();
  private failedSteps = new Set<string>();
  private inProgressSteps = new Set<string>();
  private pendingReviewPasses = new Map<string, Set<string>>();

  constructor(private plan: ExecutionPlan) {
    this.validateNoCycles();
  }

  private validateNoCycles() {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recStack.add(nodeId);

      const step = this.plan.steps.find((s) => s.id === nodeId);
      if (step) {
        for (const depId of step.dependencies) {
          if (hasCycle(depId)) return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const step of this.plan.steps) {
      if (hasCycle(step.id)) {
        throw new Error(`Circular dependency detected in plan involving step: ${step.id}`);
      }
    }
  }

  public markStarted(stepId: string) {
    this.inProgressSteps.add(stepId);
  }

  public markCompleted(stepId: string) {
    this.inProgressSteps.delete(stepId);
    this.completedSteps.add(stepId);
  }

  public markFailed(stepId: string) {
    this.inProgressSteps.delete(stepId);
    this.pendingReviewPasses.delete(stepId);
    this.failedSteps.add(stepId);
  }

  public setPendingReviews(stepId: string, passIds: string[]) {
    this.pendingReviewPasses.set(stepId, new Set(passIds));
  }

  public markReviewPassed(stepId: string, passId: string): boolean {
    const passes = this.pendingReviewPasses.get(stepId);
    if (passes) {
      passes.delete(passId);
      if (passes.size === 0) {
        this.pendingReviewPasses.delete(stepId);
        this.markCompleted(stepId);
        return true; // Step fully completed
      }
    }
    return false; // Still pending other reviews
  }

  public isReviewing(stepId: string): boolean {
    return this.pendingReviewPasses.has(stepId);
  }

  /** Returns steps that have all dependencies met and are not already started/completed */
  public getReadySteps(): PlanStep[] {
    return this.plan.steps.filter((step) => {
      if (
        this.completedSteps.has(step.id) ||
        this.inProgressSteps.has(step.id) ||
        this.failedSteps.has(step.id)
      ) {
        return false;
      }
      return step.dependencies.every((depId) => this.completedSteps.has(depId));
    });
  }

  public isPlanComplete(): boolean {
    return this.plan.steps.every((step) => this.completedSteps.has(step.id));
  }

  public hasBlockingFailures(): boolean {
    // A failure is blocking if any uncompleted step depends on it (and we've exhausted retries, which is handled elsewhere)
    // For now, simple check: if any step failed, we might be stuck.
    return this.failedSteps.size > 0;
  }
}
