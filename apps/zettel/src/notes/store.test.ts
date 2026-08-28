import { describe, it, expect, vi } from "vitest";

vi.hoisted(() => {
  process.env.ZETTEL_DIR = `/tmp/agentx-zettel-test-${process.pid}-${Math.random()}`;
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
});
import {
  writeNote,
  listNotes,
  readNote,
  searchNotes,
  addLink,
  backlinksOf,
  updateNote,
  deleteNote,
  replaceNoteGraph,
  traverseGraphStore,
  client,
} from "./store.js";

describe("Multi-tenant Notes Database Isolation", () => {
  const userA = "user-A-" + Date.now();
  const userB = "user-B-" + Date.now();

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

    await writeNote(userB, { content: "Note B1" });
    await writeNote(userB, { content: "Note B2" });

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

  it("should update note content, title, tags, and links", async () => {
    // 1. Create initial note and target link notes for User A
    const targetA = await writeNote(userA, { content: "Target A Note" });
    const noteA = await writeNote(userA, {
      content: "Initial content",
      title: "Initial Title",
      tags: ["tag1"],
      links: [],
    });

    // 2. Perform update
    const updated = await updateNote(userA, noteA.id, {
      content: "Updated content",
      title: "Updated Title",
      tags: ["tag2", "tag3"],
      links: [targetA.id],
    });

    expect(updated.id).toBe(noteA.id);
    expect(updated.title).toBe("Updated Title");
    expect(updated.body).toBe("Updated content");
    expect(updated.tags).toEqual(["tag2", "tag3"]);
    expect(updated.links).toEqual([targetA.id]);
    expect(updated.created).toBe(noteA.created);

    // 3. Verify changes are persisted and queryable
    const read = await readNote(userA, noteA.id);
    expect(read).not.toBeNull();
    expect(read?.title).toBe("Updated Title");
    expect(read?.body).toBe("Updated content");
    expect(read?.tags).toEqual(["tag2", "tag3"]);
    expect(read?.links).toEqual([targetA.id]);

    // 4. Verify bidirectional link update
    const backlinksTarget = await backlinksOf(userA, targetA.id);
    expect(backlinksTarget).toContain(noteA.id);
  });

  it("should enforce multi-tenant isolation on note update", async () => {
    const noteA = await writeNote(userA, {
      content: "User A Note",
      title: "Title A",
    });

    // User B attempts to update User A's note
    await expect(
      updateNote(userB, noteA.id, {
        content: "Hacked content",
        title: "Hacked Title",
      }),
    ).rejects.toThrow();

    // Verify it was not updated
    const read = await readNote(userA, noteA.id);
    expect(read?.title).toBe("Title A");
    expect(read?.body).toBe("User A Note");
  });

  it("should delete note and cascade delete tags and links", async () => {
    const noteA1 = await writeNote(userA, { content: "Note A1", tags: ["deleteme"] });
    const noteA2 = await writeNote(userA, { content: "Note A2" });

    // Link A1 and A2
    await addLink(userA, noteA1.id, noteA2.id);

    // Verify link and tags exist
    const initialRead = await readNote(userA, noteA1.id);
    expect(initialRead?.tags).toContain("deleteme");
    expect(initialRead?.links).toContain(noteA2.id);

    // Delete Note A1
    await deleteNote(userA, noteA1.id);

    // Verify note is gone
    const readDeleted = await readNote(userA, noteA1.id);
    expect(readDeleted).toBeNull();

    // Verify backlinks to noteA2 are updated (noteA1 is no longer linking to it)
    const backlinksA2 = await backlinksOf(userA, noteA2.id);
    expect(backlinksA2).not.toContain(noteA1.id);
  });

  it("should enforce multi-tenant isolation on note deletion", async () => {
    const noteA = await writeNote(userA, { content: "User A Note" });

    // User B attempts to delete User A's note
    await expect(deleteNote(userB, noteA.id)).rejects.toThrow();

    // Verify note still exists for User A
    const read = await readNote(userA, noteA.id);
    expect(read).not.toBeNull();
  });
});

describe("tenant graph store", () => {
  const userA = "graph-user-A";
  const userB = "graph-user-B";

  it("stores same-named entities independently for each tenant", async () => {
    const noteA = await writeNote(userA, { content: "A graph note" });
    const noteB = await writeNote(userB, { content: "B graph note" });

    await replaceNoteGraph(userA, noteA.id, {
      entities: [{ name: "Mercury", type: "planet", description: "A planet" }],
      relations: [],
    });
    await replaceNoteGraph(userB, noteB.id, {
      entities: [{ name: "Mercury", type: "element", description: "A metal" }],
      relations: [],
    });

    const rows = await client.execute(
      "SELECT user_id, type, description FROM entities WHERE name = 'Mercury' ORDER BY user_id",
    );
    expect(rows.rows).toEqual([
      { user_id: userA, type: "planet", description: "A planet" },
      { user_id: userB, type: "element", description: "A metal" },
    ]);
  });

  it("enforces note ownership and atomically replaces relations", async () => {
    const note = await writeNote(userA, { content: "Owned graph note" });
    const firstGraph = {
      entities: [
        { name: "A", type: "concept", description: "first" },
        { name: "B", type: "concept", description: "second" },
      ],
      relations: [{ source: "A", target: "B", relationship: "leads to" }],
    };

    await expect(replaceNoteGraph(userB, note.id, firstGraph)).rejects.toThrow("Note not found");
    await replaceNoteGraph(userA, note.id, firstGraph);
    await replaceNoteGraph(userA, note.id, firstGraph);
    expect((await traverseGraphStore(userA, "A", 1)).relations).toHaveLength(1);

    await replaceNoteGraph(userA, note.id, {
      entities: [
        { name: "A", type: "concept", description: "updated" },
        { name: "C", type: "concept", description: "third" },
      ],
      relations: [{ source: "A", target: "C", relationship: "replaces" }],
    });
    expect(await traverseGraphStore(userA, "A", 1)).toEqual({
      entities: ["A", "C"],
      relations: [{ source: "A", target: "C", relationship: "replaces", noteId: note.id }],
    });
  });

  it("traverses deterministically with tenant isolation, deduplication, and bounded depth", async () => {
    const traversalUser = "graph-traversal-user";
    const noteA1 = await writeNote(traversalUser, { content: "Graph one" });
    const noteA2 = await writeNote(traversalUser, { content: "Graph two" });
    const noteB = await writeNote(userB, { content: "Other tenant graph" });
    const entities = ["A", "B", "C", "D"].map((name) => ({
      name,
      type: "concept",
      description: name,
    }));

    await replaceNoteGraph(traversalUser, noteA1.id, {
      entities,
      relations: [
        { source: "B", target: "C", relationship: "next" },
        { source: "A", target: "B", relationship: "next" },
      ],
    });
    await replaceNoteGraph(traversalUser, noteA2.id, {
      entities,
      relations: [
        { source: "C", target: "D", relationship: "next" },
        { source: "A", target: "B", relationship: "next" },
      ],
    });
    await replaceNoteGraph(userB, noteB.id, {
      entities: [...entities, { name: "SECRET", type: "concept", description: "hidden" }],
      relations: [{ source: "A", target: "SECRET", relationship: "private" }],
    });

    expect(await traverseGraphStore(traversalUser, "A", 2)).toEqual({
      entities: ["A", "B", "C"],
      relations: [
        { source: "A", target: "B", relationship: "next", noteId: noteA1.id },
        { source: "A", target: "B", relationship: "next", noteId: noteA2.id },
        { source: "B", target: "C", relationship: "next", noteId: noteA1.id },
      ],
    });
    expect(await traverseGraphStore(traversalUser, "A", 0)).toEqual({
      entities: ["A"],
      relations: [],
    });
    expect(await traverseGraphStore(traversalUser, "missing", 3)).toEqual({
      entities: [],
      relations: [],
    });
    await expect(traverseGraphStore(traversalUser, "A", -1)).rejects.toThrow("depth");
    await expect(traverseGraphStore(traversalUser, "A", 101)).rejects.toThrow("depth");
  });

  it("removes note-owned relations when a note is deleted", async () => {
    const note = await writeNote(userA, { content: "Disposable graph" });
    await replaceNoteGraph(userA, note.id, {
      entities: [
        { name: "Delete", type: "concept", description: "source" },
        { name: "Me", type: "concept", description: "target" },
      ],
      relations: [{ source: "Delete", target: "Me", relationship: "owns" }],
    });

    await deleteNote(userA, note.id);
    expect(await traverseGraphStore(userA, "Delete", 2)).toEqual({
      entities: ["Delete"],
      relations: [],
    });
  });
});
