import { describe, expect, it, vi } from "vitest";
import type { AdpClient } from "@agentx/agx-core";
import { REPL_HELP_LINES } from "@agentx/agx-core";
import {
  handleAdpEvent,
  handleReplInput,
  renderReplFeedback,
} from "../src/adp-repl";

const makeClient = (sendResult: boolean) => {
  const send = vi.fn().mockReturnValue(sendResult);
  return { client: { send } as unknown as AdpClient, send };
};

const fakeRl = () => ({ prompt: vi.fn() });

describe("handleReplInput", () => {
  it("flags /help for local rendering instead of sending it", () => {
    const { client, send } = makeClient(true);
    const res = handleReplInput("/help", client);
    expect(res).toEqual({ action: "continue", message: "help" });
    expect(send).not.toHaveBeenCalled();
  });

  it("exits on /exit and /quit", () => {
    const { client } = makeClient(true);
    expect(handleReplInput("/exit", client).action).toBe("exit");
    expect(handleReplInput("/quit", client).action).toBe("exit");
  });

  it("sends parsed commands and stays silent (server replies via Debugger.Response)", () => {
    const { client, send } = makeClient(true);
    const res = handleReplInput("/pause", client);
    expect(res.action).toBe("continue");
    expect(send).toHaveBeenCalledWith({
      method: "Debugger.Pause",
      params: { args: [] },
    });
    expect(renderReplFeedback(res)).toBeNull();
  });

  it("surfaces a send failure as printable feedback", () => {
    const { client } = makeClient(false);
    const res = handleReplInput("/pause", client);
    expect(res.action).toBe("error");
    expect(renderReplFeedback(res)).toMatch(/disconnect/i);
  });

  it("surfaces an unparseable command as printable feedback", () => {
    const { client } = makeClient(true);
    const res = handleReplInput("not-a-command", client);
    expect(res.action).toBe("error");
    expect(renderReplFeedback(res)).toMatch(/unknown command/i);
  });

  it("ignores blank input", () => {
    const { client, send } = makeClient(true);
    expect(handleReplInput("   ", client)).toEqual({ action: "continue" });
    expect(send).not.toHaveBeenCalled();
  });
});

describe("renderReplFeedback", () => {
  it("renders the shared help lines for /help", () => {
    const text = renderReplFeedback({ action: "continue", message: "help" });
    expect(text).toBe(REPL_HELP_LINES.join("\n"));
  });

  it("renders error messages verbatim", () => {
    expect(
      renderReplFeedback({ action: "error", message: "boom" }),
    ).toBe("boom");
  });

  it("renders nothing for plain continue/exit results", () => {
    expect(renderReplFeedback({ action: "continue" })).toBeNull();
    expect(renderReplFeedback({ action: "exit" })).toBeNull();
  });
});

describe("handleAdpEvent", () => {
  it("re-prompts on Debugger.Response frames", () => {
    const rl = fakeRl();
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((m) => logs.push(String(m)));
    handleAdpEvent(
      { method: "Debugger.Response", params: { result: { ok: 1 } } },
      rl as never,
    );
    expect(rl.prompt).toHaveBeenCalled();
    expect(logs.join("\n")).toContain('"ok":1');
    spy.mockRestore();
  });

  it("renders an error field instead of the raw params blob", () => {
    const rl = fakeRl();
    const logs: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((m) => logs.push(String(m)));
    handleAdpEvent(
      { method: "Debugger.Response", params: { error: "nope" } },
      rl as never,
    );
    expect(logs.join("\n")).toContain("error:");
    spy.mockRestore();
  });

  it("ignores non-response events", () => {
    const rl = fakeRl();
    handleAdpEvent({ method: "Agent.StatusUpdate", params: {} }, rl as never);
    expect(rl.prompt).not.toHaveBeenCalled();
  });
});
