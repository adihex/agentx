/**
 * Music Scanner Service — Tool unit tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

// Import using absolute module resolution
import { searchMusic, searchMusicSchema } from "./search.js";
import { downloadAndUpload, downloadAndUploadSchema } from "./download.js";
import { triggerCloudRun, triggerCloudRunSchema } from "./cloudrun.js";
import { execFileSync } from "node:child_process";

describe("searchMusic tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse valid input", () => {
    const result = searchMusicSchema.parse({ query: "Stairway to Heaven" });
    expect(result.query).toBe("Stairway to Heaven");
  });

  it("should reject empty query", () => {
    expect(() => searchMusicSchema.parse({ query: "" })).toThrow();
  });

  it("should return results from yt-dlp output", async () => {
    (execFileSync as any).mockReturnValue(
      "Song Title 1\nsongid1\n3:45\nSong Title 2\nsongid2\n4:20\n",
    );

    const result = await searchMusic({ query: "test" });
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(result.results![0].title).toBe("Song Title 1");
    expect(result.bestMatch).toEqual(result.results![0]);
  });

  it("should handle yt-dlp error gracefully", async () => {
    (execFileSync as any).mockImplementation(() => {
      throw new Error("yt-dlp not found");
    });

    const result = await searchMusic({ query: "test" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("yt-dlp not found");
  });

  it("should handle non-Error throws", async () => {
    (execFileSync as any).mockImplementation(() => {
      throw "some string error";
    });

    const result = await searchMusic({ query: "test" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("some string error");
  });

  it("should skip incomplete result lines", async () => {
    // 4 lines = 1 complete triplet (lines 0-2) + 1 dangling (line 3)
    // The dangling line 3 ("Extra") should be skipped
    (execFileSync as any).mockReturnValue("Title\nid\n1:00\nExtra");

    const result = await searchMusic({ query: "test" });
    expect(result.results).toHaveLength(1);
    expect(result.results![0].title).toBe("Title");
  });
});

describe("triggerCloudRun tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use defaults for optional fields", async () => {
    (execFileSync as any).mockReturnValue("Job completed");

    const result = await triggerCloudRun({ fileName: "song.mp3" });
    expect(result.success).toBe(true);
  });

  it("should accept custom project/region/job", async () => {
    (execFileSync as any).mockReturnValue("Job completed");

    const result = await triggerCloudRun({
      fileName: "song.mp3",
      project: "my-proj",
      region: "europe-west1",
      jobName: "my-job",
    });
    expect(result.success).toBe(true);
  });

  it("should handle gcloud error", async () => {
    (execFileSync as any).mockImplementation(() => {
      throw new Error("gcloud not found");
    });

    const result = await triggerCloudRun({ fileName: "song.mp3" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("gcloud");
  });
});

describe("downloadAndUpload tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse valid input", () => {
    const result = downloadAndUploadSchema.parse({ id: "abc123", bucket: "my-bucket" });
    expect(result.id).toBe("abc123");
    expect(result.bucket).toBe("my-bucket");
  });

  it("should handle exec error", async () => {
    (execFileSync as any).mockImplementation(() => {
      throw new Error("download failed");
    });

    const result = await downloadAndUpload({ id: "abc", bucket: "bucket" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("download failed");
  });

  it("should succeed with valid exec", async () => {
    (execFileSync as any).mockReturnValue("");

    const result = await downloadAndUpload({ id: "abc", bucket: "bucket" });
    expect(result.success).toBe(true);
    expect(result.gcsPath).toBe("gs://bucket/abc.mp3");
    expect(result.fileName).toBe("abc.mp3");
  });
});
