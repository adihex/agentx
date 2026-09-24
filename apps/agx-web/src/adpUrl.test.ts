import { describe, expect, it } from "vitest";
import { getAdpUrl } from "./adpUrl.js";

describe("dashboard ADP connection", () => {
  it("uses the local dev server's WebSocket proxy", () => {
    expect(getAdpUrl({ protocol: "http:", host: "localhost:5173" })).toBe(
      "ws://localhost:5173/adp",
    );
  });

  it("uses secure WebSockets on the preview's own origin", () => {
    expect(getAdpUrl({ protocol: "https:", host: "example.preview.niteshift.dev" })).toBe(
      "wss://example.preview.niteshift.dev/adp",
    );
  });
});
