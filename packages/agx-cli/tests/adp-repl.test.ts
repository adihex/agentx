/**
 * agx-cli — Unit tests for ADP REPL extracted functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

vi.mock("@agentx/agx-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@agentx/agx-core")>();
  return {
    ...actual,
    AdpClient: vi.fn().mockImplementation(function () {
      return {
        send: vi.fn().mockReturnValue(true),
        onStatus: vi.fn(),
        onEvent: vi.fn(),
        connect: vi.fn(),
        destroy: vi.fn(),
      };
    }),
  };
});

import {
  LOG_FILE,
  REPL_COLORS,
  REPL_PROMPT,
  DEFAULT_ADP_URL,
  logToDashboard,
  handleReplInput,
} from "../src/adp-repl";
import { AdpClient } from "@agentx/agx-core";

describe("agx-cli REPL — extracted functions", () => {
  it("REPL_COLORS has expected ANSI codes", () => {
    expect(REPL_COLORS.header).toBe("\x1b[36m");
    expect(REPL_COLORS.green).toBe("\x1b[32m");
    expect(REPL_COLORS.red).toBe("\x1b[31m");
    expect(REPL_COLORS.reset).toBe("\x1b[0m");
  });

  it("REPL_PROMPT contains expected text", () => {
    expect(REPL_PROMPT).toContain("agx@debugger:~$");
  });

  it("DEFAULT_ADP_URL is localhost:9222", () => {
    expect(DEFAULT_ADP_URL).toBe("ws://localhost:9222");
  });

  it("logs to dashboard file", () => {
    // Clean up before
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

    logToDashboard("Test message");
    const content = fs.readFileSync(LOG_FILE, "utf-8");
    expect(content).toContain("[REPL] Test message");

    fs.unlinkSync(LOG_FILE);
  });

  it("handleReplInput returns continue for empty input", () => {
    const client = new (AdpClient as any)();
    const result = handleReplInput("", client);
    expect(result.action).toBe("continue");
    expect(result.message).toBeUndefined();
  });

  it("handleReplInput returns continue for whitespace-only", () => {
    const client = new (AdpClient as any)();
    const result = handleReplInput("   ", client);
    expect(result.action).toBe("continue");
  });

  it("handleReplInput returns help for /help", () => {
    const client = new (AdpClient as any)();
    const result = handleReplInput("/help", client);
    expect(result.action).toBe("continue");
    expect(result.message).toBe("help");
  });

  it("handleReplInput returns exit for /exit or /quit", () => {
    const client = new (AdpClient as any)();
    expect(handleReplInput("/exit", client).action).toBe("exit");
    expect(handleReplInput("/quit", client).action).toBe("exit");
  });

  it("handleReplInput parses and sends valid commands", () => {
    const client = new (AdpClient as any)();
    const result = handleReplInput("/pause agent1", client);
    expect(result.action).toBe("continue");
    expect(result.message).toContain("sent:Debugger.Pause");
    expect(client.send).toHaveBeenCalledWith({
      method: "Debugger.Pause",
      params: { args: ["agent1"] },
    });
  });

  it("handleReplInput returns error for unknown format", () => {
    const client = new (AdpClient as any)();
    const result = handleReplInput("garbage", client);
    expect(result.action).toBe("error");
    expect(result.message).toContain("Unknown command format");
  });

  it("handleReplInput returns error when send fails", () => {
    const client = new (AdpClient as any)();
    client.send.mockReturnValue(false);
    const result = handleReplInput("/halt", client);
    expect(result.action).toBe("error");
    expect(result.message).toContain("Failed to send");
  });
});
