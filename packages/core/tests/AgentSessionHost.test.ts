/**
 * AgentSessionHost — multi-tenant isolation + per-client routing + turn-based replies.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AgentSessionHost } from "../src/AgentSessionHost";

// A mock AdpServer that records per-client notifies and exposes the registered
// command handlers + connection callbacks so the test can drive connections.
vi.mock("@agentx/adp", () => {
  class MockAdpServer {
    handlers = new Map<string, (...args: any[]) => void>();
    onConnectionCb: ((sessionId: string) => void) | null = null;
    onDisconnectionCb: ((sessionId: string) => void) | null = null;
    notifyClient = vi.fn();
    notify = vi.fn();
    handle = vi.fn();
    close = vi.fn().mockResolvedValue(undefined);
    on(method: string, handler: (...args: any[]) => void) {
      this.handlers.set(method, handler);
    }
    onConnection(cb: (sessionId: string) => void) {
      this.onConnectionCb = cb;
    }
    onDisconnection(cb: (sessionId: string) => void) {
      this.onDisconnectionCb = cb;
    }
  }
  return {
    AdpServer: MockAdpServer,
    AdpDomains: {
      Inference: { halt: "Inference.halt", evaluate: "Inference.evaluate" },
      Metacognition: {
        pause: "Metacognition.pause",
        resume: "Metacognition.resume",
        getCallFrame: "Metacognition.getCallFrame",
      },
      Memory: { compact: "Memory.compact", queryNodes: "Memory.queryNodes" },
      Session: { prompt: "Session.prompt", shutdown: "Session.shutdown" },
      Toolchain: { list: "Toolchain.list", intercept: "Toolchain.intercept", cancel: "Toolchain.cancel" },
    },
  };
});

vi.mock("../src/LLMOrchestrator", () => ({
  LLMOrchestrator: vi.fn().mockImplementation(function () {
    return {
      runStep: vi.fn().mockImplementation(async (_msgs, _tools, _signal, _model, onTextDelta) => {
        onTextDelta?.("Agent response");
        return {
          text: "Agent response",
          toolCalls: [],
          responseMessages: [{ role: "assistant", content: "Agent response" }],
        };
      }),
    };
  }),
}));

vi.mock("../src/AgenticThreadPool", () => ({
  AgenticThreadPool: vi.fn().mockImplementation(function () {
    return {
      execute: vi.fn().mockResolvedValue({
        id: "1",
        toolCallId: "tc-1",
        success: true,
        data: "ok",
        durationMs: 1,
      }),
      terminateAll: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

describe("AgentSessionHost", () => {
  let host: AgentSessionHost;
  let adp: any;

  beforeEach(() => {
    host = new AgentSessionHost({ adpPort: 9990, systemPrompt: "sys", autoTick: true, quiet: true });
    adp = (host as any).adp;
  });

  afterEach(async () => {
    await host.shutdown();
  });

  it("creates one isolated session per connection and announces it to that client", () => {
    adp.onConnectionCb("s1");
    adp.onConnectionCb("s2");

    expect(host.sessionCount).toBe(2);
    expect(adp.notifyClient).toHaveBeenCalledWith("s1", "Session.created", { sessionId: "s1" });
    expect(adp.notifyClient).toHaveBeenCalledWith("s2", "Session.created", { sessionId: "s2" });
    expect(host.getSession("s1")).not.toBe(host.getSession("s2"));
  });

  it("routes a prompt to the right session and surfaces the agent turn to ONLY that client", async () => {
    adp.onConnectionCb("s1");
    adp.onConnectionCb("s2");

    const promptHandler = adp.handlers.get("Session.prompt")!;
    const cb = vi.fn();
    promptHandler({ prompt: "hello from s1" }, cb, "s1");
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ status: "queued" }));

    // Let the session's prompt loop run the turn.
    await new Promise((r) => setTimeout(r, 30));

    // The agent's reply was pushed to s1 — and never leaked to s2.
    expect(adp.notifyClient).toHaveBeenCalledWith("s1", "Session.message", {
      text: "Agent response",
    });
    expect(adp.notifyClient).not.toHaveBeenCalledWith("s2", "Session.message", expect.anything());

    // Conversation state is isolated: s1 advanced, s2 still only has its system prompt.
    const s1 = host.getSession("s1") as any;
    const s2 = host.getSession("s2") as any;
    expect(s1.context.length).toBeGreaterThan(s2.context.length);
  });

  it("rejects built-in commands that target a session that no longer exists", () => {
    const promptHandler = adp.handlers.get("Session.prompt")!;
    const cb = vi.fn();
    promptHandler({ prompt: "hi" }, cb, "ghost");
    expect(cb).toHaveBeenCalledWith({ status: "error", reason: "no active session" });
  });

  it("hands app commands a session-scoped context via registerCommand", () => {
    adp.onConnectionCb("s1");

    let captured: any;
    host.registerCommand("Music.Test", (params, ctx) => {
      captured = { params, ctx };
      ctx.notify("Music.Status", { message: "working" });
      ctx.reply({ status: "started" });
    });

    const handler = adp.handlers.get("Music.Test")!;
    const cb = vi.fn();
    handler({ songName: "Hello" }, cb, "s1");

    expect(cb).toHaveBeenCalledWith({ status: "started" });
    expect(captured.ctx.sessionId).toBe("s1");
    expect(captured.ctx.session).toBe(host.getSession("s1"));
    expect(adp.notifyClient).toHaveBeenCalledWith("s1", "Music.Status", { message: "working" });
  });

  it("drops a session on disconnect", () => {
    adp.onConnectionCb("s1");
    expect(host.sessionCount).toBe(1);

    adp.onDisconnectionCb!("s1");
    expect(host.sessionCount).toBe(0);
    expect(host.getSession("s1")).toBeUndefined();
  });

  it("routes Toolchain.cancel to the caller's session", () => {
    adp.onConnectionCb("s1");

    const cancelHandler = adp.handlers.get("Toolchain.cancel")!;
    const cb = vi.fn();
    cancelHandler({ toolCallId: "never-dispatched" }, cb, "s1");

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error" }),
    );
  });

  it("logs and survives a session run that rejects", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      adp.onConnectionCb("s1");
      const session = host.getSession("s1") as any;
      // run() itself catches inference errors; force a hard rejection to
      // exercise the host's per-session error boundary.
      vi.spyOn(session, "run").mockRejectedValueOnce(new Error("llm boom"));

      const promptHandler = adp.handlers.get("Session.prompt")!;
      const cb = vi.fn();
      promptHandler({ prompt: "explode" }, cb, "s1");

      await new Promise((r) => setTimeout(r, 30));

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("session s1 run failed"),
        "llm boom",
      );
      // Host still alive: session remains registered for follow-up prompts.
      expect(host.getSession("s1")).toBeDefined();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("wires Session.shutdown to requestShutdown", () => {
    adp.onConnectionCb("s1");

    const shutdownHandler = adp.handlers.get("Session.shutdown")!;
    const cb = vi.fn();
    shutdownHandler({}, cb, "s1");

    expect(cb).toHaveBeenCalledWith({ status: "shutting_down" });
  });

  it("every bound ADP command reaches the caller's session and replies", () => {
    adp.onConnectionCb("s1");

    // Bound handlers must always invoke cb with the session method's result —
    // including on absent params (the `?? ""` fallbacks).
    const cases: Array<[string, unknown]> = [
      ["Inference.halt", undefined],
      ["Inference.evaluate", { expression: "x" }],
      ["Inference.evaluate", undefined],
      ["Metacognition.pause", {}],
      ["Metacognition.resume", {}],
      ["Metacognition.getCallFrame", {}],
      ["Memory.compact", {}],
      ["Memory.queryNodes", { query: "q" }],
      ["Memory.queryNodes", {}],
      ["Toolchain.list", {}],
      ["Toolchain.intercept", { tool: "t" }],
    ];

    for (const [method, params] of cases) {
      const cb = vi.fn();
      adp.handlers.get(method)!(params, cb, "s1");
      expect(cb, `${method} did not reply`).toHaveBeenCalledTimes(1);
      expect(cb.mock.calls[0][0]).toBeDefined();
    }
  });
});
