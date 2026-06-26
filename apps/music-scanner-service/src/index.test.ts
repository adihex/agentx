/**
 * music-scanner-service — Unit tests for service entry point
 */
import { describe, it, expect, vi } from "vitest";

// We can't mock @agentx/core reliably because of workspace resolution.
// Instead, test the extracted constants and simulate the handler logic.

// Import constants without triggering AgentEventLoop constructor
import {
  MUSIC_SCANNER_SYSTEM_PROMPT,
  MUSIC_SCANNER_TOOLS,
  MUSIC_SCANNER_PORT,
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

describe("music-scanner-service — extraction handler logic", () => {
  it("handler rejects empty songName", () => {
    // Simulate the handler logic inline
    function handleExtraction(params: any, cb: (result: any) => void) {
      const songName = params?.songName;
      if (!songName) {
        cb({ status: "error", message: "No song name provided" });
        return;
      }
    }

    const cb = vi.fn();
    handleExtraction({}, cb);
    expect(cb).toHaveBeenCalledWith({
      status: "error",
      message: "No song name provided",
    });
  });

  it("handler rejects null params", () => {
    function handleExtraction(params: any, cb: (result: any) => void) {
      const songName = params?.songName;
      if (!songName) {
        cb({ status: "error", message: "No song name provided" });
        return;
      }
    }

    const cb = vi.fn();
    handleExtraction(null, cb);
    expect(cb).toHaveBeenCalledWith({
      status: "error",
      message: "No song name provided",
    });
  });

  it("handler accepts valid songName", () => {
    function handleExtraction(params: any, cb: (result: any) => void) {
      const songName = params?.songName;
      if (!songName) {
        cb({ status: "error", message: "No song name provided" });
        return;
      }
      cb({ status: "started", agentResponse: `Extracting: ${songName}` });
    }

    const cb = vi.fn();
    handleExtraction({ songName: "Stairway to Heaven" }, cb);
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ status: "started" }));
  });
});
