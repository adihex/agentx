import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AdpServer } from "../src/server";
import { WebSocket } from "ws";

describe("AdpServer", () => {
  let server: AdpServer;
  const PORT = 9224;

  beforeEach(async () => {
    server = new AdpServer(PORT);
  });

  afterEach(async () => {
    await server.close();
  });

  it("should handle commands via .on() and respond via callback", async () => {
    const handler = vi.fn((params, cb) => {
      expect(params.foo).toBe("bar");
      cb({ status: "ok" });
    });

    server.on("Test.command", handler);

    const ws = new WebSocket(`ws://localhost:${PORT}`);

    await new Promise((resolve) => {
      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "Test.command",
            params: { foo: "bar" },
          }),
        );
      });

      ws.on("message", (data) => {
        const res = JSON.parse((data as Buffer).toString());
        expect(res.id).toBe(1);
        expect(res.result.status).toBe("ok");
        ws.close();
        resolve(null);
      });
    });

    expect(handler).toHaveBeenCalled();
  });

  it("should handle legacy handlers via .handle()", async () => {
    const handler = vi.fn((params, cb) => {
      cb({ legacy: true });
    });

    server.handle("Legacy.command", handler);

    const ws = new WebSocket(`ws://localhost:${PORT}`);

    await new Promise((resolve) => {
      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: "abc",
            method: "Legacy.command",
          }),
        );
      });

      ws.on("message", (data) => {
        const res = JSON.parse((data as Buffer).toString());
        expect(res.id).toBe("abc");
        expect(res.result.legacy).toBe(true);
        ws.close();
        resolve(null);
      });
    });
  });

  it("should return error for unknown method", async () => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);

    await new Promise((resolve) => {
      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: 100,
            method: "Unknown.method",
          }),
        );
      });

      ws.on("message", (data) => {
        const res = JSON.parse((data as Buffer).toString());
        expect(res.error.code).toBe(-32601);
        expect(res.error.message).toContain("Method not found");
        ws.close();
        resolve(null);
      });
    });
  });

  it("should return error for invalid JSON", async () => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);

    await new Promise((resolve) => {
      ws.on("open", () => {
        ws.send("not json");
      });

      ws.on("message", (data) => {
        const res = JSON.parse((data as Buffer).toString());
        expect(res.error.code).toBe(-32700);
        ws.close();
        resolve(null);
      });
    });
  });

  it("should return error for invalid JSON-RPC request", async () => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);

    await new Promise((resolve) => {
      ws.on("open", () => {
        ws.send(JSON.stringify({ method: "no-jsonrpc-field" }));
      });

      ws.on("message", (data) => {
        const res = JSON.parse((data as Buffer).toString());
        expect(res.error.code).toBe(-32600);
        ws.close();
        resolve(null);
      });
    });
  });

  it("should broadcast events via .notify() and legacy .broadcast()", async () => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);

    await new Promise((resolve) => {
      let count = 0;
      ws.on("open", () => {
        server.notify("Event.one", { val: 1 });
        server.broadcast({ jsonrpc: "2.0", method: "Event.two" });
      });

      ws.on("message", (data) => {
        const event = JSON.parse((data as Buffer).toString());
        count++;
        if (event.method === "Event.one") expect(event.params.val).toBe(1);
        if (event.method === "Event.two") {
          if (count === 2) {
            ws.close();
            resolve(null);
          }
        }
      });
    });
  });

  it("should handle wss.close error", async () => {
    // Mock wss.close to return an error
    const originalClose = (server as any).wss.close;
    (server as any).wss.close = (cb: any) => cb(new Error("Close error"));

    await expect(server.close()).rejects.toThrow("Close error");

    // Restore
    (server as any).wss.close = originalClose;
  });
});
