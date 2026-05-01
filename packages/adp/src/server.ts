import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import {
  JsonRpcRequestSchema,
  type JsonRpcResponse,
  type AdpEvent,
  type AdpCommandHandler,
} from './schemas';

/**
 * AdpServer — the out-of-band control plane.
 *
 * It opens a dedicated WebSocket on a configurable port and speaks JSON-RPC 2.0.
 *
 * Now extends EventEmitter to provide a high-level API for handling commands
 * and emitting events, similar to Playwright/CDP.
 */
export class AdpServer extends EventEmitter {
  private wss: WebSocketServer;
  private handlers = new Map<string, AdpCommandHandler>();
  private clients = new Set<WebSocket>();

  constructor(port: number) {
    super();
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[ADP] Client connected');
      this.clients.add(ws);

      ws.on('message', (raw) => {
        const message = typeof raw === 'string' ? raw : raw.toString();
        try {
          const data = JSON.parse(message);
          const parsed = JsonRpcRequestSchema.safeParse(data);

          if (!parsed.success) {
            this.sendError(ws, null, -32600, 'Invalid JSON-RPC request');
            return;
          }

          const req = parsed.data;
          
          // Emit the event locally for high-level handlers
          // The listener signature is (params, callback)
          const hasListeners = this.emit(req.method, req.params, (resultData: any) => {
            if (req.id !== undefined) {
              this.sendResult(ws, req.id, resultData);
            }
          });

          // Fallback to legacy handlers map
          const legacyHandler = this.handlers.get(req.method);
          if (legacyHandler) {
            console.log(`[ADP] ← ${req.method} (legacy)`);
            legacyHandler(req.params, (resultData: any) => {
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
          this.sendError(ws, null, -32700, 'Parse error');
        }
      });

      ws.on('close', () => {
        console.log('[ADP] Client disconnected');
        this.clients.delete(ws);
      });
    });

    console.log(`[ADP] Control-plane listening on ws://localhost:${port}`);
  }

  /**
   * Register a handler for an ADP method (e.g. "Inference.halt")
   * @deprecated Use .on(method, handler) instead.
   */
  public handle(method: string, handler: AdpCommandHandler): void {
    this.handlers.set(method, handler);
  }

  /**
   * Push an event to all connected ADP clients (server → client)
   * @deprecated Use .notify(method, params) instead.
   */
  public broadcast(event: AdpEvent): void {
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
   */
  public notify(method: string, params?: any): void {
    this.broadcast({
      jsonrpc: '2.0',
      method,
      params,
    });
  }

  /** Graceful shutdown */
  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      for (const ws of this.clients) ws.close();
      this.wss.close((err) => (err ? reject(err) : resolve()));
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private sendResult(ws: WebSocket, id: string | number, result: unknown) {
    const response: JsonRpcResponse = { jsonrpc: '2.0', id, result };
    ws.send(JSON.stringify(response));
  }

  private sendError(
    ws: WebSocket,
    id: string | number | null,
    code: number,
    message: string,
  ) {
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: (id ?? 0) as string | number,
      error: { code, message },
    };
    ws.send(JSON.stringify(response));
  }
}
