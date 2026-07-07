/**
 * AGX Orchestrator Layout — herdr edition.
 *
 * Recreates the same multi-pane TUI layout that agx-cli provides via OpenTUI,
 * but uses herdr's programmatic socket API for full terminal multiplexer
 * persistence: detach, reattach, agents keep running.
 *
 * Layout (mirrors the old agx-cli):
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  Top: DAG Orchestrator (dag-watcher.ts)     │
 *   ├───────────────────────┬─────────────────────┤
 *   │  Bottom-Left:         │  Bottom-Right:       │
 *   │  ADP REPL             │  Execution Logs      │
 *   │  (adp-repl.ts)        │  (log-watcher.ts)    │
 *   └───────────────────────┴─────────────────────┘
 */

import { HerdrClient } from "./herdr-client.js";

/* ── ANSI helpers ──────────────────────────────────────────── */

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const color = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  gray: "\x1b[90m",
} as const;

const c = (col: keyof typeof color, text: string) => `${color[col]}${text}${RESET}`;

/* ── Layout state ──────────────────────────────────────────── */

interface LayoutPanes {
  dagPaneId: string;
  replPaneId: string;
  logsPaneId: string;
}

/* ── Main orchestrator ─────────────────────────────────────── */

export class AgxHerdrOrchestrator {
  private herdr: HerdrClient;
  private workspaceId: string | null = null;
  private panes: LayoutPanes | null = null;
  private cwd: string;
  private srcDir: string;

  constructor(opts?: { session?: string; cwd?: string }) {
    this.herdr = new HerdrClient({ session: opts?.session });
    this.cwd = opts?.cwd || process.cwd();
    // Resolve src directory relative to this file
    this.srcDir = new URL(".", import.meta.url).pathname;
  }

  /**
   * Bootstrap the full AGX orchestrator layout inside herdr.
   */
  async start(): Promise<void> {
    console.log(c("cyan", "Connecting to herdr..."));

    try {
      await this.herdr.connect();
    } catch (err) {
      console.error(c("cyan", "Failed to connect to herdr. Is it running?"));
      console.error(c("gray", "Install: curl -fsSL https://herdr.dev/install.sh | sh"));
      console.error(c("gray", "Start:   herdr"));
      throw err;
    }

    const pingRes = await this.herdr.ping();
    console.log(c("green", `Connected to herdr v${(pingRes.result as any)?.version || "?"}`));

    // 1. Create workspace
    console.log(c("cyan", "Creating AGX workspace..."));
    const workspace = await this.herdr.workspaceCreate({
      cwd: this.cwd,
      label: "AGX Orchestrator",
      focus: true,
    });
    this.workspaceId = workspace.workspace_id;

    // Get the root pane
    const panes = await this.herdr.paneList(this.workspaceId);
    const rootPaneId = panes[0].pane_id;

    // 2. Root pane = DAG overview (top)
    const dagPaneId = rootPaneId;

    // 3. Split down to create the bottom section
    const bottomPane = await this.herdr.paneSplit(dagPaneId, "down");
    const replPaneId = bottomPane.pane_id;

    // 4. Split bottom-right for the logs pane
    const logsPane = await this.herdr.paneSplit(replPaneId, "right");
    const logsPaneId = logsPane.pane_id;

    this.panes = { dagPaneId, replPaneId, logsPaneId };

    // 5. Report agent identity to herdr for each pane
    await this.herdr.paneReportAgent(
      dagPaneId,
      "agx-dag",
      "working",
      "custom:agx",
      "DAG Orchestrator overview",
    );
    await this.herdr.paneReportAgent(
      replPaneId,
      "agx-repl",
      "idle",
      "custom:agx",
      "ADP Debugger REPL",
    );
    await this.herdr.paneReportAgent(
      logsPaneId,
      "agx-logs",
      "working",
      "custom:agx",
      "Execution log stream",
    );

    // 6. Launch scripts in each pane via `pane run`
    await this.herdr.paneRun(dagPaneId, `npx tsx ${this.srcDir}dag-watcher.ts`);
    await this.herdr.paneRun(replPaneId, `npx tsx ${this.srcDir}adp-repl.ts`);
    await this.herdr.paneRun(logsPaneId, `npx tsx ${this.srcDir}log-watcher.ts`);

    // 7. Subscribe to workspace lifecycle events
    await this.subscribeToHerdrEvents();

    console.log();
    console.log(`${BOLD}${color.cyan}AGX Orchestrator ready.${RESET}`);
    console.log(c("gray", `Workspace: ${this.workspaceId}`));
    console.log();
    console.log(c("gray", "  Detach:   Ctrl+B Q"));
    console.log(c("gray", "  Reattach: herdr"));
    console.log(c("gray", "  Close:    herdr workspace close " + this.workspaceId));
    console.log();
  }

  /**
   * Subscribe to herdr lifecycle events for the workspace.
   */
  private async subscribeToHerdrEvents(): Promise<void> {
    try {
      await this.herdr.subscribe(
        [
          { type: "pane.agent_status_changed" },
          { type: "pane.closed" },
          { type: "workspace.closed" },
        ],
        (event) => {
          if (event.event === "workspace_closed") {
            const wsId = (event.data as any)?.workspace?.workspace_id;
            if (wsId === this.workspaceId) {
              console.log(c("gray", "Workspace closed."));
              void this.shutdown();
            }
          }
        },
      );
    } catch {
      // Subscription is nice-to-have, don't crash if it fails
    }
  }

  async shutdown(): Promise<void> {
    if (this.panes) {
      for (const paneId of Object.values(this.panes)) {
        try {
          await this.herdr.request("pane.clear_agent_authority", {
            pane_id: paneId,
            source: "custom:agx",
          });
        } catch {
          // Best-effort cleanup
        }
      }
    }
    this.herdr.close();
  }
}
