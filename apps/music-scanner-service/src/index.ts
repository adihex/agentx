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
 * Also runs the prompt loop for follow-up responses and notifies the client of responses.
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
    cb({ status: "started" });

    try {
      const response = await agent.run(`Please extract the guitar from the song: ${songName}`);
      agent.adp.notify("Music.AgentResponse", { response });
    } catch (err) {
      console.error("[Service] agent.run error:", err);
      agent.adp.notify("Music.Status", {
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  });

  // Start background prompt loop to handle user replies / follow-up prompts
  void (async () => {
    for (;;) {
      const prompt = await agent.waitForPrompt();
      if (prompt === null) break; // shutdown
      try {
        console.log(`[Service] Received user prompt/reply: ${prompt}`);
        agent.adp.notify("Music.Status", { message: `User reply: "${prompt}"` });
        const response = await agent.run(prompt);
        agent.adp.notify("Music.AgentResponse", { response });
      } catch (err) {
        console.error("[Service] Error running user prompt:", err);
        agent.adp.notify("Music.Status", {
          message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }
  })();
}

// ── Entry point ────────────────────────────────────────────────────────────

import { WebSocketServer } from "ws";

const activeAgents = new Set<AgentEventLoop>();
const mockHttpServer = {
  on: (event: string, callback: any) => {
    // Do nothing
  },
};

async function main() {
  console.log("--- Music Scanner Service Starting ---");

  const wss = new WebSocketServer({ port: MUSIC_SCANNER_PORT });
  console.log(
    `[Service] Multi-tenant ADP control plane listening on ws://localhost:${MUSIC_SCANNER_PORT}`,
  );

  wss.on("connection", (ws, request) => {
    console.log("[Service] Client connected. Spawning user-specific agent...");
    const agent = new AgentEventLoop({
      systemPrompt: MUSIC_SCANNER_SYSTEM_PROMPT,
      tools: MUSIC_SCANNER_TOOLS,
      autoTick: true,
      adpServer: mockHttpServer,
      quiet: true,
    });

    activeAgents.add(agent);
    registerExtractionHandler(agent);

    // Direct connection mapping: emit connection event on the agent's private wss
    (agent.adp as any).wss.emit("connection", ws, request);

    ws.on("close", async () => {
      console.log("[Service] Client disconnected. Shutting down user-specific agent...");
      activeAgents.delete(agent);
      await agent.shutdown().catch(console.error);
    });

    ws.on("error", (err) => {
      console.error("[Service] Socket error:", err);
    });
  });

  const shutdown = async () => {
    console.log("\n[Service] Shutting down all active agents...");
    for (const agent of activeAgents) {
      await agent.shutdown().catch(console.error);
    }
    wss.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (process.env.NODE_ENV !== "test") {
  main().catch(console.error);
}
