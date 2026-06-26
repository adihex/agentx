import { describe, it, expect } from "vitest";
import {
  sparkline,
  gauge,
  formatUptime,
  parsePercent,
  pctSeverity,
  loadSeverity,
  isDestructiveTool,
} from "./theme.js";

describe("sparkline", () => {
  it("always spans the requested width", () => {
    expect(sparkline([10, 20, 30], 8)).toHaveLength(8);
    expect(sparkline([], 5)).toHaveLength(5);
    expect(sparkline([50, 50, 50, 50, 50, 50], 4)).toHaveLength(4);
  });

  it("maps extremes to the lowest and highest ticks", () => {
    const line = sparkline([0, 100], 2);
    expect(line[0]).toBe("▁");
    expect(line[1]).toBe("█");
  });

  it("returns empty for non-positive width", () => {
    expect(sparkline([1, 2, 3], 0)).toBe("");
  });
});

describe("gauge", () => {
  it("fills proportionally and pads to full width", () => {
    const g = gauge(50, 10);
    expect(g.filled).toHaveLength(5);
    expect(g.empty).toHaveLength(5);
    expect((g.filled + g.empty).length).toBe(10);
  });

  it("clamps out-of-range percentages", () => {
    expect(gauge(150, 10).filled).toHaveLength(10);
    expect(gauge(-20, 10).filled).toHaveLength(0);
  });
});

describe("formatUptime", () => {
  it("formats minutes, hours, and days", () => {
    expect(formatUptime(45 * 60)).toBe("45m");
    expect(formatUptime(4 * 3600 + 12 * 60)).toBe("4h 12m");
    expect(formatUptime(3 * 86400 + 7 * 3600)).toBe("3d 7h");
  });

  it("is safe for negative input", () => {
    expect(formatUptime(-100)).toBe("0m");
  });
});

describe("parsePercent", () => {
  it("parses percent strings and is NaN-safe", () => {
    expect(parsePercent("52.3%")).toBeCloseTo(52.3);
    expect(parsePercent("not a number")).toBe(0);
  });
});

describe("severity thresholds", () => {
  it("classifies percentages", () => {
    expect(pctSeverity(10)).toBe("ok");
    expect(pctSeverity(75)).toBe("warn");
    expect(pctSeverity(95)).toBe("crit");
  });

  it("classifies load relative to cores", () => {
    expect(loadSeverity(2, 8)).toBe("ok"); // 0.25
    expect(loadSeverity(6, 8)).toBe("warn"); // 0.75
    expect(loadSeverity(9, 8)).toBe("crit"); // >1.0
  });
});

describe("isDestructiveTool", () => {
  it("flags mutating tools only", () => {
    expect(isDestructiveTool("killProcess")).toBe(true);
    expect(isDestructiveTool("cleanTempFiles")).toBe(true);
    expect(isDestructiveTool("getSystemStats")).toBe(false);
  });
});
