import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 64 * 1024 * 1024;

export interface NlmSource {
  id: string;
  title: string;
}

export async function listSources(nlmPath: string, notebookId: string): Promise<NlmSource[]> {
  const { stdout } = await execFileAsync(nlmPath, ["source", "list", notebookId, "--json"], {
    maxBuffer: MAX_BUFFER,
  });
  const parsed: unknown = JSON.parse(stdout);
  if (!Array.isArray(parsed)) {
    throw new Error("Unexpected output from `nlm source list --json` (expected a JSON array)");
  }
  return parsed
    .map((s: { id?: string; title?: string }) => ({
      id: s.id ?? "",
      title: s.title?.trim() || "unnamed",
    }))
    .filter((s) => s.id !== "");
}

/**
 * Fetch raw source content via `nlm source content --output <file>`. Writing to
 * a file instead of reading stdout avoids the CLI's terminal formatting.
 */
export async function fetchSourceContent(nlmPath: string, sourceId: string): Promise<string> {
  const tmpFile = path.join(
    await fs.mkdtemp(path.join(os.tmpdir(), "zettel-import-")),
    "source.txt",
  );
  try {
    await execFileAsync(nlmPath, ["source", "content", sourceId, "--output", tmpFile], {
      maxBuffer: MAX_BUFFER,
    });
    return await fs.readFile(tmpFile, "utf8");
  } finally {
    await fs.rm(path.dirname(tmpFile), { recursive: true, force: true });
  }
}
