# Topological Traversal Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Give the agent the ability to search by hopping through the Knowledge Graph instead of just vector/keyword matching.

**Architecture:** Expose a new tool `traverseGraph` to the `AgentEventLoop` which queries the `entity_relations` table for neighbors of a given entity up to depth 2.

**Tech Stack:** TypeScript, SQLite, `@agentx/core`.

---

### Task 1: Store function for Traversal

**Files:**

- Modify: `src/notes/store.ts`

**Step 1: Write the traversal function**

```typescript
// Implement traverseGraphStore(entityName: string, depth: number)
// Queries entity_relations recursively to find related entities and the notes they appear in.
```

**Step 2: Commit**

```bash
git add src/notes/store.ts
git commit -m "feat: add store method for topological traversal"
```

### Task 2: Create `traverseGraph` Tool

**Files:**

- Modify: `src/tools/notes.ts`
- Modify: `src/index.ts`

**Step 1: Tool Definition**

```typescript
// In src/tools/notes.ts, export traverseGraph schema and function.
```

**Step 2: Register in Agent**

```typescript
// In src/index.ts, add traverseGraph to the tools map in getOrCreateUserAgent.
// Update system prompt to instruct agent to use traverseGraph for exploring connected concepts.
```

**Step 3: Commit**

```bash
git add src/tools/notes.ts src/index.ts
git commit -m "feat: expose traverseGraph tool to agent"
```
