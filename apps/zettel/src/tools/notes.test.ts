/**
 * Zettel note-tool tests: create/link/search/read/graph traversal against a
 * real sqlite store isolated via ZETTEL_DIR.
 */
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect } from "vitest";

const testDir = path.join(os.tmpdir(), "agentx-zettel-tools-test-" + Date.now());
mkdirSync(testDir, { recursive: true });
process.env.ZETTEL_DIR = testDir;
delete process.env.GROQ_API_KEY;

const { createNote, linkNotes, searchNotes, getNote, traverseGraph, listNotes } = await import("./notes.js");
const { readNote, replaceNoteGraph } = await import("../notes/store.js");

const userId = "tools-test-" + Date.now();

describe("zettel note tools", () => {
  let noteA = "";
  let noteB = "";

  it("createNote returns the new note id and persists it", async () => {
    const res = await createNote({
      userId,
      content: "Apples are delicious fruits.",
      title: "About Apples",
      tags: ["apples", "fruit"],
    });
    expect(res).toMatchObject({ success: true });
    if (!("id" in res) || !res.id) throw new Error("expected id");
    noteA = res.id;
    expect((await readNote(userId, noteA))?.title).toBe("About Apples");
  });

  it("createNote still succeeds when graph indexing fails", async () => {
    process.env.GROQ_API_KEY = "present-but-unusable";
    try {
      const res = await createNote({ userId, content: "Oranges are citrus fruits." });
      expect(res).toMatchObject({ success: true });
    } finally {
      delete process.env.GROQ_API_KEY;
    }
  });

  it("getNote reports a missing note", async () => {
    const res = await getNote({ userId, id: "does-not-exist" });
    expect(res.note).toBeNull();
    expect(res.error).toContain("not found");
  });

  it("linkNotes records backlinks visible via getNote", async () => {
    const created = await createNote({ userId, content: "Backlink target body." });
    if (!("id" in created) || !created.id) throw new Error("expected id");
    noteB = created.id;
    expect(await linkNotes({ userId, fromId: noteA, toId: noteB })).toEqual({ ok: true });
    const res = await getNote({ userId, id: noteB });
    expect(res.backlinks).toContain(noteA);
  });

  it("searchNotes matches titles", async () => {
    const res = await searchNotes({ userId, query: "Apples" });
    expect(res.results.some((r) => r.id === noteA)).toBe(true);
  });

  it("traverseGraph walks seeded entity relations", async () => {
    await replaceNoteGraph(userId, noteA, {
      entities: [
        { name: "Apple", type: "fruit", description: "a fruit" },
        { name: "Orchard", type: "place", description: "where apples grow" },
      ],
      relations: [{ source: "Apple", target: "Orchard", relationship: "grows_in" }],
    });
    const res = await traverseGraph({ userId, entityName: "Apple" });
    expect(res.success).toBe(true);
    if (!res.result) throw new Error("expected result");
    expect(res.result.entities).toContain("Orchard");
    expect(res.result.relations).toContainEqual(
      expect.objectContaining({ source: "Apple", target: "Orchard" }),
    );
  });

  it("traverseGraph returns empty for an unknown entity", async () => {
    const res = await traverseGraph({ userId, entityName: "NoSuchEntity" });
    expect(res).toMatchObject({ success: true, result: { entities: [], relations: [] } });
  });

  it("listNotes returns compact rows and honours the limit", async () => {
    const res = await listNotes({ userId });
    expect(res.notes.length).toBeGreaterThanOrEqual(2);
    expect(res.notes.map((n) => n.id)).toContain(noteA);
    expect(res.notes[0]).not.toHaveProperty("body");
    const limited = await listNotes({ userId, limit: 1 });
    expect(limited.notes).toHaveLength(1);
  });

  it("rejects invalid input at the schema boundary", async () => {
    await expect(traverseGraph({ userId, entityName: "x", depth: 10 })).rejects.toThrow();
  });
});
