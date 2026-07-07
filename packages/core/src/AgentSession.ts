import type { AgenticThreadPool, ToolResult } from "./AgenticThreadPool.js";
import type { LLMOrchestrator } from "./LLMOrchestrator.js";
import type { ToolDefinition } from "./tools.js";
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

/** A function that pushes an ADP event to this session's observer(s). */
export type SessionNotifier = (method: string, params?: Record<string, unknown>) => void;

/**
 * AgentSessionOptions
 * Configuration for a single conversation. Infrastructure (LLM, thread pool,
 * tool set) is INJECTED so many sessions can share one process — only the
 * conversation state (context, queues, prompt loop) is per-session.
 */
export interface AgentSessionOptions {
  /** Shared LLM orchestrator. */
  llm: LLMOrchestrator;
  /** Shared tool worker pool. */
  threadPool: AgenticThreadPool;
  /** AI SDK ToolSet advertised to the model on every step. */
  toolSet: ToolSet;
  /** Registry of tool definitions (name → definition). */
  toolDefs: Record<string, ToolDefinition>;
  /**
   * Push an ADP event scoped to this session's client. A single-tenant host
   * broadcasts; a multi-tenant host routes to the originating connection.
   */
  notify?: SessionNotifier;
  /** Initial system prompt for the agent. */
  systemPrompt?: string;
  /** Automatically run tick when async tasks complete (default: false). */
  autoTick?: boolean;
  /** Silence direct diagnostic output so a host can own the screen. */
  quiet?: boolean;
}

/**
 * AgentSession — one conversation on the agentx runtime.
 *
 * It models the Node.js event-loop phases mapped onto agent semantics:
 *
 *   Phase 1 · Timers       — TTL expiration, cache purge, scheduled checks
 *   Phase 2 · I/O Callbacks— drain macrotask queue (tool results from workers)
 *   Phase 3 · Inference    — stream tokens from the LLM (analogous to Poll)
 *   Phase 4 · Check        — exhaust microtask queue (guardrails, validators)
 *
 * It holds NO server: the LLM, thread pool, and tool set are injected, and ADP
 * events go out through the injected `notify`. This is what lets a host run one
 * session per connection while sharing all the heavy infrastructure.
 */
export class AgentSession extends EventEmitter {
  // ── Shared infrastructure (injected) ────────────────────────────────────────
  protected llm: LLMOrchestrator;
  protected threadPool: AgenticThreadPool;
  protected toolSet: ToolSet;
  protected toolDefs: Record<string, ToolDefinition>;
  protected notifier: SessionNotifier;

  // ── Queues ────────────────────────────────────────────────────────────────
  protected microtaskQueue: Microtask[] = [];
  protected macrotaskQueue: MacrotaskItem[] = [];

  // ── State ─────────────────────────────────────────────────────────────────
  protected context: ModelMessage[] = [];
  protected inferenceAbort: AbortController | null = null;
  protected paused = false;
  protected running = false;
  protected iteration = 0;
  protected stepCount = 0;
  /** Tool calls dispatched but not yet completed for the current turn (barrier). */
  protected pendingToolCalls = 0;
  protected promptQueue: string[] = [];
  protected promptResolver: (() => void) | null = null;
  protected shutdownRequested = false;
  protected autoTick = false;
  protected quiet = false;

  /**
   * Create a new conversation session.
   * @param opts - Injected infrastructure + per-session configuration.
   */
  constructor(opts: AgentSessionOptions) {
    super();
    this.llm = opts.llm;
    this.threadPool = opts.threadPool;
    this.toolSet = opts.toolSet;
    this.toolDefs = opts.toolDefs;
    this.notifier = opts.notify ?? (() => {});
    this.autoTick = opts.autoTick ?? false;
    this.quiet = opts.quiet ?? false;

    if (opts.systemPrompt) {
      this.context.push({ role: "system", content: opts.systemPrompt });
    }
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
    this.log(`[Loop] 🚀  Dispatching tool "${toolName}" (id=${id}) to thread pool`);

    // Fire and forget — the promise resolves asynchronously and pushes onto
    // the macrotask queue, exactly like libuv posts I/O completions.
    void this.threadPool.execute({ id, toolCallId, toolName, args }).then((result) => {
      this.log(`[Loop] 📬  Tool "${toolName}" completed in ${result.durationMs}ms`);
      this.macrotaskQueue.push({ source: toolName, toolCallId, toolName, result });
      this.pendingToolCalls--;
      this.emit("tool.complete", { toolName, id, result });

      // Broadcast tool completion to this session's ADP observer(s)
      this.notify("Toolchain.responseReceived", { toolName, result });

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

  /** Emit an event to this session's ADP observer(s). */
  public notify(method: string, params?: Record<string, unknown>): void {
    this.notifier(method, params);
  }

  /**
   * Wait for the next prompt enqueued via {@link enqueuePrompt}.
   * @returns The next prompt string or null if shutting down.
   */
  public async waitForPrompt(): Promise<string | null> {
    if (this.shutdownRequested) return null;

    // If a prompt is already queued, return it immediately
    if (this.promptQueue.length > 0) {
      return this.promptQueue.shift()!;
    }

    // Otherwise wait until enqueuePrompt resolves us
    return new Promise((resolve) => {
      this.promptResolver = () => {
        this.promptResolver = null;
        resolve(this.promptQueue.shift() ?? null);
      };
    });
  }

  // ── ADP operations (wired to the control plane by the owner) ───────────────

  /** Enqueue a user prompt and wake the prompt loop (Session.prompt). */
  public enqueuePrompt(prompt: string): { status: string; queueLength?: number; reason?: string } {
    if (!prompt) {
      return { status: "error", reason: "missing prompt" };
    }
    this.log(`[ADP] 📥  prompt: "${prompt.slice(0, 80)}${prompt.length > 80 ? "..." : ""}"`);
    this.promptQueue.push(prompt);
    if (this.promptResolver) {
      this.promptResolver();
    }
    return { status: "queued", queueLength: this.promptQueue.length };
  }

  /** Abort the active LLM stream instantly (Inference.halt). */
  public halt(): { status: string } {
    this.log("[ADP] 🛑  halt");
    if (this.inferenceAbort) {
      this.inferenceAbort.abort();
      this.inferenceAbort = null;
      return { status: "halted" };
    }
    return { status: "no_active_inference" };
  }

  /** Inject a thought into context without queuing (Inference.evaluate). */
  public injectThought(expression: unknown): { status: string; contextLength: number } {
    this.context.push({ role: "user", content: `[ADP Injected]: ${JSON.stringify(expression)}` });
    return { status: "injected", contextLength: this.context.length };
  }

  /** Pause the loop (Metacognition.pause). */
  public pause(): { status: string; iteration: number } {
    this.paused = true;
    return { status: "paused", iteration: this.iteration };
  }

  /** Resume the loop (Metacognition.resume). */
  public resume(): { status: string; iteration: number } {
    this.paused = false;
    return { status: "resumed", iteration: this.iteration };
  }

  /** Introspect the session's live state (Metacognition.getCallFrame). */
  public getCallFrame(): Record<string, unknown> {
    return {
      iteration: this.iteration,
      running: this.running,
      paused: this.paused,
      contextLength: this.context.length,
      pendingMacrotasks: this.macrotaskQueue.length,
      pendingMicrotasks: this.microtaskQueue.length,
    };
  }

  /** Summarize old context to free tokens (Memory.compact). */
  public compact(): { before: number; after: number } {
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
    return { before, after: this.context.length };
  }

  /** Return context entries matching a query (Memory.queryNodes). */
  public queryNodes(query: string): { count: number; nodes: unknown[] } {
    const q = query?.toLowerCase() ?? "";
    const nodes = this.context
      .map((msg, idx) => ({
        id: idx,
        role: msg.role,
        preview:
          typeof msg.content === "string"
            ? msg.content.slice(0, 120)
            : JSON.stringify(msg.content).slice(0, 120),
      }))
      .filter((n) => !q || n.preview.toLowerCase().includes(q));
    return { count: nodes.length, nodes };
  }

  /** Enumerate the actually-registered tools (Toolchain.list). */
  public listTools(): { tools: { name: string; description: string }[] } {
    return {
      tools: Object.values(this.toolDefs).map((d) => ({
        name: d.name,
        description: d.description,
      })),
    };
  }

  /** Manually trigger a tool dispatch (Toolchain.intercept). */
  public interceptTool(params: { toolName?: string; args?: Record<string, unknown> } | undefined): {
    status: string;
    toolName?: string;
    toolCallId?: string;
    reason?: string;
  } {
    const toolName = params?.toolName;
    const args = params?.args ?? {};
    if (!toolName) {
      return { status: "error", reason: "missing toolName" };
    }
    this.log(`[ADP] 🔧  intercept: ${toolName}`);
    const toolCallId = `intercept_${this.uid()}`;
    this.dispatchTool(toolName, args, toolCallId);
    return { status: "dispatched", toolName, toolCallId };
  }

  /** Request a graceful stop: wake the prompt loop and abort inference (Session.shutdown). */
  public requestShutdown(): { status: string } {
    this.shutdownRequested = true;
    if (this.promptResolver) {
      this.promptResolver();
    }
    if (this.inferenceAbort) {
      this.inferenceAbort.abort();
    }
    return { status: "shutting_down" };
  }

  /**
   * Tear down this session's conversation loop WITHOUT touching shared
   * infrastructure. The owner is responsible for the thread pool / server.
   */
  public shutdownEngine(): void {
    this.requestShutdown();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  EVENT LOOP TICK
  // ═══════════════════════════════════════════════════════════════════════════

  protected async tick(): Promise<string> {
    this.running = true;
    this.iteration++;

    const iter = this.iteration;
    this.emit("tick.start", { iteration: iter });
    this.log(`\n${"═".repeat(60)}`);
    this.log(`  EVENT LOOP — iteration ${iter}`);
    this.log(`${"═".repeat(60)}`);

    // ── Phase 1: Timers ─────────────────────────────────────────────────────
    this.log(`[Phase 1/4] ⏱  Timers`);
    // (placeholder for TTL / cache-purge logic)

    // ── Phase 2: I/O Callbacks (drain macrotask queue) ──────────────────────
    this.log(`[Phase 2/4] 📥  I/O Callbacks — ${this.macrotaskQueue.length} macrotask(s)`);
    while (this.macrotaskQueue.length > 0) {
      const item = this.macrotaskQueue.shift()!;
      const r = item.result;
      this.log(`           └─ ingesting result from "${item.source}"`);
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
    this.log(`[Phase 3/4] 🧠  Inference`);
    let assistantText = "";
    this.stepCount++;

    try {
      this.inferenceAbort = new AbortController();

      this.write("  Agent ▸ ");
      this.emit("inference.start", { iteration: iter });

      const result = await this.llm.runStep(
        this.context,
        this.toolSet,
        this.inferenceAbort.signal,
        undefined,
        (chunk) => {
          this.write(chunk);
          assistantText += chunk;
          this.emit("inference.chunk", { chunk });
        },
      );
      this.write("\n");

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
        this.log(`[Loop] ✅  Terminal answer (no tool calls) — run complete`);
      } else if (this.stepCount >= MAX_STEPS_PER_RUN) {
        this.log(`[Loop] 🛑  Step cap (${MAX_STEPS_PER_RUN}) reached — no further inference`);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || (err instanceof Error && err.message?.includes("aborted"))) {
        this.log("\n  ⚠️  Inference HALTED via ADP (AbortSignal fired)");
        assistantText = "[inference halted by operator]";
        this.context.push({ role: "assistant", content: assistantText });
        this.emit("inference.end", { text: assistantText });
      } else {
        this.logError("\n  ❌  Inference error:", (err as Error).message ?? err);
        assistantText = `[inference error: ${(err as Error).message}]`;
        this.context.push({ role: "assistant", content: assistantText });
        this.emit("inference.end", { text: assistantText });
      }
    } finally {
      this.inferenceAbort = null;
    }

    // ── Phase 4: Check (drain microtask queue) ──────────────────────────────
    this.log(`[Phase 4/4] 🔍  Check — ${this.microtaskQueue.length} microtask(s)`);
    while (this.microtaskQueue.length > 0) {
      const task = this.microtaskQueue.shift()!;
      this.log(`           └─ running "${task.name}"`);
      await task.fn();
    }

    // ── Pause gate (Metacognition.pause) ────────────────────────────────────
    if (this.paused) {
      this.log("[Loop] ⏸  Paused by ADP. Waiting for Metacognition.resume…");
      while (this.paused) {
        await sleep(300);
      }
      this.log("[Loop] ▶  Resumed");
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

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Diagnostic log — gated by `quiet` so a TUI host can stay frame-clean. */
  protected log(...args: unknown[]): void {
    if (!this.quiet) console.log(...args);
  }

  /** Diagnostic error log — gated by `quiet`. */
  protected logError(...args: unknown[]): void {
    if (!this.quiet) console.error(...args);
  }

  /** Raw stdout write (streamed answer) — gated by `quiet`. */
  protected write(text: string): void {
    if (!this.quiet) process.stdout.write(text);
  }

  protected uid(): string {
    return Math.random().toString(36).slice(2, 10);
  }
}

/** Internal sleep helper */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
