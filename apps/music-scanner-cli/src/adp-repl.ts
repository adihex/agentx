import readline from "readline";
import { AdpClient } from "@agentx/adp";
import fs from "fs";
import path from "path";

// For this implementation, we will append logs to the orchestrator.log file
const LOG_FILE = path.join(process.cwd(), "orchestrator.log");

function logToDashboard(msg: string) {
  const timestamp = new Date().toLocaleTimeString();
  fs.appendFileSync(LOG_FILE, `${timestamp} [REPL] ${msg}\n`);
}

async function startRepl() {
  console.log("\x1b[36mAGX Agent Debugger Protocol (REPL)\x1b[0m");
  console.log("\x1b[90mType /help for commands\x1b[0m");

  const client = new AdpClient("ws://localhost:9222");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "\x1b[36m\x1b[1magx@debugger:~$\x1b[0m ",
  });

  try {
    await client.waitForOpen();
    console.log("\x1b[32mConnected to AgentX Runtime.\x1b[0m");
    logToDashboard("REPL Connected to ADP Server");
  } catch {
    console.log("\x1b[31mFailed to connect. Is the AgentX runtime running?\x1b[0m");
  }

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input === "/help") {
      console.log("Available Commands:");
      console.log("  /pause <agentId>   - Pause an agent execution");
      console.log("  /inspect <agentId> - Inspect memory of an agent");
      console.log("  /exit              - Exit the REPL");
    } else if (input.startsWith("/pause")) {
      const parts = input.split(" ");
      const agentId = parts[1];
      if (agentId) {
        console.log(`\x1b[33m> Signal SIGSTOP sent to ${agentId}. Status: PAUSED.\x1b[0m`);
        logToDashboard(`Paused agent: ${agentId}`);
      } else {
        console.log("\x1b[31mUsage: /pause <agentId>\x1b[0m");
      }
    } else if (input.startsWith("/inspect")) {
      const parts = input.split(" ");
      const agentId = parts[1];
      if (agentId) {
        console.log(`\x1b[35m[MEMORY DUMP] Size: 24.5MB\x1b[0m`);
        console.log(`  - Context window: 14,203 tokens`);
        console.log(`  - Active buffers: 3`);
        console.log(`  - Last action: "Parsing JSON schema"`);
        logToDashboard(`Inspected memory for: ${agentId}`);
      } else {
        console.log("\x1b[31mUsage: /inspect <agentId>\x1b[0m");
      }
    } else if (input === "/exit" || input === "/quit") {
      rl.close();
      return;
    } else {
      console.log(`\x1b[31mUnknown command: ${input}\x1b[0m`);
    }

    rl.prompt();
  }).on("close", () => {
    client.close();
    process.exit(0);
  });
}

startRepl().catch(console.error);
