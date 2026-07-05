# Contextual Audio Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Enhance audio notes by passing raw transcripts through an LLM to generate a clean context summary before saving.

**Architecture:** Inside the `/transcribe` endpoint or `writeNote` (when `source == 'audio'`), run the transcript through a prompt to generate a 1-2 sentence context summary. Prepend `[Context: summary]\n\n` to the raw transcript.

**Tech Stack:** Hono, AI SDK.

---

### Task 1: Contextual Augmentation

**Files:**

- Modify: `src/index.ts`

**Step 1: Update `/transcribe` logic**

```typescript
// In POST /transcribe:
// After getting `transcript.text` from `transcribeAudio()`:
// Use generateText() with a prompt: "Summarize this rambling audio note into a concise context statement..."
// Prepend it to the transcript text.
```

**Step 2: Verify**

Run the app, upload an audio file via the UI, verify the resulting note has a contextual summary header.

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add contextual augmentation for audio transcripts"
```
