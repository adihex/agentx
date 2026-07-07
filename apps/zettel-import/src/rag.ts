import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 64 * 1024 * 1024;

/** Same sanitization as apps/rag-pipeline/scripts/download_sources.py. */
export function sanitizeFilename(name: string): string {
  let sanitized = name.replace(/[^a-zA-Z0-9\s.\-_]/g, "_");
  sanitized = sanitized.replace(/\s+/g, " ");
  sanitized = sanitized.replace(/_+/g, "_");
  sanitized = sanitized.replace(/^[\s._]+/, "").replace(/[\s._]+$/, "");
  if (!sanitized) return "unnamed_source";
  return sanitized.slice(0, 150);
}

/** Write source content into <ragDir>/data/sources/<title>.txt. */
export async function saveSource(ragDir: string, title: string, content: string): Promise<string> {
  const sourcesDir = path.join(ragDir, "data", "sources");
  await fs.mkdir(sourcesDir, { recursive: true });
  const filePath = path.join(sourcesDir, `${sanitizeFilename(title)}.txt`);
  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}

/**
 * Run the ChromaDB indexing step. Prefers `uv run` (the repo's Python
 * toolchain, resolves pyproject deps automatically), falls back to `python3`.
 * main.py resolves data/sources relative to cwd, so cwd must be ragDir.
 */
export async function runIndex(ragDir: string): Promise<string> {
  // main.py requires GEMINI_API_KEY; accept the AI SDK's variable name too.
  const env = {
    ...process.env,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  };
  const run = (cmd: string, args: string[]) =>
    execFileAsync(cmd, args, { cwd: ragDir, env, maxBuffer: MAX_BUFFER });

  try {
    const { stdout } = await run("uv", ["run", "main.py", "--index"]);
    return stdout;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const { stdout } = await run("python3", ["main.py", "--index"]);
    return stdout;
  }
}
