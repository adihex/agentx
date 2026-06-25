/**
 * DAG watcher — runs in the top herdr pane and periodically refreshes
 * a compact agent status overview by polling ADP.
 */

import {
  AdpClient,
  DEFAULT_NODES,
  STATUS_TERM_COLOR,
  nodeReducer,
  nowHHMMSS,
  type AgentNode,
} from "@agentx/agx-core";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const color: Record<string, string> = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
};

let nodes: AgentNode[] = [...DEFAULT_NODES];

function render() {
  // Clear screen and move cursor to top-left
  process.stdout.write("\x1b[2J\x1b[H");

  const running = nodes.filter((n) => n.status === "running").length;
  const done = nodes.filter((n) => n.status === "success").length;
  const errors = nodes.filter((n) => n.status === "error").length;

  console.log(`${BOLD}${color.cyan}AGX ORCHESTRATOR v0.1${RESET}  ${DIM}${nowHHMMSS()}${RESET}`);
  console.log(
    `${DIM}Running:${RESET} ${color.yellow}${running}${RESET}  ` +
      `${DIM}Done:${RESET} ${color.green}${done}${RESET}  ` +
      `${DIM}Errors:${RESET} ${color.red}${errors}${RESET}`,
  );
  console.log(`${color.gray}${"─".repeat(56)}${RESET}`);
  console.log();

  for (const node of nodes) {
    const termColor = STATUS_TERM_COLOR[node.status] ?? "gray";
    const col = color[termColor] || color.gray;
    const filled = Math.floor(node.progress / 10);
    const bar = `${"█".repeat(filled)}${"░".repeat(10 - filled)}`;
    const statusTag = `[${node.status.toUpperCase()}]`;
    const detail = node.detail ? `  ${DIM}${node.detail}${RESET}` : "";

    console.log(
      `  ${col}${node.label.padEnd(20)}${RESET} ${col}${statusTag.padEnd(10)}${RESET} ${col}${bar}${RESET} ${String(node.progress).padStart(3)}%${detail}`,
    );
  }

  console.log();
  console.log(`${color.gray}${"─".repeat(56)}${RESET}`);
  console.log(
    `${DIM}herdr: Ctrl+B Q to detach  |  Ctrl+B V to split  |  Ctrl+B X to close${RESET}`,
  );
}

async function start() {
  render();

  const client = new AdpClient("ws://localhost:9222");

  client.onStatus((_connected) => {
    // Re-render with connection status on next tick
    setTimeout(render, 0);
  });

  client.onEvent((ev) => {
    if (ev.method === "Agent.StatusUpdate") {
      const params = ev.params as unknown as AgentNode & { agentId: string };
      const { agentId, status, progress, detail } = params;
      nodes = nodeReducer(nodes, {
        type: "STATUS_UPDATE",
        id: agentId,
        status,
        progress,
        detail,
      });
      render();
    }
  });

  client.connect();

  // Periodic refresh every 2s even without events (for clock update)
  setInterval(render, 2000);

  process.on("SIGINT", () => {
    client.destroy();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    client.destroy();
    process.exit(0);
  });
}

start().catch(console.error);
