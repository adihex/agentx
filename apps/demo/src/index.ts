import "dotenv/config";
import { AgentEventLoop } from "@agentx/core";

/** System prompt used by the demo agent. */
export const DEMO_SYSTEM_PROMPT = [
  "You are a helpful AI assistant running inside an event-driven runtime.",
  "When tool results appear in your context, analyze them concisely.",
  "You are demonstrating non-blocking execution and out-of-band control.",
].join(" ");

/** Default ADP port for the demo agent. */
export const DEMO_ADP_PORT = 9222;

/**
 * Create the demo AgentEventLoop with default configuration.
 * Extracted for testability.
 */
export function createDemoAgent(opts?: { adpPort?: number; systemPrompt?: string }) {
  return new AgentEventLoop({
    adpPort: opts?.adpPort ?? DEMO_ADP_PORT,
    autoTick: true,
    systemPrompt: opts?.systemPrompt ?? DEMO_SYSTEM_PROMPT,
  });
}

/**
 * Create a shutdown handler for the given agent.
 */
export function createShutdownHandler(agent: AgentEventLoop, signal?: string) {
  return async () => {
    if (signal) {
      console.log(`\n[Demo] Received ${signal}. Shutting down…`);
    } else {
      console.log("\n[Demo] Shutting down…");
    }
    await agent.shutdown();
    process.exit(0);
  };
}

/**
 * Run the prompt loop: wait for prompts and process them.
 * Returns when shutdown is requested.
 */
export async function runPromptLoop(agent: AgentEventLoop) {
  while (true) {
    const prompt = await agent.waitForPrompt();
    if (prompt === null) {
      break;
    }
    try {
      await agent.run(prompt);
    } catch (err: any) {
      console.error("[Demo] Inference error:", err.message ?? err);
    }
  }
}

// ── Entry point (runs when executed directly) ──────────────────────────────

/** ASCII banner displayed on startup. */
export const DEMO_BANNER = [
  "",
  "┌──────────────────────────────────────────────────┐",
  "│       agentx — Event-Driven Agent Runtime        │",
  "│          ADP Control Plane on port 9222          │",
  "│         Waiting for prompts via ADP…             │",
  "└──────────────────────────────────────────────────┘",
  "",
];

async function main() {
  DEMO_BANNER.forEach((line) => console.log(line));
  const agent = createDemoAgent();
  process.on("SIGINT", createShutdownHandler(agent, "SIGINT"));
  process.on("SIGTERM", createShutdownHandler(agent, "SIGTERM"));
  await runPromptLoop(agent);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
