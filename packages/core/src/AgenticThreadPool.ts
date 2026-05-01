import { Worker } from 'node:worker_threads';

// ─── Public Types ──────────────────────────────────────────────────────────────

export interface ToolRequest {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  result?: unknown;
  error?: string;
  durationMs: number;
}

// ─── Thread Pool ───────────────────────────────────────────────────────────────

/**
 * AgenticThreadPool
 *
 * Models the libuv thread-pool: a fixed set of worker_threads that execute
 * tool calls off the main thread. When a tool finishes, its result is returned
 * via a Promise which the AgentEventLoop drains as a macrotask.
 *
 * Each worker runs a self-contained JS snippet (eval mode). In production you
 * would point workers at compiled tool bundles or load them dynamically.
 */
export class AgenticThreadPool {
  private workers: Worker[] = [];
  private roundRobinIdx = 0;

  /** Inline worker script — runs inside its own V8 isolate */
  private static WORKER_SCRIPT = `
    const { parentPort } = require('worker_threads');

    // Built-in tool registry inside the worker isolate
    const tools = {
      heavyComputation: async (args) => {
        const start = Date.now();
        await new Promise(r => setTimeout(r, args.duration || 3000));
        return {
          success: true,
          computedAt: new Date().toISOString(),
          durationMs: Date.now() - start,
          message: 'Heavy computation finished inside worker thread!',
        };
      },

      fileAnalysis: async (args) => {
        const start = Date.now();
        // Simulate reading + parsing a large file
        await new Promise(r => setTimeout(r, args.duration || 2000));
        return {
          success: true,
          linesProcessed: Math.floor(Math.random() * 50000) + 10000,
          anomalies: Math.floor(Math.random() * 12),
          durationMs: Date.now() - start,
        };
      },
    };

    parentPort.on('message', async (req) => {
      const start = Date.now();
      try {
        const fn = tools[req.toolName];
        if (!fn) throw new Error('Unknown tool: ' + req.toolName);
        const result = await fn(req.args);
        parentPort.postMessage({ id: req.id, result, durationMs: Date.now() - start });
      } catch (err) {
        parentPort.postMessage({ id: req.id, error: err.message, durationMs: Date.now() - start });
      }
    });
  `;

  constructor(poolSize = 4) {
    for (let i = 0; i < poolSize; i++) {
      this.spawn();
    }
    console.log(`[ThreadPool] Spawned ${poolSize} worker threads`);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Dispatch a tool request to the next available worker (round-robin). */
  public execute(req: ToolRequest): Promise<ToolResult> {
    return new Promise((resolve) => {
      const worker = this.pick();
      if (!worker) {
        resolve({ id: req.id, error: 'No workers available', durationMs: 0 });
        return;
      }

      const onMessage = (res: ToolResult) => {
        if (res.id === req.id) {
          worker.off('message', onMessage);
          resolve(res);
        }
      };
      worker.on('message', onMessage);
      worker.postMessage(req);
    });
  }

  /** Kill every worker. Used during shutdown. */
  public async terminateAll(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers = [];
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private spawn() {
    const worker = new Worker(AgenticThreadPool.WORKER_SCRIPT, { eval: true });
    worker.on('error', (err: Error) => {
      console.error('[ThreadPool] Worker crashed, respawning:', err.message);
      this.remove(worker);
      this.spawn();
    });
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[ThreadPool] Worker exited with code ${code}, respawning`);
        this.remove(worker);
        this.spawn();
      }
    });
    this.workers.push(worker);
  }

  private remove(w: Worker) {
    const idx = this.workers.indexOf(w);
    if (idx >= 0) this.workers.splice(idx, 1);
  }

  private pick(): Worker | undefined {
    if (this.workers.length === 0) return undefined;
    const w = this.workers[this.roundRobinIdx % this.workers.length];
    this.roundRobinIdx++;
    return w;
  }
}
