/**
 * Zettelkasten note store using SQLite/libsql (Turso).
 *
 * Supports local sqlite file database for development and remote Turso for production.
 * Automatically migrates existing markdown files from ZETTEL_DIR to the database on startup.
 */

import { createClient } from "@libsql/client";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export type NoteSource = "text" | "audio";

export interface NoteFrontmatter {
  id: string;
  title: string;
  tags: string[];
  links: string[];
  created: string;
  source: NoteSource;
}

export interface Note extends NoteFrontmatter {
  body: string;
}

export interface NoteSearchResult {
  id: string;
  title: string;
  snippet: string;
}

/** Resolve the zettel directory. */
function zettelDir(): string {
  return process.env.ZETTEL_DIR || path.join(os.homedir(), ".agentx-zettel");
}

const dbUrl = process.env.TURSO_DATABASE_URL || `file:${path.join(zettelDir(), "zettel.db")}`;
const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

export const client = createClient({
  url: dbUrl,
  authToken: dbAuthToken,
});

// ── Database Schema Initialization ─────────────────────────────────────────────

async function initDb(): Promise<void> {
  if (dbUrl.startsWith("file:")) {
    await fs.mkdir(zettelDir(), { recursive: true });
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created TEXT NOT NULL,
      source TEXT NOT NULL,
      body TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (note_id, tag),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS note_links (
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      PRIMARY KEY (from_id, to_id),
      FOREIGN KEY (from_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (to_id) REFERENCES notes(id) ON DELETE CASCADE
    )
  `);
}

// ── Markdown Parser for Migration ──────────────────────────────────────────────

// ── Lazy DB Connection Initialization ──────────────────────────────────────────

let dbInitialized: Promise<void> | null = null;

async function ensureDb(): Promise<void> {
  if (!dbInitialized) {
    dbInitialized = initDb();
  }
  return dbInitialized;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export interface WriteNoteInput {
  content: string;
  title?: string;
  tags?: string[];
  links?: string[];
  source?: NoteSource;
}

/** Create a new atomic note in the database. */
export async function writeNote(input: WriteNoteInput): Promise<Note> {
  await ensureDb();

  const now = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const base =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  let id = base;
  let suffix = 0;
  
  // Find a collision-free ID in the DB
  while (true) {
    const existsRes = await client.execute({
      sql: "SELECT 1 FROM notes WHERE id = ?",
      args: [id],
    });
    if (existsRes.rows.length === 0) break;
    suffix += 1;
    id = `${base}-${suffix}`;
  }

  const firstLine = input.content.split("\n").find((l) => l.trim().length > 0) ?? "";
  const title = (input.title?.trim() || firstLine.trim() || id).slice(0, 200);
  const created = new Date().toISOString();
  const source = input.source ?? "text";
  const tags = input.tags ?? [];
  const links = input.links ?? [];

  // Write Note
  await client.execute({
    sql: "INSERT INTO notes (id, title, created, source, body) VALUES (?, ?, ?, ?, ?)",
    args: [id, title, created, source, input.content],
  });

  // Write Tags
  for (const tag of tags) {
    await client.execute({
      sql: "INSERT OR IGNORE INTO note_tags (note_id, tag) VALUES (?, ?)",
      args: [id, tag],
    });
  }

  // Write Links (Bidirectional)
  for (const target of links) {
    await client.batch([
      { sql: "INSERT OR IGNORE INTO note_links (from_id, to_id) VALUES (?, ?)", args: [id, target] },
      { sql: "INSERT OR IGNORE INTO note_links (from_id, to_id) VALUES (?, ?)", args: [target, id] },
    ]);
  }

  return {
    id,
    title,
    tags,
    links,
    created,
    source,
    body: input.content,
  };
}

/** Read a single note by id from the database, or null if it does not exist. */
export async function readNote(id: string): Promise<Note | null> {
  await ensureDb();

  const noteRes = await client.execute({
    sql: "SELECT id, title, created, source, body FROM notes WHERE id = ?",
    args: [id],
  });
  if (noteRes.rows.length === 0) return null;

  const row = noteRes.rows[0];

  const tagsRes = await client.execute({
    sql: "SELECT tag FROM note_tags WHERE note_id = ?",
    args: [id],
  });

  const linksRes = await client.execute({
    sql: "SELECT to_id FROM note_links WHERE from_id = ?",
    args: [id],
  });

  return {
    id: row.id as string,
    title: row.title as string,
    created: row.created as string,
    source: row.source as NoteSource,
    body: row.body as string,
    tags: tagsRes.rows.map((r) => r.tag as string),
    links: linksRes.rows.map((r) => r.to_id as string),
  };
}

/** List every note, newest first (by id, which is timestamp-sortable). */
export async function listNotes(): Promise<Note[]> {
  await ensureDb();

  const notesRes = await client.execute("SELECT id, title, created, source, body FROM notes ORDER BY id DESC");
  if (notesRes.rows.length === 0) return [];

  const tagsRes = await client.execute("SELECT note_id, tag FROM note_tags");
  const linksRes = await client.execute("SELECT from_id, to_id FROM note_links");

  const tagsMap = new Map<string, string[]>();
  for (const row of tagsRes.rows) {
    const noteId = row.note_id as string;
    const tag = row.tag as string;
    if (!tagsMap.has(noteId)) tagsMap.set(noteId, []);
    tagsMap.get(noteId)!.push(tag);
  }

  const linksMap = new Map<string, string[]>();
  for (const row of linksRes.rows) {
    const fromId = row.from_id as string;
    const toId = row.to_id as string;
    if (!linksMap.has(fromId)) linksMap.set(fromId, []);
    linksMap.get(fromId)!.push(toId);
  }

  return notesRes.rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    created: row.created as string,
    source: row.source as NoteSource,
    body: row.body as string,
    tags: tagsMap.get(row.id as string) || [],
    links: linksMap.get(row.id as string) || [],
  }));
}

/** Case-insensitive search over title + tags + body using SQLite. */
export async function searchNotes(query: string, limit = 10): Promise<NoteSearchResult[]> {
  await ensureDb();

  const q = `%${query.trim().toLowerCase()}%`;
  const res = await client.execute({
    sql: `
      SELECT id, title, body FROM notes
      WHERE lower(title) LIKE ?
         OR lower(body) LIKE ?
         OR id IN (SELECT note_id FROM note_tags WHERE lower(tag) LIKE ?)
      ORDER BY id DESC
      LIMIT ?
    `,
    args: [q, q, q, limit],
  });

  return res.rows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    snippet: snippetFor(row.body as string, query.trim().toLowerCase()),
  }));
}

function snippetFor(body: string, q: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (q.length === 0) return flat.slice(0, 160);
  const idx = flat.toLowerCase().indexOf(q);
  if (idx === -1) return flat.slice(0, 160);
  const start = Math.max(0, idx - 40);
  return `${start > 0 ? "…" : ""}${flat.slice(start, start + 160)}`;
}

/**
 * Add a bidirectional link between two notes. Updates the `links` table
 * for both notes so backlinks resolve in either direction.
 */
export async function addLink(fromId: string, toId: string): Promise<void> {
  if (fromId === toId) return;
  await ensureDb();

  const [fromExists, toExists] = await Promise.all([
    client.execute({ sql: "SELECT 1 FROM notes WHERE id = ?", args: [fromId] }),
    client.execute({ sql: "SELECT 1 FROM notes WHERE id = ?", args: [toId] }),
  ]);

  if (fromExists.rows.length === 0 || toExists.rows.length === 0) {
    throw new Error(`cannot link: missing note ${fromExists.rows.length === 0 ? fromId : toId}`);
  }

  await client.batch([
    { sql: "INSERT OR IGNORE INTO note_links (from_id, to_id) VALUES (?, ?)", args: [fromId, toId] },
    { sql: "INSERT OR IGNORE INTO note_links (from_id, to_id) VALUES (?, ?)", args: [toId, fromId] },
  ]);
}

/** Return every note id that links to the given note (bidirectional). */
export async function backlinksOf(id: string): Promise<string[]> {
  await ensureDb();
  const res = await client.execute({
    sql: "SELECT to_id FROM note_links WHERE from_id = ?",
    args: [id],
  });
  return res.rows.map((row) => row.to_id as string);
}
