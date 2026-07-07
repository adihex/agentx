/**
 * Note store for the importer — typesafe queries via Kysely.
 *
 * Mirrors the note-writing semantics of apps/zettel/src/notes/store.ts
 * (schema, ID generation, embeddings, GraphRAG extraction) so imported notes
 * are indistinguishable from notes created by the zettel app. Kept standalone
 * so this CLI stays npx-able without dragging in the zettel server.
 */

import { createClient } from "@libsql/client";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely, sql } from "kysely";
import { embed, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// ── Database schema interface ──────────────────────────────────────────────────

export interface NotesTable {
  id: string;
  user_id: string;
  title: string;
  created: string;
  source: string;
  body: string;
  embedding: string | null; // JSON-serialized number[] for SQLite compatibility
}

export interface NoteTagsTable {
  note_id: string;
  tag: string;
}

export interface NoteLinksTable {
  from_id: string;
  to_id: string;
}

export interface EntitiesTable {
  name: string;
  type: string;
  description: string | null;
}

export interface EntityRelationsTable {
  source: string;
  target: string;
  relationship: string;
  note_id: string;
}

export interface Database {
  notes: NotesTable;
  note_tags: NoteTagsTable;
  note_links: NoteLinksTable;
  entities: EntitiesTable;
  entity_relations: EntityRelationsTable;
}

// ── Graph schema ───────────────────────────────────────────────────────────────

const GraphSchema = z.object({
  nodes: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
    }),
  ),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      relationship: z.string(),
    }),
  ),
});

// ── Public interfaces ──────────────────────────────────────────────────────────

export interface InsertNoteInput {
  content: string;
  title?: string;
  tags?: string[];
}

export interface InsertedNote {
  id: string;
  title: string;
  embedded: boolean;
}

export interface GraphResult {
  nodes: number;
  edges: number;
}

// ── Store class ────────────────────────────────────────────────────────────────

export class NoteStore {
  private db: Kysely<Database>;
  private ready: Promise<void>;

  constructor(opts: { url: string; authToken?: string }) {
    const client = createClient({ url: opts.url, authToken: opts.authToken });
    // @libsql/kysely-libsql@0.4.1 depends on @libsql/core@0.8.1 but our
    // @libsql/client resolves @libsql/core@0.14.0; the runtime API is compatible.
    this.db = new Kysely<Database>({
      // @ts-expect-error — @libsql/core version mismatch (see above)
      dialect: new LibsqlDialect({ client }),
    });
    this.ready = this.initDb();
  }

  /** Ensure the note-related tables exist (same DDL as the zettel app). */
  private async initDb(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        created TEXT NOT NULL,
        source TEXT NOT NULL,
        body TEXT NOT NULL,
        embedding F32_BLOB(768)
      )
    `.execute(this.db);
    await sql`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (note_id, tag),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `.execute(this.db);
    await sql`
      CREATE TABLE IF NOT EXISTS note_links (
        from_id TEXT NOT NULL,
        to_id TEXT NOT NULL,
        PRIMARY KEY (from_id, to_id),
        FOREIGN KEY (from_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (to_id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `.execute(this.db);
    await sql`
      CREATE TABLE IF NOT EXISTS entities (
        name TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        description TEXT
      )
    `.execute(this.db);
    await sql`
      CREATE TABLE IF NOT EXISTS entity_relations (
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        relationship TEXT NOT NULL,
        note_id TEXT NOT NULL,
        FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `.execute(this.db);
  }

  async verifyConnection(): Promise<void> {
    await this.ready;
    await sql`SELECT 1`.execute(this.db);
  }

  /** Timestamp-based note ID (YYYYMMDDHHmmss) with collision-free suffix. */
  private async generateNoteId(): Promise<string> {
    const now = new Date();
    const pad = (n: number, w = 2) => String(n).padStart(w, "0");
    const base =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    let id = base;
    let suffix = 0;
    while (true) {
      const row = await this.db
        .selectFrom("notes")
        .select(sql`1`.as("exists"))
        .where("id", "=", id)
        .executeTakeFirst();
      if (!row) return id;
      suffix += 1;
      id = `${base}-${suffix}`;
    }
  }

  /**
   * Insert a note (with embedding). Embedding failures are non-fatal, matching
   * the zettel app: the note is still created, `embedded` reports the outcome.
   */
  async insertNote(userId: string, input: InsertNoteInput): Promise<InsertedNote> {
    await this.ready;

    const id = await this.generateNoteId();
    const firstLine = input.content.split("\n").find((l) => l.trim().length > 0) ?? "";
    const title = (input.title?.trim() || firstLine.trim() || id).slice(0, 200);
    const created = new Date().toISOString();

    let embeddingArray: number[] | null = null;
    try {
      // text-embedding-004 (used by the zettel app) was retired by Google;
      // gemini-embedding-001 at 768 dims matches the F32_BLOB(768) column.
      const { embedding } = await embed({
        model: google.textEmbeddingModel("gemini-embedding-001"),
        value: `Title: ${title}\n\nBody: ${input.content}`,
        providerOptions: { google: { outputDimensionality: 768 } },
      });
      embeddingArray = embedding;
    } catch {
      // Non-fatal: note is still created without an embedding.
    }

    await this.db
      .insertInto("notes")
      .values({
        id,
        user_id: userId,
        title,
        created,
        source: "text",
        body: input.content,
        embedding: embeddingArray ? JSON.stringify(embeddingArray) : null,
      })
      .execute();

    for (const tag of input.tags ?? []) {
      await this.db
        .insertInto("note_tags")
        .values({ note_id: id, tag })
        .onConflict((oc) => oc.columns(["note_id", "tag"]).doNothing())
        .execute();
    }

    return { id, title, embedded: embeddingArray !== null };
  }

  /** Extract entities/relations from the content and persist them. */
  async extractAndSaveGraph(noteId: string, content: string): Promise<GraphResult> {
    await this.ready;

    const { object: graph } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: GraphSchema,
      prompt: `Extract explicit concepts (nodes) and relationships (edges) from the following note:\n\n${content}`,
    });

    for (const node of graph.nodes) {
      await this.db
        .insertInto("entities")
        .values({ name: node.name, type: node.type, description: node.description })
        .onConflict((oc) =>
          oc.column("name").doUpdateSet({ type: node.type, description: node.description }),
        )
        .execute();
    }
    for (const edge of graph.edges) {
      await this.db
        .insertInto("entity_relations")
        .values({
          source: edge.source,
          target: edge.target,
          relationship: edge.relationship,
          note_id: noteId,
        })
        .execute();
    }

    return { nodes: graph.nodes.length, edges: graph.edges.length };
  }

  async destroy(): Promise<void> {
    await this.db.destroy();
  }
}
