import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { transcribeAudio, transcribeAudioSchema, transcribeAudioTool } from "./transcribe.js";

const { transcribeImpl, createGroqImpl } = vi.hoisted(() => ({
  transcribeImpl: vi.fn(),
  createGroqImpl: vi.fn(),
}));

vi.mock("node:child_process", async (importOriginal) => {
  const mod = await importOriginal<typeof import("node:child_process")>();
  return { ...mod, execFileSync: vi.fn() };
});

vi.mock("ai", () => ({ experimental_transcribe: transcribeImpl }));
vi.mock("@ai-sdk/groq", () => ({
  createGroq: createGroqImpl.mockReturnValue({
    transcription: vi.fn().mockReturnValue("whisper-large-v3"),
  }),
}));

const execFileSyncMock = vi.mocked(execFileSync);

const ENV_KEYS = ["GROQ_API_KEY", "WHISPER_BIN", "WHISPER_MODEL", "FFMPEG_BIN"] as const;

describe("transcribeAudio", () => {
  let dir: string;
  let audioPath: string;
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    for (const k of ENV_KEYS) delete process.env[k];

    dir = fs.mkdtempSync(path.join(os.tmpdir(), "zettel-transcribe-test-"));
    audioPath = path.join(dir, "in.wav");
    fs.writeFileSync(audioPath, "RIFFfake");

    execFileSyncMock.mockReset();
    transcribeImpl.mockReset();
    createGroqImpl.mockClear();
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("rejects invalid input via the zod schema", async () => {
    await expect(transcribeAudio({ path: "" })).rejects.toThrow();
    expect(transcribeAudioSchema.safeParse({ path: "/x.wav" }).success).toBe(true);
  });

  it("returns a graceful error when the audio file does not exist", async () => {
    const res = await transcribeAudio({ path: path.join(dir, "missing.wav") });
    expect(res.text).toBe("");
    expect(res.error).toContain("audio file not found");
  });

  it("uses the Groq backend when GROQ_API_KEY is set", async () => {
    process.env.GROQ_API_KEY = "test-key";
    transcribeImpl.mockResolvedValue({ text: "hello from groq" });

    const res = await transcribeAudio({ path: audioPath });
    expect(res).toEqual({ text: "hello from groq", backend: "groq" });
    expect(createGroqImpl).toHaveBeenCalledWith({ apiKey: "test-key" });
    expect(transcribeImpl).toHaveBeenCalledOnce();
  });

  it("captures Groq backend errors into the result", async () => {
    process.env.GROQ_API_KEY = "test-key";
    transcribeImpl.mockRejectedValue(new Error("groq boom"));

    const res = await transcribeAudio({ path: audioPath });
    expect(res.text).toBe("");
    expect(res.error).toBe("groq boom");
  });

  it("reports no backend when whisper.cpp is unavailable", async () => {
    process.env.WHISPER_BIN = "definitely-missing-whisper-bin";
    execFileSyncMock.mockImplementation(() => {
      throw new Error("which failed");
    });

    const res = await transcribeAudio({ path: audioPath });
    expect(res.text).toBe("");
    expect(res.error).toContain("no transcription backend");
  });

  function makeWhisperEnv(opts: { ffmpeg?: boolean } = {}) {
    const whisperBin = path.join(dir, "whisper-cli");
    const modelPath = path.join(dir, "ggml-base.en.bin");
    fs.writeFileSync(whisperBin, "#!/bin/sh\n");
    fs.writeFileSync(modelPath, "fake model");
    process.env.WHISPER_BIN = whisperBin;
    process.env.WHISPER_MODEL = modelPath;

    const ffmpegBin = path.join(dir, "ffmpeg");
    if (opts.ffmpeg !== false) {
      fs.writeFileSync(ffmpegBin, "#!/bin/sh\n");
      process.env.FFMPEG_BIN = ffmpegBin;
    } else {
      process.env.FFMPEG_BIN = path.join(dir, "no-such-ffmpeg");
    }
    return { whisperBin, modelPath, ffmpegBin };
  }

  it("transcribes via whisper.cpp, converting with ffmpeg first", async () => {
    const { whisperBin } = makeWhisperEnv();
    execFileSyncMock.mockImplementation((bin: unknown, args: unknown) => {
      if (bin === whisperBin) {
        const argv = args as string[];
        const outBase = argv[argv.indexOf("-of") + 1];
        fs.writeFileSync(`${outBase}.txt`, "  hello whisper  \n");
      }
      return "" as never;
    });

    const res = await transcribeAudio({ path: audioPath, language: "en" });
    expect(res).toEqual({ text: "hello whisper", backend: "whisper.cpp" });

    const whisperCalls = execFileSyncMock.mock.calls.filter((c) => c[0] === whisperBin);
    expect(whisperCalls).toHaveLength(1);
    const wavArg = (whisperCalls[0][1] as string[])[(whisperCalls[0][1] as string[]).indexOf("-f") + 1];
    // ffmpeg ran → whisper received the converted temp WAV, not the raw input.
    expect(wavArg).not.toBe(audioPath);
    expect(wavArg).toContain("zettel-wav-");
  });

  it("falls back to the raw file when ffmpeg is unavailable", async () => {
    const { whisperBin } = makeWhisperEnv({ ffmpeg: false });
    execFileSyncMock.mockImplementation((bin: unknown, args: unknown) => {
      if (bin === whisperBin) {
        const argv = args as string[];
        fs.writeFileSync(`${argv[argv.indexOf("-of") + 1]}.txt`, "raw ok");
      }
      return "" as never;
    });

    const res = await transcribeAudio({ path: audioPath });
    expect(res).toEqual({ text: "raw ok", backend: "whisper.cpp" });
    const whisperArgv = execFileSyncMock.mock.calls[0][1] as string[];
    expect(whisperArgv[whisperArgv.indexOf("-f") + 1]).toBe(audioPath);
  });

  it("returns empty text when whisper produces no transcript file", async () => {
    const { whisperBin } = makeWhisperEnv({ ffmpeg: false });
    execFileSyncMock.mockReturnValue("" as never);
    const res = await transcribeAudio({ path: audioPath });
    expect(res).toEqual({ text: "", backend: "whisper.cpp" });
    expect(execFileSyncMock).toHaveBeenCalledWith(
      whisperBin,
      expect.arrayContaining(["-nt"]),
      expect.anything(),
    );
  });

  it("captures whisper.cpp execution errors into the result", async () => {
    makeWhisperEnv({ ffmpeg: false });
    execFileSyncMock.mockImplementation(() => {
      throw new Error("whisper crashed");
    });

    const res = await transcribeAudio({ path: audioPath });
    expect(res.text).toBe("");
    expect(res.error).toBe("whisper crashed");
  });
});

describe("transcribeAudioTool", () => {
  it("exposes a self-contained ToolDefinition", () => {
    expect(transcribeAudioTool.name).toBe("transcribeAudio");
    expect(transcribeAudioTool.inputSchema).toBe(transcribeAudioSchema);
    expect(transcribeAudioTool.exportName).toBe("transcribeAudio");
    expect(transcribeAudioTool.modulePath).toContain("transcribe");
  });
});
