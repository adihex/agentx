import React, { useState, useEffect, useRef, useCallback } from "react";
import { useKeyboard } from "@opentui/react";
import WebSocket from "ws";

const Box = (props: any) => <box {...props} />;
const Text = (props: any) => <text {...props} />;

/* ── types ── */
interface AgentNode {
  id: string;
  label: string;
  status: "running" | "queued" | "success" | "error" | "paused";
  progress: number;
  detail?: string;
}

interface LogEntry {
  time: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG" | "CMD";
  msg: string;
}

/* ── default state ── */
const DEFAULT_NODES: AgentNode[] = [
  { id: "ingestion", label: "Ingestion_Node", status: "success", progress: 100 },
  {
    id: "analyst",
    label: "Analyst_Node",
    status: "running",
    progress: 65,
    detail: "Processing data...",
  },
  {
    id: "coder",
    label: "Coder_Agent",
    status: "running",
    progress: 30,
    detail: "Compiling AST...",
  },
  { id: "validator", label: "Validator_System", status: "queued", progress: 0 },
];

const DEFAULT_LOGS: LogEntry[] = [
  { time: "14:02:41", level: "INFO", msg: "Ingestion_Node completed data extraction." },
  { time: "14:02:42", level: "INFO", msg: "Analyst_Node spawned. PID: 4921" },
  { time: "14:02:45", level: "WARN", msg: "Analyst_Node: High memory pressure detected." },
];

/* ── helpers ── */
const now = () => new Date().toLocaleTimeString("en", { hour12: false });

const NODE_COLOR: Record<string, string> = {
  running: "yellow",
  success: "green",
  queued: "gray",
  error: "red",
  paused: "cyan",
};

const REPL_HELP = [
  "  /help                — show this message",
  "  /pause <agentId>     — pause an agent",
  "  /resume <agentId>    — resume a paused agent",
  "  /inspect <agentId>   — dump agent state",
  "  /halt                — halt all agents",
  "  /exit | Ctrl+C       — quit",
];

/* ══════════════════════════════════════════════════════════════ */
export const AgxOrchestratorCLI = ({ onExit }: { onExit: () => void }) => {
  const [adpStatus, setAdpStatus] = useState<"CONNECTED" | "DISCONNECTED">("DISCONNECTED");
  const [nodes, setNodes] = useState<AgentNode[]>(DEFAULT_NODES);
  const [logs, setLogs] = useState<LogEntry[]>(DEFAULT_LOGS);
  const [replLines, setReplLines] = useState<string[]>(["AGX Debugger ready. Type /help."]);
  const [command, setCommand] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  /* ── log helpers ── */
  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev.slice(-50), entry]);
  }, []);

  const addRepl = useCallback((line: string) => {
    setReplLines((prev) => [...prev.slice(-30), line]);
  }, []);

  /* ── ADP WebSocket ── */
  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket("ws://localhost:9222");
      wsRef.current = ws;

      ws.on("open", () => {
        if (!cancelled) setAdpStatus("CONNECTED");
      });

      ws.on("message", (raw: string) => {
        try {
          const msg = JSON.parse(raw);

          if (msg.method === "Agent.StatusUpdate") {
            const { agentId, status, progress, detail } = msg.params;
            setNodes((prev) =>
              prev.map((n) => (n.id === agentId ? { ...n, status, progress, detail } : n)),
            );
            addLog({
              time: now(),
              level: "INFO",
              msg: `[${agentId}] status → ${status} (${progress}%)`,
            });
          }

          if (msg.method === "Log.Entry") {
            addLog({ time: now(), level: msg.params.level ?? "INFO", msg: msg.params.message });
          }

          if (msg.method === "Debugger.Response") {
            addRepl(`  ← ${msg.params.result}`);
          }
        } catch {
          /* ignore malformed frames */
        }
      });

      ws.on("close", () => {
        if (cancelled) return;
        setAdpStatus("DISCONNECTED");
        setTimeout(connect, 3000);
      });
    };

    connect();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [addLog, addRepl]);

  /* ── REPL command dispatch ── */
  const dispatch = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim();
      addRepl(`agx@debugger:~$ ${trimmed}`);

      if (!trimmed) return;

      if (trimmed === "/help") {
        REPL_HELP.forEach((l) => addRepl(l));
        return;
      }

      if (trimmed === "/exit" || trimmed === "/quit") {
        onExit();
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const [method, ...args] = trimmed.replace("/", "").split(" ");
        wsRef.current.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: Date.now(),
            method: `Debugger.${method.charAt(0).toUpperCase() + method.slice(1)}`,
            params: { args },
          }),
        );
      } else {
        addRepl("  [OFFLINE] Not connected to ADP server.");
      }
    },
    [addRepl, onExit],
  );

  /* ── keyboard ── */
  useKeyboard((event) => {
    if (event.name === "return" || event.name === "enter") {
      dispatch(command);
      setCommand("");
    } else if (event.ctrl && event.name === "c") {
      onExit();
    } else if (event.name === "backspace") {
      setCommand((prev) => prev.slice(0, -1));
    } else if (event.name === "space") {
      setCommand((prev) => prev + " ");
    } else if (!event.ctrl && !event.meta && !event.option && event.name.length === 1) {
      setCommand((prev) => prev + event.name);
    }
  });

  /* ── render helpers ── */
  const renderNode = (node: AgentNode) => {
    const color = NODE_COLOR[node.status] ?? "gray";
    const label = `${node.label} [${node.status.toUpperCase()}]`;
    return (
      <Box
        key={node.id}
        borderStyle="round"
        borderColor={color}
        paddingX={1}
        flexDirection="column"
      >
        <Text color={color}>{label}</Text>
        {node.detail && <Text dimColor>{node.detail}</Text>}
        <Text color={color}>
          {"█".repeat(Math.floor(node.progress / 10))}
          {"░".repeat(10 - Math.floor(node.progress / 10))} {node.progress}%
        </Text>
      </Box>
    );
  };

  const levelColor = (level: string) => {
    if (level === "WARN" || level === "ERROR") return "red";
    if (level === "CMD") return "magenta";
    if (level === "DEBUG") return "gray";
    return "cyan";
  };

  /* ── view ── */
  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1} justifyContent="space-between">
        <Text bold color="cyan">
          AGX ORCHESTRATOR v0.1
        </Text>
        <Box gap={2}>
          <Text dimColor>ADP: </Text>
          <Text color={adpStatus === "CONNECTED" ? "green" : "red"}>{adpStatus}</Text>
          <Text dimColor> Nodes: </Text>
          <Text color="cyan">{nodes.filter((n) => n.status === "running").length} running</Text>
        </Box>
      </Box>

      {/* DAG pane */}
      <Box borderStyle="single" borderColor="gray" height={10} flexDirection="column" paddingX={1}>
        <Text color="gray">─── DAG Orchestrator ───</Text>
        <Box flexGrow={1} justifyContent="center" alignItems="center" gap={2} flexWrap="wrap">
          {nodes.map(renderNode)}
        </Box>
      </Box>

      {/* Bottom split */}
      <Box flexGrow={1} flexDirection="row">
        {/* REPL */}
        <Box
          borderStyle="single"
          borderColor="gray"
          width="40%"
          flexDirection="column"
          paddingX={1}
        >
          <Text color="gray">─── ADP REPL ───</Text>
          <Box flexGrow={1} flexDirection="column" justifyContent="flex-end">
            {replLines.slice(-8).map((l, i) => (
              <Text key={i} color={l.startsWith("agx@") ? "white" : "gray"}>
                {l}
              </Text>
            ))}
            <Text color="cyan">agx@debugger:~$ {command}█</Text>
          </Box>
        </Box>

        {/* Logs */}
        <Box
          borderStyle="single"
          borderColor="gray"
          width="60%"
          flexDirection="column"
          paddingX={1}
        >
          <Text color="gray">─── Execution Logs ───</Text>
          <Box flexGrow={1} flexDirection="column">
            {logs.slice(-12).map((log, i) => (
              <Box key={i} gap={1}>
                <Text dimColor>{log.time}</Text>
                <Text color={levelColor(log.level)}>[{log.level}]</Text>
                <Text>{log.msg}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box paddingX={1}>
        <Text dimColor>Tab: panes /help: commands Ctrl+C: exit</Text>
      </Box>
    </Box>
  );
};
