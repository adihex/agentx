import { describe, expect, it, vi } from "vitest";
import { extractAndReplaceNoteGraph, extractNoteGraph } from "./graph-extraction.js";

describe("note graph extraction", () => {
  it("normalizes valid provider output into NoteGraphInput", async () => {
    const provider = {
      extractGraph: vi.fn().mockResolvedValue({
        entities: [
          { name: " Ada ", type: " person ", description: " mathematician " },
          { name: " Engine ", type: " machine ", description: "" },
        ],
        relations: [{ source: " Ada ", target: " Engine ", relationship: " designed " }],
      }),
    };

    await expect(extractNoteGraph(provider, "tenant-1", "note-1", "note text")).resolves.toEqual({
      entities: [
        { name: "Ada", type: "person", description: "mathematician" },
        { name: "Engine", type: "machine", description: "" },
      ],
      relations: [{ source: "Ada", target: "Engine", relationship: "designed" }],
    });
  });

  it("rejects malformed provider output", async () => {
    const provider = { extractGraph: vi.fn().mockResolvedValue({ entities: "Ada", relations: [] }) };

    await expect(extractNoteGraph(provider, "tenant-1", "note-1", "text")).rejects.toThrow();
  });

  it("rejects relations whose normalized endpoints are absent", async () => {
    const provider = {
      extractGraph: vi.fn().mockResolvedValue({
        entities: [{ name: "Ada", type: "person", description: "" }],
        relations: [{ source: "Ada", target: "Engine", relationship: "designed" }],
      }),
    };

    await expect(extractNoteGraph(provider, "tenant-1", "note-1", "text")).rejects.toThrow(
      "relation endpoint",
    );
  });

  it("forwards tenant, note, and text to the provider and persistence boundary", async () => {
    const graph = { entities: [], relations: [] };
    const provider = { extractGraph: vi.fn().mockResolvedValue(graph) };
    const replaceGraph = vi.fn().mockResolvedValue(undefined);

    await extractAndReplaceNoteGraph("tenant-7", "note-9", "full note", provider, replaceGraph);

    expect(provider.extractGraph).toHaveBeenCalledWith({
      userId: "tenant-7",
      noteId: "note-9",
      text: "full note",
    });
    expect(replaceGraph).toHaveBeenCalledWith("tenant-7", "note-9", graph);
  });

  it("does not persist when extraction fails", async () => {
    const provider = { extractGraph: vi.fn().mockRejectedValue(new Error("model unavailable")) };
    const replaceGraph = vi.fn();

    await expect(
      extractAndReplaceNoteGraph("tenant-1", "note-1", "text", provider, replaceGraph),
    ).rejects.toThrow("model unavailable");
    expect(replaceGraph).not.toHaveBeenCalled();
  });
});
