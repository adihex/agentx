import readline from "readline";
import {
  AdpClient,
  parseReplCommand,
  REPL_HELP_LINES,
  formatAdpResponseBody,
} from "@agentx/agx-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Path to the REPL orchestration log file. */
export const LOG_FILE = path.join(__dirname, "..", "orchestrator.log");

/** ANSI color codes used by the REPL. */
export const REPL_COLORS = {
  header: "\x1b[36m",
  dim: "\x1b[90m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
} as const;

/** Default ADP server URL. */
export const DEFAULT_ADP_URL = "ws://localhost:9222";

/** The REPL prompt string. */
export const REPL_PROMPT = `${REPL_COLORS.header}${REPL_COLORS.bold}agx@debugger:~$${REPL_COLORS.reset} `;

/**
 * Write a timestamped message to the dashboard log file.
 */
export function logToDashboard(msg: string) {
  const timestamp = new Date().toLocaleTimeString();
  fs.appendFileSync(LOG_FILE, `${timestamp} [REPL] ${msg}\n`);
}

/**
 * Handle a single REPL input line. Returns the action to take.
 */
export function handleReplInput(
  input: string,
  client: AdpClient,
): { action: "continue" | "exit" | "error"; message?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { action: "continue" };
  }

  if (trimmed === "/help") {
    return { action: "continue", message: "help" };
  }

  if (trimmed === "/exit" || trimmed === "/quit") {
    return { action: "exit" };
  }

  const parsed = parseReplCommand(trimmed);
  if (parsed) {
    const sent = client.send({ method: parsed.method, params: { args: parsed.args } });
    if (sent) {
      logToDashboard(`Sent command: ${input}`);
      return { action: "continue", message: `sent:${parsed.method}` };
    }
    return { action: "error", message: "Failed to send (disconnected)" };
  }

  return { action: "error", message: `Unknown command format: ${input}` };
}

/**
 * Render local feedback for a handled input line: the help banner for /help,
 * the error text for failures, and nothing for successful sends (the server
 * answers those with a Debugger.Response event).
 */
export function renderReplFeedback(result: {
  action: "continue" | "exit" | "error";
  message?: string;
}): string | null {
  if (result.message === "help") return REPL_HELP_LINES.join("\n");
  if (result.action === "error" && result.message) return result.message;
  return null;
}

/**
 * Handle ADP connection status changes.
 */
export function handleConnectionStatus(connected: boolean, rl: readline.Interface) {
  if (connected) {
    console.log(`\n${REPL_COLORS.green}Connected to AgentX Runtime.${REPL_COLORS.reset}`);
    logToDashboard("REPL Connected to ADP Server");
  } else {
    console.log(`\n${REPL_COLORS.red}Disconnected from AgentX Runtime.${REPL_COLORS.reset}`);
    logToDashboard("REPL Disconnected");
  }
  rl.prompt();
}

/**
 * Handle incoming ADP events.
 */
export function handleAdpEvent(ev: any, rl: readline.Interface) {
  if (ev.method === "Debugger.Response") {
    console.log(`\n${REPL_COLORS.magenta}← ${formatAdpResponseBody(ev.params)}${REPL_COLORS.reset}`);
    rl.prompt();
  }
}

// ── Entry point ────────────────────────────────────────────────────────────

async function startRepl() {
  console.log(`${REPL_COLORS.header}AGX Agent Debugger Protocol (REPL)${REPL_COLORS.reset}`);
  console.log(`${REPL_COLORS.dim}Type /help for commands${REPL_COLORS.reset}`);

  const tokenArg = process.argv.find((a) => a.startsWith("--token="))?.slice("--token=".length);
  const token = tokenArg ?? process.env.ADP_TOKEN;
  const client = new AdpClient(DEFAULT_ADP_URL, token ? { token } : undefined);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: REPL_PROMPT,
  });

  client.onStatus((connected) => handleConnectionStatus(connected, rl));
  client.onEvent((ev) => handleAdpEvent(ev, rl));
  client.connect();
  rl.prompt();

  rl.on("line", (line) => {
    const result = handleReplInput(line, client);
    if (result.action === "exit") {
      rl.close();
      return;
    }
    const feedback = renderReplFeedback(result);
    if (feedback !== null) {
      console.log(
        result.action === "error"
          ? `${REPL_COLORS.red}${feedback}${REPL_COLORS.reset}`
          : `${REPL_COLORS.dim}${feedback}${REPL_COLORS.reset}`,
      );
    }
    rl.prompt();
  }).on("close", () => {
    client.destroy();
    process.exit(0);
  });
}

const invokedAsScript =
  typeof process.argv[1] === "string" &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  startRepl().catch(console.error);
}
