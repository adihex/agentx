import type { AgentNode, AgentStatus } from "./types";

export type NodeAction =
  | { type: "STATUS_UPDATE"; id: string; status: AgentStatus; progress: number; detail?: string }
  | { type: "RESET"; nodes: AgentNode[] };

export function nodeReducer(state: AgentNode[], action: NodeAction): AgentNode[] {
  switch (action.type) {
    case "STATUS_UPDATE":
      return state.map((n) =>
        n.id === action.id
          ? { ...n, status: action.status, progress: action.progress, detail: action.detail }
          : n,
      );
    case "RESET":
      return action.nodes;
  }
}
