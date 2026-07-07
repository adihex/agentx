import { z } from "zod";
import { tool, type ToolSet, type ModelMessage } from "ai";

/**
 * ToolDefinition
 *
 * The shared contract describing a tool to the runtime. The `inputSchema`
 * is advertised to the LLM (native tool calling) AND used to validate args.
 * Worker execution resolves `modulePath` + `exportName` and calls it; an
 * optional inline `execute` supports mocks / main-thread implementations.
 */
export interface ToolDefinition<I = any> {
  /** Tool name as advertised to the model. */
  name: string;
  /** Human-readable description advertised to the model. */
  description: string;
  /** Zod schema advertised to the LLM AND used to validate args. */
  inputSchema: z.ZodType<I>;
  /** Worker execution: module to import. */
  modulePath?: string;
  /** Named export in that module (default "default"). */
  exportName?: string;
  /** Optional inline / main-thread implementation (mocks/tests). */
  execute?: (input: I) => Promise<unknown>;
}

/** Transport family for a given model id. */
export type ModelFamily = "chat" | "messages" | "vertex";

/**
 * Classify a model id into its transport family.
 *
 * Per zen-capability-matrix.json: model ids starting with "qwen" use the
 * Anthropic Messages API ("messages"); model ids starting with "gemini-"
 * or "google/" use the Vertex AI API ("vertex"); everything else uses the
 * OpenAI Chat Completions API ("chat").
 */
export function classifyModel(modelId: string): ModelFamily {
  if (modelId.startsWith("qwen")) return "messages";
  if (modelId.startsWith("gemini-") || modelId.startsWith("google/")) return "vertex";
  return "chat";
}

/** Identity helper for authoring tool definitions with inference. */
export function defineTool<I>(def: ToolDefinition<I>): ToolDefinition<I> {
  return def;
}

/**
 * Build the AI SDK ToolSet used to advertise tools to the model.
 *
 * NOTE: no `execute` is attached to the SDK tool — the event loop
 * self-dispatches tool calls to the worker pool. With stepCountIs(1) the
 * SDK returns the requested tool calls and stops, so the loop stays in
 * control of execution.
 */
export function buildToolSet(defs: Record<string, ToolDefinition>): ToolSet {
  const set: ToolSet = {};
  for (const [name, d] of Object.entries(defs)) {
    set[name] = tool({ description: d.description, inputSchema: d.inputSchema });
  }
  return set;
}

/** Canonical, provider-agnostic representation of one tool call. */
export interface InferenceToolCall {
  toolCallId: string;
  toolName: string;
  input: unknown;
}

/** Canonical result of one inference step. */
export interface InferenceStepResult {
  /** Final assistant text for this step (may be empty if only tool calls). */
  text: string;
  /** Tool calls the model requested this step. */
  toolCalls: InferenceToolCall[];
  /**
   * Messages produced during the step (assistant turn, incl. tool_calls).
   * Append verbatim to the context to record the turn correctly.
   */
  responseMessages: ModelMessage[];
}
