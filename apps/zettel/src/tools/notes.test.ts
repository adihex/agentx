import { beforeEach, describe, expect, it, vi } from "vitest";

const { traverseGraphStore } = vi.hoisted(() => ({
  traverseGraphStore: vi.fn(),
}));

vi.mock("../notes/store.js", () => ({
  addLink: vi.fn(),
  backlinksOf: vi.fn(),
  readNote: vi.fn(),
  searchNotes: vi.fn(),
  traverseGraphStore,
  writeNote: vi.fn(),
}));

import { traverseGraph, traverseGraphSchema } from "./notes.js";

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
