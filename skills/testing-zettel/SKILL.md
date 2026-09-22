---
name: testing-zettel
description: How to run and end-to-end test the apps/zettel Zettelkasten app (Hono + React + Better Auth + LibSQL) locally with the deterministic MOCK_LLM stub.
---

# Testing the zettel app (apps/zettel)

## Running locally

From `apps/zettel`:

```bash
MOCK_LLM=true NODE_ENV=development VITE_PORT=5173 PORT=5174 \
  BETTER_AUTH_URL=http://localhost:5174 ZETTEL_DIR=/tmp/zettel-test-db \
  mise exec -- pnpm run dev
```

- UI: `http://localhost:5173/zettel/` (vite `base` is `/zettel/` — bare `/` 404s).
- vite proxies `/api` and `/adp` (WebSocket upgrade) to the Hono server on `PORT` (default 5174).
- `ZETTEL_DIR` points the LibSQL file DB at a throwaway dir; omit it and it writes to `~/.agentx-zettel`.
- Keep the dev server in a persistent shell (`shell_id`). If you `&`-background it in a one-shot exec, the orphaned `concurrently` tree survives the shell exit and will collide on the ports next launch — `lsof -iTCP:5173 -iTCP:5174` and kill leftovers first.

## MOCK_LLM stub (no paid LLM needed)

`MOCK_LLM=true` (or `NODE_ENV=test`) replaces `LLMOrchestrator.runStep` in `src/index.ts`:
- prompt containing `apples` → `createNote` "About Apples" (tags apples, fruit)
- prompt containing `oranges` → `createNote` "About Oranges"
- any turn where context already has a tool result → "I have successfully created the note for you."
- anything else → "I am a helpful assistant." (still emits `Agent.InferenceEnd`, which is what triggers the UI notes/graph refetch)

## Auth

Sign-up works from the UI ("Create a workspace"): name + email + password (≥8 chars). The session cookie carries `/adp` WebSocket auth; rail footer shows "Connected" when the ADP socket is up.

## Seeding/inspecting the DB outside the UI

`tsx` (not `tsx -e` — top-level await fails under its cjs eval). Write a `.mts` script importing the store and run with the same `ZETTEL_DIR`:

```bash
ZETTEL_DIR=/tmp/zettel-test-db mise exec -- pnpm exec tsx seed.mts
```

```ts
import { client, writeNote, addLink } from "/abs/path/apps/zettel/src/notes/store.js";
const uid = (await client.execute('SELECT id FROM "user" LIMIT 1')).rows[0].id as string;
await writeNote(uid, { title: "x", content: "y" }); // ids are YYYYMMDDHHMMSS[-NNNN]
```

Script-written notes won't appear in the UI until the next refetch signal — send any chat prompt (`Agent.InferenceEnd`) or a window-focus event, or reload.

## Workspace deps consume dist/, not src/

`@agentx/core` and `@agentx/adp` resolve `dist/`; `@agentx/agx-core`/`shared-ui` resolve `src/`. After changing core/adp source, rebuild or the running dev server stays on stale code:

```bash
cd packages/core && mise exec -- pnpm exec tsdown src/index.ts --format cjs,esm --dts
```

`tsx watch` watches imported files **including `packages/*/dist`** — a rebuild (or a parallel agent's build/test run) restarts the server and drops the ADP socket; the frontend's AdpClient reconnects on 3s×2ⁿ backoff, so just wait for "Connected".

## Idle-agent eviction

`AGENT_IDLE_EVICT_MS` (default 10 min) is a hardcoded const in `src/index.ts`. To observe eviction, temporarily lower it (e.g. `20 * 1000`) plus a `console.log` in `scheduleAgentEviction`'s timer and `cancelAgentEviction`; `tsx watch` reloads on save. Fast cycles: **sign out** = disconnect (fires the timer); **page reload** = disconnect+reconnect in ~2s (tests cancel-on-reconnect without waiting).

## UI quirks

- The 3-column layout needs a wide window (~1400px) or the inspector/Semantic Visualizer is off-screen.
- The Semantic Visualizer only renders once a note is selected ("Awaiting Mapping…" otherwise); click the preview to open the interactive modal; node-click navigates to that note.
- Custom tool names must match `[a-zA-Z][a-zA-Z0-9_]*` — hyphens are rejected.
- Monaco editors swallow scroll events — scroll over the form's margins.
- The devtools Network tab docked right shrinks the app — undock or close it before clicking capture-bar controls.
