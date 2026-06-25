/**
 * Zettelkasten note store.
 *
 * Atomic notes are persisted as one markdown file per note with YAML
 * frontmatter and `[[wikilink]]` style links in the body:
 *
 *   <ZETTEL_DIR>/<id>.md
 *
 * The store is plain async, fs-based, and argv-safe (no shell). Writes are
 * per-file atomic (write to a temp file in the same dir, then rename). The
 * directory is a persistent knowledge base — NOT a temp dir.
 */

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

/** Resolve (and lazily create) the persistent zettel directory. */
function zettelDir(): string {
  return process.env.ZETTEL_DIR || path.join(os.homedir(), ".agentx-zettel");
}

async function ensureDir(): Promise<string> {
  const dir = zettelDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function notePath(dir: string, id: string): string {
  return path.join(dir, `${id}.md`);
}

/** Build a collision-safe timestamp id of the form YYYYMMDDHHmmss[-N]. */
async function nextId(dir: string): Promise<string> {
  const now = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  const base =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  let candidate = base;
  let suffix = 0;
  // Append -1, -2, … if a note with that id already exists.
  // eslint-disable-next-line no-await-in-loop
  while (await fileExists(notePath(dir, candidate))) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// ── Serialization ─────────────────────────────────────────────────────────────

/** Escape a single string value for inline YAML (always double-quoted). */
function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Serialize a YAML scalar string array, e.g. ["a","b"]. */
function yamlStringArray(values: string[]): string {
  return `[${values.map(yamlString).join(", ")}]`;
}

function serialize(note: Note): string {
  const fm = [
    "---",
    `id: ${yamlString(note.id)}`,
    `title: ${yamlString(note.title)}`,
    `tags: ${yamlStringArray(note.tags)}`,
    `links: ${yamlStringArray(note.links)}`,
    `created: ${yamlString(note.created)}`,
    `source: ${yamlString(note.source)}`,
    "---",
    "",
  ].join("\n");
  return `${fm}${note.body}\n`;
}

/** Parse a YAML inline string array (the only array shape we emit). */
function parseStringArray(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return [];
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [];
  const out: string[] = [];
  for (const part of splitTopLevel(inner)) {
    out.push(parseScalar(part.trim()));
  }
  return out.filter((s) => s.length > 0);
}

/** Split a comma list while respecting double-quoted segments. */
function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inQuote = false;
  let escaped = false;
  for (const ch of input) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      current += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
      continue;
    }
    if (ch === "," && !inQuote) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim().length > 0) parts.push(current);
  return parts;
}

/** Parse a YAML scalar — handles double-quoted and bare values. */
function parseScalar(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return trimmed;
}

function parse(id: string, raw: string): Note {
  const fallback: Note = {
    id,
    title: id,
    tags: [],
    links: [],
    created: new Date().toISOString(),
    source: "text",
    body: raw,
  };

  if (!raw.startsWith("---")) return fallback;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return fallback;

  const fmBlock = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "").replace(/\n$/, "");

  const fm: Record<string, string> = {};
  for (const line of fmBlock.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    fm[key] = line.slice(idx + 1).trim();
  }

  const source = parseScalar(fm.source ?? "");
  return {
    id: fm.id ? parseScalar(fm.id) : id,
    title: fm.title ? parseScalar(fm.title) : id,
    tags: fm.tags ? parseStringArray(fm.tags) : [],
    links: fm.links ? parseStringArray(fm.links) : [],
    created: fm.created ? parseScalar(fm.created) : fallback.created,
    source: source === "audio" ? "audio" : "text",
    body,
  };
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmp, contents, "utf8");
  await fs.rename(tmp, filePath);
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface WriteNoteInput {
  content: string;
  title?: string;
  tags?: string[];
  links?: string[];
  source?: NoteSource;
}

/** Create a new atomic note and return its generated id. */
export async function writeNote(input: WriteNoteInput): Promise<Note> {
  const dir = await ensureDir();
  const id = await nextId(dir);
  const firstLine = input.content.split("\n").find((l) => l.trim().length > 0) ?? "";
  const title = (input.title?.trim() || firstLine.trim() || id).slice(0, 200);

  const note: Note = {
    id,
    title,
    tags: input.tags ?? [],
    links: input.links ?? [],
    created: new Date().toISOString(),
    source: input.source ?? "text",
    body: input.content,
  };

  await atomicWrite(notePath(dir, id), serialize(note));
  return note;
}

/** Read a single note by id, or null if it does not exist. */
export async function readNote(id: string): Promise<Note | null> {
  const dir = await ensureDir();
  try {
    const raw = await fs.readFile(notePath(dir, id), "utf8");
    return parse(id, raw);
  } catch {
    return null;
  }
}

/** List every note, newest first (by id, which is timestamp-sortable). */
export async function listNotes(): Promise<Note[]> {
  const dir = await ensureDir();
  const entries = await fs.readdir(dir);
  const ids = entries
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -3))
    .sort()
    .reverse();

  const notes: Note[] = [];
  for (const id of ids) {
    // eslint-disable-next-line no-await-in-loop
    const note = await readNote(id);
    if (note) notes.push(note);
  }
  return notes;
}

/** Case-insensitive search over title + tags + body. */
export async function searchNotes(query: string, limit = 10): Promise<NoteSearchResult[]> {
  const q = query.trim().toLowerCase();
  const notes = await listNotes();
  const results: NoteSearchResult[] = [];

  for (const note of notes) {
    const haystack = `${note.title}\n${note.tags.join(" ")}\n${note.body}`.toLowerCase();
    if (q.length === 0 || haystack.includes(q)) {
      results.push({ id: note.id, title: note.title, snippet: snippetFor(note.body, q) });
    }
    if (results.length >= limit) break;
  }
  return results;
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
 * Add a bidirectional link between two notes. Updates the `links` array on
 * BOTH note files so backlinks resolve in either direction.
 */
export async function addLink(fromId: string, toId: string): Promise<void> {
  if (fromId === toId) return;
  const dir = await ensureDir();
  const [from, to] = await Promise.all([readNote(fromId), readNote(toId)]);
  if (!from || !to) {
    throw new Error(`cannot link: missing note ${!from ? fromId : toId}`);
  }

  if (!from.links.includes(toId)) {
    from.links.push(toId);
    await atomicWrite(notePath(dir, fromId), serialize(from));
  }
  if (!to.links.includes(fromId)) {
    to.links.push(fromId);
    await atomicWrite(notePath(dir, toId), serialize(to));
  }
}

/** Return every note id that links to the given note (bidirectional). */
export async function backlinksOf(id: string): Promise<string[]> {
  const notes = await listNotes();
  const set = new Set<string>();
  const self = notes.find((n) => n.id === id);
  if (self) {
    for (const linked of self.links) set.add(linked);
  }
  for (const note of notes) {
    if (note.id !== id && note.links.includes(id)) set.add(note.id);
  }
  return [...set];
}
