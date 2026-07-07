/**
 * HerdrClient — programmatic Node.js client for herdr's Unix socket API.
 *
 * Communicates via newline-delimited JSON over a Unix domain socket.
 * Supports request/response calls and long-lived event subscriptions.
 */

import net from "node:net";
import { EventEmitter } from "node:events";
import os from "node:os";
import path from "node:path";

/* ── Types ─────────────────────────────────────────────────── */

export interface HerdrRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface HerdrResponse {
  id?: string;
  result?: Record<string, unknown>;
  error?: { code: string; message: string };
}

export interface HerdrEvent {
  event: string;
  data: Record<string, unknown>;
}

export interface WorkspaceInfo {
  workspace_id: string;
  number: number;
  label: string;
  focused: boolean;
  pane_count: number;
  tab_count: number;
  active_tab_id: string;
  agent_status: string;
}

export interface TabInfo {
  tab_id: string;
  workspace_id: string;
  number: number;
  label: string;
  focused: boolean;
  pane_count: number;
  agent_status: string;
}

export interface PaneInfo {
  pane_id: string;
  workspace_id: string;
  tab_id: string;
  focused: boolean;
  cwd: string;
  agent?: string;
  agent_status: string;
  revision: number;
}

export interface PaneRead {
  pane_id: string;
  workspace_id: string;
  tab_id: string;
  source: string;
  text: string;
  revision: number;
  truncated: boolean;
}

/* ── Socket path resolution ────────────────────────────────── */

export function resolveSocketPath(session?: string): string {
  // 1. Explicit HERDR_SOCKET_PATH
  if (process.env.HERDR_SOCKET_PATH) {
    return process.env.HERDR_SOCKET_PATH;
  }

  const configDir = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");

  // 2. Session-specific path
  if (session || process.env.HERDR_SESSION) {
    const name = session || process.env.HERDR_SESSION!;
    return path.join(configDir, "herdr", "sessions", name, "herdr.sock");
  }

  // 3. Default
  return path.join(configDir, "herdr", "herdr.sock");
}

/* ── Client ────────────────────────────────────────────────── */

export class HerdrClient extends EventEmitter {
  private socketPath: string;
  private socket: net.Socket | null = null;
  private subscriptionSocket: net.Socket | null = null;
  private reqCounter = 0;
  private pending = new Map<
    string,
    { resolve: (v: HerdrResponse) => void; reject: (e: Error) => void }
  >();
  private buffer = "";
  private subBuffer = "";

  constructor(opts?: { session?: string; socketPath?: string }) {
    super();
    this.socketPath = opts?.socketPath || resolveSocketPath(opts?.session);
  }

  /* ── Connection ──────────────────────────────────────────── */

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(this.socketPath, () => {
        this.emit("connected");
        resolve();
      });
      this.socket.on("error", (err) => {
        this.emit("error", err);
        reject(err);
      });
      this.socket.on("close", () => {
        this.emit("disconnected");
      });
      this.socket.on("data", (chunk) => {
        this.buffer += chunk.toString();
        this.processBuffer();
      });
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split("\n");
    // Keep partial last line in buffer
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        // If it has an id, it's a response to a request
        if (msg.id && this.pending.has(msg.id)) {
          const handler = this.pending.get(msg.id)!;
          this.pending.delete(msg.id);
          handler.resolve(msg);
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }

  close(): void {
    this.socket?.end();
    this.subscriptionSocket?.end();
    this.socket = null;
    this.subscriptionSocket = null;
  }

  /* ── Request/Response ────────────────────────────────────── */

  async request(method: string, params: Record<string, unknown> = {}): Promise<HerdrResponse> {
    if (!this.socket) {
      throw new Error("Not connected. Call connect() first.");
    }

    const id = `req_${++this.reqCounter}`;
    const req: HerdrRequest = { id, method, params };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket!.write(JSON.stringify(req) + "\n");

      // Timeout after 10s
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 10_000);
    });
  }

  /* ── Convenience methods ─────────────────────────────────── */

  async ping(): Promise<HerdrResponse> {
    return this.request("ping");
  }

  // Workspace methods
  async workspaceList(): Promise<WorkspaceInfo[]> {
    const res = await this.request("workspace.list");
    return (res.result?.workspaces as WorkspaceInfo[]) || [];
  }

  async workspaceCreate(opts?: {
    cwd?: string;
    label?: string;
    focus?: boolean;
  }): Promise<WorkspaceInfo> {
    const res = await this.request("workspace.create", {
      cwd: opts?.cwd,
      focus: opts?.focus ?? true,
      ...(opts?.label ? { label: opts.label } : {}),
    });
    return res.result?.workspace as WorkspaceInfo;
  }

  async workspaceClose(workspaceId: string): Promise<void> {
    await this.request("workspace.close", { workspace_id: workspaceId });
  }

  async workspaceRename(workspaceId: string, label: string): Promise<WorkspaceInfo> {
    const res = await this.request("workspace.rename", {
      workspace_id: workspaceId,
      label,
    });
    return res.result?.workspace as WorkspaceInfo;
  }

  // Tab methods
  async tabCreate(opts?: {
    workspaceId?: string;
    cwd?: string;
    label?: string;
    focus?: boolean;
  }): Promise<TabInfo> {
    const res = await this.request("tab.create", {
      workspace_id: opts?.workspaceId,
      cwd: opts?.cwd,
      focus: opts?.focus ?? true,
      ...(opts?.label ? { label: opts.label } : {}),
    });
    return res.result?.tab as TabInfo;
  }

  async tabList(workspaceId?: string): Promise<TabInfo[]> {
    const res = await this.request("tab.list", workspaceId ? { workspace_id: workspaceId } : {});
    return (res.result?.tabs as TabInfo[]) || [];
  }

  async tabRename(tabId: string, label: string): Promise<TabInfo> {
    const res = await this.request("tab.rename", { tab_id: tabId, label });
    return res.result?.tab as TabInfo;
  }

  async tabClose(tabId: string): Promise<void> {
    await this.request("tab.close", { tab_id: tabId });
  }

  // Pane methods
  async paneList(workspaceId?: string): Promise<PaneInfo[]> {
    const res = await this.request("pane.list", workspaceId ? { workspace_id: workspaceId } : {});
    return (res.result?.panes as PaneInfo[]) || [];
  }

  async paneGet(paneId: string): Promise<PaneInfo> {
    const res = await this.request("pane.get", { pane_id: paneId });
    return res.result?.pane as PaneInfo;
  }

  async paneSplit(
    targetPaneId: string,
    direction: "right" | "down",
    opts?: { cwd?: string; focus?: boolean },
  ): Promise<PaneInfo> {
    const res = await this.request("pane.split", {
      target_pane_id: targetPaneId,
      direction,
      cwd: opts?.cwd,
      focus: opts?.focus ?? true,
    });
    return res.result?.pane as PaneInfo;
  }

  async paneRun(paneId: string, command: string): Promise<void> {
    await this.request("pane.send_input", {
      pane_id: paneId,
      text: command,
      keys: ["Enter"],
    });
  }

  async paneSendText(paneId: string, text: string): Promise<void> {
    await this.request("pane.send_text", { pane_id: paneId, text });
  }

  async paneSendKeys(paneId: string, keys: string[]): Promise<void> {
    await this.request("pane.send_keys", { pane_id: paneId, keys });
  }

  async paneRead(
    paneId: string,
    opts?: { source?: "visible" | "recent"; lines?: number },
  ): Promise<PaneRead> {
    const res = await this.request("pane.read", {
      pane_id: paneId,
      source: opts?.source || "recent",
      lines: opts?.lines || 80,
      strip_ansi: true,
    });
    return res.result?.read as PaneRead;
  }

  async paneClose(paneId: string): Promise<void> {
    await this.request("pane.close", { pane_id: paneId });
  }

  async paneReportAgent(
    paneId: string,
    agent: string,
    state: "idle" | "working" | "blocked" | "done" | "unknown",
    source?: string,
    message?: string,
  ): Promise<void> {
    await this.request("pane.report_agent", {
      pane_id: paneId,
      source: source || `custom:${agent}`,
      agent,
      state,
      ...(message ? { message } : {}),
    });
  }

  // Wait methods
  async waitForOutput(
    paneId: string,
    match: string,
    opts?: {
      source?: "visible" | "recent";
      lines?: number;
      timeoutMs?: number;
      regex?: boolean;
    },
  ): Promise<HerdrResponse> {
    return this.request("pane.wait_for_output", {
      pane_id: paneId,
      source: opts?.source || "recent",
      lines: opts?.lines || 200,
      match: {
        type: opts?.regex ? "regex" : "substring",
        value: match,
      },
      timeout_ms: opts?.timeoutMs || 30_000,
      strip_ansi: true,
    });
  }

  /* ── Subscriptions ───────────────────────────────────────── */

  async subscribe(
    subscriptions: Array<{
      type: string;
      pane_id?: string;
      agent_status?: string;
      source?: string;
      lines?: number;
      match?: { type: string; value: string };
    }>,
    onEvent: (event: HerdrEvent) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.subscriptionSocket = net.createConnection(this.socketPath, () => {
        const req: HerdrRequest = {
          id: `sub_${++this.reqCounter}`,
          method: "events.subscribe",
          params: { subscriptions },
        };
        this.subscriptionSocket!.write(JSON.stringify(req) + "\n");
      });

      this.subscriptionSocket.on("error", (err) => {
        this.emit("subscription_error", err);
        reject(err);
      });

      this.subscriptionSocket.on("data", (chunk) => {
        this.subBuffer += chunk.toString();
        const lines = this.subBuffer.split("\n");
        this.subBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            // Subscription ack
            if (msg.result?.type === "subscription_started") {
              resolve();
              continue;
            }
            // Pushed event
            if (msg.event) {
              onEvent(msg as HerdrEvent);
            }
          } catch {
            // Skip malformed
          }
        }
      });
    });
  }
}
