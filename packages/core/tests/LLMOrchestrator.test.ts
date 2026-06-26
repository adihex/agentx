import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLMOrchestrator } from "../src/LLMOrchestrator";
import { streamText } from "ai";

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    streamText: vi.fn(),
  };
});

vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: vi.fn(() => vi.fn(() => ({ modelId: "chat-model" }))),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => vi.fn(() => ({ modelId: "messages-model" }))),
}));

vi.mock("@ai-sdk/google-vertex", () => ({
  createVertex: vi.fn(() => vi.fn(() => ({ modelId: "vertex-model" }))),
}));

describe("LLMOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should stream text deltas and return tool calls + messages", async () => {
    const orchestrator = new LLMOrchestrator({ apiKey: "test" });

    const fullStream = (async function* () {
      yield { type: "text-delta", id: "1", text: "Hello" };
      yield { type: "text-delta", id: "1", text: " World" };
    })();

    (streamText as any).mockReturnValue({
      fullStream,
      response: Promise.resolve({ messages: [{ role: "assistant", content: "Hello World" }] }),
      toolCalls: Promise.resolve([
        { toolCallId: "tc-1", toolName: "searchMusic", input: { query: "x" } },
      ]),
      text: Promise.resolve("Hello World"),
    });

    const abortController = new AbortController();
    const chunks: string[] = [];
    const result = await orchestrator.runStep(
      [{ role: "user", content: "hi" }],
      {},
      abortController.signal,
      undefined,
      (c) => chunks.push(c),
    );

    expect(chunks).toEqual(["Hello", " World"]);
    expect(result.text).toBe("Hello World");
    expect(result.toolCalls).toEqual([
      { toolCallId: "tc-1", toolName: "searchMusic", input: { query: "x" } },
    ]);
    expect(result.responseMessages).toEqual([{ role: "assistant", content: "Hello World" }]);
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "hi" }],
        abortSignal: abortController.signal,
      }),
    );
  });

  it("should use default values from environment", () => {
    process.env.OPENAI_API_KEY = "env-key";
    process.env.AGENT_MODEL = "env-model";

    const orchestrator = new LLMOrchestrator();
    expect(orchestrator).toBeDefined();
  });

  it("should route to Vertex AI when gemini model is requested", async () => {
    const orchestrator = new LLMOrchestrator({ apiKey: "test" });

    (streamText as any).mockReturnValue({
      fullStream: (async function* () {})(),
      response: Promise.resolve({ messages: [] }),
      toolCalls: Promise.resolve([]),
      text: Promise.resolve(""),
    });

    await orchestrator.runStep(
      [{ role: "user", content: "hi" }],
      {},
      new AbortController().signal,
      "gemini-2.5-flash",
    );

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.objectContaining({ modelId: "vertex-model" }),
      }),
    );
  });
});
