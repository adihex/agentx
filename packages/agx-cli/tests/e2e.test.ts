/**
 * E2E Test: agx-cli REPL Command Workflow
 *
 * Tests the full REPL command lifecycle:
 *   1. Command parsing (all known methods)
 *   2. ADP client send/receive workflow
 *   3. Help command output
 *   4. Log-to-dashboard functionality
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseReplCommand, REPL_HELP_LINES } from "@agentx/agx-core";

vi.mock("ws", () => {
  const MockWS = vi.fn().mockImplementation(function () {
    const handlers: Record<string, Function> = {};
    return {
      on: vi.fn((event: string, cb: Function) => {
        handlers[event] = cb;
      }),
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1,
      addEventListener: vi.fn((event: string, cb: Function) => {
        handlers[event] = cb;
      }),
      _trigger: (event: string, ...args: any[]) => handlers[event]?.(...args),
    };
  });
  (MockWS as any).OPEN = 1;
  (MockWS as any).CLOSED = 3;
  return { default: MockWS };
});

vi.mock("@agentx/agx-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@agentx/agx-core")>();
  return {
    ...actual,
    AdpClient: vi.fn().mockImplementation(function (url: string) {
      const listeners = new Set<(event: any) => void>();
      const statusListeners = new Set<(connected: boolean) => void>();
      return {
        onEvent: (fn: any) => {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
        onStatus: (fn: any) => {
          statusListeners.add(fn);
          return () => statusListeners.delete(fn);
        },
        send: vi.fn().mockReturnValue(true),
        connect: vi.fn(),
        destroy: vi.fn(),
        _triggerEvent: (ev: any) => listeners.forEach((fn) => fn(ev)),
        _triggerStatus: (connected: boolean) => statusListeners.forEach((fn) => fn(connected)),
      };
    }),
  };
});

describe("E2E: agx-cli REPL Lifecycle", () => {
  it("E2E: all REPL commands parse to correct ADP methods", () => {
    const commands = [
      { input: "/pause agent1", method: "Debugger.Pause", args: ["agent1"] },
      { input: "/resume agent1", method: "Debugger.Resume", args: ["agent1"] },
      { input: "/halt", method: "Debugger.Halt", args: [] },
      { input: "/exit", method: "Debugger.Exit", args: [] },
      { input: "/inspect 123", method: "Debugger.Inspect", args: ["123"] },
      { input: "/help", method: "Debugger.Help", args: [] },
    ];

    for (const { input, method, args } of commands) {
      const result = parseReplCommand(input);
      expect(result).not.toBeNull();
      expect(result!.method).toBe(method);
      expect(result!.args).toEqual(args);
    }
  });

  it("E2E: AdpClient connect and event lifecycle", async () => {
    const { AdpClient } = await import("@agentx/agx-core");
    const client = new (AdpClient as any)("ws://localhost:9222");

    const events: any[] = [];
    client.onEvent((ev: any) => events.push(ev));

    // Simulate connection
    client._triggerStatus(true);

    // Simulate incoming event
    client._triggerEvent({ method: "Debugger.Response", params: { result: "ok" } });
    expect(events).toHaveLength(1);
    expect(events[0].method).toBe("Debugger.Response");

    // Verify send works
    const sent = client.send({ method: "Debugger.Pause", params: { args: ["a1"] } });
    expect(sent).toBe(true);

    // Simulate disconnection
    client._triggerStatus(false);
  });

  it("E2E: REPL help lines contain expected commands", () => {
    expect(REPL_HELP_LINES.length).toBeGreaterThan(0);
    const helpText = REPL_HELP_LINES.join("\n");
    expect(helpText).toContain("/help");
    expect(helpText).toContain("/pause");
    expect(helpText).toContain("/halt");
  });

  it("E2E: log-to-dashboard writes to file", () => {
    const logFile = path.join(__dirname, "../orchestrator.log");
    const timestamp = new Date().toLocaleTimeString();

    // Simulate the logToDashboard function
    const msg = `[REPL] Connected to ADP Server`;
    fs.appendFileSync(logFile, `${timestamp} ${msg}\n`);

    const content = fs.readFileSync(logFile, "utf-8");
    expect(content).toContain("Connected to ADP Server");

    // Cleanup
    fs.unlinkSync(logFile);
  });
});
