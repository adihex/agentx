import { Worker } from "node:worker_threads";
import { createJiti } from "jiti";
import type { ToolDefinition } from "./tools.js";

const jiti = createJiti(import.meta.url);
const DEFAULT_TOOL_TIMEOUT_MS = 30_000;

export type ToolExecutionErrorCode =
  | "TOOL_NOT_REGISTERED"
  | "TOOL_ARGS_INVALID"
  | "TOOL_EXPORT_INVALID"
  | "TOOL_EXECUTION_ERROR"
  | "TOOL_TIMEOUT"
  | "TOOL_OUTPUT_TOO_LARGE"
  | "TOOL_QUEUE_FULL"
  | "THREAD_POOL_TERMINATED"
  | "THREAD_POOL_UNAVAILABLE"
  | "WORKER_ERROR"
  | "WORKER_EXIT"
  | "TOOL_REQUEST_CANCELLED"
  | "TOOL_POLICY_DENIED";

export interface AgenticThreadPoolOptions {
  /** Default max runtime for any tool execution before a timeout result is returned. */
  defaultTimeoutMs?: number;
  /**
   * Maximum in-flight tool executions (worker-dispatched + main-thread).
   * Beyond it, execute() fails fast with TOOL_QUEUE_FULL. Default 256.
   */
  maxPendingRequests?: number;
  /**
   * Maximum serialized size of a tool's result data in bytes. Oversized or
   * unserializable results are converted into typed failures so a runaway
   * tool cannot blow up the model context. Default 1 MiB.
   */
  maxResultBytes?: number;
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
  /** Owning worker; null on the main-thread (test) execution path. */
  worker: Worker | null;
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
  private readonly maxPendingRequests: number;
  private readonly maxResultBytes: number;
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
    this.maxPendingRequests = this.normalizePositiveInt(options.maxPendingRequests, 256);
    this.maxResultBytes = this.normalizePositiveInt(options.maxResultBytes, 1_048_576);
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

      const result = res.success
        ? res
        : {
            ...res,
            errorCode: res.errorCode ?? "TOOL_EXECUTION_ERROR",
          };
      this.settlePending(
        res.id,
        this.capResult(result, pending.request, pending.startedAt),
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

    // Arg validation is fail-closed: malformed input never reaches the tool,
    // and the worker receives the schema-normalized value (defaults applied).
    const parsedArgs = def.inputSchema.safeParse(req.args);
    if (!parsedArgs.success) {
      return this.errorResult(
        requestMeta,
        "TOOL_ARGS_INVALID",
        `Invalid args for tool "${req.toolName}": ${parsedArgs.error.issues
          .map((i) => `${i.path.join(".") || "input"}: ${i.message}`)
          .join("; ")}`,
        start,
      );
    }

    if (this.pendingRequests.size >= this.maxPendingRequests) {
      return this.errorResult(
        requestMeta,
        "TOOL_QUEUE_FULL",
        `Tool queue is full (${this.maxPendingRequests} pending executions)`,
        start,
      );
    }

    const timeoutMs = this.timeoutFor(def);
    const normalizedReq = { ...req, args: parsedArgs.data as Record<string, unknown> };

    // In test environment, execute on main thread using jiti.
    // This path is still bounded for never-resolving async tool mocks.
    if (process.env.NODE_ENV === "test" || process.env.MOCK_LLM === "true") {
      // Main-thread executions register in pendingRequests too, so cancel()
      // and the queue bound apply identically on both paths. The underlying
      // computation keeps running after a cancel — its result is dropped.
      return new Promise<ToolResult>((resolve) => {
        const pending: PendingToolRequest = {
          request: requestMeta,
          resolve,
          worker: null,
          startedAt: start,
        };
        this.pendingRequests.set(req.id, pending);
        void this.executeOnMainThread(normalizedReq, def, timeoutMs)
          .then((res) => this.settlePending(req.id, res))
          .catch((err) =>
            this.settlePending(req.id, this.errorFromUnknown(requestMeta, err, start)),
          );
      });
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
      args: normalizedReq.args,
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

  /**
   * Cancel an in-flight request: resolves its execute() promise immediately
   * with TOOL_REQUEST_CANCELLED. The worker/main-thread computation is not
   * interrupted — its eventual result is dropped because the pending entry is
   * gone. Returns false when the id is unknown or already settled.
   */
  public cancel(id: string): boolean {
    const pending = this.pendingRequests.get(id);
    if (!pending) return false;
    return this.settlePending(
      id,
      this.errorResult(
        pending.request,
        "TOOL_REQUEST_CANCELLED",
        `Tool execution "${pending.request.toolName}" was cancelled`,
        pending.startedAt,
      ),
    );
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
          (data) =>
            this.capResult(
              {
                id: request.id,
                toolCallId: request.toolCallId,
                success: true,
                data,
                durationMs: Date.now() - startedAt,
              },
              request,
              startedAt,
            ),
          (err) => this.errorFromUnknown(request, err, startedAt),
        ),
        timeoutResult,
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  /**
   * Enforce the result-size bound: oversized or unserializable tool output is
   * folded into a typed failure instead of reaching the model context.
   */
  private capResult(
    result: ToolResult,
    request: Pick<ToolRequest, "id" | "toolCallId" | "toolName">,
    startedAt: number,
  ): ToolResult {
    if (!result.success) return result;

    let size: number;
    try {
      const serialized = JSON.stringify(result.data);
      size = serialized === undefined ? 0 : Buffer.byteLength(serialized, "utf8");
    } catch {
      return this.errorResult(
        request,
        "TOOL_EXECUTION_ERROR",
        `Tool "${request.toolName}" returned an unserializable result`,
        startedAt,
      );
    }

    if (size > this.maxResultBytes) {
      return this.errorResult(
        request,
        "TOOL_OUTPUT_TOO_LARGE",
        `Tool "${request.toolName}" result exceeded ${this.maxResultBytes} bytes`,
        startedAt,
      );
    }
    return result;
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

      if (!didSettle || !pending.worker) return;

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

  private normalizePositiveInt(value: number | undefined, fallback: number): number {
    if (value === undefined) return fallback;
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.max(1, Math.floor(value));
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
