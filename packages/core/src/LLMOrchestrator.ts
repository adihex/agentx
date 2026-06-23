import { streamText, type CoreMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * LLMOrchestrator
 *
 * Wraps the Vercel AI SDK to provide streaming inference with a first-class
 * AbortSignal. When the ADP control-plane issues Inference.halt, the abort
 * signal fires and the underlying HTTP request is killed at the OS level.
 *
 * The constructor accepts an optional baseURL so you can point it at any
 * OpenAI-compatible endpoint (OpenCode Go, Ollama, Azure, etc.).
 */
export class LLMOrchestrator {
  private provider: ReturnType<typeof createOpenAI>;
  private defaultModel: string;

  constructor(
    opts: {
      apiKey?: string;
      baseURL?: string;
      model?: string;
    } = {},
  ) {
    this.provider = createOpenAI({
      apiKey: opts.apiKey || process.env.OPENAI_API_KEY || "",
      baseURL: opts.baseURL || process.env.OPENAI_BASE_URL || undefined,
    });
    this.defaultModel = opts.model || process.env.AGENT_MODEL || "gpt-4o";
  }

  /**
   * Yield streaming text chunks from the LLM.
   * The caller hands in an AbortSignal — aborting it immediately kills the
   * in-flight HTTP request, which is the mechanism behind Inference.halt.
   */
  public async *generateStream(
    messages: CoreMessage[],
    abortSignal: AbortSignal,
    model?: string,
  ): AsyncGenerator<string, void, unknown> {
    const { textStream } = streamText({
      model: this.provider(model || this.defaultModel),
      messages,
      abortSignal,
    });

    for await (const chunk of textStream) {
      yield chunk;
    }
  }
}
