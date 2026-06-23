import React, { useReducer, useState, useEffect, useCallback, useRef } from "react";
import { useKeyboard } from "@opentui/react";
import {
  AdpClient,
  DEFAULT_NODES,
  DEFAULT_LOGS,
  REPL_HELP_LINES,
  STATUS_TERM_COLOR,
  parseReplCommand,
  nowHHMMSS,
  nodeReducer,
  type AgentNode,
  type LogEntry,
  type LogLevel,
} from "@agentx/agx-core";

interface BoxProps {
  children?: React.ReactNode;
  borderStyle?: "single" | "double" | "round" | "bold" | "singleDouble" | "doubleSingle" | "classic";
  borderColor?: string;
  paddingX?: number;
  paddingY?: number;
  flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  flexGrow?: number;
  width?: string | number;
  height?: string | number;
  gap?: number;
  flexWrap?: "wrap" | "nowrap" | "wrap-reverse";
  marginLeft?: string | number;
  key?: string | number;
}

interface TextProps {
  children?: React.ReactNode;
  color?: string;
  bold?: boolean;
  dimColor?: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      box: BoxProps;
      text: TextProps;
    }
  }
}

const Box = (props: BoxProps) => (
  // @ts-expect-error custom TUI intrinsic element
  <box {...props}>{props.children}</box>
);
const Text = (props: TextProps) => <text {...props}>{props.children}</text>;

const levelColor = (level: LogLevel): string => {
  if (level === "WARN" || level === "ERROR") return "red";
  if (level === "CMD") return "magenta";
  if (level === "DEBUG") return "gray";
  return "cyan";
};

const renderNode = (node: AgentNode) => {
  const color = STATUS_TERM_COLOR[node.status] ?? "gray";
  const filled = Math.floor(node.progress / 10);
  return (
    <Box key={node.id} borderStyle="round" borderColor={color} paddingX={1} flexDirection="column">
      <Text color={color}>
        {node.label} [{node.status.toUpperCase()}]
      </Text>
      {node.detail && <Text dimColor>{node.detail}</Text>}
      <Box gap={1}>
        <Text color={color}>
          {"█".repeat(filled)}
          {"░".repeat(10 - filled)}
        </Text>
        <Text color={color}>{node.progress}%</Text>
      </Box>
    </Box>
  );
};

export const AgxOrchestratorCLI = ({ onExit }: { onExit: () => void }) => {
  const [adpStatus, setAdpStatus] = useState<"CONNECTED" | "DISCONNECTED">("DISCONNECTED");
  const [nodes, dispatch] = useReducer(nodeReducer, DEFAULT_NODES);
  const [logs, setLogs] = useState<LogEntry[]>(DEFAULT_LOGS);
  const [replLines, setReplLines] = useState<string[]>(["AGX Debugger ready. Type /help."]);
  const [command, setCommand] = useState("");

  const clientRef = useRef<AdpClient | null>(null);

  const addLog = useCallback((e: LogEntry) => setLogs((p) => [...p.slice(-50), e]), []);
  const addRepl = useCallback((l: string) => setReplLines((p) => [...p.slice(-30), l]), []);

  /* ADP client */
  useEffect(() => {
    const client = new AdpClient();
    clientRef.current = client;

    const offStatus = client.onStatus((connected) =>
      setAdpStatus(connected ? "CONNECTED" : "DISCONNECTED"),
    );
    const offEvent = client.onEvent((ev) => {
      if (ev.method === "Agent.StatusUpdate") {
        const params = ev.params as unknown as AgentNode & { agentId: string };
        const { agentId, status, progress, detail } = params;
        dispatch({ type: "STATUS_UPDATE", id: agentId, status, progress, detail });
        addLog({
          time: nowHHMMSS(),
          level: "INFO",
          msg: `[${agentId}] → ${status} (${progress}%)`,
        });
      }
      if (ev.method === "Log.Entry") {
        const params = ev.params as { level?: string; message: string };
        addLog({
          time: nowHHMMSS(),
          level: (params.level as LogLevel) ?? "INFO",
          msg: params.message,
        });
      }
      if (ev.method === "Debugger.Response") {
        const params = ev.params as { result: unknown };
        addRepl(`  ← ${String(params.result)}`);
      }
    });

    client.connect();
    return () => {
      offStatus();
      offEvent();
      client.destroy();
      clientRef.current = null;
    };
  }, [addLog, addRepl]);

  /* REPL dispatch */
  const dispatch_cmd = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      addRepl(`agx@debugger:~$ ${trimmed}`);
      if (!trimmed) return;
      if (trimmed === "/help") {
        REPL_HELP_LINES.forEach(addRepl);
        return;
      }
      if (trimmed === "/exit" || trimmed === "/quit") {
        onExit();
        return;
      }

      const parsed = parseReplCommand(trimmed);
      if (!parsed) {
        addRepl("  Unknown command. Try /help.");
        return;
      }

      if (clientRef.current) {
        const sent = clientRef.current.send({
          method: parsed.method,
          params: { args: parsed.args },
        });
        if (sent) {
          addRepl("  [SENT] " + parsed.method);
        } else {
          addRepl("  [ERROR] Failed to send command (disconnected).");
        }
      }
    },
    [addRepl, onExit],
  );

  useKeyboard((event) => {
    if (event.name === "return" || event.name === "enter") {
      dispatch_cmd(command);
      setCommand("");
    } else if (event.ctrl && event.name === "c") {
      onExit();
    } else if (event.name === "backspace") {
      setCommand((p) => p.slice(0, -1));
    } else if (!event.ctrl && !event.meta && !event.option && event.name.length === 1) {
      setCommand((p) => p + event.name);
    }
  });

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Header */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1} justifyContent="space-between">
        <Text bold color="cyan">
          AGX ORCHESTRATOR v0.1
        </Text>
        <Box gap={2}>
          <Text dimColor>ADP:</Text>
          <Text color={adpStatus === "CONNECTED" ? "green" : "red"}>{adpStatus}</Text>
          <Text dimColor> Running:</Text>
          <Text color="cyan">{nodes.filter((n) => n.status === "running").length}</Text>
        </Box>
      </Box>

      {/* DAG */}
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

      <Box paddingX={1}>
        <Text dimColor>/help: commands Ctrl+C: exit</Text>
      </Box>
    </Box>
  );
};
