import { WebSocketServer, WebSocket, type RawData } from "ws";
import { EventEmitter } from "events";
import http, { type IncomingMessage, type Server } from "node:http";
import {
  JsonRpcRequestSchema,
  ADP_PROTOCOL_VERSION,
  AdpDomains,
  type JsonRpcResponse,
  type AdpEvent,
  type AdpCommandHandler,
} from "./schemas.js";

type RegisteredAdpHandler = {
  listener: (...args: any[]) => unknown;
  once: boolean;
};

/**
 * Decode one inbound WebSocket frame to a UTF-8 string.
 *
 * This is the single place where wire frames are decoded. ws delivers a
 * message as `string | Buffer | ArrayBuffer | Buffer[]` (and a Blob on
 * browser-style receivers); a blind `(raw as Buffer).toString()` corrupts
 * fragmented (`Buffer[]`) frames and yields "[object ArrayBuffer]" for binary
 * frames. Anything that is not a decodable frame throws, and the caller
 * reports a JSON-RPC -32700 parse error.
 */
function decodeFrame(raw: RawData | Blob): string | Promise<string> {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return Buffer.concat(raw).toString("utf8");
  if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString("utf8");
  if (ArrayBuffer.isView(raw)) {
    // Covers Buffer, Uint8Array and friends (Buffer is a Uint8Array view).
    return Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength).toString("utf8");
  }
  if (typeof (raw as { text?: unknown }).text === "function") {
    return (raw as Blob).text();
  }
  throw new Error("Unsupported ADP frame type");
}

/**
 * AdpServer — the out-of-band control plane.
 *
 * It opens a dedicated WebSocket on a configurable port and speaks JSON-RPC 2.0.
 *
 * Extends EventEmitter to provide a high-level API for handling commands
 * and emitting events, similar to Playwright/CDP.
 *
 * ## Dispatch model (hardened)
 *
 * Every ADP method has **exactly one registration slot**. Methods are
 * registered with `.on(method, handler)` (preferred) or the deprecated
 * `.handle(method, handler)` alias; both funnel into the same dispatcher map.
 * Registering a method that already has a handler — with any EventEmitter
 * registration alias — throws at registration time, so a single request can
 * never be dispatched to two handlers and can never produce two responses.
 */
/** Notified when a client connects/disconnects, with that client's session id. */
export type AdpConnectionListener = (sessionId: string) => void;

/**
 * Legacy `Debugger.<Verb>` commands emitted by every agx REPL/TUI frontend
 * (`parseReplCommand`, `useAdp`, the pi extension). They alias onto the
 * canonical ADP domains; unknown `Debugger.*` verbs still get -32601.
 * Aliased requests also push a `Debugger.Response` event back to the caller
 * since those frontends never correlate bare JSON-RPC responses.
 */
const DEBUGGER_METHOD_ALIASES: Record<string, string> = {
  "Debugger.Pause": AdpDomains.Metacognition.pause,
  "Debugger.Resume": AdpDomains.Metacognition.resume,
  "Debugger.Inspect": AdpDomains.Metacognition.getCallFrame,
  "Debugger.Halt": AdpDomains.Inference.halt,
  "Debugger.SwitchModel": AdpDomains.Inference.switchModel,
  "Debugger.Evaluate": AdpDomains.Inference.evaluate,
  "Debugger.List": AdpDomains.Toolchain.list,
  "Debugger.Intercept": AdpDomains.Toolchain.intercept,
  "Debugger.Cancel": AdpDomains.Toolchain.cancel,
  "Debugger.Compact": AdpDomains.Memory.compact,
  "Debugger.QueryNodes": AdpDomains.Memory.queryNodes,
  "Debugger.Prompt": AdpDomains.Session.prompt,
  "Debugger.Shutdown": AdpDomains.Session.shutdown,
};

export interface AdpServerOptions {
  /** The port to listen on. */
  port?: number;
  /** Attach to an existing HTTP server (the /adp upgrade path) instead. */
  server?: Server;
  /** Interface to bind. Defaults to loopback — ADP is a local control plane. */
  host?: string;
  /**
   * Credentials required during the WebSocket handshake. Accepts a bare token
   * string, one principal, or a principal list. Clients authenticate with an
   * `Authorization: Bearer <token>` header or `?token=` query parameter.
   */
  authToken?: string | AdpPrincipal | AdpPrincipal[];
  /** Largest accepted inbound frame in bytes (ws maxPayload). Default 1 MiB. */
  maxPayloadBytes?: number;
}

/**
 * One authenticated client identity. `scopes` are allowed method prefixes
 * (e.g. `"Toolchain."`); omitted means unrestricted access.
 */
export interface AdpPrincipal {
  token: string;
  scopes?: string[];
}

/** Structured audit record emitted through onAudit(). */
export interface AdpAuditEvent {
  type: "connect" | "disconnect" | "upgrade.denied" | "command" | "command.denied";
  sessionId?: string;
  method?: string;
  at: number;
}

/** Notified with every audit record. */
export type AdpAuditListener = (event: AdpAuditEvent) => void;

const DEFAULT_MAX_PAYLOAD_BYTES = 1_048_576;

function normalizePrincipals(
  authToken: AdpServerOptions["authToken"],
): AdpPrincipal[] {
  if (!authToken) return [];
  if (typeof authToken === "string") return [{ token: authToken }];
  return Array.isArray(authToken) ? authToken : [authToken];
}

export class AdpServer extends EventEmitter {
  private wss: WebSocketServer;
  /** HTTP listener we created ourselves (auth mode); closed with the server. */
  private ownedHttpServer: Server | null = null;
  /** Settles once the bind either succeeded (`listening`) or failed (`error`). */
  private readonly bindReady: Promise<void>;
  private bindFailed = false;
  private closed = false;
  /** Accepted credentials; empty means open loopback mode. */
  private readonly principals: AdpPrincipal[];
  /** socket → principal, so per-request scope checks know the caller. */
  private socketPrincipals = new Map<WebSocket, AdpPrincipal>();
  private auditListeners: AdpAuditListener[] = [];
  /** Single ADP method → handler dispatch table. */
  private handlers = new Map<string, RegisteredAdpHandler>();
  private clients = new Set<WebSocket>();
  /** sessionId → socket, so events can be routed to a single client. */
  private sockets = new Map<string, WebSocket>();
  /** socket → sessionId, so an inbound request knows which session sent it. */
  private sessionIds = new Map<WebSocket, string>();
  private connectionListeners: AdpConnectionListener[] = [];
  private disconnectionListeners: AdpConnectionListener[] = [];

  /**
   * Create a new ADP server.
   * @param portOrOptions - The port to listen on or WebSocket server options.
   */
  constructor(portOrOptions: number | AdpServerOptions) {
    super();
    const options = typeof portOrOptions === "number" ? { port: portOrOptions } : portOrOptions;
    this.principals = normalizePrincipals(options.authToken);
    const maxPayload = options.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD_BYTES;
    if (options.server) {
      const httpServer = options.server;
      this.wss = new WebSocketServer({ noServer: true, maxPayload });
      httpServer.on("upgrade", (request, socket, head) => {
        const pathname = request.url ? request.url.split("?")[0] : "";
        if (pathname !== "/adp") return;
        if (!this.authorizeUpgrade(request, socket)) return;
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit("connection", ws, request);
        });
      });
    } else if (this.principals.length > 0) {
      // Auth requires refusing the handshake itself, so we own the HTTP
      // listener and gate the upgrade before ws ever answers 101.
      const host = options.host ?? "127.0.0.1";
      this.wss = new WebSocketServer({ noServer: true, maxPayload });
      this.ownedHttpServer = http.createServer();
      this.ownedHttpServer.on("upgrade", (request, socket, head) => {
        if (!this.authorizeUpgrade(request, socket)) return;
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit("connection", ws, request);
        });
      });
      this.ownedHttpServer.listen(options.port ?? 9222, host);
    } else {
      this.wss = new WebSocketServer({
        port: options.port,
        host: options.host ?? "127.0.0.1",
        maxPayload,
      });
    }

    // A host-qualified listen() resolves its address asynchronously, so the
    // bind lands on a later tick — close() waits for it (or for its failure).
    if (this.ownedHttpServer) {
      const srv = this.ownedHttpServer;
      this.bindReady = new Promise<void>((resolve) => {
        srv.once("listening", () => resolve());
        srv.once("error", () => {
          this.bindFailed = true;
          resolve();
        });
      });
    } else if (options.server) {
      this.bindReady = Promise.resolve();
    } else {
      this.bindReady = new Promise<void>((resolve) => {
        this.wss.once("listening", () => resolve());
        this.wss.once("error", () => {
          this.bindFailed = true;
          resolve();
        });
      });
    }

    this.wss.on("error", (err) => {
      console.error("[ADP] Server error:", err);
    });

    this.wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      const sessionId = this.newSessionId();
      console.log(`[ADP] Client connected (session ${sessionId})`);
      this.clients.add(ws);
      this.sockets.set(sessionId, ws);
      this.sessionIds.set(ws, sessionId);
      const principal = this.principalFor(request);
      if (principal) this.socketPrincipals.set(ws, principal);
      this.emitAudit({ type: "connect", sessionId, at: Date.now() });
      for (const listener of this.connectionListeners) listener(sessionId);

      ws.on("error", (err) => {
        console.error("[ADP] Socket error:", err);
      });

      ws.on("message", (raw: RawData) => {
        void this.dispatchRawMessage(ws, sessionId, raw);
      });

      ws.on("close", () => {
        console.log(`[ADP] Client disconnected (session ${sessionId})`);
        this.clients.delete(ws);
        this.sockets.delete(sessionId);
        this.sessionIds.delete(ws);
        this.socketPrincipals.delete(ws);
        this.emitAudit({ type: "disconnect", sessionId, at: Date.now() });
        for (const listener of this.disconnectionListeners) listener(sessionId);
      });
    });

    if (typeof portOrOptions === "number") {
      console.log(`[ADP] Control-plane listening on ws://localhost:${portOrOptions}`);
    } else if (portOrOptions.port) {
      console.log(`[ADP] Control-plane listening on ws://localhost:${portOrOptions.port}`);
    } else {
      console.log("[ADP] Control-plane attached to existing HTTP server");
    }
  }

  /**
   * Gate an upgrade request when authToken is configured. Accepts the token
   * via `Authorization: Bearer <token>` or a `?token=` query parameter (for
   * browser WebSocket callers that cannot set headers). Returns false after
   * writing the 401 and destroying the socket.
   */
  private authorizeUpgrade(
    request: IncomingMessage,
    socket: { write(data: string): void; destroy(): void },
  ): boolean {
    if (this.principals.length === 0) return true;
    if (this.principalFor(request)) return true;

    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    console.warn("[ADP] Refused unauthenticated upgrade");
    this.emitAudit({ type: "upgrade.denied", at: Date.now() });
    return false;
  }

  /** Resolve the principal an upgrade request authenticates as, if any. */
  private principalFor(request: IncomingMessage): AdpPrincipal | null {
    if (this.principals.length === 0) return null;

    const header = request.headers["authorization"];
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      const token = header.slice("Bearer ".length);
      const match = this.principals.find((p) => p.token === token);
      if (match) return match;
    }

    try {
      const url = new URL(request.url ?? "", "http://localhost");
      const token = url.searchParams.get("token");
      if (token) {
        const match = this.principals.find((p) => p.token === token);
        if (match) return match;
      }
    } catch {
      // fall through
    }
    return null;
  }

  /** Subscribe to structured audit events (connects, denied upgrades/commands). */
  public onAudit(listener: AdpAuditListener): void {
    this.auditListeners.push(listener);
  }

  private emitAudit(event: AdpAuditEvent): void {
    for (const listener of this.auditListeners) listener(event);
  }

  /**
   * Register a handler for an ADP method (e.g. "Inference.halt").
   * At most one handler may be registered per method; a duplicate
   * registration (via `.on()` or `.handle()`) throws.
   * @param eventName - The ADP method name.
   * @param listener - `(params, callback, sessionId?)`; call `callback(result)`
   *   to send the JSON-RPC response. The sessionId arg is only meaningful on
   *   multi-tenant hosts.
   */
  public override on(eventName: string | symbol, listener: (...args: any[]) => void): this {
    if (typeof eventName === "string") return this.registerHandler(eventName, listener, false);
    return super.on(eventName, listener);
  }

  /**
   * Alias of {@link on} — kept so `addListener` cannot bypass the
   * one-handler-per-method guarantee.
   */
  public override addListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return this.on(eventName, listener);
  }

  /** Register a one-shot ADP handler through the same single dispatch table. */
  public override once(eventName: string | symbol, listener: (...args: any[]) => void): this {
    if (typeof eventName === "string") return this.registerHandler(eventName, listener, true);
    return super.once(eventName, listener);
  }

  /** Ordering is irrelevant with one handler; this is intentionally an alias. */
  public override prependListener(
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ): this {
    return this.on(eventName, listener);
  }

  /** Ordering is irrelevant with one handler; this is intentionally an alias. */
  public override prependOnceListener(
    eventName: string | symbol,
    listener: (...args: any[]) => void,
  ): this {
    return this.once(eventName, listener);
  }

  /**
   * Register a handler for an ADP method (e.g. "Inference.halt")
   * @deprecated Use .on(method, handler) instead. `.handle()` is an alias for
   * `.on()` — both share the single handler slot, and a duplicate
   * registration of either kind throws.
   * @param method - The ADP method name.
   * @param handler - The handler function.
   */
  public handle<P = Record<string, unknown>, R = unknown>(
    method: string,
    handler: AdpCommandHandler<P, R>,
  ): void {
    this.on(method, handler as (...args: any[]) => void);
  }

  /**
   * Push an event to all connected ADP clients (server → client)
   * @deprecated Use .notify(method, params) instead.
   * @param event - The event object to broadcast.
   */
  public broadcast(event: AdpEvent<any>): void {
    const payload = JSON.stringify(event);
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  /**
   * High-level method to send an event to all connected clients.
   * Equivalent to Playwright's emit but for remote clients.
   * @param method - The ADP event method name.
   * @param params - Optional parameters for the event.
   */
  public notify<T = Record<string, unknown>>(method: string, params?: T): void {
    this.broadcast({
      jsonrpc: "2.0",
      method,
      params: params as any,
    });
  }

  /**
   * Push an event to a SINGLE client, identified by its session id.
   * Used by multi-tenant hosts so one client's status/messages never leak to
   * another. Silently no-ops if the session has gone away.
   * @param sessionId - The target session (assigned on connect).
   * @param method - The ADP event method name.
   * @param params - Optional parameters for the event.
   */
  public notifyClient<T = Record<string, unknown>>(
    sessionId: string,
    method: string,
    params?: T,
  ): void {
    const ws = this.sockets.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ jsonrpc: "2.0", method, params }));
    }
  }

  /**
   * Register a listener fired when a client connects, with its session id.
   * @param listener - Called with the new session id.
   */
  public onConnection(listener: AdpConnectionListener): void {
    this.connectionListeners.push(listener);
  }

  /**
   * Register a listener fired when a client disconnects, with its session id.
   * @param listener - Called with the departed session id.
   */
  public onDisconnection(listener: AdpConnectionListener): void {
    this.disconnectionListeners.push(listener);
  }

  /** Resolve the session id for a connected socket (or undefined). */
  public sessionIdFor(ws: WebSocket): string | undefined {
    return this.sessionIds.get(ws);
  }

  /** Number of currently connected client sockets. */
  public get clientCount(): number {
    return this.clients.size;
  }

  /**
   * Graceful shutdown.
   * @returns A promise that resolves when the server is closed.
   */
  public async close(): Promise<void> {
    // Wait for the deferred bind: closing a server that is still coming up
    // (or that never bound) used to throw "Server is not running".
    await this.bindReady;
    if (this.closed || this.bindFailed) return;
    this.closed = true;
    return new Promise((resolve, reject) => {
      for (const ws of this.clients) ws.close();
      this.wss.close((err) => {
        if (err && !/not running/i.test(err.message)) {
          reject(err);
          return;
        }
        if (!this.ownedHttpServer) {
          resolve();
          return;
        }
        const httpServer = this.ownedHttpServer;
        this.ownedHttpServer = null;
        httpServer.close((closeErr) =>
          closeErr && !/not running/i.test(closeErr.message) ? reject(closeErr) : resolve(),
        );
      });
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /** Register a method in the single ADP dispatcher table. */
  private registerHandler(
    method: string,
    listener: (...args: any[]) => unknown,
    once: boolean,
  ): this {
    if (this.handlers.has(method)) {
      throw new Error(
        `[ADP] Duplicate handler for method "${method}": exactly one handler may be registered per ADP method`,
      );
    }
    this.handlers.set(method, { listener, once });
    return this;
  }

  /**
   * Validate, decode and dispatch one inbound frame.
   *
   * Guarantees:
   * - one request → at most one response (JSON-RPC 2.0); a handler that calls
   *   its callback twice, or throws after replying, cannot double-send;
   * - notifications (no `id`) never receive a response, even on error;
   * - unknown methods receive exactly one `-32601` (and only when they have
   *   an `id` to reply to);
   * - handler exceptions surface as `-32603` internal errors, never as a
   *   misleading "Parse error".
   */
  private async dispatchRawMessage(
    ws: WebSocket,
    sessionId: string,
    raw: RawData,
  ): Promise<void> {
    let message: string;
    try {
      message = await decodeFrame(raw);
    } catch {
      this.sendError(ws, null, -32700, "Parse error");
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(message);
    } catch {
      this.sendError(ws, null, -32700, "Parse error");
      return;
    }

    const parsed = JsonRpcRequestSchema.safeParse(data);
    if (!parsed.success) {
      this.sendError(ws, this.detectId(data), -32600, "Invalid JSON-RPC request");
      return;
    }
    const req = parsed.data;
    const requestId = req.id;

    // Legacy `Debugger.<Verb>` frontends: resolve to the canonical domain
    // method before the scope gate and handler lookup so scoped principals
    // are checked against the real method and the dispatch table stays single.
    const isDebuggerMethod = req.method.startsWith("Debugger.");
    const method = DEBUGGER_METHOD_ALIASES[req.method] ?? req.method;

    // At-most-one-response guard for this request id.
    let responded = false;
    const respondOnce = (send: () => void): void => {
      if (responded) return;
      responded = true;
      send();
    };

    const reply = (resultData: unknown): void => {
      if (requestId === undefined) return; // notification: never respond
      respondOnce(() => {
        this.sendResult(ws, requestId, resultData);
        if (isDebuggerMethod) {
          this.notifyClient(sessionId, "Debugger.Response", {
            method: req.method,
            result: resultData,
          });
        }
      });
    };

    const replyError = (code: number, message: string): void => {
      if (requestId === undefined) return;
      respondOnce(() => {
        this.sendError(ws, requestId, code, message);
        if (isDebuggerMethod) {
          this.notifyClient(sessionId, "Debugger.Response", {
            method: req.method,
            error: message,
          });
        }
      });
    };

    // Built-in protocol handshake — always available so clients can discover
    // the version and auth posture before issuing domain calls.
    if (req.method === AdpDomains.Adp.hello) {
      const principal = this.socketPrincipals.get(ws);
      reply({
        version: ADP_PROTOCOL_VERSION,
        authRequired: this.principals.length > 0,
        authenticated: this.principals.length === 0 || principal !== undefined,
      });
      this.emitAudit({ type: "command", sessionId, method: req.method, at: Date.now() });
      return;
    }

    // Scope gate: a scoped principal may only call methods under its prefixes.
    const principal = this.socketPrincipals.get(ws);
    if (
      principal?.scopes &&
      !principal.scopes.some((scope) => method.startsWith(scope))
    ) {
      this.emitAudit({ type: "command.denied", sessionId, method, at: Date.now() });
      if (requestId !== undefined) {
        replyError(-32601, `Method not permitted: ${req.method}`);
      }
      return;
    }

    this.emitAudit({ type: "command", sessionId, method, at: Date.now() });

    const registered = this.handlers.get(method);
    if (!registered) {
      replyError(-32601, `Method not found: ${req.method}`);
      return;
    }

    if (registered.once) this.handlers.delete(method);

    try {
      // Dispatch through the single handler table. The listener signature is
      // (params, callback, sessionId) — the third argument lets a multi-tenant
      // host route the command to the right session.
      await registered.listener(req.params, reply, sessionId);
    } catch (err) {
      // A throwing handler must not take the connection down or mask itself
      // as a parse error; report -32603 (unless it already responded).
      console.error(`[ADP] Handler for ${method} threw:`, err);
      replyError(-32603, "Internal error");
    }
  }

  /** Best-effort id extraction from an otherwise-invalid JSON-RPC request. */
  private detectId(data: unknown): string | number | null {
    if (data && typeof data === "object" && "id" in data) {
      const id = (data as { id?: unknown }).id;
      if (typeof id === "string" || typeof id === "number") return id;
    }
    return null;
  }

  private newSessionId(): string {
    return `s_${Math.random().toString(36).slice(2, 10)}`;
  }

  private sendResult(ws: WebSocket, id: string | number, result: unknown) {
    const response: JsonRpcResponse = { jsonrpc: "2.0", id, result };
    ws.send(JSON.stringify(response));
  }

  private sendError(ws: WebSocket, id: string | number | null, code: number, message: string) {
    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id,
      error: { code, message },
    };
    ws.send(JSON.stringify(response));
  }
}
