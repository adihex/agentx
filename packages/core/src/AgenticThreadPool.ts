import { Worker } from "node:worker_threads";
import type { ToolDefinition } from "./tools.js";

/**
 * ToolRequest
 *
 * The payload sent to a worker thread to execute a tool. It carries the
 * resolved `modulePath`/`exportName` so the worker can dynamically import the
 * real implementation (no eval of stringified source).
 */
export interface ToolRequest {
  /** Unique execution ID. */
  id: string;
  /** Tool-call ID from the LLM, threaded back so results can be paired. */
  toolCallId: string;
  /** Name of the tool to run. */
  toolName: string;
  /** Arguments for the tool. */
  args: Record<string, unknown>;
  /** Module to import for execution. */
  modulePath: string;
  /** Named export within that module (default "default"). */
  exportName: string;
}

/**
 * ToolResult
 *
 * The payload returned from a worker thread after tool execution.
 */
export interface ToolResult {
  /** Unique execution ID matching the request. */
  id: string;
  /** Tool-call ID from the LLM, matching the request. */
  toolCallId: string;
  /** Whether the tool succeeded. */
  success: boolean;
  /** The tool's output data (on success). */
  data?: unknown;
  /** Error message (on failure). */
  error?: string;
  /** Time spent executing the tool. */
  durationMs: number;
}

/**
 * AgenticThreadPool
 *
 * A fixed-size pool of worker threads for executing tool calls off the main
 * event loop. Workers dynamically `import()` each tool's module and invoke its
 * exported implementation — there is no eval of model-provided text.
 */
export class AgenticThreadPool {
  private workers: Worker[] = [];
  private nextWorkerIndex = 0;
  private pendingRequests = new Map<string, (res: ToolResult) => void>();

  /**
   * Create a new thread pool.
   * @param size - Number of worker threads to spawn.
   * @param tools - Registry of tool definitions (for modulePath/exportName).
   */
  constructor(
    private size: number,
    private tools: Record<string, ToolDefinition> = {},
  ) {
    this.init();
  }

  private init() {
    const workerScript = this.generateWorkerScript();
    for (let i = 0; i < this.size; i++) {
      const worker = new Worker(workerScript, { eval: true });
      worker.on("message", (res: ToolResult) => {
        const resolve = this.pendingRequests.get(res.id);
        if (resolve) {
          this.pendingRequests.delete(res.id);
          resolve(res);
        }
      });
      worker.on("error", (err) => {
        console.error(`[ThreadPool] Worker ${i} error:`, err);
      });
      this.workers.push(worker);
    }
  }

  /**
   * Execute a tool call in the next available worker thread.
   *
   * Resolves the tool's `modulePath`/`exportName` from the registry and sends
   * them to the worker. Rejects if the tool is unknown or has no module path.
   * @param req - The tool request (id, toolCallId, toolName, args).
   * @returns A promise that resolves with the tool result.
   */
  public async execute(req: {
    id: string;
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  }): Promise<ToolResult> {
    const def = this.tools[req.toolName];
    if (!def || !def.modulePath) {
      return {
        id: req.id,
        toolCallId: req.toolCallId,
        success: false,
        error: `Tool "${req.toolName}" is not registered with a modulePath`,
        durationMs: 0,
      };
    }

    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.size;

    const payload: ToolRequest = {
      id: req.id,
      toolCallId: req.toolCallId,
      toolName: req.toolName,
      args: req.args,
      modulePath: def.modulePath,
      exportName: def.exportName ?? "default",
    };

    return new Promise((resolve) => {
      this.pendingRequests.set(req.id, resolve);
      worker.postMessage(payload);
    });
  }

  /** Terminate all workers and reject any in-flight requests. */
  public async terminateAll(): Promise<void> {
    for (const [id, resolve] of this.pendingRequests) {
      resolve({
        id,
        toolCallId: "",
        success: false,
        error: "Thread pool terminated before completion",
        durationMs: 0,
      });
    }
    this.pendingRequests.clear();
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers = [];
  }

  private generateWorkerScript(): string {
    // The worker dynamically imports the tool's module by file URL and calls
    // its exported implementation. Under tsx dev the .ts path resolves (tsx
    // patches the worker loader); for built output the .js path resolves.
    return `
      const { parentPort } = require('node:worker_threads');
      const { pathToFileURL } = require('node:url');

      parentPort.on('message', async (req) => {
        const start = Date.now();
        const { id, toolCallId, toolName, args, modulePath, exportName } = req;

        try {
          const url = pathToFileURL(modulePath).href;
          const mod = await import(url);
          const fn = mod[exportName] ?? mod.default;
          if (typeof fn !== 'function') {
            throw new Error('Tool "' + toolName + '" export "' + exportName + '" is not a function');
          }

          const data = await fn(args);
          parentPort.postMessage({
            id,
            toolCallId,
            success: true,
            data,
            durationMs: Date.now() - start,
          });
        } catch (err) {
          parentPort.postMessage({
            id,
            toolCallId,
            success: false,
            error: err && err.message ? err.message : String(err),
            durationMs: Date.now() - start,
          });
        }
      });
    `;
  }
}
