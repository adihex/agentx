/**
 * Packed-consumer smoke: the built dist/ artifacts must load under both
 * module systems and every path in the exports map must exist. Runs after
 * `pnpm build` (CI order); dist/ is the shipped contract.
 */
import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const pkgDir = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const require_ = createRequire(import.meta.url);

const EXPECTED_EXPORTS = ["AdpClient", "AdpServer", "AdpDomains", "ADP_PROTOCOL_VERSION"] as const;

describe("dist artifacts are loadable by real consumers", () => {
  it("ESM import resolves the public API", async () => {
    const mod = (await import(pathToFileURL(path.join(pkgDir, "dist/index.mjs")).href)) as Record<
      string,
      unknown
    >;
    for (const name of EXPECTED_EXPORTS) {
      expect(mod[name], `missing ESM export ${name}`).toBeDefined();
    }
  });

  it("CJS require resolves the public API", () => {
    const mod = require_("../dist/index.cjs") as Record<string, unknown>;
    for (const name of EXPECTED_EXPORTS) {
      expect(mod[name], `missing CJS export ${name}`).toBeDefined();
    }
  });

  it("every path in the exports map points at a shipped file", () => {
    const pkg = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    const paths: string[] = [];
    const collect = (node: unknown): void => {
      if (typeof node === "string") paths.push(node);
      else if (node && typeof node === "object") {
        for (const v of Object.values(node)) collect(v);
      }
    };
    collect(pkg.exports);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      expect(existsSync(path.join(pkgDir, p)), `missing file for export path ${p}`).toBe(true);
    }
  });
});
