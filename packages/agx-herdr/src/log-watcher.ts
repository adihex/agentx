/**
 * Log Watcher — herdr edition.
 *
 * Runs in the logs pane and displays a live tail of ADP events.
 * Connects to the AgentX runtime and streams log entries with
 * color-coded levels.
 */

import {
  AdpClient,
  nowHHMMSS,
  type LogLevel,
} from "@agentx/agx-core";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const levelColor: Record<LogLevel, string> = {
  INFO: "\x1b[36m",  // cyan
  WARN: "\x1b[33m",  // yellow
  ERROR: "\x1b[31m", // red
  DEBUG: "\x1b[90m", // gray
  CMD: "\x1b[35m",   // magenta
};

function printLog(time: string, level: LogLevel, msg: string) {
  const col = levelColor[level] || levelColor.INFO;
  console.log(`${DIM}${time}${RESET} ${col}[${level}]${RESET} ${msg}`);
}

function printHeader() {
  console.log(`${BOLD}\x1b[36m─── AGX Execution Logs ───${RESET}`);
  console.log(`${DIM}Streaming ADP events. Detach with Ctrl+B Q${RESET}`);
  console.log();
}

async function startLogWatcher() {
  printHeader();

  // Print some initial context
  printLog(nowHHMMSS(), "INFO", "Log watcher started. Connecting to ADP...");

  const client = new AdpClient("ws://localhost:9222");

  client.onStatus((connected) => {
    if (connected) {
      printLog(nowHHMMSS(), "INFO", "Connected to AgentX Runtime.");
    } else {
      printLog(nowHHMMSS(), "WARN", "Disconnected. Reconnecting in 3s...");
    }
  });

  client.onEvent((ev) => {
    // Log entries
    if (ev.method === "Log.Entry") {
      const params = ev.params as { level?: string; message: string };
      printLog(
        nowHHMMSS(),
        (params.level as LogLevel) ?? "INFO",
        params.message,
      );
    }

    // Agent status updates
    if (ev.method === "Agent.StatusUpdate") {
      const p = ev.params as {
        agentId: string;
        status: string;
        progress: number;
      };
      printLog(
        nowHHMMSS(),
        "INFO",
        `[${p.agentId}] → ${p.status} (${p.progress}%)`,
      );
    }

    // Debugger responses
    if (ev.method === "Debugger.Response") {
      const p = ev.params as { result?: unknown };
      printLog(
        nowHHMMSS(),
        "CMD",
        `Response: ${JSON.stringify(p.result || p)}`,
      );
    }

    // Tool execution events
    if (ev.method === "Tool.Started") {
      const p = ev.params as { toolId: string; name: string };
      printLog(nowHHMMSS(), "DEBUG", `Tool started: ${p.name} (${p.toolId})`);
    }
    if (ev.method === "Tool.Completed") {
      const p = ev.params as {
        toolId: string;
        name: string;
        durationMs: number;
      };
      printLog(
        nowHHMMSS(),
        "INFO",
        `Tool completed: ${p.name} (${p.durationMs}ms)`,
      );
    }
    if (ev.method === "Tool.Failed") {
      const p = ev.params as { toolId: string; name: string; error: string };
      printLog(nowHHMMSS(), "ERROR", `Tool failed: ${p.name} — ${p.error}`);
    }
  });

  client.connect();

  // Keep process alive
  process.on("SIGINT", () => {
    client.destroy();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    client.destroy();
    process.exit(0);
  });
}

startLogWatcher().catch(console.error);
