import { describe, it, expect } from "vitest";
import { RetryLedger } from "../src/RetryLedger";

describe("RetryLedger", () => {
  it("should initialize stats for a new step", () => {
    const ledger = new RetryLedger();
    const stats = ledger.getStats("step-1");
    expect(stats).toEqual({
      executorRetries: 0,
      reviewRounds: 0,
      clarificationRounds: 0,
    });
  });

  it("should increment executor retries", () => {
    const ledger = new RetryLedger();
    expect(ledger.incrementExecutorRetry("step-1")).toBe(1);
    expect(ledger.incrementExecutorRetry("step-1")).toBe(2);
    expect(ledger.getStats("step-1").executorRetries).toBe(2);
  });

  it("should increment review rounds", () => {
    const ledger = new RetryLedger();
    expect(ledger.incrementReviewRound("step-1")).toBe(1);
    expect(ledger.getStats("step-1").reviewRounds).toBe(1);
  });

  it("should increment clarification rounds", () => {
    const ledger = new RetryLedger();
    expect(ledger.incrementClarification("step-1")).toBe(1);
    expect(ledger.getStats("step-1").clarificationRounds).toBe(1);
  });

  it("should track multiple steps independently", () => {
    const ledger = new RetryLedger();
    ledger.incrementExecutorRetry("step-1");
    ledger.incrementReviewRound("step-2");

    expect(ledger.getStats("step-1").executorRetries).toBe(1);
    expect(ledger.getStats("step-1").reviewRounds).toBe(0);
    expect(ledger.getStats("step-2").executorRetries).toBe(0);
    expect(ledger.getStats("step-2").reviewRounds).toBe(1);
  });
});
