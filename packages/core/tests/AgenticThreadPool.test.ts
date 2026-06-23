import { describe, it, expect, afterAll } from "vitest";
import { AgenticThreadPool } from "../src/AgenticThreadPool";

describe("AgenticThreadPool", () => {
  const customTools = {
    echo: `async (args) => ({ echoed: args.input })`,
    fail: `async () => { throw new Error('Tool error'); }`,
  };

  const pool = new AgenticThreadPool(2, customTools);

  afterAll(async () => {
    await pool.terminateAll();
  });

  it("should execute a tool successfully", async () => {
    const res = await pool.execute({
      id: "1",
      toolName: "echo",
      args: { input: "hello" },
    });
    expect(res.id).toBe("1");
    expect(res.data).toEqual({ echoed: "hello" });
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should handle unknown tools", async () => {
    const res = await pool.execute({
      id: "2",
      toolName: "nonexistent",
      args: {},
    });
    expect(res.error).toContain('Tool "nonexistent" not found');
  });

  it("should handle tool errors", async () => {
    const res = await pool.execute({
      id: "3",
      toolName: "fail",
      args: {},
    });
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("should handle no workers available", async () => {
    const emptyPool = new AgenticThreadPool(0);
    await expect(
      emptyPool.execute({
        id: "4",
        toolName: "echo",
        args: {},
      })
    ).rejects.toThrow();
    await emptyPool.terminateAll();
  });

  it("should round-robin across workers", async () => {
    // We have 2 workers.
    const res1 = await pool.execute({ id: "a", toolName: "echo", args: {} });
    const res2 = await pool.execute({ id: "b", toolName: "echo", args: {} });
    expect(res1.id).toBe("a");
    expect(res2.id).toBe("b");
  });
});
