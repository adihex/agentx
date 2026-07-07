#!/usr/bin/env node
// @opentui/core's native renderer requires the Bun runtime (as with the other
// OpenTUI CLIs in this repo), so this shim re-executes the entry under bun.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const entry = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/index.tsx");
const result = spawnSync("bun", [entry, ...process.argv.slice(2)], { stdio: "inherit" });

if (result.error && result.error.code === "ENOENT") {
  console.error(
    "zettel-import requires the Bun runtime (https://bun.sh) — `bun` was not found on PATH.",
  );
  process.exit(1);
}
process.exit(result.status ?? 1);
