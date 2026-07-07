import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";
import type { Server } from "node:http";
import {
  JsonRpcRequestSchema,
  type JsonRpcResponse,
  type AdpEvent,
  type AdpCommandHandler,
} from "./schemas.js";

/**
 * AdpServer — the out-of-band control plane.
 *
 * It opens a dedicated WebSocket on a configurable port and speaks JSON-RPC 2.0.
 *
 * Extends EventEmitter to provide a high-level API for handling commands
 * and emitting events, similar to Playwright/CDP.
 */
/** Notified when a client connects/disconnects, with that client's session id. */
export type AdpConnectionListener = (sessionId: string) => void;

export class AdpServer extends EventEmitter {
  private wss: WebSocketServer;
  private handlers = new Map<string, AdpCommandHandler<any, any>>();
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
  constructor(portOrOptions: number | { port?: number; server?: Server }) {
    super();
    const options = typeof portOrOptions === "number" ? { port: portOrOptions } : portOrOptions;
    if (typeof portOrOptions === "object" && portOrOptions.server) {
      const httpServer = portOrOptions.server;
      this.wss = new WebSocketServer({ noServer: true });
      httpServer.on("upgrade", (request, socket, head) => {
        const pathname = request.url ? request.url.split("?")[0] : "";
        if (pathname === "/adp") {
          this.wss.handleUpgrade(request, socket, head, (ws) => {
            this.wss.emit("connection", ws, request);
          });
        }
      });
    } else {
      this.wss = new WebSocketServer(options);
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

      ws.on("message", (raw) => {
        const message = typeof raw === "string" ? raw : (raw as Buffer).toString();
        try {
          const data = JSON.parse(message);
          const parsed = JsonRpcRequestSchema.safeParse(data);

          if (!parsed.success) {
            this.sendError(ws, null, -32600, "Invalid JSON-RPC request");
            return;
          }

          const req = parsed.data;

          // Emit the event locally for high-level handlers. The listener
          // signature is (params, callback, sessionId) — the third argument
          // lets a multi-tenant host route the command to the right session.
          // Single-session handlers simply ignore it.
          const hasListeners = this.emit(
            req.method,
            req.params,
            (resultData: unknown) => {
              if (req.id !== undefined) {
                this.sendResult(ws, req.id, resultData);
              }
            },
            sessionId,
          );

          // Fallback to legacy handlers map
          const legacyHandler = this.handlers.get(req.method);
          if (legacyHandler) {
            console.log(`[ADP] ← ${req.method} (legacy)`);
            legacyHandler(req.params as any, (resultData: unknown) => {
              if (req.id !== undefined) {
                this.sendResult(ws, req.id, resultData);
              }
            });
          } else if (!hasListeners) {
            if (req.id !== undefined) {
              this.sendError(ws, req.id, -32601, `Method not found: ${req.method}`);
            }
            return;
          }

          console.log(`[ADP] ← ${req.method}`);
        } catch {
          this.sendError(ws, null, -32700, "Parse error");
        }
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
   * Register a handler for an ADP method (e.g. "Inference.halt")
   * @deprecated Use .on(method, handler) instead.
   * @param method - The ADP method name.
   * @param handler - The handler function.
   */
  public handle<P = Record<string, unknown>, R = unknown>(
    method: string,
    handler: AdpCommandHandler<P, R>,
  ): void {
    this.handlers.set(method, handler as AdpCommandHandler<any, any>);
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
      this.wss.close((err) => (err ? reject(err) : resolve()));
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

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
      id: (id ?? 0) as string | number,
      error: { code, message },
    };
    ws.send(JSON.stringify(response));
  }
}
