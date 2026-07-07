/**
 * Integration Test: ADP Client ↔ Server end-to-end communication
 * Tests real WebSocket communication between AdpClient and AdpServer
 */
import { describe, it, expect, afterEach } from "vitest";
import { AdpClient } from "../src/client";
import { AdpServer } from "../src/server";

let port = 9700;

describe("ADP Client-Server Integration", () => {
  let server: AdpServer | null = null;
  let client: AdpClient | null = null;

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

  it("should handle complete request-response cycle", async () => {
    port++;
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    server.on("Math.add", (params: any, cb: (r: any) => void) => {
      cb({ result: params.a + params.b });
    });

    const result = await client.send("Math.add", { a: 3, b: 4 });
    expect(result).toEqual({ result: 7 });
  });

  it("should handle server-to-client events during request-response", async () => {
    port++;
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const events: string[] = [];
    client.onEvent((method) => events.push(method));

    server.on("Mixed.operation", (params: any, cb: (r: any) => void) => {
      // Send an event while processing the request
      server!.notify("Mixed.progress", { pct: 50 });
      cb({ done: true });
    });

    const result = await client.send("Mixed.operation", {});
    expect(result).toEqual({ done: true });
    expect(events).toContain("Mixed.progress");
  });

  it("should handle multiple concurrent clients", async () => {
    port++;
    server = new AdpServer(port);

    const clientA = new AdpClient(`ws://localhost:${port}`);
    const clientB = new AdpClient(`ws://localhost:${port}`);

    await clientA.connect();
    await clientB.connect();

    server.on("Echo.reply", (params: any, cb: (r: any) => void) => {
      cb({ echoed: params.msg });
    });

    const [resultA, resultB] = await Promise.all([
      clientA.send("Echo.reply", { msg: "A" }),
      clientB.send("Echo.reply", { msg: "B" }),
    ]);

    expect(resultA).toEqual({ echoed: "A" });
    expect(resultB).toEqual({ echoed: "B" });

    clientA.close();
    clientB.close();
  });

  it("should propagate error codes from server", async () => {
    port++;
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    // Don't register handler — should return Method not found
    try {
      await client.send("NoSuch.method");
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.message).toContain("Method not found");
    }
  });

  it("should handle server disconnect and client events", async () => {
    port++;
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const closeEvents: number[] = [];
    client.onClose((code) => closeEvents.push(code));

    // Send a notification before closing
    server.notify("Shutdown.imminent", { reason: "test" });

    await new Promise((r) => setTimeout(r, 100));
    await server.close();
    server = null;

    // Wait for the close event to propagate
    await new Promise((r) => setTimeout(r, 100));
    expect(closeEvents.length).toBeGreaterThan(0);
  });
});
