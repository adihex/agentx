import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/*/tests/**/*.test.{ts,tsx}",
      "apps/*/tests/**/*.test.{ts,tsx}",
      "apps/*/app/**/__tests__/*.test.{ts,tsx}",
      "packages/*/src/**/*.test.{ts,tsx}",
      "apps/*/src/**/*.test.{ts,tsx}",
    ],
    setupFiles: ["./apps/web/vitest-setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.spec.ts", "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        statements: 85,
        branches: 65,
        functions: 85,
        lines: 85,
      },
      include: [
        "packages/adp/src/**/*.ts",
        "packages/core/src/**/*.ts",
        "packages/orchestrator/src/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/node_modules/**",
        "**/dist/**",
      ],
    },
  },
});
