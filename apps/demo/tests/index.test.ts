/**
 * demo — Unit tests for extracted functions
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@agentx/core", () => {
  const MockAgentEventLoop = vi.fn().mockImplementation(function (opts: any) {
    return {
      adp: { on: vi.fn(), notify: vi.fn(), close: vi.fn().mockResolvedValue(undefined) },
      waitForPrompt: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue("response"),
      shutdown: vi.fn().mockResolvedValue(undefined),
    };
  });
  return { AgentEventLoop: MockAgentEventLoop };
});

import { AgentEventLoop } from "@agentx/core";
import {
  DEMO_SYSTEM_PROMPT,
  DEMO_ADP_PORT,
  DEMO_BANNER,
  createDemoAgent,
  runPromptLoop,
} from "../src/index";

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
    createDemoAgent();
    expect(AgentEventLoop).toHaveBeenCalledWith({
      adpPort: 9222,
      autoTick: true,
      systemPrompt: DEMO_SYSTEM_PROMPT,
    });
  });

  it("createDemoAgent accepts custom port and prompt", () => {
    createDemoAgent({
      adpPort: 9333,
      systemPrompt: "Custom prompt",
    });
    expect(AgentEventLoop).toHaveBeenCalledWith({
      adpPort: 9333,
      autoTick: true,
      systemPrompt: "Custom prompt",
    });
  });

  it("createDemoAgent with partial overrides", () => {
    createDemoAgent({ adpPort: 9444 });
    expect(AgentEventLoop).toHaveBeenCalledWith({
      adpPort: 9444,
      autoTick: true,
      systemPrompt: DEMO_SYSTEM_PROMPT,
    });
  });

  it("createDemoAgent with only system prompt override", () => {
    createDemoAgent({ systemPrompt: "Only prompt" });
    expect(AgentEventLoop).toHaveBeenCalledWith({
      adpPort: DEMO_ADP_PORT,
      autoTick: true,
      systemPrompt: "Only prompt",
    });
  });

  it("fully shuts down the runtime when the ADP prompt loop closes", async () => {
    const agent = createDemoAgent();
    const shutdownSpy = vi.spyOn(agent, "shutdown");

    await runPromptLoop(agent);

    expect(shutdownSpy).toHaveBeenCalledOnce();
  });
});
