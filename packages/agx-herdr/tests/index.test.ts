/**
 * agx-herdr — Unit tests for HerdrClient and extracted functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as os from "node:os";
import * as path from "node:path";

// Mock ws for modules that import it
vi.mock("ws", () => {
  const MockWS = vi.fn().mockImplementation(function () {
    return { on: vi.fn(), send: vi.fn(), close: vi.fn(), readyState: 1 };
  });
  (MockWS as any).OPEN = 1;
  return { default: MockWS };
});

import { HerdrClient, resolveSocketPath } from "../src/herdr-client";

describe("agx-herdr herdr-client", () => {
  it("resolveSocketPath returns explicit env var", () => {
    const prev = process.env.HERDR_SOCKET_PATH;
    process.env.HERDR_SOCKET_PATH = "/custom/herdr.sock";
    expect(resolveSocketPath()).toBe("/custom/herdr.sock");
    process.env.HERDR_SOCKET_PATH = prev;
  });

  it("resolveSocketPath returns default config-based path", () => {
    const prevSock = process.env.HERDR_SOCKET_PATH;
    const prevSession = process.env.HERDR_SESSION;
    const prevXDG = process.env.XDG_CONFIG_HOME;
    delete process.env.HERDR_SOCKET_PATH;
    delete process.env.HERDR_SESSION;
    delete process.env.XDG_CONFIG_HOME;

    const result = resolveSocketPath();
    const configDir = path.join(os.homedir(), ".config");
    expect(result).toBe(path.join(configDir, "herdr", "herdr.sock"));

    process.env.HERDR_SOCKET_PATH = prevSock;
    process.env.HERDR_SESSION = prevSession;
    process.env.XDG_CONFIG_HOME = prevXDG;
  });

  it("resolveSocketPath returns session-specific path with argument", () => {
    const prevSock = process.env.HERDR_SOCKET_PATH;
    const prevXDG = process.env.XDG_CONFIG_HOME;
    delete process.env.HERDR_SOCKET_PATH;
    process.env.XDG_CONFIG_HOME = "/xdg";

    const result = resolveSocketPath("my-session");
    expect(result).toBe("/xdg/herdr/sessions/my-session/herdr.sock");

    process.env.HERDR_SOCKET_PATH = prevSock;
    process.env.XDG_CONFIG_HOME = prevXDG;
  });

  it("resolveSocketPath returns session-specific path from env var", () => {
    const prevSock = process.env.HERDR_SOCKET_PATH;
    const prevSession = process.env.HERDR_SESSION;
    const prevXDG = process.env.XDG_CONFIG_HOME;
    delete process.env.HERDR_SOCKET_PATH;
    process.env.HERDR_SESSION = "env-session";
    process.env.XDG_CONFIG_HOME = "/xdg";

    const result = resolveSocketPath();
    expect(result).toBe("/xdg/herdr/sessions/env-session/herdr.sock");

    process.env.HERDR_SOCKET_PATH = prevSock;
    process.env.HERDR_SESSION = prevSession;
    process.env.XDG_CONFIG_HOME = prevXDG;
  });

  it("HerdrClient is a constructor", () => {
    expect(typeof HerdrClient).toBe("function");
    expect(HerdrClient.prototype).toBeDefined();
  });

  it("HerdrClient can be instantiated", () => {
    const client = new HerdrClient("/tmp/herdr.sock");
    expect(client).toBeInstanceOf(HerdrClient);
    expect(client).toBeDefined();
  });

  it("HerdrClient instance has expected methods", () => {
    const client = new HerdrClient("/tmp/test.sock");
    expect(typeof client.connect).toBe("function");
    expect(typeof client.request).toBe("function");
    expect(typeof client.close).toBe("function");
  });
});
