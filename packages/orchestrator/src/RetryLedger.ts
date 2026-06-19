export interface StepStats {
  executorRetries: number;
  reviewRounds: number;
  clarificationRounds: number;
}

/**
 * RetryLedger
 *
 * Tracks budgets per step to prevent infinite loops.
 */
export class RetryLedger {
  private ledger = new Map<string, StepStats>();

  public getStats(stepId: string): StepStats {
    if (!this.ledger.has(stepId)) {
      this.ledger.set(stepId, { executorRetries: 0, reviewRounds: 0, clarificationRounds: 0 });
    }
    return this.ledger.get(stepId)!;
  }

  public incrementExecutorRetry(stepId: string): number {
    const stats = this.getStats(stepId);
    stats.executorRetries++;
    return stats.executorRetries;
  }

  public incrementReviewRound(stepId: string): number {
    const stats = this.getStats(stepId);
    stats.reviewRounds++;
    return stats.reviewRounds;
  }

  public incrementClarification(stepId: string): number {
    const stats = this.getStats(stepId);
    stats.clarificationRounds++;
    return stats.clarificationRounds;
  }
}
