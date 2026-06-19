/**
 * agx-herdr — entry point.
 *
 * Launches the AGX Orchestrator inside herdr, creating a multi-pane
 * workspace with DAG overview, ADP REPL, and execution log stream.
 *
 * Usage:
 *   pnpm --filter @agentx/agx-herdr start
 *   # or
 *   agx-herdr [--session <name>] [--cwd <path>]
 */

import { AgxHerdrOrchestrator } from "./orchestrator.js";

// Parse minimal CLI args
const args = process.argv.slice(2);
let session: string | undefined;
let cwd: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--session" && args[i + 1]) {
    session = args[++i];
  } else if (args[i] === "--cwd" && args[i + 1]) {
    cwd = args[++i];
  } else if (args[i] === "--help" || args[i] === "-h") {
    console.log(`
agx-herdr — AGX Orchestrator powered by herdr

Usage:
  agx-herdr [options]

Options:
  --session <name>   herdr session name (default: uses HERDR_SESSION or default)
  --cwd <path>       working directory for the workspace (default: cwd)
  --help, -h         show this help

Prerequisites:
  herdr must be installed and running.
  Install: curl -fsSL https://herdr.dev/install.sh | sh
  Start:   herdr

Layout:
  ┌──────────────────────────────────────────┐
  │  DAG Orchestrator (agent status overview) │
  ├────────────────────┬─────────────────────┤
  │  ADP REPL          │  Execution Logs     │
  │  /help for cmds    │  Live ADP events    │
  └────────────────────┴─────────────────────┘

Persistence:
  Detach:   Ctrl+B Q  (agents keep running)
  Reattach: herdr     (pick up where you left off)
`);
    process.exit(0);
  }
}

async function main() {
  const orchestrator = new AgxHerdrOrchestrator({ session, cwd });

  process.on("SIGINT", async () => {
    await orchestrator.shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await orchestrator.shutdown();
    process.exit(0);
  });

  await orchestrator.start();
}

main().catch((err) => {
  console.error("Fatal:", err.message || err);
  process.exit(1);
});
