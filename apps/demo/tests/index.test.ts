/**
 * demo — Unit tests for extracted functions
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@agentx/core", () => {
  const MockAgentEventLoop = vi.fn().mockImplementation(function (opts: any) {
    return {
      adpPort: opts?.adpPort,
      systemPrompt: opts?.systemPrompt,
      autoTick: opts?.autoTick,
      adp: { on: vi.fn(), notify: vi.fn(), close: vi.fn().mockResolvedValue(undefined) },
      waitForPrompt: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue("response"),
      shutdown: vi.fn().mockResolvedValue(undefined),
    };
  });
  return { AgentEventLoop: MockAgentEventLoop };
});

import { DEMO_SYSTEM_PROMPT, DEMO_ADP_PORT, DEMO_BANNER, createDemoAgent } from "../src/index";

describe("demo/index.ts — extracted functions", () => {
  it("DEMO_SYSTEM_PROMPT is a non-empty string", () => {
    expect(DEMO_SYSTEM_PROMPT.length).toBeGreaterThan(0);
    expect(DEMO_SYSTEM_PROMPT).toContain("helpful AI assistant");
    expect(DEMO_SYSTEM_PROMPT).toContain("event-driven runtime");
  });

  it("DEMO_ADP_PORT defaults to 9222", () => {
    expect(DEMO_ADP_PORT).toBe(9222);
  });

  it("DEMO_BANNER contains the app name", () => {
    const bannerText = DEMO_BANNER.join("\n");
    expect(bannerText).toContain("agentx");
    expect(bannerText).toContain("Event-Driven Agent Runtime");
    expect(bannerText).toContain("9222");
  });

  it("createDemoAgent uses defaults", () => {
    const agent = createDemoAgent();
    expect(agent.adpPort).toBe(9222);
    expect(agent.systemPrompt).toBe(DEMO_SYSTEM_PROMPT);
    expect(agent.autoTick).toBe(true);
  });

  it("createDemoAgent accepts custom port and prompt", () => {
    const agent = createDemoAgent({
      adpPort: 9333,
      systemPrompt: "Custom prompt",
    });
    expect(agent.adpPort).toBe(9333);
    expect(agent.systemPrompt).toBe("Custom prompt");
  });

  it("createDemoAgent with partial overrides", () => {
    const agent = createDemoAgent({ adpPort: 9444 });
    expect(agent.adpPort).toBe(9444);
    expect(agent.systemPrompt).toBe(DEMO_SYSTEM_PROMPT);
  });

  it("createDemoAgent with only system prompt override", () => {
    const agent = createDemoAgent({ systemPrompt: "Only prompt" });
    expect(agent.adpPort).toBe(DEMO_ADP_PORT);
    expect(agent.systemPrompt).toBe("Only prompt");
  });
});
