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
  /** Run that produced this result; null means manually intercepted/out-of-band. */
  runId: number | null;
  source: string;
  toolCallId: string;
  toolName: string;
  /** The full worker result; unwrapped into the tool-result message in Phase 2. */
  result: ToolResult;
}

/** Maximum inference→tool steps per run before the loop force-stops. */
const MAX_STEPS_PER_RUN = 12;

/**
 * RunStatus — the exactly-once terminal state published for every run.
 *
 * - `completed`: the LLM produced a terminal answer (no tool calls) and every
 *   in-flight tool result was drained.
 * - `halted`: the run stopped early (operator halt, shutdown, step cap, or it
 *   was superseded by a newer run).
 * - `failed`: inference threw a real error.
 */
export type RunStatus = "completed" | "halted" | "failed";

/** The exactly-once terminal record for a run. */
export interface RunTerminal {
  runId: number;
  status: RunStatus;
  reason: string;
}

/** Payload of the `run.end` event and `Session.runEnd` ADP notification. */
export interface RunTerminalEvent extends RunTerminal {}

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

  // ── Run lifecycle (exactly-once terminal state per run) ────────────────────
  /** Monotonic run sequence — every run() gets a fresh id. */
  protected runSequence = 0;
  /** Id of the run currently executing (null while the session is idle). */
  protected activeRunId: number | null = null;
  /** The most recently published terminal state (for introspection/debugging). */
  protected terminalState: RunTerminal | null = null;
  /** Why the active run was interrupted (halt/shutdown/supersede), if any. */
  protected interruptionReason: string | null = null;
  /** Assistant text of the last completed step of the active run. */
  protected runText = "";
  /** Run ids that have already published a terminal state (exactly-once guard). */
  protected settledRunIds = new Set<number>();
  /** Terminal state by run id until that run() promise observes it. */
  protected terminalByRun = new Map<number, RunTerminal>();
  /** Last assistant text by run id, so superseded waiters resolve with their own text. */
  protected runTextById = new Map<number, string>();
  /** In-flight tool calls by run id; the legacy total remains in pendingToolCalls. */
  protected pendingToolCallsByRun = new Map<number, number>();
  /** Runs that must halt after their already-dispatched tool results are drained. */
  protected stopAfterToolDrain = new Map<number, string>();
  /** Pause gates — paused ticks park here until resume/halt/shutdown wakes them. */
  protected pauseGateResolvers = new Set<() => void>();
  /** Tool-landing gates — run() waits here while in-flight results land. */
  protected toolLandingResolvers = new Set<() => void>();
  /** Tick-idle gates — used when a run is superseded during an active tick. */
  protected tickIdleResolvers = new Set<() => void>();

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
   * Push a user message and run the loop until the run settles.
   *
   * A "run" is one prompt plus every tool-bearing inference step it drives:
   * the promise resolves exactly once, when the run publishes a terminal state
   * (`completed` | `halted` | `failed` — see {@link RunTerminal}). The resolved
   * value is the agent's final assistant text. When a run is superseded by a
   * new run() call (or halted/shutdown), it resolves early with a `halted`
   * terminal rather than hanging.
   *
   * @param prompt - The user's input string.
   * @returns A promise resolving to the agent's final assistant response.
   */
  public async run(prompt: string): Promise<string> {
    // A previous run that never settled (still awaiting inference, tool results,
    // or a pause gate) must not leave its awaiter hanging. If its tick is still
    // executing, abort/wake it and wait until it parks before starting the next
    // run so no stale tick writes into the new prompt's context.
    if (this.activeRunId !== null && !this.isRunSettled(this.activeRunId)) {
      const previousRunId = this.activeRunId;
      this.interruptionReason = "superseded";
      if (this.inferenceAbort) {
        this.inferenceAbort.abort();
      } else {
        this.publishTerminal(previousRunId, "halted", "superseded");
      }
      this.paused = false;
      this.releaseToolLanding();
      this.releasePauseGate();
      await this.waitForTickIdle();
    }

    this.context.push({ role: "user", content: prompt });
    this.stepCount = 0;
    this.runSequence++;
    const runId = this.runSequence;
    this.activeRunId = runId;
    this.terminalState = null;
    this.interruptionReason = null;
    this.runText = "";
    this.runTextById.set(runId, "");
    this.emit("run.start", { runId });
    this.notify("Session.runStart", { runId });
    this.emit("session.input", { prompt });
    return this.runUntilSettled(runId);
  }

  /**
   * Dispatch a tool to the thread pool (fire-and-forget, non-blocking).
   * @param toolName - Name of the registered tool to execute.
   * @param input - Validated arguments for the tool implementation.
   * @param toolCallId - The LLM's tool-call id, threaded back to pair the result.
   */
  public dispatchTool(toolName: string, input: unknown, toolCallId: string): void {
    const id = this.uid();
    const runId = this.activeRunId;
    const args = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
    this.pendingToolCalls++;
    if (runId !== null) {
      this.pendingToolCallsByRun.set(runId, this.pendingToolCallsForRun(runId) + 1);
    }
    this.log(`[Loop] 🚀  Dispatching tool "${toolName}" (id=${id}) to thread pool`);

    // Fire and forget — the promise resolves asynchronously and pushes onto
    // the macrotask queue, exactly like libuv posts I/O completions. A rejected
    // execution is folded into a typed failed result so the landing gate always
    // fires and the run can still settle (exactly-once terminal state).
    void this.threadPool
      .execute({ id, toolCallId, toolName, args })
      .then((result) => {
        this.log(`[Loop] 📬  Tool "${toolName}" completed in ${result.durationMs}ms`);
        this.queueToolResult(runId, toolName, toolCallId, result);
        this.emit("tool.complete", { toolName, id, result });

        // Broadcast tool completion to this session's ADP observer(s)
        this.notify("Toolchain.responseReceived", { toolName, result });
      })
      .catch((err: unknown) => {
        this.logError(`[tool: "${toolName}" rejected:`, err);
        const result: ToolResult = {
          id,
          toolCallId,
          success: false,
          error: err instanceof Error ? err.message : String(err),
          durationMs: 0,
        };
        this.queueToolResult(runId, toolName, toolCallId, result);
        this.emit("tool.complete", { toolName, id, result });
        this.notify("Toolchain.responseReceived", { toolName, result });
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
    this.interruptionReason = "halted";
    this.paused = false;
    this.releasePauseGate();
    this.releaseToolLanding();

    if (this.inferenceAbort) {
      this.inferenceAbort.abort();
      return { status: "halted" };
    }

    if (this.activeRunId !== null && !this.isRunSettled(this.activeRunId)) {
      this.publishTerminal(this.activeRunId, "halted", "halted");
      return { status: "halted" };
    }

    this.interruptionReason = null;
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
    this.releasePauseGate();
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
    this.interruptionReason = "shutdown";
    this.paused = false;
    if (this.promptResolver) {
      this.promptResolver();
    }
    if (this.inferenceAbort) {
      this.inferenceAbort.abort();
    } else if (this.activeRunId !== null && !this.isRunSettled(this.activeRunId)) {
      this.publishTerminal(this.activeRunId, "halted", "shutdown");
    }
    this.releasePauseGate();
    this.releaseToolLanding();
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

  protected async tick(runId: number | null = this.activeRunId): Promise<string> {
    if (this.running) {
      await this.waitForTickIdle();
    }
    if (runId !== null && (!this.isRunActive(runId) || this.isRunSettled(runId))) {
      return this.getRunText(runId);
    }

    this.running = true;
    this.iteration++;

    const iter = this.iteration;
    let tickEnded = false;
    let assistantText = "";
    let terminalCandidate: { status: RunStatus; reason: string } | null = null;

    const finishTick = () => {
      if (tickEnded) return;
      this.running = false;
      tickEnded = true;
      this.emit("tick.end", { iteration: iter });
      this.releaseTickIdle();
    };

    try {
      this.emit("tick.start", { iteration: iter });
      this.log(`\n${"═".repeat(60)}`);
      this.log(`  EVENT LOOP — iteration ${iter}`);
      this.log(`${"═".repeat(60)}`);

      // ── Phase 1: Timers ───────────────────────────────────────────────────
      this.log(`[Phase 1/4] ⏱  Timers`);
      // (placeholder for TTL / cache-purge logic)

      // ── Phase 2: I/O Callbacks (drain macrotask queue) ────────────────────
      this.log(`[Phase 2/4] 📥  I/O Callbacks — ${this.macrotaskQueue.length} macrotask(s)`);
      while (this.macrotaskQueue.length > 0) {
        const item = this.macrotaskQueue.shift()!;
        if (!this.shouldIngestMacrotask(item, runId)) {
          this.log(`           └─ discarding stale result from "${item.source}"`);
          continue;
        }

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

      // ── Phase 3: Inference (native-tools step) ────────────────────────────
      const stopAfterDrainReason = runId === null ? undefined : this.stopAfterToolDrain.get(runId);
      if (stopAfterDrainReason && this.pendingToolCallsForRun(runId!) === 0) {
        this.log(`[Phase 3/4] 🧠  Inference skipped — run halted (${stopAfterDrainReason})`);
        terminalCandidate = { status: "halted", reason: stopAfterDrainReason };
      } else if (this.shutdownRequested) {
        this.log(`[Phase 3/4] 🧠  Inference skipped — shutdown requested`);
        terminalCandidate = { status: "halted", reason: "shutdown" };
      } else if (this.interruptionReason !== null) {
        this.log(`[Phase 3/4] 🧠  Inference skipped — run halted (${this.interruptionReason})`);
        terminalCandidate = { status: "halted", reason: this.interruptionReason };
      } else {
        this.log(`[Phase 3/4] 🧠  Inference`);
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

          assistantText = result.text;
          this.setRunText(runId, result.text);

          // Record the assistant turn verbatim — this carries the tool_calls
          // correctly (replacing the old assistant-as-string push).
          this.context.push(...result.responseMessages);
          this.emit("inference.end", { text: result.text });

          // Self-dispatch each requested tool call to the worker pool.
          for (const call of result.toolCalls) {
            this.dispatchTool(call.toolName, call.input, call.toolCallId);
          }

          if (result.toolCalls.length === 0) {
            this.log(`[Loop] ✅  Terminal answer (no tool calls) — run complete`);
            terminalCandidate = { status: "completed", reason: "no_tool_calls" };
          } else if (this.stepCount >= MAX_STEPS_PER_RUN && runId !== null) {
            this.log(`[Loop] 🛑  Step cap (${MAX_STEPS_PER_RUN}) reached — draining tools then halting`);
            this.stopAfterToolDrain.set(runId, "step_cap");
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          const isAbort =
            err instanceof Error &&
            (err.name === "AbortError" || message.toLowerCase().includes("aborted"));

          if (isAbort) {
            const reason = this.shutdownRequested ? "shutdown" : this.interruptionReason ?? "halted";
            this.log("\n  ⚠️  Inference HALTED via ADP (AbortSignal fired)");
            assistantText = "[inference halted by operator]";
            this.context.push({ role: "assistant", content: assistantText });
            this.setRunText(runId, assistantText);
            this.emit("inference.end", { text: assistantText });
            terminalCandidate = { status: "halted", reason };
          } else {
            this.logError("\n  ❌  Inference error:", message);
            assistantText = `[inference error: ${message}]`;
            this.context.push({ role: "assistant", content: assistantText });
            this.setRunText(runId, assistantText);
            this.emit("inference.end", { text: assistantText });
            terminalCandidate = { status: "failed", reason: message };
          }
        } finally {
          this.inferenceAbort = null;
        }
      }

      // ── Phase 4: Check (drain microtask queue) ────────────────────────────
      this.log(`[Phase 4/4] 🔍  Check — ${this.microtaskQueue.length} microtask(s)`);
      while (this.microtaskQueue.length > 0) {
        const task = this.microtaskQueue.shift()!;
        this.log(`           └─ running "${task.name}"`);
        await task.fn();
      }

      // ── Pause gate (Metacognition.pause) ──────────────────────────────────
      if (this.paused) {
        this.log("[Loop] ⏸  Paused by ADP. Waiting for Metacognition.resume…");
        await this.waitWhilePaused(runId);
        if (!this.paused) {
          this.log("[Loop] ▶  Resumed");
        }
      }

      if (runId !== null && this.isRunActive(runId)) {
        if (this.shutdownRequested) {
          this.publishTerminal(runId, "halted", "shutdown");
        } else if (this.interruptionReason !== null) {
          this.publishTerminal(runId, "halted", this.interruptionReason);
        } else if (terminalCandidate) {
          this.publishTerminal(runId, terminalCandidate.status, terminalCandidate.reason);
        }
      }

      finishTick();
      return assistantText || this.getRunText(runId);
    } finally {
      finishTick();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async runUntilSettled(runId: number): Promise<string> {
    while (!this.isRunSettled(runId)) {
      // Preserve native tool-call history: never re-infer with only a partial
      // subset of a turn's tool results. Wait until every in-flight call for
      // this run lands, then tick once to drain all queued results together.
      if (this.pendingToolCallsForRun(runId) > 0) {
        await this.waitForToolLanding(runId);
        continue;
      }

      await this.tick(runId);

      if (this.isRunSettled(runId) || !this.isRunActive(runId)) {
        break;
      }

      if (this.shutdownRequested) {
        this.publishTerminal(runId, "halted", "shutdown");
        break;
      }

      if (this.pendingToolCallsForRun(runId) > 0) {
        await this.waitForToolLanding(runId);
        continue;
      }

      if (this.hasMacrotasksForRun(runId) || this.stopAfterToolDrain.has(runId)) {
        continue;
      }

      // Defensive fallback for an otherwise idle run. Normal completion/failure
      // is published by tick(), but this keeps callers from hanging if a future
      // branch forgets to set a terminal candidate.
      this.publishTerminal(runId, "completed", "idle");
    }

    const text = this.getRunText(runId);
    this.terminalByRun.delete(runId);
    this.runTextById.delete(runId);
    this.pendingToolCallsByRun.delete(runId);
    this.stopAfterToolDrain.delete(runId);
    return text;
  }

  private publishTerminal(runId: number, status: RunStatus, reason: string): RunTerminal {
    const existing = this.terminalByRun.get(runId);
    if (this.settledRunIds.has(runId)) {
      return existing ?? { runId, status, reason };
    }

    const terminal: RunTerminal = { runId, status, reason };
    this.settledRunIds.add(runId);
    this.terminalByRun.set(runId, terminal);
    this.terminalState = terminal;
    if (this.activeRunId === runId) {
      this.activeRunId = null;
    }
    this.stopAfterToolDrain.delete(runId);
    this.emit("run.end", terminal);
    this.notify("Session.runEnd", { ...terminal });
    this.releaseToolLanding();
    this.releasePauseGate();
    return terminal;
  }

  private isRunSettled(runId: number): boolean {
    return this.settledRunIds.has(runId);
  }

  private isRunActive(runId: number): boolean {
    return this.activeRunId === runId && !this.isRunSettled(runId);
  }

  private getRunText(runId: number | null): string {
    if (runId === null) return this.runText;
    return this.runTextById.get(runId) ?? this.runText;
  }

  private setRunText(runId: number | null, text: string): void {
    if (runId !== null) {
      this.runTextById.set(runId, text);
    }
    if (runId === null || this.activeRunId === runId) {
      this.runText = text;
    }
  }

  private pendingToolCallsForRun(runId: number): number {
    return this.pendingToolCallsByRun.get(runId) ?? 0;
  }

  private finishToolCall(runId: number | null): void {
    this.pendingToolCalls = Math.max(0, this.pendingToolCalls - 1);
    if (runId !== null) {
      const remaining = Math.max(0, this.pendingToolCallsForRun(runId) - 1);
      if (remaining === 0) {
        this.pendingToolCallsByRun.delete(runId);
      } else {
        this.pendingToolCallsByRun.set(runId, remaining);
      }
    }
    this.releaseToolLanding();
  }

  private queueToolResult(
    runId: number | null,
    toolName: string,
    toolCallId: string,
    result: ToolResult,
  ): void {
    if (runId === null || this.isRunActive(runId)) {
      this.macrotaskQueue.push({ runId, source: toolName, toolCallId, toolName, result });
    } else {
      this.log(`[Loop] 🧹  Dropping stale result from "${toolName}" for run ${runId}`);
    }
    this.finishToolCall(runId);

    // Legacy out-of-band intercepts (no active run) can still auto-drain when a
    // host opts into autoTick. Active runs are advanced by runUntilSettled().
    if (
      runId === null &&
      this.autoTick &&
      !this.running &&
      !this.shutdownRequested &&
      this.pendingToolCalls === 0 &&
      this.macrotaskQueue.length > 0
    ) {
      void this.tick(null);
    }
  }

  private shouldIngestMacrotask(item: MacrotaskItem, runId: number | null): boolean {
    if (item.runId === null) return true;
    return runId === item.runId && this.isRunActive(item.runId);
  }

  private hasMacrotasksForRun(runId: number): boolean {
    return this.macrotaskQueue.some((item) => item.runId === null || item.runId === runId);
  }

  private async waitForToolLanding(runId: number): Promise<void> {
    if (this.isRunSettled(runId) || this.pendingToolCallsForRun(runId) === 0) return;
    await new Promise<void>((resolve) => {
      this.toolLandingResolvers.add(resolve);
    });
  }

  private releaseToolLanding(): void {
    const resolvers = [...this.toolLandingResolvers];
    this.toolLandingResolvers.clear();
    for (const resolve of resolvers) resolve();
  }

  private async waitWhilePaused(runId: number | null): Promise<void> {
    while (
      this.paused &&
      !this.shutdownRequested &&
      this.interruptionReason === null &&
      (runId === null || this.isRunActive(runId))
    ) {
      await new Promise<void>((resolve) => {
        this.pauseGateResolvers.add(resolve);
      });
    }
  }

  private releasePauseGate(): void {
    const resolvers = [...this.pauseGateResolvers];
    this.pauseGateResolvers.clear();
    for (const resolve of resolvers) resolve();
  }

  private async waitForTickIdle(): Promise<void> {
    if (!this.running) return;
    await new Promise<void>((resolve) => {
      this.tickIdleResolvers.add(resolve);
    });
  }

  private releaseTickIdle(): void {
    const resolvers = [...this.tickIdleResolvers];
    this.tickIdleResolvers.clear();
    for (const resolve of resolvers) resolve();
  }

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
