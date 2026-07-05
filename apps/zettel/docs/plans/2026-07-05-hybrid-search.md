# Hybrid Search Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Upgrade the note search mechanism to use Hybrid Search (Vector Embeddings + FTS/Keyword) instead of a simple SQL LIKE query.

**Architecture:** We will add a `vector` column to the `notes` table using LibSQL's vector support. Upon note creation/update, we will fetch an embedding using Gemini (via `@google/genai` or `@ai-sdk/google`) and store it. The `searchNotes` function will query both vector distance and standard FTS (or basic keyword match), then combine the results using Reciprocal Rank Fusion (RRF) in TypeScript.

**Tech Stack:** Hono, LibSQL (Turso Vector extension), Google Gemini API.

---

### Task 1: Add Vector Column and generate embeddings on write

**Files:**

- Modify: `src/notes/store.ts`

**Step 1: Write the failing test**

```typescript
// in a hypothetical test file tests/search.test.ts (omitted for brevity, we will rely on manual test via app)
```

_(Skipping literal test file since we don't have a test suite configured for DB yet, but we will add logic to initDb)_

**Step 2: Modify `initDb` to support vectors**

```typescript
// In src/notes/store.ts, update initDb:
// Add vector column for embeddings (Float32Array)
await client.execute(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created TEXT NOT NULL,
    source TEXT NOT NULL,
    body TEXT NOT NULL,
    embedding F32_BLOB(768)
  )
`);
// (Handle migration if table exists by adding column)
```

**Step 3: Generate Embedding on Write Note**

```typescript
// In src/notes/store.ts, add a helper to fetch embeddings:
// import { generateEmbedding } from "ai"; // assuming AI SDK is available
// Update writeNote to fetch embedding and insert it.
```

**Step 4: Commit**

```bash
git add src/notes/store.ts
git commit -m "feat: add vector embeddings to notes"
```

### Task 2: Implement Hybrid Search with RRF

**Files:**

- Modify: `src/notes/store.ts`

**Step 1: Update `searchNotes`**

```typescript
// Modify searchNotes to perform two queries:
// 1. Vector nearest neighbors: SELECT id, vector_distance_cos(embedding, ?) as dist FROM notes...
// 2. Keyword match: SELECT id FROM notes WHERE body LIKE ?
// Merge results in JS using RRF: score = 1 / (k + rank)
```

**Step 2: Test Search via Endpoint**

Run: `npm run dev`
Expected: Asking the agent a semantic question retrieves conceptually related notes without exact keyword match.

**Step 3: Commit**

```bash
git add src/notes/store.ts
git commit -m "feat: implement hybrid search with rrf"
```
