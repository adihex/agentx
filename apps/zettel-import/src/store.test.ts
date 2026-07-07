/**
 * Smoke test for NoteStore — verifies the Kysely-backed store works
 * end-to-end with a local SQLite database (no external services needed).
 */

import { describe, it, expect, beforeAll, afterAll, vi, afterEach } from "vitest";
import { NoteStore } from "./store";
import { createClient } from "@libsql/client";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Mock the ai module so we can test the embedding + graph code paths
// without needing a real Gemini API key.
vi.mock("ai", () => ({
  embed: vi.fn(),
  generateObject: vi.fn(),
}));

import { embed, generateObject } from "ai";

const DB_PATH = path.join(os.tmpdir(), "zettel-import-smoke-test.db");
const USER_ID = "test-user";

describe("NoteStore smoke test", () => {
  let store: NoteStore;

  beforeAll(async () => {
    try {
      fs.unlinkSync(DB_PATH);
    } catch {
      /* ok */
    }
    store = new NoteStore({ url: `file:${DB_PATH}` });
  });

  afterAll(async () => {
    await store.destroy();
    try {
      fs.unlinkSync(DB_PATH);
    } catch {
      /* ok */
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("verifies the database connection", async () => {
    await expect(store.verifyConnection()).resolves.toBeUndefined();
  });

  it("creates all expected tables in the database", async () => {
    const raw = createClient({ url: `file:${DB_PATH}` });
    try {
      const tables = await raw.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      );
      const names = tables.rows.map((r) => r.name as string).sort();
      expect(names).toEqual(
        ["entities", "entity_relations", "note_links", "note_tags", "notes"].sort(),
      );
    } finally {
      raw.close();
    }
  });

  describe("insertNote (no embedding)", () => {
    it("inserts a note and returns the expected shape", async () => {
      const note = await store.insertNote(USER_ID, {
        content: "Smoke test note content.\n\nThis is a second paragraph.",
        title: "Smoke Test",
        tags: ["test", "smoke"],
      });

      expect(note).toBeDefined();
      expect(note.id).toMatch(/^\d{14}(-\d+)?$/);
      expect(note.title).toBe("Smoke Test");
      expect(note.embedded).toBe(false); // embed() throws by default in mock
    });

    it("auto-generates a title from content when none is provided", async () => {
      const note = await store.insertNote(USER_ID, {
        content: "Auto-generated title note\nMore text here.",
      });
      expect(note.title).toBe("Auto-generated title note");
    });
  });

  describe("insertNote (with mocked embedding)", () => {
    it("stores the embedding as JSON and reports embedded=true", async () => {
      // Arrange: mock embed() to return a fake 768-dims embedding
      const mockEmbedding = Array.from({ length: 768 }, (_, i) => i / 768);
      vi.mocked(embed).mockResolvedValueOnce({ embedding: mockEmbedding } as unknown as Awaited<
        ReturnType<typeof embed>
      >);

      // Act
      const note = await store.insertNote(USER_ID, {
        content: "Embedded note content.",
        title: "Embedded Note",
      });

      // Assert
      expect(note.embedded).toBe(true);

      // Verify the embedding was JSON-serialized and stored correctly in the DB
      const raw = createClient({ url: `file:${DB_PATH}` });
      try {
        const rows = await raw.execute({
          sql: "SELECT embedding FROM notes WHERE id = ?",
          args: [note.id],
        });
        const storedJson = rows.rows[0].embedding as string;
        expect(storedJson).toBeTypeOf("string");
        const parsed = JSON.parse(storedJson);
        expect(parsed).toHaveLength(768);
        expect(parsed).toEqual(mockEmbedding);
      } finally {
        raw.close();
      }
    });
  });

  describe("extractAndSaveGraph (with mocked generateObject)", () => {
    it("persists entities and relations from the graph", async () => {
      // Arrange: mock generateObject to return a fake graph
      vi.mocked(generateObject).mockResolvedValueOnce({
        object: {
          nodes: [
            { name: "Transformer", type: "concept", description: "A neural network architecture" },
            { name: "Attention", type: "mechanism", description: "Self-attention mechanism" },
          ],
          edges: [{ source: "Transformer", target: "Attention", relationship: "uses" }],
        },
      } as unknown as Awaited<ReturnType<typeof generateObject>>);

      // Need a note to reference
      const note = await store.insertNote(USER_ID, {
        content: "Transformers use attention mechanisms.",
        title: "Graph Test",
      });

      // Act
      const result = await store.extractAndSaveGraph(note.id, note.title);

      // Assert
      expect(result.nodes).toBe(2);
      expect(result.edges).toBe(1);

      // Verify entities are in the DB
      const raw = createClient({ url: `file:${DB_PATH}` });
      try {
        const entities = await raw.execute("SELECT name, type FROM entities ORDER BY name");
        expect(entities.rows.length).toBe(2);
        const names = entities.rows.map((r) => r.name);
        expect(names).toEqual(["Attention", "Transformer"]);

        const relations = await raw.execute(
          "SELECT source, target, relationship FROM entity_relations WHERE note_id = ?",
          [note.id],
        );
        expect(relations.rows.length).toBe(1);
        expect(relations.rows[0].source).toBe("Transformer");
        expect(relations.rows[0].relationship).toBe("uses");
      } finally {
        raw.close();
      }
    });
  });

  describe("tags", () => {
    it("assigns tags to a note", async () => {
      const note = await store.insertNote(USER_ID, {
        content: "Tagged note content.",
        tags: ["alpha", "beta"],
      });

      const raw = createClient({ url: `file:${DB_PATH}` });
      try {
        const tags = await raw.execute({
          sql: "SELECT tag FROM note_tags WHERE note_id = ? ORDER BY tag",
          args: [note.id],
        });
        const tagNames = tags.rows.map((r) => r.tag);
        expect(tagNames).toEqual(["alpha", "beta"]);
      } finally {
        raw.close();
      }
    });

    it("recovers from duplicate tag insertions gracefully", async () => {
      const note = await store.insertNote(USER_ID, {
        content: "Duplicate tag test.",
        tags: ["dup", "dup", "unique"],
      });

      const raw = createClient({ url: `file:${DB_PATH}` });
      try {
        const tags = await raw.execute({
          sql: "SELECT tag FROM note_tags WHERE note_id = ? ORDER BY tag",
          args: [note.id],
        });
        expect(tags.rows.map((r) => r.tag)).toEqual(["dup", "unique"]);
      } finally {
        raw.close();
      }
    });
  });

  it("generates unique IDs even under rapid insertion", async () => {
    const ids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const note = await store.insertNote(USER_ID, {
        content: `Rapid insert test ${i}`,
      });
      expect(ids.has(note.id)).toBe(false);
      ids.add(note.id);
    }
    expect(ids.size).toBe(5);
  });
});
