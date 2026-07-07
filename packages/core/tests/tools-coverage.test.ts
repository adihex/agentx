import { describe, it, expect } from "vitest";
import { classifyModel, buildToolSet, defineTool } from "../src/tools";
import { z } from "zod";

describe("classifyModel — full coverage", () => {
  it("should classify qwen models as messages", () => {
    expect(classifyModel("qwen-max")).toBe("messages");
    expect(classifyModel("qwen2.5-72b-instruct")).toBe("messages");
  });

  it("should classify gemini models as vertex", () => {
    expect(classifyModel("gemini-2.5-flash")).toBe("vertex");
    expect(classifyModel("gemini-2.0-pro")).toBe("vertex");
  });

  it("should classify google/ prefixed models as vertex", () => {
    expect(classifyModel("google/gemma-3-27b-it")).toBe("vertex");
  });

  it("should classify unknown models as chat", () => {
    expect(classifyModel("gpt-4o")).toBe("chat");
    expect(classifyModel("claude-sonnet-4-20250514")).toBe("chat");
    expect(classifyModel("")).toBe("chat");
  });
});

describe("tools helpers — full coverage", () => {
  it("defineTool should return the same definition", () => {
    const def = defineTool({
      name: "myTool",
      description: "A tool",
      inputSchema: z.object({ x: z.number() }),
    });
    expect(def.name).toBe("myTool");
    expect(def.description).toBe("A tool");
  });

  it("buildToolSet should create a ToolSet from definitions", () => {
    const toolSet = buildToolSet({
      toolA: {
        name: "toolA",
        description: "First tool",
        inputSchema: z.object({ a: z.string() }),
      },
      toolB: {
        name: "toolB",
        description: "Second tool",
        inputSchema: z.object({ b: z.number() }),
      },
    });
    expect(Object.keys(toolSet)).toEqual(["toolA", "toolB"]);
    expect(toolSet.toolA).toBeDefined();
    expect(toolSet.toolB).toBeDefined();
  });

  it("buildToolSet should return empty set for empty definitions", () => {
    const toolSet = buildToolSet({});
    expect(Object.keys(toolSet)).toHaveLength(0);
  });
});
