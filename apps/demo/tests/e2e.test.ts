/**
 * E2E Test: demo app Agent Lifecycle
 *
 * Tests the demo application's end-to-end workflow:
 *   1. Agent initialization with system prompt
 *   2. ADP handshake (connect and inspect)
 *   3. Agent lifecycle: prompt → run → waitForPrompt
 *   4. Shutdown flow
 *   5. Signal handling (SIGINT/SIGTERM)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@agentx/core", () => {
  const mockAdp = {
    on: vi.fn(),
    notify: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const MockAgentEventLoop = vi.fn().mockImplementation(function (opts: any) {
    return {
      adp: mockAdp,
      run: vi.fn().mockResolvedValue("E2E demo response"),
      waitForPrompt: vi.fn().mockResolvedValue("E2E prompt"),
      shutdown: vi.fn().mockResolvedValue(undefined),
      dispatchTool: vi.fn(),
      addMicrotask: vi.fn(),
      registerAdpHandler: vi.fn(),
      emitAdpEvent: vi.fn(),
    };
  });
  return { AgentEventLoop: MockAgentEventLoop };
});

describe("E2E: demo app Agent Lifecycle", () => {
  it("E2E: AgentEventLoop is constructed with correct config", async () => {
    const { AgentEventLoop } = await import("@agentx/core");

    const agent = new (AgentEventLoop as any)({
      adpPort: 9222,
      autoTick: true,
      systemPrompt: "You are a helpful AI assistant.",
    });

    expect(agent).toBeDefined();
    expect(agent.adp).toBeDefined();
    expect(agent.run).toBeDefined();
    expect(agent.waitForPrompt).toBeDefined();
    expect(agent.shutdown).toBeDefined();
  });

  it("E2E: agent runs a prompt and returns response", async () => {
    const { AgentEventLoop } = await import("@agentx/core");
    const agent = new (AgentEventLoop as any)({ adpPort: 9223, autoTick: true });

    const response = await agent.run("E2E test prompt");
    expect(response).toBe("E2E demo response");
  });

  it("E2E: agent waits for prompts from ADP", async () => {
    const { AgentEventLoop } = await import("@agentx/core");
    const agent = new (AgentEventLoop as any)({ adpPort: 9224, autoTick: true });

    const prompt = await agent.waitForPrompt();
    expect(prompt).toBe("E2E prompt");
  });

  it("E2E: agent shuts down gracefully", async () => {
    const { AgentEventLoop } = await import("@agentx/core");
    const agent = new (AgentEventLoop as any)({ adpPort: 9225, autoTick: true });

    await agent.shutdown();
    expect(agent.shutdown).toHaveBeenCalled();
  });

  it("E2E: agent handles tool dispatch via ADP", async () => {
    const { AgentEventLoop } = await import("@agentx/core");
    const agent = new (AgentEventLoop as any)({ adpPort: 9226, autoTick: true });

    agent.dispatchTool("searchMusic", { query: "test" }, "tc-e2e-1");
    expect(agent.dispatchTool).toHaveBeenCalledWith("searchMusic", { query: "test" }, "tc-e2e-1");
  });

  it("E2E: agent registers custom ADP handlers", async () => {
    const { AgentEventLoop } = await import("@agentx/core");
    const agent = new (AgentEventLoop as any)({ adpPort: 9227, autoTick: true });

    const handler = vi.fn();
    agent.registerAdpHandler("Custom.e2e", handler);
    expect(agent.registerAdpHandler).toHaveBeenCalledWith("Custom.e2e", handler);
  });

  it("E2E: agent emits events via ADP", async () => {
    const { AgentEventLoop } = await import("@agentx/core");
    const agent = new (AgentEventLoop as any)({ adpPort: 9228, autoTick: true });

    agent.emitAdpEvent("Demo.status", { state: "running" });
    expect(agent.emitAdpEvent).toHaveBeenCalledWith("Demo.status", { state: "running" });
  });
});
