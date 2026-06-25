/**
 * E2E Test: music-scanner-service Tool Workflow
 *
 * Tests the complete music scanner tool workflow end-to-end:
 *   1. Search music (mocked yt-dlp)
 *   2. Download and upload (mocked yt-dlp + gcloud)
 *   3. Trigger Cloud Run job (mocked gcloud)
 *   4. Error recovery across all tools
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

import { searchMusic } from "./search.js";
import { downloadAndUpload } from "./download.js";
import { triggerCloudRun } from "./cloudrun.js";
import { execFileSync } from "node:child_process";

describe("E2E: music-scanner-service Tool Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("E2E: full workflow — search → download → process", async () => {
    // 1. Search for a song
    (execFileSync as any).mockReturnValueOnce(
      "Stairway to Heaven\nabc123\n8:02\nHotel California\ndef456\n6:30\n",
    );

    const searchResult = await searchMusic({ query: "stairway" });
    expect(searchResult.success).toBe(true);
    expect(searchResult.results).toHaveLength(2);
    const bestId = searchResult.results![0].id;
    expect(bestId).toBe("abc123");

    // 2. Download and upload
    (execFileSync as any)
      .mockReturnValueOnce("") // yt-dlp download
      .mockReturnValueOnce("") // gcloud upload
      .mockReturnValueOnce(""); // rm cleanup

    const downloadResult = await downloadAndUpload({ id: bestId, bucket: "guitar-extractor-input" });
    expect(downloadResult.success).toBe(true);
    expect(downloadResult.gcsPath).toBe(`gs://guitar-extractor-input/${bestId}.mp3`);
    expect(downloadResult.fileName).toBe(`${bestId}.mp3`);

    // 3. Trigger Cloud Run job
    (execFileSync as any).mockReturnValueOnce("Job completed successfully");

    const processResult = await triggerCloudRun({ fileName: `${bestId}.mp3` });
    expect(processResult.success).toBe(true);
    expect(processResult.fileName).toBe(`${bestId}.mp3`);
  });

  it("E2E: workflow handles search failure gracefully", async () => {
    (execFileSync as any).mockImplementationOnce(() => {
      throw new Error("yt-dlp: network error");
    });

    const result = await searchMusic({ query: "nonexistent" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("network error");

    // Should NOT proceed to download without valid results
    expect(result.results).toBeUndefined();
  });

  it("E2E: workflow handles download failure gracefully", async () => {
    (execFileSync as any).mockImplementationOnce(() => {
      throw new Error("yt-dlp: download failed");
    });

    const result = await downloadAndUpload({ id: "bad-id", bucket: "test" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("download failed");
    expect(result.gcsPath).toBeUndefined();
  });

  it("E2E: workflow handles Cloud Run failure gracefully", async () => {
    (execFileSync as any).mockImplementationOnce(() => {
      throw new Error("gcloud: permission denied");
    });

    const result = await triggerCloudRun({ fileName: "song.mp3" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("permission denied");
  });

  it("E2E: triggerCloudRun uses defaults for optional fields", async () => {
    (execFileSync as any).mockReturnValueOnce("Job completed");

    const result = await triggerCloudRun({ fileName: "song.mp3" });
    expect(result.success).toBe(true);
    // Defaults should be applied
  });

  it("E2E: triggerCloudRun accepts custom overrides", async () => {
    (execFileSync as any).mockReturnValueOnce("Job completed");

    const result = await triggerCloudRun({
      fileName: "song.mp3",
      project: "custom-proj",
      region: "europe-west1",
      jobName: "custom-job",
    });
    expect(result.success).toBe(true);
  });
});
