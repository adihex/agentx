// Required env vars: OPENAI_API_KEY, OPENAI_BASE_URL (OpenCode Zen endpoint), AGENT_MODEL
import "dotenv/config";
import React, { useState, useEffect, useRef } from "react";
import { createRoot, useKeyboard } from "@opentui/react";
import { createCliRenderer } from "@opentui/core";
import { AgentEventLoop } from "@agentx/core";
import os from "node:os";
import {
  getSystemStatsTool,
  getTopProcessesTool,
  killProcessTool,
  cleanTempFilesTool,
} from "./tools/system.js";

// Layout types
interface BoxProps {
  children?: React.ReactNode;
  borderStyle?: "single" | "double" | "round" | "bold" | "classic";
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

interface ChatMessage {
  role: "user" | "assistant" | "system";
  text: string;
}

const SysmonApp = ({ onExit }: { onExit: () => void }) => {
  const [stats, setStats] = useState({
    cpu: "0%",
    mem: "0%",
    freeMem: "0 GB",
    totalMem: "0 GB",
    load: [0, 0, 0],
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      text: "System Optimizer Agent initialized. Type commands or ask about system load.",
    },
  ]);
  const [command, setCommand] = useState("");
  const agentRef = useRef<AgentEventLoop | undefined>(undefined);

  // Initialize Agent
  if (!agentRef.current) {
    agentRef.current = new AgentEventLoop({
      systemPrompt: [
        "You are an autonomous System Monitor and Optimizer CLI Agent.",
        "Your job is to continuously monitor system performance (CPU, Memory, Uptime) and processes.",
        "When the user asks, check the stats or top processes.",
        "Before you execute any active optimization like killing a process (killProcess) or clearing temp files (cleanTempFiles),",
        "you MUST explicitly list the proposed action and ask the user for approval.",
        "Do NOT call killProcess or cleanTempFiles unless the user gives permission.",
      ].join(" "),
      tools: {
        getSystemStats: getSystemStatsTool,
        getTopProcesses: getTopProcessesTool,
        killProcess: killProcessTool,
        cleanTempFiles: cleanTempFilesTool,
      },
      autoTick: true,
      adpPort: 9223, // custom port to avoid conflict
    });
  }

  // Telemetry Polling
  useEffect(() => {
    let lastCpuTimes = os.cpus().map((c) => c.times);

    const interval = setInterval(() => {
      // Memory
      const total = os.totalmem();
      const free = os.freemem();
      const used = total - free;
      const memPercent = ((used / total) * 100).toFixed(1) + "%";
      const freeGB = (free / (1024 * 1024 * 1024)).toFixed(2) + " GB";
      const totalGB = (total / (1024 * 1024 * 1024)).toFixed(2) + " GB";

      // CPU
      const cpus = os.cpus();
      let totalDiff = 0;
      let idleDiff = 0;
      cpus.forEach((cpu, i) => {
        const last = lastCpuTimes[i];
        const current = cpu.times;
        if (!last) return;

        const lastTotal = last.user + last.nice + last.sys + last.idle + last.irq;
        const currentTotal = current.user + current.nice + current.sys + current.idle + current.irq;

        totalDiff += currentTotal - lastTotal;
        idleDiff += current.idle - last.idle;
      });
      lastCpuTimes = cpus.map((c) => c.times);
      const cpuPercent =
        totalDiff > 0 ? (((totalDiff - idleDiff) / totalDiff) * 100).toFixed(1) + "%" : "0%";

      setStats({
        cpu: cpuPercent,
        mem: memPercent,
        freeMem: freeGB,
        totalMem: totalGB,
        load: os.loadavg(),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Agent Event Integration
  useEffect(() => {
    const agent = agentRef.current!;

    const onInferenceStart = () => {
      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);
    };

    const onInferenceChunk = (payload: { chunk: string }) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant") {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...last,
            text: last.text + payload.chunk,
          };
          return updated;
        }
        return prev;
      });
    };

    const onToolDispatch = (payload: { toolName: string; id: string; args: unknown }) => {
      setMessages((prev) => [
        ...prev,
        { role: "system", text: `🔧 Running tool: ${payload.toolName}...` },
      ]);
    };

    const onToolComplete = (payload: any) => {
      setMessages((prev) => [...prev, { role: "system", text: `✅ ${payload.toolName} done.` }]);
    };

    agent.on("inference.start", onInferenceStart);
    agent.on("inference.chunk", onInferenceChunk);
    agent.on("tool.dispatch", onToolDispatch);
    agent.on("tool.complete", onToolComplete);

    return () => {
      agent.off("inference.start", onInferenceStart);
      agent.off("inference.chunk", onInferenceChunk);
      agent.off("tool.dispatch", onToolDispatch);
      agent.off("tool.complete", onToolComplete);
    };
  }, []);

  // Keyboard controls
  useKeyboard((event) => {
    if (event.name === "return" || event.name === "enter") {
      if (command.trim()) {
        const userMsg = command.trim();
        setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
        setCommand("");

        agentRef.current!.run(userMsg).catch((err: any) => {
          setMessages((prev) => [
            ...prev,
            { role: "system", text: `[Error] ${err.message || err}` },
          ]);
        });
      }
    } else if (event.ctrl && event.name === "c") {
      void agentRef.current!.shutdown().then(() => {
        onExit();
      });
    } else if (event.name === "backspace") {
      setCommand((p) => p.slice(0, -1));
    } else if (event.name === "space") {
      setCommand((p) => p + " ");
    } else if (!event.ctrl && !event.meta && !event.option && event.name.length === 1) {
      setCommand((p) => p + event.name);
    }
  });

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Title Header */}
      <Box borderStyle="single" borderColor="magenta" paddingX={1} justifyContent="space-between">
        <Text bold color="magenta">
          SYSTEM OPTIMIZER CLI v0.1
        </Text>
        <Box gap={2}>
          <Text dimColor>Uptime:</Text>
          <Text color="cyan">{Math.floor(os.uptime() / 60)}m</Text>
        </Box>
      </Box>

      {/* Stats row */}
      <Box
        borderStyle="single"
        borderColor="gray"
        height={6}
        flexDirection="row"
        paddingX={1}
        gap={4}
      >
        <Box flexDirection="column">
          <Text color="cyan" bold>
            CPU Usage
          </Text>
          <Text color="white">{stats.cpu}</Text>
        </Box>
        <Box flexDirection="column">
          <Text color="cyan" bold>
            Memory Usage
          </Text>
          <Text color="white">
            {stats.mem} ({stats.freeMem} free / {stats.totalMem})
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color="cyan" bold>
            Load Avg
          </Text>
          <Text color="white">{stats.load.map((l) => l.toFixed(2)).join(", ")}</Text>
        </Box>
      </Box>

      {/* Main Console */}
      <Box flexGrow={1} borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1}>
        <Text color="gray">─── Console & Chat ───</Text>
        <Box flexGrow={1} flexDirection="column" justifyContent="flex-end">
          {messages.slice(-15).map((msg, i) => (
            <Box key={i} flexDirection="row" gap={1}>
              {msg.role === "user" && <Text color="green">[User]:</Text>}
              {msg.role === "assistant" && <Text color="magenta">[Agent]:</Text>}
              {msg.role === "system" && <Text color="yellow">[Sys]:</Text>}
              <Text>{msg.text}</Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Input Prompter */}
      <Box paddingX={1}>
        <Text color="cyan">sysmon@agentx:~$ {command}█</Text>
        <Text dimColor>Ctrl+C to Exit</Text>
      </Box>
    </Box>
  );
};

const main = async () => {
  const renderer = await createCliRenderer();
  const root = createRoot(renderer);

  const handleExit = () => {
    renderer.destroy();
    process.exit(0);
  };

  root.render(<SysmonApp onExit={handleExit} />);
};

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
