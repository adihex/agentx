import { z } from "zod";

// ─── JSON-RPC 2.0 Base ────────────────────────────────────────────────────────

/**
 * Zod schema for a standard JSON-RPC 2.0 Request.
 */
export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Zod schema for a standard JSON-RPC 2.0 Response.
 */
export const JsonRpcResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
});

/** Represents a JSON-RPC 2.0 request object */
export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;
/** Represents a JSON-RPC 2.0 response object */
export type JsonRpcResponse = z.infer<typeof JsonRpcResponseSchema>;

// ─── ADP Domain Commands ───────────────────────────────────────────────────────

/**
 * AdpDomains — the control plane namespaces.
 * Modeled after the Chrome DevTools Protocol (CDP).
 */
export const AdpDomains = {
  /** LLM generation lifecycle control */
  Inference: {
    halt: "Inference.halt",
    switchModel: "Inference.switchModel",
    evaluate: "Inference.evaluate",
  },
  /** Agent runtime state management */
  Metacognition: {
    pause: "Metacognition.pause",
    resume: "Metacognition.resume",
    getCallFrame: "Metacognition.getCallFrame",
  },
  /** External tool management and interception */
  Toolchain: {
    intercept: "Toolchain.intercept",
    list: "Toolchain.list",
  },
  /** Context and memory management */
  Memory: {
    compact: "Memory.compact",
    queryNodes: "Memory.queryNodes",
  },
  /** High-level session orchestration */
  Session: {
    prompt: "Session.prompt",
    shutdown: "Session.shutdown",
  },
} as const;

/** Callback shape the ADP server uses when dispatching a command to a handler */
export type AdpCommandCallback<T = unknown> = (result: T) => void;

/** Handler signature for an ADP command */
export type AdpCommandHandler<P = Record<string, unknown>, R = unknown> = (
  params: P | undefined,
  callback: AdpCommandCallback<R>,
) => void;

// ─── ADP Events (server → client push) ────────────────────────────────────────

/**
 * Represents an ADP event pushed from server to client.
 */
export interface AdpEvent<T = Record<string, unknown>> {
  jsonrpc: "2.0";
  method: string;
  params?: T;
}
