# GraphRAG Entity Extraction Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Automatically extract explicit Concepts (Nodes) and Relationships (Edges) from every captured note.

**Architecture:** Create new DB tables `entities` and `entity_relations`. Use LLM Structured Outputs (e.g. Zod schema + `generateObject` from AI SDK) in a background job or directly during `writeNote` to extract a Knowledge Graph from the note body.

**Tech Stack:** LibSQL, AI SDK (`generateObject`), Zod.

---

### Task 1: Database Migration for GraphRAG

**Files:**

- Modify: `src/notes/store.ts`

**Step 1: Update Schema in `initDb`**

```typescript
await client.execute(`
  CREATE TABLE IF NOT EXISTS entities (
    name TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT
  )
`);
await client.execute(`
  CREATE TABLE IF NOT EXISTS entity_relations (
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    relationship TEXT NOT NULL,
    note_id TEXT NOT NULL,
    FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
  )
`);
```

**Step 2: Commit**

```bash
git add src/notes/store.ts
git commit -m "feat: add graphrag db schema"
```

### Task 2: Extraction Logic

**Files:**

- Modify: `src/notes/store.ts`

**Step 1: Write Extraction Function**

```typescript
// Implement extractGraph(content: string) using generateObject + Zod schema:
// { nodes: [{name, type, desc}], edges: [{source, target, relation}] }
// Inside writeNote, await this extraction and insert into DB.
```

**Step 2: Verify Extraction**

Run app and create a note. Check DB to ensure `entities` are populated.

**Step 3: Commit**

```bash
git add src/notes/store.ts
git commit -m "feat: extract and store knowledge graph"
```
