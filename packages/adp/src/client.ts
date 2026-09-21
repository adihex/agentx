import WebSocket, { type RawData } from "ws";
import { AdpDomains } from "./schemas.js";
import type { JsonRpcResponse, AdpEvent, AdpHello } from "./schemas.js";

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

export interface AdpClientOptions {
  /**
   * Default per-request timeout in milliseconds. `0` (the default) disables
   * the timeout; a positive value rejects any `send()` that outlives it.
   * Long-running commands (e.g. a full agent turn) should pass a larger
   * per-call `timeoutMs` to `send()`.
   */
  timeoutMs?: number;
  /**
   * Bearer token presented during the WebSocket handshake. Required when the
   * server is constructed with `authToken`. Browser callers (which cannot set
   * headers) should put it in the URL: `ws://host?token=…`.
   */
  token?: string;
}

export interface AdpSendOptions {
  /** Per-call timeout override; falls back to the constructor option. */
  timeoutMs?: number;
}

type PendingRequest = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
};

export class AdpClient {
  private ws: WebSocket;
  private pendingRequests = new Map<string | number, PendingRequest>();
  private eventListeners: Array<(method: string, params?: unknown) => void> = [];
  private closeListeners: Array<(code: number) => void> = [];
  private readonly defaultTimeoutMs: number;

  constructor(
    private url: string,
    options: AdpClientOptions = {},
  ) {
    this.defaultTimeoutMs = options.timeoutMs ?? 0;
    this.ws = new WebSocket(
      this.url,
      options.token ? { headers: { authorization: `Bearer ${options.token}` } } : undefined,
    );
    this.setupHandlers();
  }

  public get isOpen(): boolean {
    return this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Protocol handshake: resolves the server's `Adp.hello` payload with the
   * wire version and auth posture. Requires an open connection.
   */
  public hello(): Promise<AdpHello> {
    return this.send<AdpHello>(AdpDomains.Adp.hello);
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
          const responseId = data.id as string | number;
          const pending = this.pendingRequests.get(responseId);
          if (pending) {
            this.settleRequest(responseId, pending);
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
      this.rejectAllPending(err);
    });

    // A close — clean or abrupt — must never leave a send() hanging.
    this.ws.on("close", (code) => {
      this.rejectAllPending(new Error(`WebSocket closed (code ${code})`));
      for (const listener of this.closeListeners) {
        listener(code);
      }
    });
  }

  public send<T = unknown>(
    method: string,
    params?: Record<string, unknown>,
    options: AdpSendOptions = {},
  ): Promise<T> {
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

      const pending: PendingRequest = {
        resolve: resolve as (v: unknown) => void,
        reject,
      };

      const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
      if (timeoutMs > 0) {
        const timer = setTimeout(() => {
          if (this.pendingRequests.delete(id)) {
            reject(new Error(`ADP request timed out after ${timeoutMs}ms: ${method}`));
          }
        }, timeoutMs);
        // Never let a pending timeout keep the process alive.
        if (typeof timer === "object") timer.unref();
        pending.timer = timer;
      }

      this.pendingRequests.set(id, pending);

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
    return new Promise((resolve, reject) => {
      this.ws.once("open", () => resolve());
      // A refused/dead connection must not leave callers hanging.
      this.ws.once("error", reject);
      this.ws.once("close", () => reject(new Error("WebSocket closed before opening")));
    });
  }

  public close() {
    this.ws.close();
  }

  private settleRequest(id: string | number, pending: PendingRequest): void {
    this.pendingRequests.delete(id);
    if (pending.timer) clearTimeout(pending.timer);
  }

  private rejectAllPending(err: Error): void {
    for (const [id, pending] of this.pendingRequests) {
      if (pending.timer) clearTimeout(pending.timer);
      pending.reject(err);
      this.pendingRequests.delete(id);
    }
  }
}
