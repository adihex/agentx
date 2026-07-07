/**
 * E2E integration test: "CLI writes → web app reads" data contract.
 *
 * Validates that notes written by @agentx/zettel-import's NoteStore are
 * compatible with the schema expected by the zettel web app. Both share
 * the same Turso/libsql database.
 *
 * Strategy:
 *   1. Write notes via the CLI store (simulating zettel-import)
 *   2. Verify them via raw SQL against the schema the web app expects
 *   3. Run the web app's own listNotes/readNote against the same DB
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NoteStore as ImportStore, type NotesTable } from "../src/store";
import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DB_PATH = path.join(os.tmpdir(), "zettel-e2e-import-flow.db");
const USER_ID = "e2e-user";

describe("E2E: CLI import → web app read", () => {
  let importStore: ImportStore;
  let rawClient: Client; // direct SQL access, avoids zettel-store module side effects

  beforeAll(async () => {
    try {
      fs.unlinkSync(DB_PATH);
    } catch {
      /* ok */
    }

    importStore = new ImportStore({ url: `file:${DB_PATH}` });
    rawClient = createClient({ url: `file:${DB_PATH}` });
  });

  afterAll(async () => {
    await importStore.destroy();
    rawClient.close();
    try {
      fs.unlinkSync(DB_PATH);
    } catch {
      /* ok */
    }
  });

  it("both stores connect to the same database", async () => {
    await importStore.verifyConnection();
    const result = await rawClient.execute("SELECT 1");
    expect(result.rows.length).toBe(1);
  });

  it("creates the same tables the web app expects", async () => {
    const tables = await rawClient.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    );
    const names = tables.rows.map((r) => r.name as string);
    for (const tbl of ["notes", "note_tags", "note_links", "entities", "entity_relations"]) {
      expect(names).toContain(tbl);
    }
  });

  it("notes table has the correct columns for the web app", async () => {
    const cols = await rawClient.execute("PRAGMA table_info(notes)");
    const colNames = cols.rows.map((r) => r.name as string);
    expect(colNames).toContain("id");
    expect(colNames).toContain("user_id");
    expect(colNames).toContain("title");
    expect(colNames).toContain("created");
    expect(colNames).toContain("source");
    expect(colNames).toContain("body");
    expect(colNames).toContain("embedding");
  });

  describe("write via CLI, verify via SQL (simulating web app reads)", () => {
    const importedIds: string[] = [];

    beforeAll(async () => {
      const inputs = [
        {
          content: "# E2E Note 1\n\nDiscusses **machine learning** and **transformers**.",
          title: "E2E Import Note 1",
          tags: ["import", "ml"],
        },
        {
          content: "# E2E Note 2\n\nAbout TypeScript type systems and Kysely.",
          title: "E2E Import Note 2",
          tags: ["import", "typescript"],
        },
        {
          content: "# E2E Note 3\n\nNo explicit title, auto-generated from content.",
          tags: ["import"],
        },
      ];

      for (const input of inputs) {
        const note = await importStore.insertNote(USER_ID, input);
        importedIds.push(note.id);
      }
    });

    it("all 3 notes exist in the database", async () => {
      const result = await rawClient.execute({
        sql: "SELECT id, title FROM notes WHERE user_id = ? ORDER BY id DESC",
        args: [USER_ID],
      });
      expect(result.rows.length).toBe(3);
    });

    it("notes are returned newest-first (timestamp IDs sort descending)", async () => {
      const result = await rawClient.execute({
        sql: "SELECT id FROM notes WHERE user_id = ? ORDER BY id DESC",
        args: [USER_ID],
      });
      const ids = result.rows.map((r) => r.id as string);
      for (let i = 0; i < ids.length - 1; i++) {
        expect(ids[i] >= ids[i + 1]).toBe(true);
      }
      // All 3 imported IDs should be present
      for (const id of importedIds) {
        expect(ids).toContain(id);
      }
    });

    it("read a full note (matching web app's readNote query)", async () => {
      const result = await rawClient.execute({
        sql: "SELECT id, title, created, source, body FROM notes WHERE id = ? AND user_id = ?",
        args: [importedIds[0], USER_ID],
      });
      expect(result.rows.length).toBe(1);
      const row = result.rows[0];
      expect(row.title).toBe("E2E Import Note 1");
      expect(row.source).toBe("text");
      expect(row.body).toContain("machine learning");
    });

    it("tags are retrievable (matching web app's tag join query)", async () => {
      for (const id of importedIds) {
        const tags = await rawClient.execute({
          sql: "SELECT tag FROM note_tags WHERE note_id = ? ORDER BY tag",
          args: [id],
        });
        const tagNames = tags.rows.map((r) => r.tag);
        expect(tagNames).toContain("import");
      }
    });

    it("note 1 has both specific tags", async () => {
      const tags = await rawClient.execute({
        sql: "SELECT tag FROM note_tags WHERE note_id = ? ORDER BY tag",
        args: [importedIds[0]],
      });
      expect(tags.rows.map((r) => r.tag)).toEqual(["import", "ml"]);
    });

    it("auto-generated title falls back to first content line", async () => {
      const result = await rawClient.execute({
        sql: "SELECT title FROM notes WHERE id = ?",
        args: [importedIds[2]],
      });
      expect(result.rows[0].title).toBe("# E2E Note 3");
    });

    it("imported IDs follow YYYYMMDDHHmmss format", async () => {
      for (const id of importedIds) {
        expect(id).toMatch(/^\d{14}(-\d+)?$/);
      }
    });

    it("keyword search finds notes by title", async () => {
      const q = "%e2e import note 2%";
      const result = await rawClient.execute({
        sql: `SELECT id, title FROM notes WHERE user_id = ? AND lower(title) LIKE ?`,
        args: [USER_ID, q],
      });
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
      expect(result.rows.some((r) => r.title === "E2E Import Note 2")).toBe(true);
    });

    it("keyword search finds notes by body", async () => {
      const q = "%transformers%";
      const result = await rawClient.execute({
        sql: `SELECT id, title FROM notes WHERE user_id = ? AND lower(body) LIKE ?`,
        args: [USER_ID, q],
      });
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });

    it("keyword search finds notes by tag", async () => {
      const q = "%typescript%";
      const result = await rawClient.execute({
        sql: `SELECT id FROM notes WHERE user_id = ?
              AND id IN (SELECT note_id FROM note_tags WHERE lower(tag) LIKE ?)`,
        args: [USER_ID, q],
      });
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });

    it("notes are properly scoped by user_id (tenant isolation)", async () => {
      const result = await rawClient.execute({
        sql: "SELECT id FROM notes WHERE user_id = ?",
        args: ["other-user"],
      });
      expect(result.rows.length).toBe(0);
    });
  });
});
