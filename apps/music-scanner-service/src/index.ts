import { AgentEventLoop } from "@agentx/core";
import { searchMusicTool } from "./tools/search.js";
import { downloadAndUploadTool } from "./tools/download.js";
import { triggerCloudRunTool } from "./tools/cloudrun.js";
import * as dotenv from "dotenv";

dotenv.config();

/** System prompt for the music scanner orchestrator. */
export const MUSIC_SCANNER_SYSTEM_PROMPT = `
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

/** Default tool registry for the music scanner service. */
export const MUSIC_SCANNER_TOOLS = {
  searchMusic: searchMusicTool,
  downloadAndUpload: downloadAndUploadTool,
  triggerCloudRun: triggerCloudRunTool,
};

/** Default ADP port for the music scanner service. */
export const MUSIC_SCANNER_PORT = 9222;

/**
 * Create the music scanner AgentEventLoop.
 */
export function createMusicScannerAgent(opts?: { adpPort?: number }) {
  return new AgentEventLoop({
    adpPort: opts?.adpPort ?? MUSIC_SCANNER_PORT,
    systemPrompt: MUSIC_SCANNER_SYSTEM_PROMPT,
    autoTick: true,
    tools: MUSIC_SCANNER_TOOLS,
  });
}

/**
 * Register the Music.StartExtraction ADP handler on the given agent.
 */
export function registerExtractionHandler(agent: AgentEventLoop) {
  agent.adp.on("Music.StartExtraction", async (params: any, cb: (result: any) => void) => {
    const songName = params?.songName;
    if (!songName) {
      cb({ status: "error", message: "No song name provided" });
      return;
    }
    console.log(`[Service] Starting extraction for: ${songName}`);
    agent.adp.notify("Music.Status", { message: `Searching for "${songName}"...` });
    const response = await agent.run(`Please extract the guitar from the song: ${songName}`);
    cb({ status: "started", agentResponse: response });
  });
}

// ── Entry point ────────────────────────────────────────────────────────────

async function main() {
  console.log("--- Music Scanner Service Starting ---");
  const agent = createMusicScannerAgent();
  registerExtractionHandler(agent);
  console.log("[Service] Agent initialized with injected tools.");
  console.log("[Service] Listening for ADP commands on port 9222.");
  process.on("SIGINT", async () => {
    await agent.shutdown();
    process.exit(0);
  });
}

main().catch(console.error);
