#!/usr/bin/env node
/**
 * probe-zen-tools.mjs — OpenCode Zen capability matrix
 *
 * For EVERY model Zen exposes, probes:
 *   1. Native function/tool calling  (does the model emit a tool_call?)
 *   2. Strict structured outputs     (response_format json_schema — chat family only)
 *
 * Why a standalone script and not a vitest test: it makes live, paid network
 * calls across ~49 models. That has no place in the unit suite / CI. Run it by
 * hand when you need to know which Zen models your agent can actually drive.
 *
 * It reads OPENAI_API_KEY + OPENAI_BASE_URL from apps/music-scanner-service/.env
 * at runtime (never printed). The key is the same one @agentx/core uses.
 *
 * Zen splits endpoints by model family (see https://opencode.ai/docs/zen/):
 *   gpt-*            -> /responses        (OpenAI Responses API)
 *   claude-*, qwen*  -> /messages         (Anthropic Messages API)
 *   gemini-*         -> /models/<id>:generateContent (Google)
 *   everything else  -> /chat/completions (OpenAI Chat — what LLMOrchestrator uses)
 * This probe formats the request correctly PER FAMILY so a model is not marked
 * "no tools" merely because we hit the wrong endpoint with the wrong payload.
 *
 * Usage:
 *   node apps/music-scanner-service/probe-zen-tools.mjs                  # all models
 *   node apps/music-scanner-service/probe-zen-tools.mjs --only chat      # one family
 *   node apps/music-scanner-service/probe-zen-tools.mjs --models glm-5,kimi-k2.6
 *   node apps/music-scanner-service/probe-zen-tools.mjs --no-structured  # skip json_schema probe
 *   node apps/music-scanner-service/probe-zen-tools.mjs --concurrency 6 --timeout 90000
 *   ZEN_BASE=https://opencode.ai/zen/v1 ZEN_KEY=sk-... node ... # override env file
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, ".env");
const OUT_PATH = path.join(__dirname, "zen-capability-matrix.json");

// ── args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return v && !v.startsWith("--") ? v : true;
}
const ONLY = flag("only", null); // chat | responses | messages | google
const MODELS_FILTER = (flag("models", "") || "")
  .toString()
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const DO_STRUCTURED = !args.includes("--no-structured");
const CONCURRENCY = Number(flag("concurrency", 5));
const TIMEOUT_MS = Number(flag("timeout", 90000));

// ── env ───────────────────────────────────────────────────────────────────
function parseDotenv(p) {
  const out = {};
  if (!fs.existsSync(p)) return out;
  for (let line of fs.readFileSync(p, "utf8").split("\n")) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice(7);
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}
const fileEnv = parseDotenv(ENV_PATH);
const KEY = process.env.ZEN_KEY || fileEnv.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const RAW_BASE =
  process.env.ZEN_BASE ||
  fileEnv.OPENAI_BASE_URL ||
  process.env.OPENAI_BASE_URL ||
  "https://opencode.ai/zen/v1";

if (!KEY) {
  console.error(
    `No API key found. Looked at ${ENV_PATH} (OPENAI_API_KEY) and $ZEN_KEY/$OPENAI_API_KEY.`,
  );
  process.exit(1);
}

// normalize to the zen root: strip a trailing family path + trailing slash
function toRoot(b) {
  return b.replace(/\/+$/, "").replace(/\/(chat\/completions|responses|messages)$/, "");
}
const CANDIDATE_BASES = [...new Set([toRoot(RAW_BASE), "https://opencode.ai/zen/v1"])];

// ── helpers ─────────────────────────────────────────────────────────────────
const PROMPT =
  "What is the weather in Paris right now? You must call the get_weather tool to find out.";
const TOOL = {
  name: "get_weather",
  description: "Get the current weather for a city.",
  schema: {
    type: "object",
    properties: { city: { type: "string", description: "City name" } },
    required: ["city"],
    additionalProperties: false,
  },
};

function classify(id) {
  if (id.startsWith("gpt-")) return "responses";
  if (id.startsWith("claude-") || id.startsWith("qwen")) return "messages";
  if (id.startsWith("gemini")) return "google";
  return "chat";
}

function authHeaders(family) {
  const h = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
  if (family === "messages") {
    // Zen serves Claude/Qwen via the Anthropic Messages API, which authenticates
    // with x-api-key (not Bearer). Send both so either gateway mode works.
    h["x-api-key"] = KEY;
    h["anthropic-version"] = "2023-06-01";
  }
  return h;
}

async function postJSON(url, family, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders(family),
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const ms = Date.now() - started;
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* keep raw text */
    }
    return { ok: res.ok, status: res.status, json, text, ms };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      json: null,
      text: String(err?.message || err),
      ms: Date.now() - started,
    };
  } finally {
    clearTimeout(t);
  }
}

// ── per-family request builders + tool-call detectors ────────────────────────
function buildToolBody(family, id) {
  switch (family) {
    case "chat":
      return {
        model: id,
        messages: [{ role: "user", content: PROMPT }],
        tools: [
          {
            type: "function",
            function: { name: TOOL.name, description: TOOL.description, parameters: TOOL.schema },
          },
        ],
        tool_choice: "auto",
        max_tokens: 256,
      };
    case "responses":
      return {
        model: id,
        input: PROMPT,
        tools: [
          {
            type: "function",
            name: TOOL.name,
            description: TOOL.description,
            parameters: TOOL.schema,
          },
        ],
        max_output_tokens: 512,
      };
    case "messages":
      return {
        model: id,
        max_tokens: 512,
        messages: [{ role: "user", content: PROMPT }],
        tools: [{ name: TOOL.name, description: TOOL.description, input_schema: TOOL.schema }],
      };
    case "google":
      return {
        contents: [{ role: "user", parts: [{ text: PROMPT }] }],
        tools: [
          {
            functionDeclarations: [
              { name: TOOL.name, description: TOOL.description, parameters: TOOL.schema },
            ],
          },
        ],
      };
  }
}

function detectToolCall(family, json) {
  if (!json) return false;
  try {
    switch (family) {
      case "chat":
        return (json.choices?.[0]?.message?.tool_calls?.length ?? 0) > 0;
      case "responses": {
        const out = json.output ?? json.outputs ?? [];
        return (
          Array.isArray(out) &&
          out.some((o) => o?.type === "function_call" || o?.type === "tool_call")
        );
      }
      case "messages":
        return Array.isArray(json.content) && json.content.some((c) => c?.type === "tool_use");
      case "google": {
        const parts = json.candidates?.[0]?.content?.parts ?? [];
        return parts.some((p) => p?.functionCall);
      }
    }
  } catch {
    return false;
  }
  return false;
}

// structured-output probe (chat family only)
function buildStructuredBody(id) {
  return {
    model: id,
    messages: [{ role: "user", content: "Give me a person object: name Ada, age 36." }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "person",
        strict: true,
        schema: {
          type: "object",
          properties: { name: { type: "string" }, age: { type: "integer" } },
          required: ["name", "age"],
          additionalProperties: false,
        },
      },
    },
    max_tokens: 128,
  };
}
function detectStructured(json) {
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return false;
  try {
    const o = JSON.parse(content);
    return typeof o?.name === "string" && Number.isFinite(o?.age);
  } catch {
    return false;
  }
}

function errSnippet(r) {
  if (r.ok) return "";
  const j = r.json;
  const msg =
    j?.error?.message ||
    j?.error ||
    j?.message ||
    (typeof r.text === "string" ? r.text.slice(0, 140) : "");
  return `${r.status || "ERR"} ${typeof msg === "string" ? msg.replace(/\s+/g, " ").slice(0, 140) : ""}`.trim();
}

// ── concurrency pool ─────────────────────────────────────────────────────────
async function pool(items, n, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
  return results;
}

// ── main ──────────────────────────────────────────────────────────────────
async function resolveBase() {
  for (const b of CANDIDATE_BASES) {
    const r = await (async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      try {
        const res = await fetch(`${b}/models`, {
          headers: authHeaders("chat"),
          signal: ctrl.signal,
        });
        const text = await res.text();
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {}
        return { ok: res.ok, json };
      } catch {
        return { ok: false, json: null };
      } finally {
        clearTimeout(t);
      }
    })();
    if (r.ok && r.json) return { base: b, models: r.json };
  }
  return { base: CANDIDATE_BASES[0], models: null };
}

async function main() {
  console.log(`Zen tool-calling capability probe`);
  console.log(
    `  env file : ${ENV_PATH}${fs.existsSync(ENV_PATH) ? "" : " (missing — using process env)"}`,
  );
  console.log(`  key      : ${KEY.slice(0, 4)}…(${KEY.length} chars)`);

  const { base, models } = await resolveBase();
  console.log(`  base     : ${base}`);
  if (!models) {
    console.error(`Could not list models from ${base}/models. Check key/base.`);
    process.exit(1);
  }

  let ids = (models.data || models.models || (Array.isArray(models) ? models : []))
    .map((m) => m.id || m.name)
    .filter(Boolean);

  if (MODELS_FILTER.length) ids = ids.filter((id) => MODELS_FILTER.some((f) => id.includes(f)));
  let rows = ids.map((id) => ({ id, family: classify(id) }));
  if (ONLY) rows = rows.filter((r) => r.family === ONLY);
  rows.sort((a, b) => a.family.localeCompare(b.family) || a.id.localeCompare(b.id));

  console.log(
    `  models   : ${rows.length}${ONLY ? ` (family=${ONLY})` : ""}, concurrency ${CONCURRENCY}, timeout ${TIMEOUT_MS}ms`,
  );
  console.log(
    `  probing tool-calling${DO_STRUCTURED ? " + structured-output (chat family)" : ""}…\n`,
  );

  const familyPath = (family, id) =>
    family === "google"
      ? `models/${id}:generateContent`
      : family === "chat"
        ? "chat/completions"
        : family;

  const out = await pool(rows, CONCURRENCY, async (row) => {
    const url = `${base}/${familyPath(row.family, row.id)}`;
    const tool = await postJSON(url, row.family, buildToolBody(row.family, row.id));
    const toolCall = detectToolCall(row.family, tool.json);

    let structured = null;
    if (DO_STRUCTURED && row.family === "chat") {
      const s = await postJSON(`${base}/chat/completions`, "chat", buildStructuredBody(row.id));
      structured = s.ok ? detectStructured(s.json) : null; // null = errored/unsupported
    }

    return {
      id: row.id,
      family: row.family,
      reachable: tool.ok,
      toolCall: tool.ok ? toolCall : null,
      structured,
      ms: tool.ms,
      error: tool.ok ? "" : errSnippet(tool),
    };
  });

  // ── report ────────────────────────────────────────────────────────────────
  const sym = (v) => (v === true ? "✅" : v === false ? "⚠️ " : v === null ? "❌" : "  ");
  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad("MODEL", 26) + pad("FAMILY", 12) + pad("TOOLS", 7) + pad("JSON", 7) + "NOTES");
  console.log("-".repeat(90));
  for (const r of out) {
    const note = r.error || (r.toolCall === false ? "responded, no tool_call" : "");
    console.log(
      pad(r.id, 26) +
        pad(r.family, 12) +
        pad(r.toolCall === null ? "❌" : r.toolCall ? "✅" : "⚠️", 7) +
        pad(
          r.family !== "chat" ? "·" : r.structured === null ? "❌" : r.structured ? "✅" : "⚠️",
          7,
        ) +
        note,
    );
  }
  console.log("-".repeat(90));
  console.log(
    "✅ supported   ⚠️ responded but capability absent   ❌ endpoint/transport error   · n/a",
  );

  // summary
  const ok = out.filter((r) => r.toolCall === true);
  console.log(
    `\nTool-calling: ${ok.length}/${out.length} models emit native tool_calls.` +
      `\n  usable via your @ai-sdk/openai-compatible stack (chat family): ` +
      out
        .filter((r) => r.family === "chat" && r.toolCall === true)
        .map((r) => r.id)
        .join(", "),
  );

  fs.writeFileSync(
    OUT_PATH,
    JSON.stringify({ base, probedAt: new Date().toISOString(), results: out }, null, 2),
  );
  console.log(`\nFull JSON: ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
