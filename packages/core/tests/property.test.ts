/**
 * Property-Based Tests for Core Event Loop
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { classifyModel, buildToolSet, defineTool } from "../src/tools.js";
import { z } from "zod";

describe("Core tools — property tests", () => {
  it("classifyModel is deterministic and returns valid family", () => {
    fc.assert(
      fc.property(fc.string(), (modelId: string) => {
        const r1 = classifyModel(modelId);
        const r2 = classifyModel(modelId);
        expect(r1).toBe(r2);
        expect(["chat", "messages", "vertex"]).toContain(r1);
      }),
      { numRuns: 500 },
    );
  });

  it("buildToolSet creates a valid ToolSet for non-empty definitions", () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 16 }).filter((s) => /^[a-zA-Z]/.test(s)),
          fc.record({ description: fc.string() }),
          { minKeys: 1, maxKeys: 20 },
        ),
        (defs) => {
          const toolDefs: Record<string, any> = {};
          for (const [name, { description }] of Object.entries(defs)) {
            toolDefs[name] = { name, description, inputSchema: z.object({}) };
          }
          const toolSet = buildToolSet(toolDefs);
          for (const name of Object.keys(defs)) {
            expect(toolSet).toHaveProperty(name);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it("defineTool preserves name and description", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.string(), (name, desc) => {
        const def = defineTool({ name, description: desc, inputSchema: z.object({}) });
        expect(def.name).toBe(name);
        expect(def.description).toBe(desc);
      }),
    );
  });
});
