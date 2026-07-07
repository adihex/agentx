#!/usr/bin/env node

import { execSync, spawn } from "child_process";
import path from "path";
import fs from "fs";

const SESSION_NAME = "agx_orchestrator";

function run() {
  console.log("Starting AGX Orchestrator in tmux...");

  try {
    // Check if session already exists
    try {
      execSync(`tmux has-session -t ${SESSION_NAME} 2>/dev/null`);
      console.log(`Session ${SESSION_NAME} already exists. Attaching...`);
      spawn("tmux", ["attach-session", "-t", SESSION_NAME], { stdio: "inherit" });
      return;
    } catch {
      // Session does not exist, continue creating
    }

    const appDir = path.resolve(process.cwd());
    const logFile = path.join(appDir, "orchestrator.log");
    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, "AGX SYSTEM LOG INITIALIZED\n");
    }

    // Build a single chained tmux command using \; to avoid multiple child processes
    const tmuxCommand = [
      `new-session -d -s ${SESSION_NAME} -n dashboard -c "${appDir}"`,
      `split-window -v -p 40 -t ${SESSION_NAME} -c "${appDir}"`,
      `split-window -h -p 60 -t ${SESSION_NAME}:0.1 -c "${appDir}"`,
      `send-keys -t ${SESSION_NAME}:0.0 "APP_MODE=agx pnpm start" C-m`,
      `send-keys -t ${SESSION_NAME}:0.1 "pnpm start:repl" C-m`,
      `send-keys -t ${SESSION_NAME}:0.2 "tail -f orchestrator.log" C-m`,
    ].join(" \\; ");

    console.log("Constructing tmux layout...");
    execSync(`tmux ${tmuxCommand}`);

    // Attach to the session
    spawn("tmux", ["attach-session", "-t", SESSION_NAME], { stdio: "inherit" });
  } catch (error) {
    console.error("Failed to initialize tmux session:", error);
    process.exit(1);
  }
}

run();
