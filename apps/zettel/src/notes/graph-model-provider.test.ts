import { describe, it, expect, vi } from "vitest";

const generateObject = vi.hoisted(() => vi.fn());
vi.mock("ai", () => ({ generateObject }));

import { createGraphModelProvider, createDefaultGraphModelProvider } from "./graph-model-provider.js";

describe("graph model provider", () => {
  it("extractGraph asks for entities and relations over the note text", async () => {
    const graph = {
      entities: [{ name: "Apple", type: "fruit", description: "a fruit" }],
      relations: [],
    };
    generateObject.mockResolvedValue({ object: graph });

    const provider = createGraphModelProvider({} as Parameters<typeof createGraphModelProvider>[0]);
    const result = await provider.extractGraph({
      userId: "u1",
      noteId: "n1",
      text: "Apples grow in orchards.",
    });

    expect(result).toEqual(graph);
    const args = generateObject.mock.calls[0][0] as { prompt: string; schema: unknown };
    expect(args.prompt).toContain("Apples grow in orchards.");
    expect(args.prompt).toContain("must exactly match an entity name");
  });

  it("createDefaultGraphModelProvider uses the configured model env", () => {
    process.env.GRAPH_EXTRACTION_MODEL = "test-model-x";
    try {
      const provider = createDefaultGraphModelProvider();
      expect(typeof provider.extractGraph).toBe("function");
    } finally {
      delete process.env.GRAPH_EXTRACTION_MODEL;
    }
  });
});
