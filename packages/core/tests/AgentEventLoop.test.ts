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
        generateStream: vi.fn().mockImplementation(async function* () {
          yield "Agent response";
        }),
      };
    }),
  };
});

vi.mock("../src/AgenticThreadPool", () => {
  return {
    AgenticThreadPool: vi.fn().mockImplementation(function () {
      return {
        execute: vi.fn().mockResolvedValue({ id: "1", result: "tool success", durationMs: 10 }),
        terminateAll: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

describe("AgentEventLoop", () => {
  let loop: AgentEventLoop;

  beforeEach(() => {
    loop = new AgentEventLoop({ adpPort: 9999 });
  });

  afterEach(async () => {
    if (loop) await loop.shutdown();
  });

  it("should run a tick and return assistant text", async () => {
    const result = await loop.run("Hello agent");
    expect(result).toBe("Agent response");
    expect((loop as any).context).toHaveLength(2);
  });

  it("should handle microtasks", async () => {
    const task = vi.fn();
    loop.addMicrotask("test-task", task);
    await loop.run("tick");
    expect(task).toHaveBeenCalled();
  });

  it("should handle tool dispatch and macrotasks", async () => {
    loop.dispatchTool("testTool", { arg: 1 });

    await new Promise((r) => setTimeout(r, 10));
    expect((loop as any).macrotaskQueue).toHaveLength(1);

    await loop.run("process tools");
    expect((loop as any).macrotaskQueue).toHaveLength(0);
  });

  it("should support pausing and resuming via ADP", async () => {
    const adp = loop.adp as any;
    // Find the handle calls
    const pauseHandler = adp.handle.mock.calls.find(
      (c: any) => c[0] === "Metacognition.pause",
    )?.[1];
    const resumeHandler = adp.handle.mock.calls.find(
      (c: any) => c[0] === "Metacognition.resume",
    )?.[1];

    expect(pauseHandler).toBeDefined();

    const cb = vi.fn();
    pauseHandler({}, cb);
    expect((loop as any).paused).toBe(true);

    resumeHandler({}, cb);
    expect((loop as any).paused).toBe(false);
  });

  it("should handle inference halt", async () => {
    const adp = loop.adp as any;
    const haltHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Inference.halt")[1];

    const abortController = new AbortController();
    (loop as any).inferenceAbort = abortController;

    const cb = vi.fn();
    haltHandler({}, cb);
    expect(abortController.signal.aborted).toBe(true);
    expect(cb).toHaveBeenCalledWith({ status: "halted" });
  });

  it("should compact memory via ADP", async () => {
    const adp = loop.adp as any;
    const compactHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Memory.compact")[1];

    for (let i = 0; i < 10; i++) (loop as any).context.push({ role: "user", content: "msg" });

    const cb = vi.fn();
    compactHandler({}, cb);
    expect((loop as any).context.length).toBeLessThan(10);
  });

  it("should handle Session.prompt", async () => {
    const adp = loop.adp as any;
    const promptHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Session.prompt")[1];

    const cb = vi.fn();
    promptHandler({ prompt: "Hello from ADP" }, cb);
    expect((loop as any).promptQueue).toContain("Hello from ADP");
  });

  it("should support waitForPrompt", async () => {
    const adp = loop.adp as any;
    const promptHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Session.prompt")[1];

    const promptPromise = loop.waitForPrompt();
    promptHandler({ prompt: "ADP Prompt" }, vi.fn());

    const prompt = await promptPromise;
    expect(prompt).toBe("ADP Prompt");
  });

  it("should query memory nodes", async () => {
    const adp = loop.adp as any;
    const queryHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Memory.queryNodes")[1];

    (loop as any).context.push({ role: "user", content: "Secret message" });

    const cb = vi.fn();
    queryHandler({ query: "secret" }, cb);
    expect(cb.mock.calls[0][0].nodes[0].preview).toContain("Secret");
  });
});
