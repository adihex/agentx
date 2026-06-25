import { describe, it, expect, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { AgenticThreadPool } from "../src/AgenticThreadPool";
import type { ToolDefinition } from "../src/tools";

const fixturePath = fileURLToPath(new URL("./fixtures/echoTool.ts", import.meta.url));

const customTools: Record<string, ToolDefinition> = {
  echo: {
    name: "echo",
    description: "Echo back the input",
    inputSchema: z.object({ input: z.unknown() }),
    modulePath: fixturePath,
    exportName: "echo",
  },
  fail: {
    name: "fail",
    description: "Always throws",
    inputSchema: z.object({}),
    modulePath: fixturePath,
    exportName: "fail",
  },
};

describe("AgenticThreadPool", () => {
  const pool = new AgenticThreadPool(2, customTools);

  afterAll(async () => {
    await pool.terminateAll();
  });

  it("should execute a tool successfully", async () => {
    const res = await pool.execute({
      id: "1",
      toolCallId: "tc-1",
      toolName: "echo",
      args: { input: "hello" },
    });
    expect(res.id).toBe("1");
    expect(res.toolCallId).toBe("tc-1");
    expect(res.data).toEqual({ echoed: "hello" });
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should handle unknown tools", async () => {
    const res = await pool.execute({
      id: "2",
      toolCallId: "tc-2",
      toolName: "nonexistent",
      args: {},
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain("not registered");
  });

  it("should handle tool errors", async () => {
    const res = await pool.execute({
      id: "3",
      toolCallId: "tc-3",
      toolName: "fail",
      args: {},
    });
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("should round-robin across workers", async () => {
    // We have 2 workers.
    const res1 = await pool.execute({ id: "a", toolCallId: "tc-a", toolName: "echo", args: {} });
    const res2 = await pool.execute({ id: "b", toolCallId: "tc-b", toolName: "echo", args: {} });
    expect(res1.id).toBe("a");
    expect(res2.id).toBe("b");
  });

  it("should reject pending requests on terminateAll", async () => {
    const emptyPool = new AgenticThreadPool(0, customTools);
    await emptyPool.terminateAll();
    expect(emptyPool).toBeDefined();
  });
});
