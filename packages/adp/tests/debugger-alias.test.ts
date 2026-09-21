import { describe, it, expect, afterEach, vi } from "vitest";
import { AdpServer } from "../src/server";
import { AdpClient } from "../src/client";

/**
 * The REPL/TUI frontends send `Debugger.<Verb>` commands (see
 * `parseReplCommand` in @agentx/agx-core). The server resolves them onto
 * canonical ADP domains and pushes a `Debugger.Response` event so those
 * clients — which never correlate bare JSON-RPC responses — see results.
 */
let port = 9830;
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

describe("Debugger.* legacy command aliases", () => {
  it("Debugger.Pause reaches the Metacognition.pause handler and pushes Debugger.Response", async () => {
    const p = port++;
    const server = makeServer({ port: p });
    server.on("Metacognition.pause", (_params, cb) => cb({ paused: true }));

    const client = makeClient(`ws://localhost:${p}`);
    await client.waitForOpen();

    const events: Array<{ method: string; params?: unknown }> = [];
    client.onEvent((method, params) => events.push({ method, params }));

    const result = await client.send("Debugger.Pause", { args: [] });
    expect(result).toEqual({ paused: true });

    await vi.waitFor(() => {
      expect(events).toContainEqual({
        method: "Debugger.Response",
        params: { method: "Debugger.Pause", result: { paused: true } },
      });
    });
  });

  it("unmapped Debugger.* verbs get -32601 plus a Debugger.Response error event", async () => {
    const p = port++;
    makeServer({ port: p });

    const client = makeClient(`ws://localhost:${p}`);
    await client.waitForOpen();

    const events: Array<{ method: string; params?: unknown }> = [];
    client.onEvent((method, params) => events.push({ method, params }));

    await expect(client.send("Debugger.Bogus")).rejects.toThrow(
      "Method not found: Debugger.Bogus",
    );

    await vi.waitFor(() => {
      expect(events).toContainEqual({
        method: "Debugger.Response",
        params: { method: "Debugger.Bogus", error: "Method not found: Debugger.Bogus" },
      });
    });
  });

  it("canonical methods do not push a Debugger.Response event", async () => {
    const p = port++;
    const server = makeServer({ port: p });
    server.on("Ping.Pong", (_params, cb) => cb("pong"));

    const client = makeClient(`ws://localhost:${p}`);
    await client.waitForOpen();

    const events: string[] = [];
    client.onEvent((method) => events.push(method));

    await expect(client.send("Ping.Pong")).resolves.toBe("pong");
    await new Promise((r) => setTimeout(r, 30));
    expect(events).toHaveLength(0);
  });

  it("a scoped principal's aliases are checked against the resolved domain", async () => {
    const p = port++;
    const server = makeServer({
      port: p,
      authToken: [{ token: "t", scopes: ["Metacognition."] }],
    });
    server.on("Metacognition.pause", (_params, cb) => cb({ paused: true }));
    server.on("Inference.halt", (_params, cb) => cb("halted"));

    const client = makeClient(`ws://localhost:${p}`, { token: "t" });
    await client.waitForOpen();

    // Debugger.Pause resolves to Metacognition.pause → permitted scope.
    await expect(client.send("Debugger.Pause", {})).resolves.toEqual({ paused: true });
    // Debugger.Halt resolves to Inference.halt → outside the scope.
    await expect(client.send("Debugger.Halt", {})).rejects.toThrow(
      "Method not permitted: Debugger.Halt",
    );
  });
});
