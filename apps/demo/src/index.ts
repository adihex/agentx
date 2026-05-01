import 'dotenv/config';
import { AgentEventLoop } from '@agentx/core';

/**
 * agentx demo — Interactive Event-Driven Agent Runtime
 *
 * This agent starts up and stays alive, waiting for prompts via the ADP
 * control-plane WebSocket. It demonstrates:
 *
 * 1. NON-BLOCKING TOOL EXECUTION
 *    Tools dispatched into the Agentic Thread Pool do NOT block inference.
 *
 * 2. OUT-OF-BAND CONTROL (ADP)
 *    Connect from pi, another terminal, or any WebSocket client on port 9222.
 *
 * ADP Commands:
 *   Session.prompt  <msg>   — Send a prompt to the agent (triggers inference)
 *   Session.shutdown        — Graceful shutdown
 *   Inference.halt          — Abort active LLM stream
 *   Metacognition.pause     — Pause the event loop
 *   Metacognition.resume    — Resume the event loop
 *   Metacognition.getCallFrame — Inspect live state
 *   Memory.compact          — Compact context
 *
 * Usage:
 *   pnpm start                  (starts the interactive agent)
 *   pi -e ../pi-extension/src/extension.ts   (control from pi)
 */

async function main() {
  console.log();
  console.log('┌──────────────────────────────────────────────────┐');
  console.log('│       agentx — Event-Driven Agent Runtime        │');
  console.log('│          ADP Control Plane on port 9222          │');
  console.log('│         Waiting for prompts via ADP…             │');
  console.log('└──────────────────────────────────────────────────┘');
  console.log();

  const agent = new AgentEventLoop({
    adpPort: 9222,
    systemPrompt: [
      'You are a helpful AI assistant running inside an event-driven runtime.',
      'When tool results appear in your context, analyze them concisely.',
      'You are demonstrating non-blocking execution and out-of-band control.',
    ].join(' '),
  });

  // ── Graceful shutdown on SIGINT/SIGTERM ───────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n[Demo] Received ${signal}. Shutting down…`);
    await agent.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // ── Main loop: wait for prompts and run inference ─────────────────────────
  while (true) {
    const prompt = await agent.waitForPrompt();
    if (prompt === null) {
      // Shutdown requested
      break;
    }

    try {
      await agent.run(prompt);
    } catch (err: any) {
      console.error('[Demo] Inference error:', err.message ?? err);
    }
  }

  console.log('[Demo] Main loop exited. Shutting down…');
  await agent.shutdown();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
