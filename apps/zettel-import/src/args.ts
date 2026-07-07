import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface CliOptions {
  notebookId: string;
  dbUrl: string;
  dbToken: string | undefined;
  userId: string;
  nlmPath: string;
  ragDir: string;
  skipRag: boolean;
}

export class UsageError extends Error {}

export const USAGE = `Usage: npx @agentx/zettel-import <NOTEBOOK_ID> [options]

Pulls all sources from a NotebookLM notebook, creates Zettel notes (with
GraphRAG entity extraction) in the Turso DB, and indexes the sources into
the local RAG pipeline (ChromaDB).

Options:
  --db-url <url>      Turso/libsql database URL (or TURSO_DATABASE_URL env var)
  --db-token <token>  Turso auth token (or TURSO_AUTH_TOKEN env var)
  --user-id <id>      Required. Which user owns the created notes
  --nlm-path <path>   Path to the nlm CLI (default: ~/.local/bin/nlm)
  --rag-dir <path>    RAG pipeline directory (default: apps/rag-pipeline)
  --skip-rag          Skip the ChromaDB indexing step
  -h, --help          Show this help

Environment:
  TURSO_DATABASE_URL / TURSO_AUTH_TOKEN   Database connection fallback
  GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY
                                          Required for entity extraction,
                                          note embeddings, and RAG indexing`;

/** apps/rag-pipeline, resolved relative to this package inside the monorepo. */
function defaultRagDir(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../rag-pipeline");
}

export function parseArgs(argv: string[]): CliOptions {
  let notebookId: string | undefined;
  let dbUrl = process.env.TURSO_DATABASE_URL;
  let dbToken = process.env.TURSO_AUTH_TOKEN;
  let userId: string | undefined;
  let nlmPath = path.join(os.homedir(), ".local", "bin", "nlm");
  let ragDir = defaultRagDir();
  let skipRag = false;

  const takeValue = (flag: string, i: number): string => {
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new UsageError(`Missing value for ${flag}`);
    }
    return value;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-h":
      case "--help":
        throw new UsageError(USAGE);
      case "--db-url":
        dbUrl = takeValue(arg, i++);
        break;
      case "--db-token":
        dbToken = takeValue(arg, i++);
        break;
      case "--user-id":
        userId = takeValue(arg, i++);
        break;
      case "--nlm-path":
        nlmPath = takeValue(arg, i++);
        break;
      case "--rag-dir":
        ragDir = path.resolve(takeValue(arg, i++));
        break;
      case "--skip-rag":
        skipRag = true;
        break;
      default:
        if (arg.startsWith("-")) throw new UsageError(`Unknown option: ${arg}`);
        if (notebookId !== undefined) throw new UsageError(`Unexpected argument: ${arg}`);
        notebookId = arg;
    }
  }

  if (!notebookId) throw new UsageError("Missing required <NOTEBOOK_ID> argument");
  if (!dbUrl) throw new UsageError("Missing database URL: pass --db-url or set TURSO_DATABASE_URL");
  if (!userId) throw new UsageError("Missing required --user-id option");

  return { notebookId, dbUrl, dbToken, userId, nlmPath, ragDir, skipRag };
}
