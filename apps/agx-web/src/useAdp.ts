import { useEffect, useReducer, useState, useCallback } from "react";
import {
  AdpClient,
  DEFAULT_NODES,
  DEFAULT_LOGS,
  nowHHMMSS,
  nodeReducer,
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

  useEffect(() => {
    const client = new AdpClient(url);

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
        addRepl(`  ← ${String(ev.params.result)}`);
      }
    });

    client.connect();
    return () => {
      offStatus();
      offEvent();
      client.destroy();
    };
  }, [url, addLog, addRepl]);

  const sendCommand = useCallback(
    (cmd: string) => {
      addRepl(`agx@debugger:~$ ${cmd}`);
      // AdpClient is scoped to the effect; open a one-shot WS for REPL sends
      const ws = new WebSocket(url);
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: Date.now(),
            method: cmd.replace("/", "Debugger."),
            params: {},
          }),
        );
        ws.close();
      };
    },
    [url, addRepl],
  );

  return { connected, nodes, logs, replOutput, sendCommand };
}
