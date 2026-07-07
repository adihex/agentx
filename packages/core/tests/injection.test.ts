import { describe, it, expect, vi } from "vitest";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { AgentEventLoop } from "../src/AgentEventLoop";
import type { ToolDefinition } from "../src/tools";

const fixturePath = fileURLToPath(new URL("./fixtures/echoTool.ts", import.meta.url));

describe("AgentEventLoop Tool Injection", () => {
  it("should execute an injected tool", async () => {
    const myCustomTool: ToolDefinition = {
      name: "myCustomTool",
      description: "Echoes its args",
      inputSchema: z.object({ some: z.string() }),
      modulePath: fixturePath,
      exportName: "echo",
    };

    const loop = new AgentEventLoop({
      adpPort: 9225,
      tools: { myCustomTool },
    });

    // Manually trigger the tool (simulating an LLM action or intercept)
    loop.dispatchTool("myCustomTool", { some: "args" }, "tc-inject-1");

    // Wait for the worker to respond and push onto the macrotask queue.
    await new Promise((resolve) => setTimeout(resolve, 500));

    const macrotasks = (loop as any).macrotaskQueue;
    expect(macrotasks.some((t: any) => t.source === "myCustomTool")).toBe(true);
    expect(macrotasks.some((t: any) => t.toolCallId === "tc-inject-1")).toBe(true);

    await loop.shutdown();
  });

  it("should support custom ADP handlers", async () => {
    const loop = new AgentEventLoop({ adpPort: 9226 });
    const handler = vi.fn();

    loop.registerAdpHandler("Custom.test", handler);

    // Simulate an ADP call using the new EventEmitter API
    loop.adp.emit("Custom.test", { foo: "bar" }, () => {});

    expect(handler).toHaveBeenCalledWith({ foo: "bar" }, expect.any(Function));

    await loop.shutdown();
  });
});
