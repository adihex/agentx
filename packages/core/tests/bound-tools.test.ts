import { describe, it, expect, afterEach } from "vitest";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { AgenticThreadPool } from "../src/AgenticThreadPool";
import type { ToolDefinition } from "../src/tools";

const fixturePath = fileURLToPath(new URL("./fixtures/echoTool.ts", import.meta.url));

// NODE_ENV=test → pool executes on the main thread (fast, no worker spawn).
const echoArgsTool: ToolDefinition = {
  name: "echoArgs",
  description: "returns args",
  inputSchema: z.object({ input: z.string(), n: z.number().default(7) }),
  modulePath: fixturePath,
  exportName: "echoArgs",
};

const hangTool: ToolDefinition = {
  name: "hang",
  description: "never resolves",
  inputSchema: z.object({}),
  modulePath: fixturePath,
  exportName: "hang",
  timeoutMs: 500,
};

const pools: AgenticThreadPool[] = [];
function makePool(size = 0, tools: Record<string, ToolDefinition> = {}, opts = {}) {
  const p = new AgenticThreadPool(size, tools, opts);
  pools.push(p);
  return p;
}

afterEach(async () => {
  for (const p of pools.splice(0)) await p.terminateAll();
});

describe("bound tool execution", () => {
  it("rejects args that fail the tool's input schema", async () => {
    const pool = makePool(0, { echoArgs: echoArgsTool });
    const res = await pool.execute({
      id: "r1",
      toolCallId: "tc1",
      toolName: "echoArgs",
      args: { input: 42 },
    });
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe("TOOL_ARGS_INVALID");
    expect(res.error).toContain("input");
  });

  it("applies schema defaults before dispatching args", async () => {
    const pool = makePool(0, { echoArgs: echoArgsTool });
    const res = await pool.execute({
      id: "r2",
      toolCallId: "tc2",
      toolName: "echoArgs",
      args: { input: "hi" },
    });
    expect(res.success).toBe(true);
    expect((res.data as { n: number }).n).toBe(7);
  });

  it("rejects new executions when the pending queue is full", async () => {
    const pool = makePool(
      0,
      { hang: hangTool, echoArgs: echoArgsTool },
      { maxPendingRequests: 1 },
    );

    // hang holds the slot until its own (30s default) timeout fires; the
    // never-resolving promise keeps no handles, so the test ends cleanly.
    void pool.execute({ id: "r3", toolCallId: "tc3", toolName: "hang", args: {} });
    // Let the first request claim the slot before the second arrives.
    await new Promise((r) => setTimeout(r, 10));

    const rejected = await pool.execute({
      id: "r4",
      toolCallId: "tc4",
      toolName: "echoArgs",
      args: { input: "x" },
    });
    expect(rejected.success).toBe(false);
    expect(rejected.errorCode).toBe("TOOL_QUEUE_FULL");
  });

  it("caps oversized tool output with a typed failure", async () => {
    const bigTool: ToolDefinition = {
      name: "bigString",
      description: "returns a large string",
      inputSchema: z.object({ length: z.number().optional() }),
      modulePath: fixturePath,
      exportName: "bigString",
    };
    const pool = makePool(0, { bigString: bigTool }, { maxResultBytes: 64 });

    const res = await pool.execute({
      id: "r5",
      toolCallId: "tc5",
      toolName: "bigString",
      args: { length: 4096 },
    });
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe("TOOL_OUTPUT_TOO_LARGE");
  });

  it("lets results under the output cap through", async () => {
    const bigTool: ToolDefinition = {
      name: "bigString",
      description: "returns a large string",
      inputSchema: z.object({ length: z.number().optional() }),
      modulePath: fixturePath,
      exportName: "bigString",
    };
    const pool = makePool(0, { bigString: bigTool }, { maxResultBytes: 64 });

    const res = await pool.execute({
      id: "r6",
      toolCallId: "tc6",
      toolName: "bigString",
      args: { length: 10 },
    });
    expect(res.success).toBe(true);
    expect(res.data).toBe("x".repeat(10));
  });
});
