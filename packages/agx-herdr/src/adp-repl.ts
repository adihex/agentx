/**
 * ADP REPL — herdr edition.
 *
 * Same functionality as agx-cli's adp-repl.ts, but designed to run inside
 * a herdr pane. Connects to the AgentX runtime via WebSocket and provides
 * an interactive debugger command prompt.
 */

import readline from "node:readline";
import { AdpClient, parseReplCommand, REPL_HELP_LINES } from "@agentx/agx-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, "..", "orchestrator.log");

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function logToDashboard(msg: string) {
  const timestamp = new Date().toLocaleTimeString();
  fs.appendFileSync(LOG_FILE, `${timestamp} [REPL] ${msg}\n`);
}

async function startRepl() {
  console.log(`\x1b[36m${BOLD}AGX Agent Debugger Protocol (REPL)${RESET}`);
  console.log("\x1b[90mRunning inside herdr — detach with Ctrl+B Q\x1b[0m");
  console.log("\x1b[90mType /help for commands\x1b[0m\n");

  const client = new AdpClient("ws://localhost:9222");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `\x1b[36m${BOLD}agx@debugger:~$${RESET} `,
  });

  client.onStatus((connected) => {
    if (connected) {
      console.log("\n\x1b[32m● Connected to AgentX Runtime.\x1b[0m");
      logToDashboard("REPL Connected to ADP Server");
      rl.prompt();
    } else {
      console.log("\n\x1b[31m○ Disconnected from AgentX Runtime.\x1b[0m");
      logToDashboard("REPL Disconnected");
    }
  });

  client.onEvent((ev) => {
    if (ev.method === "Debugger.Response") {
      console.log(`\n\x1b[35m← ${JSON.stringify(ev.params.result || ev.params)}\x1b[0m`);
      rl.prompt();
    }
    // Also show agent status updates in the REPL
    if (ev.method === "Agent.StatusUpdate") {
      const p = ev.params as any;
      console.log(`\n\x1b[90m[ADP] ${p.agentId}: ${p.status} (${p.progress}%)\x1b[0m`);
      rl.prompt();
    }
  });

  client.connect();
  rl.prompt();

  rl.on("line", (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input === "/help") {
      console.log("\nAvailable Commands:");
      REPL_HELP_LINES.forEach((l) => console.log(l));
      console.log();
      rl.prompt();
      return;
    }

    if (input === "/exit" || input === "/quit") {
      rl.close();
      return;
    }

    const parsed = parseReplCommand(input);
    if (parsed) {
      const sent = client.send({
        method: parsed.method,
        params: { args: parsed.args },
      });
      if (sent) {
        console.log(`\x1b[90m  [SENT] ${parsed.method}\x1b[0m`);
        logToDashboard(`Sent command: ${input}`);
      } else {
        console.log("\x1b[31m  [ERROR] Failed to send (disconnected)\x1b[0m");
      }
    } else {
      console.log(`\x1b[31m  Unknown command: ${input}. Use /<method> <args>\x1b[0m`);
    }

    rl.prompt();
  }).on("close", () => {
    client.destroy();
    process.exit(0);
  });
}

startRepl().catch(console.error);
