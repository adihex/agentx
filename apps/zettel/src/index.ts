import { AgentEventLoop, LLMOrchestrator } from "@agentx/core";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as dotenv from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { WebSocketServer } from "ws";
import { auth } from "./notes/auth.js";
import {
  createNoteTool,
  linkNotesTool,
  searchNotesTool,
  getNoteTool,
} from "./tools/notes.js";
import { transcribeAudioTool, transcribeAudio } from "./tools/transcribe.js";
import { listNotes, readNote, backlinksOf, writeNote, listCustomTools, writeCustomTool, deleteCustomTool } from "./notes/store.js";

dotenv.config();
console.log("[zettel] Startup - BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);

if (process.env.NODE_ENV === "test" || process.env.MOCK_LLM === "true") {
  console.log("[zettel] 🛠️  NODE_ENV=test or MOCK_LLM=true detected. Injecting LLMOrchestrator prototype stub...");
  LLMOrchestrator.prototype.runStep = async function (messages, tools, abortSignal, model, onTextDelta) {
    const lastUserMsg = String([...messages].reverse().find(m => m.role === "user")?.content ?? "");
    const hasToolResult = messages.some(m => m.role === "tool");
    
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
            toolCalls: []
          }
        ]
      };
    }

    let text = "I am a helpful assistant.";
    let toolCalls: any[] = [];
    
    if (lastUserMsg.includes("apples")) {
      toolCalls.push({
        toolCallId: "tc-apples",
        toolName: "createNote",
        input: {
          content: "Apples are delicious fruits.",
          title: "About Apples",
          tags: ["apples", "fruit"]
        }
      });
      text = "I have created a note about apples for you.";
    } else if (lastUserMsg.includes("oranges")) {
      toolCalls.push({
        toolCallId: "tc-oranges",
        toolName: "createNote",
        input: {
          content: "Oranges are citrus fruits.",
          title: "About Oranges",
          tags: ["oranges", "fruit"]
        }
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
          toolCalls: toolCalls.map(tc => ({
            id: tc.toolCallId,
            type: "function",
            function: { name: tc.toolName, arguments: JSON.stringify(tc.input) }
          }))
        }
      ]
    };
  };
}

const app = new Hono();

// CORS for GitHub Pages and local dev
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        "https://adihex.github.io",
        "http://localhost:5173",
        "http://localhost:5174",
      ];
      return allowed.includes(origin) ? origin : allowed[0];
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
  }),
);

// Better Auth endpoints (GET/POST)
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Protected endpoints using Hono RPC
const api = new Hono<{ Variables: { user: any } }>();

// Auth Middleware for Hono
api.use("/*", async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", session.user);
  await next();
});

const routes = api
  .get("/notes", async (c) => {
    const user = c.get("user");
    try {
      const notes = await listNotes(user.id);
      return c.json({ notes });
    } catch {
      return c.json({ notes: [] });
    }
  })
  .get("/note", async (c) => {
    const id = c.req.query("id") ?? "";
    const user = c.get("user");
    try {
      const [note, backlinks] = await Promise.all([
        readNote(user.id, id),
        backlinksOf(user.id, id),
      ]);
      return c.json({ note, backlinks });
    } catch {
      return c.json({ note: null, backlinks: [] });
    }
  })
  .get("/graph", async (c) => {
    const user = c.get("user");
    try {
      const notes = await listNotes(user.id);
      const ids = new Set(notes.map((n) => n.id));
      const nodes = notes.map((n) => ({ id: n.id, title: n.title }));
      const seen = new Set<string>();
      const edges: { source: string; target: string }[] = [];
      for (const n of notes) {
        for (const target of n.links) {
          if (!ids.has(target)) continue;
          const key = [n.id, target].sort().join("::");
          if (seen.has(key)) continue;
          seen.add(key);
          edges.push({ source: n.id, target });
        }
      }
      return c.json({ nodes, edges });
    } catch {
      return c.json({ nodes: [], edges: [] });
    }
  })
  .post("/transcribe", async (c) => {
    const user = c.get("user");
    try {
      const body = await c.req.parseBody();
      const file = body["file"] as File | undefined;
      if (!file || file.size === 0) {
        return c.json({ error: "no audio file uploaded under field 'file'" }, 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const data = Buffer.from(arrayBuffer);
      
      const tmpPath = path.join(
        os.tmpdir(),
        `zettel-audio-${Date.now()}-${path.basename(file.name)}`,
      );
      fs.writeFileSync(tmpPath, data);

      try {
        const transcript = await transcribeAudio({ path: tmpPath });
        if (!transcript.text) {
          return c.json({ note: null, transcript });
        }
        const note = await writeNote(user.id, { content: transcript.text, source: "audio" });
        return c.json({ note, transcript });
      } finally {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      }
    } catch (err: unknown) {
      return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  })
  .get("/tools", async (c) => {
    const user = c.get("user");
    try {
      const tools = await listCustomTools(user.id);
      return c.json({ tools });
    } catch {
      return c.json({ tools: [] });
    }
  })
  .post("/tools", async (c) => {
    const user = c.get("user");
    try {
      const body = await c.req.json();
      const { name, description, inputSchema, code, id } = body;
      if (!name || !description || !inputSchema || !code) {
        return c.json({ error: "Missing required fields: name, description, inputSchema, code" }, 400);
      }
      const tool = await writeCustomTool(user.id, { name, description, inputSchema, code, id });
      return c.json({ tool });
    } catch (err: unknown) {
      return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  })
  .delete("/tools", async (c) => {
    const user = c.get("user");
    const id = c.req.query("id");
    if (!id) {
      return c.json({ error: "Missing tool id" }, 400);
    }
    try {
      await deleteCustomTool(user.id, id);
      return c.json({ ok: true });
    } catch (err: unknown) {
      return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
    }
  });

app.route("/api", api);

export type AppType = typeof routes;

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5174;
const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  // Serve static assets in production
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

// Start Hono Node server
export const httpServer = serve({
  fetch: app.fetch,
  port,
});

export const userAgents = new Map<string, AgentEventLoop>();

// A mock HTTP server that does nothing, to prevent AdpServer from binding to the real upgrade event
const mockHttpServer = {
  on: (event: string, callback: any) => {
    // Do nothing
  },
};

function getOrCreateUserAgent(userId: string): AgentEventLoop {
  let userAgent = userAgents.get(userId);
  if (!userAgent) {
    userAgent = new AgentEventLoop({
      systemPrompt: [
        "You are a Zettelkasten thinking partner.",
        "Capture each thought as an atomic note via createNote.",
        "After creating a note, ALWAYS searchNotes for related existing notes and",
        "propose/draw links with linkNotes for genuine conceptual connections.",
        "Be concise.",
      ].join(" "),
      tools: {
        createNote: createNoteTool,
        linkNotes: linkNotesTool,
        searchNotes: searchNotesTool,
        getNote: getNoteTool,
        transcribeAudio: transcribeAudioTool,
      },
      autoTick: true,
      adpServer: mockHttpServer, // Pass mock server to prevent duplicate port binding
    });

    // Intercept/override the thread pool execute method to inject the userId into req.args
    const originalExecute = (userAgent as any).threadPool.execute.bind((userAgent as any).threadPool);
    (userAgent as any).threadPool.execute = async (req: any) => {
      req.args = { ...req.args, userId };
      return originalExecute(req);
    };

    // Forward agent events to ADP control plane (real event names)
    const currentAgent = userAgent;
    currentAgent.on("inference.start", () => {
      currentAgent.emitAdpEvent("Agent.InferenceStart", {});
    });
    currentAgent.on("inference.chunk", ({ chunk }) => {
      currentAgent.emitAdpEvent("Agent.InferenceChunk", { chunk });
    });
    currentAgent.on("inference.end", ({ text }) => {
      currentAgent.emitAdpEvent("Agent.InferenceEnd", { text });
    });
    currentAgent.on("tool.dispatch", (payload) => {
      currentAgent.emitAdpEvent("Agent.ToolStart", payload);
    });
    currentAgent.on("tool.complete", (payload) => {
      if (!payload.result.success) {
        console.error(`[zettel] Tool ${payload.toolName} execution failed:`, payload.result.error);
      }
      currentAgent.emitAdpEvent("Agent.ToolComplete", payload);
    });

    // Drive the agent from prompts arriving over ADP (Session.prompt).
    void (async () => {
      for (;;) {
        const prompt = await currentAgent.waitForPrompt();
        if (prompt == null) break; // shutdown
        try {
          await currentAgent.run(prompt);
        } catch (err) {
          console.error(`[zettel] agent.run failed for user ${userId}:`, err instanceof Error ? err.message : err);
        }
      }
    })();

    userAgents.set(userId, userAgent);
  }
  return userAgent;
}

// Set up WebSocket server and intercept upgrade requests for auth-scoping
const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", async (request, socket, head) => {
  const pathname = request.url ? request.url.split("?")[0] : "";
  if (pathname === "/adp") {
    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            headers.append(key, v);
          }
        } else {
          headers.set(key, value as string);
        }
      }

      // Authenticate the upgrade request using Better Auth
      const session = await auth.api.getSession({
        headers,
      });

      if (!session) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const userId = session.user.id;
      const userAgent = getOrCreateUserAgent(userId);

      wss.handleUpgrade(request, socket, head, (ws) => {
        // Direct connection mapping: emit connection event on the agent's private wss
        (userAgent.adp as any).wss.emit("connection", ws, request);
      });
    } catch (err) {
      console.error("[zettel] Upgrade auth failed:", err);
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
    }
  }
});

console.log("┌──────────────────────────────────────────────────┐");
console.log("│      agentx — Multi-Tenant Zettelkasten App      │");
console.log(`│     Web Interface: http://localhost:${isProd ? port : 5173}          │`);
console.log(`│     ADP WebSocket shared on HTTP server port     │`);
console.log("└──────────────────────────────────────────────────┘");
