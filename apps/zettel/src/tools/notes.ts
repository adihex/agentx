/**
 * Zettelkasten note tools.
 *
 * Four tools matching the ToolDefinition contract from @agentx/core. Each tool
 * exports a zod schema, an async implementation invoked inside a thread-pool
 * worker, and a ToolDefinition pointing at this module by file path.
 */

import { z } from "zod";
import type { ToolDefinition } from "@agentx/core";
import {
  writeNote,
  readNote,
  searchNotes as searchNotesStore,
  addLink,
  backlinksOf,
} from "../notes/store.ts";

// ── createNote ────────────────────────────────────────────────────────────────

export const createNoteSchema = z.object({
  content: z.string().min(1).describe("The atomic note content (markdown)."),
  title: z.string().optional().describe("Optional short title; derived from content if omitted."),
  tags: z.array(z.string()).optional().describe("Optional tags for the note."),
  source: z
    .enum(["text", "audio"])
    .optional()
    .describe("Where the note came from. Defaults to 'text'."),
});
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export async function createNote(args: CreateNoteInput) {
  const { content, title, tags, source } = createNoteSchema.parse(args);
  try {
    const note = await writeNote({ content, title, tags, source });
    return { success: true, id: note.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── linkNotes ───────────────────────────────────────────────────────────────

export const linkNotesSchema = z.object({
  fromId: z.string().min(1).describe("Id of the first note."),
  toId: z.string().min(1).describe("Id of the second note to link to."),
});
export type LinkNotesInput = z.infer<typeof linkNotesSchema>;

export async function linkNotes(args: LinkNotesInput) {
  const { fromId, toId } = linkNotesSchema.parse(args);
  try {
    await addLink(fromId, toId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── searchNotes ───────────────────────────────────────────────────────────────

export const searchNotesSchema = z.object({
  query: z.string().describe("Text to match against note titles, tags, and bodies."),
  limit: z.number().int().positive().optional().describe("Max results (default 10)."),
});
export type SearchNotesInput = z.infer<typeof searchNotesSchema>;

export async function searchNotes(args: SearchNotesInput) {
  const { query, limit } = searchNotesSchema.parse(args);
  try {
    const results = await searchNotesStore(query, limit ?? 10);
    return { results };
  } catch (err) {
    return { results: [], error: err instanceof Error ? err.message : String(err) };
  }
}

// ── getNote ───────────────────────────────────────────────────────────────────

export const getNoteSchema = z.object({
  id: z.string().min(1).describe("Id of the note to fetch."),
});
export type GetNoteInput = z.infer<typeof getNoteSchema>;

export async function getNote(args: GetNoteInput) {
  const { id } = getNoteSchema.parse(args);
  try {
    const note = await readNote(id);
    if (!note) return { note: null, backlinks: [], error: `note ${id} not found` };
    const backlinks = await backlinksOf(id);
    return { note, backlinks };
  } catch (err) {
    return { note: null, backlinks: [], error: err instanceof Error ? err.message : String(err) };
  }
}

// ── ToolDefinitions ───────────────────────────────────────────────────────────

export const createNoteTool: ToolDefinition<CreateNoteInput> = {
  name: "createNote",
  description:
    "Capture a single atomic thought as a Zettelkasten note. Returns the new note's id.",
  inputSchema: createNoteSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "createNote",
};

export const linkNotesTool: ToolDefinition<LinkNotesInput> = {
  name: "linkNotes",
  description:
    "Create a bidirectional link between two notes by id, recording the connection on both notes.",
  inputSchema: linkNotesSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "linkNotes",
};

export const searchNotesTool: ToolDefinition<SearchNotesInput> = {
  name: "searchNotes",
  description:
    "Search existing notes by text across title, tags, and body. Returns matching {id,title,snippet}.",
  inputSchema: searchNotesSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "searchNotes",
};

export const getNoteTool: ToolDefinition<GetNoteInput> = {
  name: "getNote",
  description: "Fetch one note by id along with its backlinks (notes linked to/from it).",
  inputSchema: getNoteSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "getNote",
};
