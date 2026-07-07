import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "tsc",
        output: ["dist/**"],
        input: [{ auto: true }, "!dist/**", "!node_modules/**"],
        dependsOn: ["@agentx/core#build"],
      },
    },
  },
});
