import WebSocket, { type RawData } from "ws";
import type { JsonRpcResponse, AdpEvent } from "./schemas.js";

/**
 * Normalize a ws `RawData` frame to a UTF-8 string.
 * ws delivers a message as `Buffer | ArrayBuffer | Buffer[]`; a blind
 * `(raw as Buffer).toString()` corrupts fragmented (`Buffer[]`) frames and
 * yields "[object ArrayBuffer]" for binary frames. Handle each shape.
 */
function rawToUtf8(raw: RawData): string {
  if (Array.isArray(raw)) return Buffer.concat(raw).toString("utf8");
  if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString("utf8");
  return raw.toString("utf8");
}

export class AdpClient {
  private ws: WebSocket;
  private pendingRequests = new Map<
    string | number,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();
  private eventListeners: Array<(method: string, params?: unknown) => void> = [];
  private closeListeners: Array<(code: number) => void> = [];

  constructor(private url: string) {
    this.ws = new WebSocket(this.url);
    this.setupHandlers();
  }

  public get isOpen(): boolean {
    return this.ws.readyState === WebSocket.OPEN;
  }

  public async connect(): Promise<void> {
    return this.waitForOpen();
  }

  private setupHandlers() {
    this.ws.on("message", (raw: RawData) => {
      try {
        const data = JSON.parse(rawToUtf8(raw));

        if ("id" in data && data.id !== null) {
          const res = data as JsonRpcResponse;
          const pending = this.pendingRequests.get(res.id);
          if (pending) {
            this.pendingRequests.delete(res.id);
            if (res.error) {
              pending.reject(new Error(res.error.message));
            } else {
              pending.resolve(res.result);
            }
          }
        } else if ("method" in data) {
          const event = data as AdpEvent<unknown>;
          for (const listener of this.eventListeners) {
            listener(event.method, event.params);
          }
        }
      } catch (err) {
        console.error("[ADP Client] Failed to parse message:", err);
      }
    });

    this.ws.on("error", (err) => {
      console.error("[ADP Client] WebSocket error:", err);
      for (const pending of this.pendingRequests.values()) {
        pending.reject(err);
      }
      this.pendingRequests.clear();
    });

    this.ws.on("close", (code) => {
      for (const listener of this.closeListeners) {
        listener(code);
      }
    });
  }

  public send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (this.ws.readyState !== WebSocket.OPEN && this.ws.readyState !== WebSocket.CONNECTING) {
      return Promise.reject(new Error("WebSocket is not open"));
    }

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2, 10);
      const payload = JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params,
      });

      this.pendingRequests.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });

      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(payload);
      } else {
        this.ws.once("open", () => this.ws.send(payload));
      }
    });
  }

  public onEvent(listener: (method: string, params?: unknown) => void): void {
    this.eventListeners.push(listener);
  }

  public onClose(listener: (code: number) => void): void {
    this.closeListeners.push(listener);
  }

  public async waitForOpen(): Promise<void> {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise((resolve) => {
      this.ws.once("open", () => resolve());
    });
  }

  public close() {
    this.ws.close();
  }
}
