/**
 * agx-core Coverage — AdpClient edge paths
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AdpClient } from "../src/index";

describe("AdpClient — destroyed guards", () => {
  let mockWs: any;

  beforeEach(() => {
    mockWs = {
      addEventListener: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
      readyState: 0,
    };

    const MockWS = vi.fn().mockImplementation(function (this: any) {
      this.readyState = mockWs.readyState;
      return mockWs;
    });
    (MockWS as any).OPEN = 1;
    (MockWS as any).CLOSED = 3;

    vi.stubGlobal("WebSocket", MockWS);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("should not fire status listeners after destroy even if open event fires", () => {
    const client = new AdpClient();
    const statusFn = vi.fn();
    client.onStatus(statusFn);
    client.connect();
    client.destroy();

    // open event fires after destroy
    const openCallback = mockWs.addEventListener.mock.calls.find((c: any) => c[0] === "open")[1];
    openCallback();
    expect(statusFn).not.toHaveBeenCalled();
  });

  it("should not fire status listeners after destroy on close event", () => {
    const client = new AdpClient();
    const statusFn = vi.fn();
    client.onStatus(statusFn);
    client.connect();
    client.destroy();

    // close event fires after destroy
    const closeCallback = mockWs.addEventListener.mock.calls.find((c: any) => c[0] === "close")[1];
    closeCallback();
    expect(statusFn).not.toHaveBeenCalled();
  });

  it("should ignore reconnect after destroy", () => {
    const client = new AdpClient();
    client.connect();
    client.destroy();
    expect(mockWs.close).toHaveBeenCalled();

    // Attempt reconnect — should be ignored
    client.connect();
    // WebSocket should only have been constructed once
    expect(global.WebSocket).toHaveBeenCalledTimes(1);
  });

  it("should handle send when closing", () => {
    const client = new AdpClient();
    client.connect();
    mockWs.readyState = 2; // CLOSING

    const sent = client.send({ method: "Halt", params: {} });
    expect(sent).toBe(false);
  });
});
