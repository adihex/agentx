import { execFileSync } from "node:child_process";
import { z } from "zod";
import type { ToolDefinition } from "@agentx/core";

/**
 * Music Download and GCS Upload Tool
 *
 * Downloads a YouTube video as MP3 (by id) and uploads it to GCS. All external
 * inputs (id, bucket) are passed as argv arrays — never concatenated into a
 * shell string — so they cannot escape into the shell.
 */

export const downloadAndUploadSchema = z.object({
  id: z.string().min(1).describe("YouTube video id to download"),
  bucket: z.string().min(1).describe("Destination GCS bucket name"),
});

export type DownloadAndUploadInput = z.infer<typeof downloadAndUploadSchema>;

/** Implementation invoked inside an AgenticThreadPool worker. */
export async function downloadAndUpload(args: DownloadAndUploadInput) {
  const { id, bucket } = downloadAndUploadSchema.parse(args);

  try {
    console.log(`[Tool:downloadAndUpload] Downloading ${id} to gs://${bucket}...`);

    // 1. Download as mp3 using yt-dlp (argv array — no shell).
    const localPath = `/tmp/${id}.mp3`;
    execFileSync("yt-dlp", [
      "-x",
      "--audio-format",
      "mp3",
      "-o",
      localPath,
      `https://www.youtube.com/watch?v=${id}`,
    ]);

    // 2. Upload to GCS using gcloud storage cp (argv array — no shell).
    const gcsPath = `gs://${bucket}/${id}.mp3`;
    execFileSync("gcloud", ["storage", "cp", localPath, gcsPath]);

    // 3. Cleanup.
    execFileSync("rm", [localPath]);

    return { success: true, gcsPath, fileName: `${id}.mp3` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const downloadAndUploadTool: ToolDefinition<DownloadAndUploadInput> = {
  name: "downloadAndUpload",
  description:
    "Download a YouTube video (by id) as MP3 and upload it to the given GCS bucket. Returns the gcsPath and fileName.",
  inputSchema: downloadAndUploadSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "downloadAndUpload",
};
