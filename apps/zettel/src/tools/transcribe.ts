/**
 * Audio transcription tool.
 *
 * Two backends behind one tool, selected at runtime:
 *
 *   1. AI-SDK / Groq Whisper  — used when GROQ_API_KEY is set.
 *   2. Local whisper.cpp       — keyless DEFAULT fallback via the `whisper-cli`
 *                                binary (configurable with WHISPER_BIN / WHISPER_MODEL).
 *
 * If neither backend is available, the tool returns a graceful object
 * `{ text: "", error: "no transcription backend: …" }` rather than throwing.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import type { ToolDefinition } from "@agentx/core";

export const transcribeAudioSchema = z.object({
  path: z.string().min(1).describe("Absolute path to the audio file to transcribe."),
  language: z.string().optional().describe("Optional ISO language hint, e.g. 'en'."),
});
export type TranscribeAudioInput = z.infer<typeof transcribeAudioSchema>;

export interface TranscribeResult {
  text: string;
  error?: string;
  backend?: "groq" | "whisper.cpp";
}

const DEFAULT_WHISPER_BIN = "whisper-cli";

function defaultWhisperModel(): string {
  return path.join(os.homedir(), ".whisper", "ggml-base.en.bin");
}

/** Best-effort lookup of a binary on PATH without invoking a shell. */
function binaryAvailable(bin: string): boolean {
  // Absolute/relative path → just check the file.
  if (bin.includes(path.sep)) return fs.existsSync(bin);
  try {
    // `command -v` resolves builtins/PATH entries; argv array, no shell injection.
    execFileSync("/usr/bin/env", ["sh", "-c", `command -v ${bin}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function transcribeWithGroq(
  audioPath: string,
  apiKey: string,
): Promise<TranscribeResult> {
  const { experimental_transcribe: transcribe } = await import("ai");
  const { createGroq } = await import("@ai-sdk/groq");
  const groq = createGroq({ apiKey });
  const { text } = await transcribe({
    model: groq.transcription("whisper-large-v3"),
    audio: fs.readFileSync(audioPath),
  });
  return { text, backend: "groq" };
}

const DEFAULT_FFMPEG_BIN = "ffmpeg";

/**
 * Normalize any audio container to 16 kHz mono WAV — the only format whisper.cpp
 * decodes. Browser recordings arrive as webm/opus and uploads as mp3/m4a/non-16k
 * WAV, all of which whisper-cli rejects; ffmpeg converts them. Returns the temp
 * WAV path, or null when ffmpeg is unavailable (caller falls back to the raw file).
 */
function toWav16k(inputPath: string): string | null {
  const ff = process.env.FFMPEG_BIN || DEFAULT_FFMPEG_BIN;
  if (!binaryAvailable(ff)) return null;
  const out = path.join(os.tmpdir(), `zettel-wav-${process.pid}-${Date.now()}.wav`);
  // Argv array, NO shell.
  execFileSync(ff, ["-y", "-i", inputPath, "-ar", "16000", "-ac", "1", "-f", "wav", out], {
    stdio: "ignore",
  });
  return out;
}

function transcribeWithWhisperCpp(audioPath: string): TranscribeResult {
  const bin = process.env.WHISPER_BIN || DEFAULT_WHISPER_BIN;
  const model = process.env.WHISPER_MODEL || defaultWhisperModel();

  if (!binaryAvailable(bin) || !fs.existsSync(model)) {
    return {
      text: "",
      error:
        "no transcription backend: set GROQ_API_KEY or install whisper.cpp (WHISPER_BIN/WHISPER_MODEL)",
    };
  }

  let wavPath = audioPath;
  let tempWav: string | null = null;
  try {
    tempWav = toWav16k(audioPath);
    if (tempWav) wavPath = tempWav;
  } catch {
    tempWav = null; // conversion failed; fall back to the raw file (may already be valid WAV)
  }

  const outBase = path.join(os.tmpdir(), `zettel-transcript-${process.pid}-${Date.now()}`);
  try {
    // Argv array, NO shell. whisper-cli writes "<outBase>.txt".
    execFileSync(bin, ["-m", model, "-f", wavPath, "-otxt", "-of", outBase, "-nt"], {
      encoding: "utf8",
    });
    const txtPath = `${outBase}.txt`;
    const text = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, "utf8").trim() : "";
    if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);
    return { text, backend: "whisper.cpp" };
  } finally {
    if (tempWav && fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
  }
}

export async function transcribeAudio(args: TranscribeAudioInput): Promise<TranscribeResult> {
  const { path: audioPath } = transcribeAudioSchema.parse(args);

  if (!fs.existsSync(audioPath)) {
    return { text: "", error: `audio file not found: ${audioPath}` };
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      return await transcribeWithGroq(audioPath, groqKey);
    } catch (err) {
      return { text: "", error: err instanceof Error ? err.message : String(err) };
    }
  }

  try {
    return transcribeWithWhisperCpp(audioPath);
  } catch (err) {
    return { text: "", error: err instanceof Error ? err.message : String(err) };
  }
}

export const transcribeAudioTool: ToolDefinition<TranscribeAudioInput> = {
  name: "transcribeAudio",
  description:
    "Transcribe an audio file to text. Uses Groq Whisper when GROQ_API_KEY is set, otherwise local whisper.cpp.",
  inputSchema: transcribeAudioSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "transcribeAudio",
};
