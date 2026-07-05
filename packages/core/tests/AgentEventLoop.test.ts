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
    // @ts-expect-error - bypassing private modifier
    expect(loop.context).toHaveLength(2);
  });

  it("should handle microtasks", async () => {
    const task = vi.fn();
    loop.addMicrotask("test-task", task);
    await loop.run("tick");
    expect(task).toHaveBeenCalled();
  });

  it("should handle tool dispatch and macrotasks", async () => {
    loop.dispatchTool("testTool", { arg: 1 }, "tc-test");

    await new Promise((r) => setTimeout(r, 10));
    // @ts-expect-error - bypassing private modifier
    expect(loop.macrotaskQueue).toHaveLength(1);
    // @ts-expect-error - bypassing private modifier
    expect(loop.macrotaskQueue[0].toolCallId).toBe("tc-test");

    await loop.run("process tools");
    // @ts-expect-error - bypassing private modifier
    expect(loop.macrotaskQueue).toHaveLength(0);
  });

  it("should support pausing and resuming via ADP", async () => {
    const adp = loop.adp as unknown;
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
    // @ts-expect-error - bypassing private modifier
    expect(loop.paused).toBe(true);

    resumeHandler({}, cb);
    // @ts-expect-error - bypassing private modifier
    expect(loop.paused).toBe(false);
  });

  it("should handle inference halt", async () => {
    const adp = loop.adp as unknown;
    const haltHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Inference.halt")[1];

    const abortController = new AbortController();
    // @ts-expect-error - bypassing private modifier
    loop.inferenceAbort = abortController;

    const cb = vi.fn();
    haltHandler({}, cb);
    expect(abortController.signal.aborted).toBe(true);
    expect(cb).toHaveBeenCalledWith({ status: "halted" });
  });

  it("should compact memory via ADP", async () => {
    const adp = loop.adp as unknown;
    const compactHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Memory.compact")[1];

    // @ts-expect-error - bypassing private modifier
    for (let i = 0; i < 10; i++) loop.context.push({ role: "user", content: "msg" });

    const cb = vi.fn();
    compactHandler({}, cb);
    // @ts-expect-error - bypassing private modifier
    expect(loop.context.length).toBeLessThan(10);
  });

  it("should handle Session.prompt", async () => {
    const adp = loop.adp as unknown;
    const promptHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Session.prompt")[1];

    const cb = vi.fn();
    promptHandler({ prompt: "Hello from ADP" }, cb);
    // @ts-expect-error - bypassing private modifier
    expect(loop.promptQueue).toContain("Hello from ADP");
  });

  it("should support waitForPrompt", async () => {
    const adp = loop.adp as unknown;
    const promptHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Session.prompt")[1];

    const promptPromise = loop.waitForPrompt();
    promptHandler({ prompt: "ADP Prompt" }, vi.fn());

    const prompt = await promptPromise;
    expect(prompt).toBe("ADP Prompt");
  });

  it("should query memory nodes", async () => {
    const adp = loop.adp as unknown;
    const queryHandler = adp.handle.mock.calls.find((c: any) => c[0] === "Memory.queryNodes")[1];

    // @ts-expect-error - bypassing private modifier
    loop.context.push({ role: "user", content: "Secret message" });

    const cb = vi.fn();
    queryHandler({ query: "secret" }, cb);
    expect(cb.mock.calls[0][0].nodes[0].preview).toContain("Secret");
  });

  it("barrier: waits for ALL tool calls of a turn before re-inferring", async () => {
    const barrierLoop = new AgentEventLoop({ adpPort: 9998, autoTick: true });
    let step = 0;
    const toolResultsSeenAtStep: number[] = [];

    // @ts-expect-error - bypassing private modifier
    barrierLoop.llm.runStep = vi.fn().mockImplementation(async (msgs: any[]) => {
      step++;
      toolResultsSeenAtStep.push(msgs.filter((m) => m.role === "tool").length);
      if (step === 1) {
        return {
          text: "",
          toolCalls: [
            { toolCallId: "tc-A", toolName: "toolA", input: {} },
            { toolCallId: "tc-B", toolName: "toolB", input: {} },
          ],
          responseMessages: [
            {
              role: "assistant",
              content: [
                { type: "tool-call", toolCallId: "tc-A", toolName: "toolA", input: {} },
                { type: "tool-call", toolCallId: "tc-B", toolName: "toolB", input: {} },
              ],
            },
          ],
        };
      }
      return {
        text: "done",
        toolCalls: [],
        responseMessages: [{ role: "assistant", content: "done" }],
      };
    });

    // Staggered completions: toolA finishes well before toolB, so a broken
    // (barrier-less) loop would re-infer after toolA with only 1/2 results.
    // @ts-expect-error - bypassing private modifier
    barrierLoop.threadPool.execute = vi.fn().mockImplementation(
      (req: any) =>
        new Promise((resolve) => {
          const delay = req.toolName === "toolA" ? 5 : 35;
          setTimeout(
            () =>
              resolve({
                id: req.id,
                toolCallId: req.toolCallId,
                success: true,
                data: `${req.toolName} ok`,
                durationMs: delay,
              }),
            delay,
          );
        }),
    );

    await barrierLoop.run("do two things");
    await new Promise((r) => setTimeout(r, 150));

    expect(step).toBe(2); // initial turn + exactly ONE re-inference
    expect(toolResultsSeenAtStep[0]).toBe(0); // first inference: no results yet
    expect(toolResultsSeenAtStep[1]).toBe(2); // re-inference only after BOTH landed

    await barrierLoop.shutdown();
  });

  it("records tool results unwrapped (data on success, error-text on failure)", async () => {
    const u = new AgentEventLoop({ adpPort: 9997, autoTick: false });
    // @ts-expect-error - bypassing private modifier
    u.threadPool.execute = vi
      .fn()
      .mockImplementationOnce(async (req: any) => ({
        id: req.id,
        toolCallId: req.toolCallId,
        success: true,
        data: { temp: 21 },
        durationMs: 1,
      }))
      .mockImplementationOnce(async (req: any) => ({
        id: req.id,
        toolCallId: req.toolCallId,
        success: false,
        error: "boom",
        durationMs: 1,
      }));

    u.dispatchTool("ok", {}, "tc-ok");
    u.dispatchTool("bad", {}, "tc-bad");
    await new Promise((r) => setTimeout(r, 15));
    await u.run("drain");

    // @ts-expect-error - bypassing private modifier
    const outputs = u.context
      .filter((m: any) => m.role === "tool")
      .map((m: any) => m.content[0].output);
    expect(outputs).toContainEqual({ type: "json", value: { temp: 21 } });
    expect(outputs).toContainEqual({ type: "error-text", value: "boom" });

    await u.shutdown();
  });
});
