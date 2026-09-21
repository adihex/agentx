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
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private requestSeq = 0;
  private pendingResponses = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  /** First retry stays at the documented 3s; later retries double up to 30s. */
  private static readonly RECONNECT_BASE_MS = 3000;
  private static readonly RECONNECT_MAX_MS = 30000;

  constructor(
    url = "ws://localhost:9222",
    options: { token?: string } = {},
  ) {
    // The ws transport cannot set headers on every platform, so ADP auth is
    // carried as a ?token= query parameter (see @agentx/adp principalFor).
    this.url = options.token
      ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(options.token)}`
      : url;
  }

  connect() {
    if (this.destroyed) return;
    this.reconnectTimer = null;
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.addEventListener("open", () => {
      if (this.destroyed) return;
      this.reconnectAttempts = 0;
      this.statusListeners.forEach((fn) => fn(true));
    });

    ws.addEventListener("message", (ev: MessageEvent) => {
      try {
        const frame = JSON.parse(ev.data as string) as {
          id?: string | number;
          method?: string;
          params?: unknown;
          result?: unknown;
          error?: { message?: string };
        };
        // A frame with an `id` and no `method` is a response, not an event:
        // settle the matching sendAndWait instead of broadcasting it.
        if (frame.method === undefined && frame.id !== undefined) {
          const frameId = String(frame.id);
          const pending = this.pendingResponses.get(frameId);
          if (!pending) return;
          this.pendingResponses.delete(frameId);
          clearTimeout(pending.timer);
          if (frame.error) {
            pending.reject(new Error(frame.error.message ?? "ADP error"));
          } else {
            pending.resolve(frame.result);
          }
          return;
        }
        this.listeners.forEach((fn) => fn(frame as AdpEvent));
      } catch {
        /* ignore malformed */
      }
    });

    ws.addEventListener("close", () => {
      if (this.destroyed) return;
      this.statusListeners.forEach((fn) => fn(false));
      // A dead socket must not leave sendAndWait awaiters hanging.
      for (const pending of this.pendingResponses.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error("WebSocket closed before the response arrived"));
      }
      this.pendingResponses.clear();
      // Back off between retries so a permanently-down server is not pinged
      // every 3 seconds forever.
      const delay = Math.min(
        AdpClient.RECONNECT_BASE_MS * 2 ** this.reconnectAttempts,
        AdpClient.RECONNECT_MAX_MS,
      );
      this.reconnectAttempts++;
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
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

  /**
   * Send a command and await its JSON-RPC response (correlated by id).
   * Rejects when the socket is not OPEN, on an error response, or after
   * `timeoutMs` (default 5s). Fire-and-forget callers should keep using
   * `send()` + the `Debugger.Response` event push.
   */
  sendAndWait<T = unknown>(
    command: Omit<AdpCommand, "jsonrpc" | "id">,
    timeoutMs = 5000,
  ): Promise<T> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("WebSocket is not open"));
    }
    // String ids stay unique even under frozen fake timers.
    const id = `${Date.now()}-${this.requestSeq++}`;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingResponses.delete(id)) {
          reject(new Error(`ADP request timed out after ${timeoutMs}ms: ${command.method}`));
        }
      }, timeoutMs);
      this.pendingResponses.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
        timer,
      });
      this.ws!.send(JSON.stringify({ jsonrpc: "2.0", id, ...command }));
    });
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
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    for (const pending of this.pendingResponses.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("ADP client destroyed"));
    }
    this.pendingResponses.clear();
    this.ws?.close();
  }
}

/* ── repl command parser ─────────────────────────────────── */

/**
 * Render the payload of a `Debugger.Response` frame for a REPL/log line.
 * Error frames render as `error: <message>`; result frames JSON-stringify so
 * objects never collapse to `[object Object]`.
 */
export function formatAdpResponseBody(
  params: { result?: unknown; error?: unknown } | undefined,
): string {
  if (params && params.error !== undefined) {
    const err = params.error;
    return `error: ${typeof err === "string" ? err : JSON.stringify(err)}`;
  }
  return JSON.stringify(params?.result ?? params) ?? "undefined";
}

export function parseReplCommand(raw: string): { method: string; args: string[] } | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return null;
  const [cmd, ...args] = trimmed.slice(1).split(" ");
  if (!cmd) return null;
  // A dotted verb is already a fully-qualified ADP method (`/Memory.compact`,
  // `/Session.prompt`) — send it verbatim so the whole protocol is reachable.
  // Bare verbs keep the legacy `Debugger.<Verb>` shape the server aliases.
  const method = cmd.includes(".")
    ? cmd
    : `Debugger.${cmd.charAt(0).toUpperCase()}${cmd.slice(1)}`;
  return { method, args };
}
