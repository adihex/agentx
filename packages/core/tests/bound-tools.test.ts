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

// NODE_ENV=test forces the main-thread path; this helper flips to real
// worker_threads for the duration of the callback.
const withWorkerExecution = async <T>(run: () => Promise<T>): Promise<T> => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousMockLlm = process.env.MOCK_LLM;
  process.env.NODE_ENV = "production";
  delete process.env.MOCK_LLM;
  try {
    return await run();
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    if (previousMockLlm === undefined) {
      delete process.env.MOCK_LLM;
    } else {
      process.env.MOCK_LLM = previousMockLlm;
    }
  }
};

const echoTool: ToolDefinition = {
  name: "echo",
  description: "echoes input",
  inputSchema: z.object({ input: z.string().optional() }),
  modulePath: fixturePath,
  exportName: "echo",
};

const bigStringTool: ToolDefinition = {
  name: "bigString",
  description: "returns a long string",
  inputSchema: z.object({ length: z.number().optional() }),
  modulePath: fixturePath,
  exportName: "bigString",
};

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
    const pool = makePool(0, { bigString: bigStringTool }, { maxResultBytes: 64 });

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
    const pool = makePool(0, { bigString: bigStringTool }, { maxResultBytes: 64 });

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

describe("bound execution on real workers", () => {
  it("cancel() resolves an in-flight worker request with TOOL_REQUEST_CANCELLED", async () => {
    await withWorkerExecution(async () => {
      const pool = makePool(1, { hang: hangTool }, { maxPendingRequests: 4 });

      const execPromise = pool.execute({
        id: "wr-cancel",
        toolCallId: "tc-wr-cancel",
        toolName: "hang",
        args: {},
      });
      // Let the message reach the worker before cancelling.
      await new Promise((r) => setTimeout(r, 25));

      expect(pool.cancel("wr-cancel")).toBe(true);
      const result = await execPromise;
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("TOOL_REQUEST_CANCELLED");
    });
  });

  it("enforces the pending-queue bound on the worker path", async () => {
    await withWorkerExecution(async () => {
      const pool = makePool(
        1,
        { hang: hangTool, echo: echoTool },
        { maxPendingRequests: 1 },
      );

      void pool.execute({ id: "wr-hang", toolCallId: "tc-w1", toolName: "hang", args: {} });
      await new Promise((r) => setTimeout(r, 25));

      const rejected = await pool.execute({
        id: "wr-full",
        toolCallId: "tc-w2",
        toolName: "echo",
        args: { input: "x" },
      });
      expect(rejected.success).toBe(false);
      expect(rejected.errorCode).toBe("TOOL_QUEUE_FULL");
    });
  });

  it("caps oversized worker results with TOOL_OUTPUT_TOO_LARGE", async () => {
    await withWorkerExecution(async () => {
      const pool = makePool(1, { bigString: bigStringTool }, { maxResultBytes: 64 });

      const result = await pool.execute({
        id: "wr-big",
        toolCallId: "tc-w3",
        toolName: "bigString",
        args: { length: 4096 },
      });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("TOOL_OUTPUT_TOO_LARGE");
    });
  });

  it("rejects invalid args before dispatch on the worker path", async () => {
    await withWorkerExecution(async () => {
      const pool = makePool(1, { echoArgs: echoArgsTool });

      const result = await pool.execute({
        id: "wr-invalid",
        toolCallId: "tc-w4",
        toolName: "echoArgs",
        args: { input: 42 },
      });
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("TOOL_ARGS_INVALID");
    });
  });

  it("spawns workers lazily — none until the first worker-path execute", async () => {
    const pool = makePool(2, { echo: echoTool });
    const internals = pool as unknown as { workers: unknown[] };
    expect(internals.workers.length).toBe(0);

    await withWorkerExecution(async () => {
      const result = await pool.execute({
        id: "wr-lazy",
        toolCallId: "tc-w5",
        toolName: "echo",
        args: { input: "go" },
      });
      expect(result.success).toBe(true);
      expect(internals.workers.length).toBe(2);
    });
  });
});
