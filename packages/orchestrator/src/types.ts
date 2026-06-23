import { z } from "zod";

// ─── Plan Schemas ────────────────────────────────────────────────────────────

/**
 * Represents a single step in an execution plan.
 */
export const PlanStepSchema = z.object({
  /** Unique identifier for the step */
  id: z.string(),
  /** Human-readable description of the task */
  description: z.string(),
  /** List of step IDs that must complete before this one starts */
  dependencies: z.array(z.string()).default([]),
  /** Conditions that must be met for this step to be considered successful */
  acceptanceCriteria: z.array(z.string()).default([]),
  /** Target role or agent type to execute this step */
  assignedExecutorRole: z.string().default("default"),
  /** Maximum number of execution retries on failure */
  maxRetries: z.number().default(3),
});

/**
 * Represents a manual or automated review pass for a plan step.
 */
export const ReviewPassSchema = z.object({
  /** Unique identifier for the review pass */
  id: z.string(),
  /** List of points to verify during this pass */
  checklist: z.array(z.string()),
});

/**
 * The root schema for a DAG-based Execution Plan.
 */
export const ExecutionPlanSchema = z.object({
  /** Unique identifier for this orchestration session */
  planId: z.string(),
  /** The high-level objective to be achieved */
  goal: z.string(),
  /** ISO timestamp of plan creation */
  createdAt: z.string().datetime(),
  /** The set of steps that make up the plan */
  steps: z.array(PlanStepSchema),
  /** Strategic checkpoints within the plan */
  milestones: z
    .array(
      z.object({
        /** ID of the step after which this milestone is reached */
        afterStep: z.string(),
        /** Description of the milestone */
        description: z.string(),
      }),
    )
    .default([]),
  /** Conditions for overall plan success */
  successCriteria: z.array(z.string()),
  /** Configuration for quality gates and reviews */
  reviewConfig: z.object({
    /** Ordered list of review passes to run after each step */
    passes: z.array(ReviewPassSchema),
    /** Total number of review remediation rounds allowed */
    maxTotalReviewRounds: z.number().default(5),
  }),
});

/** Type-safe PlanStep inferred from schema */
export type PlanStep = z.infer<typeof PlanStepSchema>;
/** Type-safe ReviewPass inferred from schema */
export type ReviewPass = z.infer<typeof ReviewPassSchema>;
/** Type-safe ExecutionPlan inferred from schema */
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

// ─── Remediation ─────────────────────────────────────────────────────────────

/**
 * Guidance provided when a review pass fails.
 */
export const RemediationGuidanceSchema = z.object({
  /** ID of the failed review pass */
  reviewPassId: z.string(),
  /** List of criteria that failed to pass */
  failedCriteria: z.array(z.string()),
  /** Specific fix instructions per step */
  remediation: z.array(
    z.object({
      /** ID of the step requiring remediation */
      stepId: z.string(),
      /** Detailed fix instruction */
      specificFix: z.string(),
      /** Impact of the failure */
      severity: z.enum(["blocker", "warning"]),
    }),
  ),
  /** Current round of remediation */
  roundNumber: z.number(),
  /** Maximum allowed rounds */
  maxRounds: z.number(),
});

/** Type-safe RemediationGuidance inferred from schema */
export type RemediationGuidance = z.infer<typeof RemediationGuidanceSchema>;

// ─── Events ──────────────────────────────────────────────────────────────────

/**
 * Discriminated union of all events that can occur during orchestration.
 */
export type OrchestrationEvent =
  | { type: "plan.created"; plan: ExecutionPlan }
  | { type: "plan.amended"; planId: string; reason: string; changedSteps: string[] }
  | { type: "plan.step.assigned"; planId: string; stepId: string; executorId: string }
  | { type: "plan.step.started"; planId: string; stepId: string; executorId: string }
  | { type: "plan.step.completed"; planId: string; stepId: string; result: unknown }
  | { type: "plan.step.failed"; planId: string; stepId: string; error: string; attempt: number }
  | { type: "review.started"; planId: string; passId: string; stepId: string; round: number }
  | { type: "review.pass"; planId: string; passId: string; stepId: string; round: number }
  | {
      type: "review.fail";
      planId: string;
      passId: string;
      stepId: string;
      guidance: RemediationGuidance;
    }
  | { type: "clarification.needed"; planId: string; stepId: string; question: string; context: unknown }
  | { type: "clarification.resolved"; planId: string; stepId: string; resolution: string }
  | { type: "milestone.reached"; planId: string; milestone: string }
  | { type: "session.complete"; planId: string; summary: string }
  | { type: "session.failed"; planId: string; reason: string };
