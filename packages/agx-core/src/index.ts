export * from "./types";
export * from "./nodeReducer";

/* ── default state ────────────────────────────────────────── */
import type { AgentNode, LogEntry } from "./types";

export const DEFAULT_NODES: AgentNode[] = [
  { id: "ingestion", label: "Ingestion_Node", status: "success", progress: 100 },
  {
    id: "analyst",
    label: "Analyst_Node",
    status: "running",
    progress: 65,
    detail: "Processing data chunk 42...",
  },
  {
    id: "coder",
    label: "Coder_Agent",
    status: "running",
    progress: 30,
    detail: "Compiling AST module...",
  },
  { id: "validator", label: "Validator_System", status: "queued", progress: 0 },
];

export const DEFAULT_LOGS: LogEntry[] = [
  { time: "14:02:41", level: "INFO", msg: "Ingestion_Node completed data extraction." },
  { time: "14:02:42", level: "INFO", msg: "Analyst_Node spawned. PID: 4921" },
  { time: "14:02:45", level: "WARN", msg: "Analyst_Node: High memory pressure detected (85%)." },
];

export const REPL_HELP_LINES = [
  "  /help                — show this message",
  "  /pause <agentId>     — pause an agent",
  "  /resume <agentId>    — resume a paused agent",
  "  /inspect <agentId>   — dump agent state",
  "  /halt                — halt all agents",
  "  /exit | Ctrl+C       — quit",
];

/* ── display helpers ──────────────────────────────────────── */
import type { AgentStatus, LogLevel } from "./types";

export const STATUS_TERM_COLOR: Record<AgentStatus, string> = {
  running: "yellow",
  success: "green",
  queued: "gray",
  error: "red",
  paused: "cyan",
};

export const STATUS_HEX: Record<AgentStatus, string> = {
  running: "#2ff801",
  success: "#2ff801",
  queued: "#849495",
  error: "#ffb4ab",
  paused: "#00dbe7",
};

export const LOG_HEX: Record<LogLevel, string> = {
  INFO: "#00dbe7",
  WARN: "#ffb4ab",
  ERROR: "#ffb4ab",
  DEBUG: "#849495",
  CMD: "#bf00ff",
};

export const nowHHMMSS = (): string => new Date().toLocaleTimeString("en", { hour12: false });

/* ── platform-agnostic ADP client ────────────────────────── */
import type { AdpEvent, AdpCommand } from "./types";

export type AdpListener = (event: AdpEvent) => void;
export type AdpStatusListener = (connected: boolean) => void;

export class AdpClient {
  private url: string;
  private ws: WebSocket | null = null;
  private listeners: Set<AdpListener> = new Set();
  private statusListeners: Set<AdpStatusListener> = new Set();
  private destroyed = false;

  constructor(url = "ws://localhost:9222") {
    this.url = url;
  }

  connect() {
    if (this.destroyed) return;
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.addEventListener("open", () => {
      if (this.destroyed) return;
      this.statusListeners.forEach((fn) => fn(true));
    });

    ws.addEventListener("message", (ev: MessageEvent) => {
      try {
        const event: AdpEvent = JSON.parse(ev.data as string);
        this.listeners.forEach((fn) => fn(event));
      } catch {
        /* ignore malformed */
      }
    });

    ws.addEventListener("close", () => {
      if (this.destroyed) return;
      this.statusListeners.forEach((fn) => fn(false));
      setTimeout(() => this.connect(), 3000);
    });
  }

  send(command: Omit<AdpCommand, "jsonrpc" | "id">) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const payload: AdpCommand = { jsonrpc: "2.0", id: Date.now(), ...command };
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  onEvent(fn: AdpListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  onStatus(fn: AdpStatusListener) {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  destroy() {
    this.destroyed = true;
    this.ws?.close();
  }
}

/* ── repl command parser ─────────────────────────────────── */
export function parseReplCommand(raw: string): { method: string; args: string[] } | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return null;
  const [cmd, ...args] = trimmed.slice(1).split(" ");
  const method = `Debugger.${cmd.charAt(0).toUpperCase()}${cmd.slice(1)}`;
  return { method, args };
}
