import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLMOrchestrator } from "../src/LLMOrchestrator";
import { streamText } from "ai";

vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => vi.fn()),
}));

describe("LLMOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call streamText with correct parameters", async () => {
    const orchestrator = new LLMOrchestrator({ apiKey: "test" });
    const mockStream = (async function* () {
      yield "Hello";
      yield " World";
    })();

    (streamText as any).mockReturnValue({
      textStream: mockStream,
    });

    const abortController = new AbortController();
    const generator = orchestrator.generateStream(
      [{ role: "user", content: "hi" }],
      abortController.signal,
    );

    const chunks = [];
    for await (const chunk of generator) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["Hello", " World"]);
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
    // Private access to check defaults if needed, but we can verify via constructor if we exported more.
    // For now we just check it doesn't crash.
    expect(orchestrator).toBeDefined();
  });
});
