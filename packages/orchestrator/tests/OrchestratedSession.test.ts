import { describe, it, expect, beforeEach } from "vitest";
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
