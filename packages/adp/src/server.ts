import { WebSocketServer, WebSocket, type RawData } from "ws";
import { EventEmitter } from "events";
import http, { type IncomingMessage, type Server } from "node:http";
import {
  JsonRpcRequestSchema,
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

export interface AdpServerOptions {
  /** The port to listen on. */
  port?: number;
  /** Attach to an existing HTTP server (the /adp upgrade path) instead. */
  server?: Server;
  /** Interface to bind. Defaults to loopback — ADP is a local control plane. */
  host?: string;
  /**
   * When set, clients must present this token — `Authorization: Bearer <token>`
   * header or `?token=` query parameter — during the WebSocket handshake or the
   * upgrade is refused with 401.
   */
  authToken?: string;
  /** Largest accepted inbound frame in bytes (ws maxPayload). Default 1 MiB. */
  maxPayloadBytes?: number;
}

const DEFAULT_MAX_PAYLOAD_BYTES = 1_048_576;

export class AdpServer extends EventEmitter {
  private wss: WebSocketServer;
  /** HTTP listener we created ourselves (auth mode); closed with the server. */
  private ownedHttpServer: Server | null = null;
  private readonly authToken?: string;
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
    this.authToken = options.authToken;
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
    } else if (this.authToken) {
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
    this.wss.on("error", (err) => {
      console.error("[ADP] Server error:", err);
    });

    this.wss.on("connection", (ws: WebSocket) => {
      const sessionId = this.newSessionId();
      console.log(`[ADP] Client connected (session ${sessionId})`);
      this.clients.add(ws);
      this.sockets.set(sessionId, ws);
      this.sessionIds.set(ws, sessionId);
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
    if (!this.authToken) return true;

    const header = request.headers["authorization"];
    if (header === `Bearer ${this.authToken}`) return true;

    try {
      const url = new URL(request.url ?? "", "http://localhost");
      if (url.searchParams.get("token") === this.authToken) return true;
    } catch {
      // fall through to rejection
    }

    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    console.warn("[ADP] Refused unauthenticated upgrade");
    return false;
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

  /**
   * Graceful shutdown.
   * @returns A promise that resolves when the server is closed.
   */
  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      for (const ws of this.clients) ws.close();
      this.wss.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        if (!this.ownedHttpServer) {
          resolve();
          return;
        }
        const httpServer = this.ownedHttpServer;
        this.ownedHttpServer = null;
        httpServer.close((closeErr) => (closeErr ? reject(closeErr) : resolve()));
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

    // At-most-one-response guard for this request id.
    let responded = false;
    const respondOnce = (send: () => void): void => {
      if (responded) return;
      responded = true;
      send();
    };

    const reply = (resultData: unknown): void => {
      if (requestId === undefined) return; // notification: never respond
      respondOnce(() => this.sendResult(ws, requestId, resultData));
    };

    const registered = this.handlers.get(req.method);
    if (!registered) {
      if (requestId !== undefined) {
        respondOnce(() => this.sendError(ws, requestId, -32601, `Method not found: ${req.method}`));
      }
      return;
    }

    if (registered.once) this.handlers.delete(req.method);

    try {
      // Dispatch through the single handler table. The listener signature is
      // (params, callback, sessionId) — the third argument lets a multi-tenant
      // host route the command to the right session.
      await registered.listener(req.params, reply, sessionId);
    } catch (err) {
      // A throwing handler must not take the connection down or mask itself
      // as a parse error; report -32603 (unless it already responded).
      console.error(`[ADP] Handler for ${req.method} threw:`, err);
      if (requestId !== undefined) {
        respondOnce(() => this.sendError(ws, requestId, -32603, "Internal error"));
      }
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
