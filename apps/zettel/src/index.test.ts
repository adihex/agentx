import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import WebSocket from "ws";

import { mkdirSync } from "node:fs";

// Set up environment before importing index.ts
const testDir = path.join(os.tmpdir(), "agentx-zettel-smoke-test-" + Date.now());
mkdirSync(testDir, { recursive: true });
process.env.ZETTEL_DIR = testDir;
process.env.PORT = "0";

import { LLMOrchestrator, AgenticThreadPool } from "@agentx/core";
import { createNote, linkNotes, searchNotes, getNote } from "./tools/notes.js";

const toolImpls: Record<string, Function> = {
  createNote,
  linkNotes,
  searchNotes,
  getNote,
};

// Intercept tool pool execute to run tools on main thread with Vitest transpiler
vi.spyOn(AgenticThreadPool.prototype, "execute").mockImplementation(async (req) => {
  const start = Date.now();
  const fn = toolImpls[req.toolName];
  if (!fn) {
    return {
      id: req.id,
      toolCallId: req.toolCallId,
      success: false,
      error: `Tool ${req.toolName} not found in mock toolImpls`,
      durationMs: 0,
    };
  }
  try {
    const data = await fn(req.args);
    return {
      id: req.id,
      toolCallId: req.toolCallId,
      success: true,
      data,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      id: req.id,
      toolCallId: req.toolCallId,
      success: false,
      error: err.message || String(err),
      durationMs: Date.now() - start,
    };
  }
});

// Mock the LLMOrchestrator to avoid hitting any real APIs during tests
vi.spyOn(LLMOrchestrator.prototype, "runStep").mockImplementation(
  async (messages: any[], tools: any, abortSignal: any, model?: string, onTextDelta?: any) => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const hasToolResult = messages.some((m) => m.role === "tool");
    console.log(
      "[Mock LLM] messages history roles:",
      messages.map((m) => m.role),
      "hasToolResult:",
      hasToolResult,
    );

    if (hasToolResult) {
      const text = "I have successfully created the note for you.";
      onTextDelta?.(text);
      return {
        text,
        toolCalls: [],
        responseMessages: [
          {
            role: "assistant",
            content: text,
            toolCalls: [],
          },
        ],
      };
    }

    console.log("[Mock LLM] Intercepted user prompt:", lastUserMsg);

    let text = "I am a helpful assistant.";
    let toolCalls: any[] = [];

    if (lastUserMsg.includes("apples")) {
      toolCalls.push({
        toolCallId: "tc-apples",
        toolName: "createNote",
        input: {
          content: "Apples are delicious fruits.",
          title: "About Apples",
          tags: ["apples", "fruit"],
        },
      });
      text = "I have created a note about apples for you.";
    } else if (lastUserMsg.includes("oranges")) {
      toolCalls.push({
        toolCallId: "tc-oranges",
        toolName: "createNote",
        input: {
          content: "Oranges are citrus fruits.",
          title: "About Oranges",
          tags: ["oranges", "fruit"],
        },
      });
      text = "I have created a note about oranges for you.";
    }

    onTextDelta?.(text);

    return {
      text,
      toolCalls,
      responseMessages: [
        {
          role: "assistant",
          content: text,
          toolCalls: toolCalls.map((tc) => ({
            id: tc.toolCallId,
            type: "function",
            function: { name: tc.toolName, arguments: JSON.stringify(tc.input) },
          })),
        },
      ],
    };
  },
);

// Import after env vars are set
const { httpServer, userAgents } = await import("./index.js");
const { client, writeNote, updateNote } = await import("./notes/store.js");

describe("Multi-tenant HTTP/WebSocket Integration Smoke Test", () => {
  let port = 0;

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });

    // Initialize Better Auth schema tables/indexes in the test DB
    await client.batch([
      {
        sql: 'CREATE TABLE IF NOT EXISTS "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" integer not null, "image" text, "createdAt" date not null, "updatedAt" date not null)',
        args: [],
      },
      {
        sql: 'CREATE TABLE IF NOT EXISTS "session" ("id" text not null primary key, "expiresAt" date not null, "token" text not null unique, "createdAt" date not null, "updatedAt" date not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade)',
        args: [],
      },
      {
        sql: 'CREATE TABLE IF NOT EXISTS "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" date, "refreshTokenExpiresAt" date, "scope" text, "password" text, "createdAt" date not null, "updatedAt" date not null)',
        args: [],
      },
      {
        sql: 'CREATE TABLE IF NOT EXISTS "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" date not null, "createdAt" date not null, "updatedAt" date not null)',
        args: [],
      },
      { sql: 'CREATE INDEX IF NOT EXISTS "session_userId_idx" on "session" ("userId")', args: [] },
      { sql: 'CREATE INDEX IF NOT EXISTS "account_userId_idx" on "account" ("userId")', args: [] },
      {
        sql: 'CREATE INDEX IF NOT EXISTS "verification_identifier_idx" on "verification" ("identifier")',
        args: [],
      },
    ]);

    // Ensure the server has bound and get the ephemeral port
    const addr = httpServer.address();
    if (!addr || typeof addr === "string") {
      throw new Error("Failed to get server address");
    }
    port = addr.port;
    console.log(`[Smoke Test] Test server is running on port ${port}`);
  });

  afterAll(async () => {
    // Shut down all user agents
    for (const agent of userAgents.values()) {
      await agent.shutdown();
    }
    // Close HTTP server
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
    // Close database client
    client.close();
  });

  async function signup(email: string, name: string): Promise<string> {
    const signupResponse = await fetch(`http://localhost:${port}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: "password123",
        name,
      }),
    });

    if (!signupResponse.ok) {
      const text = await signupResponse.text();
      throw new Error(`Signup failed for ${email}: ${signupResponse.status} ${text}`);
    }

    const cookieHeaders = signupResponse.headers.getSetCookie();
    return cookieHeaders.map((c) => c.split(";")[0]).join("; ");
  }

  async function getNotes(cookies: string) {
    const res = await fetch(`http://localhost:${port}/api/notes`, {
      headers: {
        cookie: cookies,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to get notes: ${res.status} ${text}`);
    }
    const data = await res.json();
    return data.notes || [];
  }

  function connectWs(cookies: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${port}/adp`, {
        headers: {
          cookie: cookies,
        },
      });
      ws.on("open", () => resolve(ws));
      ws.on("error", (err) => reject(err));
    });
  }

  function waitForToolComplete(ws: WebSocket): Promise<void> {
    return new Promise((resolve) => {
      const handleMsg = (data: WebSocket.RawData) => {
        try {
          const text = Array.isArray(data)
            ? Buffer.concat(data).toString("utf8")
            : Buffer.isBuffer(data)
              ? data.toString("utf8")
              : Buffer.from(data).toString("utf8");
          const parsed = JSON.parse(text);
          if (parsed.method === "Agent.ToolComplete") {
            ws.off("message", handleMsg);
            resolve();
          }
        } catch {}
      };
      ws.on("message", handleMsg);
    });
  }

  it("should isolate notes, agents, and websockets between two tenants", async () => {
    // 1. Sign up User A and User B
    const cookieA = await signup(`userA-${Date.now()}@example.com`, "User A");
    const cookieB = await signup(`userB-${Date.now()}@example.com`, "User B");

    // 2. Initial state: verify notes lists are empty
    const notesA0 = await getNotes(cookieA);
    const notesB0 = await getNotes(cookieB);
    expect(notesA0).toHaveLength(0);
    expect(notesB0).toHaveLength(0);

    // 3. Connect WebSockets for both users
    const wsA = await connectWs(cookieA);
    const wsB = await connectWs(cookieB);

    // 4. User A prompts their agent to write about apples
    wsA.send(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "prompt-A",
        method: "Session.prompt",
        params: { prompt: "Write a note about apples." },
      }),
    );
    await waitForToolComplete(wsA);

    // 5. User B prompts their agent to write about oranges
    wsB.send(
      JSON.stringify({
        jsonrpc: "2.0",
        id: "prompt-B",
        method: "Session.prompt",
        params: { prompt: "Write a note about oranges." },
      }),
    );
    await waitForToolComplete(wsB);

    // 6. Verify User A note list has apples note, no oranges note
    const notesA1 = await getNotes(cookieA);
    expect(notesA1).toHaveLength(1);
    expect(notesA1[0].title).toBe("About Apples");
    expect(notesA1[0].body).toContain("Apples are delicious");

    // 7. Verify User B note list has oranges note, no apples note
    const notesB1 = await getNotes(cookieB);
    expect(notesB1).toHaveLength(1);
    expect(notesB1[0].title).toBe("About Oranges");
    expect(notesB1[0].body).toContain("Oranges are citrus");

    // 8. Topic pages search only the authenticated tenant's notes.
    const wikiA = await fetch(`http://localhost:${port}/api/wiki/Apples`, {
      headers: { cookie: cookieA },
    });
    expect(wikiA.status).toBe(200);
    const wikiAData = await wikiA.json();
    expect(wikiAData.markdown).toContain("About Apples");
    expect(wikiAData.markdown).not.toContain("About Oranges");

    const wikiB = await fetch(`http://localhost:${port}/api/wiki/Apples`, {
      headers: { cookie: cookieB },
    });
    expect(wikiB.status).toBe(200);
    expect((await wikiB.json()).markdown).toContain("No notes found");

    // 9. Cleanup WebSockets
    wsA.close();
    wsB.close();
  });

  describe("HTTP PUT and DELETE /api/note", () => {
    it("should edit and delete notes with proper authorization", async () => {
      const emailA = `usera-api-${Date.now()}@example.com`;
      const emailB = `userb-api-${Date.now()}@example.com`;
      const cookieA = await signup(emailA, "User A");
      const cookieB = await signup(emailB, "User B");

      // Get user IDs from database to seed data
      const resA = await client.execute({
        sql: "SELECT id FROM user WHERE email = ?",
        args: [emailA],
      });
      const userIdA = resA.rows[0].id as string;

      // Seed a note for User A
      const noteA = await writeNote(userIdA, {
        content: "Original Content",
        title: "Original Title",
        tags: ["original"],
      });

      // 1. User B attempts to edit User A's note (should fail)
      const editOtherRes = await fetch(`http://localhost:${port}/api/note`, {
        method: "PUT",
        headers: {
          cookie: cookieB,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id: noteA.id,
          title: "Hacked Title",
          content: "Hacked Content",
        }),
      });
      expect(editOtherRes.status).toBeGreaterThanOrEqual(400);

      // 2. User A successfully edits their own note
      const editOwnRes = await fetch(`http://localhost:${port}/api/note`, {
        method: "PUT",
        headers: {
          cookie: cookieA,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id: noteA.id,
          title: "Edited Title",
          content: "Edited Content",
          tags: ["edited"],
        }),
      });
      expect(editOwnRes.status).toBe(200);
      const editOwnData = await editOwnRes.json();
      expect(editOwnData.note.title).toBe("Edited Title");
      expect(editOwnData.note.body).toBe("Edited Content");
      expect(editOwnData.note.tags).toEqual(["edited"]);

      // 3. User B attempts to delete User A's note (should fail)
      const deleteOtherRes = await fetch(`http://localhost:${port}/api/note?id=${noteA.id}`, {
        method: "DELETE",
        headers: {
          cookie: cookieB,
        },
      });
      expect(deleteOtherRes.status).toBeGreaterThanOrEqual(400);

      // 4. User A successfully deletes their own note
      const deleteOwnRes = await fetch(`http://localhost:${port}/api/note?id=${noteA.id}`, {
        method: "DELETE",
        headers: {
          cookie: cookieA,
        },
      });
      expect(deleteOwnRes.status).toBe(200);
      const deleteOwnData = await deleteOwnRes.json();
      expect(deleteOwnData.ok).toBe(true);

      // Verify note is gone from list
      const notesA = await getNotes(cookieA);
      expect(notesA.find((n: any) => n.id === noteA.id)).toBeUndefined();
    });
  });

  describe("REST API surface", () => {
    it("reports health without auth", async () => {
      const res = await fetch(`http://localhost:${port}/_health`);
      expect(res.status).toBe(200);
      expect((await res.json()).status).toBe("ok");
    });

    it("rejects unauthenticated API requests with 401", async () => {
      const res = await fetch(`http://localhost:${port}/api/notes`);
      expect(res.status).toBe(401);
    });

    it("serves a note with its backlinks", async () => {
      const email = `reader-${Date.now()}@example.com`;
      const cookie = await signup(email, "Reader");
      const res0 = await fetch(`http://localhost:${port}/api/note`, {
        headers: { cookie },
      });
      expect(res0.status).toBe(200);
      expect((await res0.json()).note).toBeNull();

      const resU = await client.execute({
        sql: "SELECT id FROM user WHERE email = ?",
        args: [email],
      });
      const userId = resU.rows[0].id as string;

      const target = await writeNote(userId, { title: "Target", content: "backlink target" });
      const source = await writeNote(userId, {
        title: "Source",
        content: "links out",
        links: [target.id],
      });

      const res = await fetch(`http://localhost:${port}/api/note?id=${target.id}`, {
        headers: { cookie },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.note.title).toBe("Target");
      expect(data.backlinks).toContain(source.id);
    });

    it("builds a deduplicated knowledge graph", async () => {
      const email = `graph-${Date.now()}@example.com`;
      const cookie = await signup(email, "Grapher");
      const resU = await client.execute({
        sql: "SELECT id FROM user WHERE email = ?",
        args: [email],
      });
      const userId = resU.rows[0].id as string;

      const a = await writeNote(userId, { title: "NodeA", content: "a" });
      const b = await writeNote(userId, { title: "NodeB", content: "b", links: [a.id] });
      // Pointing A back at B creates the same undirected edge -> dedup kicks in.
      await updateNote(userId, a.id, { links: [b.id] });

      const res = await fetch(`http://localhost:${port}/api/graph`, {
        headers: { cookie },
      });
      expect(res.status).toBe(200);
      const graph = await res.json();
      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
      const edge = graph.edges[0];
      expect([edge.source, edge.target].sort()).toEqual([a.id, b.id].sort());
    });

    it("transcribes an uploaded audio file via the mock backend", async () => {
      const cookie = await signup(`audio-${Date.now()}@example.com`, "Audio");
      const form = new FormData();
      form.append("file", new File([Buffer.from("RIFFfake")], "clip.wav", { type: "audio/wav" }));
      const res = await fetch(`http://localhost:${port}/api/transcribe`, {
        method: "POST",
        headers: { cookie },
        body: form,
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.transcript.text).toBe("Write a note about apples.");
    });

    it("rejects transcribe requests without a file", async () => {
      const cookie = await signup(`audio2-${Date.now()}@example.com`, "Audio2");
      const form = new FormData();
      const res = await fetch(`http://localhost:${port}/api/transcribe`, {
        method: "POST",
        headers: { cookie },
        body: form,
      });
      expect(res.status).toBe(400);
    });

    it("CRUDs custom tools with validation", async () => {
      const cookie = await signup(`tools-${Date.now()}@example.com`, "Tools");

      const bad = await fetch(`http://localhost:${port}/api/tools`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ name: "incomplete" }),
      });
      expect(bad.status).toBe(400);

      const good = await fetch(`http://localhost:${port}/api/tools`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({
          name: "mytool",
          description: "d",
          inputSchema: "{}",
          code: "return 1",
        }),
      });
      expect(good.status).toBe(200);
      const tool = (await good.json()).tool;
      expect(tool.name).toBe("mytool");

      const list = await fetch(`http://localhost:${port}/api/tools`, { headers: { cookie } });
      expect((await list.json()).tools.map((t: any) => t.id)).toContain(tool.id);

      const noId = await fetch(`http://localhost:${port}/api/tools`, {
        method: "DELETE",
        headers: { cookie },
      });
      expect(noId.status).toBe(400);

      const del = await fetch(`http://localhost:${port}/api/tools?id=${tool.id}`, {
        method: "DELETE",
        headers: { cookie },
      });
      expect(del.status).toBe(200);
    });

    it("rejects PUT/DELETE /api/note without an id", async () => {
      const cookie = await signup(`noid-${Date.now()}@example.com`, "NoId");
      const put = await fetch(`http://localhost:${port}/api/note`, {
        method: "PUT",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ title: "x" }),
      });
      expect(put.status).toBe(400);
      const del = await fetch(`http://localhost:${port}/api/note`, {
        method: "DELETE",
        headers: { cookie },
      });
      expect(del.status).toBe(400);
    });

    it("rejects unauthenticated WebSocket upgrades", async () => {
      const net = await import("node:net");
      await new Promise<void>((resolve, reject) => {
        const sock = net.connect(port, "127.0.0.1", () => {
          sock.write(
            "GET /adp HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\n" +
              "Connection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n" +
              "Sec-WebSocket-Version: 13\r\n\r\n",
          );
        });
        let buf = "";
        const timer = setTimeout(() => {
          sock.destroy();
          reject(new Error("timed out waiting for 401"));
        }, 5000);
        sock.on("data", (chunk) => {
          buf += chunk.toString();
          if (buf.includes("401")) {
            clearTimeout(timer);
            sock.destroy();
            resolve();
          }
        });
        sock.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });
    });
  });
});
