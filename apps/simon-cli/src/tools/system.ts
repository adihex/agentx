import { execFileSync } from "node:child_process";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { ToolDefinition } from "@agentx/core";

// ── getSystemStats ─────────────────────────────────────────────────────────

export const getSystemStatsSchema = z.object({});

export type GetSystemStatsInput = z.infer<typeof getSystemStatsSchema>;

export async function getSystemStats(_args: GetSystemStatsInput) {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
  const loadAvg = os.loadavg();
  const uptime = os.uptime();
  const cpuCount = cpus.length;

  return {
    cpuCount,
    loadAvg,
    uptime,
    memory: {
      total: (totalMem / (1024 * 1024 * 1024)).toFixed(2) + " GB",
      free: (freeMem / (1024 * 1024 * 1024)).toFixed(2) + " GB",
      used: (usedMem / (1024 * 1024 * 1024)).toFixed(2) + " GB",
      percent: memUsagePercent + "%",
    },
  };
}

export const getSystemStatsTool: ToolDefinition<GetSystemStatsInput> = {
  name: "getSystemStats",
  description:
    "Return current CPU count, load averages, uptime, and memory usage (total/free/used/percent).",
  inputSchema: getSystemStatsSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "getSystemStats",
};

// ── getTopProcesses ────────────────────────────────────────────────────────

export const getTopProcessesSchema = z.object({});

export type GetTopProcessesInput = z.infer<typeof getTopProcessesSchema>;

export async function getTopProcesses(_args: GetTopProcessesInput) {
  try {
    const isMac = os.platform() === "darwin";

    // argv array — no shell interpolation
    const args = isMac
      ? ["-A", "-o", "%cpu,%mem,pid,comm", "-r"]
      : ["-eo", "%cpu,%mem,pid,comm", "--sort=-%cpu"];

    const output = execFileSync("ps", args, { encoding: "utf8" }).trim();
    const lines = output.split("\n");

    const processes: { cpu: string; mem: string; pid: string; name: string }[] = [];
    // skip header line, take up to 10 processes
    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length >= 4) {
        processes.push({
          cpu: parts[0] + "%",
          mem: parts[1] + "%",
          pid: parts[2],
          name: parts.slice(3).join(" "),
        });
      }
    }

    return { success: true, processes };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const getTopProcessesTool: ToolDefinition<GetTopProcessesInput> = {
  name: "getTopProcesses",
  description: "List the top 10 processes sorted by CPU usage (cpu%, mem%, pid, name).",
  inputSchema: getTopProcessesSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "getTopProcesses",
};

// ── killProcess ────────────────────────────────────────────────────────────

export const killProcessSchema = z.object({
  pid: z.number().int().positive().describe("The numeric PID of the process to kill"),
});

export type KillProcessInput = z.infer<typeof killProcessSchema>;

export async function killProcess(args: KillProcessInput) {
  const { pid } = killProcessSchema.parse(args);
  try {
    // argv array — pid is a number, never shell-interpolated
    execFileSync("kill", ["-9", String(pid)]);
    return { success: true, message: `Successfully killed process ${pid}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const killProcessTool: ToolDefinition<KillProcessInput> = {
  name: "killProcess",
  description:
    "Kill a process by PID (sends SIGKILL). Requires explicit user approval before calling.",
  inputSchema: killProcessSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "killProcess",
};

// ── cleanTempFiles ─────────────────────────────────────────────────────────

export const cleanTempFilesSchema = z.object({});

export type CleanTempFilesInput = z.infer<typeof cleanTempFilesSchema>;

export async function cleanTempFiles(_args: CleanTempFilesInput) {
  try {
    const tmpDir = os.tmpdir();
    const files = fs.readdirSync(tmpDir);
    let deletedCount = 0;
    let freedBytes = 0;

    for (const file of files) {
      if (file.includes("agentx") || file.endsWith(".tmp") || file.endsWith(".log")) {
        const filePath = path.join(tmpDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            freedBytes += stats.size;
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        } catch {
          // ignore locked files or permission errors
        }
      }
    }

    return {
      success: true,
      message: `Cleaned ${deletedCount} temp files, freeing ${(freedBytes / (1024 * 1024)).toFixed(2)} MB`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export const cleanTempFilesTool: ToolDefinition<CleanTempFilesInput> = {
  name: "cleanTempFiles",
  description:
    "Delete agentx, .tmp, and .log files from the OS temp directory. Requires explicit user approval before calling.",
  inputSchema: cleanTempFilesSchema,
  modulePath: new URL(import.meta.url).pathname,
  exportName: "cleanTempFiles",
};
