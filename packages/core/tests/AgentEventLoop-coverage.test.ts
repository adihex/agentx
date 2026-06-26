/**
 * Core AgentEventLoop — coverage for uncovered error/corner paths
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AgentEventLoop } from "../src/AgentEventLoop";

vi.mock("@agentx/adp", () => {
  const MockAdpServer = vi.fn().mockImplementation(function () {
    return {
      on: vi.fn(),
      handle: vi.fn(),
      notify: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };
  });
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
      Toolchain: { list: "Toolchain.list", intercept: "Toolchain.intercept" },
    },
  };
});

vi.mock("../src/LLMOrchestrator", () => {
  return {
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
  };
});

vi.mock("../src/AgenticThreadPool", () => {
  return {
    AgenticThreadPool: vi.fn().mockImplementation(function () {
      return {
        execute: vi.fn().mockResolvedValue({
          id: "1",
          toolCallId: "tc-1",
          success: true,
          data: "tool success",
          durationMs: 10,
        }),
        terminateAll: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

describe("AgentEventLoop — error handling coverage", () => {
  let loop: AgentEventLoop;

  afterEach(async () => {
    if (loop) await loop.shutdown();
  });

  it("should handle non-abort inference errors and push error assistant message", async () => {
    loop = new AgentEventLoop({ adpPort: 9901 });
    (loop as any).llm.runStep = vi.fn().mockRejectedValue(new Error("LLM connection lost"));

    const result = await loop.run("trigger error");
    expect(result).toContain("[inference error");
    const lastMsg = (loop as any).context[(loop as any).context.length - 1];
    expect(lastMsg.role).toBe("assistant");
    expect(lastMsg.content).toContain("LLM connection lost");
  });

  it("should handle AbortError (name) gracefully", async () => {
    loop = new AgentEventLoop({ adpPort: 9902 });
    const abortErr = new Error("something");
    abortErr.name = "AbortError";
    (loop as any).llm.runStep = vi.fn().mockRejectedValue(abortErr);

    const result = await loop.run("trigger abort");
    expect(result).toBe("[inference halted by operator]");
  });

  it("should handle Error with 'aborted' in message", async () => {
    loop = new AgentEventLoop({ adpPort: 9903 });
    (loop as any).llm.runStep = vi.fn().mockRejectedValue(new Error("The operation was aborted by the user"));

    const result = await loop.run("trigger aborted message");
    expect(result).toBe("[inference halted by operator]");
  });

  it("waitForPrompt returns null when shutdown is requested", async () => {
    loop = new AgentEventLoop({ adpPort: 9904 });
    (loop as any).shutdownRequested = true;
    expect(await loop.waitForPrompt()).toBeNull();
  });

  it("waitForPrompt returns queued prompt immediately", async () => {
    loop = new AgentEventLoop({ adpPort: 9905 });
    (loop as any).promptQueue = ["cached prompt"];
    expect(await loop.waitForPrompt()).toBe("cached prompt");
  });

  it("Inference.halt returns no_active_inference when no abort controller", async () => {
    loop = new AgentEventLoop({ adpPort: 9906 });
    const adp = loop.adp as any;
    const haltHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Inference.halt")[1];

    const cb = vi.fn();
    haltHandler({}, cb);
    expect(cb).toHaveBeenCalledWith({ status: "no_active_inference" });
  });

  it("Session.prompt with empty string returns error", async () => {
    loop = new AgentEventLoop({ adpPort: 9907 });
    const adp = loop.adp as any;
    const promptHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Session.prompt")[1];

    const cb = vi.fn();
    promptHandler({ prompt: "" }, cb);
    expect(cb).toHaveBeenCalledWith({ status: "error", reason: "missing prompt" });
  });

  it("Toolchain.intercept with missing toolName returns error", async () => {
    loop = new AgentEventLoop({ adpPort: 9908 });
    const adp = loop.adp as any;
    const interceptHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Toolchain.intercept")[1];

    const cb = vi.fn();
    interceptHandler({ args: {} }, cb);
    expect(cb).toHaveBeenCalledWith({ status: "error", reason: "missing toolName" });
  });

  it("Session.shutdown triggers shutdown flow", async () => {
    loop = new AgentEventLoop({ adpPort: 9909 });
    const adp = loop.adp as any;
    const shutdownHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Session.shutdown")[1];

    const cb = vi.fn();
    shutdownHandler({}, cb);
    expect(cb).toHaveBeenCalledWith({ status: "shutting_down" });
    expect((loop as any).shutdownRequested).toBe(true);
  });

  it("Metacognition.getCallFrame returns introspection data", async () => {
    loop = new AgentEventLoop({ adpPort: 9910 });
    const adp = loop.adp as any;
    const handler = adp.handle.mock.calls.find(
      (c: any) => c[0] === "Metacognition.getCallFrame",
    )[1];

    const cb = vi.fn();
    handler({}, cb);
    const frame = cb.mock.calls[0][0];
    expect(frame).toHaveProperty("iteration");
    expect(frame).toHaveProperty("running");
    expect(frame).toHaveProperty("paused");
    expect(frame).toHaveProperty("contextLength");
  });

  it("Toolchain.list returns registered tools", async () => {
    loop = new AgentEventLoop({ adpPort: 9911 });
    const adp = loop.adp as any;
    const handler = adp.handle.mock.calls.find((c: any) => c[0] === "Toolchain.list")[1];

    const cb = vi.fn();
    handler({}, cb);
    expect(cb).toHaveBeenCalledWith({ tools: [] });
  });

  it("Memory.compact with small context does nothing", async () => {
    loop = new AgentEventLoop({ adpPort: 9912 });
    const adp = loop.adp as any;
    const handler = adp.handle.mock.calls.find((c: any) => c[0] === "Memory.compact")[1];

    const cb = vi.fn();
    handler({}, cb);
    expect(cb).toHaveBeenCalled();
  });

  it("Inference.evaluate injects expression into context", async () => {
    loop = new AgentEventLoop({ adpPort: 9913 });
    const adp = loop.adp as any;
    const handler = adp.handle.mock.calls.find((c: any) => c[0] === "Inference.evaluate")[1];

    const cb = vi.fn();
    handler({ expression: "hello" }, cb);
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ status: "injected" }),
    );
  });

  it("registerAdpHandler delegates to adp.on", async () => {
    loop = new AgentEventLoop({ adpPort: 9914 });
    const handler = vi.fn();
    loop.registerAdpHandler("Custom.test", handler);

    const adp = loop.adp as any;
    expect(adp.on).toHaveBeenCalledWith("Custom.test", expect.any(Function));
  });

  it("emitAdpEvent delegates to adp.notify", async () => {
    loop = new AgentEventLoop({ adpPort: 9915 });
    loop.emitAdpEvent("Custom.event", { field: true });

    const adp = loop.adp as any;
    expect(adp.notify).toHaveBeenCalledWith("Custom.event", { field: true });
  });

  it("shutdown aborts pending prompts and inference", async () => {
    loop = new AgentEventLoop({ adpPort: 9916 });
    const resolver = vi.fn();
    (loop as any).promptResolver = resolver;
    const abortCtrl = { abort: vi.fn() };
    (loop as any).inferenceAbort = abortCtrl;

    await loop.shutdown();
    expect(resolver).toHaveBeenCalled();
    expect(abortCtrl.abort).toHaveBeenCalled();
  });

  it("Session.shutdown aborts inference via ADP handler", async () => {
    loop = new AgentEventLoop({ adpPort: 9921 });
    const abortCtrl = { abort: vi.fn() };
    (loop as any).inferenceAbort = abortCtrl;

    const adp = loop.adp as any;
    const handler = adp.handle.mock.calls.find((c: any) => c[0] === "Session.shutdown")[1];

    const cb = vi.fn();
    handler({}, cb);
    expect(abortCtrl.abort).toHaveBeenCalled();
    expect((loop as any).shutdownRequested).toBe(true);
    expect(cb).toHaveBeenCalledWith({ status: "shutting_down" });

    await loop.shutdown();
  });

  it("uid helper is called during dispatchTool", async () => {
    loop = new AgentEventLoop({ adpPort: 9917 });
    loop.dispatchTool("testTool", { arg: 1 }, "tc-test");
    expect((loop as any).pendingToolCalls).toBe(1);
    await loop.shutdown();
  });

  it("Toolchain.list returns registered tools", async () => {
    loop = new AgentEventLoop({
      adpPort: 9918,
      tools: {
        toolA: {
          name: "toolA",
          description: "First",
          inputSchema: {} as any,
        },
      },
    });
    const adp = loop.adp as any;
    const handler = adp.handle.mock.calls.find((c: any) => c[0] === "Toolchain.list")[1];

    const cb = vi.fn();
    handler({}, cb);
    expect(cb).toHaveBeenCalledWith({
      tools: [{ name: "toolA", description: "First" }],
    });

    await loop.shutdown();
  });

  it("Memory.queryNodes without query returns all nodes", async () => {
    loop = new AgentEventLoop({ adpPort: 9919 });
    (loop as any).context.push({ role: "user", content: "M1" });
    (loop as any).context.push({ role: "assistant", content: [{ type: "text", text: "Complex" }] });

    const adp = loop.adp as any;
    const handler = adp.handle.mock.calls.find((c: any) => c[0] === "Memory.queryNodes")[1];

    const cb = vi.fn();
    handler({ query: "Complex" }, cb);
    expect(cb.mock.calls[0][0].count).toBe(1);

    await loop.shutdown();
  });

  it("should handle tool dispatch with emit events", async () => {
    loop = new AgentEventLoop({ adpPort: 9920 });
    const events: string[] = [];
    loop.on("tool.dispatch", (evt: any) => { events.push("dispatch"); });
    
    loop.dispatchTool("testTool", { arg: 1 }, "tc-test");
    expect(events).toContain("dispatch");

    await loop.shutdown();
  });
});
