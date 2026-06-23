import { useState, useRef } from "react";
import { useAdp, type AgentNode, type LogEntry } from "./useAdp";
import { STATUS_HEX, LOG_HEX } from "@agentx/agx-core";

/* ────────────────────────── tiny helpers ─────────────────────────── */
const STATUS_BG: Record<string, string> = {
  running: "rgba(47,248,1,0.10)",
  success: "rgba(47,248,1,0.10)",
  queued: "rgba(132,148,149,0.10)",
  error: "rgba(255,180,171,0.10)",
  paused: "rgba(0,219,231,0.10)",
};

function NodeCard({ node }: { node: AgentNode }) {
  const bar = Math.round(node.progress);
  const color = STATUS_HEX[node.status] ?? "#849495";
  const bg = STATUS_BG[node.status] ?? "transparent";
  const isActive = node.status === "running";
  return (
    <div
      className="flex flex-col gap-1 p-3 border text-xs font-mono transition-all duration-300"
      style={{
        borderColor: color,
        background: bg,
        boxShadow: isActive ? `0 0 10px ${color}44` : "none",
      }}
    >
      <div className="flex justify-between items-center">
        <span style={{ color }}>{node.label}</span>
        <span
          className="px-1 text-[10px] uppercase border"
          style={{ color, borderColor: `${color}66`, background: `${color}22` }}
        >
          {node.status}
        </span>
      </div>
      {node.detail && (
        <div className="text-[10px]" style={{ color: "#b9cacb" }}>
          {node.detail}
        </div>
      )}
      <div className="h-1 w-full rounded-none" style={{ background: "#1c1b1c" }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${bar}%`, background: color }}
        />
      </div>
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const color = LOG_HEX[entry.level] ?? "#849495";
  return (
    <div className="flex gap-3 hover:bg-white/5 px-1 py-0.5 font-mono text-xs leading-5">
      <span className="w-16 shrink-0 text-[#849495]">{entry.time}</span>
      <span className="w-12 shrink-0 font-bold" style={{ color }}>
        [{entry.level}]
      </span>
      <span style={{ color: "#b9cacb" }}>{entry.msg}</span>
    </div>
  );
}

/* ───────────────────────────── main ─────────────────────────────── */
export default function Dashboard() {
  const { connected, nodes, logs, replOutput, sendCommand } = useAdp();
  const [input, setInput] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const replEndRef = useRef<HTMLDivElement>(null);

  const handleReplSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendCommand(input.trim());
    setInput("");
    setTimeout(() => replEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  /* node layout positions (% left, % top) */
  const positions = [
    { left: "5%", top: "50%" },
    { left: "35%", top: "25%" },
    { left: "35%", top: "75%" },
    { left: "65%", top: "50%" },
  ];

  return (
    <div
      className="flex flex-col w-full h-full overflow-hidden"
      style={{ background: "#131314", color: "#e5e2e3" }}
    >
      {/* ── header ── */}
      <header
        className="flex items-center justify-between px-4 h-10 shrink-0 border-b font-mono text-xs"
        style={{ background: "#201f20", borderColor: "#3a494b" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-bold text-sm tracking-widest"
            style={{ color: "#00dbe7", fontFamily: "Space Grotesk, sans-serif" }}
          >
            AGX ORCHESTRATOR
          </span>
          <span style={{ color: "#3a494b" }}>|</span>
          <span style={{ color: "#849495" }}>v0.1.0-alpha</span>
        </div>
        <div className="flex items-center gap-4" style={{ color: "#849495" }}>
          <span>
            CPU: <span style={{ color: "#2ff801" }}>42%</span>
          </span>
          <span>
            MEM: <span style={{ color: "#2ff801" }}>3.1 GB</span>
          </span>
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                background: connected ? "#2ff801" : "#ffb4ab",
                boxShadow: connected ? "0 0 6px #2ff801" : "none",
              }}
            />
            <span style={{ color: connected ? "#2ff801" : "#ffb4ab" }}>
              {connected ? "ADP LIVE" : "ADP OFFLINE"}
            </span>
          </div>
        </div>
      </header>

      {/* ── top 60%: DAG pane ── */}
      <section
        className="relative overflow-hidden border-b"
        style={{ height: "60%", borderColor: "#3a494b", background: "#0e0e0f" }}
      >
        {/* pane label */}
        <div
          className="absolute top-0 left-0 right-0 h-7 flex items-center px-3 gap-2 border-b font-mono text-xs z-10"
          style={{ background: "#1c1b1c", borderColor: "#3a494b" }}
        >
          <span style={{ color: "#00dbe7" }}>◈</span>
          <span style={{ color: "#849495" }}>DAG Orchestrator</span>
          <span className="ml-auto flex gap-4" style={{ color: "#849495" }}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: "#2ff801" }} /> RUNNING
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: "#849495" }} /> QUEUED
            </span>
          </span>
        </div>

        {/* dot grid */}
        <div
          className="absolute inset-0 mt-7"
          style={{
            backgroundImage: "radial-gradient(circle, #3a494b 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* SVG edges */}
        <svg
          className="absolute inset-0 w-full h-full mt-7 pointer-events-none"
          style={{ overflow: "visible" }}
        >
          <defs>
            <marker
              id="arrow-green"
              markerWidth="6"
              markerHeight="6"
              refX="3"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#2ff801" />
            </marker>
            <marker
              id="arrow-gray"
              markerWidth="6"
              markerHeight="6"
              refX="3"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#3a494b" />
            </marker>
          </defs>
          {/* Ingestion → Analyst */}
          <line
            x1="22%"
            y1="50%"
            x2="35%"
            y2="25%"
            stroke="#2ff801"
            strokeWidth="1.5"
            markerEnd="url(#arrow-green)"
            style={{ filter: "drop-shadow(0 0 3px #2ff801)" }}
          />
          {/* Ingestion → Coder */}
          <line
            x1="22%"
            y1="50%"
            x2="35%"
            y2="75%"
            stroke="#2ff801"
            strokeWidth="1.5"
            markerEnd="url(#arrow-green)"
            style={{ filter: "drop-shadow(0 0 3px #2ff801)" }}
          />
          {/* Analyst → Validator */}
          <line
            x1="57%"
            y1="25%"
            x2="65%"
            y2="50%"
            stroke="#3a494b"
            strokeWidth="1"
            strokeDasharray="4"
            markerEnd="url(#arrow-gray)"
          />
          {/* Coder → Validator */}
          <line
            x1="57%"
            y1="75%"
            x2="65%"
            y2="50%"
            stroke="#3a494b"
            strokeWidth="1"
            strokeDasharray="4"
            markerEnd="url(#arrow-gray)"
          />
        </svg>

        {/* Node cards */}
        {nodes.map((node, i) => (
          <div
            key={node.id}
            className="absolute w-44 -translate-y-1/2"
            style={{
              left: positions[i]?.left ?? "0%",
              top: `calc(${positions[i]?.top ?? "0%"} + 28px)`,
            }}
          >
            <NodeCard node={node} />
          </div>
        ))}
      </section>

      {/* ── bottom 40%: REPL + Logs ── */}
      <section className="flex flex-row" style={{ height: "40%" }}>
        {/* ADP REPL (40%) */}
        <div className="flex flex-col border-r" style={{ width: "40%", borderColor: "#3a494b" }}>
          <div
            className="h-7 shrink-0 flex items-center px-3 gap-2 border-b font-mono text-xs"
            style={{ background: "#1c1b1c", borderColor: "#3a494b" }}
          >
            <span style={{ color: "#00dbe7" }}>$</span>
            <span style={{ color: "#849495" }}>Agent Debugger Protocol</span>
          </div>
          <div
            className="flex-1 overflow-y-auto p-2 font-mono text-xs leading-5"
            style={{ background: "#0e0e0f" }}
          >
            {replOutput.map((line, i) => (
              <div key={i} style={{ color: line.startsWith("agx@") ? "#e5e2e3" : "#849495" }}>
                {line}
              </div>
            ))}
            <div ref={replEndRef} />
          </div>
          <form
            onSubmit={handleReplSubmit}
            className="flex items-center gap-2 px-2 py-1 border-t font-mono text-xs"
            style={{ background: "#131314", borderColor: "#3a494b" }}
          >
            <span style={{ color: "#00dbe7" }}>agx@debugger:~$</span>
            <input
              className="flex-1 bg-transparent outline-none"
              style={{ color: "#e5e2e3", caretColor: "#00dbe7" }}
              placeholder="/pause | /inspect | /resume"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </form>
        </div>

        {/* Streaming Logs (60%) */}
        <div className="flex flex-col" style={{ width: "60%" }}>
          <div
            className="h-7 shrink-0 flex items-center justify-between px-3 border-b font-mono text-xs"
            style={{ background: "#1c1b1c", borderColor: "#3a494b" }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: "#00dbe7" }}>≡</span>
              <span style={{ color: "#849495" }}>Execution Logs</span>
            </div>
            <span
              className="text-[10px] uppercase px-1 border cursor-pointer hover:border-cyan-400 transition-colors"
              style={{ color: "#849495", borderColor: "#3a494b" }}
              onClick={() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              ↓ TAIL
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-1 py-1" style={{ background: "#0e0e0f" }}>
            {logs.map((entry, i) => (
              <LogRow key={i} entry={entry} />
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </section>
    </div>
  );
}
