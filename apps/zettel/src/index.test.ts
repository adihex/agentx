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
const { client } = await import("./notes/store.js");

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
    await client.close();
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
          const parsed = JSON.parse(data.toString());
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

    // 8. Cleanup WebSockets
    wsA.close();
    wsB.close();
  });
});
