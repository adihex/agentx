import { createServer } from "vite";
import { AgentEventLoop } from "@agentx/core";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { IncomingMessage, ServerResponse } from "node:http";
import * as dotenv from "dotenv";
import {
  createNoteTool,
  linkNotesTool,
  searchNotesTool,
  getNoteTool,
} from "./tools/notes.js";
import { transcribeAudioTool, transcribeAudio } from "./tools/transcribe.js";
import { listNotes, readNote, backlinksOf, writeNote } from "./notes/store.js";

// Required env: OPENAI_API_KEY, OPENAI_BASE_URL (optional), AGENT_MODEL (optional)
// Optional transcription env: GROQ_API_KEY, WHISPER_BIN, WHISPER_MODEL, ZETTEL_DIR
dotenv.config();

function sendJson(res: ServerResponse, body: unknown): void {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

/** Collect the raw request body as a Buffer. */
function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/**
 * Extract the first uploaded file from a multipart/form-data body. Returns the
 * file bytes and a best-effort filename. Minimal parser — sufficient for a
 * single `<input type=file>` upload.
 */
function parseFirstMultipartFile(
  buffer: Buffer,
  contentType: string,
): { filename: string; data: Buffer } | null {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const boundary = match ? (match[1] ?? match[2]).trim() : null;
  if (!boundary) return null;

  const delimiter = Buffer.from(`--${boundary}`);
  const headerEnd = Buffer.from("\r\n\r\n");

  let start = buffer.indexOf(delimiter);
  while (start !== -1) {
    const partStart = start + delimiter.length;
    const next = buffer.indexOf(delimiter, partStart);
    if (next === -1) break;

    const part = buffer.subarray(partStart, next);
    const sep = part.indexOf(headerEnd);
    if (sep !== -1) {
      const rawHeaders = part.subarray(0, sep).toString("utf8");
      if (/filename="?([^"\r\n]*)"?/i.test(rawHeaders) && /name="?file"?/i.test(rawHeaders)) {
        const fnMatch = /filename="?([^"\r\n]*)"?/i.exec(rawHeaders);
        const filename = fnMatch?.[1]?.trim() || "upload.bin";
        // Body runs from after the header separator to the trailing CRLF before the next boundary.
        let body = part.subarray(sep + headerEnd.length);
        if (body.length >= 2 && body[body.length - 2] === 0x0d && body[body.length - 1] === 0x0a) {
          body = body.subarray(0, body.length - 2);
        }
        return { filename, data: body };
      }
    }
    start = next;
  }
  return null;
}

async function handleTranscribe(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const buffer = await readBody(req);
  const file = parseFirstMultipartFile(buffer, req.headers["content-type"] ?? "");
  if (!file || file.data.length === 0) {
    res.statusCode = 400;
    sendJson(res, { error: "no audio file uploaded under field 'file'" });
    return;
  }

  const tmpPath = path.join(
    os.tmpdir(),
    `zettel-audio-${Date.now()}-${path.basename(file.filename)}`,
  );
  fs.writeFileSync(tmpPath, file.data);

  try {
    const transcript = await transcribeAudio({ path: tmpPath });
    if (!transcript.text) {
      sendJson(res, { note: null, transcript });
      return;
    }
    const note = await writeNote({ content: transcript.text, source: "audio" });
    sendJson(res, { note, transcript });
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5174;

// Start the Vite server with programmatic configuration.
const server = await createServer({
  configFile: path.resolve(process.cwd(), "vite.config.ts"),
  server: {
    port,
    host: true, // Allow external connections for container environments
    allowedHosts: true,
  },
  plugins: [
    {
      name: "zettel-api",
      configureServer(viteServer) {
        viteServer.middlewares.use((req, res, next) => {
          const url = req.url ?? "";

          if (url === "/api/notes") {
            void listNotes()
              .then((notes) => sendJson(res, { notes }))
              .catch(() => sendJson(res, { notes: [] }));
            return;
          }

          if (url.startsWith("/api/note?")) {
            const id = new URL(url, "http://localhost").searchParams.get("id") ?? "";
            void Promise.all([readNote(id), backlinksOf(id)])
              .then(([note, backlinks]) => sendJson(res, { note, backlinks }))
              .catch(() => sendJson(res, { note: null, backlinks: [] }));
            return;
          }

          if (url === "/api/graph") {
            void listNotes()
              .then((notes) => {
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
                sendJson(res, { nodes, edges });
              })
              .catch(() => sendJson(res, { nodes: [], edges: [] }));
            return;
          }

          if (url === "/api/transcribe" && req.method === "POST") {
            void handleTranscribe(req, res).catch((err: unknown) => {
              res.statusCode = 500;
              sendJson(res, { error: err instanceof Error ? err.message : String(err) });
            });
            return;
          }

          next();
        });
      },
    },
  ],
});

await server.listen();

if (!server.httpServer) {
  throw new Error("[zettel] Vite HTTP server was not created");
}

// Initialize AgentEventLoop with the Zettelkasten note + transcription tools,
// sharing the Vite HTTP server for the ADP control plane.
const agent = new AgentEventLoop({
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
  adpServer: server.httpServer,
});

// Forward agent events to ADP control plane (real event names).
agent.on("inference.start", () => {
  agent.emitAdpEvent("Agent.InferenceStart", {});
});
agent.on("inference.chunk", ({ chunk }) => {
  agent.emitAdpEvent("Agent.InferenceChunk", { chunk });
});
agent.on("inference.end", ({ text }) => {
  agent.emitAdpEvent("Agent.InferenceEnd", { text });
});
agent.on("tool.dispatch", (payload) => {
  agent.emitAdpEvent("Agent.ToolStart", payload);
});
agent.on("tool.complete", (payload) => {
  agent.emitAdpEvent("Agent.ToolComplete", payload);
});

// Drive the agent from prompts arriving over ADP (Session.prompt).
void (async () => {
  for (;;) {
    const prompt = await agent.waitForPrompt();
    if (prompt == null) break; // shutdown
    try {
      await agent.run(prompt);
    } catch (err) {
      console.error("[zettel] agent.run failed:", err instanceof Error ? err.message : err);
    }
  }
})();

console.log("┌──────────────────────────────────────────────────┐");
console.log("│           agentx — Zettelkasten Web App          │");
console.log(`│     Web Interface: http://localhost:${port}          │`);
console.log(`│     ADP WebSocket shared on HTTP server port     │`);
console.log("└──────────────────────────────────────────────────┘");
