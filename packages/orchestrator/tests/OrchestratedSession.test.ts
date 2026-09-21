import { describe, it, expect, beforeEach, vi } from "vitest";
import { OrchestratedSession } from "../src/OrchestratedSession";
import { ExecutionPlan } from "../src/types";

describe("OrchestratedSession", () => {
  let session: OrchestratedSession;

  beforeEach(() => {
    session = new OrchestratedSession();
  });

  it("should get the orchestration bus", () => {
    const bus = session.getBus();
    expect(bus).toBeDefined();
  });

  it("should start a session with a valid plan", async () => {
    const plan: ExecutionPlan = {
      planId: "session-1",
      goal: "Test session",
      createdAt: new Date().toISOString(),
      steps: [],
      milestones: [],
      successCriteria: [],
      reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
    };

    await session.start(plan);
  });
});

describe("waitForCompletion", () => {
  let session: OrchestratedSession;
  beforeEach(() => {
    session = new OrchestratedSession();
  });

  const emptyPlan: ExecutionPlan = {
    planId: "wait-1",
    goal: "done instantly",
    createdAt: new Date().toISOString(),
    steps: [],
    milestones: [],
    successCriteria: [],
    reviewConfig: { passes: [], maxTotalReviewRounds: 1 },
  };

  it("resolves when a synchronous plan completes during start", async () => {
    const completion = session.waitForCompletion();
    await session.start(emptyPlan);
    await expect(completion).resolves.toMatchObject({
      planId: "wait-1",
      summary: "All steps completed successfully.",
    });
  });

  it("rejects when the session fails", async () => {
    const plan: ExecutionPlan = {
      ...emptyPlan,
      planId: "wait-2",
      steps: [
        {
          id: "s1",
          description: "fails immediately",
          dependencies: [],
          acceptanceCriteria: [],
          assignedExecutorRole: "default",
          maxRetries: 0,
        },
      ],
    };
    const completion = session.waitForCompletion();
    await session.start(plan);
    session.getBus().dispatch({
      type: "plan.step.failed",
      planId: "wait-2",
      stepId: "s1",
      error: "boom",
      attempt: 1,
    });
    await expect(completion).rejects.toThrow("max retries");
  });

  it("rejects after the timeout when nothing terminal arrives", async () => {
    vi.useFakeTimers();
    try {
      const completion = session.waitForCompletion(1000);
      void completion.catch(() => {});
      vi.advanceTimersByTime(1000);
      await expect(completion).rejects.toThrow("timed out");
    } finally {
      vi.useRealTimers();
    }
  });
});
