/**
 * E2E Test: ADP Handshake & Agent Lifecycle
 *
 * Tests the complete lifecycle of an agentx agent via the ADP protocol:
 *   1. ADP handshake (connect)
 *   2. Agent lifecycle (start → run → pause → halt)
 *   3. Orchestrator workflow end-to-end
 */
import { describe, it, expect, vi, afterEach } from "vitest";

// Use real AgentEventLoop but mock LLM and thread pool
vi.mock("../src/LLMOrchestrator", () => ({
  LLMOrchestrator: vi.fn().mockImplementation(function () {
    return {
      runStep: vi.fn().mockImplementation(async (_msgs, _tools, _signal, _model, onTextDelta) => {
        onTextDelta?.("E2E Response");
        return {
          text: "E2E Response",
          toolCalls: [],
          responseMessages: [{ role: "assistant", content: "E2E Response" }],
        };
      }),
    };
  }),
}));

vi.mock("../src/AgenticThreadPool", () => ({
  AgenticThreadPool: vi.fn().mockImplementation(function () {
    return {
      execute: vi
        .fn()
        .mockResolvedValue({ id: "1", toolCallId: "tc", success: true, data: {}, durationMs: 1 }),
      terminateAll: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

import { AgentEventLoop } from "../src/AgentEventLoop";
import { AdpClient } from "../../adp/src/client";

let port = 9850;

describe("E2E: ADP Handshake & Agent Lifecycle", () => {
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

  it("E2E: Connect → Inspect → Run → Halt cycle", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();
    expect(client.isOpen).toBe(true);

    // 1. Inspect initial state
    const frame = await client.send("Metacognition.getCallFrame");
    expect(frame.running).toBe(false);
    expect(frame.iteration).toBe(0);

    // 2. Inject a prompt and run
    await client.send("Session.prompt", { prompt: "Hello, agent!" });
    const result = await loop.run("Hello, agent!");
    expect(result).toContain("E2E Response");

    // 3. Pause
    const pauseResult = await client.send("Metacognition.pause");
    expect(pauseResult.status).toBe("paused");

    // 4. Resume
    const resumeResult = await client.send("Metacognition.resume");
    expect(resumeResult.status).toBe("resumed");

    // 5. Final inspection
    const finalFrame = await client.send("Metacognition.getCallFrame");
    expect(finalFrame.iteration).toBeGreaterThan(0);
  });

  it("E2E: Halt active inference", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const haltResult = await client.send("Inference.halt");
    expect(haltResult.status).toBe("no_active_inference");
  });

  it("E2E: Memory query and compact", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    // Run once to add context
    await loop.run("First message");

    // Query memory
    const nodes = await client.send("Memory.queryNodes", { query: "First" });
    expect(nodes.count).toBeGreaterThan(0);

    // Compact
    const compact = await client.send("Memory.compact");
    expect(compact).toHaveProperty("before");
    expect(compact).toHaveProperty("after");
  });

  it("E2E: Toolchain inspection and intercept", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    // List tools (should be empty by default)
    const tools = await client.send("Toolchain.list");
    expect(tools).toHaveProperty("tools");

    // Intercept a tool call
    const intercept = await client.send("Toolchain.intercept", {
      toolName: "echo",
      args: { msg: "hello" },
    });
    expect(intercept.status).toBe("dispatched");
  });

  it("E2E: Server notification events arrive on client", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const events: string[] = [];
    client.onEvent((method) => events.push(method));

    // Emit via ADP
    loop.emitAdpEvent("Custom.Notification", { payload: "test" });

    await new Promise((r) => setTimeout(r, 100));
    expect(events).toContain("Custom.Notification");
  });

  it("E2E: Shutdown handshake", async () => {
    port++;
    loop = new AgentEventLoop({ adpPort: port });
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const shutdown = await client.send("Session.shutdown");
    expect(shutdown.status).toBe("shutting_down");

    // Should still respond to close
    client.close();
  });
});
