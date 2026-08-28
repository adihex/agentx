import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createDefaultGraphModelProvider, extractAndReplaceNoteGraph, traverseGraphStore, writeNote } =
  vi.hoisted(() => ({
    createDefaultGraphModelProvider: vi.fn(),
    extractAndReplaceNoteGraph: vi.fn(),
    traverseGraphStore: vi.fn(),
    writeNote: vi.fn(),
  }));

vi.mock("../notes/graph-extraction.js", () => ({ extractAndReplaceNoteGraph }));
vi.mock("../notes/graph-model-provider.js", () => ({ createDefaultGraphModelProvider }));

vi.mock("../notes/store.js", () => ({
  addLink: vi.fn(),
  backlinksOf: vi.fn(),
  readNote: vi.fn(),
  searchNotes: vi.fn(),
  traverseGraphStore,
  writeNote,
}));

import { createNote, traverseGraph, traverseGraphSchema } from "./notes.js";

describe("createNote graph indexing", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    createDefaultGraphModelProvider.mockReset();
    extractAndReplaceNoteGraph.mockReset();
    writeNote.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("indexes a successfully created note for the owning tenant", async () => {
    const provider = { extractGraph: vi.fn() };
    createDefaultGraphModelProvider.mockReturnValue(provider);
    writeNote.mockResolvedValue({ id: "note-1" });
    extractAndReplaceNoteGraph.mockResolvedValue({ entities: [], relations: [] });

    await expect(createNote({ content: "Ada designed an engine.", userId: "tenant-a" })).resolves.toEqual({
      success: true,
      id: "note-1",
    });
    expect(extractAndReplaceNoteGraph).toHaveBeenCalledWith(
      "tenant-a",
      "note-1",
      "Ada designed an engine.",
      provider,
    );
  });

  it("keeps the captured note when graph extraction fails", async () => {
    createDefaultGraphModelProvider.mockReturnValue({ extractGraph: vi.fn() });
    writeNote.mockResolvedValue({ id: "note-2" });
    extractAndReplaceNoteGraph.mockRejectedValue(new Error("model unavailable"));

    await expect(createNote({ content: "A durable note." })).resolves.toEqual({
      success: true,
      id: "note-2",
    });
  });

  it("does not call the model when graph extraction is not configured", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    writeNote.mockResolvedValue({ id: "note-3" });

    await expect(createNote({ content: "An offline note." })).resolves.toEqual({
      success: true,
      id: "note-3",
    });
    expect(createDefaultGraphModelProvider).not.toHaveBeenCalled();
    expect(extractAndReplaceNoteGraph).not.toHaveBeenCalled();
  });
});

describe("traverseGraph tool", () => {
  beforeEach(() => {
    traverseGraphStore.mockReset();
  });

  it("returns a successful graph traversal", async () => {
    const result = {
      entities: ["Alpha", "Beta"],
      relations: [
        { source: "Alpha", target: "Beta", relationship: "connects", noteId: "note-1" },
      ],
    };
    traverseGraphStore.mockResolvedValue(result);

    await expect(traverseGraph({ entityName: "Alpha", depth: 3, userId: "tenant-a" })).resolves.toEqual({
      success: true,
      result,
    });
    expect(traverseGraphStore).toHaveBeenCalledWith("tenant-a", "Alpha", 3);
  });

  it("forwards the tenant and uses defaults for omitted userId and depth", async () => {
    traverseGraphStore.mockResolvedValue({ entities: [], relations: [] });

    await traverseGraph({ entityName: "Alpha" });

    expect(traverseGraphStore).toHaveBeenCalledWith("default", "Alpha", 2);
  });

  it("validates traversal depth bounds", () => {
    expect(traverseGraphSchema.safeParse({ entityName: "Alpha", depth: 1 }).success).toBe(true);
    expect(traverseGraphSchema.safeParse({ entityName: "Alpha", depth: 5 }).success).toBe(true);
    expect(traverseGraphSchema.safeParse({ entityName: "Alpha", depth: 0 }).success).toBe(false);
    expect(traverseGraphSchema.safeParse({ entityName: "Alpha", depth: 6 }).success).toBe(false);
  });

  it("returns a failure when the graph store throws", async () => {
    traverseGraphStore.mockRejectedValue(new Error("database unavailable"));

    await expect(traverseGraph({ entityName: "Alpha", userId: "tenant-a" })).resolves.toEqual({
      success: false,
      error: "database unavailable",
    });
  });
});
