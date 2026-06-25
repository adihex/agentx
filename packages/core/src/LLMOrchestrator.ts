import { streamText, stepCountIs, type ModelMessage, type ToolSet, type LanguageModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import { classifyModel, type InferenceStepResult } from "./tools.js";

/**
 * LLMOrchestrator
 *
 * Wraps the Vercel AI SDK to provide a single native-tool-calling inference
 * step with a first-class AbortSignal. When the ADP control-plane issues
 * Inference.halt, the abort signal fires and the underlying HTTP request is
 * killed at the OS level.
 *
 * It routes to ONE of two providers per request, keyed off the model id
 * (per zen-capability-matrix.json — both families live on the same gateway):
 *
 *   • family "chat"     → OpenAI Chat Completions (@ai-sdk/openai-compatible),
 *                         `Authorization: Bearer <key>`. Used by every non-qwen
 *                         model. baseURL points at the gateway API root.
 *   • family "messages" → Anthropic Messages API (@ai-sdk/anthropic),
 *                         headers `x-api-key` + `anthropic-version`. Used by
 *                         qwen* models.
 *
 * A single openai-compatible transport CANNOT reach qwen, hence the router.
 */
export class LLMOrchestrator {
  private openai: ReturnType<typeof createOpenAICompatible>;
  private anthropic: ReturnType<typeof createAnthropic>;
  private defaultModel: string;

  constructor(
    opts: {
      apiKey?: string;
      baseURL?: string;
      /** Separate base URL for the Anthropic Messages family (defaults to baseURL). */
      anthropicBaseURL?: string;
      model?: string;
    } = {},
  ) {
    const apiKey = opts.apiKey || process.env.OPENAI_API_KEY || "";
    const baseURL = opts.baseURL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const anthropicBaseURL = opts.anthropicBaseURL || process.env.ANTHROPIC_BASE_URL || baseURL;

    // chat family — OpenAI-compatible, Bearer auth, /chat/completions.
    this.openai = createOpenAICompatible({
      name: "agentx",
      apiKey,
      baseURL,
    });

    // messages family — Anthropic Messages API. The gateway expects
    // x-api-key + anthropic-version rather than a Bearer token.
    this.anthropic = createAnthropic({
      baseURL: anthropicBaseURL,
      apiKey,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    this.defaultModel = opts.model || process.env.AGENT_MODEL || "gpt-4o";
  }

  /**
   * Select the provider/model for a given model id based on its family.
   * qwen* → Anthropic Messages; everything else → OpenAI Chat Completions.
   */
  private route(modelId: string): LanguageModel {
    return classifyModel(modelId) === "messages" ? this.anthropic(modelId) : this.openai(modelId);
  }

  /**
   * Run exactly one inference step with native tool calling.
   *
   * Streams text deltas to the optional observer (drives ADP inference.chunk)
   * while collecting the structured tool calls and the assistant response
   * messages. stepCountIs(1) makes the SDK return the requested tool calls
   * and stop — the event loop self-dispatches them to the worker pool.
   *
   * The AbortSignal is wired straight through; aborting it kills the
   * in-flight HTTP request, which is the mechanism behind Inference.halt.
   */
  public async runStep(
    messages: ModelMessage[],
    tools: ToolSet,
    abortSignal: AbortSignal,
    model?: string,
    onTextDelta?: (t: string) => void,
  ): Promise<InferenceStepResult> {
    const result = streamText({
      model: this.route(model || this.defaultModel),
      messages,
      tools,
      stopWhen: stepCountIs(1),
      abortSignal,
    });

    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        onTextDelta?.(part.text);
      }
    }

    const response = await result.response;
    const toolCalls = (await result.toolCalls).map((c) => ({
      toolCallId: c.toolCallId,
      toolName: c.toolName,
      input: c.input,
    }));

    return {
      text: await result.text,
      toolCalls,
      responseMessages: response.messages,
    };
  }
}
