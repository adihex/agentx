import type { CliOptions } from "./args";
import { listSources, fetchSourceContent } from "./nlm";
import { NoteStore } from "./store";
import { saveSource, runIndex } from "./rag";

export const STAGES = ["fetch", "note", "graph", "save"] as const;
export type StageKey = (typeof STAGES)[number];
export type StageStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface SourceRow {
  sourceId: string;
  title: string;
  stages: Record<StageKey, StageStatus>;
  noteId?: string;
  detail?: string;
}

export type Phase = "listing" | "processing" | "indexing" | "done" | "fatal";

export interface ImportState {
  phase: Phase;
  notebookId: string;
  rows: SourceRow[];
  indexStatus: StageStatus;
  fatalError?: string;
  summary?: {
    notes: number;
    entities: number;
    relations: number;
    saved: number;
    failed: number;
  };
}

function errorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/\s+/g, " ").trim().slice(0, 300);
}

/**
 * Run the full import. Emits a fresh state snapshot after every stage
 * transition so a UI can render live progress. Sources are processed
 * sequentially: note IDs are second-resolution timestamps whose collision
 * check is not safe under concurrent writers.
 */
export async function runImport(
  opts: CliOptions,
  emit: (state: ImportState) => void,
): Promise<ImportState> {
  const state: ImportState = {
    phase: "listing",
    notebookId: opts.notebookId,
    rows: [],
    indexStatus: opts.skipRag ? "skipped" : "pending",
  };
  const publish = () => emit(structuredClone(state));
  publish();

  const store = new NoteStore({ url: opts.dbUrl, authToken: opts.dbToken });
  try {
    try {
      await store.verifyConnection();
      const sources = await listSources(opts.nlmPath, opts.notebookId);
      state.rows = sources.map((s) => ({
        sourceId: s.id,
        title: s.title,
        stages: { fetch: "pending", note: "pending", graph: "pending", save: "pending" },
      }));
      if (opts.skipRag) {
        for (const row of state.rows) row.stages.save = "skipped";
      }
      state.phase = "processing";
      publish();
    } catch (err) {
      state.phase = "fatal";
      state.fatalError = errorMessage(err);
      publish();
      return state;
    }

    let notes = 0;
    let entities = 0;
    let relations = 0;
    let saved = 0;
    let failed = 0;

    for (const row of state.rows) {
      let content: string;
      try {
        row.stages.fetch = "running";
        publish();
        content = await fetchSourceContent(opts.nlmPath, row.sourceId);
        if (content.trim().length === 0) throw new Error("Source content is empty");
        row.stages.fetch = "done";
        publish();
      } catch (err) {
        row.stages.fetch = "error";
        row.detail = errorMessage(err);
        for (const stage of ["note", "graph", "save"] as const) {
          if (row.stages[stage] === "pending") row.stages[stage] = "skipped";
        }
        failed += 1;
        publish();
        continue;
      }

      try {
        row.stages.note = "running";
        publish();
        const note = await store.insertNote(opts.userId, {
          content,
          title: row.title,
          tags: ["notebooklm-import"],
        });
        row.noteId = note.id;
        if (!note.embedded) row.detail = "note created without embedding";
        row.stages.note = "done";
        notes += 1;
        publish();
      } catch (err) {
        row.stages.note = "error";
        row.detail = errorMessage(err);
        row.stages.graph = "skipped";
        failed += 1;
        publish();
      }

      if (row.noteId) {
        try {
          row.stages.graph = "running";
          publish();
          const graph = await store.extractAndSaveGraph(row.noteId, content);
          entities += graph.nodes;
          relations += graph.edges;
          row.stages.graph = "done";
          publish();
        } catch (err) {
          // Non-fatal, matching the zettel app: the note exists without a graph.
          row.stages.graph = "error";
          row.detail = errorMessage(err);
          publish();
        }
      }

      if (!opts.skipRag) {
        try {
          row.stages.save = "running";
          publish();
          await saveSource(opts.ragDir, row.title, content);
          row.stages.save = "done";
          saved += 1;
          publish();
        } catch (err) {
          row.stages.save = "error";
          row.detail = errorMessage(err);
          publish();
        }
      }
    }

    if (!opts.skipRag && saved > 0) {
      state.phase = "indexing";
      state.indexStatus = "running";
      publish();
      try {
        await runIndex(opts.ragDir);
        state.indexStatus = "done";
      } catch (err) {
        state.indexStatus = "error";
        state.fatalError = `RAG indexing failed: ${errorMessage(err)}`;
      }
      publish();
    } else if (!opts.skipRag) {
      state.indexStatus = "skipped";
    }

    state.phase = "done";
    state.summary = { notes, entities, relations, saved, failed };
    publish();
    return state;
  } finally {
    await store.destroy();
  }
}
