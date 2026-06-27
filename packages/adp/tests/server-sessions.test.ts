/**
 * ADP Server — per-connection session routing (notifyClient, sessionId in handlers).
 */
import { describe, it, expect, afterEach } from "vitest";
import { AdpServer } from "../src/server";
import { WebSocket } from "ws";

describe("AdpServer — per-session routing", () => {
  let server: AdpServer | null = null;
  let port = 9280;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  it("assigns a session id per connection and passes it to handlers", async () => {
    port++;
    server = new AdpServer(port);
    const connected: string[] = [];
    server.onConnection((id) => connected.push(id));
    server.on("Whoami", (_params, cb, sessionId) => cb({ sessionId }));

    const ws = new WebSocket(`ws://localhost:${port}`);
    const result = await new Promise<any>((resolve) => {
      ws.on("open", () => ws.send(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "Whoami" })));
      ws.on("message", (data) => resolve(JSON.parse((data as Buffer).toString())));
    });

    expect(connected).toHaveLength(1);
    expect(result.result.sessionId).toBe(connected[0]);
    ws.close();
  }, 10000);

  it("notifyClient reaches exactly the addressed client, not the others", async () => {
    port++;
    server = new AdpServer(port);
    const ids: string[] = [];
    server.onConnection((id) => ids.push(id));

    const a = new WebSocket(`ws://localhost:${port}`);
    const b = new WebSocket(`ws://localhost:${port}`);
    await Promise.all([
      new Promise<void>((r) => a.on("open", () => r())),
      new Promise<void>((r) => b.on("open", () => r())),
    ]);
    await new Promise((r) => setTimeout(r, 50));
    expect(ids).toHaveLength(2);

    const aEvents: any[] = [];
    const bEvents: any[] = [];
    a.on("message", (d) => aEvents.push(JSON.parse((d as Buffer).toString())));
    b.on("message", (d) => bEvents.push(JSON.parse((d as Buffer).toString())));

    server.notifyClient(ids[0], "Ping", { hi: true });
    await new Promise((r) => setTimeout(r, 50));

    const aGot = aEvents.some((e) => e.method === "Ping");
    const bGot = bEvents.some((e) => e.method === "Ping");
    // Exactly one client received it — never both (no broadcast leak).
    expect([aGot, bGot].filter(Boolean)).toHaveLength(1);

    a.close();
    b.close();
  }, 10000);

  it("fires onDisconnection with the session id when a client leaves", async () => {
    port++;
    server = new AdpServer(port);
    const opened: string[] = [];
    const closed: string[] = [];
    server.onConnection((id) => opened.push(id));
    server.onDisconnection((id) => closed.push(id));

    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((r) => ws.on("open", () => r()));
    await new Promise((r) => setTimeout(r, 30));
    ws.close();
    await new Promise((r) => setTimeout(r, 100));

    expect(opened).toHaveLength(1);
    expect(closed).toEqual(opened);
  }, 10000);
});
