import { describe, it, expect, vi } from "vitest";
import {
  createMusicScannerAgent,
  registerExtractionHandler,
  MUSIC_SCANNER_TOOLS,
} from "./index.js";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);

describe("Music Scanner Service Core Integration", () => {
  it("should initialize the agent with the correct prompt and tools", () => {
    const agent = createMusicScannerAgent({ adpPort: 19999 });
    expect(agent).toBeDefined();
    expect(agent.adp).toBeDefined();
  });

  it("should have all registered tools point to valid modules and exports", async () => {
    for (const [name, tool] of Object.entries(MUSIC_SCANNER_TOOLS)) {
      expect(tool.name).toBe(name);
      expect(tool.modulePath).toBeDefined();
      expect(tool.exportName).toBeDefined();

      // Dynamically import the tool module to verify exportName exists and is a function
      const mod = await jiti.import<any>(tool.modulePath);
      const fn = mod[tool.exportName];
      expect(typeof fn).toBe("function");
    }
  });

  it("should register the Music.StartExtraction handler and execute properly", async () => {
    const mockAgent = {
      adp: {
        on: vi.fn(),
        notify: vi.fn(),
      },
      run: vi.fn().mockResolvedValue("Extraction complete result"),
    };

    registerExtractionHandler(mockAgent as any);

    // Verify it listens to the correct event name
    expect(mockAgent.adp.on).toHaveBeenCalledWith("Music.StartExtraction", expect.any(Function));

    // Retrieve the callback function registered
    const handler = mockAgent.adp.on.mock.calls[0][1];

    // Trigger handler and verify callback response
    const cb = vi.fn();
    await handler({ songName: "Mock Song" }, cb);

    expect(mockAgent.adp.notify).toHaveBeenCalledWith("Music.Status", {
      message: 'Searching for "Mock Song"...',
    });
    expect(mockAgent.run).toHaveBeenCalledWith(
      "Please extract the guitar from the song: Mock Song",
    );
    expect(cb).toHaveBeenCalledWith({
      status: "started",
      agentResponse: "Extraction complete result",
    });
  });

  it("should handle missing songName gracefully in extraction handler", async () => {
    const mockAgent = {
      adp: {
        on: vi.fn(),
        notify: vi.fn(),
      },
      run: vi.fn(),
    };

    registerExtractionHandler(mockAgent as any);
    const handler = mockAgent.adp.on.mock.calls[0][1];

    const cb = vi.fn();
    await handler({}, cb);

    expect(cb).toHaveBeenCalledWith({
      status: "error",
      message: "No song name provided",
    });
    expect(mockAgent.run).not.toHaveBeenCalled();
  });
});
