/**
 * Agentx Pi Frontend Extension
 *
 * Acts as a TUI frontend for an agent built with the agentx SDK.
 * Connects to the agent's ADP (Agent Debugger Protocol) control-plane
 * WebSocket and provides commands, status, and event streaming.
 *
 * Usage:
 *   pi -e ./apps/pi-extension/src/extension.ts
 *   pi -e ./apps/pi-extension/src/extension.ts --agentx-url ws://localhost:9222
 *
 * Commands:
 *   /agentx connect [url]  — Connect to agentx ADP WebSocket
 *   /agentx disconnect     — Disconnect from agent
 *   /agentx status         — Show connection & agent state
 *   /agentx halt           — Halt active LLM inference
 *   /agentx pause          — Pause agent metacognition
 *   /agentx resume         — Resume agent metacognition
 *   /agentx inspect        — Introspect agent call frame
 *   /agentx compact        — Compact agent memory
 *   /agentx inject <msg>   — Inject a thought into agent context
 *   /agentx send <msg>     — Send a user message to the agent
 *   /agentx shutdown       — Gracefully shut down the agent
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { AdpClient, AdpDomains } from "@agentx/adp";
import { Type } from "typebox";

// ─── State ───────────────────────────────────────────────────────────────────

interface AgentxState {
  client: AdpClient | null;
  url: string;
  connected: boolean;
  lastEvent: string;
  callFrame: Record<string, any> | null;
}

const state: AgentxState = {
  client: null,
  url: "ws://localhost:9222",
  connected: false,
  lastEvent: "",
  callFrame: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCallFrame(frame: Record<string, any> | null): string {
  if (!frame) return "No data. Run `/agentx inspect`.";
  const lines = [
    `iteration:      ${frame.iteration ?? "?"}`,
    `running:        ${frame.running ?? "?"}`,
    `paused:         ${frame.paused ?? "?"}`,
    `contextLength:  ${frame.contextLength ?? "?"}`,
    `macrotasks:     ${frame.pendingMacrotasks ?? "?"}`,
    `microtasks:     ${frame.pendingMicrotasks ?? "?"}`,
  ];
  return lines.join("\n");
}

async function safeDisconnect(): Promise<void> {
  if (state.client) {
    try {
      state.client.close();
    } catch {
      /* ignore */
    }
    state.client = null;
  }
  state.connected = false;
}

async function connectToAgent(url: string, ctx: any): Promise<void> {
  await safeDisconnect();
  state.url = url;

  try {
    const client = new AdpClient(url);
    await client.connect();

    // Subscribe to server-push events
    client.onEvent((method, params) => {
      state.lastEvent = `${method} ${JSON.stringify(params ?? {})}`;
      pi.sendMessage({
        customType: "agentx-event",
        content: `📡 ${method}`,
        display: true,
        details: { method, params },
      });
    });

    // Track unexpected disconnections
    client.onClose((code: number) => {
      state.connected = false;
      pi.sendMessage({
        customType: "agentx-event",
        content: `🔌 Disconnected (code=${code})`,
        display: true,
        details: { code, reason: undefined },
      });
    });

    state.client = client;
    state.connected = true;
    ctx.ui.notify(`Connected to agentx at ${url}`, "info");
  } catch (err: any) {
    ctx.ui.notify(`Connection failed: ${err.message ?? err}`, "error");
  }
}

// ─── Extension ───────────────────────────────────────────────────────────────

let pi: ExtensionAPI;

export default function (api: ExtensionAPI) {
  pi = api;

  // ── CLI Flag ──────────────────────────────────────────────────────────────
  pi.registerFlag("agentx-url", {
    description: "Agentx ADP WebSocket URL (default: ws://localhost:9222)",
    type: "string",
    default: "ws://localhost:9222",
  });

  // ── Auto-connect on session start ─────────────────────────────────────────
  pi.on("session_start", async (_event, ctx) => {
    const urlFlag = pi.getFlag("--agentx-url") as string | undefined;
    const url = urlFlag || state.url;
    if (url) {
      await connectToAgent(url, ctx);
    }
  });

  // ── Status widget ─────────────────────────────────────────────────────────
  let statusInterval: ReturnType<typeof setInterval> | null = null;

  pi.on("session_start", (_event, ctx) => {
    if (statusInterval) clearInterval(statusInterval);
    statusInterval = setInterval(() => {
      if (!state.connected) {
        ctx.ui.setStatus("agentx", "🔌 agentx: disconnected");
        return;
      }
      const status = state.callFrame?.paused ? "⏸ paused" : "▶ running";
      ctx.ui.setStatus(
        "agentx",
        `🧠 agentx: ${status} | iter=${state.callFrame?.iteration ?? "?"} | ctx=${state.callFrame?.contextLength ?? "?"}`,
      );
    }, 2000);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    if (statusInterval) {
      clearInterval(statusInterval);
      statusInterval = null;
    }
    if (ctx.hasUI) {
      ctx.ui.setStatus("agentx", undefined);
    }
    await safeDisconnect();
  });

  // ── Custom message renderer for agentx events ─────────────────────────────
  pi.registerMessageRenderer("agentx-event", (message, options, theme) => {
    const { expanded } = options;
    const { method, params } = message.details as { method: string; params?: any };
    let text = theme.fg("accent", `📡 ${method}`);
    if (expanded && params) {
      text += "\n" + theme.fg("dim", JSON.stringify(params, null, 2));
    }
    return new Text(text, 0, 0);
  });

  // ── /agentx connect ───────────────────────────────────────────────────────
  pi.registerCommand("agentx connect", {
    description: "Connect to an agentx ADP WebSocket (default: ws://localhost:9222)",
    handler: async (args, ctx) => {
      const url = args.trim() || "ws://localhost:9222";
      await connectToAgent(url, ctx);
    },
  });

  // ── /agentx disconnect ────────────────────────────────────────────────────
  pi.registerCommand("agentx disconnect", {
    description: "Disconnect from the agentx agent",
    handler: async (_args, ctx) => {
      await safeDisconnect();
      ctx.ui.notify("Disconnected from agentx", "info");
    },
  });

  // ── /agentx status ────────────────────────────────────────────────────────
  pi.registerCommand("agentx status", {
    description: "Show agentx connection status and last known state",
    handler: async (_args, ctx) => {
      const lines = [
        `Connection: ${state.connected ? `🟢 ${state.url}` : "🔌 disconnected"}`,
        `Last event: ${state.lastEvent || "none"}`,
        "",
        "Call frame:",
        formatCallFrame(state.callFrame),
      ];
      ctx.ui.notify(lines.join("\n"), "info");
    },
  });

  // ── /agentx halt ──────────────────────────────────────────────────────────
  pi.registerCommand("agentx halt", {
    description: "Halt active LLM inference (Inference.halt)",
    handler: async (_args, ctx) => {
      if (!state.client?.isOpen) {
        ctx.ui.notify("Not connected. Run `/agentx connect` first.", "error");
        return;
      }
      try {
        const res = await state.client.send(AdpDomains.Inference.halt);
        ctx.ui.notify(`Halt: ${JSON.stringify(res)}`, "info");
      } catch (err: any) {
        ctx.ui.notify(`Halt failed: ${err.message ?? err}`, "error");
      }
    },
  });

  // ── /agentx pause ─────────────────────────────────────────────────────────
  pi.registerCommand("agentx pause", {
    description: "Pause agent metacognition (Metacognition.pause)",
    handler: async (_args, ctx) => {
      if (!state.client?.isOpen) {
        ctx.ui.notify("Not connected. Run `/agentx connect` first.", "error");
        return;
      }
      try {
        const res = await state.client.send(AdpDomains.Metacognition.pause);
        ctx.ui.notify(`Pause: ${JSON.stringify(res)}`, "info");
      } catch (err: any) {
        ctx.ui.notify(`Pause failed: ${err.message ?? err}`, "error");
      }
    },
  });

  // ── /agentx resume ────────────────────────────────────────────────────────
  pi.registerCommand("agentx resume", {
    description: "Resume agent metacognition (Metacognition.resume)",
    handler: async (_args, ctx) => {
      if (!state.client?.isOpen) {
        ctx.ui.notify("Not connected. Run `/agentx connect` first.", "error");
        return;
      }
      try {
        const res = await state.client.send(AdpDomains.Metacognition.resume);
        ctx.ui.notify(`Resume: ${JSON.stringify(res)}`, "info");
      } catch (err: any) {
        ctx.ui.notify(`Resume failed: ${err.message ?? err}`, "error");
      }
    },
  });

  // ── /agentx inspect ───────────────────────────────────────────────────────
  pi.registerCommand("agentx inspect", {
    description: "Introspect agent call frame (Metacognition.getCallFrame)",
    handler: async (_args, ctx) => {
      if (!state.client?.isOpen) {
        ctx.ui.notify("Not connected. Run `/agentx connect` first.", "error");
        return;
      }
      try {
        const res = await state.client.send<Record<string, any>>(
          AdpDomains.Metacognition.getCallFrame,
        );
        state.callFrame = res;
        ctx.ui.notify(`Call frame:\n${formatCallFrame(res)}`, "info");
      } catch (err: any) {
        ctx.ui.notify(`Inspect failed: ${err.message ?? err}`, "error");
      }
    },
  });

  // ── /agentx compact ───────────────────────────────────────────────────────
  pi.registerCommand("agentx compact", {
    description: "Compact agent memory (Memory.compact)",
    handler: async (_args, ctx) => {
      if (!state.client?.isOpen) {
        ctx.ui.notify("Not connected. Run `/agentx connect` first.", "error");
        return;
      }
      try {
        const res = await state.client.send(AdpDomains.Memory.compact);
        ctx.ui.notify(`Compact: ${JSON.stringify(res)}`, "info");
      } catch (err: any) {
        ctx.ui.notify(`Compact failed: ${err.message ?? err}`, "error");
      }
    },
  });

  // ── /agentx inject ────────────────────────────────────────────────────────
  pi.registerCommand("agentx inject", {
    description: "Inject a thought into the agent context (Inference.evaluate)",
    handler: async (args, ctx) => {
      if (!state.client?.isOpen) {
        ctx.ui.notify("Not connected. Run `/agentx connect` first.", "error");
        return;
      }
      const expression = args.trim() || "Re-evaluate your approach.";
      try {
        const res = await state.client.send(AdpDomains.Inference.evaluate, { expression });
        ctx.ui.notify(`Inject: ${JSON.stringify(res)}`, "info");
      } catch (err: any) {
        ctx.ui.notify(`Inject failed: ${err.message ?? err}`, "error");
      }
    },
  });

  // ── /agentx send ──────────────────────────────────────────────────────────
  pi.registerCommand("agentx send", {
    description: "Send a user message to the agent (via Session.prompt)",
    handler: async (args, ctx) => {
      if (!state.client?.isOpen) {
        ctx.ui.notify("Not connected. Run `/agentx connect` first.", "error");
        return;
      }
      const message = args.trim();
      if (!message) {
        ctx.ui.notify("Usage: /agentx send <message>", "warning");
        return;
      }
      try {
        const res = await state.client.send<{ queueLength?: number }>(AdpDomains.Session.prompt, {
          prompt: message,
        });
        ctx.ui.notify(`Prompt queued. Queue length: ${res.queueLength ?? "?"}`, "info");
      } catch (err: any) {
        ctx.ui.notify(`Send failed: ${err.message ?? err}`, "error");
      }
    },
  });

  // ── /agentx shutdown ──────────────────────────────────────────────────────
  pi.registerCommand("agentx shutdown", {
    description: "Gracefully shut down the agent (Session.shutdown)",
    handler: async (_args, ctx) => {
      if (!state.client?.isOpen) {
        ctx.ui.notify("Not connected. Run `/agentx connect` first.", "error");
        return;
      }
      try {
        const res = await state.client.send(AdpDomains.Session.shutdown);
        ctx.ui.notify(`Shutdown: ${JSON.stringify(res)}`, "info");
      } catch (err: any) {
        ctx.ui.notify(`Shutdown failed: ${err.message ?? err}`, "error");
      }
    },
  });

  // ── Tool: agentx_toolchain_list ───────────────────────────────────────────
  pi.registerTool({
    name: "agentx_toolchain_list",
    label: "Agentx Toolchain",
    description: "List available tools in the connected agentx agent",
    parameters: Type.Object({}),
    promptSnippet: "List tools registered in the remote agentx runtime",
    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      if (!state.client?.isOpen) {
        throw new Error("Not connected to agentx. Run `/agentx connect` first.");
      }
      try {
        const res = await state.client.send(AdpDomains.Toolchain.list);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
          details: { result: res },
        };
      } catch (err: any) {
        throw new Error(`Toolchain.list failed: ${err.message ?? err}`);
      }
    },
  });

  // ── Tool: agentx_memory_query ─────────────────────────────────────────────
  pi.registerTool({
    name: "agentx_memory_query",
    label: "Agentx Memory",
    description: "Query memory nodes in the connected agentx agent",
    parameters: Type.Object({
      query: Type.Optional(Type.String({ description: "Query string for memory nodes" })),
    }),
    promptSnippet: "Query memory nodes in the remote agentx runtime",
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      if (!state.client?.isOpen) {
        throw new Error("Not connected to agentx. Run `/agentx connect` first.");
      }
      try {
        const res = await state.client.send(AdpDomains.Memory.queryNodes, {
          query: params.query,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
          details: { result: res },
        };
      } catch (err: any) {
        throw new Error(`Memory.queryNodes failed: ${err.message ?? err}`);
      }
    },
  });
}
