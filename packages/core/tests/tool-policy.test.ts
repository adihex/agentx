import { describe, it, expect, vi, afterEach } from "vitest";
import { fileURLToPath } from "node:url";
import { z } from "zod";

vi.mock("../src/LLMOrchestrator", () => ({
  LLMOrchestrator: vi.fn().mockImplementation(function () {
    return {
      runStep: vi.fn().mockResolvedValue({
        text: "ok",
        toolCalls: [],
        responseMessages: [{ role: "assistant", content: "ok" }],
      }),
    };
  }),
}));

import { AgenticThreadPool } from "../src/AgenticThreadPool";
import { AgentSession, type ToolPolicyHook } from "../src/AgentSession";
import { LLMOrchestrator } from "../src/LLMOrchestrator";
import type { ToolDefinition } from "../src/tools";
import type { ToolResult } from "../src/AgenticThreadPool";

const fixturePath = fileURLToPath(new URL("./fixtures/echoTool.ts", import.meta.url));

const echoTool: ToolDefinition = {
  name: "echo",
  description: "echoes the input",
  inputSchema: z.object({ input: z.string().optional() }),
  modulePath: fixturePath,
  exportName: "echo",
};

const hangTool: ToolDefinition = {
  name: "hang",
  description: "never resolves",
  inputSchema: z.object({}),
  modulePath: fixturePath,
  exportName: "hang",
  timeoutMs: 5000,
};

const pools: AgenticThreadPool[] = [];

function makeSession(
  opts: { toolPolicy?: ToolPolicyHook } = {},
  tools: Record<string, ToolDefinition> = { echo: echoTool, hang: hangTool },
): AgentSession {
  const pool = new AgenticThreadPool(0, tools);
  pools.push(pool);
  return new AgentSession({
    llm: new LLMOrchestrator({ apiKey: "test" }),
    threadPool: pool,
    toolSet: {},
    toolDefs: tools,
    quiet: true,
    toolPolicy: opts.toolPolicy,
  });
}

function nextToolComplete(session: AgentSession): Promise<ToolResult> {
  return new Promise((resolve) => session.once("tool.complete", (e) => resolve(e.result)));
}

afterEach(async () => {
  for (const p of pools.splice(0)) await p.terminateAll();
});

describe("tool policy hooks", () => {
  it("denies a dispatch and folds the verdict into a failed tool result", async () => {
    const session = makeSession({
      toolPolicy: () => ({ allow: false, reason: "not today" }),
    });
    const pool = pools[pools.length - 1];
    const executeSpy = vi.spyOn(pool, "execute");

    const completed = nextToolComplete(session);
    session.dispatchTool("echo", { input: "hi" }, "tc-deny");

    const result = await completed;
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("TOOL_POLICY_DENIED");
    expect(result.error).toContain("not today");
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it("fails closed when the policy hook throws", async () => {
    const session = makeSession({
      toolPolicy: () => {
        throw new Error("policy exploded");
      },
    });

    const completed = nextToolComplete(session);
    session.dispatchTool("echo", { input: "hi" }, "tc-throw");

    const result = await completed;
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("TOOL_POLICY_DENIED");
    expect(result.error).toContain("policy exploded");
  });

  it("executes normally when the policy allows", async () => {
    const session = makeSession({ toolPolicy: () => true });

    const completed = nextToolComplete(session);
    session.dispatchTool("echo", { input: "hi" }, "tc-allow");

    const result = await completed;
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ echoed: "hi" });
  });
});

describe("tool cancellation", () => {
  it("cancelToolCall settles an in-flight call with TOOL_REQUEST_CANCELLED", async () => {
    const session = makeSession();

    const completed = nextToolComplete(session);
    session.dispatchTool("hang", {}, "tc-cancel");
    const verdict = session.cancelToolCall("tc-cancel");

    expect(verdict.status).toBe("cancelled");
    const result = await completed;
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("TOOL_REQUEST_CANCELLED");
  });

  it("cancelToolCall reports unknown or settled call ids", () => {
    const session = makeSession();
    expect(session.cancelToolCall("nope").status).toBe("error");
  });

  it("pool.cancel resolves the execute promise and drops the late result", async () => {
    const pool = new AgenticThreadPool(0, { hang: hangTool });
    pools.push(pool);

    const execPromise = pool.execute({ id: "req-1", toolCallId: "tc", toolName: "hang", args: {} });
    expect(pool.cancel("req-1")).toBe(true);
    expect(pool.cancel("req-1")).toBe(false);

    const result = await execPromise;
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("TOOL_REQUEST_CANCELLED");
  });
});

describe("pause gate semantics", () => {
  it("run parks at the pause gate until resume releases it", async () => {
    const session = makeSession();
    session.pause();

    let settled = false;
    const run = session.run("hello").then((text) => {
      settled = true;
      return text;
    });
    await new Promise((r) => setTimeout(r, 60));
    expect(settled).toBe(false);

    session.resume();
    await expect(run).resolves.toBe("ok");
    session.shutdownEngine();
  });

  it("requestShutdown unblocks a paused run", async () => {
    const session = makeSession();
    session.pause();

    let settled = false;
    const run = session.run("hello").then((text) => {
      settled = true;
      return text;
    });
    await new Promise((r) => setTimeout(r, 60));
    expect(settled).toBe(false);

    session.requestShutdown();
    await run;
    expect(settled).toBe(true);
    session.shutdownEngine();
  });
});

describe("Memory.compact semantics", () => {
  type Msg = { role: string; content: unknown };
  const ctxOf = (s: AgentSession) => (s as unknown as { context: Msg[] }).context;

  it("is a no-op at or below the window threshold", () => {
    const session = makeSession();
    const ctx = ctxOf(session);
    ctx.push(
      { role: "system", content: "sys" },
      { role: "user", content: "u1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "u2" },
    );
    const result = session.compact();
    expect(result).toEqual({ before: 4, after: 4 });
    session.shutdownEngine();
  });

  it("keeps system messages plus a recent window", () => {
    const session = makeSession();
    const ctx = ctxOf(session);
    ctx.push(
      { role: "system", content: "sys" },
      { role: "user", content: "u1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "u2" },
      { role: "assistant", content: "a2" },
      { role: "user", content: "u3" },
      { role: "assistant", content: "a3" },
      { role: "user", content: "u4" },
    );
    const result = session.compact();
    expect(result.before).toBe(8);
    expect(result.after).toBe(5);
    // compact() reassigns this.context — re-read rather than reusing `ctx`.
    const compacted = ctxOf(session);
    expect(compacted[0]).toEqual({ role: "system", content: "sys" });
    expect(compacted.map((m) => m.role)).toEqual([
      "system",
      "assistant",
      "user",
      "assistant",
      "user",
    ]);
    session.shutdownEngine();
  });

  it("never starts the retained window on an orphaned tool message", () => {
    const session = makeSession();
    const ctx = ctxOf(session);
    ctx.push(
      { role: "system", content: "sys" },
      { role: "user", content: "u1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "u2" },
      { role: "tool", content: "tool-result" }, // sits exactly on the window boundary
      { role: "assistant", content: "a2" },
      { role: "user", content: "u3" },
      { role: "assistant", content: "a3" },
    );
    session.compact();
    const nonSystem = ctxOf(session).filter((m) => m.role !== "system");
    // The window backed up to keep the tool result inside its own turn.
    expect(nonSystem[0]).toEqual({ role: "user", content: "u2" });
    expect(nonSystem.map((m) => m.role)).toContain("tool");
    session.shutdownEngine();
  });
});

describe("session ADP-op semantics", () => {
  it("enqueuePrompt/waitForPrompt drain the queue FIFO", async () => {
    const session = makeSession();
    expect(session.enqueuePrompt("first").status).toBe("queued");
    session.enqueuePrompt("second");
    await expect(session.waitForPrompt()).resolves.toBe("first");
    await expect(session.waitForPrompt()).resolves.toBe("second");
    session.shutdownEngine();
  });

  it("enqueuePrompt rejects empty prompts", () => {
    const session = makeSession();
    expect(session.enqueuePrompt("")).toEqual({ status: "error", reason: "missing prompt" });
    session.shutdownEngine();
  });

  it("enqueuePrompt wakes a parked waitForPrompt", async () => {
    const session = makeSession();
    const waiting = session.waitForPrompt();
    session.enqueuePrompt("wake");
    await expect(waiting).resolves.toBe("wake");
    session.shutdownEngine();
  });

  it("requestShutdown resolves a parked waitForPrompt with null", async () => {
    const session = makeSession();
    const waiting = session.waitForPrompt();
    session.requestShutdown();
    await expect(waiting).resolves.toBeNull();
    await expect(session.waitForPrompt()).resolves.toBeNull();
    session.shutdownEngine();
  });

  it("halt with no active inference reports no_active_inference and a later run still completes", async () => {
    const session = makeSession();
    expect(session.halt()).toEqual({ status: "no_active_inference" });
    await expect(session.run("hello")).resolves.toBe("ok");
    session.shutdownEngine();
  });

  it("halt during inference aborts the run", async () => {
    const session = makeSession();
    // Park the run behind the pause gate, then halt — halt releases the gate
    // and publishes the halted terminal.
    session.pause();
    let resolved: string | undefined;
    const run = session.run("hello").then((t) => (resolved = t));
    await new Promise((r) => setTimeout(r, 60));
    expect(resolved).toBeUndefined();
    expect(session.halt().status).toBe("halted");
    await run;
    session.shutdownEngine();
  });

  it("listTools reflects the injected tool set", () => {
    const session = makeSession();
    const { tools } = session.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["echo", "hang"]);
    session.shutdownEngine();
  });

  it("interceptTool validates input and dispatches", () => {
    const session = makeSession();
    expect(session.interceptTool(undefined)).toEqual({
      status: "error",
      reason: "missing toolName",
    });
    const dispatched = session.interceptTool({ toolName: "echo", args: { v: 1 } });
    expect(dispatched.status).toBe("dispatched");
    expect(dispatched.toolCallId).toMatch(/^intercept_/);
    session.shutdownEngine();
  });

  it("getCallFrame reports live counters", () => {
    const session = makeSession();
    session.pause();
    const frame = session.getCallFrame();
    expect(frame).toMatchObject({ paused: true, contextLength: 0 });
    session.shutdownEngine();
  });

  it("injectThought appends a user message and reports the new length", () => {
    const session = makeSession();
    const res = session.injectThought("note this");
    expect(res).toEqual({ status: "injected", contextLength: 1 });
    const ctx = (session as unknown as { context: Array<{ role: string; content: string }> })
      .context;
    expect(ctx[0].content).toContain("[ADP Injected]");
    session.shutdownEngine();
  });
});
