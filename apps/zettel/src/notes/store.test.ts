import { describe, it, expect, beforeAll } from "vitest";
import {
  writeNote,
  listNotes,
  readNote,
  searchNotes,
  addLink,
  backlinksOf,
} from "./store.js";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

describe("Multi-tenant Notes Database Isolation", () => {
  const userA = "user-A-" + Date.now();
  const userB = "user-B-" + Date.now();

  beforeAll(async () => {
    // Force a fresh test directory for the database to ensure a clean slate
    const testDir = path.join(os.tmpdir(), "agentx-zettel-test-" + Date.now());
    process.env.ZETTEL_DIR = testDir;
    await fs.mkdir(testDir, { recursive: true });
  });

  it("should isolate note creation and listing between users", async () => {
    // 1. Create note for User A
    const noteA = await writeNote(userA, {
      content: "This is a private note for User A",
      title: "Note A",
      tags: ["userA", "secret"],
    });

    // 2. Create note for User B
    const noteB = await writeNote(userB, {
      content: "This is a private note for User B",
      title: "Note B",
      tags: ["userB", "secret"],
    });

    // 3. Verify User A note listing contains only Note A
    const listA = await listNotes(userA);
    expect(listA.length).toBe(1);
    expect(listA[0].id).toBe(noteA.id);
    expect(listA[0].title).toBe("Note A");

    // 4. Verify User B note listing contains only Note B
    const listB = await listNotes(userB);
    expect(listB.length).toBe(1);
    expect(listB[0].id).toBe(noteB.id);
    expect(listB[0].title).toBe("Note B");
  });

  it("should isolate note reading by ID between users", async () => {
    const noteA = await writeNote(userA, {
      content: "Secret content",
      title: "Secret Note A",
    });

    // User A can read their own note
    const readOwn = await readNote(userA, noteA.id);
    expect(readOwn).not.toBeNull();
    expect(readOwn?.title).toBe("Secret Note A");

    // User B cannot read User A's note
    const readOther = await readNote(userB, noteA.id);
    expect(readOther).toBeNull();
  });

  it("should isolate text searching between users", async () => {
    await writeNote(userA, {
      content: "Finding matching notes on A",
      title: "Searchable Note",
    });
    await writeNote(userB, {
      content: "Finding matching notes on B",
      title: "Searchable Note",
    });

    const searchA = await searchNotes(userA, "matching");
    expect(searchA.length).toBe(1);
    expect(searchA[0].snippet).toContain("matching notes on A");

    const searchB = await searchNotes(userB, "matching");
    expect(searchB.length).toBe(1);
    expect(searchB[0].snippet).toContain("matching notes on B");
  });

  it("should isolate note links and backlinks between users", async () => {
    const noteA1 = await writeNote(userA, { content: "Note A1" });
    const noteA2 = await writeNote(userA, { content: "Note A2" });

    const noteB1 = await writeNote(userB, { content: "Note B1" });
    const noteB2 = await writeNote(userB, { content: "Note B2" });

    // Link A1 to A2
    await addLink(userA, noteA1.id, noteA2.id);

    // Verify User A backlinks
    const backlinksA = await backlinksOf(userA, noteA1.id);
    expect(backlinksA).toContain(noteA2.id);

    // Verify User B cannot link or see backlinks for User A's notes
    await expect(addLink(userB, noteA1.id, noteA2.id)).rejects.toThrow();
    const backlinksB = await backlinksOf(userB, noteA1.id);
    expect(backlinksB.length).toBe(0);
  });
});
