/**
 * ADP dispatcher hardening (improvement #9 — single ADP dispatcher).
 *
 * Covers:
 * - exactly one registration slot per method (collisions throw),
 * - one request → at most one response (even with sloppy/duplicate callbacks
 *   and throwing handlers),
 * - unknown-method handling (id-bearing → one -32601; notification → silent),
 * - notification semantics (handler runs; NO response frame ever),
 * - raw-frame decoding (Buffer, ArrayBuffer views, binary frames),
 * - error id correlation for invalid requests.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { AdpServer } from "../src/server";
import { WebSocket } from "ws";

describe("AdpServer — single registration/dispatch mechanism", () => {
  let server: AdpServer | null = null;
  let port = 50500;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  const newServer = (): AdpServer => {
    port++;
    server = new AdpServer(port);
    return server;
  };

  it("throws when the same method is registered twice via .on()", () => {
    const s = newServer();
    s.on("Dup.on", () => {});
    expect(() => s.on("Dup.on", () => {})).toThrow(/Duplicate handler/);
  });

  it("throws when .on() and .handle() both claim the same method", () => {
    const s = newServer();
    s.on("Dup.mixed", () => {});
    expect(() => s.handle("Dup.mixed", () => {})).toThrow(/Duplicate handler/);
  });

  it("throws when .handle() is registered after .on() claimed the method", () => {
    const s = newServer();
    s.handle("Dup.reverse", () => {});
    expect(() => s.on("Dup.reverse", () => {})).toThrow(/Duplicate handler/);
  });

  it("throws when .handle() registers the same method twice", () => {
    const s = newServer();
    s.handle("Dup.legacy", () => {});
    expect(() => s.handle("Dup.legacy", () => {})).toThrow(/Duplicate handler/);
  });

  it("guards every EventEmitter registration alias", () => {
    const s = newServer();
    s.on("Dup.guarded", () => {});
    expect(() => s.once("Dup.guarded", () => {})).toThrow(/Duplicate handler/);
    expect(() => s.addListener("Dup.guarded", () => {})).toThrow(/Duplicate handler/);
    expect(() => s.prependListener("Dup.guarded", () => {})).toThrow(/Duplicate handler/);
    expect(() => s.prependOnceListener("Dup.guarded", () => {})).toThrow(/Duplicate handler/);
  });

  it("allows distinct methods to each have their own handler", () => {
    const s = newServer();
    expect(() => {
      s.on("Dup.a", () => {});
      s.on("Dup.b", () => {});
      s.handle("Dup.c", () => {});
    }).not.toThrow();
  });

  it("legacy .handle() and .on() both dispatch from the same slot", async () => {
    const s = newServer();
    let calls = 0;
    s.handle("Single.legacy", (_p, cb) => {
      calls++;
      cb({ via: "legacy" });
    });
    s.on("Single.event", (_p, cb) => {
      calls++;
      cb({ via: "event" });
    });

    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((r) => ws.on("open", () => r()));

    const send = (id: number, method: string) =>
      ws.send(JSON.stringify({ jsonrpc: "2.0", id, method }));

    const results: any[] = [];
    ws.on("message", (d) => results.push(JSON.parse((d as Buffer).toString())));

    send(2, "Single.legacy");
    send(3, "Single.event");
    await new Promise((r) => setTimeout(r, 150));

    expect(calls).toBe(2);
    expect(results).toHaveLength(2); // exactly one response per request
    expect(results.find((r) => r.id === 2).result.via).toBe("legacy");
    expect(results.find((r) => r.id === 3).result.via).toBe("event");
    ws.close();
  }, 10000);
});

describe("AdpServer — one request produces at most one response", () => {
  let server: AdpServer | null = null;
  let port = 50520;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  const freshServer = (): AdpServer => {
    port++;
    server = new AdpServer(port);
    return server;
  };

  /** Collect response frames for `windowMs` after sending `payload`. */
  async function roundTrip(payload: string, windowMs = 150): Promise<{ frames: any[] }> {
    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((r) => ws.on("open", () => r()));
    const frames: any[] = [];
    ws.on("message", (d) => frames.push(JSON.parse((d as Buffer).toString())));
    ws.send(payload);
    await new Promise((r) => setTimeout(r, windowMs));
    ws.close();
    return { frames };
  }

  const request = (id: string | number, method: string, params?: Record<string, unknown>) => {
    const frame: Record<string, unknown> = { jsonrpc: "2.0", id, method };
    if (params !== undefined) frame.params = params;
    return JSON.stringify(frame);
  };

  it("a handler that calls its callback twice still yields exactly one response", async () => {
    const s = freshServer();
    s.on("Once.twice", (_p, cb) => {
      cb({ first: true });
      cb({ second: true });
    });
    const { frames } = await roundTrip(request(1, "Once.twice"));
    expect(frames).toHaveLength(1);
    expect(frames[0].id).toBe(1);
    expect(frames[0].result).toEqual({ first: true });
  }, 10000);

  it("a handler that throws after replying yields exactly one response", async () => {
    const s = freshServer();
    s.on("Once.throwAfter", (_p, cb) => {
      cb({ ok: true });
      throw new Error("too late");
    });
    const { frames } = await roundTrip(request(4, "Once.throwAfter"));
    expect(frames).toHaveLength(1);
    expect(frames[0].result).toEqual({ ok: true });
  }, 10000);

  it("a handler that throws before replying yields one -32603 internal error", async () => {
    const s = freshServer();
    s.on("Once.throw", () => {
      throw new Error("boom");
    });
    const { frames } = await roundTrip(request(5, "Once.throw"));
    expect(frames).toHaveLength(1);
    expect(frames[0].id).toBe(5);
    expect(frames[0].error.code).toBe(-32603);
  }, 10000);

  it("legacy .handle() duplicates cannot be registered, so there is a single response", async () => {
    const s = freshServer();
    s.handle("Once.single", (_p, cb) => cb({ n: 1 }));
    // The second registration is rejected at registration time — the request
    // below therefore reaches exactly one handler and one response.
    expect(() => s.handle("Once.single", (_p, cb) => cb({ n: 2 }))).toThrow(/Duplicate handler/);
    const { frames } = await roundTrip(request(6, "Once.single"));
    expect(frames).toHaveLength(1);
    expect(frames[0].result).toEqual({ n: 1 });
  }, 10000);
});

describe("AdpServer — unknown methods and notifications", () => {
  let server: AdpServer | null = null;
  let port = 50540;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  const freshServer = (): AdpServer => {
    port++;
    server = new AdpServer(port);
    return server;
  };

  async function withOpenSocket<T>(fn: (ws: WebSocket) => Promise<T>): Promise<T> {
    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((r) => ws.on("open", () => r()));
    try {
      return await fn(ws);
    } finally {
      ws.close();
    }
  }

  it("unknown method with an id yields exactly one -32601 with that id", async () => {
    freshServer();
    await withOpenSocket(async (ws) => {
      const frames: any[] = [];
      ws.on("message", (d) => frames.push(JSON.parse((d as Buffer).toString())));
      ws.send(JSON.stringify({ jsonrpc: "2.0", id: 41, method: "Unknown.method" }));
      await new Promise((r) => setTimeout(r, 150));
      expect(frames).toHaveLength(1);
      expect(frames[0].id).toBe(41);
      expect(frames[0].error.code).toBe(-32601);
      expect(frames[0].error.message).toContain("Method not found");
    });
  }, 10000);

  it("unknown-method notification (no id) is silently dropped — zero frames", async () => {
    freshServer();
    await withOpenSocket(async (ws) => {
      const frames: any[] = [];
      ws.on("message", (d) => frames.push(JSON.parse((d as Buffer).toString())));
      ws.send(JSON.stringify({ jsonrpc: "2.0", method: "Unknown.notification" }));
      await new Promise((r) => setTimeout(r, 150));
      expect(frames).toHaveLength(0);
    });
  }, 10000);

  it("notification for a known method invokes the handler but sends no response", async () => {
    const s = freshServer();
    const handler = vi.fn();
    s.on("Notify.run", handler);
    await withOpenSocket(async (ws) => {
      const frames: any[] = [];
      ws.on("message", (d) => frames.push(JSON.parse((d as Buffer).toString())));
      ws.send(JSON.stringify({ jsonrpc: "2.0", method: "Notify.run", params: { a: 1 } }));
      await new Promise((r) => setTimeout(r, 150));
      expect(handler).toHaveBeenCalledWith({ a: 1 }, expect.any(Function), expect.any(String));
      expect(frames).toHaveLength(0);
    });
  }, 10000);

  it("invalid request with a detectable id keeps that id in the -32600 error", async () => {
    freshServer();
    await withOpenSocket(async (ws) => {
      const frames: any[] = [];
      ws.on("message", (d) => frames.push(JSON.parse((d as Buffer).toString())));
      // Missing jsonrpc field, but the id is present.
      ws.send(JSON.stringify({ id: 99, method: "Whatever" }));
      await new Promise((r) => setTimeout(r, 150));
      expect(frames).toHaveLength(1);
      expect(frames[0].id).toBe(99);
      expect(frames[0].error.code).toBe(-32600);
    });
  }, 10000);
});

describe("AdpServer — raw wire frames", () => {
  let server: AdpServer | null = null;
  let port = 50560;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  it("decodes binary Buffer frames (nodebuffer default)", async () => {
    port++;
    server = new AdpServer(port);
    server.on("Raw.buffer", (_p, cb) => cb({ from: "buffer" }));

    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((r) => ws.on("open", () => r()));
    const frames: any[] = [];
    ws.on("message", (d) => frames.push(JSON.parse((d as Buffer).toString())));

    ws.send(Buffer.from(JSON.stringify({ jsonrpc: "2.0", id: 7, method: "Raw.buffer" })));
    await new Promise((r) => setTimeout(r, 150));

    expect(frames).toHaveLength(1);
    expect(frames[0].result).toEqual({ from: "buffer" });
    ws.close();
  }, 10000);

  it("decodes ArrayBuffer-delivered binary frames (binaryType = arraybuffer)", async () => {
    port++;
    server = new AdpServer(port);
    server.on("Raw.arraybuffer", (_p, cb) => cb({ binary: "decoded" }));

    // Force the server-side socket to deliver frames as ArrayBuffer.
    (server as any).wss.on("connection", (ws: WebSocket) => {
      ws.binaryType = "arraybuffer";
    });

    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((r) => ws.on("open", () => r()));
    const frames: any[] = [];
    ws.on("message", (d) => frames.push(JSON.parse((d as Buffer).toString())));

    ws.send(Buffer.from(JSON.stringify({ jsonrpc: "2.0", id: 8, method: "Raw.arraybuffer" })));
    await new Promise((r) => setTimeout(r, 150));

    expect(frames).toHaveLength(1);
    expect(frames[0].result).toEqual({ binary: "decoded" });
    ws.close();
  }, 10000);

  it("empty binary junk frame yields a single -32700 parse error", async () => {
    port++;
    server = new AdpServer(port);

    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((r) => ws.on("open", () => r()));
    const frames: any[] = [];
    ws.on("message", (d) => frames.push(JSON.parse((d as Buffer).toString())));

    ws.send(Buffer.from([0xff, 0x00, 0xfe]));
    await new Promise((r) => setTimeout(r, 150));

    expect(frames).toHaveLength(1);
    expect(frames[0].id).toBeNull();
    expect(frames[0].error.code).toBe(-32700);
    ws.close();
  }, 10000);
});