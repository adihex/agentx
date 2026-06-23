/* ── shared types ─────────────────────────────────────────── */
export type AgentStatus = "running" | "queued" | "success" | "error" | "paused";
export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "CMD";

export interface AgentNode {
  id: string;
  label: string;
  status: AgentStatus;
  progress: number; // 0-100
  detail?: string;
}

export interface LogEntry {
  time: string;
  level: LogLevel;
  msg: string;
}

export interface AdpEvent {
  jsonrpc: "2.0";
  method: string;
  params: Record<string, unknown>;
}

export interface AdpCommand {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: Record<string, unknown>;
}
