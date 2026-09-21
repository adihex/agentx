import { describe, it, expect, afterEach } from "vitest";
import { AdpClient } from "../src/client";
import { AdpServer } from "../src/server";

const BASE_PORT = 9700;
let port = BASE_PORT;

const servers: AdpServer[] = [];
const clients: AdpClient[] = [];

function makeServer(p: number): AdpServer {
  const s = new AdpServer(p);
  servers.push(s);
  return s;
}

function makeClient(url: string, opts?: { timeoutMs?: number }): AdpClient {
  const c = new AdpClient(url, opts);
  clients.push(c);
  return c;
}

afterEach(async () => {
  for (const c of clients.splice(0)) c.close();
  for (const s of servers.splice(0)) await s.close();
});

describe("AdpClient pending-request hardening", () => {
  it("rejects a pending send when the server closes the connection", async () => {
    const p = port++;
    const server = makeServer(p);
    server.on("Never.Replies", () => {
      // intentionally never calls back
    });

    const client = makeClient(`ws://localhost:${p}`);
    await client.waitForOpen();

    const pending = client.send("Never.Replies");
    const assertion = expect(pending).rejects.toThrow("closed");

    // Give the request a tick to arrive, then drop the socket.
    await new Promise((r) => setTimeout(r, 20));
    await server.close();
    servers.splice(servers.indexOf(server), 1);

    await assertion;
  });

  it("rejects a pending send when the client closes the socket", async () => {
    const p = port++;
    const server = makeServer(p);
    server.on("Never.Replies", () => {});

    const client = makeClient(`ws://localhost:${p}`);
    await client.waitForOpen();

    const pending = client.send("Never.Replies");
    const assertion = expect(pending).rejects.toThrow("closed");
    client.close();
    await assertion;
  });

  it("rejects a send that exceeds its per-call timeout", async () => {
    const p = port++;
    const server = makeServer(p);
    server.on("Never.Replies", () => {});

    const client = makeClient(`ws://localhost:${p}`);
    await client.waitForOpen();

    await expect(client.send("Never.Replies", undefined, { timeoutMs: 50 })).rejects.toThrow(
      /timed out.*Never\.Replies/,
    );

    // The client stays usable after the timed-out request is reaped.
    server.on("Ping.Pong", (_params, cb) => cb({ ok: true }));
    await expect(client.send<{ ok: boolean }>("Ping.Pong")).resolves.toEqual({ ok: true });
  });

  it("applies the constructor timeoutMs as the default", async () => {
    const p = port++;
    const server = makeServer(p);
    server.on("Never.Replies", () => {});

    const client = makeClient(`ws://localhost:${p}`, { timeoutMs: 50 });
    await client.waitForOpen();

    await expect(client.send("Never.Replies")).rejects.toThrow(/timed out/);
  });

  it("retries while the server bind is still coming up", async () => {
    const p = port++;
    // Connect before anything listens — the first attempt is refused, but the
    // retry window should catch a server that binds shortly after.
    const c = makeClient(`ws://localhost:${p}`);
    await new Promise((r) => setTimeout(r, 150));
    const server = makeServer(p);
    server.on("Ping.Pong", (_params, cb) => cb({ ok: true }));
    await c.waitForOpen();
    expect(c.isOpen).toBe(true);
    const res = await c.send<{ ok: true }>("Ping.Pong", {});
    expect(res).toEqual({ ok: true });
  });

  it("rejects waitForOpen when the connection is refused", async () => {
    const client = makeClient("ws://localhost:1");
    await expect(client.waitForOpen()).rejects.toThrow();
  });

  it("rejects send immediately once the socket is closed", async () => {
    const p = port++;
    makeServer(p);
    const client = makeClient(`ws://localhost:${p}`);
    await client.waitForOpen();
    client.close();
    await new Promise((r) => setTimeout(r, 30));
    await expect(client.send("Ping.Pong")).rejects.toThrow("not open");
  });
});
