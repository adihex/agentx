import { describe, expect, it, vi } from "vitest";

const createAuthClient = vi.hoisted(() => vi.fn((opts: unknown) => ({ __opts: opts })));

vi.mock("better-auth/react", () => ({ createAuthClient }));
vi.stubGlobal("window", { location: { origin: "https://zettel.test" } });

describe("authClient", () => {
  it("is built against the runtime origin with credentialed fetch", async () => {
    const { authClient } = await import("./auth-client.js");
    const opts = (authClient as { __opts: { baseURL: string; fetchOptions: { credentials: string } } })
      .__opts;
    expect(opts.baseURL).toBe("https://zettel.test");
    expect(opts.fetchOptions.credentials).toBe("include");
    expect(createAuthClient).toHaveBeenCalledOnce();
  });
});
