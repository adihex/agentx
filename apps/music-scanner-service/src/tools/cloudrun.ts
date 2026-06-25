import { execFileSync } from "node:child_process";
import { z } from "zod";
import type { ToolDefinition } from "@agentx/core";

/**
 * Cloud Run Job Execution Tool
 *
 * Triggers the guitar-processor job on GCP. All arguments are passed to gcloud
 * as an argv array (no shell), so fileName/project/region/jobName cannot escape
 * into a shell command.
 */

export const triggerCloudRunSchema = z.object({
  fileName: z.string().min(1).describe("Input file name to process (INPUT_FILE_NAME)"),
  project: z.string().optional().describe("GCP project id (default: guitar-extractor)"),
  region: z.string().optional().describe("GCP region (default: us-central1)"),
  jobName: z.string().optional().describe("Cloud Run job name (default: guitar-processor)"),
});

export type TriggerCloudRunInput = z.infer<typeof triggerCloudRunSchema>;

/** Implementation invoked inside an AgenticThreadPool worker. */
export async function triggerCloudRun(args: TriggerCloudRunInput) {
  const { fileName, project, region, jobName } = triggerCloudRunSchema.parse(args);

  const gcpProject = project || "guitar-extractor";
  const gcpRegion = region || "us-central1";
  const gcpJob = jobName || "guitar-processor";

  try {
    console.log(`[Tool:triggerCloudRun] Triggering job ${gcpJob} for ${fileName}...`);

    // argv array — no shell interpolation of fileName/env values.
    const output = execFileSync(
      "gcloud",
      [
        "run",
        "jobs",
        "execute",
        gcpJob,
        "--region",
        gcpRegion,
        "--project",
        gcpProject,
        "--update-env-vars",
        `INPUT_FILE_NAME=${fileName}`,
        "--wait",
      ],
      { encoding: "utf8" },
    );
    console.log("[Tool:triggerCloudRun] Output:", output);

    return { success: true, message: "Job completed successfully", fileName };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const triggerCloudRunTool: ToolDefinition<TriggerCloudRunInput> = {
  name: "triggerCloudRun",
  description:
    "Trigger the guitar-processor Cloud Run job for a given input fileName. Optionally override project, region, and jobName.",
  inputSchema: triggerCloudRunSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "triggerCloudRun",
};
