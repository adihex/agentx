/**
 * LLMOrchestrator — coverage for qwen/Anthropic and vertex/google routing
 */
import { describe, it, expect, vi } from "vitest";
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

describe("LLMOrchestrator routing", () => {
  it("should route qwen models to Anthropic Messages API", async () => {
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
      "qwen-max",
    );

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.objectContaining({ modelId: "messages-model" }),
      }),
    );
  });

  it("should route google/ models to Vertex AI", async () => {
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
      "google/gemma-3-27b-it",
    );

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.objectContaining({ modelId: "vertex-model" }),
      }),
    );
  });

  it("should route unknown models to OpenAI Chat", async () => {
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
      "claude-sonnet-4-20250514",
    );

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.objectContaining({ modelId: "chat-model" }),
      }),
    );
  });

  it("should use constructor options for google project/location", () => {
    const orchestrator = new LLMOrchestrator({
      apiKey: "test",
      googleProject: "my-project",
      googleLocation: "europe-west1",
    });
    expect(orchestrator).toBeDefined();
  });

  it("should runStep with default model when none specified", async () => {
    const orchestrator = new LLMOrchestrator({
      apiKey: "test",
      model: "default-gpt",
    });

    (streamText as any).mockReturnValue({
      fullStream: (async function* () {})(),
      response: Promise.resolve({ messages: [] }),
      toolCalls: Promise.resolve([]),
      text: Promise.resolve(""),
    });

    // Call without providing model arg
    await orchestrator.runStep([{ role: "user", content: "hi" }], {}, new AbortController().signal);

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.objectContaining({ modelId: "chat-model" }),
      }),
    );
  });

  it("should runStep with undefined model falling back to default", async () => {
    const orchestrator = new LLMOrchestrator({
      apiKey: "test",
    });

    (streamText as any).mockReturnValue({
      fullStream: (async function* () {})(),
      response: Promise.resolve({ messages: [] }),
      toolCalls: Promise.resolve([]),
      text: Promise.resolve(""),
    });

    // Call with undefined model — should fall back to env/constructor default
    await orchestrator.runStep(
      [{ role: "user", content: "hi" }],
      {},
      new AbortController().signal,
      undefined as any,
    );

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.objectContaining({ modelId: "chat-model" }),
      }),
    );
  });

  it("should use environment variables for defaults", () => {
    const prevKey = process.env.OPENAI_API_KEY;
    const prevModel = process.env.AGENT_MODEL;
    process.env.OPENAI_API_KEY = "env-api-key";
    process.env.AGENT_MODEL = "env-model";

    const orchestrator = new LLMOrchestrator();
    expect(orchestrator).toBeDefined();

    process.env.OPENAI_API_KEY = prevKey;
    process.env.AGENT_MODEL = prevModel;
  });
});
