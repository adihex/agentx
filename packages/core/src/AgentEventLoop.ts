import { AdpServer, AdpDomains, type AdpCommandHandler } from "@agentx/adp";
import { AgenticThreadPool } from "./AgenticThreadPool.js";
import { LLMOrchestrator } from "./LLMOrchestrator.js";
import type { CoreMessage } from "ai";
import { EventEmitter } from "node:events";

/**
 * Microtask
 * Internal task queue item for guardrails and validators.
 */
interface Microtask {
  name: string;
  fn: () => Promise<void> | void;
}

/**
 * MacrotaskItem
 * Internal queue item for tool results.
 */
interface MacrotaskItem {
  source: string;
  data: unknown;
}

/**
 * AgentEventLoopOptions
 * Configuration for the agentx runtime.
 */
export interface AgentEventLoopOptions {
  /** Port for the ADP control plane (default: 9222) */
  adpPort?: number;
  /** LLM API Key */
  llmApiKey?: string;
  /** LLM Base URL */
  llmBaseUrl?: string;
  /** LLM Model identifier */
  llmModel?: string;
  /** Number of worker threads for tools (default: 4) */
  threadPoolSize?: number;
  /** Initial system prompt for the agent */
  systemPrompt?: string;
  /** Map of tool names to implementation file paths */
  tools?: Record<string, string>;
}

/**
 * AgentEventLoop — the heart of the agentx runtime.
 *
 * It models the Node.js event-loop phases mapped onto agent semantics:
 *
 *   Phase 1 · Timers       — TTL expiration, cache purge, scheduled checks
 *   Phase 2 · I/O Callbacks— drain macrotask queue (tool results from workers)
 *   Phase 3 · Inference    — stream tokens from the LLM (analogous to Poll)
 *   Phase 4 · Check        — exhaust microtask queue (guardrails, validators)
 *
 * The ADP control-plane runs on a separate WebSocket and can issue commands
 * at any time.
 */
export class AgentEventLoop extends EventEmitter {
  // ── Infrastructure ────────────────────────────────────────────────────────
  /** The ADP control-plane server instance */
  public readonly adp: AdpServer;
  private threadPool: AgenticThreadPool;
  private llm: LLMOrchestrator;

  // ── Queues ────────────────────────────────────────────────────────────────
  private microtaskQueue: Microtask[] = [];
  private macrotaskQueue: MacrotaskItem[] = [];

  // ── State ─────────────────────────────────────────────────────────────────
  private context: CoreMessage[] = [];
  private inferenceAbort: AbortController | null = null;
  private paused = false;
  private running = false;
  private iteration = 0;
  private promptQueue: string[] = [];
  private promptResolver: (() => void) | null = null;
  private shutdownRequested = false;

  /**
   * Create a new AgentEventLoop.
   * @param opts - Configuration options.
   */
  constructor(opts: AgentEventLoopOptions = {}) {
    super();
    const adpPort = opts.adpPort ?? 9222;
    this.adp = new AdpServer(adpPort);
    this.threadPool = new AgenticThreadPool(opts.threadPoolSize ?? 4, opts.tools);
    this.llm = new LLMOrchestrator({
      apiKey: opts.llmApiKey,
      baseURL: opts.llmBaseUrl,
      model: opts.llmModel,
    });

    if (opts.systemPrompt) {
      this.context.push({ role: "system", content: opts.systemPrompt });
    }

    this.wireAdp();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Push a user message and run exactly one loop iteration.
   * @param prompt - The user's input string.
   * @returns A promise resolving to the agent's assistant response.
   */
  public async run(prompt: string): Promise<string> {
    this.context.push({ role: "user", content: prompt });
    this.emit("session.input", { prompt });
    return this.tick();
  }

  /**
   * Dispatch a tool to the thread pool (fire-and-forget, non-blocking).
   * @param toolName - Name of the registered tool to execute.
   * @param args - Arguments for the tool implementation.
   */
  public dispatchTool(toolName: string, args: Record<string, unknown> = {}): void {
    const id = this.uid();
    console.log(`[Loop] 🚀  Dispatching tool "${toolName}" (id=${id}) to thread pool`);

    // Fire and forget — the promise resolves asynchronously and pushes onto
    // the macrotask queue, exactly like libuv posts I/O completions.
    void this.threadPool.execute({ id, toolName, args }).then((result) => {
      console.log(`[Loop] 📬  Tool "${toolName}" completed in ${result.durationMs}ms`);
      this.macrotaskQueue.push({ source: toolName, data: result });
      this.emit("tool.complete", { toolName, id, result });

      // Broadcast tool completion to any ADP observers
      this.adp.notify("Toolchain.responseReceived", { toolName, result });
    });
    this.emit("tool.dispatch", { toolName, id, args });
  }

  /**
   * Register a microtask (guardrail / validator) to run before the next action.
   * @param name - Descriptive name for logging.
   * @param fn - Async or sync function to execute.
   */
  public addMicrotask(name: string, fn: () => Promise<void> | void): void {
    this.microtaskQueue.push({ name, fn });
  }

  /**
   * Register a custom ADP command handler.
   * @param method - The ADP method name (e.g. "MyDomain.myAction").
   * @param handler - Function to handle the command.
   */
  public registerAdpHandler<P = Record<string, unknown>, R = unknown>(
    method: string, 
    handler: AdpCommandHandler<P, R>
  ): void {
    this.adp.on(method, handler as any);
  }

  /**
   * Emit an event via the ADP control plane.
   * @param method - The ADP event method name.
   * @param params - Optional payload for the event.
   */
  public emitAdpEvent<T = Record<string, unknown>>(method: string, params?: T): void {
    this.adp.notify(method, params);
  }

  /**
   * Wait for the next prompt from the ADP control plane.
   * @returns A promise resolving to the next prompt string or null if shutting down.
   */
  public async waitForPrompt(): Promise<string | null> {
    if (this.shutdownRequested) return null;

    // If a prompt is already queued, return it immediately
    if (this.promptQueue.length > 0) {
      return this.promptQueue.shift()!;
    }

    // Otherwise wait until Session.prompt resolves us
    return new Promise((resolve) => {
      this.promptResolver = () => {
        this.promptResolver = null;
        resolve(this.promptQueue.shift() ?? null);
      };
    });
  }

  /** Graceful shutdown. */
  public async shutdown(): Promise<void> {
    console.log("[Loop] Shutting down…");
    this.shutdownRequested = true;
    if (this.promptResolver) {
      this.promptResolver();
    }
    if (this.inferenceAbort) {
      this.inferenceAbort.abort();
    }
    await this.threadPool.terminateAll();
    await this.adp.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  EVENT LOOP TICK
  // ═══════════════════════════════════════════════════════════════════════════

  private async tick(): Promise<string> {
    this.running = true;
    this.iteration++;

    const iter = this.iteration;
    this.emit("tick.start", { iteration: iter });
    console.log(`\n${"═".repeat(60)}`);
    console.log(`  EVENT LOOP — iteration ${iter}`);
    console.log(`${"═".repeat(60)}`);

    // ── Phase 1: Timers ─────────────────────────────────────────────────────
    console.log(`[Phase 1/4] ⏱  Timers`);
    // (placeholder for TTL / cache-purge logic)

    // ── Phase 2: I/O Callbacks (drain macrotask queue) ──────────────────────
    console.log(`[Phase 2/4] 📥  I/O Callbacks — ${this.macrotaskQueue.length} macrotask(s)`);
    while (this.macrotaskQueue.length > 0) {
      const item = this.macrotaskQueue.shift()!;
      console.log(`           └─ ingesting result from "${item.source}"`);
      // Append tool results to context so the LLM can reason about them
      this.context.push({
        role: "user",
        content: `[Tool Result from "${item.source}"]: ${JSON.stringify(item.data)}`,
      });
    }

    // ── Phase 3: Inference (stream LLM) ─────────────────────────────────────
    console.log(`[Phase 3/4] 🧠  Inference`);
    let assistantText = "";

    try {
      this.inferenceAbort = new AbortController();
      const stream = this.llm.generateStream(this.context, this.inferenceAbort.signal);

      process.stdout.write("  Agent ▸ ");
      this.emit("inference.start", { iteration: iter });
      for await (const chunk of stream) {
        process.stdout.write(chunk);
        assistantText += chunk;
        this.emit("inference.chunk", { chunk });
      }
      process.stdout.write("\n");
      this.emit("inference.end", { text: assistantText });
    } catch (err: any) {
      if (err.name === "AbortError" || (err instanceof Error && err.message?.includes("aborted"))) {
        console.log("\n  ⚠️  Inference HALTED via ADP (AbortSignal fired)");
        assistantText = "[inference halted by operator]";
      } else {
        console.error("\n  ❌  Inference error:", (err as Error).message ?? err);
        assistantText = `[inference error: ${(err as Error).message}]`;
      }
    } finally {
      this.inferenceAbort = null;
    }

    this.context.push({ role: "assistant", content: assistantText });

    // ── Phase 4: Check (drain microtask queue) ──────────────────────────────
    console.log(`[Phase 4/4] 🔍  Check — ${this.microtaskQueue.length} microtask(s)`);
    while (this.microtaskQueue.length > 0) {
      const task = this.microtaskQueue.shift()!;
      console.log(`           └─ running "${task.name}"`);
      await task.fn();
    }

    // ── Pause gate (Metacognition.pause) ────────────────────────────────────
    if (this.paused) {
      console.log("[Loop] ⏸  Paused by ADP. Waiting for Metacognition.resume…");
      while (this.paused) {
        await sleep(300);
      }
      console.log("[Loop] ▶  Resumed");
    }

    this.running = false;
    this.emit("tick.end", { iteration: iter });
    return assistantText;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ADP WIRING
  // ═══════════════════════════════════════════════════════════════════════════

  private wireAdp() {
    // Inference.halt — abort the active LLM stream instantly
    this.adp.handle(AdpDomains.Inference.halt, (_params, cb) => {
      console.log("[ADP] 🛑  Inference.halt received");
      if (this.inferenceAbort) {
        this.inferenceAbort.abort();
        this.inferenceAbort = null;
        cb({ status: "halted" });
      } else {
        cb({ status: "no_active_inference" });
      }
    });

    // Inference.evaluate — inject a thought into context without queuing
    this.adp.handle(AdpDomains.Inference.evaluate, (params, cb) => {
      const expr = params?.expression ?? "";
      console.log(`[ADP] 💉  Inference.evaluate: "${expr}"`);
      this.context.push({ role: "user", content: `[ADP Injected]: ${expr}` });
      cb({ status: "injected", contextLength: this.context.length });
    });

    // Metacognition.pause / resume
    this.adp.handle(AdpDomains.Metacognition.pause, (_params, cb) => {
      console.log("[ADP] ⏸  Metacognition.pause");
      this.paused = true;
      cb({ status: "paused", iteration: this.iteration });
    });

    this.adp.handle(AdpDomains.Metacognition.resume, (_params, cb) => {
      console.log("[ADP] ▶  Metacognition.resume");
      this.paused = false;
      cb({ status: "resumed", iteration: this.iteration });
    });

    // Metacognition.getCallFrame — introspect the agent's live state
    this.adp.handle(AdpDomains.Metacognition.getCallFrame, (_params, cb) => {
      cb({
        iteration: this.iteration,
        running: this.running,
        paused: this.paused,
        contextLength: this.context.length,
        pendingMacrotasks: this.macrotaskQueue.length,
        pendingMicrotasks: this.microtaskQueue.length,
      });
    });

    // Memory.compact — summarize old context to free tokens
    this.adp.handle(AdpDomains.Memory.compact, (_params, cb) => {
      const before = this.context.length;
      // Naive compaction: keep system prompt + last 4 messages
      if (this.context.length > 6) {
        const system = this.context.filter((m) => m.role === "system");
        const recent = this.context.slice(-4);
        this.context = [...system, ...recent];
      }
      cb({ before, after: this.context.length });
    });

    // Session.prompt — enqueue a user prompt and wake the main loop
    this.adp.handle(AdpDomains.Session.prompt, (params, cb) => {
      const prompt = (params?.prompt as string) ?? "";
      if (!prompt) {
        cb({ status: "error", reason: "missing prompt" });
        return;
      }
      console.log(
        `[ADP] 📥  Session.prompt: "${prompt.slice(0, 80)}${prompt.length > 80 ? "..." : ""}"`,
      );
      this.promptQueue.push(prompt);
      if (this.promptResolver) {
        this.promptResolver();
      }
      cb({ status: "queued", queueLength: this.promptQueue.length });
    });

    // Session.shutdown — graceful shutdown
    this.adp.handle(AdpDomains.Session.shutdown, (_params, cb) => {
      console.log("[ADP] 🔌  Session.shutdown received");
      this.shutdownRequested = true;
      if (this.promptResolver) {
        this.promptResolver();
      }
      if (this.inferenceAbort) {
        this.inferenceAbort.abort();
      }
      cb({ status: "shutting_down" });
    });

    // Toolchain.list — enumerate registered tools
    this.adp.handle(AdpDomains.Toolchain.list, (_params, cb) => {
      cb({
        tools: [
          { name: "heavyComputation", description: "Run a heavy computation in a worker thread" },
          { name: "fileAnalysis", description: "Simulate reading and parsing a large file" },
        ],
      });
    });

    // Toolchain.intercept — manually trigger a tool dispatch
    this.adp.handle(AdpDomains.Toolchain.intercept, (params, cb) => {
      const toolName = params?.toolName as string;
      const args = (params?.args as Record<string, unknown>) ?? {};
      if (!toolName) {
        cb({ status: "error", reason: "missing toolName" });
        return;
      }
      console.log(`[ADP] 🔧  Toolchain.intercept: ${toolName}`);
      this.dispatchTool(toolName, args);
      cb({ status: "dispatched", toolName });
    });

    // Memory.queryNodes — return context entries as memory nodes
    this.adp.handle(AdpDomains.Memory.queryNodes, (params, cb) => {
      const query = (params?.query as string)?.toLowerCase() ?? "";
      const nodes = this.context
        .map((msg, idx) => ({
          id: idx,
          role: msg.role,
          preview:
            typeof msg.content === "string"
              ? msg.content.slice(0, 120)
              : JSON.stringify(msg.content).slice(0, 120),
        }))
        .filter((n) => !query || n.preview.toLowerCase().includes(query));
      cb({ count: nodes.length, nodes });
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private uid(): string {
    return Math.random().toString(36).slice(2, 10);
  }
}

/** Internal sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
