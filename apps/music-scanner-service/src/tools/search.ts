import { execFileSync } from "node:child_process";
import { z } from "zod";
import type { ToolDefinition } from "@agentx/core";

/**
 * Music Search Tool
 *
 * Uses yt-dlp to find the best matches for a song query. Arguments are passed
 * to yt-dlp as an argv array (no shell), so the query can never escape into a
 * shell command.
 */

export const searchMusicSchema = z.object({
  query: z.string().min(1).describe("The song/artist text to search for"),
});

export type SearchMusicInput = z.infer<typeof searchMusicSchema>;

interface SearchResult {
  title: string;
  id: string;
  duration?: string;
}

/** Implementation invoked inside an AgenticThreadPool worker. */
export async function searchMusic(args: SearchMusicInput) {
  const { query } = searchMusicSchema.parse(args);

  try {
    console.log("[Tool:searchMusic] Searching for:", query);
    // argv array — yt-dlp receives `ytsearch3:<query>` as a single, un-escaped argument.
    const output = execFileSync(
      "yt-dlp",
      [`ytsearch3:${query}`, "--get-title", "--get-id", "--get-duration", "--no-playlist"],
      { encoding: "utf8" },
    ).trim();

    const lines = output.split("\n");
    const results: SearchResult[] = [];
    for (let i = 0; i < lines.length; i += 3) {
      if (lines[i] && lines[i + 1]) {
        results.push({ title: lines[i], id: lines[i + 1], duration: lines[i + 2] });
      }
    }

    return { success: true, results, bestMatch: results[0] };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const searchMusicTool: ToolDefinition<SearchMusicInput> = {
  name: "searchMusic",
  description:
    "Search for a song on YouTube and return the top matches (title, id, duration). Use the bestMatch id for downloading.",
  inputSchema: searchMusicSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "searchMusic",
};
