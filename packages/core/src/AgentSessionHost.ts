import { AdpServer, AdpDomains } from "@agentx/adp";
import { AgenticThreadPool } from "./AgenticThreadPool.js";
import { LLMOrchestrator } from "./LLMOrchestrator.js";
import { buildToolSet, type ToolDefinition } from "./tools.js";
import { AgentSession } from "./AgentSession.js";
import type { ToolSet } from "ai";

/**
 * AgentSessionHostOptions
 * Configuration for a multi-tenant agent host.
 */
export interface AgentSessionHostOptions {
  /** Port for the ADP control plane (default: 9222). */
  adpPort?: number;
  /** Existing HTTP server to attach the ADP control plane WebSocket server to. */
  adpServer?: any;
  /** LLM API Key. */
  llmApiKey?: string;
  /** LLM Base URL. */
  llmBaseUrl?: string;
  /** LLM Model identifier. */
  llmModel?: string;
  /** Number of worker threads for tools, shared across all sessions (default: 4). */
  threadPoolSize?: number;
  /** Initial system prompt applied to every new session. */
  systemPrompt?: string;
  /** Registry of tool definitions (advertised natively + executed in workers). */
  tools?: Record<string, ToolDefinition>;
  /** Automatically run tick when async tasks complete (default: true). */
  autoTick?: boolean;
  /** Silence direct diagnostic output (default: false). */
  quiet?: boolean;
}

/** Context handed to an app command handler — scoped to the calling client. */
export interface SessionCommandContext {
  /** The id of the session/connection that issued the command. */
  sessionId: string;
  /** That session's agent (undefined only if the connection has already gone). */
  session: AgentSession | undefined;
  /** Send the JSON-RPC result back to the caller. */
  reply: (result: unknown) => void;
  /** Push an ADP event to this caller only. */
  notify: (method: string, params?: Record<string, unknown>) => void;
}

/** An app-specific ADP command, scoped to the session that sent it. */
export type SessionCommandHandler = (
  params: Record<string, unknown> | undefined,
  ctx: SessionCommandContext,
) => void;

/**
 * AgentSessionHost — serve many concurrent clients from one process.
 *
 * One ADP server, one LLM orchestrator, and one tool worker pool are shared;
 * each WebSocket connection gets its own {@link AgentSession} with isolated
 * conversation state. Events are routed to the originating client only, so two
 * clients never collide. Built-in ADP commands (Session.prompt, Inference.halt,
 * …) are resolved to the caller's session; apps add their own via
 * {@link registerCommand}.
 *
 * Each session runs a prompt loop, so a client can carry on a multi-turn
 * conversation: every `Session.prompt` (a user reply) advances the SAME
 * context, and each assistant turn is pushed back as a `Session.message` event.
 */
export class AgentSessionHost {
  /** The shared ADP control-plane server instance. */
  public readonly adp: AdpServer;

  private readonly llm: LLMOrchestrator;
  private readonly threadPool: AgenticThreadPool;
  private readonly toolSet: ToolSet;
  private readonly toolDefs: Record<string, ToolDefinition>;
  private readonly systemPrompt?: string;
  private readonly autoTick: boolean;
  private readonly quiet: boolean;

  private readonly sessions = new Map<string, AgentSession>();

  constructor(opts: AgentSessionHostOptions = {}) {
    this.adp = opts.adpServer
      ? new AdpServer({ server: opts.adpServer })
      : new AdpServer(opts.adpPort ?? 9222);
    this.toolDefs = opts.tools ?? {};
    this.toolSet = buildToolSet(this.toolDefs);
    this.llm = new LLMOrchestrator({
      apiKey: opts.llmApiKey,
      baseURL: opts.llmBaseUrl,
      model: opts.llmModel,
    });
    this.threadPool = new AgenticThreadPool(opts.threadPoolSize ?? 4, this.toolDefs);
    this.systemPrompt = opts.systemPrompt;
    this.autoTick = opts.autoTick ?? true;
    this.quiet = opts.quiet ?? false;

    this.wireAdp();
    this.adp.onConnection((sessionId) => this.openSession(sessionId));
    this.adp.onDisconnection((sessionId) => this.closeSession(sessionId));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  /** Number of live sessions. */
  public get sessionCount(): number {
    return this.sessions.size;
  }

  /** Look up a live session by id. */
  public getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Register an app-specific ADP command, resolved to the caller's session.
   * @param method - The ADP method name (e.g. "Music.StartExtraction").
   * @param handler - Receives the params and a session-scoped context.
   */
  public registerCommand(method: string, handler: SessionCommandHandler): void {
    this.adp.on(method, (params: Record<string, unknown> | undefined, cb: (r: unknown) => void, sessionId: string) => {
      handler(params, this.contextFor(sessionId, cb));
    });
  }

  /** Graceful shutdown: stop every session, drain workers, close the server. */
  public async shutdown(): Promise<void> {
    for (const session of this.sessions.values()) session.shutdownEngine();
    this.sessions.clear();
    await this.threadPool.terminateAll();
    await this.adp.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SESSION LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  private openSession(sessionId: string): void {
    const session = new AgentSession({
      llm: this.llm,
      threadPool: this.threadPool,
      toolSet: this.toolSet,
      toolDefs: this.toolDefs,
      // Route every event for this session to ONLY its client.
      notify: (method, params) => this.adp.notifyClient(sessionId, method, params),
      systemPrompt: this.systemPrompt,
      autoTick: this.autoTick,
      quiet: this.quiet,
    });

    // Surface each assistant turn (a question to confirm, or a final answer)
    // to the owning client so it can show it and let the user reply.
    session.on("inference.end", (payload: { text?: string }) => {
      const text = payload?.text;
      if (typeof text === "string" && text.trim().length > 0) {
        this.adp.notifyClient(sessionId, "Session.message", { text });
      }
    });

    this.sessions.set(sessionId, session);
    this.adp.notifyClient(sessionId, "Session.created", { sessionId });
    void this.runSessionLoop(sessionId, session);
  }

  private async runSessionLoop(sessionId: string, session: AgentSession): Promise<void> {
    for (;;) {
      const prompt = await session.waitForPrompt();
      if (prompt == null) break; // shutdown
      try {
        await session.run(prompt);
      } catch (err) {
        console.error(
          `[Host] session ${sessionId} run failed:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  private closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.shutdownEngine();
      this.sessions.delete(sessionId);
    }
  }

  private contextFor(sessionId: string, cb: (r: unknown) => void): SessionCommandContext {
    return {
      sessionId,
      session: this.sessions.get(sessionId),
      reply: (result) => cb(result),
      notify: (method, params) => this.adp.notifyClient(sessionId, method, params),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ADP WIRING (built-in commands, resolved per session)
  // ═══════════════════════════════════════════════════════════════════════════

  private wireAdp(): void {
    const bind = (
      method: string,
      fn: (session: AgentSession, params: any, cb: (r: unknown) => void) => void,
    ) => {
      this.adp.on(
        method,
        (params: Record<string, unknown> | undefined, cb: (r: unknown) => void, sessionId: string) => {
          const session = this.sessions.get(sessionId);
          if (!session) {
            cb({ status: "error", reason: "no active session" });
            return;
          }
          fn(session, params, cb);
        },
      );
    };

    bind(AdpDomains.Inference.halt, (s, _p, cb) => cb(s.halt()));
    bind(AdpDomains.Inference.evaluate, (s, p, cb) => cb(s.injectThought(p?.expression ?? "")));

    bind(AdpDomains.Metacognition.pause, (s, _p, cb) => cb(s.pause()));
    bind(AdpDomains.Metacognition.resume, (s, _p, cb) => cb(s.resume()));
    bind(AdpDomains.Metacognition.getCallFrame, (s, _p, cb) => cb(s.getCallFrame()));

    bind(AdpDomains.Memory.compact, (s, _p, cb) => cb(s.compact()));
    bind(AdpDomains.Memory.queryNodes, (s, p, cb) => cb(s.queryNodes((p?.query as string) ?? "")));

    bind(AdpDomains.Session.prompt, (s, p, cb) => cb(s.enqueuePrompt((p?.prompt as string) ?? "")));
    bind(AdpDomains.Session.shutdown, (s, _p, cb) => cb(s.requestShutdown()));

    bind(AdpDomains.Toolchain.list, (s, _p, cb) => cb(s.listTools()));
    bind(AdpDomains.Toolchain.intercept, (s, p, cb) => cb(s.interceptTool(p)));
  }
}
