import { AgentSessionHost } from "@agentx/core";
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
    2. If the search returns several plausible matches, list them and ASK the user to
       choose one — then wait for their reply before continuing. Only skip the question
       when there is a single, unambiguous best match.
    3. Download the chosen song and upload to GCS using 'downloadAndUpload'.
       - Bucket: 'guitar-extractor-input'
    4. Trigger the extraction job using 'triggerCloudRun'.
       - Job: 'guitar-processor'
    5. Notify the user when the extraction is complete.

    Always use the provided tools to fulfill the user's request.
    When a tool completes, reason about the result and move to the next step.
    When you ask the user a question, stop and wait — their next message is the answer.
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
 * Register the music-scanner ADP commands on a host.
 *
 * `Music.StartExtraction` is scoped to the calling client's session: it seeds
 * that session's conversation with the extraction prompt. Everything after —
 * status, tool results, the agent's questions, and the user's replies — flows
 * through that one session, so concurrent clients never collide.
 */
export function registerMusicCommands(host: AgentSessionHost): void {
  host.registerCommand("Music.StartExtraction", (params, ctx) => {
    const songName = (params?.songName as string) ?? "";
    if (!songName) {
      ctx.reply({ status: "error", message: "No song name provided" });
      return;
    }
    if (!ctx.session) {
      ctx.reply({ status: "error", message: "No active session" });
      return;
    }
    console.log(`[Service] Starting extraction for: ${songName} (session ${ctx.sessionId})`);
    ctx.notify("Music.Status", { message: `Searching for "${songName}"...` });
    ctx.session.enqueuePrompt(`Please extract the guitar from the song: ${songName}`);
    ctx.reply({ status: "started" });
  });
}

/**
 * Create the multi-tenant music scanner host.
 */
export function createMusicScannerHost(opts?: { adpPort?: number }): AgentSessionHost {
  return new AgentSessionHost({
    adpPort: opts?.adpPort ?? MUSIC_SCANNER_PORT,
    systemPrompt: MUSIC_SCANNER_SYSTEM_PROMPT,
    tools: MUSIC_SCANNER_TOOLS,
    autoTick: true,
  });
}

// ── Entry point ────────────────────────────────────────────────────────────

async function main() {
  console.log("--- Music Scanner Service Starting ---");
  const host = createMusicScannerHost();
  registerMusicCommands(host);
  console.log("[Service] Multi-tenant agent host initialized with injected tools.");
  console.log(`[Service] Listening for ADP commands on port ${MUSIC_SCANNER_PORT}.`);

  const shutdown = async () => {
    await host.shutdown();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// Don't boot the server (or bind the ADP port) when imported by tests.
if (process.env.NODE_ENV !== "test") {
  main().catch(console.error);
}
