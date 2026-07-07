import { AdpServer, AdpDomains } from "@agentx/adp";
import type { AdpCommandHandler } from "@agentx/adp";
import { AgenticThreadPool } from "./AgenticThreadPool.js";
import { LLMOrchestrator } from "./LLMOrchestrator.js";
import { buildToolSet, type ToolDefinition } from "./tools.js";
import { AgentSession } from "./AgentSession.js";

/**
 * AgentEventLoopOptions
 * Configuration for the single-tenant agentx runtime.
 */
export interface AgentEventLoopOptions {
  /** Port for the ADP control plane (default: 9222) */
  adpPort?: number;
  /** Existing HTTP server to attach the ADP control plane WebSocket server to */
  adpServer?: any;
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
  /**
   * Silence all direct diagnostic output — the loop/phase/ADP `console` logs and
   * the streamed answer written to `process.stdout`. A host that renders via the
   * emitted events and owns the screen (e.g. a TUI built on OpenTUI/Ink) should
   * set this so raw writes don't land on top of its frame. Events are unaffected.
   * (default: false — preserves plain-CLI printing)
   */
  quiet?: boolean;
}

/**
 * AgentEventLoop — the single-tenant agentx runtime.
 *
 * It is a thin {@link AgentSession} that owns its own ADP control-plane server,
 * LLM orchestrator, and tool worker pool, and wires the ADP commands directly
 * to its (single) conversation. For serving many concurrent clients off one
 * shared server/LLM/pool, use {@link AgentSessionHost} instead.
 */
export class AgentEventLoop extends AgentSession {
  /** The ADP control-plane server instance. */
  public readonly adp: AdpServer;

  /**
   * Create a new AgentEventLoop.
   * @param opts - Configuration options.
   */
  constructor(opts: AgentEventLoopOptions = {}) {
    const adp = opts.adpServer
      ? new AdpServer({ server: opts.adpServer })
      : new AdpServer(opts.adpPort ?? 9222);
    const toolDefs = opts.tools ?? {};
    const toolSet = buildToolSet(toolDefs);
    const llm = new LLMOrchestrator({
      apiKey: opts.llmApiKey,
      baseURL: opts.llmBaseUrl,
      model: opts.llmModel,
    });
    const threadPool = new AgenticThreadPool(opts.threadPoolSize ?? 4, toolDefs);

    super({
      llm,
      threadPool,
      toolSet,
      toolDefs,
      // Single-tenant: every event goes to every connected observer.
      notify: (method, params) => adp.notify(method, params),
      systemPrompt: opts.systemPrompt,
      autoTick: opts.autoTick,
      quiet: opts.quiet,
    });

    this.adp = adp;
    this.wireAdp();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PUBLIC API (server-owning extras over AgentSession)
  // ═══════════════════════════════════════════════════════════════════════════

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
    this.adp.notify(method, params as any);
  }

  /** Graceful shutdown: stop the loop, drain workers, close the server. */
  public async shutdown(): Promise<void> {
    this.log("[Loop] Shutting down…");
    this.shutdownEngine();
    await this.threadPool.terminateAll();
    await this.adp.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ADP WIRING
  // ═══════════════════════════════════════════════════════════════════════════

  private wireAdp() {
    this.adp.handle(AdpDomains.Inference.halt, (_p, cb) => cb(this.halt()));
    this.adp.handle(AdpDomains.Inference.evaluate, (p, cb) =>
      cb(this.injectThought((p as any)?.expression ?? "")),
    );

    this.adp.handle(AdpDomains.Metacognition.pause, (_p, cb) => cb(this.pause()));
    this.adp.handle(AdpDomains.Metacognition.resume, (_p, cb) => cb(this.resume()));
    this.adp.handle(AdpDomains.Metacognition.getCallFrame, (_p, cb) => cb(this.getCallFrame()));

    this.adp.handle(AdpDomains.Memory.compact, (_p, cb) => cb(this.compact()));
    this.adp.handle(AdpDomains.Memory.queryNodes, (p, cb) =>
      cb(this.queryNodes((p as any)?.query ?? "")),
    );

    this.adp.handle(AdpDomains.Session.prompt, (p, cb) =>
      cb(this.enqueuePrompt((p as any)?.prompt ?? "")),
    );
    this.adp.handle(AdpDomains.Session.shutdown, (_p, cb) => cb(this.requestShutdown()));

    this.adp.handle(AdpDomains.Toolchain.list, (_p, cb) => cb(this.listTools()));
    this.adp.handle(AdpDomains.Toolchain.intercept, (p, cb) => cb(this.interceptTool(p as any)));
  }
}
