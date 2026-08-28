import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateObject } = vi.hoisted(() => ({ generateObject: vi.fn() }));

vi.mock("ai", () => ({ generateObject }));

import { createGraphModelProvider } from "./graph-model-provider.js";

describe("graph model provider", () => {
  beforeEach(() => {
    generateObject.mockReset();
  });

  it("requests structured graph output from the configured model", async () => {
    const model = { modelId: "test-model" } as never;
    const object = {
      entities: [{ name: "Ada", type: "person", description: "mathematician" }],
      relations: [],
    };
    generateObject.mockResolvedValue({ object });

    const provider = createGraphModelProvider(model);

    await expect(
      provider.extractGraph({ userId: "tenant-secret", noteId: "note-1", text: "Ada wrote notes." }),
    ).resolves.toEqual(object);
    expect(generateObject).toHaveBeenCalledOnce();
    const request = generateObject.mock.calls[0][0];
    expect(request.model).toBe(model);
    expect(request.schema.safeParse(object).success).toBe(true);
    expect(request.prompt).toContain("Ada wrote notes.");
    expect(request.prompt).not.toContain("tenant-secret");
    expect(request.prompt).not.toContain("note-1");
  });

  it("lets model errors reach the extraction boundary", async () => {
    generateObject.mockRejectedValue(new Error("provider unavailable"));
    const provider = createGraphModelProvider({} as never);

    await expect(
      provider.extractGraph({ userId: "tenant", noteId: "note", text: "text" }),
    ).rejects.toThrow("provider unavailable");
  });
});
