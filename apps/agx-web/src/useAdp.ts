import { useEffect, useReducer, useRef, useState, useCallback } from "react";
import {
  AdpClient,
  DEFAULT_NODES,
  DEFAULT_LOGS,
  REPL_HELP_LINES,
  nowHHMMSS,
  nodeReducer,
  parseReplCommand,
  formatAdpResponseBody,
  type AgentNode,
  type LogEntry,
} from "@agentx/agx-core";

export type { AgentNode, LogEntry };

export function useAdp(url = "ws://localhost:9222") {
  const [connected, setConnected] = useState(false);
  const [nodes, dispatch] = useReducer(nodeReducer, DEFAULT_NODES);
  const [logs, setLogs] = useState<LogEntry[]>(DEFAULT_LOGS);
  const [replOutput, setReplOutput] = useState<string[]>([
    "AGX Debugger initialized. Ready for commands.",
    "Type /help for a list of commands.",
  ]);

  const addLog = useCallback((e: LogEntry) => setLogs((p) => [...p.slice(-99), e]), []);
  const addRepl = useCallback((l: string) => setReplOutput((p) => [...p.slice(-99), l]), []);

  const clientRef = useRef<AdpClient | null>(null);

  useEffect(() => {
    const client = new AdpClient(url);
    clientRef.current = client;

    const offStatus = client.onStatus((c) => setConnected(c));
    const offEvent = client.onEvent((ev) => {
      const t = nowHHMMSS();
      if (ev.method === "Agent.StatusUpdate") {
        const { agentId, status, progress, detail } = ev.params as any;
        dispatch({ type: "STATUS_UPDATE", id: agentId, status, progress, detail });
        addLog({ time: t, level: "INFO", msg: `[${agentId}] → ${status} (${progress}%)` });
      }
      if (ev.method === "Log.Entry") {
        addLog({
          time: t,
          level: (ev.params.level as any) ?? "INFO",
          msg: ev.params.message as string,
        });
      }
      if (ev.method === "Debugger.Response") {
        addRepl(`  ← ${formatAdpResponseBody(ev.params)}`);
      }
    });

    client.connect();
    return () => {
      clientRef.current = null;
      offStatus();
      offEvent();
      client.destroy();
    };
  }, [url, addLog, addRepl]);

  const sendCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      addRepl(`agx@debugger:~$ ${trimmed}`);
      if (trimmed === "/help") {
        REPL_HELP_LINES.forEach(addRepl);
        return;
      }
      const parsed = parseReplCommand(trimmed);
      if (!parsed) {
        addRepl(`  Unknown command: ${trimmed}`);
        return;
      }
      // Reuse the persistent client — the server pushes Debugger.Response
      // events on this socket, which a one-shot socket would never live to see.
      if (!clientRef.current?.send({ method: parsed.method, params: { args: parsed.args } })) {
        addRepl("  Not connected to the runtime.");
      }
    },
    [addRepl],
  );

  return { connected, nodes, logs, replOutput, sendCommand };
}
