import "dotenv/config";
import { useEffect, useState } from "react";
import { createRoot } from "@opentui/react";
import { createCliRenderer } from "@opentui/core";
import { parseArgs, UsageError, USAGE, type CliOptions } from "./args";
import { runImport, type ImportState } from "./pipeline";
import { Dashboard } from "./Dashboard";

const App = ({ opts, onExit }: { opts: CliOptions; onExit: (code: number) => void }) => {
  const [state, setState] = useState<ImportState>({
    phase: "listing",
    notebookId: opts.notebookId,
    rows: [],
    indexStatus: opts.skipRag ? "skipped" : "pending",
  });

  useEffect(() => {
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    runImport(opts, setState)
      .then((final) => {
        const failed =
          final.phase === "fatal" ||
          (final.summary?.failed ?? 0) > 0 ||
          final.indexStatus === "error";
        // Leave the final frame on screen briefly, then exit on our own so
        // the command finishes without requiring a keypress.
        exitTimer = setTimeout(() => onExit(failed ? 1 : 0), 2000);
      })
      .catch(() => onExit(1));
    return () => clearTimeout(exitTimer);
  }, []);

  return <Dashboard state={state} onQuit={() => onExit(130)} />;
};

const main = async () => {
  let opts: CliOptions;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    if (err instanceof UsageError) {
      if (err.message === USAGE) {
        console.log(USAGE);
        process.exit(0);
      }
      console.error(`Error: ${err.message}\n`);
      console.error(USAGE);
      process.exit(1);
    }
    throw err;
  }

  // The AI SDK's google provider reads GOOGLE_GENERATIVE_AI_API_KEY; the rest
  // of this repo standardizes on GEMINI_API_KEY. Accept either.
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }

  const renderer = await createCliRenderer({ exitOnCtrlC: false });
  const root = createRoot(renderer);

  const handleExit = (code: number) => {
    renderer.destroy();
    process.exit(code);
  };

  root.render(<App opts={opts} onExit={handleExit} />);
};

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
