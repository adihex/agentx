/**
 * music-scanner-service — Unit tests for service entry point
 */
import { describe, it, expect, vi } from "vitest";

// We can't mock @agentx/core reliably because of workspace resolution.
// Instead, test the extracted constants and simulate the handler logic.

// The entry module guards its server boot behind NODE_ENV !== "test", so
// importing it here is side-effect free (no ADP port is bound).
import {
  MUSIC_SCANNER_SYSTEM_PROMPT,
  MUSIC_SCANNER_TOOLS,
  MUSIC_SCANNER_PORT,
  registerMusicCommands,
} from "../src/index.js";

describe("music-scanner-service/index.ts — constants", () => {
  it("MUSIC_SCANNER_SYSTEM_PROMPT contains workflow instructions", () => {
    expect(MUSIC_SCANNER_SYSTEM_PROMPT.length).toBeGreaterThan(0);
    expect(MUSIC_SCANNER_SYSTEM_PROMPT).toContain("searchMusic");
    expect(MUSIC_SCANNER_SYSTEM_PROMPT).toContain("downloadAndUpload");
    expect(MUSIC_SCANNER_SYSTEM_PROMPT).toContain("triggerCloudRun");
    expect(MUSIC_SCANNER_SYSTEM_PROMPT).toContain("guitar-processor");
  });

  it("MUSIC_SCANNER_TOOLS has all three tools", () => {
    expect(Object.keys(MUSIC_SCANNER_TOOLS)).toEqual([
      "searchMusic",
      "downloadAndUpload",
      "triggerCloudRun",
    ]);
    expect(MUSIC_SCANNER_TOOLS.searchMusic.name).toBe("searchMusic");
    expect(MUSIC_SCANNER_TOOLS.downloadAndUpload.name).toBe("downloadAndUpload");
    expect(MUSIC_SCANNER_TOOLS.triggerCloudRun.name).toBe("triggerCloudRun");
  });

  it("MUSIC_SCANNER_PORT defaults to 9222", () => {
    expect(MUSIC_SCANNER_PORT).toBe(9222);
  });
});

describe("music-scanner-service — registerMusicCommands", () => {
  interface FakeHost {
    commands: Map<string, (params: any, ctx: any) => void>;
    registerCommand: (method: string, handler: (params: any, ctx: any) => void) => void;
  }

  function fakeHost(): FakeHost {
    const commands = new Map<string, (params: any, ctx: any) => void>();
    return { commands, registerCommand: (m, h) => commands.set(m, h) };
  }

  function fakeCtx() {
    return {
      sessionId: "s1",
      session: { enqueuePrompt: vi.fn() },
      reply: vi.fn(),
      notify: vi.fn(),
    };
  }

  it("registers the Music.StartExtraction command", () => {
    const host = fakeHost();
    registerMusicCommands(host as any);
    expect(host.commands.has("Music.StartExtraction")).toBe(true);
  });

  it("rejects an empty song name without touching the session", () => {
    const host = fakeHost();
    registerMusicCommands(host as any);
    const ctx = fakeCtx();
    host.commands.get("Music.StartExtraction")!({}, ctx);

    expect(ctx.reply).toHaveBeenCalledWith({
      status: "error",
      message: "No song name provided",
    });
    expect(ctx.session.enqueuePrompt).not.toHaveBeenCalled();
  });

  it("seeds the caller's session conversation and acks on a valid song", () => {
    const host = fakeHost();
    registerMusicCommands(host as any);
    const ctx = fakeCtx();
    host.commands.get("Music.StartExtraction")!({ songName: "Hello" }, ctx);

    expect(ctx.notify).toHaveBeenCalledWith(
      "Music.Status",
      expect.objectContaining({ message: expect.stringContaining("Hello") }),
    );
    expect(ctx.session.enqueuePrompt).toHaveBeenCalledWith(expect.stringContaining("Hello"));
    expect(ctx.reply).toHaveBeenCalledWith({ status: "started" });
  });
});
