import { AdpServer, AdpDomains, type AdpCommandHandler } from "@agentx/adp";
import { AgenticThreadPool, type ToolResult } from "./AgenticThreadPool.js";
import { LLMOrchestrator } from "./LLMOrchestrator.js";
import { buildToolSet, type ToolDefinition } from "./tools.js";
import type { ModelMessage, ToolSet } from "ai";
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
 * Internal queue item for tool results. Carries the tool-call id + name so the
 * result can be recorded as a paired `tool` message in context.
 */
interface MacrotaskItem {
  source: string;
  toolCallId: string;
  toolName: string;
  /** The full worker result; unwrapped into the tool-result message in Phase 2. */
  result: ToolResult;
}

/** Maximum inference→tool steps per run before the loop force-stops. */
const MAX_STEPS_PER_RUN = 12;

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
  /** Registry of tool definitions (advertised natively + executed in workers) */
  tools?: Record<string, ToolDefinition>;
  /** Automatically run tick when async tasks complete or new ones are scheduled (default: false) */
  autoTick?: boolean;
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

  // ── Tools ─────────────────────────────────────────────────────────────────
  /** Registry of tool definitions (name → definition). */
  private toolDefs: Record<string, ToolDefinition>;
  /** AI SDK ToolSet advertised to the model on every step. */
  private toolSet: ToolSet;

  // ── Queues ────────────────────────────────────────────────────────────────
  private microtaskQueue: Microtask[] = [];
  private macrotaskQueue: MacrotaskItem[] = [];

  // ── State ─────────────────────────────────────────────────────────────────
  private context: ModelMessage[] = [];
  private inferenceAbort: AbortController | null = null;
  private paused = false;
  private running = false;
  private iteration = 0;
  private stepCount = 0;
  /** Tool calls dispatched but not yet completed for the current turn (barrier). */
  private pendingToolCalls = 0;
  private promptQueue: string[] = [];
  private promptResolver: (() => void) | null = null;
  private shutdownRequested = false;
  private autoTick = false;

  /**
   * Create a new AgentEventLoop.
   * @param opts - Configuration options.
   */
  constructor(opts: AgentEventLoopOptions = {}) {
    super();
    this.autoTick = opts.autoTick ?? false;
    const adpPort = opts.adpPort ?? 9222;
    this.adp = new AdpServer(adpPort);
    this.toolDefs = opts.tools ?? {};
    this.toolSet = buildToolSet(this.toolDefs);
    this.threadPool = new AgenticThreadPool(opts.threadPoolSize ?? 4, this.toolDefs);
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
    this.stepCount = 0;
    this.emit("session.input", { prompt });
    return this.tick();
  }

  /**
   * Dispatch a tool to the thread pool (fire-and-forget, non-blocking).
   * @param toolName - Name of the registered tool to execute.
   * @param input - Validated arguments for the tool implementation.
   * @param toolCallId - The LLM's tool-call id, threaded back to pair the result.
   */
  public dispatchTool(toolName: string, input: unknown, toolCallId: string): void {
    const id = this.uid();
    const args = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    this.pendingToolCalls++;
    console.log(`[Loop] 🚀  Dispatching tool "${toolName}" (id=${id}) to thread pool`);

    // Fire and forget — the promise resolves asynchronously and pushes onto
    // the macrotask queue, exactly like libuv posts I/O completions.
    void this.threadPool.execute({ id, toolCallId, toolName, args }).then((result) => {
      console.log(`[Loop] 📬  Tool "${toolName}" completed in ${result.durationMs}ms`);
      this.macrotaskQueue.push({ source: toolName, toolCallId, toolName, result });
      this.pendingToolCalls--;
      this.emit("tool.complete", { toolName, id, result });

      // Broadcast tool completion to any ADP observers
      this.adp.notify("Toolchain.responseReceived", { toolName, result });

      // Barrier: only re-infer once EVERY tool call from this turn has completed.
      // Re-inferring after a partial set would hand the model an assistant turn
      // bearing N tool_calls but fewer than N tool-results — invalid history that
      // breaks the Anthropic/messages (qwen) family in particular.
      if (
        this.autoTick &&
        !this.running &&
        !this.shutdownRequested &&
        this.pendingToolCalls === 0 &&
        this.stepCount < MAX_STEPS_PER_RUN
      ) {
        void this.tick();
      }
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
    handler: AdpCommandHandler<P, R>,
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
      const r = item.result;
      console.log(`           └─ ingesting result from "${item.source}"`);
      // Record the worker result as a proper tool-result message, paired to the
      // assistant tool_call by toolCallId, so native tool calling stays valid.
      // Unwrap the ToolResult: the model sees the tool's actual return value (or
      // a typed error), never the internal {id,success,durationMs,…} envelope.
      this.context.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: item.toolCallId,
            toolName: item.toolName,
            output: r.success
              ? { type: "json", value: (r.data ?? null) as any }
              : { type: "error-text", value: r.error ?? "tool execution failed" },
          },
        ],
      });
    }

    // ── Phase 3: Inference (native-tools step) ──────────────────────────────
    console.log(`[Phase 3/4] 🧠  Inference`);
    let assistantText = "";
    this.stepCount++;

    try {
      this.inferenceAbort = new AbortController();

      process.stdout.write("  Agent ▸ ");
      this.emit("inference.start", { iteration: iter });

      const result = await this.llm.runStep(
        this.context,
        this.toolSet,
        this.inferenceAbort.signal,
        undefined,
        (chunk) => {
          process.stdout.write(chunk);
          assistantText += chunk;
          this.emit("inference.chunk", { chunk });
        },
      );
      process.stdout.write("\n");

      // Record the assistant turn verbatim — this carries the tool_calls
      // correctly (replacing the old assistant-as-string push).
      this.context.push(...result.responseMessages);
      this.emit("inference.end", { text: result.text });

      // Self-dispatch each requested tool call to the worker pool.
      for (const call of result.toolCalls) {
        this.dispatchTool(call.toolName, call.input, call.toolCallId);
      }

      // Terminal answer (no tool calls) or step cap reached → stop the run.
      // The step-cap halt is enforced by the `stepCount < MAX_STEPS_PER_RUN`
      // guard on every re-tick trigger, so tool results still get recorded
      // (keeping history valid) — we simply stop inferring further.
      if (result.toolCalls.length === 0) {
        console.log(`[Loop] ✅  Terminal answer (no tool calls) — run complete`);
      } else if (this.stepCount >= MAX_STEPS_PER_RUN) {
        console.log(`[Loop] 🛑  Step cap (${MAX_STEPS_PER_RUN}) reached — no further inference`);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || (err instanceof Error && err.message?.includes("aborted"))) {
        console.log("\n  ⚠️  Inference HALTED via ADP (AbortSignal fired)");
        assistantText = "[inference halted by operator]";
        this.context.push({ role: "assistant", content: assistantText });
      } else {
        console.error("\n  ❌  Inference error:", (err as Error).message ?? err);
        assistantText = `[inference error: ${(err as Error).message}]`;
        this.context.push({ role: "assistant", content: assistantText });
      }
    } finally {
      this.inferenceAbort = null;
    }

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

    // Schedule a new tick only when results are pending AND every dispatched
    // tool of the turn has landed (barrier) AND we're under the step cap.
    if (
      this.macrotaskQueue.length > 0 &&
      this.pendingToolCalls === 0 &&
      this.stepCount < MAX_STEPS_PER_RUN &&
      !this.shutdownRequested
    ) {
      setImmediate(() => {
        if (!this.running) {
          void this.tick();
        }
      });
    }

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
      console.log(`[ADP] 💉  Inference.evaluate: "${JSON.stringify(expr)}"`);
      this.context.push({ role: "user", content: `[ADP Injected]: ${JSON.stringify(expr)}` });
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
      // Keep system prompt + a recent window, but never start the window on a
      // `tool` message — that would orphan a tool-result from its tool_call
      // turn and break native tool calling.
      if (this.context.length > 6) {
        const system = this.context.filter((m) => m.role === "system");
        let start = this.context.length - 4;
        while (start > 0 && this.context[start]?.role === "tool") {
          start--;
        }
        const recent = this.context.slice(start).filter((m) => m.role !== "system");
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

    // Toolchain.list — enumerate the actually-registered tools
    this.adp.handle(AdpDomains.Toolchain.list, (_params, cb) => {
      cb({
        tools: Object.values(this.toolDefs).map((d) => ({
          name: d.name,
          description: d.description,
        })),
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
      const toolCallId = `intercept_${this.uid()}`;
      this.dispatchTool(toolName, args, toolCallId);
      cb({ status: "dispatched", toolName, toolCallId });
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
