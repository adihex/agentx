/**
 * Integration Test: AgentEventLoop + ADP Server real communication
 */
import { describe, it, expect, vi, afterEach } from "vitest";

// We need to use a real AgentEventLoop with the actual ADP server
// but mock the LLM and thread pool to avoid side effects
vi.mock("../src/LLMOrchestrator", () => {
  return {
    LLMOrchestrator: vi.fn().mockImplementation(function () {
      return {
        runStep: vi.fn().mockImplementation(async (_msgs, _tools, _signal, _model, onTextDelta) => {
          onTextDelta?.("Mocked response");
          return {
            text: "Mocked response",
            toolCalls: [],
            responseMessages: [{ role: "assistant", content: "Mocked response" }],
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
          data: "ok",
          durationMs: 1,
        }),
        terminateAll: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

import { AgentEventLoop } from "../src/AgentEventLoop";
import { AdpClient } from "../../adp/src/client";

let port = 9800;

describe("AgentEventLoop + ADP Integration", () => {
  let loop: AgentEventLoop | null = null;
  let client: AdpClient | null = null;

  afterEach(async () => {
    if (client) {
      client.close();
      client = null;
    }
    if (loop) {
      await loop.shutdown();
      loop = null;
    }
  });

  it("should receive ADP commands when connected", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    // Test getCallFrame while idle
    const callFrame = await client.send("Metacognition.getCallFrame");
    expect(callFrame).toHaveProperty("iteration");
    expect(callFrame).toHaveProperty("running", false);
    expect(callFrame).toHaveProperty("contextLength");

    // Test list tools
    const toolList = await client.send("Toolchain.list");
    expect(toolList).toHaveProperty("tools");

    // Test memory query
    const nodeResult = await client.send("Memory.queryNodes");
    expect(nodeResult).toHaveProperty("count");
    expect(nodeResult).toHaveProperty("nodes");
  });

  it("should handle pause/resume cycle via ADP", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const pauseResult = await client.send("Metacognition.pause");
    expect(pauseResult.status).toBe("paused");

    const resumeResult = await client.send("Metacognition.resume");
    expect(resumeResult.status).toBe("resumed");
  });

  it("should handle inference evaluation injection", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const result = await client.send("Inference.evaluate", { expression: "test message" });
    expect(result.status).toBe("injected");
    expect(result.contextLength).toBeGreaterThan(0);
  });

  it("should handle memory compact", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const result = await client.send("Memory.compact");
    expect(result).toHaveProperty("before");
    expect(result).toHaveProperty("after");
  });

  it("should handle halt when no inference is running", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const result = await client.send("Inference.halt");
    expect(result.status).toBe("no_active_inference");
  });
});
