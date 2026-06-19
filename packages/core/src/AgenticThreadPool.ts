import { Worker } from "node:worker_threads";
import path from "node:url";

/**
 * ToolRequest
 *
 * The payload sent to a worker thread to execute a tool.
 */
export interface ToolRequest {
  /** Unique execution ID */
  id: string;
  /** Name of the tool to run */
  toolName: string;
  /** Arguments for the tool */
  args: Record<string, unknown>;
}

/**
 * ToolResult
 *
 * The payload returned from a worker thread after tool execution.
 */
export interface ToolResult {
  /** Unique execution ID matching the request */
  id: string;
  /** Whether the tool succeeded */
  success: boolean;
  /** The tool's output data (on success) */
  data?: unknown;
  /** Error message (on failure) */
  error?: string;
  /** Time spent executing the tool */
  durationMs: number;
}

/**
 * AgenticThreadPool
 *
 * A fixed-size pool of worker threads for executing tool calls
 * off the main event loop.
 */
export class AgenticThreadPool {
  private workers: Worker[] = [];
  private nextWorkerIndex = 0;
  private pendingRequests = new Map<string, (res: ToolResult) => void>();

  /**
   * Create a new thread pool.
   * @param size - Number of worker threads to spawn.
   * @param tools - Optional mapping of tool names to implementation paths.
   */
  constructor(private size: number, private tools?: Record<string, string>) {
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
   * @param req - The tool request payload.
   * @returns A promise that resolves with the tool result.
   */
  public async execute(req: ToolRequest): Promise<ToolResult> {
    const worker = this.workers[this.nextWorkerIndex];
    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.size;

    return new Promise((resolve) => {
      this.pendingRequests.set(req.id, resolve);
      worker.postMessage(req);
    });
  }

  /** Terminate all workers in the pool. */
  public async terminateAll(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers = [];
  }

  private generateWorkerScript(): string {
    const toolsJson = JSON.stringify(this.tools ?? {});
    return `
      const { parentPort } = require('node:worker_threads');
      const tools = ${toolsJson};

      parentPort.on('message', async (req) => {
        const start = Date.now();
        const { id, toolName, args } = req;
        
        try {
          const toolCode = tools[toolName];
          if (!toolCode) throw new Error(\`Tool "\${toolName}" not found\`);
          
          const toolFn = eval('(' + toolCode + ')');
          if (typeof toolFn !== 'function') throw new Error(\`Tool "\${toolName}" is not a function\`);
          
          const data = await toolFn(args);
          parentPort.postMessage({
            id,
            success: true,
            data,
            durationMs: Date.now() - start
          });
        } catch (err) {
          parentPort.postMessage({
            id,
            success: false,
            error: err.message,
            durationMs: Date.now() - start
          });
        }
      });
    `;
  }
}
