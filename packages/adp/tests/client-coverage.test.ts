import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AdpClient } from "../src/client";
import { AdpServer } from "../src/server";

describe("AdpClient Coverage", () => {
  let server: AdpServer | null = null;
  let client: AdpClient | null = null;
  let port = 9500;

  beforeEach(() => {
    port++;
  });

  afterEach(async () => {
    if (client) {
      client.close();
      client = null;
    }
    if (server) {
      await server.close();
      server = null;
    }
  });

  it("should handle error handlers rejection", async () => {
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    server.notify("test.event", { foo: "bar" });
  }, 5000);

  it("should handle close listeners", async () => {
    server = new AdpServer(port);
    client = new AdpClient(`ws://localhost:${port}`);
    await client.connect();

    const closePromise = new Promise<number>((resolve) => {
      client!.onClose((code) => resolve(code));
    });

    client.close();
    const code = await closePromise;
    expect(code).toBeDefined();
  }, 5000);
});