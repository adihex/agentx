import { Worker } from "node:worker_threads";
import { createJiti } from "jiti";
import type { ToolDefinition } from "./tools.js";

const jiti = createJiti(import.meta.url);
const DEFAULT_TOOL_TIMEOUT_MS = 30_000;

export type ToolExecutionErrorCode =
  | "TOOL_NOT_REGISTERED"
  | "TOOL_EXPORT_INVALID"
  | "TOOL_EXECUTION_ERROR"
  | "TOOL_TIMEOUT"
  | "THREAD_POOL_TERMINATED"
  | "THREAD_POOL_UNAVAILABLE"
  | "WORKER_ERROR"
  | "WORKER_EXIT";

export interface AgenticThreadPoolOptions {
  /** Default max runtime for any tool execution before a timeout result is returned. */
  defaultTimeoutMs?: number;
}

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
  /** Stable machine-readable error code (on failure). */
  errorCode?: ToolExecutionErrorCode;
  /** Time spent executing the tool. */
  durationMs: number;
}

interface PendingToolRequest {
  request: Pick<ToolRequest, "id" | "toolCallId" | "toolName">;
  resolve: (res: ToolResult) => void;
  worker: Worker;
  startedAt: number;
  timeout?: ReturnType<typeof setTimeout>;
}

class ToolExecutionFailure extends Error {
  public constructor(
    public readonly errorCode: ToolExecutionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ToolExecutionFailure";
  }
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
  private pendingRequests = new Map<string, PendingToolRequest>();
  private readonly defaultTimeoutMs: number;
  private isTerminatingAll = false;
  private terminated = false;

  /**
   * Create a new thread pool.
   * @param size - Number of worker threads to spawn.
   * @param tools - Registry of tool definitions (for modulePath/exportName).
   * @param options - Bounded execution settings.
   */
  constructor(
    private size: number,
    private tools: Record<string, ToolDefinition> = {},
    options: AgenticThreadPoolOptions = {},
  ) {
    this.defaultTimeoutMs = this.normalizeTimeoutMs(options.defaultTimeoutMs);
    this.init();
  }

  private init() {
    for (let i = 0; i < this.size; i++) {
      this.workers.push(this.createWorker(i));
    }
  }

  private createWorker(index: number): Worker {
    const worker = new Worker(this.generateWorkerScript(), { eval: true });

    worker.on("message", (res: ToolResult) => {
      const pending = this.pendingRequests.get(res.id);
      if (!pending) return;

      this.settlePending(
        res.id,
        res.success
          ? res
          : {
              ...res,
              errorCode: res.errorCode ?? "TOOL_EXECUTION_ERROR",
            },
      );
    });

    worker.on("error", (err) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ThreadPool] Worker ${index} error:`, err);
      this.failPendingForWorker(
        worker,
        "WORKER_ERROR",
        `Worker error before completing tool execution: ${message}`,
      );
      this.replaceWorker(worker);
    });

    worker.on("exit", (code) => {
      if (this.terminated || this.isTerminatingAll) return;

      const currentIndex = this.workers.indexOf(worker);
      if (currentIndex === -1) return;

      this.failPendingForWorker(
        worker,
        "WORKER_EXIT",
        `Worker exited with code ${code} before completing tool execution`,
      );
      this.workers[currentIndex] = this.createWorker(currentIndex);
    });

    return worker;
  }

  /**
   * Execute a tool call in the next available worker thread.
   *
   * Resolves the tool's `modulePath`/`exportName` from the registry and sends
   * them to the worker. Unknown tools, timeouts, worker failures, and pool
   * shutdown all resolve as typed `ToolResult` failures instead of leaving the
   * caller's promise pending.
   * @param req - The tool request (id, toolCallId, toolName, args).
   * @returns A promise that resolves with the tool result.
   */
  public async execute(req: {
    id: string;
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  }): Promise<ToolResult> {
    const requestMeta = {
      id: req.id,
      toolCallId: req.toolCallId,
      toolName: req.toolName,
    };
    const start = Date.now();
    const def = this.tools[req.toolName];

    if (!def || !def.modulePath) {
      return this.errorResult(
        requestMeta,
        "TOOL_NOT_REGISTERED",
        `Tool "${req.toolName}" is not registered with a modulePath`,
        start,
      );
    }

    if (this.terminated) {
      return this.errorResult(
        requestMeta,
        "THREAD_POOL_TERMINATED",
        "Thread pool has already been terminated",
        start,
      );
    }

    const timeoutMs = this.timeoutFor(def);

    // In test environment, execute on main thread using jiti.
    // This path is still bounded for never-resolving async tool mocks.
    if (process.env.NODE_ENV === "test" || process.env.MOCK_LLM === "true") {
      return this.executeOnMainThread(req, def, timeoutMs);
    }

    if (this.workers.length === 0) {
      return this.errorResult(
        requestMeta,
        "THREAD_POOL_UNAVAILABLE",
        "Thread pool has no workers available",
        start,
      );
    }

    const workerIndex = this.nextWorkerIndex % this.workers.length;
    const worker = this.workers[workerIndex];
    this.nextWorkerIndex = (workerIndex + 1) % this.workers.length;

    const payload: ToolRequest = {
      id: req.id,
      toolCallId: req.toolCallId,
      toolName: req.toolName,
      args: req.args,
      modulePath: def.modulePath,
      exportName: def.exportName ?? "default",
    };

    return new Promise((resolve) => {
      const pending: PendingToolRequest = {
        request: requestMeta,
        resolve,
        worker,
        startedAt: start,
      };
      pending.timeout = this.createTimeout(pending, timeoutMs);
      this.pendingRequests.set(req.id, pending);

      try {
        worker.postMessage(payload);
      } catch (err) {
        this.settlePending(
          req.id,
          this.errorFromUnknown(
            requestMeta,
            err,
            start,
            "WORKER_ERROR",
            "Worker failed to accept tool execution request",
          ),
        );
        this.replaceWorker(worker);
      }
    });
  }

  /** Terminate all workers and resolve any in-flight requests as typed failures. */
  public async terminateAll(): Promise<void> {
    this.terminated = true;
    this.isTerminatingAll = true;

    for (const [id, pending] of Array.from(this.pendingRequests.entries())) {
      this.settlePending(
        id,
        this.errorResult(
          pending.request,
          "THREAD_POOL_TERMINATED",
          "Thread pool terminated before completion",
          pending.startedAt,
        ),
      );
    }

    const workers = this.workers;
    this.workers = [];
    await Promise.all(workers.map((worker) => worker.terminate()));
    this.isTerminatingAll = false;
  }

  private async executeOnMainThread(
    req: {
      id: string;
      toolCallId: string;
      toolName: string;
      args: Record<string, unknown>;
    },
    def: ToolDefinition,
    timeoutMs: number,
  ): Promise<ToolResult> {
    const start = Date.now();
    const requestMeta = {
      id: req.id,
      toolCallId: req.toolCallId,
      toolName: req.toolName,
    };
    const exportName = def.exportName ?? "default";
    const run = (async () => {
      const mod = await jiti.import<any>(def.modulePath!);
      const fn = mod[exportName] ?? mod.default;
      if (typeof fn !== "function") {
        throw new ToolExecutionFailure(
          "TOOL_EXPORT_INVALID",
          `Tool "${req.toolName}" export "${exportName}" is not a function`,
        );
      }

      return await fn(req.args);
    })();

    return this.withTimeoutResult(run, requestMeta, timeoutMs, start);
  }

  private async withTimeoutResult(
    run: Promise<unknown>,
    request: Pick<ToolRequest, "id" | "toolCallId" | "toolName">,
    timeoutMs: number,
    startedAt: number,
  ): Promise<ToolResult> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timeoutResult = new Promise<ToolResult>((resolve) => {
      timeout = setTimeout(() => {
        resolve(
          this.errorResult(
            request,
            "TOOL_TIMEOUT",
            `Tool "${request.toolName}" timed out after ${timeoutMs}ms`,
            startedAt,
          ),
        );
      }, timeoutMs);
    });

    try {
      return await Promise.race([
        run.then(
          (data) => ({
            id: request.id,
            toolCallId: request.toolCallId,
            success: true,
            data,
            durationMs: Date.now() - startedAt,
          }),
          (err) => this.errorFromUnknown(request, err, startedAt),
        ),
        timeoutResult,
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private createTimeout(pending: PendingToolRequest, timeoutMs: number): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      const didSettle = this.settlePending(
        pending.request.id,
        this.errorResult(
          pending.request,
          "TOOL_TIMEOUT",
          `Tool "${pending.request.toolName}" timed out after ${timeoutMs}ms`,
          pending.startedAt,
        ),
      );

      if (!didSettle) return;

      this.failPendingForWorker(
        pending.worker,
        "WORKER_EXIT",
        `Worker terminated after tool "${pending.request.toolName}" timed out`,
      );
      this.replaceWorker(pending.worker);
    }, timeoutMs);
  }

  private failPendingForWorker(
    worker: Worker,
    errorCode: ToolExecutionErrorCode,
    error: string,
  ): void {
    for (const [id, pending] of Array.from(this.pendingRequests.entries())) {
      if (pending.worker !== worker) continue;
      this.settlePending(id, this.errorResult(pending.request, errorCode, error, pending.startedAt));
    }
  }

  private replaceWorker(worker: Worker): void {
    if (this.terminated || this.isTerminatingAll) return;

    const index = this.workers.indexOf(worker);
    if (index === -1) return;

    this.workers[index] = this.createWorker(index);
    void worker.terminate().catch((err) => {
      console.error("[ThreadPool] Failed to terminate replaced worker:", err);
    });
  }

  private settlePending(id: string, result: ToolResult): boolean {
    const pending = this.pendingRequests.get(id);
    if (!pending) return false;

    if (pending.timeout) clearTimeout(pending.timeout);
    this.pendingRequests.delete(id);
    pending.resolve(result);
    return true;
  }

  private timeoutFor(def: ToolDefinition): number {
    return this.normalizeTimeoutMs(def.timeoutMs ?? this.defaultTimeoutMs);
  }

  private normalizeTimeoutMs(timeoutMs: number | undefined): number {
    if (timeoutMs === undefined) return DEFAULT_TOOL_TIMEOUT_MS;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return DEFAULT_TOOL_TIMEOUT_MS;
    return Math.max(1, Math.floor(timeoutMs));
  }

  private errorFromUnknown(
    request: Pick<ToolRequest, "id" | "toolCallId" | "toolName">,
    err: unknown,
    startedAt: number,
    fallbackCode: ToolExecutionErrorCode = "TOOL_EXECUTION_ERROR",
    fallbackMessage?: string,
  ): ToolResult {
    if (err instanceof ToolExecutionFailure) {
      return this.errorResult(request, err.errorCode, err.message, startedAt);
    }

    const message = err instanceof Error ? err.message : String(err);
    return this.errorResult(request, fallbackCode, fallbackMessage ?? message, startedAt);
  }

  private errorResult(
    request: Pick<ToolRequest, "id" | "toolCallId" | "toolName">,
    errorCode: ToolExecutionErrorCode,
    error: string,
    startedAt: number,
  ): ToolResult {
    return {
      id: request.id,
      toolCallId: request.toolCallId,
      success: false,
      error,
      errorCode,
      durationMs: Math.max(0, Date.now() - startedAt),
    };
  }

  private generateWorkerScript(): string {
    // The worker dynamically imports the tool's module using jiti.
    // Supports version-agnostic factory function (v1 fallback vs v2 createJiti).
    return `
      const { parentPort } = require('node:worker_threads');
      const jitiLib = require('jiti');
      
      const createJiti = jitiLib.createJiti || jitiLib;
      const jiti = createJiti(process.cwd());

      parentPort.on('message', async (req) => {
        const start = Date.now();
        const { id, toolCallId, toolName, args, modulePath, exportName } = req;

        try {
          const mod = await jiti.import(modulePath);
          const fn = mod[exportName] ?? mod.default;
          if (typeof fn !== 'function') {
            parentPort.postMessage({
              id,
              toolCallId,
              success: false,
              error: 'Tool "' + toolName + '" export "' + exportName + '" is not a function',
              errorCode: 'TOOL_EXPORT_INVALID',
              durationMs: Date.now() - start,
            });
            return;
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
            errorCode: 'TOOL_EXECUTION_ERROR',
            durationMs: Date.now() - start,
          });
        }
      });
    `;
  }
}
