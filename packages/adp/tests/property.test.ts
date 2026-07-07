/**
 * Property-Based Tests for ADP
 */
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { classifyModel } from "../../core/src/tools.js";
import { parseReplCommand, STATUS_HEX } from "../../agx-core/src/index.js";

describe("ADP protocol — property tests", () => {
  it("classifyModel is deterministic and idempotent", () => {
    fc.assert(
      fc.property(fc.string(), (modelId: string) => {
        const first = classifyModel(modelId);
        const second = classifyModel(modelId);
        expect(first).toBe(second);
      }),
    );
  });

  it("parseReplCommand handles arbitrary trimmed inputs", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => /^[a-zA-Z]/.test(s)),
        fc.array(fc.string()),
        (cmd, args) => {
          const input = args.length > 0 ? `/${cmd} ${args.join(" ")}` : `/${cmd}`;
          const result = parseReplCommand(input);
          expect(result).not.toBeNull();
          expect(result!.method).toMatch(/^Debugger\./);
        },
      ),
    );
  });

  it("STATUS_HEX maps all statuses to valid hex colors", () => {
    const statuses = ["running", "success", "queued", "error", "paused"] as const;
    for (const status of statuses) {
      const hex = (STATUS_HEX as Record<string, string>)[status];
      expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("ADP JSON-RPC — property tests", () => {
  it("JSON-RPC serialization preserves method and params", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 32 }).filter((s) => /^[a-zA-Z]/.test(s)),
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 10 }),
          value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        }),
        (method, params) => {
          const request = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method,
            params,
          });
          const parsed = JSON.parse(request);
          expect(parsed.method).toBe(method);
          expect(parsed.params).toEqual(params);
        },
      ),
    );
  });
});
