import { describe, it, expect, afterEach } from "vitest";
import { AdpClient } from "../src/client";
import { AdpServer } from "../src/server";

const BASE_PORT = 9800;
let port = BASE_PORT;

const servers: AdpServer[] = [];
const clients: AdpClient[] = [];

function makeServer(opts: ConstructorParameters<typeof AdpServer>[0]): AdpServer {
  const s = new AdpServer(opts);
  servers.push(s);
  return s;
}

function makeClient(url: string, opts?: ConstructorParameters<typeof AdpClient>[1]): AdpClient {
  const c = new AdpClient(url, opts);
  clients.push(c);
  return c;
}

afterEach(async () => {
  for (const c of clients.splice(0)) c.close();
  for (const s of servers.splice(0)) await s.close();
});

describe("ADP transport security", () => {
  it("binds to loopback only by default", async () => {
    const p = port++;
    const server = makeServer(p);
    // The underlying ws server must be told to bind loopback (default 0.0.0.0
    // would expose the control plane on every interface).
    const wss = (server as unknown as { wss: { options: { host?: string } } }).wss;
    expect(wss.options.host).toBe("127.0.0.1");
  });

  it("rejects unauthenticated clients when authToken is set", async () => {
    const p = port++;
    const server = makeServer({ port: p, authToken: "s3cret" });
    server.on("Ping.Pong", (_params, cb) => cb("pong"));

    const client = makeClient(`ws://localhost:${p}`);
    // The handshake is refused before the socket opens.
    await expect(client.waitForOpen()).rejects.toThrow();
  });

  it("accepts clients presenting the token via Authorization header", async () => {
    const p = port++;
    const server = makeServer({ port: p, authToken: "s3cret" });
    server.on("Ping.Pong", (_params, cb) => cb("pong"));

    const client = makeClient(`ws://localhost:${p}`, { token: "s3cret" });
    await client.waitForOpen();
    await expect(client.send<string>("Ping.Pong")).resolves.toBe("pong");
  });

  it("accepts clients presenting the token via query param", async () => {
    const p = port++;
    const server = makeServer({ port: p, authToken: "s3cret" });
    server.on("Ping.Pong", (_params, cb) => cb("pong"));

    const client = makeClient(`ws://localhost:${p}?token=s3cret`);
    await client.waitForOpen();
    await expect(client.send<string>("Ping.Pong")).resolves.toBe("pong");
  });

  it("rejects a wrong token", async () => {
    const p = port++;
    makeServer({ port: p, authToken: "s3cret" });
    const client = makeClient(`ws://localhost:${p}?token=wrong`);
    await expect(client.waitForOpen()).rejects.toThrow();
  });

  it("drops connections that exceed the payload limit", async () => {
    const p = port++;
    const server = makeServer({ port: p, maxPayloadBytes: 256 });
    server.on("Echo.Back", (_params, cb) => cb("ok"));

    const client = makeClient(`ws://localhost:${p}`);
    await client.waitForOpen();

    // A frame larger than maxPayloadBytes kills the socket; the pending
    // send must reject rather than hang.
    await expect(
      client.send("Echo.Back", { blob: "x".repeat(4096) }),
    ).rejects.toThrow("closed");
  });
});
