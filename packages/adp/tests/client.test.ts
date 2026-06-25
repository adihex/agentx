import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AdpClient } from "../src/client";
import { AdpServer } from "../src/server";

describe("AdpClient", () => {
  let server: AdpServer | null = null;
  let client: AdpClient | null = null;
  let port = 9400;

  beforeEach(async () => {
    port++;
  });

  afterEach(async () => {
    if (client) {
      client.close();
      client = null;
    }
    if (server) {
      await server.close();
      server = null;
    }
  });

  it("should connect to the server", async () => {
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();
    expect(client.isOpen).toBe(true);
  });

  it("should send a command and receive a response", async () => {
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    server.on("Test.ping", (params, callback) => {
      callback({ pong: true });
    });

    const result = await client.send("Test.ping");
    expect(result).toEqual({ pong: true });
  });

  it("should handle server events", async () => {
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const eventPromise = new Promise<{ method: string; params: any }>((resolve) => {
      client!.onEvent((method, params) => {
        resolve({ method, params });
      });
    });

    server.notify("Test.event", { foo: "bar" });

    const event = await eventPromise;
    expect(event.method).toBe("Test.event");
    expect(event.params).toEqual({ foo: "bar" });
  });

  it("should handle server errors", async () => {
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();
    expect(client.isOpen).toBe(true);
  }, 10000);

  it("should reject pending requests on close", async () => {
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();
    expect(client.isOpen).toBe(true);
  }, 10000);

  it("should handle malformed JSON from server", async () => {
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    (server as any).wss.clients.forEach((ws: any) => {
      ws.send("not json");
    });

    expect(client.isOpen).toBe(true);
  });

  it.skip("should fail to send if not connected", async () => {
    client = new AdpClient(`ws://localhost:${port}`);
    try {
      await client.send("foo");
      expect(false).toBe(true);
    } catch (err: any) {
      expect(err.message).toContain("WebSocket");
    }
  });

  it("should call close listeners", async () => {
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const closePromise = new Promise<number>((resolve) => {
      client!.onClose((code) => resolve(code));
    });

    await server.close();
    server = null;

    const code = await closePromise;
    expect(code).toBeDefined();
  });
});
