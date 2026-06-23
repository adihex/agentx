import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  nowHHMMSS,
  parseReplCommand,
  AdpClient,
  STATUS_TERM_COLOR,
  STATUS_HEX,
  LOG_HEX,
} from "../src/index";

describe("agx-core helpers", () => {
  it("nowHHMMSS should return a valid time string", () => {
    const time = nowHHMMSS();
    expect(time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("parseReplCommand should parse valid commands", () => {
    expect(parseReplCommand("/pause 123")).toEqual({
      method: "Debugger.Pause",
      args: ["123"],
    });
    expect(parseReplCommand("/halt")).toEqual({
      method: "Debugger.Halt",
      args: [],
    });
  });

  it("parseReplCommand should return null for non-commands", () => {
    expect(parseReplCommand("hello")).toBeNull();
    expect(parseReplCommand("  ")).toBeNull();
  });

  it("colors and hex maps should be defined", () => {
    expect(STATUS_TERM_COLOR.running).toBe("yellow");
    expect(STATUS_HEX.success).toBe("#2ff801");
    expect(LOG_HEX.ERROR).toBe("#ffb4ab");
  });
});

describe("AdpClient (agnostic)", () => {
  let mockWs: any;

  beforeEach(() => {
    mockWs = {
      addEventListener: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
      readyState: 0, // CONNECTING
    };

    // Use a constructor function that is also a spy
    const MockWS = vi.fn().mockImplementation(function (this: any) {
      this.readyState = mockWs.readyState;
      return mockWs;
    });
    (MockWS as any).OPEN = 1;
    (MockWS as any).CLOSED = 3;
    (MockWS as any).CONNECTING = 0;

    vi.stubGlobal("WebSocket", MockWS);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("should connect and notify status", () => {
    const client = new AdpClient();
    const statusFn = vi.fn();
    client.onStatus(statusFn);
    client.connect();

    expect(global.WebSocket).toHaveBeenCalledWith("ws://localhost:9222");

    // Simulate open
    const openCallback = mockWs.addEventListener.mock.calls.find((c: any) => c[0] === "open")[1];
    openCallback();
    expect(statusFn).toHaveBeenCalledWith(true);
  });

  it("should handle messages and events", () => {
    const client = new AdpClient();
    const eventFn = vi.fn();
    client.onEvent(eventFn);
    client.connect();

    const messageCallback = mockWs.addEventListener.mock.calls.find(
      (c: any) => c[0] === "message",
    )[1];
    messageCallback({ data: JSON.stringify({ method: "Test.event" }) });

    expect(eventFn).toHaveBeenCalledWith({ method: "Test.event" });
  });

  it("should handle malformed messages gracefully", () => {
    const client = new AdpClient();
    const eventFn = vi.fn();
    client.onEvent(eventFn);
    client.connect();

    const messageCallback = mockWs.addEventListener.mock.calls.find(
      (c: any) => c[0] === "message",
    )[1];
    messageCallback({ data: "invalid json" });

    expect(eventFn).not.toHaveBeenCalled();
  });

  it("should attempt reconnection on close", () => {
    const client = new AdpClient();
    const statusFn = vi.fn();
    client.onStatus(statusFn);
    client.connect();

    const closeCallback = mockWs.addEventListener.mock.calls.find((c: any) => c[0] === "close")[1];
    closeCallback();

    expect(statusFn).toHaveBeenCalledWith(false);

    // Check reconnection attempt after 3s
    vi.advanceTimersByTime(3000);
    expect(global.WebSocket).toHaveBeenCalledTimes(2);
  });

  it("should send commands when open", () => {
    const client = new AdpClient();
    client.connect();
    mockWs.readyState = 1; // OPEN

    const sent = client.send({ method: "Halt", params: {} });
    expect(sent).toBe(true);
    expect(mockWs.send).toHaveBeenCalled();
  });

  it("should not send commands when closed", () => {
    const client = new AdpClient();
    client.connect();
    mockWs.readyState = 3; // CLOSED

    const sent = client.send({ method: "Halt", params: {} });
    expect(sent).toBe(false);
    expect(mockWs.send).not.toHaveBeenCalled();
  });

  it("should support destroying the client", () => {
    const client = new AdpClient();
    client.connect();
    client.destroy();

    expect(mockWs.close).toHaveBeenCalled();

    // Re-connect should be ignored
    client.connect();
    expect(global.WebSocket).toHaveBeenCalledTimes(1);
  });

  it("should support unregistering listeners", () => {
    const client = new AdpClient();
    const eventFn = vi.fn();
    const unregister = client.onEvent(eventFn);
    unregister();

    client.connect();
    const messageCallback = mockWs.addEventListener.mock.calls.find(
      (c: any) => c[0] === "message",
    )[1];
    messageCallback({ data: JSON.stringify({ method: "Test" }) });

    expect(eventFn).not.toHaveBeenCalled();
  });
});
