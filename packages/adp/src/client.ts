import WebSocket from 'ws';
import { JsonRpcResponseSchema, type JsonRpcRequest } from './schemas';

/**
 * AdpClient — connects to a running agent's ADP control-plane WebSocket
 * and issues JSON-RPC 2.0 commands (e.g. Inference.halt, Metacognition.pause).
 *
 * Usage:
 *   const client = new AdpClient('ws://localhost:9222');
 *   await client.connect();
 *   const res = await client.send('Inference.halt');
 */
export class AdpClient {
  private ws: WebSocket;
  private nextId = 0;
  private pending = new Map<
    number | string,
    { resolve: (v: any) => void; reject: (e: any) => void }
  >();
  private eventListeners: Array<(method: string, params?: any) => void> = [];
  private closeListeners: Array<(code: number, reason: string) => void> = [];

  constructor(private url: string) {
    this.ws = new WebSocket(url);

    this.ws.on('message', (raw) => {
      const message = typeof raw === 'string' ? raw : raw.toString();
      try {
        const data = JSON.parse(message);

        // Check if it's a response to one of our requests
        const parsed = JsonRpcResponseSchema.safeParse(data);
        if (parsed.success && parsed.data.id !== undefined) {
          const entry = this.pending.get(parsed.data.id);
          if (entry) {
            this.pending.delete(parsed.data.id);
            if (parsed.data.error) {
              entry.reject(parsed.data.error);
            } else {
              entry.resolve(parsed.data.result);
            }
            return;
          }
        }

        // Otherwise treat it as a server-push event
        if (data.method) {
          for (const listener of this.eventListeners) {
            listener(data.method, data.params);
          }
        }
      } catch {
        // ignore malformed frames
      }
    });

    this.ws.on('close', (code, reason) => {
      // Reject any pending requests
      for (const [, entry] of this.pending) {
        entry.reject(new Error(`WebSocket closed: ${code} ${reason}`));
      }
      this.pending.clear();
      const reasonStr = reason.toString();
      for (const listener of this.closeListeners) {
        listener(code, reasonStr);
      }
    });
  }

  /** Wait for the WebSocket connection to open. */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      this.ws.once('open', resolve);
      this.ws.once('error', reject);
    });
  }

  /** True if the underlying WebSocket is currently open. */
  public get isOpen(): boolean {
    return this.ws.readyState === WebSocket.OPEN;
  }

  /** Send a JSON-RPC command and await the response. */
  public send(method: string, params?: Record<string, any>): Promise<any> {
    if (!this.isOpen) {
      return Promise.reject(new Error(`WebSocket is not open: readyState ${this.ws.readyState}`));
    }

    const id = ++this.nextId;
    const request: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(request), (err) => {
        if (err) {
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  /** Subscribe to server-push events (e.g. Metacognition.hallucinationDetected) */
  public onEvent(listener: (method: string, params?: any) => void): void {
    this.eventListeners.push(listener);
  }

  /** Subscribe to connection-close events. */
  public onClose(listener: (code: number, reason: string) => void): void {
    this.closeListeners.push(listener);
  }

  public close(): void {
    this.ws.close();
  }
}
