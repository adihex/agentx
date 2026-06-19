import readline from "readline";
import { AdpClient, parseReplCommand, REPL_HELP_LINES } from "@agentx/agx-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, "..", "orchestrator.log");

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

  client.onStatus((connected) => {
    if (connected) {
      console.log("\n\x1b[32mConnected to AgentX Runtime.\x1b[0m");
      logToDashboard("REPL Connected to ADP Server");
      rl.prompt();
    } else {
      console.log("\n\x1b[31mDisconnected from AgentX Runtime.\x1b[0m");
      logToDashboard("REPL Disconnected");
    }
  });

  client.onEvent((ev) => {
    if (ev.method === "Debugger.Response") {
      console.log(`\n\x1b[35m← ${JSON.stringify(ev.params.result || ev.params)}\x1b[0m`);
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
      console.log("Available Commands:");
      REPL_HELP_LINES.forEach((l) => console.log(l));
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
        console.log(`\x1b[90m[SENT] ${parsed.method}\x1b[0m`);
        logToDashboard(`Sent command: ${input}`);
      } else {
        console.log("\x1b[31m[ERROR] Failed to send (disconnected)\x1b[0m");
      }
    } else {
      console.log(`\x1b[31mUnknown command format: ${input}. Use /<method> <args>\x1b[0m`);
    }

    rl.prompt();
  }).on("close", () => {
    client.destroy();
    process.exit(0);
  });
}

startRepl().catch(console.error);
