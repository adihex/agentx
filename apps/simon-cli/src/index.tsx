// Required env vars: OPENAI_API_KEY, OPENAI_BASE_URL (OpenCode Zen endpoint), AGENT_MODEL
import "dotenv/config";
import React, { useState, useEffect, useRef } from "react";
import { createRoot, useKeyboard, useTerminalDimensions } from "@opentui/react";
import { createCliRenderer, TextAttributes } from "@opentui/core";
import { AgentEventLoop } from "@agentx/core";
import os from "node:os";
import {
  getSystemStatsTool,
  getTopProcessesTool,
  killProcessTool,
  cleanTempFilesTool,
} from "./tools/system.js";
import {
  RAW,
  col,
  REDUCED_MOTION,
  sevColor,
  sevGlyph,
  pctSeverity,
  loadSeverity,
  sparkline,
  gauge,
  formatUptime,
  parsePercent,
  isDestructiveTool,
  SPINNER_FRAMES,
  type Severity,
} from "./theme.js";

const { BOLD, DIM } = TextAttributes;
const SEV_RANK: Record<Severity, number> = { ok: 0, warn: 1, crit: 2 };
const worst = (...s: Severity[]): Severity =>
  s.reduce((a, b) => (SEV_RANK[b] > SEV_RANK[a] ? b : a), "ok" as Severity);

type Tone = "info" | "ok" | "warn" | "error";
interface ChatMessage {
  role: "user" | "assistant" | "system";
  text: string;
  tone?: Tone;
}

/** Visual treatment for a message's gutter label + body, NO_COLOR-aware. */
function describe(msg: ChatMessage): {
  label: string;
  labelColor?: string;
  labelAttrs: number;
  textColor?: string;
  textAttrs: number;
} {
  if (msg.role === "user")
    return { label: "you", labelColor: col(RAW.accent), labelAttrs: BOLD, textAttrs: 0 };
  if (msg.role === "assistant")
    return { label: "simon", labelColor: col(RAW.ink), labelAttrs: BOLD, textAttrs: 0 };
  switch (msg.tone) {
    case "ok":
      return {
        label: "✓",
        labelColor: col(RAW.ok),
        labelAttrs: 0,
        textColor: col(RAW.muted),
        textAttrs: 0,
      };
    case "warn":
      return {
        label: "!",
        labelColor: col(RAW.warn),
        labelAttrs: BOLD,
        textColor: col(RAW.warn),
        textAttrs: 0,
      };
    case "error":
      return {
        label: "✗",
        labelColor: col(RAW.crit),
        labelAttrs: BOLD,
        textColor: col(RAW.crit),
        textAttrs: 0,
      };
    default:
      return {
        label: "→",
        labelColor: col(RAW.muted),
        labelAttrs: DIM,
        textColor: col(RAW.muted),
        textAttrs: DIM,
      };
  }
}

/** A labeled telemetry cell: dim lowercase label stacked over its readout. */
const Metric = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <box flexDirection="column" minWidth={14}>
    <text fg={col(RAW.muted)} attributes={DIM}>
      {label}
    </text>
    <box flexDirection="row" gap={1} alignItems="center">
      {children}
    </box>
  </box>
);

const SimonApp = ({ onExit }: { onExit: () => void }) => {
  const { width } = useTerminalDimensions();
  const [stats, setStats] = useState({
    cpu: "0%",
    mem: "0%",
    freeMem: "0.00",
    totalMem: "0.00",
    load: [0, 0, 0] as number[],
    uptime: 0,
  });
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", text: "ready — ask about cpu, memory, or processes.", tone: "info" },
  ]);
  const [command, setCommand] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [spinner, setSpinner] = useState(0);
  const [toolsInFlight, setToolsInFlight] = useState(0);
  const agentRef = useRef<AgentEventLoop | undefined>(undefined);

  const addSystem = (text: string, tone: Tone = "info") =>
    setMessages((prev) => [...prev, { role: "system", text, tone }]);

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
      quiet: true, // TUI owns the screen — suppress the core's direct stdout/console writes
    });
  }

  // Telemetry polling (2s cadence — a monitor at rest should stay at rest)
  useEffect(() => {
    let lastCpuTimes = os.cpus().map((c) => c.times);

    const sample = () => {
      const total = os.totalmem();
      const free = os.freemem();
      const used = total - free;
      const memPercent = ((used / total) * 100).toFixed(1) + "%";
      const toGB = (b: number) => (b / 1024 ** 3).toFixed(2);

      const cpus = os.cpus();
      let totalDiff = 0;
      let idleDiff = 0;
      cpus.forEach((cpu, i) => {
        const last = lastCpuTimes[i];
        if (!last) return;
        const lastTotal = last.user + last.nice + last.sys + last.idle + last.irq;
        const curr = cpu.times;
        const currTotal = curr.user + curr.nice + curr.sys + curr.idle + curr.irq;
        totalDiff += currTotal - lastTotal;
        idleDiff += curr.idle - last.idle;
      });
      lastCpuTimes = cpus.map((c) => c.times);
      const cpuValue = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;

      setStats({
        cpu: cpuValue.toFixed(1) + "%",
        mem: memPercent,
        freeMem: toGB(free),
        totalMem: toGB(total),
        load: os.loadavg(),
        uptime: os.uptime(),
      });
      setCpuHistory((prev) => [...prev, cpuValue].slice(-60));
    };

    sample();
    const interval = setInterval(sample, 2000);
    return () => clearInterval(interval);
  }, []);

  // Gentle "thinking" spinner — disabled under reduced motion
  useEffect(() => {
    if (!isThinking || REDUCED_MOTION) return;
    const interval = setInterval(() => setSpinner((f) => (f + 1) % SPINNER_FRAMES.length), 90);
    return () => clearInterval(interval);
  }, [isThinking]);

  // Agent event integration
  useEffect(() => {
    const agent = agentRef.current!;

    const onInferenceStart = () =>
      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

    const onInferenceChunk = (payload: { chunk: string }) =>
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          const updated = [...prev];
          updated[updated.length - 1] = { ...last, text: last.text + payload.chunk };
          return updated;
        }
        return prev;
      });

    const onToolDispatch = (payload: { toolName: string }) => {
      setToolsInFlight((n) => n + 1);
      addSystem(payload.toolName, isDestructiveTool(payload.toolName) ? "warn" : "info");
    };

    const onToolComplete = (payload: { toolName: string }) => {
      setToolsInFlight((n) => Math.max(0, n - 1));
      addSystem(payload.toolName, "ok");
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

  // Zero-arg so it satisfies opentui's intersected onSubmit type; the controlled
  // `command` state is always current (updated on every onInput before Enter).
  const handleSubmit = () => {
    const text = command.trim();
    if (!text || isThinking) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setCommand("");
    setIsThinking(true);
    agentRef
      .current!.run(text)
      .catch((err: unknown) => addSystem(err instanceof Error ? err.message : String(err), "error"))
      .finally(() => {
        setIsThinking(false);
        setToolsInFlight(0);
      });
  };

  // Ctrl+C → graceful agent shutdown, then exit
  useKeyboard((event) => {
    if (event.ctrl && event.name === "c") {
      void agentRef.current!.shutdown().then(onExit);
    }
  });

  // Derived view state
  const cpuPct = parsePercent(stats.cpu);
  const memPct = parsePercent(stats.mem);
  const cores = os.cpus().length;
  const cpuSev = pctSeverity(cpuPct);
  const memSev = pctSeverity(memPct, 75, 90);
  const loadSev = loadSeverity(stats.load[0] ?? 0, cores);
  const overall = worst(cpuSev, memSev, loadSev);

  // Responsive sizing
  const sparkWidth = Math.max(8, Math.min(22, Math.floor(width / 6)));
  const gaugeWidth = width < 72 ? 8 : 12;
  const showBytes = width >= 84;
  const spark = sparkline(cpuHistory, sparkWidth);
  const bar = gauge(memPct, gaugeWidth);
  const [l1, l2, l3] = stats.load.map((l) => l.toFixed(2));

  // Agent activity: while a turn is in flight and nothing is actively streaming
  // text, surface a contextual placeholder instead of a blank assistant line.
  const lastMsg = messages[messages.length - 1];
  const streamingAnswer = lastMsg?.role === "assistant" && lastMsg.text.length > 0;
  const showActivity = isThinking && !streamingAnswer;
  const activityLabel = toolsInFlight > 0 ? "running tools…" : "thinking…";

  return (
    <box flexDirection="column" width="100%" height="100%">
      {/* ── Header band: identity + telemetry, closed by a dim rule ── */}
      <box
        border={["bottom"]}
        borderColor={col(RAW.border)}
        flexShrink={0}
        paddingX={2}
        paddingTop={1}
      >
        <box flexDirection="row" justifyContent="space-between" alignItems="center">
          <box flexDirection="row" gap={1} alignItems="center">
            <text fg={col(RAW.accent)} attributes={BOLD}>
              simon
            </text>
            <text fg={col(RAW.border)}>·</text>
            <text fg={col(RAW.muted)}>system optimizer</text>
          </box>
          <box flexDirection="row" gap={1} alignItems="center">
            <text fg={col(RAW.muted)} attributes={DIM}>
              uptime
            </text>
            <text fg={col(RAW.ink)}>{formatUptime(stats.uptime)}</text>
          </box>
        </box>

        <box flexDirection="row" gap={5} flexWrap="wrap" paddingTop={1} paddingBottom={1}>
          <Metric label="cpu">
            <text attributes={BOLD} fg={sevColor(cpuSev)}>
              {stats.cpu}
            </text>
            <text fg={col(RAW.accent)} attributes={DIM}>
              {spark}
            </text>
          </Metric>

          <Metric label="memory">
            <text>
              <span fg={sevColor(memSev) ?? col(RAW.ok)}>{bar.filled}</span>
              <span fg={col(RAW.track)}>{bar.empty}</span>
            </text>
            <text attributes={BOLD} fg={sevColor(memSev)}>
              {stats.mem}
            </text>
            {showBytes && (
              <text fg={col(RAW.muted)} attributes={DIM}>
                {stats.freeMem} free / {stats.totalMem} gb
              </text>
            )}
          </Metric>

          <Metric label="load">
            <text attributes={BOLD} fg={sevColor(loadSev)}>
              {l1}
            </text>
            <text fg={col(RAW.muted)}>{l2}</text>
            <text fg={col(RAW.muted)}>{l3}</text>
            <text fg={col(RAW.muted)} attributes={DIM}>
              · {cores} cores
            </text>
          </Metric>
        </box>
      </box>

      {/* ── Console: scrollable chat, auto-sticks to newest ── */}
      <scrollbox
        flexGrow={1}
        stickyScroll
        stickyStart="bottom"
        paddingX={2}
        paddingTop={1}
        contentOptions={{ gap: 0 }}
      >
        {messages.map((msg, i) => {
          // Empty assistant turns (a pure tool-call decision, or a just-started
          // stream) are represented by the activity row below — skip the blank.
          if (msg.role === "assistant" && msg.text.length === 0) return null;
          const d = describe(msg);
          const streaming = isThinking && i === messages.length - 1 && msg.role === "assistant";
          return (
            <box key={i} flexDirection="row" gap={1}>
              <box width={8} flexShrink={0} justifyContent="flex-end" flexDirection="row">
                <text fg={d.labelColor} attributes={d.labelAttrs}>
                  {d.label}
                </text>
              </box>
              <box flexGrow={1}>
                <text fg={d.textColor} attributes={d.textAttrs}>
                  {msg.text}
                  {streaming ? <span fg={col(RAW.accent)}>▍</span> : null}
                </text>
              </box>
            </box>
          );
        })}

        {showActivity && (
          <box flexDirection="row" gap={1}>
            <box width={8} flexShrink={0} justifyContent="flex-end" flexDirection="row">
              <text fg={col(RAW.ink)} attributes={BOLD}>
                simon
              </text>
            </box>
            <box flexGrow={1} flexDirection="row" gap={1}>
              <text fg={col(RAW.accent)}>{REDUCED_MOTION ? "◆" : SPINNER_FRAMES[spinner]}</text>
              <text fg={col(RAW.muted)} attributes={DIM}>
                {activityLabel}
              </text>
            </box>
          </box>
        )}
      </scrollbox>

      {/* ── Input band: prompt + key hints / live status, opened by a dim rule ── */}
      <box
        border={["top"]}
        borderColor={col(RAW.border)}
        flexShrink={0}
        paddingX={2}
        paddingTop={1}
      >
        <box flexDirection="row" gap={1} alignItems="center">
          <text fg={col(RAW.accent)} attributes={BOLD}>
            ›
          </text>
          <input
            flexGrow={1}
            focused
            value={command}
            onInput={setCommand}
            onSubmit={handleSubmit}
            placeholder="ask simon something…"
            textColor={col(RAW.ink)}
            focusedTextColor={col(RAW.ink)}
            placeholderColor={col(RAW.muted)}
          />
        </box>

        <box flexDirection="row" justifyContent="space-between" paddingTop={1}>
          <text fg={col(RAW.muted)} attributes={DIM}>
            enter send · ctrl+c quit
          </text>
          {overall === "ok" ? (
            <text fg={col(RAW.ok)}>● nominal</text>
          ) : (
            <text fg={sevColor(overall)} attributes={BOLD}>
              {sevGlyph(overall)}{" "}
              {cpuSev === overall ? "cpu" : memSev === overall ? "memory" : "load"}{" "}
              {overall === "crit" ? "critical" : "elevated"}
            </text>
          )}
        </box>
      </box>
    </box>
  );
};

const main = async () => {
  const renderer = await createCliRenderer({ exitOnCtrlC: false });
  const root = createRoot(renderer);

  const handleExit = () => {
    renderer.destroy();
    process.exit(0);
  };

  root.render(<SimonApp onExit={handleExit} />);
};

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
