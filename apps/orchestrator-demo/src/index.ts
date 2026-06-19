import { OrchestratedSession, ExecutionPlan } from "@agentx/orchestrator";

async function main() {
  const session = new OrchestratedSession();
  const bus = session.getBus();

  // Mock Plan
  const plan: ExecutionPlan = {
    planId: "demo-plan-123",
    goal: "Test the orchestration system",
    createdAt: new Date().toISOString(),
    milestones: [],
    steps: [
      {
        id: "step-1",
        description: "Initialize the system",
        dependencies: [],
        acceptanceCriteria: ["System is ready"],
        assignedExecutorRole: "system",
        maxRetries: 2,
      },
      {
        id: "step-2",
        description: "Perform data processing",
        dependencies: ["step-1"],
        acceptanceCriteria: ["Data is processed"],
        assignedExecutorRole: "worker",
        maxRetries: 2,
      },
    ],
    successCriteria: ["All tests passed"],
    reviewConfig: {
      passes: [
        { id: "code-review", checklist: ["Code is clean", "No security issues"] },
        { id: "security-review", checklist: ["No exposed secrets", "Sanitized inputs"] },
      ],
      maxTotalReviewRounds: 3,
    },
  };

  // Mock Executor
  bus.onEvent("plan.step.assigned", (e) => {
    console.log(`[Executor] 🤖 Received step: ${e.stepId}`);
    setTimeout(() => {
      console.log(`[Executor] ✅ Completed step: ${e.stepId}`);
      bus.dispatch({
        type: "plan.step.completed",
        planId: e.planId,
        stepId: e.stepId,
        result: { success: true },
      });
    }, 500);
  });

  // Mock Reviewer
  let reviewFailsCount = 0;
  bus.onEvent("review.started", (e) => {
    console.log(`[Reviewer] 🧐 Starting review: ${e.passId} for step ${e.stepId}`);
    setTimeout(() => {
      if (e.stepId === "step-2" && reviewFailsCount === 0) {
        reviewFailsCount++;
        console.log(`[Reviewer] ❌ Review failed for step-2`);
        bus.dispatch({
          type: "review.fail",
          planId: e.planId,
          passId: e.passId,
          stepId: e.stepId,
          guidance: {
            reviewPassId: e.passId,
            failedCriteria: ["Code is messy"],
            remediation: [{ stepId: e.stepId, specificFix: "Clean up code", severity: "blocker" }],
            roundNumber: e.round,
            maxRounds: 3,
          },
        });
      } else {
        console.log(`[Reviewer] ✅ Review passed for ${e.stepId}`);
        bus.dispatch({
          type: "review.pass",
          planId: e.planId,
          passId: e.passId,
          stepId: e.stepId,
          round: e.round,
        });
      }
    }, 500);
  });

  bus.onEvent("session.complete", (e) => {
    console.log(`[Demo] 🎉 Session complete: ${e.summary}`);
    process.exit(0);
  });

  bus.onEvent("session.failed", (e) => {
    console.error(`[Demo] ❌ Session failed: ${e.reason}`);
    process.exit(1);
  });

  await session.start(plan);
}

main().catch(console.error);
