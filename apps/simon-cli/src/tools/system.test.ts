import { describe, it, expect } from "vitest";
import { getSystemStats, getTopProcesses } from "./system.js";

describe("System Tools", () => {
  it("getSystemStats should return system stats", async () => {
    const result = await getSystemStats({});
    expect(result.cpuCount).toBeGreaterThan(0);
    expect(result.memory).toBeDefined();
    expect(result.memory.total).toContain("GB");
  });

  it("getTopProcesses should return processes", async () => {
    const result = await getTopProcesses({});
    expect(result.success).toBe(true);
    expect((result as { success: true; processes: unknown[] }).processes.length).toBeGreaterThan(0);
  });
});
