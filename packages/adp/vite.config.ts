import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "tsdown src/index.ts --format cjs,esm --dts",
        output: ["dist/**"],
        input: [{ auto: true }, "!dist/**", "!node_modules/**"],
      },
    },
  },
});
