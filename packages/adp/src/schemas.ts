import { z } from 'zod';

// ─── JSON-RPC 2.0 Base ────────────────────────────────────────────────────────

export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string(),
  params: z.record(z.any()).optional(),
});

export const JsonRpcResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.any().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.any().optional(),
    })
    .optional(),
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;
export type JsonRpcResponse = z.infer<typeof JsonRpcResponseSchema>;

// ─── ADP Domain Commands ───────────────────────────────────────────────────────

/** Inference domain — controls the LLM generation lifecycle */
export const AdpDomains = {
  Inference: {
    halt: 'Inference.halt',
    switchModel: 'Inference.switchModel',
    evaluate: 'Inference.evaluate',
  },
  Metacognition: {
    pause: 'Metacognition.pause',
    resume: 'Metacognition.resume',
    getCallFrame: 'Metacognition.getCallFrame',
  },
  Toolchain: {
    intercept: 'Toolchain.intercept',
    list: 'Toolchain.list',
  },
  Memory: {
    compact: 'Memory.compact',
    queryNodes: 'Memory.queryNodes',
  },
  Session: {
    prompt: 'Session.prompt',
    shutdown: 'Session.shutdown',
  },
} as const;

/** Callback shape the ADP server uses when dispatching a command to a handler */
export type AdpCommandCallback = (result: any) => void;

/** Handler signature for an ADP command */
export type AdpCommandHandler = (
  params: Record<string, any> | undefined,
  callback: AdpCommandCallback,
) => void;

// ─── ADP Events (server → client push) ────────────────────────────────────────

export interface AdpEvent {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, any>;
}
