import { AgentEventLoop } from "@agentx/core";
import { searchMusicTool } from "./tools/search.js";
import { downloadAndUploadTool } from "./tools/download.js";
import { triggerCloudRunTool } from "./tools/cloudrun.js";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Music Scanner Orchestrator
 *
 * This app consumes @agentx/core as a library and injects
 * specialized music extraction tools.
 */
async function main() {
  const SYSTEM_PROMPT = `
    You are the Music Scanner Orchestrator. Your goal is to help users extract guitar tracks from any song.

    Workflow:
    1. Search for the song using 'searchMusic'.
    2. Confirm the best match with the user or proceed if highly confident.
    3. Download the song and upload to GCS using 'downloadAndUpload'.
       - Bucket: 'guitar-extractor-input'
    4. Trigger the extraction job using 'triggerCloudRun'.
       - Job: 'guitar-processor'
    5. Notify the user when the extraction is complete.

    Always use the provided tools to fulfill the user's request.
    When a tool completes, reason about the result and move to the next step.
  `;

  console.log("--- Music Scanner Service Starting ---");

  const agent = new AgentEventLoop({
    adpPort: 9222,
    systemPrompt: SYSTEM_PROMPT,
    autoTick: true,
    tools: {
      searchMusic: searchMusicTool,
      downloadAndUpload: downloadAndUploadTool,
      triggerCloudRun: triggerCloudRunTool,
    },
  });

  // Register custom ADP handler using the new EventEmitter API
  agent.adp.on("Music.StartExtraction", async (params: any, cb: (result: any) => void) => {
    const songName = params?.songName;
    if (!songName) {
      cb({ status: "error", message: "No song name provided" });
      return;
    }

    console.log(`[Service] Starting extraction for: ${songName}`);
    agent.adp.notify("Music.Status", { message: `Searching for "${songName}"...` });

    // Start the agent loop with the user request
    const response = await agent.run(`Please extract the guitar from the song: ${songName}`);
    cb({ status: "started", agentResponse: response });
  });

  // Example: Listen for tool completion and emit UI events
  // (In a real app, we might hook into AgentEventLoop events if we added them)

  console.log("[Service] Agent initialized with injected tools.");
  console.log("[Service] Listening for ADP commands on port 9222.");

  // Keep the process alive
  process.on("SIGINT", async () => {
    await agent.shutdown();
    process.exit(0);
  });
}

main().catch(console.error);
