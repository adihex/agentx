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

  it("should pass the auth token as a query parameter", () => {
    const client = new AdpClient("ws://localhost:9222", { token: "sek rit/1" });
    client.connect();
    expect(global.WebSocket).toHaveBeenCalledWith(
      `ws://localhost:9222?token=${encodeURIComponent("sek rit/1")}`,
    );
  });

  it("should reuse the token on reconnect", () => {
    const client = new AdpClient("ws://localhost:9222", { token: "t" });
    client.connect();
    const closeCallback = mockWs.addEventListener.mock.calls.find(
      (c: any) => c[0] === "close",
    )[1];
    closeCallback();
    vi.advanceTimersByTime(3100);
    expect(global.WebSocket).toHaveBeenLastCalledWith("ws://localhost:9222?token=t");
  });
});

describe("AdpClient reconnect backoff", () => {
  let mockWs: any;

  const listener = (name: string) =>
    mockWs.addEventListener.mock.calls.filter((c: any) => c[0] === name).at(-1)![1];

  beforeEach(() => {
    mockWs = {
      addEventListener: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
      readyState: 0,
    };
    const MockWS = vi.fn().mockImplementation(function () {
      return mockWs;
    });
    (MockWS as any).OPEN = 1;
    vi.stubGlobal("WebSocket", MockWS);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("doubles the delay between consecutive failed reconnects", () => {
    const client = new AdpClient();
    client.connect();

    listener("close")(); // attempt 1 scheduled at +3s
    vi.advanceTimersByTime(3000);
    expect(global.WebSocket).toHaveBeenCalledTimes(2);

    listener("close")(); // attempt 2 scheduled at +6s
    vi.advanceTimersByTime(3000);
    expect(global.WebSocket).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(3000);
    expect(global.WebSocket).toHaveBeenCalledTimes(3);
  });

  it("caps the backoff at 30s", () => {
    const client = new AdpClient();
    client.connect();

    for (const ms of [3000, 6000, 12000, 24000]) {
      listener("close")();
      vi.advanceTimersByTime(ms);
    }
    expect(global.WebSocket).toHaveBeenCalledTimes(5);

    listener("close")(); // next delay would be 48s → capped at 30s
    vi.advanceTimersByTime(29999);
    expect(global.WebSocket).toHaveBeenCalledTimes(5);
    vi.advanceTimersByTime(1);
    expect(global.WebSocket).toHaveBeenCalledTimes(6);
  });

  it("resets the backoff after a successful open", () => {
    const client = new AdpClient();
    client.connect();

    listener("close")();
    vi.advanceTimersByTime(3000); // connect #2
    listener("close")();
    vi.advanceTimersByTime(6000); // connect #3
    listener("open")(); // successful open resets attempts
    listener("close")();
    vi.advanceTimersByTime(3000); // back to base delay
    expect(global.WebSocket).toHaveBeenCalledTimes(4);
  });

  it("destroy() cancels a pending reconnect", () => {
    const client = new AdpClient();
    client.connect();

    listener("close")();
    client.destroy();
    vi.advanceTimersByTime(60000);
    expect(global.WebSocket).toHaveBeenCalledTimes(1);
  });
});
