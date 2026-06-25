import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: [],
  },
  lint: {
    ignorePatterns: [
      "packages/orchestrator/docs/**",
      "dist/**",
      "coverage/**",
      "**/dist/**",
      "**/.output/**",
    ],
  },
});
